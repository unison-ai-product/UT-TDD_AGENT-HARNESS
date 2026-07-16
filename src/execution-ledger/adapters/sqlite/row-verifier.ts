import { createHash } from "node:crypto";
import {
  canonicalizeExecutionPayload,
  type EscapeObservedPayload,
  type ExecutionEpisodeEvent,
  reduceExecutionEpisode,
} from "../../domain/execution-episode.js";

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
    if (
      outbox.some(
        (intent) =>
          Number(intent.source_event_sequence) === 0 &&
          streams.get(String(intent.episode_id))?.sequence === 0,
      )
    )
      return false;
    return true;
  } catch {
    return false;
  }
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
  const reentry = stream.payload.reentry;
  if (!reentry) return false;
  if (
    !same(projection, {
      episode_id: stream.payload.episodeId,
      current_event_sequence: stream.sequence,
      current_state: stream.state,
      current_event_digest: stream.digest,
      next_legal_actions_json: canonicalizeExecutionPayload(stream.nextCommands),
      latest_head: stream.payload.observedHead,
      drive_model: stream.payload.requestedDriveModel,
      reentry_layer: reentry.layer,
    })
  )
    return false;
  return stream.sequence !== 0 ||
    (projection.block_reason === "issue_not_requested" &&
      projection.merge_readiness === "blocked" &&
      projection.rebuilt_at === stream.events[0].occurredAt);
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
