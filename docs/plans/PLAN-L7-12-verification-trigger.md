---
plan_id: PLAN-L7-12-verification-trigger
title: "PLAN-L7-12 (add-impl): 検証タイミングの機械発火の実装 — analyzeVerificationGroups + doctor checkVerificationGroups (IMP-068)"
kind: add-impl
layer: L7
drive: agent
status: confirmed
created: 2026-06-05
updated: 2026-06-12
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-12"
    tests_green_at: "2026-06-12"
    verdict: approve_after_fixes
    scope: "L7 completion audit A-135: U-VTRIG artifacts exist, target tests and full npm test green, G4/G7 codex-only checklist review passed with .ut-tdd/audit/A-135-l7-completion-review-checklist.yaml."
agent_slots:
  - role: tl
    slot_label: "TL — loadPairDocs の status 拡張が既存 pair-freeze を壊さないか / freeze 判定の純関数の正しさ / placeholder=park 許容 / doctor hard/fail-close 配線のレビュー (claude-only は code-reviewer 代替)"
  - role: qa
    slot_label: "QA — U-VTRIG-001〜005 oracle 被覆 + 実 repo ガード (L0-L3 frozen / L4-L6 進行中) の妥当性"
generates:
  - artifact_path: src/vmodel/lint.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/vmodel-pair.test.ts
    artifact_type: test_code
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
dependencies:
  parent: docs/plans/PLAN-L6-11-verification-trigger.md
  requires:
    - docs/plans/PLAN-L6-11-verification-trigger.md
---

# PLAN-L7-12 (add-impl): 検証タイミングの機械発火の実装

## §0 位置づけ

PLAN-L6-11 (vmodel-pair-freeze.md §7) の機能設計を実装する。`src/vmodel/lint.ts` に層群 freeze 集計 (loadPairDocs の status 拡張 + analyzeVerificationGroups + verificationGroupMessages) を追加し、doctor に `checkVerificationGroups` を hard/fail-close で配線。③ ペア = L7-unit §1.14 U-VTRIG。

## §工程表

### Step 1: [直列] src/vmodel/lint.ts に層群 freeze 集計を実装
- 直列理由 = **file_conflict** (lint.ts を書く)。PairDoc に status 追加 / analyzeVerificationGroups (frozen = draft 0 + 孤児0 + confirmed≥1、placeholder=park) / verificationGroupMessages / designLayerFromPath・isDesignSubDoc を export。

### Step 2: [直列] doctor checkVerificationGroups 配線 (hard/fail-close)
- 直列理由 = **downstream_dependency**。`src/doctor/index.ts` に hard/fail-close surface (`verificationGroups.ok` -> `runDoctor.ok`)。

### Step 3: [直列] tests/vmodel-pair.test.ts に U-VTRIG
- 直列理由 = **downstream_dependency**。U-VTRIG-001〜005 + 実 repo ガード。doc() ヘルパに status 追加。

### Step 4: [直列] review Step (intra_runtime_subagent)
- 直列理由 = **downstream_dependency**。code-reviewer で実装⇔設計⇔テスト設計の同粒度をレビュー。

## §実装計画

- **src/vmodel/lint.ts** (情報源: vmodel-pair-freeze.md §7): 層群集計の純関数。
- **src/doctor/index.ts** (情報源: 既存 checkPairFreeze 配線): checkVerificationGroups hard/fail-close。
- **tests/vmodel-pair.test.ts** (情報源: L7-unit §1.14): U-VTRIG。
- 設計粒度 = L7 単体テスト設計粒度。

## §6 用語更新

- **検証発火 / 検証層群**: PLAN-L6-11 §6 で宣言済。L0 §10 への back-merge は REVERSE-11 で実施。

## §7 DoD
- [x] src/vmodel/lint.ts (層群 freeze 集計) + doctor checkVerificationGroups (hard/fail-close)
- [x] tests U-VTRIG-001〜005 + 実 repo ガード green
- [x] typecheck 0 / vitest 全 pass / biome CLEAN
- [x] review 前置 (pmo-sonnet を code-reviewer 代替で実施、2026-06-05 APPROVE。freeze 判定の A-100 整合 / 既存非破壊 / 同粒度を確認)
- [x] Reverse (REVERSE-11) で検証ロードマップ反映 + glossary back-merge
