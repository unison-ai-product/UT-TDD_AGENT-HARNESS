---
plan_id: PLAN-L7-218-setup-distribution-module-extraction
title: "PLAN-L7-218 (impl): setup distribution module extraction"
kind: impl
layer: L7
drive: be
status: confirmed
created: 2026-07-02
updated: 2026-07-02
owner: Codex
route_signal: code_smell
route_mode: refactor
parent_design: docs/design/harness/L6-function-design/setup-solo-team.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "Codex - setup distribution decomposition"
  - role: qa
    slot_label: "Codex - distribution regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-218-setup-distribution-module-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/setup/index.ts
    artifact_type: source_module
  - artifact_path: src/setup/distribution.ts
    artifact_type: source_module
  - artifact_path: tests/setup.test.ts
    artifact_type: test_code
  - artifact_path: tests/distribution-acceptance.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-216-setup-boundary-refactor.md
  requires:
    - docs/plans/PLAN-L7-157-distribution-clean-pull.md
    - docs/plans/PLAN-L7-213-project-local-setup-wrapper.md
references:
  - src/setup/index.ts
  - src/setup/distribution.ts
  - tests/setup.test.ts
  - tests/distribution-acceptance.test.ts
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T11:52:00+09:00"
    tests_green_at: "2026-07-02T11:51:00+09:00"
    verdict: approve
    scope: "Behavior-preserving setup distribution extraction: clean Pack export, consumer readiness, and sync-plan logic moved from src/setup/index.ts to src/setup/distribution.ts while index.ts keeps backward-compatible re-exports for CLI and tests."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T11:50:00+09:00"
        evidence_path: src/setup/distribution.ts
        output_digest: "sha256:dafe60b49ffd3b6e1503ed1d7d15826329f52ccfa87dee09bf052a0b1bab286c"
      - kind: unit_test
        command: "bun run vitest run tests\\setup.test.ts tests\\distribution-acceptance.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T11:51:00+09:00"
        evidence_path: tests/setup.test.ts
        output_digest: "sha256:d2bb6e7b7b4856c3277b73caf3fea1e95f9cce0582da8538977239080ca76f2f"
      - kind: integration_test
        command: "bun run vitest run tests\\setup.test.ts tests\\distribution-acceptance.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T11:51:00+09:00"
        evidence_path: tests/distribution-acceptance.test.ts
        output_digest: "sha256:367d0423e4b538c570dddf174113c689360a56dd303a354b6a5e1883036dc6ec"
---

# PLAN-L7-218: setup distribution module extraction

## 目的

`src/setup/index.ts` は consumer setup、GitHub branch protection、clean Pack distribution の責務を同じ file に抱えていた。これは自己開発 repo / Pack repo の配布事情が、汎用 consumer onboarding の中心処理へ混ざる構造である。

この slice では挙動を変えず、clean distribution / consumer readiness / Pack sync plan を `src/setup/distribution.ts` へ抽出し、`src/setup/index.ts` は既存 public import を維持する re-export 境界にする。

## 変更

- `CleanDistributionPlan`、`ConsumerReadinessPlan`、`PackSyncPlan` と関連 builder を `src/setup/distribution.ts` へ移す。
- `cleanDistributionArtifactPath`、`cleanDistributionSourcePath`、`transformCleanDistributionArtifact`、`PACK_SAFE_TEST_SCRIPT` を同じ module に集約する。
- `src/setup/index.ts` は CLI / tests の既存 import を壊さないため、同名 export を維持する。

## 汎用性観点

Pack repo の既定値や GitHub release / sync command list は、UT-TDD harness 自体の配布 channel に必要な知識であり、consumer project に adapter files を生成する setup 本体とは責務が違う。module を分けることで、将来 GitHub 以外の配布先や consumer profile を追加するときに `runSetup` / `emitSetup` の中心責務を増やさずに済む。

## デグレ対策

- `tests/setup.test.ts` で clean distribution contract、branch protection、setup orchestration を維持する。
- `tests/distribution-acceptance.test.ts` で Pack-safe artifact の install / CLI smoke を維持する。
- `bun run typecheck` で re-export 後の CLI import compatibility を確認する。
