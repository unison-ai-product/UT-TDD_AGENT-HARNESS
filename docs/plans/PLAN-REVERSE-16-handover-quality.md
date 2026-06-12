---
plan_id: PLAN-REVERSE-16-handover-quality
title: "PLAN-REVERSE-16 (reverse/back-fill): handover 品質増分を上位整合へ合流 — requirements §6.8.5 enforcement gap 解消 + concept §10 用語 (handover bypass 検知 / active-plan marker stale) back-merge (IMP-078)"
kind: reverse
layer: cross
drive: agent
status: confirmed
created: 2026-06-08
updated: 2026-06-08
owner: PM (Opus) / PO (人間)
workflow_phase: R4
forward_routing: gap-only
promotion_strategy: reuse-as-is
confirmed_reverse_type: design
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-08"
    tests_green_at: "2026-06-08"
    verdict: pass
    scope: "Add-feature (handover 品質増分 IMP-078 5 gap) の back-fill。requirements §6.8.5 の handover 機械 surface に bypass 検知の機械着地を明示 + concept §10 用語 2 件 merge。back-fill は実在事実の転記のみ (捏造なし)。pmo-sonnet PASS。claude-only TL 代替"
agent_slots:
  - role: tl
    slot_label: "TL — requirements §6.8.5 への bypass 検知 (checkHandoverBypass) 機械着地注記が設計意図と整合するか / concept §10 用語の living glossary 整合をレビュー"
generates:
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    artifact_type: markdown_doc
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-17-handover-quality.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-REVERSE-16 (reverse/back-fill): handover 品質増分を上位整合へ合流 (IMP-078)

## §0 位置づけ

PLAN-L7-17 (add-impl, handover 品質増分) の bottom-up build を上位設計/governance へ Reverse 合流させる back-fill。駆動モデルは「設計ドキュメントまで戻す」までが 1 サイクル ([[feedback_impl_must_backfill_to_design]])。本サイクル自体が handover 機構の enforcement gap を潰すものであり、その合流を正規手続きで実演する (dogfooding)。

## §工程表

### Step 1: [直列] requirements §6.8.5 に bypass 検知の機械着地を注記
- 直列理由 = **file_conflict** (requirements を書く)。handover-on-completion 規律 (§6.8.5) の機械 surface に「手書き bypass は checkHandoverBypass (generated_by 署名 + entry 数照合) が検知」を追記 (doc-only だった enforcement の機械着地を明示)。

### Step 2: [直列] concept §10 用語 back-merge
- 直列理由 = **file_conflict** (concept を書く)。§10 用語集に **handover bypass 検知** / **active-plan marker stale** を merge (living glossary)。

### Step 3: [直列] review Step + R4 合流確定
- 直列理由 = **downstream_dependency**。pmo-sonnet で back-fill が実在事実の転記のみ (捏造なし) を確認 → review_evidence + confirmed。

## §実装計画

- **docs/governance/ut-tdd-agent-harness-requirements_v1.2.md §6.8.5** (情報源: PLAN-L7-17 実装実体 + 既存 §6.8.5): bypass 検知の機械着地注記。
- **docs/governance/ut-tdd-agent-harness-concept_v3.1.md §10** (情報源: L6-16 §6 用語): 用語 2 件 back-merge。

## §6 用語更新

- **handover bypass 検知** / **active-plan marker stale** を L0 §10 用語集へ back-merge (L6-16 §6 で宣言 → 本 Reverse で merge)。

## §8 DoD

- [x] requirements §6.8.5 に bypass 検知の機械着地注記 (doc×機械の対を明示)
- [x] concept §10 に用語 2 件 back-merge (doctor checkBackfill glossary gap 解消)
- [x] back-fill は実在事実の転記のみ (捏造禁止)
- [x] dependencies.requires = PLAN-L7-17 (add-impl ⇔ Reverse pairing 宣言)
