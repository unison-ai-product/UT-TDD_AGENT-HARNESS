---
plan_id: PLAN-L5-13-vmodel-spec-ir-physical-data
title: "PLAN-L5-13 (add-design/physical-data): Vモデル spec IR / 工程 / 活性化 / 起票候補 projection の物理設計"
kind: add-design
layer: L5
sub_doc: physical-data
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / TL
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T13:20:00+09:00"
    tests_green_at: "2026-07-08T13:20:00+09:00"
    verdict: approve
    scope: "U3 L5 physical-data 設計 slice。PLAN-L4-19 の SpecDef / SpecRelation / ScheduleEntry / ActivationEntry / DetectorFinding を harness.db の物理 table、join key、index、不変条件、L8 IT-SPECIR 境界へ降下した。DB は queryable projection であり authoring source ではない。detector_route_candidates は FilingTarget を決定せず、function §3.2.1 の SSoT へ渡す候補に限定する。"
    green_commands:
      - kind: lint
        command: "bun run src/cli.ts plan lint docs/plans/PLAN-L5-13-vmodel-spec-ir-physical-data.md"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T13:20:00+09:00"
        evidence_path: docs/design/harness/L5-detailed-design/physical-data.md
        output_digest: "sha256:4bcf8ac9a89c167fe6d7ff599c533d4f92ee1b64b7b1e67c4873cc4b8735525d"
      - kind: doctor
        command: "bun run src/cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T13:20:00+09:00"
        evidence_path: docs/test-design/harness/L8-integration-test-design.md
        output_digest: "sha256:01ff53d2e864819a0b456149dd79e43f33ec9207d7ec6fe34cfec5d1b9572910"
agent_slots:
  - role: tl
    slot_label: "TL - spec IR 物理 table / projection 境界レビュー"
  - role: se
    slot_label: "SE - physical-data §9.9 と L8 IT-SPECIR 追補"
  - role: qa
    slot_label: "QA - authoring source 非昇格 / orphan / fail-close 観点"
generates:
  - artifact_path: docs/plans/PLAN-L5-13-vmodel-spec-ir-physical-data.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L8-integration-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L5-01-physical-data.md
  requires:
    - PLAN-L4-19-vmodel-spec-ir-data
    - PLAN-L4-18-roadmap-drive-selection-hardening
    - PLAN-L5-08-harness-db-feedback
  blocks:
    - PLAN-L6-vmodel-spec-ir-contracts
    - PLAN-L7-vmodel-spec-ir-projection
  references:
    - docs/design/harness/L4-basic-design/data.md
    - docs/design/harness/L4-basic-design/function.md
    - docs/design/harness/L5-detailed-design/physical-data.md
    - docs/test-design/harness/L8-integration-test-design.md
    - src/schema/harness-db.ts
    - src/state-db/projection-writer.ts
---

# PLAN-L5-13: Vモデル spec IR / 工程 / 活性化 / 起票候補 projection の物理設計

## 0. 役割

本 PLAN は U3 の L5 descent として、PLAN-L4-19 の宣言型 spec IR を `.ut-tdd/harness.db` の物理 projection へ落とす。目的は、設計・工程・活性化・検出結果を query しやすくし、起票候補の発見精度を上げることである。

## 1. 設計判断

- `spec_defs` / `spec_relations` は Artifact 集約の projection table とする。
- `schedule_entries` / `activation_entries` は Workflow 集約の projection input table とする。
- `detector_route_candidates` は derived view table とし、FilingTarget を決定しない。
- source of truth は docs / PLAN / test-design / 工程表 / activation profile に残す。
- join key 欠落・orphan relation・profile 欠落・未知 layer/sub_doc は silent skip せず `findings` に出す。

## 2. 変更内容

1. `physical-data.md` に §9.9 を追加し、5 table の主キー、必須 columns、入力、index、不変条件を定義する。
2. L8 integration test design に `IT-SPECIR-01..04` を追加する。
3. 後続 L6/L7 へ、projection contract と writer 実装の descent を残す。

## 3. 受け入れ条件

- L4 の SpecDef / SpecRelation / ScheduleEntry / ActivationEntry / DetectorFinding が L5 物理 table へ全て対応している。
- projection table が authoring source ではないこと、detector が FilingTarget を創作しないことが L5/L8 に明記されている。
- `plan lint`、`db rebuild`、`doctor` が green。

## 4. 後続 slice

- U3 L6: spec IR loader / projector / detector route candidate の関数契約と U-* oracle を定義する。
- U3 L7: `src/schema/harness-db*` と `src/state-db/projection-writer.ts` に table / projection / tests を追加する。
- U4: `doctor` / detector / feedback surface が `detector_route_candidates` と FilingTarget SSoT を結合して起票候補を返す。
