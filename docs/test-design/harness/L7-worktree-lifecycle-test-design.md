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

対になる設計文書は `docs/design/harness/L6-function-design/worktree-lifecycle.md` である。本書はその §3 状態遷移、§4 保持記録、§6 回収前の安全条件と §6.2 回収・§6.3 purge、§7 退避、§8 fail-open / fail-close を検証する oracle を定義する。

この pair-freeze では候補 ID (`CANDIDATE-U-WTLIFE-*`) だけを宣言する。Red は後続 PR で、設計保護 gate (L6 `design-protection-diff-gate.md` §10.3) と同じ順序にする: (1) Red のテスト (`it.fails`) を候補 ID で引用して入れる、(2) 正式 ID `U-WTLIFE-*` への昇格を src/ を含まない PR で入れる、(3) 実装 PR で `it.fails` を `it` に戻して Green にする。

## 2. fixture

- 判定 (`classifyTarget` / `evaluateReap` / `evaluatePurge` / `planRun`) は、git の観測値 (facts)、保持記録、現在時刻、設定を直接渡す純粋関数の入力で作る。実 repo は使わない。
- adapter の行 (退避・junction・ロック・`pr merge` の後処理) は、一時ディレクトリに作った実 git repo と worktree、または fake の git / fs port で観測する。実 repo の worktree は削除しない。
- junction の行は Windows 実環境で `mklink /J` で作り、primary 役の一時ディレクトリの `node_modules` に印のファイルを置いて、reap と purge の後にその印が残ることを観測する。非 Windows では skip でなく別 fixture (symlink) に置き換えず、skip を明示して Windows の CI で実行する。
- 時刻は固定の `now` を渡す。日数は既定 (stale 7 / 警告 3 前 / 猶予 2 / trash 14 日 / 退避 90 日 / 静止 6 時間)。

## 3. Candidate oracle matrix

「殺す mutation」は、その行の規則を 1 本だけ壊した変異である。

### 3.1 動かしてはいけないケース (must-not-reap) と実体を削除してはいけないケース

| Candidate | 観測 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| `CANDIDATE-U-WTLIFE-001` | PR が MERGED だが、branch 先端が `origin/main` に含まれない (merge 後に push された commit)。退避 ref は未作成 | 退避なしでは worktree を動かさない (`tip_not_in_main`)。local branch は消さない (#707) | PR の MERGED だけで回収する / 含有判定を `origin/main` でなくローカル `main` で行う |
| `CANDIDATE-U-WTLIFE-002` | 先端が main に含まれない branch で、`reaped` により退避を作れた場合 | 退避 ref を作り、検証が通ってから worktree を trash へ移す。**local branch は消さず残す**。archive ref が指す commit は元の先端を含む | 退避より先に動かす / 検証を省く / 未 merge の branch を reap で消す |
| `CANDIDATE-U-WTLIFE-003` | worktree 名が `ut-review-*` (期限切れ・merged 相当の他条件が全て満たされていても) | 全状態で対象外。`worktree prune --apply` でも動かさない。dry-run の一覧にも「消せる」に出さない。`pr merge` の後処理も `merged` の記録を作らない | 名前でなく path の一部一致で判定する / `--apply` だけ除外を忘れる |
| `CANDIDATE-U-WTLIFE-004` | 稼働中ガード (L6 S7) の mtime 側: worktree 配下 (`node_modules` と `.git` を除く) のファイル mtime が (a) 6 時間以内、(b) 360 分ちょうど、(c) 360 分 + 1 秒、(d) 6 時間以内の mtime が `node_modules`/`.git` 配下だけ、の worktree (lease は無し) に `worktree prune --apply` | (a) は `active_recently` で消さない。(b) は消さない、(c) は消せる (境界: 360 分以上で消せる)。(d) は除外対象なので消せる。merged/reaped の別を問わず同じガード | ガードを一部の状態にだけ付ける / 境界を逆にする / `node_modules` の mtime で稼働中と誤判定 |
| `CANDIDATE-U-WTLIFE-005` | `node_modules` が directory junction の worktree を reap し、後に purge する。junction の先 (primary 役 dir) に印ファイルがある | reap の rename は junction 自体を移し、primary の `node_modules` と印ファイルは残る。purge は junction の link だけを外してから削除し、purge の後も印ファイルが残る。junction を辿る削除が起きない | purge で junction を外さず削除する / 外した後の不在確認を省く / rename 前後の primary の確認を省く |
| `CANDIDATE-U-WTLIFE-006` | purge で junction の unlink に失敗する fixture (権限なし/ファイル掴み) | その trash の削除を行わず、`junction_unresolved` を記録して先へ進む | unlink 失敗を無視して削除する |
| `CANDIDATE-U-WTLIFE-007` | reap または purge の後に primary の `node_modules` が欠けた fixture | 以降の対象の処理を全て止め、監査ログに `error`。run は非 0 | 欠落を検知しても次の対象へ進む |
| `CANDIDATE-U-WTLIFE-008` | Windows でファイルを他プロセスが掴んでいて reap の rename が `EBUSY` / `EPERM` で失敗する。purge で削除が `EBUSY` になる場合も | reap は**何も変えず**停止し (worktree、admin entry、git の一覧、branch が前後で同一)、`error:rename_failed` を記録して**その対象だけ**先へ進む。再試行しない。purge は `error:locked` で次回に回す。`--force` と `git worktree remove` を使わない | rename 失敗後に copy+delete へ切り替える / 1 件の失敗で run 全体を止める / `--force` で突破する |
| `CANDIDATE-U-WTLIFE-009` | 回収候補が 25 件ある `worktree prune --apply`。purge 候補が 25 件ある場合も別に | reap は 20 件で止まり、残り 5 件は `deferred`。purge も 20 件で止まる。次の run で処理される | 上限を dry-run にだけ適用する / reap と purge を合算して数える |
| `CANDIDATE-U-WTLIFE-010` | `retained` で期限が未来、または回収条件が未成立の branch | 動かさない (`retained`)。他の条件が全て満たされていても | 保持記録を参照せず merge 済みなら消す |
| `CANDIDATE-U-WTLIFE-011` | 退避 ref の作成に失敗する fixture (`update-ref` が失敗) | 動かさない (S9)。branch と worktree は残り、`archive_failed` を記録する | 退避失敗を警告にして削除を続行する |
| `CANDIDATE-U-WTLIFE-012` | 退避 ref を作ったが、読み戻した oid が作った oid と一致しない fixture | 動かさない | 読み戻し検証を省く |
| `CANDIDATE-U-WTLIFE-013` | **lease の判定 (L6 S7)**: (a) pid が生存し起動時刻が一致する lease、`updated_at` は 6 時間より古い・mtime も古い、(b) pid が生存で `updated_at` が 6 時間以内、(c) pid が死んでいて `updated_at` が 6 時間より古く mtime も古い、(d) pid が死んでいるが `updated_at` が 6 時間以内、(e) lease が壊れた JSON、(f) lease が読めない (権限なし)、(g) lease が無く mtime が古い、(h) lease が無く mtime が新しい、(i) 呼び出し元の cwd がその worktree 配下 | (a) は `lease_alive` で拒否 (古さに関わらず)。(b) は拒否。(c) は reap できる。(d) は `lease_active` で拒否。(e)(f) は `activity_unknown` で拒否。(g) は reap できる (mtime の静止だけが根拠)。(h) は `active_recently` で拒否。(i) は `current_cwd` でも拒否 (補助) | 生存 pid の古い lease を無視する / 壊れた lease を無いものとして扱う / lease が無いことを静止と見なして mtime を見ない |
| `CANDIDATE-U-WTLIFE-014` | primary checkout、`git worktree list` に未登録の dir、`C:/dev` 外の path | いずれも動かさない | 登録の有無を見ない / primary を除外し忘れる |
| `CANDIDATE-U-WTLIFE-015` | 未コミットの変更がある `merged` の worktree: (a) `pr merge` の後処理、(b) lease と mtime が静止したあとの `worktree prune --apply` | (a) は何も動かさない (`merged` の記録だけ)。(b) は退避・検証を済ませてから trash へ移し、worktree が元の path から消える (`--force` は使わない。028・044・051) | 後処理で dirty を動かす / 退避前に動かす |
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
| `CANDIDATE-U-WTLIFE-023` | 警告に応答が無いまま猶予が切れた branch に `prune --apply` (無音) | 退避してから trash へ移され、監査ログに `trashed` と退避が記録される。実体はまだ削除されない | 無音を保持と見なして永遠に残す / 実体をその場で削除する |
| `CANDIDATE-U-WTLIFE-024` | 延長 (`extend`): 理由と新しい期限を渡す / 理由なし / 新しい期限が現在より過去 | 理由と未来の期限があるときだけ受理され、`extensions` に `{at, reason, previous_due, new_due, by}` が追記される (回数が履歴の length)。拒否時は記録が変わらず非 0 | 履歴を上書きする / 理由なしを受理する |
| `CANDIDATE-U-WTLIFE-025` | 延長後の時刻での状態 | 新しい期限に基づき `retained`/`warning` に戻り、`reaped` にならない | 延長しても元の期限で回収する |
| `CANDIDATE-U-WTLIFE-026` | 保持記録の作成 (`retain`): reason 空 / holder 空 / due が 0 個 / due が 2 個 | いずれも非 0 で終了し、記録を作らない。reason・holder・due が揃ったときだけ受理 | 理由なしの保持を認める |
| `CANDIDATE-U-WTLIFE-027` | 保持記録が無く未 merge の最終活動が 6 日 23 時間前と 7 日前の branch | 6 日台は `active`、7 日から `stale` で、この検出時刻 T0 に仮の保持記録 (due = T0 + 7 日) が作られる。`stale` の検出自体では削除されない | `stale` を検出時に削除する / T0 に記録を作らない |

### 3.3 退避と復元

| Candidate | 観測 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| `CANDIDATE-U-WTLIFE-028` | `reaped` の worktree に未コミットの変更 (追跡ファイルの変更と未追跡ファイルの両方) | `refs/ut-tdd/archive/<branch>` に commit が作られ、その tree に追跡の変更と未追跡ファイルの両方が含まれる。実 index・作業ツリー・`git stash list` は退避前後で変わらない。そのあと worktree が外れる | 未追跡ファイルを退避から落とす / stash push を使う / 実 index を書き換える |
| `CANDIDATE-U-WTLIFE-042` | **往復 (必須)**: 次を全て持つ worktree を「退避 → 検証 → reap (trash) → 退避 ref からの復元 (L6 §7 の 5 の手順)」する: 追跡ファイルの modified、**partial stage の A/B/C (HEAD=A、index=B、worktree=C のファイル)**、**追跡ファイルの削除 (worktree で削除済み / staged の削除の両方)**、未追跡ファイル、入れ子の未追跡 dir、空白を含む名前、日本語名のファイル。ignored (`node_modules`・`.ut-tdd/state`) も置く。退避前と復元後を比べる | 次の全てが一致する: HEAD の commit id (A)、`git diff --cached` (A→B)、`git diff` (B→C)、未追跡ファイル一覧 (`git ls-files -o --exclude-standard`)、ignored を除く全ファイルの byte 内容。ignored は退避に含まれない (宣言した除外集合と一致) | 素の `git stash create` を使う (未追跡が落ちる。**必ず殺す**) / W を直接 checkout して HEAD が W になる / worktree の内容だけ保存して staged を失う / `add -A` を `add -u` にする / 日本語名・空白名で path を壊す / ignored を取り込む |
| `CANDIDATE-U-WTLIFE-043` | **退避失敗は動かさない (必須)**: 一時 index の作成、`commit-tree`、`update-ref` のそれぞれを失敗させた fixture (例: ref の lock 競合、書き込み不可) | どの失敗でも worktree と branch は元の path に残り、`archive_failed` が監査ログに出る。trash には何も作られない。一時 index は残らない。実 index は変わらない | 失敗を警告にして trash へ移す / 一時 index を片付けない |
| `CANDIDATE-U-WTLIFE-044` | **退避の検証 (実 git)**: 未コミット変更のある実 worktree で (a) 退避 → 検証 → reap が成功し、worktree が trash にあり元の path が無い、(b) 検証を改ざんした fixture (archive ref を別の oid に差し替える / 記録した tree hash を変える / I の親を欠かす) | (a) は成功する。reap は `git worktree remove` も `--force` も呼ばない (呼び出しを観測)。(b) は rename を**試みず**、worktree と branch が元の path に残り `archive_verify_failed` が出る | 検証前に rename する / 検証失敗でも trash へ移す / reap で `--force` を使う |
| `CANDIDATE-U-WTLIFE-045` | **稼働中ガードの fail-close**: mtime が読めない (権限なし、走査が途中で失敗する) worktree に `worktree prune --apply` | `activity_unknown` で動かさない。他の条件が全て満たされていても | 読めないとき静止と見なして動かす |
| `CANDIDATE-U-WTLIFE-046` | **単一時計の境界**: stale を T0 に検出し、T0 / T0 + 7 日 − ε / T0 + 7 日 / T0 + 9 日 − ε / T0 + 9 日 の各時刻で状態を評価する。T0 の後に `prune` を 2 回再実行する | T0 から T0 + 7 日 − ε は `warning` (消さない)。T0 + 7 日 (= due) で `expired` (消さない)。T0 + 9 日 − ε は `expired`。T0 + 9 日で `reaped` (他条件を満たせば消せる)。再実行しても仮の保持記録は 1 件のまま、`created_at` と due は変わらない (idempotent) | T0 を再実行で更新する / 警告期間と猶予を別の時計にする / 境界を逆にする |
| `CANDIDATE-U-WTLIFE-047` | **merged + 静止 → prune が reap**: `merged` として記録済みで、lease が無いか死んでおり、mtime が 6 時間 + 1 秒静止し、S1・S2・S3 を満たす worktree | `worktree prune --apply` で退避の要否を判定し、trash へ移し、先端が main に含まれるので local branch を消す。mtime が 6 時間未満なら動かさない | merged を即回収する / 静止を見ない |
| `CANDIDATE-U-WTLIFE-048` | **lease の更新**: harness session の PostToolUse と SessionStart の hook (Claude と Codex の両方) を実行した worktree | `.ut-tdd/state/worktree-lease.json` が `pid` / `provider` / `session` / `updated_at` を持って更新される。ファイルは untracked (`git check-ignore` が真)。hook が失敗しても session は落ちない (fail-open) | 片方のランタイムの hook だけが更新する / lease を tracked にする |
| `CANDIDATE-U-WTLIFE-049` | **hook 失敗の稼働 session (lease 無し)**: lease を書けなかった harness session のプロセスが、mtime が 6 時間以上静止した worktree の中のファイルを開き (POSIX)、または読みに行く。その worktree を reap する | lease が無いので reap は進み、worktree は trash の path にある。プロセスは trash の path から全ファイルを読め、内容は reap 前と byte 同一。実体は削除されていない。`meta.json` の `lease_evidence` は `none` で、14 日後も自動 purge されない (052 g)。Windows で handle/cwd が掴まれていれば rename が失敗し何も変わらない (008) | lease が無いことを根拠に実体を削除する / reap で copy+delete にする |
| `CANDIDATE-U-WTLIFE-050` | **pid の再利用**: lease の pid が生存しているが、現在のプロセスの起動時刻が lease の `process_start_time` と異なる。起動時刻が読めない生存 pid の場合も | 起動時刻が異なる場合は pid の再利用として死んでいる扱いで、lease の古さと mtime の静止があれば reap できる。起動時刻が読めない生存 pid は生存として扱い `lease_alive` で拒否する | pid の存在だけで判定する / 起動時刻が読めないとき死んでいると見なす |
| `CANDIDATE-U-WTLIFE-051` | **reap の順序と失敗時の無変更**: (a) admin entry のコピーに失敗、(b) rename に失敗 (Windows の使用中)、(c) rename 後に `git worktree prune` が失敗、(d) cross volume | (a)(b)(d) は何も変わらない (worktree・admin entry・git の一覧・branch が前後で同一)。(c) は trash の実体を残し、戻せる状態で `error` を記録する。いずれも copy や delete を行わない | rename 失敗後に copy+delete へ進む / (c) で trash の実体を消す |
| `CANDIDATE-U-WTLIFE-052` | **purge**: 自動 purge は `lease_evidence` が `dead_pid` / `pid_reuse` で 14 日経過したものだけ。(a) 13 日 23 時間、(b) 14 日 + 1 分で何も変わらない (`dead_pid`)、(c) 中のファイルの mtime が `moved_at` より後、(d) trash の中に生存 pid (起動時刻一致) の lease、(e) lease が壊れている、(f) mtime が読めない、(g) **反例**: `lease_evidence: none` の reap で、lease の無い reader が trash の中のファイルを 14 日以上読み続けている (mtime は変わらない)、(h) `undeterminable`、(i) 人が `--purge-confirmed <id>` を 1 対象に実行 | (a) は対象外。(b) は削除される (junction は link だけ外す)。(c)(d)(e)(f) は削除しない。(g)(h) は 14 日を過ぎても**自動では削除されない**。dry-run と EOD に「purge 要確認」として出る。(i) は再検査(外れれば拒否)を通って削除し、確認者つきで `purged` を記録する。複数対象を 1 コマンドに渡すと拒否する | 14 日と mtime だけで lease の無い対象を削除する / 中が変わっていても削除する / `--purge-confirmed` が再検査を省く |
| `CANDIDATE-U-WTLIFE-053` | **trash からの復元 (3 ケース)**: reap した worktree (HEAD=A、index=B、worktree=C、未追跡あり) を、merged の reap で local branch が消えた状態で戻す。(a) branch が無い、(b) branch が `head_oid` と同じ oid に存在する、(c) branch が異なる oid に存在する。手順は L6 §6.2 の戻し方 (`<name>.admin/` を戻す → rename → branch の整え → `git worktree repair`) | 全ケースで `git rev-parse HEAD` が `meta.json` の `head_oid` と一致する (unborn にならない)。(a) は branch が `head_oid` に作り直される。(b) はそのまま。(c) は branch を動かさず、worktree は `head_oid` で detach され、報告が出る。全ケースで元の path に戻り、`git worktree list` に現れ、`git diff --cached` (A→B)・`git diff` (B→C)・未追跡一覧・全ファイルの byte が reap 前と一致する。`restored` が監査ログに出る | branch が無いまま repair して HEAD が unborn になる / 異なる oid の branch を動かす / admin entry のコピーを取らず戻せない |
| `CANDIDATE-U-WTLIFE-054` | **branch の扱い (reap と purge)**: (a) 先端が `origin/main` に含まれる branch の reap、(b) 含まれない branch の reap、(c) (b) の purge | (a) は reap の最後に local branch を `git branch -d` で消し、`meta.json` に `branch` と `head_oid` が残る (復元は 053)。(b) は local branch を残し、archive ref も保つ。(c) は purge と同時に local branch を消し、先端は archive ref が保つ (90 日) | 未 merge の branch を reap で消す / purge で archive ref まで消す / meta に head_oid を残さない |
| `CANDIDATE-U-WTLIFE-029` | main に含まれない commit と未コミット変更の両方 | 1 つの ref (W) に載り、W の親に I と元の先端がある。commit も変更も復元できる | 2 つの ref に分けて片方を落とす / 親を欠く |
| `CANDIDATE-U-WTLIFE-030` | 同名の archive ref が既にある | 上書きせず `@<timestamp>` 付きの別名で退避する | 既存の退避を上書きする |
| `CANDIDATE-U-WTLIFE-031` | 復元 (L6 §7 の 5): archive ref から `--detach <W^1>` → `read-tree --reset -u <W>` → `read-tree <I>` の順で実行する (W を直接 checkout しない) | 復元後の HEAD が元の先端 A で、index が B、作業ツリーが C (042 が全項目で照合) | W を直接 checkout して HEAD が W になる |
| `CANDIDATE-U-WTLIFE-032` | 退避後の監査ログ・SessionStart の通知 | archive ref 名と復元コマンドが出力される | 退避先を通知しない |
| `CANDIDATE-U-WTLIFE-033` | 退避から 89 日 23 時間と 90 日 + 1 分の archive ref に `prune --apply` | 90 日を超えたものだけ削除され、89 日台は残る。基準は監査ログの退避イベントの `at` | 90 日未満も消す / commit date を基準にする |

### 3.4 実行面と fail-open

| Candidate | 観測 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| `CANDIDATE-U-WTLIFE-034` | `pr merge` で merge は成功し、後処理(`merged` の記録)が例外を投げる fixture (保持記録の破損、書き込み不可) | `runPrMerge` の結果 `ok` と終了コード 0 は変わらず、出力に `cleanup=error:<reason>` が出る。merge は取り消されない | 後処理の失敗で `pr merge` を失敗にする |
| `CANDIDATE-U-WTLIFE-035` | `pr merge` が DENY / `merge_failed` の場合 | 後処理を呼ばない (branch と worktree は残る) | merge に失敗しても片付ける |
| `CANDIDATE-U-WTLIFE-036` | 安全な merged branch に `pr merge` | `merged` (merge commit・時刻) が記録され、`cleanup=recorded` が出る。**worktree も local branch も remote branch も削除されない** (git の状態が前後で同一)。その後 mtime が 6 時間静止した状態の `worktree prune --apply` で worktree と local branch が削除される | 後処理が削除を行う / 記録が無く prune が対象に気づけない |
| `CANDIDATE-U-WTLIFE-037` | `worktree prune` (dry-run、既定) | 「回収できる / 保持中 (理由・期限) / 回収できない (理由)」と purge 対象が列挙され、branch・worktree・ref・trash・保持記録・監査ログが一切変わらない。`--apply` と同じ判定関数の結果と一致する | dry-run が副作用を持つ / dry-run と apply で判定が別経路 |
| `CANDIDATE-U-WTLIFE-038` | doctor `worktree-retention` に、期限切れ・理由なし・壊れた記録・stale を含む fixture | 全て warn として列挙し、doctor の終了コードを変えない (fail-close しない)。集計行を出す | 警告を fail-close にする / 件数を出さない |
| `CANDIDATE-U-WTLIFE-039` | SessionStart の digest に、`warning` と `expired` の対象がある fixture | `escalationLines` に対象・状態・保持者が載る。対象が無ければ行を足さない。生成が失敗しても session start は落ちない | 失敗で session start を落とす |
| `CANDIDATE-U-WTLIFE-040` | 実行した回収 (`trashed`)・purge (`purged`)・戻し (`restored`)・退避・延長・拒否 | `.ut-tdd/logs/worktree-lifecycle.jsonl` に 1 件ごと 1 行が追記される (`at` / `action` / `branch` / `result` / `reason` / `archive_ref`) | 拒否を記録しない |
| `CANDIDATE-U-WTLIFE-041` | 保持記録を `.ut-tdd/state/worktree-retention.json` に書く / 書き込み途中で失敗する fixture | 書き込みは一時ファイルから rename で原子的。失敗時は元の記録が壊れない。ファイルは untracked (`git check-ignore` が真) | 直接上書きで途中失敗時に壊す |

## 4. 運用

- 各 oracle は Green のあと、L6 の規則を 1 本だけ殺す mutation を手元で入れ (commit しない)、該当の行が fail することを確かめて PR の証跡に残す。001, 005, 011, 034, 042, 044, 013, 049, 051, 052 を最優先で確かめる。
- 必ず削除してはいけないケースの網羅 (001〜019、043〜045、048〜054) は、実装 PR の完了条件に含める。1 件でも `it.fails` のままなら merge しない。
- 実 repo の既存 145 worktree / 540 branch に対する実行は、oracle の対象にしない (初回回収は L6 §10 の手順で行い、実行ごとに dry-run を記録する)。
