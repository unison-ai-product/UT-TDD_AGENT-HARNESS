---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_windows_hide_default
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 693
---

> **L6 contract marker**: `applyWindowsHideDefault(childProcessModule) => void` と `analyzeWindowsHide(sources) => WindowsHideResult` は unit-test-granularity contract である。DbC pre/post/invariant は §7 にまとめる。oracle の索引は共有の `docs/test-design/harness/L7-unit-test-design.md` (§子プロセスの windowsHide 既定) に置き、詳細 (`U-WHIDE-001〜014`) は専用の `docs/test-design/harness/L7-windows-hide-default-test-design.md` が固定する。

# 子プロセスの windowsHide 既定 — 関数設計 (issue #693)

## 1. 目的

Windows では、Node の `child_process` で起動した子プロセスに `windowsHide: true` が無いと、子プロセスごとに console window が開いて画面がちらつく。テスト・doctor・review の委譲・hook・`ut-tdd pr merge` は git / gh を何百回も起動するので、作業中の画面が点滅し続ける (PO 報告、2026-10-13)。2026-10-13 の走査では `child_process` 呼び出し 482 件のうち 401 件に `windowsHide` が無かった。

先に出した契約 (PR #1009、閉じた) は、全呼び出しに `windowsHide: true` の literal を書かせ、既存違反を baseline で縮小する方式だった。これは 401 件を 1 件ずつ直す必要があり、新規の呼び出しも毎回書き忘れうる。本設計はそれを置き換え、**入口で `child_process` の既定を `windowsHide: true` にする**。1 箇所の wrapper が全呼び出しに効くので、呼び出し側の個別修正、baseline、領域別の分割 PR はいずれも要らない (advisor `claude-fable-5-1` の推奨と PO の指摘、2026-10-15)。

## 2. wrapper の契約

単一の module `src/runtime/windows-hide.ts` (計画。本 PR では実装しない) を置く。この module は **import した時点で** `node:child_process` の次の 7 関数を差し替える: `spawn` / `spawnSync` / `execFile` / `execFileSync` / `exec` / `execSync` / `fork`。

- **既定規則**: 呼び出しの options の `windowsHide` が `undefined` (キー無しを含む) なら `true` にする。明示の `false` は変えない。`true` はそのまま。
- **引数形の正規化**: 引数の型で overload を判別する (配列 = args、function = callback、`null` / `undefined` 以外の object = options、`null` / `undefined` = 無し)。`windowsHide` を足した options を、次の表の位置に挿入する。callback は常に最後の引数のまま保つ。
  - `spawn` / `spawnSync` / `execFileSync` / `fork`: `(file)` → `(file, [], {windowsHide:true})`、`(file, args)` → `(file, args, {windowsHide:true})`、`(file, options)` → `(file, copy(options))`、`(file, null|undefined, options)` と `(file, args, options)` は options の copy に足す、`(file, null|undefined)` → `(file, [], {windowsHide:true})`。
  - `execFile`: 上と同じ規則に callback を加える。`(file, callback)` → `(file, {windowsHide:true}, callback)`、`(file, args, callback)` → `(file, args, {windowsHide:true}, callback)`、`(file, options, callback)` と `(file, args, options, callback)` は options の copy に足す。`(file)` / `(file, args)` は上と同じ。第 2 引数が function のときに、args 配列も options も無い形として扱うことを明示する。
  - `exec`: `(command)` → `(command, {windowsHide:true})`、`(command, callback)` → `(command, {windowsHide:true}, callback)`、`(command, options[, callback])` は options の copy に足す。`execSync`: `(command)` → `(command, {windowsHide:true})`、`(command, options)` は copy に足す。
  - 呼び出し側の options object を**書き換えず**、shallow copy に `windowsHide` を足して渡す (呼び出し側が同じ object を再利用しても共有状態が汚れない)。
- **ESM named import**: 差し替えのあとで `module.syncBuiltinESMExports()` を呼び、`import { spawnSync } from "node:child_process"` の名前付き束縛にも wrapper を見せる。これが無いと ESM 側は元の関数を掴んだままで、wrapper が効かない (最初の Red 候補)。
- **冪等**: 包んだ関数には、`Symbol.for("ut-tdd.windowsHide.wrapped")` (global symbol registry に登録され、module を再評価しても同じ値になる) をキーとする印と、元の関数への参照を持たせる。適用時に印がある関数は包まない。module-local の `Symbol()` は再評価ごとに別の値になり、印を見失って二重に包むので使わない。包みの段数は 1 を超えない。
- **副作用の範囲**: `windowsHide` 以外の引数・戻り値・例外・`this` は変えない。非 Windows でも差し替える (Node は非 Windows で `windowsHide` を無視するので、分岐を持たない)。

## 3. wrapper を最初に import する入口

wrapper はプロセスごとに 1 回効けばよい。子プロセスを起動しうる**入口**で、他の import より前に副作用 import する。

1. `src/cli.ts`
2. `.claude/hooks/*.ts` の各 hook (現在は `agent-guard.ts` / `session-log.ts` / `work-guard.ts`。hook は CLI を経由せず直接 `node` で起動されるので個別に要る)
3. vitest の `setupFiles` (現在の `vitest.config.ts` は `globalSetup` だけを持つ。worker プロセスは `globalSetup` の差し替えを引き継がないので、`setupFiles` に wrapper を import する entry を足す)
4. `scripts/` の node 入口のうち子プロセスを起動するもの (現在は `build-node.mjs` / `node-generation-ci.mjs` / `pack-canary-acceptance.mjs` / `run-vitest-snapshot.ts` / `git-hooks/secret-scan-diff.ts`)

**Pack 配布 (契約訂正)**: Pack の確認対象は、実際に出荷する bundled CLI と consumer adapter template に限る。`ut-tdd distribution sync-pack` の出荷集合で wrapper と CLI の入力 (`src/runtime/windows-hide.ts` / `src/cli.ts`) が揃い、CLI の副作用 import と consumer template の hook command が `.ut-tdd/bin/ut-tdd.mjs` を指すことを静的に確認する。これは bundle 入力と consumer template の配線確認であり、compiled bytes への wrapper 混入を証明しない。compiled artifact への混入は Green 工程で実 build/metafile を確認する。source repo の `.claude/hooks/*.ts` は Pack へ出荷しない。これらと `scripts/` の source entry は §5(a) の source 検査で確認し、Pack の出荷集合には要求しない。欠落時は §5(a) と同じ finding で失敗させる。

## 4. 既知の限界

- **最初の 1 段は直せない**。Claude Code / Codex / VS Code が `node` を起動する 1 段目は親プロセスの決定であり、その子の入口に入った wrapper は、起動されたあとでしか効かない。本方式が減らすのは、その `node` が起動する孫以降 (git / gh / node ほか) の点滅である。
- `child_process` を介さない起動 (shell script 内の起動、native addon) は対象外。
- GUI アプリの window を見せるために起動する呼び出しは、`windowsHide: false` を明示し、§5(b) の理由コメントを付ける。2026-10-13 時点で該当は無い。
- `Object.prototype` の汚染など、プロセス全体の組み込み object の改変は範囲外とする。

## 5. doctor の検査

doctor の check 名は `windows-hide`、CI の doctor (governance hard gates) で fail-close する。検査は次の 2 つだけである。per-call の literal 規則・baseline・縮小のみの比較元・5 PR の分割は廃止する。

(a) **入口の import**: §3 の入口 (src/cli.ts、`.claude/hooks/*.ts` の全件、`scripts/` の node 入口のうち `child_process` を使うもの、`vitest.config.ts` の `setupFiles` が指す entry) が、wrapper を import していること。欠けたら finding `windows-hide-entry-missing` を `path:line:reason` で出す。判定は静的で、import 文 (`import "…/windows-hide.ts"` の副作用 import) の有無だけを見る。他の import より前に置くことは、先頭の import 文であるかで確かめる。

(b) **`windowsHide: false` の理由**: ソース中の `windowsHide: false` は、同じ行または直前の行に、空でない理由コメント (`// windows-hide: <理由>`) が必要である。無ければ finding `windows-hide-false-unexplained`。

出力は違反ごとに `path:line:reason`、末尾に `checked=<走査ファイル数> entries=<入口数> falses=<windowsHide: false の数> violations=<違反数>`。走査対象は `src/`・`scripts/`・`.claude/hooks/`・`tests/` の `.ts` / `.mts` / `.mjs` / `.cjs` / `.js` (`node_modules/` と `docs/` は除く)。

## 6. 既存テストへの影響

wrapper は呼び出しの options に `windowsHide: true` を足すので、`child_process` の spawn 系を `toHaveBeenCalledWith` で**引数の完全一致**で検証するテストは、期待値に `windowsHide: true` を足す必要がある。2026-10-15 の実測で `toHaveBeenCalledWith` と spawn 系の呼び出しを併せ持つテストファイルは 4 件 (`tests/node-plan-revision-runner.test.ts`・`tests/release-artifact-resolver.test.ts`・`tests/release-consumer-setup-artifacts.test.ts`・`tests/review-live-cli.test.ts`)。advisor は 2 件と見積もったので、実際に失敗するかは Green PR で実測して確定し、失敗したものだけ期待値を更新する (更新は期待値への `windowsHide: true` の追加だけで、テスト意図は変えない)。

`vi.mock("node:child_process")` を使うファイルは `tests/claude-memory-wake.test.ts` の 1 件で、`importActual` した実体へ素通しする wrapper (`execFileSync`) である。実体は `setupFiles` で差し替え済みなので、素通しされる呼び出しにも既定が効く。mock が実体を経由せず完全に置き換えるファイルがあれば、そこでは wrapper が有効でない (その呼び出しは実プロセスを起こさないので、点滅の原因にならない)。

## 7. 不変条件 (DbC)

- Pre (`applyWindowsHideDefault`): 引数は差し替え可能な `child_process` module 相当 object。
- Post: 7 関数のすべてで、`windowsHide` が `undefined` の呼び出しは `true` で下位に渡る。明示 `false` は `false` のまま。2 度適用しても関数の包み段数は 1。適用後に `syncBuiltinESMExports()` が呼ばれ、ESM named import も同じ関数を指す。
- Invariant: 呼び出し側の options object を変更しない。`windowsHide` 以外の引数・戻り値・例外を変えない。
- Pre (`analyzeWindowsHide`): 入力は走査対象のファイルの path と内容の列、入口の一覧。読み取りだけを行い、ファイルを書かない。
- Post: `ok` は `windows-hide-entry-missing` / `windows-hide-false-unexplained` が 0 件のときだけ true。違反は path と行で一意に並べ、入力の順序に依存しない。

## 8. 範囲外

- worker thread (`node:worker_threads`)。
- 実行時に console window が開いたかの観測。
- 最初の 1 段 (§4)。

## 9. 根拠

- issue #693 (2026-09-25 の監査)、#683 / PR #684 (provider 経路の修正)、PR #1049 (hook 経路の 7 箇所)。
- 2026-10-13 の走査 (482 件中 401 件が未対応)。
- PO 指示 (2026-10-13): 「CI 走った時に PowerShell の画面がちかちかする現象 … 恒久的に対策してくれない？」
- advisor `claude-fable-5-1` の推奨 (2026-10-15): 入口の既定 wrapper。
