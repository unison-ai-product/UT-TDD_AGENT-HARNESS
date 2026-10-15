---
title: "L7 windows hide default test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: confirmed
updated: 2026-10-15
---

# 子プロセスの windowsHide 既定 テスト設計 (issue #693)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/windows-hide-default.md` である。
本書はその §2 wrapper の契約、§3 入口、§5 doctor の検査、§6 既存テストへの影響、§7 不変条件を検証する oracle を定義する。
共有の `docs/test-design/harness/L7-unit-test-design.md` には索引 (§子プロセスの windowsHide 既定) だけを置き、本書が詳細の正本である。
先に出した PR #1009 の oracle (per-call literal・baseline・縮小のみの比較元) は本方式に置き換わったので引き継がない。

この pair-freeze では候補 ID (`CANDIDATE-U-WHIDE-*`) だけを宣言する。Red は後続 PR で、設計保護 gate の L6 `design-protection-diff-gate.md` §10.3 と同じ順序にする: (1) Red のテスト (`it.fails`) を候補 ID で引用して入れ、開発 repo を読むテストファイル (012) には同じ PR で `repositoryReadContracts` の登録行を足す、(2) 正式 ID `U-WHIDE-*` への昇格を src/ を含まない PR で入れる、(3) 実装 PR で `it.fails` を `it` に戻して Green にする。

## 2. fixture

- wrapper の行は、`child_process` 相当の fake module (各関数が受け取った引数を記録する) に `applyWindowsHideDefault` を適用して観測する。実プロセスは起動しない。ESM の行 (002) だけは、実際の `node:child_process` を子プロセスの Node で import して観測する。
- `analyzeWindowsHide` の行は、path と内容の組と入口の一覧を直接渡す純粋関数の入力で作る。実 repo は読まない (012 を除く)。
- 呼び出しの書き方は各行で 1 つだけ変え、L6 の規則を 1 本だけ殺すように作る。

## 3. Candidate oracle matrix

| Candidate | 入力 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| `CANDIDATE-U-WHIDE-001` | fake module に適用したあと、7 関数 (`spawn` / `spawnSync` / `execFile` / `execFileSync` / `exec` / `execSync` / `fork`) をそれぞれ `windowsHide` 無しの options で呼ぶ | 下位に渡った options の `windowsHide` が全関数で `true`、他のキーは変わらない | 一部の関数だけ包む / 既定を `true` 以外にする |
| `CANDIDATE-U-WHIDE-002` | 適用後に、実 `node:child_process` を子プロセスの Node で `import { spawnSync } from "node:child_process"` し、受け取った options を観測する (`syncBuiltinESMExports()` の有無で比較) | named import の `spawnSync` が wrapper で、既定が `true` で下位に渡る。(最初の Red 候補) | `syncBuiltinESMExports()` を呼ばず ESM の束縛が元の関数のまま |
| `CANDIDATE-U-WHIDE-003` | 引数形 (L6 §2 の正規化表の全行): (a) `spawn(cmd)` / `spawnSync(cmd)` / `execFileSync(cmd)` / `fork(m)`、(b) `(cmd, args)`、(c) `(cmd, options)` (args 省略)、(d) 第 2 引数が `null` / `undefined`、(e) `execFile(file)`、`execFile(file, callback)`、`execFile(file, args, callback)`、`execFile(file, options, callback)`、`execFile(file, args, options, callback)`、(f) `exec(cmd)`、`exec(cmd, callback)`、`exec(cmd, options, callback)`、`execSync(cmd)`、`execSync(cmd, options)` | 下位に渡った引数列が表の正規化形と一致する (例: `execFile(file, callback)` → `(file, {windowsHide:true}, callback)`)。callback は最後の引数のまま、args の位置が崩れない | options の位置を常に第 3 引数と決める / callback を options と取り違える / 第 2 引数が callback のとき options を補わない |
| `CANDIDATE-U-WHIDE-004` | 明示 `windowsHide: false` と `windowsHide: true` を 7 関数に渡す | `false` は `false` のまま、`true` は `true` のまま | 明示の `false` を `true` に上書きする |
| `CANDIDATE-U-WHIDE-005` | (i) 同じ fake module に適用関数を 2 回呼ぶ。(ii) 同じ fake module に対し、wrapper module を cache を避けて 2 回評価 (query 付き import など) する。いずれも適用後の `spawnSync` の関数の同一性と、元の関数に辿るまでの包み段数を観測する | (i)(ii) とも、2 回目の適用の前後で関数の同一性が保たれ、包み段数は 1。印は `Symbol.for("ut-tdd.windowsHide.wrapped")` を使う。下位の呼び出し回数だけでは二重に包んでも 1 回なので、観測の根拠にしない | module ごとに新しい Symbol を作り、再評価で二重に包む / 呼び出し回数だけを見て二重の包みを見逃す |
| `CANDIDATE-U-WHIDE-006` | 呼び出し側が持つ options object を渡し、呼び出し後にその object を調べる。同じ object を 2 回目の呼び出しにも渡す | 呼び出し側の object に `windowsHide` が足されていない (shallow copy を渡している) | 呼び出し側の object を書き換えて共有状態を汚す |
| `CANDIDATE-U-WHIDE-007` | wrapper が戻り値・例外・`this` を変えないこと: fake 側が返した object の同一性、throw した例外の同一性を比べる | 戻り値と例外が同一 object のまま届く | 戻り値を包み直す / 例外を握りつぶす |
| `CANDIDATE-U-WHIDE-008` | doctor の `windows-hide` (a): 入口 (`src/cli.ts`、`.claude/hooks/` の各 hook、`vitest.config.ts` の `setupFiles` が指す entry、`scripts/` の `child_process` を使う入口) のうち、(i) すべて wrapper を import する fixture、(ii) hook 1 件が import を欠く fixture、(iii) import があるが先頭の import 文でない fixture | (i) は違反 0。(ii) は `windows-hide-entry-missing` で `path:line:reason`。(iii) は `windows-hide-entry-missing` | import の有無を見ない / 先頭の import であることを確かめない |
| `CANDIDATE-U-WHIDE-009` | `vitest.config.ts` の fixture: (i) `setupFiles` に wrapper の entry がある、(ii) `globalSetup` だけで `setupFiles` が無い | (i) は違反 0、(ii) は `windows-hide-entry-missing` | `globalSetup` で足りると判定する (worker に効かない) |
| `CANDIDATE-U-WHIDE-010` | doctor の `windows-hide` (b): (i) 同じ行に `// windows-hide: gui を見せる` を持つ `windowsHide: false`、(ii) 直前の行にコメントがある、(iii) コメントが無い、(iv) 理由が空の `// windows-hide:`、(v) `windowsHide: true` のみのファイル | (i)(ii)(v) は違反 0。(iii)(iv) は `windows-hide-false-unexplained` | 理由の有無を見ない / 空の理由を有効にする / `true` を違反に数える |
| `CANDIDATE-U-WHIDE-011` | 008〜010 の入力を順序を入れ替えて 2 回渡し、出力の集計行を比べる | 違反の並び (path と行の順) と集計行 `checked=… entries=… falses=… violations=…` が一致する | 入力の順序で結果が変わる / 集計行を出さない |
| `CANDIDATE-U-WHIDE-012` | 実 repo の走査と、doctor の `windows-hide` check を、違反 1 件を含む fixture tree と違反 0 件の fixture tree で実行する | 実 repo は `ok=true`。fixture の違反ありは失敗扱いで `path:line:reason` と集計行を出し、違反 0 件は成功。per-call の `windowsHide` 欠落は違反に数えない | doctor 側で違反を warn に落とす / 廃止した per-call 規則や baseline を残す |
| `CANDIDATE-U-WHIDE-013` | Pack のファイル集合: `ut-tdd distribution sync-pack` が作る集合 (または同じ関数が返す配布ファイル一覧) に `src/runtime/windows-hide.ts` と入口 (`src/cli.ts`・`scripts/` の該当ファイル・hook) が含まれ、入口が同じ import を持つ。負例: wrapper を除いた集合 | 含まれていれば違反 0、除くと `windows-hide-entry-missing` で fail | wrapper を配布集合から落とす / Pack の入口が import を欠く |
| `CANDIDATE-U-WHIDE-014` | 既存テストへの影響 (L6 §6): wrapper を `setupFiles` で有効にして、`tests/` の spawn 系を `toHaveBeenCalledWith` で完全一致検証するテストと、`vi.mock("node:child_process")` を使う `tests/claude-memory-wake.test.ts` を実行する | 実測で失敗したものは期待値に `windowsHide: true` を足した差分だけで通る。`claude-memory-wake` は素通しの wrapper で通る | wrapper のためにテスト意図を変える / mock 経由で wrapper が外れて失敗を隠す |

## 4. 運用

- `worker_threads` と最初の 1 段 (L6 §4) は対象外であり、それらを違反に数えないことは 012 の実 repo の走査で確かめる。
- (1) の Red は、module が無いための import 失敗で成立するので、各規則が Red だった証拠にはならない。そこで (3) の実装 PR では、Green にした後で候補ごとに L6 の規則を 1 本だけ殺す mutation を手元で入れ (commit しない)、該当の行が fail することを確かめ、そのログを PR の証跡に残す。
- 014 の期待値更新は Green PR の範囲である。どのファイルが失敗するかは実測で確定し、本書の件数 (L6 §6 の 4 件) を事実として固定しない。
