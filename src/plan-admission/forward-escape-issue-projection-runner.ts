import {
  type ForwardEscapeIssuePort,
  type ForwardEscapeLedgerView,
  projectForwardEscapeIssue,
  type RequestForwardEscape,
  validateForwardEscape,
} from "../execution/forward-escape.js";
import { SqliteForwardEscapeJournal } from "../execution/sqlite-forward-escape-journal.js";
import { NodeGhForwardEscapeIssuePort } from "../github/node-gh-forward-escape-issue-port.js";
import { openPlanLedger } from "../plan-asset/ledger/schema.js";
import { defaultHarnessDbPath, type HarnessDb, openHarnessDb } from "../state-db/index.js";
import { migrate } from "../state-db/migration.js";
import { SqliteIssueProjectionEvidenceResolver } from "./issue-projection-evidence-resolver.js";
import { NodeForwardEscapeLedgerView } from "./node-forward-escape-ledger-view.js";
import {
  NodeRepositoryIdentityGitPort,
  TrustedRepositoryIdentityResolver,
} from "./trusted-repository-identity-resolver.js";

export interface ForwardEscapeIssueProjectionRunnerDeps {
  readonly openEvidenceDb: () => HarnessDb;
  readonly ledger?: ForwardEscapeLedgerView;
  readonly createLedger?: (evidenceDb: HarnessDb) => ForwardEscapeLedgerView & {
    close?: () => void;
  };
  readonly issuePort: ForwardEscapeIssuePort;
  readonly assertRepositoryIdentity: (identity: string) => string;
}

/** commandをE2 custodyへ固定し、E3 outbox、E4 IssueProjectedを同じHARNESS DBへ永続化する。 */
export class ForwardEscapeIssueProjectionRunner {
  constructor(private readonly deps: ForwardEscapeIssueProjectionRunnerDeps) {}

  run(command: RequestForwardEscape) {
    this.deps.assertRepositoryIdentity(
      `${command.issue_projection.owner}/${command.issue_projection.repository}`,
    );
    const db = this.deps.openEvidenceDb();
    try {
      migrate(db);
      const journal = new SqliteForwardEscapeJournal(db);
      const ledger = this.deps.createLedger?.(db) ?? this.deps.ledger;
      if (!ledger) throw new Error("forward-escape-ledger-unavailable");
      try {
        // journal eventの個別atomicityだけでは、2 workerが同時にGitHubへ到達できる。
        // 外部同期portを含むE2→E4全体を1 writerへ直列化し、再読側は既存E4を返す。
        return journal.runExclusive(() => this.project({ command, db, journal, ledger }));
      } finally {
        if ("close" in ledger && typeof ledger.close === "function") ledger.close();
      }
    } finally {
      db.close();
    }
  }

  private project(input: {
    command: RequestForwardEscape;
    db: HarnessDb;
    journal: SqliteForwardEscapeJournal;
    ledger: ForwardEscapeLedgerView;
  }) {
    const { command, db, journal, ledger } = input;
    const validation = validateForwardEscape(command, ledger, journal);
    if (!validation.validated) {
      throw new Error(
        `forward-escape-validation-failed:${validation.violations.map(({ code }) => code).join(",")}`,
      );
    }
    const event = projectForwardEscapeIssue({
      validated: validation.validated,
      port: this.deps.issuePort,
      journal,
      custody: journal,
    });
    if (event.type !== "IssueProjected") return { event };
    const row = db
      .prepare(
        `SELECT event_digest FROM forward_escape_projection_events
           WHERE command_id = ? ORDER BY sequence DESC LIMIT 1`,
      )
      .get(command.command_id);
    const projectionDigest = `sha256:${String(row?.event_digest ?? "")}`;
    return {
      event,
      evidence: new SqliteIssueProjectionEvidenceResolver(db).resolve({
        issueId: event.binding.issue_number,
        episodeId: command.command_id,
        projectionDigest,
      }),
    };
  }
}

export function createNodeForwardEscapeIssueProjectionRunner(repoRoot: string) {
  const repositoryIdentity = new TrustedRepositoryIdentityResolver(
    new NodeRepositoryIdentityGitPort(repoRoot),
  );
  return new ForwardEscapeIssueProjectionRunner({
    openEvidenceDb: () => openHarnessDb(defaultHarnessDbPath(repoRoot), { repoRoot }),
    createLedger: (evidenceDb) => {
      const planDb = openPlanLedger({ repoRoot });
      const view = new NodeForwardEscapeLedgerView(planDb, evidenceDb);
      return Object.assign(view, { close: () => planDb.close() });
    },
    issuePort: new NodeGhForwardEscapeIssuePort(),
    assertRepositoryIdentity: (identity) => repositoryIdentity.assertClaim(identity),
  });
}
