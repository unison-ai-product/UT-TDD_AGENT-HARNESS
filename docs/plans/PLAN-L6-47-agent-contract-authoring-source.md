---
plan_id: PLAN-L6-47-agent-contract-authoring-source
title: "PLAN-L6-47 (add-design): V-model agent contract authoring source"
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
parent_design: docs/plans/PLAN-L7-390-typed-spec-phase-layer-alignment-gate.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T17:20:00+09:00"
    tests_green_at: "2026-07-08T17:20:00+09:00"
    verdict: approve
    scope: "U12c add-design slice。修正版ZIPの agent.read_first / agent.done_when を HARNESS の authoring source 契約へ翻訳した。"
    green_commands:
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T17:20:00+09:00"
        evidence_path: docs/governance/vmodel-agent-contracts.md
        output_digest: "sha256:08f83631602f5fdac67a8192069abf151fe0211c130b0ef504c13d978c168664"
agent_slots:
  - role: tl
    slot_label: "TL - agent contract authoring source"
  - role: qa
    slot_label: "QA - ZIP agent contract evidence"
generates:
  - artifact_path: docs/plans/PLAN-L6-47-agent-contract-authoring-source.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/vmodel-agent-contracts.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/governance/vmodel-typed-spec-definitions.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-390-typed-spec-phase-layer-alignment-gate.md
  requires:
    - docs/plans/PLAN-L7-390-typed-spec-phase-layer-alignment-gate.md
  references:
    - docs/governance/vmodel-agent-contracts.md
    - docs/governance/vmodel-upgrade-schedule.md
    - docs/governance/vmodel-typed-spec-definitions.md
---

# PLAN-L6-47: V-model agent contract authoring source

## 0. 役割

本 PLAN は U12c として、修正版 `Vモデル設計ドキュメント.zip` の各 doc に含まれる
`agent.defines` / `agent.read_first` / `agent.done_when` を HARNESS の設計契約へ翻訳する。
ZIP の `done_when: python tools/build.py detect` は Python runtime 移植ではなく、
HARNESS の `doctor:<gate-id>` 完了条件として表す。

## 1. 設計内容

1. `docs/governance/vmodel-agent-contracts.md` を agent contract の authoring source とする。
2. `agent_contracts` 宣言は `target_path`、`defines`、`read_first`、`done_when` を必須にする。
3. `read_first` は repository-owned artifact だけを指す。
4. `done_when` は `doctor:<gate-id>` だけを許し、Python command 文字列を正本にしない。
5. L4/L5/L6/test-design/typed spec 台帳に agent contract の所有境界を戻す。

## 2. 不変条件

- DB projection は検索用 read-model であり、source doc を更新しない。
- `defines` が空、`read_first` が存在しない、`done_when` が未知 gate の場合は検出器が finding にする。
- ZIP は設計入力であり、HARNESS の現在実行経路は `ut-tdd doctor` / `bun run src/cli.ts doctor` である。

## 3. 受け入れ条件

- `docs/governance/vmodel-agent-contracts.md` が存在し、agent contract を宣言している。
- `agent_contracts` が L4/L5/L6 の設計差分に現れる。
- U-AGENT-CONTRACT-R1..R4 が L7 test-design に現れる。
- VMS-008 / TVMS-008 が typed spec 台帳と所有 artifact 宣言に現れる。

## U12 typed spec owned artifact

```yaml
spec:
  defines:
    - id: VMS-008
      kind: agent-contract-authoring-source
      traces_from: [VMS-004]
      traces_to: [VMS-009]
      tests: [TVMS-008]
```

VMS-008 は ZIP の doc-local agent 契約を HARNESS の authoring source として保持する設計である。
