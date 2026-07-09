---
plan_id: PLAN-L7-370-doctor-profile-cli
title: "PLAN-L7-370 (refactor): doctor profile を CLI surface 化する"
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
backprop_decision_reason: "既存 doctor profile registry の公開 surface 化であり、doctor gate の意味論や上位要件は変更しない。"
agent_slots:
  - role: tl
    slot_label: "TL - consumer-safe doctor profile surface レビュー"
  - role: se
    slot_label: "SE - CLI option と profile catalog regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-370-doctor-profile-cli.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/check-registry.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-RECOVERY-06-pack-consumer-doctor-profile.md
  requires:
    - docs/plans/PLAN-RECOVERY-06-pack-consumer-doctor-profile.md
review_evidence:
  - reviewer: codex-explorer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-07T12:45:00+09:00"
    tests_green_at: "2026-07-07T12:45:00+09:00"
    verdict: approve
    scope: "doctor profile の公開 CLI surface と consumer-safe profile catalog。既存 setup-smoke / scope alias は互換維持。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run test -- tests\\doctor.test.ts --testNamePattern \"doctor profile|toolchain gate|hard-gate aggregation\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T12:45:00+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:543ee37817645cd633901a2b244b0f881d127ed84e68d9350c58452f05a10da3"
        anchor_commit: 9f8ee327b2473e2badc18fbb6c8d8da28a352e8b
      - kind: unit_test
        command: "bun run test -- tests\\cli-surface.test.ts --testNamePattern \"doctor profile|doctor profiles|doctor scope|doctor verification\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T12:45:00+09:00"
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:c845079e2127cdd15f038d05c6999c3dcaee74821f1d3e10bcd0d9ce0ee8885e"
        anchor_commit: 9f8ee327b2473e2badc18fbb6c8d8da28a352e8b
---

# PLAN-L7-370 (refactor): doctor profile を CLI surface 化する

## 0. 目的

`doctor` の source-only full profile と consumer-safe profile を CLI 上で明示的に確認・選択できるようにする。
Pack 導入先や consumer project では full doctor が source repository 前提の gate を多く含むため、利用者が `--setup-smoke` などの一時的な実装名 alias を知らなくても、意図した profile を確認して実行できる状態にする。

## 1. 背景

`src/doctor/check-registry.ts` には `source-full` / `source-toolchain` / `consumer-setup-smoke` の profile registry が既に存在する。一方、CLI surface は `--setup-smoke` と `--scope toolchain` のみで、profile 名そのものを表示・指定できなかった。

この状態では次の問題が残る。

- consumer-safe profile が内部 API に閉じ、Pack 利用者に見えない。
- `doctor --setup-smoke` が profile ではなく一時的な smoke option に見える。
- source-only full doctor と consumer-safe doctor の境界を CLI で説明しにくい。

## 2. Scope

- `doctor --profiles` で profile catalog を出す。
- `doctor --profile <id>` で named profile を実行する。
- `--setup-smoke` / `--scope toolchain` は互換 alias として維持する。
- invalid profile は `--json` 時も machine-readable に fail-close する。

## 3. Non-Scope

- doctor check registry の分解追加は行わない。
- consumer 向け full profile の新設は行わない。
- `PLAN-RECOVERY-06` の setup template / hook wrapper 方針は変更しない。

## 4. 実装結果

- `DoctorOptions.profile` を追加し、既存 `DOCTOR_RUN_PROFILES` を直接解決できるようにした。
- `collectDoctorCheckRun` が解決済み profile の `scope` を使うようにし、`--profile source-toolchain` が full doctor へ戻らないようにした。
- `ut-tdd doctor --profiles [--json]` を追加した。
- `ut-tdd doctor --profile source-toolchain` などの named profile 実行を追加した。
- CLI help / invalid profile / catalog / toolchain profile 実行をテストで固定した。

## 5. DoD

- [x] profile catalog が CLI で表示できる。
- [x] consumer-safe profile と source-only profile の `sourceOnly` 境界が JSON で確認できる。
- [x] named profile 実行が `--setup-smoke` alias に依存しない。
- [x] invalid profile は machine-readable に fail-close する。
- [x] 既存 `--setup-smoke` / `--scope toolchain` 互換は維持する。

## 6. Verification

- `bun run test -- tests\doctor.test.ts --testNamePattern "doctor profile|toolchain gate|hard-gate aggregation" --reporter=dot`
- `bun run test -- tests\cli-surface.test.ts --testNamePattern "doctor profile|doctor profiles|doctor scope|doctor verification" --reporter=dot`
- `bun run typecheck`
- `bunx biome check src\doctor\check-registry.ts src\cli.ts tests\doctor.test.ts tests\cli-surface.test.ts docs\plans\PLAN-L7-370-doctor-profile-cli.md`
