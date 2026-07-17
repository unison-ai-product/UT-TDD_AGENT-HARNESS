import { describe, expect, it } from "vitest";
import {
  calculateExecutionEventDigest,
  decideExecutionTransition,
  executionCommandPayloadDigest,
  ExecutionEpisode,
  type ClassifyEscapeCommand,
  type ExecutionEpisodeEvent,
  type RequestForwardEscape,
  type RequestIssueProjectionCommand,
  type SelectDriveModelCommand,
} from "../../src/execution-ledger/domain/execution-episode.js";
import { projectExecutionEpisode } from "../../src/execution-ledger/application/episode-projector.js";

const SHA = "a".repeat(40);
const DIGEST = "b".repeat(64);

describe("Execution Episode pure projector (PLAN-L7-436)", () => {
  it.each([
    ["E0", initialEvents(), "issue_not_requested", ["classify_escape"]],
    ["E1", eventsThroughE1(), "drive_not_selected", ["select_drive_model"]],
    ["E2", eventsThroughE2(), "issue_not_requested", ["request_issue_projection"]],
    ["E3", eventsThroughE3(), "issue_projection_pending", ["confirm_issue_projection"]],
  ] as const)(
    "U-EXEP-009: %sのstate/actions/block reason/latestHeadをevent streamだけから導出する",
    (state, events, blockReason, nextLegalActions) => {
      const result = projectExecutionEpisode(events);

      expect(result).toMatchObject({
        ok: true,
        projection: {
          episodeId: "episode:recovery-70",
          state,
          eventSequence: Number(state.slice(1)),
          lastEventDigest: events.at(-1)?.eventDigest,
          nextLegalActions,
          blockReason,
          latestHead: SHA,
          driveModel: "recovery",
          reentryLayer: "L7",
          mergeReadiness: "blocked",
          rebuiltAt: events.at(-1)?.occurredAt,
        },
      });
    },
  );

  it("U-EXEP-009: projectionは入力event列を変更せず、同じ列を再投影すると決定論的に一致する", () => {
    const events = eventsThroughE3();
    const before = structuredClone(events);
    const first = projectExecutionEpisode(events);
    const replay = projectExecutionEpisode(structuredClone(events));

    expect(first).toEqual(replay);
    expect(events).toEqual(before);
  });

  it.each([
    ["empty stream", () => [] as readonly ExecutionEpisodeEvent[]],
    ["sequence gap", () => mutateEvent(eventsThroughE3(), 2, { sequence: 7 })],
    ["unknown state", () => mutateEvent(eventsThroughE3(), 2, { state: "E9" })],
    ["event digest tamper", () => mutateEvent(eventsThroughE3(), 2, { eventDigest: "f".repeat(64) })],
    [
      "root payload is not an escape payload",
      () => replacePayload(eventsThroughE3(), 0, { episodeId: "episode:recovery-70" }),
    ],
    [
      "root observed head is malformed",
      () =>
        replacePayload(eventsThroughE3(), 0, {
          ...eventsThroughE3()[0].payload as Record<string, unknown>,
          observedHead: "not-a-commit",
        }),
    ],
    [
      "root and transition episode identity diverge",
      () => replacePayload(eventsThroughE3(), 1, { episodeId: "episode:other" }),
    ],
  ] as const)("U-EXEP-009: malformed %sをfail-closeする", (_label, build) => {
    const result = projectExecutionEpisode(build());
    expect(result).toMatchObject({
      ok: false,
      violations: [
        {
          ruleId: expect.stringMatching(/^episode-/),
          path: expect.any(String),
        },
      ],
    });
  });
});

function initialEvents(): readonly ExecutionEpisodeEvent[] {
  const result = ExecutionEpisode.request(request());
  if (!result.ok || result.status !== "accepted") throw new Error("E0 fixture must pass");
  return result.events;
}

function eventsThroughE1(): readonly ExecutionEpisodeEvent[] {
  const e0 = initialEvents();
  const e1 = decideExecutionTransition(e0, classify());
  if (!e1.ok) throw new Error("E1 fixture must pass");
  return [...e0, ...e1.events];
}

function eventsThroughE2(): readonly ExecutionEpisodeEvent[] {
  const e1 = eventsThroughE1();
  const e2 = decideExecutionTransition(e1, selectDrive());
  if (!e2.ok) throw new Error("E2 fixture must pass");
  return [...e1, ...e2.events];
}

function eventsThroughE3(): readonly ExecutionEpisodeEvent[] {
  const e2 = eventsThroughE2();
  const e3 = decideExecutionTransition(e2, requestIssue());
  if (!e3.ok) throw new Error("E3 fixture must pass");
  return [...e2, ...e3.events];
}

function envelope<const TSequence extends 1 | 2 | 3>(sequence: TSequence) {
  return {
    commandId: `command:recovery-70:e${sequence}`,
    episodeId: "episode:recovery-70",
    expectedSequence: sequence,
    sourceCommit: SHA,
    observedHead: SHA,
    policyRevision: "policy:escape-v1",
    actor: "codex",
    occurredAt: `2026-07-16T08:3${sequence}:00.000Z`,
  };
}

function classify(): ClassifyEscapeCommand {
  return {
    type: "classify_escape",
    ...envelope(1),
    escapeType: "reopened",
    classificationRuleRevision: "escape-classification:v1",
    verificationTarget: {
      kind: "assumption",
      assetId: "plan:doctor-singleton",
      revision: 1,
      statementDigest: DIGEST,
    },
  };
}

function selectDrive(): SelectDriveModelCommand {
  return {
    type: "select_drive_model",
    ...envelope(2),
    model: "recovery",
    compatibilityResult: "compatible",
    rationaleDigest: DIGEST,
    selectionRevision: 1,
  };
}

function requestIssue(): RequestIssueProjectionCommand {
  return {
    type: "request_issue_projection",
    ...envelope(3),
    repository: "unison-ai-product/UT-TDD_AGENT-HARNESS",
    intentRevision: 1,
    labels: ["forward-escape", "drive:recovery"],
  };
}

function request(): RequestForwardEscape {
  return {
    type: "request_forward_escape",
    commandId: "command:recovery-70",
    episodeId: "episode:recovery-70",
    recurrenceId: "recurrence:doctor-slo",
    routeMode: "recovery",
    escapeType: "reopened",
    escapeReason: "full doctor exceeds the Recovery release floor",
    routeSignal: "regression_dev",
    requestedDriveModel: "recovery",
    origin: {
      assetId: "plan:doctor-singleton",
      revision: 1,
      observedRevision: 1,
      layer: "L7",
      state: "accepted",
    },
    reentry: {
      assetId: "plan:doctor-scoped-execution",
      revision: 1,
      layer: "L7",
      state: "implementing",
      policyRevision: "policy:forward-v1",
    },
    issue: {
      repository: "unison-ai-product/UT-TDD_AGENT-HARNESS",
      title: "Recovery: doctor full scope SLO",
      bodyDigest: DIGEST,
    },
    sourceCommit: SHA,
    observedHead: SHA,
    policyRevision: "policy:escape-v1",
    actor: "codex",
    occurredAt: "2026-07-16T08:30:00.000Z",
  };
}

function mutateEvent(
  events: readonly ExecutionEpisodeEvent[],
  index: number,
  patch: Partial<ExecutionEpisodeEvent>,
): readonly ExecutionEpisodeEvent[] {
  return events.map((event, current) => (current === index ? { ...event, ...patch } : event));
}

function replacePayload(
  events: readonly ExecutionEpisodeEvent[],
  index: number,
  payload: unknown,
): readonly ExecutionEpisodeEvent[] {
  return events.map((event, current) => {
    if (current !== index) return event;
    const payloadDigest = executionCommandPayloadDigest(payload);
    const unsigned = {
      episodeId: event.episodeId,
      sequence: event.sequence,
      state: event.state,
      kind: event.kind,
      payloadDigest,
      previousEventDigest: event.previousEventDigest,
      occurredAt: event.occurredAt,
      actor: event.actor,
    };
    return {
      ...event,
      payload,
      payloadDigest,
      eventDigest: calculateExecutionEventDigest(unsigned),
    };
  });
}
