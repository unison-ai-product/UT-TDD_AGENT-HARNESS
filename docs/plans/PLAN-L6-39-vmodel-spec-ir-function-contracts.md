---
plan_id: PLAN-L6-39-vmodel-spec-ir-function-contracts
title: "PLAN-L6-39 (add-design/function-spec): Vモデル spec IR / 工程 / 活性化 / 起票候補 projection の関数契約"
kind: add-design
layer: L6
sub_doc: function-spec
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / TL
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T12:24:17+09:00"
    tests_green_at: "2026-07-08T12:24:17+09:00"
    verdict: approve
    scope: "U3 L6 function-spec 設計 slice。PLAN-L5-13 の spec_defs / spec_relations / schedule_entries / activation_entries / detector_route_candidates を loader / parser / projector / integrity / detector route candidate handoff の関数契約へ降下した。DB は rebuildable projection であり authoring source ではない。detector_route_candidates は FilingTarget を創作せず、L4 function §3.2.1 / routeFiling SSoT へ渡す候補に限定する。"
    green_commands:
      - kind: lint
        command: "bun run src/cli.ts plan lint docs/plans/PLAN-L6-39-vmodel-spec-ir-function-contracts.md"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T12:24:17+09:00"
        evidence_path: docs/design/harness/L6-function-design/function-spec.md
        output_digest: "sha256:602e34e80691b11ec7327fcebfd2dbee0db82edee69a785bab22fb08dba8cedc"
        anchor_commit: 8a3d8c7417797c010eb4643e00dbffc69c869966
      - kind: doctor
        command: "bun run src/cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T12:24:17+09:00"
        evidence_path: docs/test-design/harness/L7-unit-test-design.md
        output_digest: "sha256:f0f9ad1d3eeaa44a335f975045d4ed07dd23ff5584daab751785cfedaa2c271f"
        anchor_commit: 8a3d8c7417797c010eb4643e00dbffc69c869966
agent_slots:
  - role: tl
    slot_label: "TL - spec IR 関数契約 / projection 境界レビュー"
  - role: se
    slot_label: "SE - loader / parser / projector / detector candidate contract"
  - role: qa
    slot_label: "QA - orphan / secret / silent skip / FilingTarget SSoT 観点"
generates:
  - artifact_path: docs/plans/PLAN-L6-39-vmodel-spec-ir-function-contracts.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L6-01-function-spec.md
  requires:
    - PLAN-L5-13-vmodel-spec-ir-physical-data
    - PLAN-L4-19-vmodel-spec-ir-data
    - PLAN-L4-18-roadmap-drive-selection-hardening
    - PLAN-L6-38-router-function-contracts
  blocks:
    - PLAN-L7-381-vmodel-spec-ir-projection
  references:
    - docs/design/harness/L4-basic-design/data.md
    - docs/design/harness/L4-basic-design/function.md
    - docs/design/harness/L5-detailed-design/physical-data.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/test-design/harness/L7-unit-test-design.md
    - src/schema/harness-db.ts
    - src/state-db/projection-writer.ts
---

# PLAN-L6-39: Vモデル spec IR / 工程 / 活性化 / 起票候補 projection の関数契約

## 0. 役割

本 PLAN は U3 の L6 descent として、PLAN-L5-13 の物理 projection table を実装可能な関数契約へ落とす。目的は、設計・工程・活性化・検出結果を宣言型に読み込み、`.ut-tdd/harness.db` へ deterministic に投影し、検出系が起票候補を見つけやすい状態にすることである。

## 1. 設計判断

- spec IR は docs / PLAN / test-design / 工程表 / activation profile から作る rebuildable projection とする。
- DB は authoring source ではない。projection rebuild は source docs を書き換えない。
- parser / integrity / candidate derivation は純関数へ寄せ、`projection-writer.ts` は投影 orchestration に限定する。
- `detector_route_candidates` は FilingTarget を決定しない。target snapshot は L4 function §3.2.1 / `routeFiling` SSoT から得る。
- orphan relation、未知 layer/sub_doc、activation reason 欠落、secret-like payload、raw transcript 永続化は silent skip せず finding/quality_signal にする。

## 2. 変更内容

1. `function-spec.md` に `loadSpecIrSources` / `parseSpecDefs` / `parseSpecRelations` / `parseScheduleEntries` / `parseActivationEntries` / `projectSpecIr` / `analyzeSpecIrIntegrity` / `deriveDetectorRouteCandidates` の契約を追加する。
2. `L7-unit-test-design.md` に `U-SPECIR-R1..R9` の設計参照 oracle を追加する。
3. PLAN-L5-13 の後続 slice 参照を本 PLAN ID に更新する。

## 3. 受け入れ条件

- loader / parser / projector / integrity / route-candidate handoff の signature、pre/post/invariant が L6 にある。
- `detector_route_candidates` は FilingTarget を創作せず、L4 FilingTarget SSoT へ委譲する境界が明記されている。
- projection は source docs を rewrite しない rebuildable DB projection として定義されている。
- L7 test-design に `U-SPECIR-R*` の oracle 表があり、正式 ID は後続 add-impl で tests citation と同時に採番する規律がある。
- `plan lint`、`db rebuild`、`doctor` が green。

## 4. 後続 slice

- U3 L7: `src/spec-ir/` または `src/state-db/spec-ir-projections.ts` に純関数実装を置き、`src/state-db/projection-writer.ts` から呼び出す。
- U3 L7: `src/schema/harness-db*` に PLAN-L5-13 の 5 table / index / catalog / migration repair test を追加する。
- U4: `doctor` / detector / feedback surface が `detector_route_candidates` と FilingTarget SSoT を結合して起票候補を返す。
