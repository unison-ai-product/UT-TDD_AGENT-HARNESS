---
plan_id: PLAN-L7-250-doctor-dependency-regression-extraction
title: "PLAN-L7-250 (refactor): doctor dependency / regression adapter extraction"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "Behavior-invariant extraction inside the existing doctor orchestration boundary. The dependency-drift and regression-expansion checks keep their existing lint inputs, output messages, fail-close behavior, runDoctor ordering, and public re-export surface."
created: 2026-07-02
updated: 2026-07-02
owner: Codex
parent_design: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - doctor 責務境界抽出と Pack 同期"
generates:
  - artifact_path: docs/plans/PLAN-L7-250-doctor-dependency-regression-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/dependency-regression.ts
    artifact_type: source_module
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path src\\doctor\\dependency-regression.ts"
        output_digest: "sha256:982e16bea06b79a54b7f6970f06fc8cc10a30bc72322fedb74194f2c4815d5d2"
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path src\\doctor\\index.ts"
        output_digest: "sha256:02415392482e6aa1e59ea9c5693bc4ff777fc9a38a80774e63dd36a6d316731f"
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path tests\\doctor.test.ts"
        output_digest: "sha256:5eff910681a9e4b89b848b89399d9fd745e8917adbf1befe32bf49981a730077"
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path tests\\cli-surface.test.ts"
        output_digest: "sha256:4820ea25c26bfc9d7cc8ab73c6cf9ba631332411621267b0d6e00fa92e941c4d"
  - artifact_path: docs/plans/PLAN-L7-248-diagram-view-expansion.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L7-251-observation-next-selector.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-246-doctor-result-aggregation-extraction.md
  references:
    - src/doctor/index.ts
    - src/lint/dependency-drift.ts
review_evidence:
  - reviewer: codex
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T15:45:00+09:00"
    tests_green_at: "2026-07-02T15:45:00+09:00"
    verdict: approve
    scope: "Doctor dependency/regression adapter extraction plus plan-governance cleanup for draft future dependencies."
    worker_model: codex
    reviewer_model: codex
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T15:45:00+09:00"
        evidence_path: src/doctor/dependency-regression.ts
        output_digest: "sha256:982e16bea06b79a54b7f6970f06fc8cc10a30bc72322fedb74194f2c4815d5d2"
      - kind: unit_test
        command: "bun run vitest run tests\\doctor.test.ts tests\\dependency-drift.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T15:45:00+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:5eff910681a9e4b89b848b89399d9fd745e8917adbf1befe32bf49981a730077"
---

# PLAN-L7-250: doctor dependency / regression adapter extraction

## 背景

`src/doctor/index.ts` はまだ 1,000 行超の集約点であり、`runDoctor` の配線だけでなく個別 gate adapter も多く抱えている。前回の result aggregation 抽出に続き、今回は `dependency-drift` と `regression-expansion` の adapter を `src/doctor/dependency-regression.ts` に分離する。

この 2 つは依存関係が明確で、`regression-expansion` が `dependency-drift.result` を受け取るだけの閉じた境界である。doctor 本体から独立させることで、今後の check registry / profile 化へ進む前の安全な単位になる。

## 変更

- `src/doctor/dependency-regression.ts` を追加し、`checkDependencyDrift` / `checkRegressionExpansion` と `loadChangedFilesForDoctor` を移動する。
- `src/doctor/index.ts` は上記 2 関数を import / re-export し、既存 public surface (`../src/doctor/index`) を維持する。
- `runDoctor` の gate 配列と `dependencyDrift.result` 連携は維持する。

## 検証

- `bunx biome check --write src\\doctor\\index.ts src\\doctor\\dependency-regression.ts`
- `bun run typecheck`
- `bun run vitest run tests\\doctor.test.ts tests\\dependency-drift.test.ts --reporter=dot`
- `bun run src\\cli.ts doctor`

## DoD

- [x] doctor 本体から dependency / regression adapter 実装が分離されている。
- [x] `checkDependencyDrift` / `checkRegressionExpansion` の import 互換性が `index.ts` re-export で維持されている。
- [x] 対象 test と full doctor が green。
- [x] Pack repo へ sync され、Pack gate が green。
