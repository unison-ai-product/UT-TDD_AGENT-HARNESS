---
plan_id: PLAN-REVERSE-447-memory-rule-builder-backfill
title: "PLAN-REVERSE-447: メモリ→機構化ビルダーの設計 back-fill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: be
status: draft
route_signal: design_gap
route_mode: reverse
created: 2026-07-16
updated: 2026-07-16
owner: PO / Claude
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - memory ライフサイクル (candidate→PLAN→機構化→圧縮) の設計 back-fill scope"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-447-memory-rule-builder-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-447-memory-rule-builder.md
  requires: []
  references:
    - docs/plans/PLAN-L7-447-memory-rule-builder.md
    - .ut-tdd/memory/feedback-po-2026-07-16.md
---

# PLAN-REVERSE-447: メモリ→機構化ビルダーの設計 back-fill

## 状態

draft 起票 (PLAN-L7-447 の Reverse pairing、R0 メモ)。

## Back-Fill 候補

- 共有メモリのライフサイクル設計 (rule-candidate → PLAN 起票 → 機構化 → ポインタ化/圧縮、
  サイズ予算 20K) を L6 function design (memory 系 doc) へ 1 節追記する。
- にゃ！プロトコルのマーカー語彙 (表情スケール + 🐈‍⬛ rule-candidate) を機械可読仕様として
  設計 doc に固定する。

## DoD

- [ ] memory ライフサイクルとサイズ予算が設計 doc に記録される。
- [ ] マーカー語彙の機械可読仕様が設計 doc に記録される。
