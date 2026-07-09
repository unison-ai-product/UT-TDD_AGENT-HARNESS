---
plan_id: PLAN-L7-225-doctor-rule-quality-extraction
title: "PLAN-L7-225 (impl): Doctor rule quality extraction"
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
    slot_label: "Codex - doctor rule quality extraction"
  - role: qa
    slot_label: "Codex - rule quality regression fence"
generates:
  - artifact_path: docs/plans/PLAN-L7-225-doctor-rule-quality-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/rule-quality.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/doctor-rule-quality.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-224-doctor-db-projection-extraction.md
  requires:
    - docs/plans/PLAN-L7-132-green-command-digest-integrity.md
    - docs/plans/PLAN-L7-223-cli-distribution-registrar-extraction.md
references:
  - src/doctor/index.ts
  - src/doctor/rule-quality.ts
  - tests/doctor.test.ts
  - tests/doctor-rule-quality.test.ts
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T13:45:00+09:00"
    tests_green_at: "2026-07-02T13:45:00+09:00"
    verdict: approve
    scope: "Doctor rule quality refactor: coding/design/DDD/runtime portability/rule drift/gate confirm/readability checks move out of src/doctor/index.ts while preserving runDoctor wiring and exported check functions."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T13:45:00+09:00"
        evidence_path: src/doctor/rule-quality.ts
        output_digest: "sha256:048d7ed8f471bda2a7a31c7403dc3e5089a1d7cf23f2550937d7e4bbd4cf3d44"
        anchor_commit: f91ecc90ee18afb0ba49bd49d144a1bd9d783494
      - kind: unit_test
        command: "bun run vitest run tests\\doctor-rule-quality.test.ts tests\\doctor.test.ts --testNamePattern \"doctor rule quality|hard-gate checker inputs\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T13:45:00+09:00"
        evidence_path: tests/doctor-rule-quality.test.ts
        output_digest: "sha256:e3d9e577a73d5ac22c7928fbecb10cfd1e4a6e8f1b18c51384a16d3ac803c1b1"
        anchor_commit: f91ecc90ee18afb0ba49bd49d144a1bd9d783494
---

# PLAN-L7-225: Doctor rule quality extraction

## 目的

`src/doctor/index.ts` は doctor の実行順序と hard gate 集約を担うべきだが、coding rules / design language / DDD-TDD / runtime portability / rule drift / gate confirm / readability の adapter 実装まで保持している。これらは UT-TDD Harness を自己開発だけでなく一般のシステム開発に適用する際の品質境界であり、doctor 本体から独立させることで保守と回帰確認の粒度を上げる。

この slice ではルール品質系の check 関数を `src/doctor/rule-quality.ts` に移し、`src/doctor/index.ts` は import / re-export と `runDoctor` wiring に寄せる。

## 変更

- `checkCodingRules` / `checkDesignLanguage` / `checkDddTddRules` / `checkRuntimePortability` / `checkRuleDrift` / `checkGateConfirm` を `src/doctor/rule-quality.ts` へ移す。
- `checkReadability` / `checkRuntimeReadability` も同じ rule quality surface にまとめる。
- `src/doctor/index.ts` の public export と `runDoctor` の message order は維持する。
- 新規テストで切り出し先モジュールの fail-close 動作を直接検証する。

## デグレ対策

- `tests/doctor-rule-quality.test.ts` で新モジュール直参照の fail-close を検証する。
- `tests/doctor.test.ts` の既存 import 経路を残し、public API 互換を維持する。
- full doctor と Pack 側の `setup --solo` / `doctor --setup-smoke` で clean distribution artifact でも同じ gate が通ることを確認する。
