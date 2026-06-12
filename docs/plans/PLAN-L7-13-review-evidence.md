---
plan_id: PLAN-L7-13-review-evidence
title: "PLAN-L7-13 (add-impl): review 前置の機械強制 — src/lint/review-evidence.ts + schema review_evidence + doctor checkReviewEvidence (hard/fail-close) + tests (IMP-071)"
kind: add-impl
layer: L7
drive: agent
status: confirmed
created: 2026-06-05
updated: 2026-06-05
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — analyze 純関数 + loader 分離 / hasEvidence presence 検出の堅牢性 / doctor hard/fail-close 配線のレビュー"
  - role: qa
    slot_label: "QA — U-REVIEW 検査軸 + 実 repo 機構ガードのカバレッジ"
generates:
  - artifact_path: src/lint/review-evidence.ts
    artifact_type: source_module
  - artifact_path: src/schema/frontmatter.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/review-evidence.test.ts
    artifact_type: test_code
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-05"
    tests_green_at: "2026-06-05"
    verdict: approve_after_fixes
    scope: "src/lint/review-evidence.ts + schema + doctor + tests (APPROVE 条件付き、Critical 0 → I-1/I-2/m-3/m-4 修正後)。typecheck 0 / vitest 195 / doctor exit 0"
dependencies:
  parent: docs/plans/PLAN-L6-12-review-evidence.md
  requires: []
---

# PLAN-L7-13 (add-impl): review 前置の機械強制 実装

## §0 位置づけ

PLAN-L6-12 の機能設計を実装する add-impl。`src/schema/frontmatter.ts` に `review_evidence` フィールド + `src/lint/review-evidence.ts` (analyze/loader/messages) + `src/doctor/index.ts` `checkReviewEvidence` (hard/fail-close 配線) + `tests/review-evidence.test.ts` (U-REVIEW-001〜006)。back-fill pairing (add-impl → Reverse 合流) は PLAN-REVERSE-12。

## §工程表

### Step 1: [直列] schema + lint module 実装
- 直列理由 = **file_conflict** (frontmatter.ts / review-evidence.ts を書く)。`review_evidence` zod (array of {reviewer, review_kind, reviewed_at, verdict, scope?}) + KIND_REVIEW_REQUIRED/STATUS_REVIEW_REQUIRED + analyzeReviewEvidence + loadReviewPlans + hasReviewEvidence。

### Step 2: [直列] doctor 配線 (hard/fail-close)
- 直列理由 = **downstream_dependency** (Step 1 の関数を使う)。checkReviewEvidence を runDoctor に hard/fail-close で配線。

### Step 3: [直列] tests + 全回帰
- 直列理由 = **downstream_dependency**。U-REVIEW-001〜006 + 全回帰 green。

### Step 4: [直列] review Step (intra_runtime_subagent)
- 直列理由 = **downstream_dependency**。code-reviewer で純関数/loader 分離・presence 検出・hard/fail-close 配線・既存 lint 非重複をレビュー。通過後 review_evidence 記録 + confirmed flip + REVERSE-12 で back-fill。

## §実装計画

- **src/lint/review-evidence.ts** (情報源: backfill-pairing.ts pattern + L6-12 機能設計): analyze/loader/messages。
- **src/schema/frontmatter.ts** (情報源: 既存 optional フィールド実例): review_evidence optional array。
- **src/doctor/index.ts** (情報源: checkPairFreeze hard/fail-close pattern): checkReviewEvidence。
- **tests/review-evidence.test.ts** (情報源: backfill-pairing.test.ts pattern): U-REVIEW。

## §6 用語更新

> L6-12 §6 (review_evidence) を踏襲。新規語の追加なし (impl は L6-12 の語を実装)。

## §8 DoD

- [x] schema + lint + doctor + tests 実装、typecheck 0 / vitest 全回帰 green / doctor exit 0
- [x] review 前置 (code-reviewer) → 通過後 review_evidence 記録 + confirmed flip
- [x] PLAN-REVERSE-12 で back-fill pairing (add-impl → Reverse 合流)
