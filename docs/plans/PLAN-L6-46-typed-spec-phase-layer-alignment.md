---
plan_id: PLAN-L6-46-typed-spec-phase-layer-alignment
title: "PLAN-L6-46 (add-design): typed spec phase/layer alignment contract"
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
parent_design: docs/plans/PLAN-L6-45-typed-spec-owned-artifact-dispersal.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T16:35:00+09:00"
    tests_green_at: "2026-07-08T16:35:00+09:00"
    verdict: approve
    scope: "U12a add-design slice。修正版ZIPの107/agent契約差分を踏まえ、typed spec 台帳 v_phase と宣言元 artifact frontmatter の owner phase を一致させる契約を追加した。"
    green_commands:
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T16:35:00+09:00"
        evidence_path: docs/design/harness/L6-function-design/function-spec.md
        output_digest: "sha256:db2e1bb1662d5b607474de28f6ab1933deb096cbeb775c3464cc747a54e4ad84"
        anchor_commit: 33f03923a561495acd0ff9f43b9e2f8af718335e
agent_slots:
  - role: tl
    slot_label: "TL - typed spec phase/layer alignment design"
  - role: qa
    slot_label: "QA - owner phase oracle"
generates:
  - artifact_path: docs/plans/PLAN-L6-46-typed-spec-phase-layer-alignment.md
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
  parent: docs/plans/PLAN-L6-45-typed-spec-owned-artifact-dispersal.md
  requires:
    - docs/plans/PLAN-L7-389-typed-spec-owned-artifact-dispersal-gate.md
  references:
    - docs/governance/vmodel-typed-spec-definitions.md
    - docs/governance/vmodel-upgrade-schedule.md
---

# PLAN-L6-46: typed spec phase/layer alignment contract

## 0. 役割

本 PLAN は U12a として、typed spec 台帳の `v_phase` と宣言元 artifact の V-model 層宣言を一致させる。
U11 で宣言元を owned artifact へ戻したため、次に「その artifact がどの V-model phase を所有するか」を
frontmatter で明示し、検出系が設計層を推測で補完しない状態にする。

## 1. ZIP 再検査結果

修正版 `Vモデル設計ドキュメント_checked.zip` は再展開で 624 files / 29 dirs、主要 docs 43/97/99/107/108/109 が存在した。
`verify_files.py`、`build.py validate`、`spec_types.py`、`spec_trace.py`、`schedule.py`、
`build.py detect` はすべて green で、対象書面 109 件の agent メタデータも実態と一致した。

## 2. 設計内容

1. typed spec 台帳の `v_phase` は宣言元 artifact の owner phase と一致する。
2. owner phase は `typed_spec_phase_owner`、`executed_at_layer`、`layer`、path 由来 layer の順に解決する。
3. governance doc のような横断 artifact は、文書全体の V-model `layer` を持たず、typed spec 所有層だけを `typed_spec_phase_owner` で宣言する。
4. owner phase が無い場合は `typed-spec-owner-phase-missing`、不一致は `typed-spec-phase-layer-mismatch` finding にする。

## 3. 不変条件

- `executed_at_layer` は test-design の実行層であり、`layer` と食い違っても test-design では `executed_at_layer` を owner phase として扱える。
- `typed_spec_phase_owner` は typed spec の所有層だけを表す。governance doc 全体の V-model 階層を上書きしない。
- 検出器は owner phase を創作しない。frontmatter または path から解決できない場合は finding にする。

## 4. 受け入れ条件

- L4/L5/L6/L7 に phase/layer alignment 契約がある。
- governance typed spec source に `typed_spec_phase_owner` がある。
- targeted vitest、`tsc --noEmit`、`db rebuild`、`doctor` が green。

## U12 型付きスペック所有 artifact

```yaml
spec:
  defines:
    - id: VMS-007
      kind: typed-spec-phase-layer-alignment
      traces_from: [VMS-004]
      tests: [TVMS-007]
```

VMS-007 は typed spec 台帳の `v_phase` と宣言元 artifact の owner phase を一致させる設計である。
修正版 ZIP 107 の V-model level 定義と各 doc の agent 契約を HARNESS の L0-L14 / frontmatter 正本へ翻訳する前段として、
検出系が層を推測で作らないことを保証する。
