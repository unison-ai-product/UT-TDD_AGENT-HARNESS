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

# L6 機能設計: provider invocation input validation (Issue #1261 M1 / L1)

> **契約状態**: 本PRはpair-freezeのための契約案であり、非著者のclosing review前である。本文は未実装の目標契約であり、source実装・L7候補の正式昇格・実行証跡を示すものではない。frontmatterのconfirmedは提案する文書revisionの固定を示し、review PASSや実装完了を表さない。

## 1. 目的と範囲

CLIからprovider invocationを組み立てる前にmodel / reasoning effortを既存schemaで一貫して検証し、Windowsの`cmd.exe`経由で`.cmd` / `.bat`を起動するときは、command文字列へ展開する全tokenを最終境界で検査する。入口検証と最終token検査を独立した2層として維持する。

対象はIssue #1261 M1と、§7のL1 (`git ls-remote`へ渡すremote引数のoption注入拒否) に限定する。L2、agent-guard、floor、共有function-specおよび共有L7 unit designの改訂は対象外。本書の対象はschemaの複製や新moduleではなく、既存schemaとprovider invocation choke pointの契約である。

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
| oracle | 専用L7の `CANDIDATE-U-CMDINPUT-001`〜`011` が、入口・最終境界・probe・stdinを独立して反証する。まだ正式oracleではない。 |

1. model / effortの許容値は既存schemaが単一正本であり、team runとdelegationで一致する。
2. CLI入口での検証はWindows最終token検査の代替ではない。直接builderを使うprobe等も最終検査を通る。
3. Windows cmd/batのresolved commandを含む全tokenに対し、`%`拒否はquote / spawnより先に実施する。
4. 拒否時にmodel / effort・provider・taskを黙って変更して実行可能にしない。
5. 有効入力での既存quote、非Windows/nativeの直接実行、prompt stdinを維持する。
6. token値そのものをエラーmessageへ含めない。

## 6. 対になるテスト設計

候補oracleと反証条件はpair artifact `docs/test-design/harness/L7-provider-invocation-input-validation-test-design.md` に記す。L7候補は通常testとしてRed工程で追加・確認されるまで正式oracleではない。

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
| oracle | 専用L7の `CANDIDATE-U-CMDINPUT-012`〜`015`。まだ正式oracleではない。 |
