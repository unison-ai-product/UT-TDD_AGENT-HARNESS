---
plan_id: PLAN-L7-213-project-local-setup-wrapper
title: "PLAN-L7-213 (impl): 1台PC複数プロジェクト向け project-local setup wrapper"
kind: impl
layer: L7
drive: be
status: confirmed
created: 2026-07-01
updated: 2026-07-01
owner: Codex / PO
route_signal: feature_addition
route_mode: add-feature
parent_design: docs/design/harness/L6-function-design/setup-solo-team.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "SE - project-local setup wrapper"
  - role: qa
    slot_label: "QA - setup/distribution regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-213-project-local-setup-wrapper.md
    artifact_type: markdown_doc
  - artifact_path: README.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/setup-solo-team.md
    artifact_type: design_doc
  - artifact_path: docs/templates/adapter/.codex/hooks.json
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/settings.json
    artifact_type: template
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/setup/index.ts
    artifact_type: source_module
  - artifact_path: src/setup/templates.ts
    artifact_type: source_module
  - artifact_path: tests/setup.test.ts
    artifact_type: test_code
  - artifact_path: tests/distribution-acceptance.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-157-distribution-clean-pull.md
    - docs/plans/PLAN-L7-190-distribution-runtime-asset-projection.md
    - docs/plans/PLAN-L7-212-route-certificate-governance.md
review_evidence:
  - reviewer: codex-cli
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-01T10:16:00+09:00"
    tests_green_at: "2026-07-01T10:15:00+09:00"
    verdict: approve
    scope: "Setup now projects a repo-local .ut-tdd/bin/ut-tdd.mjs wrapper and generated Claude/Codex hooks invoke it through Bun, so multiple projects on one PC can pin independent UT-TDD versions without relying on a global bun link. Distribution acceptance and setup regressions are green."
    worker_model: codex-gpt-5
    reviewer_model: codex-gpt-5
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\setup.test.ts tests\\distribution-acceptance.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T10:15:00+09:00"
        evidence_path: tests/setup.test.ts
        output_digest: "sha256:41c2098f7f6dca491468ae7e956ec2a9186f0f48135314b78f7dfbb2c10ff897"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T10:15:00+09:00"
        evidence_path: src/setup/index.ts
        output_digest: "sha256:691fbd6492bb8a991e5acb66c022e542a0f8b5829e38f1f57326a660457d31da"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T10:15:00+09:00"
        evidence_path: src/setup/templates.ts
        output_digest: "sha256:919168e66fe75578fa18b15e5786a49ae9ee21b35fa0f0fb232e1e9e6f2737a6"
---

# PLAN-L7-213: project-local setup wrapper

## 目的

1台のPCに複数の consumer project が同居する前提では、global `bun link` / global `ut-tdd` を hook 実行の正本にすると、project ごとの version pin と衝突する。setup は各 project に repo-local wrapper を投影し、Claude/Codex hook はその wrapper 経由で project-local `node_modules/.bin/ut-tdd` を優先して起動する必要がある。

## 変更

- setup template に `.ut-tdd/bin/ut-tdd.mjs` を追加する。
- Claude/Codex adapter hook template は `bun .ut-tdd/bin/ut-tdd.mjs ...` を呼ぶ。
- `buildConsumerReadinessPlan` と `distribution plan` は project-local wrapper / package bin を主経路として扱う。
- README と L6 setup design に multi-project / one-PC 前提を追記する。

## 受入

- setup preview に `.ut-tdd/bin/ut-tdd.mjs` が含まれる。
- generated Claude/Codex hooks は bare `ut-tdd ...` ではなく project-local wrapper を呼ぶ。
- clean distribution acceptance smoke が updated adapter hook template を検証する。
- rollback managed paths に `.ut-tdd/bin/ut-tdd.mjs` が含まれる。
