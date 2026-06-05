---
plan_id: PLAN-L7-15-test-before-review
title: "PLAN-L7-15 (add-impl): test→review 順序強制の実装 — schema tests_green_at + lint testBeforeReviewViolations + 全 review_evidence back-fill + doctor hard + tests (IMP-077)"
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
    scope: "schema tests_green_at + analyzeReviewEvidence testBeforeReviewViolations (欠落/>reviewed_at、全駆動モデル普遍) + 38 entry back-fill (honest) + doctor hard + U-TORDER-001〜005。pmo-sonnet PASS (Critical 0、正確性/honesty/普遍/doctor連動 OK)。typecheck 0 / vitest 205 / doctor exit 0"
agent_slots:
  - role: tl
    slot_label: "TL — testBeforeReview 純関数 (presence + 順序) / 全 entry 普遍適用 / 既存 analyze 非破壊のレビュー"
  - role: qa
    slot_label: "QA — U-TORDER 検査軸 (順序 ok/violation/欠落) + 実 repo back-fill 完全性ガード"
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
  parent: docs/plans/PLAN-L6-14-test-before-review.md
  requires:
    - docs/plans/PLAN-L6-14-test-before-review.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-L7-15 (add-impl): test→review 順序強制の実装

## §0 位置づけ

PLAN-L6-14 の機能設計を実装する add-impl。back-fill pairing は PLAN-REVERSE-14。**実 repo 全 review_evidence entry (36 件) に `tests_green_at` を back-fill** してから presence hard 化 (IMP-071 と同じ昇格パス)。

## §工程表

### Step 1: [直列] schema + lint 実装
- 直列理由 = **file_conflict** (frontmatter.ts / review-evidence.ts)。entry に `tests_green_at?` + ReviewEntry に reviewed_at/tests_green_at + analyzeReviewEvidence に testBeforeReviewViolations (全 entry 普遍)。

### Step 2: [直列] 全 review_evidence back-fill (=reviewed_at)
- 直列理由 = **downstream_dependency**。実 repo 36 entry の各 `reviewed_at` 直後に `tests_green_at` (=同値、定量検証は記録時に green だった = honest) を挿入。**実在事実の転記** (各 review 時に vitest/doctor green を確認済)。

### Step 3: [直列] doctor hard + tests + 全回帰
- 直列理由 = **downstream_dependency**。checkReviewEvidence に testBeforeReviewViolations 連動 (hard) + U-TORDER-001〜004 + U-REVIEW-006 に testBeforeReviewViolations==[] + 全回帰 green。

### Step 4: [直列] review Step (intra_runtime_subagent)
- 直列理由 = **downstream_dependency**。純関数 + back-fill honesty + 既存非破壊をレビュー。通過後 review_evidence 記録 + confirmed flip + REVERSE-14 で back-fill。

## §実装計画

- **src/schema/frontmatter.ts**: review_evidence entry に `tests_green_at` optional。
- **src/lint/review-evidence.ts** (情報源: L6-14 §1.2): ReviewEntry に reviewed_at/tests_green_at + testBeforeReviewViolations。
- **src/doctor/index.ts**: hard 連動 (既存経路)。
- **tests/review-evidence.test.ts**: U-TORDER。

## §6 用語更新

> L6-14 §6 (tests_green_at) を踏襲。新規語追加なし。

## §8 DoD

- [x] schema + lint + doctor + tests 実装、全 38 entry back-fill、typecheck 0 / vitest 205 green / doctor exit 0
- [x] review 前置 (pmo-sonnet PASS) → review_evidence 記録 + confirmed flip
- [x] PLAN-REVERSE-14 で back-fill pairing
