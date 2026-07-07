---
plan_id: PLAN-L7-377-doctor-definition-groups
title: "PLAN-L7-377 (refactor): doctor check definitions を group 化する"
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
backprop_decision_reason: "doctor check の登録表を domain group へ分割する保守性改善であり、doctor check の id、順序、profile、requires、実行結果の意味論は変更しない。"
agent_slots:
  - role: tl
    slot_label: "TL - doctor definition group boundary review"
  - role: se
    slot_label: "SE - doctor registry regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-377-doctor-definition-groups.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/check-definitions.ts
    artifact_type: source_module
  - artifact_path: src/doctor/check-definition-groups.ts
    artifact_type: source_module
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-374-doctor-runner-definition-modules.md
  requires:
    - docs/plans/PLAN-L7-374-doctor-runner-definition-modules.md
review_evidence:
  - reviewer: codex-explorer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-07T14:52:41+09:00"
    tests_green_at: "2026-07-07T14:52:41+09:00"
    verdict: approve
    scope: "buildFullDoctorCheckDefinitions の公開 API を維持し、内部登録表だけを group 化する。実行順、toolchain profile、dependency-drift/regression-expansion 共有 state、strictGreenCommandDigest、handoverDeps は不変。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run test -- tests\\doctor.test.ts --testNamePattern \"doctor profile|toolchain gate|hard-gate aggregation|dependency/regression\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-07T14:52:41+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:97bc9dc4711dcd771714c3e73d1f89f039b382fca41ffca5b0fbe79abd0bec1b"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-07T14:52:41+09:00"
        evidence_path: src/doctor/check-definition-groups.ts
        output_digest: "sha256:fcd37404eb0f0c18e1d42c8311bd59ad2ee4f80e7152ea2ffa0c427882fbceb7"
      - kind: lint
        command: "bunx biome check src\\doctor\\check-definitions.ts src\\doctor\\check-definition-groups.ts tests\\doctor.test.ts docs\\plans\\PLAN-L7-377-doctor-definition-groups.md"
        runner: bun
        scope: changed-files
        exit_code: 0
        completed_at: "2026-07-07T14:52:41+09:00"
        evidence_path: src/doctor/check-definitions.ts
        output_digest: "sha256:046d4c7aeffd3745904693dd66eaf10502af87ac89473d1bec489f5aa2abaaa9"
---

# PLAN-L7-377 (refactor): doctor check definitions を group 化する

## 0. 目的

`src/doctor/check-definitions.ts` は doctor check の登録一覧、依存順、profile 対応、例外的な共有 state を 1 つの長い関数に集約していた。前段の runner/profile 分離で実行責務は分かれたが、登録表の hot zone は残っている。今回の slice では、挙動を変えずに check definitions を domain group へ分け、doctor 追加時の編集単位とレビュー観点を小さくする。

## 1. Scope

- `src/doctor/check-definition-groups.ts` を追加し、doctor check definitions を group 単位で構築する。
- `src/doctor/check-definitions.ts` は group flatten の薄い公開 API として残す。
- `tests/doctor.test.ts` で flatten 後の順序、group id、`dependency-drift` → `regression-expansion` の同一 group / 順序を固定する。

## 2. Non-Scope

- doctor check id の追加・削除・並べ替えはしない。
- profile semantics (`full` / `toolchain`) は変更しない。
- dynamic discovery、plugin registry、profile 自動推論は導入しない。
- `setup-smoke` bypass と `plan-reference-freshness` leading advisory は現状維持する。

## 3. DoD

- [x] `buildFullDoctorCheckDefinitions` の export / signature が維持される。
- [x] flatten 後の doctor check id 順序が従来の `FULL_DOCTOR_OUTPUT_IDS` contract と一致する。
- [x] `toolchain-pin` だけが toolchain profile へ残る。
- [x] `dependency-drift` と `regression-expansion` の requires / 共有 state が壊れない。
- [x] targeted doctor test / typecheck / Biome が green。plan lint / doctor は final gate で確認する。

## 4. Verification

- `bun run test -- tests\doctor.test.ts --testNamePattern "doctor profile|toolchain gate|hard-gate aggregation|dependency/regression" --reporter=dot`
- `bun run typecheck`
- `bunx biome check src\doctor\check-definitions.ts src\doctor\check-definition-groups.ts tests\doctor.test.ts docs\plans\PLAN-L7-377-doctor-definition-groups.md`
- `bun run src\cli.ts plan lint`
- `bun run src\cli.ts doctor`
