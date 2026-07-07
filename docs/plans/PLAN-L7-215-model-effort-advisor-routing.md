---
plan_id: PLAN-L7-215-model-effort-advisor-routing
title: "PLAN-L7-215 (impl): model/effort routing defaults and upper-model advisor command"
kind: impl
layer: L7
drive: agent
status: confirmed
created: 2026-07-01
updated: 2026-07-02
owner: Codex
route_signal: feature_addition
route_mode: add-feature
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "Codex - model/effort routing and advisor CLI implementation"
  - role: qa
    slot_label: "Codex intra-runtime review - adapter surface and CLI regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-215-model-effort-advisor-routing.md
    artifact_type: markdown_doc
  - artifact_path: AGENTS.md
    artifact_type: markdown_doc
  - artifact_path: CLAUDE.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/schema/team.ts
    artifact_type: source_module
  - artifact_path: src/team/advisor-policy.ts
    artifact_type: source_module
  - artifact_path: src/team/launch-policy.ts
    artifact_type: source_module
  - artifact_path: src/team/model-policy.ts
    artifact_type: source_module
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
  - artifact_path: tests/team-launch-policy.test.ts
    artifact_type: test_code
  - artifact_path: tests/team-model-policy.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-75-cost-tiered-provider-router.md
    - docs/plans/PLAN-L7-195-model-override-injection-hardening.md
  references:
    - docs/design/harness/L6-function-design/function-spec.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-01T17:07:00+09:00"
    tests_green_at: "2026-07-01T17:06:00+09:00"
    verdict: approve
    scope: "Model/effort defaults and advisor command: task intent routing, xhigh/high effort policy, upper-model advisor dry-run/execute CLI, and Pack rule documentation."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T17:02:00+09:00"
        evidence_path: src/team/advisor-policy.ts
        output_digest: "sha256:6fdae49f1f46109de6ac8415f93e011f7f64f329218eb2c07767de6f99b99d8b"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T17:00:00+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:4e1c724cd4cd04d3f9ad5efacfe4b7f12ad8a480448127d5ed9b2e7e0e5ddfc2"
      - kind: unit_test
        command: "bun run vitest run tests\\team-model-policy.test.ts tests\\team-launch-policy.test.ts tests\\team-run.test.ts tests\\team-schema.test.ts tests\\runtime-adapter.test.ts tests\\model-id-ssot.test.ts tests\\cli-surface.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T17:01:00+09:00"
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:c6aa218270dcf1a164768508e4bce5818cef05b59fa102a3846a08492e83de55"
      - kind: unit_test
        command: "bun run vitest run tests\\team-model-policy.test.ts tests\\team-launch-policy.test.ts tests\\team-run.test.ts tests\\team-schema.test.ts tests\\runtime-adapter.test.ts tests\\model-id-ssot.test.ts tests\\cli-surface.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T17:01:00+09:00"
        evidence_path: tests/team-model-policy.test.ts
        output_digest: "sha256:71ad4b26d6540a5bf0a0213d01655dd71ef4352b4ba4c9e6dd5da28b50ad2a6d"
      - kind: unit_test
        command: "bun run vitest run tests\\team-model-policy.test.ts tests\\team-launch-policy.test.ts tests\\team-run.test.ts tests\\team-schema.test.ts tests\\runtime-adapter.test.ts tests\\model-id-ssot.test.ts tests\\cli-surface.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T17:01:00+09:00"
        evidence_path: tests/team-launch-policy.test.ts
        output_digest: "sha256:e8d3aa782e4e31e9cbd5e2c9f9552a4b732c286f7f6618291304f28578dd3351"
---

# PLAN-L7-215 model / effort / advisor routing

## 2026-07-02 Provider boundary addendum

Pack review の P1/P2 指摘を受け、team schema / model policy が扱う UT-TDD 内部 effort 値と provider CLI が受け取る値を分離する。

- UT-TDD schema は `low` / `medium` / `middle` / `high` / `xhigh` を受け付ける。
- Claude provider 実行境界では `middle` を `medium`、`xhigh` を `high` に正規化し、`--effort` と `CLAUDE_CODE_EFFORT_LEVEL` へ provider-safe な値だけを渡す。
- Codex provider では reasoning effort は launch/evidence metadata として保持し、provider CLI の未確定 effort flag へ raw に転送しない。
- README の provider 起動例は実装契約に合わせ、Codex は `codex exec -`、Claude は `claude --print --input-format text`、タスク本文は stdin と明記する。

## 1. Scope

- docs / research / implementation / lightweight / review / UI/UX の task intent を `selectTeamModel` に追加する。
- Claude 系 effort は `high`、GPT/Codex 系 effort は `middle` を標準にし、軽量 lane は `high`、UI/UX は `xhigh`、高度な review は `high` / `xhigh` へ上げる。
- Sonnet-class Claude または下位 GPT/Codex orchestrator が判断に迷う場合に、Claude Opus または GPT frontier へ相談する `ut-tdd advisor` command を追加する。
- AGENTS / CLAUDE / L6 function spec に Pack 運用ルールとして反映する。

## 2. Acceptance Criteria

- `ut-tdd advisor --json` が upper-model adapter plan を dry-run 出力できる。
- `ut-tdd advisor --execute --json` が既存 adapter と同じ session logging 経路で fake provider を起動できる。
- team model policy は intent と effort 既定を deterministic に返す。
- typecheck / lint / targeted Vitest / DB rebuild が green。

## 3. Evidence

- `bun run typecheck` -> pass。
- `bun run lint` -> pass。
- `bun run vitest run tests\team-model-policy.test.ts tests\team-launch-policy.test.ts tests\team-run.test.ts tests\team-schema.test.ts tests\runtime-adapter.test.ts tests\model-id-ssot.test.ts tests\cli-surface.test.ts --reporter=dot` -> 7 files / 89 tests passed。
- `bun src\cli.ts db rebuild --json` -> `ok=true`。
