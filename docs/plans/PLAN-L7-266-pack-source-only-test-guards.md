---
plan_id: PLAN-L7-266-pack-source-only-test-guards
title: "PLAN-L7-266 (refactor): Pack source-only test guards"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "Pack と source の test 実行面の補正。source-only docs を読む実 repo 回帰ケースだけを path presence で guard し、lint/doctor/CLI の fail-close 本体や Pack 正式 gate は変更しない。"
created: 2026-07-02
updated: 2026-07-02
owner: Codex
parent_design: docs/design/harness/L6-function-design/setup-solo-team.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - Pack source-only test guard"
generates:
  - artifact_path: docs/plans/PLAN-L7-266-pack-source-only-test-guards.md
    artifact_type: markdown_doc
  - artifact_path: tests/backfill-pairing.test.ts
    artifact_type: test_code
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path tests\\backfill-pairing.test.ts"
        output_digest: "sha256:f80c0641ed17082b8b27eba0d623284c2979694663ccdc3bb66c31a1f0b0d4db"
  - artifact_path: tests/plan-lint.test.ts
    artifact_type: test_code
    evidence:
      - command: "Get-FileHash -Algorithm SHA256 -Path tests\\plan-lint.test.ts"
        output_digest: "sha256:652dcbbd9164af969d0715cee6123d41beab19aafcd558fceb6f1af3f8a0fd81"
dependencies:
  parent: docs/plans/PLAN-L7-234-pack-test-skip-guards.md
  requires: []
  references:
    - tests/backfill-pairing.test.ts
    - tests/plan-lint.test.ts
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T17:10:00+09:00"
    tests_green_at: "2026-07-02T17:10:00+09:00"
    verdict: approve
    scope: "Only source-only real-repo regression cases get path presence guards; fixture-based unit tests still run in Pack."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\backfill-pairing.test.ts tests\\plan-lint.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T17:10:00+09:00"
        evidence_path: tests/backfill-pairing.test.ts
        output_digest: "sha256:f80c0641ed17082b8b27eba0d623284c2979694663ccdc3bb66c31a1f0b0d4db"
---

# PLAN-L7-266: Pack source-only test guards

## 背景

clean Pack repo は source-only governance docs を含まない。一方、`tests/backfill-pairing.test.ts` と `tests/plan-lint.test.ts` には、fixture ではなく実 source repo の `docs/plans` / `docs/test-design` / `docs/design` を読む回帰ケースが含まれている。

Pack 正式 gate は `test:pack` と `doctor --setup-smoke` だが、Pack checkout で対象 test を直接走らせると source-only docs 不在で失敗する。これは harness の汎用配布面では不要なノイズである。

## 変更

- `U-BACKFILL-006` は `docs/plans` がある repo でのみ実 repo 回帰を実行する。
- `U-PLANSCH-007` / `U-PLANSCH-009` は `docs/test-design/harness` がある repo でのみ source trace gate を実行する。
- `U-PLANSCH-011` は対象 active docs が全て存在する repo でのみ stale command scan を実行する。
- parser/analyzer の fixture tests は Pack でも引き続き実行する。

## 検証

- `bunx biome check --write tests\\backfill-pairing.test.ts tests\\plan-lint.test.ts`
- `bun run typecheck`
- `bun run vitest run tests\\backfill-pairing.test.ts tests\\plan-lint.test.ts --reporter=dot`
- Pack checkout で同じ direct test
- Pack `bun run test:pack`

## DoD

- [x] source repo では対象 test が skip されず全件実行される。
- [x] Pack repo では source-only 実 repo ケースだけが guard される。
- [x] lint/doctor/CLI 本体の fail-close 意味は変更しない。
- [x] Pack 正式 gate は green のまま。
