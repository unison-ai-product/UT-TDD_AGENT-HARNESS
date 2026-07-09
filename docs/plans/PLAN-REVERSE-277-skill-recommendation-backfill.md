---
plan_id: PLAN-REVERSE-277-skill-recommendation-backfill
title: "PLAN-REVERSE-277: skill 推奨差別化の設計 back-fill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: db
status: confirmed
route_signal: design_gap
route_mode: reverse
created: 2026-07-02
updated: 2026-07-09
owner: PM / PO
forward_routing: gap-only
promotion_strategy: reuse-as-is
agent_slots:
  - role: tl
    slot_label: "TL - skill recommendation back-fill scope"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-277-skill-recommendation-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/skill-index.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-277-skill-recommendation-discrimination.md
  requires: []
  references:
    - .ut-tdd/audit/A-186-skill-quality-design-impl-audit-2026-07-09.md
    - docs/design/harness/L6-function-design/skill-index.md
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/test-design/harness/L7-unit-test-design.md
    - src/skill-scoring/scoring.ts
    - src/skill-engine/recommend.ts
    - src/state-db/skill-projections.ts
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T15:36:00+09:00"
    tests_green_at: "2026-07-09T15:35:00+09:00"
    verdict: approve
    scope: "PLAN-L7-277 bottom-up implementation backfilled into L6 skill-index and L7 U-SKILL-IDX oracle rows. R4 merge confirms scoring SSoT, runtime-provenance learning, wildcard checklist exclusion, and CLI↔DB parity are now design contracts."
    worker_model: gpt-5
    reviewer_model: gpt-5
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\skill-recommend.test.ts tests\\skill-evaluation.test.ts tests\\projection-writer.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T15:35:00+09:00"
        evidence_path: tests/skill-recommend.test.ts
        output_digest: "sha256:f751bd993fac00a598c5b0c1404384d3deb1ac6104e4ba2237bfa6679e748f59"
      - kind: lint
        command: "bun run src\\cli.ts plan lint --gate governance"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-09T15:25:00+09:00"
        evidence_path: docs/design/harness/L6-function-design/skill-index.md
        output_digest: "sha256:da568bc04093f712bea730e1451fa17f7e3c0b9076ed5c7815eb93be4bb293a1"
---

# PLAN-REVERSE-277: skill 推奨差別化の設計 back-fill

## 状態

confirmed (R4 merge、2026-07-09)。PLAN-L7-277 の実装先行差分を L6 skill-index と L7 unit test design へ back-fill した。

## Back-Fill 候補

- L6 機能契約へ score 式 (実績項含む) と統合後の単一実装の契約を addendum する。
- 学習ループ (evaluations→score) の閉路を runtime-provenance 限定で追記する。
- 全 L 層×全駆動の review/checklist data asset を workflow skill scoring から除外する境界を追記する。
- L7 unit test design に U-SKILL-IDX-009..011 を追加し、wildcard 除外、runtime-provenance learning、CLI↔DB shared scorer を oracle 固定する。

## R4 結果

- [x] score 式と学習閉路が設計正本に存在する。
- [x] L7 oracle が U-SKILL-IDX-009..011 で追加されている。
- [x] PLAN-L7-277 は backfill 済み reverse を requires に持つ。
