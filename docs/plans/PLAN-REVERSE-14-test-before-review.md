---
plan_id: PLAN-REVERSE-14-test-before-review
title: "PLAN-REVERSE-14 (reverse/back-fill): test→review 順序を governance へ合流 — 全駆動モデル workflow の「定量テスト→定性レビュー」順序を concept/requirements/function §3 に明示 (IMP-077)"
kind: reverse
layer: cross
drive: agent
status: confirmed
created: 2026-06-05
updated: 2026-06-05
owner: PM (Opus) / PO (人間)
workflow_phase: R4
forward_routing: gap-only
promotion_strategy: reuse-as-is
confirmed_reverse_type: design
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-05"
    tests_green_at: "2026-06-05"
    verdict: pass
    scope: "test→review 順序の governance back-fill (concept §2.1.2.1 核心ルール6 + §10.3 用語 + function §3 各駆動モデル順序 + requirements §7.8.7)。pmo-sonnet PASS (Critical 0)。claude-only TL 代替"
agent_slots:
  - role: tl
    slot_label: "TL — 全駆動モデル exit contract の test→review 順序注記が設計意図と整合するかレビュー"
generates:
  - artifact_path: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-15-test-before-review.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-REVERSE-14 (reverse/back-fill): test→review 順序を governance へ合流

## §0 位置づけ

Add-feature (L6-14/L7-15) を上位へ戻し 1 サイクル完結 (IMP-051)。「定量テスト → 定性レビュー」順序が **9 駆動モデルすべての workflow に普遍**であることを concept (品質保証原則) + function §3 (各駆動モデル exit contract) に明示し、機械着地 (review_evidence.tests_green_at) を注記する。

## §工程表

### Step 1: [直列] concept 品質保証原則 + function §3 注記
- 直列理由 = **file_conflict** (concept + function を書く)。concept に「定量テスト→定性レビュー順序 (全駆動モデル普遍)」+ 機械着地 (tests_green_at)。function §3.1/§3.2 に「各 mode の verify step が review step の前」+ review_evidence.tests_green_at アンカーを注記。

### Step 2: [直列] requirements §7.8.7 + concept §10 用語
- 直列理由 = **downstream_dependency**。requirements §7.8.7 に IMP-077 着地 + concept §10.3 に tests_green_at 用語 back-merge。

### Step 3: [直列] review Step (intra_runtime_subagent)
- 直列理由 = **downstream_dependency**。通過後 confirmed flip。

## §実装計画

- **concept §2.1.2.1 / 品質保証**: 定量→定性 順序原則 (全駆動モデル) + tests_green_at 機械着地。
- **function §3.1/§3.2**: 各駆動モデル exit の verify→review 順序注記。
- **requirements §7.8.7 + concept §10.3**: IMP-077 着地 + tests_green_at 用語。

## §6 用語更新

> back-merge 実施側 (L6-14 §6 tests_green_at を concept §10 へ merge)。新規語追加なし。

## §8 DoD

- [x] concept + function §3 + requirements §7.8.7 注記 + concept §10 用語 back-merge
- [x] doctor checkBackfill green (L7-15 Reverse 合流 / glossary merge 済)
- [x] review 前置 (pmo-sonnet PASS) → confirmed flip。**confirmed flip 時の review_evidence は vitest green 確認後に記録し tests_green_at を同時記入** (自己違反回避、P4)
- [x] IMP-077 → implemented
