---
plan_id: PLAN-REVERSE-77-snapshot-fence-foreign-activity-backfill
title: "PLAN-REVERSE-77: snapshot fence foreign activity 判定の上流backfill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: agent
status: draft
route_signal: drift
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-08-18
updated: 2026-08-18
owner: PM / PO / Codex
parent_design: docs/plans/PLAN-RECOVERY-11-snapshot-fence-foreign-activity.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - fence判定結果とL6テスト衛生契約の差分をbackfill"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-77-snapshot-fence-foreign-activity-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-RECOVERY-11-snapshot-fence-foreign-activity.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-421-test-hygiene-live-tree-fence.md
    - docs/test-design/harness/L7-unit-test-design.md
review_evidence: []
---

# PLAN-REVERSE-77

## R0 予約

実装前のため、上流契約へ反映済みとは主張しない。実装後に、`testOwnedPaths` と
`foreignActivityEvidence` の入力境界、分類不能時の fail-close、残留優先の同時発生規則、
`fence_indeterminate_foreign_activity` (exit code 2) の意味だけを、既存の
`PLAN-L7-421` と L7 test-designへbackfillする。

## R1-R4 条件

- R1: exact implementation HEAD、U-FENCE-001..004、real-repo regressionの存在を確認する。
- R2: foreign-only / residual-only / simultaneous の結果型・exit reason・再実行指示を照合する。
- R3: full suite、doctor、snapshot runnerのCI証跡と、既存の真陽性残留検出を同一revisionで確認する。
- R4: 上流PLANとtest-designへ差分を反映し、foreign activityを理由にtest residualを許可しないことを確認する。

未実測のPASS claim、暗黙のpath allowlist、CI workflow変更はこのReverse PLANへ先行記載しない。
