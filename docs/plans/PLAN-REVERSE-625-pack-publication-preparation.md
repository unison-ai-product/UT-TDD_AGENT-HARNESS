---
plan_id: PLAN-REVERSE-625-pack-publication-preparation
title: "PLAN-REVERSE-625: Pack公開準備の必須Reverse pairing backfill"
kind: reverse
layer: cross
drive: agent
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
created: 2026-09-16
updated: 2026-09-16
owner: Luna worker（契約backfill）・Claude Opus（非著者検収）
forward_routing: gap-only
promotion_strategy: reuse-as-is
parent_design: docs/plans/PLAN-L7-625-pack-publication-preparation.md
pair_artifact: docs/test-design/harness/L7-pack-publication-preparation-test-design.md
agent_slots:
  - role: tl
    slot_label: Claude Opus - add-implとReverseの双方向pairingを非著者検証する
  - role: qa
    slot_label: Terra - preparation境界と既存oracleの整合を検証する
generates: []
dependencies:
  parent: docs/plans/PLAN-L7-625-pack-publication-preparation.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-625-pack-publication-preparation.md
    - docs/test-design/harness/L7-pack-publication-preparation-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/625
review_evidence: []
workflow_phase: R0
status: draft
github_issue_id: 625
admission_receipt:
  schema_version: v2
  receipt_id: certificate:703b049560bb27e11f7d79b27f1fd71d
  command_id: plan-revise:issue-625:reverse:3
  admitted_at: 2026-09-16T09:57:27.846Z
  source_digest: sha256:f7677a1f64b71168b9fe418b15f490b332f8ba11719e3f5def763c931116e76d
  decision_digest: sha256:d24838a5d5e797e47f3585e699c040ad95c017456cfec92ac8d5f7c388b0491a
  receipt_digest: sha256:e4d89493a298444e9dc0d4f685f40daff5bb13cace3b9abbcdbb39547cf203cd
  binding:
    path: docs/plans/PLAN-REVERSE-625-pack-publication-preparation.md
    plan_id: PLAN-REVERSE-625-pack-publication-preparation
    asset_id: plan:18a3e140dc9b81cafab45c531089904b
    revision: 3
    content_digest: sha256:f7677a1f64b71168b9fe418b15f490b332f8ba11719e3f5def763c931116e76d
  route:
    signal: reverse
    mode: reverse
  issue:
    provider: github
    issue_id: 625
    episode_id: E4-625-pack-publication-preparation
    projection_digest: sha256:352492d0ba7b458d19ae625367e1cf23d3d3379b3ef05e28f87aa10f475b721f
  origin:
    plan_id: PLAN-L7-625-pack-publication-preparation
    revision: 3
    digest: sha256:599412f2b55d4ae22d5e1a676b62127e968b4f564004be6705f40a837c2f90f3
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L7-625-pack-publication-preparation
    target_revision: 3
    phase: forward_merge
  escape_reason: "Issue #625 の必須 Reverse pairing を draft references として維持し、Forward
    requires から切り離す。"
---

# PLAN-REVERSE-625: Pack公開準備の必須Reverse pairing backfill

## R0: gap

`PLAN-L7-625-pack-publication-preparation` は新しい preparation 境界を定義する `kind: add-impl` だが、起票時点で Reverse pairing が欠落していた。この Reverse は既存の preparation 契約を変更せず、必要な設計 backfill と双方向リンクを追加する。

## R1: 上位不変条件

sealed staging identity、branch/PR preparation、atomic no-clobber receipt、remote write 0、および #626/#627 への所有分離は `PLAN-L7-625` の記述をそのまま維持する。Reverse は runtime implementation、telemetry、既存 receipt chainを追加しない。

## R2: 逆向き証明

- Forward PLAN の `dependencies.references` が本 Reverse を参照し、Reverse の `dependencies.parent` が Forward PLAN を参照するため、required add-impl の双方向 pairing を満たす。Reverse は R0 の draft として参照され、Forward の required dependency にはならない。
- pair test-design の CANDIDATE-PACKPUB-PREP-001..010 は既存 preparation oracleを一対一で保持し、新しい実装責務を発生させない。
- receipt は canonical `plan draft` / `plan revise` の出力を使い、既存 recordを改変・再計算・削除しない。

## R3: 攻撃面

Forwardのrequiresをdraft artifactで満たしたとする偽装、preparation実装への新規差分、telemetry規則の緩和、既存receiptの上書きや再利用を拒否する。

## R4: Forward再合流

Forward PLAN revision 3 と Reverse PLAN draft が同一の issue #625、pair test-design、exact receipt projectionへ束縛され、backfill doctorが `reverseOrphans 0 / reverseLinkMissing 0` を返した後に、Forward implementationへ合流する。
`PLAN-L7-625` の status は実装完了・非著者closing evidence取得まで draft のまま保持する。
