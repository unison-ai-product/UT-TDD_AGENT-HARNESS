---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_zero_trust_download_lint
pair_artifact: docs/test-design/harness/L7-zero-trust-download-lint-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
created: 2026-11-17
issue: 1741
---

> **L6 contract marker**: `checkInstallCommands(file: ScanSource) => Finding[]` と `checkFetchAndExecute(file: ScanSource) => Finding[]` は unit-test-granularity contract である (未実装の目標契約。実装は本書の凍結後)。DbC は §10 にまとめる。oracle の詳細は `docs/test-design/harness/L7-zero-trust-download-lint-test-design.md` の候補 ID `CANDIDATE-U-ZTDL-001`〜 が固定する。置き場は `src/lint/zero-trust-download.ts` (純粋関数) と `src/lint/zero-trust-download-inputs.ts` (I/O) を想定し、実装の前に本書を凍結する。

# ゼロトラストダウンロード原則の静的 lint (install script と取得即実行) — 関数設計 (issue #1741)

## 1. 目的と範囲

`CLAUDE.md` §Safety Boundaries のゼロトラストダウンロード原則 (PR #1744) は、外部から取得したコードを検証前に実行しないことを定める。この原則はいま文章だけで、機械が止める線が無い。実測 (`origin/main`、`git grep -nE 'npm (ci|install|i)\b|npx '` を `.github/workflows` / `scripts` / `skills` / `docs/templates` に掛け、`--ignore-scripts` の無い行を数えた) では、`npm ci` が `.github/workflows/harness-check.yml` に 4 か所、`docs/templates/github/common/` の 2 つの template に 2 か所あり、どれも `--ignore-scripts` を付けていない。`code-health.yml` には版を固定しない `npx jscpd` が 1 か所ある。

本書は Issue #1741 の候補のうち、**静的に決まり、ネットワークも PR 本文の解釈も要らない 2 項目**を 1 本の lint にする (最初の slice)。

| 項目 | 内容 | 本書 |
|---|---|---|
| (1) | `npm ci` / `npm install` に `--ignore-scripts` を付ける。`npx` は版を固定する | 設計する (§4) |
| (2) | 取得即実行 (`curl ... \| sh` など) を禁じる | 設計する (§5) |
| (3) | lockfile に足した・変えた版は公開から 14 日以上 | 後続 slice (§11) |
| (4) | 新規依存の確認記録を PR 本文に残す | 後続 slice (§11) |

「既存の gate を弱めない」ため、新しい検査は追加だけであり、既存の toolchain-pin / github-ci-policy / bun-permanent-ban には触れない。

## 2. 走査する対象と、しない対象

path は `/` 区切りに正規化する。対象は **実行される面** に絞る。判定は path と拡張子だけで決める (`classifyScanTarget`)。

| 種別 (`ScanKind`) | path | 取り出す内容 | 適用する規則 |
|---|---|---|---|
| `workflow` | `.github/workflows/**/*.yml` / `*.yaml`、`docs/templates/github/**/*.yml` / `*.yaml` | YAML を構文解析し、`jobs.*.steps[].run` と `runs.steps[].run` (composite action) の文字列 | install / npx / fetch-and-execute |
| `shell` | `scripts/**/*.sh` / `*.bash`、`docs/templates/**/*.sh` | ファイル全体 | install / npx / fetch-and-execute |
| `powershell` | `scripts/**/*.ps1` / `*.psm1` | ファイル全体 | install / npx / fetch-and-execute |
| `batch` | `scripts/**/*.cmd` / `*.bat` | ファイル全体 | install / npx / fetch-and-execute |
| `markdown` | `skills/**/*.md`、`docs/templates/**/*.md` | フェンスコードブロック (言語が `sh` / `bash` / `shell` / `console` / `powershell` / `pwsh` / `ps1` / `yaml` / `yml` / 無指定) の内側だけ | **fetch-and-execute だけ** |

走査しない対象とその理由:

- **`tests/**` と `tests/fixtures/**`**: 検査対象の入力 (悪い例を意図的に含む)。形は検査側のテストが決める。
- **`docs/` のうち `docs/templates/` 以外** (設計文書・ADR・governance): 悪い例を引用して説明する散文である。実行される面ではない。
- **Markdown のインラインコードとフェンスの外の文章**: 散文の案内であり、agent が実行する指示は fence に置く規約にする。skills の `npm ci` / `npx vitest run` の言及 (実測 3 件) は散文なので対象外になる。
- **Markdown の fence に install / npx 規則を掛けない理由**: skills の fence は説明用の断片で、版を固定した完全な command を要求すると `npx <pkg>` のような placeholder を全て誤検出する。取得即実行は agent がそのまま実行する危険が最大で、placeholder でも形が成立するので、fence でも止める。
- **`scripts/` の JS / TS (`.mjs` / `.cjs` / `.ts`)**: `execFileSync("npm", ["ci"])` のように command が引数配列に分解され、shell の字句では判定できない。後続 slice (§11)。
- **`package.json` の `scripts`**: 同上。slice 1 の実測 (Green の base) で件数を数えてから別 PR で足す。
- `node_modules/`、`dist/`、`.ut-tdd/`、`.git/` は常に対象外。

## 3. コマンドの取り出し (`extractCommands`)

`extractCommands(source: ScanSource) => CommandLine[]` が、種別ごとの生テキストを「論理コマンド」の列へ直す。`CommandLine` は `{ path, line, text }` (`line` は論理コマンドの開始行)。以降の規則はすべて論理コマンドの `text` に掛ける。

1. **行の連結**: 行末が (a) 行継続 (`sh`/`bash` は `\`、PowerShell は `` ` ``、batch は `^`)、(b) 後続を要求する演算子 (`|`、`&&`、`||`) のとき、次の行を同じ論理コマンドへ連結する (空白 1 個で繋ぐ)。YAML の `run: |` ブロックは、構文解析で得た文字列に同じ規則を掛ける。
2. **コメント**: 行頭 (空白を除いて) が `#` の行は捨てる (batch は `REM` / `::`)。行の途中の ` #` 以降は、引用符の外にあるときだけ捨てる。**コメントアウトされた行は実行されないので検出しない** (`bash <(curl ...)` をコメントで示した説明文も誤検出しない)。
3. **ヒアドキュメント**: `<<MARK` から `MARK` までの本文は**捨てずに走査する**。`cat > run.sh <<MARK` で書き出した内容は後で実行されるので、保守側に倒す。本文の各行は論理コマンドとして扱う。
4. **分割**: 論理コマンドを `&&` / `||` / `;` で区切って「節 (segment)」にし、`|` で繋がった節の列を「パイプライン」として保つ (§5 が使う)。引用符 (`'…'` / `"…"`) の中の区切りは区切りとして扱わない。
5. **トークン化**: 節を空白で分けたトークン列にする。引用符は外し、`sudo` / `env VAR=...` / `VAR=value` の前置きは飛ばして先頭の実コマンド名を決める。`VAR=value` の前置きは §4 の許容判定のために `envPrefix` として保持する。

## 4. 規則 (1): install script と npx (`checkInstallCommands`)

`checkInstallCommands(file: ScanSource) => Finding[]` は `markdown` を対象にしない (§2)。

### 4.1 `zero-trust-install-scripts-missing`

節の実コマンドが `npm` で、サブコマンドが `ci` / `install` / `i` / `add` / `install-test` / `it` / `isntall` のいずれかのとき、節に `--ignore-scripts` が**無ければ** finding を出す。

- **許容 (finding なし)**: (a) 節に `--ignore-scripts` (または `--ignore-scripts=true`) がある、(b) `envPrefix` に `npm_config_ignore_scripts=true` / `NPM_CONFIG_IGNORE_SCRIPTS=true` がある。`--ignore-scripts=false` は無いものとして扱う (finding)。
- **対象外**: `npm run` / `npm test` / `npm pack` / `npm audit` / `npm rebuild` (明示的に script を走らせる意図の command は、install 時の自動実行とは別)。
- `pnpm` / `yarn` / `bun` は対象にしない。この repo の実行系は npm に固定され (`package.json` の `utTdd.nodeToolchain`)、`bun` は別の gate が禁じているため。
- `subject` は節を空白 1 個に正規化した文字列 (例: `npm ci --no-audit --no-fund`)。

### 4.2 `zero-trust-npx-unpinned`

節の実コマンドが `npx` (または `npm exec` / `npm x`) のとき、実行する package の指定が**完全一致の版つき**でなければ finding を出す。

- package 指定の取り方: `npx` のフラグ (`-y` / `--yes` / `--no-install` / `--no` / `-q` など) を飛ばして最初の位置引数。`-p <spec>` / `--package=<spec>` があれば、その `<spec>` を指定とする。
- **許容**: 指定が `^(@[a-z0-9._-]+/)?[a-z0-9._-]+@\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$` に一致する (例: `jscpd@4.0.5`、`@biomejs/biome@2.0.0`)。
- **許容 (取得しない形)**: フラグに `--no-install` / `--no` がある (ローカルに導入済みの bin だけを走らせ、ダウンロードしない)、または指定が `./` / `../` / `.` で始まるローカル path。
- **finding**: 版が無い (`jscpd`)、`@latest` / `@next` などの dist-tag、範囲 (`@^4` / `@4` / `@~4.0` / `@4.x`)、URL や git spec (`https://...` / `github:...` / `git+...`)。URL spec は取得即実行の一種として、この規則で止まる。
- `subject` は指定の文字列 (例: `jscpd`)。

## 5. 規則 (2): 取得即実行 (`checkFetchAndExecute`)

`checkFetchAndExecute(file: ScanSource) => Finding[]` は §2 の全種別に掛ける。**取得コマンド**は `curl` / `wget` / `fetch` / `Invoke-WebRequest` / `iwr` / `Invoke-RestMethod` / `irm` / `Net.WebClient` の `DownloadString`。**実行コマンド**は `sh` / `bash` / `zsh` / `dash` / `ksh` / `source` / `.` / `eval` / `node` / `python` / `python3` / `perl` / `ruby` / `pwsh` / `powershell` / `iex` / `Invoke-Expression` (`sudo` / `env` の前置きは飛ばす)。

次のいずれかに当たれば `zero-trust-fetch-and-execute` の finding を 1 件出す。

| 形 | 検出条件 | 例 |
|---|---|---|
| パイプ | パイプラインで取得コマンドの節の後ろに実行コマンドの節が続く (間に `tee` や `sudo` が入っても、最終的に実行コマンドへ繋がれば当たる) | `curl -fsSL https://x/i.sh \| sh`、`wget -qO- u \| sudo bash -s --`、`irm u \| iex` |
| プロセス置換 | 実行コマンドの引数が `<( 取得コマンド ... )` | `bash <(curl -s u)`、`source <(wget -qO- u)`、`. <(curl u)` |
| コマンド置換 | 実行コマンドの引数 (`-c` の文字列を含む) が `$( 取得コマンド ... )` または バッククォートで囲んだ取得コマンド | `bash -c "$(curl -fsSL u)"`、`eval "$(wget -qO- u)"` |
| PowerShell の式 | `iex` / `Invoke-Expression` の引数 (括弧の中) に取得コマンドを含む | `iex (iwr u)`、`Invoke-Expression ((New-Object Net.WebClient).DownloadString('u'))` |

- **当たらない**: ファイルに保存するだけの取得 (`curl -fsSLo f u`、`wget -O f u`、`iwr u -OutFile f`)、標準出力へ出して実行しない取得 (`curl u \| jq .`、`curl u \| grep x`)、コメントにしただけの行 (§3 の 2)。
- **範囲外 (後続)**: 「取得してから別の行で実行する」二段の形 (`curl -o x.sh u; bash x.sh`)。検証 (checksum / 署名) を挟む正当な形があり、データの流れの追跡が要るため、この slice の静的な字句検査では決められない (§11)。
- `subject` は取得コマンドの節 (`curl -fsSL https://x/i.sh`) を空白 1 個に正規化した文字列。URL はそのまま含める (識別に使う。秘密を含む URL は書かない規約に従う)。

## 6. finding と baseline

`Finding` は `{ path, rule, subject, line }`。**同一性は `(path, rule, subject)`** であり、`line` は表示専用 (行の挿入で baseline が無効にならない)。同じ `(path, rule, subject)` が同じ file に複数あれば `count` に数える。

### 6.1 baseline の形

既存の違反は **`docs/governance/zero-trust-download-baseline.json`** に記録する。置き場 (`docs/governance/`)・path の昇順・縮小のみの規則は `code-size-gate.md` §5 と、違反の台帳という考え方は `docs/governance/bun-migration-debt.yaml` と揃える。

```json
{ "schema_version": "zero-trust-download-baseline.v1",
  "entries": [ { "path": ".github/workflows/harness-check.yml", "rule": "zero-trust-install-scripts-missing", "subject": "npm ci --no-audit --no-fund", "count": 4 } ] }
```

- **初期値**: 本文に件数を固定しない。実装 PR (Green) の base commit で §4・§5 により実測し、同じ Green PR で記録する (実測の目安は §1)。既存の違反を直す PR は、同じ PR で該当 entry を減らす。
- **縮小のみの比較元**: `git merge-base HEAD origin/main` の commit にある baseline を比較元 (`previousBaseline`) とし、比較元より `count` が増える・比較元に無い entry を足すことを `zero-trust-baseline-grown` で止める。ファイルが無ければ初回とみなして比較を省く。merge-base を解決できない・読めない・解釈できないときは `zero-trust-baseline-base-unreadable` で fail-close する (`code-size-gate.md` §5 と同じ)。
- **移動を許さない**: code-size の関数超過量のような合計での移動は設けない。entry は `(path, rule, subject)` で一意なので、直したものを消すだけで足りる。

### 6.2 判定規則

`analyzeZeroTrustDownload(input: ZeroTrustInput) => ZeroTrustResult` は、全 source の finding を集め、baseline の entry と突き合わせる。

1. **`zero-trust-violation`** (扱いは §7 の severity)。baseline の `count` を超えた finding (baseline に無い `(path, rule, subject)` は `count` 0 とみなす)。rule 名 (`zero-trust-install-scripts-missing` など) を `reason` に持つ。
2. **`zero-trust-stale-baseline`** (fail-close)。baseline の `count` が実測より大きい (`shrunk`)、entry の path が走査対象に無い (`missing-file`)、実測が 0 (`fixed`)。同じ PR で entry を減らす・消す。
3. **`zero-trust-baseline-grown`**・**`zero-trust-baseline-base-unreadable`** (fail-close)。§6.1。
4. **`zero-trust-input-unreadable`** (fail-close)。走査対象が 1 本も無い、adapter が対象を読めなかった、YAML を構文解析できなかった (構文解析できない workflow を「違反なし」とみなさない)。

`ok` は fail-close の finding が 0 件のときだけ true。finding は `path` / `rule` / `subject` の順で一意に並べ、入力の順序に依存しない。出力の末尾に `checked=<走査した file 数> violations=<件数> stale=<件数> baseline=<entry 数>` を出す。メッセージは修正の指示を含む (`npm ci` なら `--ignore-scripts` を足す、`npx jscpd` なら `jscpd@<exact>` へ固定する、取得即実行ならファイルへ保存して checksum を検証してから実行する)。

## 7. 配線と段階

- **段階**: `.github/workflows/code-health.yml` (#1743) の advisory 先行と、`code-size-gate.md` §9 の PR の順序を踏襲する。定数 `ZERO_TRUST_SEVERITY` (`"advisory"` / `"fail-close"`) が `zero-trust-violation` の扱いだけを決める。他の finding (stale / grown / unreadable) は常に fail-close である (baseline の整合は advisory にしない)。
  1. 契約 PR (本書と L7)。
  2. 登録 + Red PR (実 repo を読む oracle は `src/doctor/test-repository-isolation.ts` の `repositoryReadContracts` へ登録)。
  3. Green PR: 純粋関数 + adapter + baseline の初期値 + doctor 配線を **`advisory`** で入れる。advisory では violation を doctor の messages に出すが `ok` を落とさない。
  4. 昇格 PR: 誤検出が無いことを 1 週間の doctor / CI の実績で確かめ、`ZERO_TRUST_SEVERITY` を `fail-close` へ切り替える (1 行の変更)。baseline があるので、昇格しても main は壊れない。
- **doctor**: check 名 `zero-trust-download`。`src/doctor/check-definition-groups.ts` の `full(...)` に、`code-size` と同じ形で `checkZeroTrustDownload(deps.repoRoot)` (`{ messages, ok }`) を登録する。`src/cli.ts` から doctor 経由で到達するので `src/lint/lint-wiring.ts` の `DEFERRED_LINTS` には登録しない (未配線を許す抜け道を作らない)。
- 専用 CLI は作らない (1 PR = 1 論点を保つ。`ut-tdd doctor --scope` で足りる)。
- 既存 gate は弱めない。`toolchain-pin` / `github-ci-policy` / `bun-permanent-ban` の入力・出力・baseline には触れない。

## 8. 関数のシグネチャ (純粋関数と I/O の adapter)

| Function | Signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `classifyScanTarget` | `classifyScanTarget(path: string) => ScanKind \| null` | path は repo 相対 | §2 の種別か `null` | path だけで決まる | `U-ZTDL-001` |
| `extractCommands` | `extractCommands(source: ScanSource) => CommandLine[]` | `source.path` が対象 | §3 の論理コマンドの列 | 同じ入力から同じ列 | `U-ZTDL-002`〜`005` |
| `checkInstallCommands` | `checkInstallCommands(file: ScanSource) => Finding[]` | `markdown` 以外 | §4 の finding | 純粋 | `U-ZTDL-006`〜`011` |
| `checkFetchAndExecute` | `checkFetchAndExecute(file: ScanSource) => Finding[]` | 任意の対象 | §5 の finding | 純粋 | `U-ZTDL-012`〜`016` |
| `analyzeZeroTrustDownload` | `analyzeZeroTrustDownload(input: ZeroTrustInput) => ZeroTrustResult` | §10 の Pre | `{ ok, findings, summary }` | 入力順に依存しない | `U-ZTDL-017`〜`021` |
| `parseZeroTrustBaseline` | `parseZeroTrustBaseline(sourceText: string) => ZeroTrustBaseline \| null` | 文字列 | 解釈できなければ `null` | 壊れた入力を空とみなさない | `U-ZTDL-022` |
| `loadZeroTrustSources` | `loadZeroTrustSources(repoRoot: string) => { sources: ScanSource[]; unreadable: string[] }` | repo root | 対象 file の内容と読めない path | 書き込まない | `U-ZTDL-023` |
| `loadPreviousZeroTrustBaseline` | `loadPreviousZeroTrustBaseline(repoRoot: string) => { kind: "found"; baseline: ZeroTrustBaseline } \| { kind: "absent" } \| { kind: "unreadable" }` | repo root | §6.1 の比較元 | 読めない比較元を `absent` にしない | `U-ZTDL-023` |
| `checkZeroTrustDownload` | `checkZeroTrustDownload(repoRoot: string) => { messages: string[]; ok: boolean }` | repo root | adapter を合成し `analyzeZeroTrustDownload` を呼ぶ。`ZERO_TRUST_SEVERITY` を適用 | 例外を握りつぶさない | `U-ZTDL-024`, `U-ZTDL-025` |

型: `ScanSource = { path: string; text: string }`、`ScanKind = "workflow" | "shell" | "powershell" | "batch" | "markdown"`、`CommandLine = { path: string; line: number; text: string }`、`Finding = { path: string; rule: string; subject: string; line: number }`、`ZeroTrustBaseline = { entries: { path: string; rule: string; subject: string; count: number }[] }`、`ZeroTrustInput = { sources: readonly ScanSource[]; baseline: ZeroTrustBaseline; previousBaseline: ZeroTrustBaseline | null; severity: "advisory" | "fail-close" }` (`max-source-params` に合わせて 1 つの object)。YAML の構文解析は `yaml` パッケージ (既存依存) を使う。

## 9. 失敗モードと保守側の倒し方

- 構文解析できない workflow は `zero-trust-input-unreadable` (見落とすより止めるほうを選ぶ)。
- 字句検査なので、変数展開で隠した形 (`CMD=sh; curl u | $CMD`) は検出しない。これは静的検査の限界であり、回避を許すものではない。二段・変数経由は §11 の後続でも完全には閉じないので、限界として本書に残す。
- `npm ci --ignore-scripts` が CI で成立するかは Green の実装 PR が確かめる。install script を必要とする package があって通らない場合は、`--ignore-scripts` を付けた後に、必要な package だけを明示の `npm rebuild <pkg>` で組み立てる (§4.1 の対象外)。baseline に足して逃がすのは最後の手段で、理由を PR 本文に書く。

## 10. 不変条件 (DbC)

- Pre: 入力は走査対象の path と内容の列、baseline、比較元 (`previousBaseline`、無ければ `null`)、severity。読み取りだけを行い、ファイルを書かない。
- Post: `ok` は §6.2 の fail-close の finding が 0 件のときだけ true。finding は入力の順序に依存せず一意に並ぶ。同じ入力から同じ出力を返す。
- Invariant: ネットワークを使わない。baseline の追記では新しい violation を通せない (`zero-trust-baseline-grown`)。path の移動・rename で同一性 `(path, rule, subject)` が変わると、旧 path の entry は `missing-file` で stale になり、新 path の finding は violation になる (rename で違反を隠せない。entry の引き継ぎは行わず、違反を直すのが正規の道)。

## 11. 後続 slice (この PR では設計しない)

| 項目 | 理由 |
|---|---|
| (3) lockfile の版は公開から 14 日以上 | registry への問い合わせ (ネットワーク) が要り、純粋関数の静的検査と性質が違う。Dependabot の `cooldown` (#1751) が bot の PR を既に覆う。残るのは人手で足す依存で、公開日時の取得方法と、offline 時の扱い (fail-open か fail-close か) の判断が要る |
| (4) 新規依存の確認記録を PR 本文に | PR 本文の解釈 (gh API / `ut-tdd pr merge` の gate) と、記録の書式の契約が要る。lockfile の差分から「新規依存」を決める規則も別に要る |
| 二段の取得即実行 (`curl -o x; bash x`)・変数経由・`scripts/` の JS / TS・`package.json` の `scripts` | データの流れの追跡か、字句以外の構文解析が要る。slice 1 の実測を見て範囲を決める |
| `pnpm` / `yarn` | この repo では使わない。導入先 (consumer) の stack が増えるときに足す |

## 12. 根拠

- issue #1741 (親 #1142)、`CLAUDE.md` §Safety Boundaries ゼロトラストダウンロード原則 (PR #1744)、#1744 の review の observation (`harness-check.yml` の `npm ci` 4 か所)。
- 型の手本: `docs/design/harness/L6-function-design/code-size-gate.md` (§5 baseline と縮小のみ、§9 配線と段階、§11 DbC)。配線の形: `src/lint/lint-wiring.ts` (`RUNTIME_ENTRYPOINTS` から到達可能であること)。baseline の置き場: `docs/governance/bun-migration-debt.yaml` (`src/lint/bun-permanent-ban.ts` の `DeltaGuard`)。advisory 先行: `.github/workflows/code-health.yml` (#1743)。
