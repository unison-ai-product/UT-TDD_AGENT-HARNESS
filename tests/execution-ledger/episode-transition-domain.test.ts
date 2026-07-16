import { describe, expect, it } from "vitest";
import {
  decideExecutionTransition,
  ExecutionEpisode,
  type ClassifyEscapeCommand,
  type RequestForwardEscape,
  type RequestIssueProjectionCommand,
  type SelectDriveModelCommand,
} from "../../src/execution-ledger/domain/execution-episode.js";

const SHA = "a".repeat(40);
const DIGEST = "b".repeat(64);

describe("Execution Episode E1-E3 domain decisions (PLAN-L7-436)", () => {
  it("U-EXEP-003: E1分類→E2駆動選択→E3 Issue intentを唯一遷移表どおり生成する", () => {
    const e0 = initialEvents();
    const e1 = decideExecutionTransition(e0, classify());
    expect(e1).toMatchObject({
      ok: true,
      events: [{ sequence: 1, state: "E1", kind: "escape_classified" }],
      selections: [],
      outbox: [],
    });
    if (!e1.ok) throw new Error("E1 fixture must pass");

    const e2 = decideExecutionTransition([...e0, ...e1.events], selectDrive());
    expect(e2).toMatchObject({
      ok: true,
      events: [{ sequence: 2, state: "E2", kind: "drive_selected" }],
      selections: [
        {
          episodeId: "episode:recovery-70",
          selectionRevision: 1,
          selectedEventSequence: 2,
          model: "recovery",
          overrideUsed: false,
        },
      ],
      outbox: [],
    });
    if (!e2.ok) throw new Error("E2 fixture must pass");

    const e3 = decideExecutionTransition([...e0, ...e1.events, ...e2.events], requestIssue());
    expect(e3).toMatchObject({
      ok: true,
      events: [{ sequence: 3, state: "E3", kind: "issue_requested" }],
      selections: [],
      outbox: [
        {
          episodeId: "episode:recovery-70",
          sourceEventSequence: 3,
          operationKind: "create",
          objectKind: "issue",
          repository: "unison-ai-product/UT-TDD_AGENT-HARNESS",
          intentRevision: 1,
          status: "pending",
          attemptCount: 0,
        },
      ],
    });
    if (!e3.ok) throw new Error("E3 fixture must pass");
    expect(e3.events[0].payload).toMatchObject({
      targetLogicalKey: "episode:episode:recovery-70:issue",
      idempotencyKey: e3.outbox[0]?.idempotencyKey,
      projectionPayloadDigest: e3.outbox[0]?.payloadDigest,
    });
  });

  it.each([
    ["E3 flyover", initialEvents(), requestIssue(), "episode-transition-invalid"],
    [
      "escape mismatch",
      initialEvents(),
      classify({ escapeType: "blocked" }),
      "episode-escape-classification-mismatch",
    ],
    [
      "drive mismatch",
      eventsThroughE1(),
      selectDrive({ model: "reverse" }),
      "episode-drive-selection-mismatch",
    ],
    [
      "repository mismatch",
      eventsThroughE2(),
      requestIssue({ repository: "other/repository" }),
      "episode-issue-repository-mismatch",
    ],
  ] as const)("U-EXEP-003: %sを副作用値生成前に拒否する", (_label, events, command, ruleId) => {
    expect(decideExecutionTransition(events, command)).toMatchObject({
      ok: false,
      violations: [{ ruleId }],
    });
  });

  it("U-EXEP-010: E2 override_requiredは完全なhuman evidenceだけを受理する", () => {
    expect(
      decideExecutionTransition(
        eventsThroughE1(),
        selectDrive({ compatibilityResult: "override_required" }),
      ),
    ).toMatchObject({
      ok: false,
      violations: [{ ruleId: "episode-drive-override-required" }],
    });
    expect(
      decideExecutionTransition(
        eventsThroughE1(),
        selectDrive({
          compatibilityResult: "override_required",
          override: { actor: "po", reason: "approved exception", evidenceDigest: DIGEST },
        }),
      ),
    ).toMatchObject({ ok: true, selections: [{ overrideUsed: true }] });
  });

  it("U-EXEP-003: decisionは入力を凍結せず、出力write-setを深く不変にする", () => {
    const command = classify();
    const target = command.verificationTarget;
    const decision = decideExecutionTransition(initialEvents(), command);
    expect(decision).toMatchObject({ ok: true });
    expect(Object.isFrozen(command)).toBe(false);
    expect(Object.isFrozen(target)).toBe(false);
    if (!decision.ok) throw new Error("E1 fixture must pass");
    expect(Object.isFrozen(decision.events)).toBe(true);
    expect(Object.isFrozen(decision.events[0].payload)).toBe(true);
    expect(Object.isFrozen(decision.selections)).toBe(true);
    expect(Object.isFrozen(decision.outbox)).toBe(true);
  });

  it.each([
    ["source commit", { sourceCommit: "c".repeat(40) }],
    ["observed HEAD", { observedHead: "c".repeat(40) }],
    ["policy revision", { policyRevision: "policy:other" }],
  ] as const)("U-EXEP-003: %sのcustody driftを拒否する", (_label, override) => {
    expect(decideExecutionTransition(initialEvents(), classify(override))).toMatchObject({
      ok: false,
      violations: [{ ruleId: "episode-custody-continuity-invalid" }],
    });
  });

  it("U-EXEP-003: E1検証対象をorigin/re-entry資産へ束縛する", () => {
    expect(
      decideExecutionTransition(
        initialEvents(),
        classify({
          verificationTarget: {
            kind: "decision",
            assetId: "plan:unrelated",
            revision: 1,
            statementDigest: DIGEST,
          },
        }),
      ),
    ).toMatchObject({
      ok: false,
      violations: [{ ruleId: "episode-verification-target-unbound" }],
    });
  });

  it.each([[""], [" forward-escape"], ["forward-escape", "forward-escape"]] as const)(
    "U-EXEP-003: 不正なIssue label集合を拒否する",
    (...labels) => {
      expect(
        decideExecutionTransition(eventsThroughE2(), requestIssue({ labels })),
      ).toMatchObject({
        ok: false,
        violations: [{ ruleId: "episode-issue-projection-invalid" }],
      });
    },
  );
});

function initialEvents() {
  const result = ExecutionEpisode.request(request());
  if (!result.ok || result.status !== "accepted") throw new Error("E0 fixture must pass");
  return result.events;
}

function eventsThroughE1() {
  const e0 = initialEvents();
  const e1 = decideExecutionTransition(e0, classify());
  if (!e1.ok) throw new Error("E1 fixture must pass");
  return [...e0, ...e1.events];
}

function eventsThroughE2() {
  const e1 = eventsThroughE1();
  const e2 = decideExecutionTransition(e1, selectDrive());
  if (!e2.ok) throw new Error("E2 fixture must pass");
  return [...e1, ...e2.events];
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

function classify(overrides: Partial<ClassifyEscapeCommand> = {}): ClassifyEscapeCommand {
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
    ...overrides,
  };
}

function selectDrive(overrides: Partial<SelectDriveModelCommand> = {}): SelectDriveModelCommand {
  return {
    type: "select_drive_model",
    ...envelope(2),
    model: "recovery",
    compatibilityResult: "compatible",
    rationaleDigest: DIGEST,
    selectionRevision: 1,
    ...overrides,
  };
}

function requestIssue(
  overrides: Partial<RequestIssueProjectionCommand> = {},
): RequestIssueProjectionCommand {
  return {
    type: "request_issue_projection",
    ...envelope(3),
    repository: "unison-ai-product/UT-TDD_AGENT-HARNESS",
    intentRevision: 1,
    labels: ["forward-escape", "drive:recovery"],
    ...overrides,
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
