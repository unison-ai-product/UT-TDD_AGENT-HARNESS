---
plan_id: PLAN-L7-343-route-eval-json-alias
title: "PLAN-L7-343 (refactor): route eval --json alias"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "既存 route eval --format json の別名を追加する非破壊 CLI 契約改善であり、上位要求や設計意味の変更は伴わない。"
created: 2026-07-03
updated: 2026-07-03
owner: Codex
parent_design: docs/plans/PLAN-L7-331-cli-contract-polish.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - route eval JSON alias"
generates:
  - artifact_path: docs/plans/PLAN-L7-343-route-eval-json-alias.md
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
    reviewed_at: "2026-07-03T15:36:00+09:00"
    tests_green_at: "2026-07-03T15:36:00+09:00"
    verdict: approve
    scope: "route eval --json alias の非破壊追加、--format json と同一 JSON 出力であること、既存 text / --format 経路を維持することを確認。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\cli-surface.test.ts -t \"route eval --json\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T15:35:00+09:00"
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:453e817e14e8e3f0225aa5c5f1d3ccbe5706e84e4eb6aabc17351c8267506cf2"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T15:36:00+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:e03ad0f2498ee56131b3e23ca61965277c2f147118d6ca8453e13838ded3133b"
      - kind: lint
        command: "bunx biome check src\\cli.ts tests\\cli-surface.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T15:36:00+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:e03ad0f2498ee56131b3e23ca61965277c2f147118d6ca8453e13838ded3133b"
---

# PLAN-L7-343: route eval --json alias

## 背景

A-182 / QU-4 は CLI 契約の揺れとして、`route eval` だけが `--format json` を使い、他の主要 CLI surface が使う `--json` と統一されていない点を記録した。実測でも `ut-tdd route eval --signal reverse --json` は unknown option になり、AI や人間が統一 JSON surface として扱いにくい状態だった。

## 変更

- `route eval` に `--json` boolean option を追加する。
- `--json` は既存 `--format json` と同じ出力を返す alias とする。
- 既存の `--format json` は後方互換のため維持する。

## 非対象

- `--format` の廃止。
- `--plan` 二義性の解消。
- `handover` exit code、guard help、typo suggestion の変更。これらは PLAN-L7-331 の残スコープとして扱う。

## 検証

- `bun run vitest run tests\\cli-surface.test.ts -t "route eval --json" --reporter=dot`
- `bun run typecheck`
- `bunx biome check src\\cli.ts tests\\cli-surface.test.ts`
- `bun run src\\cli.ts doctor`
- Pack: `bun run vitest run tests\\cli-surface.test.ts -t "route eval --json" --reporter=dot`
- Pack: `bun run typecheck`
- Pack: `bunx biome check src\\cli.ts tests\\cli-surface.test.ts`
- Pack: `bun run test:pack`

## DoD

- [x] `route eval --json` が unknown option にならない。
- [x] `route eval --json` が `--format json` と同じ JSON を返す。
- [x] Source / Pack の該当 runtime/test へ反映する。
