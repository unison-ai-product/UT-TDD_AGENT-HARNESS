---
plan_id: PLAN-L7-352-guard-help-exit-code-contract
title: "PLAN-L7-352 (refactor): guard help exit code contract"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "既存 guard 実装の exit code 2 (=blocked) 契約を help に明記する非破壊 CLI 契約改善であり、上位要求や実行判定ロジックの変更は伴わない。"
created: 2026-07-03
updated: 2026-07-03
owner: Codex
parent_design: docs/plans/PLAN-L7-331-cli-contract-polish.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - guard help exit code contract"
  - role: qa
    slot_label: "Explorer - handover exit code deferral review"
  - role: qa
    slot_label: "Explorer - guard help scope review"
generates:
  - artifact_path: docs/plans/PLAN-L7-352-guard-help-exit-code-contract.md
    artifact_type: markdown_doc
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-331-cli-contract-polish.md
  requires: []
  references:
    - docs/plans/PLAN-L7-331-cli-contract-polish.md
    - docs/governance/harness-v2-quality-uplift-strategy.md
    - .ut-tdd/audit/A-182-implementation-design-quality-audit-2026-07-03.md
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-03T16:04:00+09:00"
    tests_green_at: "2026-07-03T16:03:00+09:00"
    verdict: approve
    scope: "guard help の exit code 2 契約明記。対象は ut-tdd hook agent-guard / hook work-guard / guard preflight。handover exit code は runHandover に ok 契約がないため deferred。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\cli-surface.test.ts -t \"guard blocked exit code\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T16:01:00+09:00"
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:e83f87b1968ee5100f5799a84b4b494751f5afa177c21f4803a6bab0702f28fd"
        anchor_commit: b63d99c73ff90a0cb66462f4b6815ad99dbd8001
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T16:02:00+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:7b1e3ea3cfbf35c10c626d559c65fbdc5931f3e539e7b8ea1d60eaac45a3debc"
        anchor_commit: b63d99c73ff90a0cb66462f4b6815ad99dbd8001
      - kind: lint
        command: "bunx biome check src\\cli.ts tests\\cli-surface.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T16:02:00+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:7b1e3ea3cfbf35c10c626d559c65fbdc5931f3e539e7b8ea1d60eaac45a3debc"
        anchor_commit: b63d99c73ff90a0cb66462f4b6815ad99dbd8001
---

# PLAN-L7-352: guard help exit code contract

## 背景

PLAN-L7-331 / A-182 CX-4 は、guard 系 CLI が blocked を exit code 2 で表すにもかかわらず help に契約が出ていない点を指摘していた。実装上は `agent-guard`、`work-guard`、`guard preflight` が blocked 時に `process.exitCode = 2` を返すため、利用者と AI が help だけで 0/1/2 の意味を判断できるようにする。

## 変更

- `ut-tdd hook agent-guard --help` に `exits: 0=pass, 1=error, 2=blocked` を表示する。
- `ut-tdd hook work-guard --help` に同じ exit code 契約を表示する。
- `ut-tdd guard preflight --help` に同じ exit code 契約を表示する。
- Commander の help 折り返しに依存しない regression test を追加する。

## 非対象

- guard 判定ロジックの変更。
- JSON 出力形式の変更。
- `handover` exit code の変更。`runHandover` の戻り値には `ok` 相当がなく、失敗分類も未定義のため、先に postcondition / failure taxonomy を設計する。
- `program.showSuggestionAfterError(true)` の追加。現 Commander では typo suggestion が既に出るため、明示設定は別 slice で扱う。

## 検証

- `bun run vitest run tests\\cli-surface.test.ts -t "guard blocked exit code" --reporter=dot`
- `bun run typecheck`
- `bunx biome check src\\cli.ts tests\\cli-surface.test.ts`
- Pack: `bun run vitest run tests\\cli-surface.test.ts -t "guard blocked exit code" --reporter=dot`
- Pack: `bun run typecheck`
- Pack: `bunx biome check src\\cli.ts tests\\cli-surface.test.ts`
- Pack: `bun run test:pack`

## DoD

- [x] `hook agent-guard --help` が exit code 2 の blocked 契約を表示する。
- [x] `hook work-guard --help` が exit code 2 の blocked 契約を表示する。
- [x] `guard preflight --help` が exit code 2 の blocked 契約を表示する。
- [x] Source / Pack の該当 runtime/test へ反映する。
