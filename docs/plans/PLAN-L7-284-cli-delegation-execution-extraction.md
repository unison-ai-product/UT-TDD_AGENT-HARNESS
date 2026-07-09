---
plan_id: PLAN-L7-284-cli-delegation-execution-extraction
title: "PLAN-L7-284 (refactor): CLI delegation execution helper extraction"
kind: refactor
layer: L7
drive: be
status: confirmed
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "CLI の provider delegation 実行境界を抽出する保守性改善であり、公開 command contract と runtime policy を変えないため design back-fill は不要。"
created: 2026-07-03
updated: 2026-07-03
owner: Codex
parent_design: docs/plans/PLAN-L7-255-delegation-model-effort-injection.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - CLI delegation execution extraction"
generates:
  - artifact_path: docs/plans/PLAN-L7-284-cli-delegation-execution-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/cli/delegation.ts
    artifact_type: source_module
  - artifact_path: tests/cli-delegation.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-255-delegation-model-effort-injection.md
  requires: []
  references:
    - src/cli.ts
    - src/cli/delegation.ts
    - tests/cli-delegation.test.ts
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-03T11:05:00+09:00"
    tests_green_at: "2026-07-03T11:05:00+09:00"
    verdict: approve
    scope: "advisor/provider delegation の実行 helper を src/cli/delegation.ts に抽出し、legacy provider env 除去と UT-TDD override 維持を単体テストで固定する。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-03T11:05:00+09:00"
        evidence_path: src/cli/delegation.ts
        output_digest: "sha256:650da4c1b32c775035d366c04a55b77efbcb30aa0a073509aecfa2297ecd6cc4"
        anchor_commit: c32f6bf1f53ca70432a13cdce0629a004006d762
      - kind: unit_test
        command: "bun run vitest run tests\\cli-delegation.test.ts tests\\cli-surface.test.ts -t \"delegation|advisor|model/effort\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-03T11:05:00+09:00"
        evidence_path: tests/cli-delegation.test.ts
        output_digest: "sha256:b7affd9f11a1ca8be5fdb48e191436e29bc68ce8e3b9741cf1aa3706e7d98238"
        anchor_commit: c32f6bf1f53ca70432a13cdce0629a004006d762
---

# PLAN-L7-284: CLI delegation execution helper extraction

## 背景

`src/cli.ts` は L7-255 後に provider delegation の model / effort 注入、adapter 実行、session hook、review guard が同居している。
一気に registrar 全体を移すと差分が大きいため、本 slice は実行 helper の抽出に限定する。

## 変更

- `src/cli/delegation.ts` を追加し、adapter 実行 env と advisor execution helper を移す。
- `src/cli.ts` の advisor execute path は新 helper を使う。
- legacy self-dev env (`HELIX_*` 相当) は provider 実行へ漏らさず、`UT_TDD_*` provider override は保持する単体テストを追加する。

## 検証

- `bun run typecheck`
- `bun run vitest run tests\\cli-delegation.test.ts tests\\cli-surface.test.ts -t "delegation|advisor|model/effort" --reporter=dot`
- `bun run src\\cli.ts doctor`

## DoD

- [x] advisor execute path の JSON contract が維持される。
- [x] runtime adapter の env cleanup contract が維持される。
- [x] `src/cli.ts` の provider execution 責務が小さくなる。
