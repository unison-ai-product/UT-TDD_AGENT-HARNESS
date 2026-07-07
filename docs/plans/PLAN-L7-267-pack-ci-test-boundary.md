---
plan_id: PLAN-L7-267-pack-ci-test-boundary
title: "PLAN-L7-267 (refactor): Pack CI test boundary"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "Pack/source の検証境界を CI policy と配布文書へ固定する小変更。doctor 本体や Pack-safe test script の意味は変更しない。"
created: 2026-07-02
updated: 2026-07-02
owner: Codex
parent_design: docs/design/harness/L6-function-design/setup-solo-team.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - Pack CI test boundary"
generates:
  - artifact_path: docs/plans/PLAN-L7-267-pack-ci-test-boundary.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/github-ci-policy.ts
    artifact_type: source_module
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path src\\lint\\github-ci-policy.ts"
        output_digest: "sha256:2da1e187e8051a0641a27f7991964e158bdd6213585ccd1f7bde73c6eeb17320"
  - artifact_path: tests/github-ci-policy.test.ts
    artifact_type: test_code
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path tests\\github-ci-policy.test.ts"
        output_digest: "sha256:33f3eccc716f104d878776111cb7ac576a41c956d20ffabce89346b3d1d66b45"
  - artifact_path: README.md
    artifact_type: markdown_doc
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path README.md"
        output_digest: "sha256:7163cceae3b299f4f06459311f07a212a68b1850fb742cfbc29e4de9591af9dc"
  - artifact_path: .github/workflows/harness-check.yml
    artifact_type: github_config
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path .github\\workflows\\harness-check.yml"
        output_digest: "sha256:743fc592dcc853c0466651b726634b87e2ebe8200a6bd7eb69bbac6555e1e62e"
  - artifact_path: docs/templates/github/common/pack-harness-check.yml
    artifact_type: template
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path docs\\templates\\github\\common\\pack-harness-check.yml"
        output_digest: "sha256:3444a7aab24f61f284fd02fe1c9aa85c7e0900e5db2b60cb4ccc445a286cde68"
  - artifact_path: src/setup/distribution.ts
    artifact_type: source_module
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path src\\setup\\distribution.ts"
        output_digest: "sha256:f8a644fe2aebf0ddff61c91329bc53774bcf246301f49e91a7d18d23f54b6d02"
dependencies:
  parent: docs/plans/PLAN-L7-266-pack-source-only-test-guards.md
  requires: []
  references:
    - src/lint/github-ci-policy.ts
    - tests/github-ci-policy.test.ts
    - docs/templates/github/common/pack-harness-check.yml
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T17:18:00+09:00"
    tests_green_at: "2026-07-02T17:18:00+09:00"
    verdict: approve
    scope: "Pack CI must keep test:pack/setup-smoke and reject raw vitest run; doctor refactor is left as a separate slice."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\github-ci-policy.test.ts tests\\setup.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T17:17:03+09:00"
        evidence_path: tests/github-ci-policy.test.ts
        output_digest: "sha256:33f3eccc716f104d878776111cb7ac576a41c956d20ffabce89346b3d1d66b45"
---

# PLAN-L7-267: Pack CI test boundary

## 背景

clean Pack repo は `docs/plans`、`docs/design`、`docs/test-design`、`.ut-tdd` runtime state、harness DB を含まない。Pack の正式 gate は `test:pack` と `doctor --setup-smoke` であり、source repo の raw `vitest run` / full `bun run test` は source-only governance docs を前提にする。

PLAN-L7-266 で direct test の source-only ケースは guard 済みだが、CI テンプレートが raw `vitest run` に戻ると Pack で同じ境界違反が再発する。

## 変更

- Pack workflow policy lint に `forbidden_raw_vitest` を追加し、Pack CI の raw `vitest run` を fail-close する。
- README と Pack workflow template に、Pack は `test:pack` / `doctor --setup-smoke`、source は full regression という境界を明記する。
- source workflow コメントにも Pack workflow との非対称を明記する。

## 検証

- `bunx biome check --write src\\lint\\github-ci-policy.ts tests\\github-ci-policy.test.ts`
- `bun run typecheck`
- `bun run vitest run tests\\github-ci-policy.test.ts --reporter=dot`
- `bun run src\\cli.ts db rebuild --json`
- `bun run src\\cli.ts doctor`
- Pack checkout で `bun run test:pack`

## DoD

- [x] Pack CI に raw `vitest run` が入る退行を lint が検出する。
- [x] Pack/source の test 境界が README と CI template から読める。
- [x] doctor 本体の責務分離は次の独立リファクタとして温存し、今回の変更で過剰に触らない。
