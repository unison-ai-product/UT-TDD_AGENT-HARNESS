---
plan_id: PLAN-L7-397-right-lung-doc-governance
title: "PLAN-L7-397 (add-impl): right-lung doc governance"
kind: add-impl
layer: L7
drive: be
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-09
updated: 2026-07-09
owner: PO / TL
parent_design: docs/design/harness/L6-function-design/function-spec.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T12:05:00+09:00"
    tests_green_at: "2026-07-09T12:05:00+09:00"
    verdict: approve
    scope: "right-lung doc governance。L8/L9/L10/L12/L14 test-design doc の Gx-WORKFLOW / verification_design / test case ID family を doctor hard gate 化。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/right-lung-doc-governance.test.ts tests/doctor-workflow-quality.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T12:05:00+09:00"
        evidence_path: tests/right-lung-doc-governance.test.ts
        output_digest: "sha256:f9805fb5bad01f32e7525d552a1a2e6059810c939c9c223979d405ab46b615c1"
      - kind: doctor
        command: "bun run src/cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-09T12:05:00+09:00"
        evidence_path: src/lint/right-lung-doc-governance.ts
        output_digest: "sha256:e50ddf6e527d1ae46a57caea1efc5b953f96c57be4c044f65b34a03e664237b1"
agent_slots:
  - role: tl
    slot_label: "TL - right-lung doc governance"
  - role: se
    slot_label: "SE - lint and doctor wiring"
  - role: qa
    slot_label: "QA - workflow marker oracle"
generates:
  - artifact_path: docs/plans/PLAN-L7-397-right-lung-doc-governance.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/test-design/harness/L12-acceptance-test-design.md
    artifact_type: test_design
  - artifact_path: docs/test-design/harness/L14-operational-test-design.md
    artifact_type: test_design
  - artifact_path: src/lint/right-lung-doc-governance.ts
    artifact_type: source_module
  - artifact_path: src/doctor/workflow-quality.ts
    artifact_type: source_module
  - artifact_path: src/doctor/check-definition-groups.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: src/doctor/profiles.ts
    artifact_type: source_module
  - artifact_path: tests/right-lung-doc-governance.test.ts
    artifact_type: test_code
  - artifact_path: tests/doctor-workflow-quality.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-38-router-function-contracts.md
  requires:
    - docs/plans/PLAN-L6-38-router-function-contracts.md
    - docs/plans/PLAN-REVERSE-397-right-lung-doc-governance-backfill.md
  references:
    - docs/plans/PLAN-RECOVERY-10-right-lung-quality-assurance.md
    - docs/process/gates.md
---

# PLAN-L7-397: right-lung doc governance

## 0. 目的

右肺 L8-L14 の test-design doc が、テストケース表だけでなく「検証戦略」「検証設計」「defect routing」
を minimum workflow として持つことを機械保証する。

## 1. 実装内容

- `src/lint/right-lung-doc-governance.ts` を追加し、L8/L9/L10/L12/L14 の `Gx-WORKFLOW` marker、
  9 個の共通 workflow marker、層別 test case ID family を検査する。
- `src/doctor/workflow-quality.ts` / `check-definition-groups.ts` / `profiles.ts` に
  `right-lung-doc-governance` を doctor hard gate として配線する。
- L12 / L14 test-design doc に G12 / G14 workflow section を追加する。
- `tests/right-lung-doc-governance.test.ts` と `tests/doctor-workflow-quality.test.ts` で fail-close と
  live repo green を固定する。

## 2. 非対象

- G8/G9/G10 の evidence manifest 深掘りは既存個別 lint の責務。
- G11/G13 の新規 test-design doc 生成は別 PLAN とする。本 PLAN は現存する右肺 doc の minimum shape を固定する。

## §3 工程表

### Step 1: [直列] 右肺 minimum marker set の確定

直列理由: downstream_dependency。PLAN-RECOVERY-10 と既存 G8/G9/G10 workflow lint を読み、共通 marker を固定する。

### Step 2: [並列] lint / doctor 配線

`analyzeRightLungDocGovernance` と `checkRightLungDocGovernance` を追加する。

### Step 3: [並列] L12 / L14 doc backfill

L12 / L14 に `G12-WORKFLOW` / `G14-WORKFLOW` と 9 marker を追記する。

### Step 4: [直列] review / verification

直列理由: downstream_dependency。targeted unit、typecheck、plan lint、doctor で確認する。

## §3.1 実装計画

right-lung doc governance は個別証跡 gate の前段であり、検証実行 PLAN が参照する doc が最低限の
検証戦略と失敗時 routing を持つ状態を保証する。
