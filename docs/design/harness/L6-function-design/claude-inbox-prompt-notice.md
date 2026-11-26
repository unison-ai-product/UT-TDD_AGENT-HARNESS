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

> **L6 contract marker**: Claude Code の `UserPromptSubmit` で、現在の会話セッション宛ての未読返事があるとき、入力を止めずに追加文脈を一度通知する契約である。契約と対の oracle は `docs/test-design/harness/L7-claude-inbox-prompt-notice-test-design.md` が定める。本書は起草中で、#1970 の宛先別通知状態と重複抑止の詳細判断が未決のため凍結しない。

# Claude inbox の prompt 通知 — 関数設計 (issue #1970)

## 1. 目的

hybrid の相手 runtime が共有 inbox に返事を書いても、作業中の Claude 会話がその返事に気づかず待ち続けることがある。既存の `Stop` による `claude-memory-wake` は VS Code の Claude を対象にした別経路であり、現在の `UserPromptSubmit` には受信通知がない。各ユーザー入力の開始時に、現セッション宛ての未読返事の有無だけを短く知らせる。

本契約は通知だけを対象とする。返事本文を注入・表示せず、配送、claim、ACK、作業再開の判断は既存の所有境界に残す。

## 2. 判断と前提

### 2.1 #1970 の判断依頼

Codex lane は [#1970 の判断依頼](https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/1970#issuecomment-7190275345) で次を提示した。

| 案 | 得るもの | 失うもの |
|---|---|---|
| A (推奨): 通知専用の宛先別メタデータと同一セッションの重複抑止記録を認める | 既存 inbox 本文・claim・terminal を開かず、現セッションへの通知を重複抑止できる | 通知専用ローカル状態を許す必要がある |
| B: あらゆる状態への書き込みを禁じる厳密 stat-only | hook が完全 read-only になる | 現行保存形式では宛先と通知済み状態を区別できず、「一度だけ」を満たせない。凍結できない |

このドラフトは A を推奨案として扱い、通知専用状態への読書きを契約境界に含める。メタデータの形式、配置、dedup key / 単位、同一 session での新着・clear・resume 時の再通知規則は決定しない。これらは #1970 の判断を受けて本書と L7 を同時に改訂する。

### 2.2 既存境界

- 対象は信頼された project workspace で起きた Claude Code の現在の `UserPromptSubmit` と、非空の現在 session ID である。現在 hook event の検証、trusted workspace / project scope、session ID の検証は既存受信・wake 経路の境界に合わせる。
- `isClaudeMemoryWakeTarget` が持つ VS Code 限定条件と disable environment variable の境界を保つ。prompt 通知を理由に通常の terminal Claude を wake 対象へ広げたり、disable を迂回したりしない。
- 既存 inbox entry の JSON 本文を読まず、entry ID / raw ID を出力せず、本文や本文由来の情報を追加文脈へ含めない。`.claim`、terminal、ACK、receipt も読まず、作成・更新・削除しない。
- 未読判定は通知専用の宛先別 metadata に限る。stat が使えない、metadata が無い・不正・未対応、event / session / workspace 入力が不正、または対象が空である場合は通知しない。欠損や不正から宛先・未読・通知成功を推測しない。
- 通知 metadata は通知と同一セッションの重複抑止にだけ使う。delivery / ACK の正本や認可情報として使わない。保存形式、保存先、原子的更新方式、寿命、session と unread state の結合方法は本書では定めない。
- `requireProjectMemoryRoot` は Git を起動し得る。prompt ごとの外部 Git / GitHub / API 起動を新設せず、これを無条件に呼ぶことを実装前提にしない。既存の trusted workspace / root 検証の意味を保ち、hot path は通知 metadata の確認に限定する。
- 共通 inbox の保存先は、worktree の場所だけでなく、コミット済みの project ID と Git 共通ディレクトリで決まる。launcher の `UT_TDD_REPO_ROOT` は worktree の場所を示す。起動元から通知用の宛先を確定できない場合は無通知とする。通知側で事前に検証した宛先を参照する案は §8 で扱う。[project memory の保存先](../../../../src/memory/project-memory-root.ts)

## 3. 通知の契約

`UserPromptSubmit` が現在 session 宛ての未読返事を確認し、該当通知状態がまだ通知済みでないと判定したときだけ、Claude Code の追加文脈として次の固定 1 行を返す。

> このセッション宛てに未読の返事があります。

この通知は存在を知らせるだけであり、entry 数、entry ID、宛先 ID、返事本文、sender、PR / review 情報を示さない。受信者が既存の手順で inbox を読むことや、何らかの作業を開始することを命じない。

通知成功の応答は、stdout に有効な JSON を 1 個出し、exit 0 で終了する。その JSON は `hookSpecificOutput.hookEventName` を `UserPromptSubmit` とし、`hookSpecificOutput.additionalContext` に前記の固定 1 行だけを持つ。別の context、`systemMessage`、decision control、追加行を出さない。

通知しない場合は stdout を空にし、exit 0 で終了する。入力の欠落・不正・未対応、scope / session 不一致、空の対象、metadata の欠落・不正、stat / metadata I/O 失敗、重複済み判定や捕捉した内部エラーでは fail-open で通知しない。host が起動に失敗した場合や process を timeout で打ち切った場合も、Claude は prompt 入力を継続する。

この hook は助言通知であり、Claude の判断や prompt 処理を制御しない。`decision`、`block`、`continue: false`、exit 2、`onFailure: "block"` を返さない。

## 4. 時間予算と計測

host timeout の提案値は 5 秒とし、`docs/design/harness/L6-function-design/hook-timeout-budget.md` の `hookTimeoutSeconds` 正本へ追加する。値の前例は既存 Claude `SubagentStop` hook の 5 秒であり、この前例だけで完走を保証したり実測済みとみなしたりしない。既存 consumer 設定が未更新でも動作を壊す必須 doctor / setup-smoke 条件にはしない。

hook の時間は Node / helper の部分時間ではなく、#1938 と同じ host の hook 開始から応答完了までで測る。負荷条件と計測対象を分け、timeout 以内に常に完了するという未計測の主張をしない。5 秒を超える場合は fail-open でその回の通知を落とし、同じ入力で外部 process を起動して retry しない。

## 5. 配布と互換性

- 新しい `UserPromptSubmit` hook は source Claude 設定、Pack が生成する Claude 設定、および adapter mirror の対応面に配線する。実装する entrypoint / 設定形は L7 で固定する。
- Codex に `UserPromptSubmit` 相当 hook を追加しない。既存の Codex hook 群、`PostToolUse`、watcher、Stop の wake window / timeout、配布済み sender の通知契約は変更しない。
- 構造ファイルが既に存在する導入先では、setup は既存設定を無断で上書きしない。更新済み設定には通知 hook が配るが、旧設定が本機能なしで動作することを維持する。missing hook を理由に既存導入先を hard-fail させない。
- `.claude/settings.json` への追加は既存 `CANDIDATE-U-CGENI-010` の「生成物に `UserPromptSubmit` hook がない」という旧 oracle と意図的に衝突する。#1970 の L6/L7 で互換境界を正式改訂し、Green で設定配線と同じ変更として該当 assertion を更新する。凍結まで旧 assertion を維持する。

## 6. 対象外

- inbox 本文・raw ID の読み取り、本文の追加文脈への挿入、claim / terminal / ACK / receipt の処理
- sender CLI、送信形式、配送・ACK custody、memory DB schema、既存 inbox の移行
- Stop hook の挙動、wake window 延長、既存 `claude-memory-wake` の eligibility 変更
- Codex 設定への新 hook、watcher / daemon / polling process、毎 prompt の外部 GitHub / API 呼び出し
- 既存 consumer の構造設定を強制更新する仕組み

## 7. DbC と oracle

| 契約点 | 不変条件 |
|---|---|
| pre | 現在の Claude `UserPromptSubmit` event、非空 session ID、trusted workspace / project scope が検証される。対象判定は既存 `isClaudeMemoryWakeTarget` の VS Code 条件と disable env 条件を維持する |
| pre | unread 判定に使う情報は現在の受信 session 宛ての通知専用 metadata だけであり、inbox entry の本文を開かない |
| post (通知) | 未読かつ通知可能な場合だけ、成功形 JSON と固定 1 行の `additionalContext` を出し exit 0 とする |
| post (無通知) | 入力不正・未対応・空・不一致・metadata / stat error・内部エラー・既通知では stdout 空、exit 0 とする。host の起動失敗や timeout は host の入力継続で判定する |
| invariant | 通知に body、entry count、raw ID、送信者や review 内容を含めない。entry 本文・claim・terminal・ACK は読み書きせず、delivery state を変えない |
| invariant | hook は通知判定以外の作業を起こさず、外部 Git / GitHub / API を prompt ごとに起動しない。予算は host 開始から応答まで 5 秒以内を目標にする |
| oracle | `CANDIDATE-U-CPNOTICE-001`〜`009` は対の L7 に定める。009 は配布設定で起動する hook process の境界を検査する。実 Windows / VS Code の host 応答は別に観測する |

候補 oracle と本契約の対応は次のとおり。候補の具体的な test level / fixture / 反例は L7 が定める。

| 候補 oracle | L6 の対象 |
|---|---|
| `CANDIDATE-U-CPNOTICE-001` | §3 の有効通知時の固定出力・exit 0 |
| `CANDIDATE-U-CPNOTICE-002` | §2.2・§3 の空 inbox、入力不正 / 未対応、通知なし時の stdout 空・exit 0 |
| `CANDIDATE-U-CPNOTICE-003` | §2.2・§7 の本文 / claim / terminal / ACK を読まないこと、foreign scope を通知対象にしないこと |
| `CANDIDATE-U-CPNOTICE-004` | §2.1・§8 の同一 session 重複 / 並行抑止 (具体的 dedup 単位は未決) |
| `CANDIDATE-U-CPNOTICE-005` | §2.1・§8 の新着 / clear / resume 時の再通知範囲 (未決) |
| `CANDIDATE-U-CPNOTICE-006` | §3・§4 の失敗・timeout 時 fail-open |
| `CANDIDATE-U-CPNOTICE-007` | §5 の fresh / legacy Pack 設定互換と Codex に hook を加えないこと |
| `CANDIDATE-U-CPNOTICE-008` | §4・§7 の 5 秒 host 上限、hot-path 制約 |
| `CANDIDATE-U-CPNOTICE-009` | §3 の設定された hook command の process 境界と `additionalContext` の出力判定。実 host は L7 §4 で検証する |

## 8. 未決事項

以下は設計判断の採択後に L6 と対の L7 を同時に改訂する。ここを実装者の推測で埋めない。

- 通知 metadata の schema、配置、更新 / 削除方法、障害復旧
- linked worktree と通常の導入先で、宛先の検証結果を同期 hook の外から渡す場合の供給元、有効範囲および失効条件
- 重複抑止の単位と、同一 session の複数 prompt / 同時 prompt の競合規則
- 新着、既読・clear、session resume 後に再通知する条件
- `CANDIDATE-U-CPNOTICE-005` が固定する re-notification の具体的 oracle
