---
plan_id: PLAN-REVERSE-531-pack-internal-canary-smoke-backfill
title: "PLAN-REVERSE-531: Pack-only internal canary smoke backfill"
kind: reverse
layer: cross
drive: agent
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
created: 2026-09-10
updated: 2026-09-10
owner: Claude / Fable (pair-freeze) · Codex worker (implementation)
forward_routing: gap-only
promotion_strategy: reuse-as-is
backprop_decision: not_required
backprop_decision_reason: PLAN-L6-101 の consumer 隔離・source 非依存受入契約と PLAN-L6-63 の
  immutable release identity を変更せず、clean Pack-only fixture の smoke 実測を L7/L12
  へ具体化するだけのため。
parent_design: docs/plans/PLAN-L7-531-pack-internal-canary-smoke.md
pair_artifact: docs/test-design/harness/L12-pack-internal-canary-test-design.md
agent_slots:
  - role: tl
    slot_label: Sol / Claude Opus - L6-101 受入契約と L7-531 二層入力契約の境界を逆向き検証する
  - role: qa
    slot_label: Terra - CANDIDATE-ST-PACKCANARY-001..007 を独立照合し、silent fallback と
      legacy release 誤取得を攻撃する
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-531-pack-internal-canary-smoke-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-531-pack-internal-canary-smoke.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
    - docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
    - docs/plans/PLAN-L7-508-pack-publication-staging-auditor.md
    - docs/plans/PLAN-L7-515-pack-remote-canary-publication.md
    - docs/plans/PLAN-L7-516-pack-self-contained-consumer-runtime.md
    - docs/plans/PLAN-REVERSE-515-pack-remote-canary-publication-backfill.md
    - docs/plans/PLAN-REVERSE-516-pack-self-contained-consumer-runtime-backfill.md
    - docs/test-design/harness/L12-pack-internal-canary-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/418
review_evidence: []
workflow_phase: R0
status: draft
github_issue_id: 418
admission_receipt:
  schema_version: v2
  receipt_id: certificate:52eba0ab1e5b4e8fa1407ddbb36b5296
  command_id: plan-revise:issue-418:reverse:2
  admitted_at: 2026-09-10T10:27:51.659Z
  source_digest: sha256:1ab94c0a9676ee3c2df7b95b34bb11d154417bb2daf14a899f4cbc6bb04ca64c
  decision_digest: sha256:62dd7163f12ed450694d929543a4ea9042978d4c0167c2ab88980d009ca04780
  receipt_digest: sha256:fa3a2da8c03bcced44b61ec9536fa5a21d22549ae3b881a784e4dd6a8eba7521
  binding:
    path: docs/plans/PLAN-REVERSE-531-pack-internal-canary-smoke-backfill.md
    plan_id: PLAN-REVERSE-531-pack-internal-canary-smoke-backfill
    asset_id: plan:c789d97c71c9a9c07942983de88b71ab
    revision: 2
    content_digest: sha256:1ab94c0a9676ee3c2df7b95b34bb11d154417bb2daf14a899f4cbc6bb04ca64c
  route:
    signal: reverse
    mode: reverse
  issue:
    provider: github
    issue_id: 418
    episode_id: E4-418-pack-internal-canary-smoke
    projection_digest: sha256:0000000000000000000000000000000000000000000000000000000000000000
  origin:
    plan_id: PLAN-L7-516-pack-self-contained-consumer-runtime
    revision: 4
    digest: sha256:6e4e0d5516e78e7465d260c65482e3302c9304518eb264d39735d049c166a316
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L7-531-pack-internal-canary-smoke
    target_revision: 2
    phase: forward_merge
  escape_reason: "Issue #418 PR #560 Codex FLAG: family-neutral non-author closing
    receipt obligation"
---

# PLAN-REVERSE-531: Pack-only internal canary smoke の逆向き確認

## R0: 対象境界

Issue #418 の clean Pack-only smoke を、`PLAN-L7-508` の sealed local staging、
`PLAN-L7-515` の human-approved 公開、`PLAN-L7-516` の consumer-local sealed runtime、
`PLAN-L6-101` の consumer 隔離受入の接合面として確認する。L6 が所有する immutable release
identity、source 非依存、A/B 隔離、typed deny、fail-close を別の仕様として再定義しない。
L7-531 はこれらを二層入力契約 (§3)、fixture 契約 (§4)、smoke 手順 (§5) と候補 oracle
(§7) へ降下するだけである。

## R1: Forward 契約の逆向き分解

- **入力 artifact の二層化**: 第 1 層 (CI、offline) は `PLAN-L7-508` の sealed staging result、
  第 2 層 (受入、human-triggered 1 回) は公開済み `v0.2.0-canary.1` の exact 2 asset。両層は
  asset SHA-256/size の byte 一致 (`CANDIDATE-ST-PACKCANARY-005`) でのみ接合する。
  `PLAN-L7-515` §2 が asset bytes を sealed intent に含める契約が、この接合の根拠である。
- **source 非依存**: `CANDIDATE-PACKISO-001` (source 不在での独立導入) を再所有せず、Pack 取得元
  checkout の物理削除後・別 cwd からの wrapper 起動 (`CANDIDATE-ST-PACKCANARY-003`) として
  L12 で具体化する。
- **exact 2 asset と tag exact match**: `PLAN-L6-63` の「semver/tag は表示・取得 locator であり
  release identity の代替ではない」を、legacy 3 asset release の誤取得 deny
  (`CANDIDATE-ST-PACKCANARY-006`) へ降下する。
- **再起動相当**: `PLAN-L7-516` §2.2 の single active pointer 解決が、別 process/cwd/env clear
  後も同一 sealed generation へ束縛されること (`CANDIDATE-ST-PACKCANARY-007`)。

## Backprop scope

| 層 | 判定 | 根拠 |
| --- | --- | --- |
| requirements | not_impacted | Pack 独立配布と human-approved internal canary の既存要求を変更しない。 |
| L4-basic-design | not_impacted | source、Pack、consumer の責務境界を変更しない。 |
| L5-detailed-design | not_impacted | 新規 DB/schema や共有状態を追加しない。 |
| L6-function-design | not_impacted | 段階公開、release identity、consumer 隔離、fail-close の正本は `PLAN-L6-63` / `PLAN-L6-101` に保持する。 |
| L7-unit-test-design | not_impacted | 既存 `U-PACKISO-*` / `U-PACKNODE-*` / `U-PACKBUN-*` を変更しない。 |
| L12-acceptance-test-design | updated | `CANDIDATE-ST-PACKCANARY-001..007` を pair artifact に固定し、実装 PR-2 で `AT-DIST-002` 行を L12 受入設計へ追記する。 |

## R2: candidate / oracle 対応

| Candidate | 実装 PR | Red 入力 | Green oracle |
| --- | --- | --- | --- |
| 001 | PR-1 | source-only / absolute path の混入 | clean inventory 内だけに出荷 |
| 002 | PR-1 | authoring/skills entry の欠落・重複 | exact-one inventory の fail-close |
| 003 | PR-1 | setup 元撤去後の起動で外部 path へ解決 | sealed runtime のみで起動、外部参照は typed deny |
| 004 | PR-1 | generated wrapper/config/state に setup 元 absolute path | 参照 0 |
| 005 | PR-2 | 公開 asset の SHA-256/size を 1 byte 変異 | 第 1 層 staging receipt と不一致で `mismatch` deny |
| 006 | PR-1 (unit) / PR-2 (受入) | legacy 3 asset release、`latest`/prefix 解決、asset 欠落/余剰 | exact 2 asset + tag exact match 以外を deny |
| 007 | PR-1 | 別 process/cwd/env clear 後の再起動、`bun` を PATH に置く | smoke 再現、Bun trace 0 |

## R3: gap 分類と backfill

非著者の claim-blind / spec-blind review が、次を攻撃する。

- silent fallback (setup 元 checkout や `src/cli.ts` への解決) を Green と誤認していないか
- legacy 3 asset release を exact 2 asset と誤認していないか
- receipt の申告 digest を信用し、bytes からの独立再計算を省いていないか
- partial install / consumer root 外 write を成功扱いしていないか
- 第 1 層 Green を第 2 層 (受入) の証跡へ読み替えていないか

gap は L7-531 の contract 改訂 (revision N+1) で閉じ、L6 契約の変更が必要なら
`backprop_decision` を `required` へ改訂して `PLAN-L6-101` へ戻す。

## R4: Forward 再合流条件

- PR-1 (第 1 層) と PR-2 (第 2 層) が別 PR で main 到達し、各々の exact HEAD に Linux/Windows/
  aggregate Green と成果物を書いていない族 (cross-family) の canonical non-author closing receipt (PR-0 は Claude 起票のため Codex 族、Codex worker が書く PR-1 / PR-2 は Claude 族)が存在する。
- `CANDIDATE-ST-PACKCANARY-001..007` が同番号の `U-ST-PACKCANARY-*` へ 1:1 昇格し、
  同一 implementation revision の Red→Green 実測を引用している。
- `v0.2.0-canary.1` の publication receipt と第 2 層の再計算 digest が一致している。
- #364 の後続 slice (Product A/B、stable 昇格) を本 PLAN の完了に含めない。

## Scope boundary

`PLAN-L7-515` / `L7-516` / `L7-508` / `L7-522` / `L7-527` / `L7-528` / `L7-530` の所有
oracle を再宣言しない。#424 の provider parity、#414 の remote mutation、#487 の Bun
物理撤去は入力契約としてのみ参照する。
