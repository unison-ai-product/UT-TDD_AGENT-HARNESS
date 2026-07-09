---
plan_id: PLAN-L7-375-consumer-toolchain-profile
title: "PLAN-L7-375 (refactor): consumer toolchain doctor profile を追加する"
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
backprop_decision_reason: "既存 toolchain doctor scope に consumer 向け profile 名を追加する互換的な公開 surface 改善であり、doctor check の意味論や gate 条件は変更しない。"
agent_slots:
  - role: tl
    slot_label: "TL - consumer-safe doctor profile alias review"
  - role: se
    slot_label: "SE - profile surface regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-375-consumer-toolchain-profile.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/profiles.ts
    artifact_type: source_module
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-370-doctor-profile-cli.md
  requires:
    - docs/plans/PLAN-L7-370-doctor-profile-cli.md
    - docs/plans/PLAN-L7-373-doctor-profile-module.md
review_evidence:
  - reviewer: codex-explorer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-07T14:12:42+09:00"
    tests_green_at: "2026-07-07T14:12:42+09:00"
    verdict: approve
    scope: "consumer-toolchain profile 追加。source-toolchain 互換維持、CLI public surface、invalid profile message、consumer audience/safe list の回帰。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run test -- tests\\doctor.test.ts --testNamePattern \"doctor profile|toolchain gate|hard-gate aggregation\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T14:12:42+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:94f95e61ed1cc3f64b20593d06aa2684574da2c2450c077699cac80767eb7431"
        anchor_commit: af658d515e923c5a5b7d35e6e96d6aa894caca47
      - kind: unit_test
        command: "bun run test -- tests\\cli-surface.test.ts --testNamePattern \"doctor profile|doctor profiles|doctor scope|doctor verification\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T14:12:42+09:00"
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:5cbc3c63927242a43759c9be956dcdf115f83928e28f486529a12ee54fda2269"
        anchor_commit: af658d515e923c5a5b7d35e6e96d6aa894caca47
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-07T14:12:42+09:00"
        evidence_path: src/doctor/profiles.ts
        output_digest: "sha256:1a6f6db8763c4915dd3d738e118ce934b407f55efc9de03b6d55703cc506d0cd"
        anchor_commit: af658d515e923c5a5b7d35e6e96d6aa894caca47
---

# PLAN-L7-375 (refactor): consumer toolchain doctor profile を追加する

## 0. 目的

`doctor --profile source-toolchain` は consumer-safe だが、名前が source repo 前提に見える。Pack/consumer 利用者が source/governance repository 用語に寄らず toolchain smoke を実行できるよう、同じ `toolchain-pin` を実行する `consumer-toolchain` profile を追加する。

## 1. Scope

- `DoctorRunProfileId` / `DOCTOR_RUN_PROFILES` / `DOCTOR_RUN_PROFILE_IDS` に `consumer-toolchain` を追加する。
- `consumer-toolchain` は `audience: "consumer"`、`invocation: "registry"`、`scope: "toolchain"`、`sourceOnly: false` とする。
- 既存 `source-toolchain` と `--scope toolchain` の互換は維持する。
- CLI public surface と invalid profile message の regression を更新する。

## 2. Non-Scope

- full doctor の consumer profile は追加しない。
- `toolchain-pin` 以外の check を consumer toolchain profile に含めない。
- setup template の既定 `consumer-setup-smoke` は変更しない。

## 3. DoD

- [x] `consumer-toolchain` が `doctor --profiles --json` に表示される。
- [x] `doctor --profile consumer-toolchain --json` が `toolchain-pin` のみを実行する。
- [x] `source-toolchain` は互換 profile として残る。
- [x] targeted doctor / CLI surface tests、typecheck、Biome が green。

## 4. Verification

- `bun run test -- tests\doctor.test.ts --testNamePattern "doctor profile|toolchain gate|hard-gate aggregation" --reporter=dot`
- `bun run test -- tests\cli-surface.test.ts --testNamePattern "doctor profile|doctor profiles|doctor scope|doctor verification" --reporter=dot`
- `bun run typecheck`
- `bunx biome check src\doctor\profiles.ts tests\doctor.test.ts tests\cli-surface.test.ts docs\plans\PLAN-L7-375-consumer-toolchain-profile.md`
- `bun run src\cli.ts plan lint`
- `bun run src\cli.ts doctor`
