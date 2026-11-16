---
title: "L7 Claude Code version floor test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/
parent_doc: docs/design/harness/L6-function-design/session-log.md
status: confirmed
updated: 2026-11-16
issue: 1561
---

# Claude Code の版が下限未満のときの警告テスト設計 (issue #1561)

## 1. 対象と上位の契約

対象は、Claude Code の版が下限 (2.1.295) 未満のときに利用者へ知らせる経路である。上位の契約は
`docs/design/harness/L6-function-design/session-log.md` の「2026-11-05 Claude Code の版が下限未満のときの警告 (Issue #1561)」節。
版の取得の方法 (PATH の claude の解決と実行、transcript の末尾読み) と doctor の表示の 4 状態、テストで本物の claude を起動しないことは、`docs/design/harness/L6-function-design/claude-version-probe.md` (2026-11-16、Issue #1674〜#1677) が上位の契約であり、`CANDIDATE-U-CCVER-009`〜`019` が受け持つ。
guard の `onFailure` そのものは `docs/test-design/harness/L7-claude-hook-onfailure-test-design.md` が持ち、本書では再定義しない。

## 2. fixture の作り方

- 一時ディレクトリに transcript の JSONL と session の state を作り、PostToolUse の hook 入力の `transcript_path` にその path を渡す。開発 repository の `.ut-tdd/`・`harness.db`・OneDrive を操作しない。
- doctor の行は、`checkClaudeVersionFloor` の `probePathClaude` 引数で probe を差し替える (2026-11-16 改訂。それ以前の注入口は `readPathClaudeVersion`)。実際の Claude Code を起動しない。
- 005 の下限の差し替えは、`vi.mock("../src/runtime/claude-version-floor.ts", () => ({ CLAUDE_CODE_VERSION_FLOOR: "9.9.9" }))` で行う。注入口と module の名前は、L6 の「注入口と module」の表に従う。
- Red の段では、新しい module と export はまだ無い。import が解決できないと、ファイル全体が collection で落ちるか、例外を `it.fails` が吸収して偽の Red になる。そこで登録と Red の PR は、`design-protection-diff-gate.md` §10.3 の手順 1' (契約形 stub) に従い、L6 の「注入口と module」の表の形だけを持つ stub を同じ PR に入れる。stub が返す値は、oracle の期待を満たし得ない fail-close の値に限る。
  - `src/runtime/claude-version-floor.ts`：`CLAUDE_CODE_VERSION_FLOOR = "2.1.295"` (契約の値そのもの。定数だけの module なので判定を持たない)。
  - `src/runtime/claude-version-check.ts`：`evaluateClaudeVersion` は常に `"unknown"` を返し、`readTranscriptClaudeVersion` は常に `null` を返す。
  - `src/doctor/claude-version-floor-check.ts` (新しい module)：`checkClaudeVersionFloor` は、版に関係なく warn でも ok でもない固定の結果 (例：`status: "fail"`、detail に `stub`) を返し、`readPathClaudeVersion` を呼ばない。doctor の check の一覧への登録は、Red の段では行わない (実装 PR で行う)。
  - 3 つとも新しい module なので、§10.3 の手順 1' の範囲 (新しい module の stub だけ。既存の src は変えない) に収まる。
  - adapter の生成 (`src/setup/templates.ts`) と PostToolUse の hook (`src/cli.ts`) は、Red の段では変えない。
  これで、どの `it.fails` も import は成功し、assertion の不一致だけで落ちる。stub は実装 PR (Green) で実装に置き換える。前提を確かめるテストは、失敗を吸収する `it.fails` にはしない。

- **hook を起動する環境 (2026-11-10 追記、#1561)**。001〜003 と 007 で `hook post-tool-use` を CLI の子 process として起動するときは、環境変数を明示して組む。001〜003 と 007 の (a) は Claude の環境とし、`CLAUDECODE=1` を設定し、`CODEX_SANDBOX` と `CODEX_HOME` を親の環境から引き継がない (削除する)。007 の (b)〜(d) は、その組の値だけを設定する。親の環境 (CI や Codex の shell) の値に結果が左右されないようにするためである。`invokePostToolUse` は親環境から始めるが、`CLAUDECODE`、`CODEX_SANDBOX`、`CODEX_HOME` を削除してから `CLAUDE_PROJECT_DIR` と各ケースの signal を設定する。001〜003 は既定の Claude signal を使い、007 は4組を明示する。4組の起動成功と exit 0 は通常の prerequisite test で確かめ、`it.fails` では stdout の期待だけを判定する。

- **版の取得の fixture (2026-11-16 追記、#1674〜#1677)**。009〜019 の fixture は次のとおり。どれも一時 dir の中に作り、開発 repository と利用者の PATH の claude を使わない。
  - 偽の claude: Windows は `claude.cmd` (012 は `claude.bat` も)、POSIX は mode 0755 の `claude` (`#!/bin/sh`)。どれも自分の dir の記録 file に 1 行を追記してから、決めた版を 1 行出して終了コード 0 で終わる (011 の失敗する偽物だけは、記録してから終了コード 1 で終わる)。「実行された」ことは、終了コードや doctor の表示ではなく、この記録で確かめる。
  - 009 の (a) は、node の子 process (`node --input-type=module -e`、`cwd` は decoy の dir) で `src/doctor/claude-path-probe.ts` を file URL で import し、`probePathClaude()` の結果を JSON で stdout に出させる。in-process の vitest の cwd は HEAD の snapshot の root で、変えられないためである。decoy の dir には、実行されたら印を書く `claude` (Windows は `claude.cmd` と `claude-helper.cmd`) と、その下の `rel` dir の `claude` を置く。PATH は「空の要素、`.`、`rel`、偽物の dir」の順にする。Windows の偽物は、版を出す前に `call claude-helper.cmd` を素の名前で呼ぶ (npm の shim が `node` を素の名前で呼ぶのと同じ形)。偽物の dir の `claude-helper.cmd` は印を書かず、decoy の dir の `claude-helper.cmd` は印を書く。
  - 009 の (b) と 010〜013、015 は in-process で `probePathClaude(env, process.platform)` を呼ぶ。`env` は `process.env` を写し、PATH (Windows は `PATH` と `Path` の両方) と各ケースの値だけを差し替える。
  - 016 と 017 は一時 dir に transcript を書き、`readTranscriptClaudeVersion(path)` を直接呼ぶ。非 message 行は `{"type":"progress","pad":"x…x"}` の形で、`pad` の長さで 1 行の bytes (改行を含む) をちょうどにそろえる。message 行は `{"type":"user","version":"2.1.293",...}` の形で 1,000 bytes 未満とする。
  - **PATH の差し替え (fence)**。`tests/claude-probe-fence-setup.ts` を `vitest.config.ts` の setupFiles に足す。setup は、`process.env.UT_TDD_CLAUDE_FENCE_DIR` が既に有り、その dir が存在し、PATH の先頭の要素と等しければ何もしない (同じ worker で file ごとに走っても PATH に重ねない)。そうでなければ `mkdtemp(join(tmpdir(), "ut-tdd-claude-fence-"))` で dir を作り、偽の claude (版 `9999.0.0`、記録 file は `invocations.log`) を置き、`process.env.UT_TDD_CLAUDE_FENCE_DIR` にその path を入れて、`process.env.PATH` の先頭に足す。dir は `process.once("exit")` で消す。偽物の版を下限以上にするのは、全件の doctor を流す test が WARN を見ないためである。
  - 009〜013 の fixture の dir は、010 の記号入りの dir を除き、空白と `cmd` の特殊文字 (`&`、`(`、`)`、`^`、`!`、`%`) を含まない path に作る (`mkdtemp` の接頭辞を英数字にする)。§6 の対応表はこの前提で数える。

## 3. 候補の oracle

| ID | 対象 | 入力・期待・反例 |
|---|---|---|
| `U-CCVER-001` | 実行中の版の警告 | 入力: 最後の message の行の `version` が (a) `2.1.293`、(b) `2.1.295`、(c) `2.1.318`、(d) `2.2.0`、(e) `10.0.0`。期待: (a) だけ、stdout 全体が `JSON.parse` できる 1 つの object で、その `systemMessage` が警告 (版・下限・guard の失敗時の停止が効かないこと・更新の促し) を含む。(a) の stdout に `session-log: post-tool-use` の行は無い。(b)〜(e) の stdout は既存の `session-log: post-tool-use <id>` の行だけで、`systemMessage` を出さない。どれも exit 0。反例: 文字列として比べて (e) を下限未満と判定する実装。下限ちょうど (b) を警告する実装。警告のために exit を非 0 にする実装。警告を stderr だけに出す実装 (通常の画面に出ない)。既存の行と JSON を同じ stdout に混ぜる実装 (Claude Code が JSON として読めない)。 |
| `U-CCVER-002` | 版を確かめられない | 入力: (a) `transcript_path` が無い、(b) 指す file が無い、(c) message の行に `version` が無い、(d) `version` が `x.y` 形式でない。期待: どれも、stdout が 1 つの JSON object で、その `systemMessage` が「Claude Code の版を確かめられない」を含む。exit 0。反例: 読めないときに黙って通す実装 (確かめられないことを知らせない)。読めないときに下限以上とみなす実装。 |
| `U-CCVER-003` | 1 session に 1 回 | 入力: 同じ session_id で PostToolUse を 3 回、別の session_id で 1 回。transcript の版は下限未満。期待: 警告は session ごとに 1 回だけ (合計 2 回)。反例: tool の呼び出しごとに警告する実装。session をまたいで 1 回しか出さない実装。 |
| `U-CCVER-004` | 下限の値と doctor | 入力: src の下限の定数、`docs/templates/adapter/CLAUDE.md`、`src/setup/templates.ts` の生成 adapter、doctor の check (`probePathClaude` の stub が `{ kind: "found", version: "2.1.293" }` と `{ kind: "found", version: "2.1.318" }`。2026-11-16 の改訂前は `readPathClaudeVersion` の stub が `2.1.293` と `2.1.318`)。期待: (a) 文書と生成物に書かれた下限が `CLAUDE_CODE_VERSION_FLOOR` と一致する。(b) doctor (`checkClaudeVersionFloor`) は `2.1.293` で warn、`2.1.318` で warn なし、どちらも fail にしない。warn の文言が「PATH の claude の版」と明記する。反例: 下限を文書と src に別々に書いて乖離させる実装。doctor を fail にする実装。PATH の版を実行中の版と称する文言。 |
| `U-CCVER-005` | 下限の参照関係 | 入力: (a) 下限の定数の module を `vi.mock` で `9.9.9` に差し替え、同じテストの process の中で次の 3 つを呼ぶ。`evaluateClaudeVersion("2.1.318")`。`checkClaudeVersionFloor({ probePathClaude: () => ({ kind: "found", version: "2.1.318" }) })` (2026-11-16 の改訂前は `readPathClaudeVersion: () => "2.1.318"`)。`src/setup/templates.ts` の adapter の `CLAUDE.md` の生成。(b) `src/` の下で下限の値の文字列 (`2.1.295`) を走査する。期待: (a) `evaluateClaudeVersion` が `"below"` を返し、doctor が warn を出し、生成した adapter の本文に `9.9.9` が書かれる。(b) 出現は `src/runtime/claude-version-floor.ts` の 1 か所だけ。PostToolUse の hook (`src/cli.ts` の `hook post-tool-use`) は CLI の子 process で動き、`vi.mock` が届かないので、(a) では呼ばない。hook が下限を定数から得ていることは、(b) の走査 (hook が値を直接書けば出現が 2 か所以上になる) と、001 の CLI の挙動で確かめる。反例: 比較・doctor・adapter の生成がそれぞれ `2.1.295` を直接書き、使われない定数を別に置く実装 ((a) で `"ok"` を返し、warn が出ず、生成物が `2.1.295` のまま。(b) で出現が複数)。hook だけが `2.1.295` を直接書く実装 ((b) で出現が複数)。 |
| `CANDIDATE-U-CCVER-006` | 実画面での確認 (手動) | 手順: 本 repository の hook 設定のまま、(a) 下限未満の Claude Code (例 2.1.293) と (b) 下限以上の Claude Code (例 2.1.318) で新しい session を始め、tool を 1 回使う。期待: (a) は通常の画面に警告が 1 回だけ出て、2 回目の tool では出ない。(b) は出ない。どちらも tool の実行は止まらない。結果 (版・画面の記録・日時) を Issue #1561 に残す。反例: debug logging を有効にしないと見えない出し方。自動テストの対象にはしない。 |
| `U-CCVER-007` | 警告の対象の runtime (L6 の「対象の runtime」、2026-11-10、#1561) | 入力: `transcript_path` の無い PostToolUse の stdin で `hook post-tool-use` を CLI の子 process として起動する。環境変数の組を 4 通りにする。(a) `CLAUDECODE=1` だけ。(b) `CLAUDECODE=1` と `CODEX_SANDBOX`。(c) `CODEX_SANDBOX` だけ。(d) どれも無し。どの組でも `CLAUDE_PROJECT_DIR` は設定する。期待: (a) だけが stdout に「版を確かめられない」の `{"systemMessage":...}` を 1 つだけ出す。(b)(c)(d) は stdout が従来の `session-log: post-tool-use` の行だけで、`systemMessage` を出さない。どの組も exit 0。反例: `CLAUDE_PROJECT_DIR` の有無だけで判定する実装 ((b)(c)(d) でも警告が出る)。`CLAUDECODE` を見ない実装 ((d) で警告が出る)。テストレベル: CLI process。 |
| `U-CCVER-008` | marker を書けないときの警告 (L6 の「marker を書けないとき」、2026-11-11、#1561) | 入力: 下限未満の版の transcript で、警告済みの印の作成・書き込みが `EEXIST` 以外のエラー (`EACCES` / `ENOTDIR` など。fixture で印の置き場を file や書けない directory にして起こす) で失敗する状態にし、同じ session_id で `hook post-tool-use` を CLI の子 process として 2 回続けて起動する。環境変数は 001 の (a) と同じ Claude の環境とする。期待: 版の警告は 2 回とも stdout の単一の `{"systemMessage":...}` JSON に出る。stderr には印の保存の失敗の診断が出る。exit code と判定は、印を書けた場合 (001 の (a)) と同じである。反例: 印の書き込みに失敗した後は警告を黙る実装。警告を stderr へ移す実装。印の失敗で exit code や判定を変える実装。 |
| `CANDIDATE-U-CCVER-009` | 実行してはいけないものを実行しない (L6 `claude-version-probe.md` §3、#1674) | (a) §2 の decoy の fixture (cwd が decoy、PATH が「空・`.`・`rel`・偽物の dir」)。期待: 結果は `{ kind: "found", version: "2.1.318" }` で、decoy の印 (cwd と `rel` の `claude`、Windows では cwd の `claude-helper.cmd`) が 1 つも無い。(b) Windows だけ: PATH を、名前に `%UT_TDD_UNDEFINED_1674%` を含む dir 1 つにする (その環境変数は `env` から消す)。dir には偽の `claude.cmd` (`2.1.318`) を置く。期待: 結果は `{ kind: "found", version: null }` で、偽物の記録が無い。反例: §5 の M1〜M4。テストレベル: (a) は node の子 process、(b) は in-process。 |
| `CANDIDATE-U-CCVER-010` | 記号を含む path と `ComSpec` (Windows、L6 §3、#1674) | 入力: 名前に空白・`&`・`(`・`)`・`!` を含む dir (例 `UT-TDD probe & (x) !-<乱数>`) に偽の `claude.cmd` (`2.1.318`) を置き、PATH をその dir だけにする。`env.ComSpec` は相対の `cmd.exe`、`env.SystemRoot` は親の値 (絶対 path)。期待: 結果は `{ kind: "found", version: "2.1.318" }` で、偽物の記録が 1 行ある。反例: §5 の M5、M6。 |
| `CANDIDATE-U-CCVER-011` | 最初の候補だけを実行する (L6 §3、#1674) | 入力: PATH を dir A、dir B の順にする。A の偽物は記録してから終了コード 1 で終わり、B の偽物は `2.1.318` を出す。期待: 結果は `{ kind: "found", version: null }`、A の記録が 1 行あり、B の記録が無い。反例: §5 の M7。両方の platform で流す。 |
| `CANDIDATE-U-CCVER-012` | `PATHEXT` の順と拡張子 (Windows、L6 §3、#1674) | 入力: 1 つの dir に拡張子の無い `claude`、`claude.bat` (`2.1.300`)、`claude.cmd` (`2.1.318`) を置き、`env.PATHEXT` を `.BAT;.CMD` にする。期待: 結果は `{ kind: "found", version: "2.1.300" }`。反例: §5 の M8、M9。 |
| `CANDIDATE-U-CCVER-013` | 実行権限 (POSIX、L6 §3、#1674) | 入力: PATH を dir A、dir B の順にする。A の `claude` は mode 0644 (`2.1.299` を出す中身)、B の `claude` は mode 0755 (`2.1.318`)。期待: 結果は `{ kind: "found", version: "2.1.318" }`。反例: §5 の M10。 |
| `CANDIDATE-U-CCVER-014` | doctor の表示の 4 状態 (L6 §4、#1675) | 入力: `checkClaudeVersionFloor({ probePathClaude })` に、(a) `{ kind: "not_found" }`、(b) `{ kind: "found", version: null }`、(c) `{ kind: "found", version: "2.1.318" }` を返す関数と、(d) 例外を投げる関数を渡す。期待: どれも `ok: true` で message は 1 行。(a) は `doctor: claude-version-floor - SKIP: PATH に claude が見つからない (版を確かめられない)`、(b) と (d) は `doctor: claude-version-floor - WARN: PATH の claude の版を読めない (版を確かめられない)`、(c) は `doctor: claude-version-floor - OK: PATH の claude の版 (2.1.318)` と完全に一致する。下限未満の表示は `U-CCVER-004` が受け持つので見ない。反例: §5 の M11〜M16。 |
| `CANDIDATE-U-CCVER-015` | 見つからないときは実行しない (L6 §3、#1675) | 入力: PATH を空の一時 dir 1 つにして `probePathClaude(env, process.platform)` を呼ぶ。期待: 結果は `{ kind: "not_found" }`。反例: §5 の M17。両方の platform で流す。 |
| `CANDIDATE-U-CCVER-016` | 末尾 4 MiB より前を読まない (L6 §5、#1676) | 入力: transcript の先頭に message 行 (`version` は `2.1.293`) を 1 行置き、その後ろに非 message 行を合計 4,194,368 bytes (65,537 bytes の行を 64 行) 置く。期待: `readTranscriptClaudeVersion` は `null`。反例: §5 の M18、M19。 |
| `CANDIDATE-U-CCVER-017` | 末尾 4 MiB の中は読む (L6 §5、#1676) | 入力: transcript の先頭に 5,000 bytes の非 message 行、次に message 行 (`2.1.293`)、その後ろに非 message 行を合計 4,193,304 bytes (4 MiB − 1,000 bytes。65,536 bytes の行を 63 行と、64,536 bytes の行を 1 行) 置く。読み始めは先頭の行の途中になり、message 行は窓の中に丸ごと入る。期待: `readTranscriptClaudeVersion` は `"2.1.293"`。反例: §5 の M20。 |
| `CANDIDATE-U-CCVER-018` | fence が効いている (L6 §6、#1677) | 入力: test の worker の中で、`process.env.UT_TDD_CLAUDE_FENCE_DIR` と PATH の先頭の要素を読み、fence の記録 file の行数を数えてから、注入しない `checkClaudeVersionFloor()` を呼ぶ。期待: 環境変数が有り、PATH の先頭の要素がその dir と等しく (Windows は大小を無視して比べる)、記録の行数が呼ぶ前より 1 行多い。表示の文言は見ない (014 が受け持つ)。反例: §5 の M21、M22。 |
| `CANDIDATE-U-CCVER-019` | CLI の子 process の doctor も fence を通る (L6 §6、#1677) | 前提: 018 の構造の条件 (環境変数が有り、PATH の先頭がその dir) が真。偽なら `it.skipIf` で skip し、検出に数えない。入力: `process.env` をそのまま継承して `node <実行 root>/src/cli.ts doctor --profile consumer-toolchain --json` を起動する (`tests/cli-surface.test.ts` の `runCli` と同じ形)。期待: fence の記録の行数が起動の前より 1 行多い。終了コードと表示の文言は見ない。反例: §5 の M23。テストレベル: CLI process。 |

## 4. 段の扱い

- 001〜005 は設計書保護の三段階に従う。006 は手動の確認で、実装 PR の merge 後に行う。登録と Red の PR が `it.fails` として入れ、`src` を含まない昇格 PR が正式 ID に改め、実装 PR が `it` に戻す。004 が開発 repository の文書を読むなら、`test-repository-isolation` の登録行を登録と Red の PR に入れる。
- 007 は `test-repository-isolation` に既存登録のある同じテストファイルに加えるため、正式 ID の昇格と `it.fails` の Red を一つの `src` を含まない PR に入れる。Red として残る oracle は実装 PR で `it` に戻す。
- 008 も `test-repository-isolation` に既存登録のある同じテストファイルに加えるため、正式 ID の昇格と `it.fails` の Red を一つの `src` を含まない PR に入れる。fixture の `ENOTDIR` 発生と CLI の正常終了は通常の前提検証で先に確かめる。Red として残る oracle は実装 PR で `it` に戻す。
- 009〜019 (2026-11-16 追記) は 001〜005 と同じ三段階に従う。登録と Red の PR は、`design-protection-diff-gate.md` §10.3 の手順 1' に従って新しい module `src/doctor/claude-path-probe.ts` の stub を入れる。stub の `probePathClaude` は何も実行せず、常に `{ kind: "found", version: null }` を返す (009〜013 と 015 の期待を満たし得ない値。011 は A の記録を、015 は `not_found` を求めるので落ちる)。同じ PR に fence の setup と `vitest.config.ts` の setupFiles の登録を入れる (どちらも test の側で、src ではない)。setup が入った時点で、今の `cmd /c "claude --version"` も、vitest の cwd に `claude.*` が無いので fence の偽物を先に見つける。014 の Red は、今の `checkClaudeVersionFloor` が `probePathClaude` を受けない型なので、test の 1 か所の型 assertion で渡し、Green の PR で外す。017 は今の実装 (全部読む) でも緑になる guard なので `it` で入れる。残りは `it.fails` で、assertion の不一致だけで落ちるようにする。続く `src` を含まない PR で正式 ID へ昇格し、実装の PR で `it` に戻す。新しい test file が開発 repository の文書を読むなら、`test-repository-isolation` の登録行を登録と Red の PR に入れる。

## 5. 反例 (変異) の一覧 (009〜019)

L6 `claude-version-probe.md` の正しい実装に、次の変異を 1 つだけ加えたものを反例とする。

| ID | 変異 | platform |
|---|---|---|
| M1 | 解決した絶対 path ではなく素の名前 `claude` を実行する (Windows は `cmd /c "claude --version"`、POSIX は `spawn("claude")`。今の実装) | 両方 |
| M2 | 空の要素と相対の要素を current directory から解決して候補にする | 両方 |
| M3 | spawn の `cwd` を候補の dir にせず、呼び出した process の cwd のままにする | Windows |
| M4 | `%` を含む path も `cmd` で実行する | Windows |
| M5 | `cmd` に渡す path を引用符で囲まない | Windows |
| M6 | 相対の `ComSpec` をそのまま使う | Windows |
| M7 | 最初の候補が失敗したら後ろの候補を試す | 両方 |
| M8 | 拡張子を `PATHEXT` の順でなく `.exe`・`.com`・`.cmd`・`.bat` の固定の順で探す | Windows |
| M9 | 拡張子の無い `claude` を候補にする | Windows |
| M10 | 実行権限の無い file を候補にする | POSIX |
| M11 | `not_found` を `OK` と表示する (今の実装) | 両方 |
| M12 | 版を読めない `found` を `OK` と表示する (今の実装) | 両方 |
| M13 | `not_found` を「読めない」の WARN と同じ表示にする | 両方 |
| M14 | `not_found` と「読めない」で `ok: false` を返す | 両方 |
| M15 | 注入した probe の例外を `not_found` として表示する | 両方 |
| M16 | OK の表示に版を書かない (今の実装) | 両方 |
| M17 | 候補が無いときに `{ kind: "found", version: null }` を返す | 両方 |
| M18 | file 全体を読む (今の実装) | 両方 |
| M19 | 窓を 4 MiB より大きくする、または窓の中に無ければ file 全体を読み直す | 両方 |
| M20 | 窓を 4 MiB より小さくする (例 64 KiB) | 両方 |
| M21 | fence の setup を setupFiles に登録しない | 両方 |
| M22 | fence の dir を PATH の先頭でなく末尾に足す | 両方 |
| M23 | doctor の登録が既定の probe を使わず、固定の結果 (例 `{ kind: "not_found" }`) を渡す | 両方 |

## 6. 反例と oracle の対応表 (009〜019)

行は反例、列は oracle の番号 (`CANDIDATE-U-CCVER-` を省いた数字)。`●` はその oracle の assertion が赤になること、`前` は前提が偽で skip されることを示す。空欄は緑 (その platform で流れない oracle を含む) である。各行の `●` は 1 つだけで、各列に `●` が 1 つ以上ある。最終行は正しい実装で、どの oracle も緑になる。001〜008 は、これらの反例のどれでも緑のままである (001〜003 と 007、008 の transcript は小さく、004 と 005 は probe を差し替える)。

| 反例 | 009 | 010 | 011 | 012 | 013 | 014 | 015 | 016 | 017 | 018 | 019 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| M1 素の名前 | ● | | | | | | | | | | |
| M2 相対の要素 | ● | | | | | | | | | | |
| M3 spawn の cwd | ● | | | | | | | | | | |
| M4 `%` を実行 | ● | | | | | | | | | | |
| M5 引用しない | | ● | | | | | | | | | |
| M6 相対の `ComSpec` | | ● | | | | | | | | | |
| M7 後ろの候補へ進む | | | ● | | | | | | | | |
| M8 拡張子の固定の順 | | | | ● | | | | | | | |
| M9 拡張子の無い file | | | | ● | | | | | | | |
| M10 実行権限を見ない | | | | | ● | | | | | | |
| M11〜M16 表示 | | | | | | ● | | | | | |
| M17 見つからないを `found` に | | | | | | | ● | | | | |
| M18 全部読む | | | | | | | | ● | | | |
| M19 窓が大きい | | | | | | | | ● | | | |
| M20 窓が小さい | | | | | | | | | ● | | |
| M21 fence を登録しない | | | | | | | | | | ● | 前 |
| M22 fence を末尾に足す | | | | | | | | | | ● | 前 |
| M23 doctor の登録が固定の結果 | | | | | | | | | | | ● |
| 正しい実装 | | | | | | | | | | | |

M21 と M22 では 019 の前提が偽になって skip されるが、前提の条件は 018 の assertion の一部なので、018 が必ず赤になる。M11〜M16 はそれぞれ 1 行として流し、どれも 014 だけが赤になる。

### 6.1 review 時の基準で見る反例

| 反例 | 見る場所 |
|---|---|
| `/v:off` を外す | 遅延展開は既定で無効なので、既定の registry の機械では unit の oracle が赤にならない。実装の PR の review で、`cmd` の引数の literal が L6 §3 と一致することを確かめる。 |
| 読み始めが途中のときに最初の行を捨てない | 末尾から見て最初の message 行で返すので、途中の行に届くのは message 行が無いときだけであり、そのとき途中の行は JSON として読めず `null` になって結果は同じである (等価な変異)。review で L6 §5 の手順 2 との一致を確かめる。 |
| test が子 process の PATH を fence の無い値で丸ごと置き換える | fence が外れる。実装の PR の review で、`tests/` の `PATH:` / `Path:` / `process.env.PATH =` の箇所 (origin/main `64566f25b` で 26 件) のうち doctor か probe を流すものが、fence の dir か test の管理する dir だけを PATH に持つことを確かめる。 |

### 6.2 一対一であることの確かめ方

probe の解決と実行、doctor の表示、transcript の窓、fence を、L6 `claude-version-probe.md` §3〜§6 の規則どおりに写した使い捨てのモデルを書き (repo には入れない)、正しい実装と §5 の各変異に本書の oracle と前提をそのまま評価させた。Windows と POSIX、PATH に本物の claude がある開発機と無い CI の 4 通りで流し、§6 の全行で `●` が 1 つ、全列で `●` が 1 つ以上、正しい実装で全件緑になることを確かめた。モデルは §2 の前提 (009〜013 の fixture の path は空白と `cmd` の特殊文字を含まない、vitest の cwd に `claude.*` が無い) を置いている。`cmd` と libuv の実際の探索の挙動は、実装の PR の変異の確認で確かめる (Red の PR の head から切った使い捨ての branch で変異ごとに commit し、`node scripts/run-vitest-snapshot.ts <test file>` を流す。手順は `L7-doctor-source-preflight-profile-test-design.md` §6 と同じ)。

## 7. 既存 test の更新 (oracle ではない)

実装の PR で次を更新する。新しい ID は作らない。

| test | 更新 |
|---|---|
| `tests/claude-version-floor.test.ts` | 004 と 005 の `readPathClaudeVersion: () => "<版>"` を `probePathClaude: () => ({ kind: "found", version: "<版>" })` に改める (§3 の改訂後の文面に合わせる)。assertion は変えない。 |
| `tests/doctor.test.ts` | doctor の deps の `readPathClaudeVersion: () => null` を `probePathClaude: () => ({ kind: "not_found" })` に改める。 |
| `tests/claude-version-path-probe.test.ts` | 素の `claude --version` を `cmd` で直接起動する 1 本目の `it` (「runs the fake claude.cmd through the configured Windows command shell」) を消す。`cmd` の挙動を確かめるだけで、L6 §3 が禁じる起動の形そのものだからである。2 本目の `it` (004 の Windows の既定の probe) は残す。 |
