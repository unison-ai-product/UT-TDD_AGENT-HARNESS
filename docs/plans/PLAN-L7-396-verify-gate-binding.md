---
plan_id: PLAN-L7-396-verify-gate-binding
title: "PLAN-L7-396 (add-impl): verify PLAN gate binding"
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
    reviewed_at: "2026-07-09T11:30:00+09:00"
    tests_green_at: "2026-07-09T11:30:00+09:00"
    verdict: approve
    scope: "verify PLAN gate binding。L8-L14 verify PLAN に verification_gate=G8-G14 を必須化し、PLAN governance と frontmatter schema で fail-close。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/frontmatter.test.ts tests/plan-lint.test.ts -t \"verify|U-PLANGOV-011v5|U-PLANGOV-011v4\""
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T11:30:00+09:00"
        evidence_path: tests/plan-lint.test.ts
        output_digest: "sha256:81311c6f4fa14a8f212e36436858d0c09ad6f9b8057e8e9004e0fcf3590ab5e5"
      - kind: doctor
        command: "bun run src/cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-09T11:30:00+09:00"
        evidence_path: src/plan/lint.ts
        output_digest: "sha256:9c5511ba95ddca39097e2e02c7d0184e838ebf376b03f9ecf5e7a2b8dd47ffc0"
agent_slots:
  - role: tl
    slot_label: "TL - right-arm verify gate contract"
  - role: se
    slot_label: "SE - schema and plan-governance implementation"
  - role: qa
    slot_label: "QA - fail-close oracle"
generates:
  - artifact_path: docs/plans/PLAN-L7-396-verify-gate-binding.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: src/schema/frontmatter.ts
    artifact_type: source_module
  - artifact_path: src/plan/lint-policy.ts
    artifact_type: source_module
  - artifact_path: src/plan/lint-types.ts
    artifact_type: source_module
  - artifact_path: src/plan/lint.ts
    artifact_type: source_module
  - artifact_path: tests/frontmatter.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-lint.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-38-router-function-contracts.md
  requires:
    - docs/plans/PLAN-L6-38-router-function-contracts.md
    - docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
    - docs/plans/PLAN-REVERSE-396-verify-gate-binding-backfill.md
  references:
    - docs/plans/PLAN-RECOVERY-10-right-lung-quality-assurance.md
    - docs/process/gates.md
---

# PLAN-L7-396: verify PLAN gate binding

## 0. 目的

右腕 L8-L14 の verify PLAN が、どの検証 gate を閉じる PLAN なのかを frontmatter で宣言する。
`kind=verify` / `layer=L8..L14` / `route_mode=verify` だけでは、工程層と gate が暗黙対応のまま残り、
gate_runs / workflow_runs への後続接続時に検証証跡を誤配線できてしまう。

## 1. 実装内容

- `frontmatterSchema` に `verification_gate` を追加し、`kind=verify` では `L8->G8` から `L14->G14`
  までの 1:1 対応を必須化する。
- `analyzePlanGovernance.verifyGateBinding` を追加し、欠落を `verify_gate_missing`、不一致を
  `verify_gate_layer_mismatch` として surface する。
- `tests/frontmatter.test.ts` と `tests/plan-lint.test.ts` へ欠落・不一致・non-verify 誤宣言の oracle を追加する。
- L6 function contract と L7 unit test design へ右腕 gate binding 契約を back-fill する。

## 2. 非対象

- gate_runs / workflow_runs への実行結果永続化は PLAN-L7-363 系で扱う。
- G11-G14 の個別 workflow lint 実装は別 PLAN とする。本 PLAN は verify PLAN の gate 結合だけを固定する。

## §3 工程表

### Step 1: [直列] 右腕 gate binding 契約の確定

直列理由: downstream_dependency。PLAN-RECOVERY-10 の L8-L14 verify envelope と G8-G14 gate 体系を照合する。

### Step 2: [並列] schema と governance lint 実装

`frontmatterSchema` と `analyzePlanGovernance` に同じ L8-G8 対応を実装する。

### Step 3: [並列] fail-close oracle 追加

欠落、不一致、non-verify 誤宣言、正常系を fixture 化する。

### Step 4: [直列] review / verification

直列理由: downstream_dependency。targeted unit、typecheck、plan lint、doctor で確認する。

## §3.1 実装計画

右腕 verify PLAN の authoring contract を frontmatter へ上げ、後続の DB projection / gate_runs 接続が
`layer` 推測ではなく `verification_gate` 宣言を読める状態にする。
