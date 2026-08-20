import type {
  EvidenceClaimsRule,
  EvidenceExitRule,
  EvidenceKind,
  EvidenceProducer,
} from "../../plan-asset/domain/evidence-types.ts";

export const FORWARD_STATES = [
  "proposed",
  "planned",
  "pair_freeze_ready",
  "pair_frozen",
  "red_frozen",
  "implementing",
  "implementation_complete",
  "trace_freeze_ready",
  "trace_frozen",
  "review_ready",
  "reviewed",
  "accepted",
  "archived",
  "blocked",
  "superseded",
  "rejected",
  "reopened",
] as const;
export type ForwardState = (typeof FORWARD_STATES)[number];

export const FORWARD_EVENTS = [
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
  "block",
  "supersede",
  "reject",
  "reopen",
  "resume",
] as const;
export type ForwardEventName = (typeof FORWARD_EVENTS)[number];

export interface EvidenceRequirementSpec {
  readonly requirementId: string;
  readonly requiredKind: EvidenceKind;
  readonly acceptedProducers: readonly EvidenceProducer[];
  readonly exitRule: EvidenceExitRule;
  readonly claimsRule: EvidenceClaimsRule;
  readonly maxAgeMs?: number;
}

export interface TransitionSpec {
  readonly event: ForwardEventName;
  readonly from: readonly ForwardState[];
  readonly to: ForwardState;
  readonly evidence: readonly EvidenceRequirementSpec[];
  readonly missingRule: string;
}

const exactZero = { kind: "exact", expected: 0 } as const;
const redExit = { kind: "nonzero" } as const;
const day = 24 * 60 * 60 * 1000;
const normalStates = FORWARD_STATES.slice(0, 13);

export const TRANSITION_POLICY: readonly TransitionSpec[] = Object.freeze([
  spec("plan", ["proposed"], "planned", [
    requirement("scope", "scope-approval", ["po", "human"], { kind: "recorded" }),
  ]),
  spec("prepare-pair-freeze", ["planned"], "pair_freeze_ready", [
    pair("pair-artifact"),
    review("design-pair-review"),
  ]),
  spec("freeze-pair", ["pair_freeze_ready"], "pair_frozen", [
    pair("pair-artifact"),
    review("design-pair-review"),
  ]),
  spec("freeze-red", ["pair_frozen"], "red_frozen", [red("red")]),
  spec(
    "begin-implementation",
    ["red_frozen"],
    "implementing",
    [pair("pair-artifact"), red("red")],
    "forward-red-evidence-missing",
  ),
  spec("complete-implementation", ["implementing"], "implementation_complete", [
    implementation("implementation"),
    test("targeted", "targeted-test-run"),
  ]),
  spec("prepare-trace-freeze", ["implementation_complete"], "trace_freeze_ready", [
    trace("trace-materialization"),
  ]),
  spec("freeze-trace", ["trace_freeze_ready"], "trace_frozen", [
    trace("trace-closure"),
    test("green", "green-test-run"),
  ]),
  spec(
    "prepare-review",
    ["trace_frozen"],
    "review_ready",
    [trace("trace-closure"), test("green", "green-test-run")],
    "forward-trace-freeze-missing",
  ),
  spec("submit-review", ["review_ready"], "reviewed", [review("independent-review")]),
  spec(
    "accept",
    ["reviewed"],
    "accepted",
    [review("independent-review"), test("gate", "gate-run")],
    "forward-accept-evidence-missing",
  ),
  spec("archive", ["accepted"], "archived", [
    decision("acceptance", "acceptance-decision"),
    decision("retention", "retention-decision"),
  ]),
  spec(
    "block",
    normalStates.filter((state) => state !== "accepted" && state !== "archived"),
    "blocked",
    [exception()],
    "forward-exception-context-missing",
  ),
  spec(
    "supersede",
    normalStates.filter((state) => state !== "archived"),
    "superseded",
    [exception()],
    "forward-exception-context-missing",
  ),
  spec(
    "reject",
    ["review_ready", "reviewed"],
    "rejected",
    [exception()],
    "forward-exception-context-missing",
  ),
  spec(
    "reopen",
    ["blocked", "superseded", "rejected"],
    "reopened",
    [exception()],
    "forward-exception-context-missing",
  ),
  spec("resume", ["reopened"], "planned", [exception()], "forward-exception-context-missing"),
]);

export function transitionFor(event: ForwardEventName): TransitionSpec | undefined {
  return TRANSITION_POLICY.find((candidate) => candidate.event === event);
}

export function edgeFor(state: ForwardState, event: ForwardEventName): TransitionSpec | undefined {
  const candidate = transitionFor(event);
  return candidate?.from.includes(state) ? candidate : undefined;
}

function spec(
  event: ForwardEventName,
  from: readonly ForwardState[],
  to: ForwardState,
  evidence: readonly EvidenceRequirementSpec[],
  missingRule = "forward-evidence-missing",
): TransitionSpec {
  return Object.freeze({
    event,
    from: Object.freeze([...from]),
    to,
    evidence: Object.freeze([...evidence]),
    missingRule,
  });
}
function requirement(
  requirementId: string,
  requiredKind: EvidenceKind,
  acceptedProducers: readonly EvidenceProducer[],
  claimsRule: EvidenceClaimsRule,
  exitRule: EvidenceExitRule = exactZero,
  maxAgeMs?: number,
): EvidenceRequirementSpec {
  return {
    requirementId,
    requiredKind,
    acceptedProducers,
    claimsRule,
    exitRule,
    ...(maxAgeMs ? { maxAgeMs } : {}),
  };
}
function pair(id: string): EvidenceRequirementSpec {
  return requirement(id, "pair-artifact-declaration", ["codex", "claude", "human"], {
    kind: "recorded",
  });
}
function review(kind: "design-pair-review" | "independent-review"): EvidenceRequirementSpec {
  return requirement(kind, kind, ["codex", "claude"], { kind: "review-approved" });
}
function red(id: string): EvidenceRequirementSpec {
  return requirement(
    id,
    "red-test-run",
    ["codex", "claude", "ci"],
    { kind: "red-observed" },
    redExit,
    day,
  );
}
function test(
  id: string,
  kind: "targeted-test-run" | "green-test-run" | "gate-run",
): EvidenceRequirementSpec {
  return requirement(
    id,
    kind,
    kind === "gate-run" || kind === "green-test-run" ? ["ci"] : ["codex", "claude", "ci"],
    kind === "gate-run" ? { kind: "gate-passed" } : { kind: "recorded" },
    exactZero,
    day,
  );
}
function implementation(id: string): EvidenceRequirementSpec {
  return requirement(id, "implementation-digest", ["codex", "claude"], { kind: "recorded" });
}
function trace(kind: "trace-materialization" | "trace-closure"): EvidenceRequirementSpec {
  return requirement(
    kind,
    kind,
    ["codex", "claude", "ci"],
    kind === "trace-closure" ? { kind: "trace-clean" } : { kind: "recorded" },
    exactZero,
    kind === "trace-closure" ? day : undefined,
  );
}
function decision(
  id: string,
  kind: "acceptance-decision" | "retention-decision",
): EvidenceRequirementSpec {
  return requirement(id, kind, ["po", "human"], {
    kind: "decision",
    expected: kind === "acceptance-decision" ? "accepted" : "archive",
  });
}
function exception(): EvidenceRequirementSpec {
  return requirement("exception", "exception-context", ["po", "human", "codex", "claude"], {
    kind: "recorded",
  });
}
