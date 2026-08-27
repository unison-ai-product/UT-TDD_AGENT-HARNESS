---
plan_id: PLAN-REVERSE-518-review-request-retraction-backfill
title: "PLAN-REVERSE-518: review request retraction backfill"
kind: reverse
layer: cross
drive: fullstack
route_signal: design_gap
route_mode: reverse
status: draft
workflow_phase: R0
confirmed_reverse_type: design
created: 2026-08-27
updated: 2026-08-27
owner: PO / TL
github_issue_id: 439
parent_design: docs/plans/PLAN-L7-518-review-request-retraction.md
pair_artifact: docs/test-design/harness/L7-review-request-retraction-test-design.md
agent_slots:
  - role: qa
    slot_label: "QA - exact HEAD で権限逸脱・class 述語・append-only 性・gate 除外を独立変異で再検証する"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-518-review-request-retraction-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-518-review-request-retraction.md
  requires: []
  blocks: []
  references:
    - docs/test-design/harness/L7-review-request-retraction-test-design.md
review_evidence: []
---

# PLAN-REVERSE-518

## R0

Forward 契約の pair-freeze 中。freeze 後の実装 PR で R1 へ移り candidate を正式 oracle へ昇格し、
R2 で retraction 権限・class 別述語・append-only 性・merge gate 除外を独立変異、R3 で PR #430 /
PR #441 の実事例 fixture を aggregate 検収し、R4 で上位契約へ再合流する。

R2 で必ず攻撃側から検証する項目: verdict 済 request を retract できないこと、reviewer family が
一方的に無効化できないこと、`unclosable` を自己申告で通せないこと、retracted 単独で
`merge_ready` へ到達しないこと。いずれも「retraction が fail-close gate からの self-service
脱出口にならない」という契約の中心主張を否定しにいく変異である。
