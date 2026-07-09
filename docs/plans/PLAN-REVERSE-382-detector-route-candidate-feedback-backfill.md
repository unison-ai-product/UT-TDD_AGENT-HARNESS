---
plan_id: PLAN-REVERSE-382-detector-route-candidate-feedback-backfill
title: "PLAN-REVERSE-382: detector route candidate feedback bridge design backfill closure"
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
created: 2026-07-08
updated: 2026-07-08
owner: PO / TL
agent_slots:
  - role: tl
    slot_label: "TL - detector candidate feedback bridge backfill closure"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-382-detector-route-candidate-feedback-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-382-detector-route-candidate-feedback.md
  requires:
    - PLAN-L6-39-vmodel-spec-ir-function-contracts
  references:
    - PLAN-L7-381-vmodel-spec-ir-projection
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T13:01:10+09:00"
    tests_green_at: "2026-07-08T13:01:10+09:00"
    verdict: approve
    scope: "PLAN-L7-382 の add-impl 実装が、PLAN-L6-39 の detector route candidate handoff 契約と PLAN-L7-366 の feedback_events first surface に一致していることを確認する Reverse closure。追加設計差分は不要で、forward routing は gap-only とする。"
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/feedback-surface.test.ts tests/search-feedback.test.ts tests/projection-writer.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T13:01:10+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:f75198da0bb9bcf80feba789d274bac931d1f273279747adb24a8f29c46fad74"
        anchor_commit: 132adcbcc52730c873b7a818c41760934116a5f4
---

# PLAN-REVERSE-382: detector route candidate feedback bridge design backfill closure

## R0 Evidence

PLAN-L7-382 は `detector_route_candidates` を feedback/takeover/issue queue surface へ接続した。

## R1 Observed Gap

`detector_route_candidates` は PLAN-L7-381 で DB projection されたが、feedback surface へ接続されるまで、人間が起票候補として見つける導線が弱かった。

## R2 Alignment

接続先は既存設計に一致する。

- PLAN-L6-39: detector route candidate は FilingTarget を創作せず、routeFiling SSoT へ渡す候補である。
- PLAN-L7-366: takeover surface は `feedback_events` を第一ソースとして読む。
- issue queue: external issue は dry-run + human approval required のままにする。

## R3 / R4 Outcome

追加 backfill は不要。PLAN-L7-382 は既存設計の add-impl として forward に合流する。

## DoD

- [x] candidate が feedback surface に出る。
- [x] candidate は dry-run issue queue に留まり、人間承認なしに外部起票しない。
- [x] source finding との二重表示を避ける。
