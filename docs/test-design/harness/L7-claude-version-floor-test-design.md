---
title: "L7 Claude Code version floor test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/session-log.md
status: draft
updated: 2026-11-05
issue: 1561
---

# Claude Code の版が下限未満のときの警告テスト設計 (issue #1561)

## 1. 対象と上位の契約

対象は、Claude Code の版が下限 (2.1.295) 未満のときに利用者へ知らせる経路である。上位の契約は
`docs/design/harness/L6-function-design/session-log.md` の「2026-11-05 Claude Code の版が下限未満のときの警告 (Issue #1561)」節。
guard の `onFailure` そのものは `docs/test-design/harness/L7-claude-hook-onfailure-test-design.md` が持ち、本書では再定義しない。

## 2. fixture の作り方

- 一時ディレクトリに transcript の JSONL と session の state を作り、PostToolUse の hook 入力の `transcript_path` にその path を渡す。開発 repository の `.ut-tdd/`・`harness.db`・OneDrive を操作しない。
- doctor の行は、`checkClaudeVersionFloor` の `readPathClaudeVersion` 引数で `claude --version` の読み取りを差し替える。実際の Claude Code を起動しない。
- 005 の下限の差し替えは、`vi.mock("../src/runtime/claude-version-floor.ts", () => ({ CLAUDE_CODE_VERSION_FLOOR: "9.9.9" }))` で行う。注入口と module の名前は、L6 の「注入口と module」の表に従う。
- Red の段では、新しい module と export はまだ無い。import が解決できないと、ファイル全体が collection で落ちるか、例外を `it.fails` が吸収して偽の Red になる。そこで登録と Red の PR は、`design-protection-diff-gate.md` §10.3 の手順 1' (契約形 stub) に従い、L6 の「注入口と module」の表の形だけを持つ stub を同じ PR に入れる。stub が返す値は、oracle の期待を満たし得ない fail-close の値に限る。
  - `src/runtime/claude-version-floor.ts`：`CLAUDE_CODE_VERSION_FLOOR = "2.1.295"` (契約の値そのもの。定数だけの module なので判定を持たない)。
  - `src/runtime/claude-version-check.ts`：`evaluateClaudeVersion` は常に `"unknown"` を返し、`readTranscriptClaudeVersion` は常に `null` を返す。
  - `src/doctor/claude-version-floor-check.ts` (新しい module)：`checkClaudeVersionFloor` は、版に関係なく warn でも ok でもない固定の結果 (例：`status: "fail"`、detail に `stub`) を返し、`readPathClaudeVersion` を呼ばない。doctor の check の一覧への登録は、Red の段では行わない (実装 PR で行う)。
  - 3 つとも新しい module なので、§10.3 の手順 1' の範囲 (新しい module の stub だけ。既存の src は変えない) に収まる。
  - adapter の生成 (`src/setup/templates.ts`) と PostToolUse の hook (`src/cli.ts`) は、Red の段では変えない。
  これで、どの `it.fails` も import は成功し、assertion の不一致だけで落ちる。stub は実装 PR (Green) で実装に置き換える。前提を確かめるテストは、失敗を吸収する `it.fails` にはしない。

## 3. 候補の oracle

| ID | 対象 | 入力・期待・反例 |
|---|---|---|
| `U-CCVER-001` | 実行中の版の警告 | 入力: 最後の message の行の `version` が (a) `2.1.293`、(b) `2.1.295`、(c) `2.1.318`、(d) `2.2.0`、(e) `10.0.0`。期待: (a) だけ、stdout 全体が `JSON.parse` できる 1 つの object で、その `systemMessage` が警告 (版・下限・guard の失敗時の停止が効かないこと・更新の促し) を含む。(a) の stdout に `session-log: post-tool-use` の行は無い。(b)〜(e) の stdout は既存の `session-log: post-tool-use <id>` の行だけで、`systemMessage` を出さない。どれも exit 0。反例: 文字列として比べて (e) を下限未満と判定する実装。下限ちょうど (b) を警告する実装。警告のために exit を非 0 にする実装。警告を stderr だけに出す実装 (通常の画面に出ない)。既存の行と JSON を同じ stdout に混ぜる実装 (Claude Code が JSON として読めない)。 |
| `U-CCVER-002` | 版を確かめられない | 入力: (a) `transcript_path` が無い、(b) 指す file が無い、(c) message の行に `version` が無い、(d) `version` が `x.y` 形式でない。期待: どれも、stdout が 1 つの JSON object で、その `systemMessage` が「Claude Code の版を確かめられない」を含む。exit 0。反例: 読めないときに黙って通す実装 (確かめられないことを知らせない)。読めないときに下限以上とみなす実装。 |
| `U-CCVER-003` | 1 session に 1 回 | 入力: 同じ session_id で PostToolUse を 3 回、別の session_id で 1 回。transcript の版は下限未満。期待: 警告は session ごとに 1 回だけ (合計 2 回)。反例: tool の呼び出しごとに警告する実装。session をまたいで 1 回しか出さない実装。 |
| `U-CCVER-004` | 下限の値と doctor | 入力: src の下限の定数、`docs/templates/adapter/CLAUDE.md`、`src/setup/templates.ts` の生成 adapter、doctor の check (stub の `claude --version` が `2.1.293` と `2.1.318`)。期待: (a) 文書と生成物に書かれた下限が `CLAUDE_CODE_VERSION_FLOOR` と一致する。(b) doctor (`checkClaudeVersionFloor`) は `2.1.293` で warn、`2.1.318` で warn なし、どちらも fail にしない。warn の文言が「PATH の claude の版」と明記する。反例: 下限を文書と src に別々に書いて乖離させる実装。doctor を fail にする実装。PATH の版を実行中の版と称する文言。 |
| `U-CCVER-005` | 下限の参照関係 | 入力: (a) 下限の定数の module を `vi.mock` で `9.9.9` に差し替え、同じテストの process の中で次の 3 つを呼ぶ。`evaluateClaudeVersion("2.1.318")`。`checkClaudeVersionFloor({ readPathClaudeVersion: () => "2.1.318" })`。`src/setup/templates.ts` の adapter の `CLAUDE.md` の生成。(b) `src/` の下で下限の値の文字列 (`2.1.295`) を走査する。期待: (a) `evaluateClaudeVersion` が `"below"` を返し、doctor が warn を出し、生成した adapter の本文に `9.9.9` が書かれる。(b) 出現は `src/runtime/claude-version-floor.ts` の 1 か所だけ。PostToolUse の hook (`src/cli.ts` の `hook post-tool-use`) は CLI の子 process で動き、`vi.mock` が届かないので、(a) では呼ばない。hook が下限を定数から得ていることは、(b) の走査 (hook が値を直接書けば出現が 2 か所以上になる) と、001 の CLI の挙動で確かめる。反例: 比較・doctor・adapter の生成がそれぞれ `2.1.295` を直接書き、使われない定数を別に置く実装 ((a) で `"ok"` を返し、warn が出ず、生成物が `2.1.295` のまま。(b) で出現が複数)。hook だけが `2.1.295` を直接書く実装 ((b) で出現が複数)。 |
| `CANDIDATE-U-CCVER-006` | 実画面での確認 (手動) | 手順: 本 repository の hook 設定のまま、(a) 下限未満の Claude Code (例 2.1.293) と (b) 下限以上の Claude Code (例 2.1.318) で新しい session を始め、tool を 1 回使う。期待: (a) は通常の画面に警告が 1 回だけ出て、2 回目の tool では出ない。(b) は出ない。どちらも tool の実行は止まらない。結果 (版・画面の記録・日時) を Issue #1561 に残す。反例: debug logging を有効にしないと見えない出し方。自動テストの対象にはしない。 |
| `CANDIDATE-U-CCVER-007` | 警告の対象の runtime (L6 の「対象の runtime」、2026-11-10、#1561) | 入力: `transcript_path` の無い PostToolUse の stdin で `hook post-tool-use` を CLI の子 process として起動する。環境変数の組を 4 通りにする。(a) `CLAUDECODE=1` だけ。(b) `CLAUDECODE=1` と `CODEX_SANDBOX`。(c) `CODEX_SANDBOX` だけ。(d) どれも無し。どの組でも `CLAUDE_PROJECT_DIR` は設定する。期待: (a) だけが stdout に「版を確かめられない」の `{"systemMessage":...}` を 1 つだけ出す。(b)(c)(d) は stdout が従来の `session-log: post-tool-use` の行だけで、`systemMessage` を出さない。どの組も exit 0。反例: `CLAUDE_PROJECT_DIR` の有無だけで判定する実装 ((b)(c)(d) でも警告が出る)。`CLAUDECODE` を見ない実装 ((d) で警告が出る)。テストレベル: CLI process。 |

## 4. 段の扱い

- 001〜005 は設計書保護の三段階に従う。006 は手動の確認で、実装 PR の merge 後に行う。登録と Red の PR が `it.fails` として入れ、`src` を含まない昇格 PR が正式 ID に改め、実装 PR が `it` に戻す。004 が開発 repository の文書を読むなら、`test-repository-isolation` の登録行を登録と Red の PR に入れる。
