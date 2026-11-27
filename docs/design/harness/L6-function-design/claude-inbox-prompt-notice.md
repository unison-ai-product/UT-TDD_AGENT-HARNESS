---
layer: L6
artifact_type: design_doc
status: draft
sub_doc: function-spec
artifact_role: topic_claude_inbox_prompt_notice
pair_artifact: docs/test-design/harness/L7-claude-inbox-prompt-notice-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1970
---

> **L6 contract marker**: Claude Code の `UserPromptSubmit` で、現在の会話セッション宛ての未配送の返事があるとき、入力を止めずに追加文脈を一度通知する契約である。契約と対の oracle は `docs/test-design/harness/L7-claude-inbox-prompt-notice-test-design.md` が定める。control が決めた未配送の観測点と宛先別の通知方式を反映した。Windows host の計測証跡を収録してから凍結する。

# Claude inbox の prompt 通知 — 関数設計 (issue #1970)

## 1. 目的

hybrid の相手 runtime が共有 inbox に返事を書いても、作業中の Claude 会話がその返事に気づかず待ち続けることがある。既存の `Stop` による `claude-memory-wake` は VS Code の Claude を対象にした別経路であり、現在の `UserPromptSubmit` には受信通知がない。各ユーザー入力の開始時に、現セッション宛てのまだ受け取っていない返事を短く知らせる。

本契約は対話中の気づきを対象とする。Stop 側の最大15分の待機は対象外である。対象は VS Code の Claude とし、配送、claim、ACK、作業再開の判断は既存の経路が所有する。

## 2. 判断と前提

### 2.1 採択した通知方式

通知専用の宛先別 metadata と通知済み記録を採用する。[control の設計判断](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/2016#issuecomment-7207152183)

- 宛先キーは検証済み project namespace と、Claude の正規 session ID の組とする。同じ project 内の別 session、別 project の同じ session ID は別の宛先とする。
- `publishClaudeInboxEntry` が、宛先を確定して新規 entry を公開したときに、追加の通知 metadata を作る。既存 entry の同じ publish の再試行で通知世代を増やさない。旧い sender が書いた metadata の無い返事は prompt では無通知となり、既存の配送経路で扱う。
- 同じ宛先では前回通知時より新しい世代を一度だけ通知する。次の入力までに複数届けば固定の一行にまとめる。宛先の通知専用状態に `wx` で排他作成を一度試し、同時入力で負けた側は無通知とする。
- 同じ session ID の resume は通知済み世代を保持する。claim・terminal 化・clear は新しい通知世代を作らない。同じ ID で clear した場合も同じ宛先の通知済み世代を維持する。別 ID で開始した場合は別の宛先になり、以前の通知済み状態を引き継がない。

### 2.2 宛先を確定する境界

- `isClaudeMemoryWakeTarget` の VS Code 起動と無効化設定の条件を受け継ぐ。`hook_event_name` と `session_id` が対象 event と現在の正規 session を示す場合に通知を評価する。
- `SessionStart` が既存の project 検証で namespace と共有 runtime 保存先を確定し、現在の session ID と結び付けた宛先記録を worktree 配下の固定位置に保存する。resume 時は同じ session ID の記録を検証して更新する。
- `UserPromptSubmit` は stdin の `session_id` から worktree の宛先記録を導出し、その適用範囲を照合する。記録欠落・不正、session / workspace 不一致、通知対象の stat や通知済み記録の更新失敗では入力を通し無通知とする。
- `UT_TDD_REPO_ROOT` は worktree の場所を示す。共有 inbox の宛先はコミット済み project ID と Git 共通ディレクトリの検証結果を参照する。prompt ごとの外部 Git / GitHub / API、DB、受信箱の走査は範囲外とする。[project memory の保存先](../../../../src/memory/project-memory-root.ts)
- 受信箱の entry JSON、claim、terminal、ACK、receipt の内容は開かず、配送の状態を書き換えない。通知 metadata と通知済み記録は通知にのみ使う。

### 2.3 未配送の観測

通知 metadata が指す候補は一件で、必須項目は宛先キー、通知世代、`entry.id` である。現在の宛先と結び付く metadata だけを受け付ける。元 entry、`.claim`、`.terminal.json` のパスは、既存と同じ共有 `inboxFileStem(entry.id)` を通し、検証済みの runtime root 内に導出する。命名を hook 内に再実装せず、ファイルを走査しない。

元 entry は検証済みの runtime root 内の通常ファイルとして存在し、対応する claim と terminal がともに欠落した場合に未配送と判定する。存在確認の失敗を欠落として扱うのは、ファイルが無いことを示す結果に限る。claim の中身は参照しないため、壊れた claim の存在でも無通知となる。壊れた claim が残る候補は通知が出ないままになり得る。欠落・不一致・I/O 異常で判定できない場合の誤りは無通知側に限る。[境界判断](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/2016#issuecomment-7207709648)

複数の stat は一つの取引にならない。Stop と競合して状態が変わった場合、その回で確定できない通知は落とし、次の prompt で再観測する。判定結果は観測時点のものである。通知は、宛先の排他内で既通知世代を照合し、先に通知済み世代を保存できた場合に出す。保存直後に process が異常終了した場合は、その世代の通知が欠ける。

## 3. 通知の契約

`UserPromptSubmit` は §2.3 で現 session 宛ての通知可能な未配送の返事を確認したとき、Claude Code の追加文脈へ次の固定1行を返す。

> このセッション宛てに、まだ受け取っていない返事があります。

この通知は存在を知らせるだけであり、entry 数、entry ID、宛先 ID、返事本文、sender、PR / review 情報を示さない。受信者が既存の手順で inbox を読むことや、何らかの作業を開始することを命じない。

通知成功の応答は、stdout に有効な JSON を 1 個出し、exit 0 で終了する。その JSON は `hookSpecificOutput.hookEventName` を `UserPromptSubmit` とし、`hookSpecificOutput.additionalContext` に前記の固定 1 行だけを持つ。別の context、`systemMessage`、decision control、追加行を出さない。

通知しない場合は stdout を空にし、exit 0 で終了する。入力の欠落・不正・未対応、scope / session 不一致、空の対象、metadata の欠落・不正、stat / metadata I/O 失敗、重複済み判定や捕捉した内部エラーでは fail-open で通知しない。host が起動に失敗した場合や process を timeout で打ち切った場合も、Claude は prompt 入力を継続する。

この hook は助言通知であり、Claude の判断や prompt 処理を制御しない。`decision`、`block`、`continue: false`、exit 2、`onFailure: "block"` を返さない。

## 4. 時間予算と計測

host timeout は5秒とし、本契約と L7 の oracle に固定する。既存 `hook-timeout-budget.md` の `REQUIRED` の7項目は必須 hook の一覧である。任意 hook の扱いを共有の予算契約へ加える改訂は別の pair-freeze で行う。

#1938 と同じく、Windows の Claude host 側で hook 開始から応答までを測り、L7 §4 に凍結前の証跡を残す。host が打ち切った回は通知を落とし、Claude は入力を継続する。同じ入力を外部 process で retry しない。凍結前は隔離 fixture で host 応答を検査し、Pack に配布した動作の受入は実装後に記録する。

## 5. 配布と互換性

- 新しい `UserPromptSubmit` hook は source Claude 設定、Pack が生成する Claude 設定、および adapter mirror の対応面に配線する。source `.claude/settings.json` を配線するときは `.claude/CLAUDE.md` の hook 一覧も同じ Green で更新する。対応する oracle は `U-RDRIFT-007` である。
- Codex に `UserPromptSubmit` 相当 hook を追加しない。既存の Codex hook 群、`PostToolUse`、watcher、Stop の wake window / timeout、配布済み sender の操作は既存契約が扱う。sender 側の追加は §2.1 の通知 metadata の投影に限る。
- 構造ファイルが既に存在する導入先では、setup は既存設定を無断で上書きしない。更新済み設定には通知 hook が配るが、旧設定が本機能なしで動作することを維持する。missing hook を理由に既存導入先を hard-fail させない。
- `.claude/settings.json` への追加は既存 `U-CGENI-010` の「生成物に `UserPromptSubmit` hook がない」という旧 oracle と意図的に衝突する。#1970 の L6/L7 で互換境界を正式改訂し、Green で設定配線と同じ変更として該当 assertion を更新する。凍結まで旧 assertion を維持する。

## 6. 対象外

- inbox 本文・raw ID の読み取り、本文の追加文脈への挿入、prompt hook による claim / terminal / ACK / receipt の変更
- sender CLI、送信形式、配送・ACK custody、memory DB schema、既存 inbox の移行
- Stop hook の挙動、wake window 延長、既存 `claude-memory-wake` の eligibility 変更
- Codex 設定への新 hook、watcher / daemon / polling process、毎 prompt の外部 GitHub / API 呼び出し
- 既存 consumer の構造設定を強制更新する仕組み

## 7. DbC と oracle

この節のシグネチャは Claude Code の hook process protocol を記述する記法である。実装関数名、export API、内部の関数分割を定めない。

| Function | Signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| Claude `UserPromptSubmit` hook protocol | `UserPromptSubmit(event, session, workspace) => ClaudeHookProcessResult` | event が現在の `UserPromptSubmit` であり、session が非空の現 session ID、workspace が trusted project scope を表す場合に限って通知を評価する。宛先は `SessionStart` が確認して記録する。target 条件は既存 `isClaudeMemoryWakeTarget` の VS Code 条件と disable env 条件を保つ | 現 session 宛ての未配送候補があり未通知なら exit 0 と固定形 JSON stdout。その他の通常結果は exit 0・stdout 空。host の launch failure / timeout は hook process result ではなく host 側の入力継続で扱う | 通知の候補は宛先別 metadata から判断する。entry 本文・claim・terminal・ACK・receipt の内容を開かず、本文・raw ID を出力せず、配送の状態を変えない。prompt ごとに外部 Git / GitHub / API / DB を起動しない | `CANDIDATE-U-CPNOTICE-001`〜`009`。詳細な trace は下表 |

`ClaudeHookProcessResult` は protocol 上の観測値で、hook の応答を `exitCode` と stdout bytes で表す。成功時 stdout は JSON object 1 個だけで、その `hookSpecificOutput.hookEventName` は `UserPromptSubmit`、`hookSpecificOutput.additionalContext` は §3 の固定 1 行である。無通知時 stdout は空とする。両方とも exit code は 0。起動失敗と host timeout はプロセスが結果を返せない場合を含むため、unit result に合成せず host-level coverage とする。

候補 oracle と本契約の対応は次のとおり。候補の具体的な test level / fixture / 反例は L7 が定める。

| 候補 oracle | L6 の契約点 | L7 の追跡先 |
|---|---|---|
| `CANDIDATE-U-CPNOTICE-001` | §3、protocol post: 有効通知の固定出力・exit 0 | L7 §3、unit / hook-process fixture |
| `CANDIDATE-U-CPNOTICE-002` | §2.2・§3、protocol pre/post: 空・不正・未対応時の無通知 | L7 §3、unit / hook-process fixture |
| `CANDIDATE-U-CPNOTICE-003` | §2.2・protocol invariant: 本文等を読まず、foreign scope を通知対象にしない | L7 §2〜§3、I/O と状態差分の観測 |
| `CANDIDATE-U-CPNOTICE-004` | §2.1: Stop との競合、次 prompt での再観測、同じ ID の resume で再通知しないこと | L7 §3、順次・同時 hook-process・競合後の再観測 fixture |
| `CANDIDATE-U-CPNOTICE-005` | §2.1・§2.3: resume / clear 時の宛先キーと通知済み世代の保持 | L7 §3、resume・clear の宛先キー保持 fixture |
| `CANDIDATE-U-CPNOTICE-006` | §3・§4、protocol post と host-level failure: fail-open | L7 §3〜§4、例外 fixture と host 起動失敗 / timeout |
| `CANDIDATE-U-CPNOTICE-007` | §5: fresh / legacy Pack 設定と Codex 非追加 | L7 §3、source / Pack / mirror 構成検査 |
| `CANDIDATE-U-CPNOTICE-008` | §4・protocol invariant: 5秒の host 上限と hot-path 制約 | L7 §3、設定・依存境界検査 |
| `CANDIDATE-U-CPNOTICE-009` | §3・protocol post: 配布設定経由の process 出力 | L7 §3 の子 process 検査、実 Windows / VS Code host は L7 §4 の別証跡 |

## 8. 凍結前の証跡

L7 §4 の隔離 runtime root で Windows VS Code の Claude host 応答を計測する。control が fixture と計測の判定を担当し、実拡張での prompt 送信は PO が担当する。L6/L7 は計測結果を収録してから凍結する。
