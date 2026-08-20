import { describe, expect, it } from "vitest";
import { InMemoryForwardLedger } from "../../src/forward/adapters/in-memory-forward-ledger.ts";
import { InMemoryForwardProjection } from "../../src/forward/adapters/in-memory-forward-projection.ts";
import { ForwardEvidencePolicy } from "../../src/forward/application/forward-evidence-policy.ts";
import {
  type ForwardTransitionRequest,
  ForwardWorkflowApplication,
} from "../../src/forward/application/forward-workflow.ts";
import { eventDigest, reduceForward } from "../../src/forward/domain/reducer.ts";
import {
  FORWARD_EVENTS,
  FORWARD_STATES,
  type ForwardEventName,
  type ForwardState,
} from "../../src/forward/domain/transition-policy.ts";
import type { ForwardEvent } from "../../src/forward/domain/types.ts";
import { HmacEvidenceAttestationIssuer } from "../../src/plan-asset/adapters/hmac-evidence-attestation-authority.ts";
import {
  createRedactedCommandArgs,
  EvidenceRecord,
} from "../../src/plan-asset/domain/evidence-record.ts";
import { HmacEvidenceAttestationVerifier } from "../../src/plan-asset/kernel/hmac-evidence-attestation-verifier.ts";

const subject = {
  subjectId: "asset:344",
  subjectRevision: 1,
  sourceCommit: "a".repeat(40),
} as const;
const now = "2026-08-20T12:00:00.000Z";
const keyMaterial = [
  {
    version: "v1",
    secret: Buffer.alloc(32, 7),
    producers: ["human", "po", "codex", "claude", "ci"],
  },
] as const;
const issuer = new HmacEvidenceAttestationIssuer("forward-test", "v1", keyMaterial);
const verifier = new HmacEvidenceAttestationVerifier("forward-test", keyMaterial);

describe("Forward FSM", () => {
  it("U-FSM-001: derives every allowed edge from the single policy table and rejects closed-world gaps", () => {
    expect(FORWARD_STATES.length).toBe(17);
    expect(FORWARD_EVENTS.length).toBe(17);
    const app = createApp();
    const allowed = transitionRequests();
    for (const request of allowed) {
      const result = app.transition(request);
      expect(result.exitCode, request.event).toBe(0);
      expect(result.nextState, request.event).toBeDefined();
    }

    const illegal = app.transition({
      ...request("archive"),
      commandId: "command:archive-illegal",
      event: "archive",
      evidence: evidenceFor("archive"),
    });
    expect(illegal).toMatchObject({ exitCode: 1, ruleId: "forward-transition-illegal" });
    expect((app.ledger as InMemoryForwardLedger).appended).toHaveLength(12);
  });

  it("U-FSM-002: refuses skip, reverse, and terminal commands without changing state", () => {
    const app = createApp();
    const before = app.status(subject);
    const result = app.transition({
      ...request("begin-implementation"),
      evidence: evidenceFor("begin-implementation"),
    });
    expect(result).toMatchObject({ exitCode: 1, ruleId: "forward-transition-illegal" });
    expect(app.status(subject)).toEqual(before);

    const terminal = reduceForward(terminalEvents());
    expect(terminal).toMatchObject({ ok: true, state: "archived" });
    expect(reduceForward([...terminalEvents(), event("archived", "archive", 13)])).toMatchObject({
      ok: false,
      ruleId: "forward-transition-illegal",
    });
  });

  it("U-FSM-003: specialized implementation admission fails closed and emits no write", () => {
    const app = createApp();
    seedTo(app, "pair_frozen");
    const result = app.transition({ ...request("begin-implementation"), evidence: [] });
    expect(result).toMatchObject({ exitCode: 2, ruleId: "forward-red-evidence-missing" });
    expect((app.ledger as InMemoryForwardLedger).appended).toHaveLength(3);
    expect((app.projection as InMemoryForwardProjection).writes).toHaveLength(3);
  });

  it("U-FSM-004: trace-freeze evidence is required before review", () => {
    const app = createApp();
    seedTo(app, "implementation_complete");
    const result = app.transition({ ...request("prepare-review"), evidence: [] });
    expect(result).toMatchObject({ exitCode: 2, ruleId: "forward-trace-freeze-missing" });
    expect(app.status(subject).state).toBe("implementation_complete");
  });

  it("U-FSM-005: accept requires independent review and gate evidence", () => {
    const app = createApp();
    seedTo(app, "reviewed");
    const result = app.transition({ ...request("accept"), evidence: [] });
    expect(result).toMatchObject({ exitCode: 2, ruleId: "forward-accept-evidence-missing" });
    expect(app.status(subject).state).toBe("reviewed");
  });

  it("U-FSM-006: exception context is mandatory and no intent is emitted", () => {
    const app = createApp();
    const result = app.transition({ ...request("block"), evidence: [] });
    expect(result).toMatchObject({ exitCode: 2, ruleId: "forward-exception-context-missing" });
    expect((app.ledger as InMemoryForwardLedger).appended).toHaveLength(0);
    expect(app.externalIntents).toHaveLength(0);
  });

  it("U-FSM-007: replay is deterministic and projection is exactly once", () => {
    const app = createApp();
    const first = app.transition({ ...request("plan"), evidence: evidenceFor("plan") });
    const replay = app.transition({ ...request("plan"), evidence: evidenceFor("plan") });
    expect(replay).toMatchObject({
      exitCode: 0,
      verdict: "allow",
      ruleId: "forward-transition-replayed",
      state: "planned",
      nextState: "planned",
      digest: first.digest,
    });
    expect(app.status(subject).digest).toBe(first.digest);
    expect((app.projection as InMemoryForwardProjection).writes).toHaveLength(1);
    expect((app.ledger as InMemoryForwardLedger).appended).toHaveLength(1);
  });

  it("U-FSM-008: missing ledger/projection is unavailable and never falls back to frontmatter", () => {
    const app = new ForwardWorkflowApplication({
      ledger: new InMemoryForwardLedger({ unavailable: true }),
      projection: new InMemoryForwardProjection(),
      evidencePolicy: new ForwardEvidencePolicy(verifier),
      frontmatterStatus: "confirmed",
    });
    expect(app.status(subject)).toMatchObject({
      exitCode: 3,
      ruleId: "forward-ledger-unavailable",
    });
    expect(app.explain(subject, { event: "plan", evidence: [] })).toMatchObject({
      exitCode: 3,
      ruleId: "forward-ledger-unavailable",
    });
  });

  it("U-FSM-009: generic evidence uses one typed rule and expired evidence is not eligible", () => {
    const app = createApp();
    seedTo(app, "pair_frozen");
    const expired = evidenceFor("freeze-red", "2026-08-19T11:59:59.999Z");
    const result = app.transition({ ...request("freeze-red"), evidence: expired });
    expect(result).toMatchObject({ exitCode: 2, ruleId: "forward-evidence-missing" });
    expect(result.evidence.rejected).toHaveLength(1);
    expect((app.ledger as InMemoryForwardLedger).appended).toHaveLength(3);
  });

  it("P-FSM-001: generated sequences never reach an undeclared state and sequence faults fail closed", () => {
    for (let seed = 0; seed < 128; seed += 1) {
      const events = generatedSequence(seed);
      const result = reduceForward(events);
      if (result.ok) expect(FORWARD_STATES).toContain(result.state);
      else expect(result.exitCode).toBe(1);
    }
    expect(reduceForward([event("planned", "plan", 2)])).toMatchObject({
      ok: false,
      ruleId: "forward-sequence-invalid",
    });
  });
});

function createApp() {
  return new ForwardWorkflowApplication({
    ledger: new InMemoryForwardLedger(),
    projection: new InMemoryForwardProjection(),
    evidencePolicy: new ForwardEvidencePolicy(verifier),
  });
}

function request(eventName: ForwardEventName): ForwardTransitionRequest {
  return {
    ...subject,
    event: eventName,
    commandId: `command:${eventName}`,
    evidence: [],
    now,
    authorFamily: "codex",
  };
}

function transitionRequests(): ForwardTransitionRequest[] {
  const path: ForwardEventName[] = [
    "plan",
    "prepare-pair-freeze",
    "freeze-pair",
    "freeze-red",
    "begin-implementation",
    "complete-implementation",
    "prepare-trace-freeze",
    "freeze-trace",
    "prepare-review",
    "submit-review",
    "accept",
    "archive",
  ];
  return path.map((eventName) => ({ ...request(eventName), evidence: evidenceFor(eventName) }));
}

function seedTo(app: ForwardWorkflowApplication, target: ForwardState): void {
  const path: ForwardEventName[] = [
    "plan",
    "prepare-pair-freeze",
    "freeze-pair",
    "freeze-red",
    "begin-implementation",
    "complete-implementation",
    "prepare-trace-freeze",
    "freeze-trace",
    "prepare-review",
    "submit-review",
  ];
  for (const eventName of path) {
    const result = app.transition({ ...request(eventName), evidence: evidenceFor(eventName) });
    if (result.nextState === target) return;
  }
  if (target === "reviewed") return;
  throw new Error(`fixture did not reach ${target}`);
}

function evidenceFor(eventName: ForwardEventName, producedAt = now) {
  const kinds =
    {
      plan: ["scope-approval"],
      "prepare-pair-freeze": ["pair-artifact-declaration", "design-pair-review"],
      "freeze-pair": ["pair-artifact-declaration", "design-pair-review"],
      "freeze-red": ["red-test-run"],
      "begin-implementation": ["pair-artifact-declaration", "red-test-run"],
      "complete-implementation": ["implementation-digest", "targeted-test-run"],
      "prepare-trace-freeze": ["trace-materialization"],
      "freeze-trace": ["trace-closure", "green-test-run"],
      "prepare-review": ["trace-closure", "green-test-run"],
      "submit-review": ["independent-review"],
      accept: ["independent-review", "gate-run"],
      archive: ["acceptance-decision", "retention-decision"],
      block: ["exception-context"],
      supersede: ["exception-context"],
      reject: ["exception-context"],
      reopen: ["exception-context"],
      resume: ["exception-context"],
    }[eventName] ?? [];
  return kinds.map((kind, index) => {
    const claims = claimsFor(kind, eventName);
    const created = EvidenceRecord.create(
      {
        evidenceId: `evidence:${eventName}:${index}`,
        evidenceKind: kind as never,
        subjectId: subject.subjectId,
        subjectRevision: subject.subjectRevision,
        sourceCommit: subject.sourceCommit,
        commandArgs: createRedactedCommandArgs(["test", eventName]),
        claims: claims as never,
        outputDigest: "b".repeat(64),
        exitCode: kind === "red-test-run" ? 1 : 0,
        producer:
          kind === "scope-approval" ||
          kind === "acceptance-decision" ||
          kind === "retention-decision"
            ? "po"
            : kind === "design-pair-review" || kind === "independent-review"
              ? "claude"
              : kind === "pair-artifact-declaration" ||
                  kind === "implementation-digest" ||
                  kind === "exception-context"
                ? "codex"
                : "ci",
        producedAt,
      },
      issuer,
    );
    if (!created.ok) throw new Error(created.error.ruleId);
    return created.value;
  });
}

function claimsFor(kind: string, eventName: ForwardEventName): unknown {
  switch (kind) {
    case "scope-approval":
      return { decision: "approved", approver: "po" };
    case "pair-artifact-declaration":
      return { artifactIds: ["design", "test"] };
    case "design-pair-review":
      return { verdict: "approved", reviewerId: "reviewer" };
    case "red-test-run":
      return {
        expectedFindingIds: ["red"],
        observedFindingIds: ["red"],
        todoCount: 0,
        skipCount: 0,
      };
    case "targeted-test-run":
    case "green-test-run":
      return { runnerId: "vitest", testIds: ["U-FSM-001"] };
    case "implementation-digest":
      return { implementationDigest: "c".repeat(64) };
    case "trace-materialization":
      return { traceIds: ["trace:344"] };
    case "trace-closure":
      return { orphanCount: 0, staleCount: 0, traceDigest: "d".repeat(64) };
    case "independent-review":
      return { verdict: "approved", reviewerId: "claude", reviewedAt: now };
    case "gate-run":
      return { gateIds: ["G5"], failedGateIds: [] };
    case "acceptance-decision":
      return { decision: "accepted", decidedBy: "po" };
    case "retention-decision":
      return { decision: "archive", decidedBy: "po" };
    case "exception-context":
      return { action: eventName, actor: "po", reason: "fixture reason", resumeState: "planned" };
    default:
      return {};
  }
}

function event(
  state: ForwardState,
  eventName: ForwardEventName,
  sequence: number,
  fromState?: ForwardState,
): ForwardEvent {
  const withoutDigest = {
    eventId: `event:${sequence}`,
    commandId: `command:${sequence}`,
    subjectId: subject.subjectId,
    subjectRevision: subject.subjectRevision,
    sourceCommit: subject.sourceCommit,
    sequence,
    event: eventName,
    fromState:
      fromState ??
      (eventName === "archive" ? "accepted" : state === "planned" ? "proposed" : state),
    toState: state,
    evidenceIds: [],
    payloadDigest: "e".repeat(64),
  } satisfies Omit<ForwardEvent, "digest">;
  return {
    ...withoutDigest,
    digest: eventDigest(withoutDigest),
  };
}

function terminalEvents(): ForwardEvent[] {
  const path: readonly [ForwardState, ForwardEventName, ForwardState][] = [
    ["planned", "plan", "proposed"],
    ["pair_freeze_ready", "prepare-pair-freeze", "planned"],
    ["pair_frozen", "freeze-pair", "pair_freeze_ready"],
    ["red_frozen", "freeze-red", "pair_frozen"],
    ["implementing", "begin-implementation", "red_frozen"],
    ["implementation_complete", "complete-implementation", "implementing"],
    ["trace_freeze_ready", "prepare-trace-freeze", "implementation_complete"],
    ["trace_frozen", "freeze-trace", "trace_freeze_ready"],
    ["review_ready", "prepare-review", "trace_frozen"],
    ["reviewed", "submit-review", "review_ready"],
    ["accepted", "accept", "reviewed"],
    ["archived", "archive", "accepted"],
  ];
  return path.map(([state, eventName, fromState], index) =>
    event(state, eventName, index + 1, fromState),
  );
}

function generatedSequence(seed: number): ForwardEvent[] {
  const names = FORWARD_EVENTS;
  const count = seed % 8;
  return Array.from({ length: count }, (_, index) =>
    event("proposed", names[(seed + index) % names.length], index + 1),
  );
}
