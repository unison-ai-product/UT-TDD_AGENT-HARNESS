---
plan_id: PLAN-L7-529-project-identity-bootstrap
title: "PLAN-L7-529 (add-impl): setup で tracked project identity を bootstrap する"
kind: add-impl
layer: L7
drive: fullstack
route_signal: feature_addition
route_mode: add-feature
status: draft
created: 2026-09-04
updated: 2026-09-04
owner: PO / TL
github_issue_id: 432
parent_design: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
pair_artifact: docs/test-design/harness/L7-project-identity-bootstrap-test-design.md
backprop_decision: required
backprop_decision_reason: "read/create/commit-policy の fail-close 境界と namespace 分離を Forward/Reverse で同じ candidate に固定する。"
agent_slots:
  - role: se
    slot_label: "SE - tracked project identity の read/create 決定性契約を実装する"
  - role: qa
    slot_label: "QA - HEAD drift、junction/symlink/8.3/CRLF/BOM、stale identity 差し替えを独立変異で検証する"
generates:
  - artifact_path: docs/plans/PLAN-L7-529-project-identity-bootstrap.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-project-identity-bootstrap-test-design.md
    artifact_type: test_design
  - artifact_path: src/setup/project-identity-bootstrap.ts
    artifact_type: source_code
  - artifact_path: tests/setup-project-identity-bootstrap.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
  requires: []
  blocks: []
  references:
    - src/plan-asset/adapters/project-identity-loader.ts
    - src/plan-admission/node-plan-revision-runner.ts
    - src/plan-asset/adapters/legacy-plan-inventory.ts
    - src/runtime/project-memory-root.ts
    - src/runtime/repo-root.ts
    - docs/plans/PLAN-L7-512-project-scoped-memory-root.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/432
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/424
review_evidence: []
---

# PLAN-L7-529: setup で tracked project identity を bootstrap する

## 1. Outcome

`ut-tdd.project.json` (schema `ut-tdd.project/v1`) は、tracked な project identity の唯一の正本である。
本 PLAN は次の決定性契約だけを freeze する:

- **read**: 既存 tracked identity は常に HEAD の Git blob から厳密に読む。working tree の変更・
  HEAD drift・改変は fail-close (typed deny) であり、黙って受理しない。
- **create**: identity が HEAD に存在しない clean consumer で、`setup` が決定的な入力
  (git `origin` remote から導出した `owner/repo` 文字列) だけから canonical JSON を書く。
  同じ入力なら byte-identical。既存 identity がある repo での再実行は no-op read であり、
  書き換えない。
- **snapshot clone**: `origin` がlocal Git pathであるdetached snapshotでは、そのGit repositoryの
  network `origin`をexactly one hopだけ解決する。local path文字列自体からidentityを導出せず、
  二段目もlocal path・未知形式・origin無しならtyped denyする。
- **commit**: `setup` は作成した working tree ファイルを **暗黙に commit しない**。identity は
  HEAD に乗って初めて authoritative になる (§3.3)。
- **namespace**: 異なる origin を持つ project は disjoint な identity を持ち、repository の移動や
  linked worktree の追加で値は変わらない (絶対path・hostname・worktree pathを埋め込まない)。

対象外 (Issue #432 の非Scope、および本 pair-freeze のスコープ外): consumer runtime placement
(#420/#463)、Node generation producer (#485/#515)、Pack publication、global memory 本文、
remote mutation、semantic ranking。

## 2. 起点の実測 (再現コマンド付き、基準 ref = `7b18ee4e`)

### 2.1 `setup` は `ut-tdd.project.json` を一度も生成しない

```bash
git grep -n "ut-tdd.project.json" -- src/setup/ 7b18ee4e
# (該当なし: 0 件)
ls src/setup
#   authoring-template-inventory.ts branch-protection.ts consumer-local-runtime-admission.ts
#   distribution.ts index.ts pack-authoring-smoke.ts pack-publication-adapter.ts
#   pack-publication-assets.ts pack-publication-staging.ts release-aggregate-admission.ts
#   release-artifact-resolver.ts release-channel-adapter.ts release-materializer.ts
#   release-promotion-rollback-gate.ts templates.ts update-check.ts
```

`src/setup/` には project identity を書き出す module が存在しない。clean consumer は
事前 seed なしに `loadProjectIdentityFromHead` を満たせない。

### 2.2 read は HEAD の Git blob から厳密に再取得する (working tree は今のところ入力にならない)

`src/plan-asset/adapters/project-identity-loader.ts:61-91` (`loadProjectIdentityFromHead`) は
`git ls-tree HEAD -- ut-tdd.project.json` の mode/blob を正規表現で検証し
(`^100644 blob ([a-f0-9]{40|64})\t...$`、L72-75)、一致した blob だけを
`git show HEAD:ut-tdd.project.json` (L76) で取得する。`validReceipt` (L118-126) は
`blobOid`/`contentDigest` を bytes から再計算し、宣言値と一致しない receipt を拒否する。
working tree の同名ファイルはこの経路のどこでも読まれない — **read の実測は working tree との
diff を検査していない**。working tree drift の fail-close は現状の実装に存在せず、§3.1.1 が
新規 rule として freeze する。

### 2.2.1 (FLAG是正) HEAD 解決は 4 回の別呼び出しに分かれ、1 commit に束縛されていない

```
L66  const objectFormat = gitText(input.repoRoot, ["rev-parse", "--show-object-format"]).trim();
L70  const sourceCommit = gitText(input.repoRoot, ["rev-parse", "HEAD"]).trim();
L71  const entry = gitText(input.repoRoot, ["ls-tree", "HEAD", "--", projectPath]).trim();
L76  const bytes = execFileSync("git", ["-C", input.repoRoot, "show", `HEAD:${projectPath}`]);
```

L70 は `HEAD` を1回 OID へ解決して `sourceCommit` に代入するが、その値は**記録に使われるだけ**
で、L71 の `ls-tree` と L76 の `show` は変数 `sourceCommit` ではなくリテラル文字列
`"HEAD"`/`` `HEAD:${projectPath}` ``を再び渡している。したがって L70〜L76 の間に `HEAD` が
別 commit へ動く (checkout/reset/rebase 等) と、`ls-tree` と `show` が異なる commit を見る
可能性があり、`sourceCommit` (L70 時点の OID) と実際に読んだ blob (L71/L76 時点の `HEAD` が
指す commit) が一致しない receipt を生成しうる。`validReceipt` (L118-126) は
`blobOid`/`contentDigest` を**取得した bytes 自身**から再計算するため、この不一致を検出でき
ない (bytes とその re-hash は常に一致する。検出できないのは `sourceCommit` と bytes の実際の
出処が異なる commit である、という TOCTOU そのものである)。§3.1.2 が single-commit binding を
新規 rule として freeze する。

```bash
git show HEAD:ut-tdd.project.json
#   {
#     "schema_version": "ut-tdd.project/v1",
#     "repository_identity": "unison-ai-product/UT-TDD_AGENT-HARNESS"
#   }
git ls-tree HEAD -- ut-tdd.project.json
#   100644 blob b978291662c86e8aa6e29531743d1838a4d98d36	ut-tdd.project.json
```

このリポジトリ自身は既に tracked identity を持つ。本 PLAN が対象とするのは、これを**持たない
clean consumer** での bootstrap である。

### 2.3 identity grammar は `owner/repo` 形式に限定される

`validIdentity` (`src/plan-asset/adapters/project-identity-loader.ts:128-135`) は
`/^[A-Za-z0-9](?:[A-Za-z0-9_.-]{0,38})\/[A-Za-z0-9](?:[A-Za-z0-9_.-]{0,99})$/` かつ
NFC 正規化・trim済み・`.git` 非終端を要求する。絶対path、hostname、worktree pathの文法は
この regex を満たさない (`/` は1個だけ許容され、Windows path 区切り `\` や drive letter は
一致しない)。**identity は構造的に path を埋め込めない。**

### 2.4 identity は複数の呼び出し元から共有される信頼根である

```bash
grep -rln "project-identity-loader" src
#   src/doctor/test-repository-isolation.ts
#   src/plan-admission/node-plan-revision-runner.ts
#   src/plan-asset/adapters/legacy-plan-inventory.ts
```

`node-plan-revision-runner.ts:381-385` は `repositoryIdentity()` port として
`loadProjectIdentityFromHead` を呼び、`legacy-plan-inventory.ts:40-41` は
`buildLegacyPlanInventory` の入口で同じ関数を呼ぶ。**identity の bootstrap を誤ると、
plan revision 台帳と legacy inventory の両方が connectionできなくなる。**

### 2.5 project-scoped memory root は独立実装で同じ marker を読む (PLAN-L7-512 が既に freeze 済み)

`src/runtime/project-memory-root.ts:168-195` (`projectIdentityFromHead`) は
`project-identity-loader.ts` と**別実装**で同じ `HEAD:ut-tdd.project.json` を読み、同じ
grammar (`validRepositoryIdentity`, L201-208) を検証する。`resolveProjectMemoryRootWithPorts`
(L72-128) は `currentProjectId !== canonicalProjectId` を `project_identity_drift` として
deny し (L100-102)、namespace は `sha256("ut-tdd-project\0" + projectId)` (L42-44) で
project ごとに disjoint になる。本 PLAN はこの既存契約 (PLAN-L7-512、confirmed) を変更せず、
その入力である identity の create/read/commit 境界だけを追加で freeze する。

### 2.6 `resolveRuntimeRepoRoot` は identity marker の有無を repo root 判定に使う

`src/runtime/repo-root.ts:38-45` (`isRepoRoot`) は `ut-tdd.project.json` の存在または
`.git`/`package.json`/`AGENTS.md`/`CLAUDE.md`/`.claude/CLAUDE.md` の全存在のどちらかで
repo root を判定する。identity ファイルは**存在するかどうか**だけがこの判定に効き、
中身の path 依存性は無い。

## 3. 設計判断

### 3.1 read: HEAD-strict + working tree drift 検査 + single-commit binding + canonical bytes + loader-internal binding

Issue #432 の受入条件「既存 tracked identity は厳密に読取り、改変・HEAD drift をfail-close
する」と本 PLAN の §1/§4 は、HEAD の値を無条件に信頼する「HEAD 勝ち」の read を許さない。
working tree との差分は検出対象であり、read 判定に無関係な情報ではない。§3.1 は次の 4 点を
まとめて凍結する (旧稿は working tree drift を「read判定の入力にしない」と記述しており、
§1/§4 の fail-close 要求と矛盾していた。本改訂は §1/§4 の側に §3 を合わせる)。

#### 3.1.1 working tree drift は typed deny (新規 rule)

`loadProjectIdentityFromHead` の値は HEAD の Git blob を正本とするが、read は同じ
`repoRoot` の working tree ファイルとの diff を独立に検査する。次のいずれかを
`identity_worktree_drift` として typed deny する (HEAD の値をそのまま返さない):

- working tree のファイル bytes が HEAD の blob bytes と異なる (未commitの編集)。
- HEAD に tracked entry があるのに working tree にファイルが存在しない (ローカル削除)。
- working tree にファイルがあるのに HEAD に tracked entry が無い (untracked、§3.2 の
  create 前状態はこの分岐に該当するが、read 経路ではなく create 経路の入力として扱う)。

working tree が HEAD の checked-out 内容とバイト同一であるという正常系 (通常の
`git checkout` 直後の状態) は drift ではなく、read はそのまま成功する。これは**現状の
loader には無い新規チェック**であり、実装 slice で working tree bytes の読み取りと比較を
追加する (§5 slice 1)。

#### 3.1.2 single-commit binding で TOCTOU を閉じる (新規 rule)

§2.2.1 の実測のとおり、現行実装は `HEAD` を4回の別呼び出しで参照し、`sourceCommit` を
記録するだけで `ls-tree`/`show` の実引数には使っていない。本 PLAN は次の手順を凍結する:

1. `HEAD` を **1 回だけ** commit OID に解決し (`git rev-parse HEAD`)、その OID を
   `sourceCommit` として以降のすべての読み取りに使う。
2. `ls-tree <sourceCommit> -- ut-tdd.project.json`、`show <sourceCommit>:ut-tdd.project.json`
   は、リテラル `HEAD` ではなく手順1で解決した OID 文字列を引数に取る。
3. receipt 検証時 (`validReceipt` 相当) も `blobOid` を `<sourceCommit>:path` から再導出し、
   `sourceCommit` 自体が実際に読んだ blob の由来であることを固定する。
4. 手順1の解決と手順2の読み取りの間に `HEAD` が動いた場合 (別プロセスの checkout/reset 等)
   は、mixed receipt (異なる commit 由来の blob と sourceCommit の組) を受理してはならない。
   実装は「解決した OID で読み取り、その後にもう一度 `HEAD` を解決して不一致なら
   deny か bounded retry (上限付き再試行) のいずれかを選ぶ」ことを許すが、**再試行しても
   不一致が解消しない場合は `identity_head_toctou` として deny**し、古い/新しい値のどちらか
   を推測で採用しない。

#### 3.1.3 canonical bytes 比較で CRLF/BOM/reorder を検出する (新規 rule)

現行実装 (`decodeConfig`, L93-116) は HEAD の bytes を decode → JSON.parse するだけであり、
`contentDigest`/`blobOid` も同じ bytes から再計算するため、**CRLF 化や意味的に等価な
key 順序違いを持つ committed JSON は現状そのまま accept される** (§2.5 参照。旧稿の
「CRLF化はdigest再計算で検出できる」という記述は誤りであり本改訂で訂正する — digest は
bytes の自己無矛盾性しか検証せず、bytes が canonical か否かは検証していない)。

本 PLAN は create 契約 (§3.2) が生成する canonical byte form (UTF-8、LF、BOM無し、
`schema_version`→`repository_identity` の field 順、2-space indent、末尾改行1個) を read
側の oracle としても採用する: **read は HEAD bytes を一度 decode した内容から canonical
re-serialization を行い、re-serialize した bytes と HEAD の実 bytes を比較する。一致しなければ
`identity_noncanonical_bytes` として typed deny する** (中身の値が正しくても、byte表現が
canonical でなければ受理しない)。これも**現状の loader が行っていない新規チェック**であり、
実装 slice で追加する (§5 slice 1)。

#### 3.1.4 owner/repository binding は loader 内部で完結させる (新規 rule)

現行実装は `expectedRepositoryIdentity` を**呼び出し側が渡した場合のみ**照合し
(L42-47)、`node-plan-revision-runner.ts:382`・`legacy-plan-inventory.ts:40`・
`project-memory-root.ts` の `projectIdentityFromHead` はいずれもこの引数を渡していない
(§2.4)。したがって別 repository からコピーされた grammar-valid な identity は、これら
3 呼び出し元の経路では期待値照合なしに authoritative として読まれてしまう。

本 PLAN は repository binding を**呼び出し側のオプション引数ではなく loader 内部の必須
ステップ**として凍結する:

1. `loadProjectIdentityFromHead` は `git remote get-url origin` を同じ `repoRoot` に対して
   実行し、§3.2 と同じ正規化規則で `owner/repo` 文字列 (`boundRepositoryIdentity`) を導出する。
2. `origin` が存在し正規化できた場合、HEAD の `repository_identity` と
   `boundRepositoryIdentity` が一致しなければ `identity_repository_unbound` として deny する
   (呼び出し側が `expectedRepositoryIdentity` を渡していなくても、この照合は常に行われる)。
3. `origin` が存在しない/正規化できない場合、呼び出し側が明示的に
   `expectedRepositoryIdentity` を渡していれば、それを許容入力 (explicit allow) として
   HEAD の値と直接比較する (fixture repo・remote無しのlocal-only repoの正当な用途)。
   呼び出し側が何も渡していなければ `identity_repository_unbound` として deny する
   (originも呼び出し側の期待値も無い状態で HEAD の値をそのまま信頼しない)。
4. `origin` 由来の `boundRepositoryIdentity` と呼び出し側が渡した
   `expectedRepositoryIdentity` の両方が存在し、かつ互いに矛盾する場合は、どちらか一方を
   優先せず `identity_repository_unbound` として deny する (§4)。

この変更により、`loadProjectIdentityFromHead` を経由する
`node-plan-revision-runner.ts:382`・`legacy-plan-inventory.ts:40` の 2 呼び出し元は
**コード変更なしに**この binding の対象になる (binding が loader 内部に移動するため)。

一方 `project-memory-root.ts` の `projectIdentityFromHead` (L168-195) は §2.5 のとおり
**loader を経由しない独立 reader** であり、loader 内部の binding では保護されない。基準 ref
`7b18ee4e` では origin / expected identity の照合を一切行わないため、別 repository 由来の
grammar-valid な stale identity をそのまま authoritative に受理し得る。本 PLAN はこの経路を
**実装契約として次のいずれか**で閉じることを要求する (どちらを選ぶかは実装 slice の設計判断、
両方を満たさない状態は Red):

- (a) `projectIdentityFromHead` を廃止し、`loadProjectIdentityFromHead` (binding 内蔵) へ統合する
  (独立実装の解消、PLAN-L7-512 の `project_identity_drift` 契約は loader の結果に対して維持する)。
- (b) 独立 reader を残す場合、同じ `origin` 正規化規則と上記 1〜4 の判定を `projectIdentityFromHead`
  自身に実装し、`identity_repository_unbound` を同じ reason code で返す。

3 呼び出し元は実装 slice の検証対象として明示する (§5 slice 3、§6.1 CANDIDATE-U-PROJID-036..038)。
036 / 037 は「loader 経由で保護される」回帰確認、038 は「独立 reader 自体が binding を行う
(または統合済みである)」ことの確認であり、038 を loader の変更だけで Green にしてはならない。

### 3.2 create: 決定的入力・所有者・再実行規則

HEAD に tracked identity が無い場合、`setup` だけが以下の契約で `ut-tdd.project.json` を
working tree に書く:

- **入力**: `git remote get-url origin` を正規化した `owner/repo` 文字列のみ。
  `origin` remote が無い、`git@host:owner/repo.git` / `https://host/owner/repo.git` 等の
  既知形式に一致しない、正規化結果が `validIdentity` の grammar (§2.3) を満たさない場合は
  **作成せず typed deny** する (directory 名、hostname、絶対path、UUID 生成へのフォールバックを
  許さない)。
- **detached snapshot origin**: snapshot runnerが生成するcloneの`origin`がlocal Git pathの場合だけ、
  そのsource repositoryの`origin`をexactly one hop読んで上記network形式へ正規化する。local path
  自体をidentityへ変換せず、source側originもlocal path・未知形式・欠落ならdenyする (040)。
- **決定性**: 同じ `origin` remote に対する複数回の実行は byte-identical な出力を生成する。
  canonical serialization は field 順 `schema_version` → `repository_identity`、UTF-8 (BOM無し)、
  LF 改行、2-space indent、末尾改行 1 個で固定する。
- **所有者**: identity の作成は `setup` コマンドの専用経路に限る。`doctor` / `plan lint` /
  `node-plan-revision-runner` / `legacy-plan-inventory` など read 専用の呼び出し元は、
  identity が無ければ create を試みず deny をそのまま返す (read/create の権限分離)。
- **再実行**: HEAD に既に tracked identity がある repo で `setup` を再実行しても no-op read
  であり、書き換え・再生成をしない。working tree に未commitの生成物が既にある状態で再実行しても
  同じ入力からは同じ bytes を再生成するだけで、内容を変えない (既存の未commitファイルを
  上書きしても差分が出ない、が新規に別contentへ書き換えることはしない)。

### 3.3 commit policy (設計判断エリシテーション形式)

**前提**: `setup` が identity を新規作成した直後、working tree にはコミットされていない
`ut-tdd.project.json` が存在する。`loadProjectIdentityFromHead` は HEAD の blob しか読まない
ため、commit するまで生成した identity は read 経路から見えない。setup がこの単発の commit を
自動実行するか、明示 commit を要求するかを固定する必要がある。

| 案 | 内容 | 得るもの | 失うもの |
|---|---|---|---|
| A | `setup` が生成直後に自動 `git commit` する | 1 コマンドで read 可能な状態まで到達する | `setup` が Git 履歴を暗黙に変更する副作用を持つ。CI dry-run や read-only 検証コンテキストで意図しない commit が発生しうる。ADR/PO 既存原則 (§Git Rules「明示 commit」) と衝突する |
| B (推奨) | `setup` はファイルを書いて report するだけに留め、commit は human/runtime の明示操作に委ねる | `setup` は non-mutating (Git 履歴を変えない) のまま保たれる。既存の hybrid commit 協調規律 (CLAUDE.md §Hybrid 多ランタイム commit 協調) と同じく「commit は明示操作」という既存原則に合流する。identity が authoritative になるタイミング (HEAD到達) が commit という 1 箇所に集約され、read 側の HEAD-strict 契約 (§3.1) と整合する | 2 手順 (setup → commit) が必要。commit を忘れると read が deny のまま (ただし fail-close は本 PLAN の目的そのものであり、暗黙受理より安全) |
| C | `setup` は commit まで含めた 1 トランザクションを提供するが `--no-commit` フラグで A/B を選択可能にする | 呼び出し側が用途に応じて選べる | 実装・契約・test 面が増える (1 PLAN = 1 論点の PR スコープ規律に反する)。デフォルト挙動の決定を先送りするだけで、本 pair-freeze が固定すべき契約を残す |

**採択: B**。理由は 1 行: `setup` を non-mutating (Git 履歴に対して) に保つことは
`CLAUDE.md` の Git Rules と Hybrid 多ランタイム commit 協調が要求する「commit は明示操作」
という既存契約から一意に導け、read 側の HEAD-strict 決定 (§3.1、identity は HEAD に乗って
初めて authoritative) と対称になるため。C の柔軟性はこの pair-freeze のスコープ外
(1 PLAN = 1 論点) であり、実装が必要になった時点で別 PLAN として起票する。

この決定は trade-off の残る design 判断であり、advisor 相談は不要な既存契約からの一意な帰結
(反射的エスカレーション禁止の対象外) — Git Rules と Hybrid commit 協調が「commit は明示操作」
であることを既に確定させており、本節はその適用に過ぎない。

### 3.4 owner/repository identity binding と namespace 分離

`repository_identity` の値は `origin` remote から導出した `owner/repo` 文字列のみであり、
絶対path・hostname・worktree path・UUID を含まない (§2.3、§3.2)。したがって:

- 異なる `origin` を持つ project は異なる `repository_identity` を持ち、
  `project-memory-root.ts` の `projectNamespace` (sha256 digest) は disjoint になる
  (既存契約、PLAN-L7-512)。
- repository directory の rename/move は `origin` remote 文字列を変えないため
  `repository_identity` は不変。
- linked worktree ("`git worktree add`") はメイン worktree と同じ `HEAD` blob (共有
  `.git` 経由) を指すため、同じ `repository_identity` を返す。`project-memory-root.ts` の
  `currentProjectId !== canonicalProjectId` drift チェックはこの一致を既に検証している
  (§2.5)。

### 3.5 負系 (Linux/Windows)

以下はいずれも fail-close の対象であり、既存 loader の入力経路 (Git object 経由の read、
grammar 検証) から導かれる。実装 slice でこれらを独立変異として固定する:

- **symlink/junction escape**: tracked entry の Git mode が `100644` (regular blob) でない
  場合 (`120000` symlink 等) は `loadProjectIdentityFromHead` の正規表現 (§2.2) が一致せず
  `plan-repository-identity-missing` で deny する。repo root 自体が junction/reparse point の
  場合は `project-memory-root.ts` の `realpath` 経由の解決 (既存契約) に委ね、本 PLAN は
  read/create の入力を Git object 経由に固定することで escape 経路を作らない。
- **8.3 short-name escape**: `repoRoot` を Git コマンドに渡す前に長い正規path
  (real path) へ解決してから使う。short-name 表記 (`C:\PROGRA~1\...`) と正規表記が
  同じ repo を指す場合、両者から得る `repository_identity` は同一でなければならない。
- **case-only path difference**: 大小文字違いの path 表記が同一 repo (同じ inode/volume) を
  指す場合、identity 生成・解決の結果は同一でなければならない (二重 identity を作らない)。
- **CRLF/BOM mutation**: 基準 ref の `decodeConfig` (`project-identity-loader.ts:93-116`) が使う
  `TextDecoder("utf-8", { fatal: true })` は **既定 (`ignoreBOM: false`) で UTF-8 BOM を除去する**ため、
  BOM 付き `{}` は `"{}"` に decode され `JSON.parse` も成功する (実測: PR #516 r1 review、
  2026-09-04)。したがって **BOM 付与も CRLF 化も、現状の loader では silent accept される**
  (§2.5、§3.1.3)。旧稿の「BOM は decode 失敗で `plan-project-config-invalid` になる」という記述は
  誤りであり本改訂で訂正する。両変異は §3.1.3 の canonical bytes 比較 (HEAD 実 bytes と canonical
  re-serialization の比較) で `identity_noncanonical_bytes` として typed deny し、create 契約
  (§3.2) は常に LF・BOM無しで書く。基準 ref では 009 (BOM) は accept される (Red 起点)。
- **stale identity copied from another repository**: 別 repo からコピーされた
  syntactically-valid な `ut-tdd.project.json` は grammar 検証を通過しうる。本 PLAN は
  この binding を**呼び出し側の任意引数ではなく loader 内部の必須ステップ**として §3.1.4 で
  凍結する。`node-plan-revision-runner.ts`・`legacy-plan-inventory.ts`・
  `project-memory-root.ts` はいずれも現状 `expectedRepositoryIdentity` を渡していないため
  (§2.4)、binding を呼び出し側任せにする設計は採らない。

## 4. Fail-close contract

| 境界 | 正常条件 | 変異時の oracle |
|---|---|---|
| read (HEAD-strict) | HEAD の tracked blob が mode/grammar/expected identity 全て一致 | mode不一致、grammar不一致、expected不一致は typed deny |
| read (working tree drift、新規) | working tree bytes が HEAD blob bytes と一致 (または未commit生成物としてcreate経路が扱う) | bytes不一致・一方のみ存在は `identity_worktree_drift` で deny。HEAD値をそのまま返したらRed |
| read (single-commit binding、新規) | `HEAD` を1回だけ OID解決し、`ls-tree`/`show`/receipt再検証すべてが同じOIDを参照する | 解決後にHEADが動いて mixed receipt (sourceCommitと実読み取りcommitが不一致) を受理したらRed。再試行しても不一致なら `identity_head_toctou` で deny |
| read (canonical bytes、新規) | HEAD bytesが再parse→canonical re-serializationしたbytesと一致 | CRLF化・reorderなど非canonicalなvalid JSONは `identity_noncanonical_bytes` で deny |
| read (repository binding、新規) | `origin`由来の期待値、または明示`expectedRepositoryIdentity`のいずれかとHEAD値が一致し、両者矛盾が無い | origin無しかつ明示値も無し、またはorigin由来値と明示値の矛盾は `identity_repository_unbound` で deny。origin無しで明示値だけがHEAD値と異なる場合は `plan-repository-identity-missing` |
| create 入力 | `origin` remote が既知network形式、または040のone-hop Git custodyで `owner/repo` grammar に正規化できる | remote無し・未知形式・grammar不一致は作成せず deny (path/name由来fallback無し) |
| create 決定性 | 同一 origin から同一 canonical bytes | field順/改行/BOM/末尾改行の変異は非決定と見なし Red |
| create 所有者 | `setup` 専用経路のみが create を試みる | read専用呼び出し元 (doctor/plan-admission/legacy-inventory) が create を試みたら Red |
| rerun | 既存 identity がある repo で `setup` は no-op read | 既存ファイルを書き換えたら Red |
| commit policy | `setup` は working tree に書くのみ、commit しない (§3.3 B) | `setup` が `git commit` を実行したら Red |
| namespace | 異なる origin は disjoint identity/namespace、repo移動・worktree追加で不変 | 同一 origin で異なる identity、または移動/worktreeで値が変わったら Red |
| path非埋め込み | identity 文字列に絶対path/hostname/worktree pathを含まない | 埋め込みが検出されたら Red |
| stale working tree | 未tracked既存fileがcanonical origin bytesと一致 | 不一致・非regular fileは `identity_stale_worktree` でdeny |
| identity write | canonical bytesを新規fileへ書込み可能 | 書込み失敗は `identity_write_failed` でdenyし、commitしない |
| 負系 | junction/symlink/8.3/大小文字/CRLF/BOM/stale copy はいずれも deny または既存正規化で吸収 | いずれかが silent accept になったら Red |

## 5. Implementation slices (将来の実装 PR)

1. `loadProjectIdentityFromHead` に working tree drift 検査 (§3.1.1)、single-commit binding
   (§3.1.2、`ls-tree`/`show`/receipt再検証をリテラル`HEAD`ではなく解決済みOIDへ切替)、
   canonical bytes 比較 (§3.1.3) を追加する。
2. `origin` remote 正規化 (`git@`/`https://` 形式 → `owner/repo`) と grammar 検証、
   `setup` 専用の create 経路 (canonical serialization、所有者制限、rerun no-op)。
3. repository binding を loader 内部の必須ステップへ移す (§3.1.4)。
   `node-plan-revision-runner.ts`・`legacy-plan-inventory.ts` の 2 呼び出し元は変更なしで
   この binding の対象になることを回帰確認する (036 / 037)。`project-memory-root.ts` の
   独立 reader `projectIdentityFromHead` は §3.1.4 (a) 統合または (b) 自前 binding のいずれかで
   閉じ、038 で確認する (in-scope、この経路は loader 側だけの変更では閉じない)。
4. `repoRoot` の real path 解決を Git コマンド呼び出し前に固定 (8.3/大小文字/junction 対策)。
5. `CANDIDATE-U-PROJID-001..041` と `CANDIDATE-P-PROJID-001..003` を同じ oracle で検証する。

consumer runtime placement、Node generation producer、Pack publication、global memory 本文、
remote mutation、semantic ranking は本 plan の実装 slice に含めない。

## 6. Scope boundary

本 pair-freeze は read/create/commit-policy の決定性契約と candidate/oracle の整合だけを
確定する。実装 Green、Reverse R4、Issue #432 完了、#424 provider parity E2E の接続を意味しない。

## 6.1 Candidate ID inventory

Forward/Reverse/test-design が共有する全 U oracle は次のとおりである:

CANDIDATE-U-PROJID-001 CANDIDATE-U-PROJID-002 CANDIDATE-U-PROJID-003 CANDIDATE-U-PROJID-004 CANDIDATE-U-PROJID-005 CANDIDATE-U-PROJID-006 CANDIDATE-U-PROJID-007 CANDIDATE-U-PROJID-008 CANDIDATE-U-PROJID-009 CANDIDATE-U-PROJID-010 CANDIDATE-U-PROJID-011 CANDIDATE-U-PROJID-012 CANDIDATE-U-PROJID-013 CANDIDATE-U-PROJID-014 CANDIDATE-U-PROJID-015 CANDIDATE-U-PROJID-016 CANDIDATE-U-PROJID-017 CANDIDATE-U-PROJID-018 CANDIDATE-U-PROJID-019 CANDIDATE-U-PROJID-020 CANDIDATE-U-PROJID-021 CANDIDATE-U-PROJID-022 CANDIDATE-U-PROJID-023 CANDIDATE-U-PROJID-024 CANDIDATE-U-PROJID-025 CANDIDATE-U-PROJID-026 CANDIDATE-U-PROJID-027 CANDIDATE-U-PROJID-028 CANDIDATE-U-PROJID-029 CANDIDATE-U-PROJID-030 CANDIDATE-U-PROJID-031 CANDIDATE-U-PROJID-032 CANDIDATE-U-PROJID-033 CANDIDATE-U-PROJID-034 CANDIDATE-U-PROJID-035 CANDIDATE-U-PROJID-036 CANDIDATE-U-PROJID-037 CANDIDATE-U-PROJID-038 CANDIDATE-U-PROJID-039 CANDIDATE-U-PROJID-040 CANDIDATE-U-PROJID-041

`031`〜`039` は PR #516 の Sol FLAG (非author closing review, receipt 参照:
`docs/plans/PLAN-L7-529-project-identity-bootstrap.md` 本改訂コミット) を是正するために
追加した。内訳: `031` = §3.1.2 single-commit binding の TOCTOU 負系、`032`〜`033` =
§3.1.1 working tree drift (削除ケースと正常系control)、`034`〜`035` = §3.1.3 canonical
bytes 比較 (CRLF化・key順序違い)、`036`〜`038` = §3.1.4 repository binding を
`node-plan-revision-runner.ts`/`legacy-plan-inventory.ts`/`project-memory-root.ts` の
3呼び出し元それぞれで確認、`039` = origin無し・明示expected値無しの `identity_repository_unbound`。
`040`はdetached snapshot cloneのlocal originをexactly one Git custody hopだけ解決する回帰、
`041`はnetwork originと明示expected値の矛盾を到達可能な分岐として検証する。

実 repo regression は `CANDIDATE-P-PROJID-001`、`CANDIDATE-P-PROJID-002`、
`CANDIDATE-P-PROJID-003` とする。
