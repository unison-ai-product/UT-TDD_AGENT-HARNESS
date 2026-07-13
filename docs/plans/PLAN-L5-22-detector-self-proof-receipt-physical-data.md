---
plan_id: PLAN-L5-22-detector-self-proof-receipt-physical-data
title: "PLAN-L5-22 (add-design/physical-data): detector self-proof receipt / mutation corpus物理設計"
kind: add-design
layer: L5
sub_doc: physical-data
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
agent_slots:
  - role: tl
    slot_label: "TL - compiler/detector/meta-verifier trust boundary"
  - role: se
    slot_label: "SE - receipt/fixture/mutation/surface verdict schema"
  - role: qa
    slot_label: "QA - mutation survivor 0、false positive/negative、rebuild"
generates:
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L8-integration-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L4-28-design-detection-self-proof.md
  references:
    - docs/plans/PLAN-L5-18-vmodel-contract-right-arm-physical-data.md
    - docs/plans/PLAN-L5-21-semantic-assessment-debt-routing-physical-data.md
    - docs/process/design-detection-self-proof.md
  blocks:
    - docs/plans/PLAN-L6-77-detector-compiler-meta-verifier-contracts.md
---

# PLAN-L5-22: detector self-proof receipt / mutation corpus物理設計

## 設計範囲

- receiptにrule/contract revision/source hash/generated hash/detector/fixtures/expected+actual finding+exit/test run/commit/verifier versionを保持する。
- mutation corpusはrule削除、mapping交換、stale生成、未配線、例外握り潰し、DB-only補完、surface欠落を安定IDで表す。
- receipt storeはappend-only authoring evidence、DBはprojectionとし、meta-verifierは対象detectorのpass/fail関数をoracleに再利用しない。

## 受入条件

- contract rule↔registry↔receipt exactly once、source/generated digest一致、全surface identity一致を検証する。
- positive/negative fixtureのexpected/actual差、stale receipt、未統制ruleをfail-closeする。
- mutation survivor 0、正常fixture false-positive 0、DB rebuild後のreceipt/finding identity一致をL8で証明する。
