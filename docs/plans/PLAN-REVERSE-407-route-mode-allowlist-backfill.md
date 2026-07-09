---
plan_id: PLAN-REVERSE-407-route-mode-allowlist-backfill
title: "PLAN-REVERSE-407: route_mode allowlist completion back-fill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: be
status: confirmed
created: 2026-07-09
updated: 2026-07-09
owner: Codex
route_signal: drift
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
parent_design: docs/plans/PLAN-L7-407-route-mode-allowlist-completion.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
backprop_scope:
  - layer: L4-basic-design
    decision: not_impacted
    evidence_path: docs/design/harness/L4-basic-design/function.md
    reason: "L4 §3.1 は既に全 11 駆動モデル + Verify の kind と出口 contract を定義済み。本 Reverse は実装側 allowlist の未反映を埋める。"
  - layer: L7-unit-test-design
    decision: updated
    evidence_path: tests/plan-lint.test.ts
    reason: "route_mode allowed-kinds / layer-band の全登録と未知 route_mode 誤扱い防止を unit oracle として固定する。"
agent_slots:
  - role: tl
    slot_label: "TL - route_mode allowlist back-fill"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-407-route-mode-allowlist-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L7-407-route-mode-allowlist-completion.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: src/plan/lint-policy.ts
    artifact_type: source_module
  - artifact_path: tests/plan-lint.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-407-route-mode-allowlist-completion.md
  requires:
    - docs/plans/PLAN-L7-407-route-mode-allowlist-completion.md
---

# PLAN-REVERSE-407: route_mode allowlist completion back-fill

## R0 Evidence

HARNESS メモリ監査で、L4 §3.1 に存在する `discovery` / `scrum` / `retrofit` / `research` /
`design-bottomup` が `ROUTE_MODE_ALLOWED_KINDS` に存在しないことが確認された。

## R1 Observed Gap

`lint.ts` は未知 `route_mode` を fail-close するよう改善済みだったが、設計正本の mode universe が
実装側 allowlist へ完全反映されていなかった。そのため設計上正しい mode が未知扱いになっていた。

## R2 Alignment

検出器や lint が独自に mode を狭めるのではなく、L4 §3.1 の駆動モデル表を実装側 allowlist へ合わせる。
`discovery` と `scrum` は同じ `kind=poc` を共有し、PLAN 自体は workflow 横断の `layer=cross` として扱う。
`research` は L1-L4、`retrofit` は L7、`design-bottomup` は L2-L7 の add-design/add-impl band に固定する。

## R3/R4 Back-fill

- `src/plan/lint-policy.ts`: 全 route mode の allowed kind と layer band を登録。
- `tests/plan-lint.test.ts`: 全登録表と新規登録 mode の unknown route_mode 誤扱い防止を oracle 化。

本 Reverse は gap-only の back-fill であり、L4 設計本文や DB schema は変更しない。
