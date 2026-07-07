---
plan_id: PLAN-L7-268-github-ci-profile-table
title: "PLAN-L7-268 (refactor): GitHub CI profile table"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "GitHub CI policy lint 内の Source/Pack 分岐を profile 定義へ寄せる小リファクタ。doctor 本体や workflow の意味は変更しない。"
created: 2026-07-02
updated: 2026-07-02
owner: Codex
parent_design: docs/design/harness/L6-function-design/setup-solo-team.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - GitHub CI profile table"
generates:
  - artifact_path: docs/plans/PLAN-L7-268-github-ci-profile-table.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/github-ci-policy.ts
    artifact_type: source_module
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path src\\lint\\github-ci-policy.ts"
        output_digest: "sha256:bd556bbef60f16c30eea785823c176f54085b4ba2236576908978b137e0641ef"
  - artifact_path: tests/github-ci-policy.test.ts
    artifact_type: test_code
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path tests\\github-ci-policy.test.ts"
        output_digest: "sha256:0332877c3f8c18805f85ef421f33fd97fb6ff20ad3d60a6c690b8899b6df82fd"
dependencies:
  parent: docs/plans/PLAN-L7-267-pack-ci-test-boundary.md
  requires: []
  references:
    - src/lint/github-ci-policy.ts
    - tests/github-ci-policy.test.ts
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T17:35:00+09:00"
    tests_green_at: "2026-07-02T17:35:00+09:00"
    verdict: approve
    scope: "Source/Pack CI policy profile specs are table-driven; Pack forbids raw vitest and source full test regressions."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\github-ci-policy.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T17:24:52+09:00"
        evidence_path: tests/github-ci-policy.test.ts
        output_digest: "sha256:0332877c3f8c18805f85ef421f33fd97fb6ff20ad3d60a6c690b8899b6df82fd"
---

# PLAN-L7-268: GitHub CI profile table

## 背景

`github-ci-policy` は Source workflow と Pack workflow の境界を守る lint である。PLAN-L7-267 で Pack CI の raw `vitest run` 退行を禁止したが、required steps と forbidden checks が個別分岐として増えると、今後の境界変更時に source/pack の意味が読みづらくなる。

## 変更

- Source/Pack ごとの required steps と forbidden steps を `GITHUB_CI_PROFILE_SPECS` へ集約する。
- Pack workflow に source full `bun run test` が戻った場合も `forbidden_source_full_tests` で fail-close する。
- doctor 本体、workflow template、Pack-safe test script の実行意味は変更しない。

## 検証

- `bunx biome check --write src\\lint\\github-ci-policy.ts tests\\github-ci-policy.test.ts`
- `bun run typecheck`
- `bun run vitest run tests\\github-ci-policy.test.ts --reporter=dot`
- `bun run src\\cli.ts db rebuild --json`
- `bun run src\\cli.ts doctor`
- Pack checkout で `bun run test:pack`

## DoD

- [x] Source/Pack の CI profile 要件がテーブルから読める。
- [x] Pack CI に raw `vitest run` または source full `bun run test` が入る退行を検出する。
- [x] doctor 本体リファクタには踏み込まず、次スライスへ分離する。
