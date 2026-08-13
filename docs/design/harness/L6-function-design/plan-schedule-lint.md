---
layer: L6
sub_doc: function-spec
status: confirmed
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
plan: docs/plans/PLAN-L6-19-plan-schedule-lint.md
---

> **L6 contract marker**: `analyzePlanSchedule(input: PlanScheduleInput) => PlanScheduleResult` は unit-test-granularity contract である。DbC pre/post/invariant は Step parallel/serial と review-step requirement を U-PLANSCH-001..003 へ対応させる。

# plan-schedule lint — 機能設計 (IMP-081)

## §1 範囲

これは最小の §1.10.G.4 enforcement slice である。full PLAN lint engine は実装しない。PLAN §工程表が明示的な step serialization metadata と review step を持つことだけを確認する。

## §2 関数

| function | 契約 |
|---|---|
| `extractScheduleSection(content)` | PLAN body から §工程表 section を抽出する。 |
| `analyzePlanSchedule(docs)` | 各 `### Step N:` heading の `[並列]` / `[直列]`、`[直列]` block の `file_conflict` / `downstream_dependency` / `shared_state`、review step heading、`§3.1 実装計画` を確認する。 |
| `loadPlanScheduleDocs(repoRoot, target?)` | 単一 PLAN または全 `docs/plans/PLAN-*.md` を読み込む。 |
| `planScheduleMessages(result)` | OK / violation message を出力する。 |
| `lintPlan(path?, repoRoot?)` | schedule 専用 wrapper。path ありなら単一 PLAN、path なしなら全 plans を lint する。 |
| `lintPlanDefault(path?, repoRoot?)` | 既定の CLI surface。schedule と frontmatter/cross-record governance を同時に実行し、どちらかの違反でも fail-close する。 |

## §3 Doctor 挙動

`ut-tdd plan lint` は schedule と frontmatter/cross-record governance を既定で実行し、いずれかの violation 時に `ok=false` を返す。`--gate schedule` / `--gate governance` では個別実行できる。Doctor は両者を別の hard/fail-close gate として含めるため、schedule drift と governance drift は `ut-tdd plan lint` と `ut-tdd doctor` の両方を block する。

## §4 Test Oracle 検証観点

`tests/plan-lint.test.ts` で covered:

| ID | oracle |
|---|---|
| U-PLANSCH-001 | §工程表 extraction |
| U-PLANSCH-002 | compliant PLAN → ok |
| U-PLANSCH-003 | `[並列]` / `[直列]` 欠落 → violation |
| U-PLANSCH-004 | `[直列]` に allowed reason がない → violation |
| U-PLANSCH-005 | review step heading 欠落 → violation |
| U-PLANSCH-006 | `§3.1 実装計画` 欠落 → violation |
