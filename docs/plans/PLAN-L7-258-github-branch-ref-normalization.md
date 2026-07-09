---
plan_id: PLAN-L7-258-github-branch-ref-normalization
title: "PLAN-L7-258 (refactor): GitHub branch ref normalization"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "Behavior-invariant hardening inside the existing GitHub ops guard. The public guard policy remains poc/* main-merge block, hotfix/* postmortem requirement, and Conventional Commits checking; only local/GitHub branch ref spelling is normalized before the same checks run."
created: 2026-07-02
updated: 2026-07-02
owner: Codex
parent_design: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - GitHub branch guard ref normalization"
generates:
  - artifact_path: docs/plans/PLAN-L7-258-github-branch-ref-normalization.md
    artifact_type: markdown_doc
  - artifact_path: src/github/ops-guard.ts
    artifact_type: source_module
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path src\\github\\ops-guard.ts"
        output_digest: "sha256:6855182069de14c967aa43cf353dfdd9951debd624d43fc828439ae96a06ff4a"
  - artifact_path: tests/github-ops-guard.test.ts
    artifact_type: test_code
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path tests\\github-ops-guard.test.ts"
        output_digest: "sha256:04c6b1c61cc55f8657dbd00efeae94d7991310064479097fa771cf73be2e6c7f"
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-197-github-ops-workflow-hardening.md
  references:
    - src/github/ops-guard.ts
    - tests/github-ops-guard.test.ts
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T16:35:00+09:00"
    tests_green_at: "2026-07-02T16:35:00+09:00"
    verdict: approve
    scope: "GitHub branch guard input normalization for refs/heads, refs/remotes, remotes, and origin prefixes."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T16:35:00+09:00"
        evidence_path: src/github/ops-guard.ts
        output_digest: "sha256:6855182069de14c967aa43cf353dfdd9951debd624d43fc828439ae96a06ff4a"
        anchor_commit: 8bd70318d38ac87ab65e40a04dfa7bd289bef0dd
      - kind: unit_test
        command: "bun run vitest run tests\\github-ops-guard.test.ts tests\\github-ci-policy.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T16:35:00+09:00"
        evidence_path: tests/github-ops-guard.test.ts
        output_digest: "sha256:04c6b1c61cc55f8657dbd00efeae94d7991310064479097fa771cf73be2e6c7f"
        anchor_commit: 8bd70318d38ac87ab65e40a04dfa7bd289bef0dd
---

# PLAN-L7-258: GitHub branch ref normalization

## 背景

`src/github/ops-guard.ts` の branch type 判定は `ref.split("/", 1)[0]` に依存していた。入力が `poc/foo` の場合は問題ないが、GitHub API や local git の経路によって `refs/heads/poc/foo`、`refs/remotes/origin/hotfix/foo`、`origin/hotfix/foo` の形で渡ると `refs` / `origin` と分類され、`poc/*` / `hotfix/*` guard が素通りし得る。

これは GitHub 連携のデグレ対策として ROI が高い。挙動の対象は入力正規化だけで、既存の Conventional Commits 判定や release plan には触れない。

## 変更

- `normalizeBranchRef` を追加し、`refs/heads/`、`refs/remotes/`、`remotes/`、`origin/` prefix を除去する。
- `branchType` と `baseRef === main` 判定を正規化後の ref で行う。
- テストで `refs/heads/poc/*` と `refs/remotes/origin/hotfix/*` が既存 guard に捕捉されることを固定する。

## 検証

- `bunx biome check --write src\\github\\ops-guard.ts tests\\github-ops-guard.test.ts`
- `bun run typecheck`
- `bun run vitest run tests\\github-ops-guard.test.ts tests\\github-ci-policy.test.ts --reporter=dot`
- `bun run src\\cli.ts doctor`

## DoD

- [x] `refs/heads/poc/*` が `poc` と分類され、main 直 merge guard に捕捉される。
- [x] `refs/remotes/origin/hotfix/*` / `origin/main` が hotfix postmortem guard に捕捉される。
- [x] 対象 test と full doctor が green。
- [x] Pack repo へ sync され、Pack gate が green。
