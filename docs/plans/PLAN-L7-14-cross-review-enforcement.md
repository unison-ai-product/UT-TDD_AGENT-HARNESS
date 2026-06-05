---
plan_id: PLAN-L7-14-cross-review-enforcement
title: "PLAN-L7-14 (add-impl): cross-review semantic 強制の実装 — schema worker/reviewer_model + lint same_model_approval 検査 + doctor 配線 + tests (IMP-076)"
kind: add-impl
layer: L7
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
    scope: "schema worker_model/reviewer_model + analyzeReviewEvidence crossReviewViolations (cross_agent⟹worker≠reviewer) + extractReviewEntries + doctor hard 連動 + U-XREVIEW-001〜005。pmo-sonnet PASS (Critical 0、正確性/doctor連動/scope OK)。code-reviewer は IMP-009 truncate のため pmo-sonnet 確定。typecheck 0 / vitest 200 / doctor exit 0"
agent_slots:
  - role: tl
    slot_label: "TL — analyze 純関数の cross_agent distinctness 判定 / 既存 analyzeReviewEvidence 非破壊のレビュー"
  - role: qa
    slot_label: "QA — U-XREVIEW 検査軸 (cross_agent 相異/同一/欠落) + 実 repo ガードのカバレッジ"
generates:
  - artifact_path: src/schema/frontmatter.ts
    artifact_type: source_module
  - artifact_path: src/lint/review-evidence.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/review-evidence.test.ts
    artifact_type: test_code
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
dependencies:
  parent: docs/plans/PLAN-L6-13-cross-review-enforcement.md
  requires:
    - docs/plans/PLAN-L6-13-cross-review-enforcement.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-L7-14 (add-impl): cross-review semantic 強制の実装

## §0 位置づけ

PLAN-L6-13 の機能設計を実装する add-impl。back-fill pairing (add-impl → Reverse 合流) は PLAN-REVERSE-13。

## §工程表

### Step 1: [直列] schema + lint 実装
- 直列理由 = **file_conflict** (frontmatter.ts / review-evidence.ts)。review_evidence entry に `worker_model?` / `reviewer_model?` optional 追加 + analyzeReviewEvidence に crossReviewViolations 判定。

### Step 2: [直列] doctor 配線
- 直列理由 = **downstream_dependency**。checkReviewEvidence に crossReviewViolations を統合 (hard、ok 連動)。

### Step 3: [直列] tests + 全回帰
- 直列理由 = **downstream_dependency**。U-XREVIEW-001〜004 (cross_agent 相異=ok / 同一=violation / 欠落=violation / 非 cross_agent は対象外) + 実 repo ガード + 全回帰 green。

### Step 4: [直列] review Step (intra_runtime_subagent)
- 直列理由 = **downstream_dependency**。純関数判定 + 既存 lint 非破壊をレビュー。通過後 review_evidence 記録 + confirmed flip + REVERSE-13 で back-fill。

## §実装計画

- **src/schema/frontmatter.ts** (情報源: 既存 review_evidence schema): entry に worker_model/reviewer_model optional。
- **src/lint/review-evidence.ts** (情報源: L6-13 §1.2 DbC): analyzeReviewEvidence に crossReviewViolations。
- **src/doctor/index.ts** (情報源: 既存 checkReviewEvidence hard): violation を ok 連動。
- **tests/review-evidence.test.ts** (情報源: U-REVIEW 既存): U-XREVIEW 追加。

## §6 用語更新

> L6-13 §6 (same_model_approval / worker_model / reviewer_model) を踏襲。新規語追加なし。

## §8 DoD

- [x] schema + lint + doctor + tests 実装、typecheck 0 / vitest 200 green / doctor exit 0
- [x] review 前置 (pmo-sonnet PASS) → review_evidence 記録 + confirmed flip
- [x] PLAN-REVERSE-13 で back-fill pairing (add-impl → Reverse 合流)
