---
plan_id: PLAN-REVERSE-500-review-head-eligibility-supersession-backfill
title: "PLAN-REVERSE-500: current-HEAD review eligibility契約の上流合流"
kind: reverse
layer: cross
drive: agent
workflow_phase: R1
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
status: draft
created: 2026-08-24
updated: 2026-08-24
owner: PM / PO / Codex
parent_design: docs/plans/PLAN-L7-500-review-head-eligibility-supersession.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - current-head projection差分をL6 cross-review契約へ戻す判定"
  - role: qa
    slot_label: "QA - 履歴保持と現HEAD merge判定の分離を再検収"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-500-review-head-eligibility-supersession-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-500-review-head-eligibility-supersession.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-85-automated-pr-cross-review-merge-contract.md
    - docs/plans/PLAN-L7-470-review-dispatch-analyzer-ownership.md
    - docs/plans/PLAN-L7-500-review-head-eligibility-supersession.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/392
review_evidence: []
---

# PLAN-REVERSE-500: current-HEAD review eligibility契約の上流合流

## 1. R0予約

PLAN-L7-500 は D1 analyzer の履歴監査を変更せず、D2-B merge gateの判定対象を exact
current HEADへ限定する実装差分である。実装・Red/Green oracle・非著者レビューが未完了のため、
上流契約へ合流済みとは主張しない。

## 2. backfill対象

実装後、次の差分だけを PLAN-L6-85 と cross-review enforcement の上流設計へ戻す。

- historical request/receipt/diagnostic は保持し、merge authorization は current-head projection
  だけを読むこと。
- old-head FLAG は current-head PASS を無効化せず、same-head FLAG は blocking のままにすること。
- current HEAD に対応する receipt/request が無い場合は old-head evidence から推測せず denyすること。
- runtime root / worktree の物理配置は判定入力ではなく、同一証拠に対して判定不変であること。

R1以降は、U-RVMGのRed/Green実測と exact HEAD closing reviewを根拠に、上流へ戻す必要がある
契約差分だけを記録する。#389/#384/#388の資産は本Reverseの対象外とする。

