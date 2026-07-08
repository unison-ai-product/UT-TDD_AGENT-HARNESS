---
plan_id: PLAN-REVERSE-384-route-filing-review-surface-backfill
title: "PLAN-REVERSE-384: routeFiling review surface design backfill closure"
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
    slot_label: "TL - routeFiling review surface backfill closure"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-384-route-filing-review-surface-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-384-route-filing-review-surface.md
  requires:
    - PLAN-L6-40-route-filing-review-surface
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T13:44:30+09:00"
    tests_green_at: "2026-07-08T13:44:30+09:00"
    verdict: approve
    scope: "PLAN-L7-384 の add-impl 実装が、PLAN-L6-40 の review DTO 契約に一致し、DB schema を FilingTarget 決定表へ変えずに review surface で routeFiling SSoT を再評価していることを確認する Reverse closure。"
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/workflow-contracts.test.ts tests/feedback-surface.test.ts tests/search-feedback.test.ts tests/projection-writer.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T13:44:30+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:b3fbba3c08fa5e2825b1068ea78b4686f5eaed45e35457ef78f28447cf12772c"
---

# PLAN-REVERSE-384: routeFiling review surface design backfill closure

## R0 Evidence

PLAN-L7-384 は `routeFiling` / `FilingTarget` を workflow contract に追加し、detector candidate feedback に SSoT 評価結果を表示した。

## R1 Observed Gap

U4 では detector candidate は feedback surface に出たが、`routeFiling SSoT before filing` という人間向け注意に留まり、FilingTarget 完全形は表示されていなかった。

## R2 Alignment

- L4 function: `FilingTarget` は mode だけでなく allowed_kinds / layer_band / pairing を返す。
- L5 physical-data: `detector_route_candidates` は候補入力であり、決定表ではない。
- L6 function-spec: `reviewDetectorRouteCandidate` が review DTO として SSoT 評価を併記する。

## R3 / R4 Outcome

追加 backfill は PLAN-L6-40 と PLAN-L7-384 内で完了。DB schema は変更せず、Forward へ合流する。

## DoD

- [x] routeFiling SSoT 評価結果が review surface に出る。
- [x] FilingTarget 完全形を DB candidate row に永続列追加していない。
- [x] dry-run issue queue は human approval required のまま。
