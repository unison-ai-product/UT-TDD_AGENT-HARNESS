---
plan_id: PLAN-L7-374-doctor-runner-definition-modules
title: "PLAN-L7-374 (refactor): doctor runner と check definition を分離する"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
created: 2026-07-07
updated: 2026-07-07
owner: PM / Codex
parent_design: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
backprop_decision: not_required
backprop_decision_reason: "doctor の runner/definition 配置を分離する保守性改善であり、doctor check の意味論・順序・profile contract は変更しない。"
agent_slots:
  - role: tl
    slot_label: "TL - doctor module boundary review"
  - role: se
    slot_label: "SE - runner/definition regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-374-doctor-runner-definition-modules.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/check-registry.ts
    artifact_type: source_module
  - artifact_path: src/doctor/check-definitions.ts
    artifact_type: source_module
  - artifact_path: src/doctor/runner.ts
    artifact_type: source_module
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-373-doctor-profile-module.md
  requires:
    - docs/plans/PLAN-L7-373-doctor-profile-module.md
review_evidence:
  - reviewer: codex-explorer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-07T14:00:56+09:00"
    tests_green_at: "2026-07-07T14:00:56+09:00"
    verdict: approve
    scope: "doctor runner / check definition module 分離の互換 surface と循環 import リスク。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run test -- tests\\doctor.test.ts --testNamePattern \"doctor profile|toolchain gate|hard-gate aggregation\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T14:00:56+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:fc1e978aab0b13e98f1c0edcb0101ad0f10b2bf67f6063bb8d002e3b295d0b1b"
        anchor_commit: 150d69492846f24ee7d13fcc7a8dbc7f61e4629f
      - kind: unit_test
        command: "bun run test -- tests\\cli-surface.test.ts --testNamePattern \"doctor profile|doctor profiles|doctor scope|doctor verification\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T14:00:56+09:00"
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:c845079e2127cdd15f038d05c6999c3dcaee74821f1d3e10bcd0d9ce0ee8885e"
        anchor_commit: 9f8ee327b2473e2badc18fbb6c8d8da28a352e8b
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-07T14:00:56+09:00"
        evidence_path: src/doctor/runner.ts
        output_digest: "sha256:8657952028ad58d0a4ac85941f403abc020a1a34d1bde2baa99a5bc648586ee0"
        anchor_commit: 150d69492846f24ee7d13fcc7a8dbc7f61e4629f
---

# PLAN-L7-374 (refactor): doctor runner と check definition を分離する

## 0. 目的

`src/doctor/check-registry.ts` は profile 分離後も、check definition、runner、compatibility export を同じファイルに保持していた。doctor は今後も scoped execution や consumer-safe profile を増やす可能性があるため、実行責務と定義責務を分け、変更時の hot zone を狭める。

## 1. Scope

- `src/doctor/runner.ts` に `DoctorOptions` / `DoctorCheckRun` / `DoctorCheckDefinition` / selection / collection を移す。
- `src/doctor/check-definitions.ts` に detector import と `buildFullDoctorCheckDefinitions` を移す。
- `src/doctor/check-registry.ts` は既存 import 互換の re-export barrel とする。
- `tests/doctor.test.ts` の structural assertion を新しい責務境界に合わせる。

## 2. Non-Scope

- doctor check id の追加・削除・順序変更はしない。
- `doctor --profile` / `--scope` / `--setup-smoke` の意味論は変更しない。
- Pack/consumer template の案内文は変更しない。

## 3. DoD

- [x] `check-registry.ts` 経由の既存 import が壊れない。
- [x] `runner.ts` は runner/selection 実装を持ち、`check-definitions.ts` は check definition 実装を持つ。
- [x] targeted doctor / CLI surface tests、typecheck、Biome、plan lint が green。

## 4. Verification

- `bun run test -- tests\doctor.test.ts --testNamePattern "doctor profile|toolchain gate|hard-gate aggregation" --reporter=dot`
- `bun run test -- tests\cli-surface.test.ts --testNamePattern "doctor profile|doctor profiles|doctor scope|doctor verification" --reporter=dot`
- `bun run typecheck`
- `bunx biome check src\doctor\check-registry.ts src\doctor\check-definitions.ts src\doctor\runner.ts tests\doctor.test.ts docs\plans\PLAN-L7-374-doctor-runner-definition-modules.md`
- `bun run src\cli.ts plan lint`
- `bun run src\cli.ts doctor`
