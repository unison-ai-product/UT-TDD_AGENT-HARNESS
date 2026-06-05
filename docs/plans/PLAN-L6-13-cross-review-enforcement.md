---
plan_id: PLAN-L6-13-cross-review-enforcement
title: "PLAN-L6-13 (add-design): cross-review semantic 強制の機能設計 — review_evidence に worker/reviewer model 識別子 + same_model_approval / cross_agent distinctness 検査 (IMP-076)"
kind: add-design
layer: L6
drive: agent
status: confirmed
created: 2026-06-05
updated: 2026-06-05
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-05"
    tests_green_at: "2026-06-05"
    verdict: pass
    scope: "cross-review semantic 強制の機能設計 (DbC: cross_agent⟹worker≠reviewer) + scope OUT (subagent 配置 defer)。pmo-sonnet PASS (Critical 0)。code-reviewer は IMP-009 truncate のため pmo-sonnet 確定。claude-only TL 代替"
agent_slots:
  - role: tl
    slot_label: "TL — DbC (cross_agent ⟹ worker≠reviewer model) / 静的検査の妥当性 / 既存 review-evidence lint 非破壊のレビュー (claude-only は code-reviewer/pmo-sonnet 代替)"
generates:
  - artifact_path: docs/design/harness/L6-function-design/cross-review-enforcement.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
dependencies:
  parent: docs/plans/PLAN-L6-12-review-evidence.md
  requires:
    - docs/plans/PLAN-L6-12-review-evidence.md
  references:
    - docs/design/harness/L4-basic-design/function.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-L6-13 (add-design): cross-review semantic 強制の機能設計

## §0 位置づけ

IMP-071 (review_evidence、PLAN-L6-12/L7-13) は review 前置の **presence + review_kind** を機械強制した。本 add-design はその続きで、concept §2.1.2.1 が「実行時強制」と設計済だが未実装の **cross-review semantic 強制**を機能設計する (IMP-076、PO 問い「クロスレビュー設計は?」由来)。L4 function §3.6 で外部設計 + 明示 defer 済の機械着地。**bottom-up build (Add-feature 経路 B) → 後段 Reverse (PLAN-REVERSE-13) で concept §2.1.2.1 / requirements §7.8.7 へ back-fill**。

> **scope OUT (PO 2026-06-05「サブエージェントの配置とかは後で」)**: orchestration_mode の cell 割当 (drive×layer → どの subagent/Codex role) / worker roster の具体配置 / checklist 逐条記録 (§2.1.2.1 核心ルール ③) は**本 feature 対象外** (requirements defer 継続、function §3.7)。本 feature は **worker/reviewer の model 識別子記録 + 同一モデル承認の機械弾き**に絞る。

## §1 機能仕様 (関数粒度 = 単体テスト設計粒度)

### §1.1 schema 拡張 (review_evidence entry)
`review_evidence[]` の各 entry に **任意フィールド 2 つ**追加 (既存 entry を壊さない):
- `worker_model?: string` — レビュー対象の成果物を産出した model (例: `claude-opus-4-8` / `gpt-5.5`)
- `reviewer_model?: string` — reviewer の model (例: `claude-sonnet-4-6`)

### §1.2 判定関数 (analyzeReviewEvidence 拡張 or 新規 analyzeCrossReview)
**DbC**:
- **Precondition**: parsed review_evidence entry 群。
- **Postcondition**: `crossReviewViolations: {plan_id, reason}[]` を返す。`review_kind == "cross_agent"` の entry について:
  - `worker_model` と `reviewer_model` が両方 present、かつ `worker_model != reviewer_model` でなければ **violation** (reason = `same_model_or_missing`)。
- **Invariant**: `cross_agent` ⟹ worker と reviewer の model が相異 (= `same_model_approval: forbidden`、concept §2.1.2.1 核心ルール 2)。これにより **claude-only/standalone が `cross_agent` を僭称できない** (単体 runtime は相異 model を供給できない = 核心ルール 1/「self-review が cross-agent に化けない」を静的に担保)。
- `intra_runtime_subagent` / `human` の entry は本検査の対象外 (worker/reviewer model 任意)。

### §1.3 doctor 配線
`checkReviewEvidence` (既存、hard) に crossReviewViolations を統合 (violation あれば ok=false)。IMP-071 と同じ hard 群。

## §工程表

### Step 1: [直列] 機能設計 doc 起草
- 直列理由 = **file_conflict** (cross-review-enforcement.md を書く)。DbC + 静的検査仕様 + scope OUT 明示。

### Step 2: [直列] L7-unit ペア追記
- 直列理由 = **downstream_dependency**。U-REVIEW (cross-review distinctness) 検査軸を L7-unit §1.15 に追記、孤児0。

### Step 3: [直列] review Step (intra_runtime_subagent)
- 直列理由 = **downstream_dependency**。DbC の妥当性 (cross_agent ⟹ 相異) + 既存 lint 非破壊をレビュー。通過後 review_evidence 記録 + confirmed flip。

## §実装計画

- **cross-review-enforcement.md** (情報源: concept §2.1.2.1 核心ルール 1/2 + L4 function §3.6 + review-evidence.ts): §1 schema 拡張 / §2 DbC / §3 doctor / §4 scope OUT (subagent 配置 defer)。
- **L7-unit-test-design.md** (情報源: U-REVIEW 既存): cross-review distinctness 検査軸を §1.15 に追記。

## §6 用語更新

- **same_model_approval** (forbidden): cross_agent review で worker と reviewer の model が同一なら承認無効化する原則 (concept §2.1.2.1 核心ルール 2)。L0 §10 へ back-merge は PLAN-REVERSE-13。
- **worker_model / reviewer_model**: review_evidence entry の model 識別子。

## §8 DoD

- [x] cross-review-enforcement.md 起草 (DbC + scope OUT 明示)
- [x] L7-unit ペア追記 (U-XREVIEW)、孤児0 (pair-freeze 32)
- [x] review 前置 (pmo-sonnet PASS) → review_evidence 記録 + confirmed flip
- [x] add-impl = PLAN-L7-14 / back-fill = PLAN-REVERSE-13 とペア
