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
updated: 2026-09-17
owner: Claude / Fable (pair-freeze) · Codex/Luna worker (bounded implementation)
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
  receipt_id: certificate:bc59507c724eaea013783c46a4848e4c
  command_id: plan-revise:issue-418:pr642-plan:r7:01af96e1d9d9
  admitted_at: 2026-09-17T06:51:55.617Z
  source_digest: sha256:c0d775b2a3041d0403cae8cf68edd2e4e2c256afecc43d34398a7ffcdbd46869
  decision_digest: sha256:9613de41048bddc75fabc3e860badf397561e22b9920b646c12ce5b93becd76f
  receipt_digest: sha256:4e45c4f650c393370d8eb586accb1ad7e61d8c1d959534cf46526ef55f445abd
  binding:
    path: docs/plans/PLAN-L7-531-pack-internal-canary-smoke.md
    plan_id: PLAN-L7-531-pack-internal-canary-smoke
    asset_id: plan:44f79788376b81c225ce5913fddbc48f
    revision: 7
    content_digest: sha256:c0d775b2a3041d0403cae8cf68edd2e4e2c256afecc43d34398a7ffcdbd46869
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
  transition:
    direction: design_to_implementation
    implementation_disposition: none
  reentry:
    target_plan_id: PLAN-L7-531-pack-internal-canary-smoke
    target_revision: 3
    phase: forward_merge
  escape_reason: "Issue #418 PR #642 Opus r3 FLAG 2 件を是正 (Claude control lane
    引き取り): PR-1B の C003/C004/C007 に layer-1 入力契約 (sealed tar.gz 由来 Pack root の
    provenance probe、offline npm と network 0、allowlist child env) を固定し、PR-1A
    C001 の反証不能な child env 条項を provenance probe (sentinel byte、sealed asset
    open、source worktree read 0) へ置換"
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

### 1.1 HARD 前提の実測 (2026-09-16)

先行成果物の実測は契約の実装完了を意味しない。#414/#420/#487 の状態は、それぞれの main 到達と
canonical receipt により別途検証する。

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

PR-1B の検証 run の開始と完了は、別々の falsifiable predicate とする。開始を実装 PR の
起票・作業開始条件と混同しない。

`G-PR1B-START-001 = valid(#420 main-arrival receipt) AND
valid(#487 bun-zero-trace receipt)`。

ここで **#420 main-arrival receipt** は、#420 の canonical merge gate が発行する receipt
(`pr_number`、対象 PR の exact head、merge commit、結果の `origin/main` SHA、Issue/PLAN
束縛を含む) とする。**#487 bun-zero-trace receipt** は、#487 の canonical retirement
oracle が発行する receipt (`implementation_revision`、trace schema/digest、
`install`/`download`/`invocation` の各 count = 0、対応 CI run を含む) とする。PR コメントや
自己申告の時刻・digest・「完了」文字列は、いずれの receipt の代替にもならない。

`G-PR1B-COMPLETE-001 = G-PR1B-START-001 AND
C003/C004/C007 Green at the same PR-1B implementation revision`。

START は PR-1B の canary 検証を開始できる条件だけを表し、#420/#487 の実装・mergeを
自ら証明しない。COMPLETE は同じ実装 revision に束縛された C003/C004/C007 の全 Green と、
両 receipt の完全な検証を要求する。いずれかの receipt が欠落・不一致、または Candidate の
いずれかが Red なら PR-1B は未完了であり、PR-1A の完了や preflight Green では代替できない。

### 1.3 先行成果物の扱いと実装境界

Codex worker が 2026-09-08 に作成した pair artifact と先行テストは、現状の実測範囲を示す
候補資料として参照する。ただし、先行 branch の bytes、current worktree、Git tree、既存 helper の
Green は、本 PLAN の実装・受入証跡へ自動昇格しない。

本 revision は、PR #638 の FLAG 5 件を受けた contract-only reslice である。PR-0 は PLAN、
Reverse、L12 test-design の docs だけを freeze し、test source、production source、publication
mutation、release receipt を生成・変更しない。

C003/C004/C007 は #420 の consumer-local runtime と setup 元 checkout 撤去が main に到達するまで
意図的な Red のままとする。C001/C002/C006 の unit 層も、sealed staging input port が実装される
まで Green と主張しない。同一 worker の preflight や CI Green により draft PLAN を confirmed へ
遷移させず、confirmed 化は cross-family non-author review と canonical admission のみが行う。

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
| **A (採用)** | CI smoke は `PLAN-L7-508` の sealed local staging 出力 (tar.gz + sha256) を入力にする。control manifest/receipt は bytes と asset identity を照合する metadata であり、第 1 層の第 3 の入力 asset ではない。実公開 tag からの取得・照合は L12 受入の human-triggered run 1 回として行い、receipt に束縛する (二層) | offline・決定論・再起動相当後の再現という #418 AC の性格と一致。二層の接合を receipt digest 照合で明文化しないと独立した 2 つの smoke に劣化する | 採用 |
| B | 実公開 `v0.2.0-canary.1` を CI から取得して smoke する | 公開 (PO 承認待ちの外向き操作) が CI の前提条件になる。CI へ network fetch + token read という新しい信頼面を持ち込む | 棄却 |
| C | A の CI 層だけで #418 を閉じ、実 tag 受入を #364 後続へ送る | #418 AC「digest/identity/tag/Pack commit が receipt と一致」は実公開 tag に対する照合を要求しており、C は AC を満たさない。採るなら #418 の scope 縮小 (PO 判断) になる | 棄却 |

1 PR = 1 論点規律との整合: A の二層は契約としては 1 論点 (「canary smoke の入力 artifact
契約」) であり、実装は §6 の通り CI 層 PR と受入配線 PR に分割する。二層を 1 PR に詰めない
(PR #219 と同型の肥大を作らない)。

## 3. 二層入力契約

### 3.1 第 1 層: CI smoke (offline、決定論)

入力は `PLAN-L7-508` が返す sealed staging result の **exact 2 asset**、すなわち `tar.gz` と
対応する `.sha256` だけとする (name/size/SHA-256 を bytes から再計算して検証する)。control
manifest/receipt は asset identity と digest を照合する sealed metadata であり、fixture の bytes
や依存を補う入力にしてはならない。依存は tar.gz 内の sealed staging に供給済みでなければならず、
registry/npm fetch、`npm ci`、`npm install`、追加 download は禁止する。

第 1 層は Linux/Windows/aggregate の全 CI run で実行し、network/DNS/socket/HTTP、credential、
remote mutation の試行を 0 とする。child process を起動する PR-1B では、child の環境を allowlist から明示構築した
map だけとし、`process.env` をそのまま継承してはならない (下記 (c))。child process を起動しない PR-1A では
spawn 試行 0 がこの条項を包含するため、env 検査を C001 の oracle に含めない。fixture 生成時に source worktree、directory walk、
glob、local Pack checkout、開発 DB、PLAN 本文、未許可環境変数から entry を補完しない。

C001 の network 0 は終了コードだけで推測せず、テスト seam へ注入した network/DNS/socket/HTTP
adapter、child-process spawn、registry/installer client の試行カウンタで観測する。禁止された呼出しは
typed deny とカウンタ増加を返し、Green は各カウンタが 0、リクエスト記録が空、かつ remote mutation
がないことの同時成立とする。

C001 は入力の出所も bytes の一致だけで推測しない。sealed `tar.gz` 内の sentinel file の 1 byte を変えると
clean inventory digest が変わること、materializer が sealed `tar.gz` と `.sha256` を実際に open したこと (各 1 回
以上)、fs seam で観測した source worktree・local Pack checkout 配下への read/open/stat 試行が 0 であることを
同時に要求する。staging と同じ bytes を `cpSync(process.cwd())` で作った fixture は、sealed asset の open 0 と
source worktree への read 試行によって Red になる。

PR-1B の setup/runtime 実行 (C003/C004/C007) にも第 1 層の入力契約をそのまま適用し、次の 3 predicate を
実装者の判断に残さず oracle で固定する。

- **(a) Pack root の出所**: `setup --solo` に渡す Pack root は、`PLAN-L7-508` の sealed `tar.gz` を `.sha256` で
  検証した後に一時 directory へ展開したものだけとする。source worktree、Git tree、`cpSync(process.cwd())`、
  local Pack checkout から組み立てた Pack root は Red。出所は bytes の一致ではなく provenance probe で観測する:
  sealed `tar.gz` 内の sentinel file の 1 byte を変えると setup 後 consumer root の inventory digest が変わること、
  かつ fs seam で観測した source worktree 配下への read/open/stat 試行が 0 であること。
- **(b) network 0 と依存の供給**: npm 依存は sealed `tar.gz` に同梱された依存 (展開後 Pack root 内の
  `node_modules` または sealed tarball cache) だけから供給し、`setup --solo` と後続 CLI は npm を offline 固定
  (`npm_config_offline=true`、到達不能な deny registry) で実行する。network/DNS/socket/HTTP seam、child-process
  spawn の引数、registry/installer client の試行カウンタを観測し、registry 解決・fetch・install・download が
  1 回でもあれば Red。依存欠落を network で補う fallback は typed deny とする。
- **(c) child env**: CLI / wrapper の child process へは allowlist (最小 `PATH`、一時 `HOME` / `USERPROFILE` /
  `TEMP` / `TMP`、Windows の `SystemRoot` / `ComSpec`、`npm_config_offline`) から明示構築した map だけを渡す。
  親 process に未許可 env sentinel (例: `UT_TDD_CANARY_ENV_SENTINEL`、credential 風の `GITHUB_TOKEN`) を置き、
  child の env dump・stdout・stderr・consumer root 内 state に sentinel が 0 件であることを観測する。
  `process.env` の spread・直接継承は Red。

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

## 5. smoke 手順 (PR ごとの所有を明示)

1. **[PR-1A]** 第 1 層の sealed staging result (`tar.gz` + `.sha256` の exact 2 asset) だけから
   clean inventory を構成し、asset digest・明示 inventory・C001/C002/C006-unit の deny oracle を
   独立再計算する。PR-1A は `setup --solo`、`doctor`、PLAN authoring、review/merge CLIを実行せず、
   runtime dependency を registry/install/download で補充しない。C001 の network/DNS/socket/HTTP・
   spawn・installer 試行カウンタはすべて 0 でなければならない。
2. **[PR-1B]** `G-PR1B-START-001` を検証した後、sealed `tar.gz` を `.sha256` で検証して一時 directory へ展開した
   Pack root だけを入力に、§3.1 (a)(b)(c) (provenance probe、offline npm と network seam、allowlist env) の下で
   `setup --solo` を実行し、sealed consumer runtime (`PLAN-L7-516`) を配置する。
3. **[PR-1B]** Pack 取得元 checkout と source 参照を fixture から物理削除する。
4. **[PR-1B]** 別 cwd から wrapper を起動し、次の最小閉包を順に実行する:
   PLAN authoring smoke (`PLAN-L7-528` の template scope)、`plan lint`、`db rebuild`、
   consumer doctor profile (`PLAN-RECOVERY-06`)、review request / receipt / merge gate smoke。
5. **[PR-1B]** consumer runtime/state/history/lock/hook/evidence が consumer root 内だけに存在することを
   検査する。
6. **[PR-1B]** Linux/Windows/aggregate で同じ候補 oracle を実行し、exact release identity・PLAN revision・
   Reverse・CI・非著者 closing receipt へ束縛する。
7. **[PR-2]** 公開済み exact 2 asset を clean fixture へ入力し、C005/C006-acceptance と第 1 層の
   staging receipt 接合を human-triggered run で実行する。

review request / receipt / merge gate smoke は、consumer root 内の projection
(`.ut-tdd/review/requests|receipts`) が閉じることを観測するもので、source repo の canonical
request custody を代替しない。

## 6. 順序契約と PR 分割

| PR | 論点 | 前提 |
| --- | --- | --- |
| PR-0 (本 revision) | PLAN、Reverse、L12 test-design の contract-only pair-freeze | なし。test source と production source は含めない |
| PR-1A | 第 1 層 offline smoke の sealed **tar.gz + .sha256 のみ**の input、明示 inventory、C001/C002/C006-unit の Red→Green | PLAN-L7-508 の sealed result (tar.gz + .sha256) と PR-0 の cross-family PASS |
| PR-1B | #420 の consumer-local runtime、setup 元 checkout 撤去、別 cwd/process/env-clear、path/state oracle (C003/C004/C007) | #420 が main に到達し、#487 の Bun zero-trace 前提が成立 |
| PR-2 | human-triggered 公開 canary asset の exact 2 件・tag・receipt byte digest 接合 (C005/C006-acceptance) | PR-1A/1B、#565 publication、PO 承認済みの v0.2.0-canary.1 |

PR-1A は PR-1B の未充足条件を Green/confirmed と主張しない。PR-2 は CI から network、credential、
remote mutation を行わず、公開後の human-triggered run に限定する。PR-0 の contract freeze と実装 PR を
1 本へ戻す FLAG は close→分割再出で扱う。

### PR-1A completion smoke (bounded candidate/oracle set)

PR-1A の completion smoke は次の 3 行だけで構成する。各行は sealed staging の bytes を入力に
再現可能な Red→Green oracle とし、既存の Candidate 番号を再所有する。C003/C004/C007 は #420
依存の PR-1B 所有であり、PR-1A completion の入力・完了判定・Green 集計に含めない。

| Candidate | PR-1A の Red 入力 / 実行観測 | Green oracle (falsifiable) |
| --- | --- | --- |
| CANDIDATE-ST-PACKCANARY-001 | sealed `tar.gz` に source-only/absolute path を混入し、network/socket・spawn 試行を注入する。provenance 負例として staging と同じ bytes を `cpSync(process.cwd())` で作った fixture を入力にする | exact 2 asset を SHA-256 検証後にのみ materialize し、source/absolute path・network/spawn 試行を 0 とする。sealed `tar.gz` の sentinel 1 byte 変更で inventory digest が変わり、sealed asset の open が各 1 回以上、source worktree / local Pack checkout への read/open/stat が 0。`cpSync(process.cwd())` fixture は Red |
| CANDIDATE-ST-PACKCANARY-002 | sealed staging の authoring/skills/inventory entry を欠落・重複させ、registry/installer 呼出しを観測可能にする | PR-1A は CLI/runtime を起動せず、sealed staging の entry だけを検査する。authoring/skills の exact-one inventory と registry/npm/install/download 試行 0 を観測し、欠落・重複・外部 fetch は Red |
| CANDIDATE-ST-PACKCANARY-006 (unit) | legacy 3 asset、exact 2 asset の欠落/余剰/別名、`latest`/prefix/semver range locator | `tar.gz` + `.sha256` の exact 2 asset と exact identity のみを受理し、legacy/欠落/余剰/別名/非 exact locator を typed deny する |

したがって、C003/C004/C007 の Red→Green、#420 main arrival、#487 Bun-zero trace は PR-1A の
completion smoke に算入せず、`G-PR1B-START-001` / `G-PR1B-COMPLETE-001` でのみ判定する。

## 7. TDD / trace / Reverse

pair artifact の候補 oracle は次の通り。CANDIDATE は候補としてのみ保持し、同じ実装 revision
で Red→Green の実測が揃うまで U-* へ昇格しない。C004 は generated wrapper/config だけでなく
stdout、stderr、consumer root 内の .ut-tdd runtime state を検査し、skills inventory は helper の
存在ではなく materialized product 経路の exact inventory を検査する。

| Candidate | 契約軸 | 所有層 |
| --- | --- | --- |
| CANDIDATE-ST-PACKCANARY-001 | sealed tar.gz + .sha256 の検証と provenance probe (sentinel byte、sealed asset open、source worktree read 0)、network/spawn 0、source-only/absolute path を clean inventory へ混入させない | PR-1A |
| CANDIDATE-ST-PACKCANARY-002 | sealed staging の authoring template/skills の exact-one inventory、runtime CLIを起動しない registry/install/download 0 | PR-1A |
| CANDIDATE-ST-PACKCANARY-003 | §3.1 (a) の sealed 展開 Pack root から (b) offline で setup し、setup 元撤去後、別 cwd/process から sealed runtime を起動し外部 path は typed deny | PR-1B |
| CANDIDATE-ST-PACKCANARY-004 | §3.1 (a) の sealed 展開 Pack root から setup した consumer root で、wrapper/config/stdout/stderr/.ut-tdd state に setup 元 absolute path 0 | PR-1B |
| CANDIDATE-ST-PACKCANARY-005 | 公開 asset の SHA-256/size と第 1 層 staging receipt の byte 一致 | PR-2 |
| CANDIDATE-ST-PACKCANARY-006 | exact 2 asset + exact tag。legacy 3 asset、latest/prefix/range、欠落/余剰を deny | PR-1A (unit) / PR-2 (受入) |
| CANDIDATE-ST-PACKCANARY-007 | 別 process/cwd と §3.1 (c) の allowlist 構築 env (sentinel 0) の下で PLAN/DB/doctor/review 再現、network/registry 試行 0、Bun trace 0 | PR-1B |

R1 は sealed staging、consumer-local runtime、immutable identity の責務境界を再確認する。R2 は
PR-1A/1B/2 の split と Candidate ownership を束縛する。R3 は claim-blind/spec-blind の cross-family
review で silent fallback、legacy release 誤取得、receipt 申告 digest、partial install を攻撃する。
R4 は不足差分だけを L6-101/L7-515/L7-516 へ gap-only backfill し、既存所有 oracle を再宣言しない。

## 8. 非 Scope

- Product A/B 異 version 同時稼働、片系 upgrade/rollback、stable 昇格 (#364 後続 slice)
- remote publication mutation、tag/Release/channel pointer の作成 (#414 / `PLAN-L7-515`)
- Bun 互換 fallback。Bun 実行・検出・install は 0 以外 fail (`PLAN-L7-522` / `L7-527` / `L7-530`)
- memory / notification root の cross-worktree provider parity (#424)
- consumer self-contained runtime 本体の実装 (#420 / `PLAN-L7-516`)
- profile 分割、Cloudflare、Execution Episode

## 9. 完了条件

1. PR-1A の sealed `tar.gz` + `.sha256` **exact 2 asset** input から、CLI/runtime dependency の
   実行や補充を行わず、sealed staging の authoring/skills/inventory を検査する。C001/C002/C006-unit
   **だけ**が、network/DNS/socket/HTTP/spawn/installer 試行 0、provenance probe (sentinel byte、sealed asset open、
   source worktree read 0) とともに Linux/Windows/aggregate で Green になる。
2. PR-1B の #420 consumer runtime が、§3.1 (a) の sealed 展開 Pack root から (b) offline で setup され、
   setup 元撤去後の別 cwd/process と (c) allowlist env で動き、path/state/stdout/
   stderr/.ut-tdd state に source absolute path がなく、Bun trace が 0 になる。
3. PR-2 の公開 asset が exact 2 件で、digest/identity/tag/Pack commit と publication receipt、第 1 層
   staging receipt に byte 単位で一致する。
4. 失敗時の consumer root 外 write 0、partial install の成功扱い 0、legacy release 誤取得 0。
5. PLAN/L12/Reverse、CI、成果物を書いていない族の canonical non-author closing receipt を各 exact
   implementation revision へ束縛する。PR-0 は draft のまま、実装 worker preflight は PLAN status を変更しない。
6. 本 Issue は internal canary の入口だけを閉じ、#364 を open のまま維持する。

## 10. 実装開始条件

1. PR-0 の contract-only pair-freeze に cross-family non-author PASS と required CI Green が揃うこと。
2. PR-1A は PLAN-L7-508 の sealed staging result だけを入力にし、Git tree、current worktree、
   cpSync(process.cwd())、registry npm ci、full inherited env を使用しないこと。
3. PR-1B の検証開始は `G-PR1B-START-001`、完了は `G-PR1B-COMPLETE-001` で判定する。
   START は #420 main-arrival receipt と #487 Bun-zero-trace receipt が canonical fields 付きで
   検証できること、COMPLETE は同じ PR-1B implementation revision に C003/C004/C007 の全 Green
   が束縛されることを要求する。#420/#487 の自己申告、PR コメント、PR-1A の Green/confirmed は
   いずれの predicate の代替にもならない。
4. PR-2 は human-approved v0.2.0-canary.1 公開後にのみ開始し、receipt/admission 時刻と digest は
   canonical generator が生成した値だけを受理する。手書き時刻・申告 digest は受理しない。
5. production source を PR-0 で変更しない。方式変更が必要なら旧実装 PR を膨らませず、本 PLAN の
   contract revision へ戻る。
