---
plan_id: PLAN-L3-04-upstream-schedule-reconciliation
title: "PLAN-L3-04: upstream FR residual schedule reconciliation"
kind: add-design
layer: L3
drive: fullstack
status: confirmed
created: 2026-06-12
updated: 2026-06-22
review_evidence:
  - reviewer: PM (Opus) verification (intra_runtime_subagent)
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: pass
    scope: "add-design 増分 (upstream FR residual → V-model closure table + 9-mode drive-model passage certificate + rule-automation-closure 表) の status drift (src merge 済なのに draft 放置) を解消し confirmed 化。成果物 src/lint/{rule-automation-closure,drive-model-passage,fr-roadmap-coverage}.ts + src/handover/index.ts は 2026-06-12 (239cb32) で merge 済。機械再検証: ①4 src module 全実在 ②doctor に配線 load-bearing (rule-automation-closure / drive-model-passage / fr-roadmap-coverage 各 doctor refs ≥3) ③§2.3 rule-automation-closure 表は全 5 行 closed (automation owner 実在) ④Vitest 787/787 green / doctor EXIT=0。AC §4 (A-133 audit 実在 / drive-model passage 9 mode / DB registration gate / rule automation owner) は merged + wired + tested で充足。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-opus-4-8
agent_slots:
  - role: tl
    slot_label: "TL - upstream FR residual to V-model WBS reconciliation"
generates:
  - artifact_path: docs/plans/PLAN-L3-04-upstream-schedule-reconciliation.md
    artifact_type: markdown_doc
  - artifact_path: .ut-tdd/audit/A-133-upstream-vmodel-coverage-audit.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/rule-automation-closure.ts
    artifact_type: source_module
  - artifact_path: src/lint/drive-model-passage.ts
    artifact_type: source_module
  - artifact_path: src/lint/fr-roadmap-coverage.ts
    artifact_type: source_module
  - artifact_path: src/handover/index.ts
    artifact_type: source_module
dependencies:
  parent: docs/plans/PLAN-L3-00-master.md
  requires:
    - docs/design/harness/L1-requirements/functional-requirements.md
    - docs/design/harness/L3-functional/functional-requirements.md
    - docs/design/harness/L3-functional/roadmap.md
    - docs/plans/PLAN-L7-44-harness-db-master.md
    - .ut-tdd/audit/A-133-upstream-vmodel-coverage-audit.md
  blocks:
    - docs/plans/PLAN-L7-50-fr-roadmap-coverage-lint.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L3-04: upstream FR residual schedule reconciliation

## §0 Objective

Correct the scope error where a completed L7 segment was read as all-L7 completion. This PLAN converts upstream residual requirements into a V-model closure table and child implementation WBS candidates.

This is an L3 schedule/design correction. It does not authorize new L7 source work by itself.

## §0.1 Absolute No-Omission Principle

This PLAN uses an absolute no-omission principle.

- Missing row = `gap`.
- Ambiguous row = `gap`.
- Carry-only row = not complete.
- Registered-roadmap green = not feature-list green.
- Segment completion must name the segment.
- No L7 implementation start unless the row has requirement, basic design, detailed design, function design, test design, WBS, source target, test target, and coverage gate evidence, or an explicit `N/A` reason.
- No handover "no next action" while any residual row is `gap`, `scheduled`, `parked`, or `PO decision`.

## §1 Why This Was Missing

| Reason | Evidence | Cause | Countermeasure |
|---|---|---|---|
| Carry was treated as coverage | `g3-trace` accepts L3 FR or carry for all FR-L1 | Carry is a valid routing state, but not a scheduled implementation span | Add residual matrix: every carry must map to child PLAN, park, or explicit PO decision |
| Roadmap rollup measured registered plans | `doctor` shows roadmap-rollup green | Program-band coverage is not feature-list coverage | Add `fr-roadmap-coverage` lint after this design |
| L7 segment wording was overloaded | `PLAN-L7-44` is harness.db segment; handover said no next action | "L7 roadmap complete" and "L7 layer complete" were conflated | Correct handover and require segment-qualified wording |
| V-model evidence is fragmented | pair-freeze / l6-fr-coverage / impl-plan-trace / oracle-test-trace are separate | No single row from FR to code/test coverage | Create a consolidated table with requirement/design/test/schedule/code/test columns |

## §2 V-model Table Required

| Range | Required table columns |
|---|---|
| 要件定義範囲 | `BR`, `FR-L1`, priority, user-facing requirement, carry reason |
| 基本設計範囲 | L4 architecture/module/flow doc, design gate evidence |
| 詳細設計範囲 | L5 D-DB/D-CONTRACT/D-STATE/physical-data doc |
| 機能設計範囲 | L6 function contract, invariant, explicit defer marker |
| テスト設計範囲 | L7/L8/L9 oracle ID, GWT, expected fixture |
| 工程表範囲 | PLAN ID, roadmap span, dependency, L4 sprint, feature flag, rollback |
| 実装範囲 | `src` file, exported function/module, implementation PLAN |
| テスト範囲 | `tests` file, oracle citation, coverage gate |

## Section 2.1 Drive-model Passage Certificate Required

The residual table must include a separate passage certificate for each drive model / entry mode. This is not the same as PLAN frontmatter `drive`; `drive` is the specialist axis, while the rows below are the workflow mode that must re-enter Forward.

| Drive model / entry mode | Required certificate columns |
|---|---|
| Discovery | trigger, hypothesis, S3 verification evidence, S4 decision, Forward target, Reverse promotion requirement, residual status |
| Scrum | feedback signal, increment evidence, acceptance evidence, Reverse fullback PLAN, Forward target, pair-freeze gate, residual status |
| Reverse | reverse type, R0 evidence, R1/R2 observed contracts or skip reason, R3 PO validation, R4 `forward_routing`, missing pair artifacts, re-entry gate, residual status |
| Recovery | incident class, approved scope, root cause, reopen point, correction artifact, recurrence-prevention guard/test/rule, Forward target, residual status |
| Incident | production impact, triage, hotfix PLAN, stabilization evidence, recovery PLAN, permanent-fix Forward route, postmortem, residual status |
| Refactor | behavior-invariance proof, affected modules, regression tests, design unchanged proof, escalation route if behavior changed, residual status |
| Retrofit | impact matrix, migration/rollback plan, regression/performance/data-integrity evidence, design/requirement route if changed, residual status |
| Add-feature | parent PLAN, requirement row, add-design row, add-impl row, test-design oracle, WBS, implementation target, Reverse back-fill state, residual status |
| Research | decision question, options, ADR, rejected options, research memo, Forward target, Discovery switch if feasibility remains unknown, residual status |

Passage rule: no drive model can be marked closed unless its row either names the Forward layer/gate it re-enters or is explicitly `gap`, `parked`, or `PO decision`.

## Section 2.2 DB Registration Gate Required

The passage certificate is not complete unless the drive-model execution is also represented in harness.db, or explicitly marked non-closed.

| DB table | Required meaning |
|---|---|
| `drive_runs` | One row per drive-model / entry-mode execution lane. |
| `workflow_runs` | Phase readiness rows linked by `drive_run_id` where a drive model has phases or gates. |
| `hook_events` | SessionStart / PostToolUse / Stop / gate hook evidence linked by `session_id` and `plan_id`. |
| `model_runs` | Codex / Claude / worker / reviewer execution evidence linked by `plan_id`. |

Fail-close rule: if a drive model completed but no `drive_runs` row exists, the certificate row remains `gap` even when PLAN docs and local tests are green.

## Section 2.3 Rule Automation Closure Required

Text-only rules do not count as closed. Every rule introduced by this PLAN must be routed to one of the following automation owners, or remain non-closed.

| Rule | Required automation owner | Current status |
|---|---|---|
| FR/carry/addendum -> WBS/L7 coverage | `fr-roadmap-coverage` lint + doctor wiring | `closed` |
| Drive-model passage certificate | new analyzer/checker + doctor or plan-lint wiring | `closed` |
| Drive-model DB registration | projection writer + `drive_runs` / `workflow_runs` / `hook_events` / `model_runs` check | `closed` |
| Handover completion wording | handover generator guard + doctor/handover discipline check | `closed` |
| Missing/ambiguous row fail-close | table analyzer with default `gap` | `closed` |

Rule closure rule: if a rule has no automation owner, the row remains `gap` even when the rule is written in governance, design, PLAN, or handover docs.

## §3 WBS

| WBS ID | Task | Owner | Dependencies | Duration | Env | L4 Sprint | feature flag | rollback |
|---|---|---|---|---|---|---|---|---|
| WBS-L3-04-01 | Build FR residual matrix from L1/L3 carry and A-122/A-124/A-125/A-126 addenda | TL | none | 0.5d | docs | .1a | N/A | Revert this PLAN and audit doc |
| WBS-L3-04-02 | Split residual buckets R1-R9 into child PLAN seeds or explicit park decisions | TL/PO | WBS-L3-04-01 | 0.5d | docs | .1b | N/A | Archive draft child PLANs and restore carry-only state |
| WBS-L3-04-03 | Build drive-model passage certificate table for all 9 entry modes | TL | WBS-L3-04-01,WBS-L3-04-02 | 0.5d | docs | .2 | N/A | Keep all unresolved mode rows as gap |
| WBS-L3-04-04 | Add DB registration gate: drive-model passage rows require `drive_runs` / linked projection evidence or non-closed status | TL | WBS-L3-04-03 | 0.5d | docs/src | .3 | ff_drive_model_db_registration=false | Keep rule report-only until projection writer is extended |
| WBS-L3-04-05 | Add rule automation closure table: every text rule maps to doctor/plan-lint/vmodel/hook/DB/CI or remains gap | TL | WBS-L3-04-01..04 | 0.25d | docs/src | .4 | ff_rule_automation_closure=false | Keep text-only rules non-closed |
| WBS-L3-04-06 | Design `fr-roadmap-coverage` lint: FR/carry/addendum -> PLAN/WBS/park plus drive-model passage row | TL | WBS-L3-04-01..05 | 0.5d | docs/src | .5 | ff_fr_roadmap_coverage_lint=false | Disable doctor wiring and keep report-only output |
| WBS-L3-04-07 | Add handover completion wording guard for segment-scoped completion | TL | WBS-L3-04-01 | 0.25d | docs/src | .5 | N/A | Restore generated handover pointer; keep audit finding |
| WBS-L3-04-08 | Add fail-close rule: missing/ambiguous residual row remains `gap` and blocks completion wording | TL | WBS-L3-04-01..07 | 0.25d | docs/src | .6 | ff_fr_roadmap_coverage_lint=false | Keep rule report-only until reviewed |
| WBS-L3-04-09 | Verify table with doctor, vmodel lint, rg old-premise checks, and targeted tests | QA/TL | WBS-L3-04-01..08 | 0.25d | local | .7 | N/A | Keep PLAN draft and mark unresolved buckets as gap |

## §4 Acceptance Criteria

- A-133 audit exists and states whether the V-model closes by row.
- Handover no longer states that all L7 work has no next action.
- Residual buckets R1-R9 are either child PLAN seeds, explicit park, or PO decision items.
- Drive-model passage certificate rows exist for all 9 entry modes and name Forward re-entry evidence or a non-closed status.
- Drive-model passage rows require harness.db registration evidence (`drive_runs` plus linked workflow/hook/model evidence) or remain non-closed.
- Every newly introduced rule maps to an automation owner or remains non-closed; text-only rules cannot close a row.
- Future automation candidate `fr-roadmap-coverage` is defined before implementation.
- Verification evidence records `doctor`, `vmodel lint`, and docs old-premise `rg` checks.
- Any missing or ambiguous row remains `gap`; no implicit coverage is allowed.
