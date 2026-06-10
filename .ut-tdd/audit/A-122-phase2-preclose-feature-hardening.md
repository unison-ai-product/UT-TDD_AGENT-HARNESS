# A-122 Phase2 Pre-Close Feature Hardening

Date: 2026-06-09
Gate: Phase 2 full review / GATE-A PO accept preparation
Reviewer: Codex TL
Scope: automation, UT database projection, shared/common lens, multi-agent coordination lens

**Verdict: PASS with routed design hardening.** Phase 2 can still be treated as full-review PASS / PO accept pending, but the following feature-strengthening items must remain explicit carry. They are not current L4-L6 blockers because the design surface exists; they are Phase 3/4 implementation and hardening inputs.

## 1. Automation gaps before close

| ID | Gap | Why it matters | Routed ticket |
|---|---|---|---|
| A122-AUTO-01 | `placeholder_deps` dedicated rule is not implemented. | Current doctor green must not be read as proof that all deferred pair artifacts are fail-closed. | IMP-107 |
| A122-AUTO-02 | Green definition is timestamp-only. | Qualitative review can prove ordering, but not which quantitative command profile was green. | IMP-108 |
| A122-AUTO-03 | DB collector/rebuild/migration is not planned at implementation granularity. | Phase 4 needs `bun:sqlite`, schema versioning, deterministic rebuild, and doctor integration from day one. | IMP-110 |
| A122-AUTO-04 | CI evidence is not normalized by OS/shell/hook. | Windows PowerShell, Bash, Bun, and hook smoke evidence cannot be compared as one green profile. | IMP-114 |

## 2. UT database projection

The current DB design can already support:

- PLAN / artifact / model run / trace / finding / gate projection.
- skill recommendation and invocation metrics.
- workflow readiness and guardrail decision queries.
- search over docs/state/log references.

After the A-122 additions, DB projection is designed to support:

- `test_cases`: which U-* oracle proves which PLAN / FR / artifact.
- `test_runs`: which Bun/vitest/doctor/lint command produced a green or non-green result.
- `test_results`: per-case pass/fail/skip/todo and duration history.
- `test_artifact_edges`: test-to-design trace without overloading core trace edges.
- `test_flake_events`: flake and duration regression signals.
- `green_definition_compliance`: whether review evidence points to the exact command profile required by the artifact change.

This answers the PO question: with DB化, the current functional design can support "which tests prove this design, when they last passed, whether they are flaky, whether review happened after the right green profile, and what workflow/agent/skill context produced the evidence." It still cannot store raw provider transcripts or secrets; those stay outside DB by design.

## 3. Shared/common lens

| ID | Gap | Routed ticket |
|---|---|---|
| A122-COMMON-01 | relation graph / dependency-drift / regression impact is still future, so changed imports cannot yet choose required tests/review scope. | IMP-111 |
| A122-COMMON-02 | skill catalog / recommender / injector tables exist in design but are not connected to real inventory and acceptance metrics. | IMP-112 |
| A122-COMMON-03 | guardrail/security decisions are designed as projection rows but need explicit secret/PII redaction and human-required downgrade invariants in implementation. | IMP-115 |
| A122-COMMON-04 | claims/meta-audit artifacts are not yet a clean taxonomy, so A-117/A-118 style audits are harder to trace as first-class work. | IMP-116 |

## 4. Multi-agent coordination lens

| ID | Gap | Routed ticket |
|---|---|---|
| A122-MULTI-01 | `ut-tdd team run` still validates definitions but does not execute actual delegation lifecycle. | IMP-104 / IMP-113 |
| A122-MULTI-02 | drive recruitment (`resolveDriveStatePartition` / `classifyDrive`) remains L7 carry. | IMP-104 / IMP-113 |
| A122-MULTI-03 | cross-runtime absence fallback is checked locally, but not queryable as a full run with member lifecycle and review boundary evidence. | IMP-113 |

## 5. Design changes made in this audit

- `docs/improvement-backlog.md`: added IMP-107 through IMP-116.
- `docs/design/harness/L5-detailed-design/physical-data.md`: added §9.4 UT evidence history projection.
- `docs/design/harness/L6-function-design/test-before-review.md`: added GreenDefinition schema and DbC.
- `docs/design/harness/L6-function-design/function-spec.md`: added `recordTestRunEvidence`, `evaluateGreenDefinition`, and `computeUtHistorySignals`.

## 6. Close criteria interpretation

Phase 2 close remains valid if PO accepts carry, because:

- The gaps are now explicit tickets, not hidden unknowns.
- L4-L6 design has been strengthened to describe the future DB/automation capability.
- No gap found here contradicts ADR-001 Bun/TypeScript, non-HELIX-runtime dependency, or the DB-as-projection rule.

Phase 3/4 should start with IMP-107, IMP-108, IMP-109, and IMP-110 because they convert the current qualitative/quantitative bundle into mechanically replayable evidence.

## 7. Back-Propagation Closure

A-123 reclassified the A-122 lower-layer additions as `requires_requirement_backprop`, not local L5/L6 carry. The UT evidence history, GreenDefinition, DB projection implementation profile, and CI/hook/OS evidence matrix were back-propagated into requirements v1.2, L1 functional requirements, and L3 functional requirements as extensions of existing FR-L1 bundles. Future lower-L discoveries must follow requirements §6.8.8 before Phase/PLAN completion is claimed.
