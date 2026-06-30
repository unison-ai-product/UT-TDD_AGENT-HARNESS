---
plan_id: PLAN-L7-157-distribution-clean-pull
title: "PLAN-L7-157 (impl): clean distribution pull channel, setup adapter projection, and install smoke"
kind: impl
layer: L7
drive: be
status: confirmed
created: 2026-06-25
updated: 2026-06-29
owner: Codex / PO
parent_design: docs/design/harness/L1-requirements/technical-requirements.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
agent_slots:
  - role: se
    slot_label: "SE - curated export, setup adapter, install smoke implementation"
  - role: tl
    slot_label: "TL - clean-pull review and distribution boundary checks"
  - role: qa
    slot_label: "QA - portability smoke and clean install verification"
generates:
  - artifact_path: docs/plans/PLAN-L7-157-distribution-clean-pull.md
    artifact_type: markdown_doc
  - artifact_path: src/setup/index.ts
    artifact_type: source_module
  - artifact_path: src/setup/templates.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/runtime/agent-guard.ts
    artifact_type: source_module
  - artifact_path: src/runtime/agent-guard-policy.ts
    artifact_type: source_module
  - artifact_path: tests/setup.test.ts
    artifact_type: test_code
  - artifact_path: tests/agent-guard.test.ts
    artifact_type: test_code
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
  - artifact_path: tests/distribution-acceptance.test.ts
    artifact_type: test_code
  - artifact_path: docs/templates/adapter/AGENTS.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/CLAUDE.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/CLAUDE.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/settings.json
    artifact_type: template
  - artifact_path: docs/templates/adapter/.codex/config.toml
    artifact_type: template
  - artifact_path: docs/templates/adapter/.codex/hooks.json
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/agents/ut-tdd-tl.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/commands/ut-tdd-status.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/commands/ut-tdd-test.md
    artifact_type: template
  - artifact_path: LICENSE
    artifact_type: doc_update
  - artifact_path: README.md
    artifact_type: doc_update
  - artifact_path: package.json
    artifact_type: config
  - artifact_path: docs/design/harness/L6-function-design/setup-solo-team.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/test-design/harness/L3-acceptance-test-design.md
    artifact_type: test_design
  - artifact_path: docs/governance/repository-structure.md
    artifact_type: doc_update
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-03-setup-solo-team.md
  references:
    - docs/adr/ADR-005-distribution-model-and-central-ui.md
    - docs/plans/PLAN-L7-141-web-dashboard-component-derived.md
    - docs/plans/PLAN-L7-146-serverless-readonly-share.md
    - docs/plans/PLAN-DISCOVERY-01-workflow-metamodel.md
    - docs/plans/PLAN-L6-06-handover-mechanism.md
    - docs/plans/PLAN-L7-04-handover-mechanism.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-29T21:29:59+09:00"
    tests_green_at: "2026-06-29T21:29:59+09:00"
    verdict: approve
    scope: "Close PLAN-L7-157 by adding clean distribution planning, adapter projection, preflight/readiness, rollback, tag-pin contract, CI self-sufficiency, monorepo smoke metadata, and MIT license."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/cli-surface.test.ts tests/distribution-acceptance.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-26T18:37:05+09:00"
        evidence_path: tests/setup.test.ts
        output_digest: "sha256:b2ecea5711e42b44c51983476b5c2850b9f33f6605b2005444d07cc50e174ecb"
      - kind: unit_test
        command: "bun run vitest run tests\\setup.test.ts tests\\cli-surface.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T21:29:59+09:00"
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:7f68676ecfea392d01cd777c7a65a91f256241691bd31734b987150ac5f0f830"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-26T18:35:12+09:00"
        evidence_path: src/setup/index.ts
        output_digest: "sha256:3f596607761cd1ad596b671903f7355626cf8a9eb7a1fc60af933c59d2f8c1e7"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-26T18:37:05+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:350ada3bdc25f12571f5e4c4e9aa77eb7ab2b869fdb83f0a337a59b67da6cc0e"
      - kind: smoke
        command: "bun src\\cli.ts distribution plan --tag v0.1.0 --json"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-26T18:38:19+09:00"
        evidence_path: src/setup/index.ts
        output_digest: "sha256:3f596607761cd1ad596b671903f7355626cf8a9eb7a1fc60af933c59d2f8c1e7"
      - kind: smoke
        command: "bun run vitest run tests/cli-surface.test.ts tests/distribution-acceptance.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T21:29:59+09:00"
        evidence_path: tests/distribution-acceptance.test.ts
        output_digest: "sha256:fa7098deb1259afb33be1a06c1a58251af1ddc554f1cf295b7547fa18b005117"
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-29T19:34:00+09:00"
    tests_green_at: "2026-06-29T19:34:00+09:00"
    verdict: approve
    scope: "Hardens consumer readiness so generated Claude/Codex hooks that invoke bare ut-tdd fail-close unless the ut-tdd CLI is spawnable on PATH."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\setup.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T19:33:44+09:00"
        evidence_path: tests/setup.test.ts
        output_digest: "sha256:b2ecea5711e42b44c51983476b5c2850b9f33f6605b2005444d07cc50e174ecb"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-29T19:33:55+09:00"
        evidence_path: src/setup/index.ts
        output_digest: "sha256:3f596607761cd1ad596b671903f7355626cf8a9eb7a1fc60af933c59d2f8c1e7"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-29T19:33:47+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:350ada3bdc25f12571f5e4c4e9aa77eb7ab2b869fdb83f0a337a59b67da6cc0e"
---

# PLAN-L7-157: clean distribution pull channel

## 0. 背景

配布物は harness 自己開発の監査資料や dogfood 専用状態を混ぜず、consumer repository が GitHub から取得してすぐに setup できる clean channel を持つ必要がある。

## 1. 範囲

clean export、pull channel、portability smoke、rollback/update、tag-pin contract、CI self-sufficiency、cross-OS/monorepo の検証を扱う。外部公開 repo 作成、tag push、署名 tarball publish は外部操作なので local close とは分離する。

## 2. 受け入れ条件

- adapter templates、Claude/Codex hook、subagent、command、setup scripts が clean allowlist に入る。
- dogfood 監査 doc は配布面から除外される。
- consumer repo で bare `ut-tdd` hook が解決できる導線を持つ。
- rollback/update と tag-pin contract が document と test で追跡される。
