---
plan_id: PLAN-L7-373-doctor-profile-module
title: "PLAN-L7-373 (refactor): doctor profile registry を小 module へ分離する"
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
backprop_decision_reason: "doctor profile registry の配置を分離する保守性改善であり、doctor profile の意味論や consumer/source 境界は変更しない。"
agent_slots:
  - role: tl
    slot_label: "TL - doctor profile module boundary review"
  - role: se
    slot_label: "SE - profile registry regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-373-doctor-profile-module.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/profiles.ts
    artifact_type: source_module
  - artifact_path: src/doctor/check-registry.ts
    artifact_type: source_module
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-370-doctor-profile-cli.md
  requires:
    - docs/plans/PLAN-L7-370-doctor-profile-cli.md
review_evidence:
  - reviewer: codex
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-07T13:43:06+09:00"
    tests_green_at: "2026-07-07T13:43:06+09:00"
    verdict: approve
    scope: "doctor profile registry の module 分離と check-registry 互換 re-export。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run test -- tests\\doctor.test.ts --testNamePattern \"doctor profile|toolchain gate|hard-gate aggregation\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T13:43:06+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:678c89128a083f6bb318cbfe64473290442d597daf2623b8a010fdb5465f8d31"
      - kind: unit_test
        command: "bun run test -- tests\\cli-surface.test.ts --testNamePattern \"doctor profile|doctor profiles|doctor scope|doctor verification\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T13:43:06+09:00"
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:c845079e2127cdd15f038d05c6999c3dcaee74821f1d3e10bcd0d9ce0ee8885e"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-07T13:43:06+09:00"
        evidence_path: src/doctor/profiles.ts
        output_digest: "sha256:07788a8e6886bb9aad05b341208ea5a9eb768cd0b02db4ef0fefff38a33253b1"
---

# PLAN-L7-373 (refactor): doctor profile registry を小 module へ分離する

## 0. 目的

`src/doctor/check-registry.ts` は doctor check の登録、run collection、profile catalog を同居させており、今後の consumer/source profile 追加で責務が膨らみやすい。profile catalog を `src/doctor/profiles.ts` へ分離し、既存 import surface は `check-registry.ts` の re-export で維持する。

## 1. Scope

- `DoctorScope` / `DoctorRunProfile*` 型、`FULL_DOCTOR_OUTPUT_IDS`、`DOCTOR_RUN_PROFILES`、profile 解決 helper を `src/doctor/profiles.ts` へ移す。
- `src/doctor/check-registry.ts` は既存 API 名を re-export し、`selectDoctorCheckDefinitions` と check collection だけを持つ。
- 既存の `doctor --profile` / `--profiles` / `--scope toolchain` / `--setup-smoke` の意味論は変更しない。

## 2. Non-Scope

- 新しい profile の追加はしない。
- doctor check id の追加・削除・並び替えはしない。
- Pack/consumer template の案内文は変更しない。

## 3. DoD

- [x] 既存 `check-registry.ts` 経由 import が壊れない。
- [x] profile catalog の構造 regression が `profiles.ts` を検査する。
- [x] targeted doctor / CLI surface tests、typecheck、plan lint が green。doctor は PLAN metadata 補正後に再実行する。

## 4. Verification

- `bun run test -- tests\doctor.test.ts --testNamePattern "doctor profile|toolchain gate|hard-gate aggregation" --reporter=dot`
- `bun run test -- tests\cli-surface.test.ts --testNamePattern "doctor profile|doctor profiles|doctor scope|doctor verification" --reporter=dot`
- `bun run typecheck`
- `bunx biome check src\doctor\profiles.ts src\doctor\check-registry.ts tests\doctor.test.ts docs\plans\PLAN-L7-373-doctor-profile-module.md`
- `bun run src\cli.ts plan lint`
- `bun run src\cli.ts doctor`
