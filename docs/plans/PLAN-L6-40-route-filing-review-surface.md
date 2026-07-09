---
plan_id: PLAN-L6-40-route-filing-review-surface
title: "PLAN-L6-40 (add-design): routeFiling review surface contract"
kind: add-design
layer: L6
sub_doc: function-spec
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / TL
parent_design: docs/plans/PLAN-L5-13-vmodel-spec-ir-physical-data.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T13:44:30+09:00"
    tests_green_at: "2026-07-08T13:44:30+09:00"
    verdict: approve
    scope: "U6a add-design slice。detector_route_candidates を FilingTarget 決定表にせず、review surface が routeFiling SSoT の FilingTarget 完全形を再評価して表示する契約を L6 function-spec と L7 unit oracle に追加した。"
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/workflow-contracts.test.ts tests/feedback-surface.test.ts tests/search-feedback.test.ts tests/projection-writer.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T13:44:30+09:00"
        evidence_path: tests/workflow-contracts.test.ts
        output_digest: "sha256:18b8a03dec8b3450f53649e6dd11cff438ad40b26cf94f9bc78feb131afc14f6"
        anchor_commit: 164de056ecced57754d460a9c7bec8aed715b4bb
agent_slots:
  - role: tl
    slot_label: "TL - routeFiling review surface design"
  - role: qa
    slot_label: "QA - L7 unit oracle for FilingTarget review"
generates:
  - artifact_path: docs/plans/PLAN-L6-40-route-filing-review-surface.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L5-13-vmodel-spec-ir-physical-data.md
  requires:
    - PLAN-L7-383-vmodel-schedule-authoring-source
  references:
    - docs/design/harness/L4-basic-design/function.md
    - docs/design/harness/L5-detailed-design/internal-processing.md
    - docs/design/harness/L5-detailed-design/physical-data.md
---

# PLAN-L6-40: routeFiling review surface contract

## 0. 役割

本 PLAN は U6a として、detector candidate review surface が `routeFiling` SSoT 評価結果を構造付きで表示するための L6 契約を追加する。

## 1. 設計内容

1. `reviewDetectorRouteCandidate` を L6 function-spec に追加する。
2. review DTO は candidate snapshot と `FilingTarget` 完全形を並べる。
3. DB schema は増やさず、review surface で再導出する。
4. L7 unit-test-design に U-ROUTE-REVIEW oracle を追加する。

## 2. 不変条件

- `detector_route_candidates` は候補入力であり、FilingTarget 決定表ではない。
- `allowed_kinds` / `layer_band` / `sub_doc_hint` / `pairing_obligation` は `routeFiling` SSoT 由来である。
- candidate snapshot と SSoT 評価結果が食い違う場合は `snapshot_mismatch` として表示し、silent repair しない。
- `candidate_status=non_ready` は実起票可能を意味しない。

## 3. DoD

- [x] L6 function-spec に review DTO 契約がある。
- [x] L7 unit-test-design に U-ROUTE-REVIEW oracle がある。
- [x] schema 追加なしで表示契約が成立する。
