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
import type {
  GenesisCustodyPort,
  GenesisCustodyRecord,
} from "../ledger/genesis-adoption-transaction.js";

export interface SqliteGenesisAdoptionProjectionAdapterDeps {
  readonly repository: string;
  readonly port: ForwardEscapeIssueAdoptionPort;
}

/**
 * Genesis adoptionを既存HARNESS DBのE2/E3/E4 journalへ写像するproduction adapter。
 * 独自tableを持たず、queued rowをrecovery_required、IssueAdoptedをprojectedとして読む。
 */
export class SqliteGenesisAdoptionProjectionAdapter
  implements GenesisCustodyPort, GenesisAdoptionProjectionOutboxPort
{
  readonly #journal: SqliteForwardEscapeJournal;

  constructor(
    private readonly db: HarnessDb,
    private readonly deps: SqliteGenesisAdoptionProjectionAdapterDeps,
  ) {
    this.#journal = new SqliteForwardEscapeJournal(db);
  }

  prepare(record: GenesisCustodyRecord): void {
    try {
      this.#journal.issue({
        command_id: record.commandId,
        payload_digest: projectionPayloadDigest(record),
      });
    } catch (error) {
      if (
        error instanceof ForwardEscapeJournalIntegrityError &&
        error.message === "e2-command-payload-mismatch"
      )
        throw new Error("genesis-adoption-command-payload-mismatch");
      throw error;
    }
  }

  commit(commandId: string): void {
    const certificate = this.db
      .prepare("SELECT 1 FROM forward_escape_validation_certificates WHERE command_id = ?")
      .get(commandId);
    if (!certificate) throw new Error("genesis-adoption-custody-missing");
  }

  rollback(_commandId: string): void {
    // GenesisAdoptionTransactionと同じHarnessDb transaction内ならprepare rowもrollbackされる。
    // append-only custodyをtransaction外から削除して証跡を破壊してはならない。
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
    return this.#journal.runExclusive(() => {
      const certificate = this.db
        .prepare(
          "SELECT payload_digest FROM forward_escape_validation_certificates WHERE command_id = ?",
        )
        .get(input.commandId);
      if (!certificate) throw new Error("genesis-adoption-custody-missing");
      if (String(certificate.payload_digest) !== payloadDigest)
        throw new Error("genesis-adoption-command-payload-mismatch");

      const prior = this.#journal.eventsFor(input.commandId);
      const terminal = prior.findLast((event) => event.type === "IssueAdopted");
      if (terminal) return { durable: true, state: "projected" };

      const queued = prior.find((event) => event.type === "IssueAdoptionQueued");
      if (
        queued &&
        (queued.type !== "IssueAdoptionQueued" ||
          queued.payload_digest !== payloadDigest ||
          queued.repository !== this.deps.repository ||
          queued.issue_number !== input.issueNumber ||
          queued.expected_body_digest !== input.issuePreimageDigest)
      )
        throw new Error("genesis-adoption-projection-request-conflict");

      const issue = this.deps.port.observeIssue({
        repository: this.deps.repository,
        issue_number: input.issueNumber,
      });
      assertIssuePreimage(
        issue,
        this.deps.repository,
        input.issueNumber,
        input.issuePreimageDigest,
      );
      if (!queued) this.appendQueued(input, payloadDigest, issue);

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
      this.#journal.append(adopted);
      return { durable: true, state: "projected" };
    });
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
    this.#journal.append(queued);
  }
}

type ProjectionBinding = Pick<
  GenesisCustodyRecord,
  "commandId" | "issueNumber" | "issuePreimageDigest" | "assetId" | "revision"
>;

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

function assertIssuePreimage(
  issue: ReturnType<ForwardEscapeIssueAdoptionPort["observeIssue"]>,
  repository: string,
  issueNumber: number,
  expectedDigest: string,
): void {
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
    `<!-- ut-tdd:genesis-adoption/v1 ${input.commandId} -->`,
  ].join("\n");
}

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
