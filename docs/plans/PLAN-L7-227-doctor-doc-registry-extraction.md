---
plan_id: PLAN-L7-227-doctor-doc-registry-extraction
title: "PLAN-L7-227 (impl): Doctor doc registry extraction"
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
    slot_label: "Codex - doctor doc registry extraction"
  - role: qa
    slot_label: "Codex - doc registry regression fence"
generates:
  - artifact_path: docs/plans/PLAN-L7-227-doctor-doc-registry-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/doc-registry.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/doctor-doc-registry.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-226-doctor-workflow-quality-extraction.md
  requires:
    - docs/plans/PLAN-L7-95-lint-wiring-meta-gate.md
    - docs/plans/PLAN-L7-223-cli-distribution-registrar-extraction.md
references:
  - src/doctor/index.ts
  - src/doctor/doc-registry.ts
  - tests/doctor.test.ts
  - tests/doctor-doc-registry.test.ts
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T14:45:00+09:00"
    tests_green_at: "2026-07-02T14:45:00+09:00"
    verdict: approve
    scope: "Doctor doc registry refactor: doc consistency, entity coverage, and FR registry audit checks move out of src/doctor/index.ts while preserving runDoctor wiring and exported check functions."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T14:45:00+09:00"
        evidence_path: src/doctor/doc-registry.ts
        output_digest: "sha256:1c0af31e6807ef821c2fc578f2bbd6ef5374b7b468d0f21808db73bf2eb45a77"
      - kind: unit_test
        command: "bun run vitest run tests\\doctor-doc-registry.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T14:45:00+09:00"
        evidence_path: tests/doctor-doc-registry.test.ts
        output_digest: "sha256:2e41bafbaf6f232bcf05b525f12f744a0394eef5d82e499721443ee8f75ea28f"
---

# PLAN-L7-227: Doctor doc registry extraction

## 目的

`src/doctor/index.ts` は doctor の実行順序と hard gate 集約を担うべきだが、doc consistency、entity coverage、FR registry audit の adapter 実装まで保持している。これらは L1/L3/screen/FR の整合を見ており、自己開発専用ではなく一般のシステム開発へ UT-TDD Harness を適用する際のドキュメント台帳品質境界である。

この slice では doc registry 系の check 関数を `src/doctor/doc-registry.ts` に移し、`src/doctor/index.ts` は import / re-export と `runDoctor` wiring に寄せる。

## 変更

- `checkDocConsistency` / `checkEntityCoverage` / `checkFrRegistryAudit` を `src/doctor/doc-registry.ts` へ移す。
- `src/doctor/index.ts` の public export と `runDoctor` の message order は維持する。
- 新規テストで切り出し先モジュールの fail-close 動作を直接検証する。

## デグレ対策

- `tests/doctor-doc-registry.test.ts` で新モジュール直参照の fail-close を検証する。
- `tests/doctor.test.ts` の runDoctor hard gate wiring 検査で aggregation 互換を維持する。
- full doctor と Pack 側の `setup --solo` / `doctor --setup-smoke` で clean distribution artifact でも同じ gate が通ることを確認する。
