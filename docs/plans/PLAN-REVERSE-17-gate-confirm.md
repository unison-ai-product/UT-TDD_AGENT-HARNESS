---
plan_id: PLAN-REVERSE-17-gate-confirm
title: "PLAN-REVERSE-17 (reverse): gate-confirm coupling lint の back-fill (IMP-079)"
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
    slot_label: "TL - add-impl の結果を governance / test-design へ戻す"
generates:
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-18-gate-confirm.md
---

# PLAN-REVERSE-17 (reverse): gate-confirm coupling lint back-fill (IMP-079)

## §0 位置づけ

PLAN-L7-18 の add-impl を上流に戻し、gate-confirm lint が L7-unit test design と governance 記述に trace されるようにする。

## §3 工程表 (Step + 進捗)

### Step 1: [直列] L7-unit test design back-fill
直列理由: file_conflict
U-GCONF oracle を L7 unit test design へ反映する。

### Step 2: [直列] governance carry 整合
直列理由: downstream_dependency
hard/fail-close 化は完了。IMP-079 の残課題は gate 台帳と confirmed doc の継続整合監査に限定する。

### Step 3: [直列] review
直列理由: downstream_dependency
self/pmo-sonnet review で add-impl -> reverse pairing と back-fill 範囲を確認する。

## §3.1 実装計画

- 情報源: PLAN-L7-18、`tests/gate-confirm.test.ts`、`docs/improvement-backlog.md` IMP-079。
- 本 Reverse は runtime 実装を追加しない。設計・テスト設計への trace を補完する。

## §6 用語更新

新規 glossary term は追加しない。freeze 偽装の検出は gate / confirmed の既存語彙で扱う。

## §8 DoD

- [x] PLAN-L7-18 を dependencies.requires に持つ
- [x] U-GCONF が L7 unit test design に trace されている
