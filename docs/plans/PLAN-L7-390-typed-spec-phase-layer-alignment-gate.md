---
plan_id: PLAN-L7-390-typed-spec-phase-layer-alignment-gate
title: "PLAN-L7-390 (add-impl): typed spec phase/layer alignment doctor gate"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / TL
parent_design: docs/plans/PLAN-L6-46-typed-spec-phase-layer-alignment.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T16:35:00+09:00"
    tests_green_at: "2026-07-08T16:35:00+09:00"
    verdict: approve
    scope: "U12b add-impl slice。typed spec v_phase と宣言元 artifact owner phase の整合を analyzer / doctor hard gate として実装した。"
    green_commands:
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T16:35:00+09:00"
        evidence_path: src/state-db/spec-ir-projections.ts
        output_digest: "sha256:24fa837f0b555741015cb5aec6165ac6380ae175fc40f4500e68cb139c953128"
        anchor_commit: 33f03923a561495acd0ff9f43b9e2f8af718335e
      - kind: unit_test
        command: "bun run vitest run tests/spec-ir-projections.test.ts tests/doctor.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T16:35:00+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:892ddc838bb032c4d10871382ffb83d071c7ddeea644a15998ce9f70e4434371"
        anchor_commit: 33f03923a561495acd0ff9f43b9e2f8af718335e
agent_slots:
  - role: tl
    slot_label: "TL - typed spec phase/layer gate"
  - role: se
    slot_label: "SE - state-db / doctor wiring"
  - role: qa
    slot_label: "QA - phase/layer regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-390-typed-spec-phase-layer-alignment-gate.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/spec-ir-projections.ts
    artifact_type: source_module
  - artifact_path: src/doctor/db-projection.ts
    artifact_type: source_module
  - artifact_path: tests/spec-ir-projections.test.ts
    artifact_type: test_code
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-46-typed-spec-phase-layer-alignment.md
  requires:
    - docs/plans/PLAN-REVERSE-390-typed-spec-phase-layer-alignment-backfill.md
  references:
    - docs/plans/PLAN-L7-389-typed-spec-owned-artifact-dispersal-gate.md
---

# PLAN-L7-390: typed spec phase/layer alignment doctor gate

## 0. 役割

本 PLAN は U12b として、typed spec 台帳 `v_phase` と宣言元 artifact owner phase の整合を doctor hard gate にする。

## 1. 実装内容

1. `analyzeTypedSpecPhaseLayerAlignment` を state-db projection に追加する。
2. `checkTypedSpecPhaseLayerAlignment` を doctor dependency/db group に追加する。
3. `typed-spec-phase-layer-alignment` を full doctor profile に登録する。
4. real repo OK、malformed fixture、missing root fail-close を test で固定する。

## 2. 不変条件

- 判定は source docs から rebuild する。
- owner phase を DB projection で補完しない。
- test-design は `executed_at_layer` を owner phase として扱える。
- governance doc は `typed_spec_phase_owner` を明示し、検出側が layer を創作しない。

## 3. 受け入れ条件

- `doctor: typed-spec-phase-layer-alignment - OK` が real repo doctor に表示される。
- targeted vitest、`tsc --noEmit`、`db rebuild`、`doctor` が green。
