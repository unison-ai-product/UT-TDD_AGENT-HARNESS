import {
  decideExecutionTransition,
  executionCommandPayloadDigest,
  ExecutionEpisode,
  EXECUTION_EPISODE_TRANSITIONS,
  type EscapeObservedEvent,
  type EscapeObservedPayload,
  type DriveSelectionIntent,
  type ExecutionEpisodeEvent,
  type ExecutionTransitionCommand,
  type ExecutionTransitionEvent,
  type IssueProjectionIntent,
  reconstructExecutionEpisode,
  reduceExecutionEpisode,
  type RequestForwardEscape,
} from "../../domain/execution-episode.js";
import type {
  EpisodeRepositoryPort,
  EpisodeRepositoryResult,
  EpisodeWriteCustody,
} from "../../ports/episode-repository.js";
import { ledgerRowDigest } from "../../../plan-asset/ledger/schema.js";
import {
  ImmediateLedgerTransaction,
  type LedgerTransactionPort,
} from "../../../plan-asset/ledger/transaction.js";
import type { HarnessDb } from "../../../state-db/index.js";
import { executionLedgerRowsValid } from "./row-verifier.js";
import { projectExecutionEpisode } from "../../application/episode-projector.js";
import {
  APPEND_COMMAND_RECEIPT_COLUMNS,
  DRIVE_MODEL_SELECTION_COLUMNS,
  EXECUTION_EPISODE_EVENT_COLUMNS,
  EXECUTION_EPISODE_ROOT_COLUMNS,
  EXECUTION_EPISODE_PROJECTION_COLUMNS,
  GITHUB_PROJECTION_OUTBOX_COLUMNS,
  decodeExecutionEpisodeEventRow,
  insertSql,
  mapAppendCommandReceiptToRow,
  mapDriveSelectionToRow,
  mapExecutionEpisodeProjectionToRow,
  mapExecutionEpisodeEventToRow,
  mapExecutionEpisodeRootToRow,
  mapIssueProjectionToRow,
  rowValues,
  type AppendCommandReceiptInput,
} from "./episode-row-mapper.js";

export interface EpisodeRepositoryFaultPort {
  after(
    boundary:
      | "episode-root"
      | "episode-event"
      | "drive-selection"
      | "outbox-intent"
      | "episode-projection"
      | "receipt",
  ): void;
}

export class SqliteExecutionEpisodeRepository implements EpisodeRepositoryPort {
  private readonly transaction: LedgerTransactionPort;

  constructor(
    private readonly db: HarnessDb,
    transaction?: LedgerTransactionPort,
    private readonly fault?: EpisodeRepositoryFaultPort,
  ) {
    this.transaction = transaction ?? new ImmediateLedgerTransaction(db);
  }

  request(command: RequestForwardEscape, custody: EpisodeWriteCustody): EpisodeRepositoryResult {
    if (!custody.runtime.trim() || !custody.model.trim())
      return failed("episode-custody-invalid", "custody");
    const decision = ExecutionEpisode.request(command);
    if (!decision.ok) return decision;
    if (decision.status !== "accepted")
      return failed("episode-transition-invalid", "command.type");
    const event = decision.events[0];

    return this.transaction.run(() => {
      const receipt = this.db
        .prepare("SELECT * FROM append_command_receipts WHERE command_id = ?")
        .get(command.commandId);
      if (receipt) {
        if (receipt.command_payload_digest !== event.commandPayloadDigest)
          return { commit: false, value: failed("episode-command-payload-conflict", "commandId") };
        if (!executionLedgerRowsValid(this.db))
          return {
            commit: false,
            value: failed("episode-ledger-integrity-invalid", "ledger"),
          };
        return { commit: true, value: this.replay(String(receipt.result_ref)) };
      }
      if (
        this.db
          .prepare("SELECT episode_id FROM execution_episodes WHERE episode_id = ?")
          .get(command.episodeId)
      )
        return { commit: false, value: failed("episode-state-conflict", "episodeId") };

      this.insertRoot(event.payload, event.occurredAt);
      this.fault?.after("episode-root");
      this.insertEvent(event, custody);
      this.fault?.after("episode-event");
      this.insertProjection([event]);
      this.fault?.after("episode-projection");
      this.insertReceipt(event);
      this.fault?.after("receipt");
      return {
        commit: true,
        value: {
          ok: true,
          status: "created",
          eventIds: [event.eventId],
          outboxIds: [],
          snapshot: decision.episode.snapshot,
        } satisfies EpisodeRepositoryResult,
      };
    });
  }

  transition(
    command: ExecutionTransitionCommand,
    custody: EpisodeWriteCustody,
  ): EpisodeRepositoryResult {
    if (!custody.runtime.trim() || !custody.model.trim())
      return failed("episode-custody-invalid", "custody");
    return this.transaction.run(() => {
      const receipt = this.db
        .prepare("SELECT * FROM append_command_receipts WHERE command_id = ?")
        .get(command.commandId);
      if (receipt) {
        if (receipt.command_payload_digest !== executionCommandPayloadDigest(command))
          return { commit: false, value: failed("episode-command-payload-conflict", "commandId") };
        if (!executionLedgerRowsValid(this.db))
          return {
            commit: false,
            value: failed("episode-ledger-integrity-invalid", "ledger"),
          };
        return {
          commit: true,
          value: this.replayTransition(String(receipt.result_ref), command.episodeId),
        };
      }
      const history = this.loadHistory(command.episodeId);
      if (history.length === 0)
        return { commit: false, value: failed("episode-not-found", "episodeId") };
      const decision = decideExecutionTransition(history, command);
      if (!decision.ok) return { commit: false, value: decision };
      const event = decision.events[0];
      this.insertTransitionEvent(event, custody);
      this.fault?.after("episode-event");
      for (const selection of decision.selections) {
        this.insertDriveSelection(selection);
        this.fault?.after("drive-selection");
      }
      for (const outbox of decision.outbox) {
        this.insertOutbox(outbox);
        this.fault?.after("outbox-intent");
      }
      this.updateProjection([...history, event]);
      this.fault?.after("episode-projection");
      this.insertTransitionReceipt(event, command.type);
      this.fault?.after("receipt");
      const transition = EXECUTION_EPISODE_TRANSITIONS[event.sequence];
      return {
        commit: true,
        value: {
          ok: true,
          status: "created",
          eventIds: [event.eventId],
          outboxIds: decision.outbox.map((row) => row.outboxId),
          snapshot: {
            episodeId: event.episodeId,
            state: transition.state,
            eventSequence: event.sequence,
            lastEventDigest: event.eventDigest,
            nextLegalCommands: transition.nextLegalCommands,
          },
        } satisfies EpisodeRepositoryResult,
      };
    });
  }

  private insertRoot(payload: EscapeObservedPayload, occurredAt: string): void {
    const row = mapExecutionEpisodeRootToRow(payload, occurredAt);
    this.db
      .prepare(insertSql("execution_episodes", EXECUTION_EPISODE_ROOT_COLUMNS))
      .run(...rowValues(EXECUTION_EPISODE_ROOT_COLUMNS, row));
  }

  private insertEvent(event: EscapeObservedEvent, custody: EpisodeWriteCustody): void {
    const row = mapExecutionEpisodeEventToRow(event, custody);
    this.db
      .prepare(insertSql("execution_episode_events", EXECUTION_EPISODE_EVENT_COLUMNS))
      .run(...rowValues(EXECUTION_EPISODE_EVENT_COLUMNS, row));
  }

  private insertProjection(events: readonly ExecutionEpisodeEvent[]): void {
    const result = projectExecutionEpisode(events);
    if (!result.ok) throw new Error("projection:invalid-event-stream");
    const projection = result.projection;
    const row = mapExecutionEpisodeProjectionToRow(projection);
    this.db
      .prepare(insertSql("execution_episode_projection", EXECUTION_EPISODE_PROJECTION_COLUMNS))
      .run(...rowValues(EXECUTION_EPISODE_PROJECTION_COLUMNS, row));
  }

  private insertReceipt(event: EscapeObservedEvent): void {
    const receipt = {
      command_id: event.commandId,
      command_type: "execution_episode.request_escape",
      subject_kind: "execution_episode",
      subject_key: event.episodeId,
      plan_asset_id: null,
      plan_revision: null,
      command_payload_digest: event.commandPayloadDigest,
      result_kind: "episode_event",
      result_ref: event.eventId,
      recorded_at: event.occurredAt,
    } satisfies AppendCommandReceiptInput;
    const row = mapAppendCommandReceiptToRow(
      receipt,
      ledgerRowDigest(receipt, "receipt_digest"),
    );
    this.db
      .prepare(insertSql("append_command_receipts", APPEND_COMMAND_RECEIPT_COLUMNS))
      .run(...rowValues(APPEND_COMMAND_RECEIPT_COLUMNS, row));
  }

  private loadHistory(episodeId: string): ExecutionEpisodeEvent[] {
    return this.db
      .prepare(
        "SELECT * FROM execution_episode_events WHERE episode_id = ? ORDER BY event_sequence",
      )
      .all(episodeId)
      .map((row) => {
        const event = decodeExecutionEpisodeEventRow(row);
        if (!event) throw new Error("episode-event-row-invalid");
        return event;
      });
  }

  private insertTransitionEvent(
    event: ExecutionTransitionEvent,
    custody: EpisodeWriteCustody,
  ): void {
    const row = mapExecutionEpisodeEventToRow(event, custody);
    this.db
      .prepare(insertSql("execution_episode_events", EXECUTION_EPISODE_EVENT_COLUMNS))
      .run(...rowValues(EXECUTION_EPISODE_EVENT_COLUMNS, row));
  }

  private insertDriveSelection(selection: DriveSelectionIntent): void {
    const row = mapDriveSelectionToRow(selection);
    this.db
      .prepare(insertSql("drive_model_selections", DRIVE_MODEL_SELECTION_COLUMNS))
      .run(...rowValues(DRIVE_MODEL_SELECTION_COLUMNS, row));
  }

  private insertOutbox(outbox: IssueProjectionIntent): void {
    const row = mapIssueProjectionToRow(outbox);
    this.db
      .prepare(insertSql("github_projection_outbox", GITHUB_PROJECTION_OUTBOX_COLUMNS))
      .run(...rowValues(GITHUB_PROJECTION_OUTBOX_COLUMNS, row));
  }

  private updateProjection(events: readonly ExecutionEpisodeEvent[]): void {
    const result = projectExecutionEpisode(events);
    if (!result.ok) throw new Error("projection:invalid-event-stream");
    const projection = result.projection;
    const row = mapExecutionEpisodeProjectionToRow(projection);
    const updateColumns = EXECUTION_EPISODE_PROJECTION_COLUMNS.slice(1);
    this.db
      .prepare(
        `UPDATE execution_episode_projection SET
          ${updateColumns.map((column) => `${column} = ?`).join(", ")}
        WHERE episode_id = ?`,
      )
      .run(...rowValues(updateColumns, row), projection.episodeId);
  }

  private insertTransitionReceipt(
    event: ExecutionTransitionEvent,
    commandType: ExecutionTransitionCommand["type"],
  ): void {
    const receipt = {
      command_id: event.commandId,
      command_type: `execution_episode.${commandType}`,
      subject_kind: "execution_episode",
      subject_key: event.episodeId,
      plan_asset_id: null,
      plan_revision: null,
      command_payload_digest: event.commandPayloadDigest,
      result_kind: "episode_event",
      result_ref: event.eventId,
      recorded_at: event.occurredAt,
    } satisfies AppendCommandReceiptInput;
    const row = mapAppendCommandReceiptToRow(
      receipt,
      ledgerRowDigest(receipt, "receipt_digest"),
    );
    this.db
      .prepare(insertSql("append_command_receipts", APPEND_COMMAND_RECEIPT_COLUMNS))
      .run(...rowValues(APPEND_COMMAND_RECEIPT_COLUMNS, row));
  }

  private replay(eventId: string): EpisodeRepositoryResult {
    const row = this.db
      .prepare("SELECT * FROM execution_episode_events WHERE event_id = ?")
      .get(eventId);
    if (!row) return failed("episode-ledger-integrity-invalid", "receipt.result_ref");
    const decoded = decodeExecutionEpisodeEventRow(row);
    if (!decoded || decoded.sequence !== 0 || decoded.kind !== "escape_observed")
      return failed("episode-ledger-integrity-invalid", "receipt.result_ref");
    const event = decoded as EscapeObservedEvent;
    const reduction = reconstructExecutionEpisode([event]);
    return reduction.ok
      ? {
          ok: true,
          status: "replayed",
          eventIds: [event.eventId],
          outboxIds: [],
          snapshot: reduction.value,
        }
      : reduction;
  }

  private replayTransition(eventId: string, episodeId: string): EpisodeRepositoryResult {
    const history = this.loadHistory(episodeId);
    const row = this.db
      .prepare("SELECT event_sequence FROM execution_episode_events WHERE event_id = ?")
      .get(eventId);
    if (!row) return failed("episode-ledger-integrity-invalid", "receipt.result_ref");
    const sequence = Number(row.event_sequence);
    const event = history[sequence];
    const reduction = reduceExecutionEpisode(history);
    if (!event || !reduction.ok)
      return failed("episode-ledger-integrity-invalid", "receipt.result_ref");
    const transition = EXECUTION_EPISODE_TRANSITIONS[sequence];
    const outboxIds = this.db
      .prepare(
        "SELECT outbox_id FROM github_projection_outbox WHERE episode_id = ? AND source_event_sequence = ? ORDER BY outbox_id",
      )
      .all(episodeId, sequence)
      .map((intent) => String(intent.outbox_id));
    return {
      ok: true,
      status: "replayed",
      eventIds: [eventId],
      outboxIds,
      snapshot: {
        episodeId,
        state: reduction.snapshot.state,
        eventSequence: reduction.snapshot.eventSequence,
        lastEventDigest: reduction.snapshot.lastEventDigest,
        nextLegalCommands: transition.nextLegalCommands,
      },
    };
  }

}


function failed(ruleId: string, path: string): EpisodeRepositoryResult {
  return { ok: false, violations: [{ ruleId, path }] };
}
