---
plan_id: PLAN-L6-16-handover-quality
title: "PLAN-L6-16 (add-design): handover 機構の品質増分 機能設計 — 5 gap (手書き bypass 検知 / active-plan stale / commit 捕捉 / session scope / unknown-kind 解決) の機械担保 (IMP-078)"
kind: add-design
layer: L6
drive: fullstack
status: confirmed
created: 2026-06-08
updated: 2026-06-08
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — checkHandoverBypass の責務分離 (presence/stale/drift と別) / generated_by + doc_entry_count の bypass 検知妥当性 / current-plan 2 行目 updated_at の後方互換 / session scope の fallback / family 解決の最長 slug 正本化レビュー (claude-only は code-reviewer/pmo-sonnet 代替)"
generates:
  - artifact_path: docs/design/harness/L6-function-design/handover-mechanism.md
    artifact_type: design_doc
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L7
github_issue_id: null
dependencies:
  parent: docs/plans/PLAN-L6-06-handover-mechanism.md
  requires: []
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-08"
    tests_green_at: "2026-06-08"
    verdict: pass
    scope: "handover 品質増分 (§2.7 5 gap) 機能設計のレビュー。bypass 検知の責務分離・後方互換・session scope fallback・family 解決を確認。pmo-sonnet 確定 (code-reviewer は IMP-009 truncate)。claude-only TL 代替"
---

# PLAN-L6-16 (add-design): handover 機構の品質増分 機能設計 (IMP-078)

## §0 位置づけ

PLAN-L6-06 (handover 機構 add-design, confirmed) の上への品質増分。実 session 運用で PO が「ハンドオーバーってこういう時に入らないの?」と指摘し、5 つの品質/enforcement gap を検出 (IMP-078)。柱 2 (doc×機械厳格化) / 柱 3 (自動化で state 管理) に照らし、機械担保を増分する。成果物 = handover-mechanism.md §2.7 (新規 ①) ⇔ L7-unit §1.5 U-SLOG-006 / §1.8 U-HOVER-011〜012 ペア。

## §工程表

### Step 1: [直列] handover-mechanism.md §2.7 品質増分 設計
- 直列理由 = **file_conflict** (handover-mechanism.md を書く)。5 gap × 機械担保の表 + 配線 (Stop hook surface) を設計。
- 情報源: 実 session の gap 観測 (IMP-078 backlog) + 既存 §2.3 関数 signature。

### Step 2: [直列] L7-unit §1.5/§1.8 ペア + 量閉じ
- 直列理由 = **downstream_dependency** (Step 1 の DbC からテスト oracle 導出)。U-SLOG-006 + U-HOVER-011〜012 + 量閉じ追記 (孤児0)。

### Step 3: [直列] review Step (intra_runtime_subagent) + G6 freeze
- 直列理由 = **downstream_dependency**。pmo-sonnet で設計レビュー → 通過後 review_evidence 記録 + confirmed flip。

## §実装計画

- **docs/design/harness/L6-function-design/handover-mechanism.md §2.7** (情報源: IMP-078 gap 観測 + §2.3 既存関数): 5 gap 機能設計。
- **docs/test-design/harness/L7-unit-test-design.md §1.5/§1.8** (情報源: 既存 U-HOVER 構造): U-SLOG-006 + U-HOVER-011〜012 ③。

## §6 用語更新

- **handover bypass 検知**: `ut-tdd handover` 機構を経ない手書き更新 (generated_by 署名欠落 / md entry 数 mismatch) を `checkHandoverBypass` が surface (IMP-078 gap①)。
- **active-plan marker stale**: current-plan marker (2 行目 updated_at) が古く、解決した active_plan が最新作業と乖離する状態 (`activePlanStale`、IMP-078 gap②)。
- → L0 §10 用語集へ back-merge (REVERSE-16)。

## §8 DoD

- [x] handover-mechanism.md §2.7 (5 gap 機能設計) + L7-unit U-SLOG-006/U-HOVER-011〜012 ペア (孤児0)
- [x] review 前置 (pmo-sonnet) → 通過後 review_evidence 記録 + confirmed flip
- [x] L7 add-impl = PLAN-L7-17 / back-fill = PLAN-REVERSE-16 とペア
