---
plan_id: PLAN-L7-213-project-local-setup-wrapper
title: "PLAN-L7-213 (impl): 1台PC複数プロジェクト向け project-local setup wrapper"
kind: impl
layer: L7
drive: be
status: confirmed
created: 2026-07-01
updated: 2026-07-02
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
  - artifact_path: docs/design/harness/L6-function-design/skill-index.md
    artifact_type: design_doc
  - artifact_path: docs/templates/adapter/.codex/hooks.json
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/settings.json
    artifact_type: template
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: src/setup/index.ts
    artifact_type: source_module
  - artifact_path: src/assets/catalog.ts
    artifact_type: source_module
  - artifact_path: src/lint/asset-drift.ts
    artifact_type: source_module
  - artifact_path: src/lint/branch-kind.ts
    artifact_type: source_module
  - artifact_path: src/lint/skill-assignment.ts
    artifact_type: source_module
  - artifact_path: src/lint/review-evidence.ts
    artifact_type: source_module
  - artifact_path: src/setup/templates.ts
    artifact_type: source_module
  - artifact_path: src/skill-engine/scaffold.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: .gitignore
    artifact_type: config
  - artifact_path: tests/asset-catalog.test.ts
    artifact_type: test_code
  - artifact_path: tests/branch-kind.test.ts
    artifact_type: test_code
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
  - artifact_path: tests/review-evidence.test.ts
    artifact_type: test_code
  - artifact_path: tests/setup.test.ts
    artifact_type: test_code
  - artifact_path: tests/distribution-acceptance.test.ts
    artifact_type: test_code
  - artifact_path: tests/skill-assignment.test.ts
    artifact_type: test_code
  - artifact_path: tests/skill-scaffold.test.ts
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
    reviewed_at: "2026-07-01T16:17:00+09:00"
    tests_green_at: "2026-07-01T16:16:00+09:00"
    verdict: approve
    scope: "setup は repo-local .ut-tdd/bin/ut-tdd.mjs wrapper を投影し、generated Claude/Codex hook は Bun 経由でこれを呼ぶ。1台PC上の複数 project は global bun link に依存せず独立 version を pin できる。wrapper は consumer node_modules、setup 元 harness checkout、bare ut-tdd の順で解決する。distribution acceptance、setup regression、tarball→consumer actual setup smoke は green。"
    worker_model: codex-gpt-5
    reviewer_model: codex-gpt-5
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\setup.test.ts tests\\distribution-acceptance.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: tests/setup.test.ts
        output_digest: "sha256:f2a4f438552f76da5592e2002a92e5a64b28dc82fe643c08e7c182f61944569f"
        anchor_commit: d9c34cb768968e42af0d952186f74c72c3ba1d73
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/setup/index.ts
        output_digest: "sha256:8dfc65759231dd77aae3f6acf0e89e28c9148ebfca783032b6b942bb7ee79670"
        anchor_commit: 5b819e80d5e1f34136847bebbb836477d8c5a6a4
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/setup/templates.ts
        output_digest: "sha256:be6c00ee9b0794f02d95717d3bbebe4f869fb1c5c457417cd566cc462aa57e28"
        anchor_commit: ed2843cc723e261105daa0215758b3aa0a307be2
  - reviewer: codex-cli
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-01T16:17:00+09:00"
    tests_green_at: "2026-07-01T16:16:00+09:00"
    verdict: approve
    scope: "setup template mapping now resolves every COMMON_FILES entry, so .codex/hooks.json and other adapter assets cannot silently render as empty common/* fallbacks. doctor --setup-smoke is a fresh-consumer profile that requires project-local wrapper files, parseable Claude/Codex hook JSON, Claude and Codex agent/work/session hook commands, Claude SubagentStop, and portable .ut-tdd/bin/ut-tdd.mjs hook paths. distribution acceptance executes setup --solo from the clean artifact, calls the generated wrapper, and runs doctor --setup-smoke."
    worker_model: codex-gpt-5
    reviewer_model: codex-gpt-5
    green_commands:
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T11:59:00+09:00"
        evidence_path: src/doctor/index.ts
        output_digest: "sha256:e0d5812770ccc3042a6c484f68dda86f62c63eae3801ff156660065730df97ea"
        anchor_commit: df6a1383f9c59c4b500f8edf1cf45b7e5abedec3
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:4e1c724cd4cd04d3f9ad5efacfe4b7f12ad8a480448127d5ed9b2e7e0e5ddfc2"
        anchor_commit: 5b819e80d5e1f34136847bebbb836477d8c5a6a4
      - kind: unit_test
        command: "bun run vitest run tests\\doctor.test.ts --testNamePattern \"fresh-consumer setup smoke\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T12:08:00+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:282deaee2fd3064d743310e503fefbf08c2749d6cd9be8ebc815deed99e3fd31"
        anchor_commit: df6a1383f9c59c4b500f8edf1cf45b7e5abedec3
      - kind: unit_test
        command: "bun run vitest run tests\\setup.test.ts tests\\distribution-acceptance.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: tests/distribution-acceptance.test.ts
        output_digest: "sha256:367d0423e4b538c570dddf174113c689360a56dd303a354b6a5e1883036dc6ec"
        anchor_commit: 5b819e80d5e1f34136847bebbb836477d8c5a6a4
      - kind: smoke
        command: "bun src\\cli.ts distribution package --out .ut-tdd\\dist-local --json; tarball展開先から consumer setup --solo; bun .ut-tdd\\bin\\ut-tdd.mjs --help; bun .ut-tdd\\bin\\ut-tdd.mjs status --json"
        runner: powershell
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/setup/templates.ts
        output_digest: "sha256:be6c00ee9b0794f02d95717d3bbebe4f869fb1c5c457417cd566cc462aa57e28"
        anchor_commit: ed2843cc723e261105daa0215758b3aa0a307be2
---

# PLAN-L7-213: project-local setup wrapper

## 2026-07-02 Pack review remediation addendum

`UT-TDD_AGENT-HARNESS-Pack_フルレビュー_決定版_v2.md` の配布前 P0/P1 指摘を受け、project-local wrapper と Pack 検証導線の契約を次の通り補強する。

- generated wrapper は consumer `node_modules/.bin/ut-tdd` を setup 元 checkout より優先する。両方が存在する fixture で local bin が選ばれ、local bin が無い fixture では setup 元 `src/cli.ts` を `bun` 経由で実行できることを `tests/setup.test.ts` で固定する。
- setup が生成する `.claude/agents/*.md` は `SUBAGENT_ALLOWLIST` と一致させる。`.claude/agents` の定義が allowlist 外なら `asset-drift` / roster check が fail-close する。agent-memory は定義ではないため allowlist 整合の対象外だが、legacy residue 検査対象には残す。
- Pack workflow template は hand-written Vitest list ではなく `bun run test:pack` を呼び、clean Pack `package.json` の `test` / `test:pack` と一致させる。
- README の検証節は Pack / consumer checkout で緑にすべき既定検証と、source development repo 専用の広い検証を分割して記述する。

## 目的

1台のPCに複数の consumer project が同居する前提では、global `bun link` / global `ut-tdd` を hook 実行の正本にすると、project ごとの version pin と衝突する。setup は各 project に repo-local wrapper を投影し、Claude/Codex hook はその wrapper 経由で project-local `node_modules/.bin/ut-tdd` を優先して起動する必要がある。

consumer がまだ package dependency を持たず、clone した harness checkout から setup しただけの状態でも hook が自走できるよう、wrapper は setup 元 harness checkout の `src/cli.ts` も fallback として保持する。

## 変更

- setup template に `.ut-tdd/bin/ut-tdd.mjs` を追加する。
- Claude/Codex adapter hook template は `bun .ut-tdd/bin/ut-tdd.mjs ...` を呼ぶ。
- wrapper は consumer `node_modules/.bin/ut-tdd`、setup 元 harness checkout の `src/cli.ts`、bare `ut-tdd` の順で解決する。
- `buildConsumerReadinessPlan` と `distribution plan` は project-local wrapper / package bin / setup 元 source entrypoint を主経路として扱う。
- README と L6 setup design に multi-project / one-PC 前提を追記する。

## 受入

- setup preview に `.ut-tdd/bin/ut-tdd.mjs` が含まれる。
- generated Claude/Codex hooks は bare `ut-tdd ...` ではなく project-local wrapper を呼ぶ。
- clean distribution acceptance smoke が updated adapter hook template を検証する。
- tarball から展開した harness checkout が consumer repo に actual setup でき、生成 wrapper から `--help` と `status --json` が動く。
- rollback managed paths に `.ut-tdd/bin/ut-tdd.mjs` が含まれる。
