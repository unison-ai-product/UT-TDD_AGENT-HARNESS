---
plan_id: PLAN-REVERSE-742-release-aggregate-v2-inventory-cardinality-backfill
title: "PLAN-REVERSE-742: PF-5 release aggregate v2 inventory 基数契約の逆向き確認"
kind: reverse
layer: cross
drive: agent
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
created: 2026-09-29
updated: 2026-09-29
owner: Claude control lane (契約 draft) · Codex worker (implementation)
forward_routing: gap-only
promotion_strategy: reuse-as-is
backprop_decision: not_required
backprop_decision_reason: PLAN-L6-63 の immutable release identity / channel
  pointer / aggregate admission の意味は変えず、PF-5 の基数を v2 inventory に合わせて L7
  で具体化するだけのため。 draft PLAN-L6-102 の「channel mapping」単数表現の文言整合は R4 で gap として
  routing する (confirmed 設計の意味変更は伴わない)。
parent_design: docs/plans/PLAN-L7-742-release-aggregate-v2-inventory-cardinality.md
agent_slots:
  - role: tl
    slot_label: Claude Opus / Codex Sol - L6-63 / L6-102 と L7-742 の基数契約の境界を逆向き検証する
  - role: qa
    slot_label: Codex Terra - CANDIDATE-U-RELAGGV2-001..009 を独立照合し、先頭 1 件照合・集合一致への
      弱化・v1 への N 件流入を攻撃する
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-742-release-aggregate-v2-inventory-cardinality-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-742-release-aggregate-v2-inventory-cardinality.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
    - docs/plans/PLAN-L6-102-release-promotion-rollback-gate.md
    - docs/plans/PLAN-L7-492-pf5-release-aggregate-admission-pair-freeze.md
    - docs/plans/PLAN-L7-494-release-promotion-rollback-gate.md
    - docs/plans/PLAN-L7-499-pack-publication-manifest-v2-pure-domain.md
    - docs/plans/PLAN-L7-628-pack-consumer-runtime-release-install.md
    - docs/plans/PLAN-REVERSE-499-pack-publication-manifest-v2-backfill.md
    - docs/plans/PLAN-L7-531-pack-internal-canary-smoke.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/418
review_evidence: []
workflow_phase: R0
status: draft
github_issue_id: 742
admission_receipt:
  schema_version: v2
  receipt_id: certificate:61a67f9437e1fff919b21b9c9c3aa7ce
  command_id: plan-draft:issue-742:aggregate-v2-cardinality:reverse:1
  admitted_at: 2026-09-29T05:04:30.925Z
  source_digest: sha256:967b4b9d14495b311b4d8b14741def2f41ad743ce80f11f65929fd7edf7ea70a
  decision_digest: sha256:dec934fe7f0a473e821cc06f86267076fcbcec7c4e90b166873fee1b4cf318d8
  receipt_digest: sha256:dca61a9bce9faeeb0616d520859ff9526b2de7e331ce9a7c637f71c656aa4fb8
  binding:
    path: docs/plans/PLAN-REVERSE-742-release-aggregate-v2-inventory-cardinality-backfill.md
    plan_id: PLAN-REVERSE-742-release-aggregate-v2-inventory-cardinality-backfill
    asset_id: plan:61a67f9437e1fff919b21b9c9c3aa7ce
    revision: 1
    content_digest: sha256:967b4b9d14495b311b4d8b14741def2f41ad743ce80f11f65929fd7edf7ea70a
  route:
    signal: reverse
    mode: reverse
  issue:
    provider: github
    issue_id: 742
    episode_id: E4-742-release-aggregate-v2-cardinality
    projection_state: unprojected
  origin:
    plan_id: PLAN-L7-492-pf5-release-aggregate-admission-pair-freeze
    revision: 1
    digest: sha256:459b26b7e0abc3dd65a3eab3e5d2c033d2f221abf36cf8b52078cf0c4a0be037
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L7-742-release-aggregate-v2-inventory-cardinality
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue #742: PLAN-L7-742 の v2 基数契約を PLAN-L6-63 / PLAN-L6-102
    へ逆向き照合する Reverse 対の R0 起票。"
---


# PLAN-REVERSE-742: PF-5 release aggregate v2 inventory 基数契約の逆向き確認

## R0: 対象境界

`PLAN-L7-742` が再定義する PF-5 の基数契約 (v1 = exactly-one、v2 = mapping 列と selected release
`artifacts` 列の順序付き完全一致、sealed plan の destination 正本 = `entries[].path`) と、
promotion / rollback gate の aggregate 照合を、上位の `PLAN-L6-63` (段階公開・immutable release
identity) と draft `PLAN-L6-102` (promotion 条件 1 / 5) の意味へ逆向きに照らす。
`PLAN-L7-499` の v2 inventory schema と `PLAN-L7-628` の producer / validator の per-artifact mapping
契約は再所有しない。本 PLAN は R0 起票であり、R1 以降の結論を先取りしない。

## R1: Forward 契約の逆向き分解 (実装 PR 着地後に記入)

- v2 基数: `PLAN-L7-742` §2.1 の条件 1〜4 が、`PLAN-L6-63` の「channel-selected release の artifact を
  allowlist 内の destination へ写像する」意味の multi-artifact への素直な拡張であり、新しい
  admission 意味 (曖昧 mapping の許容、部分公開など) を持ち込んでいないこと。
- 単一正本: sealed plan v2 variant の destination 記録が `entries[].path` の 1 系統だけであり、
  consumer-local admission (`src/setup/consumer-local-runtime-admission.ts` `admitControlManifest`) と
  promotion gate が同じ記録を読むこと。
- v1 不変: v1 の exactly-one と v1 variant の `destinationPath` が `PLAN-L7-492` 凍結時の意味のままであること。
- promotion gate: `PLAN-L6-102` 条件 1 / 5 の「channel mapping」を mapping 集合として読んだとき、
  `PLAN-L7-742` §2.3 の照合 (identity・digest・mapping 列・sealed entries) が条件 5 の相互一致を
  artifact 単位まで満たすこと。

## R2: 実測照合 (実装 PR 着地後に記入)

- `CANDIDATE-U-RELAGGV2-001..009` を独立に再実行し、`PLAN-L7-742` §5 の mutation M1〜M5 がそれぞれ
  対応 oracle を Red にすることを確認する。
- 攻撃観点: (a) 先頭 1 件だけの照合、(b) 集合一致への弱化 (順序入替・重複の見逃し)、(c) v1 へ N 件が
  流入する分岐欠落、(d) sealed plan への第 2 destination 記録の再混入、(e) channel 名 (`stable` /
  `canary`) による結果差。

## R3: gap 判定 (記入予定)

- `PLAN-L6-102` (draft) の条件 1 / 5 の単数表現を文言整合する必要があるか。confirmed 設計の意味変更を
  伴わない限り、`PLAN-L6-102` 所有者の次回改訂へ gap として渡す。
- canary channel 判定規則 (`PLAN-L7-742` §2.4) は本 Reverse の対象外であり、別 sub-issue の結論を待たない。

## R4: Forward への routing (記入予定)

- `forward_routing: gap-only`。gap が `PLAN-L6-102` 文言整合だけであれば、`PLAN-L7-742` を修正せず
  gap を `PLAN-L6-102` へ routing して Forward merge する。
- confirmed 上位設計の意味変更が見つかった場合は `backprop_decision` を `required` へ改め、
  該当設計 PLAN の改訂へ戻す。
