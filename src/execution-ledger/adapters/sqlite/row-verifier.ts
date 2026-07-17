import { createHash } from "node:crypto";
import {
  canonicalizeExecutionPayload,
  type EscapeObservedPayload,
  type ExecutionEpisodeEvent,
  reduceExecutionEpisode,
} from "../../domain/execution-episode.js";
import { projectExecutionEpisode } from "../../application/episode-projector.js";

interface ReadStatement {
  all(...params: unknown[]): Record<string, unknown>[];
}

export interface ExecutionLedgerReadDb {
  prepare(sql: string): ReadStatement;
}

interface VerifiedStream {
  readonly events: readonly ExecutionEpisodeEvent[];
  readonly payload: EscapeObservedPayload;
  readonly state: string;
  readonly sequence: number;
  readonly digest: string;
  readonly nextCommands: readonly string[];
}

export function executionLedgerRowsValid(db: ExecutionLedgerReadDb): boolean {
  try {
    const roots = db.prepare("SELECT * FROM execution_episodes ORDER BY episode_id").all();
    const eventRows = db
      .prepare("SELECT * FROM execution_episode_events ORDER BY episode_id, event_sequence")
      .all();
    const projections = db
      .prepare("SELECT * FROM execution_episode_projection ORDER BY episode_id")
      .all();
    const receipts = db
      .prepare(
        "SELECT * FROM append_command_receipts WHERE subject_kind = 'execution_episode' ORDER BY command_id",
      )
      .all();
    const selections = db
      .prepare("SELECT * FROM drive_model_selections ORDER BY episode_id, selection_revision")
      .all();
    const outbox = db
      .prepare("SELECT * FROM github_projection_outbox ORDER BY episode_id, source_event_sequence")
      .all();

    const streams = verifyStreams(eventRows);
    if (!streams || roots.length !== streams.size || projections.length !== streams.size) return false;
    if (!roots.every((root) => rootMatchesStream(root, streams.get(String(root.episode_id)))))
      return false;
    if (
      !projections.every((projection) =>
        projectionMatchesStream(projection, streams.get(String(projection.episode_id))),
      )
    )
      return false;
    if (!receiptsMatchEvents(receipts, eventRows)) return false;
    if (!selectionsMatchStreams(selections, streams)) return false;
    if (!outboxMatchesStreams(outbox, streams)) return false;
    return true;
  } catch {
    return false;
  }
}

function selectionsMatchStreams(
  rows: readonly Record<string, unknown>[],
  streams: ReadonlyMap<string, VerifiedStream>,
): boolean {
  const expectedEvents = [...streams.values()].flatMap((stream) =>
    stream.events.filter((event) => event.kind === "drive_selected"),
  );
  if (rows.length !== expectedEvents.length) return false;
  return expectedEvents.every((event) => {
    const payload = asRecord(event.payload);
    if (!payload) return false;
    const revision = Number(payload.selectionRevision);
    const row = rows.find(
      (candidate) =>
        candidate.episode_id === event.episodeId &&
        Number(candidate.selection_revision) === revision,
    );
    if (!row) return false;
    const override = asRecord(payload.override);
    const value = {
      episodeId: event.episodeId,
      selectionRevision: revision,
      selectedEventSequence: event.sequence,
      model: payload.model,
      compatibilityResult: payload.compatibilityResult,
      rationaleDigest: payload.rationaleDigest,
      overrideUsed: Boolean(override),
      overrideActor: override?.actor ?? null,
      overrideReason: override?.reason ?? null,
      overrideEvidenceDigest: override?.evidenceDigest ?? null,
      selectedAt: event.occurredAt,
    };
    return same(row, {
      episode_id: value.episodeId,
      selection_revision: value.selectionRevision,
      selected_event_sequence: value.selectedEventSequence,
      model: value.model,
      compatibility_result: value.compatibilityResult,
      rationale_digest: value.rationaleDigest,
      override_used: value.overrideUsed ? 1 : 0,
      override_actor: value.overrideActor,
      override_reason: value.overrideReason,
      override_evidence_digest: value.overrideEvidenceDigest,
      selected_at: value.selectedAt,
      selection_digest: sha256(canonicalizeExecutionPayload(value)),
    });
  });
}

function outboxMatchesStreams(
  rows: readonly Record<string, unknown>[],
  streams: ReadonlyMap<string, VerifiedStream>,
): boolean {
  const expectedEvents = [...streams.values()].flatMap((stream) =>
    stream.events.filter((event) => event.kind === "issue_requested"),
  );
  if (rows.length !== expectedEvents.length) return false;
  return expectedEvents.every((event) => {
    const payload = asRecord(event.payload);
    const stream = streams.get(event.episodeId);
    if (!payload || !stream) return false;
    const row = rows.find(
      (candidate) =>
        candidate.episode_id === event.episodeId &&
        Number(candidate.source_event_sequence) === event.sequence,
    );
    if (!row) return false;
    const canonicalPayloadJson = String(row.canonical_payload_json);
    let intentPayload: unknown;
    try {
      intentPayload = JSON.parse(canonicalPayloadJson);
    } catch {
      return false;
    }
    const intent = asRecord(intentPayload);
    const root = stream.payload;
    const payloadDigest = sha256(canonicalPayloadJson);
    const idempotencyKey = String(payload.idempotencyKey);
    if (
      !intent ||
      canonicalizeExecutionPayload(intentPayload) !== canonicalPayloadJson ||
      payloadDigest !== payload.projectionPayloadDigest ||
      idempotencyKey !== row.idempotency_key ||
      !Array.isArray(intent.labels) ||
      intent.labels.length === 0
    )
      return false;
    return (
      same(row, {
        outbox_id: `outbox:${sha256(`github-outbox-id:v1\0${idempotencyKey}`).slice(0, 32)}`,
        episode_id: event.episodeId,
        source_event_sequence: event.sequence,
        operation_kind: "create",
        object_kind: "issue",
        repository: root.issue.repository,
        target_logical_key: payload.targetLogicalKey,
        intent_revision: payload.intentRevision,
        idempotency_key: idempotencyKey,
        payload_version: 1,
        payload_digest: payloadDigest,
      }) &&
      same(intent, {
        schema: "github.issue.intent.v1",
        episodeId: event.episodeId,
        recurrenceId: root.recurrenceId,
        repository: root.issue.repository,
        driveModel: root.requestedDriveModel,
        sourceCommit: payload.sourceCommit,
        observedHead: payload.observedHead,
        policyRevision: payload.policyRevision,
      }) &&
      canonicalizeExecutionPayload(intent.origin) === canonicalizeExecutionPayload(root.origin) &&
      canonicalizeExecutionPayload(intent.reentry) === canonicalizeExecutionPayload(root.reentry) &&
      canonicalizeExecutionPayload(intent.issue) ===
        canonicalizeExecutionPayload({ title: root.issue.title, bodyDigest: root.issue.bodyDigest })
    );
  });
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function verifyStreams(
  rows: readonly Record<string, unknown>[],
): ReadonlyMap<string, VerifiedStream> | undefined {
  const grouped = new Map<string, Record<string, unknown>[]>();
  for (const row of rows) {
    const episodeId = String(row.episode_id);
    const bucket = grouped.get(episodeId) ?? [];
    bucket.push(row);
    grouped.set(episodeId, bucket);
  }
  const streams = new Map<string, VerifiedStream>();
  for (const [episodeId, eventRows] of grouped) {
    const decoded = eventRows.map(decodeEventRow);
    if (decoded.some((event) => event === undefined)) return undefined;
    const events = decoded as ExecutionEpisodeEvent[];
    const reduction = reduceExecutionEpisode(events);
    if (!reduction.ok) return undefined;
    const firstPayload = events[0]?.payload;
    if (!isEscapeObservedPayload(firstPayload) || firstPayload.episodeId !== episodeId)
      return undefined;
    streams.set(episodeId, {
      events,
      payload: firstPayload,
      state: reduction.snapshot.state,
      sequence: reduction.snapshot.eventSequence,
      digest: reduction.snapshot.lastEventDigest,
      nextCommands: reduction.snapshot.nextLegalCommands,
    });
  }
  return streams;
}

function decodeEventRow(row: Record<string, unknown>): ExecutionEpisodeEvent | undefined {
  const rawPayload = String(row.canonical_payload_json);
  let payload: unknown;
  try {
    payload = JSON.parse(rawPayload);
  } catch {
    return undefined;
  }
  if (canonicalizeExecutionPayload(payload) !== rawPayload) return undefined;
  if (sha256(rawPayload) !== row.payload_digest) return undefined;
  if (
    !Number.isSafeInteger(Number(row.event_sequence)) ||
    !String(row.runtime).trim() ||
    !String(row.model).trim()
  )
    return undefined;
  return {
    episodeId: String(row.episode_id),
    sequence: Number(row.event_sequence),
    state: String(row.event_state),
    kind: String(row.event_kind),
    payloadDigest: String(row.payload_digest),
    previousEventDigest:
      row.previous_event_digest == null ? null : String(row.previous_event_digest),
    occurredAt: String(row.occurred_at),
    actor: String(row.actor),
    eventDigest: String(row.event_digest),
    payload,
  };
}

function rootMatchesStream(
  root: Record<string, unknown>,
  stream: VerifiedStream | undefined,
): boolean {
  if (!stream) return false;
  const payload = stream.payload;
  const reentry = payload.reentry;
  if (!reentry) return false;
  return same(root, {
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
    created_at: stream.events[0].occurredAt,
  });
}

function projectionMatchesStream(
  projection: Record<string, unknown>,
  stream: VerifiedStream | undefined,
): boolean {
  if (!stream) return false;
  const expected = projectExecutionEpisode(stream.events);
  if (!expected.ok) return false;
  const value = expected.projection;
  if (
    !same(projection, {
      episode_id: value.episodeId,
      current_event_sequence: value.eventSequence,
      current_state: value.state,
      current_event_digest: value.lastEventDigest,
      next_legal_actions_json: canonicalizeExecutionPayload(value.nextLegalActions),
      latest_head: value.latestHead,
      block_reason: value.blockReason,
      merge_readiness: value.mergeReadiness,
      drive_model: value.driveModel,
      reentry_layer: value.reentryLayer,
      rebuilt_at: value.rebuiltAt,
    })
  )
    return false;
  return true;
}

function receiptsMatchEvents(
  receipts: readonly Record<string, unknown>[],
  eventRows: readonly Record<string, unknown>[],
): boolean {
  if (receipts.length !== eventRows.length) return false;
  const byEventId = new Map(eventRows.map((event) => [String(event.event_id), event]));
  const commandTypes = new Map([
    ["escape_observed", "execution_episode.request_escape"],
    ["escape_classified", "execution_episode.classify_escape"],
    ["drive_selected", "execution_episode.select_drive_model"],
    ["issue_requested", "execution_episode.request_issue_projection"],
  ]);
  return receipts.every((receipt) => {
    const event = byEventId.get(String(receipt.result_ref));
    return (
      event !== undefined &&
      receipt.command_type === commandTypes.get(String(event.event_kind)) &&
      receipt.subject_key === event.episode_id &&
      receipt.command_id === event.command_id &&
      receipt.command_payload_digest === event.command_payload_digest &&
      receipt.result_kind === "episode_event" &&
      receipt.recorded_at === event.occurred_at &&
      receipt.plan_asset_id == null &&
      receipt.plan_revision == null
    );
  });
}

function isEscapeObservedPayload(value: unknown): value is EscapeObservedPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.episodeId === "string" &&
    typeof payload.recurrenceId === "string" &&
    typeof payload.escapeType === "string" &&
    typeof payload.escapeReason === "string" &&
    typeof payload.requestedDriveModel === "string" &&
    typeof payload.origin === "object" &&
    payload.origin !== null &&
    typeof payload.reentry === "object" &&
    payload.reentry !== null &&
    typeof payload.issue === "object" &&
    payload.issue !== null &&
    typeof payload.sourceCommit === "string" &&
    typeof payload.observedHead === "string" &&
    typeof payload.policyRevision === "string" &&
    typeof payload.actor === "string"
  );
}

function same(
  actual: Readonly<Record<string, unknown>>,
  expected: Readonly<Record<string, unknown>>,
): boolean {
  return Object.entries(expected).every(([key, value]) => actual[key] === value);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
