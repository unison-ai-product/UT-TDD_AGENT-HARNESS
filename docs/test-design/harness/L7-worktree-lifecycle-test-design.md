---
title: "L7 worktree lifecycle test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/worktree-lifecycle.md
status: confirmed
updated: 2026-10-15
---

# worktree とブランチのライフサイクル テスト設計 (issue #1069)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/worktree-lifecycle.md` である。本書はその §3 状態遷移、§4 保持記録、§6 回収前の安全条件と §6.2 回収・§6.3 purge、§7 復元、§8 fail-open / fail-close を検証する oracle を定義する。

この pair-freeze では候補 ID (`CANDIDATE-U-WTLIFE-*`) だけを宣言する。Red は後続 PR で、設計保護 gate (L6 `design-protection-diff-gate.md` §10.3) と同じ順序にする: (1) Red のテスト (`it.fails`) を候補 ID で引用して入れる、(2) 正式 ID `U-WTLIFE-*` への昇格を src/ を含まない PR で入れる、(3) 実装 PR で `it.fails` を `it` に戻して Green にする。

## 2. fixture

- 判定 (`classifyTarget` / `evaluateReap` / `evaluateAutoPurge` / `evaluateConfirmedPurge` / `planRun`) は、git の観測値 (facts)、保持記録、現在時刻、設定を直接渡す純粋関数の入力で作る。実 repo は使わない。
- adapter の行 (trash・junction・ロック・`pr merge` の後処理) は、一時ディレクトリに作った実 git repo と worktree、または fake の git / fs port で観測する。実 repo の worktree は削除しない。
- junction の行は Windows 実環境で `mklink /J` で作り、primary 役の一時ディレクトリの `node_modules` に印のファイルを置いて、reap と purge の後にその印が残ることを観測する。非 Windows では skip でなく別 fixture (symlink) に置き換えず、skip を明示して Windows の CI で実行する。
- 時刻は固定の `now` を渡す。日数は既定 (stale 7 / 警告 3 前 / 猶予 2 / trash 14 日 / 静止 6 時間)。

## 3. Candidate oracle matrix

「殺す mutation」は、その行の規則を 1 本だけ壊した変異である。

### 3.1 動かしてはいけないケース (must-not-reap) と実体を削除してはいけないケース

| Candidate | 観測 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| `CANDIDATE-U-WTLIFE-001` | PR が MERGED だが、branch 先端が `origin/main` に含まれない (merge 後に push された commit) | worktree は trash へ移ってよいが (S2〜S7 を満たせば)、`merged_clean` は偽で local branch は**消さない** (`git update-ref -d` を呼ばない)。自動 purge の対象にならない (#707) | MERGED だけで branch を消す / 含有判定を `origin/main` でなくローカル `main` で行う |
| `CANDIDATE-U-WTLIFE-002` | 欠番 (archive commit の廃止。L6 §12 の 3) | - | - |
| `CANDIDATE-U-WTLIFE-003` | worktree 名が `ut-review-*` (期限切れ・merged 相当の他条件が全て満たされていても) | 全状態で対象外。`worktree prune --apply` でも動かさない。dry-run の一覧にも「消せる」に出さない。`pr merge` の後処理も `merged` の記録を作らない | 名前でなく path の一部一致で判定する / `--apply` だけ除外を忘れる |
| `CANDIDATE-U-WTLIFE-004` | 稼働中ガード (L6 S7) の mtime 側: worktree 配下 (`node_modules` と `.git` を除く) のファイル mtime が (a) 6 時間以内、(b) 360 分ちょうど、(c) 360 分 + 1 秒、(d) 6 時間以内の mtime が `node_modules`/`.git` 配下だけ、の worktree (lease は無し) に `worktree prune --apply` | (a) は `active_recently` で消さない。(b) は消さない、(c) は消せる (境界: 360 分以上で消せる)。(d) は除外対象なので消せる。merged/reaped の別を問わず同じガード | ガードを一部の状態にだけ付ける / 境界を逆にする / `node_modules` の mtime で稼働中と誤判定 |
| `CANDIDATE-U-WTLIFE-005` | `node_modules` が directory junction の worktree を reap し、後に purge する。junction の先 (primary 役 dir) に印ファイルがある | reap は junction を先に外して**不在を確かめてから** rename する。primary の `node_modules` と印ファイルは残る。`git worktree remove` は呼ばれず、junction を辿る列挙・削除が起きない。purge も junction の不在を確かめてから削除する | junction を外さず rename / remove する / 不在確認を省く / rename 前後の primary の確認を省く |
| `CANDIDATE-U-WTLIFE-006` | reap または purge で junction の unlink に失敗する fixture (権限なし/ファイル掴み) | その対象は rename も削除もせず、`junction_unresolved` を記録して先へ進む。worktree は元の path のまま | unlink 失敗を無視して rename / 削除する |
| `CANDIDATE-U-WTLIFE-007` | reap または purge の後に primary の `node_modules` が欠けた fixture | 以降の対象の処理を全て止め、監査ログに `error`。run は非 0 | 欠落を検知しても次の対象へ進む |
| `CANDIDATE-U-WTLIFE-008` | Windows でファイルを他プロセスが掴んでいて reap の rename が `EBUSY` / `EPERM` で失敗する。purge の削除が `EBUSY` になる場合も | reap は**何も変えず**停止し (worktree、admin entry、git の一覧、branch が前後で同一。外した junction は作り直される)、`error:rename_failed` を記録して**その対象だけ**先へ進む。再試行しない。purge は `error:locked` で次回に回す。`--force` と `git worktree remove` を使わない | rename 失敗後に copy+delete へ切り替える / 1 件の失敗で run 全体を止める / junction を作り直さない |
| `CANDIDATE-U-WTLIFE-009` | 回収候補が 25 件ある `worktree prune --apply`。purge 候補が 25 件ある場合も別に | reap は 20 件で止まり、残り 5 件は `deferred`。purge も 20 件で止まる。次の run で処理される | 上限を dry-run にだけ適用する / reap と purge を合算して数える |
| `CANDIDATE-U-WTLIFE-010` | `retained` で期限が未来、または回収条件が未成立の branch | 動かさない (`retained`)。他の条件が全て満たされていても | 保持記録を参照せず merge 済みなら消す |
| `CANDIDATE-U-WTLIFE-011` | 欠番 (archive commit の廃止。L6 §12 の 3) | - | - |
| `CANDIDATE-U-WTLIFE-012` | 欠番 (archive commit の廃止。L6 §12 の 3) | - | - |
| `CANDIDATE-U-WTLIFE-013` | **lease の判定 (L6 S7)**: (a) pid が生存し起動時刻が一致する lease、`updated_at` は 6 時間より古い・mtime も古い、(b) pid が生存で `updated_at` が 6 時間以内、(c) pid が死んでいて `updated_at` が 6 時間より古く mtime も古い、(d) pid が死んでいるが `updated_at` が 6 時間以内、(e) lease が壊れた JSON、(f) lease が読めない (権限なし)、(g) lease が無く mtime が古い、(h) lease が無く mtime が新しい、(i) 呼び出し元の cwd がその worktree 配下 | (a) は `lease_alive` で拒否 (古さに関わらず)。(b) は拒否。(c) は reap できる。(d) は `lease_active` で拒否。(e)(f) は `activity_unknown` で拒否。(g) は reap できる (mtime の静止だけが根拠)。(h) は `active_recently` で拒否。(i) は `current_cwd` でも拒否 (補助) | 生存 pid の古い lease を無視する / 壊れた lease を無いものとして扱う / lease が無いことを静止と見なして mtime を見ない |
| `CANDIDATE-U-WTLIFE-014` | primary checkout、`git worktree list` に未登録の dir、`C:/dev` 外の path | いずれも動かさない | 登録の有無を見ない / primary を除外し忘れる |
| `CANDIDATE-U-WTLIFE-015` | 未コミットの変更がある `merged` の worktree: (a) `pr merge` の後処理、(b) lease と mtime が静止したあとの `worktree prune --apply` | (a) は何も動かさない (`merged` の記録だけ)。(b) は trash へ移り (byte 同一、042)、`merged_clean` は偽 (dirty) なので local branch は消さず、自動 purge の対象にならない (`purge 要確認`) | 後処理で動かす / dirty を `merged_clean` と判定する |
| `CANDIDATE-U-WTLIFE-016` | 監査ログへの追記が失敗する fixture | その run の動かさない | 追記失敗を握りつぶして動かす |
| `CANDIDATE-U-WTLIFE-017` | 判定前の `git fetch origin` が失敗する fixture | 動かさない (`fetch_failed`) | fetch 失敗時に古い `origin/main` で判定する |
| `CANDIDATE-U-WTLIFE-018` | 保持記録のファイルが壊れた JSON | 何も動かさない。doctor は warn で「保持記録が壊れている」を出す | 壊れたら空と見なして全部動かせる扱いにする |
| `CANDIDATE-U-WTLIFE-019` | 回収条件 (`issue_closed:#N`) の `gh` 観測が失敗 | 条件不成立と見なして動かさない | 観測失敗を成立と見なす |

### 3.2 状態遷移と猶予

| Candidate | 観測 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| `CANDIDATE-U-WTLIFE-020` | 期限の 3 日前の時刻 (境界を挟む 3 日 + 1 分前と 3 日ちょうど) | 3 日 + 1 分前は `retained`、3 日ちょうど以降は `warning` | 警告を期限当日にだけ出す / 境界を逆にする |
| `CANDIDATE-U-WTLIFE-021` | 期限を過ぎた直後、期限 + 1 日、期限 + 2 日ちょうど、期限 + 2 日 + 1 分 | 過ぎた直後と +1 日は `expired` (消さない)、+2 日 + 1 分から `reaped` (回収できる) | 猶予を 0 にする / 猶予後も `expired` のまま |
| `CANDIDATE-U-WTLIFE-022` | 回収条件が成立した時刻から 1 日と 2 日 + 1 分 | 日付期限と同じく、成立から猶予 2 日で `reaped` | 条件型だけ猶予を持たない |
| `CANDIDATE-U-WTLIFE-023` | 警告に応答が無いまま猶予が切れた branch に `prune --apply` (無音) | trash へ移され、`trashed` が記録される。実体はまだ削除されない。branch は `merged_clean` でなければ消えない | 無音を保持と見なして永遠に残す / 実体をその場で削除する |
| `CANDIDATE-U-WTLIFE-024` | 延長 (`extend`): 理由と新しい期限を渡す / 理由なし / 新しい期限が現在より過去 | 理由と未来の期限があるときだけ受理され、`extensions` に `{at, reason, previous_due, new_due, by}` が追記される (回数が履歴の length)。拒否時は記録が変わらず非 0 | 履歴を上書きする / 理由なしを受理する |
| `CANDIDATE-U-WTLIFE-025` | 延長後の時刻での状態 | 新しい期限に基づき `retained`/`warning` に戻り、`reaped` にならない | 延長しても元の期限で回収する |
| `CANDIDATE-U-WTLIFE-026` | 保持記録の作成 (`retain`): reason 空 / holder 空 / due が 0 個 / due が 2 個 | いずれも非 0 で終了し、記録を作らない。reason・holder・due が揃ったときだけ受理 | 理由なしの保持を認める |
| `CANDIDATE-U-WTLIFE-027` | 保持記録が無く未 merge の最終活動が 6 日 23 時間前と 7 日前の branch | 6 日台は `active`、7 日から `stale` で、この検出時刻 T0 に仮の保持記録 (due = T0 + 7 日) が作られる。`stale` の検出自体では削除されない | `stale` を検出時に削除する / T0 に記録を作らない |

### 3.3 trash・byte 同一性・復元

| Candidate | 観測 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| `CANDIDATE-U-WTLIFE-028` | 欠番 (archive commit の廃止。L6 §12 の 3) | - | - |
| `CANDIDATE-U-WTLIFE-042` | **trash の byte 同一性 (必須)**: 次を持つ worktree を reap して戻す: 追跡ファイルの modified、staged の変更 (partial stage A/B/C)、追跡ファイルの削除、未追跡ファイル、入れ子の未追跡 dir、空白・日本語名のファイル、**改行が CRLF と LF の混在するファイル**、**`core.autocrlf=true` の下のファイル**、**clean filter が設定されたファイル**、実行権限、ignored (`.ut-tdd/state` 等)。reap の前後と、戻した後を比べる。**reap と restore の間に、staged の B の loose object を古くしたうえで `git gc --prune=now` を実行する** | reap 後の trash の中と、戻した後の元の path で、全ファイル(ignored を含む)の byte 内容・権限が reap 前と完全に一致する。HEAD の commit id、`git diff --cached` (A→B、`unable to read` にならない)、`git diff`、未追跡一覧も一致する。reap は copy も変換もしない(rename だけ) | copy で移す / `git add -A` を経由して改行や filter を変える / ignored を落とす / index 保護 ref を作らず GC で B を失う / reap で実 index に write-tree して index file を変える (reap 前後の index file sha256 で検出) |
| `CANDIDATE-U-WTLIFE-043` | 欠番 (archive commit の廃止。L6 §12 の 3) | - | - |
| `CANDIDATE-U-WTLIFE-044` | 欠番 (archive commit の廃止。L6 §12 の 3) | - | - |
| `CANDIDATE-U-WTLIFE-045` | **稼働中ガードの fail-close**: mtime が読めない (権限なし、走査が途中で失敗する) worktree に `worktree prune --apply` | `activity_unknown` で動かさない。他の条件が全て満たされていても | 読めないとき静止と見なして動かす |
| `CANDIDATE-U-WTLIFE-046` | **単一時計の境界**: stale を T0 に検出し、T0 / T0 + 7 日 − ε / T0 + 7 日 / T0 + 9 日 − ε / T0 + 9 日 の各時刻で状態を評価する。T0 の後に `prune` を 2 回再実行する | T0 から T0 + 7 日 − ε は `warning` (消さない)。T0 + 7 日 (= due) で `expired` (消さない)。T0 + 9 日 − ε は `expired`。T0 + 9 日で `reaped` (他条件を満たせば消せる)。再実行しても仮の保持記録は 1 件のまま、`created_at` と due は変わらない (idempotent) | T0 を再実行で更新する / 警告期間と猶予を別の時計にする / 境界を逆にする |
| `CANDIDATE-U-WTLIFE-047` | **merged + 静止 → prune が reap**: `merged` として記録済みで、lease が無いか死んでおり、mtime が 6 時間 + 1 秒静止し、S2・S3 を満たす worktree | `worktree prune --apply` で trash へ移し、`merged_clean` が真なので local branch を `git update-ref -d refs/heads/<b> <oid>` で消す。mtime が 6 時間未満なら動かさない | merged を即回収する / 静止を見ない |
| `CANDIDATE-U-WTLIFE-048` | **lease の更新**: harness session の PostToolUse と SessionStart の hook (Claude と Codex の両方) を実行した worktree | `.ut-tdd/state/worktree-lease.json` が `pid` / `provider` / `session` / `updated_at` を持って更新される。ファイルは untracked (`git check-ignore` が真)。hook が失敗しても session は落ちない (fail-open) | 片方のランタイムの hook だけが更新する / lease を tracked にする |
| `CANDIDATE-U-WTLIFE-049` | **hook 失敗の稼働 session (lease 無し)**: lease を書けなかった harness session が、mtime が 6 時間以上静止した worktree の中のファイルを読む。その worktree を reap する | lease が無いので reap は進み、worktree は trash の path にある。プロセスは trash の path から全ファイルを読め、内容は reap 前と byte 同一。`lease_evidence` は `none`。**`merged_clean` が偽なら 14 日後も自動 purge されない**。Windows で handle/cwd が掴まれていれば rename が失敗し何も変わらない (008) | lease が無いことを根拠に実体を削除する / reap で copy+delete にする |
| `CANDIDATE-U-WTLIFE-050` | **pid の再利用**: lease の pid が生存しているが、現在のプロセスの起動時刻が lease の `process_start_time` と異なる。起動時刻が読めない生存 pid の場合も | 起動時刻が異なる場合は pid の再利用として死んでいる扱いで、lease の古さと mtime の静止があれば reap できる。起動時刻が読めない生存 pid は生存として扱い `lease_alive` で拒否する | pid の存在だけで判定する / 起動時刻が読めないとき死んでいると見なす |
| `CANDIDATE-U-WTLIFE-051` | **reap の順序と失敗時の無変更**: (a) admin entry のコピーに失敗、(b) rename に失敗、(c) rename 後に `git worktree prune` が失敗、(d) cross volume | (a)(b)(d) は何も変わらない (worktree・admin entry・git の一覧・branch が前後で同一)。(c) は trash の実体を残し、戻せる状態で `error` を記録する。いずれも copy や delete を行わない | rename 失敗後に copy+delete へ進む / (c) で trash の実体を消す |
| `CANDIDATE-U-WTLIFE-052` | **自動 purge の条件**: (a) `merged_clean` 真で 13 日 23 時間、(b) `merged_clean` 真で 14 日 + 1 分、何も変わらない、(c) 中のファイルの mtime が `moved_at` より後、(d) trash の中に生存 pid (起動時刻一致) の lease、(e) lease が壊れている、(f) mtime が読めない、(g) `merged_clean` 偽 (dirty / unmerged / lease 無し・判定不能の別を問わない) で 14 日以上、(h) 自動 purge の run が 25 件 | (a) は対象外。(b) は junction を外してから削除される。(c)(d)(e)(f) は削除しない。(g) は**自動では削除されず**、dry-run と EOD に「purge 要確認」と失われるものが出る。(h) は 20 件で止まる | `merged_clean` を見ずに 14 日だけで削除する / 中が変わっていても削除する / 上限を適用しない |
| `CANDIDATE-U-WTLIFE-053` | **trash からの復元 (3 ケース)**: reap した worktree (HEAD=A、index=B、worktree=C、未追跡あり) を、merged の reap で local branch が消えた状態で戻す。(a) branch が無い、(b) branch が `head_oid` と同じ oid に存在する、(c) branch が異なる oid に存在する。手順は L6 §7。reap と restore の間に `git gc --prune=now` (B の loose object を古くしたうえで) を実行する | 全ケースで `git rev-parse HEAD` が `meta.json` の `head_oid` と一致する (unborn にならない)。(a) は branch が `head_oid` に作り直される。(b) はそのまま。(c) は branch を動かさず、worktree は `head_oid` で detach され、報告が出る。全ケースで元の path に戻り、`git worktree list` に現れ、`git diff --cached`・`git diff`・未追跡一覧・全ファイルの byte が reap 前と一致する。`git diff --cached` は A→B で `unable to read` にならない。復元の検証は実 index の一時コピーに対する `write-tree` で行い、復元前後で実 index file の sha256 が検証によって変わらず一時コピーが削除される。index 保護 ref は復元の検証 (存在・oid 一致・tree 一致) のあと expected-oid つきで削除される。`restored` が監査ログに出る | branch が無いまま repair して HEAD が unborn になる / 異なる oid の branch を動かす / admin entry のコピーを取らず戻せない / 復元の検証で実 index に write-tree する |
| `CANDIDATE-U-WTLIFE-054` | **branch の扱い**: (a) `merged_clean` の reap、(b) `merged_clean` 偽の reap、(c) `merged_clean` 真で、HEAD が別の branch / upstream が未設定で `git branch -d` なら拒否される状況 | (a) は `git update-ref -d refs/heads/<b> <oid>` で消える (`<oid>` は消す直前に読み直し、`is-ancestor origin/main` を確かめたもの)。(b) は消さない。(c) も update-ref 方式なので HEAD / upstream に依らず同じ結果になる。`git branch -d` は呼ばれない | `git branch -d` を使う / 先端を読み直さず古い oid で消す / `merged_clean` 偽の branch を reap で消す |
| `CANDIDATE-U-WTLIFE-055` | **trash の間に branch が進む**: `merged_clean` 偽 (unmerged) の reap のあと、14 日以内に local branch に新しい commit が積まれて oid が変わる。確認 purge `--purge-confirmed <id>` を、確認時に表示した oid のまま実行する | 実行時に現在の oid を読み直し、表示した `expected-oid` と異なるので**その項目を拒否**する。branch も trash の実体も消えない。`git update-ref -d refs/heads/<b> <expected-oid>` の oid 比較が効いていること (古い oid で `-d` するとき git が失敗する) | oid を再確認せず branch を消す / 拒否時に実体だけ消す |
| `CANDIDATE-U-WTLIFE-056` | **古い dead_pid の lease と別の reader**: lease が `dead_pid` の worktree を reap する。別の(lease を持たない)reader がその trash の中を 14 日以上読んでいる。(a) `merged_clean` 真、(b) 偽 | (a) は 14 日後に自動 purge される (mtime と lease の再検査を通るため)。この場合の失われるもの(ignored の runtime 状態と reader の作業途中)は L6 §6.3 に残るリスクとして**明記された範囲**であることを、dry-run の出力が (a) に「失われるもの: ignored runtime」として示す。(b) は 14 日を超えても自動 purge されない | dead_pid を理由に `merged_clean` 偽を自動 purge する / 残るリスクを表示しない |
| `CANDIDATE-U-WTLIFE-057` | **確認 purge の一括**: `--purge-confirmed` に (a) 20 id、(b) 21 id、(c) うち 1 つが oid 不一致、(d) うち 1 つで静止の再確認が失敗、を渡す | (a) は各 id を**個別に**再検査して実行する。(b) は 21 個を拒否する (最大 20)。(c)(d) はその項目だけ拒否し、他の項目は続ける。各項目で削除前に失われるもの (`dirty_file_count`、`origin/main` から到達できない commit 数) を表示する。拒否は監査ログに残る | 1 件の失敗で全体を止める / 一括で再検査を省く / 失われるものを表示しない |
| `CANDIDATE-U-WTLIFE-058` | **index 保護 ref の作成失敗と実 index の不変**: (a) conflict を含む index (`write-tree` が失敗する)、(b) `refs/ut-tdd/trash/<entry-id>/index` が既に存在し create-only の `update-ref` が失敗する、(c) 成功する reap。各経路で、reap の前後に `git rev-parse --git-path index` の実 index file の sha256 とサイズを比べ、一時コピーの有無を調べる | (a)(b) は reap を**拒否**し、worktree・admin entry・git の一覧・branch・ref が前後で同一で、`error:index_ref_failed` を記録する。rename は試みない。(a)(b)(c) の全てで、**実 index file の sha256 とサイズが reap の前後で完全に一致する**(cache-tree 拡張の追記も無い)。一時コピーは全経路で削除されている | 実 index に直接 `write-tree` する(cache-tree で index が 110→129 byte のように変わる。**sha256 の比較が必ず殺す**) / 失敗経路で一時コピーを残す / 失敗を無視して rename する / ref を上書きする |
| `CANDIDATE-U-WTLIFE-059` | **index 保護 ref の後始末 (expected-oid)**: (a) 復元の検証が通った、(b) 復元の検証で ref の oid または tree が一致しない、(c) 自動 purge の実体削除後、(d) 確認 purge の実体削除後、(e) 後始末の時点で ref の oid が `index_ref_oid` と異なる | (a)(c)(d) は `git update-ref -d <ref> <index_ref_oid>` で ref が消える。(b) は復元を完了と報告せず、ref は消さない。(e) は ref を消さず `error` を記録する。実体の削除前に ref を消さない。後始末の検証でも実 index file は変わらない | 実体の削除前に ref を消す / expected-oid なしで消す / 検証失敗でも消す |
| `CANDIDATE-U-WTLIFE-029` | 欠番 (archive commit の廃止。L6 §12 の 3) | - | - |
| `CANDIDATE-U-WTLIFE-030` | 欠番 (archive commit の廃止。L6 §12 の 3) | - | - |
| `CANDIDATE-U-WTLIFE-031` | 欠番 (archive commit の廃止。L6 §12 の 3) | - | - |
| `CANDIDATE-U-WTLIFE-032` | 欠番 (archive commit の廃止。L6 §12 の 3) | - | - |
| `CANDIDATE-U-WTLIFE-033` | 欠番 (archive commit の廃止。L6 §12 の 3) | - | - |

### 3.4 実行面と fail-open

| Candidate | 観測 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| `CANDIDATE-U-WTLIFE-034` | `pr merge` で merge は成功し、後処理(`merged` の記録)が例外を投げる fixture (保持記録の破損、書き込み不可) | `runPrMerge` の結果 `ok` と終了コード 0 は変わらず、出力に `cleanup=error:<reason>` が出る。merge は取り消されない | 後処理の失敗で `pr merge` を失敗にする |
| `CANDIDATE-U-WTLIFE-035` | `pr merge` が DENY / `merge_failed` の場合 | 後処理を呼ばない (branch と worktree は残る) | merge に失敗しても片付ける |
| `CANDIDATE-U-WTLIFE-036` | 安全な merged branch に `pr merge` | `merged` (merge commit・時刻) が記録され、`cleanup=recorded` が出る。**worktree も local branch も remote branch も削除されない** (git の状態が前後で同一)。その後 mtime が 6 時間静止した状態の `worktree prune --apply` で worktree と local branch が削除される | 後処理が削除を行う / 記録が無く prune が対象に気づけない |
| `CANDIDATE-U-WTLIFE-037` | `worktree prune` (dry-run、既定) | 「回収できる / 保持中 (理由・期限) / 回収できない (理由)」、自動 purge の対象、「purge 要確認」(失われるもの付き) が列挙され、branch・worktree・trash・保持記録・監査ログが一切変わらない。`--apply` と同じ判定関数の結果と一致する | dry-run が副作用を持つ / dry-run と apply で判定が別経路 |
| `CANDIDATE-U-WTLIFE-038` | doctor `worktree-retention` に、期限切れ・理由なし・壊れた記録・stale を含む fixture | 全て warn として列挙し、doctor の終了コードを変えない (fail-close しない)。集計行を出す | 警告を fail-close にする / 件数を出さない |
| `CANDIDATE-U-WTLIFE-039` | SessionStart の digest に、`warning` と `expired` の対象がある fixture | `escalationLines` に対象・状態・保持者が載る。対象が無ければ行を足さない。生成が失敗しても session start は落ちない | 失敗で session start を落とす |
| `CANDIDATE-U-WTLIFE-040` | 実行した回収 (`trashed`)・purge (`purged`)・戻し (`restored`)・延長・拒否 | `.ut-tdd/logs/worktree-lifecycle.jsonl` に 1 件ごと 1 行が追記される (`at` / `action` / `branch` / `worktree_path` / `result` / `reason`) | 拒否を記録しない |
| `CANDIDATE-U-WTLIFE-041` | 保持記録を `.ut-tdd/state/worktree-retention.json` に書く / 書き込み途中で失敗する fixture | 書き込みは一時ファイルから rename で原子的。失敗時は元の記録が壊れない。ファイルは untracked (`git check-ignore` が真) | 直接上書きで途中失敗時に壊す |

## 4. 運用

- 各 oracle は Green のあと、L6 の規則を 1 本だけ殺す mutation を手元で入れ (commit しない)、該当の行が fail することを確かめて PR の証跡に残す。001, 005, 013, 034, 042, 049, 051, 052, 055, 058 を最優先で確かめる。
- 必ず削除してはいけないケースの網羅 (001〜019 の欠番を除く各行、045、048〜059) は、実装 PR の完了条件に含める。1 件でも `it.fails` のままなら merge しない。
- 実 repo の既存 145 worktree / 540 branch に対する実行は、oracle の対象にしない (初回回収は L6 §10 の手順で行い、実行ごとに dry-run を記録する)。
