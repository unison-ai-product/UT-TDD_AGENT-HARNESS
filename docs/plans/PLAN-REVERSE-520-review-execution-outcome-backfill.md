---
plan_id: PLAN-REVERSE-520-review-execution-outcome-backfill
title: "PLAN-REVERSE-520: reviewer execution outcome の custody backfill"
kind: reverse
layer: cross
drive: be
workflow_phase: R1
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
status: draft
created: 2026-08-27
updated: 2026-08-27
owner: PM / PO / Codex
github_issue_id: 386
parent_design: docs/plans/PLAN-L7-520-review-execution-outcome.md
pair_artifact: docs/test-design/harness/L7-review-execution-outcome-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - non-zero outcome を L6 custody / D2 gate へ戻す差分の判断"
  - role: qa
    slot_label: "QA - exact-head receipt、欠落、identity mismatch の再検証"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-520-review-execution-outcome-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-520-review-execution-outcome.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-493-d3a-repo-local-verdict-custody.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/386
review_evidence: []
backprop_decision: required
backprop_decision_reason: "receipt の実行結果を L6 review custody と D2 merge gate の判定へ戻し、non-zero を green と誤認しない。"
---

# PLAN-REVERSE-520: reviewer execution outcome の custody backfill

## 1. R1 実装結果

L7 projection は、consumer-derived exact verdict path の有効な identity-bound verdict と
provider の non-zero exit を分離して保存する。失敗理由を本文から推測せず、typed
`reviewer_exit_nonzero` outcome のみを付加する。

## 2. R2 検証

対象 test-design の U-RVATT-037〜039 を detached snapshot で実行する。outcome 付き receipt
は D1 で `reviewer_execution_failed` となり、PASS / PASS-WEAK であっても D2 merge gate を
通過しない。欠落・identity mismatch・外部 path は従来どおり receipt 0 であることを確認する。

## 3. R3/R4

exact HEAD の非著者 Claude review と Linux / Windows / aggregate CI が揃った後、L6-493 の
provider custody correction へ差分を戻す。non-zero outcome の存在を provider capability の
成功証明、PASS 判定、手動 merge の根拠へ読み替えない。実測 receipt がない間は R4 完了を主張しない。
