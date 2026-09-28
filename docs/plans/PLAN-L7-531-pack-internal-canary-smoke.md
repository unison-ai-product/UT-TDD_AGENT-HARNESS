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
updated: 2026-09-28
owner: Claude / Fable (pair-freeze) · Codex worker (implementation)
parent_design: docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
pair_artifact: docs/test-design/harness/L12-pack-internal-canary-test-design.md
next_pair_freeze: L12
backprop_decision: required
backprop_decision_reason: clean Pack-only fixture で観測した source 非依存・受入契約接合・exact
  5 asset + anchor 照合の実測を PLAN-L6-101 の受入契約と PLAN-L6-63 の段階公開契約へ
  PLAN-REVERSE-531 で逆向き検証し、#364 の A/B 完全受入へ再合流させる。
agent_slots:
  - role: se
    slot_label: Luna worker - CI smoke (第 1 層) と受入 run 配線 (第 2 層) を別 PR で最小実装する
  - role: qa
    slot_label: Terra - CANDIDATE-ST-PACKCANARY-001..010 の Red oracle を Linux/Windows で先に作る
  - role: tl
    slot_label: Sol / Claude Opus - source 非依存・受入契約接合・exact 5 asset + anchor の非著者検収
generates:
  - artifact_path: docs/plans/PLAN-L7-531-pack-internal-canary-smoke.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
  requires:
    - docs/plans/PLAN-L7-508-pack-publication-staging-auditor.md
    - docs/plans/PLAN-L7-515-pack-remote-canary-publication.md
    - docs/plans/PLAN-L7-516-pack-self-contained-consumer-runtime.md
    - docs/plans/PLAN-L7-628-pack-consumer-runtime-release-install.md
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
    - tests/support/pack-consumer-runtime.ts
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
  receipt_id: certificate:2f1134a5759d724605aa1e13fee7eac6
  command_id: plan-revise:issue-418:531-canary2-contract:plan:r4:b13da940a4b0
  admitted_at: 2026-09-28T11:19:07.555Z
  source_digest: sha256:57e053d9e9ee51cb39690100a05baa1b36103dbfb6db6ff4a8a9830f28dadf0d
  decision_digest: sha256:33bfd28e2c32efbc3f9c6372d8165e11fac36c670103020b4f3caf49938c0127
  receipt_digest: sha256:4d3506ec462ff24a83e083024a003ea51568178a9816a15344e33ef16b75ad79
  binding:
    path: docs/plans/PLAN-L7-531-pack-internal-canary-smoke.md
    plan_id: PLAN-L7-531-pack-internal-canary-smoke
    asset_id: plan:44f79788376b81c225ce5913fddbc48f
    revision: 4
    content_digest: sha256:57e053d9e9ee51cb39690100a05baa1b36103dbfb6db6ff4a8a9830f28dadf0d
  route:
    signal: feature_addition
    mode: add-feature
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
    direction: design_to_implementation
    implementation_disposition: none
  reentry:
    target_plan_id: PLAN-L7-531-pack-internal-canary-smoke
    target_revision: 4
    phase: forward_merge
  escape_reason: "Issue #418 PR #731 Sol r1 FLAG の是正: publish 記録の per-asset 2 値
    (producer / 独立再計算) 必須化、§7 表の列整合、Candidate 009(b) の判別可能な対照入力を明記する
    (PLAN-L7-628 §5.7 準拠)。"
---

# PLAN-L7-531: Pack-only internal canary smoke (Windows/Linux)

## 1. 目的と前提

Issue #418 は、internal canary を、source repository・開発 worktree・開発用 DB/PLAN/evidence・
ローカル Pack checkout を実行時入力にしない clean Pack-only fixture へ導入し、上流開発に必要な
最小閉包 (PLAN authoring/lint、DB rebuild、doctor、review request/receipt/merge gate) が
Windows/Linux で成立することを実証する slice である。#364 の Product A/B 異 version 共存・片系
upgrade/rollback・stable 昇格は縮小せず、その前段の internal canary gate だけを原子的に所有する。

PO 判断 (2026-09-18、`PLAN-L7-628` §1) により、release の定義が「GitHub Release に tar.gz が
存在する」から**「clean な第三者プロジェクトが、その Release だけから setup して Claude / Codex
で開発を開始できる」**へ変更され、使える最初の版は `v0.2.0-canary.2` 以降になった。本 PLAN の
canary 入力契約は本改訂 (2026-09-28) で `PLAN-L7-628` の exact 5 asset + anchor 契約へ接合する
(§2・§3)。本 PLAN は `PLAN-L7-628` の producer / installer semantics を再所有しない — internal
canary smoke gate (clean fixture での E2E 起動確認) だけを所有する (§8)。

本 PLAN は pair-freeze であり、実装・Green・canary 公開・#418 の closure を主張しない。

### 1.1 HARD 前提の実測 (2026-09-10)

| #418 の HARD predecessor | 実測 |
| --- | --- |
| #414 minimal Pack canary publication adapter の main 到達 | CLOSED。`PLAN-L7-515` confirmed、PR #466 merge |
| #408 / #134 の Pack・consumer 実行面の Bun 永久 BAN | #408 CLOSED (`PLAN-L7-522` / `L7-527` confirmed)。#134 は親 umbrella として open のまま |
| Pack main protection (PR、required harness-check、human approval) | 有効: required check `harness-check`、approving review 1 |
| #419 admission deny 時の PF5 全 port 0 (U-PACKISO-007) | CLOSED |

### 1.2 起票時点で未充足の入力 (本改訂: 2026-09-28 実測で更新)

- **`v0.2.0-canary.1` は 2026-09-18 に Pack repository へ公開済み**だが (`gh release list` 実測、
  tag `v0.2.0-canary.1`、`Pre-release`、asset は `v0.2.0-canary.1.tar.gz` /
  `v0.2.0-canary.1.tar.gz.sha256` / `v0.2.0-canary.1.manifest.json` の 3 件 — `gh release view`
  実測)、`PLAN-L7-628` §1/§3 の実測のとおり新しい release 定義を満たさない: consumer launcher が
  要求する consumer runtime asset を持たず、添付 manifest (旧 `distribution package` 出力) に
  producer 端末の絶対パス (`C:\dev\...`) を含む。旧 2 asset 形式 (tar.gz + `.sha256`、`PLAN-L7-515` 契約) は `PLAN-L7-628` 確定により
  **置換**され、選択肢として並存しない (§2)。
- **`v0.2.0-canary.2` が本 PLAN の現在の canary 入力対象**であり、2026-09-28 時点で未公開
  (`gh release list` に無し)。公開は human-approved の外向き操作であり PO 承認を要する
  (高影響境界)。本 PLAN は公開そのものを代替せず、公開後の clean fixture 受入だけを所有する
  (§3.2)。
- `v0.2.0-canary.2` の asset 集合・schema・installer 契約は **confirmed `PLAN-L7-628` §3/§4/§6**
  が正本であり、本 PLAN では再記述しない。**producer (`src/cli/distribution.ts`, PR-1) のみ**
  2026-09-28 時点で main へ着地済み (git 実測: `git log origin/main -- src/cli/distribution.ts`
  は `f27911fb`/`deeeab00` ほかを含む)。**installer (PR-2) は main 未到達**であり、open PR #726
  「Releaseの外部anchorからconsumer runtimeを安全に導入する（#418 PR-2）」として review 中である
  (`gh pr view 726` 実測: state=OPEN、mergedAt=null)。`src/setup/consumer-runtime-release.ts` は
  producer の自己検証関数共有 (`PLAN-L7-628` §5.4) により main に部分的に存在するが、installer の
  CLI surface (`setup --consumer-runtime-release`) と anchor 照合 (`--expected-consumer-digest`、
  `PLAN-L7-628` §6.2 手順 0) は main に未着地 (`git grep -n "expected-consumer-digest" origin/main
  -- src` は 0 件、PR #726 が追加)。`PLAN-L7-628` §7 の PR 表は本 PLAN の入力契約改訂と E2E 実装を
  PR-2 merge 後の後続行 `(531)` とする。本改訂 (docs のみ、PR-0) はその行のうち入力契約の docs
  接合だけを先行させるものであり、PR-2 (#726) の main 到達も installer の挙動も主張しない。
  #726 の review で installer の CLI 形・anchor 形式が変わる場合、それは `PLAN-L7-628` の契約改訂を
  経由し、本 PLAN は §3 の参照先を追随改訂する (本 PLAN が installer 形を独自に固定しない)。
  PR-2 の main 到達は本 PLAN の PR-1/PR-2 (§6・§10) の前提として扱う。
- **#420 (`PLAN-L7-516`)** は 2026-09-11 CLOSED、`PLAN-L7-516` は confirmed (`gh issue view 420`
  / frontmatter 実測)。§6 の破壊的 checkout 削除 E2E テストの main 所在は PR-1 着手時に再確認し、
  §10 の開始条件として維持する (本改訂では充足を主張しない)。
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

001..004 は clean fixture の wrapper 起動境界 (source path 混入 0、authoring inventory、
setup 元撤去後の起動、絶対 path 残存 0) を検証するものであり、canary の asset 集合が 2 個か 5 個
かに依存しない。本改訂ではこれらの Candidate 定義自体は変更せず、005..007 (および新設 008..010)
だけを `PLAN-L7-628` の 5 asset + anchor 契約へ合わせて改訂する (§7)。

## 2. 設計判断: smoke の入力 artifact (2026-09-28 改訂、PLAN-L7-628 接合)

### 2.1 改訂の背景

- **旧決定 (2026-09-10 初版)**: 第 1 層 = `PLAN-L7-508` の sealed local staging 出力
  (tar.gz + `.sha256` + control manifest sidecar)、第 2 層 = 公開 `v0.2.0-canary.1` の
  exact 2 asset (tar.gz + `.sha256`) 照合。
- **新事実**: `PLAN-L7-628` (confirmed、rev1〜9、2026-09-18〜2026-09-25) が PO 判断により
  release の定義を変更し、§3 で exact 5 asset (`<tag>.tar.gz` / `<tag>.tar.gz.sha256` /
  `<tag>.ut-tdd.mjs` / `<tag>.consumer-runtime.json` / `<tag>.consumer.sha256`) を、§6 で
  installer 契約 (`--expected-consumer-digest` の Release 外 anchor による信頼根) を確定した。
  producer (PR-1) は 2026-09-28 時点で main に着地済みだが、**installer (PR-2) は main 未到達で
  open PR #726 として review 中**である (§1.2)。`PLAN-L7-628` §7 の PR 表は「(531): E2E:
  `PLAN-L7-531` の入力契約を本 PLAN の asset 集合へ改訂し、clean fixture の Windows / Linux E2E
  を実装。前提: PR-2 merge」と明記する。本改訂 (PR-0、docs のみ) は入力契約の docs 接合であり、
  PR-2 (#726) の main 到達を前提にしない。PR-2 の main 到達は本 PLAN の実装 PR (§6 PR-1/PR-2) の
  前提として扱う。
- **決定**: 本 PLAN の canary 入力を、旧 2-asset (`v0.2.0-canary.1`) 契約から **`PLAN-L7-628` の
  5-asset + anchor 契約 (`v0.2.0-canary.2` 以降)** へ全面置換する。旧 2-asset 記述は代替案として
  並存させず削除する (選択肢の追加ではなく置換)。asset schema・installer 内部 semantics の
  再記述はしない — `PLAN-L7-628` §3/§4/§6 を正本として参照する。
- **理由**: `PLAN-L7-628` が confirmed PLAN として asset 形式を supersede した。本 PLAN が独自の
  asset 契約を維持し続けると正本が 2 つに分裂し、`duplicate-artifact-ownership` 相当の契約分裂を
  生む。

advisor 相談 (初版、2026-09-10、`ut-tdd advisor --decision design --current-model
claude-fable-5 --execute`) の推奨 A の骨格 (offline 層 + 受入層の分離) は維持するが、各層の入力を
`PLAN-L7-628` へ束縛する形で以下のとおり改訂する。

| 案 | 内容 | trade-off | 判定 |
| --- | --- | --- | --- |
| **A (採用、2026-09-28 改訂)** | 第 1 層 = 一時 clean root で **実 producer** (`distribution package --tag <fixture tag>`、既存 AT-DIST-001 と同じ機構) が出力した 5 asset の release-dir を入力に、実 installer で install し、撤去・別 shell 後の最小閉包までを offline・決定論的に検査する (asset 形状の模造品は使わない)。第 2 層 = 実際に公開された `v0.2.0-canary.2` の Release から取得した 5 asset と、source repo の publish 記録 (§3.4) の anchor で同じ経路を 1 回実行する受入照合 | `PLAN-L7-628` の unit/integration (`CANDIDATE-U-PACKRT-005`) は install 後の `--help` exit 0 と release-dir 削除後の起動までで止まる。本 PLAN はその先 (撤去・env clear・別 cwd 後の PLAN/DB/doctor/review 閉包、guard hook、Bun trace 0、Windows/Linux) だけを追加で担保し、installer semantics を再実装しない。ただし第 2 層は `v0.2.0-canary.2` の公開 (PO 承認) 待ちになる | 採用 |
| B | `PLAN-L7-628` の producer/installer 内部ロジック (asset 集合検査、自己 digest 照合、anchor 照合、identity 導出) を本 PLAN でも独立に再実装する | `PLAN-L7-628` の非著者検収と重複し、installer semantics を本 PLAN が re-own することになる。§8 非 Scope に反し、正本の二重化を生む | 棄却 |
| C | 第 1 層を廃止し、真の Release E2E (第 2 層) だけを本 PLAN の唯一の gate にする | `v0.2.0-canary.2` 公開前は本 PLAN の CI が全く走らず、clean-fixture wrapper 境界 (source path 混入 0、authoring inventory 等、001-004/007) の regression を公開前に検出できない。wrapper 起動境界自体は本 PLAN 固有の未所有領域であり、asset 集合の実公開の有無に関わらずオフラインで検証すべき | 棄却 |

1 PR = 1 論点規律との整合: A の二層は契約としては 1 論点 (「canary smoke の入力 artifact契約」)
であり、実装は §6 の通り CI 層 PR と受入配線 PR に分割する。二層を 1 PR に詰めない (PR #219 と
同型の肥大を作らない)。

## 3. 受入契約 (PLAN-L7-628 接合)

### 3.1 第 1 層: CI smoke (offline、決定論、非受入証跡)

入力は、一時 clean root に tagged release commit (`PLAN-L7-628` §2.2 の C1/C2 形) を作り、
**実 producer** `ut-tdd distribution package --tag <fixture tag>` が出力した `PLAN-L7-628` §3 の
exact 5 asset の release-dir である (既存 `tests/distribution-acceptance.test.ts` AT-DIST-001 が
`v0.0.0-accept` で同じ機構を CI 上で動かしている)。実 GitHub からの取得は行わない。asset の名前・
拡張子だけを模した手書き fixture は使わない — 実 installer の手順 0〜2 (anchor・`.consumer.sha256`・
自己 digest) を通らず、第 1 層が installer を経由しない別経路の smoke に劣化するためである。
fixture 生成時に source worktree、directory walk、glob、local Pack checkout、開発 DB、PLAN 本文、
環境変数から entry を補完しない。asset の byte 内容・digest 生成規則は `PLAN-L7-628` §3/§4/§5 が
正本であり、本層は producer / installer を呼ぶだけで再実装しない。

- **fixture tag**: Pack repo の公開 tag 名前空間と衝突しない固定 tag (例: `v0.0.0-canary-fixture`)
  とする。`v0.2.0-canary.*` を名乗らない。
- **anchor**: 第 1 層の `--expected-consumer-digest` は fixture 自身の `<tag>.consumer.sha256` から
  test 内で計算した値であり、`PLAN-L7-628` §6.1 の信頼根 (Release 外の publish 記録) ではない。
  したがって第 1 層 Green は偽造検出を含む受入を一切証明せず、受入証跡へ読み替えない (§3.2、
  `CANDIDATE-ST-PACKCANARY-009`)。
- **第 1 層が固有に殺す mutation**: compiled ESM が `--help` 以外の subcommand (PLAN authoring /
  `plan lint` / `db rebuild` / consumer doctor / review gate / hook) で source 側 path・未 bundle の
  module・Pack checkout を実行時に解決する退行。`CANDIDATE-U-PACKRT-005` は `--help` までしか起動
  しないため、この退行を通す。

第 1 層は Linux/Windows/aggregate の全 CI run で実行し、network・credential・remote mutation を
一切持たない。

**source-CLI helper は受入証跡ではない**: 既存の source-CLI helper
`tests/support/pack-consumer-runtime.ts` (`--consumer-runtime-input` 入力) は、source repository
の git checkout 内から consumer runtime admission を直接呼び出す unit/integration helper であり、
`PLAN-L7-628` §6 の Release-assets-only installer 経路 (`--consumer-runtime-release`) を経由しない。
これは開発時の unit/integration test helper として引き続き利用してよいが、**#418 の受入証跡には
ならない**。第 1 層・第 2 層のいずれの Candidate oracle も、この helper を Green にしたことを
#418 の acceptance evidence として引用してはならない (§7 `CANDIDATE-ST-PACKCANARY-009`)。

### 3.2 第 2 層: 受入 run (human-triggered、1 回、これが #418 の acceptance)

canary 公開 (PO 承認、`PLAN-L7-515` adapter 経由) の後に、clean fixture (source repo・source
worktree・開発用 DB/PLAN/evidence・ローカル Pack checkout が存在しない) で、公開済み tag
`v0.2.0-canary.2` の Release asset (`PLAN-L7-628` §3 の exact 5 asset) をダウンロードした
`<release-dir>` を用意し、`PLAN-L7-628` §6.2 の installer コマンドをそのまま実行する。

```sh
node <release-dir>/<tag>.ut-tdd.mjs setup --solo \
  --consumer-runtime-release <release-dir> \
  --expected-consumer-digest sha256:<§3.4 の publish 記録に載った consumer anchor digest>
```

anchor 値の authority は `PLAN-L7-628` §6.1 のとおり source repo 側の publish 記録である。第 2 層は
anchor を **publish 記録からだけ** 取り、ダウンロードした `<release-dir>` から再計算した値を渡さない
(Release 自身から anchor を作ると照合が恒真になる)。anchor digest の生成は `PLAN-L7-628` §5.7 の
producer / publish 担当が行い、記録の様式は §3.4 で本 PLAN が定める。

installer 実行前に、第 2 層 runner は取得した asset 集合が `PLAN-L7-628` §3 の exact 5 件であり、
各 asset の sha256 が §3.4 の publish 記録の値 (producer 値と独立再計算値が一致した値) と一致することを
独立に照合する。installer の照合は
`.ut-tdd.mjs` / `.consumer-runtime.json` / `.consumer.sha256` だけを固定するため
(`PLAN-L7-628` §6.2 手順 0〜1)、`<tag>.tar.gz` / `<tag>.tar.gz.sha256` の完全性はこの照合だけが
見る (`CANDIDATE-ST-PACKCANARY-005`)。

インストール成功後、Windows・Linux それぞれのクリーンな fixture で以下を確認する。

1. source repository、source worktree、開発用 DB/PLAN/evidence、Pack 取得元 checkout、
   `<release-dir>` を物理削除する。
2. 新しい shell (別 process・別 cwd・環境変数を clear) を開く。
3. 生成された consumer-local launcher (`PLAN-L7-516` §2.2) から §5 の最小閉包 (PLAN
   authoring/lint、DB rebuild、doctor、review request/receipt/merge gate) が成立する。

installer コマンド自体の内部 semantics (asset 検証順序、自己 digest 照合、identity 導出、冪等性)
は `PLAN-L7-628` §6.2 が正本である。本層は「実 Release から、clean fixture で、Windows/Linux 双方
で、source/Pack/release-dir 撤去後も動く」という E2E 経路だけを追加で担保する。

### 3.3 anchor 照合の E2E 観測

anchor 不一致 (`--expected-consumer-digest` 未指定・形式違反・値不一致) は `PLAN-L7-628` §6.1/§6.2
手順 0 が typed deny (`consumer_runtime_anchor_mismatch`) として所有する。本 PLAN はこの deny
semantics を再実装せず、実際にダウンロードした Release asset と誤った anchor を組み合わせた
clean fixture で、consumer root へ 1 byte も書かれずに deny されることを E2E レベルで観測する
だけである (§7 `CANDIDATE-ST-PACKCANARY-008`)。`CANDIDATE-U-PACKRT-007(d)` と違い、対象は
**実際に公開された** `<tag>.ut-tdd.mjs` であり、殺す mutation は「公開 bundle が review 済み installer
と異なる (anchor 照合を持たない revision から build された・build 過程で照合が落ちた) まま publish
された」ことである。第 1 層 Green を、この anchor 照合や第 2 層の受入証跡へ読み替えない。

第 2 層の実行形態 (手動 script か `workflow_dispatch` か) は本 PLAN で決めない。§6 PR-2 の設計
判断節で advisor 相談のうえ確定し、本 PLAN の revision へ記録する。実行そのものは公開の PO 承認後に
のみ行う。

### 3.4 publish 記録の様式 (`PLAN-L7-628` §5.7 が本 PLAN に割り当てた所有)

`PLAN-L7-628` §5.7 は、producer stdout の値と publish 担当が再ダウンロード asset から独立に再計算
した値を「source repo 側の記録 (publish を追跡する Issue のコメント)」に残し、その「記録の様式は
`PLAN-L7-531` が所有する」と定める。本 PLAN は保管場所・生成方式を変えず、様式だけを次に固定する。

- 置き場所: source repo の publish 追跡 Issue (canary.2 では #418) のコメント 1 件。
- 必須 field: `tag` (exact)、Pack Release の URL、C1 / C2 の 40 桁 commit、記録者と記録日時、
  および次の 6 値それぞれについて **producer stdout 値と独立再計算値の 2 値** (いずれも
  `sha256:<64 桁 lowercase hex>`):
  - `PLAN-L7-628` §3 の exact 5 asset それぞれ (`name` を添える) の sha256
  - `consumer_anchor_digest`
- 独立再計算値は、publish 担当が公開後の Release から asset をダウンロードし直し、その bytes から
  計算した値とする (producer stdout や producer の出力ディレクトリから転記しない)。
- 6 値のいずれかで 2 値の一方が欠落する、2 値が一致しない、その他の必須 field が欠落する、または
  同一 tag への複数の矛盾する記録がある場合、第 2 層を開始しない (runner が installer 起動前に deny、
  `CANDIDATE-ST-PACKCANARY-005(d)`)。§3.2 の照合と第 2 層の anchor に使うのは 2 値が一致した値だけである。
- 記録の改ざん耐性は source repo の write 権限と review 経路に依存する (`PLAN-L7-628` §6.1)。
  署名・外部 API 照合は導入しない (高影響境界、`PLAN-L7-628` §6.1 と同じ)。

### 3.5 guard hook と setup smoke の E2E 観測 (`PLAN-L7-628` §6.2 手順 7 が本 PLAN に割り当てた観測)

`PLAN-L7-628` §6.2 手順 7 は、install 後に生成 launcher 経由で `doctor --setup-smoke` が通ること、
Claude / Codex の guard hook が正常系を通し禁止系を block することを本 PLAN の E2E が観測すると
定める。本 PLAN は hook の内容・schema (`PLAN-L7-668` の Codex hook command schema 等) を再所有せず、
setup が consumer に生成した `.claude/settings.json` と `.codex/hooks.json` に登録された PreToolUse
work-guard の command 文字列をそのまま、撤去後の clean fixture で合成 PreToolUse payload を与えて
実行し、正常系 (consumer root 内の許可された編集) は通過、禁止系 (work-guard が block する編集) は
各 runtime の block 規約どおり block されることを観測する (§7 `CANDIDATE-ST-PACKCANARY-010`)。

## 4. fixture 契約

- consumer root は一時ディレクトリだけを対象とする。開発用 repository、実利用 worktree、
  ユーザーデータを削除して試験しない。
- fixture 内に source repository、source worktree、開発用 DB/PLAN/evidence、Pack 取得元
  checkout、`<release-dir>` が **存在しない** 状態で smoke を実行する。Pack 取得元 checkout と
  `<release-dir>` は install 後に物理削除し、削除した path への read/open/stat を 0 と観測する。
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

1. 第 1 層は実 producer が一時 clean root で出力した fixture tag の release-dir (§3.1) から、
   第 2 層は公開 Release からダウンロードした `<release-dir>` (§3.2) から、空の clean consumer
   root を用意する。第 2 層は §3.4 の publish 記録と asset 集合・sha256 を照合してから進む。
2. 両層とも §3.2 の installer コマンド (`setup --solo --consumer-runtime-release <release-dir>
   --expected-consumer-digest sha256:<anchor>`) を実行し、sealed consumer runtime
   (`PLAN-L7-516`) を配置する。anchor は第 1 層が fixture 自身から計算した値、第 2 層が publish
   記録の値である (§3.1・§3.2)。
3. Pack 取得元 checkout・source 参照・producer 用一時 root・`<release-dir>` を物理削除する。
4. 別 cwd から wrapper を起動し、次の最小閉包を順に実行する:
   `doctor --setup-smoke` (`PLAN-L7-628` §6.2 手順 7)、PLAN authoring smoke (`PLAN-L7-528` の
   template scope)、`plan lint`、`db rebuild`、consumer doctor profile (`PLAN-RECOVERY-06`)、
   review request / receipt / merge gate smoke、guard hook の正常系/禁止系 (§3.5)。
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
| PR-0 (本 PR) | 本 PLAN + `PLAN-REVERSE-531` + pair test-design の pair-freeze (docs のみ)、入力契約の `PLAN-L7-628` 接合 | `PLAN-L7-628` PR-1 (producer) の main 到達 (充足済み、§1.2)。PR-2 (installer、#726) の main 到達は本 PR-0 の前提にしない — docs 接合のみで実装を主張しない |
| PR-1 | 第 1 層 CI smoke: `tests/pack-internal-canary-boundary.test.ts` の Red→Green と最小配線。CANDIDATE 001..004、006 (unit)、007、010 (第 1 層) を `U-ST-PACKCANARY-*` へ昇格 | `PLAN-L7-516` §6 の破壊的 checkout 削除 E2E (#420 production adapter) の main 所在確認、`PLAN-L7-628` PR-2 (installer、#726) の main 到達 (§5 手順 2 が installer コマンドを呼ぶため)、本 PR-0 の非著者 PASS |
| PR-2 | 第 2 層 受入 runner 配線 (実行形態は PR-2 の設計判断節で確定) と §3.4 publish 記録の照合。CANDIDATE 005、006 (受入)、008、009、010 (第 2 層) の昇格と L12 `AT-DIST-002` 行の追記 | PR-1 merge、`PLAN-L7-628` PR-2 (#726) の main 到達。受入 run の実行 (昇格の Green 実測) は `v0.2.0-canary.2` 公開の PO 承認後 |

PR-1 と PR-2 を 1 PR に統合しない。scope 構造を指す FLAG は close→分割再出で応じる。

## 7. TDD / trace / Reverse

pair artifact の候補 oracle は次の通り。001..004 は Codex 先行 test-design (§1.3) を採用し、
005..010 を本改訂で `PLAN-L7-628` の 5 asset + anchor 契約に合わせて追補・改訂する。実装 PR で
同番号の `U-ST-PACKCANARY-*` へ 1:1 昇格する。既存 `CANDIDATE-PACKISO-001..007`、
`CANDIDATE-U-PACKNODE-*`、`U-PACKBUN-*`、`CANDIDATE-PACKPUB-*`、`CANDIDATE-U-PACKRT-*`
(`PLAN-L7-628` 所有) を再採番・再所有しない。

| Candidate | 契約軸 | 所有層 |
| --- | --- | --- |
| `CANDIDATE-ST-PACKCANARY-001` | clean inventory に source-only / absolute path が混入しない | 第 1 層 |
| `CANDIDATE-ST-PACKCANARY-002` | authoring template と skills の exact-one inventory | 第 1 層 |
| `CANDIDATE-ST-PACKCANARY-003` | setup 元撤去後・別 cwd からの sealed runtime 起動、外部参照は typed deny | 第 1 層 |
| `CANDIDATE-ST-PACKCANARY-004` | generated wrapper/config/runtime state に setup 元 absolute path 0 | 第 1 層 |
| `CANDIDATE-ST-PACKCANARY-005` | 公開 asset の完全性 (Red: 取得した 5 asset のいずれか 1 件を 1 byte 変異 / size 変更)。(a) `<tag>.tar.gz` / `<tag>.tar.gz.sha256` の変異は installer が見ないため、§3.2 の runner 照合 (publish 記録の sha256 との不一致) が installer 起動前に deny する。(b) `<tag>.ut-tdd.mjs` / `<tag>.consumer-runtime.json` の変異は runner 照合に加え、runner 照合を外した対照で `PLAN-L7-628` §6.2 手順 1 が deny する。(c) `<tag>.consumer.sha256` の変異は手順 0 (anchor 不一致) で deny。(d) release-dir は真正のまま、§3.4 の publish 記録の 6 値 (5 asset の sha256 と anchor) のいずれか 1 値について producer 値か独立再計算値を欠落させる、または 2 値を不一致にする。runner が installer 起動前に deny し、consumer root write 0。殺す mutation: runner が asset 集合・sha256 を publish 記録と照合せず installer に丸投げする実装 ((a) が通る)、runner が producer 値だけを読み独立再計算値の有無・一致を検査しない実装 ((d) が通る) | 第 2 層 (runner の照合ロジック自体は PR-2 の CI test でも offline 固定) |
| `CANDIDATE-ST-PACKCANARY-006` | exact 5 asset + tag exact match (Red: legacy 3 asset 形式 `v0.1.4`、`v0.2.0-canary.1` の 3 asset (`.manifest.json` 付き)、`latest`/prefix/semver range 解決、5 asset のいずれかの欠落・余剰・別名)。runner が `PLAN-L7-628` §3 の exact 5 件と tag exact 以外を installer 起動前に deny する。殺す mutation: runner の tag 解決を prefix / latest にする、asset 集合検査を部分集合一致にする | 第 1 層 (runner の選択ロジックを offline 固定。installer 側の集合検査は `CANDIDATE-U-PACKRT-008` 所有) / 第 2 層 (実 Release で再観測) |
| `CANDIDATE-ST-PACKCANARY-007` | 再起動相当 (別 process/cwd/env clear、`bun` を PATH 上に配置) 後の `doctor --setup-smoke`・PLAN/DB/doctor/review smoke 再現と Bun trace 0。殺す mutation: compiled ESM が `--help` 以外の subcommand で source path・未 bundle module・Pack checkout を実行時解決する退行 (§3.1) | 第 1 層 |
| `CANDIDATE-ST-PACKCANARY-008` | 第 2 層: 実際にダウンロードした Release asset に対し `--expected-consumer-digest` を未指定・形式違反・publish 記録と異なる値にする。Green: `PLAN-L7-628` §6.2 手順 0 の `consumer_runtime_anchor_mismatch` deny を公開 bundle で観測し、consumer root へ 1 byte も書かれないことを確認する (§3.3)。殺す mutation: 公開 bundle が anchor 照合を欠く / 未指定で install を通す | 第 2 層 |
| `CANDIDATE-ST-PACKCANARY-009` | 受入証跡の出所 (Red: (a) runner の installer 呼び出しを `--consumer-runtime-input` (source-CLI helper `tests/support/pack-consumer-runtime.ts` と同じ経路) に差し替える、(b) runner が anchor を publish 記録ではなく `<release-dir>` の `.consumer.sha256` から再計算する、(c) 受入記録の tag が fixture tag / `v0.2.0-canary.2` 以外)。Green: PR-2 の CI test が runner を offline で呼ぶ。(b) の対照入力は、`.ut-tdd.mjs` を実行意味を変えない形 (末尾へのコメント 1 行追記等。改変後も手順 0〜2 の照合ロジックはそのまま動く) で改変し `.consumer.sha256` を整合的に書き換えた偽造 release-dir と、**5 asset の sha256 entry (producer 値・独立再計算値とも) を偽造 release-dir の値に合わせ、`consumer_anchor_digest` (2 値とも) だけを真正 fixture の anchor に固定した**記録である。この対照では §3.2 の asset 照合・exact 5 件・tag exact・§3.4 の 2 値一致の各 guard がすべて通るため、結果を分けるのは anchor の出所だけになる。正しい runner は spawn 引数の `--expected-consumer-digest` に記録の anchor (真正値) をそのまま渡し、installer 手順 0 が `consumer_runtime_anchor_mismatch` で deny して consumer root write 0。(b) の mutant は偽造 release-dir から再計算した anchor を渡すため手順 0〜2 を通過し deny されない — 観測点 (spawn 引数の anchor 値と deny 有無) の結果が反転し (b) が Red になる。§3.4 は runner に anchor と `.consumer.sha256` entry の相互照合を要求しない。PR-2 がこの相互照合を追加する場合は、005(b) と同じく相互照合を外した対照で本入力を実行する (相互照合が上流で deny すると (b) が識別されないため)。runner が起動する argv に `--consumer-runtime-release` があり `--consumer-runtime-input` が無いことを spawn 引数で assert する ((a) を殺す)。受入記録の tag が exact `v0.2.0-canary.2` でなければ受入記録を生成しない ((c) を殺す) | PR-2 CI (offline) |
| `CANDIDATE-ST-PACKCANARY-010` | guard hook E2E (§3.5)。Red: (a) 生成 `.codex/hooks.json` / `.claude/settings.json` の work-guard が正常系も block する (canary.1 実測の全編集 block と同型)、(b) hook command が撤去済み path・存在しない launcher を指し、hook 失敗が非 block として素通りする、(c) 禁止系 payload を通す。Green: 撤去・別 shell 後の clean fixture で、登録された command 文字列をそのまま実行し、正常系 payload は通過、禁止系 payload は各 runtime の block 規約どおり block。(a)(b)(c) はいずれも Red | 第 1 層 / 第 2 層 (実 Release で再観測) |

Candidate は pair-freeze 時点の設計候補であり、実装と同じ revision の Red→Green 実測が揃うまで
`U-*` へ昇格しない。001..004・006 (第 1 層)・007・010 (第 1 層) は `PLAN-L7-531` §6 の PR-1、
005・006 (受入)・008・009・010 (第 2 層) は PR-2 が昇格する。009 と 005/006 の runner 照合は
PR-2 の CI で offline に Red→Green し、005/006 (受入)・008・010 (第 2 層) の実 Release 観測は
公開後の受入 run 1 回で行う。

R1 では `PLAN-L6-101` の source 非依存と `PLAN-L6-63` の immutable release identity、
`PLAN-L7-628` の asset 集合契約を照合する。R2 では受入契約・fixture 契約・PR 分割を同一
implementation revision へ束縛する。R3 では非著者の claim-blind / spec-blind review で、silent
fallback、legacy/旧 2-asset release の誤取得、anchor 未指定経路の残存、Release 自身から再計算した anchor の使用、guard hook の素通り、source helper・第 1 層 Green の受入証跡
偽装、receipt 申告 digest の信用、partial install の成功扱いを攻撃する。R4 では不足差分だけを
`PLAN-L6-101` へ backfill し、`PLAN-L7-515` / `L7-516` / `L7-508` / `L7-628` を重複所有しない。

## 8. 非 Scope

- Product A/B 異 version 同時稼働、片系 upgrade/rollback、stable 昇格 (#364 後続 slice)
- remote publication mutation、tag/Release/channel pointer の作成 (#414 / `PLAN-L7-515`)。
  canary 公開そのものは PO 承認済みの外向き操作であり、本 PLAN はそれを代替・実施しない
- `PLAN-L7-628` の producer / installer semantics (asset schema、自己 digest 照合、identity
  導出、冪等性、anchor digest の生成規則と信頼根の置き場所) の再定義・再実装。本 PLAN はそれらを
  clean fixture の E2E で観測する側に留まる。例外は `PLAN-L7-628` が明示的に割り当てた publish
  記録の様式 (§3.4) と guard / setup smoke の E2E 観測 (§3.5) だけである
- guard hook の内容・schema (`PLAN-L7-668` 等) の再定義
- `PLAN-L7-515` の publication adapter の再所有
- L12 の stable 昇格判定 (#364 後続、本 PLAN は internal canary の入口だけを所有)
- Bun 互換 fallback。Bun 実行・検出・install は 0 以外 fail (`PLAN-L7-522` / `L7-527` / `L7-530`)
- memory / notification root の cross-worktree provider parity (#424)
- consumer self-contained runtime 本体の実装 (#420 / `PLAN-L7-516`)
- profile 分割、Cloudflare、Execution Episode

## 9. 完了条件

1. fixture 内に source repo、source worktree、開発用 DB/PLAN/evidence、ローカル Pack checkout、
   `<release-dir>` が存在しない状態で第 1 層 smoke が Linux/Windows/aggregate で Green。
2. PATH/env/config/log/receipt の source 側 absolute path 参照 0、`bun` trace 0。
3. 公開 `v0.2.0-canary.2` の release asset は `PLAN-L7-628` §3 の exact 5 件で、各 sha256・tag・
   C1/C2 commit・anchor digest が §3.4 の publish 記録 (producer 出力値と独立再計算値の一致) と
   一致し、installer はその anchor で install を完了する (§3.2〜§3.4)。
4. 再起動相当セッション後にも `doctor --setup-smoke`・PLAN/DB/doctor/review smoke が再現し、
   Claude / Codex の guard hook が正常系を通し禁止系を block する (§3.5)。
5. failure 時は consumer root 外 write 0、partial install を成功扱いしない。anchor 不一致は
   `consumer_runtime_anchor_mismatch` として deny される (§3.3)。
6. source-CLI helper (`tests/support/pack-consumer-runtime.ts`、`--consumer-runtime-input`) の
   Green と、第 1 層 (fixture tag・自己計算 anchor) の Green を #418 の受入証跡として扱わない
   (§3.1、`CANDIDATE-ST-PACKCANARY-009`)。
7. `PLAN-L7-531`、L12 test-design、`PLAN-REVERSE-531`、CI、成果物を書いていない族 (cross-family) の canonical non-author closing receipt (PR-0 は Claude 起票のため Codex 族、Codex worker が書く PR-1 / PR-2 は Claude 族) を
   同一 exact revision へ束縛する。
8. 本 Issue は internal canary の入口だけを閉じる。#364 は open のまま維持する。

## 10. 実装開始条件

1. 本 PLAN と `PLAN-REVERSE-531` の pair-freeze に非著者 PASS receipt と CI Green が揃うこと。
2. `PLAN-L7-516` §6 の破壊的 checkout 削除 E2E が main へ到達していること (PR-1 の前提。#420 は
   2026-09-11 CLOSED だが、E2E テストの main 所在は PR-1 着手時に確認する)。
3. `PLAN-L7-628` PR-1 (producer) が main へ到達していること (2026-09-28 時点で充足済み、§1.2)。
   PR-2 (installer) は 2026-09-28 時点で main 未到達・open PR #726 として review 中であり、
   本 PLAN の PR-1/PR-2 (§6) の前提として main 到達を要する (§1.2)。
4. `v0.2.0-canary.2` が `PLAN-L7-515` adapter 経由で human-approved 公開されていること
   (PR-2 の受入 run 実行と 005・006 (受入)・008・010 (第 2 層) の Green 実測の前提。PR-2 の runner 実装と
   offline CI は公開前に進めてよい。公開の実施は PO 承認を要する高影響境界であり、本 PLAN は承認を代替しない)。
5. production source を第 1 層・第 2 層とも変更しないこと。方式変更が必要になったら PR を
   close して本 PLAN の契約改訂へ戻る。
