---
plan_id: PLAN-L6-41-vmodel-activation-profile-join
title: "PLAN-L6-41 (add-design): activation profile schedule join contract"
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
parent_design: docs/plans/PLAN-L7-384-route-filing-review-surface.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T14:10:34+09:00"
    tests_green_at: "2026-07-08T14:10:34+09:00"
    verdict: approve
    scope: "U7a add-design slice。activation profile を工程管理表と join する L6 契約を追加し、version-up 対象/除外/延期理由を検出系が設計正本から読めるようにする。"
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/spec-ir-projections.test.ts tests/projection-writer.test.ts tests/db-projection-ingestion.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T14:10:34+09:00"
        evidence_path: tests/spec-ir-projections.test.ts
        output_digest: "sha256:f45e6336212da38510041085e50b973813204aa887e387ce7815595b04b79fc7"
agent_slots:
  - role: tl
    slot_label: "TL - activation profile schedule join design"
  - role: qa
    slot_label: "QA - L7 unit oracle for activation schedule review"
generates:
  - artifact_path: docs/plans/PLAN-L6-41-vmodel-activation-profile-join.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/vmodel-activation-profiles.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-384-route-filing-review-surface.md
  requires:
    - PLAN-L7-384-route-filing-review-surface
  references:
    - docs/governance/vmodel-upgrade-schedule.md
    - docs/governance/vmodel-activation-profiles.md
---

# PLAN-L6-41: activation profile schedule join contract

## 0. 役割

本 PLAN は U7a として、`Vモデル設計ドキュメント_clean.zip` の profile / WBS / typed detection 方針を
HARNESS の activation profile authoring source と工程表 join 契約へ落とす。

## 1. 設計内容

1. `docs/governance/vmodel-activation-profiles.md` を activation profile の第一入力にする。
2. `parseActivationEntries` は profile authoring row を PLAN frontmatter fallback より優先する。
3. `joinActivationScheduleReviews` は `activation_entries` と `schedule_entries` を `plan_id` で join し、現在地、RAG、V-pair、対象/除外/延期理由を read-model にする。
4. 検出系は join read-model を読むだけで、profile / 工程表 / PLAN を暗黙更新しない。

## 2. 不変条件

- `scope_status=deferred|out_of_scope` は `defer_reason` 必須。
- 工程表に存在しない `target_kind=plan` は `activation-schedule-missing` finding とし、工程行を創作しない。
- `activation_schedule_reviews` は query/read-model であり、authoring source ではない。

## 3. DoD

- [x] L4/L5/L6 に ActivationScheduleReview と join 契約がある。
- [x] L7 unit-test-design に U-ACTIVATION-SCHEDULE oracle がある。
- [x] activation profile authoring source が governance 配下にある。
