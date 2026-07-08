---
plan_id: PLAN-L6-42-typed-spec-declaration-source
title: "PLAN-L6-42 (add-design): typed spec declaration source contract"
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
parent_design: docs/plans/PLAN-L7-385-vmodel-activation-profile-join.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T14:28:52+09:00"
    tests_green_at: "2026-07-08T14:28:52+09:00"
    verdict: approve
    scope: "U8a add-design slice。ZIP 99 の spec.defines を HARNESS の typed spec 正本として扱い、検出を推測から宣言読み取りへ寄せる L6 契約を追加した。"
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/spec-ir-projections.test.ts tests/projection-writer.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T14:28:52+09:00"
        evidence_path: tests/spec-ir-projections.test.ts
        output_digest: "sha256:d1fc968ac593bc02fa08010fb145dc9ad417b6f3c950dd3356775be51681912d"
agent_slots:
  - role: tl
    slot_label: "TL - typed spec declaration source design"
  - role: qa
    slot_label: "QA - typed spec unit oracle"
generates:
  - artifact_path: docs/plans/PLAN-L6-42-typed-spec-declaration-source.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/vmodel-typed-spec-definitions.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/README.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-385-vmodel-activation-profile-join.md
  requires:
    - PLAN-L7-385-vmodel-activation-profile-join
  references:
    - docs/governance/vmodel-typed-spec-definitions.md
    - docs/governance/vmodel-upgrade-schedule.md
---

# PLAN-L6-42: typed spec declaration source contract

## 0. 役割

本 PLAN は U8a として、`Vモデル設計ドキュメント_clean.zip` の `99_型付きスペック・自動検出設計書` を
HARNESS の `spec.defines` 契約へ落とす。

## 1. 設計内容

1. `docs/governance/vmodel-typed-spec-definitions.md` を U8 bootstrap 正本にする。
2. 最終配置は所有 artifact 本文の fenced YAML `spec:` block とする。
3. `id` / `kind` / `traces_from` / `traces_to` / `tests` を typed spec 宣言として扱う。
4. DB は projection であり、typed spec 宣言や source docs を更新しない。

## 2. 不変条件

- 同一 ID の複数宣言は禁止。
- kind 欠落、ID 形式不正、孤児 trace は finding にする。
- ZIP の ID regex をそのまま正本にせず、HARNESS の `FR-L1-*` / `PLAN-*` / `U-*` 等を受ける。

## 3. DoD

- [x] typed spec declaration source が governance 正本に追加されている。
- [x] L4/L5/L6 に typed spec declaration 契約がある。
- [x] L7 unit-test-design に U-TYPED-SPEC oracle がある。
