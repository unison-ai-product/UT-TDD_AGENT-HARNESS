---
plan_id: PLAN-REVERSE-501-worktree-lifecycle-domain-backfill
title: "PLAN-REVERSE-501: worktree lifecycle domain backfill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: agent
status: draft
route_signal: design_gap
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-08-24
updated: 2026-08-24
owner: PM / PO / Codex
parent_design: docs/plans/PLAN-L7-501-worktree-lifecycle-domain.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - lifecycle domain と placement 契約の差分を判定する"
  - role: qa
    slot_label: "QA - U-WTLIFE exact trace と mutation evidence を確認する"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-501-worktree-lifecycle-domain-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-501-worktree-lifecycle-domain.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L4-34-repository-runtime-placement-topology.md
    - docs/test-design/harness/L7-unit-test-design.md
    - docs/test-design/harness/L9-system-test-design.md
github_issue_id: 384
backprop_decision: not_required
backprop_decision_reason: "この初回 slice は既存設計契約を実装へ降ろすだけで、新しい上位設計を追加しない。"
review_evidence: []
---

# PLAN-REVERSE-501: worktree lifecycle domain backfill

## R0

`PLAN-L7-501` は #385 で pair-freeze された worktree lifecycle 契約のうち、record/FSM/reducer
だけを実装する。#232 inventory、#124 terminal、retention、projection、物理 cleanup の責務は
backfill 対象に含めない。

## R1〜R4 判定条件

- R1: `U-WTLIFE-001/002/006/010` が同じ PLAN revision と exact HEAD に束縛される。
- R2: event/reducer の不変条件と、L4/L9 の許可遷移に差分がない。
- R3: non-author review、targeted/full CI、plan trace が Green になる。
- R4: 上位 placement 契約へ追加 backfill が不要であること、または不足する後続 PLAN を明示して
  Forward へ再合流する。
