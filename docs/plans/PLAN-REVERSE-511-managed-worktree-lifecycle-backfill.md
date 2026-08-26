---
plan_id: PLAN-REVERSE-511-managed-worktree-lifecycle-backfill
title: "PLAN-REVERSE-511: managed worktree lifecycle backfill"
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
created: 2026-08-26
updated: 2026-08-26
owner: Codex / TL
parent_design: docs/plans/PLAN-L7-511-managed-worktree-lifecycle.md
pair_artifact: docs/test-design/harness/L7-managed-worktree-lifecycle-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - managed lifecycle backfill boundary"
  - role: qa
    slot_label: "QA - Reverse R1-R4 evidence"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-511-managed-worktree-lifecycle-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-511-managed-worktree-lifecycle.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L4-34-repository-runtime-placement-topology.md
    - docs/plans/PLAN-L7-501-worktree-lifecycle-domain.md
github_issue_id: 425
backprop_decision: required
review_evidence: []
---

# PLAN-REVERSE-511

## R0

既存のlifecycle domainへ、実creatorの作成・異常終了・terminal cleanup handoffを結線する。
Git mutationは単一transactionではないため、planned/lease/activation-abortを持つreplay可能なsagaとして
上位placement契約へ戻す。物理cleanupは#426へforward routingする。

## R1-R4

- R1: create/terminal/ledger oracleをexact PLAN revisionへ束縛する。
- R2: creator全入口とfault injectionの網羅性を検査する。
- R3: non-author review、Linux/Windows/aggregate CIを確認する。
- R4: L4 placementへmanaged creator責務をbackfillし、#426へ再合流する。
