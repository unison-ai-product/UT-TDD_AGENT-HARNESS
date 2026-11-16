---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_provider_command_resolution
pair_artifact: docs/test-design/harness/L7-provider-command-resolution-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1694
---

> **L6 contract marker**: `findOnPath(command: string, env: NodeJS.ProcessEnv, platform: NodeJS.Platform, fs?: PathFs) => string | null` (新しい module `src/runtime/path-lookup.ts`) を新設し、`resolveClaudeNativeCommand` / `resolveCodexNativeCommand` の PATH 解決 (`firstOnPath`) をそれへ置き換える。`isProviderCommandSpawnable` は、解決できなかった provider を起動せず `false` を返す。unit-test-granularity contract で、DbC は §6、oracle は `docs/test-design/harness/L7-provider-command-resolution-test-design.md` の `CANDIDATE-U-PCMDRES-001`〜`013` が受け持つ。

> **契約状態**: 本書は pair-freeze のための契約案で、非著者の closing review 前である。§5 の D1 (走査の共有) と D2 (解決できないときの扱い) は推奨の案で本文を書いており、control の判断で覆ったら §2〜§4 を改訂する。source 実装・実行証跡を示さない。

# provider の実行ファイルの解決 (Issue #1694)

## 1. 位置付けと現状

#1693 で凍結した `claude-version-probe.md` §3 は、doctor の版の probe について PATH を自分で走査して絶対 path を決める規則 (空・相対の要素を飛ばす、`PATHEXT` の順、最初の候補だけ) を定めた。同 §9 は、`firstOnPath` が `where.exe` を使い current directory から探す点を範囲外として #1694 へ送った。本書はその #1694 の契約である。

現状 (origin/main `262746842`、どれも読んで確かめた)。

- `src/runtime/adapter.ts:192-210` の `firstOnPath` は、Windows では `System32\where.exe`、それ以外では `which` を `execFileSync` で起動し、出力の最初の行を返す。`where.exe` は PATH より先に current directory を探すので、作業中の repo に `claude.cmd` / `claude.exe` / `codex.cmd` があるとそれを返しうる。この結果は provider の起動と可用性の判定の両方に使われる (下の呼び出し元)。
- 本環境の実測で、`where.exe codex` は `...\npm\codex` (拡張子なしの shim) を先に返し、次に `...\npm\codex.cmd` を返した (2026-11-16)。`firstOnPath` は最初の行を取るので、拡張子なしの file が解決結果になりうる。
- `firstOnPath` の呼び出し元は 2 箇所だけである。`resolveClaudeNativeCommand` の末尾 (`adapter.ts:249`) と `resolveCodexNativeCommand` の末尾 (`:271`)。どちらも、先に明示の環境変数 (`UT_TDD_CLAUDE_BIN` / `UT_TDD_CODEX_BIN`、`:217-218` / `:257-258`) と Windows の native の置き場 (APPDATA の Claude、VS Code 拡張、npm の `codex.exe` / `codex.cmd`) を見て、見つからないときだけ PATH へ進む。
- `resolveProviderCommand` (`:274-281`) は `解決結果 ?? plannedCommand` を返す。`plannedCommand` は `buildAdapterPlan` が置く素の名前 `"claude"` / `"codex"` (`:422`)。
- `buildProviderInvocation` (`:298-316`) は `resolveProviderCommand` の結果を使う。Windows の `.cmd` / `.bat` は `cmd /d /s /c` へ渡し、それ以外はその値をそのまま command にする。
- `isProviderCommandSpawnable` (`:334-367`) は `buildProviderInvocation` の結果で `--version` を `spawnSync` する (cwd は継承)。`detectMode` (`src/runtime/detect.ts:49-51` の既定の関数を `:59-60` で呼ぶ) がこれを `claude` / `codex` それぞれに呼び、runtime の mode を決める。`providerAvailable` (`adapter.ts:137-140`) と `buildAdapterPlan` の `available` はその mode から決まる。
- 実際の起動は `src/cli/delegation.ts:206-221` (`ut-tdd codex|claude`) と `src/cli.ts:3050-3056` (team run) が、`buildProviderInvocation` の結果を spawn する。どちらも `plan.available` が偽なら起動しない (`delegation.ts:498`、`:534`、`src/team/run.ts:337` の `executable`)。
- 素の名前 `claude` を Windows で spawn すると、libuv は cwd から先に探す (`claude-version-probe.md` §1 の記述と同じ事実)。したがって、PATH の解決が null のときの `?? plannedCommand` は、解決を直しても current directory の候補を起動しうる。

## 2. 解決の方式

PATH の解決は、外部 command (`where.exe` / `which`) に任せず、`findOnPath` が PATH を自分で走査して絶対 path を決める。走査の規則 (空・相対の要素を飛ばす、Windows の `PATHEXT` の順と拡張子の限定、POSIX の実行権限、最初の候補だけを使う) は `claude-version-probe.md` §3 の「解決」の 1〜4 を正本とし、本書は写さない。`findOnPath` は §3 の解決だけを行い、実行はしない (実行の規則は §3 の「実行」で、probe 側に残る)。

| 項目 | 契約 |
|---|---|
| 入力 | `command` は素の名前 (`"claude"` / `"codex"`)。PATH は `env.PATH ?? env.Path`。`process.cwd()` と `process.env` は読まない (引数の `env` だけ) |
| 出力 | 最初の候補の絶対 path、候補が無ければ `null`。例外を投げない |
| 外部 process | 起動しない。`where.exe` / `which` を使わない |
| 注入口 | `PathFs = { isFile(path): boolean; canExecute(path): boolean }`。既定は `node:fs` の `statSync` / `accessSync(X_OK)`。`ProviderCommandResolutionOptions` に `pathFs?: PathFs` を足し、`runPathLookup` は廃止する (同名で意味の変わる注入口を残さない) |
| 共有 | `claude-version-probe.md` の `probePathClaude` も、PATH の解決は `findOnPath("claude", env, platform)` を呼ぶ。module は `src/runtime/path-lookup.ts` に置く (`src/doctor` から `src/runtime` を呼ぶ向きにし、逆向きの依存を作らない) |

解決の全体の順序は変えない: 明示の環境変数 → Windows の native の置き場 → `findOnPath`。変わるのは最後の段だけである。

## 3. 解決できないときの扱い

`resolveProviderCommand` の `?? plannedCommand` は、`buildProviderInvocation` の入力を作る都合で残す (署名と戻り値の型を変えない)。代わりに `isProviderCommandSpawnable` が、解決結果が無いときは spawn せず `false` を返す。

1. `isProviderCommandSpawnable` は、`resolveProviderCommand` の前に provider の解決 (`resolveClaudeNativeCommand` / `resolveCodexNativeCommand`) を呼び、`null` なら `runProbe` を呼ばずに `false` を返す。解決できたら、その絶対 path を `buildProviderInvocation` へ渡して従来どおり `--version` を実行する。
2. probe が `true` を返した provider だけが `plan.available` になるので (§1)、実際の起動 (`delegation.ts:206`、`cli.ts:3050`) の時点で解決結果は無くならない。`buildProviderInvocation` の `plannedCommand` への fallback は、この経路では使われない。dry-run の plan の `command` の表示のためだけに残る。
3. `buildProviderInvocation` を、解決できないとき例外にする案は採らない (§5 の D2)。

## 4. 呼び出し元への影響

| 呼び出し元 | 影響 |
|---|---|
| `resolveClaudeNativeCommand` / `resolveCodexNativeCommand` | 最後の段が `findOnPath` に変わる。戻り値の型は同じ。PATH の外の native の置き場の優先は変わらない |
| `resolveProviderCommand` | 変えない |
| `buildProviderInvocation` | 変えない。`.cmd` / `.bat` は今までどおり `cmd /d /s /c` で、解決結果が拡張子なしの file になることは無くなる (§2 の拡張子の限定) |
| `isProviderCommandSpawnable` | §3。解決できないとき `runProbe` を呼ばず `false` |
| `detectMode` (`detect.ts:59-60`) | 変えない。解決できない provider は今までより確実に「使えない」になる |
| `delegation.ts:206`、`cli.ts:3050` | 変えない (§7) |
| 明示の環境変数 (`UT_TDD_CLAUDE_BIN` / `UT_TDD_CODEX_BIN`) | 変えない。利用者が明示した path は信頼し、相対 path の扱いは本書の範囲外 |

POSIX の `which` は、PATH の空要素や相対要素を shell によって current directory として扱うことがある。`findOnPath` はそれらを飛ばすので、PATH に相対要素を置いていた構成は provider を見つけられなくなる。この変更は意図したものである (`claude-version-probe.md` §3 と同じ)。

## 5. 方式の判断

| 論点 | 採る方式 (推奨) | 採らない方式と理由 |
|---|---|---|
| D1 走査を共有するか | `probePathClaude` と provider の解決で同じ `findOnPath` を使う (§2)。規則の正本は 1 か所 (`claude-version-probe.md` §3) | 別々に実装する: 実装が `src/doctor` と `src/runtime` の 2 か所に分かれ、片方だけ規則が変わる drift が起きうる (空要素の扱いが 2 通りになる)。利点は `src/doctor/claude-path-probe.ts` の実装 PR (#1693 の実装) と独立に進められること。共有は、先に入る側が `src/runtime/path-lookup.ts` を作り、後の側が import する順序の制約を持つ |
| D1' 外部 command を残す | 採らない: `where.exe` を cwd の外で動かす (spawn の `cwd` を System32 などにする) 案は、拡張子なしの file が返る問題 (§1) と PATH の相対要素の扱いが残る。結果を後から current directory で絞る案は、symlink と大小の違いで脆い | |
| D2 解決できないとき | `isProviderCommandSpawnable` が `false` を返す (§3)。`src/cli.ts` を変えない | `buildProviderInvocation` が例外を投げる: fail-close が最も強いが、`cli.ts:3050` は `try` の外で呼ぶので `src/cli.ts` の変更が要り、S7 の終了まで Claude lane は変えられない。素の名前への fallback を残す: Windows で current directory の `claude.exe` を起動しうる (§1 の最後) |

## 6. 不変条件

| DbC | 契約 |
|---|---|
| pre | `findOnPath` の `env` は任意 (PATH が無い・空でもよい)。`fs` を省略すると実 file system を使う |
| post | 候補があれば PATH の前から数えて最初の 1 つの絶対 path、無ければ `null`。`process.cwd()` 配下の file を、PATH に絶対 path として現れない限り返さない。`isProviderCommandSpawnable` は解決できない provider について `runProbe` を 0 回呼び `false` を返す。解決できたときは、`runProbe` が受ける command (`.cmd` / `.bat` は `cmd` の引数の中) が絶対 path である |
| invariant | 解決の順序 (明示 → native → PATH)、`buildProviderInvocation` の `cmd /d /s /c` の組み立てと `%` の拒否、`provider_*` の診断、`shell: false` を変えない。外部 process を解決のために起動しない。production の code にテスト専用の切り替えを足さない |

## 7. 実装の範囲

実装の PR が変えるもの: 新しい `src/runtime/path-lookup.ts`、`src/runtime/adapter.ts` (`firstOnPath` の削除と `findOnPath` への置き換え、`ProviderCommandResolutionOptions` の `runPathLookup` を `pathFs` に、`isProviderCommandSpawnable` の解決できない分岐)。#1693 の実装が先に入っていて `probePathClaude` が自前で走査しているなら、それを `findOnPath` の呼び出しに置き換える (Refactor)。

**`src/cli.ts` は変える必要が無い**。`buildProviderInvocation` の署名と戻り値が同じで、起動の側 (`delegation.ts:206`、`cli.ts:3050`) は `plan.available` が真のときだけ呼び (§1)、その真偽は `isProviderCommandSpawnable` (§3) が決める。D2 を例外の案へ覆した場合だけ、`cli.ts` の変更が要る。

変えないもの: provider の明示の環境変数と native の置き場の優先、`buildProviderInvocation` の組み立て、`detectMode` の形、版の probe の実行の規則 (`claude-version-probe.md` §3 の「実行」)。

本書の範囲外 (別の改訂で扱う): `function-spec.md:510` の `RuntimeDetection` の行は、finder (`where.exe`) を `System32` から解決する検出契約を書いている。`firstOnPath` を廃止するとこの記述が現状と合わなくなるが、共有文書なので実装 PR の後に別の PR で改訂する。同じく `L7-unit-test-design.md:935` の `U-ADAPTER-011` (`where.exe` を使う oracle) は、本書の oracle に置き換えられる。実装 PR は `tests/runtime-adapter.test.ts` の対応する test を更新する (L7 の §6)。provider の spawn の cwd (provider が repo で動く設計上 current directory のままにする) と、`.cmd` の shim の内側が素の `node` を探すときの current directory の扱いは、本書では変えない。

## 8. V-pair

対のテスト設計は `docs/test-design/harness/L7-provider-command-resolution-test-design.md` で、oracle は `CANDIDATE-U-PCMDRES-001`〜`013`、反例と oracle の対応は同書の §4 と §5 にある。
