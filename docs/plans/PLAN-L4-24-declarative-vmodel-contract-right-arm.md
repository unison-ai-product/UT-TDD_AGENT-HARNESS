---
plan_id: PLAN-L4-24-declarative-vmodel-contract-right-arm
title: "PLAN-L4-24 (add-design): 宣言型 V-model contract と G8-G14 右腕 engine"
kind: add-design
layer: L4
sub_doc: architecture
drive: fullstack
status: draft
program_exit_status: in_progress
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/process/forward/overview.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L9-system-test-design.md
next_pair_freeze: L9
agent_slots:
  - role: tl
    slot_label: "TL - L0-L14 pair/gate/evidence/exit/defect routing contract"
  - role: se
    slot_label: "SE - contract loader と generic detector/doctor generation"
  - role: qa
    slot_label: "QA - G8-G14 全層負系、roadmap obligation、実行証拠"
generates:
  - artifact_path: docs/process/vmodel-contract.yaml
    artifact_type: yaml_config
  - artifact_path: docs/process/gates.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
  - artifact_path: docs/governance/vmodel-upgrade-schedule.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L4-22-vmodel-source-disposition-profile-ssot.md
    - docs/plans/PLAN-L4-23-forward-fsm-plan-asset-v2.md
    - docs/test-design/harness/L8-integration-test-design.md
    - docs/test-design/harness/L9-system-test-design.md
    - docs/test-design/harness/L10-ux-validation-test-design.md
    - docs/process/evidence/g11-uat-review-design.md
    - docs/test-design/harness/L12-acceptance-test-design.md
    - docs/process/evidence/g13-post-deploy-verification-design.md
    - docs/test-design/harness/L14-operational-test-design.md
    - docs/plans/PLAN-L8-01-engine-swap-integration-verification.md
    - docs/plans/PLAN-L9-01-engine-swap-system-verification.md
    - docs/plans/PLAN-L10-01-engine-swap-ux-validation.md
    - docs/plans/PLAN-L11-01-engine-swap-uat-review.md
    - docs/plans/PLAN-L12-01-engine-swap-acceptance-deploy.md
    - docs/plans/PLAN-L13-01-engine-swap-post-deploy-verification.md
    - docs/plans/PLAN-L14-01-engine-swap-operational-value-verification.md
---

# PLAN-L4-24: 宣言型 V-model contract と G8-G14 右腕 engine

## 1. 問題

baseline `origin/main@3d232e9c` 以前はL8-L14 の Forward PLAN が0件で、G11-G14 は概念または marker に留まっていた。現行 right-arm planning は代表する
L7/Reverse PLAN 2本の参照で合格でき、verification band は roadmap 上で恒久 park される。設計契約と detector の
gate mapping が複数 TypeScript 定数へ重複しており、設計変更が検出へ自動追随しない。

## 2. 設計範囲

1. L0-L14 の layer/gate/V-pair/成果物/case ID/evidence/exit criteria/defect routing/approval/profile を宣言型正本へ集約する。
2. contract loader が validate した同一DTOから plan lint、generic right-arm detector、doctor definition、roadmap obligation を導出する。
3. L8-L14 に `kind: verify` PLAN を各層最低1件起票し、工程表のG8→G14 predecessor chainへ登録する（PLAN-L8-01〜L14-01を起票済み）。
4. G11 trace/UAT、G12 deploy/AT、G13 production smoke/SLI/SLO、G14 OT/value feedback を実行 contract として定義する。
5. L11/L13 の process evidence artifact を document catalog の正式 slot にする。
6. detector が欠落した設計判断を補完せず、contract欠落・重複定数・生成driftをfail-closeする。
7. PLAN-L4-28の独立meta-verifier/mutation receiptがないdetectorを統制済みcoverageへ含めない。

## 3. 受入条件

- L0-L14 全層と G0.5/G1-G14 がexactly once定義され、左右pair/例外理由が構造化される。
- G8-G14 の各PLAN、case coverage、evidence manifest、exit criteria、defect routing が個別に検証される。
- verification band の恒久 park を撤去し、roadmap が L8-L14 未完を残 frontier として表示する。
- 手書き `VERIFICATION_GATE_BY_LAYER` 等が contract-derived registry と一致しない場合にCI/doctorがfail-closeする。
- detectorを無効化しても設計 contract test が成立し、再生成したdetectorが同じ違反とexit codeを返す。
- L4-24がdraftの間はright-arm detectorが`IN-PROGRESS`と不足L8-L14を表示し、confirmed後の不足はhard failureにする。

## 4. 降下先

L5 contract schema/evidence physical data、L6 loader/generic engine、L7 runtime/doctor、L8-L14 verify PLAN を後続起票する。
