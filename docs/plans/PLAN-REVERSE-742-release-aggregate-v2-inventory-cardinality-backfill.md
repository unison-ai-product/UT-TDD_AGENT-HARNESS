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
  receipt_id: certificate:d8fe0f9d5b294b85b4c4a158b141170d
  command_id: plan-revise:issue-742:r2-m6-m7:reverse:r2:27d3c89b23c5
  admitted_at: 2026-09-29T06:21:56.502Z
  source_digest: sha256:c8cf7a080ae861b732362b3dfb4c9210699c8c50e85301e5176580c6acb9e5cd
  decision_digest: sha256:309de4e27a843036c157a9bbd3192fd9cf09bcf3b42e09b1e9c0e2f2ac9c154b
  receipt_digest: sha256:e011ad76d63671f96b3aa871de71ba82d9ea1fc609bd7aa7af9cea6b1a0c20bb
  binding:
    path: docs/plans/PLAN-REVERSE-742-release-aggregate-v2-inventory-cardinality-backfill.md
    plan_id: PLAN-REVERSE-742-release-aggregate-v2-inventory-cardinality-backfill
    asset_id: plan:61a67f9437e1fff919b21b9c9c3aa7ce
    revision: 2
    content_digest: sha256:c8cf7a080ae861b732362b3dfb4c9210699c8c50e85301e5176580c6acb9e5cd
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
    target_revision: 6
    phase: forward_merge
  escape_reason: "PR #748 Sol r1 FLAG: Reverse R2 が M1〜M5
    の実測照合しか要求していないため、PLAN-L7-742 rev 6 に合わせて M1〜M7 と 3 経路の第 2 destination
    再混入観点に更新する。"
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

- `CANDIDATE-U-RELAGGV2-001..009` を独立に再実行し、`PLAN-L7-742` §5 の mutation M1〜M7 がそれぞれ
  対応 oracle を Red にすることを確認する (M6 / M7 = promotion / rollback の余剰 destinationPath 負系 008(g) / 009(b))。
- 攻撃観点: (a) 先頭 1 件だけの照合、(b) 集合一致への弱化 (順序入替・重複の見逃し)、(c) v1 へ N 件が
  流入する分岐欠落、(d) sealed plan への第 2 destination 記録の再混入 (consumer-local / promotion / rollback の 3 経路全て)、(e) channel 名 (`stable` /
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
