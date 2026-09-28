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
updated: 2026-09-28
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
    slot_label: Sol / Claude Opus - L6-101 受入契約と L7-531 受入契約の境界を逆向き検証する
  - role: qa
    slot_label: Terra - CANDIDATE-ST-PACKCANARY-001..010 を独立照合し、silent fallback と
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
    - docs/plans/PLAN-L7-628-pack-consumer-runtime-release-install.md
    - docs/plans/PLAN-REVERSE-515-pack-remote-canary-publication-backfill.md
    - docs/plans/PLAN-REVERSE-516-pack-self-contained-consumer-runtime-backfill.md
    - docs/plans/PLAN-REVERSE-628-pack-consumer-runtime-release-install-backfill.md
    - docs/test-design/harness/L12-pack-internal-canary-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/418
review_evidence: []
workflow_phase: R0
status: draft
github_issue_id: 418
admission_receipt:
  schema_version: v2
  receipt_id: certificate:e5c76417cdee85d0977ab185a93b0d10
  command_id: plan-revise:issue-418:531-canary2-contract:reverse:r4:70a4e908479e
  admitted_at: 2026-09-28T11:19:30.305Z
  source_digest: sha256:c5e9a8f7a430039cac5ea39de794bcea933aad3c3f9fad03a57b8a4d6bcf754d
  decision_digest: sha256:04cc308554c855140b6c22a023ea783bd4cd3be76af1aba8c0c34f502f5e73f1
  receipt_digest: sha256:2f116763c19c5684f043493cb9222ddbd64fc6cb973b739643321f2297d33ddf
  binding:
    path: docs/plans/PLAN-REVERSE-531-pack-internal-canary-smoke-backfill.md
    plan_id: PLAN-REVERSE-531-pack-internal-canary-smoke-backfill
    asset_id: plan:c789d97c71c9a9c07942983de88b71ab
    revision: 4
    content_digest: sha256:c5e9a8f7a430039cac5ea39de794bcea933aad3c3f9fad03a57b8a4d6bcf754d
  route:
    signal: reverse
    mode: reverse
  issue:
    provider: github
    issue_id: 418
    episode_id: E4-418-pack-internal-canary-smoke
    projection_state: unprojected
  origin:
    plan_id: PLAN-L7-516-pack-self-contained-consumer-runtime
    revision: 4
    digest: sha256:6e4e0d5516e78e7465d260c65482e3302c9304518eb264d39735d049c166a316
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L7-531-pack-internal-canary-smoke
    target_revision: 4
    phase: forward_merge
  escape_reason: "Issue #418 PR #731 Sol r1 FLAG の是正に合わせ、Reverse R2 の Candidate
    005(d) / 009(b) 記述を追随させる。"
---

# PLAN-REVERSE-531: Pack-only internal canary smoke の逆向き確認

## R0: 対象境界

Issue #418 の clean Pack-only smoke を、confirmed `PLAN-L7-628` の producer/installer 契約
(exact 5 asset + anchor)、`PLAN-L7-515` の human-approved 公開、`PLAN-L7-516` の consumer-local
sealed runtime、`PLAN-L6-101` の consumer 隔離受入の接合面として確認する。L6 が所有する immutable
release identity、source 非依存、A/B 隔離、typed deny、fail-close を別の仕様として再定義しない。
L7-531 はこれらを受入契約 (§3)、fixture 契約 (§4)、smoke 手順 (§5) と候補 oracle (§7) へ降下
するだけであり、`PLAN-L7-628` の producer/installer semantics 自体は再所有しない。

## R1: Forward 契約の逆向き分解

- **入力 artifact の受入契約 (2026-09-28 改訂、旧二層 2-asset 契約からの置換)**: 第 1 層 (CI、
  offline) は一時 clean root で実 producer が fixture tag で出力した 5 asset を実 installer で
  install する fixture (自己計算 anchor、受入の信頼根ではない)、第 2 層 (受入、
  human-triggered 1 回) は公開済み `v0.2.0-canary.2` の exact 5 asset + `PLAN-L7-628` §6.2 の
  installer コマンド (`--expected-consumer-digest` は `PLAN-L7-531` §3.4 の publish 記録の anchor)。旧 `v0.2.0-canary.1` の exact 2
  asset 契約 (`PLAN-L7-515` 由来) は `PLAN-L7-628` 確定により置換され、代替案として並存しない。
  第 2 層の anchor 照合・自己 digest 照合は `PLAN-L7-628` §6.1/§6.2 が所有する deny semantics で
  あり、本 PLAN はそれを clean fixture の実 Release で E2E 観測するだけである
  (`CANDIDATE-ST-PACKCANARY-005`・`008`)。
- **`PLAN-L7-628` から割り当てられた所有**: §5.7 の publish 記録の様式 (`PLAN-L7-531` §3.4、
  `CANDIDATE-ST-PACKCANARY-005`・`009`) と §6.2 手順 7 の `doctor --setup-smoke`・guard hook E2E
  観測 (`PLAN-L7-531` §3.5、`CANDIDATE-ST-PACKCANARY-007`・`010`)。これは 628 semantics の
  再所有ではなく、628 が明示的に 531 へ置いた未所有面の引き受けである。
- **installer 実装状態 (2026-09-28 実測)**: `PLAN-L7-628` の producer (PR-1、
  `src/cli/distribution.ts`) は main 到達済みだが、installer (PR-2、
  `src/setup/consumer-runtime-release.ts` の anchor 照合と `setup --consumer-runtime-release`
  CLI surface) は main 未到達で、open PR #726 として review 中である (`git log origin/main --
  src/setup/consumer-runtime-release.ts` は producer 側 commit `f27911fb`/`deeeab00` のみ、
  `gh pr view 726` は state=OPEN)。本 PLAN の実装 PR (PR-1・PR-2、§6) は installer (#726) の
  main 到達を前提とする。本 R0〜R4 の docs 改訂そのものは #726 merge を前提にしない。
- **source 非依存**: `CANDIDATE-PACKISO-001` (source 不在での独立導入) を再所有せず、Pack 取得元
  checkout の物理削除後・別 cwd からの wrapper 起動 (`CANDIDATE-ST-PACKCANARY-003`) として
  L12 で具体化する。
- **exact 5 asset と tag exact match**: `PLAN-L6-63` の「semver/tag は表示・取得 locator であり
  release identity の代替ではない」を、legacy 3 asset release と旧 2 asset 形式の
  `v0.2.0-canary.1` の誤取得 deny (`CANDIDATE-ST-PACKCANARY-006`) へ降下する。
- **acceptance evidence の帰属**: source-CLI helper (`tests/support/pack-consumer-runtime.ts`、
  `--consumer-runtime-input`) の Green を #418 受入証跡として誤引用しないことを
  `CANDIDATE-ST-PACKCANARY-009` へ降下する。
- **再起動相当**: `PLAN-L7-516` §2.2 の single active pointer 解決が、別 process/cwd/env clear
  後も同一 sealed generation へ束縛されること (`CANDIDATE-ST-PACKCANARY-007`)。

## Backprop scope

| 層 | 判定 | 根拠 |
| --- | --- | --- |
| requirements | not_impacted | Pack 独立配布と human-approved internal canary の既存要求を変更しない。 |
| L4-basic-design | not_impacted | source、Pack、consumer の責務境界を変更しない。 |
| L5-detailed-design | not_impacted | 新規 DB/schema や共有状態を追加しない。 |
| L6-function-design | not_impacted | 段階公開、release identity、consumer 隔離、fail-close の正本は `PLAN-L6-63` / `PLAN-L6-101` に保持する。 |
| L7-unit-test-design | not_impacted | 既存 `U-PACKISO-*` / `U-PACKNODE-*` / `U-PACKBUN-*` / `CANDIDATE-U-PACKRT-*` (`PLAN-L7-628` 所有) を変更しない。 |
| L12-acceptance-test-design | updated | `CANDIDATE-ST-PACKCANARY-001..010` を pair artifact に固定し、実装 PR-2 で `AT-DIST-002` 行を L12 受入設計へ追記する。 |

## R2: candidate / oracle 対応

| Candidate | 実装 PR | Red 入力 | Green oracle |
| --- | --- | --- | --- |
| 001 | PR-1 | source-only / absolute path の混入 | clean inventory 内だけに出荷 |
| 002 | PR-1 | authoring/skills entry の欠落・重複 | exact-one inventory の fail-close |
| 003 | PR-1 | setup 元撤去後の起動で外部 path へ解決 | sealed runtime のみで起動、外部参照は typed deny |
| 004 | PR-1 | generated wrapper/config/state に setup 元 absolute path | 参照 0 |
| 005 | PR-2 | 取得 5 asset のいずれかを 1 byte 変異 (tar.gz 系 / mjs・json / `.consumer.sha256`)、または publish 記録の 6 値のいずれかで producer 値・独立再計算値の欠落 / 不一致 | tar.gz 系は runner の publish 記録照合、mjs・json は runner 照合 (対照で 628 手順 1)、`.consumer.sha256` は 628 手順 0、記録側の欠落 / 不一致は runner が installer 起動前に deny |
| 006 | PR-1 (第 1 層) / PR-2 (受入) | legacy 3 asset release、3 asset (`.manifest.json` 付き) の `v0.2.0-canary.1`、`latest`/prefix 解決、asset 欠落/余剰 | exact 5 asset + tag exact match 以外を deny |
| 007 | PR-1 | 実 producer/installer で install 後に撤去、別 process/cwd/env clear で再起動、`bun` を PATH に置く | `doctor --setup-smoke` と PLAN/DB/doctor/review smoke 再現、Bun trace 0 |
| 008 | PR-2 | 実 Release asset に対し `--expected-consumer-digest` を未指定・形式違反・値不一致にする | `PLAN-L7-628` §6.2 手順 0 の `consumer_runtime_anchor_mismatch` deny、consumer root へ 1 byte も書かれない |
| 009 | PR-2 (CI offline) | runner を `--consumer-runtime-input` 経路へ差し替え / anchor を `<release-dir>` から再計算 / 受入記録 tag を exact 以外に | 整合的偽造 release-dir + 5 asset entry を偽造側に合わせ anchor だけ真正値に固定した記録 (他 guard が全て通る対照) で anchor_mismatch deny、spawn 引数 assert、tag 非 exact で受入記録を生成しない |
| 010 | PR-1 (第 1 層) / PR-2 (第 2 層) | 生成 hook の work-guard が正常系も block / 撤去済み path を指して素通り / 禁止系を通す | 登録 command 文字列のまま正常系通過・禁止系 block |

## R3: gap 分類と backfill

非著者の claim-blind / spec-blind review が、次を攻撃する。

- silent fallback (setup 元 checkout や `src/cli.ts` への解決) を Green と誤認していないか
- legacy 3 asset release や旧 2-asset 形式の `v0.2.0-canary.1` を `v0.2.0-canary.2` の exact 5
  asset と誤認していないか
- receipt の申告 digest を信用し、bytes からの独立再計算を省いていないか
- partial install / consumer root 外 write を成功扱いしていないか
- anchor 未指定・形式違反の install 経路が残っていないか (`PLAN-L7-628` §6.1 の信頼根を弱めて
  いないか)
- 第 1 層 (fixture tag・自己計算 anchor) Green を第 2 層 (実 Release 受入) の証跡へ読み替えていないか
- 第 2 層が anchor を publish 記録ではなく Release 自身から再計算していないか (照合の恒真化)
- installer が照合しない `<tag>.tar.gz` 系の完全性を publish 記録照合で見ているか
- guard hook が撤去後の consumer で素通り・全 block になっていないか
- source-CLI helper (`--consumer-runtime-input`) の Green を #418 の acceptance evidence として
  引用していないか
- `PLAN-L7-628` の installer semantics (PR-2、#726) を本 PLAN が re-own していないか

gap は L7-531 の contract 改訂 (revision N+1) で閉じ、L6 契約の変更が必要なら
`backprop_decision` を `required` へ改訂して `PLAN-L6-101` へ戻す。

## R4: Forward 再合流条件

- `PLAN-L7-628` PR-2 (installer、open PR #726) が main へ到達していること。本 PLAN の PR-1・PR-2
  (第 1 層 CI smoke・第 2 層受入 run 配線) はいずれもこれを前提とする。
- PR-1 (第 1 層) と PR-2 (第 2 層) が別 PR で main 到達し、各々の exact HEAD に Linux/Windows/
  aggregate Green と成果物を書いていない族 (cross-family) の canonical non-author closing receipt (PR-0 は Claude 起票のため Codex 族、Codex worker が書く PR-1 / PR-2 は Claude 族)が存在する。
- `CANDIDATE-ST-PACKCANARY-001..010` が同番号の `U-ST-PACKCANARY-*` へ 1:1 昇格し、
  同一 implementation revision の Red→Green 実測を引用している。
- `v0.2.0-canary.2` の `PLAN-L7-531` §3.4 publish 記録 (producer 値と独立再計算値の一致) と、第 2 層で取得した asset の sha256・anchor 照合が一致している。
- #364 の後続 slice (Product A/B、stable 昇格) を本 PLAN の完了に含めない。

## Scope boundary

`PLAN-L7-515` / `L7-516` / `L7-508` / `L7-522` / `L7-527` / `L7-528` / `L7-530` / `L7-628` の
所有 oracle を再宣言しない。#424 の provider parity、#414 の remote mutation、#487 の Bun
物理撤去、`PLAN-L7-628` の producer/installer 内部 semantics は入力契約としてのみ参照する。
