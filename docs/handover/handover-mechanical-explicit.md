# Handover Mechanical / Explicit Split

This document defines the handover split used by UT-TDD Agent Harness after A-137.

## 1. Mechanical Handover

Mechanical handover is machine-readable routing state.

Canonical locations:

- `.ut-tdd/handover/CURRENT.json`
- `.ut-tdd/handover/provider/CURRENT.json`
- `.ut-tdd/handover/provider/*.json`

Required properties:

- schema/version marker when the file has a schema
- `handover_kind: "mechanical"` for provider handover packages
- active plan
- runtime direction when provider-specific
- budget or execution note
- next action list
- relevant file list
- timestamp

Mechanical handover must not be the only place where nuanced engineering judgement is stored.

## 2. Explicit Handover

Explicit handover is human-readable judgement and narrative context.

Canonical location:

- `docs/handover/session-handover-*.md`

Required sections for provider-dispatch or cross-runtime handover:

- Mechanical Handover pointers
- Explicit Handover summary
- Work Completed
- Next Actions
- Carry
- Do Not Break

Explicit handover may cite mechanical handover files, but must be understandable without opening provider JSON.

## 3. Naming Rule

Do not use ambiguous wording such as "goal complete treatment" when the intended meaning is either:

- `goal_complete`: the goal itself is achieved and no required work remains.
- `completion_status`: the current status label of a plan, handover, or audit.

Use one of those concrete terms instead of mixed wording.

## 4. Verification

Provider handover tests must assert `handover_kind: "mechanical"`.

Handover review must verify:

- mechanical state exists and points at the active plan;
- explicit handover exists for human judgement;
- `Next Actions` do not claim completion while the active plan is still `in_progress`;
- no provider JSON is the sole source of a nuanced decision.
