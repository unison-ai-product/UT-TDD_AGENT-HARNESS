import { describe, expect, it } from "vitest";
import {
  classifyForwardBoundary,
  ExecutionEpisode,
  type RequestForwardEscape,
  reduceExecutionEpisode,
  reconstructExecutionEpisode,
} from "../../src/execution-ledger/domain/execution-episode.js";

const SHA = "a".repeat(40);
const DIGEST = "b".repeat(64);

function request(overrides: Partial<RequestForwardEscape> = {}): RequestForwardEscape {
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
    ...overrides,
  };
}

describe("ExecutionEpisode domain (PLAN-L7-436)", () => {
  it("U-EXEP-001: 通常Forwardはepisodeを生成せずForward escapeだけがE0を生成する", () => {
    expect(classifyForwardBoundary({ routeMode: "forward", escapeType: null })).toEqual({
      kind: "inside_forward",
      requiresEpisode: false,
    });

    const inside = ExecutionEpisode.request(request({ routeMode: "forward" }));
    expect(inside).toMatchObject({
      ok: false,
      violations: [{ ruleId: "episode-forward-boundary-inside" }],
    });

    const escaped = ExecutionEpisode.request(request());
    expect(escaped).toMatchObject({
      ok: true,
      status: "accepted",
      events: [{ sequence: 0, state: "E0", kind: "escape_observed" }],
      outbox: [],
    });
  });

  it.each([
    "",
    "unknown",
    "be",
    "fe",
    "fullstack",
    "db",
    "agent",
    "normal",
  ])("U-EXEP-002: drive_model=%sをE0生成前にfail-closeする", (requestedDriveModel) => {
    const result = ExecutionEpisode.request(
      request({
        requestedDriveModel: requestedDriveModel as RequestForwardEscape["requestedDriveModel"],
      }),
    );
    expect(result).toMatchObject({
      ok: false,
      violations: [{ ruleId: "episode-drive-model-invalid" }],
    });
  });

  it("U-EXEP-002: route modeとdrive modelの不一致をE0生成前に拒否する", () => {
    expect(ExecutionEpisode.request(request({ routeMode: "reverse" }))).toMatchObject({
      ok: false,
      violations: [{ ruleId: "episode-route-drive-mismatch" }],
    });
  });

  it("U-EXEP-005: 同一command/payloadをreplayし、同一commandの異payloadを拒否する", () => {
    const created = ExecutionEpisode.request(request());
    if (!created.ok || created.status !== "accepted") throw new Error("fixture must create E0");

    expect(created.episode.decide(request())).toMatchObject({
      ok: true,
      status: "replayed",
      eventIds: [created.events[0].eventId],
    });
    expect(
      created.episode.decide(request({ escapeReason: "caller changed the payload" })),
    ).toMatchObject({
      ok: false,
      violations: [{ ruleId: "episode-command-payload-conflict" }],
    });
    expect(created.episode.snapshot).toMatchObject({ state: "E0", eventSequence: 0 });
  });

  it.each([
    [
      "stale origin",
      { origin: { ...request().origin, observedRevision: 2 } },
      "episode-origin-stale",
    ],
    ["missing reentry", { reentry: undefined }, "episode-reentry-required"],
    [
      "override without rationale",
      { override: { actor: "po", reason: "", evidenceDigest: DIGEST } },
      "episode-override-evidence-invalid",
    ],
  ] as const)("U-EXEP-010: %sを副作用前に拒否する", (_label, patch, ruleId) => {
    const result = ExecutionEpisode.request(request(patch as Partial<RequestForwardEscape>));
    expect(result).toMatchObject({ ok: false, violations: [{ ruleId }] });
  });

  it("U-EXEP-006: E0 event JSONだけからorigin/drive/reentryを無損失再構築する", () => {
    const created = ExecutionEpisode.request(request());
    if (!created.ok || created.status !== "accepted") throw new Error("fixture must create E0");
    const roundTripped = JSON.parse(JSON.stringify(created.events)) as typeof created.events;

    expect(reconstructExecutionEpisode(roundTripped)).toMatchObject({
      ok: true,
      value: {
        episodeId: "episode:recovery-70",
        recurrenceId: "recurrence:doctor-slo",
        state: "E0",
        requestedDriveModel: "recovery",
        origin: request().origin,
        reentry: request().reentry,
        sourceCommit: SHA,
        observedHead: SHA,
        policyRevision: "policy:escape-v1",
      },
    });
    expect(reduceExecutionEpisode(roundTripped)).toMatchObject({
      ok: true,
      snapshot: {
        state: "E0",
        eventSequence: 0,
        lastEventDigest: created.events[0].eventDigest,
        nextLegalCommands: ["classify_escape"],
      },
    });
  });

  it("U-EXEP-002: canonical redesign signalを受理し未知route/signal不一致を拒否する", () => {
    expect(
      ExecutionEpisode.request(
        request({
          commandId: "command:redesign-1",
          episodeId: "episode:redesign-1",
          routeMode: "redesign",
          routeSignal: "design_revision",
          requestedDriveModel: "redesign" as RequestForwardEscape["requestedDriveModel"],
        }),
      ),
    ).toMatchObject({ ok: true, status: "accepted" });
    expect(classifyForwardBoundary({ routeMode: "invented", escapeType: "reopened" })).toEqual({
      kind: "invalid",
      requiresEpisode: false,
    });
    expect(ExecutionEpisode.request(request({ routeSignal: "regression_prod" }))).toMatchObject({
      ok: false,
      violations: [{ ruleId: "episode-route-signal-mismatch" }],
    });
  });

  it.each([
    ["blank command", { commandId: "" }, "episode-command-id-invalid"],
    ["blank episode", { episodeId: "" }, "episode-id-invalid"],
    [
      "invalid revision",
      { origin: { ...request().origin, revision: 0, observedRevision: 0 } },
      "episode-origin-invalid",
    ],
    ["short source SHA", { sourceCommit: "a".repeat(39) }, "episode-source-commit-invalid"],
    [
      "invalid issue digest",
      { issue: { ...request().issue, bodyDigest: "b".repeat(63) } },
      "episode-issue-invalid",
    ],
    ["invalid time", { occurredAt: "not-a-time" }, "episode-occurred-at-invalid"],
  ] as const)("U-EXEP-010: %sをstructured violationへ変換する", (_label, patch, ruleId) => {
    expect(ExecutionEpisode.request(request(patch as Partial<RequestForwardEscape>))).toMatchObject(
      {
        ok: false,
        violations: [{ ruleId }],
      },
    );
  });

  it("U-EXEP-010: secret-like raw textをevent payloadへ入れず拒否する", () => {
    expect(
      ExecutionEpisode.request(request({ escapeReason: `token ghp_${"x".repeat(20)}` })),
    ).toMatchObject({
      ok: false,
      violations: [{ ruleId: "episode-sensitive-input-forbidden" }],
    });
  });
});
