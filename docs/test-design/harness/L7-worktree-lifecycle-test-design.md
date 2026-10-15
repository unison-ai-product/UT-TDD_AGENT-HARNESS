---
title: "L7 worktree lifecycle test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: draft
updated: 2026-10-15
---

# worktree とブランチのライフサイクル テスト設計 (issue #1069)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/worktree-lifecycle.md` である。本書はその §3 状態遷移、§4 保持記録、§6 削除前の安全条件、§7 退避、§8 fail-open / fail-close を検証する oracle を定義する。

この pair-freeze では候補 ID (`CANDIDATE-U-WTLIFE-*`) だけを宣言する。Red は後続 PR で、設計保護 gate (L6 `design-protection-diff-gate.md` §10.3) と同じ順序にする: (1) Red のテスト (`it.fails`) を候補 ID で引用して入れる、(2) 正式 ID `U-WTLIFE-*` への昇格を src/ を含まない PR で入れる、(3) 実装 PR で `it.fails` を `it` に戻して Green にする。

## 2. fixture

- 判定 (`classifyTarget` / `evaluateDeletion` / `planRun`) は、git の観測値 (facts)、保持記録、現在時刻、設定を直接渡す純粋関数の入力で作る。実 repo は使わない。
- adapter の行 (退避・junction・ロック・`pr merge` の後処理) は、一時ディレクトリに作った実 git repo と worktree、または fake の git / fs port で観測する。実 repo の worktree は削除しない。
- junction の行は Windows 実環境で `mklink /J` で作り、primary 役の一時ディレクトリの `node_modules` に印のファイルを置いて、remove 後にその印が残ることを観測する。非 Windows では skip でなく別 fixture (symlink) に置き換えず、skip を明示して Windows の CI で実行する。
- 時刻は固定の `now` を渡す。日数は既定 (stale 7 / 警告 3 前 / 猶予 2 / 退避 90 / 稼働中 6 時間)。

## 3. Candidate oracle matrix

「殺す mutation」は、その行の規則を 1 本だけ壊した変異である。

### 3.1 削除してはいけないケース (must-not-delete)

| Candidate | 観測 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| `CANDIDATE-U-WTLIFE-001` | PR が MERGED だが、branch 先端が `origin/main` に含まれない (merge 後に push された commit)。退避 ref は未作成 | `allow: false`、`tip_not_in_main`。branch と worktree は残る。退避なしでは消さない (#707) | PR の MERGED だけで削除する / 含有判定を `origin/main` でなくローカル `main` で行う |
| `CANDIDATE-U-WTLIFE-002` | 先端が main に含まれない branch で、`reaped` により退避を作れた場合 | 退避 ref を作り、読み戻して oid が一致してから削除する。archive ref が指す commit は元の先端を含む | 退避より先に削除する / 読み戻しを省く |
| `CANDIDATE-U-WTLIFE-003` | worktree 名が `ut-review-*` (期限切れ・merged 相当の他条件が全て満たされていても) | 全状態で対象外。`worktree prune --apply` でも `pr merge` の後処理でも消さない。dry-run の一覧にも「消せる」に出さない | 名前でなく path の一部一致で判定する / `--apply` だけ除外を忘れる |
| `CANDIDATE-U-WTLIFE-004` | 6 時間以内に `logs/HEAD` が更新された worktree に `worktree prune --apply` | `active_recently` で消さない。6 時間を超えたものは消せる (境界: 360 分ちょうど) | ガードを `pr merge` の後処理にだけ付ける / 境界を逆にする |
| `CANDIDATE-U-WTLIFE-005` | `node_modules` が directory junction の worktree を削除する。junction の先 (primary 役 dir) に印ファイルがある | junction は link だけが外れ、remove 後も primary の `node_modules` と印ファイルが残る。junction を辿る削除が起きない | junction を外さず `worktree remove` へ進む / 外した後の不在確認を省く |
| `CANDIDATE-U-WTLIFE-006` | junction の unlink に失敗する fixture (権限なし/ファイル掴み) | その対象は remove せず、`junction_unresolved` を記録して先へ進む。remove は呼ばれない | unlink 失敗を無視して remove を呼ぶ |
| `CANDIDATE-U-WTLIFE-007` | remove 後に primary の `node_modules` が欠けた fixture | 以降の対象の処理を全て止め、監査ログに `error`。run は非 0 | 欠落を検知しても次の対象へ進む |
| `CANDIDATE-U-WTLIFE-008` | Windows でファイルを他プロセスが掴んでいて `worktree remove` が `EBUSY` / `EPERM` | `error:locked` を監査ログに記録して**その対象だけ**先へ進む。再試行しない。`--force` を使わない | ロックを `--force` で突破する / 1 件の失敗で run 全体を止める |
| `CANDIDATE-U-WTLIFE-009` | 削除候補が 25 件ある `worktree prune --apply` | 削除は 20 件で止まり、残り 5 件は `deferred`。次の run で処理される | 上限を dry-run にだけ適用する / 上限超過を error 終了にして 20 件も消さない |
| `CANDIDATE-U-WTLIFE-010` | `retained` で期限が未来、または回収条件が未成立の branch | 消さない (`retained`)。他の条件が全て満たされていても | 保持記録を参照せず merge 済みなら消す |
| `CANDIDATE-U-WTLIFE-011` | 退避 ref の作成に失敗する fixture (`update-ref` が失敗) | 削除を行わない (S9)。branch と worktree は残り、`archive_failed` を記録する | 退避失敗を警告にして削除を続行する |
| `CANDIDATE-U-WTLIFE-012` | 退避 ref を作ったが、読み戻した oid が作った oid と一致しない fixture | 削除を行わない | 読み戻し検証を省く |
| `CANDIDATE-U-WTLIFE-013` | 現在の cwd がその worktree 配下 | `current_cwd` で消さない | cwd を見ない |
| `CANDIDATE-U-WTLIFE-014` | primary checkout、`git worktree list` に未登録の dir、`C:/dev` 外の path | いずれも消さない | 登録の有無を見ない / primary を除外し忘れる |
| `CANDIDATE-U-WTLIFE-015` | `pr merge` の後処理で、未コミットの変更がある (`merged` 状態) worktree | 退避せず消さない (`dirty_on_merged`)。`reaped` の同条件では退避して消す (028) | merged でも dirty を退避して消す |
| `CANDIDATE-U-WTLIFE-016` | 監査ログへの追記が失敗する fixture | その run の削除を行わない | 追記失敗を握りつぶして削除する |
| `CANDIDATE-U-WTLIFE-017` | 判定前の `git fetch origin` が失敗する fixture | 削除しない (`fetch_failed`) | fetch 失敗時に古い `origin/main` で判定する |
| `CANDIDATE-U-WTLIFE-018` | 保持記録のファイルが壊れた JSON | 何も削除しない。doctor は warn で「保持記録が壊れている」を出す | 壊れたら空と見なして全部消せる扱いにする |
| `CANDIDATE-U-WTLIFE-019` | 回収条件 (`issue_closed:#N`) の `gh` 観測が失敗 | 条件不成立と見なして消さない | 観測失敗を成立と見なす |

### 3.2 状態遷移と猶予

| Candidate | 観測 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| `CANDIDATE-U-WTLIFE-020` | 期限の 3 日前の時刻 (境界を挟む 3 日 + 1 分前と 3 日ちょうど) | 3 日 + 1 分前は `retained`、3 日ちょうど以降は `warning` | 警告を期限当日にだけ出す / 境界を逆にする |
| `CANDIDATE-U-WTLIFE-021` | 期限を過ぎた直後、期限 + 1 日、期限 + 2 日ちょうど、期限 + 2 日 + 1 分 | 過ぎた直後と +1 日は `expired` (消さない)、+2 日 + 1 分から `reaped` (消せる) | 猶予を 0 にする / 猶予後も `expired` のまま |
| `CANDIDATE-U-WTLIFE-022` | 回収条件が成立した時刻から 1 日と 2 日 + 1 分 | 日付期限と同じく、成立から猶予 2 日で `reaped` | 条件型だけ猶予を持たない |
| `CANDIDATE-U-WTLIFE-023` | 警告に応答が無いまま猶予が切れた branch に `prune --apply` (無音) | 退避してから自動削除され、監査ログに削除と退避が記録される | 無音を保持と見なして永遠に残す |
| `CANDIDATE-U-WTLIFE-024` | 延長 (`extend`): 理由と新しい期限を渡す / 理由なし / 新しい期限が現在より過去 | 理由と未来の期限があるときだけ受理され、`extensions` に `{at, reason, previous_due, new_due, by}` が追記される (回数が履歴の length)。拒否時は記録が変わらず非 0 | 履歴を上書きする / 理由なしを受理する |
| `CANDIDATE-U-WTLIFE-025` | 延長後の時刻での状態 | 新しい期限に基づき `retained`/`warning` に戻り、`reaped` にならない | 延長しても元の期限で回収する |
| `CANDIDATE-U-WTLIFE-026` | 保持記録の作成 (`retain`): reason 空 / holder 空 / due が 0 個 / due が 2 個 | いずれも非 0 で終了し、記録を作らない。reason・holder・due が揃ったときだけ受理 | 理由なしの保持を認める |
| `CANDIDATE-U-WTLIFE-027` | 保持記録が無く未 merge で 6 日 23 時間、7 日、の branch | 6 日台は `active`、7 日から `stale`。`stale` は doctor に警告され、自動削除されない | `stale` を自動削除する |

### 3.3 退避と復元

| Candidate | 観測 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| `CANDIDATE-U-WTLIFE-028` | `reaped` の worktree に未コミットの変更 (追跡ファイルの変更と未追跡ファイルの両方) | `refs/ut-tdd/archive/<branch>` に commit が作られ、その tree に追跡の変更と未追跡ファイルの両方が含まれる。worktree と stash リストは退避前後で変わらない (`git stash list` が増えない)。そのあと worktree が外れる | 未追跡ファイルを退避から落とす / stash push を使う |
| `CANDIDATE-U-WTLIFE-029` | main に含まれない commit と未コミット変更の両方 | 1 つの ref に載り、その commit の親が元の先端。commit も変更も復元できる | 2 つの ref に分けて片方を落とす |
| `CANDIDATE-U-WTLIFE-030` | 同名の archive ref が既にある | 上書きせず `@<timestamp>` 付きの別名で退避する | 既存の退避を上書きする |
| `CANDIDATE-U-WTLIFE-031` | 復元: 退避 ref から `git worktree add <path> <ref>` を実行 | 作業ツリーに退避時の追跡の変更と未追跡ファイルが復元される | ref が指す tree が空 |
| `CANDIDATE-U-WTLIFE-032` | 退避後の監査ログ・SessionStart の通知 | archive ref 名と復元コマンドが出力される | 退避先を通知しない |
| `CANDIDATE-U-WTLIFE-033` | 退避から 89 日 23 時間と 90 日 + 1 分の archive ref に `prune --apply` | 90 日を超えたものだけ削除され、89 日台は残る。基準は監査ログの退避イベントの `at` | 90 日未満も消す / commit date を基準にする |

### 3.4 実行面と fail-open

| Candidate | 観測 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| `CANDIDATE-U-WTLIFE-034` | `pr merge` で merge は成功し、後処理が例外を投げる fixture (git が落ちる、ロック、保持記録の破損) | `runPrMerge` の結果 `ok` と終了コード 0 は変わらず、出力に `cleanup=error:<reason>` が出る。merge は取り消されない | 後処理の失敗で `pr merge` を失敗にする |
| `CANDIDATE-U-WTLIFE-035` | `pr merge` が DENY / `merge_failed` の場合 | 後処理を呼ばない (branch と worktree は残る) | merge に失敗しても片付ける |
| `CANDIDATE-U-WTLIFE-036` | 安全な merged branch (先端が main に含まれ、保持なし、dirty なし) に `pr merge` | worktree が外れ、local branch が消え、`cleanup=removed` が出る。remote branch には触れない | 後処理が何もしない / remote branch を消す |
| `CANDIDATE-U-WTLIFE-037` | `worktree prune` (dry-run、既定) | 「消せる / 保持中 (理由・期限) / 消せない (理由)」が列挙され、branch・worktree・ref・保持記録・監査ログが一切変わらない。`--apply` と同じ判定関数の結果と一致する | dry-run が副作用を持つ / dry-run と apply で判定が別経路 |
| `CANDIDATE-U-WTLIFE-038` | doctor `worktree-retention` に、期限切れ・理由なし・壊れた記録・stale を含む fixture | 全て warn として列挙し、doctor の終了コードを変えない (fail-close しない)。集計行を出す | 警告を fail-close にする / 件数を出さない |
| `CANDIDATE-U-WTLIFE-039` | SessionStart の digest に、`warning` と `expired` の対象がある fixture | `escalationLines` に対象・状態・保持者が載る。対象が無ければ行を足さない。生成が失敗しても session start は落ちない | 失敗で session start を落とす |
| `CANDIDATE-U-WTLIFE-040` | 実行した削除・退避・延長・拒否 | `.ut-tdd/logs/worktree-lifecycle.jsonl` に 1 件ごと 1 行が追記される (`at` / `action` / `branch` / `result` / `reason` / `archive_ref`) | 拒否を記録しない |
| `CANDIDATE-U-WTLIFE-041` | 保持記録を `.ut-tdd/state/worktree-retention.json` に書く / 書き込み途中で失敗する fixture | 書き込みは一時ファイルから rename で原子的。失敗時は元の記録が壊れない。ファイルは untracked (`git check-ignore` が真) | 直接上書きで途中失敗時に壊す |

## 4. 運用

- 各 oracle は Green のあと、L6 の規則を 1 本だけ殺す mutation を手元で入れ (commit しない)、該当の行が fail することを確かめて PR の証跡に残す。001, 005, 011, 034 を最優先で確かめる。
- 必ず削除してはいけないケースの網羅 (001〜019) は、実装 PR の完了条件に含める。1 件でも `it.fails` のままなら merge しない。
- 実 repo の既存 145 worktree / 540 branch に対する実行は、oracle の対象にしない (初回回収は L6 §10 の手順で行い、実行ごとに dry-run を記録する)。
