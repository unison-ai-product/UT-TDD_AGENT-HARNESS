---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_claude_version_probe
pair_artifact: docs/test-design/harness/L7-claude-version-floor-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1561
---

> **L6 contract marker**: `probePathClaude(env?: NodeJS.ProcessEnv, platform?: NodeJS.Platform) => PathClaudeProbe`、`checkClaudeVersionFloor(deps?: ClaudeVersionFloorCheckDeps) => LintResult`、`readTranscriptClaudeVersion(transcriptPath: string | undefined) => string | null` の unit-test-granularity contract である。DbC の pre / post / invariant は §2 の表に置き、oracle は `docs/test-design/harness/L7-claude-version-floor-test-design.md` の `CANDIDATE-U-CCVER-009`〜`021` が受け持つ。

# Claude Code の版の取得 (PATH の claude の probe と transcript の末尾読み、Issue #1561)

## 1. 位置付け

上位の契約は `session-log.md` の「2026-11-05 Claude Code の版が下限未満のときの警告 (Issue #1561)」節である。そこが定める警告・下限・doctor の方式 4 は変えない。本書は、そこで使う版の取得の方法 (PATH の `claude --version` と transcript の読み方) と、doctor の表示の状態を定める。

対象は #1561 の sub-issue の 4 件で、どれも PR #1662 の closing review (Opus r2) の non-blocking observation である。

| Issue | 観測 | 本書の節 |
|---|---|---|
| #1674 | Windows の probe が `cmd /c` 経由で current directory の `claude.cmd` を起動しうる | §3 |
| #1675 | PATH に claude が無いとき、doctor の check が「OK」と表示する | §4 |
| #1676 | 警告が transcript を全部読んでから版を探すので、大きい transcript で重い | §5 |
| #1677 | テストが本物の `claude --version` を起動する (consumer-toolchain の test と実 doctor) | §6 |

現状 (origin/main `64566f25b`)。

- `src/doctor/claude-version-floor-check.ts:10-23` の既定の `readPathClaudeVersion` は、Windows では `ComSpec` (無ければ素の `cmd.exe`) に `/d /s /c "claude --version"` を渡し、POSIX では素の名前 `claude` を spawn する。`cmd` は名前を current directory から先に探す。libuv も素の名前を spawn の cwd から先に探す。
- 同じ file の `:25-41` は、版が下限未満のときだけ WARN を出し、それ以外 (読めない・見つからない) はすべて `doctor: claude-version-floor - OK` を出す。`readPathClaudeVersion` が `null` を返す理由 (見つからない・実行に失敗した) を区別できない。
- `src/runtime/claude-version-check.ts:23-38` の `readTranscriptClaudeVersion` は `readFileSync` で file 全体を読んでから行に分ける。
- `src/doctor/check-definition-groups.ts:241-242` は doctor の deps の `readPathClaudeVersion` を check に渡す。in-process の doctor の test は `readPathClaudeVersion: () => null` を渡すが (`tests/doctor.test.ts:1099`)、CLI の子 process で doctor を流す test (`tests/cli-surface.test.ts:314-324` の `consumer-toolchain`、`tests/bun-permanent-ban.test.ts:72`、`tests/release-consumer-gates.test.ts:1259`) は関数を差し込めず、既定の probe が本物の claude を起動する。

## 2. 型と注入口

| 役割 | module と export | 形 |
|---|---|---|
| PATH の claude の probe | 新しい module `src/doctor/claude-path-probe.ts` の `PathClaudeProbe` と `probePathClaude(env = process.env, platform = process.platform)` | `type PathClaudeProbe = { kind: "not_found" } \| { kind: "found"; version: string \| null }`。`not_found` は PATH に候補が無く、何も実行していないこと。`found` は候補を 1 つ実行したことで、`version` はその出力から読めた `x.y.z`、読めなければ `null`。 |
| doctor の check | `src/doctor/claude-version-floor-check.ts` の `checkClaudeVersionFloor(deps?: { probePathClaude?: () => PathClaudeProbe })` | 既定は `probePathClaude()`。`readPathClaudeVersion` は廃止し、同じ名前を残さない (意味の変わった注入口が型検査を通り抜けないようにするため)。doctor の deps (`src/doctor/runtime-state.ts:32`) の field も `probePathClaude` に改め、`check-definition-groups.ts` はそれを渡す。 |
| transcript から版を読む | `src/runtime/claude-version-check.ts` の `readTranscriptClaudeVersion(transcriptPath)` (名前と形は変えない) | 読み方だけを §5 に改める。 |

`probePathClaude` を新しい module に置くのは、登録と Red の PR が既存の src を変えずに stub を置けるようにするためである (`design-protection-diff-gate.md` §10.3 の手順 1'。`session-log.md` の「注入口と module」と同じ理由)。

| 関数 | pre | post | invariant |
|---|---|---|---|
| `probePathClaude` | `env` の PATH (`env.PATH ?? env.Path`) を読む。cwd は読まない | 候補が無ければ `{ kind: "not_found" }`。あれば最初の候補だけを実行し、`{ kind: "found", version }` | current directory・相対の PATH 要素・素の名前を実行しない。実行するのは 1 回だけ。例外を投げない (内部の失敗は `found` の `null`) |
| `checkClaudeVersionFloor` | 注入された probe が例外を投げてもよい | `ok: true`、message は 1 行で §4 の 4 状態のどれか | probe の結果を doctor の終了コードに反映しない (助言) |
| `readTranscriptClaudeVersion` | path は任意 (無い・読めないを含む) | 末尾 4 MiB の中の最後の message 行の版、無ければ `null` | file の大きさにかかわらず読む量は 4 MiB 以下 |

## 3. PATH の claude の解決と実行 (#1674)

**解決**。`probePathClaude` は PATH を自分で走査し、実行する file の絶対 path を決める。素の名前を `cmd`・libuv・`where.exe`・`which` に解決させない。

1. PATH を区切り (Windows は `;`、POSIX は `:`) で分け、前から順に見る。空の要素と、絶対 path でない要素 (`.`、`bin` など) は飛ばす。Windows の絶対 path はドライブ文字付き (`C:\...`) か UNC (`\\server\share\...`) に限る。
2. Windows: 各 dir で、`claude` に `PATHEXT` (無ければ `.COM;.EXE;.BAT;.CMD`) の拡張子を `PATHEXT` の順に付けた名前を探す。拡張子は `.exe`・`.com`・`.cmd`・`.bat` (大小無視) だけを使い、他 (`.ps1`、`.js` など) は飛ばす。拡張子の無い `claude` (npm が置く sh の shim) は候補にしない。存在して通常の file であるものが候補である。
3. POSIX: 各 dir の `claude` が通常の file で実行権限がある (`X_OK`) ときだけ候補にする。
4. 最初に見つかった候補 1 つだけを使う。候補が無ければ `{ kind: "not_found" }` を返し、何も実行しない。

**実行**。spawn は `shell: false`、`cwd` は候補の dir、`env` は引数の `env`、`timeout: 5_000`、`windowsHide: true`、`encoding: "utf8"` とする。版は今と同じく stdout と stderr をつないだ文字列の最初の `\d+\.\d+\.\d+` で、終了コードが 0 でなければ `null` とする。

- `.exe` / `.com` と POSIX の file は、絶対 path を直接 spawn し、引数は `["--version"]`。
- `.cmd` / `.bat` は `cmd` を通す。`cmd` は `env.ComSpec` が絶対 path ならそれ、そうでなければ `env.SystemRoot` が絶対 path のとき `<SystemRoot>\System32\cmd.exe` を使う。どちらも無ければ実行せず `{ kind: "found", version: null }` とする (素の `cmd.exe` に戻さない)。引数は `["/d", "/v:off", "/s", "/c", "\"\"<絶対 path>\" --version\""]` で、`windowsVerbatimArguments: true` とする。`/d` は AutoRun を止め、`/v:off` は `!` の遅延展開を止める。引用符の内側では空白・`&`・`(`・`)`・`^`・`!` は文字のまま渡る。
- 絶対 path が `%` を含むときは実行せず `{ kind: "found", version: null }` とする。`cmd` は引用符の内側でも `%VAR%` を展開するからである (`src/runtime/adapter.ts` の `buildProviderInvocation` と同じ判断)。
- 最初の候補の実行が失敗しても (起動の失敗・timeout・終了コードが 0 以外・版が読めない)、後ろの候補を試さない。結果は `{ kind: "found", version: null }` である。後ろへ進むと、PATH の先頭に置いた差し替え (§6) を越えて別の claude を起動しうるからである。

`cwd` を候補の dir にするのは、`.cmd` の shim の中で素の名前 (npm の shim の `node` など) を探すときにも、呼び出した側の current directory を見せないためである。

## 4. doctor の表示 (#1675)

`checkClaudeVersionFloor` は、probe の結果を次の 4 状態のどれか 1 行で表示する。どれも `ok: true` で、doctor の終了コードを変えない (session-log の方式 4 の「fail にはしない」を保つ)。

| 状態 | 条件 | message |
|---|---|---|
| OK | `found` で `evaluateClaudeVersion(version) === "ok"` | `doctor: claude-version-floor - OK: PATH の claude の版 (<version>)` |
| 下限未満 | `found` で `"below"` | 今の文言のまま (`doctor: claude-version-floor - WARN: PATH の claude の版 (<version>) is below <floor>; update Claude Code.`) |
| 読めない | `found` で `"unknown"` (`version` が `null` を含む)、または注入された probe が例外を投げた | `doctor: claude-version-floor - WARN: PATH の claude の版を読めない (版を確かめられない)` |
| 見つからない | `not_found` | `doctor: claude-version-floor - SKIP: PATH に claude が見つからない (版を確かめられない)` |

- 「OK」を出すのは、版を読めて下限以上のときだけである。確かめていない状態を OK と表示しない。
- 見つからないときは WARN ではなく SKIP とする。Codex だけで使う consumer では PATH に claude が無いのが正常で、doctor のたびに WARN を出すと警告が読まれなくなる。SKIP は「確かめていない」ことを示し、OK とは区別できる。claude があるのに版を読めないときは、壊れた・古い claude の可能性があるので WARN とする。
- OK の行に版を書くのは、どの claude を確かめたかを利用者が見られるようにするためである (§6 の差し替えが効いているかもこの行で見える)。

## 5. transcript の末尾読み (#1676)

`readTranscriptClaudeVersion` は file 全体を読まず、末尾の 4 MiB (4,194,304 bytes) だけを読む。

1. file を開いて大きさを得る。読み始めの位置は `max(0, 大きさ − 4 MiB)` とし、そこから末尾までを 1 回の確保で読む (`openSync` / `fstatSync` / `readSync`、`closeSync` は `finally`)。上限の定数は module の中だけに置き、export しない (test は値を literal で持つ)。
2. 読み始めが 0 より後なら、読み始めから最初の `\n` までを捨てる (途中から始まる行を JSON として読まない)。読み始めがちょうど行の先頭に当たったときも、その行を捨てる (読み始めの直前の byte が改行かどうかを見ない)。したがって、ある行が読まれるのは、その行の先頭から file の末尾までが 4 MiB − 1 bytes 以下のときだけである。`\n` が無ければ `null` を返す。
3. 残りを今と同じ規則で読む。行に分けて末尾から見て、空行を飛ばし、`type` が `user` / `assistant` でない行を飛ばし、最初の message 行の `version` が `x.y.z` ならそれを、そうでなければ `null` を返す。JSON として読めない行に当たったら `null` を返す (今と同じ)。
4. 4 MiB の中に message 行が無ければ `null` を返す。警告の側は今と同じく「Claude Code の版を確かめられない」を出す (`U-CCVER-002` の経路)。file が無い・読めないときも `null` である。

4 MiB にするのは、末尾の message 行そのものが大きいことがあるためである。PostToolUse の時点の末尾は tool の呼び出しの行か tool の結果の行で、画像を読んだ結果の行は数 MB になりうる。その行が窓より大きいと版を読めず、その session の警告は「確かめられない」になる (警告済みの印は版を読む前に作るので、同じ session では読み直さない)。これは助言の見逃しであり、guard の判定は変わらないので受け入れる。読む量の上限は大きさに依らず 4 MiB で、hook の時間の予算 (`hook-timeout-budget.md`) に対して無視できる。

## 6. テストで本物の claude を起動しない (#1677)

- check の unit test は `checkClaudeVersionFloor({ probePathClaude })` で probe を差し替える。in-process の doctor の test は doctor の deps の `probePathClaude` で差し替える。
- それ以外の経路 (注入しない in-process の呼び出しと、CLI の子 process の doctor) は、テスト側で PATH の先頭に偽の claude を置いて受け止める。vitest の setupFiles に登録した setup が、worker ごとに一時 dir へ偽の claude を作り、`process.env.PATH` の先頭に足す。§3 の解決は PATH の先頭から探して current directory を見ないので、偽の claude が必ず先に見つかる。子 process は env を継承するので同じ偽物を使う。偽物の形と置き場所は L7 の §2 が定める。
- production の code にはテスト専用の切り替え (環境変数で probe を止めるなど) を足さない。足すと既定の probe の経路を test で通せなくなるからである。
- 偽物の版は下限以上 (`9999.0.0`) にする。全件の doctor を流す test が WARN を見ないようにするためである。

## 7. 方式の判断

| 論点 | 採る方式 | 採らない方式と理由 |
|---|---|---|
| #1674 の解決 | PATH を自分で走査して絶対 path を実行する (§3) | `cmd` に `NoDefaultCurrentDirectoryInExePath=1` を渡して素の名前のまま探させる方式: `cmd` の探索だけを止め、PATH の `.` の要素や POSIX の空の要素 (current directory) は残る。`src/runtime/adapter.ts:192-210` の `firstOnPath` (`where.exe` / `which`) を使う方式: `where.exe` は current directory から先に探す。`resolveClaudeNativeCommand` (`adapter.ts:212-249`) を使う方式: PATH の外の native の claude を優先するので、方式 4 の「PATH の claude の版」と食い違う。 |
| #1675 の見つからない状態 | SKIP、`ok: true` (§4) | WARN: Codex だけの consumer で毎回出る。`ok: false`: 方式 4 の「fail にしない」に反する。 |
| #1676 の読み方 | 末尾 4 MiB を 1 回で読む (§5) | 末尾から小さい塊で後ろ向きに読み、上限まで広げる方式: 普段の読む量は減るが、塊の境界をまたぐ行の扱いが増える。上限は同じなので最悪の時間は変わらない。 |
| #1677 の差し替え | test 側の setupFiles で PATH の先頭に偽物を置く (§6) | production に環境変数の切り替えを足す方式: 本番に迂回の条件が増え、既定の probe を test で通せない。CLI を起動する test ごとに偽物の PATH を組む方式: 漏れを機械で防げず、新しい test が足されるたびに同じ漏れが起きうる。 |

**advisor への相談 (2026-11-16)**。`node src/cli.ts advisor --decision implementation --current-model claude-opus-5-5 --execute` で `gpt-6.1-sol` に、#1677 の 3 方式と #1674 の解決の案を聞いた。回答は「#1677 は setupFiles の方式を推奨。ただし次を閉じること」で、次の指摘があった。それぞれを実測で確かめ、本書に入れた。

- 今の Windows の実装では、current directory の `claude.cmd` が PATH の先頭の偽物より先に実行されうる: 事実である (`claude-version-floor-check.ts:12-14` は素の名前を `cmd` に渡す)。#1674 の解決 (§3) を入れれば current directory を見ない。setup だけを先に入れる段 (Red の PR) でも、vitest の cwd (HEAD の snapshot の root) に `claude.*` は無いので、偽物が先に見つかる。
- test が PATH を丸ごと置き換えると差し替えが外れる: 事実である。`tests/` の中で子 process の PATH を組む箇所は 26 件あり (`PATH:` / `Path:` / `process.env.PATH =` の grep、origin/main `64566f25b`)、多くは `process.env.PATH` の前に dir を足す形である。置き換える箇所の扱いは L7 の review の基準に置く。
- doctor の成功は差し替えの証拠にならない (今の check は取得に失敗しても OK を返す): 事実である (`claude-version-floor-check.ts:36-40`)。L7 の oracle は偽物が書く呼び出しの記録で確かめる。
- `ComSpec` が絶対 path とは限らない・`%` を拒むだけでは引用の安全を言えない・失敗した候補から後ろへ進むと差し替えを越える: §3 に `ComSpec` の条件、`/v:off`、記号を含む path の oracle、後ろへ進まない規則として入れた。

## 8. 不変条件

- I1: 版の probe は current directory、相対の PATH 要素、素の名前を実行しない。実行するのは §3 で決めた絶対 path 1 つだけで、1 回の check で 1 回だけである。
- I2: doctor の `claude-version-floor` は、版を読めて下限以上のときだけ OK と表示する。どの状態でも `ok: true` である。
- I3: transcript から版を読むとき、file の大きさにかかわらず読む量は 4 MiB 以下であり、file 全体を読む API (`readFileSync`、`readFile`、`createReadStream`) を使わない。L7 の `CANDIDATE-U-CCVER-021` が読んだ bytes を数えて確かめる。
- I4: test の実行で本物の claude は起動しない。production の code にテスト専用の切り替えは無い。

## 9. 実装の範囲

実装の PR が変えるもの: 新しい `src/doctor/claude-path-probe.ts`、`src/doctor/claude-version-floor-check.ts` (deps と表示)、`src/doctor/runtime-state.ts` と `src/doctor/check-definition-groups.ts` (deps の field の名前)、`src/runtime/claude-version-check.ts` (`readTranscriptClaudeVersion` の読み方)、テスト側の setup と `vitest.config.ts` の setupFiles。段の順序と既存の test の更新は L7 の §4 と §7 に従う。

変えないもの: 下限の値と置き場所、`evaluateClaudeVersion`、PostToolUse の警告の出し方・対象の runtime・marker (`session-log.md` の #1561 節)、`src/runtime/adapter.ts` の provider の解決。`adapter.ts` の `firstOnPath` が `where.exe` を使い current directory から探す点は本書の範囲外で、#1694 の契約 `provider-command-resolution.md` が扱う。そこでは provider の PATH の解決を、本書 §3 の「解決」の規則を正本として共有する関数 (`findOnPath`) に置き換え、`probePathClaude` も同じ関数を呼ぶ案を推奨としている (control の判断前)。本書の §3 の規則と oracle は変えない。

## 10. V-pair

対のテスト設計は `docs/test-design/harness/L7-claude-version-floor-test-design.md` で、本書の oracle は `CANDIDATE-U-CCVER-009`〜`021`、反例と oracle の対応はその §5 と §6 にある。
