import { createHash } from "node:crypto";
import {
  calculateExecutionEventDigest,
  canonicalizeExecutionPayload,
  type ExecutionEpisodeEvent,
} from "../../domain/execution-episode.js";
import type { EpisodeWriteCustody } from "../../ports/episode-repository.js";

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

export function mapExecutionEpisodeEventToRow(
  event: PersistedExecutionEpisodeEvent,
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
    return actual === undefined || actual === value;
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
