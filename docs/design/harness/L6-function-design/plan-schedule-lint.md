---
layer: L6
sub_doc: function-spec
status: draft
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
plan: docs/plans/PLAN-L6-19-plan-schedule-lint.md
---

# plan-schedule lint — function design (IMP-081)

## §1 Scope

This is the minimum §1.10.G.4 enforcement slice. It does not implement the full PLAN lint engine. It only checks that PLAN §工程表 has explicit step serialization metadata and a review step.

## §2 Functions

| function | contract |
|---|---|
| `extractScheduleSection(content)` | Extract the §工程表 section from a PLAN body. |
| `analyzePlanSchedule(docs)` | Check every `### Step N:` heading for `[並列]` or `[直列]`; check `[直列]` blocks for one of `file_conflict`, `downstream_dependency`, `shared_state`; require a review step heading; require `§3.1 実装計画`. |
| `loadPlanScheduleDocs(repoRoot, target?)` | Load one PLAN or all `docs/plans/PLAN-*.md`. |
| `planScheduleMessages(result)` | Emit OK / violation message. |
| `lintPlan(path?, repoRoot?)` | CLI-facing wrapper. With a path, lint one PLAN; without a path, lint all plans. |

## §3 Doctor Behavior

`ut-tdd plan lint` returns `ok=false` on violation. Doctor includes `plan-schedule` as warn-first surface and does not connect it to `runDoctor.ok` yet.

## §4 Test Oracle

Covered by `tests/plan-lint.test.ts`:

| ID | oracle |
|---|---|
| U-PLANSCH-001 | §工程表 extraction |
| U-PLANSCH-002 | compliant PLAN -> ok |
| U-PLANSCH-003 | missing `[並列]` / `[直列]` -> violation |
| U-PLANSCH-004 | `[直列]` without allowed reason -> violation |
| U-PLANSCH-005 | missing review step heading -> violation |
| U-PLANSCH-006 | missing `§3.1 実装計画` -> violation |
