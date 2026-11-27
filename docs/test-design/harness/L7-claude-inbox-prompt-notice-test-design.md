---
title: "L7 Claude inbox prompt notice test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: draft
pair_artifact: docs/design/harness/L6-function-design/claude-inbox-prompt-notice.md
issue: 1970
---

# Claude inbox prompt 通知のテスト設計 (issue #1970)

## 1. 位置付け

対になる契約は `docs/design/harness/L6-function-design/claude-inbox-prompt-notice.md` である。本書は同契約 §2〜§8 を反証する候補 oracle を定める。候補 ID は `CANDIDATE-U-CPNOTICE-001`〜`009`。まだ draft であり、実装・Red・Green・実機受入の証拠ではない。control 判断 A を反映し、通知 metadata は `publishClaudeInboxEntry` が発行する。clear と claim / terminal による metadata 消去の契約は未決であり、L6/L7 pair-freeze 前に確定する。

既存の `CANDIDATE-U-CGENI-010` は Pack 生成物に `UserPromptSubmit` hook が無いことを期待するため、本機能の配線と意図的に衝突する。L6/L7 の凍結前にこの assertion を無効化しない。Green PR で正式に改訂し、受信 hook の新しい期待を固定する。

## 2. fixture と観測境界

- **unit / hook-process fixture**: Claude `UserPromptSubmit` の有効・無効 event JSON、session、workspace、VS Code / disable 条件を制御する。隔離 project namespace 内に `publishClaudeInboxEntry` が発行した宛先別通知 metadata と、SessionStart が検証して現在の `session_id` をキーに worktree 配下へ記録した locator を用意する。hook は stdin の `session_id` と一致する locator から対象 metadata を引く。旧 sender が発行した entry には通知 metadata が無い fixture も用意する。
- **読取専用の基準状態**: inbox entry 本文、`.claim`、terminal、ACK、receipt、Memory、DB の bytes / row 数を実行前後で比較する。既存 inbox の全 entry を対象にし、通知対象外の別 session entry も sentinel として含める。実 inbox、実利用者の session、実 project state は fixture に使わない。
- **timeout / process 観測**: hook host の開始から stdout / exit 応答までを同じ時計で測る。子 process 起動、Git、GitHub / network、DB 接続は instrument し、呼び出しがあれば記録する。host による timeout は環境・試験条件として記録し、単体の関数時間を代用しない。
- テストは同一 project 内の別 session、別 project、空 inbox、壊れた / 欠落 metadata を個別に作り、同時に複数の入力条件を変えない。本文中の任意文字列が stdout / context に漏れないよう、entry 本文・sender・ID に固有 sentinel を置く。
- locator が有効で session が一致する fixture と、locator 欠落・不正・session 不一致の fixture を分ける。後者は無通知であり、worktree が一致するだけでは宛先とみなさない。linked worktree でも Git を起動せず、SessionStart が記録した worktree 配下の locator を使う。

## 3. 候補 oracle

| 候補 ID | 入力・操作 | 期待結果 | 反例 (赤になる変異) |
| --- | --- | --- | --- |
| `CANDIDATE-U-CPNOTICE-001` | trusted workspace の VS Code Claude、現在の `UserPromptSubmit`、SessionStart が検証し現 `session_id` に記録した locator、その宛先の新しい通知 metadata があり未通知。hook を実行 | exit 0。stdout は JSON object 1 個だけ。`hookSpecificOutput.hookEventName` は `UserPromptSubmit`、`additionalContext` は L6 の固定 1 行 `このセッション宛てに未読の返事があります。` と完全一致。余分な key / context / stderr 起因の通知はない | `hookEventName` の欠落・誤値、文言の差分、複数行、JSON 外文字、`systemMessage` / decision field の追加、exit 2 |
| `CANDIDATE-U-CPNOTICE-002` | 次を各々独立実行: 通知 metadata なし / 空 inbox、空または欠落 session、malformed・欠落・未対応 input、locator 欠落・不正・session 不一致、旧 sender の entry のみ、別 session / 別 project 宛てのみ、terminal Claude、disable env 有効 | すべて stdout 空・exit 0。context に通知なし。宛先を worktree の一致や本文から推測しない | invalid input / locator を通知対象にする、旧 sender や foreign entry を通知する、disable を迂回する、空状態で JSON を出す、fail-open を壊して exit 非 0 |
| `CANDIDATE-U-CPNOTICE-003` | `publishClaudeInboxEntry` 発行 metadata と SessionStart locator を持つ fixture を実行し、inbox 本文と `.claim` / terminal / ACK / receipt / Memory / DB の状態および I/O を観測。不正 metadata・locator と foreign path も別々に投入 | 有効対象では通知できるが inbox 本文を open/read せず、本文や raw ID を出力せず、delivery / ACK / terminal / DB を変えない。通知用 metadata と dedup state 以外の write 0。hook は locator と metadata のみ読み、foreign path は無通知・変更 0 | inbox JSON parse/read, claim / terminal / DB read-write, 任意 file write, locator 以外の path access, ID/body leak, entry bytes 変更 |
| `CANDIDATE-U-CPNOTICE-004` | 同一 project namespace・同一 session ID の metadata generation と suppression state を用意し、順次2回、同時2回、および同じ ID で再開した後の prompt を独立に実行する。新しい generation は未通知、同時 fixture は両 process が未通知状態から競合する | 各 generation は最大1 context。新しい generation なら1回通知し、同じ ID の resume では既通知 generation を再通知しない。同時実行では `wx` による排他作成の勝者だけが通知し、敗者は stdout 空・exit 0。session ID による suppression は resume をまたいで残る | 同一 generation の重複、resume による再通知、別 generation の通知欠落、競合時の複数通知、失敗時の黙示的再試行、dedup state の本文や DB への記録 |
| `CANDIDATE-U-CPNOTICE-005` | 同一 session に新しい metadata arrival、clear、resume を個々に発生させ、通知回数を観測 | 新しい metadata generation は 004 の通り1回通知し、同じ session ID の resume は再通知しない。**clear / lifecycle は未決・freeze 対象外**: claim / terminal の既読を観測する境界と、現在の宛先における clear の扱いが決まるまで、その後の通知期待値は固定しない | clear / claim / terminal 後の再通知規則を本候補だけで赤緑判定しない。実装者が未決の消去・clear semantics を推測して期待値にすることを禁止 |
| `CANDIDATE-U-CPNOTICE-006` | stat / metadata 読書き失敗、権限エラー、不正 metadata、捕捉された内部例外を独立に注入する。host の起動失敗・timeout は §4 で誘発する | hook が応答できる失敗では stdout 空・exit 0。host の起動失敗・timeout は入力継続を host で確認する。decision / block / continue:false / onFailure:block を返さず、hook 自身は exit 2 にしない。同一入力からの外部 retry なし | 入力を拒否する、exit 2、continue:false、timeout retry、診断内容の追加文脈への出力 |
| `CANDIDATE-U-CPNOTICE-007` | source `.claude/settings.json`、Pack 生成 Claude 設定、adapter mirror の hook wiring と既存 consumer が hook を持たない場合を調べ、既存 Stop / Codex 設定も比較 | Claude の三面に `UserPromptSubmit` hook が各 1 件配線され、未更新 consumer は hook 欠落のまま動作可能で hard-fail しない。Stop の `claude-memory-wake` (timeout 930 秒を含む)、既存 PostToolUse / Codex hook 群に差分なし。生成・mirror の旧 `CANDIDATE-U-CGENI-010` assertion は Green PR で改訂されるまでは現行のまま | source / Pack / mirror の欠落・重複、existing consumer を強制更新、Stop / Codex / PostToolUse の変更、CGENI-010 を契約凍結前に黙って削除 |
| `CANDIDATE-U-CPNOTICE-008` | source / Pack template / adapter mirror の timeout 値と hook hot path の process / network dependency を検査 | timeout は 5 秒とし三面で一致する。5 秒は固定値だが、Windows host での実測までは完走上限を保証したとは扱わない。hot path は bounded で Git / GitHub / API / network / DB を呼ばず、無条件の Git 起動を伴う既存 root resolver に依存しない。任意 hook として扱い、新しい `REQUIRED` entry は設けない | 面ごとの timeout drift、5 秒を実測済みまたは完走保証済みと偽る、Git / network / DB 起動、非 bounded scan |
| `CANDIDATE-U-CPNOTICE-009` | 生成された Claude 設定から hook command を取得し、隔離 consumer fixture でその command を子 process として起動する。正しい宛先と空の宛先の入力をそれぞれ標準入力へ送る | 設定が指す command が起動する。正しい宛先は 001 の JSON、空の宛先は stdout 空。両方 exit 0、inbox / claim / terminal / ACK / DB は前後一致。Claude host での解釈と wall time は §4 で観測する | 配布設定の entrypoint が解決できない、子 process の出力または exit が契約と異なる、保護対象の状態に差分がある |

候補 004 の抑止単位は project namespace + 現在の session ID であり、通知 metadata generation ごとに最大1 context とする。同じ ID の resume をまたいで suppression state を維持し、同時 prompt は `wx` の排他作成で1件だけを通す。candidate 005 の clear は現在の宛先に限る。既読の観測点と clear 後に残る通知候補の扱いは L6 §8 の判断後に反映する。本書は L6 が未定義の storage contract を追加しない。

## 4. 実機受入・性能計測 (自動 oracle とは別の証跡)

candidate 009 の将来の integration test は fixture で再現可能な契約を検査する。Issue #1970 の完了条件にある実機確認は、実装 PR で source-free の公開 Pack または認可された隔離 fixture を使い、実際の Windows / VS Code Claude で別途記録する。実 inbox や実際の作業中 session は使わない。

pair-freeze 前に、隔離した Windows host fixture で host 開始から応答までの計測を実施し、その証跡を記録する。これは事前計画であり、現時点では未計測である。5 秒以内完走の実装受入は Green 後に consumer behavior として別途確認し、事前 fixture の計測をその受入証拠として扱わない。

同一の Claude session で通知ありと通知なしの prompt がそれぞれ継続することを確かめる。試行ごとに session ID と hook ID を揃えて開始・応答の記録を対応させる。通知ありでは `additionalContext` の固定 1 行を確認し、返事本文・ID が出ないこと、inbox body / `.claim` / terminal / ACK / DB の前後状態が変わらないことを照合する。通知なし fixture と host の起動失敗・timeout 条件でも prompt が継続することを記録する。host が終了させた process に exit 0 は要求しない。timeout の確認は機器負荷と host 側の timeout 設定を併記し、意図しない負荷増幅や同一 hook の retry は行わない。

計測は #1938 の様式に合わせ、hook host 開始から Claude が応答を受けるまでを測る。設定 timeout は literal 5 秒とし、設定値、wall time、終了結果 (response / timeout / error)、CPU・memory 等の負荷条件、OS / VS Code Claude / Node 版、fixture 状態を記録する。5 秒以内完走は実測前に保証せず、観測値を「上限を保証した」と読み替えない。任意 hook の timeout budget 文書改訂は別の pair-freeze とし、本契約から `REQUIRED` entry を追加しない。

## 5. Red / Green への引き渡し

この PR は契約と oracle の draft のみである。Red action tests、test code の追加、実装、候補 ID の正式 ID への昇格は別 PR とする。control 判断 A と通知 metadata の発行元、locator、session ID / generation 単位の抑止、5 秒 timeout は決定済み。本書は `status: draft` のままとし、L6 の clear / claim / terminal による metadata 消去 semantics の解決、Windows host 計測証跡の追加、L6/L7 の pair-freeze を待つ。任意 hook timeout budget 文書の改訂は別 pair-freeze とし、本契約に新しい `REQUIRED` entry を足さない。

Red では各候補に対応する独立した負例を追加し、候補 003 / 004 は notification metadata / locator / suppression state と既存 inbox state の両方を観測する。`CANDIDATE-U-CGENI-010` の Green 改訂を同時に計画し、古い oracle が有効な間は「全 consumer 設定に hook が必須」と先取りしない。test code を含む PR で初めて Red を実行し、ここに記した oracle と変異を照合する。
