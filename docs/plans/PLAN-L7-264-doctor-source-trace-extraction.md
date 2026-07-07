---
plan_id: PLAN-L7-264-doctor-source-trace-extraction
title: "PLAN-L7-264 (refactor): doctor source trace adapter extraction"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "挙動維持の doctor 内部責務分離。runDoctor の gate 順序・hard gate 判定・公開 index export は維持し、source/artifact trace adapter の配置だけを source-trace module へ移す。"
created: 2026-07-02
updated: 2026-07-02
owner: Codex
parent_design: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - doctor source trace extraction"
generates:
  - artifact_path: docs/plans/PLAN-L7-264-doctor-source-trace-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path src\\doctor\\index.ts"
        output_digest: "sha256:3b47244b4c20fa635175b0637b7e3fdaf4198f8aa2cf311fb143674e082e6ed9"
  - artifact_path: src/doctor/source-trace.ts
    artifact_type: source_module
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path src\\doctor\\source-trace.ts"
        output_digest: "sha256:f09127d2df9a24ff5ad772273f538d21655415dc3a3385a6df97c9da3ad001be"
  - artifact_path: tests/doctor-source-trace.test.ts
    artifact_type: test_code
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path tests\\doctor-source-trace.test.ts"
        output_digest: "sha256:32e1e17798ba858c136cae9e689ee73efe1eb400822687d18425fd53d97b59b3"
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-54-merged-plan-status-gate.md
    - docs/plans/PLAN-L7-55-plan-artifact-existence-gate.md
    - docs/plans/PLAN-REVERSE-41-substance-lints.md
  references:
    - src/doctor/index.ts
    - src/doctor/source-trace.ts
    - tests/doctor-source-trace.test.ts
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T16:45:00+09:00"
    tests_green_at: "2026-07-02T16:45:00+09:00"
    verdict: approve
    scope: "Doctor source/artifact trace adapters moved out of index while preserving public re-exports and fail-close behavior."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\doctor-source-trace.test.ts tests\\merged-plan-status.test.ts tests\\plan-artifact-existence.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T16:45:00+09:00"
        evidence_path: tests/doctor-source-trace.test.ts
        output_digest: "sha256:32e1e17798ba858c136cae9e689ee73efe1eb400822687d18425fd53d97b59b3"
---

# PLAN-L7-264: doctor source trace adapter extraction

## 背景

`src/doctor/index.ts` は setup-smoke / runtime-surface / db-projection などの抽出で縮小しているが、まだ個別 lint adapter を多く抱えている。今回の対象は、source file と PLAN / artifact / test citation / canonical tree の対応を検査する source trace 系 adapter である。

この slice は `runDoctor` の集約責務を崩さず、同じ入出力・同じ fail-close 挙動を持つ adapter 群だけを抽出する。過剰リファクタリングを避けるため、check registry や runner の大規模再構成には踏み込まない。

## 変更

- `checkMergedPlanStatus`、`checkPlanArtifactExistence`、`checkImplPlanTrace`、`checkTrackedCanonical`、`checkOracleTestTrace` を `src/doctor/source-trace.ts` へ移す。
- `src/doctor/index.ts` は既存 import 互換のため同名 export を維持する。
- 抽出先 module の fail-close と `index.ts` re-export 互換を `tests/doctor-source-trace.test.ts` で固定する。

## 検証

- `bunx biome check --write src\\doctor\\index.ts src\\doctor\\source-trace.ts tests\\doctor-source-trace.test.ts`
- `bun run vitest run tests\\doctor-source-trace.test.ts tests\\merged-plan-status.test.ts tests\\plan-artifact-existence.test.ts --reporter=dot`
- `bun run typecheck`
- `bun run src\\cli.ts doctor`

## DoD

- [x] `runDoctor` の gate 順序と hard gate 集約は変更しない。
- [x] 既存の `src/doctor/index.ts` import surface は維持される。
- [x] source trace adapter の fail-close 挙動を分離 test で固定する。
- [x] source と Pack の両方で gate が green。
