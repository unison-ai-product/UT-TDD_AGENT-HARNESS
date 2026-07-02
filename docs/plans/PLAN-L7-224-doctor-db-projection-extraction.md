---
plan_id: PLAN-L7-224-doctor-db-projection-extraction
title: "PLAN-L7-224 (impl): Doctor DB projection extraction"
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
    slot_label: "Codex - doctor DB projection extraction"
  - role: qa
    slot_label: "Codex - DB projection regression fence"
generates:
  - artifact_path: docs/plans/PLAN-L7-224-doctor-db-projection-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/db-projection.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/doctor-db-projection.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-222-doctor-runtime-surface-extraction.md
  requires:
    - docs/plans/PLAN-L7-205-strict-telemetry-provenance-doctor.md
    - docs/plans/PLAN-L7-223-cli-distribution-registrar-extraction.md
references:
  - src/doctor/index.ts
  - src/doctor/db-projection.ts
  - tests/doctor.test.ts
  - tests/doctor-db-projection.test.ts
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T13:05:00+09:00"
    tests_green_at: "2026-07-02T13:05:00+09:00"
    verdict: approve
    scope: "Doctor DB projection refactor: coverage and ingestion checks move out of src/doctor/index.ts while preserving runDoctor wiring and exported check functions."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T13:05:00+09:00"
        evidence_path: src/doctor/db-projection.ts
        output_digest: "sha256:a2005bb86c9e2ce54edb815649a5cb3fde7a74778e3a509c5e0f5eb1f7a0439e"
      - kind: unit_test
        command: "bun run vitest run tests\\doctor-db-projection.test.ts tests\\doctor.test.ts --testNamePattern \"doctor db projection|hard-gate checker inputs\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T13:05:00+09:00"
        evidence_path: tests/doctor-db-projection.test.ts
        output_digest: "sha256:5737f96d29c340095b40ebb227bbd2dd68336bcbe0705ed7a7b3f7b0d49df680"
---

# PLAN-L7-224: Doctor DB projection extraction

## 目的

`src/doctor/index.ts` は hard gate の集約点として必要だが、DB projection coverage / ingestion の実装詳細まで抱えているため、doctor の肥大化と回帰戦略の見通し悪化を招いている。特に harness.db の projection は GitHub / Pack 連携時の検証基準点になるため、doctor 本体から独立した責務として管理する。

この slice では DB projection 系の check 関数を `src/doctor/db-projection.ts` に移し、`src/doctor/index.ts` は import / re-export と `runDoctor` wiring に寄せる。

## 変更

- `checkDbProjectionCoverage` / `checkDbProjectionIngestion` を `src/doctor/db-projection.ts` へ移す。
- telemetry provenance 集計と runtime model telemetry projection は DB projection モジュール内の private helper に閉じる。
- `src/doctor/index.ts` の public export と `runDoctor` の message order は維持する。
- 新規テストで切り出し先モジュールの fail-close 動作を直接検証する。

## デグレ対策

- `tests/doctor-db-projection.test.ts` で新モジュール直参照の fail-close を検証する。
- `tests/doctor.test.ts` の既存 import 経路を残し、public API 互換を維持する。
- full doctor と Pack 側の `setup --solo` / `doctor --setup-smoke` で clean distribution artifact でも同じ gate が通ることを確認する。
