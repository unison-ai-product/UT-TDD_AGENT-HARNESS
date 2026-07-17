import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  calculateExecutionEventDigest,
  canonicalizeExecutionPayload,
  type ExecutionEpisodeEvent,
} from "../../src/execution-ledger/domain/execution-episode.js";
import {
  APPEND_COMMAND_RECEIPT_COLUMNS,
  DRIVE_MODEL_SELECTION_COLUMNS,
  EXECUTION_EPISODE_ROOT_COLUMNS,
  EXECUTION_EPISODE_EVENT_COLUMNS,
  EXECUTION_EPISODE_PROJECTION_COLUMNS,
  GITHUB_PROJECTION_OUTBOX_COLUMNS,
  decodeAppendCommandReceiptRow,
  decodeDriveSelectionRow,
  decodeExecutionEpisodeEventRow,
  decodeExecutionEpisodeRootRow,
  decodeExecutionEpisodeProjectionRow,
  decodeIssueProjectionRow,
  insertSql,
  mapAppendCommandReceiptToRow,
  mapDriveSelectionToRow,
  mapExecutionEpisodeProjectionToRow,
  mapExecutionEpisodeEventToRow,
  mapExecutionEpisodeRootToRow,
  mapIssueProjectionToRow,
  rowValues,
  type PersistedExecutionEpisodeEvent,
} from "../../src/execution-ledger/adapters/sqlite/episode-row-mapper.js";
import type {
  DriveSelectionIntent,
  EscapeObservedPayload,
  IssueProjectionIntent,
} from "../../src/execution-ledger/domain/execution-episode.js";
import type { ExecutionEpisodeProjection } from "../../src/execution-ledger/application/episode-projector.js";

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
    ["source_commit missing", { source_commit: null }],
    ["event digest", { event_digest: "d".repeat(64) }],
  ] as const)("%s改変をfail-closeする", (_label, mutation) => {
    const row = mapExecutionEpisodeEventToRow(fixtureEvent(), {
      runtime: "codex",
      model: "test-model",
    });
    expect(decodeExecutionEpisodeEventRow({ ...row, ...mutation })).toBeUndefined();
  });

  it("selection/outbox/projection/receiptをnamed rowへ写像し、列順を固定する", () => {
    const selection = mapDriveSelectionToRow({
      episodeId: "episode:row-mapper",
      selectionRevision: 1,
      selectedEventSequence: 2,
      model: "recovery",
      compatibilityResult: "compatible",
      rationaleDigest: "b".repeat(64),
      overrideUsed: false,
      overrideActor: null,
      overrideReason: null,
      overrideEvidenceDigest: null,
      selectedAt: "2026-07-17T01:00:00.000Z",
      selectionDigest: "c".repeat(64),
    } satisfies DriveSelectionIntent);
    const outbox = mapIssueProjectionToRow({
      outboxId: "outbox:row-mapper",
      episodeId: "episode:row-mapper",
      sourceEventSequence: 3,
      operationKind: "create",
      objectKind: "issue",
      repository: "unison-ai-product/UT-TDD_AGENT-HARNESS",
      targetLogicalKey: "episode:row-mapper:issue",
      intentRevision: 1,
      idempotencyKey: "d".repeat(64),
      payloadVersion: 1,
      canonicalPayloadJson: "{}",
      payloadDigest: "e".repeat(64),
      status: "pending",
      attemptCount: 0,
      nextAttemptAt: "2026-07-17T01:00:00.000Z",
      createdAt: "2026-07-17T01:00:00.000Z",
    } satisfies IssueProjectionIntent);
    const projection = mapExecutionEpisodeProjectionToRow({
      episodeId: "episode:row-mapper",
      state: "E3",
      eventSequence: 3,
      lastEventDigest: "f".repeat(64),
      nextLegalActions: ["confirm_issue_projection"],
      blockReason: "issue_projection_pending",
      latestHead: SHA,
      mergeReadiness: "blocked",
      driveModel: "recovery",
      reentryLayer: "L7",
      rebuiltAt: "2026-07-17T01:00:00.000Z",
    } satisfies ExecutionEpisodeProjection);
    const receipt = mapAppendCommandReceiptToRow(
      {
        command_id: "command:row-mapper",
        command_type: "execution_episode.request_escape",
        subject_kind: "execution_episode",
        subject_key: "episode:row-mapper",
        plan_asset_id: null,
        plan_revision: null,
        command_payload_digest: COMMAND_DIGEST,
        result_kind: "episode_event",
        result_ref: "event:row-mapper",
        recorded_at: "2026-07-17T01:00:00.000Z",
      },
      "1".repeat(64),
    );

    expect(Object.keys(selection)).toEqual([...DRIVE_MODEL_SELECTION_COLUMNS]);
    expect(Object.keys(outbox)).toEqual([...GITHUB_PROJECTION_OUTBOX_COLUMNS]);
    expect(Object.keys(projection)).toEqual([...EXECUTION_EPISODE_PROJECTION_COLUMNS]);
    expect(Object.keys(receipt)).toEqual([...APPEND_COMMAND_RECEIPT_COLUMNS]);
    expect(selection.override_used).toBe(0);
    expect(outbox.lease_owner).toBeNull();
    expect(projection.next_legal_actions_json).toBe('["confirm_issue_projection"]');
    expect(rowValues(EXECUTION_EPISODE_EVENT_COLUMNS, mapExecutionEpisodeEventToRow(fixtureEvent(), {
      runtime: "codex",
      model: "test-model",
    }))).toHaveLength(EXECUTION_EPISODE_EVENT_COLUMNS.length);
    expect(insertSql("drive_model_selections", DRIVE_MODEL_SELECTION_COLUMNS)).toContain(
      "INSERT INTO drive_model_selections (episode_id, selection_revision",
    );
  });

  it("root rowをschema列順へ写像し、strict decoderで往復する", () => {
    const payload = rootPayload();
    const row = mapExecutionEpisodeRootToRow(payload, "2026-07-17T01:00:00.000Z");

    expect(Object.keys(row)).toEqual([...EXECUTION_EPISODE_ROOT_COLUMNS]);
    expect(rowValues(EXECUTION_EPISODE_ROOT_COLUMNS, row)).toHaveLength(
      EXECUTION_EPISODE_ROOT_COLUMNS.length,
    );
    expect(decodeExecutionEpisodeRootRow(row)).toEqual({
      episodeId: payload.episodeId,
      recurrenceId: payload.recurrenceId,
      originAssetId: payload.origin.assetId,
      originRevision: payload.origin.revision,
      originLayer: payload.origin.layer,
      originState: payload.origin.state,
      escapeType: payload.escapeType,
      escapeReason: payload.escapeReason,
      driveModel: payload.requestedDriveModel,
      reentryAssetId: payload.reentry?.assetId,
      reentryRevision: payload.reentry?.revision,
      reentryLayer: payload.reentry?.layer,
      reentryState: payload.reentry?.state,
      reentryPolicyRevision: payload.reentry?.policyRevision,
      issueRepository: payload.issue.repository,
      issueTitle: payload.issue.title,
      issueBodyDigest: payload.issue.bodyDigest,
      sourceCommit: payload.sourceCommit,
      observedHead: payload.observedHead,
      policyRevision: payload.policyRevision,
      actor: payload.actor,
      createdAt: "2026-07-17T01:00:00.000Z",
    });
  });

  it.each([
    ["episode id", { episode_id: "wrong" }],
    ["origin revision", { origin_revision: 0 }],
    ["layer", { origin_layer: "L15" }],
    ["escape type", { escape_type: "unknown" }],
    ["drive model", { drive_model: "forward" }],
    ["body digest", { issue_body_digest: "not-a-digest" }],
    ["source commit", { source_commit: "not-a-commit" }],
    ["created at", { created_at: "2026-07-17T01:00:00Z" }],
  ] as const)("root rowの%s改変をfail-closeする", (_label, mutation) => {
    const row = mapExecutionEpisodeRootToRow(rootPayload(), "2026-07-17T01:00:00.000Z");
    expect(decodeExecutionEpisodeRootRow({ ...row, ...mutation })).toBeUndefined();
  });

  it("domainが許可するsha256 prefix付きissue digestをroot rowでも保持する", () => {
    const payload = rootPayload();
    const prefixed = {
      ...payload,
      issue: { ...payload.issue, bodyDigest: `sha256:${payload.issue.bodyDigest}` },
    } satisfies EscapeObservedPayload;
    const row = mapExecutionEpisodeRootToRow(prefixed, "2026-07-17T01:00:00.000Z");

    expect(decodeExecutionEpisodeRootRow(row)?.issueBodyDigest).toBe(
      `sha256:${payload.issue.bodyDigest}`,
    );
  });

  it("typed fromRow decoderはcanonical/digest/nullable/identityをfail-closeする", () => {
    const selection = mapDriveSelectionToRow(selectionFixture());
    const outbox = mapIssueProjectionToRow(outboxFixture());
    const projection = mapExecutionEpisodeProjectionToRow(projectionFixture());
    const receiptBase = {
      command_id: "command:row-mapper",
      command_type: "execution_episode.request_escape",
      subject_kind: "execution_episode" as const,
      subject_key: "episode:row-mapper",
      plan_asset_id: null,
      plan_revision: null,
      command_payload_digest: COMMAND_DIGEST,
      result_kind: "episode_event" as const,
      result_ref: "event:row-mapper",
      recorded_at: "2026-07-17T01:00:00.000Z",
    };
    const receipt = mapAppendCommandReceiptToRow(receiptBase, sha256(JSON.stringify(Object.entries(receiptBase).sort())));

    expect(decodeDriveSelectionRow(selection)).toBeDefined();
    expect(decodeIssueProjectionRow(outbox)).toBeDefined();
    expect(decodeExecutionEpisodeProjectionRow(projection)).toBeDefined();
    expect(decodeAppendCommandReceiptRow(receipt)).toBeDefined();
    expect(decodeDriveSelectionRow({ ...selection, override_used: 2 })).toBeUndefined();
    expect(decodeDriveSelectionRow({ ...selection, selection_digest: "0".repeat(64) })).toBeUndefined();
    expect(decodeIssueProjectionRow({ ...outbox, status: "unknown" })).toBeUndefined();
    expect(decodeIssueProjectionRow({ ...outbox, outbox_id: "outbox:wrong" })).toBeUndefined();
    expect(
      decodeIssueProjectionRow({
        ...outbox,
        status: "acknowledged",
        attempt_count: 1,
        ack_observation_id: "observation:github:1",
        last_attempt_at: "2026-07-17T01:01:00.000Z",
      }),
    ).toBeDefined();
    expect(
      decodeIssueProjectionRow({
        ...outbox,
        status: "leased",
        attempt_count: 1,
        lease_owner: "worker:1",
        lease_expires_at: null,
      }),
    ).toBeUndefined();
    expect(
      decodeIssueProjectionRow({
        ...outbox,
        status: "acknowledged",
        attempt_count: 1,
        ack_observation_id: null,
        last_attempt_at: "2026-07-17T01:01:00.000Z",
      }),
    ).toBeUndefined();
    expect(decodeExecutionEpisodeProjectionRow({ ...projection, next_legal_actions_json: "not-json" })).toBeUndefined();
    expect(decodeAppendCommandReceiptRow({ ...receipt, receipt_digest: "0".repeat(64) })).toBeUndefined();
  });
});

function selectionFixture(): DriveSelectionIntent {
  const value = {
    episodeId: "episode:row-mapper",
    selectionRevision: 1,
    selectedEventSequence: 2 as const,
    model: "recovery" as const,
    compatibilityResult: "compatible" as const,
    rationaleDigest: "b".repeat(64),
    overrideUsed: false,
    overrideActor: null,
    overrideReason: null,
    overrideEvidenceDigest: null,
    selectedAt: "2026-07-17T01:00:00.000Z",
  };
  return { ...value, selectionDigest: sha256(canonicalizeExecutionPayload(value)) };
}

function rootPayload(): EscapeObservedPayload {
  return {
    episodeId: "episode:row-root",
    recurrenceId: "recurrence:row-root",
    routeMode: "recovery",
    escapeType: "blocked",
    escapeReason: "fixture",
    routeSignal: "regression_dev",
    requestedDriveModel: "recovery",
    origin: {
      assetId: "PLAN-L7-436-execution-ledger-episode-domain",
      revision: 1,
      observedRevision: 1,
      layer: "L7",
      state: "forward",
    },
    reentry: {
      assetId: "PLAN-L7-436-execution-ledger-episode-domain",
      revision: 1,
      layer: "L7",
      state: "forward",
      policyRevision: "policy:escape-v1",
    },
    issue: {
      repository: "unison-ai-product/UT-TDD_AGENT-HARNESS",
      title: "root row fixture",
      bodyDigest: "c".repeat(64),
    },
    sourceCommit: SHA,
    observedHead: SHA,
    policyRevision: "policy:escape-v1",
    actor: "codex",
  };
}

function outboxFixture(): IssueProjectionIntent {
  const payload = {
    schema: "github.issue.intent.v1",
    episodeId: "episode:row-mapper",
    repository: "unison-ai-product/UT-TDD_AGENT-HARNESS",
  };
  const canonicalPayloadJson = canonicalizeExecutionPayload(payload);
  const idempotencyKey = "d".repeat(64);
  return {
    outboxId: `outbox:${sha256(`github-outbox-id:v1\0${idempotencyKey}`).slice(0, 32)}`,
    episodeId: "episode:row-mapper",
    sourceEventSequence: 3,
    operationKind: "create",
    objectKind: "issue",
    repository: "unison-ai-product/UT-TDD_AGENT-HARNESS",
    targetLogicalKey: "episode:row-mapper:issue",
    intentRevision: 1,
    idempotencyKey,
    payloadVersion: 1,
    canonicalPayloadJson,
    payloadDigest: sha256(canonicalPayloadJson),
    status: "pending",
    attemptCount: 0,
    nextAttemptAt: "2026-07-17T01:00:00.000Z",
    createdAt: "2026-07-17T01:00:00.000Z",
  };
}

function projectionFixture(): ExecutionEpisodeProjection {
  return {
    episodeId: "episode:row-mapper",
    state: "E3",
    eventSequence: 3,
    lastEventDigest: "f".repeat(64),
    nextLegalActions: ["confirm_issue_projection"],
    blockReason: "issue_projection_pending",
    latestHead: SHA,
    mergeReadiness: "blocked",
    driveModel: "recovery",
    reentryLayer: "L7",
    rebuiltAt: "2026-07-17T01:00:00.000Z",
  };
}

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
