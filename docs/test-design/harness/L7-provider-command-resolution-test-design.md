---
title: "L7 provider command resolution test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/provider-command-resolution.md
status: confirmed
updated: 2026-11-16
issue: 1694
---

# provider の実行ファイルの解決テスト設計 (issue #1694)

> **状態**: 本書は pair-freeze のための候補 test design で、非著者の closing review 前である。ID は正式 oracle ではない。上位の契約 `docs/design/harness/L6-function-design/provider-command-resolution.md` の D1 / D2 は control が決定した (同書 §5)。

## 1. 対象と上位の契約

対象は、provider (`claude` / `codex`) の実行ファイルの PATH の解決 (`findOnPath`、新しい `src/runtime/path-lookup.ts`)、それを使う `resolveClaudeNativeCommand` / `resolveCodexNativeCommand` の解決の順序、解決できない provider を起動しない `isProviderCommandSpawnable` である。上位の契約は pair の L6 `provider-command-resolution.md` で、走査の規則の正本は `docs/design/harness/L6-function-design/claude-version-probe.md` §3 である (本書の oracle は、その規則が provider の解決でも成り立つことを確かめる)。

## 2. fixture の作り方

- 001〜008、010〜012 は `PathFs` (`isFile` / `canExecute`) を注入する。fake の file の集合を持ち、`isFile` に渡された path を記録する。`platform` を引数で選ぶので、どの OS の CI でも Windows と POSIX の両方を流す。path の連結は、その `platform` の区切り (Windows は `\`、POSIX は `/`) で行う。
- 「decoy」は、`process.cwd()` の値と名前を `platform` の区切りでつないだ path (相対の要素のときは `<cwd>\rel\<名前>`) に置く fake の file である。実際には作らない。decoy が選ばれる経路を、返り値と `isFile` の記録だけで観測する。
- 009 は、`UT_TDD_CLAUDE_BIN` と Windows の native の置き場 (`APPDATA\Claude\claude-code\<版>\claude.exe`) だけを一時 dir に実際の file として作り、PATH の側は fake の `PathFs` を使う。`env.APPDATA` と `env.USERPROFILE` は一時 dir を指す (開発機の本物の claude を拾わない)。
- 011 と 012 は、`runProbe` の spy を `isProviderCommandSpawnable` の `opts` に渡す (spy は `status: 0` を返す)。`env` は `PATH` と、一時 dir を指す `APPDATA` / `USERPROFILE`、012 の `.cmd` では `ComSpec` を `C:\Windows\System32\cmd.exe` にして渡す。
- 013 だけが実 process を使う (Windows のみ、他は `it.skipIf`)。一時 dir に decoy dir と real dir を作り、それぞれの `claude.cmd` を、自分の dir に印の file を書いてから終了コード 0 で終わる内容にする。node の子 process (`cwd` は decoy dir) で `src/runtime/adapter.ts` を file URL で import し、`isProviderCommandSpawnable("claude", { env })` の結果を stdout の JSON で返させる。`env` は `PATH` が real dir と `System32`、`APPDATA` / `USERPROFILE` が空の一時 dir を指す。in-process の vitest の cwd は変えられないので子 process にする。
- 期待値の path は test に literal で書き、production の code から生成しない。

## 3. 候補の oracle

| ID | 対象 | 入力・期待・反例 |
|---|---|---|
| `CANDIDATE-U-PCMDRES-001` | PATH の空の要素 (L6 §2、#1694) | 入力: (a) Windows で PATH が `;C:\real`、(b) POSIX で `:/real`。cwd の decoy (`claude.cmd` / `claude`) と、`C:\real\claude.cmd` (`PATHEXT` は `.CMD`) / `/real/claude` (実行可) を置く。期待: 返り値が real の path で、`isFile` に decoy の path が渡されない。反例: §4 の M1。 |
| `CANDIDATE-U-PCMDRES-002` | PATH の `.` の要素 | 入力: 001 と同じ fixture で、PATH の先頭の要素を `.` にする。期待: 001 と同じ。反例: M2。 |
| `CANDIDATE-U-PCMDRES-003` | PATH の相対の要素 | 入力: 001 と同じ fixture で、PATH の先頭の要素を `rel` にし、decoy を `<cwd>\rel\claude.cmd` (POSIX は `<cwd>/rel/claude`) に置く。期待: 001 と同じ。反例: M3。 |
| `CANDIDATE-U-PCMDRES-004` | `PATHEXT` の順 (Windows) | 入力: 1 つの dir に `claude.bat` と `claude.cmd` を置く。期待: `PATHEXT` が `.COM;.EXE;.CMD;.BAT` なら `claude.cmd`、`PATHEXT` が無ければ (既定の順 `.COM;.EXE;.BAT;.CMD`) `claude.bat`。反例: M4。 |
| `CANDIDATE-U-PCMDRES-005` | 拡張子の限定 (Windows) | 入力: (a) dir に `claude.ps1` と `claude.js` だけを置き、`PATHEXT` を `.PS1;.JS;.EXE` にする。(b) dir A に拡張子の無い `claude` と `claude.ps1`、dir B に `claude.cmd` を置き、`PATHEXT` を `.PS1;.CMD` にして PATH を A、B の順にする。期待: (a) は `null`、(b) は B の `claude.cmd`。反例: M5、M6。 |
| `CANDIDATE-U-PCMDRES-006` | 実行権限 (POSIX) | 入力: (a) PATH を dir A、dir B の順にし、A の `claude` は実行権限なし、B は実行可。(b) PATH の dir に実行権限なしの `claude` だけがある。期待: (a) は B の path、(b) は `null`。反例: M7。 |
| `CANDIDATE-U-PCMDRES-007` | 最初の候補 | 入力: PATH を dir A、dir B の順にし、どちらにも有効な `claude` を置く (Windows は `claude.cmd`、POSIX は実行可の `claude`)。別の入力で候補が 1 つも無い。期待: A の path と、候補なしでは `null`。反例: M8。 |
| `CANDIDATE-U-PCMDRES-008` | PATH の変数名 (Windows) | 入力: `env` が `Path` だけを持ち (`PATH` は無い)、その dir に `claude.cmd` がある。期待: その path。反例: M9。 |
| `CANDIDATE-U-PCMDRES-009` | 解決の順序 (L6 §2) | 入力: Windows で `resolveClaudeNativeCommand` を、(a) `UT_TDD_CLAUDE_BIN` が実在 (PATH にも native にも別の claude がある)、(b) 明示なしで native の `claude.exe` が実在 (PATH にも別の claude がある)、(c) 明示も native も無く PATH にだけ `C:\real\claude.cmd` がある、の 3 通りで呼ぶ。期待: (a) は明示の path、(b) は native の path、(c) は PATH の path。反例: M10。 |
| `CANDIDATE-U-PCMDRES-010` | claude と codex の配線 | 入力: Windows で `resolveClaudeNativeCommand` と `resolveCodexNativeCommand` を、PATH が `C:\real` だけ (空の要素なし)、cwd に decoy の `claude.cmd` / `codex.cmd`、`C:\real` に `claude.cmd` / `codex.cmd` がある状態で、native と明示の環境変数は無しで呼ぶ。期待: どちらも `C:\real` の path を返し、`isFile` に decoy の path が渡されない。反例: M11、M12。 |
| `CANDIDATE-U-PCMDRES-011` | 解決できない provider の probe (L6 §3、D2) | 入力: `isProviderCommandSpawnable` を `claude` と `codex` それぞれで、PATH の解決が `null` (候補なし)、native も明示も無し、の状態で呼ぶ。期待: どちらも `false` で、`runProbe` の呼び出しが 0 回。反例: M13。 |
| `CANDIDATE-U-PCMDRES-012` | 解決した絶対 path の起動 (L6 §6) | 入力: Windows で PATH の `C:\real` に (a) `claude.exe` だけ、(b) `claude.cmd` だけ (`PATHEXT` は `.CMD`) を置き、それぞれ `isProviderCommandSpawnable("claude", ...)` を呼ぶ。期待: (a) は `runProbe` が 1 回で、`command` が `C:\real\claude.exe`、`args` が `["--version"]`。(b) は 1 回で、`command` が `C:\Windows\System32\cmd.exe`、`args[3]` が `"C:\real\claude.cmd"` (引用符つきの絶対 path) を含む。反例: M14。 |
| `CANDIDATE-U-PCMDRES-013` | current directory の decoy を起動しない (実 process、Windows のみ、#1694 のゴール) | 入力: §2 の実 process の fixture。期待: 子 process の結果が `true`、real dir の印の file がある、decoy dir の印の file が無い。反例: M15。テストレベル: unit (実 process 1 本)。 |

## 4. 反例 (変異) の一覧

L6 の正しい実装に、次の変異を 1 つだけ加えたものを反例とする。どれも具体的な 1 か所の変更である。現行の実装 (`where.exe` / `which` の `firstOnPath`) は、この表の反例ではなく Red の状態であり、§5 の段の扱いで扱う。

| ID | 変異 (正しい実装からの 1 か所の変更) | platform |
|---|---|---|
| M1 | PATH の空の要素を current directory として候補を探す | 両方 |
| M2 | PATH の `.` を current directory として候補を探す | 両方 |
| M3 | PATH の相対の要素を current directory からの相対として候補を探す | 両方 |
| M4 | `PATHEXT` を見ず、既定の順 (`.COM;.EXE;.BAT;.CMD`) に固定する | Windows |
| M5 | 拡張子の無い名前 (`claude`) も候補にする | Windows |
| M6 | 拡張子の限定をやめ、`PATHEXT` のすべてを候補にする | Windows |
| M7 | POSIX で実行権限を見ない | POSIX |
| M8 | PATH を後ろの dir から走査する | 両方 |
| M9 | `PATH` だけを読み、`Path` を読まない | Windows |
| M10 | 解決の順序で、PATH の走査を明示の環境変数と native より先にする | Windows |
| M11 | `resolveClaudeNativeCommand` だけ、current directory を先頭の dir に足す | Windows |
| M12 | `resolveCodexNativeCommand` だけ、current directory を先頭の dir に足す | Windows |
| M13 | `isProviderCommandSpawnable` が、解決できないとき素の名前で probe を実行する | 両方 |
| M14 | 解決できても、probe に絶対 path でなく素の名前を渡す | Windows |
| M15 | PATH の走査の前に `where.exe` へ問い合わせ、結果が返ればそれを使う | Windows |

## 5. 反例と oracle の対応表、段の扱い、検証

行は反例、列は oracle の番号 (`CANDIDATE-U-PCMDRES-` を省いた数字)。`●` はその oracle の assertion が赤になることを示す。空欄は緑 (その platform で流れない oracle を含む) である。各行の `●` は 1 つ、各列の `●` は 1 つ以上である。

| 反例 | 001 | 002 | 003 | 004 | 005 | 006 | 007 | 008 | 009 | 010 | 011 | 012 | 013 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| M1 空の要素 | ● | | | | | | | | | | | | |
| M2 `.` の要素 | | ● | | | | | | | | | | | |
| M3 相対の要素 | | | ● | | | | | | | | | | |
| M4 `PATHEXT` を見ない | | | | ● | | | | | | | | | |
| M5 拡張子なし | | | | | ● | | | | | | | | |
| M6 拡張子の限定なし | | | | | ● | | | | | | | | |
| M7 実行権限を見ない | | | | | | ● | | | | | | | |
| M8 後ろから走査 | | | | | | | ● | | | | | | |
| M9 `Path` を読まない | | | | | | | | ● | | | | | |
| M10 PATH を先にする | | | | | | | | | ● | | | | |
| M11 claude だけ cwd | | | | | | | | | | ● | | | |
| M12 codex だけ cwd | | | | | | | | | | ● | | | |
| M13 素の名前で probe | | | | | | | | | | | ● | | |
| M14 素の名前を渡す | | | | | | | | | | | | ● | |
| M15 `where.exe` を先に | | | | | | | | | | | | | ● |

- 001〜008 と 010〜012 は `platform` を引数で選ぶので、どの OS でも流れる。013 は Windows だけで流れ、他の OS では `it.skipIf` で skip する (M15 は Windows の変異なので、他の OS の検出に数えない)。
- 登録と Red の PR は、`design-protection-diff-gate.md` §10.3 の手順 1' に従い、新しい module `src/runtime/path-lookup.ts` の stub (`findOnPath` が常に `null` を返す) だけを入れる (既存の src は変えない)。001〜012 は、stub または現行の `firstOnPath` (`pathFs` を読まない) では期待を満たせないので `it.fails`、013 は現行の `where.exe` が decoy を返すので Windows で `it.fails` とする。009 は (a) (b) が現行でも通るが、(c) が `pathFs` を無視して落ちるので全体を `it.fails` にする。昇格 (`src` を含まない PR) と Green (`it` に戻す) は 001〜005 の三段階と同じ。
- **モデルでの検証**。L6 §2〜§3 の規則を、使い捨てのモデル (repo には入れない) に写し、正しい実装と §4 の 15 の変異 (それぞれ 1 か所の変更) に、§3 に書いた観測だけを評価させた。正しい実装で 13 件すべてが緑、各変異を赤にする oracle がちょうど 1 つで、§5 の表の `●` と一致し、各 oracle が少なくとも 1 つの変異を赤にすることを確かめた (出力は `MATRIX OK`)。モデルは 013 の実 process を、「`where.exe` が実 cwd の decoy を先に返す」変異 (M15) だけが赤にする、と置いている。この置き方は、`where.exe` が fake の `PathFs` の fixture では何も返さない (decoy が実 file として存在しない) ことに依る。`where.exe` の実際の挙動は、実装の PR の変異の確認 (Red の PR の head から切った使い捨ての branch で変異ごとに commit する) で確かめる。

## 6. 既存 test の更新 (oracle ではない)

- `tests/runtime-adapter.test.ts:351-374` の `U-ADAPTER-011` は `runPathLookup` で `where.exe` の呼び出しを検査している。`firstOnPath` の廃止で意味を失うので、実装 PR は本書の 004・007・008・009 に相当する検査へ置き換える (同じ test ID を残さない)。`docs/test-design/harness/L7-unit-test-design.md:935` の `U-ADAPTER-011` の行は共有文書なので、本書の契約 PR では触れず、実装の後の別の PR で改訂する。
- `U-ADAPTER-004` (`isProviderCommandSpawnable` / `detectMode`) は、解決できない provider の扱いを足す 011 と矛盾しないことを実装 PR が確かめる。矛盾したら契約改訂へ戻る。

## 7. 非目標

- 実際の `where.exe` / `which` の挙動の検査 (本書は外部 command を使わない方式の oracle で、旧方式の挙動は M15 の実 process だけで確かめる)。
- 明示の環境変数 (`UT_TDD_CLAUDE_BIN` / `UT_TDD_CODEX_BIN`) の相対 path の扱い、provider の spawn の cwd、`.cmd` の shim の内側が素の `node` を探すときの current directory (L6 §7 の範囲外)。
- `function-spec.md` と `L7-unit-test-design.md` の改訂 (共有文書の直列化、L6 §7)。
