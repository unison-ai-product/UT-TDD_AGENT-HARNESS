---
title: "L7 windows hide spawn guard test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: draft
updated: 2026-10-13
---

# 子プロセスの windowsHide 検査 テスト設計 (issue #693)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/windows-hide-spawn-guard.md` である。
本書はその §2 対象、§3 判定規則、§4 baseline、§5 doctor 接続、§7 不変条件を検証する oracle を定義する。
共有の `docs/test-design/harness/L7-unit-test-design.md` には索引 (§子プロセスの windowsHide 検査) だけを置き、本書が詳細の正本である。

この pair-freeze では候補 ID (`CANDIDATE-U-WHIDE-*`) だけを宣言する。工程は設計保護 gate の L6 `design-protection-diff-gate.md` §10.3 (PR #995 で改訂、2026-10-13) と同じ順序にする: (1) Red のテスト (`it.fails`) を候補 ID で引用して入れ、開発 repo を読むテストファイル (010) には同じ PR で `repositoryReadContracts` の登録行を足す (src/ は登録行だけ)、(2) 正式 ID `U-WHIDE-*` への昇格とテストの引用の書き換えを同じ PR で入れる (src/ を含まない)、(3) 実装 PR で `it.fails` を `it` に戻して Green にする。昇格を Red より先に入れると、未引用の正式 ID を `oracle-test-trace` が拒否する。

## 2. fixture

- `analyzeWindowsHide` の行は、path と内容の組と baseline・比較元 baseline を直接渡す純粋関数の入力で作る。実 repo のファイルは読まない (010 を除く)。017 は temp directory に実 git repository を作り、比較元の取得だけを確かめる。
- 呼び出しの書き方は各行で 1 つだけ変え、L6 の規則を 1 本だけ殺すように作る。
- 010 は実 repo の走査であり、開発 repo を読むテストとして `test-repository-isolation` の登録が要る。

## 3. Candidate oracle matrix

| Candidate | 入力 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| `CANDIDATE-U-WHIDE-001` | `import { spawnSync } from "node:child_process"` の後に `spawnSync("git", ["status"], { windowsHide: true })` | 違反 0 件 | 適合の呼び出しを違反に数える |
| `CANDIDATE-U-WHIDE-002` | 001 から `windowsHide: true` を除いた `spawnSync("git", ["status"], { encoding: "utf8" })`、options 無しの `spawnSync("git", ["status"])`、`windowsHide: false` の 3 ファイル | 3 件とも `windows-hide-missing` (path と行が一致) | options 無しを見逃す / 値を見ずにプロパティの有無だけで判定する |
| `CANDIDATE-U-WHIDE-003` | `spawn` / `execFile` / `execFileSync` / `exec` / `execSync` をそれぞれ `windowsHide` 無しで 1 回ずつ呼ぶ 1 ファイル | 5 件の `windows-hide-missing` | 対象 API を一部しか見ない |
| `CANDIDATE-U-WHIDE-004` | 別名 import (`import { execFileSync as run } from "child_process"` → `run("gh", [])`) と namespace import (`import * as cp from "node:child_process"` → `cp.spawnSync("git", [])`) | 2 件の `windows-hide-missing` | 別名や namespace を解決しない / `node:` 無しの specifier を見ない |
| `CANDIDATE-U-WHIDE-005` | `child_process` を import しないファイルで `/x/.exec(s)` と `db.exec("SELECT 1")` を呼ぶ | 違反 0 件、対象呼び出し 0 件 | 同名の別 API を子プロセス呼び出しとして数える |
| `CANDIDATE-U-WHIDE-006` | 同じファイルの `const OPTS = { windowsHide: true, encoding: "utf8" }` を `spawnSync("git", [], OPTS)` に渡す。別ファイルから import した `OPTS` を渡す版も作る | 同じファイルの const は違反 0 件、import した値は `windows-hide-unverifiable` | const 参照を追えずに違反にする / 別ファイルの値を推測して適合にする |
| `CANDIDATE-U-WHIDE-013` | 006 の `OPTS` に対し、(a) `OPTS.windowsHide = false`、(b) `Object.assign(OPTS, { windowsHide: false })`、(c) `delete OPTS.windowsHide`、(d) `const alias = OPTS; alias.windowsHide = false`、(e) `tweak(OPTS)` (関数への引き渡し)、(f) `export { OPTS }` をそれぞれ同じファイルに足した 6 版。対照として、`OPTS` を 2 つの `spawnSync` の options にだけ使う版も作る | (a)〜(f) はすべて `windows-hide-unverifiable`、対照は違反 0 | 識別子自身への書き換えだけを見て alias・引き渡し・export を見逃す / options 位置だけの複数利用を違反にする |
| `CANDIDATE-U-WHIDE-007` | `{ ...base, windowsHide: true }` と `{ ...base }` (base 側に windowsHide があっても) と `makeOpts()` の戻り値 | 1 件目は違反 0、2 件目は `windows-hide-missing`、3 件目は `windows-hide-unverifiable` | spread 先を推測する / 関数呼び出しの戻り値を適合にする |
| `CANDIDATE-U-WHIDE-014` | (a) `{ windowsHide: true, ...base }` (`base = { windowsHide: false }`)、(b) `{ windowsHide: true, windowsHide: false }`、(c) `{ windowsHide: false, windowsHide: true }` | (a)(b) は `windows-hide-missing`、(c) は違反 0 | `windowsHide: true` の後ろの spread や重複キーを見ずに適合にする / 最初の値で判定する |
| `CANDIDATE-U-WHIDE-008` | options の位置: `spawnSync("git", { windowsHide: true })` (args 無し、第 2 引数が options) と `execSync("git status", { windowsHide: true })` | 違反 0 件 | options の位置を API ごとに決めず常に第 3 引数を見る |
| `CANDIDATE-U-WHIDE-015` | (a) `spawnSync("git", null, { windowsHide: true })`、(b) `spawnSync("git", undefined, { windowsHide: true })`、(c) 同じファイルの `const ARGS = ["status"]` で `spawnSync("git", ARGS, { windowsHide: true })`、(d) 型の決まらない引数の `spawnSync("git", argsFromParam)`、(e) `execFile("git", ["status"], { windowsHide: true }, (err) => {})` | (a)(b)(c)(e) は違反 0、(d) は `windows-hide-unverifiable` | `null` / `undefined` を options と見なす / 配列の const を追わない / 型の決まらない引数を推測する / callback を options と見なす |
| `CANDIDATE-U-WHIDE-009` | baseline `{ "src/a.ts": 2 }` に対し、(a) `src/a.ts` の違反 3 件、(b) 違反 1 件、(c) 違反 2 件、(d) baseline に無い `src/b.ts` の違反 1 件 | (a) `windows-hide-new` で `ok=false`、(b) `windows-hide-stale-baseline` で `ok=false`、(c) `ok=true`、(d) `windows-hide-new` で `ok=false` | baseline を上限ではなく下限として扱う / 減ったときに baseline 更新を求めない / baseline 外のファイルを素通りさせる |
| `CANDIDATE-U-WHIDE-016` | 比較元 `{ "src/a.ts": 2 }` に対し、(a) baseline `{ "src/a.ts": 3 }` と実測 3、(b) baseline `{ "src/a.ts": 1, "src/b.ts": 1 }` と実測 a=1・b=1 (件数の付け替え)、(c) baseline `{ "src/a.ts": 2 }` と実測 2 | (a)(b) は `windows-hide-baseline-grown` で `ok=false`、(c) は `ok=true` | baseline を比較元と比べない / 合計だけを比べてファイル間の付け替えを見逃す |
| `CANDIDATE-U-WHIDE-017` | 比較元の取得 (temp の実 git repository): (a) merge-base の commit にファイルがある、(b) merge-base は解決できるがファイルが無い、(c) merge-base を解決できない、(d) ファイルはあるが解釈できない | (a) は比較を行う、(b) は比較を省いて違反 0、(c)(d) は `windows-hide-baseline-base-unreadable` で `ok=false` | 比較元を読めないときに比較を省いて通す / 初回導入を拒否する |
| `CANDIDATE-U-WHIDE-018` | 直前の行に `// windows-hide: gui-launch 設定画面を開く` を置いた `spawn("notepad.exe", [], { stdio: "inherit" })` と、理由が空の `// windows-hide: gui-launch` を置いた同じ呼び出し | 前者は違反 0 で集計 `gui=1`、後者は `windows-hide-missing` | 注記の理由を見ない / 注記の無い GUI 起動を素通りさせる |
| `CANDIDATE-U-WHIDE-010` | 実 repo の走査 (§2 の対象ディレクトリ全体) と `src/lint/windows-hide-baseline.ts`、比較元は merge-base の同ファイル | `ok=true`。baseline の各行の件数が実測件数と一致し、各ファイルの件数が比較元以下 | 実 repo で新しい違反を許す / baseline を実測とずらしたまま通す |
| `CANDIDATE-U-WHIDE-011` | 001〜004 の入力を順序を入れ替えて 2 回渡す | 2 回の結果 (違反の並びと件数) が一致し、違反は path と行の順に並ぶ | 入力の順序で結果が変わる |
| `CANDIDATE-U-WHIDE-012` | doctor の `windows-hide` check を、違反 1 件を含む fixture tree と違反 0 件の fixture tree で実行する | 違反ありは失敗扱いで `path:line:reason` と末尾の集計行を出す。違反 0 件は成功で集計行だけを出す | doctor 側で違反を warn に落とす / 集計行を出さない |

## 4. 運用

- `fork` と worker thread は対象外であり、それらを違反に数えないことは 005 と同じ扱い (対象 API 以外は数えない) で確かめる。
- (1) の Red は、モジュールが無いための import 失敗で成立するので、各規則が Red だった証拠にはならない。そこで (3) の実装 PR では、Green にした後で候補ごとに L6 の規則を 1 本だけ殺す mutation を手元で入れ (commit しない)、該当の行が fail することを確かめ、そのログを PR の証跡に残す。
- baseline を 0 にする領域 PR (L6 §6) は、本書の oracle を変えない。010 が各 PR で baseline の縮小を確かめる。
