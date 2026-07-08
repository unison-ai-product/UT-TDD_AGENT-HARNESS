---
plan_id: PLAN-L7-384-route-filing-review-surface
title: "PLAN-L7-384 (add-impl): routeFiling review surface wiring"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / TL
parent_design: docs/plans/PLAN-L6-40-route-filing-review-surface.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T13:59:32+09:00"
    tests_green_at: "2026-07-08T13:58:15+09:00"
    verdict: approve
    scope: "U6b add-impl slice。workflow 層に routeFiling/FilingTarget を追加し、detector candidate feedback が allowed_kinds / layer_band / pairing_obligation / human approval を含む routeFiling SSoT 評価結果を表示するようにした。"
    green_commands:
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T13:58:15+09:00"
        evidence_path: src/schema/route-filing.ts
        output_digest: "sha256:f04a03d201f9e656a28d33e74e7686955b8cb273fd3ac6ac1a8d2fe06585a1d2"
      - kind: unit_test
        command: "bun run vitest run tests/workflow-contracts.test.ts tests/feedback-surface.test.ts tests/search-feedback.test.ts tests/projection-writer.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T13:58:15+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:b3fbba3c08fa5e2825b1068ea78b4686f5eaed45e35457ef78f28447cf12772c"
agent_slots:
  - role: tl
    slot_label: "TL - routeFiling FilingTarget wiring review"
  - role: se
    slot_label: "SE - workflow routeFiling and feedback builder"
  - role: qa
    slot_label: "QA - projection / emit / surface parity"
generates:
  - artifact_path: docs/plans/PLAN-L7-384-route-filing-review-surface.md
    artifact_type: markdown_doc
  - artifact_path: src/workflow/routing-contracts.ts
    artifact_type: source_module
  - artifact_path: src/workflow/contracts.ts
    artifact_type: source_module
  - artifact_path: src/schema/route-filing.ts
    artifact_type: source_module
  - artifact_path: src/state-db/route-candidate-review.ts
    artifact_type: source_module
  - artifact_path: src/state-db/feedback-projections.ts
    artifact_type: source_module
  - artifact_path: src/feedback/engine.ts
    artifact_type: source_module
  - artifact_path: tests/workflow-contracts.test.ts
    artifact_type: test_code
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-40-route-filing-review-surface.md
  requires:
    - docs/plans/PLAN-REVERSE-384-route-filing-review-surface-backfill.md
  references:
    - docs/plans/PLAN-L7-382-detector-route-candidate-feedback.md
    - docs/plans/PLAN-L7-383-vmodel-schedule-authoring-source.md
---

# PLAN-L7-384: routeFiling review surface wiring

## 0. 役割

本 PLAN は U6b として、`detector_route_candidates` を review surface に出す際に `routeFiling` SSoT の評価結果を併記する。

## 1. 実装内容

1. `routeFiling` / `FilingTarget` を workflow routing contract に追加する。
2. `reviewDetectorRouteCandidate` が candidate snapshot と FilingTarget 完全形を review DTO にする。
3. `projectFeedbackEvents` と `emitFeedbackEvents` が同じ builder を使う。
4. dry-run `issue_queue` は human approval required を維持し、routeFiling 評価結果は feedback event 側の証跡として参照する。

## 2. 不変条件

- DB schema は増やさない。
- candidate source row、PLAN、工程表は review surface から更新しない。
- unknown signal は forward fallback + warning で扱い、ready 扱いにしない。
- snapshot mismatch は `review_status=snapshot_mismatch` として表示する。

## 3. 受け入れ条件

- `routeFiling("feature_addition")` が `add-feature` の FilingTarget 完全形を返す。
- feedback projection と emit 経路が `allowed_kinds` / `layer_band` / `pairing_obligation` を表示する。
- candidate は actionable feedback のまま telemetry に落ちない。
- targeted vitest、`tsc --noEmit`、`db rebuild`、`doctor` が green。

## 4. 後続 slice

- U7: activation profile と工程表を join し、version-up wave の対象/除外/延期理由を検索可能にする。
