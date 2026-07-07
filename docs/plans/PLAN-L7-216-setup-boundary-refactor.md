---
plan_id: PLAN-L7-216-setup-boundary-refactor
title: "PLAN-L7-216 (impl): setup boundary refactor and generic onboarding hardening"
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
    slot_label: "Codex - setup boundary refactor"
  - role: qa
    slot_label: "Codex - setup regression verification"
generates:
  - artifact_path: docs/plans/PLAN-L7-216-setup-boundary-refactor.md
    artifact_type: markdown_doc
  - artifact_path: src/setup/index.ts
    artifact_type: source_module
  - artifact_path: src/setup/branch-protection.ts
    artifact_type: source_module
  - artifact_path: tests/setup.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-213-project-local-setup-wrapper.md
  requires:
    - docs/plans/PLAN-L7-03-setup-solo-team.md
    - docs/plans/PLAN-L7-157-distribution-clean-pull.md
references:
  - docs/design/harness/L6-function-design/setup-solo-team.md
  - docs/test-design/harness/L7-unit-test-design.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T11:30:00+09:00"
    tests_green_at: "2026-07-02T11:28:00+09:00"
    verdict: approve
    scope: "Behavior-preserving setup boundary refactor: branch protection payload and gh api mutation moved behind src/setup/branch-protection.ts while index.ts keeps backward-compatible exports and U-SETUP-006 regression coverage."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T11:28:00+09:00"
        evidence_path: src/setup/branch-protection.ts
        output_digest: "sha256:d378cbe60c42dfa0233b589f25d6b79d5fb210ce733941df745dfee9d1d55db6"
      - kind: unit_test
        command: "bun run vitest run tests\\setup.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T11:28:00+09:00"
        evidence_path: tests/setup.test.ts
        output_digest: "sha256:d2bb6e7b7b4856c3277b73caf3fea1e95f9cce0582da8538977239080ca76f2f"
---

# PLAN-L7-216: setup boundary refactor and generic onboarding hardening

## 目的

UT-TDD harness を自己開発 repo 専用の巨大 setup 実装に閉じず、consumer project に再利用しやすい境界へ寄せる。第一 slice では挙動を変えず、GitHub branch protection 適用という高影響・認可境界を `src/setup/index.ts` から `src/setup/branch-protection.ts` へ分離する。

## 変更

- `applyBranchProtection`、`GhRunner`、`Confirm`、branch protection payload 生成を専用 module へ移す。
- `src/setup/index.ts` は setup orchestration / file emission の入口に戻し、GitHub API mutation の詳細を持たない。
- 既存 public import は壊さないため、`src/setup/index.ts` から `applyBranchProtection` と関連 type を re-export する。
- U-SETUP-006 の oracle は維持し、`--input <json>` body、非対話封鎖、admin/auth/confirm 欠落時の非実行を回帰で固定する。

## 汎用性観点

- consumer setup の核は file emission と readiness であり、GitHub branch protection は opt-in の外部設定操作である。これを module 境界で分けることで、GitHub 以外の VCS / CI profile を追加するときに `runSetup` の中心責務を膨らませない。
- `harness-check` という既定 check 名は現行 Pack contract として維持するが、payload 生成を専用関数に寄せ、後続 slice で check 名や review count を profile 化できる余地を作る。

## 検証

- `bun run vitest run tests\setup.test.ts`
- `bun run typecheck`
- `bun run src\cli.ts doctor`
