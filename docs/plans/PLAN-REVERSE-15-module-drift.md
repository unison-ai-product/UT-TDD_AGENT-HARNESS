---
plan_id: PLAN-REVERSE-15-module-drift
title: "PLAN-REVERSE-15 (reverse/back-fill): module-drift lint を上位整合へ合流 — ADR-002 §Follow-ups に最小スライス実装注記 + concept §10 用語 (module-drift) back-merge + architecture §4.1 反映 (IMP-075/074)"
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
    scope: "Add-feature (module-drift lint IMP-075 + asset-drift carry plan_id IMP-074) の back-fill。ADR-002 §Follow-ups に IMP-032 最小スライス実装注記 + concept §10 用語 merge + architecture §4.1 反映。back-fill は実在事実の転記のみ (捏造なし)。pmo-sonnet PASS。claude-only TL 代替"
agent_slots:
  - role: tl
    slot_label: "TL — ADR-002 への実装注記が設計意図 (IMP-032 import グラフ drift とは別の最小スライス) と整合するか / concept §10 用語の living glossary 整合をレビュー"
generates:
  - artifact_path: docs/adr/ADR-002-dependency-direction-and-auto-map.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    artifact_type: markdown_doc
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-16-module-drift.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-REVERSE-15 (reverse/back-fill): module-drift lint を上位整合へ合流 (IMP-075/074)

## §0 位置づけ

PLAN-L7-16 (add-impl, module-drift lint) の bottom-up build を上位設計/governance へ Reverse 合流させる back-fill。駆動モデルは「設計ドキュメントまで戻す」までが 1 サイクル ([[feedback_impl_must_backfill_to_design]])。本 lint 自体が impl→design back-fill 漏れを潰す機構であり、本 PLAN がその合流を実演する (dogfooding)。

## §工程表

### Step 1: [直列] ADR-002 §Follow-ups に最小スライス実装注記
- 直列理由 = **file_conflict** (ADR-002 を書く)。IMP-032 (import グラフ drift、knip/madge) の前段として「module 集合包含 drift = `src/lint/module-drift.ts` で実装済 (最小スライス)」を注記。IMP-032 本体 (循環/逆依存) は引き続き carry。

### Step 2: [直列] concept §10 用語 back-merge
- 直列理由 = **file_conflict** (concept を書く)。§10 用語集に **module-drift** を merge (living glossary)。

### Step 3: [直列] review Step + R4 合流確定
- 直列理由 = **downstream_dependency**。pmo-sonnet で back-fill が実在事実の転記のみ (捏造なし) を確認 → review_evidence + confirmed。

## §実装計画

- **docs/adr/ADR-002-dependency-direction-and-auto-map.md** (情報源: PLAN-L7-16 実装実体 + 既存 §Follow-ups): module-drift 最小スライス実装注記。
- **docs/governance/ut-tdd-agent-harness-concept_v3.1.md §10** (情報源: L6-15 §6 用語): module-drift back-merge。

## §6 用語更新

- **module-drift** を L0 §10 用語集へ back-merge (L6-15 §6 で宣言 → 本 Reverse で merge)。

## §8 DoD

- [x] ADR-002 §Follow-ups に最小スライス実装注記 (IMP-032 本体は carry 維持)
- [x] concept §10 に module-drift back-merge (doctor checkBackfill glossary gap 解消)
- [x] back-fill は実在事実の転記のみ (捏造禁止)
- [x] dependencies.requires = PLAN-L7-16 (add-impl ⇔ Reverse pairing 宣言、doctor checkBackfill 整合)
