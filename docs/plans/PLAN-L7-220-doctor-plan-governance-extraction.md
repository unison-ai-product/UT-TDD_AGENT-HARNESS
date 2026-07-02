---
plan_id: PLAN-L7-220-doctor-plan-governance-extraction
title: "PLAN-L7-220 (impl): doctor plan governance module extraction"
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
    slot_label: "Codex - doctor plan governance decomposition"
  - role: qa
    slot_label: "Codex - doctor governance regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-220-doctor-plan-governance-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: src/doctor/plan-governance.ts
    artifact_type: source_module
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-supersession.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-body-substance.test.ts
    artifact_type: test_code
  - artifact_path: tests/plan-completion-drift.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-217-doctor-setup-smoke-extraction.md
  requires:
    - docs/plans/PLAN-L7-09-backfill-pairing.md
    - docs/plans/PLAN-L7-13-review-evidence.md
    - docs/plans/PLAN-L7-89-plan-errata-supersession-gate.md
    - docs/plans/PLAN-L7-92-plan-body-substance-gate.md
    - docs/plans/PLAN-L7-93-plan-completion-drift-gate.md
references:
  - src/doctor/index.ts
  - src/doctor/plan-governance.ts
  - tests/doctor.test.ts
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T12:04:00+09:00"
    tests_green_at: "2026-07-02T12:03:00+09:00"
    verdict: approve
    scope: "Behavior-preserving doctor PLAN governance extraction: backfill, scrum-reverse, plan supersession, plan body substance, completion drift, propagation, pair-freeze, review-evidence, and guardrail invariant checks moved to src/doctor/plan-governance.ts while src/doctor/index.ts keeps existing exports."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T12:01:00+09:00"
        evidence_path: src/doctor/plan-governance.ts
        output_digest: "sha256:60e111dc79137214cbdcf53e0691e5d880ee7a3b782b7f7dac2b3340a51da96d"
      - kind: unit_test
        command: "bun run vitest run tests\\doctor.test.ts tests\\plan-supersession.test.ts tests\\plan-body-substance.test.ts tests\\plan-completion-drift.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T12:03:00+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:282deaee2fd3064d743310e503fefbf08c2749d6cd9be8ebc815deed99e3fd31"
---

# PLAN-L7-220: doctor plan governance module extraction

## 目的

`src/doctor/index.ts` は統合 gate runner と個別 gate 実装を同じ file に抱え続けており、doctor 自体が保守性リスクになっている。今回の slice では、PLAN governance / review governance の hard gate 群を `src/doctor/plan-governance.ts` に分ける。

## 変更

- `checkBackfillResult` / `checkBackfill` / `checkScrumReverse` を専用 module に移す。
- `checkPlanSupersession` / `checkPlanBodySubstance` / `checkPlanCompletionDrift` / `checkPropagation` を専用 module に移す。
- `checkPairFreeze` / `checkReviewEvidence` / `checkGuardrailInvariants` を専用 module に移す。
- `src/doctor/index.ts` は既存 test / CLI import を壊さないため、同名 export を維持する。

## デグレ対策

抽出直後に `impl-plan-trace` が `src/doctor/plan-governance.ts` の PLAN 未登録を検出した。これは refactor 駆動中の正しい fail-close であり、本 PLAN が generates 登録を閉じる。対象テストは doctor hard gate surface と個別 PLAN governance tests を継続して使う。
