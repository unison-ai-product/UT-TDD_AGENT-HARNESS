---
layer: L6
sub_doc: function-spec
status: confirmed
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
plan: docs/plans/PLAN-L6-13-cross-review-enforcement.md
---

> **L6 contract marker**: `extractReviewEntries(input: ReviewEvidenceInput) => ReviewEntry[]` and `analyzeReviewEvidence(input: ReviewEvidenceInput) => ReviewEvidenceResult` are the unit-test-granularity contracts. DbC pre/post/invariant maps review tier and same-model checks to U-XREVIEW-001..005.


> **SSoT 参照**: review tier 原則 = [concept §2.1.2.1](../../../governance/ut-tdd-agent-harness-concept_v3.1.md) / 外部設計 = [L4 function §3.6](../L4-basic-design/function.md) / 実装 = `src/lint/review-evidence.ts` + `src/schema/frontmatter.ts`。本 doc は IMP-071 (review_evidence presence) の続きとして cross-review の **semantic 強制** (same_model_approval) を関数粒度で確定する (IMP-076)。

# L6 機能設計: cross-review semantic 強制 (same_model_approval)

## §1 位置づけ

IMP-071 は review 前置の **presence + review_kind** を機械強制した。本機能はその続きで、concept §2.1.2.1 核心ルール 2 (`same_model_approval: forbidden`) の機械着地を実装する。**cross_agent review を称するなら worker と reviewer の model が相異**でなければならない (単体 runtime は相異 model を供給できず `cross_agent` を僭称できない = 核心ルール 1 の静的担保)。

> **scope OUT (PO 2026-06-05「サブエージェントの配置とかは後で」)**: orchestration_mode の cell 割当 (drive×layer → subagent/Codex role) / worker roster の具体配置 / checklist 逐条 pass/fail/n-a 記録 (§2.1.2.1 核心ルール 3) は**本機能対象外** (requirements defer 継続、function §3.7)。本機能は worker/reviewer の model 識別子記録 + 同一モデル承認の機械弾きに絞る。

## §2 schema 拡張 (review_evidence entry)

`review_evidence[]` の各 entry に**任意フィールド 2 つ** (既存 entry 非破壊):

- `worker_model?: string` — レビュー対象成果物を産出した model (例: `claude-opus-4-8` / `gpt-5.5`)
- `reviewer_model?: string` — reviewer の model (例: `claude-sonnet-4-6`)

## §3 判定関数 (DbC)

### `extractReviewEntries(content): ReviewEntry[]`
- **Precondition**: PLAN 本文 (frontmatter 含む)。
- **Postcondition**: 最初の `---` ブロックを yaml 解析し `review_evidence[]` を `{review_kind, worker_model?, reviewer_model?}[]` で返す。parse 失敗 / 不在は entry なしとして `[]` を返し、必須PLANの evidence 欠落は `analyzeReviewEvidence` 側で violation 化する。

### `analyzeReviewEvidence(plans)` 拡張 — `crossReviewViolations`
- **Precondition**: parsed plan 群 (archived は除外)。
- **Postcondition**: `review_kind == "cross_agent"` の entry について、`worker_model` と `reviewer_model` が両方 present かつ相異でなければ `crossReviewViolations: {plan_id, reason: "same_model_or_missing"}` を 1 PLAN 1 件 collect。
- **Invariant**: `cross_agent` ⟹ worker と reviewer の model 相異 (= `same_model_approval: forbidden`)。`intra_runtime_subagent` / `human` は対象外 (cross-provider 要件は cross_agent のみ)。`ok = missing.length===0 && crossReviewViolations.length===0`。

## §4 doctor 配線

`checkReviewEvidence` (既存 hard、IMP-071) が `result.ok` をそのまま返すため、`crossReviewViolations` は**自動で `runDoctor.ok` 連動 (hard/fail-close)**。追加配線不要。`reviewEvidenceMessages` が違反を surface。

## §5 既存との非重複

- **IMP-071 (presence)** = 「review_evidence があるか」。**IMP-076 (本機能、distinctness)** = 「cross_agent なら worker≠reviewer か」。検査軸が直交、同一 `analyzeReviewEvidence` に統合 (missing と crossReviewViolations を別 array)。

## §6 用語更新

- **same_model_approval** (forbidden): cross_agent で worker≡reviewer の同一 model なら承認無効化 (concept §2.1.2.1 核心ルール 2)。
- **worker_model / reviewer_model**: review_evidence entry の model 識別子。

→ concept §10.3 へ back-merge = PLAN-REVERSE-13 (実施済)。

## §7 carry

- サブエージェント配置 (orchestration_mode cell / worker roster) = requirements defer (function §3.7、本機能対象外)。
- checklist 逐条 pass/fail/n-a 記録 (§2.1.2.1 核心ルール 3、§7.8.7 checklist) = `src/gate/review-tier.ts` + `docs/skills/review-checklist.yaml` で実装済 (2026-06-08)。
- provider 次元 (model だけでなく provider 一致も弾く) は現状 model 文字列比較で代替 (claude-\* vs gpt-\* は model で判別可)。厳密な provider field は将来拡張候補。
