---
plan_id: PLAN-REVERSE-520-review-receipt-supersession-backfill
title: "PLAN-REVERSE-520: review receipt supersession backfill"
kind: reverse
layer: cross
drive: be
route_signal: design_gap
route_mode: reverse
status: draft
workflow_phase: R0
confirmed_reverse_type: design
created: 2026-08-28
updated: 2026-08-28
owner: PM / PO / Codex
github_issue_id: 386
parent_design: docs/plans/PLAN-L7-520-review-receipt-supersession-contract.md
pair_artifact: docs/test-design/harness/L7-review-receipt-supersession-test-design.md
agent_slots:
  - role: qa
    slot_label: "QA - append-only attempt custody と immutable canonical receipt を独立変異で再検証"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-520-review-receipt-supersession-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-520-review-receipt-supersession-contract.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-493-d3a-repo-local-verdict-custody.md
    - docs/test-design/harness/L7-review-receipt-supersession-test-design.md
review_evidence: []
---

# PLAN-REVERSE-520

## R0

Forward契約のpair-freeze中。実装PRでR1へ移り、Red→Greenとoracle registry昇格を束縛する。

R2では `CANDIDATE-U-RVATT-040` の各caseへmutationを一つずつ適用し、次を独立に検証する。

1. failed outcome append削除で040-AだけがRedになる。
2. canonical receipt overwrite許可で040-BだけがRedになる。
3. 過去attempt/audit削除で040-CだけがRedになる。
4. unresolved outcomeからのretry許可で040-DだけがRedになる。

R3では同一requestに `failed attempt → successful retry` を実行し、canonical receipt 1件、
failed outcome 1件、superseded attempt 1件、過去attempt file残存を実体からaggregate検収する。
戻り値や件数の自己申告は証拠にしない。

R4では `PLAN-L7-493` の「receipt成功後は上書き・retry拒否」と、`PLAN-L7-518` のappend-only terminalへ
再合流する。canonical receipt replacementや `superseded_receipt` eventが残る場合はR4に進めない。
