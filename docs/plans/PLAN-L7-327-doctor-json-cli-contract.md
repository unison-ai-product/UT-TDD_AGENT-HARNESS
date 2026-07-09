---
plan_id: PLAN-L7-327-doctor-json-cli-contract
title: "PLAN-L7-327 (refactor): doctor --json CLI contract"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "doctor の既存 LintResult を CLI で JSON 出力できるようにする非破壊追加であり、上位要求の意味変更は伴わない。"
created: 2026-07-03
updated: 2026-07-03
owner: Codex
parent_design: docs/plans/PLAN-L7-326-doctor-runtime-state-extraction.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - doctor JSON CLI contract"
generates:
  - artifact_path: docs/plans/PLAN-L7-327-doctor-json-cli-contract.md
    artifact_type: markdown_doc
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-326-doctor-runtime-state-extraction.md
  requires: []
  references:
    - docs/plans/PLAN-L7-326-doctor-runtime-state-extraction.md
    - docs/governance/harness-v2-quality-uplift-strategy.md
    - .ut-tdd/audit/A-182-implementation-design-quality-audit-2026-07-03.md
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-03T15:29:00+09:00"
    tests_green_at: "2026-07-03T15:29:00+09:00"
    verdict: approve
    scope: "doctor --json の CLI 契約追加。既存 runDoctor LintResult をそのまま JSON 化し、text 出力と exit code 契約を維持することを確認。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\cli-surface.test.ts -t \"doctor\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T15:29:00+09:00"
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:381ef19ae65073605cd47063ccf5abb8206205cb721b771f8f55e0751dbf778d"
        anchor_commit: 7a039b0f60cfd5e662e72b280e39cbf995db765f
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T15:06:00+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:f71b8c011ee515f7b52dc0fdb6c2eacfd1ebb27d84c16be547e2c937c923bfed"
        anchor_commit: 7a039b0f60cfd5e662e72b280e39cbf995db765f
      - kind: lint
        command: "bunx biome check src\\cli.ts tests\\cli-surface.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T15:06:00+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:f71b8c011ee515f7b52dc0fdb6c2eacfd1ebb27d84c16be547e2c937c923bfed"
        anchor_commit: 7a039b0f60cfd5e662e72b280e39cbf995db765f
---

# PLAN-L7-327: doctor --json CLI contract

## 背景

A-182 / QU-4 は `doctor --json` 不在を CX-2 として記録した。`runDoctor()` はすでに `ok` と
`messages` を持つ構造化結果を返しているが、CLI は text 出力だけを公開していたため、後続 AI や
GitHub 連携が doctor 結果を正規表現で読む必要があった。

これは自己開発用の人間向け出力に寄った surface であり、汎用的なシステム開発用 harness としては
機械可読な health-check contract が不足している。

## 変更

- `ut-tdd doctor --json` を追加し、既存 `runDoctor()` の `LintResult` をそのまま JSON 出力する。
- text 出力の既存挙動は維持する。
- `--setup-smoke --json` のような失敗ケースでも JSON を出し、exit code は `ok` に従って 0/1 を維持する。

## 非対象

- doctor check の意味変更。
- doctor 内部集約の追加分割。
- `showSuggestionAfterError`、`handover` exit code、`route eval --json` alias。これらは QU-4 の残スコープとして
  別 slice で扱う。

## 検証

- `bun run vitest run tests\\cli-surface.test.ts -t "doctor" --reporter=dot`
- `bun run typecheck`
- `bunx biome check src\\cli.ts tests\\cli-surface.test.ts`
- `bun run src\\cli.ts doctor`
- Pack: `bun run typecheck`
- Pack: `bun run vitest run tests\\cli-surface.test.ts -t "doctor" --reporter=dot`
- Pack: `bunx biome check src\\cli.ts tests\\cli-surface.test.ts`
- Pack: `bun run test:pack`

## DoD

- [x] `doctor --help` に `--json` が表示される。
- [x] `doctor --setup-smoke --json` が JSON を返し、失敗 exit code を維持する。
- [x] text mode の doctor 出力が維持される。
- [x] Source / Pack の該当 runtime/test へ反映する。
