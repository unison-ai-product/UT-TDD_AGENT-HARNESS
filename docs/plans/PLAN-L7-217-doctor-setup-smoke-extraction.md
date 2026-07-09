---
plan_id: PLAN-L7-217-doctor-setup-smoke-extraction
title: "PLAN-L7-217 (impl): doctor setup-smoke module extraction"
kind: impl
layer: L7
drive: be
status: confirmed
created: 2026-07-02
updated: 2026-07-02
owner: Codex
route_signal: code_smell
route_mode: refactor
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "Codex - doctor decomposition"
  - role: qa
    slot_label: "Codex - doctor setup-smoke regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-217-doctor-setup-smoke-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: src/doctor/setup-smoke.ts
    artifact_type: source_module
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-216-setup-boundary-refactor.md
  requires:
    - docs/plans/PLAN-L7-213-project-local-setup-wrapper.md
references:
  - src/doctor/index.ts
  - tests/doctor.test.ts
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T11:36:00+09:00"
    tests_green_at: "2026-07-02T11:35:00+09:00"
    verdict: approve
    scope: "Behavior-preserving doctor setup-smoke extraction: consumer onboarding smoke checks moved from src/doctor/index.ts to src/doctor/setup-smoke.ts while runDoctor setupSmoke dispatch and existing doctor.test oracle remain unchanged."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T11:34:00+09:00"
        evidence_path: src/doctor/setup-smoke.ts
        output_digest: "sha256:8a3da298584413c73c75da507d81151983336d2cca59aea8d65a1cfcaf5c6e57"
        anchor_commit: 952e839eb705e838cc5c0be9c6eb712cc604ba8e
      - kind: unit_test
        command: "bun run vitest run tests\\doctor.test.ts --testNamePattern \"setup smoke\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T11:35:00+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:282deaee2fd3064d743310e503fefbf08c2749d6cd9be8ebc815deed99e3fd31"
        anchor_commit: df6a1383f9c59c4b500f8edf1cf45b7e5abedec3
---

# PLAN-L7-217: doctor setup-smoke module extraction

## 目的

`src/doctor/index.ts` は 2,260 行の単一集約になっており、doctor 自体が保守性リスクになっている。第一 slice として、consumer setup smoke profile を `src/doctor/setup-smoke.ts` に抽出し、通常 doctor gate 集約から独立させる。

## 変更

- `checkSetupSmoke`、hook command parse、required setup smoke constants を専用 module に移す。
- `src/doctor/index.ts` は `setupSmoke` option の dispatch だけを持つ。
- 既存 CLI behavior と `tests/doctor.test.ts` / distribution acceptance の oracle は変えない。

## 汎用性観点

setup smoke は Pack/consumer onboarding 用の profile であり、source repo の full doctor gate と混在させると自己開発 repo 前提が強くなる。profile module として分けることで、将来 `consumer`, `pack`, `source` の doctor profile を増やす下地を作る。
