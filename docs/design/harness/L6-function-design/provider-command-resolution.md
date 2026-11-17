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

> **L6 contract marker**: `findOnPath(input: { command: string; env: NodeJS.ProcessEnv; platform: NodeJS.Platform; fs?: PathFs }) => string | null` (新しい module `src/runtime/path-lookup.ts`) を新設し、`resolveClaudeNativeCommand` / `resolveCodexNativeCommand` の PATH 解決 (`firstOnPath`) をそれへ置き換える。`isProviderCommandSpawnable` は、解決できなかった provider を起動せず `false` を返し、`buildProviderInvocation` は、解決できなかった provider について素の名前を返さず例外 (`provider_command_unresolved`) を投げる。unit-test-granularity contract で、DbC は §6、oracle は `docs/test-design/harness/L7-provider-command-resolution-test-design.md` の `CANDIDATE-U-PCMDRES-001`〜`014` が受け持つ。

> **契約状態**: 本書は pair-freeze のための契約案で、非著者の closing review 前である。§5 の D1 (走査の共有) と D2 (解決できないときの扱い) は、control が 2026-11-16 に #1708 で決定した (§5)。source 実装・実行証跡を示さない。

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
- **probe を通らない起動経路がある** (r1 FLAG 1 で確かめた事実)。`src/cli.ts:2979` は `const mode = opts.mode ?? detectMode().mode` で、`team run --mode hybrid --execute` は `detectMode` (= `isProviderCommandSpawnable` の probe) を呼ばずに mode を決める。`buildTeamRunPlan` はその mode から `available=true` の plan を作るので、provider が実在しなくても起動の段 (`cli.ts:3050` の `buildProviderInvocation`、`:3054` の `spawn`) に進める。`src/runtime/adapter.ts:274-281` の `resolveProviderCommand` は、解決できなければ `plannedCommand` (素の名前) を返すので、その値が spawn へ渡る。
- 解決は probe の時と起動の時で 2 回行われ、plan は解決した path を保持しない (`plan.command` は素の名前のまま。`adapter.ts:422`)。probe が `true` でも、起動までの間に候補が消えれば、起動の側の解決は null になり、同じ素の名前の fallback に届く。

## 2. 解決の方式

PATH の解決は、外部 command (`where.exe` / `which`) に任せず、`findOnPath` が PATH を自分で走査して絶対 path を決める。走査の規則 (空・相対の要素を飛ばす、Windows の `PATHEXT` の順と拡張子の限定、POSIX の実行権限、最初の候補だけを使う) は `claude-version-probe.md` §3 の「解決」の 1〜4 を正本とし、本書は写さない。`findOnPath` は §3 の解決だけを行い、実行はしない (実行の規則は §3 の「実行」で、probe 側に残る)。

| 項目 | 契約 |
|---|---|
| 入力 | 入力は 1 つのオブジェクト `{ command, env, platform, fs? }` で受ける (位置引数にしない。決定 D3)。`command` は素の名前 (`"claude"` / `"codex"`)。PATH は `env.PATH ?? env.Path`。`process.cwd()` と `process.env` は読まない (引数の `env` だけ) |
| 出力 | 最初の候補の絶対 path、候補が無ければ `null`。例外を投げない |
| 外部 process | 起動しない。`where.exe` / `which` を使わない |
| 注入口 | `PathFs = { isFile(path): boolean; canExecute(path): boolean }`。既定は `node:fs` の `statSync` / `accessSync(X_OK)`。`ProviderCommandResolutionOptions` に `pathFs?: PathFs` を足し、`runPathLookup` は廃止する (同名で意味の変わる注入口を残さない) |
| 共有 | `claude-version-probe.md` の `probePathClaude` も、PATH の解決は `findOnPath({ command: "claude", env, platform })` を呼ぶ。module は `src/runtime/path-lookup.ts` に置く (`src/doctor` から `src/runtime` を呼ぶ向きにし、逆向きの依存を作らない) |

解決の全体の順序は変えない: 明示の環境変数 → Windows の native の置き場 → `findOnPath`。変わるのは最後の段だけである。

## 3. 解決できないときの扱い

素の名前を spawn しない保証は、probe の結果 (`plan.available`) に頼らず、**起動の直前に必ず通る `buildProviderInvocation` で行う**。起動経路は mode override と候補の消失 (§1) で probe を通らないことがあり、すべての経路が `buildProviderInvocation` を通る (`delegation.ts:206`、`cli.ts:3050`) からである。

1. `buildProviderInvocation` は、`resolveClaudeNativeCommand` / `resolveCodexNativeCommand` が `null` を返したとき、素の名前を command にした invocation を返さず、`Error("provider_command_unresolved")` を投げる (invocation を作らず、spawn へ進ませない)。解決できたときは、その絶対 path を使って従来どおり組み立てる。解決は起動の都度、その場で行い、probe の結果や過去の解決を保持・再利用しない。
2. `resolveProviderCommand` は署名と戻り値 (`解決結果 ?? plannedCommand`) を変えない。`plannedCommand` への fallback は dry-run の plan の `command` の表示のためだけに残り、`buildProviderInvocation` はこの fallback 値を起動に使わない (`resolveProviderCommand` ではなく provider の解決関数を直接呼ぶ)。
3. `isProviderCommandSpawnable` も、解決結果が `null` なら `runProbe` を呼ばずに `false` を返す (probe の段の fail-close。起動の段の保証は 1)。解決できたときは、その絶対 path を `buildProviderInvocation` へ渡し従来どおり `--version` を実行する。
4. 例外は起動の失敗として扱う。呼び出し側は、spawn を 1 回も行わず、非 0 の終了コードで終える (`team run` は `src/cli.ts` の外側の `try/catch` が `process.exitCode = 1` にする。`executeAdapterPlanForCli` の呼び出し側でも同じになることを、実装 PR が oracle `014` で確かめる)。
5. 例外の理由は固定の識別子 `provider_command_unresolved` とし、PATH や環境変数の値を載せない。

## 4. 呼び出し元への影響

| 呼び出し元 | 影響 |
|---|---|
| `resolveClaudeNativeCommand` / `resolveCodexNativeCommand` | 最後の段が `findOnPath` に変わる。戻り値の型は同じ。PATH の外の native の置き場の優先は変わらない |
| `resolveProviderCommand` | 変えない |
| `buildProviderInvocation` | §3。解決できないとき `provider_command_unresolved` を投げる。解決できたときの `.cmd` / `.bat` は今までどおり `cmd /d /s /c` で、解決結果が拡張子なしの file になることは無くなる (§2 の拡張子の限定) |
| `isProviderCommandSpawnable` | §3。解決できないとき `runProbe` を呼ばず `false` |
| `detectMode` (`detect.ts:59-60`) | 変えない。解決できない provider は今までより確実に「使えない」になる |
| `delegation.ts:206`、`cli.ts:3050` | 呼び出しは変えない。例外は起動の失敗になる (§3 の 4、§7) |
| 明示の環境変数 (`UT_TDD_CLAUDE_BIN` / `UT_TDD_CODEX_BIN`) | 変えない。利用者が明示した path は信頼し、相対 path の扱いは本書の範囲外 |

POSIX の `which` は、PATH の空要素や相対要素を shell によって current directory として扱うことがある。`findOnPath` はそれらを飛ばすので、PATH に相対要素を置いていた構成は provider を見つけられなくなる。この変更は意図したものである (`claude-version-probe.md` §3 と同じ)。

## 5. 方式の判断と決定

| 論点 | 採る方式 | 採らない方式と理由 |
|---|---|---|
| D1 走査を共有するか | `probePathClaude` と provider の解決で同じ `findOnPath` を使う (§2)。規則の正本は 1 か所 (`claude-version-probe.md` §3) | 別々に実装する: 実装が `src/doctor` と `src/runtime` の 2 か所に分かれ、片方だけ規則が変わる drift が起きうる (空要素の扱いが 2 通りになる)。利点は `src/doctor/claude-path-probe.ts` の実装 PR (#1693 の実装) と独立に進められること。共有は、先に入る側が `src/runtime/path-lookup.ts` を作り、後の側が import する順序の制約を持つ |
| D1' 外部 command を残す | 採らない: `where.exe` を cwd の外で動かす (spawn の `cwd` を System32 などにする) 案は、拡張子なしの file が返る問題 (§1) と PATH の相対要素の扱いが残る。結果を後から current directory で絞る案は、symlink と大小の違いで脆い | |
| D2 解決できないとき (r1 FLAG 1 で改訂) | **すべての起動経路で、解決できなければ素の名前を spawn しない**。保証は起動の直前の `buildProviderInvocation` が持ち、解決できないとき `provider_command_unresolved` を投げる。`isProviderCommandSpawnable` の `false` は probe の段の追加の防御として残す (§3) | (i) `isProviderCommandSpawnable` の `false` だけに頼る (旧 D2): `team run --mode ... --execute` は probe を省いて `available=true` を作れ (§1、`cli.ts:2979`)、判定後に候補が消えても起動の解決は素の名前へ fallback するので、保証にならない。(ii) 素の名前への fallback を残す: Windows で current directory の `claude.exe` を起動しうる (§1)。(iii) probe 時の解決結果を plan に載せて起動で使う: plan の型と `buildTeamRunPlan` の変更が増え、消えた path をそのまま spawn する別の失敗に変わる。解決は起動の都度行うほうが単純で、分岐が `buildProviderInvocation` の 1 か所で済む |
| D3 `findOnPath` の入力の形 (#1715 の CI 赤で判明) | 入力を 1 つのオブジェクト `{ command, env, platform, fs? }` で受ける | 位置引数 4 個 (`command, env, platform, fs?`、旧契約): repo の coding rule `max-source-params` (source の関数は 3 引数まで、`docs/governance/coding-rules.md`、`src/lint/coding-rules.ts`) に反し、Green の本実装が規則違反になる。stub が tuple の rest 引数で字面だけ満たす案は、規則を迂回するだけなので採らない。規則を緩めることもしない |

## 6. 不変条件

| DbC | 契約 |
|---|---|
| pre | `findOnPath` の入力オブジェクトの `env` は任意の内容 (PATH が無い・空でもよい)。`fs` を省略すると実 file system を使う |
| post | 候補があれば PATH の前から数えて最初の 1 つの絶対 path、無ければ `null`。`process.cwd()` 配下の file を、PATH に絶対 path として現れない限り返さない。`isProviderCommandSpawnable` は解決できない provider について `runProbe` を 0 回呼び `false` を返す。`buildProviderInvocation` は、その呼び出しの時点で解決できない provider について、素の名前を含む invocation を返さず `provider_command_unresolved` を投げる (probe の結果・mode override・過去の解決の有無に依らない)。解決できたときは、`runProbe` が受ける command と `buildProviderInvocation` の command (`.cmd` / `.bat` は `cmd` の引数の中) が絶対 path である |
| invariant | 解決の順序 (明示 → native → PATH)、`buildProviderInvocation` の `cmd /d /s /c` の組み立てと `%` の拒否 (解決できたときの形)、`provider_*` の診断、`shell: false` を変えない。外部 process を解決のために起動しない。production の code にテスト専用の切り替えを足さない |

## 7. 実装の範囲

実装の PR が変えるもの: 新しい `src/runtime/path-lookup.ts`、`src/runtime/adapter.ts` (`firstOnPath` の削除と `findOnPath` への置き換え、`ProviderCommandResolutionOptions` の `runPathLookup` を `pathFs` に、`isProviderCommandSpawnable` の解決できない分岐、`buildProviderInvocation` の解決できないとき例外)。#1693 の実装が先に入っていて `probePathClaude` が自前で走査しているなら、それを `findOnPath` の呼び出しに置き換える (Refactor)。

**`src/cli.ts` を変える想定は無い**。`buildProviderInvocation` の署名は同じで、起動の側 (`delegation.ts:206`、`cli.ts:3050`) の呼び出しも変えない。例外は、`team run` では `cli.ts` の外側の `try/catch` (`process.exitCode = 1`) に届く。`executeAdapterPlanForCli` の他の呼び出し元 (`cli.ts:2535` の advisor など) で例外が捕捉されず非 0 で終わらないことが実装中に分かったときは、`src/cli/delegation.ts` の側で捕捉して失敗として返す。それでも `src/cli.ts` の変更が要る場合は実装を止めて契約改訂へ戻る (Claude lane の `src/cli.ts` の変更は S7 の終了を待つため、順序は control が決める)。

変えないもの: provider の明示の環境変数と native の置き場の優先、`buildProviderInvocation` の組み立て、`detectMode` の形、版の probe の実行の規則 (`claude-version-probe.md` §3 の「実行」)。

本書の範囲外 (別の改訂で扱う): `function-spec.md:510` の `RuntimeDetection` の行は、finder (`where.exe`) を `System32` から解決する検出契約を書いている。`firstOnPath` を廃止するとこの記述が現状と合わなくなるが、共有文書なので実装 PR の後に別の PR で改訂する。同じく `L7-unit-test-design.md:935` の `U-ADAPTER-011` (`where.exe` を使う oracle) は、本書の oracle に置き換えられる。実装 PR は `tests/runtime-adapter.test.ts` の対応する test を更新する (L7 の §6)。provider の spawn の cwd (provider が repo で動く設計上 current directory のままにする) と、`.cmd` の shim の内側が素の `node` を探すときの current directory の扱いは、本書では変えない。

## 8. V-pair

対のテスト設計は `docs/test-design/harness/L7-provider-command-resolution-test-design.md` で、oracle は `CANDIDATE-U-PCMDRES-001`〜`014`、反例と oracle の対応は同書の §4 と §5 にある。

**決定 (control、2026-11-16、#1708)**

- D1 = 案 A (走査を共有する): 規則の正本を `claude-version-probe.md` §3 の 1 か所に保ち、空要素などの扱いが 2 通りになる drift を防ぐため。先に merge される実装 PR が `src/runtime/path-lookup.ts` を作り、後の PR がそれを使う (順序は control が実装の段で決める)。
- D2 = 案 A (`isProviderCommandSpawnable` が spawn せず `false`): 既存の fail-close の方針から決まり、素の名前への fallback を残さず、`src/cli.ts` を変えずに済むため。
- **D2 の改訂 (r1 FLAG 1、author 是正)**: 案 A の根拠は「`plan.available` が probe 由来なので起動時に fallback は使われない」だったが、`team run --mode` は probe を省いて `available=true` を作れ (`cli.ts:2979`)、判定後に候補が消える経路もあるため成り立たない (§1)。決定の趣旨 (素の名前への fallback を残さず fail-close、`src/cli.ts` を変えない) は保ち、保証の置き場所を起動の直前の `buildProviderInvocation` へ移す (§3、§5)。`isProviderCommandSpawnable` の `false` は残す。この改訂は L6 の範囲内で、L5 以上の契約は変えない。control の再確認は PR コメントで求める。
- **D3 (control、2026-11-17、#1715)**: `findOnPath` の入力を位置引数 4 個から 1 つのオブジェクト `{ command, env, platform, fs? }` に改める。理由: repo の coding rule `max-source-params` は source の関数の引数を 3 個までとし、旧契約の位置引数 4 個では Green の本実装が規則に反する。Red の PR (#1715) の stub を tuple の rest 引数にして規則を字面で満たす案は、規則の迂回なので採らない。この改訂は L6 の範囲内で、戻り値・走査の規則・oracle の意味と ID は変えない。
