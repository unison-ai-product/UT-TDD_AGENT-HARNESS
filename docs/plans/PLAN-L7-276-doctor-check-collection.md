---
plan_id: PLAN-L7-276-doctor-check-collection
title: "PLAN-L7-276 (refactor): doctor check collection extraction"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "doctor 本体の巨大化に対する小さな責務抽出。検査項目の意味や gate 判定は変えず、runDoctor の orchestration と check collection を分離する。"
created: 2026-07-02
updated: 2026-07-02
owner: Codex
parent_design: docs/design/harness/L6-function-design/setup-solo-team.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - doctor check collection extraction"
generates:
  - artifact_path: docs/plans/PLAN-L7-276-doctor-check-collection.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path src\\doctor\\index.ts"
        output_digest: "sha256:4e07d3838355b462bcde380b659ceba391b270535c72dce984183151165bee1f"
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path tests\\doctor.test.ts"
        output_digest: "sha256:4e76e7579fb3340c29c1454a018ae4c7271f369f4f13220874a332b4a5c4364b"
dependencies:
  parent: docs/plans/PLAN-L7-268-github-ci-profile-table.md
  requires: []
  references:
    - src/doctor/index.ts
    - tests/doctor.test.ts
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T17:45:00+09:00"
    tests_green_at: "2026-07-02T17:45:00+09:00"
    verdict: approve
    scope: "runDoctor keeps setup-smoke and leading messages; check collection is extracted without changing hard gate membership."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-02T17:31:00+09:00"
        evidence_path: src/doctor/index.ts
        output_digest: "sha256:4e07d3838355b462bcde380b659ceba391b270535c72dce984183151165bee1f"
      - kind: unit_test
        command: "bun run vitest run tests\\doctor.test.ts -t \"keeps all hard gates wired into runDoctor hard-gate aggregation\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T17:36:06+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:4e76e7579fb3340c29c1454a018ae4c7271f369f4f13220874a332b4a5c4364b"
---

# PLAN-L7-276: doctor check collection extraction

## 背景

`src/doctor/index.ts` は 1000 行を超え、`runDoctor` が setup-smoke 分岐、mode/handover メッセージ、全 check 実行、hard gate 集約を同時に担っている。doctor 本体は今後もリファクタ対象だが、21:00 までに閉じるには大きな profile 設計や module 分割ではなく、挙動不変の小抽出が妥当である。

## 変更

- `collectDoctorChecks(deps, options)` を追加し、full doctor の check 実行と `checks` 配列を移す。
- `runDoctor` は setup-smoke 早期 return、mode/handover/agent-slots の warning surface、`buildDoctorResult` 呼び出しに集中させる。
- 既存の hard gate 配線テストが読む `const checks = [...]` は維持する。

## 検証

- `bunx biome check --write src\\doctor\\index.ts`
- `bun run typecheck`
- `bun run vitest run tests\\doctor.test.ts tests\\doctor-runtime-surface.test.ts --reporter=dot`
- `bun run src\\cli.ts db rebuild --json`
- `bun run src\\cli.ts doctor`
- Pack checkout で `bun run test:pack`

## DoD

- [x] `runDoctor` の責務が orchestration と result assembly に寄る。
- [x] hard gate の membership は変えない。
- [x] doctor profile 設計や大規模 module 分割には踏み込まない。
