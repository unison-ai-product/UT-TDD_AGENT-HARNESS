---
plan_id: PLAN-REVERSE-628-pack-consumer-runtime-release-install-backfill
title: "PLAN-REVERSE-628: Pack Release consumer runtime install backfill"
kind: reverse
layer: cross
drive: agent
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
created: 2026-09-18
updated: 2026-09-18
owner: Claude / Opus (pair-freeze) · Codex worker (implementation)
forward_routing: gap-only
promotion_strategy: reuse-as-is
backprop_decision: not_required
backprop_decision_reason: PLAN-L6-101 の source 非依存受入と PLAN-L7-516 の
  consumer-local runtime 契約を変更せず、 その入力を Release asset から供給する producer /
  installer の実測を L7 へ具体化するだけのため。
parent_design: docs/plans/PLAN-L7-628-pack-consumer-runtime-release-install.md
pair_artifact: docs/test-design/harness/L7-pack-consumer-runtime-release-install-test-design.md
agent_slots:
  - role: tl
    slot_label: Claude Opus / Sol - PLAN-L7-516 §11.1 の未所有境界と本 PLAN の asset 契約の整合を逆向き検証する
  - role: qa
    slot_label: Terra - CANDIDATE-U-PACKRT-001..010 を独立照合し、改変 installer と asset 差し替えを攻撃する
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-628-pack-consumer-runtime-release-install-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-628-pack-consumer-runtime-release-install.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
    - docs/plans/PLAN-L7-516-pack-self-contained-consumer-runtime.md
    - docs/plans/PLAN-L7-531-pack-internal-canary-smoke.md
    - docs/test-design/harness/L7-pack-consumer-runtime-release-install-test-design.md
review_evidence: []
workflow_phase: R0
status: draft
github_issue_id: 418
admission_receipt:
  schema_version: v2
  receipt_id: certificate:748ef764bbbea943cee1eb43aee87623
  command_id: plan-draft:issue-418:consumer-runtime-release-install:reverse:1
  admitted_at: 2026-09-18T10:05:41.692Z
  source_digest: sha256:e9ac685853cc3ae356827ae52de627b7e296c87ede7f39717eb7c971ba81680c
  decision_digest: sha256:d2b5387da1a8daceab58cdb89f17d1900d6b5e18581d5f3e13573dcee2ebbeae
  receipt_digest: sha256:b0f22fa3d74ee420ae0d6a23120338e830ebf5ba711cd128c84b432b0b0a3ca5
  binding:
    path: docs/plans/PLAN-REVERSE-628-pack-consumer-runtime-release-install-backfill.md
    plan_id: PLAN-REVERSE-628-pack-consumer-runtime-release-install-backfill
    asset_id: plan:748ef764bbbea943cee1eb43aee87623
    revision: 1
    content_digest: sha256:e9ac685853cc3ae356827ae52de627b7e296c87ede7f39717eb7c971ba81680c
  route:
    signal: reverse
    mode: reverse
  issue:
    provider: github
    issue_id: 418
    episode_id: E4-418-pack-consumer-runtime-release-install
    projection_digest: sha256:0000000000000000000000000000000000000000000000000000000000000000
  origin:
    plan_id: PLAN-L7-516-pack-self-contained-consumer-runtime
    revision: 4
    digest: sha256:6e4e0d5516e78e7465d260c65482e3302c9304518eb264d39735d049c166a316
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L7-628-pack-consumer-runtime-release-install
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue #418 consumer runtime release install Reverse backfill pair (R0)"
---

# PLAN-REVERSE-628: Pack Release consumer runtime install の逆向き確認

## R0: 対象境界

対象は `PLAN-L7-628` の asset 集合 (§3)、`consumer-runtime.json` schema v1 (§4)、producer (§5)、installer (§6)。
consumer-local runtime の原子性・hostile path・history chain (`PLAN-L7-516`)、admission (`PLAN-L7-496`)、
clean source tarball (`PLAN-L7-508`)、clean fixture E2E (`PLAN-L7-531`) は対象外であり、再所有しない。

## R1: Forward 契約の逆向き分解

| 上位契約 | 本 PLAN での具体化 | 照合観点 |
| --- | --- | --- |
| `PLAN-L6-101` source 非依存受入 | Release asset だけから install し、`<release-dir>` 削除後も起動する (C005) | source repo・Pack checkout・producer 端末パスへの参照が 0 か |
| `PLAN-L7-516` §2.1 identity tuple | consumer 固有 field を installer が導出し、残りを asset から取る (§6.3) | tuple の各要素が 1 つの出所に一意に対応し、別の identity authority が生まれていないか |
| `PLAN-L7-516` §11.1 「供給は別責務」 | producer が 5 asset を出力する (§5) | 供給経路が本 PLAN だけに所有され、516 に新 manifest field を足していないか |
| `PLAN-L6-93` Node generation | compiled ESM と receipt を `buildNodeGeneration` で生成する (§5.2) | generation schema を変更していないか、reviewed Node 版を要求しているか |

## R2: candidate / oracle 対応

| 契約軸 | Candidate |
| --- | --- |
| 出力 asset 集合と決定性 | C001 |
| schema v1 の厳格さ | C002 |
| producer 端末情報の非混入 | C003 |
| producer の fail-close と部分出力 0 | C004 |
| Release だけからの install と launcher 起動 | C005 |
| sha256 による完全性 | C006 |
| 自己 digest 照合 | C007 |
| asset 集合の exact 一致 | C008 |
| 同一 release 再実行の冪等性 | C009 |
| 別 release の typed deny | C010 |

## R3: gap 分類と backfill

実装後に、次を gap として分類する。

- 自己 digest 照合が OS (Windows の path 表現、8.3 alias) で誤判定する場合: `PLAN-L7-516` §5 の path 境界へ戻さず、本 PLAN の
  installer 側で正規化を追加する (gap-only)。
- compiled ESM が consumer root 外のファイル (Pack tree の skills / templates 等) を実行時に読む場合: 本 PLAN の範囲外の
  runtime 依存であり、`PLAN-L7-531` の E2E で観測したうえで別 slice に起票する。本 PLAN で黙って asset を増やさない。

## R4: Forward 再合流条件

PR-1 / PR-2 の実測と非著者 review を同一 exact revision に束縛し、`PLAN-L6-101` へ不足差分だけを backfill する。
`PLAN-L7-531` は本 PLAN の asset 集合を入力契約として採用する改訂を別 PR で行う。

## Scope boundary

update / rollback / 異 version 共存 / stable 昇格 (#364)、publication 自動化 (#605 等)、clean fixture E2E (`PLAN-L7-531`) は
本 Reverse の対象外。
