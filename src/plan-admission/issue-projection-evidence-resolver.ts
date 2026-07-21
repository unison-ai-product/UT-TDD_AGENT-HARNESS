import { SqliteForwardEscapeJournal } from "../execution/sqlite-forward-escape-journal.js";
import type { HarnessDb } from "../state-db/index.js";

export interface IssueProjectionEvidenceClaim {
  readonly issueId: number;
  readonly episodeId: string;
  readonly projectionDigest: string;
}

export interface TrustedIssueProjectionEvidence {
  readonly issueId: number;
  readonly episodeId: string;
  readonly projectionDigest: `sha256:${string}`;
  readonly repository: string;
  readonly bodyDigest: `sha256:${string}`;
}

const PREFIXED_SHA256 = /^sha256:([a-f0-9]{64})$/;

/**
 * caller申告値ではなくharness.dbのE4 durable receiptを正本としてIssue bindingを解決する。
 * episode_idは先行E2/E3/E4 sliceのcommand_idへ一対一に対応する。
 */
export class SqliteIssueProjectionEvidenceResolver {
  readonly #journal: SqliteForwardEscapeJournal;

  constructor(private readonly db: HarnessDb) {
    this.#journal = new SqliteForwardEscapeJournal(db);
  }

  resolve(claim: IssueProjectionEvidenceClaim): TrustedIssueProjectionEvidence {
    try {
      return this.resolveTrusted(claim);
    } catch {
      throw new Error("issue-projection-evidence-invalid");
    }
  }

  private resolveTrusted(claim: IssueProjectionEvidenceClaim): TrustedIssueProjectionEvidence {
    const claimedDigest = PREFIXED_SHA256.exec(claim.projectionDigest)?.[1];
    if (
      !Number.isSafeInteger(claim.issueId) ||
      claim.issueId <= 0 ||
      !claim.episodeId ||
      !claimedDigest
    ) {
      throw new Error("invalid-claim");
    }

    const events = this.#journal.eventsFor(claim.episodeId);
    const eventIndex = events.findIndex((event) => event.type === "IssueProjected");
    const projected = events[eventIndex];
    if (eventIndex < 0 || projected?.type !== "IssueProjected") throw new Error("e4-not-found");
    if (
      projected.command_id !== claim.episodeId ||
      projected.binding.issue_number !== claim.issueId
    ) {
      throw new Error("binding-mismatch");
    }

    const row = this.db
      .prepare(
        `SELECT event_json, event_digest FROM forward_escape_projection_events
         WHERE command_id = ? AND sequence = ?`,
      )
      .get(claim.episodeId, eventIndex + 1);
    if (
      !row ||
      String(row.event_json) !== JSON.stringify(projected) ||
      String(row.event_digest) !== claimedDigest
    ) {
      throw new Error("receipt-mismatch");
    }

    return {
      issueId: projected.binding.issue_number,
      episodeId: claim.episodeId,
      projectionDigest: `sha256:${claimedDigest}`,
      repository: projected.binding.repository,
      bodyDigest: `sha256:${projected.binding.body_digest}`,
    };
  }
}
