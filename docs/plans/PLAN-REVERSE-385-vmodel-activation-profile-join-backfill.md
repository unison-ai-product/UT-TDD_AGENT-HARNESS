---
plan_id: PLAN-REVERSE-385-vmodel-activation-profile-join-backfill
title: "PLAN-REVERSE-385: activation profile schedule join design backfill closure"
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
    slot_label: "TL - activation profile schedule join backfill closure"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-385-vmodel-activation-profile-join-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-385-vmodel-activation-profile-join.md
  requires:
    - PLAN-L6-41-vmodel-activation-profile-join
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T14:10:34+09:00"
    tests_green_at: "2026-07-08T14:10:34+09:00"
    verdict: approve
    scope: "PLAN-L7-385 の add-impl 実装が、PLAN-L6-41 の activation profile schedule join 契約に一致し、設計正本から検出系へ read-model を流していることを確認する Reverse closure。"
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/spec-ir-projections.test.ts tests/projection-writer.test.ts tests/db-projection-ingestion.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T14:10:34+09:00"
        evidence_path: tests/spec-ir-projections.test.ts
        output_digest: "sha256:f45e6336212da38510041085e50b973813204aa887e387ce7815595b04b79fc7"
---

# PLAN-REVERSE-385: activation profile schedule join design backfill closure

## R0 Evidence

PLAN-L7-385 は activation profile と工程表を `activation_schedule_reviews` に join し、検索 index へ投影する。

## R1 Observed Gap

U5/U6 では工程表と routeFiling review は DB から見えるようになったが、profile の対象/除外/延期理由と現在地は
同じ read-model で検索できなかった。

## R2 Alignment

- L4 data: ActivationScheduleReview は CQRS 読みモデルであり、Workflow 正本ではない。
- L5 physical-data: `activation_schedule_reviews` は `activation_entries` × `schedule_entries` の join table。
- L6 function-spec: `joinActivationScheduleReviews` は profile と工程表を更新せず、missing schedule を finding 化する。

## R3 / R4 Outcome

追加 backfill は PLAN-L6-41 と PLAN-L7-385 内で完了。Forward へ合流する。

## DoD

- [x] activation profile と工程表の join read-model がある。
- [x] version-up 対象/除外/延期理由が検索可能である。
- [x] profile / 工程表 / PLAN は projection から更新されない。
