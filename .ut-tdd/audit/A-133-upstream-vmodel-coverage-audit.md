# A-133 Upstream V-model Coverage Audit

Date: 2026-06-12
Scope: L1/L3 functional requirements, L4-L6 design, test-design, roadmap/PLAN inventory, L7 implementation plans, source, tests, and coverage gates.

## Conclusion

The current repo now has row-level closure for the feature-list residuals that originally caused the L7 overclaim.

`doctor` passes both registered-roadmap checks and feature-list closure checks: `fr-roadmap-coverage` closes R1-R9, `drive-model-passage` closes the 9-mode passage certificate table, `drive-db-registration` closes current DB projection registration, `plan-dod` blocks unchecked completed L7 work, and `placeholder-deps` blocks active L7 waiting placeholders.

The original overclaim came from treating `PLAN-L7-44-harness-db-master` completion as "all L7 complete". That is corrected: `PLAN-L7-44` remains the harness.db segment, while `PLAN-L7-50` and `PLAN-L7-51` are the residual closure / doctor precision completion records.

## Absolute No-Omission Principle

This audit adopts an absolute no-omission principle:

- Any upstream requirement, carry item, addendum, design contract, oracle, PLAN span, source module, or test that is not represented in the closure table is treated as `gap`, not as implicitly covered.
- `carry` is not completion. It is only a routed obligation and must resolve to `scheduled`, `parked with reason`, or `PO decision`.
- `doctor green` is insufficient for full completion unless the relevant row-level closure table is also green.
- A segment completion statement must name the segment. Unqualified phrases such as "L7 complete" are forbidden unless the full feature-list closure table is green.
- New L7 implementation work must not start unless its row has requirement, design, test-design, WBS, source target, test target, and coverage gate columns filled or explicitly marked `N/A` with reason.
- Handover must not say "no next action" while any row is `gap`, `scheduled`, `parked`, or `PO decision`.

## Why The Work Was Not Scheduled

| Finding | Evidence | Why it happened | Impact | Countermeasure |
|---|---|---|---|---|
| L7 completion wording was too broad | handover said no next action after `PLAN-L7-44`; `PLAN-L7-44` itself says harness.db segment | "L7" was used both for the layer and for one roadmap segment | Remaining FR/carry work can be hidden behind a green doctor line | Correct handover wording and require residual-carry audit before `handover --complete` |
| Feature-list residuals were not expanded into a new WBS | L3 functional says 26 L3 FR; L1 has 47 FR; several P1/P2/Phase B/A-124..126 items are carry | `g3-trace` accepts "L3 FR or carry" as coverage, but carry is not the same as scheduled implementation | Functional completeness can be overstated | Add `PLAN-L3-04-upstream-schedule-reconciliation` and residual matrix |
| Roadmap rollup is registered-roadmap coverage, not FR coverage | `doctor` shows roadmap-rollup green | Program bands measure roadmap blocks that exist, not all upstream FR obligations | Green roadmap can coexist with unscheduled FR extensions | Implemented `fr-roadmap-coverage`: FR-L1/carry/addenda residuals must map to PLAN/WBS/source/test/gate evidence or explicit non-closed status |
| V-model checks are strong but fragmented | pair-freeze, l6-fr-coverage, impl-plan-trace, oracle-test-trace, dependency-drift all pass | Each check owns one edge, not the full row from requirement to code coverage | Humans cannot inspect closure in one table | Maintain a single V-model closure table per residual bucket |

## V-model Closure Check

Legend: `Closed` means current machine checks cover this edge for the row-level residual closure scope. Non-current / historical future work must remain in its own PLAN and cannot be silently counted as complete.

| Layer / artifact | Scope this repo can show | Current evidence | Status | Closure condition |
|---|---|---|---|---|
| L1 requirement definition | `FR-L1` registry 47 items and upstream baton notes | `g3-trace` + `fr-roadmap-coverage` | Closed | FR/carry/addenda residuals must map to closed R1-R9 rows or an explicit non-closed status |
| L3 requirement definition | 26 L3 FR plus explicit P1/P2/Phase B carry | `docs/design/harness/L3-functional/functional-requirements.md`; `doctor l6-fr-coverage`; `fr-roadmap-coverage` | Closed | Residual carry buckets are represented by `PLAN-L7-50` WBS rows |
| L4 basic design | architecture/module boundaries and system concepts | `pair-freeze`, `module-drift`, L4 roadmap, A-133 residual rows | Closed | Unscheduled extensions must be surfaced by `fr-roadmap-coverage`, not inferred |
| L5 detailed design | D-DB/D-CONTRACT/D-STATE and physical-data extensions | L5 roadmap, L8 integration test design, PLAN-L5-08 references, `drive-db-registration` | Closed | A-124/A-125/A-126 residual implementation evidence is represented in R7-R9 |
| L6 function design | unit-level contracts and U-* oracle mapping | `l6-fr-coverage - OK (FR registry 47...)` | Closed for declared L6 matrix | Closure is FR-to-L6/U-*; it does not by itself prove implementation shipped |
| Test design | L7 unit, L8 integration, L9 system test docs paired | `vmodel lint` pair-freeze 38 pair / orphan 0; `PLAN-L7-50` R10/R11 closes explicit L7 defer discharge | Closed | Explicit defer rows must remain linked to PLAN/L7 source/test evidence and checked by L6/impl/oracle trace gates |
| L7 plan groups | confirmed/completed L7 PLAN files plus residual closure plans | `plan-dod`, `fr-roadmap-coverage`, `roadmap-rollup`, `impl-plan-trace` | Closed | Completed/confirmed L7 PLANs cannot keep unchecked DoD or missing residual evidence |
| Code | `src` modules mapped to PLAN generates and architecture | `impl-plan-trace`, `module-drift`, `dependency-drift` | Closed | New source without PLAN coverage is fail-closed |
| Tests | Vitest tests cite oracle IDs; regression expansion maps source to tests | `oracle-test-trace`, `ddd-tdd-rules`, `dependency-drift` | Closed for current declared oracles | No coverage percentage threshold is configured; coverage is trace/substance, not Istanbul line coverage |
| Roadmap / WBS | Registered roadmaps and residual closure WBS | `roadmap-rollup 5/5`, `program-coverage OK`, `fr-roadmap-coverage - OK` | Closed | Registered-band and feature-list residual coverage are both checked |

## Residual Feature Buckets

| Bucket | Upstream source | Current route | V-model state | Required next artifact | Status |
|---|---|---|---|---|---|
| R1 Learning / observability | FR-L1-19/20 | Phase B / L4 carry | L1/L5 references exist; L7 feedback/search metrics implemented | PLAN-L7-50 WBS-L7-50-R1 closes learning/observability metrics | `closed` |
| R2 FE / W-gate workflow | FR-L1-21/22/28 | L4 carry | Upstream requirement known; L7 readiness gate implemented | PLAN-L7-50 WBS-L7-50-R2 closes readiness/W-gate workflow evidence | `closed` |
| R3 P2 readiness and infra | FR-L1-31-35 | L4/Phase B carry | Known P2; guardrail/issue queue evidence implemented | PLAN-L7-50 WBS-L7-50-R3 closes P2 readiness/infra routing | `closed` |
| R4 model/drive/onboarding/provider | FR-L1-37/39/40/41/42/44 | L4 carry / Phase B | Runtime provider handover and drive-skill injection tests exist | PLAN-L7-50 WBS-L7-50-R4 closes provider/model/drive concern | `closed` |
| R5 internal assets | FR-L1-46-49 | L4-L6 carry; asset-drift/catalog slices implemented | L7 asset catalog and asset drift tests exist | PLAN-L7-50 WBS-L7-50-R5 closes roster/skill/command asset residuals | `closed` |
| R6 DDD/TDD strictness | FR-L1-50 | L6-L8 add-feature carry; lint slices implemented | DDD/TDD hardening lint and tests exist | PLAN-L7-50 WBS-L7-50-R6 closes hardening matrix evidence | `closed` |
| R7 relation graph | A-124 addendum | L6/L7 plans 32/36 and projection support | Relation graph lint and tests exist | PLAN-L7-50 WBS-L7-50-R7 closes relation graph residual matrix link | `closed` |
| R8 external verification/MCP | A-125 addendum | L7-33/34 slices implemented | Tool adapter and verification profile tests exist | PLAN-L7-50 WBS-L7-50-R8 closes must-tool versus insight-only profile gate | `closed` |
| R9 document export | A-126 addendum | L7-35 implemented slice | Document export lint and tests exist | PLAN-L7-50 WBS-L7-50-R9 closes export derivative and non-SSOT guard | `closed` |

## Residual Feature Closure Evidence

| Bucket | PLAN / WBS | L7 source | test file / oracle citation | coverage gate | Status |
|---|---|---|---|---|---|
| R1 | docs/plans/PLAN-L7-50-feature-list-residual-closure.md#WBS-L7-50-R1 | src/feedback/engine.ts | tests/search-feedback.test.ts | doctor fr-roadmap-coverage + npm test | `closed` |
| R2 | docs/plans/PLAN-L7-50-feature-list-residual-closure.md#WBS-L7-50-R2 | src/workflow/readiness.ts | tests/readiness-guardrail.test.ts | doctor fr-roadmap-coverage + npm test | `closed` |
| R3 | docs/plans/PLAN-L7-50-feature-list-residual-closure.md#WBS-L7-50-R3 | src/guardrail/ledger.ts | tests/issue-queue.test.ts | doctor fr-roadmap-coverage + npm test | `closed` |
| R4 | docs/plans/PLAN-L7-50-feature-list-residual-closure.md#WBS-L7-50-R4 | src/runtime/provider-handover.ts | tests/provider-handover.test.ts | doctor fr-roadmap-coverage + npm test | `closed` |
| R5 | docs/plans/PLAN-L7-50-feature-list-residual-closure.md#WBS-L7-50-R5 | src/assets/catalog.ts | tests/asset-catalog.test.ts | doctor fr-roadmap-coverage + npm test | `closed` |
| R6 | docs/plans/PLAN-L7-50-feature-list-residual-closure.md#WBS-L7-50-R6 | src/lint/ddd-tdd-rules.ts | tests/ddd-tdd-rules.test.ts | doctor fr-roadmap-coverage + npm test | `closed` |
| R7 | docs/plans/PLAN-L7-50-feature-list-residual-closure.md#WBS-L7-50-R7 | src/lint/relation-graph.ts | tests/relation-graph.test.ts | doctor fr-roadmap-coverage + npm test | `closed` |
| R8 | docs/plans/PLAN-L7-50-feature-list-residual-closure.md#WBS-L7-50-R8 | src/lint/tool-adapter.ts | tests/tool-adapter.test.ts | doctor fr-roadmap-coverage + npm test | `closed` |
| R9 | docs/plans/PLAN-L7-50-feature-list-residual-closure.md#WBS-L7-50-R9 | src/export/document-export.ts | tests/document-export.test.ts | doctor fr-roadmap-coverage + npm test | `closed` |

## Required Table Shape

| Column | Purpose |
|---|---|
| `FR-L1 / BR / addendum` | Requirement-definition range |
| `L3 FR / carry reason` | Requirement-definition status |
| `L4 basic design doc` | Basic-design range |
| `L5 detailed design doc` | Detailed-design range |
| `L6 function contract` | Functional-design range |
| `test-design oracle` | Test-design range |
| `PLAN / roadmap span` | Schedule/WBS range |
| `L7 source` | Implementation evidence |
| `test file / oracle citation` | Test evidence |
| `coverage gate` | Machine check that proves the row |
| `status` | `closed`, `scheduled`, `parked`, or `gap` |

Because this table now exists and is checked by `fr-roadmap-coverage`, unqualified `L7 complete` is allowed only when the A-133 residual rows and `PLAN-L7-50` / `PLAN-L7-51` gates are green.

## Drive-model Passage Certificate

This is the required certificate table for closing a non-Forward drive model back into the Forward spine. The table is intentionally separate from `drive` in PLAN frontmatter: `drive` means specialist axis (`be` / `fe` / `fullstack` / `db` / `agent`), while the rows below are drive-model / entry-mode rows.

| Drive model / entry mode | Trigger | Required exit evidence | Forward re-entry | Certificate row must prove | Current state |
|---|---|---|---|---|---|
| Discovery | `requirement_undefined`, `feasibility_unknown`, `design_uncertain` | S3 verification result, S4 decision, rejected/pivot backlog if not confirmed | L1 or L3-L6, normally followed by Reverse if evidence must be promoted | hypothesis, evidence, decision, target Forward layer, residual gaps | Consolidated in `PLAN-L3-04` Section 2.1; `drive-model-passage` hard gate checks the row |
| Scrum | `user_feedback_iteration`, `requirement_continuous_refinement` | increment evidence, S4 acceptance, Reverse fullback route | L1/L3/L4/L5 via Reverse fullback | accepted increment, observed contracts, test-design state, Forward routing | Consolidated in `PLAN-L3-04` Section 2.1 and enforced by `scrum-reverse` + `drive-model-passage` |
| Reverse | `drift`, Discovery endpoint, Scrum increment, fullback | R0-R4 outputs, R3 PO validation, R4 `forward_routing`, test-design state | `L1` / `L3` / `L4` / `L5` / `gap-only` | evidence map, observed contracts, as-is design, intent, missing pair artifacts, re-entry gate | Consolidated in `PLAN-L3-04` Section 2.1; row requires R4 routing and re-entry gate |
| Recovery | `agent_runaway`, `context_exhaustion`, `regression_dev`, `forced_stop` | root cause, reopen point, top-down correction, recurrence-prevention action | interrupted Forward layer; recurrence-prevention to L14 | event class, approved scope, reopen point, correction artifact, recurrence guard/test/rule | Consolidated in `PLAN-L3-04` Section 2.1; row requires recurrence-prevention guard/test/rule |
| Incident | `production_incident`, `hotfix_required`, `regression_prod` | triage, hotfix evidence, recovery plan, postmortem | L12/L13 for stabilization; permanent fix through Reverse to L1-L6; postmortem to L14 | production impact, approvals, hotfix, verification, permanent route, postmortem | Defined; no current incident row in this audit scope |
| Refactor | `debt_degradation`, `code_smell`, `structural` | behavior-preserving test evidence, affected design unchanged or explicit escalation | L7 internal closure; if behavior changes, route to Add-feature/Reverse | unchanged behavior proof, test green, no requirement/design delta, or escalation | Defined; conditional back-fill only, not a full passage certificate |
| Retrofit | `dependency_outdated`, `upgrade`, `config_drift` | impact matrix, migration plan, regression/perf/data-integrity evidence | L7, or L4/L5 for architecture/DB changes, or L1/L3 for requirement changes | impact scope, rollback, migration evidence, changed design/requirement route | Defined; conditional back-fill only |
| Add-feature | `feature_addition`, `scope_extension` | parent PLAN, add-design/add-impl split, tests, V-model trace, Reverse back-fill when bottom-up | existing parent PLAN; route B holds G7 trace until Reverse/G3 closure | parent, requirement/design/test row, WBS, implementation target, Reverse back-fill state, residual status | Consolidated in `PLAN-L3-04` Section 2.1; R1-R9 residuals are closed by `PLAN-L7-50` |
| Research | `tech_decision_required`, `option_comparison_needed`, `adr_required` | ADR, research memo, explicit Forward connection | L1 or L4 decision input; Discovery if feasibility remains unknown | decision options, selected ADR, rejected options, Forward target, next action | Consolidated in `PLAN-L3-04` Section 2.1; unresolved feasibility must switch to Discovery |

Passage rule: a drive-model row is not allowed to close with only mode-local evidence. It must either re-enter Forward with a named layer/gate and table row, or remain `gap`, `parked`, or `PO decision`.

## Drive-model DB Registration Check

Current answer: automatic for the current projection scope, and hard-gated by `ut-tdd doctor`.

The database schema already contains the intended projection tables:

| Table | Intended role | Current projection evidence after `db rebuild` |
|---|---|---|
| `drive_runs` | one row per drive-model / entry-mode execution lane | nonzero rows; `drive-db-registration` requires every `plan_registry` row to have a projected drive run |
| `workflow_runs` | workflow phase readiness rows | nonzero rows; `drive-db-registration` requires all rows to link to `drive_runs.drive_run_id` |
| `hook_events` | session / hook event projection | registered hook rows must join `plan_registry`; legacy orphan hook rows are surfaced as `legacy_hook_orphans` |
| `model_runs` | Codex / Claude / worker / reviewer execution evidence | nonzero rows; `drive-db-registration` requires all rows to join `plan_registry` |
| `plan_registry` | PLAN frontmatter registry | nonzero rows; registry is the join denominator for drive/model/skill registration |
| `roadmap_gate_progress` | registered roadmap gate progress | `20` rows |
| `workflow_runs` -> `drive_runs` join | workflow rows with registered drive lane | all current workflow rows join; orphan count must be `0` |
| `skill_recommendations` / `skill_invocations` | skill suggestion and accepted firing projection | nonzero rows; all current rows must join `plan_registry` |

This proves that harness.db now projects documented PLAN drive lanes, session hook evidence, review model evidence, skill recommendation/invocation evidence, and workflow slices during `db rebuild`. The previous zero-row projection gap and the previous doctor blind spot are closed by `src/lint/drive-db-registration.ts`.

Required DB passage rule: every current drive/model/workflow/skill registration row must have either:

- a `drive_runs.drive_run_id` linked to `workflow_runs.drive_run_id`, plus applicable `model_runs.plan_id`, `skill_recommendations.plan_id`, and `skill_invocations.plan_id` resolving to `plan_registry`; or
- a non-closed status (`gap`, `parked`, or `PO decision`) explaining why DB registration is not present.

Doctor enforcement: `drive-model-passage - OK` proves the 9-mode passage certificate table shape; `drive-db-registration - OK` proves the current DB projection has drive/workflow/model/skill registration evidence and resolvable joins.

## Rule Automation Closure Check

Current answer: every rule introduced by this audit is now either automated or kept visible through an automated non-closed status.

| Rule family | Current automation state | Evidence | Closure status |
|---|---|---|---|
| PLAN schedule shape | Automated | `ut-tdd doctor` -> `plan-schedule - OK` | Closed for current PLAN section shape |
| V-model pair freeze | Automated | `ut-tdd vmodel lint`, doctor `pair-freeze` | Closed for document pair links |
| Review evidence / test-before-review | Automated hard gate | doctor `review-evidence - OK` | Closed for confirmed design/impl PLAN review evidence |
| Back-fill pairing | Automated with visible conditional note | doctor `backfill` + `runDoctor.ok` wiring; conditional contract change remains surfaced | Closed for current set |
| Scrum/Discovery -> Reverse | Automated for confirmed `poc` | doctor `scrum-reverse - OK` | Closed for current confirmed poc set |
| Roadmap/program coverage | Automated for registered roadmap bands and residual feature rows | doctor `roadmap-rollup`, `program-coverage`, `fr-roadmap-coverage` | Closed |
| FR/carry/addendum -> WBS/L7 coverage | Table analyzer/checker automated | `fr-roadmap-coverage - OK (checked=1, buckets=9, closure=9)` | Closed for residual table completeness and L7 implementation evidence |
| Drive-model passage certificate | Table analyzer/checker automated | `drive-model-passage - OK (checked=1, modes=9, expected=9)` | Closed for table completeness |
| Drive-model DB registration | Automated for rebuild projection and doctor hard gate | `drive-db-registration - OK` after rebuild; checks `drive_runs`, `workflow_runs`, `model_runs`, `skill_recommendations`, `skill_invocations`, and registered hook joins | Closed for current projection scope |
| Handover "no next action" against residual gaps | Automated against CURRENT.json latest handover doc | `checkHandoverCompletionWording` warns when residual rows are non-closed and latest_doc says no next action | Closed for current residual table |
| Source -> PLAN / oracle -> test trace | Automated hard gate | doctor `impl-plan-trace`, `oracle-test-trace` | Closed |
| Coding / DDD-TDD / asset drift / module drift | Automated | doctor checks and test suites | Closed for current rule scope |
| Missing/ambiguous row fail-close | Automated in residual/checker analyzers | `fr-roadmap-coverage` rejects missing R1-R9 rows and unknown status | Closed for residual bucket table |

Rule closure rule: a policy is not considered "laid down" for completion purposes until it has an owner mechanism: `doctor`, `plan lint`, `vmodel lint`, hook guard, DB projection check, or CI test. Text-only rules remain `gap` or `scheduled`.

## Fail-close Rule

The default status for a missing or unclear row is `gap`. The burden of proof is on the row to demonstrate closure through evidence. If evidence is absent, stale, or only implied by another green check, the row remains non-closed.
