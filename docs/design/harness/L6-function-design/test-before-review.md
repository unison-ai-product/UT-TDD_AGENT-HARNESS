---
layer: L6
sub_doc: function-spec
status: confirmed
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
plan: docs/plans/PLAN-L6-14-test-before-review.md
---

> **L6 contract marker**: `analyzeReviewEvidence(input: ReviewEvidenceInput) => ReviewEvidenceResult` is the unit-test-granularity contract. DbC pre/post/invariant maps tests_green_at <= reviewed_at ordering to U-TORDER-001..005.


> **SSoT 参照**: 品質保証二軸 (定量テスト × 定性レビュー) = concept 柱6 / review tier = [concept §2.1.2.1](../../../governance/ut-tdd-agent-harness-concept_v3.1.md) / 駆動モデル exit = [L4 function §3.1](../L4-basic-design/function.md) / 実装 = `src/lint/review-evidence.ts`。IMP-071 (presence) / IMP-076 (cross_agent distinctness) の続きで **時間順序** (テスト→レビュー) を確定 (IMP-077)。

# L6 機能設計: test→review 順序強制 (定量テスト → 定性レビュー)

## §1 位置づけ

品質保証は**定量テスト × 定性レビュー**の二軸 (柱6)。本機能はその**順序**を機械強制する: **定量検証 (vitest/doctor/lint) が green になってから 定性レビューを行う** (未検証成果物をレビューしない)。

> **全駆動モデル普遍 (PO 2026-06-05「駆動モデルのワークフローもすべて」)**: design/impl に限らず **9 駆動モデルすべての workflow** に適用。各 mode の 定量 verify step (Discovery=S3 verify / Scrum=increment テスト / Reverse=③テスト設計状態確定 / Incident=収束確認 / Refactor=テスト緑確認 / Retrofit=L8 回帰 / Add-feature=テスト確認 / Research=候補比較 evidence) が、その mode の 定性 review/サインオフ step の**前**に来る。共通アンカー = `review_evidence` の `tests_green_at ≤ reviewed_at`。

## §2 schema 拡張

`review_evidence[]` の各 entry に `tests_green_at: string` (定量検証 green 時刻)。当初 optional → 実 repo back-fill 後 presence hard。

## §3 判定関数 (analyzeReviewEvidence 拡張) — DbC

- **Precondition**: parsed review_evidence entry (reviewed_at + tests_green_at)。
- **Postcondition**: `testBeforeReviewViolations: {plan_id, reason}[]`。**status=confirmed/completed の review_evidence を持つ全 entry (kind/駆動モデル 非依存)** について:
  - `tests_green_at` 欠落 → violation (`missing_tests_green_at`)。
  - `tests_green_at > reviewed_at` → violation (`review_before_test`、ISO 日付辞書順比較)。
- **Invariant**: review_evidence を持つ全 confirmed PLAN (全駆動モデル) で `tests_green_at ≤ reviewed_at`。2026-06-23 以降に更新された confirmed/completed の review_evidence は `green_commands[]` を持ち、各 command が exit 0 / evidence path / output digest を持つ。`ok = missing==0 && crossReviewViolations==0 && testBeforeReviewViolations==0 && greenCommandViolations==0`。
- draft (未確定) は対象外。

## §4 doctor 配線

`checkReviewEvidence` (既存 hard) が `result.ok` を返すため自動で `runDoctor.ok` 連動 (hard/fail-close)。追加配線不要。

## §5 既存との非重複

- **IMP-071 (presence)** = review_evidence があるか / **IMP-076 (distinctness)** = cross_agent なら worker≠reviewer か / **IMP-077 (本機能、order)** = tests_green_at ≤ reviewed_at か。3 軸が直交、同一 `analyzeReviewEvidence` に統合 (別 array)。

## §6 用語更新

- **tests_green_at**: review_evidence entry の定量検証 (vitest/doctor/lint) green 時刻。`tests_green_at ≤ reviewed_at` (定量テスト→定性レビュー順序) は全駆動モデル普遍の不変条件。

→ concept §10.3 へ back-merge = PLAN-REVERSE-14。

## §7 carry

- 段階導入: warn-first 不採用 (実 repo 38 entry を同 feature で back-fill 済 → 即 presence hard)。以後 review 証跡を足すとき tests_green_at 必須。
- 「green の定義」(どの定量検証セットが green か = vitest 全回帰 / doctor exit 0 / 該当 lint) の最小 schema 化は **A-122 / IMP-108** として着地済み。2026-06-23 以降に更新された confirmed/completed の `review_evidence` は `green_commands[]` を持たないと doctor が fail-close する。`green_definition_id` による profile 解決と DB projection は後続 carry。

## §8 GreenDefinition addendum (A-122 / IMP-108)

`tests_green_at <= reviewed_at` は定量検証が定性レビューより前に実行されたことだけを保証する。IMP-108 では最小着地として `review_evidence[].green_commands[]` を追加し、どの command が green だったかを plan frontmatter から機械検査する。Phase 4 DB projection と Phase 3 workflow automation では、review evidence に次の `green_definition_id` を追加し、どの定量 profile が green だったかをより厳密に再現できるようにする。

```ts
type GreenCommandKind =
  | "unit_test"
  | "integration_test"
  | "typecheck"
  | "lint"
  | "doctor"
  | "vmodel_lint"
  | "smoke";

type GreenCommandEvidence = {
  kind: GreenCommandKind;
  command: string;
  runner: "bun" | "powershell" | "bash" | "ci";
  scope: "full" | "targeted" | "changed-files" | "gate";
  exit_code: 0;
  completed_at?: string;
  evidence_path: string;
  output_digest: string;
};

type GreenDefinition = {
  green_definition_id: string;
  profile: "docs-change" | "ts-core" | "cli-hook" | "db-projection" | "phase-close";
  required_commands: GreenCommandKind[];
  command_evidence: GreenCommandEvidence[];
  computed_green_at: string;
};
```

DbC:

- Precondition: `profile` is chosen from changed artifact kinds and Test Rules; Bun/TypeScript core changes require at least `typecheck`, `lint`, and relevant `unit_test`.
- Postcondition: `computed_green_at` is the max `completed_at` of all required commands, and every required command has `exit_code=0`.
- Current invariant: a 2026-06-23-or-later confirmed/completed `review_evidence` entry must have at least one `green_commands[]` entry with allowed kind/runner/scope, `exit_code=0`, evidence path, and `sha256:` output digest.
- Future invariant: a `review_evidence` entry may be `confirmed` only when `green_definition_id` resolves and `computed_green_at <= reviewed_at`.
- Projection: `GreenCommandEvidence` maps to `test_runs` / `quality_signals` in `physical-data.md` §9.4. Missing evidence becomes a finding rather than a warning.
