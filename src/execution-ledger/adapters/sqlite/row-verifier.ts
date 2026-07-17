import { createHash } from "node:crypto";
import {
  canonicalizeExecutionPayload,
  type EscapeObservedPayload,
  type ExecutionEpisodeEvent,
  reduceExecutionEpisode,
} from "../../domain/execution-episode.js";
import { projectExecutionEpisode } from "../../application/episode-projector.js";
import {
  decodeAppendCommandReceiptRow,
  decodeDriveSelectionRow,
  decodeExecutionEpisodeEventRow,
  decodeExecutionEpisodeRootRow,
  decodeExecutionEpisodeProjectionRow,
  decodeIssueProjectionRow,
} from "./episode-row-mapper.js";

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
    const core = verifyCoreRows(db);
    if (!core) return false;
    const projections = db
      .prepare("SELECT * FROM execution_episode_projection ORDER BY episode_id")
      .all();
    if (projections.length !== core.streams.size) return false;
    if (
      !projections.every((projection) =>
        projectionMatchesStream(projection, core.streams.get(String(projection.episode_id))),
      )
    )
      return false;
    return true;
  } catch {
    return false;
  }
}

export function executionLedgerSourceRowsValid(db: ExecutionLedgerReadDb): boolean {
  try {
    return verifyCoreRows(db) !== undefined;
  } catch {
    return false;
  }
}

function verifyCoreRows(
  db: ExecutionLedgerReadDb,
): { readonly streams: ReadonlyMap<string, VerifiedStream> } | undefined {
  const roots = db.prepare("SELECT * FROM execution_episodes ORDER BY episode_id").all();
  const eventRows = db
    .prepare("SELECT * FROM execution_episode_events ORDER BY episode_id, event_sequence")
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
  if (!streams || roots.length !== streams.size) return undefined;
  if (!roots.every((root) => rootMatchesStream(root, streams.get(String(root.episode_id)))))
    return undefined;
  if (!receiptsMatchEvents(receipts, eventRows)) return undefined;
  if (!selectionsMatchStreams(selections, streams)) return undefined;
  if (!outboxMatchesStreams(outbox, streams)) return undefined;
  return Object.freeze({ streams });
}

function selectionsMatchStreams(
  rows: readonly Record<string, unknown>[],
  streams: ReadonlyMap<string, VerifiedStream>,
): boolean {
  const expectedEvents = [...streams.values()].flatMap((stream) =>
    stream.events.filter((event) => event.kind === "drive_selected"),
  );
  if (rows.length !== expectedEvents.length) return false;
  const decodedRows = rows.map(decodeDriveSelectionRow);
  if (decodedRows.some((row) => row === undefined)) return false;
  const actual = uniqueRowMap(rows, (row) =>
    selectionKey(row.episode_id, row.selection_revision),
  );
  if (!actual) return false;
  const expected = new Map<string, Readonly<Record<string, unknown>>>();
  for (const event of expectedEvents) {
    const payload = asRecord(event.payload);
    if (!payload) return false;
    const revision = Number(payload.selectionRevision);
    if (!Number.isSafeInteger(revision)) return false;
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
    const key = selectionKey(event.episodeId, revision);
    if (!key || expected.has(key)) return false;
    expected.set(key, {
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
  }
  return keysEqual(actual, expected) && [...expected].every(([key, value]) => same(actual.get(key)!, value));
}

function outboxMatchesStreams(
  rows: readonly Record<string, unknown>[],
  streams: ReadonlyMap<string, VerifiedStream>,
): boolean {
  const expectedEvents = [...streams.values()].flatMap((stream) =>
    stream.events.filter((event) => event.kind === "issue_requested"),
  );
  if (rows.length !== expectedEvents.length) return false;
  const decodedRows = rows.map(decodeIssueProjectionRow);
  if (decodedRows.some((row) => row === undefined)) return false;
  const actual = uniqueRowMap(rows, (row) =>
    outboxKey(row.episode_id, row.source_event_sequence, row.intent_revision),
  );
  if (!actual) return false;
  const expectedKeys = new Set<string>();
  for (const event of expectedEvents) {
    const payload = asRecord(event.payload);
    const stream = streams.get(event.episodeId);
    if (!payload || !stream) return false;
    const intentRevision = Number(payload.intentRevision);
    if (!Number.isSafeInteger(intentRevision)) return false;
    const key = outboxKey(event.episodeId, event.sequence, intentRevision);
    if (!key) return false;
    const row = actual.get(key);
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
    const expectedRow = {
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
        created_at: event.occurredAt,
    };
    expectedKeys.add(key);
    const intentMatches =
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
        canonicalizeExecutionPayload({ title: root.issue.title, bodyDigest: root.issue.bodyDigest });
    if (!same(row, expectedRow) || !intentMatches) return false;
  }
  return keysEqual(actual, new Map([...expectedKeys].map((key) => [key, {}])));
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
    const decoded = eventRows.map(decodeExecutionEpisodeEventRow);
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

function rootMatchesStream(
  root: Record<string, unknown>,
  stream: VerifiedStream | undefined,
): boolean {
  if (!stream) return false;
  const decoded = decodeExecutionEpisodeRootRow(root);
  if (!decoded) return false;
  const payload = stream.payload;
  const reentry = payload.reentry;
  if (!reentry) return false;
  return same(decoded as unknown as Readonly<Record<string, unknown>>, {
    episodeId: payload.episodeId,
    recurrenceId: payload.recurrenceId,
    originAssetId: payload.origin.assetId,
    originRevision: payload.origin.revision,
    originLayer: payload.origin.layer,
    originState: payload.origin.state,
    escapeType: payload.escapeType,
    escapeReason: payload.escapeReason,
    driveModel: payload.requestedDriveModel,
    reentryAssetId: reentry.assetId,
    reentryRevision: reentry.revision,
    reentryLayer: reentry.layer,
    reentryState: reentry.state,
    reentryPolicyRevision: reentry.policyRevision,
    issueRepository: payload.issue.repository,
    issueTitle: payload.issue.title,
    issueBodyDigest: payload.issue.bodyDigest,
    sourceCommit: payload.sourceCommit,
    observedHead: payload.observedHead,
    policyRevision: payload.policyRevision,
    actor: payload.actor,
    createdAt: stream.events[0].occurredAt,
  });
}

function projectionMatchesStream(
  projection: Record<string, unknown>,
  stream: VerifiedStream | undefined,
): boolean {
  if (!stream) return false;
  if (!decodeExecutionEpisodeProjectionRow(projection)) return false;
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
  const decodedReceipts = receipts.map(decodeAppendCommandReceiptRow);
  if (decodedReceipts.some((receipt) => receipt === undefined)) return false;
  const byEventId = uniqueRowMap(eventRows, (event) => String(event.event_id));
  const byResultRef = uniqueRowMap(receipts, (receipt) => String(receipt.result_ref));
  if (!byEventId || !byResultRef) return false;
  const commandTypes = new Map([
    ["escape_observed", "execution_episode.request_escape"],
    ["escape_classified", "execution_episode.classify_escape"],
    ["drive_selected", "execution_episode.select_drive_model"],
    ["issue_requested", "execution_episode.request_issue_projection"],
  ]);
  return eventRows.every((event) => {
    const receipt = byResultRef.get(String(event.event_id));
    const commandType = commandTypes.get(String(event.event_kind));
    if (!receipt || !commandType) return false;
    return (
      receipt.receipt_digest === receiptDigest(receipt) &&
      event !== undefined &&
      receipt.command_type === commandType &&
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

function uniqueRowMap(
  rows: readonly Record<string, unknown>[],
  keyOf: (row: Record<string, unknown>) => string | undefined,
): Map<string, Record<string, unknown>> | undefined {
  const map = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    const key = keyOf(row);
    if (!key || map.has(key)) return undefined;
    map.set(key, row);
  }
  return map;
}

function keysEqual(
  actual: ReadonlyMap<string, unknown>,
  expected: ReadonlyMap<string, unknown>,
): boolean {
  return actual.size === expected.size && [...actual.keys()].every((key) => expected.has(key));
}

function selectionKey(episodeId: unknown, revision: unknown): string | undefined {
  const value = Number(revision);
  return typeof episodeId === "string" && episodeId && Number.isSafeInteger(value)
    ? `${episodeId}\0${value}`
    : undefined;
}

function outboxKey(episodeId: unknown, sequence: unknown, revision: unknown): string | undefined {
  const eventSequence = Number(sequence);
  const intentRevision = Number(revision);
  return typeof episodeId === "string" &&
    episodeId &&
    Number.isSafeInteger(eventSequence) &&
    Number.isSafeInteger(intentRevision)
    ? `${episodeId}\0${eventSequence}\0${intentRevision}`
    : undefined;
}

function receiptDigest(row: Readonly<Record<string, unknown>>): string {
  const frame = Object.entries(row)
    .filter(([key]) => key !== "receipt_digest")
    .sort(([left], [right]) => Buffer.from(left).compare(Buffer.from(right)));
  return sha256(JSON.stringify(frame));
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
