---
title: "L7 zero trust download lint test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/zero-trust-download-lint.md
parent_doc: docs/design/harness/L6-function-design/zero-trust-download-lint.md
status: confirmed
updated: 2026-11-17
issue: 1741
---

# ゼロトラストダウンロード原則の静的 lint テスト設計 (issue #1741)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/zero-trust-download-lint.md` である (未実装の目標契約)。
本書はその §2 対象、§3 コマンドの取り出し、§4 install script と npx、§5 取得即実行、§6 finding と baseline、§7 配線と段階、§10 不変条件を検証する oracle を定義する。
共有の `docs/test-design/harness/L7-unit-test-design.md` には索引行を足さない。本書が詳細の正本である。

この pair-freeze では候補 ID `CANDIDATE-U-ZTDL-001`〜`026` を宣言する。正式 ID への昇格は、設計書保護 gate §10.3 の三段階の (2) の昇格 PR で 1:1 に行う (L6 §7)。oracle ファミリ ID `U-ZTDL` は、既存の `U-` ファミリ (`U-CODESIZE`、`U-OPSCTL` など) と重複しない。

## 2. fixture

- `classifyScanTarget` / `extractCommands` / `checkInstallCommands` / `checkFetchAndExecute` / `analyzeZeroTrustDownload` の行は、path と内容の組、baseline、比較元 baseline、severity を直接渡す純粋関数の入力で作る。実 repo のファイルは読まない (024 と 025 を除く)。
- shell と PowerShell の入力は、複数行の文字列リテラルで作る。YAML の入力は `jobs.x.steps[0].run: |` を持つ最小の workflow 文書で作る。
- 1 つの行は規則を 1 本だけ殺すように、入力の書き方を 1 つだけ変える。
- 023 は temp directory に実 git repository を作り、比較元の取得だけを確かめる。
- 024 と 025 は実 repo を読むので、`test-repository-isolation` の登録が要る (L6 §7 の 2)。

## 3. oracle 宣言の一覧

| ID | 入力 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| `CANDIDATE-U-ZTDL-001` | `classifyScanTarget` に、(a) `.github/workflows/ci.yml`、(b) `.github/workflows/a/b.yaml`、(c) `docs/templates/github/common/harness-check.yml`、(d) `scripts/run.sh`、(e) `scripts/x.ps1`、(f) `scripts/x.cmd`、(g) `skills/git.md`、(h) `docs/templates/design/t.md`、(i) `tests/fixtures/w.yml`、(j) `docs/design/harness/x.md`、(k) `scripts/x.mjs`、(l) `node_modules/p/a.sh`、(m) `.github\workflows\ci.yml` (バックスラッシュ区切り) | (a)(b)(c)(m) `workflow`、(d) `shell`、(e) `powershell`、(f) `batch`、(g)(h) `markdown`、(i)(j)(k)(l) `null` | tests の fixture や設計文書の散文を走査する / `.mjs` を shell とみなす / バックスラッシュを正規化しない / `node_modules` を走査する |
| `CANDIDATE-U-ZTDL-002` | `extractCommands` に shell として、(a) `npm ci \` + 次行 `  --no-audit` の行継続、(b) `curl u \|` + 次行 `  sh` (演算子で終わる行)、(c) `a &&` + 次行 `b`、(d) PowerShell の `` iwr u ` `` + 次行 `  \| iex`、(e) batch の `npm ci ^` + 次行 `--ignore-scripts` | (a) `npm ci --no-audit` の 1 論理コマンド (開始行は 1)、(b) `curl u \| sh`、(c) `a && b`、(d) `iwr u \| iex`、(e) `npm ci --ignore-scripts`。それぞれ 1 件で、`line` は開始行 | 行継続を連結せず片方の行だけを検査する (継続の先の `sh` や `--ignore-scripts` を見落とす) / 種別ごとの継続文字を取り違える |
| `CANDIDATE-U-ZTDL-003` | `extractCommands` に、(a) 行頭が `# curl u \| sh` のコメント行、(b) `npm ci --ignore-scripts # curl u \| sh` (行末コメント)、(c) `echo "a # b"` (引用符の中の `#`)、(d) batch の `REM npm ci` と `:: npm ci` | (a) 0 件、(b) `npm ci --ignore-scripts` の 1 件 (コメント部分を含まない)、(c) `echo a # b` の 1 件 (引用符の中は捨てない)、(d) 0 件 | コメントアウトされた行を検出する / 引用符の中の `#` で行を切る / 行末コメントを残す |
| `CANDIDATE-U-ZTDL-004` | `extractCommands` に、(a) `cat > run.sh <<MARK` + 本文 `npm ci` + `MARK`、(b) 本文が `curl u \| sh` のヒアドキュメント、(c) ヒアドキュメントの外の `npm ci` | (a)(b) 本文の行が論理コマンドとして取り出される (`npm ci`、`curl u \| sh`)。(c) 取り出される。`MARK` 行は取り出さない | ヒアドキュメントの本文を捨てて、書き出した script の中の違反を見落とす / 終端行を command として扱う |
| `CANDIDATE-U-ZTDL-005` | (a) `workflow` の YAML で `run: \|` が複数行 (`npm ci` と `npm test`) を持つ、(b) `run: npm ci` の 1 行形式、(c) composite action の `runs.steps[].run`、(d) YAML の `name:` や `env:` の値に `npm ci` と書いた文字列 (run ではない)、(e) 構文として壊れた YAML | (a) 2 つの論理コマンド、(b) 1 つ、(c) 取り出される、(d) 取り出されない (`run` だけを見る)、(e) `analyzeZeroTrustDownload` が `zero-trust-input-unreadable` で `ok=false` | YAML をただの行として走査し `name:` の文言を誤検出する / `run: \|` の本文を取りこぼす / 壊れた YAML を違反 0 件とみなす |
| `CANDIDATE-U-ZTDL-006` | `checkInstallCommands` に、(a) `npm ci --no-audit --no-fund`、(b) `npm ci`、(c) `npm install`、(d) 同じ内容の `npm ci --no-audit --no-fund` が 4 行 | (a)(b)(c) `zero-trust-install-scripts-missing` を 1 件ずつ (`subject` は (a) `npm ci --no-audit --no-fund`、(b) `npm ci`、(c) `npm install`)。(d) 4 件で `subject` は同一 (件数は baseline の `count` に使う) | `--ignore-scripts` が無いのに通す / `subject` に行番号を含めて baseline が行の挿入で壊れる |
| `CANDIDATE-U-ZTDL-007` | (a) `npm ci --ignore-scripts`、(b) `npm ci --no-audit --ignore-scripts --no-fund`、(c) `npm ci --ignore-scripts=true`、(d) `npm_config_ignore_scripts=true npm ci`、(e) `NPM_CONFIG_IGNORE_SCRIPTS=true npm ci`、(f) `npm ci --ignore-scripts=false`、(g) `npm ci && npm test --ignore-scripts` (フラグが別の節にある) | (a)〜(e) finding 0 件。(f) finding 1 件 (false は無いものとして扱う)。(g) finding 1 件 (フラグは同じ節の中だけを見る) | フラグの位置を限定する / env による指定を認めない / `=false` を許容する / 別の節のフラグで通す |
| `CANDIDATE-U-ZTDL-008` | (a) `npm i`、(b) `npm add pkg`、(c) `npm install-test`、(d) `npm run build`、(e) `npm test`、(f) `npm rebuild esbuild`、(g) `npm pack`、(h) `npm audit`、(i) `pnpm install`、(j) `yarn install`、(k) `echo npm ci` | (a)(b)(c) finding 1 件ずつ。(d)(e)(f)(g)(h)(i)(j)(k) 0 件 | 別名 (`i` / `add` / `install-test`) を取りこぼす / `npm run` や `rebuild` を install とみなす / pnpm・yarn を対象にする / 引数の文字列の `npm ci` を command とみなす |
| `CANDIDATE-U-ZTDL-009` | `checkInstallCommands` に、(a) `npx jscpd`、(b) `npx -y jscpd`、(c) `npx jscpd@latest`、(d) `npx jscpd@^4`、(e) `npx jscpd@4`、(f) `npx jscpd@4.x`、(g) `npx https://example.test/x.tgz`、(h) `npx github:o/r`、(i) `npm exec jscpd`、(j) `npx -p jscpd serve`、(k) `npx @scope/pkg` | すべて `zero-trust-npx-unpinned` を 1 件ずつ。`subject` は指定の文字列 ((a)(b) は `jscpd`、(j) は `jscpd`、(g) は URL) | 版なし・dist-tag・範囲を許容する / フラグ (`-y`) を package 名と取り違える / URL・git spec を許容する / `npm exec` を見落とす / `-p` の指定を見落とす |
| `CANDIDATE-U-ZTDL-010` | (a) `npx jscpd@4.0.5`、(b) `npx -y @biomejs/biome@2.0.0 check`、(c) `npx -p jscpd@4.0.5 jscpd`、(d) `npx --no-install vitest`、(e) `npx --no jscpd`、(f) `npx ./tools/run.js`、(g) `npx jscpd@4.0.5-beta.1` | (a)(b)(c)(d)(e)(f)(g) finding 0 件 | 完全一致の版を拒否する / scoped package の版を取り違える / ダウンロードしない形 (`--no-install`) を拒否する / ローカル path を拒否する |
| `CANDIDATE-U-ZTDL-011` | markdown 種別の入力で、(a) fence の中の `npm ci`、(b) fence の中の `npx jscpd`、(c) fence の中の `curl u \| sh`、(d) fence の外の `curl u \| sh` の散文、(e) インラインコードの `` `curl u \| sh` `` | `checkInstallCommands` は (a)(b) とも 0 件。`checkFetchAndExecute` は (c) 1 件、(d)(e) 0 件 | markdown の fence に install / npx 規則を掛ける (placeholder の誤検出) / fence の中の取得即実行を見落とす / 散文・インラインコードを走査する |
| `CANDIDATE-U-ZTDL-012` | `checkFetchAndExecute` に、(a) `curl -fsSL https://x/i.sh \| sh`、(b) `curl -fsSL u \| bash`、(c) `wget -qO- u \| sudo bash -s --`、(d) `curl u \| tee /tmp/i.sh \| sh`、(e) `curl u \| zsh`、(f) `curl u \| node`、(g) `curl u \| python3 -`、(h) `curl u \| sudo env X=1 bash` | すべて `zero-trust-fetch-and-execute` を 1 件ずつ。`subject` は取得コマンドの節 ((a) は `curl -fsSL https://x/i.sh`) | 実行先の shell を `sh` / `bash` だけに限る / `sudo` や `env` の前置きで外す / 間に `tee` が入ると見落とす / インタプリタ (`node` / `python`) を見落とす |
| `CANDIDATE-U-ZTDL-013` | (a) `bash <(curl -s u)`、(b) `source <(wget -qO- u)`、(c) `. <(curl u)`、(d) `bash -c "$(curl -fsSL u)"`、(e) `eval "$(wget -qO- u)"`、(f) `sh -c "$(curl -fsSL u)"`、(g) `` eval `curl u` `` (バッククォート)、(h) `diff <(curl a) <(curl b)` | (a)〜(g) 1 件ずつ。(h) 0 件 (実行コマンドではない) | プロセス置換・コマンド置換の形を取りこぼす / `eval` を見落とす / 取得コマンドを含む任意の command を違反にする |
| `CANDIDATE-U-ZTDL-014` | PowerShell として、(a) `iex (iwr https://x/i.ps1)`、(b) `Invoke-Expression (irm u)`、(c) `iwr u \| iex`、(d) `irm u \| Invoke-Expression`、(e) ``iex ((New-Object Net.WebClient).DownloadString('u'))``、(f) `iwr u -OutFile f.ps1`、(g) `$r = iwr u; Write-Output $r.Content` | (a)〜(e) 1 件ずつ。(f)(g) 0 件 | `iex` の括弧の中の取得を見落とす / WebClient の形を見落とす / ファイルへ保存するだけの取得を違反にする |
| `CANDIDATE-U-ZTDL-015` | 良性の取得として、(a) `curl -fsSLo f.sh https://x/f.sh`、(b) `wget -O f u`、(c) `curl u \| jq .`、(d) `curl u \| grep x`、(e) `curl -fsSL u -o a && sha256sum -c a.sum`、(f) `curl -fsSL u -o x.sh; bash x.sh` | (a)〜(e) 0 件。(f) も 0 件 (二段は slice 1 の範囲外。L6 §5 の範囲外 (後続)。本 oracle で範囲外であることを固定する) | 取得したというだけで違反にする / 検証付きの取得を違反にする / 二段の検出を黙って足して範囲を広げる |
| `CANDIDATE-U-ZTDL-016` | (a) `curl -fsSL u \` + 次行 `  \| sh` (行継続をまたぐ)、(b) `curl -fsSL u \|` + 次行 `  bash` (演算子で終わる行)、(c) YAML の `run: \|` の中の `curl -fsSL u \| sh`、(d) その行が `# curl -fsSL u \| sh` のコメント、(e) ヒアドキュメントの本文の `curl u \| sh` | (a)(b)(c)(e) 1 件ずつ、(d) 0 件 | 行継続をまたぐ形を見落とす / YAML の run の中を見ない / コメントアウトを検出する / ヒアドキュメントの本文を見落とす |
| `CANDIDATE-U-ZTDL-017` | `analyzeZeroTrustDownload` に、`workflow` の source が `npm ci --no-audit --no-fund` を 4 つ持ち、baseline の entry (`path`・`rule`・`subject` が一致、`count` 4) がある (比較元は同じ baseline、severity は `fail-close`)。続けて (b) baseline の `count` を 3 にした | (a) finding 0 件で `ok=true`、末尾に `checked=` `violations=` `stale=` `baseline=` を持つ。(b) `zero-trust-violation` が 1 件 (4 件のうち baseline を超えた分) で `ok=false` | baseline があっても全件を違反にする / `count` を無視して 1 件でも baseline にあれば全て通す |
| `CANDIDATE-U-ZTDL-018` | baseline が空で、(a) 新しい workflow に `npm ci`、(b) 新しい shell に `curl u \| sh`、(c) 既存の entry と `subject` だけが違う `npm ci --foo`、(d) 既存の entry と `path` だけが違う同じ command (ファイルの rename を想定)、(e) 既存の entry の行番号だけが変わった (行を挿入した) | (a)(b)(c)(d) `zero-trust-violation`。(e) 違反なしで `ok=true` (同一性は `(path, rule, subject)`。`line` は使わない) | 新規の違反を baseline なしで通す / `subject` や `path` を緩く比べる / 行番号を同一性に含めて行の挿入で赤くする |
| `CANDIDATE-U-ZTDL-019` | baseline の entry に対して、(a) 実測が 0 (違反を直した)、(b) 実測が `count` より小さい (一部を直した)、(c) entry の `path` が走査対象に無い、(d) 実測と `count` が一致 | (a) `zero-trust-stale-baseline` (`fixed`)、(b) `zero-trust-stale-baseline` (`shrunk`)、(c) (`missing-file`)、(d) finding 0 件。stale は severity が `advisory` でも `ok=false` | 直したのに entry を消させない (ratchet が緩む) / 存在しない path の entry を通す / stale を advisory にする |
| `CANDIDATE-U-ZTDL-020` | 比較元 `previousBaseline` を渡し、現在の baseline が (a) 同じ、(b) ある entry の `count` を増やした、(c) 比較元に無い entry を足した、(d) entry を減らした、(e) `previousBaseline = null` で `mergeBaseMeasures` が現在の baseline と同じ (比較元の無い初回で、新しい違反を足していない) | (a)(d)(e) finding 0 件。(b)(c) `zero-trust-baseline-grown` で `ok=false` (初回の新規・増加は 026 が見る) | baseline に行を足して違反を通せる / 初回を grown とみなして最初の PR を赤にする / 縮小を拒む |
| `CANDIDATE-U-ZTDL-021` | (a) severity `advisory` で、baseline に無い違反が 1 件ある、(b) 同じ入力を severity `fail-close` で、(c) 同じ内容を source の順序と baseline の entry の順序を入れ替えて 2 回、(d) 同じ入力を 2 回、(e) `sources` が空 | (a) `zero-trust-violation` が出るが `ok=true` (messages には出す)、(b) `ok=false`、(c)(d) `findings` と `summary` が一致し、`path` / `rule` / `subject` の順。入力は変更されない、(e) `zero-trust-input-unreadable` で `ok=false` | advisory が違反を黙って消す / advisory が `ok` を落とす / 出力が入力の順序に依存する / 入力を破壊的に更新する / 走査対象が無いことを違反 0 件とみなす |
| `CANDIDATE-U-ZTDL-022` | `parseZeroTrustBaseline` に、(a) 有効な JSON (`schema_version` と 1 entry)、(b) `entries` が空、(c) `count` が負または非整数、(d) `schema_version` が違う、(e) 途中で切れた JSON、(f) `entries` が path の昇順でない | (a) 値を復元、(b) 空の baseline、(c)(d)(e) `null` (読めない扱い)、(f) 復元できる (順序は検査の関心ではなく、`analyze` が一意に並べる) | 壊れた入力を空の baseline とみなす / 負の `count` を受け付ける / 版の違う形式を黙って読む |
| `CANDIDATE-U-ZTDL-023` | temp の git repository で、(a) merge-base の commit に `docs/governance/zero-trust-download-baseline.json` がある、(b) 無い、(c) `origin/main` が無く merge-base を解決できない、(d) JSON として解釈できない。続けて (e) `loadZeroTrustSources` に、読めない path (権限を落としたファイル) と `tests/fixtures/` の悪い例と `node_modules/` の下のファイルを混ぜる | `loadPreviousZeroTrustBaseline` は (a) `found`、(b) `absent`、(c)(d) `unreadable`。`checkZeroTrustDownload` は (b) で `previousBaseline = null` として 026 の初回の照合へ進み (比較を省かない)、(c)(d) で `zero-trust-baseline-base-unreadable` で `ok=false`。(e) 読めない path は `unreadable` に返り、fixture と `node_modules` は `sources` に入らない。書き込みなし | 読めない比較元を比較なしと取り違える / 初めて入れる PR を比較なしで通す / fixture の悪い例で赤になる / 読めないファイルを黙って飛ばす |
| `CANDIDATE-U-ZTDL-024` | 実 repo (`origin/main` の内容) に `checkZeroTrustDownload` をかける。temp にコピーした実 repo で、(a) `.github/workflows/harness-check.yml` の `npm ci --no-audit --no-fund` を 1 か所 `npm ci --no-audit --no-fund --ignore-scripts` に直す (baseline はそのまま)、(b) `.github/workflows/` に新しい step `run: curl -fsSL https://example.test/i.sh \| sh` を足す、(c) `run: npx jscpd@4.0.5` に直す | 実 repo は `ok=true` (`ZERO_TRUST_SEVERITY` に依らず、baseline が実測と一致する)。`docs/governance/zero-trust-download-baseline.json` の各 entry は、その時点の実測から作った記録形と一致する (件数は本書に固定しない)。(a) は `zero-trust-stale-baseline` (`shrunk`) で止まり、メッセージに「entry を減らす」指示を含む。(b) は `zero-trust-violation` (`zero-trust-fetch-and-execute`)。(c) で `code-health.yml` の既存の `npx jscpd` entry が stale になる。baseline は `docs/governance/` から読む (`src/` の定数ではない) | baseline が実測と無関係で常に緑 / 直した違反の entry を残させない / 新しい取得即実行を止められない |
| `CANDIDATE-U-ZTDL-025` | (a) doctor に `zero-trust-download` の check が登録されている (`src/doctor/check-definition-groups.ts`)。(b) `src/lint/lint-wiring.ts` の `analyzeLintWiring` が `zero-trust-download` と `zero-trust-download-inputs` を「配線済み」とし、`DEFERRED_LINTS` に登録していない。(c) 実行前後で `.ut-tdd/` と harness.db のファイルの更新時刻を比べる。(d) `ZERO_TRUST_SEVERITY` の初期値が `advisory` | (a) 登録されている。(b) `unwired` / `staleDeferred` に含まれない。(c) 書き込みなし。(d) `advisory` (昇格 PR で 1 行の変更になる。L6 §7 の 3 と 4) | doctor に配線しない / `DEFERRED_LINTS` で配線の検査を逃れる / check が state を書く / いきなり fail-close で始めて main を壊す |
| `CANDIDATE-U-ZTDL-026` | 初回の照合。`previousBaseline = null` で、merge-base の実測 (`mergeBaseMeasures`) が `{ ".github/workflows/harness-check.yml" の npm ci の entry: count 4 }`。(a) 現在の baseline が同じ entry を `count` 4 で持つ、(b) 現在の source が新しい `scripts/new.sh` に `curl u \| sh` を足し、baseline にも同じ `(path, rule, subject)` を `count` 1 で入れた (実測と一致する)、(c) 既存の entry の `count` を 4 から 5 にし、source にも 1 件足した (実測と一致)、(d) baseline が 4 から 2 に減った、(e) `mergeBaseMeasures = null` (merge-base を解決できない)、(f) merge-base の実測が空 (`{}`) で baseline も空 | (a)(d)(f) finding 0 件。(b) `zero-trust-initial-baseline-new-entry` で `ok=false` (severity が `fail-close` でも `advisory` でも止まる。baseline の整合は advisory にしない)。(c) `zero-trust-initial-baseline-grown` で `ok=false`。(e) `zero-trust-baseline-base-unreadable` で `ok=false` | 初回を比較なしで通し、新しい違反を実測と同数の baseline に入れて通せる / 初回の `count` の増加を見逃す / merge-base を得られないことを照合なしで通す / 初回の縮小や空を拒む |

## 4. 昇格と引用の方針

- `CANDIDATE-U-ZTDL-001`〜`026` は、src/ を含まない昇格 PR で候補 ID から正式 ID へ 1:1 に昇格する (§1)。先頭セルの書き直しと Red のテスト名の引用の書き換えは同時に入れる。
- 023 の `found` / `absent` / `unreadable` は `loadPreviousZeroTrustBaseline` の戻り値の型 (L6 §8) と 1:1 に対応する。
- 024 は baseline の件数や特定の値を期待値に持たない (L6 §6.1: 初期値は Green の base commit で実測して記録する)。違反を直す PR で baseline の entry が減っても 024 は改訂不要である。
- 015 の (f) (二段) は、範囲外であることを固定する oracle である。後続 slice で二段を検出するときは、この oracle を改訂して期待を反転する。

## 5. 範囲外

- lockfile の版の経過日数 (L6 §11 項目 (3)) と PR 本文の確認記録 (同 (4))。ネットワークと PR 本文の解釈が要るため、別の契約で oracle を足す。
- `scripts/` の JS / TS・`package.json` の `scripts`・`pnpm` / `yarn`・変数経由と二段の取得即実行。
- 責務の分け方の意味的な良し悪し、メッセージ文言の細部。
