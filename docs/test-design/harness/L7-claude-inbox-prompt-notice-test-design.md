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

対になる契約は `docs/design/harness/L6-function-design/claude-inbox-prompt-notice.md` である。本書は同契約 §2〜§8 を反証する候補 oracle を定める。候補 ID は `CANDIDATE-U-CPNOTICE-001`〜`009`。まだ draft であり、実装・Red・Green・実機受入の証拠ではない。control の最終境界判断を反映し、通知 metadata は宛先キー・通知世代・必須 `entry.id` を持つ。hook は entry / claim / terminal を内容読取せず stat で判定する。Windows host の証跡を得るまで pair-freeze しない。

既存の `U-CGENI-010` は Pack 生成物に `UserPromptSubmit` hook が無いことを期待するため、本機能の配線と意図的に衝突する。L6/L7 の凍結前にこの assertion を無効化しない。Green PR で正式に改訂し、受信 hook の新しい期待を固定する。

## 2. fixture と観測境界

- **unit / hook-process fixture**: Claude `UserPromptSubmit` の有効・無効 event JSON、session、workspace、VS Code / disable 条件を制御する。隔離 project namespace 内に `publishClaudeInboxEntry` が発行した宛先別 notification metadata と、SessionStart が検証して現在の `session_id` をキーに worktree 配下へ記録した locator を用意する。metadata は宛先キー・通知世代・必須 `entry.id` を持つ。hook は stdin の `session_id` と一致する locator から metadata を得て、共有 `inboxFileStem(entry.id)` で entry / `.claim` / `.terminal.json` の path を導出する。旧 sender が発行した entry には notification metadata が無い fixture も用意する。
- **読取専用の基準状態**: notification metadata と locator は読み取り、entry / `.claim` / `.terminal.json` は `stat` のみとする。entry・claim・terminal の内容を open/read しないこと、ACK / receipt / Memory / DB を読まず変更しないことを I/O instrument で確認する。実 inbox、実利用者の session、実 project state は fixture に使わない。
- **timeout / process 観測**: hook host の開始から stdout / exit 応答までを同じ時計で測る。子 process 起動、Git、GitHub / network、DB 接続は instrument し、呼び出しがあれば記録する。host による timeout は環境・試験条件として記録し、単体の関数時間を代用しない。
- テストは同一 project 内の別 session、別 project、空 inbox、壊れた / 欠落 metadata を個別に作り、同時に複数の入力条件を変えない。entry 本文・sender・ID に固有 sentinel を置き、本文・sender・ID が stdout / context に漏れないことを確かめる。
- locator が有効で session が一致する fixture と、locator 欠落・不正・session 不一致の fixture を分ける。後者は無通知であり、worktree が一致するだけでは宛先とみなさない。linked worktree でも Git を起動せず、SessionStart が記録した worktree 配下の locator を使う。
- runtime の `runtimeBusRoot` は workspace をまたぐ共有場所なので、fixture は実行前に検証した fixture 専用 root を明示注入する。既定値または不正な override では実 runtime root に fallback せず、read/write を一切行わない。inbox を走査せず、metadata の各 `entry.id` から `inboxFileStem(entry.id)` を介して対象 path のみ導出する。

## 3. 候補 oracle

| 候補 ID | 入力・操作 | 期待結果 | 反例 (赤になる変異) |
| --- | --- | --- | --- |
| `CANDIDATE-U-CPNOTICE-001` | trusted workspace の VS Code Claude、現在の `UserPromptSubmit`、SessionStart が検証し現 `session_id` に記録した locator、宛先 metadata の必須 `entry.id` に対応する entry が存在し `.claim` と `.terminal.json` が存在しない。hook を実行 | 対象 path の存在確認だけで通知する。exit 0。stdout は JSON object 1 個だけ。`hookSpecificOutput.hookEventName` は `UserPromptSubmit`、`additionalContext` は L6 の固定 1 行 `このセッション宛てに、まだ受け取っていない返事があります。` と完全一致。余分な key / context / stderr 起因の通知はない | `hookEventName` の欠落・誤値、文言の差分、複数行、JSON 外文字、`systemMessage` / decision field の追加、exit 2 |
| `CANDIDATE-U-CPNOTICE-002` | 次を各々独立実行: 通知 metadata なし / 空 inbox、空または欠落 session、malformed・欠落・未対応 input、必須 `entry.id` 欠落・不正、locator 欠落・不正・session 不一致、旧 sender の entry のみ、別 session / 別 project 宛てのみ、entry 不在、claim または terminal が存在、terminal Claude、disable env 有効 | すべて stdout 空・exit 0。context に通知なし。宛先を worktree の一致や本文から推測しない。`.claim` の内容不正でも通知なしとしてよい (既知の false negative) | invalid input / locator を通知対象にする、旧 sender や foreign entry を通知する、disable を迂回する、entry 不在 / claim / terminal 存在時に通知する、空状態で JSON を出す、fail-open を壊して exit 非 0 |
| `CANDIDATE-U-CPNOTICE-003` | `publishClaudeInboxEntry` 発行 metadata と SessionStart locator を持つ fixture を実行し、対象 entry / `.claim` / `.terminal.json` の I/O を instrument。不正 metadata・locator と foreign path も別々に投入 | 有効対象では notification metadata、locator、通知済み世代の照合記録を読み、必須 `entry.id` から共有 `inboxFileStem` で導いた entry / claim / terminal は `stat` のみ。必要な通知済み state のみ更新し、本文や raw ID を出力せず、delivery / ACK / terminal / DB を変えない。不正・foreign path は無通知・通知 state 変更 0 | entry / claim / terminal を open/read、directory scan、独自 path 連結で `inboxFileStem` を迂回、通知 state 以外への write、ACK / DB read-write、任意 file write、locator 外 path access、ID/body leak |
| `CANDIDATE-U-CPNOTICE-004` | 同一 project namespace・同一 session の宛先キー / metadata generation / entry IDs を用意し、順次 prompt、同時 prompt、同じ ID の resume、既通知の宛先への新しい世代の到着を個別に実行する。各実行前後で entry / claim / terminal の有無と stat の確定・不確定を制御する | 障害のない新世代の各 fixture で context は1回。既通知世代を同じ ID の resume で再通知しない。並行 Stop との stat が不確定な回は通知済み世代を保存せず、次 prompt で再観測する。確定した未配送状態では `wx` 排他作成の勝者だけが通知し、同時 prompt の敗者は stdout 空・exit 0 | 同一 generation の重複、resume による再通知、別 generation の通知欠落、競合時に複数通知または未確定なのに通知済みを保存、再観測しない、本文や DB への状態記録 |
| `CANDIDATE-U-CPNOTICE-005` | 同じ宛先 session の resume / clear と、別 session ID の clear を個別に行い、locator と notification metadata の宛先キー / 通知済み世代を確認する | 同一 ID の clear は locator を更新しても宛先キーと通知済み世代を保持する。異なる ID は別宛先となり、以前の宛先の通知済み状態を引き継がない。clear の作用は現在の宛先 session 内に限る | 同一 ID clear で既通知世代を忘れて重複、異なる ID 間で状態共有、clear が別 session / project に波及、worktree 一致だけで宛先を判断 |
| `CANDIDATE-U-CPNOTICE-006` | stat / metadata 読書き失敗、権限エラー、不正 metadata、捕捉された内部例外を独立に注入する。host の起動失敗・timeout は §4 で誘発する | hook が応答できる失敗では stdout 空・exit 0。host の起動失敗・timeout は入力継続を host で確認する。decision / block / continue:false / onFailure:block を返さず、hook 自身は exit 2 にしない。同一入力からの外部 retry なし | 入力を拒否する、exit 2、continue:false、timeout retry、診断内容の追加文脈への出力 |
| `CANDIDATE-U-CPNOTICE-007` | source `.claude/settings.json`、Pack 生成 Claude 設定、adapter mirror の hook wiring と既存 consumer が hook を持たない場合を調べ、既存 Stop / Codex 設定も比較。Green で `.claude/CLAUDE.md` の hook 一覧と `U-RDRIFT-007` を確認 | 現状 `.claude/settings.json` に hook は未配線。Green で Claude の三面に各 1 件配線し `.claude/CLAUDE.md` の hook 一覧も同時更新する。未更新 consumer は hook 欠落のまま動作可能で hard-fail しない。Stop `claude-memory-wake` (timeout 930 秒を含む)、既存 PostToolUse / Codex hook 群に差分なし。生成・mirror の旧 `U-CGENI-010` assertion は Green PR で改訂する | source / Pack / mirror の欠落・重複、hook 一覧未更新、既存 consumer を強制更新、Stop / Codex / PostToolUse の変更、CGENI-010 を契約凍結前に黙って削除 |
| `CANDIDATE-U-CPNOTICE-008` | source / Pack template / adapter mirror の timeout 値と hook hot path の process / network dependency を検査 | timeout は 5 秒とし三面で一致する。5 秒は固定値だが、Windows host での実測までは完走上限を保証したとは扱わない。hot path は bounded で Git / GitHub / API / network / DB を呼ばず、無条件の Git 起動を伴う既存 root resolver に依存しない。任意 hook として扱い、新しい `REQUIRED` entry は設けない | 面ごとの timeout drift、5 秒を実測済みまたは完走保証済みと偽る、Git / network / DB 起動、非 bounded scan |
| `CANDIDATE-U-CPNOTICE-009` | 生成された Claude 設定から hook command を取得し、隔離 consumer fixture でその command を子 process として起動する。正しい宛先と空の宛先の入力をそれぞれ標準入力へ送る | 設定が指す command が起動する。正しい宛先は 001 の JSON、空の宛先は stdout 空。両方 exit 0、inbox / claim / terminal / ACK / DB は前後一致。Claude host での解釈と wall time は §4 で観測する | 配布設定の entrypoint が解決できない、子 process の出力または exit が契約と異なる、保護対象の状態に差分がある |

抑止単位は project namespace + 宛先 session ID + notification metadata generation であり、各 generation は最大1 context とする。同じ ID の resume / clear は宛先キーと通知済み世代を維持し、異なる ID は別宛先として独立させる。宛先 metadata の `entry.id` から `inboxFileStem` を介して entry / `.claim` / `.terminal.json` を導出して stat する。claim / terminal の内容は開かないため、壊れた `.claim` が残る1件では通知されない false negative が起こり得る。誤りは無通知側だけを許す。Stop との stat race は許容し、stat が不確定な回は通知済みを保存せず次 prompt で再観測する。clear は現在の宛先 session のみに適用し、hook 自身は配送 state を変更しない。

## 4. 実機受入・性能計測 (自動 oracle とは別の証跡)

candidate 009 の将来の integration test は fixture で再現可能な契約を検査する。Issue #1970 の完了条件にある実機確認は、実装 PR で source-free の公開 Pack または認可された隔離 fixture を使い、実際の Windows / VS Code Claude で別途記録する。実 inbox や実際の作業中 session は使わない。

計測 fixture は `runtimeBusRoot` を明示的に検証した fixture 専用 root へ差し替え、既定値や不正値では起動・read/write を拒否する。fixture は hook 開始時と応答時を同じ hook ID 付き JSONL に記録し、独立した host 開始→応答計測も同 ID で対応させる。entry / claim / terminal の stat 対象が無い・ある・ロック中の各条件を含め、cold start と warm 実行を分ける。実 inbox は使用しない。

計測の準備・回収・判定は control lane が行い、fixture と手順書を作る。`claude -p` は代理計測だけに使い、凍結の証跡にしない。実機の人手送信は PO に依頼し、隔離 fixture で実 Windows VS Code Claude の cold 1 回と warm N 回の prompt を送信してもらう。control は JSONL と host 記録を回収し、確認した HEAD、Claude 拡張の版、Node の版、fixture 条件を #1970 に記録する。各試行で prompt が継続することも確認する。現時点ではこの fixture の計測結果は無く、別の smoke probe を証拠として扱わない。

同一の Claude session で通知ありと通知なしの prompt がそれぞれ継続することを確かめる。試行ごとに session ID と hook ID を揃えて開始・応答の記録を対応させる。通知ありでは `additionalContext` の固定 1 行を確認し、返事本文・ID が出ないこと、inbox body / `.claim` / terminal / ACK / DB の前後状態が変わらないことを照合する。通知なし fixture と host の起動失敗・timeout 条件でも prompt が継続することを記録する。host が終了させた process に exit 0 は要求しない。timeout の確認は機器負荷と host 側の timeout 設定を併記し、意図しない負荷増幅や同一 hook の retry は行わない。

計測は #1938 の様式に合わせ、hook host 開始から Claude が応答を受けるまでを測る。設定 timeout は literal 5 秒とし、設定値、wall time、終了結果 (response / timeout / error)、CPU・memory 等の負荷条件、OS / VS Code Claude / Node 版、fixture 状態を記録する。5 秒以内完走は実測前に保証せず、観測値を「上限を保証した」と読み替えない。任意 hook の timeout budget 文書改訂は別の pair-freeze とし、本契約から `REQUIRED` entry を追加しない。

## 5. Red / Green への引き渡し

この PR は契約と oracle の draft のみである。Red action tests、test code の追加、実装、候補 ID の正式 ID への昇格は別 PR とする。control 最終判断 A、宛先キー・通知世代・必須 `entry.id`、`inboxFileStem` による path 導出、entry / claim / terminal の stat 規則、current-session clear 範囲、許容 Stop race、固定文、5 秒 timeout は決定済み。本書は `status: draft` のままとし、control lane が準備・回収・判定する Windows host fixture の実証跡を得るまで pair-freeze しない。任意 hook timeout budget 文書の改訂は別 pair-freeze とし、本契約に新しい `REQUIRED` entry を足さない。

Red では各候補に対応する独立した負例を追加し、候補 003 / 004 は notification metadata / locator、entry / claim / terminal の stat、抑止状態を観測する。Green では `.claude/settings.json` への配線と同時に `.claude/CLAUDE.md` の hook 一覧を更新し、`U-RDRIFT-007` も確認する。`U-CGENI-010` は Green で正式改訂し、旧 oracle が有効な間は「全 consumer 設定に hook が必須」と先取りしない。test code を含む PR で初めて Red を実行し、ここに記した oracle と変異を照合する。
