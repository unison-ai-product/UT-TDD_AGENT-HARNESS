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
workflow_phase: R4
status: confirmed
github_issue_id: 742
admission_receipt:
  schema_version: v2
  receipt_id: certificate:bc51003fd1e25ecdb2a494ca1bc25c1b
  command_id: plan-revise:issue-742:s3-confirm:reverse:r3:e3818eab1725
  admitted_at: 2026-09-29T09:42:03.690Z
  source_digest: sha256:92ead765f5804c7bb7a89194609a4f2fbf1bc7e9976085bd197991d30e659e1d
  decision_digest: sha256:48d07faaa0165b98b4f4a1c274bed6280fd2b5226b585d81a46648db8d507d16
  receipt_digest: sha256:7cc9eec20f2c9fe02431e1b22bbea2523bac15e2cf9f4e1f94b5761c181e6657
  binding:
    path: docs/plans/PLAN-REVERSE-742-release-aggregate-v2-inventory-cardinality-backfill.md
    plan_id: PLAN-REVERSE-742-release-aggregate-v2-inventory-cardinality-backfill
    asset_id: plan:61a67f9437e1fff919b21b9c9c3aa7ce
    revision: 3
    content_digest: sha256:92ead765f5804c7bb7a89194609a4f2fbf1bc7e9976085bd197991d30e659e1d
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
    target_revision: 7
    phase: forward_merge
  escape_reason: "Issue #742 S3: PLAN-L7-742 rev 7 の confirmed 化に合わせ、Reverse を R4
    (forward_merge) で閉じる。R2 の M1〜M7 実測 (PR #751: 8 source mutant / 11 probe
    が全て対象 assertion で Red、source は byte 復元) を記録する。"
---


# PLAN-REVERSE-742: PF-5 release aggregate v2 inventory 基数契約の逆向き確認

## R0: 対象境界

`PLAN-L7-742` が再定義する PF-5 の基数契約 (v1 = exactly-one、v2 = mapping 列と selected release
`artifacts` 列の順序付き完全一致、sealed plan の destination 正本 = `entries[].path`) と、
promotion / rollback gate の aggregate 照合を、上位の `PLAN-L6-63` (段階公開・immutable release
identity) と draft `PLAN-L6-102` (promotion 条件 1 / 5) の意味へ逆向きに照らす。
`PLAN-L7-499` の v2 inventory schema と `PLAN-L7-628` の producer / validator の per-artifact mapping
契約は再所有しない。本 PLAN は R0 起票であり、R1 以降の結論を先取りしない。

## R1: Forward 契約の逆向き分解 (PR #751 着地後の記入)

実装 PR #751 (merge `44636a2b`、production 変更は `release-aggregate-admission` /
`consumer-local-runtime-admission` / `release-promotion-rollback-gate` の 3 ファイルのみ) を `PLAN-L7-742`
§2 に照らして分解した結果、以下の不変条件が守られている。

- v2 基数: §2.1 の条件 1〜4 (mapping 列と selected release `artifacts` 列の順序付き完全一致) は、`PLAN-L6-63`
  の「channel-selected release の artifact を allowlist 内の destination へ写像する」意味を multi-artifact へ
  素直に拡張したものであり、曖昧 mapping の許容や部分公開といった新しい admission 意味を持ち込んでいない。
- 単一正本: sealed plan v2 variant の destination 記録は `entries[].path` の 1 系統だけで、スカラー
  `destinationPath` を持たない。consumer-local admission (`admitControlManifest`) と promotion / rollback gate は
  同じ記録を読む。
- v1 不変: v1 の exactly-one と v1 variant の `destinationPath` は `PLAN-L7-492` 凍結時の意味のまま
  (005 / 008(f))。`ReleaseAggregateFinding` の列挙、`src/cli/distribution.ts` / `src/setup/index.ts` /
  `src/setup/consumer-runtime-release.ts` の diff は 0。
- promotion gate: `PLAN-L6-102` 条件 1 / 5 の「channel mapping」を mapping 集合と読んだとき、§2.3 の照合
  (identity・digest・mapping 列・sealed entries) は条件 5 の相互一致を artifact 単位まで満たす。

## R2: 実測照合 (PR #751 本文の記録に基づく)

出典は PR #751 本文「現在の検証証拠」。本 Reverse は再実行結果ではなくこの記録を根拠とする。

- Codex 側の独立 clone で exact `d19c1c26` に対し mutation M1〜M7 を実行した。未変異 probe 9 個は対象 assertion の
  実在と全 pass を確認し、その後 8 source mutant (M1 / M4 は aggregate と promotion を分離、M6 / M7 は共有 shape
  guard) で 11 probe を実行して、全て対象 assertion が Red になり、元 source は byte 一致へ復元された。
  compile / import 失敗や timeout による Red ではない。
- 対応: M1 → 001 / 002 / 007、M2 → 003 / 008(a-f)、M3 → 008(a-f)、M4 → 005 / 008(f)、M5 → 004、
  M6 → 008(g)、M7 → 009(b)。
- 攻撃観点 (a) 先頭 1 件照合、(b) 集合一致への弱化、(c) v1 への N 件流入、(d) 第 2 destination の再混入
  (consumer-local / promotion / rollback の 3 経路)、(e) channel 差 (stable / canary) はいずれも上記 oracle が捕捉する。
- 限界: mutation 実験は canonical Green の代用ではない。実装 exact head `4d270902` の CI (`harness-check`) は
  Green、非著者 Claude Opus の bounded 再検 r2 は PASS (blocking 0)。r1 (`d19c1c26`) は PASS だったが同 head の CI が
  赤だったため証跡には採らず、fixture 是正後の `4d270902` を証跡とした (`PLAN-L7-742` review_evidence)。

## R3: gap 判定

- open な gap はない。`PLAN-L6-102` (draft) の条件 1 / 5 の「channel mapping」単数表現は mapping 集合として読めば
  意味は変わらず、confirmed 設計の意味変更を伴わないため、文言整合は `PLAN-L6-102` 所有者の次回改訂へ渡す軽微な
  文言 gap として記録するに留める (本 Reverse では不要と判定)。
- canary channel 判定規則 (`PLAN-L7-742` §2.4) は本 Reverse の対象外で、別 sub-issue の結論を待たない。

## R4: Forward への routing

- `forward_routing: gap-only`。上記のとおり上位設計の意味変更は見つからず、`backprop_decision: not_required` を維持する。
- `PLAN-L7-742` を修正せず、`PLAN-L7-742` revision 7 (confirmed) への forward_merge へ routing する。
