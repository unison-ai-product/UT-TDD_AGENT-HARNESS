---
plan_id: PLAN-L7-157-distribution-clean-pull
title: "PLAN-L7-157 (impl): clean distribution pull channel, setup adapter projection, and install smoke"
kind: impl
layer: L7
drive: be
status: confirmed
created: 2026-06-25
updated: 2026-07-01
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
  - artifact_path: scripts/ut-tdd.ps1
    artifact_type: script
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
    reviewed_at: "2026-07-01T16:17:00+09:00"
    tests_green_at: "2026-07-01T16:16:00+09:00"
    verdict: approve
    scope: "Local release artifact proof now creates a clean tarball, sha256 checksum, and manifest without publishing or signing. Signature and publication remain explicit external approval boundaries."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\cli-surface.test.ts -t \"distribution\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T22:01:00+09:00"
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:c6aa218270dcf1a164768508e4bce5818cef05b59fa102a3846a08492e83de55"
      - kind: smoke
        command: "bun src\\cli.ts distribution package --tag v0.1.0 --out <temp> --json"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:4e1c724cd4cd04d3f9ad5efacfe4b7f12ad8a480448127d5ed9b2e7e0e5ddfc2"
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-01T16:17:00+09:00"
    tests_green_at: "2026-07-01T16:16:00+09:00"
    verdict: approve
    scope: "Consumer PATH readiness now distinguishes link registration from executable substance: default shell reports detected candidate paths, and a hook-equivalent PATH including Bun global bin plus the real Bun binary directory makes `ut-tdd --help` and `distribution plan` pass."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\setup.test.ts tests\\cli-surface.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: tests/setup.test.ts
        output_digest: "sha256:f3c25639d59c2daf4a646c0e46130e62f21877d2ff9e73146e2911c29ba93c2c"
      - kind: smoke
        command: "$env:PATH=\"$env:USERPROFILE\\.bun\\bin;$env:APPDATA\\npm\\node_modules\\bun\\bin;$env:PATH\"; ut-tdd --help"
        runner: powershell
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: README.md
        output_digest: "sha256:5357012ca5750d5e1a9784ce5d7e80eca2b3231ce1c00a019b02ef8a95782f58"
      - kind: smoke
        command: "$env:PATH=\"$env:USERPROFILE\\.bun\\bin;$env:APPDATA\\npm\\node_modules\\bun\\bin;$env:PATH\"; bun src\\cli.ts distribution plan --json"
        runner: powershell
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:4e1c724cd4cd04d3f9ad5efacfe4b7f12ad8a480448127d5ed9b2e7e0e5ddfc2"
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-01T16:17:00+09:00"
    tests_green_at: "2026-07-01T16:16:00+09:00"
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
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: tests/setup.test.ts
        output_digest: "sha256:f3c25639d59c2daf4a646c0e46130e62f21877d2ff9e73146e2911c29ba93c2c"
      - kind: unit_test
        command: "bun run vitest run tests\\setup.test.ts tests\\cli-surface.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T22:01:00+09:00"
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:c6aa218270dcf1a164768508e4bce5818cef05b59fa102a3846a08492e83de55"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/setup/index.ts
        output_digest: "sha256:8dfc65759231dd77aae3f6acf0e89e28c9148ebfca783032b6b942bb7ee79670"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:4e1c724cd4cd04d3f9ad5efacfe4b7f12ad8a480448127d5ed9b2e7e0e5ddfc2"
      - kind: smoke
        command: "bun src\\cli.ts distribution plan --tag v0.1.0 --json"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/setup/index.ts
        output_digest: "sha256:8dfc65759231dd77aae3f6acf0e89e28c9148ebfca783032b6b942bb7ee79670"
      - kind: smoke
        command: "bun run vitest run tests/cli-surface.test.ts tests/distribution-acceptance.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: tests/distribution-acceptance.test.ts
        output_digest: "sha256:367d0423e4b538c570dddf174113c689360a56dd303a354b6a5e1883036dc6ec"
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-01T16:17:00+09:00"
    tests_green_at: "2026-07-01T16:16:00+09:00"
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
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: tests/setup.test.ts
        output_digest: "sha256:f3c25639d59c2daf4a646c0e46130e62f21877d2ff9e73146e2911c29ba93c2c"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/setup/index.ts
        output_digest: "sha256:8dfc65759231dd77aae3f6acf0e89e28c9148ebfca783032b6b942bb7ee79670"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:4e1c724cd4cd04d3f9ad5efacfe4b7f12ad8a480448127d5ed9b2e7e0e5ddfc2"
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-01T16:17:00+09:00"
    tests_green_at: "2026-07-01T16:16:00+09:00"
    verdict: approve
    scope: "Consumer readiness warning now records observed bare ut-tdd failure; Windows wrapper metadata is included in the distribution plan without claiming public release readiness."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\setup.test.ts tests\\cli-surface.test.ts tests\\distribution-acceptance.test.ts tests\\runtime-portability.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T20:11:21+09:00"
        evidence_path: tests/runtime-portability.test.ts
        output_digest: "sha256:5792d29d443c60c5eb2fe686ed411d3c988bcda25e7d898cf93a0a065b70c632"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/setup/index.ts
        output_digest: "sha256:8dfc65759231dd77aae3f6acf0e89e28c9148ebfca783032b6b942bb7ee79670"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:4e1c724cd4cd04d3f9ad5efacfe4b7f12ad8a480448127d5ed9b2e7e0e5ddfc2"
---

# PLAN-L7-157: clean distribution pull channel

## 2026-07-01 Pack repo 既定値の是正

配布先の正本は `unison-ai-product/UT-TDD_AGENT-HARNESS-Pack` である。`distribution plan`、`distribution package`、`buildCleanDistributionPlan`、consumer `tagPin` の既定値はこの Pack repo を指す。旧 `UNISON-TECHNOLOGY/ut-tdd-agent-harness-clean` は現在の配布先ではないため、CLI default と readiness contract から除去する。

明示 `--clean-repo` は検証用 override として残すが、通常の Pack publish/export は Pack repo へ向ける。これにより AGENTS/CLAUDE に書いた GitHub 送り先、実際に公開した Pack repo、local distribution plan の3つを一致させる。

## 2026-07-01 Pack sync plan

`distribution sync-plan --json` は、source repo の更新を clean artifact set に投影し、Pack repo へ反映するための非破壊計画を出す。入力は `buildCleanDistributionPlan` の artifact set であり、`docs/plans`、`docs/design/harness`、`docs/test-design`、`.ut-tdd`、runtime DB、UI は copy plan へ入らない。`docs/skills/*` は Pack repo では root `skills/*` に写像する。

この command は Pack repo の staging clone path、target branch、`sourcePath -> artifactPath` copy plan、`git status`/commit/tag/push の手順を emit するだけで、clone/copy/commit/push/release は実行しない。`distribution sync-stage --json` は同じ clean artifact set をローカル staging directory へ materialize し、Pack に入らない既存ファイルを `unmanagedExistingPaths` として検出する。

`distribution sync-pack --repo-dir <Pack checkout>` は既存の Pack checkout を clean artifact set へ同期する運用コマンドである。既定では配布対象外の既存ファイルを検出した時点で fail-close し、`--prune-local` が明示された場合だけ Pack checkout 内の余剰ファイルをローカル削除する。いずれの場合も `git add` / commit / push は実行せず、次に実行すべき git command を evidence として返す。remote mutation、署名 tarball、GitHub release publication は PO 承認後の外部操作として `release-plan` に分離する。

## 0. 背景

配布物は harness 自己開発の監査資料や dogfood 専用状態を混ぜず、consumer repository が GitHub から取得してすぐに setup できる clean channel を持つ必要がある。

## 1. 範囲

clean export、pull channel、portability smoke、rollback/update、tag-pin contract、CI self-sufficiency、cross-OS/monorepo の検証を扱う。外部公開 repo 作成、tag push、署名 tarball publish は外部操作なので local close とは分離する。

## 2. 受け入れ条件

- adapter templates、Claude/Codex hook、subagent、command、setup scripts が clean allowlist に入る。
- dogfood 監査 doc は配布面から除外される。
- consumer repo で bare `ut-tdd` hook が解決できる導線を持つ。
- rollback/update と tag-pin contract が document と test で追跡される。
