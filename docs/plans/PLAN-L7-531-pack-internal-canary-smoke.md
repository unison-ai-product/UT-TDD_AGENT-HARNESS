---
plan_id: PLAN-L7-531-pack-internal-canary-smoke
title: "PLAN-L7-531 (add-impl): Pack-only internal canary smoke (Windows/Linux)
  pair-freeze"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-09-10
updated: 2026-09-10
owner: Claude / Fable (pair-freeze) · Codex worker (implementation)
parent_design: docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
pair_artifact: docs/test-design/harness/L12-pack-internal-canary-test-design.md
next_pair_freeze: L12
backprop_decision: required
backprop_decision_reason: clean Pack-only fixture で観測した source 非依存・二層入力接合・exact
  2 asset 照合の実測を PLAN-L6-101 の受入契約と PLAN-L6-63 の段階公開契約へ PLAN-REVERSE-531
  で逆向き検証し、#364 の A/B 完全受入へ再合流させる。
agent_slots:
  - role: se
    slot_label: Luna worker - CI smoke (第 1 層) と受入 run 配線 (第 2 層) を別 PR で最小実装する
  - role: qa
    slot_label: Terra - CANDIDATE-ST-PACKCANARY-001..007 の Red oracle を Linux/Windows で先に作る
  - role: tl
    slot_label: Sol / Claude Opus - source 非依存・二層接合・exact 2 asset の非著者検収
generates:
  - artifact_path: docs/plans/PLAN-L7-531-pack-internal-canary-smoke.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
  requires:
    - docs/plans/PLAN-L7-508-pack-publication-staging-auditor.md
    - docs/plans/PLAN-L7-515-pack-remote-canary-publication.md
    - docs/plans/PLAN-L7-516-pack-self-contained-consumer-runtime.md
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-531-pack-internal-canary-smoke-backfill.md
    - docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
    - docs/plans/PLAN-L7-496-pack-independent-consumer-runtime.md
    - docs/plans/PLAN-L7-522-pack-consumer-bun-path-removal.md
    - docs/plans/PLAN-L7-527-pack-consumer-node-readiness.md
    - docs/plans/PLAN-L7-528-pack-authoring-template-scope.md
    - docs/plans/PLAN-RECOVERY-06-pack-consumer-doctor-profile.md
    - docs/test-design/harness/L12-pack-internal-canary-test-design.md
    - docs/test-design/harness/L12-acceptance-test-design.md
    - tests/distribution-acceptance.test.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/418
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/364
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/420
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/424
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/487
review_evidence: []
status: draft
github_issue_id: 418
admission_receipt:
  schema_version: v2
  receipt_id: certificate:a5ec9ea8f3689c8d24727d97a9804bcf
  command_id: plan-revise:issue-418:forward:2
  admitted_at: 2026-09-10T10:27:51.659Z
  source_digest: sha256:69c9c058d2178425bb0459033b2748785d152d7a9c2a37c01aefbca270709d4e
  decision_digest: sha256:2ee0d06520a02bb49244002124eeb74804bcde3a28cfe21289bb7681a711d12d
  receipt_digest: sha256:4adc16d207f8b7ac617c9fc834a0e6939cd80c2a7bd2c3ca470eb13b61755fe7
  binding:
    path: docs/plans/PLAN-L7-531-pack-internal-canary-smoke.md
    plan_id: PLAN-L7-531-pack-internal-canary-smoke
    asset_id: plan:44f79788376b81c225ce5913fddbc48f
    revision: 2
    content_digest: sha256:69c9c058d2178425bb0459033b2748785d152d7a9c2a37c01aefbca270709d4e
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 418
    episode_id: E4-418-pack-internal-canary-smoke
    projection_digest: sha256:0000000000000000000000000000000000000000000000000000000000000000
  origin:
    plan_id: PLAN-L7-516-pack-self-contained-consumer-runtime
    revision: 4
    digest: sha256:6e4e0d5516e78e7465d260c65482e3302c9304518eb264d39735d049c166a316
  reentry:
    target_plan_id: PLAN-L7-531-pack-internal-canary-smoke
    target_revision: 2
    phase: forward_merge
  escape_reason: "Issue #418 PR #560 Codex FLAG: family-neutral non-author closing
    receipt obligation"
---

# PLAN-L7-531: Pack-only internal canary smoke (Windows/Linux)

## 1. 目的と前提

Issue #418 は、初回 internal canary (`v0.2.0-canary.1`) を、source repository・開発
worktree・開発用 DB/PLAN/evidence・ローカル Pack checkout を実行時入力にしない clean
Pack-only fixture へ導入し、上流開発に必要な最小閉包 (PLAN authoring/lint、DB rebuild、
doctor、review request/receipt/merge gate) が Windows/Linux で成立することを実証する
slice である。#364 の Product A/B 異 version 共存・片系 upgrade/rollback・stable 昇格は
縮小せず、その前段の internal canary gate だけを原子的に所有する。

本 PLAN は pair-freeze であり、実装・Green・canary 公開・#418 の closure を主張しない。

### 1.1 HARD 前提の実測 (2026-09-10)

| #418 の HARD predecessor | 実測 |
| --- | --- |
| #414 minimal Pack canary publication adapter の main 到達 | CLOSED。`PLAN-L7-515` confirmed、PR #466 merge |
| #408 / #134 の Pack・consumer 実行面の Bun 永久 BAN | #408 CLOSED (`PLAN-L7-522` / `L7-527` confirmed)。#134 は親 umbrella として open のまま |
| Pack main protection (PR、required harness-check、human approval) | 有効: required check `harness-check`、approving review 1 |
| #419 admission deny 時の PF5 全 port 0 (U-PACKISO-007) | CLOSED |

### 1.2 起票時点で未充足の入力 (本 PLAN は止めない)

- **`v0.2.0-canary.1` は Pack repository に未公開**。既存 release は `v0.1.0`〜`v0.1.4` で、いずれも
  legacy 3 asset 形式 (`manifest.json` / `tar.gz` / `tar.gz.sha256`) である。v2 契約
  (`PLAN-L7-515`) の exact 2 asset 形式の release は 0 件。公開は human-approved の外向き操作
  であり PO 承認を要する (高影響境界)。本 PLAN では §3 第 2 層の入力前提として扱う。
- **#420 (`PLAN-L7-516`) の physical adapter / setup 配線は実装途中** (PR #555 系列)。#418 の
  「setup 元 Pack checkout と source を消して別 cwd から起動」は `PLAN-L7-516` §6 の破壊的
  checkout 削除 E2E が main へ着地して初めて Green になる。§10 の実装開始条件に置く。
- **#424 (memory / notification root)** は #418 の HARD 前提ではない。本 PLAN の smoke は
  consumer root 内に memory/notification state が閉じることだけを観測し、cross-worktree
  provider parity を主張しない。

### 1.3 先行成果物の採用

Codex worker が 2026-09-08 にローカル branch `feat/issue418-pack-canary-nonbun`
(commit `f3dc2f4a`〜`26bacb9b`、origin 未 push) で、pair artifact
`docs/test-design/harness/L12-pack-internal-canary-test-design.md` と
`tests/pack-internal-canary-boundary.test.ts` (CANDIDATE-ST-PACKCANARY-001..004) を先行
作成している。本 PLAN はこの test-design を pair artifact として採用し、`plan_id` を本 PLAN へ
束縛して §7 の候補 oracle を追補する。test 実装 (`tests/pack-internal-canary-boundary.test.ts`)
は C003/C004 が意図的な Red のため pair-freeze PR に含めず、§6 の PR-1 で Red→Green とともに
取り込む。先行 commit は破棄せず、実装 PR がその上に積む。

## 2. 設計判断: smoke の入力 artifact

advisor 相談: `ut-tdd advisor --decision design --current-model claude-fable-5 --execute`
(2026-09-10、provider=claude、model=claude-fable-5)。推奨は **A**。前提は以下を repo 実測で
検証した。

- `PLAN-L7-515` §2 は release asset の name・順序・size・SHA-256 を sealed publication intent
  に含め、seal 後の bytes 変更を禁止する。したがって `PLAN-L7-508` の sealed local staging
  出力と実公開 asset の byte 同一性は契約で保証され、実測は §3.3 の receipt digest 接合で行う。
- 現行 CI (`harness-check-linux/windows`、`node-generation-*`、aggregate) は GitHub Release へ
  の network fetch を持たない。
- Pack repository の既存 release は legacy 3 asset 形式のみ (§1.2)。

| 案 | 内容 | trade-off | 判定 |
| --- | --- | --- | --- |
| **A (採用)** | CI smoke は `PLAN-L7-508` の sealed local staging 出力 (tar.gz + sha256 + control manifest sidecar) を入力にする。実公開 tag からの取得・照合は L12 受入の human-triggered run 1 回として行い、receipt に束縛する (二層) | offline・決定論・再起動相当後の再現という #418 AC の性格と一致。二層の接合を receipt digest 照合で明文化しないと独立した 2 つの smoke に劣化する | 採用 |
| B | 実公開 `v0.2.0-canary.1` を CI から取得して smoke する | 公開 (PO 承認待ちの外向き操作) が CI の前提条件になる。CI へ network fetch + token read という新しい信頼面を持ち込む | 棄却 |
| C | A の CI 層だけで #418 を閉じ、実 tag 受入を #364 後続へ送る | #418 AC「digest/identity/tag/Pack commit が receipt と一致」は実公開 tag に対する照合を要求しており、C は AC を満たさない。採るなら #418 の scope 縮小 (PO 判断) になる | 棄却 |

1 PR = 1 論点規律との整合: A の二層は契約としては 1 論点 (「canary smoke の入力 artifact
契約」) であり、実装は §6 の通り CI 層 PR と受入配線 PR に分割する。二層を 1 PR に詰めない
(PR #219 と同型の肥大を作らない)。

## 3. 二層入力契約

### 3.1 第 1 層: CI smoke (offline、決定論)

入力は `PLAN-L7-508` が返す sealed staging result だけとする: release identity、source
revision、materializer version、control manifest sidecar、tar.gz と `.sha256` の **exact 2
asset** (name/size/SHA-256)。fixture 生成時に source worktree、directory walk、glob、local Pack
checkout、開発 DB、PLAN 本文、環境変数から entry を補完しない。

第 1 層は Linux/Windows/aggregate の全 CI run で実行し、network・credential・remote mutation を
一切持たない。

### 3.2 第 2 層: 受入 run (human-triggered、1 回)

canary 公開 (PO 承認、`PLAN-L7-515` adapter 経由) の後に、clean fixture から公開済み tag
`v0.2.0-canary.1` の release asset を取得し、次を独立再計算する。

- release asset が **exact 2 件** (tar.gz + `.sha256`) であること。legacy 3 asset 形式の release
  を誤って掴まないよう、tag 名は exact match とし、`latest` / prefix / semver range 解決を禁止する。
- 各 asset の size・SHA-256、control manifest sidecar digest、release identity、annotated tag が
  指す Pack commit/tree が、`PLAN-L7-515` の publication receipt と一致すること。

第 2 層の実行形態 (手動 script か `workflow_dispatch` か) は本 PLAN で決めない。既存前例が
無いため、§6 PR-2 の設計判断節で advisor 相談のうえ確定し、本 PLAN の revision へ記録する。
実行そのものは公開の PO 承認後にのみ行う。

### 3.3 二層の接合 (junction AC)

第 2 層で取得した asset の SHA-256 と size は、第 1 層で使った sealed staging receipt の
asset digest/size と **byte 単位で一致**しなければならない。不一致は `mismatch` として
#418 の受入を deny し、第 1 層 Green を受入証跡へ読み替えない。この接合が二層を 1 つの
smoke に束ねる唯一の根であり、§7 の `CANDIDATE-ST-PACKCANARY-005` が所有する。

## 4. fixture 契約

- consumer root は一時ディレクトリだけを対象とする。開発用 repository、実利用 worktree、
  ユーザーデータを削除して試験しない。
- fixture 内に source repository、source worktree、開発用 DB/PLAN/evidence、Pack 取得元
  checkout が **存在しない** 状態で smoke を実行する。Pack 取得元 checkout は install 後に
  物理削除し、削除した path への read/open/stat を 0 と観測する。
- 起動は `PLAN-L7-516` §2.2 の consumer-local wrapper (`node <consumerRoot>/.ut-tdd/bin/ut-tdd.mjs`)
  のみ。`src/cli.ts`、setup 元 checkout、global `node_modules`、`PATH` 上の任意 CLI へ解決
  した場合は typed deny (`consumer_runtime_external_path` / `consumer_runtime_resolution_denied`)
  とし、silent fallback を Red とする。
- `bun` executable 不在、Bun install/download/invocation trace 0 (`PLAN-L7-522` / `L7-527` の
  deny 契約を再利用し、再所有しない)。
- 再起動相当: 別 process・別 cwd・環境変数を clear した状態で PLAN/DB/doctor/review smoke が
  再現すること。
- 失敗時は consumer root 外への write 0、partial install を成功扱いしない。
- PATH/env/config/log/receipt に source 側 absolute path 参照 0。

## 5. smoke 手順 (第 1 層・第 2 層共通)

1. sealed artifact (第 1 層: staging result、第 2 層: 公開 asset) から clean consumer root を
   materialize し、asset digest と control manifest を独立再計算する。
2. Node/npm で `setup --solo` を実行し、sealed consumer runtime (`PLAN-L7-516`) を配置する。
3. Pack 取得元 checkout と source 参照を fixture から物理削除する。
4. 別 cwd から wrapper を起動し、次の最小閉包を順に実行する:
   PLAN authoring smoke (`PLAN-L7-528` の template scope)、`plan lint`、`db rebuild`、
   consumer doctor profile (`PLAN-RECOVERY-06`)、review request / receipt / merge gate smoke。
5. consumer runtime/state/history/lock/hook/evidence が consumer root 内だけに存在することを
   検査する。
6. Linux/Windows/aggregate で同じ候補 oracle を実行し、exact release identity・PLAN revision・
   Reverse・CI・非著者 closing receipt へ束縛する。

review request / receipt / merge gate smoke は、consumer root 内の projection
(`.ut-tdd/review/requests|receipts`) が閉じることを観測するもので、source repo の canonical
request custody を代替しない。

## 6. 順序契約と PR 分割

| PR | 論点 | 前提 |
| --- | --- | --- |
| PR-0 (本 PR) | 本 PLAN + `PLAN-REVERSE-531` + pair test-design の pair-freeze (docs のみ) | なし |
| PR-1 | 第 1 層 CI smoke: `tests/pack-internal-canary-boundary.test.ts` の Red→Green と最小配線。CANDIDATE 001..004 と 006/007 を `U-ST-PACKCANARY-*` へ昇格 | `PLAN-L7-516` §6 の破壊的 checkout 削除 E2E (#420 production adapter) が main へ到達 |
| PR-2 | 第 2 層 受入 run 配線 (実行形態は PR-2 の設計判断節で確定)。CANDIDATE 005 の昇格と L12 `AT-DIST-002` 行の追記 | PR-1 merge、canary 公開の PO 承認 |

PR-1 と PR-2 を 1 PR に統合しない。scope 構造を指す FLAG は close→分割再出で応じる。

## 7. TDD / trace / Reverse

pair artifact の候補 oracle は次の通り。001..004 は Codex 先行 test-design (§1.3) を採用し、
005..007 を本 PLAN で追補する。実装 PR で同番号の `U-ST-PACKCANARY-*` へ 1:1 昇格する。
既存 `CANDIDATE-PACKISO-001..007`、`CANDIDATE-U-PACKNODE-*`、`U-PACKBUN-*`、
`CANDIDATE-PACKPUB-*` を再採番・再所有しない。

| Candidate | 契約軸 | 所有層 |
| --- | --- | --- |
| `CANDIDATE-ST-PACKCANARY-001` | clean inventory に source-only / absolute path が混入しない | 第 1 層 |
| `CANDIDATE-ST-PACKCANARY-002` | authoring template と skills の exact-one inventory | 第 1 層 |
| `CANDIDATE-ST-PACKCANARY-003` | setup 元撤去後・別 cwd からの sealed runtime 起動、外部参照は typed deny | 第 1 層 |
| `CANDIDATE-ST-PACKCANARY-004` | generated wrapper/config/runtime state に setup 元 absolute path 0 | 第 1 層 |
| `CANDIDATE-ST-PACKCANARY-005` | 第 2 層: 公開 asset の SHA-256/size が第 1 層 staging receipt と byte 一致、不一致は `mismatch` deny | 第 2 層 |
| `CANDIDATE-ST-PACKCANARY-006` | exact 2 asset + tag exact match: legacy 3 asset release、`latest`/prefix 解決、asset 欠落/余剰を deny | 第 2 層 (unit は第 1 層で固定) |
| `CANDIDATE-ST-PACKCANARY-007` | 再起動相当 (別 process/cwd/env clear) 後の PLAN/DB/doctor/review smoke 再現と Bun trace 0 | 第 1 層 |

R1 では `PLAN-L6-101` の source 非依存と `PLAN-L6-63` の immutable release identity を照合する。
R2 では二層接合・fixture 契約・PR 分割を同一 implementation revision へ束縛する。R3 では非著者
の claim-blind / spec-blind review で、silent fallback、legacy release の誤取得、receipt 申告
digest の信用、partial install の成功扱いを攻撃する。R4 では不足差分だけを `PLAN-L6-101` へ
backfill し、`PLAN-L7-515` / `L7-516` / `L7-508` を重複所有しない。

## 8. 非 Scope

- Product A/B 異 version 同時稼働、片系 upgrade/rollback、stable 昇格 (#364 後続 slice)
- remote publication mutation、tag/Release/channel pointer の作成 (#414 / `PLAN-L7-515`)
- Bun 互換 fallback。Bun 実行・検出・install は 0 以外 fail (`PLAN-L7-522` / `L7-527` / `L7-530`)
- memory / notification root の cross-worktree provider parity (#424)
- consumer self-contained runtime 本体の実装 (#420 / `PLAN-L7-516`)
- profile 分割、Cloudflare、Execution Episode

## 9. 完了条件

1. fixture 内に source repo、source worktree、開発用 DB/PLAN/evidence、ローカル Pack checkout が
   存在しない状態で第 1 層 smoke が Linux/Windows/aggregate で Green。
2. PATH/env/config/log/receipt の source 側 absolute path 参照 0、`bun` trace 0。
3. release asset は exact 2 件で、digest/identity/tag/Pack commit が publication receipt と
   一致し、第 1 層 staging receipt と byte 一致する (§3.3)。
4. 再起動相当セッション後にも PLAN/DB/doctor/review smoke が再現する。
5. failure 時は consumer root 外 write 0、partial install を成功扱いしない。
6. `PLAN-L7-531`、L12 test-design、`PLAN-REVERSE-531`、CI、成果物を書いていない族 (cross-family) の canonical non-author closing receipt (PR-0 は Claude 起票のため Codex 族、Codex worker が書く PR-1 / PR-2 は Claude 族) を
   同一 exact revision へ束縛する。
7. 本 Issue は internal canary の入口だけを閉じる。#364 は open のまま維持する。

## 10. 実装開始条件

1. 本 PLAN と `PLAN-REVERSE-531` の pair-freeze に非著者 PASS receipt と CI Green が揃うこと。
2. `PLAN-L7-516` §6 の破壊的 checkout 削除 E2E が main へ到達していること (PR-1 の前提)。
3. `v0.2.0-canary.1` が `PLAN-L7-515` adapter 経由で human-approved 公開されていること
   (PR-2 の前提。公開の実施は PO 承認を要する高影響境界であり、本 PLAN は承認を代替しない)。
4. production source を第 1 層・第 2 層とも変更しないこと。方式変更が必要になったら PR を
   close して本 PLAN の契約改訂へ戻る。
