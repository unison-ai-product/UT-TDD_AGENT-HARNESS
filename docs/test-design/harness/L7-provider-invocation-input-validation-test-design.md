---
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: confirmed
pair_artifact: docs/design/harness/L6-function-design/provider-invocation-input-validation.md
related_function: src/runtime/adapter.ts
related_cli: src/cli.ts
---

# L7 test design: provider invocation input validation (Issue #1261 M1 / L1 / L2)

> **状態**: Issue #1284で本書の11件を正式oracle IDへ昇格した。本文は未実装の目標契約に対するtest designであり、ID昇格はsource実装、Green結果、非著者closing review PASSを意味しない。frontmatterのconfirmedは文書revisionの固定を示す。

## 1. 対象と根拠

pair L6: `docs/design/harness/L6-function-design/provider-invocation-input-validation.md`。

対象関数・経路:

- `src/schema/team.ts`: `modelOverrideSchema` / `reasoningEffortSchema` (受理集合の正本)
- `src/team/delegation-routing.ts`: `resolveDelegationRouting` (reviewer / worker分岐前の入口検証)
- `src/runtime/adapter.ts`: `buildAdapterPlan`、`buildProviderInvocation`、`isProviderCommandSpawnable`
- `src/team/run.ts`、`src/cli/delegation.ts`、`src/cli.ts`: team run / delegation / CLI実行境界

正式oracleを引用する既存testは `tests/delegation-routing.test.ts` と `tests/runtime-adapter.test.ts` の2本である。以下は独立した正式oracleの境界を示すもので、既存testのassertionを置き換えない。

## 2. Unit test harness制約

- `buildProviderInvocation` は `opts.platform` を明示してWindows分岐を選ぶ純unit testとする。実OSや実provider executableに依存しない。
- provider command解決に必要なfileは既存の一時fixtureと注入可能なlookup / envを使い、存在する`.cmd`または`.bat`を解決する。fixture自身もresolved path中の`%`を検証できる配置にする。
- spawn / provider / shellを実起動せず、戻り値・throw・spyされたspawn/probe call数・argv/env/stdin境界を検証する。
- 各正式oracleは1つの契約反例を独立して検出する。過度にまとめたparameterized assertionで複数境界の破損を隠さない。
- 受理の期待値を検証対象schemaのsafeParse結果だけから生成しない。通常モデル・alias・effortを明示したpositive fixtureと、percent・引用符・空白・空文字・不正effortを含むnegative fixtureを持ち、既存schemaとの整合も検査する。検証用fixtureはproductionのschema複製や別の受理正本にはしない。role/floorの別契約による拒否と構文拒否を区別する。

## 3. Formal oracle matrix

| Oracle ID | 関数 / surface | 反証可能な主張 |
|---|---|---|
| U-CMDINPUT-001 | `resolveDelegationRouting` | 許可済みreviewer / worker roleそれぞれで不正modelを与え、`ok: false` / `provider_model_invalid`。model検証を片側だけ外すmutationを検出する。 |
| U-CMDINPUT-002 | `resolveDelegationRouting` | 不正effortを各roleへ単独投入し、`provider_effort_invalid`。省略値は正常。effort検証を外すmutationを検出する。 |
| U-CMDINPUT-003 | delegation + team plan | 通常モデル・alias・省略modelの構文受理を固定し、percent・引用符・空白・空文字・`[1m]`は構文拒否。role/floor条件を満たすfixtureを用い、正常入力まで一律拒否するmutationを殺す。 |
| U-CMDINPUT-004 | delegation + team plan | low/medium/middle/high/xhighを受理し、Codex middle→medium、Claude middle→medium/xhigh→highを維持。未知値/空文字は拒否。既存正規化を削除するmutationを殺す。 |
| U-CMDINPUT-005 | `buildAdapterPlan` | 無効modelだけを投入し`available: false`、`provider_model_invalid`、`args: []`、envなし。effortは正常に保ち、adapter側model検証だけを外すmutationを殺す。 |
| U-CMDINPUT-006 | `buildAdapterPlan` | model正常で無効effortだけを投入し、005同様のshapeと`provider_effort_invalid`。双方不正時のmodel優先も固定。adapter側effort検証だけを外すmutationを殺す。 |
| U-CMDINPUT-007 | `buildProviderInvocation`, `platform: "win32"` | `.cmd`と`.bat`の実在fixture pathにpercentを置き、正常argsでも指定Error。resolved commandの検査だけを外すmutationを殺す。元tokenはmessageに含まれない。 |
| U-CMDINPUT-008 | `buildProviderInvocation`, `platform: "win32"` | commandは正常、先頭/中間/末尾argumentを1位置ずつpercentに変異させ、全件が指定Error。args検査だけを外すmutationを殺す。 |
| U-CMDINPUT-009 | `buildProviderInvocation` | 正常cmd/batのspace/quote/空tokenとwrapper argv/flagsを固定。percent付きでも非Windows/native直接実行はargs不変。全platform一律拒否とquote変化を検出する。 |
| U-CMDINPUT-010 | `isProviderCommandSpawnable` | percent付きcmd/batでbuilder拒否時、falseかつrunProbe spy 0回。builderをcatch外へ戻すmutationを殺し、正常probeはstub status0でtrue。 |
| U-CMDINPUT-011 | `buildAdapterPlan` + builder | model/effortは正常、taskだけpercentを含む。stdinが入力と一致し、taskはargvに現れず正常cmd invocationを返す。prompt検査の誤拡張/argv混入を検出する。 |

上記11件を本契約の正式oracle範囲とする。正常系は`it`、未実装の負系は`it.fails`で登録する。正式oracleを落とす・他のoracleへ統合して反証軸を失う変更は契約改訂で扱う。test名やIDだけを証拠とみなさない。

## 4. Red→Green→Refactor工程境界

1. **契約確認**: L6と本書のpair、既存schema集合、既存error boundaryを照合する。
2. **Red**: 契約merge後、sourceを変えず、未実装の負系を`it.fails`で登録する。使い捨てのcommitted HEADで一時的に`it`へ戻し、import/setup不備ではなく対象assertionで落ちることをcanonical runnerで確認する。正常系を`it.fails`へ偽装しない。
3. **昇格 (Issue #1284)**: exactなRed証拠とpair整合をレビューし、11件を正式 `U-CMDINPUT-001`〜`U-CMDINPUT-011` へ昇格してL6/L7の記載とtest labelを同期する。これはoracle IDの昇格であり、source実装やGreen結果を意味しない。src/scriptsは変えない。
4. **Green**: L6の最小実装で全既存assertionを維持して通す。CLI・builderの両層を片方だけに縮退させない。
5. **Refactor**: Green後に限り、重複せず既存schemaを再利用する形で整理する。外部挙動・検証境界・prompt stdinは変えない。

## 5. 非目標 / 検証しないこと

- model / effort schemaの受理集合やaliasをこのtest designが定義・拡張すること。
- 実provider、実`cmd.exe`、資格情報、networkを使った起動test。
- session / audit writeが拒否時に必ず0であるという保証。
- provider選択、taskの意味、role別policy、L2、agent-guard、floorの変更。
- prompt本文をargv/tokenへ移すこと、またはprompt中の`%`を拒否すること。
- 新しいPLAN、共有function-spec / L7 unit designへのoracle索引追加。
- L1について: 実git・networkを使う起動test、`--` end-of-optionsの付与、`gitLsRemoteInvocation`側の検査 (L6 §7.2で採らない)。
- L2について: 実`gh`・network・30秒の実時間待ちを使うtest、provider実行・probe・`git`へのtimeout付与 (L6 §8.1で対象外)、timeout値の環境変数・設定による上書き (L6 §8.2で作らない)。

## 6. L1: git ls-remote の remote 引数 (Issue #1261 L1)

> **状態**: L6 §7のpair-freezeのための候補test design。非著者closing review前であり、候補IDは正式oracleではない。工程は§4と同じ (Red → 昇格 → Green → Refactor)。

対象: `src/setup/update-check.ts` の `checkForUpdate`。既存test配置の候補は `tests/update-check.test.ts` の `describe("checkForUpdate")` である。`UpdateCheckDeps` を注入し、`listRemoteTags` / `readText` / `writeText` をspyする純unitとし、実gitやnetworkを使わない。期待する`detail`はL6 §7.3のliteralを明示して書き、production定数から生成しない。

| Candidate ID | 関数 / surface | 反証可能な主張 |
|---|---|---|
| CANDIDATE-U-CMDINPUT-012 | `checkForUpdate` (override) | `remoteOverride`が`--upload-pack=touch pwned`のとき、`checked: false`、`source: "none"`、`detail`が厳密に`remote rejected: starts with "-"`、`listRemoteTags` 0回、`writeText` 0回。`detail`に`upload-pack`を含まない。検査を削除するmutationを殺す。 |
| CANDIDATE-U-CMDINPUT-013 | `checkForUpdate` (package.json) | override無しでpackage.jsonの`repository.url`が`git+-oProxyCommand=x`のとき (`git+`除去後に`-`始まり)、012と同じshape・`listRemoteTags` 0回。検査をoverride経路だけに置くmutationを殺す。 |
| CANDIDATE-U-CMDINPUT-014 | `checkForUpdate` (cache順序) | `remoteOverride`が`-x`で、remote keyが`-x`かつTTL内のcacheを`readText`が返しても、`source: "cache"`にならず012と同じ拒否結果。加えて`readText`の呼び出し引数を記録し、`harnessRoot`直下の`package.json`の読取りは許容しつつ、cache path (`cacheRoot?.() ?? harnessRoot`配下の`UPDATE_CHECK_CACHE_PATH`) への`readText`が0回であることをassertする (cache path宛の呼び出し数と、package.json宛の呼び出し数を区別して数える)。検査をcache参照の後へ置くmutation (`readCache(deps)`の直後、cache採用分岐の前に拒否を置く実装) は、cache pathを1回読むため落ちる。
| CANDIDATE-U-CMDINPUT-015 | `checkForUpdate` (正常系) | `https://example.invalid/a-b.git`と、`.git`を持つharness rootでの`origin`は従来どおり`listRemoteTags`を各1回、そのremote値で呼ぶ。`includes("-")`等の過剰拒否mutationを殺す。正常系なので`it`で登録する。 |
| CANDIDATE-U-CMDINPUT-016 | `checkForUpdate` (再正規化禁止) | 注入した`remoteOverride`が先頭空白の` -x`を返すとき、解決済みremoteは再trimされず、`startsWith("-")`に該当しないため拒否されない (`detail`が`remote rejected`でない)。その値 ` -x` がそのまま (trimされずに) `listRemoteTags`へ1回渡されることをassertする。解決済みremoteを`remote.trim().startsWith("-")`のようにtrimしてから判定するmutationは、` -x`を`-x`として拒否し`listRemoteTags` 0回となるため落ちる (L6 §7.2の再正規化禁止)。正常系の固定なので`it`で登録する。

012〜014は未実装の負系として`it.fails`で登録し、015・016は`it`で登録する。`gitLsRemoteInvocation`のargv不変は既存の`U-UPDCHK-021`〜`024`が回帰fenceであり、本節で置き換えない。

## 7. L2: gh起動のtimeoutとprompt抑止 (Issue #1261 L2)

> **状態**: L6 §8のpair-freezeのための候補test design。非著者closing review前であり、候補IDは正式oracleではない。工程は§4と同じ (Red → 昇格 → Green → Refactor)。

対象: L6 §8.1の対象表の`gh`起動点と、新設の`src/github/gh-command.ts` (`GH_COMMAND_TIMEOUT_MS`、`ghCommandEnv`)。

- 実`gh`・networkを使わない。注入できる実行子 (`createGhPrMergePorts`の`execFileSync`、`scanPostMergeBackstop`の`execFileSync`、delegationの`spawnSync`、probeの`runProbe`) はspyを注入する。注入点の無いproduction用実行子 (`nodeGh`、`NodeGhCommandPort`、`createGhAttestationVerifier`の既定runner、`SystemSealedLineageIssueAuthorityPort`の既定exec、`validateLiveReviewSubject`の既定run) は、既存の前例 (`tests/claude-memory-wake.test.ts`) と同じく`vi.mock("node:child_process")`で`spawnSync` / `execFileSync`を差し替え、渡されたoptionsを記録する。
- timeoutは実時間で待たない。mockの`spawnSync`が`{ error: <code ETIMEDOUT のError>, status: null, signal: "SIGTERM", stdout: <妥当に見える出力> }`を返す形、mockの`execFileSync`が`code: "ETIMEDOUT"`と`stdout` (妥当に見えるJSON) を持つErrorを投げる形で模擬する。
- 期待値の`30000`と`"1"`はtestにliteralで書き、production定数から生成しない (定数の値を変えるmutationを検出するため)。
- 各候補は1つの入力クラスだけを壊し、他は正常に保つ。timeoutの有無を見る候補はenvを検査せず、envを見る候補はtimeoutを検査しない。起動点ごとに別の`it`にし、1つの起動点だけの付け忘れが他の起動点の成功に隠れないようにする。
- `cli.ts`は読込み時にcommandをparseするためimportできない。`cli.ts`内の起動点とexportされていない実行子は、候補020の静的fenceで扱う。

| Candidate ID | 関数 / surface | 反証可能な主張 (落とすmutation) |
|---|---|---|
| CANDIDATE-U-CMDINPUT-017 | `ghCommandEnv` | `GH_PROMPT_DISABLED`の無いenv、`""`のenv、`"0"`のenvのそれぞれで、戻り値の`GH_PROMPT_DISABLED`が`"1"`になる。sentinel key (`PATH`と、test用のダミー`GH_TOKEN`) が同じ値で残る。引数のobjectは呼出し前後で同じ内容で、戻り値は別objectである。呼出し後の`process.env.GH_PROMPT_DISABLED`は呼出し前と同じである。落とすmutation: 既存値を上書きしない (`??=`相当)、`{ GH_PROMPT_DISABLED: "1" }`だけを返して他のkeyを落とす、引数や`process.env`を書き換える。 |
| CANDIDATE-U-CMDINPUT-018 | 各`gh`起動点のtimeout (behavioral) | `nodeGh`、`NodeGhCommandPort.json`、`NodeGhCommandPort.run`、`createGhAttestationVerifier`の既定runner、`SystemSealedLineageIssueAuthorityPort.observe`の既定exec、`validateLiveReviewSubject`の既定run (`gh pr view`の呼出し)、`createGhPrMergePorts().getPullRequest`、`createGhPrMergePorts().mergePullRequest`の8起動点それぞれで、spawn optionsの`timeout`が`30000`である。envは検査しない。落とすmutation: どれか1起動点だけ`timeout`を付け忘れる、値を変える。 |
| CANDIDATE-U-CMDINPUT-019 | 各`gh`起動点のprompt抑止 (behavioral) | 018と同じ8起動点それぞれで、spawn optionsの`env.GH_PROMPT_DISABLED`が`"1"`で、test前に`process.env`へ置いたsentinel keyが`env`に残っている。timeoutは検査しない。落とすmutation: どれか1起動点だけ`env`を付け忘れる、`process.env`をそのまま渡す、`ghCommandEnv`を通さず`{ GH_PROMPT_DISABLED: "1" }`だけを渡して他のkeyを落とす。 |
| CANDIDATE-U-CMDINPUT-020 | 静的fence (`src/`の`gh`起動の棚卸し) | testに起動点の一覧 (path と囲む関数名) をliteralで持つ。`src/`の`.ts`を走査し、`"gh"`を実行ファイルとする起動 (`spawnSync` / `execFileSync` / `spawn` / 注入実行子の`run` / `runGh`、および`createGhAttestationVerifier`の既定binary) が一覧と一致することを確かめる。`src/cli/distribution.ts`の`gh --version`だけは理由付きの除外として一覧に書く。一覧のうち注入できない起動点 (`observeClaudeInboxPullRequest`、`fetchRulesetsViaGh`の2箇所、`review-custody-runner.ts`の`processEnvironment().runGh`、`publishLiveReviewReceipt`) は、その呼出しのoptions objectに`timeout: GH_COMMAND_TIMEOUT_MS`と`env: ghCommandEnv(`が書かれていることを確かめる。落とすmutation: 注入できない起動点の1つからtimeoutかenvを外す、一覧に無い`gh`起動を新しく足す。 |
| CANDIDATE-U-CMDINPUT-021 | timeoutの握りつぶし (`spawnSync`系) | mockの`spawnSync`がtimeoutを模擬し、`stdout`に妥当な出力を持たせる。`createGhAttestationVerifier().verify`は、`stdout`が検証成功のJSONでも`{ ok: false, reason: "audit_unavailable" }`を返す。`validateLiveReviewSubject`は、`git cat-file`を正常 (`status: 0`) にし、`gh pr view`だけがtimeoutで`stdout`に期待のhead SHAを持つとき、`{ ok: false, reason: "pull_request_head_unavailable" }`を返す。落とすmutation: `error`を見ずに`stdout`を使う、`status ?? 0`のように`null`を成功へ丸める。 |
| CANDIDATE-U-CMDINPUT-022 | timeoutの握りつぶし (`execFileSync`系の読み取り) | mockまたは注入の`execFileSync`が`ETIMEDOUT`のErrorを投げ、そのErrorの`stdout`に妥当なJSONを持たせる。`nodeGh`は`ok: false`、`SystemSealedLineageIssueAuthorityPort.observe`は`undefined`、`NodeGhCommandPort.json`はthrowする。merge gateは`gh pr view`のtimeoutで`ok: false`となり、`gh pr merge`の呼出しは0回である。落とすmutation: catchでErrorの`stdout`を成功として読む、`getPullRequest`の失敗後もmergeへ進む。 |
| CANDIDATE-U-CMDINPUT-023 | 変更系のtimeout (`gh pr merge` / `NodeGhCommandPort.run`) | merge gateの既存fixtureで、`gh pr view`は正常 (OPEN、head一致、checks green)、`gh pr merge`だけが`ETIMEDOUT`のErrorを投げる。結果は`ok: false`、`decision: "merge_failed"`、`reason`が`gh_merge_failed:`で始まり、`gh pr merge`の呼出しは厳密に1回である。`NodeGhCommandPort.run`は`ETIMEDOUT`をthrowのまま伝える。落とすmutation: merge timeoutを成功 (merged) と報告する、retryして2回以上呼ぶ、`run`の例外を握りつぶす。 |
| CANDIDATE-U-CMDINPUT-024 | providerの起動は対象外 | `executeAdapterPlanForCli`へspyの`spawnSync`を注入し、渡されたoptionsが`timeout` keyを持たず、`env`が`adapterExecutionEnv`の結果と一致する (`GH_PROMPT_DISABLED`を足していない)。`isProviderCommandSpawnable`の`runProbe`が受けるoptionsも`timeout` keyを持たない。team run (`cli.ts`の`spawn(invocation.command, ...)`) は020と同じ静的走査で、そのoptions objectに`timeout`が無いことを確かめる。落とすmutation: provider実行やprobeにも一律にtimeoutやprompt抑止を付ける。正常系の固定なので`it`で登録する。 |
| CANDIDATE-U-CMDINPUT-025 | 既存の別値の維持 (`post-merge-backstop`) | `scanPostMergeBackstop`へspyの`execFileSync`を注入し、`gh api`の呼出しのoptionsで`timeout`が`10000`、`env.GH_PROMPT_DISABLED`が`"1"`である。落とすmutation: timeoutを`GH_COMMAND_TIMEOUT_MS`へ揃えて既存値を変える、この起動点だけprompt抑止を付け忘れる。 |

017〜023と025は未実装の付与・負系を含むため`it.fails`で登録する。017は新設moduleが対象であり、Red時点ではmoduleが存在しない。test fileの読込み全体を落とさないよう、017は`it`の本体で`await import("../src/github/gh-command.ts")`する。017のRed証拠はこの読込み失敗であり、§4 step 2の「対象assertionで落ちる」の例外として扱う (018〜023・025は既存moduleを対象にし、対象assertionで落ちること)。024は現状でも成り立つ正常系の固定なので`it`で登録する。`update-check`の`LS_REMOTE_TIMEOUT_MS` (5000) は本節で検査しない (既存の`U-UPDCHK-*`の範囲)。
