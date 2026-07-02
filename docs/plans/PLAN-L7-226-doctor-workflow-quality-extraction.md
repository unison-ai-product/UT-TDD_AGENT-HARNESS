---
plan_id: PLAN-L7-226-doctor-workflow-quality-extraction
title: "PLAN-L7-226 (impl): Doctor workflow quality extraction"
kind: impl
layer: L7
drive: be
status: confirmed
created: 2026-07-02
updated: 2026-07-02
owner: Codex
route_signal: code_smell
route_mode: refactor
parent_design: docs/design/harness/L6-function-design/governance-enforcement.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "Codex - doctor workflow quality extraction"
  - role: qa
    slot_label: "Codex - workflow quality regression fence"
generates:
  - artifact_path: docs/plans/PLAN-L7-226-doctor-workflow-quality-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/workflow-quality.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/doctor-workflow-quality.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-225-doctor-rule-quality-extraction.md
  requires:
    - docs/plans/PLAN-L7-95-lint-wiring-meta-gate.md
    - docs/plans/PLAN-L7-223-cli-distribution-registrar-extraction.md
references:
  - src/doctor/index.ts
  - src/doctor/workflow-quality.ts
  - tests/doctor.test.ts
  - tests/doctor-workflow-quality.test.ts
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T14:15:00+09:00"
    tests_green_at: "2026-07-02T14:15:00+09:00"
    verdict: approve
    scope: "Doctor workflow quality refactor: improvement backlog, lint wiring, right-arm planning, frontend/proposal coverage, and G8/G9/G10 workflow checks move out of src/doctor/index.ts while preserving runDoctor wiring and exported check functions."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T14:15:00+09:00"
        evidence_path: src/doctor/workflow-quality.ts
        output_digest: "sha256:1bbaa03940caaa4e851b1bf8032c8f22b93b1eb91f3bd280549051305b9a0d2a"
      - kind: unit_test
        command: "bun run vitest run tests\\doctor-workflow-quality.test.ts tests\\doctor.test.ts --testNamePattern \"doctor workflow quality|hard-gate checker inputs\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T14:15:00+09:00"
        evidence_path: tests/doctor-workflow-quality.test.ts
        output_digest: "sha256:0ad5ee61b48179a9573d5b9455db8015a243565a08f2be0eee5aab4923438101"
---

# PLAN-L7-226: Doctor workflow quality extraction

## 目的

`src/doctor/index.ts` は doctor の実行順序と hard gate 集約を担うべきだが、改善 backlog、lint wiring、right-arm planning、frontend / proposal coverage、G8-G10 workflow の adapter 実装まで保持している。これらは自己開発専用ではなく、一般のシステム開発へ UT-TDD Harness を適用する際のワークフロー品質境界であるため、doctor 本体から独立させる。

この slice では workflow quality 系の check 関数を `src/doctor/workflow-quality.ts` に移し、`src/doctor/index.ts` は import / re-export と `runDoctor` wiring に寄せる。

## 変更

- `checkImprovementBacklog` / `checkRightArmGatePlanning` / `checkLintWiring` を `src/doctor/workflow-quality.ts` へ移す。
- `checkFrontendDesignCoverage` / `checkProposalDocumentCoverage` / `checkG8IntegrationWorkflow` / `checkG9SystemWorkflow` / `checkG10UxWorkflow` も同じ workflow quality surface にまとめる。
- `src/doctor/index.ts` の public export と `runDoctor` の message order は維持する。
- 新規テストで切り出し先モジュールの fail-close 動作を直接検証する。

## デグレ対策

- `tests/doctor-workflow-quality.test.ts` で新モジュール直参照の fail-close を検証する。
- `tests/doctor.test.ts` の既存 import 経路を残し、public API 互換を維持する。
- full doctor と Pack 側の `setup --solo` / `doctor --setup-smoke` で clean distribution artifact でも同じ gate が通ることを確認する。
