import { createHash } from "node:crypto";
import {
  calculateExecutionEventDigest,
  canonicalizeExecutionPayload,
  type DriveSelectionIntent,
  type EscapeObservedPayload,
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

export const EXECUTION_EPISODE_ROOT_COLUMNS = [
  "episode_id",
  "recurrence_id",
  "origin_asset_id",
  "origin_revision",
  "origin_layer",
  "origin_state",
  "escape_type",
  "escape_reason",
  "drive_model",
  "reentry_asset_id",
  "reentry_revision",
  "reentry_layer",
  "reentry_state",
  "reentry_policy_revision",
  "issue_repository",
  "issue_title",
  "issue_body_digest",
  "source_commit",
  "observed_head",
  "policy_revision",
  "actor",
  "created_at",
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

export interface DecodedIssueProjectionRow {
  readonly outboxId: string;
  readonly episodeId: string;
  readonly sourceEventSequence: number;
  readonly operationKind: "create";
  readonly objectKind: "issue";
  readonly repository: string;
  readonly targetLogicalKey: string;
  readonly intentRevision: number;
  readonly idempotencyKey: string;
  readonly payloadVersion: 1;
  readonly canonicalPayloadJson: string;
  readonly payloadDigest: string;
  readonly status: "pending" | "leased" | "deferred" | "acknowledged" | "blocked";
  readonly attemptCount: number;
  readonly nextAttemptAt: string;
  readonly leaseOwner: string | null;
  readonly leaseExpiresAt: string | null;
  readonly ackObservationId: string | null;
  readonly createdAt: string;
  readonly lastAttemptAt: string | null;
  readonly payload: unknown;
}

export interface DecodedExecutionEpisodeRootRow {
  readonly episodeId: string;
  readonly recurrenceId: string;
  readonly originAssetId: string;
  readonly originRevision: number;
  readonly originLayer: string;
  readonly originState: string;
  readonly escapeType: string;
  readonly escapeReason: string;
  readonly driveModel: string;
  readonly reentryAssetId: string;
  readonly reentryRevision: number;
  readonly reentryLayer: string;
  readonly reentryState: string;
  readonly reentryPolicyRevision: string;
  readonly issueRepository: string;
  readonly issueTitle: string;
  readonly issueBodyDigest: string;
  readonly sourceCommit: string;
  readonly observedHead: string;
  readonly policyRevision: string;
  readonly actor: string;
  readonly createdAt: string;
}

export function mapExecutionEpisodeRootToRow(
  payload: EscapeObservedPayload,
  occurredAt: string,
): ExecutionEpisodeEventRow {
  if (!canonicalIso(occurredAt)) throw new Error("episode-root-occurred-at-invalid");
  const reentry = payload.reentry;
  if (!reentry) throw new Error("episode-root-reentry-invalid");
  return Object.freeze({
    episode_id: payload.episodeId,
    recurrence_id: payload.recurrenceId,
    origin_asset_id: payload.origin.assetId,
    origin_revision: payload.origin.revision,
    origin_layer: payload.origin.layer,
    origin_state: payload.origin.state,
    escape_type: payload.escapeType,
    escape_reason: payload.escapeReason,
    drive_model: payload.requestedDriveModel,
    reentry_asset_id: reentry.assetId,
    reentry_revision: reentry.revision,
    reentry_layer: reentry.layer,
    reentry_state: reentry.state,
    reentry_policy_revision: reentry.policyRevision,
    issue_repository: payload.issue.repository,
    issue_title: payload.issue.title,
    issue_body_digest: payload.issue.bodyDigest,
    source_commit: payload.sourceCommit,
    observed_head: payload.observedHead,
    policy_revision: payload.policyRevision,
    actor: payload.actor,
    created_at: occurredAt,
  });
}

export function decodeExecutionEpisodeRootRow(
  row: ExecutionEpisodeEventRow,
): DecodedExecutionEpisodeRootRow | undefined {
  const episodeId = requiredText(row, "episode_id");
  const recurrenceId = requiredText(row, "recurrence_id");
  const originAssetId = requiredText(row, "origin_asset_id");
  const originRevision = strictInteger(row.origin_revision);
  const originLayer = requiredText(row, "origin_layer");
  const originState = requiredText(row, "origin_state");
  const escapeType = requiredText(row, "escape_type");
  const escapeReason = requiredText(row, "escape_reason");
  const driveModel = requiredText(row, "drive_model");
  const reentryAssetId = requiredText(row, "reentry_asset_id");
  const reentryRevision = strictInteger(row.reentry_revision);
  const reentryLayer = requiredText(row, "reentry_layer");
  const reentryState = requiredText(row, "reentry_state");
  const reentryPolicyRevision = requiredText(row, "reentry_policy_revision");
  const issueRepository = requiredText(row, "issue_repository");
  const issueTitle = requiredText(row, "issue_title");
  const issueBodyDigest = contentDigestText(row, "issue_body_digest");
  const sourceCommit = commitText(row, "source_commit");
  const observedHead = commitText(row, "observed_head");
  const policyRevision = requiredText(row, "policy_revision");
  const actor = requiredText(row, "actor");
  const createdAt = isoText(row, "created_at");
  if (
    !episodeId ||
    !/^episode:[A-Za-z0-9][A-Za-z0-9._:-]{1,127}$/.test(episodeId) ||
    !recurrenceId ||
    !/^recurrence:[A-Za-z0-9][A-Za-z0-9._:-]{1,127}$/.test(recurrenceId) ||
    !originAssetId ||
    originRevision === undefined ||
    originRevision < 1 ||
    !originLayer ||
    !/^L(?:[0-9]|1[0-4])$/.test(originLayer) ||
    !originState ||
    !escapeType ||
    !ESCAPE_TYPES.has(escapeType) ||
    !escapeReason ||
    !driveModel ||
    !DRIVE_MODELS.has(driveModel) ||
    !reentryAssetId ||
    reentryRevision === undefined ||
    reentryRevision < 1 ||
    !reentryLayer ||
    !/^L(?:[0-9]|1[0-4])$/.test(reentryLayer) ||
    !reentryState ||
    !reentryPolicyRevision ||
    !issueRepository ||
    !issueTitle ||
    !issueBodyDigest ||
    !sourceCommit ||
    !observedHead ||
    !policyRevision ||
    !actor ||
    !createdAt
  )
    return undefined;
  return Object.freeze({
    episodeId,
    recurrenceId,
    originAssetId,
    originRevision,
    originLayer,
    originState,
    escapeType,
    escapeReason,
    driveModel,
    reentryAssetId,
    reentryRevision,
    reentryLayer,
    reentryState,
    reentryPolicyRevision,
    issueRepository,
    issueTitle,
    issueBodyDigest,
    sourceCommit,
    observedHead,
    policyRevision,
    actor,
    createdAt,
  });
}

export interface DecodedAppendCommandReceipt extends AppendCommandReceiptInput {
  readonly receipt_digest: string;
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

export function decodeDriveSelectionRow(
  row: ExecutionEpisodeEventRow,
): DriveSelectionIntent | undefined {
  const episodeId = requiredText(row, "episode_id");
  const selectionRevision = safeInteger(row.selection_revision);
  const selectedEventSequence = safeInteger(row.selected_event_sequence);
  const model = requiredText(row, "model");
  const compatibilityResult = requiredText(row, "compatibility_result");
  const rationaleDigest = digestText(row, "rationale_digest");
  const overrideUsed = safeInteger(row.override_used);
  const overrideActor = nullableText(row, "override_actor");
  const overrideReason = nullableText(row, "override_reason");
  const overrideEvidenceDigest = nullableText(row, "override_evidence_digest");
  const selectedAt = isoText(row, "selected_at");
  const selectionDigest = digestText(row, "selection_digest");
  if (
    !episodeId ||
    selectionRevision === undefined ||
    selectedEventSequence !== 2 ||
    !model ||
    !DRIVE_MODELS.has(model) ||
    (compatibilityResult !== "compatible" && compatibilityResult !== "override_required") ||
    !rationaleDigest ||
    (overrideUsed !== 0 && overrideUsed !== 1) ||
    overrideActor === undefined ||
    overrideReason === undefined ||
    overrideEvidenceDigest === undefined ||
    !selectedAt ||
    !selectionDigest ||
    (overrideUsed === 0 &&
      (overrideActor !== null || overrideReason !== null || overrideEvidenceDigest !== null)) ||
    (overrideUsed === 1 &&
      (overrideActor === null || overrideReason === null || overrideEvidenceDigest === null ||
        !/^[a-f0-9]{64}$/.test(overrideEvidenceDigest)))
  )
    return undefined;
  const value = {
    episodeId,
    selectionRevision,
    selectedEventSequence: 2 as const,
    model: model as DriveSelectionIntent["model"],
    compatibilityResult: compatibilityResult as DriveSelectionIntent["compatibilityResult"],
    rationaleDigest,
    overrideUsed: overrideUsed === 1,
    overrideActor,
    overrideReason,
    overrideEvidenceDigest,
    selectedAt,
  };
  if (sha256(canonicalizeExecutionPayload(value)) !== selectionDigest) return undefined;
  return Object.freeze({ ...value, selectionDigest });
}

export function decodeIssueProjectionRow(
  row: ExecutionEpisodeEventRow,
): DecodedIssueProjectionRow | undefined {
  const outboxId = requiredText(row, "outbox_id");
  const episodeId = requiredText(row, "episode_id");
  const sourceEventSequence = safeInteger(row.source_event_sequence);
  const operationKind = requiredText(row, "operation_kind");
  const objectKind = requiredText(row, "object_kind");
  const repository = requiredText(row, "repository");
  const targetLogicalKey = requiredText(row, "target_logical_key");
  const intentRevision = safeInteger(row.intent_revision);
  const idempotencyKey = digestText(row, "idempotency_key");
  const payloadVersion = safeInteger(row.payload_version);
  const canonicalPayloadJson = requiredText(row, "canonical_payload_json");
  const payloadDigest = digestText(row, "payload_digest");
  const status = requiredText(row, "status");
  const attemptCount = safeInteger(row.attempt_count);
  const nextAttemptAt = isoText(row, "next_attempt_at");
  const leaseOwner = nullableText(row, "lease_owner");
  const leaseExpiresAt = nullableIsoText(row, "lease_expires_at");
  const ackObservationId = nullableText(row, "ack_observation_id");
  const createdAt = isoText(row, "created_at");
  const lastAttemptAt = nullableIsoText(row, "last_attempt_at");
  if (
    !outboxId ||
    !episodeId ||
    sourceEventSequence === undefined ||
    sourceEventSequence < 0 ||
    operationKind !== "create" ||
    objectKind !== "issue" ||
    !repository ||
    !targetLogicalKey ||
    intentRevision === undefined ||
    !idempotencyKey ||
    payloadVersion !== 1 ||
    !canonicalPayloadJson ||
    !payloadDigest ||
    !status ||
    !OUTBOX_STATUSES.has(status) ||
    attemptCount === undefined ||
    attemptCount < 0 ||
    !nextAttemptAt ||
    leaseOwner === undefined ||
    leaseExpiresAt === undefined ||
    ackObservationId === undefined ||
    !createdAt ||
    lastAttemptAt === undefined ||
    outboxId !== deterministicOutboxId(idempotencyKey) ||
    !validOutboxDispatchState({
      status,
      attemptCount,
      leaseOwner,
      leaseExpiresAt,
      ackObservationId,
      lastAttemptAt,
    })
  )
    return undefined;
  let payload: unknown;
  try {
    payload = JSON.parse(canonicalPayloadJson);
  } catch {
    return undefined;
  }
  if (
    canonicalizeExecutionPayload(payload) !== canonicalPayloadJson ||
    sha256(canonicalPayloadJson) !== payloadDigest
  )
    return undefined;
  return Object.freeze({
    outboxId,
    episodeId,
    sourceEventSequence,
    operationKind: "create",
    objectKind: "issue",
    repository,
    targetLogicalKey,
    intentRevision,
    idempotencyKey,
    payloadVersion: 1,
    canonicalPayloadJson,
    payloadDigest,
    status: status as DecodedIssueProjectionRow["status"],
    attemptCount,
    nextAttemptAt,
    leaseOwner,
    leaseExpiresAt,
    ackObservationId,
    createdAt,
    lastAttemptAt,
    payload,
  });
}

export function decodeExecutionEpisodeProjectionRow(
  row: ExecutionEpisodeEventRow,
): ExecutionEpisodeProjection | undefined {
  const episodeId = requiredText(row, "episode_id");
  const eventSequence = safeInteger(row.current_event_sequence);
  const state = requiredText(row, "current_state");
  const lastEventDigest = digestText(row, "current_event_digest");
  const blockReason = requiredText(row, "block_reason");
  const actionsJson = requiredText(row, "next_legal_actions_json");
  const latestHead = commitText(row, "latest_head");
  const mergeReadiness = requiredText(row, "merge_readiness");
  const driveModel = requiredText(row, "drive_model");
  const reentryLayer = requiredText(row, "reentry_layer");
  const rebuiltAt = isoText(row, "rebuilt_at");
  if (
    !episodeId ||
    eventSequence === undefined ||
    eventSequence < 0 ||
    !state ||
    !/^E(?:[0-9]|1[0-5])$/.test(state) ||
    !lastEventDigest ||
    !blockReason ||
    !actionsJson ||
    !latestHead ||
    !mergeReadiness ||
    !MERGE_READINESS.has(mergeReadiness) ||
    !driveModel ||
    !DRIVE_MODELS.has(driveModel) ||
    !reentryLayer ||
    !/^L(?:[0-9]|1[0-4])$/.test(reentryLayer) ||
    !rebuiltAt
  )
    return undefined;
  let actions: unknown;
  try {
    actions = JSON.parse(actionsJson);
  } catch {
    return undefined;
  }
  if (
    !Array.isArray(actions) ||
    actions.some((action) => typeof action !== "string") ||
    canonicalizeExecutionPayload(actions) !== actionsJson
  )
    return undefined;
  return Object.freeze({
    episodeId,
    state: state as ExecutionEpisodeProjection["state"],
    eventSequence,
    lastEventDigest,
    nextLegalActions: Object.freeze(actions as string[]),
    blockReason,
    latestHead,
    mergeReadiness: mergeReadiness as ExecutionEpisodeProjection["mergeReadiness"],
    driveModel: driveModel as ExecutionEpisodeProjection["driveModel"],
    reentryLayer: reentryLayer as ExecutionEpisodeProjection["reentryLayer"],
    rebuiltAt,
  });
}

export function decodeAppendCommandReceiptRow(
  row: ExecutionEpisodeEventRow,
): DecodedAppendCommandReceipt | undefined {
  const commandId = requiredText(row, "command_id");
  const commandType = requiredText(row, "command_type");
  const subjectKind = requiredText(row, "subject_kind");
  const subjectKey = requiredText(row, "subject_key");
  const planAssetId = nullableText(row, "plan_asset_id");
  const planRevision = nullableInteger(row, "plan_revision");
  const commandPayloadDigest = digestText(row, "command_payload_digest");
  const resultKind = requiredText(row, "result_kind");
  const resultRef = requiredText(row, "result_ref");
  const recordedAt = isoText(row, "recorded_at");
  const receiptDigest = digestText(row, "receipt_digest");
  if (
    !commandId?.startsWith("command:") ||
    !commandType?.startsWith("execution_episode.") ||
    subjectKind !== "execution_episode" ||
    !subjectKey ||
    planAssetId !== null ||
    planRevision !== null ||
    !commandPayloadDigest ||
    resultKind !== "episode_event" ||
    !resultRef?.startsWith("event:") ||
    !recordedAt ||
    !receiptDigest ||
    receiptDigest !== receiptRowDigest(row)
  )
    return undefined;
  return Object.freeze({
    command_id: commandId,
    command_type: commandType,
    subject_kind: "execution_episode",
    subject_key: subjectKey,
    plan_asset_id: null,
    plan_revision: null,
    command_payload_digest: commandPayloadDigest,
    result_kind: "episode_event",
    result_ref: resultRef,
    recorded_at: recordedAt,
    receipt_digest: receiptDigest,
  });
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

const DRIVE_MODELS = new Set([
  "discovery",
  "scrum",
  "reverse",
  "redesign",
  "recovery",
  "incident",
  "refactor",
  "retrofit",
  "add-feature",
  "research",
  "design-bottomup",
  "version-up",
]);

const ESCAPE_TYPES = new Set([
  "blocked",
  "rejected",
  "reopened",
  "superseded",
  "preemptive",
  "defer",
]);

const OUTBOX_STATUSES = new Set([
  "pending",
  "leased",
  "deferred",
  "acknowledged",
  "blocked",
]);

const MERGE_READINESS = new Set(["blocked", "eligible", "merged", "closed"]);

function deterministicOutboxId(idempotencyKey: string): string {
  return `outbox:${sha256(`github-outbox-id:v1\0${idempotencyKey}`).slice(0, 32)}`;
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

function nullableText(row: ExecutionEpisodeEventRow, key: string): string | null | undefined {
  const value = row[key];
  if (value === null) return null;
  return typeof value === "string" && value.trim() ? value : undefined;
}

function nullableInteger(row: ExecutionEpisodeEventRow, key: string): number | null | undefined {
  const value = row[key];
  if (value === null) return null;
  return safeInteger(value);
}

function nullableIsoText(
  row: ExecutionEpisodeEventRow,
  key: string,
): string | null | undefined {
  const value = nullableText(row, key);
  return value === null || value === undefined ? value : canonicalIso(value) ? value : undefined;
}

function isoText(row: ExecutionEpisodeEventRow, key: string): string | undefined {
  const value = requiredText(row, key);
  return value && canonicalIso(value) ? value : undefined;
}

function canonicalIso(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value;
}

function digestText(row: ExecutionEpisodeEventRow, key: string): string | undefined {
  const value = requiredText(row, key);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : undefined;
}

function contentDigestText(row: ExecutionEpisodeEventRow, key: string): string | undefined {
  const value = requiredText(row, key);
  return value && /^(?:sha256:)?[a-f0-9]{64}$/.test(value) ? value : undefined;
}

function commitText(row: ExecutionEpisodeEventRow, key: string): string | undefined {
  const value = requiredText(row, key);
  return value && /^[a-f0-9]{40}$|^[a-f0-9]{64}$/.test(value) ? value : undefined;
}

function safeInteger(value: unknown): number | undefined {
  if (value === null || value === undefined || (typeof value === "string" && !value.trim()))
    return undefined;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(number) ? number : undefined;
}

function strictInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isSafeInteger(value) ? value : undefined;
}

function validOutboxDispatchState(input: {
  readonly status: string;
  readonly attemptCount: number;
  readonly leaseOwner: string | null;
  readonly leaseExpiresAt: string | null;
  readonly ackObservationId: string | null;
  readonly lastAttemptAt: string | null;
}): boolean {
  const hasLease = input.leaseOwner !== null && input.leaseExpiresAt !== null;
  if ((input.leaseOwner === null) !== (input.leaseExpiresAt === null)) return false;
  if (input.status === "leased")
    return hasLease && input.ackObservationId === null && input.attemptCount > 0;
  if (hasLease) return false;
  if (input.status === "acknowledged")
    return input.ackObservationId !== null && input.attemptCount > 0 && input.lastAttemptAt !== null;
  if (input.ackObservationId !== null) return false;
  if (input.attemptCount === 0)
    return input.status === "pending" && input.lastAttemptAt === null;
  return input.lastAttemptAt !== null;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function receiptRowDigest(row: ExecutionEpisodeEventRow): string {
  const frame = Object.entries(row)
    .filter(([key]) => key !== "receipt_digest")
    .sort(([left], [right]) => Buffer.from(left).compare(Buffer.from(right)));
  return sha256(JSON.stringify(frame));
}
