---
plan_id: PLAN-REVERSE-497-green-command-anchor-backfill
title: "PLAN-REVERSE-497: anchor 必須化契約の上流合流"
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
parent_design: docs/plans/PLAN-L7-497-green-command-anchor-required.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - anchor 必須化を L6 review-evidence 契約へ backfill するかの判定"
  - role: qa
    slot_label: "QA - 既存 entry 全件通過と、2 つの violation reason の判別性を再検収する"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-497-green-command-anchor-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-497-green-command-anchor-required.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-303-digest-commit-anchor.md
    - docs/plans/PLAN-L7-497-green-command-anchor-required.md
    - docs/design/harness/L6-function-design/review-evidence.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/191
review_evidence: []
---

# PLAN-REVERSE-497: anchor 必須化契約の上流合流

## 1. R1〜R2 対象

- `green_commands[].anchor_commit` が **記入必須項目**になったこと。L6 の review-evidence 契約は
  現在 anchor を任意項目として記述しており、実装との差が残る。
- 「発効時刻による段階導入」を採らない理由 (`completed_at` は自己申告値であり fail-close の判定入力に
  できない) を契約側へ残すこと。同型の段階導入が別 gate で再発するのを防ぐ。
- anchor の形式契約 (`^[0-9a-f]{7,40}$`、可変参照を認めない) の帰属先。
- anchor の**実在検査は含まない**という境界 (squash merge 運用では判定不能、実測 29 件の false
  positive で撤回)。実在検査は issue #367 の守備範囲であることを明示する。

## 2. R3〜R4

R3 では非著者 reviewer が、(a) 自己申告値を判定入力にしていないか、(b) 既存 entry を壊していないか、
(c) 実在検査を含まないという境界が文書と実装で一致しているか、を攻撃する。

R4 では実測で必要と判明した差分だけを `docs/design/harness/L6-function-design/review-evidence.md` へ
戻す。`green-command-digest` の二層照合契約 (`PLAN-L7-303`) は変更しない。
