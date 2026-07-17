import { createHash } from "node:crypto";
import {
  calculateExecutionEventDigest,
  canonicalizeExecutionPayload,
  type DriveSelectionIntent,
  type ExecutionEpisodeEvent,
  type IssueProjectionIntent,
} from "../../domain/execution-episode.js";
import type { EpisodeWriteCustody } from "../../ports/episode-repository.js";
import type { ExecutionEpisodeProjection } from "../../application/episode-projector.js";

export const EXECUTION_EPISODE_EVENT_COLUMNS = [
  "event_id",
  "episode_id",
  "event_sequence",
  "command_id",
  "command_payload_digest",
  "event_state",
  "event_kind",
  "payload_version",
  "canonical_payload_json",
  "payload_digest",
  "previous_event_digest",
  "source_commit",
  "observed_head",
  "policy_revision",
  "actor",
  "runtime",
  "model",
  "occurred_at",
  "event_digest",
] as const;

export const DRIVE_MODEL_SELECTION_COLUMNS = [
  "episode_id",
  "selection_revision",
  "selected_event_sequence",
  "model",
  "compatibility_result",
  "rationale_digest",
  "override_used",
  "override_actor",
  "override_reason",
  "override_evidence_digest",
  "selected_at",
  "selection_digest",
] as const;

export const GITHUB_PROJECTION_OUTBOX_COLUMNS = [
  "outbox_id",
  "episode_id",
  "source_event_sequence",
  "operation_kind",
  "object_kind",
  "repository",
  "target_logical_key",
  "intent_revision",
  "idempotency_key",
  "payload_version",
  "canonical_payload_json",
  "payload_digest",
  "status",
  "attempt_count",
  "next_attempt_at",
  "lease_owner",
  "lease_expires_at",
  "ack_observation_id",
  "created_at",
  "last_attempt_at",
] as const;

export const EXECUTION_EPISODE_PROJECTION_COLUMNS = [
  "episode_id",
  "current_event_sequence",
  "current_state",
  "current_event_digest",
  "block_reason",
  "next_legal_actions_json",
  "latest_head",
  "merge_readiness",
  "drive_model",
  "reentry_layer",
  "rebuilt_at",
] as const;

export const APPEND_COMMAND_RECEIPT_COLUMNS = [
  "command_id",
  "command_type",
  "subject_kind",
  "subject_key",
  "plan_asset_id",
  "plan_revision",
  "command_payload_digest",
  "result_kind",
  "result_ref",
  "recorded_at",
  "receipt_digest",
] as const;

export interface PersistedExecutionEpisodeEvent extends ExecutionEpisodeEvent {
  readonly eventId: string;
  readonly commandId: string;
  readonly commandPayloadDigest: string;
  readonly payload: unknown;
  readonly sourceCommit: string;
  readonly observedHead: string;
  readonly policyRevision: string;
  readonly runtime: string;
  readonly model: string;
}

export type ExecutionEpisodeEventRow = Readonly<Record<string, unknown>>;

export interface AppendCommandReceiptInput {
  readonly command_id: string;
  readonly command_type: string;
  readonly subject_kind: "execution_episode";
  readonly subject_key: string;
  readonly plan_asset_id: string | null;
  readonly plan_revision: number | null;
  readonly command_payload_digest: string;
  readonly result_kind: "episode_event";
  readonly result_ref: string;
  readonly recorded_at: string;
}

export function mapExecutionEpisodeEventToRow(
  event: PersistedExecutionEpisodeEvent | PersistableExecutionEpisodeEvent,
  custody: EpisodeWriteCustody,
): ExecutionEpisodeEventRow {
  if (!custody.runtime.trim() || !custody.model.trim())
    throw new Error("episode-custody-invalid");
  const payload = asRecord(event.payload);
  if (!payload) throw new Error("episode-payload-invalid");
  const sourceCommit = requiredPayloadText(payload, "sourceCommit");
  const observedHead = requiredPayloadText(payload, "observedHead");
  const policyRevision = requiredPayloadText(payload, "policyRevision");
  return Object.freeze({
    event_id: event.eventId,
    episode_id: event.episodeId,
    event_sequence: event.sequence,
    command_id: event.commandId,
    command_payload_digest: event.commandPayloadDigest,
    event_state: event.state,
    event_kind: event.kind,
    payload_version: 1,
    canonical_payload_json: canonicalizeExecutionPayload(event.payload),
    payload_digest: event.payloadDigest,
    previous_event_digest: event.previousEventDigest,
    source_commit: sourceCommit,
    observed_head: observedHead,
    policy_revision: policyRevision,
    actor: event.actor,
    runtime: custody.runtime,
    model: custody.model,
    occurred_at: event.occurredAt,
    event_digest: event.eventDigest,
  });
}

export type PersistableExecutionEpisodeEvent = Pick<
  PersistedExecutionEpisodeEvent,
  "eventId" | "episodeId" | "sequence" | "state" | "kind" | "commandId" | "commandPayloadDigest" |
    "payloadDigest" | "previousEventDigest" | "occurredAt" | "actor" | "eventDigest" | "payload"
>;

export function mapDriveSelectionToRow(
  selection: DriveSelectionIntent,
): ExecutionEpisodeEventRow {
  return Object.freeze({
    episode_id: selection.episodeId,
    selection_revision: selection.selectionRevision,
    selected_event_sequence: selection.selectedEventSequence,
    model: selection.model,
    compatibility_result: selection.compatibilityResult,
    rationale_digest: selection.rationaleDigest,
    override_used: selection.overrideUsed ? 1 : 0,
    override_actor: selection.overrideActor,
    override_reason: selection.overrideReason,
    override_evidence_digest: selection.overrideEvidenceDigest,
    selected_at: selection.selectedAt,
    selection_digest: selection.selectionDigest,
  });
}

export function mapIssueProjectionToRow(
  outbox: IssueProjectionIntent,
): ExecutionEpisodeEventRow {
  return Object.freeze({
    outbox_id: outbox.outboxId,
    episode_id: outbox.episodeId,
    source_event_sequence: outbox.sourceEventSequence,
    operation_kind: outbox.operationKind,
    object_kind: outbox.objectKind,
    repository: outbox.repository,
    target_logical_key: outbox.targetLogicalKey,
    intent_revision: outbox.intentRevision,
    idempotency_key: outbox.idempotencyKey,
    payload_version: outbox.payloadVersion,
    canonical_payload_json: outbox.canonicalPayloadJson,
    payload_digest: outbox.payloadDigest,
    status: outbox.status,
    attempt_count: outbox.attemptCount,
    next_attempt_at: outbox.nextAttemptAt,
    lease_owner: null,
    lease_expires_at: null,
    ack_observation_id: null,
    created_at: outbox.createdAt,
    last_attempt_at: null,
  });
}

export function mapExecutionEpisodeProjectionToRow(
  projection: ExecutionEpisodeProjection,
): ExecutionEpisodeEventRow {
  return Object.freeze({
    episode_id: projection.episodeId,
    current_event_sequence: projection.eventSequence,
    current_state: projection.state,
    current_event_digest: projection.lastEventDigest,
    block_reason: projection.blockReason,
    next_legal_actions_json: canonicalizeExecutionPayload(projection.nextLegalActions),
    latest_head: projection.latestHead,
    merge_readiness: projection.mergeReadiness,
    drive_model: projection.driveModel,
    reentry_layer: projection.reentryLayer,
    rebuilt_at: projection.rebuiltAt,
  });
}

export function mapAppendCommandReceiptToRow(
  receipt: AppendCommandReceiptInput,
  receiptDigest: string,
): ExecutionEpisodeEventRow {
  return Object.freeze({ ...receipt, receipt_digest: receiptDigest });
}

export function rowValues(
  columns: readonly string[],
  row: ExecutionEpisodeEventRow,
): unknown[] {
  return columns.map((column) => row[column]);
}

export function insertSql(table: string, columns: readonly string[]): string {
  return `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`;
}

export function decodeExecutionEpisodeEventRow(
  row: ExecutionEpisodeEventRow,
): PersistedExecutionEpisodeEvent | undefined {
  const eventId = requiredText(row, "event_id");
  const episodeId = requiredText(row, "episode_id");
  const commandId = requiredText(row, "command_id");
  const commandPayloadDigest = digestText(row, "command_payload_digest");
  const state = requiredText(row, "event_state");
  const kind = requiredText(row, "event_kind");
  const occurredAt = requiredText(row, "occurred_at");
  const actor = requiredText(row, "actor");
  const runtime = requiredText(row, "runtime");
  const model = requiredText(row, "model");
  const sourceCommit = commitText(row, "source_commit");
  const observedHead = commitText(row, "observed_head");
  const policyRevision = requiredText(row, "policy_revision");
  const eventDigest = digestText(row, "event_digest");
  const payloadDigest = digestText(row, "payload_digest");
  const sequence = safeInteger(row.event_sequence);
  const payloadVersion = safeInteger(row.payload_version);
  if (
    !eventId?.startsWith("event:") ||
    !episodeId ||
    !commandId ||
    !commandId.startsWith("command:") ||
    !state ||
    !kind ||
    !occurredAt ||
    !actor ||
    !runtime ||
    !model ||
    !sourceCommit ||
    !observedHead ||
    !policyRevision ||
    !eventDigest ||
    !payloadDigest ||
    sequence === undefined ||
    payloadVersion !== 1
  )
    return undefined;
  const commandPayloadDigestValue = commandPayloadDigest;
  if (!commandPayloadDigestValue) return undefined;

  const rawPayload = row.canonical_payload_json;
  if (typeof rawPayload !== "string") return undefined;
  let payload: unknown;
  try {
    payload = JSON.parse(rawPayload);
  } catch {
    return undefined;
  }
  if (
    canonicalizeExecutionPayload(payload) !== rawPayload ||
    sha256(rawPayload) !== payloadDigest
  )
    return undefined;

  let previousEventDigest: string | null = null;
  if (row.previous_event_digest != null) {
    previousEventDigest = digestText(row, "previous_event_digest") ?? null;
    if (!previousEventDigest) return undefined;
  }
  const payloadRecord = asRecord(payload);
  if (
    payloadRecord &&
    !metadataMatches(payloadRecord, {
      episodeId,
      sourceCommit,
      observedHead,
      policyRevision,
      actor,
    })
  )
    return undefined;

  const event = {
    eventId,
    episodeId,
    sequence,
    state,
    kind,
    commandId,
    commandPayloadDigest: commandPayloadDigestValue,
    payloadDigest,
    previousEventDigest,
    occurredAt,
    actor,
    eventDigest,
    payload,
    sourceCommit,
    observedHead,
    policyRevision,
    runtime,
    model,
  } satisfies PersistedExecutionEpisodeEvent;
  if (calculateExecutionEventDigest(event) !== eventDigest) return undefined;
  return Object.freeze(event);
}

function metadataMatches(
  payload: Record<string, unknown>,
  expected: Readonly<Record<string, string>>,
): boolean {
  return Object.entries(expected).every(([key, value]) => {
    const actual = payload[key];
    return typeof actual === "string" && actual === value;
  });
}

function requiredPayloadText(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(`episode-payload-${key}-invalid`);
  return value;
}

function requiredText(row: ExecutionEpisodeEventRow, key: string): string | undefined {
  const value = row[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function digestText(row: ExecutionEpisodeEventRow, key: string): string | undefined {
  const value = requiredText(row, key);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : undefined;
}

function commitText(row: ExecutionEpisodeEventRow, key: string): string | undefined {
  const value = requiredText(row, key);
  return value && /^[a-f0-9]{40}$|^[a-f0-9]{64}$/.test(value) ? value : undefined;
}

function safeInteger(value: unknown): number | undefined {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(number) ? number : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
