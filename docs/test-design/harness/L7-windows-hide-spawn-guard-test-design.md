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

この pair-freeze では候補 ID (`CANDIDATE-U-WHIDE-*`) だけを宣言する。Red のテスト (`it.fails`) は候補 ID で引用して先に入れ、正式 ID `U-WHIDE-*` への昇格はテストの引用の書き換えと同じ後続 PR で行う (設計保護 gate の L6 §10.3 と同じ順序)。

## 2. fixture

- `analyzeWindowsHide` の行は、path と内容の組を直接渡す純粋関数の入力で作る。実 repo のファイルは読まない (010 を除く)。
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
| `CANDIDATE-U-WHIDE-007` | `{ ...base, windowsHide: true }` と `{ ...base }` (base 側に windowsHide があっても) と `makeOpts()` の戻り値 | 1 件目は違反 0、2 件目は `windows-hide-missing`、3 件目は `windows-hide-unverifiable` | spread 先を推測する / 関数呼び出しの戻り値を適合にする |
| `CANDIDATE-U-WHIDE-008` | options の位置: `spawnSync("git", { windowsHide: true })` (args 無し、第 2 引数が options) と `execSync("git status", { windowsHide: true })` | 違反 0 件 | options の位置を API ごとに決めず常に第 3 引数を見る |
| `CANDIDATE-U-WHIDE-009` | baseline `{ "src/a.ts": 2 }` に対し、(a) `src/a.ts` の違反 3 件、(b) 違反 1 件、(c) 違反 2 件、(d) baseline に無い `src/b.ts` の違反 1 件 | (a) `windows-hide-new` で `ok=false`、(b) `windows-hide-stale-baseline` で `ok=false`、(c) `ok=true`、(d) `windows-hide-new` で `ok=false` | baseline を上限ではなく下限として扱う / 減ったときに baseline 更新を求めない / baseline 外のファイルを素通りさせる |
| `CANDIDATE-U-WHIDE-010` | 実 repo の走査 (§2 の対象ディレクトリ全体) と `src/lint/windows-hide-baseline.ts` | `ok=true`。baseline の各行の件数が実測件数と一致し、baseline の合計が増えていない (縮小のみ) | 実 repo で新しい違反を許す / baseline を実測とずらしたまま通す |
| `CANDIDATE-U-WHIDE-011` | 001〜004 の入力を順序を入れ替えて 2 回渡す | 2 回の結果 (違反の並びと件数) が一致し、違反は path と行の順に並ぶ | 入力の順序で結果が変わる |
| `CANDIDATE-U-WHIDE-012` | doctor の `windows-hide` check を、違反 1 件を含む fixture tree と違反 0 件の fixture tree で実行する | 違反ありは失敗扱いで `path:line:reason` と末尾の集計行を出す。違反 0 件は成功で集計行だけを出す | doctor 側で違反を warn に落とす / 集計行を出さない |

## 4. 運用

- `fork` と worker thread は対象外であり、それらを違反に数えないことは 005 と同じ扱い (対象 API 以外は数えない) で確かめる。
- 実装 PR は候補ごとに L6 の規則を 1 本だけ殺す mutation を入れて Red になることを確かめ、そのログを証跡に残す。モジュールが無いための import 失敗は各規則の Red の証拠にしない。
- baseline を 0 にする領域 PR (L6 §6) は、本書の oracle を変えない。010 が各 PR で baseline の縮小を確かめる。
