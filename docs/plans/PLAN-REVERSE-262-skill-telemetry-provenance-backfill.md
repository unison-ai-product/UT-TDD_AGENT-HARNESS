---
plan_id: PLAN-REVERSE-262-skill-telemetry-provenance-backfill
title: "PLAN-REVERSE-262: skill telemetry provenance 分離の設計 back-fill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: db
status: confirmed
route_signal: design_gap
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
agent_slots:
  - role: tl
    slot_label: "TL - provenance 分離 back-fill review"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-262-skill-telemetry-provenance-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L7-262-skill-telemetry-provenance.md
  requires: []
review_evidence:
  - reviewer: ut-tdd-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T20:27:00+09:00"
    tests_green_at: "2026-07-02T20:26:18+09:00"
    verdict: approve
    scope: "PLAN-L7-262 実装 (metrics の runtime 発火限定 / session_id 明示 / skill_injection event) からの L5 physical-data back-fill。metric 定義節へ provenance 分離規則を追記。"
    worker_model: claude-fable-5
    reviewer_model: claude-sonnet-4-6
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/skill-telemetry-provenance.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T20:26:18+09:00"
        evidence_path: tests/skill-telemetry-provenance.test.ts
        output_digest: "sha256:62942f915aa2c77b5c4b94e70483d9d68bbd9f2c723ca2a1fb6d69f1f3aa4f5a"
---

# PLAN-REVERSE-262: skill telemetry provenance 分離の設計 back-fill

## R0 Evidence

PLAN-L7-262 が skill telemetry の provenance 分離 (metrics の runtime 発火限定、
session_id 空文字廃止、注入実績/失敗の session JSONL 記録) を実装した。
L5 physical-data.md の metric 定義節にこの規則が無い gap を back-fill する。

## R1 Observed Gap

- `skill_firing_rate` / `skill_acceptance_rate` の定義が auto-projection 行と runtime 行を
  区別していなかった (A-178 G-8 の設計側盲点)。
- session_id の空文字許容が偽装を可能にしていた (G-9)。
- 注入 silent fail-open が設計上どこにも記録されない (G-11)。

## R2 Alignment

telemetry provenance invariant (PLAN-L7-188、physical-data.md §telemetry) と同方向の強化。
metrics 算出は runtime provenance のみを substance として扱い、deterministic projection は
監査参照系列に留める。

## R3 / R4 Outcome

physical-data.md の metric 定義節へ provenance 分離規則 (runtime 限定分子 /
`skill-metrics:runtime` source / session_id 明示 marker / `skill_injection` event) を追記。
forward_routing は gap-only (要件レベルの変更なし。既存 invariant の物理設計精緻化)。

## DoD

- [x] L7 実装と L5 physical-data の metric 定義が一致する。
- [x] session_id / source の明示 marker 規則が設計正本に載る。
- [x] 注入実績記録 (skill_injection event) が設計正本に載る。
