---
plan_id: PLAN-L5-21-semantic-assessment-debt-routing-physical-data
title: "PLAN-L5-21 (add-design/physical-data): semantic self-assessment / debt routing物理設計"
kind: add-design
layer: L5
sub_doc: physical-data
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
agent_slots:
  - role: tl
    slot_label: "TL - applicability/meaning/evidence/debt判定境界"
  - role: se
    slot_label: "SE - assessment/evidence/review/debt projection schema"
  - role: qa
    slot_label: "QA - 163件pending 0、false-green、route欠落"
generates:
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L8-integration-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L4-27-vmodel-semantic-self-audit.md
  references:
    - docs/plans/PLAN-L5-16-vmodel-source-profile-physical-data.md
    - docs/plans/PLAN-L5-19-repository-document-disposition-ledger.md
    - docs/plans/PLAN-L5-20-engine-swap-module-decomposition.md
  blocks:
    - docs/plans/PLAN-L6-76-semantic-assessment-debt-routing-contracts.md
---

# PLAN-L5-21: semantic self-assessment / debt routing物理設計

## 設計範囲

- itemごとにapplicability、HARNESS意味、design/runtime/test/evidence参照、revision/digest、review verdict、severity、debt PLAN、owner、next transitionを保持する。
- `pending_review|verified|partial|gap|profile_conditional|not_applicable`をauthoring語彙とし、DB/detectorは判定を創作しない。
- assessment revisionとreview eventをappend-onlyにし、verified後のsource変更をstaleとして再監査へ戻す。
- `semantic_assessments`、3面別`semantic_assessment_evidence`、append-only`semantic_assessment_reviews`、`semantic_assessment_debt_routes`を分割し、verdict行だけで証拠・承認・routeを代用しない。

## 受入条件

- 163 item exactly once、pending 0、verifiedの3面証拠、partial/gapのdebt route 100%を検証する。
- profile conditional/NAの理由・profile・承認欠落、stale digest、存在確認だけのverifiedを拒否する。
- rebuild後もassessment/review/debt identityとfrontier集計が一致する。
