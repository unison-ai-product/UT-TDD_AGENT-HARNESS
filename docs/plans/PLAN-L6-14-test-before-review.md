---
plan_id: PLAN-L6-14-test-before-review
title: "PLAN-L6-14 (add-design): test→review 順序強制の機能設計 — review_evidence に tests_green_at + 全駆動モデル普遍の「定量テスト→定性レビュー」順序を機械強制 (IMP-077)"
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
    scope: "test→review 順序強制の機能設計 (DbC: tests_green_at≤reviewed_at、全駆動モデル普遍) + scope。pmo-sonnet PASS (Critical 0)。code-reviewer は IMP-009 truncate のため pmo-sonnet 確定。claude-only TL 代替"
agent_slots:
  - role: tl
    slot_label: "TL — DbC (tests_green_at ≤ reviewed_at、全 kind/駆動モデル普遍) / 既存 review-evidence lint 非破壊 / 全 review_evidence entry への普遍適用の妥当性レビュー"
generates:
  - artifact_path: docs/design/harness/L6-function-design/test-before-review.md
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

# PLAN-L6-14 (add-design): test→review 順序強制の機能設計

## §0 位置づけ

PO 指示「テストをしたあとにレビューするように強制して。フィーチャーで。これは駆動モデルのワークフローもすべて」。品質保証の二軸 (定量テスト × 定性レビュー、柱6) のうち**順序**を機械強制する: **定量検証 (vitest/doctor/lint = 定量テスト) が green になってから 定性レビューを行う** (未検証成果物をレビューしない)。IMP-071 (review 前置 presence) / IMP-076 (cross_agent distinctness) の続き = **review_evidence の時間順序制約** (IMP-077)。

> **全駆動モデル普遍 (PO 2026-06-05「駆動モデルのワークフローもすべて」)**: 本順序は design/impl に限らず **9 駆動モデルすべての workflow** に適用する。各 mode の 定量 verify step (Discovery=S3 verify / Scrum=increment テスト / Reverse=③テスト設計状態確定 / Incident=収束確認 / Refactor=テスト緑確認 / Retrofit=L8 回帰 / Add-feature=テスト確認 / Research=候補比較 evidence) が、その mode の 定性 review/サインオフ step の**前**に来ることを、共通アンカー = `review_evidence` の `tests_green_at ≤ reviewed_at` で機械保証する。

## §1 機能仕様 (関数粒度)

### §1.1 schema 拡張
`review_evidence[]` の各 entry に `tests_green_at: string` (定量検証 = vitest/doctor/lint が green になった時刻)。当初 optional (back-compat) → back-fill 後 presence hard。

### §1.2 判定関数 (analyzeReviewEvidence 拡張) — DbC
- **Precondition**: parsed review_evidence entry (reviewed_at + tests_green_at)。
- **Postcondition**: `testBeforeReviewViolations: {plan_id, reason}[]` を返す。**全 entry (kind/駆動モデル 非依存)** について:
  - `tests_green_at` 欠落 → violation (`missing_tests_green_at`、presence)。
  - `tests_green_at > reviewed_at` → violation (`review_before_test`、順序。ISO 日付の辞書順比較)。
- **Invariant**: review_evidence を持つ全 PLAN (全駆動モデル) で `tests_green_at ≤ reviewed_at` (定量テスト後に定性レビュー)。`ok = missing==0 && crossReviewViolations==0 && testBeforeReviewViolations==0`。

### §1.3 doctor 配線
`checkReviewEvidence` (既存 hard) が `result.ok` を返すため自動で `runDoctor.ok` 連動。

## §工程表

### Step 1: [直列] 機能設計 doc + L7-unit ペア
- 直列理由 = **file_conflict** (test-before-review.md 起草) + downstream (L7-unit §1.15 に U-TORDER 追記)。

### Step 2: [直列] review Step (intra_runtime_subagent)
- 直列理由 = **downstream_dependency**。DbC (順序・全駆動モデル普遍) + 既存 lint 非破壊をレビュー。通過後 review_evidence 記録 + confirmed flip。

## §実装計画

- **test-before-review.md** (情報源: 本 PLAN §1 + function §3.1 各駆動モデル exit + review-evidence.ts): schema + DbC + 全駆動モデル普遍 + 段階 (warn→back-fill→hard)。
- **L7-unit-test-design.md** (情報源: U-REVIEW/U-XREVIEW 既存): U-TORDER 追記。

## §6 用語更新

- **tests_green_at**: review_evidence entry の定量検証 green 時刻。`tests_green_at ≤ reviewed_at` (定量テスト→定性レビュー順序) が全駆動モデル普遍の不変条件。L0 §10 back-merge = REVERSE-14。

## §8 DoD

- [x] test-before-review.md 起草 (DbC + 全駆動モデル普遍 + 段階)
- [x] L7-unit ペア追記 (U-TORDER)、孤児0 (pair-freeze 33)
- [x] review 前置 (pmo-sonnet PASS) → review_evidence 記録 + confirmed flip
- [x] add-impl = PLAN-L7-15 / back-fill = PLAN-REVERSE-14 とペア
