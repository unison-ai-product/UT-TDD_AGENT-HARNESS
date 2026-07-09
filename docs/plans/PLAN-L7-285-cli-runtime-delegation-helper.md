---
plan_id: PLAN-L7-285-cli-runtime-delegation-helper
title: "PLAN-L7-285 (refactor): CLI runtime command delegation helper reuse"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "codex/claude runtime command の実行処理を既存 helper に寄せる責務分離であり、公開 command contract と provider adapter policy を変えないため design back-fill は不要。"
created: 2026-07-03
updated: 2026-07-03
owner: Codex
parent_design: docs/plans/PLAN-L7-284-cli-delegation-execution-extraction.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - CLI runtime delegation helper reuse"
generates:
  - artifact_path: docs/plans/PLAN-L7-285-cli-runtime-delegation-helper.md
    artifact_type: markdown_doc
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
  - artifact_path: tests/cli-delegation.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-284-cli-delegation-execution-extraction.md
  requires: []
  references:
    - src/cli.ts
    - src/cli/delegation.ts
    - tests/cli-surface.test.ts
    - tests/cli-delegation.test.ts
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-03T11:30:00+09:00"
    tests_green_at: "2026-07-03T11:30:00+09:00"
    verdict: approve
    scope: "codex/claude runtime command の execute path を executeAdapterPlanForCli に寄せ、session hook / review guard / provider spawn の重複を src/cli.ts から削除する。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T11:30:00+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:b160a56a9a493715fc236e2bd105d6328726b3ee400b10d9f15ca5d7343ed8ea"
        anchor_commit: ab933040dae5c998aee805f5269d683f594991ab
      - kind: unit_test
        command: "bun run vitest run tests\\cli-surface.test.ts tests\\cli-delegation.test.ts -t \"executes codex adapter|model/effort|delegation\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T11:30:00+09:00"
        evidence_path: tests/cli-delegation.test.ts
        output_digest: "sha256:6de0218d63f798de13c57e3a04c13e910278bc525982176160ceb75d082a8653"
        anchor_commit: ab933040dae5c998aee805f5269d683f594991ab
---

# PLAN-L7-285: CLI runtime command delegation helper reuse

## 背景

PLAN-L7-284 で advisor execute path は `src/cli/delegation.ts` へ抽出したが、`codex` / `claude`
runtime command の execute path には同じ provider spawn / session hook / review guard が残っていた。

## 変更

- `runtimeCommand(provider)` の execute path を `executeAdapterPlanForCli` に寄せる。
- `src/cli.ts` から `safeLoadChangedFiles`、provider spawn、review-guard 実行の重複を削除する。
- `src/cli/delegation.ts` の契約は変更せず、既存 CLI surface tests で JSON contract と model/effort injection を固定する。

## 検証

- `bun run typecheck`
- `bun run vitest run tests\\cli-surface.test.ts tests\\cli-delegation.test.ts -t "executes codex adapter|model/effort|delegation" --reporter=dot`
- `bun run src\\cli.ts doctor`

## DoD

- [x] `codex --execute --json` の `dry_run:false` / `exit_code` contract が維持される。
- [x] per-call `--model` / `--effort` 注入が維持される。
- [x] provider spawn / session hook / review guard の重複が `src/cli.ts` から減る。
