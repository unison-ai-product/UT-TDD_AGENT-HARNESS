---
plan_id: PLAN-L3-05-harness-telemetry-closure
title: "PLAN-L3-05: harness telemetry and self-improvement closure"
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
    scope: "add-design 増分 (telemetry / self-improvement closure audit + 4 lint + dynamic skill recommender) の status drift (src merge 済なのに draft 放置) を解消し confirmed 化。成果物 src/lint/{telemetry-closure,cycle-p4-verification,skill-assignment,project-hook}.ts + src/skills/recommend.ts + src/doctor 配線 + 6 test は 2026-06-12 (239cb32) で merge 済。機械再検証: ①全 src module 実在 ②doctor の hard gate として稼働 (skill-assignment hard gate / Cycle P4 closure audit hard gate / telemetry-closure 各 doctor refs ≥3) ③skills/recommend は cli.ts + workflow/contracts.ts に配線 ④Vitest 787/787 green / doctor EXIT=0。AC §3 (A-134 audit / doctor が non-closed rows を surface / 各 self-improvement 領域が evidence 無しでは closed にできない fail-close) は merged + wired + tested で充足。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-opus-4-8
agent_slots:
  - role: tl
    slot_label: "TL - telemetry closure and self-improvement audit"
generates:
  - artifact_path: docs/plans/PLAN-L3-05-harness-telemetry-closure.md
    artifact_type: markdown_doc
  - artifact_path: .ut-tdd/audit/A-134-harness-telemetry-self-improvement-audit.md
    artifact_type: markdown_doc
  - artifact_path: .ut-tdd/audit/A-136-cycle-p4-verification-audit.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/telemetry-closure.ts
    artifact_type: source_module
  - artifact_path: src/lint/cycle-p4-verification.ts
    artifact_type: source_module
  - artifact_path: src/lint/skill-assignment.ts
    artifact_type: source_module
  - artifact_path: src/lint/project-hook.ts
    artifact_type: source_module
  - artifact_path: src/skills/recommend.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/skill-recommend.test.ts
    artifact_type: test_code
  - artifact_path: tests/issue-queue.test.ts
    artifact_type: test_code
  - artifact_path: tests/project-hook.test.ts
    artifact_type: test_code
  - artifact_path: tests/telemetry-closure.test.ts
    artifact_type: test_code
  - artifact_path: tests/cycle-p4-verification.test.ts
    artifact_type: test_code
  - artifact_path: tests/skill-assignment.test.ts
    artifact_type: test_code
  - artifact_path: docs/skills/review-checklist.yaml
    artifact_type: skill_doc
dependencies:
  parent: docs/plans/PLAN-L3-00-master.md
  requires:
    - docs/design/harness/L3-functional/functional-requirements.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/test-design/harness/L8-integration-test-design.md
    - docs/test-design/harness/L9-system-test-design.md
    - .ut-tdd/audit/A-134-harness-telemetry-self-improvement-audit.md
  blocks:
    - docs/plans/PLAN-L7-51-skill-injection-runtime.md
    - docs/plans/PLAN-L7-52-telemetry-feedback-loop.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L3-05: harness telemetry and self-improvement closure

## Section 0 Objective

Prevent false closure of harness measurement, self-improvement, and team-standard project hook features.

This PLAN treats UT-TDD as a TDD team standardization development harness. It creates the closure audit, WBS, and doctor-visible lint that keep dynamic skill injection, drive-model skill injection, firing-rate metrics, retry/bottleneck analytics, trouble logs, GitHub issue routing, project-local hooks, and improvement-loop automation non-closed until implementation evidence exists.

## Section 0.1 Absolute No-Omission Principle

- A schema table with 0 rows is not operational evidence.
- A design function name is not a CLI/runtime feature.
- A hook/session log without classification is not a trouble-log system.
- A metrics command without upstream event capture is not an end-to-end telemetry loop.
- A GitHub connector capability is not an approved product feature until dry-run, approval, and back-reference rules are frozen.
- A self-improvement loop is closed only when measurement rows produce findings, feedback events, improvement backlog or issue-queue entries, and doctor-visible closure evidence.

## Section 1 Gap Summary

| Area | Current evidence | Gap |
|---|---|---|
| L-unit dynamic skill injection | L3 FR and L6 function design define `skill suggest` / `suggestSkillInjection`; L8/L9 test design names integration/system tests | No `ut-tdd skill suggest` command, no runtime recommendation writer, and `skill_recommendations=0` |
| Drive-model skill injection | Drive model tables and passage certificate exist | No skill recommender conditioned by drive model / entry mode |
| Skill firing parameters | `skill_recommendations` and `skill_invocations` tables exist | No projection writer populates them; no firing parameter capture |
| Trouble logs | session logs and `hook_events=3212` exist | No trouble taxonomy or bridge to feedback/improvement rows |
| GitHub issue creation outside Forward | GitHub connector exists in environment; `issue_queue` dry-run entries, human approval guardrail decisions, and back-reference columns are available | Actual GitHub mutation is out of this implementation scope; populated external issue-id back-reference is recorded only after separate human-approved creation |
| Drive firing-rate measurement | `drive_runs=210` exists | Firing-rate metrics are projected into `quality_signals`; per-runtime attribution can be expanded |
| Retry and bottleneck detection | `workflow_runs=7`, `workflow_retry_groups`, `retry_events`, and bottleneck quality signals exist | Per-session attribution can be expanded, but DB projection path exists |
| Self-improvement loop | `quality_signals`, `feedback_events`, `issue_queue`, and `improvement_log` are projected by rebuild | Actual GitHub mutation and external issue-id return remain approval-gated |
| Project hook configuration | `.claude/settings.json` exists as repository-local Claude Code hook configuration | No doctor-visible check proves the TDD team standard hooks stay project-local and package-local |

## Section 2 WBS

| WBS ID | Task | Owner | Dependencies | Duration | Env | L4 Sprint | feature flag | rollback |
|---|---|---|---|---|---|---|---|---|
| WBS-L3-05-01 | Create A-134 telemetry closure audit with DB count evidence and no-omission rules | TL | none | 0.25d | docs | .1 | N/A | Remove A-134 and keep open finding in backlog |
| WBS-L3-05-02 | Add telemetry closure lint that validates every required measurement row has evidence, owner, and status | TL | WBS-L3-05-01 | 0.25d | src/tests | .1 | N/A | Disable doctor wiring; keep lint test-only |
| WBS-L3-05-03 | Wire telemetry closure into doctor as hard/fail-close surface | TL | WBS-L3-05-02 | 0.25d | src | .1 | N/A | Remove doctor call and keep A-134 manual |
| WBS-L3-05-04 | Implement dynamic L-unit and drive-model skill recommender CLI | TL/worker | WBS-L3-05-01..03 | 1.0d | src/tests/docs | .2 | ff_skill_recommendation_runtime=false | Keep `skill suggest` hidden and tables non-closed |
| WBS-L3-05-05 | Add skill invocation projection and metrics by plan, layer, drive, source, and acceptance | TL/worker | WBS-L3-05-04 | 1.0d | src/tests/db | .2 | ff_skill_invocation_projection=false | Drop new projection rows via migration rollback |
| WBS-L3-05-06 | Add drive firing-rate, retry, and bottleneck analytics into `quality_signals` | TL/worker | WBS-L3-05-05 | 1.0d | src/tests/db | .3 | ff_telemetry_quality_signals=false | Disable metrics command and keep raw rows |
| WBS-L3-05-07 | Add trouble taxonomy and feedback-event bridge from hook/session/failure rows | TL/worker | WBS-L3-05-06 | 1.0d | src/tests/db | .3 | ff_trouble_feedback_bridge=false | Keep classifier report-only |
| WBS-L3-05-08 | Add improvement backlog writer and GitHub issue dry-run queue with human approval gate | TL/PO | WBS-L3-05-07 | 1.0d | src/tests/docs | .4 | ff_issue_queue=false | Keep local backlog only; do not mutate GitHub in this implementation |
| WBS-L3-05-09 | Add project-hook lint proving repo-local TDD team standard hooks | TL/worker | WBS-L3-05-04 | 0.5d | src/tests/docs | .3 | ff_project_hook_lint=false | Keep `.claude/settings.json` manual but doctor-visible |
| WBS-L3-05-10 | Verify doctor, db rebuild, metrics, and tests prove nonzero quality/feedback/skill rows before closure | QA/TL | WBS-L3-05-04..09 | 0.5d | local | .5 | N/A | Reopen A-134 rows as `partial` or `gap` |

## Section 3 Acceptance Criteria

- A-134 exists and has a telemetry closure row for each required measurement/self-improvement area.
- Doctor surfaces the A-134 non-closed rows.
- Dynamic skill injection cannot be called closed while `skill_recommendations` and `skill_invocations` remain empty.
- Drive-model skill injection cannot be called closed without drive-conditioned recommendation evidence.
- Firing-rate, retry, bottleneck, and trouble-log analytics cannot be called closed without derived `quality_signals`, `findings`, or `feedback_events`.
- GitHub issue creation outside Forward cannot be called closed without dry-run queue, human approval semantics, and back-reference evidence.
- Self-improvement cannot be called closed until measurement rows produce feedback events and a tracked backlog or approved issue queue entry.
- Project hooks cannot be called closed unless `.claude/settings.json` uses package-local commands and is checked by doctor.
- Cycle P4 / L7-DB cannot be called closed unless DB projection, local L8-L14 verification rows, source-isolation vocabulary, handover, telemetry, feature residuals, and placeholder carry boundaries are all machine checked.

## Section 4 Current Gate Result

G3 status: pass for this implementation scope.

Reason: closure audit, doctor lint, runtime skill recommendation projection, skill invocation telemetry, operational quality signals, feedback event emission, trouble taxonomy, retry diagnostics, improvement log, GitHub dry-run issue queue, issue back-reference columns, human approval guardrail telemetry, and project-local hook drift detection are implemented. Actual GitHub mutation is outside this implementation scope; queue and externally supplied back-reference behavior are covered by tests.
