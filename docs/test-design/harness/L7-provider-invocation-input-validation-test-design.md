---
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: confirmed
pair_artifact: docs/design/harness/L6-function-design/provider-invocation-input-validation.md
related_function: src/runtime/adapter.ts
related_cli: src/cli.ts
---

# L7 test design: provider invocation input validation (Issue #1261 M1 / L1)

> **状態**: 本PRの非著者closing review前の契約案。本文は未実装の目標契約に対する候補test designであり、候補IDは正式oracle宣言ではない。frontmatterのconfirmedは提案revisionの固定であり、review PASSを意味しない。テスト起動・実装・実証済み結果を記録していない。

## 1. 対象と根拠

pair L6: `docs/design/harness/L6-function-design/provider-invocation-input-validation.md`。

対象関数・経路:

- `src/schema/team.ts`: `modelOverrideSchema` / `reasoningEffortSchema` (受理集合の正本)
- `src/team/delegation-routing.ts`: `resolveDelegationRouting` (reviewer / worker分岐前の入口検証)
- `src/runtime/adapter.ts`: `buildAdapterPlan`、`buildProviderInvocation`、`isProviderCommandSpawnable`
- `src/team/run.ts`、`src/cli/delegation.ts`、`src/cli.ts`: team run / delegation / CLI実行境界

既存test配置の候補は `tests/runtime-adapter.test.ts`、`tests/team-run.test.ts`、`tests/cli-delegation.test.ts` および該当するprobe / mode-detection testである。以下は独立oracle候補の境界を示すもので、既存testのassertionを置き換えない。

## 2. Unit test harness制約

- `buildProviderInvocation` は `opts.platform` を明示してWindows分岐を選ぶ純unit候補とする。実OSや実provider executableに依存しない。
- provider command解決に必要なfileは既存の一時fixtureと注入可能なlookup / envを使い、存在する`.cmd`または`.bat`を解決する。fixture自身もresolved path中の`%`を検証できる配置にする。
- spawn / provider / shellを実起動せず、戻り値・throw・spyされたspawn/probe call数・argv/env/stdin境界を検証する。
- 各候補は1つの契約反例を独立して検出する。過度にまとめたparameterized assertionで複数境界の破損を隠さない。
- 受理の期待値を検証対象schemaのsafeParse結果だけから生成しない。通常モデル・alias・effortを明示したpositive fixtureと、percent・引用符・空白・空文字・不正effortを含むnegative fixtureを持ち、既存schemaとの整合も検査する。検証用fixtureはproductionのschema複製や別の受理正本にはしない。role/floorの別契約による拒否と構文拒否を区別する。

## 3. Candidate oracle matrix

| Candidate ID | 関数 / surface | 反証可能な主張 |
|---|---|---|
| CANDIDATE-U-CMDINPUT-001 | `resolveDelegationRouting` | 許可済みreviewer / worker roleそれぞれで不正modelを与え、`ok: false` / `provider_model_invalid`。model検証を片側だけ外すmutationを検出する。 |
| CANDIDATE-U-CMDINPUT-002 | `resolveDelegationRouting` | 不正effortを各roleへ単独投入し、`provider_effort_invalid`。省略値は正常。effort検証を外すmutationを検出する。 |
| CANDIDATE-U-CMDINPUT-003 | delegation + team plan | 通常モデル・alias・省略modelの構文受理を固定し、percent・引用符・空白・空文字・`[1m]`は構文拒否。role/floor条件を満たすfixtureを用い、正常入力まで一律拒否するmutationを殺す。 |
| CANDIDATE-U-CMDINPUT-004 | delegation + team plan | low/medium/middle/high/xhighを受理し、Codex middle→medium、Claude middle→medium/xhigh→highを維持。未知値/空文字は拒否。既存正規化を削除するmutationを殺す。 |
| CANDIDATE-U-CMDINPUT-005 | `buildAdapterPlan` | 無効modelだけを投入し`available: false`、`provider_model_invalid`、`args: []`、envなし。effortは正常に保ち、adapter側model検証だけを外すmutationを殺す。 |
| CANDIDATE-U-CMDINPUT-006 | `buildAdapterPlan` | model正常で無効effortだけを投入し、005同様のshapeと`provider_effort_invalid`。双方不正時のmodel優先も固定。adapter側effort検証だけを外すmutationを殺す。 |
| CANDIDATE-U-CMDINPUT-007 | `buildProviderInvocation`, `platform: "win32"` | `.cmd`と`.bat`の実在fixture pathにpercentを置き、正常argsでも指定Error。resolved commandの検査だけを外すmutationを殺す。元tokenはmessageに含まれない。 |
| CANDIDATE-U-CMDINPUT-008 | `buildProviderInvocation`, `platform: "win32"` | commandは正常、先頭/中間/末尾argumentを1位置ずつpercentに変異させ、全件が指定Error。args検査だけを外すmutationを殺す。 |
| CANDIDATE-U-CMDINPUT-009 | `buildProviderInvocation` | 正常cmd/batのspace/quote/空tokenとwrapper argv/flagsを固定。percent付きでも非Windows/native直接実行はargs不変。全platform一律拒否とquote変化を検出する。 |
| CANDIDATE-U-CMDINPUT-010 | `isProviderCommandSpawnable` | percent付きcmd/batでbuilder拒否時、falseかつrunProbe spy 0回。builderをcatch外へ戻すmutationを殺し、正常probeはstub status0でtrue。 |
| CANDIDATE-U-CMDINPUT-011 | `buildAdapterPlan` + builder | model/effortは正常、taskだけpercentを含む。stdinが入力と一致し、taskはargvに現れず正常cmd invocationを返す。prompt検査の誤拡張/argv混入を検出する。 |

上記11候補を本契約の検証範囲とする。正常系は`it`、未実装の負系は`it.fails`で登録するが、候補を落とす・他の候補へ統合して反証軸を失う変更は契約改訂で扱う。test名やIDだけを証拠とみなさない。

## 4. Red→Green→Refactor工程境界

1. **契約確認**: L6と本書のpair、既存schema集合、既存error boundaryを照合する。
2. **Red**: 契約merge後、sourceを変えず、未実装の負系を`it.fails`で登録する。使い捨てのcommitted HEADで一時的に`it`へ戻し、import/setup不備ではなく対象assertionで落ちることをcanonical runnerで確認する。正常系を`it.fails`へ偽装しない。
3. **昇格**: exactなRed証拠とpair整合をレビューし、候補11件を正式 `U-CMDINPUT-*` へ昇格し、test labelも同時に変更する。src/scriptsは変えない。
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

## 6. L1: git ls-remote の remote 引数 (Issue #1261 L1)

> **状態**: L6 §7のpair-freezeのための候補test design。非著者closing review前であり、候補IDは正式oracleではない。工程は§4と同じ (Red → 昇格 → Green → Refactor)。

対象: `src/setup/update-check.ts` の `checkForUpdate`。既存test配置の候補は `tests/update-check.test.ts` の `describe("checkForUpdate")` である。`UpdateCheckDeps` を注入し、`listRemoteTags` / `readText` / `writeText` をspyする純unitとし、実gitやnetworkを使わない。期待する`detail`はL6 §7.3のliteralを明示して書き、production定数から生成しない。

| Candidate ID | 関数 / surface | 反証可能な主張 |
|---|---|---|
| CANDIDATE-U-CMDINPUT-012 | `checkForUpdate` (override) | `remoteOverride`が`--upload-pack=touch pwned`のとき、`checked: false`、`source: "none"`、`detail`が厳密に`remote rejected: starts with "-"`、`listRemoteTags` 0回、`writeText` 0回。`detail`に`upload-pack`を含まない。検査を削除するmutationを殺す。 |
| CANDIDATE-U-CMDINPUT-013 | `checkForUpdate` (package.json) | override無しでpackage.jsonの`repository.url`が`git+-oProxyCommand=x`のとき (`git+`除去後に`-`始まり)、012と同じshape・`listRemoteTags` 0回。検査をoverride経路だけに置くmutationを殺す。 |
| CANDIDATE-U-CMDINPUT-014 | `checkForUpdate` (cache順序) | `remoteOverride`が`-x`で、remote keyが`-x`かつTTL内のcacheを`readText`が返しても、`source: "cache"`にならず012と同じ拒否結果。検査をcache参照の後へ置くmutationを殺す。 |
| CANDIDATE-U-CMDINPUT-015 | `checkForUpdate` (正常系) | `https://example.invalid/a-b.git`と、`.git`を持つharness rootでの`origin`は従来どおり`listRemoteTags`を各1回、そのremote値で呼ぶ。`includes("-")`等の過剰拒否mutationを殺す。正常系なので`it`で登録する。 |

012〜014は未実装の負系として`it.fails`で登録し、015は`it`で登録する。`gitLsRemoteInvocation`のargv不変は既存の`U-UPDCHK-021`〜`024`が回帰fenceであり、本節で置き換えない。
