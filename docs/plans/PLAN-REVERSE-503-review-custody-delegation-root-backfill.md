---
plan_id: PLAN-REVERSE-503-review-custody-delegation-root-backfill
title: "review custody delegation root normalization Reverse backfill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: be
status: draft
route_signal: drift
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-08-25
updated: 2026-08-25
owner: Codex / Luna
github_issue_id: 396
parent_design: docs/plans/PLAN-L7-503-review-custody-delegation-root.md
pair_artifact: docs/test-design/harness/L7-review-custody-delegation-root-test-design.md
backprop_decision: required
backprop_decision_reason: "D3a custodyの入力rootを実測されたGit toplevelへ固定する。"
agent_slots:
  - role: tl
    slot_label: "TL - D3a custody root boundary backprop"
  - role: qa
    slot_label: "QA - nested repository evidence and exact-head receipt"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-503-review-custody-delegation-root-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-503-review-custody-delegation-root.md
  requires:
    - docs/plans/PLAN-L7-503-review-custody-delegation-root.md
  blocks: []
review_evidence: []
---

# PLAN-REVERSE-503

## Backfill contract

L7実装の実測で、delegation commandが`process.cwd()`を直接custody rootへ渡す経路を閉じる。
レビューのrequest、attempt、verdict、receiptがGit toplevelへ集約されることをR1で記録し、
R2でD3a契約へ反映し、R3でexact-head receiptとCIを再検収し、R4で`PLAN-L7-493`の
repo-local custody運用へbackpropする。

## R1→R4

- R1: nested Git directoryからの実測receipt pathとroot外不存在を記録。
- R2: D3a repo-local custodyの呼出しroot境界を更新。
- R3: Linux/Windows/aggregateとnon-author reviewで再検証。
- R4: reverse statusをconfirmedへ更新し、未修理のprovider permission問題を別Issueへ残す。
