---
plan_id: PLAN-REVERSE-498-green-command-anchor-reachability-backfill
title: "PLAN-REVERSE-498: anchor 到達可能性契約の上流合流"
kind: reverse
layer: cross
drive: db
workflow_phase: R1
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
status: draft
created: 2026-08-21
updated: 2026-08-21
owner: PO / Claude
parent_design: docs/plans/PLAN-L7-498-green-command-anchor-reachability.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - 到達可能性契約を L6 の green_command 契約へ backfill するかの判定"
  - role: qa
    slot_label: "QA - 捏造 anchor / squash merge 済み anchor / 基準点欠落の三面を再検収する"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-498-green-command-anchor-reachability-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-498-green-command-anchor-reachability.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-497-green-command-anchor-required.md
    - docs/plans/PLAN-L7-498-green-command-anchor-reachability.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/367
review_evidence: []
---

# PLAN-REVERSE-498: anchor 到達可能性契約の上流合流

## 1. R1〜R2 対象

- `anchor_commit` が**字面だけでなく実在すること**を、どの範囲で要求するか。`PLAN-L7-497` が
  backfill した L6 契約は必須化までで、実在性には触れていない。
- 検査基準点を **main ではなく PR** に置くという境界。main 基準が squash merge 運用で成立しない
  という実測 (29 件 false positive) を契約側へ残し、同じ設計が別 gate で再発するのを防ぐ。
- 「新規追加 entry」の判定を **PR diff から導く**という規律。自己申告値 (`completed_at` 等) を
  判定入力にしないこと。
- 基準点が解決できない面での**縮退**規則 (推測で violation を作らない)。
- **非目標の明示**: 既存 entry の実在検査、merge 後の再検査、`green-command-digest` の
  `unverifiable` fail-open の変更。いずれも原理的または意図的に対象外であることを契約へ残す。

## 2. R3〜R4

R3 では非著者 reviewer が、(a) 捏造 anchor が確実に落ちるか、(b) squash merge 済みの正当な
anchor を落としていないか、(c) 基準点欠落面で推測 violation を作っていないか、(d) CI の clone
形状を前提条件として実測したか、を攻撃する。

R4 では実測で必要と判明した差分だけを `docs/design/harness/L6-function-design/test-before-review.md`
へ戻す。`PLAN-L7-303` の二層照合契約と `PLAN-L7-497` の必須化契約は変更しない。
