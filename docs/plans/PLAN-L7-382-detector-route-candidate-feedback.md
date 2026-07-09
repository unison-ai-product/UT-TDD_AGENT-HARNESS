---
plan_id: PLAN-L7-382-detector-route-candidate-feedback
title: "PLAN-L7-382 (add-impl): detector route candidate feedback / issue queue bridge"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / TL
parent_design: docs/plans/PLAN-L6-39-vmodel-spec-ir-function-contracts.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T13:01:10+09:00"
    tests_green_at: "2026-07-08T13:01:10+09:00"
    verdict: approve
    scope: "U4 add-impl slice。PLAN-L7-381 が投影する detector_route_candidates を feedback_events / issue_queue / takeover surface へ接続した。candidate は FilingTarget 決定済みとして扱わず、routeFiling SSoT 評価前の non-ready dry-run 候補として human approval 必須で表示する。"
    green_commands:
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T13:01:10+09:00"
        evidence_path: src/state-db/feedback-projections.ts
        output_digest: "sha256:80571889b44c7eeeb95f760e9d47733a447678fa34bb79e239fc745e2308130b"
        anchor_commit: 132adcbcc52730c873b7a818c41760934116a5f4
      - kind: unit_test
        command: "bun run vitest run tests/feedback-surface.test.ts tests/search-feedback.test.ts tests/projection-writer.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T13:01:10+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:f75198da0bb9bcf80feba789d274bac931d1f273279747adb24a8f29c46fad74"
        anchor_commit: 132adcbcc52730c873b7a818c41760934116a5f4
agent_slots:
  - role: tl
    slot_label: "TL - detector candidate feedback bridge review"
  - role: se
    slot_label: "SE - feedback_events / issue_queue projection bridge"
  - role: qa
    slot_label: "QA - takeover surface / emit parity / duplicate suppression"
generates:
  - artifact_path: docs/plans/PLAN-L7-382-detector-route-candidate-feedback.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/feedback-projections.ts
    artifact_type: source_module
  - artifact_path: src/feedback/engine.ts
    artifact_type: source_module
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-39-vmodel-spec-ir-function-contracts.md
  requires:
    - PLAN-L7-381-vmodel-spec-ir-projection
    - docs/plans/PLAN-REVERSE-382-detector-route-candidate-feedback-backfill.md
  references:
    - docs/plans/PLAN-L7-366-takeover-surface-warn-actionable.md
    - docs/plans/PLAN-L7-381-vmodel-spec-ir-projection.md
    - src/feedback/surface.ts
    - src/state-db/feedback-projections.ts
---

# PLAN-L7-382: detector route candidate feedback / issue queue bridge

## 0. 役割

本 PLAN は U4 として、`detector_route_candidates` を `feedback_events`、takeover surface、dry-run
`issue_queue` へ接続する。目的は、DB-backed detection が見つけた設計/工程/activation gap を、起票候補として人間が確認しやすい場所へ出すことである。

## 1. 実装内容

1. `projectFeedbackEvents` が `detector_route_candidates` を `feedback_events` へ投影する。
2. `emitFeedbackEvents` でも同じ candidate bridge を使い、`ut-tdd feedback list --emit --json` と rebuild 経路を揃える。
3. candidate の source finding は通常 finding feedback と重複表示しない。
4. `projectIssueQueue` が `detector_route_candidate:*` を dry-run issue candidate として queue する。
5. takeover surface は既存どおり `feedback_events` を第一ソースに読み、candidate を actionable として表示する。

## 2. 不変条件

- `detector_route_candidates` は FilingTarget 決定表ではない。
- `candidate_status=non_ready` は起票可能ではなく、`routeFiling` SSoT 評価前の候補として表示する。
- `issue_queue` は `queued_dry_run`、`human_approval_required=1`、`external_issue_url=""` を維持する。
- closed candidate は feedback / issue queue に投影しない。
- source finding と detector candidate の二重表示を避ける。

## 3. 受け入れ条件

- candidate 由来の `feedback_events.signal_type=detector_route_candidate:*` が出る。
- takeover surface で actionable として表示され、telemetry summary に落ちない。
- `feedback list --emit` と rebuild projection の candidate bridge が一致する。
- dry-run issue queue と approval guardrail が human approval 必須で作成される。
- targeted vitest、`tsc --noEmit`、`db rebuild`、`doctor` が green。

## 4. 後続 slice

- U5: 工程管理表の専用authoring sourceを整備し、candidate reason / target snapshot の精度を上げる。
- U6: routeFiling SSoT 評価結果を candidate review surface に表示し、実起票前の人間確認UIを強化する。
