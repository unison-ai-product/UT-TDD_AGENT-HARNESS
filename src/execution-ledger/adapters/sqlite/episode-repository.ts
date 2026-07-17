import {
  canonicalizeExecutionPayload,
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
    const reentry = payload.reentry;
    if (!reentry) throw new Error("validated reentry is missing");
    this.db
      .prepare(
        `INSERT INTO execution_episodes (
          episode_id, recurrence_id, origin_asset_id, origin_revision, origin_layer, origin_state,
          escape_type, escape_reason, drive_model, reentry_asset_id, reentry_revision,
          reentry_layer, reentry_state, reentry_policy_revision, issue_repository, issue_title,
          issue_body_digest, source_commit, observed_head, policy_revision, actor, created_at
        ) VALUES (${placeholders(22)})`,
      )
      .run(
        payload.episodeId,
        payload.recurrenceId,
        payload.origin.assetId,
        payload.origin.revision,
        payload.origin.layer,
        payload.origin.state,
        payload.escapeType,
        payload.escapeReason,
        payload.requestedDriveModel,
        reentry.assetId,
        reentry.revision,
        reentry.layer,
        reentry.state,
        reentry.policyRevision,
        payload.issue.repository,
        payload.issue.title,
        payload.issue.bodyDigest,
        payload.sourceCommit,
        payload.observedHead,
        payload.policyRevision,
        payload.actor,
        occurredAt,
      );
  }

  private insertEvent(event: EscapeObservedEvent, custody: EpisodeWriteCustody): void {
    this.db
      .prepare(
        `INSERT INTO execution_episode_events (
          event_id, episode_id, event_sequence, command_id, command_payload_digest, event_state,
          event_kind, payload_version, canonical_payload_json, payload_digest,
          previous_event_digest, source_commit, observed_head, policy_revision, actor, runtime,
          model, occurred_at, event_digest
        ) VALUES (${placeholders(19)})`,
      )
      .run(
        event.eventId,
        event.episodeId,
        event.sequence,
        event.commandId,
        event.commandPayloadDigest,
        event.state,
        event.kind,
        1,
        canonicalizeExecutionPayload(event.payload),
        event.payloadDigest,
        event.previousEventDigest,
        event.payload.sourceCommit,
        event.payload.observedHead,
        event.payload.policyRevision,
        event.actor,
        custody.runtime,
        custody.model,
        event.occurredAt,
        event.eventDigest,
      );
  }

  private insertProjection(events: readonly ExecutionEpisodeEvent[]): void {
    const result = projectExecutionEpisode(events);
    if (!result.ok) throw new Error("projection:invalid-event-stream");
    const projection = result.projection;
    this.db
      .prepare(
        `INSERT INTO execution_episode_projection (
          episode_id, current_event_sequence, current_state, current_event_digest, block_reason,
          next_legal_actions_json, latest_head, merge_readiness, drive_model, reentry_layer, rebuilt_at
        ) VALUES (${placeholders(11)})`,
      )
      .run(
        projection.episodeId,
        projection.eventSequence,
        projection.state,
        projection.lastEventDigest,
        projection.blockReason,
        JSON.stringify(projection.nextLegalActions),
        projection.latestHead,
        projection.mergeReadiness,
        projection.driveModel,
        projection.reentryLayer,
        projection.rebuiltAt,
      );
  }

  private insertReceipt(event: EscapeObservedEvent): void {
    const row = {
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
    };
    this.db
      .prepare("INSERT INTO append_command_receipts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(...Object.values(row), ledgerRowDigest(row, "receipt_digest"));
  }

  private loadHistory(episodeId: string): ExecutionEpisodeEvent[] {
    return this.db
      .prepare(
        "SELECT * FROM execution_episode_events WHERE episode_id = ? ORDER BY event_sequence",
      )
      .all(episodeId)
      .map((row) => ({
        eventId: String(row.event_id),
        episodeId: String(row.episode_id),
        sequence: Number(row.event_sequence),
        state: String(row.event_state),
        kind: String(row.event_kind),
        commandId: String(row.command_id),
        commandPayloadDigest: String(row.command_payload_digest),
        payloadDigest: String(row.payload_digest),
        previousEventDigest:
          row.previous_event_digest === null ? null : String(row.previous_event_digest),
        eventDigest: String(row.event_digest),
        occurredAt: String(row.occurred_at),
        actor: String(row.actor),
        payload: JSON.parse(String(row.canonical_payload_json)) as unknown,
      }));
  }

  private insertTransitionEvent(
    event: ExecutionTransitionEvent,
    custody: EpisodeWriteCustody,
  ): void {
    const payload = event.payload;
    this.db
      .prepare(
        `INSERT INTO execution_episode_events (
          event_id, episode_id, event_sequence, command_id, command_payload_digest, event_state,
          event_kind, payload_version, canonical_payload_json, payload_digest,
          previous_event_digest, source_commit, observed_head, policy_revision, actor, runtime,
          model, occurred_at, event_digest
        ) VALUES (${placeholders(19)})`,
      )
      .run(
        event.eventId,
        event.episodeId,
        event.sequence,
        event.commandId,
        event.commandPayloadDigest,
        event.state,
        event.kind,
        1,
        canonicalizeExecutionPayload(payload),
        event.payloadDigest,
        event.previousEventDigest,
        String(payload.sourceCommit),
        String(payload.observedHead),
        String(payload.policyRevision),
        event.actor,
        custody.runtime,
        custody.model,
        event.occurredAt,
        event.eventDigest,
      );
  }

  private insertDriveSelection(selection: DriveSelectionIntent): void {
    this.db
      .prepare(`INSERT INTO drive_model_selections VALUES (${placeholders(12)})`)
      .run(
        selection.episodeId,
        selection.selectionRevision,
        selection.selectedEventSequence,
        selection.model,
        selection.compatibilityResult,
        selection.rationaleDigest,
        selection.overrideUsed ? 1 : 0,
        selection.overrideActor,
        selection.overrideReason,
        selection.overrideEvidenceDigest,
        selection.selectedAt,
        selection.selectionDigest,
      );
  }

  private insertOutbox(outbox: IssueProjectionIntent): void {
    this.db
      .prepare(`INSERT INTO github_projection_outbox VALUES (${placeholders(20)})`)
      .run(
        outbox.outboxId,
        outbox.episodeId,
        outbox.sourceEventSequence,
        outbox.operationKind,
        outbox.objectKind,
        outbox.repository,
        outbox.targetLogicalKey,
        outbox.intentRevision,
        outbox.idempotencyKey,
        outbox.payloadVersion,
        outbox.canonicalPayloadJson,
        outbox.payloadDigest,
        outbox.status,
        outbox.attemptCount,
        outbox.nextAttemptAt,
        null,
        null,
        null,
        outbox.createdAt,
        null,
      );
  }

  private updateProjection(events: readonly ExecutionEpisodeEvent[]): void {
    const result = projectExecutionEpisode(events);
    if (!result.ok) throw new Error("projection:invalid-event-stream");
    const projection = result.projection;
    this.db
      .prepare(
        `UPDATE execution_episode_projection SET
          current_event_sequence = ?, current_state = ?, current_event_digest = ?, block_reason = ?,
          next_legal_actions_json = ?, latest_head = ?, merge_readiness = ?, rebuilt_at = ?
        WHERE episode_id = ?`,
      )
      .run(
        projection.eventSequence,
        projection.state,
        projection.lastEventDigest,
        projection.blockReason,
        JSON.stringify(projection.nextLegalActions),
        projection.latestHead,
        projection.mergeReadiness,
        projection.rebuiltAt,
        projection.episodeId,
      );
  }

  private insertTransitionReceipt(
    event: ExecutionTransitionEvent,
    commandType: ExecutionTransitionCommand["type"],
  ): void {
    const row = {
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
    };
    this.db
      .prepare("INSERT INTO append_command_receipts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(...Object.values(row), ledgerRowDigest(row, "receipt_digest"));
  }

  private replay(eventId: string): EpisodeRepositoryResult {
    const row = this.db
      .prepare("SELECT * FROM execution_episode_events WHERE event_id = ?")
      .get(eventId);
    if (!row) return failed("episode-ledger-integrity-invalid", "receipt.result_ref");
    let payload: EscapeObservedPayload;
    try {
      payload = JSON.parse(String(row.canonical_payload_json)) as EscapeObservedPayload;
    } catch {
      return failed("episode-ledger-integrity-invalid", "event.canonical_payload_json");
    }
    const event: EscapeObservedEvent = {
      eventId: String(row.event_id),
      episodeId: String(row.episode_id),
      sequence: 0,
      state: "E0",
      kind: "escape_observed",
      commandId: String(row.command_id),
      commandPayloadDigest: String(row.command_payload_digest),
      payloadDigest: String(row.payload_digest),
      previousEventDigest: null,
      eventDigest: String(row.event_digest),
      occurredAt: String(row.occurred_at),
      actor: String(row.actor),
      payload,
    };
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

function placeholders(count: number): string {
  return Array.from({ length: count }, () => "?").join(", ");
}
