import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  calculateExecutionEventDigest,
  canonicalizeExecutionPayload,
  type ExecutionEpisodeEvent,
} from "../../src/execution-ledger/domain/execution-episode.js";
import {
  decodeExecutionEpisodeEventRow,
  mapExecutionEpisodeEventToRow,
  type PersistedExecutionEpisodeEvent,
} from "../../src/execution-ledger/adapters/sqlite/episode-row-mapper.js";

const SHA = "a".repeat(40);
const COMMAND_DIGEST = "b".repeat(64);

describe("execution episode row mapper", () => {
  it("event rowを全metadata付きdomain eventへ復元し、同じrowへencodeできる", () => {
    const event = fixtureEvent();
    const row = mapExecutionEpisodeEventToRow(event, {
      runtime: "codex",
      model: "test-model",
    });

    expect(row).toMatchObject({
      event_id: event.eventId,
      command_id: event.commandId,
      command_payload_digest: COMMAND_DIGEST,
      source_commit: SHA,
      observed_head: SHA,
      policy_revision: "policy:escape-v1",
      runtime: "codex",
      model: "test-model",
    });
    expect(decodeExecutionEpisodeEventRow(row)).toEqual(eventWithCustody(event));
  });

  it.each([
    ["event_id", { event_id: null }],
    ["command_id", { command_id: "" }],
    ["command_payload_digest", { command_payload_digest: "not-a-digest" }],
    ["payload_digest", { payload_digest: "c".repeat(64) }],
    ["canonical payload", { canonical_payload_json: '{"tampered":true}' }],
    ["source_commit binding", { source_commit: "c".repeat(40) }],
    ["event digest", { event_digest: "d".repeat(64) }],
  ] as const)("%s改変をfail-closeする", (_label, mutation) => {
    const row = mapExecutionEpisodeEventToRow(fixtureEvent(), {
      runtime: "codex",
      model: "test-model",
    });
    expect(decodeExecutionEpisodeEventRow({ ...row, ...mutation })).toBeUndefined();
  });
});

function fixtureEvent(): PersistedExecutionEpisodeEvent {
  const payload = Object.freeze({
    episodeId: "episode:row-mapper",
    sourceCommit: SHA,
    observedHead: SHA,
    policyRevision: "policy:escape-v1",
    actor: "codex",
    marker: "fixture",
  });
  const unsigned: Omit<ExecutionEpisodeEvent, "eventDigest" | "payload"> = {
    eventId: "event:row-mapper",
    episodeId: "episode:row-mapper",
    sequence: 0,
    state: "E0",
    kind: "escape_observed",
    commandId: "command:row-mapper",
    commandPayloadDigest: COMMAND_DIGEST,
    payloadDigest: sha256(canonicalizeExecutionPayload(payload)),
    previousEventDigest: null,
    occurredAt: "2026-07-17T01:00:00.000Z",
    actor: "codex",
  } as Omit<ExecutionEpisodeEvent, "eventDigest" | "payload">;
  return Object.freeze({
    ...unsigned,
    payload,
    eventDigest: calculateExecutionEventDigest(unsigned),
  }) as PersistedExecutionEpisodeEvent;
}

function eventWithCustody(event: PersistedExecutionEpisodeEvent): PersistedExecutionEpisodeEvent {
  return Object.freeze({
    ...event,
    sourceCommit: SHA,
    observedHead: SHA,
    policyRevision: "policy:escape-v1",
    runtime: "codex",
    model: "test-model",
  });
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
