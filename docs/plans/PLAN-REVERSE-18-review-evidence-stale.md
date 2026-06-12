---
plan_id: PLAN-REVERSE-18-review-evidence-stale
title: "PLAN-REVERSE-18 (reverse): review-evidence stale approval の back-fill (IMP-080)"
kind: reverse
layer: cross
drive: agent
status: confirmed
created: 2026-06-08
updated: 2026-06-12
owner: PM / Codex TL
workflow_phase: R4
forward_routing: gap-only
promotion_strategy: reuse-as-is
confirmed_reverse_type: design
agent_slots:
  - role: tl
    slot_label: "TL - review-evidence 双方向化の上流反映"
generates:
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-19-review-evidence-stale.md
---

# PLAN-REVERSE-18 (reverse): review-evidence stale approval back-fill (IMP-080)

## §0 位置づけ

PLAN-L7-19 の add-impl を上流へ戻し、review-evidence lint が un-freeze 残骸を検出することを L7 unit test design に trace する。

## §3 工程表 (Step + 進捗)

### Step 1: [直列] L7-unit test design back-fill
直列理由: file_conflict
U-REVIEW stale approval oracle を L7 unit test design へ反映する。

### Step 2: [直列] governance carry 整合
直列理由: downstream_dependency
IMP-080 を IMP-071 拡張として扱い、別 lint へ分裂させない。

### Step 3: [直列] review
直列理由: downstream_dependency
self/pmo-sonnet review で add-impl -> reverse pairing と back-fill 範囲を確認する。

## §3.1 実装計画

- 情報源: PLAN-L7-19、`tests/review-evidence.test.ts`、`docs/improvement-backlog.md` IMP-080。
- 本 Reverse は runtime 実装を追加しない。

## §6 用語更新

新規 glossary term は追加しない。

## §8 DoD

- [x] PLAN-L7-19 を dependencies.requires に持つ
- [x] stale approval oracle が L7 unit test design に trace されている
