---
plan_id: PLAN-REVERSE-600-codex-review-wake-backfill
title: "PLAN-REVERSE-600: Codex review wake backfill"
kind: reverse
layer: cross
drive: be
route_signal: reverse
route_mode: reverse
confirmed_reverse_type: fullback
created: 2026-09-16
updated: 2026-09-16
owner: Codex / TL
parent_design: docs/plans/PLAN-L7-600-codex-review-wake-impl.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
forward_routing: gap-only
promotion_strategy: reuse-with-hardening
backprop_decision: not_required
backprop_decision_reason: 既存L6契約へ実装事実を逆向きに束縛するだけで上流要件を変更しない
agent_slots:
  - role: tl
    slot_label: TL - L6 contract と L7 implementation の逆向き整合を検証する
  - role: qa
    slot_label: QA - candidate 昇格と未実装境界を独立照合する
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-600-codex-review-wake-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-600-codex-review-wake-impl.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-600-codex-review-wake-contract.md
    - docs/plans/PLAN-L7-600-codex-review-wake-impl.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/600
review_evidence: []
workflow_phase: R0
status: draft
github_issue_id: 600
admission_receipt:
  schema_version: v2
  receipt_id: certificate:15253ab2eb11638f0ca325f294252b4f
  command_id: plan-draft:issue-600:codex-review-wake-backfill:1
  admitted_at: 2026-09-16T19:05:00+09:00
  source_digest: sha256:6a19e10b05a9b275645c9b9aee3d806dc4a032272358c62391d7600649a1d06f
  decision_digest: sha256:34b5e30c5b28d164f8be1e414ee9177d266867907ea239c1fc1812f504f76aa0
  receipt_digest: sha256:194ed1fb4fe6b1c7dfded9f1c091b57b6b127eb6bd0a9c60b9cecb6e4d9bcce7
  binding:
    path: docs/plans/PLAN-REVERSE-600-codex-review-wake-backfill.md
    plan_id: PLAN-REVERSE-600-codex-review-wake-backfill
    asset_id: plan:15253ab2eb11638f0ca325f294252b4f
    revision: 1
    content_digest: sha256:6a19e10b05a9b275645c9b9aee3d806dc4a032272358c62391d7600649a1d06f
  route:
    signal: reverse
    mode: reverse
  issue:
    provider: github
    issue_id: 600
    episode_id: E4-600-codex-review-wake-contract
    projection_digest: sha256:0000000000000000000000000000000000000000000000000000000000000000
  origin:
    plan_id: PLAN-L7-600-codex-review-wake-impl
    revision: 1
    digest: sha256:acd8cb34e522504adf3c2ef62ca9af2d6c27d64427df7292f6c78e6f16bcc591
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L7-600-codex-review-wake-impl
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue #600 Codex review wake implementation requires reverse backfill trace"
---

# PLAN-REVERSE-600: Codex review wake backfill

## R0: 対象境界

L7 implementation が実装済みの Codex review wake を、L6-600 contract と既存の
Forward spineへ逆向きに束縛する。L6 contract の変更、Claude wake の再設計、review
receipt/custody の変更は扱わない。

## R1: 逆向き照合

- request-before-wake、project-scoped target、typed invalid、FIFO、claim lease、
  terminal retention の実装事実を L6 candidate と突合する。
- targeted test で実測できた candidate だけを U-CODEXWAKE-* として共有 test-design に
  昇格し、未実装境界は candidate のまま保持する。
- source/test の所有は PLAN-L7-600 に残し、本 Reverse は上流への backfill trace と判断記録だけを所有する。

## R2: 合流条件

targeted test、typecheck、Biome、doctor の source/deliverable trace が green であり、
非著者 review が exact HEAD を再検した後に、L6/L3 正本への必要な backfill を判断する。
