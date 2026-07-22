import { createHash } from "node:crypto";
import type {
  ForwardEscapeIssueAdoptionPort,
  IssueAdoptedEvent,
  IssueAdoptionQueuedEvent,
} from "../../execution/forward-escape.js";
import {
  ForwardEscapeJournalIntegrityError,
  SqliteForwardEscapeJournal,
} from "../../execution/sqlite-forward-escape-journal.js";
import type { HarnessDb } from "../../state-db/index.js";
import type {
  GenesisAdoptionProjectionOutboxPort,
  GenesisAdoptionProjectionState,
} from "../application/node-genesis-adoption-runner.js";

export interface SqliteGenesisAdoptionProjectionAdapterDeps {
  readonly repository: string;
  readonly port: ForwardEscapeIssueAdoptionPort;
}

/**
 * Genesis adoptionを既存HARNESS DBのE2/E3/E4 journalへ写像するproduction adapter。
 * 独自tableを持たず、queued rowをrecovery_required、IssueAdoptedをprojectedとして読む。
 */
export class SqliteGenesisAdoptionProjectionAdapter implements GenesisAdoptionProjectionOutboxPort {
  readonly #journal: SqliteForwardEscapeJournal;

  constructor(
    db: HarnessDb,
    private readonly deps: SqliteGenesisAdoptionProjectionAdapterDeps,
  ) {
    this.#journal = new SqliteForwardEscapeJournal(db);
  }

  dispatch(input: Parameters<GenesisAdoptionProjectionOutboxPort["dispatch"]>[0]): {
    readonly durable: boolean;
    readonly state: GenesisAdoptionProjectionState;
  } {
    const payloadDigest = projectionPayloadDigest({
      commandId: input.commandId,
      issueNumber: input.issueNumber,
      issuePreimageDigest: input.issuePreimageDigest,
      assetId: input.localReceipt.assetId,
      revision: input.localReceipt.revision,
    });
    try {
      this.#journal.issue({ command_id: input.commandId, payload_digest: payloadDigest });
    } catch (error) {
      if (
        error instanceof ForwardEscapeJournalIntegrityError &&
        error.message === "e2-command-payload-mismatch"
      )
        throw new Error("genesis-adoption-command-payload-mismatch");
      throw error;
    }
    this.assertCustody(input.commandId, payloadDigest);
    const prior = this.#journal.eventsFor(input.commandId);
    const terminal = prior.findLast((event) => event.type === "IssueAdopted");
    if (terminal) return { durable: true, state: "projected" };

    const queued = prior.find((event) => event.type === "IssueAdoptionQueued");
    assertQueuedRequest(queued, input, payloadDigest, this.deps.repository);

    // GitHub read/writeはSQLite transactionの外で行う。queued/adoptedだけを別々の短いtxで確定する。
    const issue = this.deps.port.observeIssue({
      repository: this.deps.repository,
      issue_number: input.issueNumber,
    });
    assertIssuePreimage({
      issue,
      repository: this.deps.repository,
      issueNumber: input.issueNumber,
      expectedDigest: input.issuePreimageDigest,
    });
    if (queued) assertQueuedObservation(queued, issue);
    else this.appendQueued(input, payloadDigest, issue);

    const body = metadataBody(input, payloadDigest, this.deps.repository);
    const bodyDigest = sha(body);
    let result: ReturnType<ForwardEscapeIssueAdoptionPort["createOrGetMetadataComment"]>;
    try {
      result = this.deps.port.createOrGetMetadataComment({
        repository: this.deps.repository,
        issue_number: input.issueNumber,
        idempotency_key: input.commandId,
        body,
        body_digest: bodyDigest,
      });
    } catch {
      return { durable: true, state: "recovery_required" };
    }
    if (!result.ok) return { durable: true, state: "recovery_required" };
    assertComment(result.comment, issue.url, bodyDigest);
    const adopted: IssueAdoptedEvent = {
      type: "IssueAdopted",
      command_id: input.commandId,
      payload_digest: payloadDigest,
      binding: {
        repository: this.deps.repository,
        issue_number: input.issueNumber,
        node_id: issue.node_id,
        url: issue.url,
        body_digest: issue.body_digest,
        observed_revision: issue.observed_revision,
        contract_artifact_kind: "issue_comment",
        contract_artifact: result.comment,
      },
    };
    try {
      this.#journal.append(adopted);
    } catch (error) {
      if (error instanceof ForwardEscapeJournalIntegrityError)
        throw new Error("genesis-adoption-projection-request-conflict");
      throw error;
    }
    return { durable: true, state: "projected" };
  }

  private assertCustody(commandId: string, payloadDigest: string): void {
    try {
      this.#journal.assertCustody(commandId, payloadDigest);
    } catch (error) {
      if (error instanceof ForwardEscapeJournalIntegrityError) {
        if (error.message === "e2-custody-missing")
          throw new Error("genesis-adoption-custody-missing");
        if (error.message === "e2-command-payload-mismatch")
          throw new Error("genesis-adoption-command-payload-mismatch");
      }
      throw error;
    }
  }

  private appendQueued(
    input: Parameters<GenesisAdoptionProjectionOutboxPort["dispatch"]>[0],
    payloadDigest: string,
    issue: ReturnType<ForwardEscapeIssueAdoptionPort["observeIssue"]>,
  ): void {
    const queued: IssueAdoptionQueuedEvent = {
      type: "IssueAdoptionQueued",
      command_id: input.commandId,
      payload_digest: payloadDigest,
      repository: this.deps.repository,
      issue_number: input.issueNumber,
      expected_node_id: issue.node_id,
      expected_observed_revision: issue.observed_revision,
      expected_body_digest: input.issuePreimageDigest,
    };
    try {
      this.#journal.append(queued);
    } catch (error) {
      if (error instanceof ForwardEscapeJournalIntegrityError)
        throw new Error("genesis-adoption-projection-request-conflict");
      throw error;
    }
  }
}

function assertQueuedRequest(
  queued: DurableQueued | undefined,
  input: Parameters<GenesisAdoptionProjectionOutboxPort["dispatch"]>[0],
  payloadDigest: string,
  repository: string,
): void {
  if (
    queued &&
    (queued.payload_digest !== payloadDigest ||
      queued.repository !== repository ||
      queued.issue_number !== input.issueNumber ||
      queued.expected_body_digest !== input.issuePreimageDigest)
  )
    throw new Error("genesis-adoption-projection-request-conflict");
}

type DurableQueued = Extract<
  ReturnType<SqliteForwardEscapeJournal["eventsFor"]>[number],
  { type: "IssueAdoptionQueued" }
>;

function assertQueuedObservation(
  queued: DurableQueued,
  issue: ReturnType<ForwardEscapeIssueAdoptionPort["observeIssue"]>,
): void {
  if (
    queued.expected_node_id !== issue.node_id ||
    queued.expected_observed_revision !== issue.observed_revision
  )
    throw new Error("genesis-adoption-projection-request-conflict");
}

interface ProjectionBinding {
  readonly commandId: string;
  readonly issueNumber: number;
  readonly issuePreimageDigest: string;
  readonly assetId: string;
  readonly revision: 1;
}

function projectionPayloadDigest(value: ProjectionBinding): string {
  return sha(
    JSON.stringify({
      asset_id: value.assetId,
      command_id: value.commandId,
      issue_number: value.issueNumber,
      issue_preimage_digest: value.issuePreimageDigest,
      revision: value.revision,
    }),
  );
}

function assertIssuePreimage(input: {
  readonly issue: ReturnType<ForwardEscapeIssueAdoptionPort["observeIssue"]>;
  readonly repository: string;
  readonly issueNumber: number;
  readonly expectedDigest: string;
}): void {
  const { issue, repository, issueNumber, expectedDigest } = input;
  if (
    issue.repository !== repository ||
    issue.issue_number !== issueNumber ||
    issue.url !== `https://github.com/${repository}/issues/${issueNumber}` ||
    issue.body_digest !== expectedDigest ||
    sha(issue.body) !== expectedDigest ||
    !issue.node_id ||
    !issue.observed_revision
  )
    throw new Error("genesis-adoption-issue-preimage-mismatch");
}

function assertComment(
  comment: { node_id: string; url: string; body_digest: string; observed_revision: string },
  issueUrl: string,
  expectedDigest: string,
): void {
  if (
    !comment.node_id ||
    !comment.observed_revision ||
    comment.body_digest !== expectedDigest ||
    !comment.url.startsWith(`${issueUrl}#issuecomment-`)
  )
    throw new Error("genesis-adoption-comment-invalid");
}

function metadataBody(
  input: Parameters<GenesisAdoptionProjectionOutboxPort["dispatch"]>[0],
  payloadDigest: string,
  repository: string,
): string {
  return [
    "<!-- ut-tdd:genesis-adoption/v1 -->",
    "## UT-TDD Genesis adoption contract",
    "",
    `- command_id: \`${input.commandId}\``,
    `- payload_digest: \`${payloadDigest}\``,
    `- repository: \`${repository}\``,
    `- issue_number: \`${input.issueNumber}\``,
    `- plan_asset_id: \`${input.localReceipt.assetId}\``,
    `- plan_revision: \`${input.localReceipt.revision}\``,
    `- issue_preimage_digest: \`${input.issuePreimageDigest}\``,
    "",
    // NodeGhForwardEscapeIssuePortのcreate-or-get検索markerと完全一致させる。
    `<!-- ut-tdd:forward-escape-adoption/v1 ${input.commandId} -->`,
  ].join("\n");
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
