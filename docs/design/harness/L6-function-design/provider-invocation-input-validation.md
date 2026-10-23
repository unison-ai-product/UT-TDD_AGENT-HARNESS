---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_provider_invocation_input_validation
pair_artifact: docs/test-design/harness/L7-provider-invocation-input-validation-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1261
---

# L6 機能設計: provider invocation input validation (Issue #1261 M1 / L1 / L2)

> **契約状態**: 本文はM1の目標契約である。Issue #1284で対になるL7の11件を正式oracleへ昇格した。このID昇格はsource実装、Green結果、closing review PASSを示すものではない。frontmatterのconfirmedは文書revisionの固定を示し、実装完了を表さない。

L6 contract marker: M1は既存の `buildProviderInvocation(input: ProviderInvocationInput) => ProviderInvocation` と `buildAdapterPlan(intent: AdapterIntent, mode: ExecutionMode) => AdapterPlan` (§5、正式oracle `U-CMDINPUT-001`〜`011`)、L1は `checkForUpdate(deps: UpdateCheckDeps) => UpdateCheckResult` (§7、候補 `CANDIDATE-U-CMDINPUT-012`〜`016`)、L2は `ghCommandEnv(env: NodeJS.ProcessEnv) => NodeJS.ProcessEnv` と定数 `GH_COMMAND_TIMEOUT_MS` (§8、候補 `CANDIDATE-U-CMDINPUT-017`〜`026`) を契約面とする。§7・§8の候補は正式oracleではない。

## 1. 目的と範囲

CLIからprovider invocationを組み立てる前にmodel / reasoning effortを既存schemaで一貫して検証し、Windowsの`cmd.exe`経由で`.cmd` / `.bat`を起動するときは、command文字列へ展開する全tokenを最終境界で検査する。入口検証と最終token検査を独立した2層として維持する。

対象はIssue #1261 M1と、§7のL1 (`git ls-remote`へ渡すremote引数のoption注入拒否) と、§8のL2 (`gh`起動のtimeoutとprompt抑止) に限定する。agent-guard、floor、共有function-specおよび共有L7 unit designの改訂は対象外。M1の対象はschemaの複製や新moduleではなく、既存schemaとprovider invocation choke pointの契約である (L2の置き場は§8.2で別に定める)。

## 2. 既存schemaを使うmodel / effort検証

| 値 | 正本 | M1契約 |
|---|---|---|
| model override | `src/schema/team.ts` の `modelOverrideSchema` | 既存の受理集合をそのまま使用する。新しいmodel文法・aliasを足さず、受理集合を狭めない。 |
| reasoning effort | `src/schema/team.ts` の `reasoningEffortSchema` | 既存の受理集合をそのまま使用する。既存の`medium` / `middle`正規化を保つ。 |

省略値 (`undefined`) は任意入力として許可する。空文字列や既存schemaに適合しない値は拒否する。schemaを複製したり、CLIごとに別の受理集合を定義したりしない。`[1m]`のような個別入力を根拠に受理文法を追加・変更しない。

### 2.1 委譲routingでの入口検証

`src/team/delegation-routing.ts` の `resolveDelegationRouting` は、既存のrole許可検証後、reviewer / workerのrouting分岐より前に、指定されたmodel / effortを既存schemaで検証する。不正値は既存の失敗shape (`ok: false` と `message`) で返す。model不正は `provider_model_invalid`、effort不正は `provider_effort_invalid` とし、両方不正ならmodelを先に報告する。省略時は既存のdefault / model policyを変えない。構文を受理しても、別契約のrole・review floor等の検証を免除しない。

### 2.2 Team runのplan生成境界

`src/runtime/adapter.ts` の `buildAdapterPlan` はteam runを含むplan生成境界で、effort正規化より前に同じ既存schemaを適用する。無効なmodel / effortを含むmemberについては、planを `available: false` とし、既存形式の `messages` に上記と同じ診断literalを載せ、実行用 `args` は空、provider用 `env` は未生成とする。providerやtaskを別の値へ置換・再routingして成功扱いしない。他memberのplan形状と、入力が有効な場合の既存plan挙動は維持する。診断へ入力の生値を含めない。

この検証をチームrun固有の別schemaや新source moduleへ分離しない。`resolveDelegationRouting` と `buildAdapterPlan` が同じschema正本を参照することで、CLI delegationとteam runの受理集合を一致させる。

## 3. Windows cmd/bat invocationの最終防御

### 3.1 適用点

`src/runtime/adapter.ts` の `buildProviderInvocation` / `quoteCmdToken` を最終境界とする。Windowsで解決済みcommandが`.cmd`または`.bat`の場合、`cmd.exe /d /s /c`用command stringへ渡すresolved command pathと全argument tokenを、quote / joinの前に検査する。どのtokenにも`%`が含まれてはならない。resolved command path自身も検査対象である。

違反時はprovider spawnより前に、messageが厳密に `provider_cmd_token_percent_forbidden` の `Error` をthrowする。message等へ元token値を展開しない。quote処理だけで`%`を安全化したとみなさず、拒否を優先する。

### 3.2 適用しない経路

- 非Windowsの直接実行は現状のまま維持する。
- Windowsのnative executableの直接実行には、cmd wrapper専用の拒否規則を広げない。
- Windows cmd/batで`%`のないtokenは既存quote、`cmd.exe` argv、`shell: false`および`windowsVerbatimArguments`の挙動を維持する。
- prompt本文は引き続きstdinへ渡す。prompt内の`%`はcommand token検査対象にしない。

## 4. 呼出経路と失敗境界

| 経路 | 入口検証 / builder | 失敗時の境界 |
|---|---|---|
| `ut-tdd team run` | team planの`buildAdapterPlan`でmodel / effortを検証し、実行時には共通builderを通す | 無効memberは利用不可planとなり、provider spawnは0回。token検査例外もspawn前に既存エラー処理へ載る。 |
| `ut-tdd codex` / `ut-tdd claude` delegation | CLI入力を受けた`resolveDelegationRouting`でrole分岐前に検証し、plan / invocationの組立てでも既存の共通境界を保つ | 無効値はrouting / invocation実行へ進まず、provider spawnは0回。 |
| provider probe / mode detection | `isProviderCommandSpawnable`が共通`buildProviderInvocation`を利用する | builder構築を含む既存catch境界内で失敗を`false`として返し、probeのrun countは0。 |

拒否によりprovider invocation / spawnが行われないことを保証する。session recordやaudit writeが0件であることまでは本契約で保証しない。probeにmodel / effortを新設しない。

## 5. 不変条件

関数署名は既存の `buildProviderInvocation(input: ProviderInvocationInput) => ProviderInvocation`、
`buildAdapterPlan(intent: AdapterIntent, mode: ExecutionMode) => AdapterPlan` を保つ。

| DbC | 契約 |
| --- | --- |
| pre | model/effortは省略可能な外部入力であり、型宣言だけを検証とみなさない。Windowsのcommand解決は既存の規則に従う。 |
| post | 不正model/effortは失敗plan/routing、cmd/batのpercent tokenは指定Errorとなり、該当providerをspawnしない。probeはfalse、runProbe呼出し0。 |
| invariant | 正常値の既存正規化、直接実行、stdin prompt、role/floorの独立検証を維持し、schemaや実行経路を複製しない。 |
| oracle | 専用L7の正式oracle `U-CMDINPUT-001`〜`U-CMDINPUT-011` が、入口・最終境界・probe・stdinを独立して反証する。正式IDへの昇格はsource実装やGreen結果を意味しない。 |

1. model / effortの許容値は既存schemaが単一正本であり、team runとdelegationで一致する。
2. CLI入口での検証はWindows最終token検査の代替ではない。直接builderを使うprobe等も最終検査を通る。
3. Windows cmd/batのresolved commandを含む全tokenに対し、`%`拒否はquote / spawnより先に実施する。
4. 拒否時にmodel / effort・provider・taskを黙って変更して実行可能にしない。
5. 有効入力での既存quote、非Windows/nativeの直接実行、prompt stdinを維持する。
6. token値そのものをエラーmessageへ含めない。

## 6. 対になるテスト設計

正式oracleと反証条件はpair artifact `docs/test-design/harness/L7-provider-invocation-input-validation-test-design.md` に記す。`U-CMDINPUT-001`〜`U-CMDINPUT-011` は正式IDであり、実装完了やGreen結果を表さない。

## 7. git ls-remote の remote 引数 (Issue #1261 L1)

> **契約状態**: 本節はL1のpair-freezeのための契約案であり、非著者のclosing review前である。未実装の目標契約であり、source実装・L7候補の正式昇格・実行証跡を示さない。§1〜§6のM1契約は本節で変えない。

### 7.1 入力境界

`src/setup/update-check.ts` の `checkForUpdate` が `configuredRemote` で解決したremote文字列を入力境界とする。解決順 (`UT_TDD_UPDATE_CHECK_REMOTE` override → harness root package.jsonの`repository.url` (`normalizeRepositoryUrl`で`git+`除去・trim済み) → harness root自身が`.git`を持つときだけ`origin`) は `docs/design/harness/L6-function-design/setup-solo-team.md` §8 のまま変えない。検査はどの出所から来た値にも同じ1か所で適用し、出所ごとに別の規則を持たない。

### 7.2 拒否規則

- 解決済みremoteが `-` で始まる (`remote.startsWith("-")`) とき拒否する。`--upload-pack=<cmd>` 等がgitのoptionとして解釈されるのを防ぐ。
- 判定は解決済みの値そのものに対して行う。値をtrim・正規化し直して判定を変えない (前後空白の除去は既存の解決処理の責務のまま)。
- `-` を先頭以外に含むURL (`https://example/a-b.git` 等) や `origin` は従来どおり受理する。
- 検査は `configuredRemote` の直後、cache参照 (`readCache`) と `listRemoteTags` 呼出しより前に置く。cacheに同じremote keyが残っていても拒否が優先する。
- `git ls-remote --tags -- <remote>` のような `--` end-of-optionsは**使わない**。拒否だけで注入経路は閉じ、`gitLsRemoteInvocation` のargv形 (`["ls-remote", "--tags", remote]`) と`.cmd` shim経路の既存挙動を変えないためである。`gitLsRemoteInvocation` / `listRemoteTags` 側に第2の検査層は設けない (呼出し元は`checkForUpdate`だけであり、最小実装とする)。

### 7.3 診断と失敗時の挙動

update checkはadvisoryであり、既存の `failOpen` と同じ形で返す。

| 項目 | 契約 |
|---|---|
| 戻り値 | `checked: false`、`latestVersion: null`、`updateAvailable: false`、`source: "none"`、`localVersion` は解決済みのlocal version |
| `detail` | 厳密に `remote rejected: starts with "-"` (既存の `remote tags unreachable` 等と同じ`detail`の平文literal) |
| 表示 | `renderUpdateLine` の既存分岐により `update: check skipped (remote rejected: starts with "-")` |
| 秘匿 | `detail` にremoteの生値を含めない |

gitの起動に対してはfail-closeとする: 拒否時は `listRemoteTags` を呼ばず (git spawn 0回)、cacheの読み書きもしない。status / doctorに対してはfail-openとする: throwせず、exit codeに影響しない (setup-solo-team.md §8の「advisoryであってgateではない」を維持)。

### 7.4 不変条件

関数署名 `checkForUpdate(deps: UpdateCheckDeps) => UpdateCheckResult` と `gitLsRemoteInvocation` の署名・argvは変えない。

| DbC | 契約 |
| --- | --- |
| pre | 無し (never throws)。remoteの出所は§7.1の3種で、どれも外部入力として扱う。 |
| post | `-`始まりのremoteは§7.3の結果となり、`listRemoteTags`呼出し0回・cache書込み0回。それ以外のremoteは既存挙動のまま。 |
| invariant | remote解決順、cache TTL、`gitLsRemoteInvocation`のargvと`%`回避、advisoryの非gate性を維持する。 |
| oracle | 専用L7の `CANDIDATE-U-CMDINPUT-012`〜`016` (016は§7.2の再正規化禁止を固定する)。まだ正式oracleではない。 |

## 8. 外部コマンドのtimeoutとgh promptの抑止 (Issue #1261 L2)

> **契約状態**: 本節はL2のpair-freezeのための契約案であり、非著者のclosing review前である。未実装の目標契約であり、source実装・L7候補の正式昇格・実行証跡を示さない。§1〜§7の契約は本節で変えない。行番号はorigin/main `5630f0f7d` 時点の実測である。

### 8.1 対象の範囲

対象は、`src/`配下でGitHubへ接続する`gh`の起動だけとする。起動点は下表の14箇所 (timeout未設定11、設定済み3: `project-v2.ts:60` / `:71`、`post-merge-backstop.ts:136`) であり、L2の受入の分母は14とする。ネットワークの不調や認証プロンプトで止まりうるのはこれらであり、`review-attestation.yml` のjobには`timeout-minutes`が無いため、CIでの停止はrunnerの既定上限まで続く。

| 起動点 (path:line) | コマンド | 現在のtimeout | 既存の失敗の扱い |
|---|---|---|---|
| `src/cli.ts:625` `observeClaudeInboxPullRequest` | `gh pr view` (SessionStart経路) | 無し | catchして`undefined` (entryは残す)。advisory |
| `src/cli.ts:4138` / `:4144` `fetchRulesetsViaGh` | `gh api .../rulesets` | 無し | throwし、`policy inspect` 等の呼出し元catchでexit 3 |
| `src/setup/index.ts:1176` `nodeGh` | `gh api` (setupの検出) | 無し | catchして`{ ok: false }` |
| `src/feedback/review-custody-runner.ts:289` `processEnvironment().runGh` | `gh api .../pulls/<n>` (CI) | 無し | `error`を`status: null`へ写し、`status !== 0`でthrow → 非0終了 |
| `src/feedback/adapters/gh-attestation-verifier.ts:35` `defaultRunner` | `gh attestation verify` (CI) | 無し | `error`を`status: null`へ写し、`audit_unavailable` |
| `src/github/project-v2.ts:60` / `:71` `NodeGhCommandPort` | `gh api` / `gh project` | `30_000` | throwし、呼出し元の既存処理 |
| `src/cli/review-live.ts:120` `validateLiveReviewSubject`の既定`run` | `git cat-file` と `gh pr view` | 無し | `status`が0以外 (timeout時は`null`) で`exact_head_not_found` / `pull_request_head_unavailable` |
| `src/cli/review-live.ts:261` `publishLiveReviewReceipt` | `gh pr comment` (変更系) | 無し | throwし、`review live-consume`のcatchでexit 1 |
| `src/feedback/post-merge-backstop.ts:136` `defaultFetchMergedPrPage` | `gh api .../pulls` | `POST_MERGE_COMMAND_TIMEOUT_MS` (10_000) | throwし、呼出し元の既存処理 |
| `src/feedback/review-merge-gate.ts:567` `readGhView` | `gh pr view` | 無し | throwし、`getPullRequest`のcatchで`ok: false` |
| `src/feedback/review-merge-gate.ts:604` `createGhPrMergePorts().mergePullRequest` | `gh pr merge` (変更系、`stdio: "inherit"`) | 無し | throwし、`merge_failed` / `gh_merge_failed:<message>` |
| `src/plan-asset/ledger/sealed-lineage-local-migration.ts:199` `SystemSealedLineageIssueAuthorityPort`の既定`exec` | `gh api .../issues/<n>` | 無し | catchして`undefined` |

対象外とする起動と、その理由:

| 起動点 | 理由 |
|---|---|
| provider の実行: `src/cli/delegation.ts:212` (`ut-tdd codex` / `claude`)、`src/cli.ts:3439` (team run)、`src/cli/review-live.ts:156` (live reviewの入れ子CLI) | 正当な実行時間がtaskに依存して上限を持たない (review・実装sessionは数十分続く)。固定のtimeoutは正当な作業を途中で止め、verdict fileからreceiptへの封印を失わせる。delegationはstdioをinheritして対話を含み、停止は操作者に見えてCtrl-Cで止められる。provider CLIは自身でnetwork・認証を扱い、harness側のtimeoutでは原因を区別できない。CI (`harness-check.yml` / `review-attestation.yml`) はproviderを起動しない。 |
| provider probe `src/runtime/adapter.ts:340` (`--version`) と PATH lookup `:200` (`where.exe` / `which`) | networkにも認証にも触れず、L2の停止原因に該当しない。M1 §4のprobe契約を変えない。 |
| `src/cli/distribution.ts:857` `gh --version` | GitHubへ接続しない存在確認である。 |
| `git`の起動 (`src/`配下の`execFileSync("git", ...)` 等、直接の起動だけで60箇所超) | local repositoryの操作であり、network・認証プロンプトを伴わない。networkへ出る`git`は`update-check`の`ls-remote`だけで、既に`LS_REMOTE_TIMEOUT_MS` (5000) が付く (`setup-solo-team.md` §8「timeout 付き」)。`release-artifact-resolver.ts:97`はlocal操作で、既に`GIT_TERMINAL_PROMPT=0`を設定している。 |
| `src/cli.ts:3563` (node scopeの観測) と `src/lint/verification-profile.ts:138` / `:142` | 既にtimeoutを持つ (30_000、`PROBE_TIMEOUT_MS`、`RUN_TIMEOUT_MS`)。 |
| `scripts/` 配下 | OSの薄い入口であり、`pack-canary-acceptance.mjs`は自前のtimeoutを持つ。本節の対象を`src/`に限る。 |
| `gh`の`.cmd` / `.bat` shim経由の起動 | 前提とする`gh`はnative executable (本環境の実測で `C:\Program Files\GitHub CLI\gh.exe`) である。shimを解決する処理は足さず、`shell: true`も足さない (shim経由ではtimeoutの終了要求が`cmd.exe`にしか届かない可能性があり、本節では扱わない)。 |

### 8.2 timeoutの値と置き場

- 新しいsource module `src/github/gh-command.ts` に、定数 `GH_COMMAND_TIMEOUT_MS = 30_000` と純関数 `ghCommandEnv` (§8.3) の2つだけを置く。port・adapter・設定file・環境変数でのtimeout上書きは作らない。値を利用者が変える手段を足さない。
- 値は30秒とし、これを**暫定の運用上限**と位置づける。repo内で`gh`に付いている既存の値 (`NodeGhCommandPort`の`30_000`) に揃えたものであり、正常な検証や更新に十分な時間であるとは主張しない。読み取りと変更系で値を分けない (分ける根拠となる実測が無い)。`gh attestation verify`のcold (初回のtrust root取得あり) / warmの所要時間の実測は、Green側の確認事項として残す。
- `timeout`の意味は「経過後に子プロセスへ終了要求 (signal) を送る」である。Nodeの同期API (`spawnSync` / `execFileSync`) は終了要求の後も子の終了を待って戻るため、「30秒以内に必ず戻る」という上限は保証しない。
- 既に別の値を持つ起動点は、その値を変えない: `post-merge-backstop`は`POST_MERGE_COMMAND_TIMEOUT_MS` (10_000) のまま (30秒へ延ばす根拠が無い)、`update-check`は`LS_REMOTE_TIMEOUT_MS` (5000) のままとする。
- `NodeGhCommandPort`の2つの`30_000` literalは、値を変えずに`GH_COMMAND_TIMEOUT_MS`へ置き換える (Refactor工程で行う)。
- §8.1の対象表の各起動点は、production用の実行子のspawn optionsに`timeout`を渡す。injectionできる実行子 (`runCommand` / `runGh` / `exec` / `execFileSync`の注入) の型は変えない。`createGhPrMergePorts`と`post-merge-backstop`のようにoptionsを呼出し側で組み立てて注入実行子へ渡す起動点は、そのoptionsに`timeout`を含める。

### 8.3 `GH_PROMPT_DISABLED=1` の設定

- `ghCommandEnv(env: NodeJS.ProcessEnv) => NodeJS.ProcessEnv` の本体は `({ ...env, GH_PROMPT_DISABLED: "1" })` 相当とし、新しいobjectを返す。既存の`GH_PROMPT_DISABLED` (空文字や`"0"`を含む) は`"1"`で上書きする。他のkey (`PATH`、`GH_TOKEN`等) は保つ。引数のobjectは変更しない。
- §8.1の対象表の各起動点は、spawn optionsに`env: ghCommandEnv(process.env)`を渡す。`timeout`と同じ位置 (production用の実行子、または呼出し側で組み立てるoptions) に置く。
- `process.env`を全体で書き換えて設定しない。provider子プロセスや`git`等、対象外の起動へ`GH_PROMPT_DISABLED`を漏らさないためである。`adapterExecutionEnv`はL2で変えない。
- `validateLiveReviewSubject`の既定`run`は`git`と`gh`に共用されている。`timeout`と`env: ghCommandEnv(process.env)`は `command === "gh"` のときだけoptionsへ足し、`git cat-file`のoptionsは現状のまま (timeoutもenvも足さない) とする。§8.1で`git`を対象外にした判断を、共用の実行子で崩さないためである。

### 8.4 timeoutになったときの挙動

Nodeは、`spawnSync`では`error` (code `ETIMEDOUT`) と`status: null`を返し、`execFileSync`では例外を投げる。L2では新しい分岐や診断literalを足さず、timeoutを各起動点の既存の失敗経路 (§8.1の表の右列) にそのまま載せる。

- **成功に丸めない**: timeout時の`stdout`に妥当に見える出力 (head SHAやJSON) が含まれても使わない。`status: null`を`0`扱いにしない。
- **変更系のtimeoutは「結果不明」である**: `gh pr merge`、`gh pr comment`、`NodeGhCommandPort.run`は、終了要求の時点でserver側に反映済みの可能性がある。ここでのfail-closeは「成功を認定しない」の意味に限り、「更新されなかった」ことは保証しない。既存の失敗経路で報告する: `review-merge-gate.ts:437-446`は`mergePullRequest`の例外を`decision: "merge_failed"`・`reason: gh_merge_failed:<message>`にする (mergeが実際に済んでいても成功とは報告しない)。`review-live.ts:252-264`は`writeMemory`でreceipt memoryを書いた後に`gh pr comment`を呼ぶため、commentのtimeoutではmemoryは書かれたまま、commentの有無は不明のままexit 1になる。
- **自動でretryしない**: 変更系を再実行すると、反映済みだった場合に二重のmergeの試行や重複commentを生む。重複更新を防ぐため、実行子の呼出しは1回だけとする。読み取り系もL2ではretryを足さない。
- **advisoryはfail-open**: `observeClaudeInboxPullRequest`、`SystemSealedLineageIssueAuthorityPort.observe`、`nodeGh`は、既存どおり`undefined` / `{ ok: false }`を返してthrowしない。
- **gate・custodyはfail-close**: review custody runner、attestation verify、merge gate、review subjectの検証、`github policy`は、既存どおり非0終了・`audit_unavailable`・`ok: false`になる。
- 診断へtimeoutを示す新しい文言を足さない。既存のmessage (`gh_merge_failed:<message>`等) にNodeのerror messageが入ることは許す。

### 8.5 不変条件

関数署名: 新設は `ghCommandEnv(env: NodeJS.ProcessEnv) => NodeJS.ProcessEnv` だけである。既存の `nodeGh(args: string[]) => { ok: boolean; stdout: string }`、`createGhPrMergePorts(dependencies: { execFileSync?: ExecFileSync }) => GhPrMergePorts`、`createGhAttestationVerifier(options: GhAttestationVerifierOptions) => GitHubAttestationVerifierPort`、`validateLiveReviewSubject(input) => LiveReviewSubjectValidationResult` の署名は変えない。

| DbC | 契約 |
| --- | --- |
| pre | `ghCommandEnv`の引数は任意のenv objectで、`GH_PROMPT_DISABLED`の有無を問わない。§8.1対象表の起動点は、ネットワーク不調・認証待ちで応答しない`gh`を外部入力として扱う。 |
| post | 対象表の14起動点のspawn optionsは`timeout` (`GH_COMMAND_TIMEOUT_MS`、`post-merge-backstop`は`POST_MERGE_COMMAND_TIMEOUT_MS`) と`env.GH_PROMPT_DISABLED === "1"`を持つ。timeoutは子への終了要求であって戻りまでの上限ではない。timeoutはその起動点の既存の失敗経路に載り、成功の認定・retryにならない。変更系では更新の有無を保証しない。`ghCommandEnv`は引数を変えず、他のkeyを保ち、既存の`GH_PROMPT_DISABLED`を上書きした新objectを返す。 |
| invariant | provider実行・probe・`git` (`validateLiveReviewSubject`の共用runnerの`git`呼出しを含む)・`gh --version`のspawn optionsにtimeoutを足さず、`shell: true`を足さず、`process.env`と`adapterExecutionEnv`を変えない。既存の別値 (10_000 / 5000) を変えない。注入できる実行子の型を変えない。 |
| oracle | 専用L7の `CANDIDATE-U-CMDINPUT-017`〜`026`。まだ正式oracleではない。 |
