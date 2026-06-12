---
plan_id: PLAN-REVERSE-42-regression-dependency-drift
title: "PLAN-REVERSE-42 (reverse): regression expansion + dependency-drift scaffold stub 解消"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: code
drive: fullstack
status: confirmed
created: 2026-06-11
updated: 2026-06-11
owner: Codex TL
forward_routing: L5
promotion_strategy: reuse-with-hardening
review_evidence:
  - reviewer: codex-intra-runtime-review
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-11"
    tests_green_at: "2026-06-11"
    verdict: pass
    scope: "U-DEPD-001..003 and U-REGEXP-001..002 promoted to green; doctor scaffold stub replaced by dependency-drift/regression-expansion surface. Critical 0 / Important 0. External import-graph tools remain out of scope."
    worker_model: codex-gpt-5
    reviewer_model: codex-gpt-5-intra-runtime-review
agent_slots:
  - role: tl
    slot_label: "TL - dependency drift / regression expansion reverse close"
generates:
  - artifact_path: src/lint/dependency-drift.ts
    artifact_type: source_module
  - artifact_path: tests/dependency-drift.test.ts
    artifact_type: test_code
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-DISCOVERY-05-roadmap-registration.md
  requires:
    - docs/plans/PLAN-L7-32-cross-artifact-relation-graph.md
    - docs/plans/PLAN-L7-36-relation-graph-export.md
  references:
    - docs/governance/gate-design.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/design/harness/L3-functional/roadmap.md
---

# PLAN-REVERSE-42 (reverse): regression expansion + dependency-drift scaffold stub 解消

## §0 Position

L7 roadmap の **G-L7.C → G-L7.D** span。`doctor` の固定文言
`scaffold stub (dependency-drift / regression expansion は後続 PLAN)` を、実 import graph 検査と変更起点の regression scope expansion に置き換える。

## §1 R0-R3

- **R0**: module/asset/change-impact は個別 drift を見るが、import graph の逆依存・循環・依存方向違反と、変更 source から必要 test scope を展開する機械経路が無い。
- **R1**: ADR-002/IMP-032 の `dependency-drift` と、relation-graph 後続の regression expansion を L7 implementation lint として抽出。
- **R2**: `src/**/*.ts` import graph を module edge に正規化し、禁止逆依存・cycle を finding 化。`tests/**/*.ts` の source import から module→test coverage edge を作る。
- **R3**: 外部 tool (madge/knip/dependency-cruiser) の実行は PLAN-L7-34 adapter readiness に委ね、本 span は built-in AST parser の pure lint に閉じる。

## §工程表

1. `tests/dependency-drift.test.ts` に U-DEPD/U-REGEXP の Red oracle を追加。
2. `src/lint/dependency-drift.ts` に pure analyzer + repo loader + message renderer を実装。
3. `src/doctor/index.ts` の固定 scaffold stub を dependency-drift / regression-expansion surface に差し替え。
4. L7 test-design と roadmap evidence を更新し、doctor で G-L7.D 到達を確認。

## §8 DoD

- [x] U-DEPD-001..003 / U-REGEXP-001..002 が Red→Green。
- [x] `doctor` が `dependency-drift` と `regression-expansion` を surface し、scaffold stub を出さない。
- [x] `bun run vitest run tests/dependency-drift.test.ts tests/doctor.test.ts tests/vmodel-pair.test.ts` green。
- [x] `PLAN-DISCOVERY-05` roadmap span の orphan を解消する正本 PLAN として confirmed。
