---
plan_id: PLAN-L4-28-design-detection-self-proof
title: "PLAN-L4-28 (add-design): 設計由来detectorの独立自己証明・mutation統制"
kind: add-design
layer: L4
sub_doc: architecture
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/process/vmodel-contract.yaml
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L9-system-test-design.md
next_pair_freeze: L5
agent_slots:
  - role: tl
    slot_label: "TL - authoring source/compiler/detector/meta-verifierの信頼境界"
  - role: se
    slot_label: "SE - deterministic generation、digest、coverage、receipt設計"
  - role: qa
    slot_label: "QA - mutation、negative control、false-negative/positive、rebuild再現"
generates:
  - artifact_path: docs/process/design-detection-self-proof.md
    artifact_type: markdown_doc
  - artifact_path: docs/process/vmodel-contract.yaml
    artifact_type: yaml_config
  - artifact_path: docs/governance/vmodel-upgrade-schedule.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L4-23-forward-fsm-plan-asset-v2.md
    - docs/plans/PLAN-L4-24-declarative-vmodel-contract-right-arm.md
    - docs/plans/PLAN-L4-27-vmodel-semantic-self-audit.md
    - docs/adr/ADR-008-forward-fsm-plan-asset-v2.md
---

# PLAN-L4-28: 設計由来detectorの独立自己証明・mutation統制

## 1. 問題

設計を機械可読化しても、detectorが未配線、欠落rule、fail-open、stale生成物、自己参照oracleであれば統制は成立しない。
「doctorがgreen」と「設計どおりの違反を実際に検出できる」を分け、後者を独立証明する。

## 2. 信頼境界

```text
authored design contract
  → schema validator
  → deterministic compiler / registry
  → runtime detector / doctor
  → normalized finding / evidence receipt

independent meta-verifier
  ├─ authored source completeness
  ├─ source hash ↔ generated digest
  ├─ contract rule ↔ detector registration exactly-once
  ├─ mutation / negative controlで実発火
  └─ receipt ↔ commit / revision / test run照合
```

meta-verifierは検査対象detectorのpass/fail関数をoracleとして再利用しない。構造、digest、fixture期待値、process exitを
独立に照合する。

## 3. 自己証明receipt

各ruleは少なくとも`rule_id`、contract_revision、source_hash、generated_hash、detector_id、positive fixture、negative fixture、
expected finding/exit、actual finding/exit、test_run_id、source commit、verified_at、verifier versionを持つ。

## 4. 受入条件

- contractの全rule/gateがdetector registryへexactly once登録され、orphan/duplicate 0である。
- source変更で生成digestがstaleならdetector実行前にfail-closeする。
- 各ruleに違反fixtureと正常fixtureがあり、違反で必ず期待finding/exit、正常でfalse-positive 0を確認する。
- mutationで条件削除、mappingずれ、detector未配線、例外握り潰し、DB-only補完を注入し、meta-verifierが全て検出する。
- CLI、hook、doctor、CIが同じrule identity/verdictを返し、surface欠落を検出する。
- DB全削除/rebuild後もreceipt identityとfinding結果が再現する。
- self-proof receiptが無いruleは「未統制」であり、green coverageへ含めない。
- verifier自身にもunit/property testと別model family reviewを要求する。

## 5. 降下先

L5 receipt/schema、L6 compiler/verifier contract、L7 small modules/CLI/doctor/CI、L9 mutation system testへ降下する。
