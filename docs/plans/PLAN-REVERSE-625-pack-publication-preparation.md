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
status: confirmed
github_issue_id: 625
admission_receipt:
  schema_version: v2
  receipt_id: certificate:17fb3b4187073dd233a498a606f7b161
  command_id: plan-revise:issue-625:reverse:2
  admitted_at: 2026-09-16T09:02:00.000Z
  source_digest: sha256:6e6d5a741ce160f3c3833809586e0e3683092bf05b46b83d982b842a882ad872
  decision_digest: sha256:12256fd1b6b73e28ac58fcfc11cf945411ed896acb4d1d0276a0559e9a426a8f
  receipt_digest: sha256:088d022bade6cfbb7744f602cc25ce8c31bce680e37d7a32e45cb1f8e0f2a382
  binding:
    path: docs/plans/PLAN-REVERSE-625-pack-publication-preparation.md
    plan_id: PLAN-REVERSE-625-pack-publication-preparation
    asset_id: plan:18a3e140dc9b81cafab45c531089904b
    revision: 2
    content_digest: sha256:6e6d5a741ce160f3c3833809586e0e3683092bf05b46b83d982b842a882ad872
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
    revision: 2
    digest: sha256:442bc8d61c6d3defec77c870311eef8c4f9773875367f1b71045a513d3622313
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L7-625-pack-publication-preparation
    target_revision: 2
    phase: forward_merge
  escape_reason: "Issue #625 の add-impl を必須 Reverse
    pairingへbackfillし、既存準備契約とoracleを変更せず再合流する。"
---

# PLAN-REVERSE-625: Pack公開準備の必須Reverse pairing backfill

## R0: gap

`PLAN-L7-625-pack-publication-preparation` は新しい preparation 境界を定義する `kind: add-impl` だが、起票時点で Reverse pairing が欠落していた。この Reverse は既存の preparation 契約を変更せず、必要な設計 backfill と双方向リンクを追加する。

## R1: 上位不変条件

sealed staging identity、branch/PR preparation、atomic no-clobber receipt、remote write 0、および #626/#627 への所有分離は `PLAN-L7-625` の記述をそのまま維持する。Reverse は runtime implementation、telemetry、既存 receipt chainを追加しない。

## R2: 逆向き証明

- Forward PLAN の `dependencies.requires` が本 Reverse を参照し、Reverse の `dependencies.parent` が Forward PLAN を参照するため、required add-impl の双方向 pairing を満たす。
- pair test-design の CANDIDATE-PACKPUB-PREP-001..008 は既存 preparation oracleを一対一で保持し、新しい実装責務を発生させない。
- receipt は canonical `plan draft` / `plan revise` の出力を使い、既存 recordを改変・再計算・削除しない。

## R3: 攻撃面

Reverseをreferencesだけに置く片肺リンク、Forwardのrequiresをdraft artifactで満たしたとする偽装、preparation実装への新規差分、telemetry規則の緩和、既存receiptの上書きや再利用を拒否する。

## R4: Forward再合流

Forward PLAN revision 2 と Reverse PLAN draft が同一の issue #625、pair test-design、exact receipt projectionへ束縛され、backfill doctorが `reverseOrphans 0 / reverseLinkMissing 0` を返した後に、Forward implementationへ合流する。
`PLAN-L7-625` の status は実装完了・非著者closing evidence取得まで draft のまま保持する。
