---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_worktree_retention_lifecycle
pair_artifact: docs/test-design/harness/L7-worktree-lifecycle-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1069
---

> **L6 contract marker**: 本書は worktree と local branch の保持・回収の契約である。関数の simple signature は §9 に置く。oracle の詳細 (CANDIDATE-U-WTLIFE-001 以降) は `docs/test-design/harness/L7-worktree-lifecycle-test-design.md` が固定する。実装 PR は本書の対 freeze 後に別に出す (本 PR は契約のみ)。

# worktree とブランチのライフサイクル — 関数設計 (issue #1069)

## 1. 目的

「作った側が merge 後に畳む」は規律だけで、機械の裏付けが無く、worktree とブランチが溜まり続ける。方針 (PO 2026-10-15、issue #1069 本文と 2 コメント) は **既定は消す。残すなら理由と回収時期を書く。黙っていれば消える** である。本書はその方針を、状態遷移・保持記録・削除前の安全条件・退避・実行面に落とす。

既存の機構との境界:

- `src/runtime/worktree-lifecycle/` (PLAN-L7-501 / PLAN-L7-513) は、harness が worker 用に作る worktree の create / terminal handoff / lease 解放を扱う (状態は `planned` から `retired`)。人手や lane が作った worktree と local branch の回収は持たない。本書はそこへ状態を足さず、**別の関心** (保持記録と回収) として独立に置く。名前の衝突を避け、新規 module は `src/runtime/worktree-retention/` とする。
- PLAN-L6-661 (draft) は 1 本の worktree を安全に外す primitive (junction unlink、不在確認、`git worktree remove`、primary の健全性確認) の契約である。本書の削除はこの primitive を呼ぶ側に回り、二重実装しない (§12 の未決 1)。

## 2. 現状実測 (2026-10-15)

| 対象 | 件数 | 備考 |
|---|---|---|
| worktree | 145 (本 worktree 作成後は 146) | `git worktree list` |
| local branch | 540 (本 worktree 作成後は 545)、うち main へ merge 済み 212 | issue #1069 の実測 |
| remote branch | 183 | リポジトリの merge 時自動削除は有効 |

根拠となる現行コード:

- `src/cli/pr-merge.ts:13-33` の `pr merge` は `runPrMerge` を呼んで結果を出すだけで、merge 後の後片付けが無い。`gh pr merge` は `src/feedback/review-merge-gate.ts:521` の `mergePullRequest` port が実行する (`--merge --match-head-commit`)。後片付けの差し込み位置は、`registerPrMergeCommands` の action 内で、`runPrMerge` が `ok` を返したあとである。
- `src/doctor/worktree-topology-advisory.ts` は topology の advisory (常に non-blocking) で、doctor の check 登録は `src/doctor/index.ts:148,175`。新しい check はここに並べる。
- SessionStart の digest は `src/handover/session-start-digest.ts:295` の `selectSessionStartDigest` と `:346` の `renderSessionStartDigest` で、`escalationLines` を受ける。警告はこの経路で surface する。
- 手運用の `~/.claude/scripts/wt-remove-batch.sh` (PO 2026-10-13) は、1 回 20 本、C:/dev 直下・登録済み・main checkout 以外・未コミット 0・HEAD が origin/main に含まれる、を確かめ、`logs/HEAD` の更新が 360 分以内なら稼働中として止まり、`node_modules` が junction なら外してから `worktree remove` し、直後に main の `node_modules/commander` の存在を確かめ、branch が origin/main に含まれるときだけ `branch -D` する。本書はこの振る舞いを機械に移す。
- `.ut-tdd/state/*` は gitignore (`.gitignore:17`、`.gitkeep` のみ追跡)。

事故の教訓 (本書の安全条件の根拠):

- #707: merge 済み PR でも、merge 後の push で branch 先端に main へ未到達の commit が残る。branch の削除前に先端が main に含まれることを確かめる。
- 2026-09-16 (通算 5 回、PLAN-L6-661): worktree の `node_modules` が directory junction のとき、`git worktree remove` が junction を辿り primary の `node_modules` を空にした。junction は先に外し、外れたことを確かめてから remove する。

## 3. 状態遷移

対象は branch 単位の 1 本 (worktree があれば紐づける)。状態は保持記録 (§4) と git の観測値から**導出**する。状態そのものを別に永続化しない (stale 化する層を作らない)。

| 状態 | 入る条件 | 起きること | 主体 |
|---|---|---|---|
| `active` | 作成直後、または PR 未 merge で最終活動から 7 日未満 | 何もしない | - |
| `stale` | 保持記録が無く、未 merge で最終活動から 7 日以上 (検出時刻を T0 とする) | T0 に仮の保持記録 (下の T0 規則) を作る。以後は `warning` から `expired`、`reaped` (trash)、`purged` へ進む | doctor / prune |
| `merged` | PR が MERGED で、head branch の先端が `origin/main` に含まれる | `pr merge` の後処理は**何も削除しない**。`merged` (merge commit と時刻) を記録するだけ。回収 (trash への移動) は `worktree prune` が §6 の全条件 (稼働中ガードを含む) を満たしたときに行う | `pr merge` の後処理 (記録のみ) / `worktree prune` (回収) |
| `retained` | 保持記録が有効 (理由 + 回収期限または回収条件) | 期限・条件まで保持。回収の自動実行はしない | - |
| `warning` | `retained` の期限の 3 日前から | SessionStart と EOD 棚卸しで保持者 (lane) へ警告。延長は理由と新しい期限を書き直す | doctor / session start |
| `expired` | 期限を過ぎた、または回収条件が成立した | 猶予 2 日の間、毎回警告する | doctor / session start |
| `reaped` | 猶予 (2 日) が切れた | §7 の退避を先に行い、§6 の安全条件を満たせば §6.2 の回収 (trash への同一 volume の rename) を行う。**削除はしない** | `worktree prune --apply` |
| `trashed` | trash に移した (§6.2) | 14 日間、元の path へ戻せる。監査ログと SessionStart に戻し方を出す | - |
| `purged` | trash に移してから 14 日が過ぎ、§6.3 の再検査を通った。自動は `lease_evidence` が `dead_pid` / `pid_reuse` のものだけで、`none` / `undeterminable` は人の `--purge-confirmed <id>` が要る | trash の実体を削除する | `worktree prune --apply` (自動) / 人 (`--purge-confirmed`) |

- **無音は自動回収**: 警告に応答が無ければ `reaped` へ進む。保持を続けるときだけ延長の操作 (理由と新しい期限) が要る。
- 日数 (stale 7 日 / 警告 3 日前 / 猶予 2 日 / trash の保持 14 日 / 退避 ref の保持 90 日 / 静止判定 6 時間) は既定値で、設定で変えられる。
- `ut-review-*` など review 用の固定 worktree は対象外 (どの状態にも入れない)。
- 回収条件 (`issue_closed:#N` / `pr_merged:#N`) の成立は `gh` で観測する。観測に失敗した場合は成立と見なさない (消さない側に倒す)。
- 時計は 1 本にする。`stale` を初めて検出した時刻を **T0** とし、T0 に仮の保持記録 (reason: 初回の stale 回収、holder: 機械、due: T0 + 7 日) を作る。T0 から due までの 7 日が警告期間で、状態は T0 から `warning`。due で `expired`、due + 2 日 (= T0 + 9 日) で `reaped`。`prune` を再実行しても T0 は動かない (記録が既にあれば作らない)。保持者が延長すれば通常の延長 (§4) になる。

## 4. 保持記録

残す worktree / branch の記録。理由なしの保持は認めない。

| field | 型 | 内容 |
|---|---|---|
| `target_kind` | `"worktree"` または `"branch"` | 対象の種別 |
| `branch` | string | 対象 branch (必須。worktree のみの保持でも紐づく branch を書く) |
| `worktree_path` | string または null | worktree の絶対 path (正規化済み)。branch のみなら null |
| `reason` | string (空不可) | 保持する理由 |
| `holder_lane` | string (空不可) | 保持者 (lane 名) |
| `due` | `{ date: "YYYY-MM-DD" }` または `{ condition: "issue_closed:#N" \| "pr_merged:#N" }` | 回収期限または回収条件。どちらか 1 つ |
| `extensions` | array of `{ at, reason, previous_due, new_due, by }` | 延長の履歴 (回数は length)。延長は reason と新しい due を必須とする |
| `created_at` | ISO 8601 | 記録日時 |

- **置き場**: `.ut-tdd/state/worktree-retention.json` (1 ファイル、branch をキーとする)。worktree はマシン固有で他の clone と共有できないため、追跡しない (`.gitignore` の `.ut-tdd/state/*` で既に untracked)。tracked に置くとマシン間で食い違い、他の PC の記録が正本に見える。
- 書き込みは一時ファイルへ書いて rename する (途中失敗で壊れた記録を残さない)。読み込み時にファイルが壊れていれば**保持が有るものとして扱い、何も削除しない** (消さない側に倒す)。
- 記録の操作は `ut-tdd worktree retain --branch <b> --reason <r> --holder <lane> (--until <date> | --until-condition <c>)` と `ut-tdd worktree extend --branch <b> --reason <r> --until <date>`。`reason` か `holder` が空、due が 0 個または 2 個のとき非 0 で終了し、記録を作らない。
- **監査ログ**: 削除・退避・延長・拒否は `.ut-tdd/logs/worktree-lifecycle.jsonl` に 1 行 1 イベントで追記する (`at` / `action` / `branch` / `worktree_path` / `result` / `reason` / `archive_ref`)。監査の追記に失敗した場合、その run の**削除は行わない** (記録できない破壊的操作はしない)。

## 5. 実行面

| 面 | 内容 |
|---|---|
| `pr merge` の後処理 | `runPrMerge` が `ok` を返したあと、その PR の head branch を `merged` として記録する (merge commit・時刻)。**削除は試みない**。結果は `pr merge` の出力に 1 行足す (`cleanup=recorded` / `cleanup=error:<reason>`)。実際の削除は `worktree prune` が行う (他プロセスの cwd は portable に観測できず、merge 直後の削除は稼働中の worktree を壊しうるため) |
| `ut-tdd worktree prune` | 既定は dry-run。対象を「回収できる / 保持中 (理由・期限) / 回収できない (理由)」に分けて列挙し、purge の対象 (14 日経過) と「purge 要確認」(lease の無い trash) も出す。`--apply` を付けたときだけ実行し、1 run の回収と purge はそれぞれ 20 件まで。超えた分は次回へ回す。`--apply` は dry-run と同じ判定関数を使い、判定の経路を 2 本にしない |
| doctor check `worktree-retention` | **warn のみ** (fail-close にしない)。(a) 期限切れ・条件成立の保持、(b) `stale`、(c) 理由なしまたは壊れた保持記録、(d) `warning` / `expired` の件数を出す。出力は `branch: state (reason)` と末尾の集計行 |
| SessionStart / EOD 棚卸し | `warning` / `expired` の対象と、直近の退避 (archive ref 名と取り戻し方) を `escalationLines` に載せる。EOD 棚卸し (`CLAUDE.md` §定期棚卸し) の 1 行に `ut-tdd worktree prune` (dry-run) を足す |

## 6. 回収前の安全条件

reap (回収) は **破壊的でない**。実体を削除せず、退避を済ませたうえで同一 volume の rename で trash へ移す (§6.2)。実体の削除は 14 日後の purge だけが行い、別の再検査を通る (§6.3)。

回収してよいのは、次の**全て**を満たすときだけ。1 つでも外れたら動かさず、理由を出して残す。判定は実行の直前に評価し直す (キャッシュした判定を使わない)。判定前に `git fetch origin` を行い、失敗したら動かさない。

| # | 条件 | 判定 |
|---|---|---|
| S1 | 先端の扱いが決まっている | 先端が `origin/main` に含まれる (`git merge-base --is-ancestor refs/heads/<b> origin/main`) なら、reap の最後に local branch を消してよい。含まれないときは §7 の退避 ref の作成・検証に**成功**した場合のみ進め、local branch は消さず残す (先端は archive ref にも保たれる)。PR が MERGED でも先端が含まれなければ後者 (#707) |
| S2 | 対象が対象外ではない | worktree 名が `ut-review-*` ではない、primary checkout (`C:/dev/UT-TDD-agent-harness`) ではない、`git worktree list` に登録されている、`C:/dev` 直下である |
| S3 | 保持記録が無い、または期限切れ・条件成立から猶予 2 日が切れた | 有効な保持記録がある間は動かさない |
| S4 | 呼び出し元の作業 worktree ではない (補助) | 呼び出し元の cwd がその worktree 配下なら動かさない。他プロセスの cwd は Windows で portable に観測できないため、安全の根拠にしない |
| S5 | `node_modules` が junction でも辿らない | worktree 直下の `node_modules` が reparse point のとき、rename は junction 自体を移し、中身を辿らない。rename の前後で primary の `node_modules` が存在することを確かめる |
| S6 | 回収と purge の直後に primary の健全性を確かめる | primary の `node_modules` が存在することを確かめる。欠けていたら run 全体を止め、監査ログに `error` を残す |
| S7 | 稼働中の証拠が無い | 次を**全て**満たす。(a) lease (§6.1) が読めて pid が**生存かつ起動時刻が一致**する場合は、lease の古さに関わらず `lease_alive` で動かさない (起動時刻が読めない生存 pid は生存として扱う。pid が生存でも起動時刻が異なれば pid の再利用として死んでいると扱う)。(b) lease の `updated_at` が 6 時間以内なら `lease_active` で動かさない。(c) lease が壊れている・読めない・生存判定ができないときは `activity_unknown` で動かさない。(d) lease が**無い**ことは静止の証拠にならない。静止の根拠は mtime だけで、worktree 配下 (`node_modules` と `.git` を除く) のどのファイルの mtime も 6 時間以内ではない。mtime が 6 時間以内なら `active_recently`、読めなければ `activity_unknown` で動かさない |
| S8 | 1 run の回収が 20 件以内 (`worktree prune` のみ。purge も別に 20 件) | 超過分は次回 |
| S9 | 退避が必要なら退避が完了し検証済みである | §7。退避の ref を作れなかった、または検証が 1 つでも失敗した場合は**動かさない** |
| S10 | 監査ログへ追記できる | §4 |

- `git worktree remove` (`--force` を含む) は reap では使わない。実体は rename で trash に残るため、未コミットの変更がある worktree でも `--force` は要らない。
- 未コミットの変更は**阻害要件ではなく、退避の対象**である (PO 追記 2026-10-15。§7)。退避・検証を済ませてから trash へ移す。

### 6.1 lease と残る危険

- **lease**: harness 管理の session (Claude と Codex。既存の PostToolUse / SessionStart の hook) は、自分が動いている worktree の `.ut-tdd/state/worktree-lease.json` (untracked) を heartbeat として更新する。項目は `pid` / `process_start_time` / `provider` / `session` / `updated_at`。起動時刻は、そのプラットフォームの process 情報から読む (読めなければ省く)。生存判定は `process.kill(pid, 0)` で存在を調べ、`process_start_time` があれば現在の起動時刻と照合する。
- hook は fail-open (失敗しても session は落ちない) なので、lease が書かれない・止まる session がありうる。**lease が無いことを静止の証拠にしない** (S7 d)。そのため回収を破壊的にしない (§6.2)。lease が無い稼働中の session がその worktree を読んでいても、実体は trash に残り、内容は失われない。
- **残る危険 (明示)**: 回収で変わるのは、プロセスが開いている path だけである。Windows では、開いている handle や cwd があると rename が失敗して何も変わらない。POSIX では handle が有効なまま残る。cwd の path 文字列が変わるプロセスは、trash の path からなら全ファイルを読める。14 日の purge までは内容を失わない。harness の外のプロセス (人間のエディタ、外部ツール) も同様で、戻すときは §6.2 の手順に従う。

### 6.2 回収 (reap): trash への移動

順序は固定で、どの段で失敗しても、それ以降を行わない。

1. §6 の条件 (S9 の退避と検証を含む) を満たす。
2. admin entry (`<git-common-dir>/worktrees/<name>/`) を trash の隣 (`<name>.admin/`) に**コピー**する (小さく、戻すときに使う)。コピーできなければ中止する。
3. worktree の directory を `<git-common-dir>/ut-tdd-trash/worktrees/<yyyymmddThhmmssZ>-<name>` へ **同一 volume の rename** で移す。copy も delete もしない。volume が異なる場合は `cross_volume` で何もしない。rename が失敗した場合 (Windows で使用中など) は、**何も変えずに停止**し、`error:rename_failed` を監査ログに記録して先へ進む (再試行しない)。
4. 隣に `<yyyymmddThhmmssZ>-<name>.meta.json` を書く (`original_path` / `branch` / `head_oid` (回収時点の HEAD の oid) / `moved_at` / `archive_ref` / `reason` / `lease_evidence`)。`lease_evidence` は reap の判定時点の lease の状態で、`dead_pid` (lease があり pid が死んでいた) / `pid_reuse` (pid が生存だが起動時刻が異なり再利用と判定) / `none` (lease が無かった) / `undeterminable` (生存を判定できなかった) のいずれか。
5. `git worktree prune` で git の worktree 一覧から外す。
6. 先端が `origin/main` に含まれる branch だけ `git branch -d` で消す (含まれない branch は残す)。
7. 監査ログに `trashed` を追記し、S6 の健全性を確かめる。

**戻す** (purge される前): (1) `<name>.admin/` を `<git-common-dir>/worktrees/<name>/` へ戻し、(2) trash の directory を `original_path` へ rename する。(3) branch を `meta.json` の `branch` / `head_oid` に合わせて整える。branch が**無い**とき(merged で reap 時に消した場合)は `head_oid` に branch を作り直す。branch が**同じ oid** にあるときはそのまま。branch が**異なる oid** にあるときは動かさず、戻した worktree を `head_oid` で detach したままにして、その旨を報告する。(4) `git worktree repair <original_path>` を実行する。結果として `git rev-parse HEAD` が `head_oid` になり(HEAD が unborn にならない)、index・作業ツリー・未追跡は reap 前と同一である。`git worktree list` に再び現れる。別の方法として、§7 の 5 の手順で archive ref から復元する。

### 6.3 purge: trash の実体削除

reap (trash への移動) は無音で自動だが、**実体の最終削除は、静止の肯定的な証拠があるものだけ自動**にする。読み取りだけの稼働プロセスは mtime を変えないので、lease が無い対象は 14 日後でも静止を証明できない。

- **自動 purge の対象**: `lease_evidence` が `dead_pid` または `pid_reuse` で、かつ trash に移してから 14 日が過ぎたもの。実行の直前に次を**全て**再検査する。1 つでも外れたら削除せず trash に残す。
  - (a) trash の directory の中に、alive な lease の pid (起動時刻が一致するもの) が無い。lease が壊れている・読めないときも削除しない。
  - (b) trash の中のどのファイルの mtime も `moved_at` より後ではない (`node_modules` は junction を辿らず、junction 自体の存在だけを見る)。mtime が読めなければ削除しない。
  - (c) 監査ログへ追記できる。
- **自動 purge しない対象**: `lease_evidence` が `none` または `undeterminable` のもの。14 日が過ぎても削除しない。EOD 棚卸しと `worktree prune` の dry-run に「purge 要確認」として一覧に出す(`id`・元の path・`moved_at`・経過日数)。人が確認して、**1 コマンドに 1 対象**の `ut-tdd worktree prune --purge-confirmed <id>` で削除する。この操作は (a)(b)(c) の再検査を行い(外れたら拒否)、`purged` を確認者つきで監査ログに記録する。
- 自動の purge で消える実体は少なくとも 1 つの肯定的な証拠(死んだ pid の lease)を持つ。lease の無い対象は、C:/dev から消える(trash に移る)ところまでは無音で進み、ディスクから消すところだけが人の確認を要する。

削除する前に、`node_modules` の junction があれば link だけを外し、不在を確かめる (辿らない)。外せなければ削除しない。purge は通常の filesystem 削除で、git の操作ではない。Windows のロックで消せなければ `error:locked` を記録して次回に回す。purge のあと、S6 の健全性を確かめる。unmerged の local branch が残っていれば、purge と同時に消す (先端は archive ref が 90 日保つ)。

## 7. 退避

「無音で回収されても成果が失われない」ための仕組み。退避先は `refs/ut-tdd/archive/<branch>` (branch 名の `/` はそのまま階層になる)。退避 ref は 90 日で回収する (`worktree prune --apply` が、監査ログの退避イベントの `at` から 90 日を超えた archive ref を削除する (trash にまだ残る対象の ref は消さない)。commit の committer date は使わない)。

1. **未コミットの変更** (追跡ファイルの変更、staged の変更、未追跡ファイル): 素の `git stash create` は**未追跡ファイルを捕まえない**(一時 repo での実測)。また worktree の内容だけを保存すると、staged の内容が失われる (HEAD=A、index=B、worktree=C のとき C しか残らない)。`git stash` と同じ二層構造で、実 index に触れずに保存する。
   1. **index commit**: 実 index の `git write-tree` (読み取りのみで index を変えない) の tree から `git commit-tree <tree> -p HEAD` で commit I を作る。
   2. **worktree commit**: `GIT_INDEX_FILE=<一時ファイル>` を設定し、`git read-tree HEAD` で一時 index を HEAD に初期化し、`git add -A` する (`.gitignore` を尊重。追跡の変更・削除・未追跡ファイル・入れ子の未追跡 dir を含む)。`git write-tree` の tree から `git commit-tree <tree> -p HEAD -p <I>` で commit W を作る。
   3. 一時 index を削除する。実 index・作業ツリー・stash リストは変えない。
   4. `git update-ref refs/ut-tdd/archive/<branch> <W>`。
   - **ignored ファイルは意図的に退避から除く**: `node_modules` (再生成可能で巨大。junction の先を辿る事故も避ける)、`.ut-tdd/` の runtime state・log (機械固有)、build 成果物 (`dist/` 等)。復元で byte 同一を保証する範囲は「`.gitignore` に該当しない全ファイル」。除外集合は実装で明示的な定数として持つ。ignored に誤分類された手書きの成果物は退避されないのが既知の限界で、監査ログに除外件数を残す。
2. **main に含まれない commit**: branch の先端はそのまま `refs/ut-tdd/archive/<branch>` に `git update-ref` する。1 と 2 の両方があるときは 1 の commit W (親は HEAD = branch 先端) が先端の commit を含む。
3. **検証 (trash への移動の前提)**: (a) `git rev-parse refs/ut-tdd/archive/<branch>` が作った oid W と一致する。(b) W の tree と I の tree を再構成して (一時 index に `read-tree` し `write-tree` する)、退避時に記録した tree hash (worktree tree と index tree) と一致する。(c) W の親に I と元の先端がある。1 つでも失敗したら S9 で**動かさない**。
4. 同名の archive ref が既にあるときは上書きせず、`refs/ut-tdd/archive/<branch>@<yyyymmddThhmmssZ>` を使う。
5. **取り戻し方** (監査ログと SessionStart に出す): 次の手順で HEAD・index・作業ツリーを退避時と同じに戻す。W を直接 checkout すると HEAD が W になり、`git diff --cached` が崩れる (実測) ので使わない。
   1. `git worktree add --detach <path> <W^1>` (HEAD = 元の先端 A)。
   2. `git -C <path> read-tree --reset -u <W>` (index と作業ツリーを W にする。HEAD は動かない)。
   3. `git -C <path> read-tree <I>` (index を I にする。作業ツリーは触らない)。W にあって I にも A にも無いファイルは、未追跡に戻る。
   4. branch 名を戻すときは `git -C <path> switch -c <branch>` (index と作業ツリーを保つ)。
   結果は HEAD = A、index = B(staged)、作業ツリー = C。
6. archive ref は remote へ push しない (local の保険)。

## 8. fail-open / fail-close

| 工程 | 失敗時 |
|---|---|
| `pr merge` の後処理全体 | **fail-open**: 後処理が失敗しても、`pr merge` の終了コードと結果 (`ok`) は merge の成否だけで決まる。後処理の例外は握って `cleanup=error:<reason>` として出す |
| 回収前の安全条件 (S1 から S10) の評価 | **fail-close** (動かさない): 評価できない・判定が割れる・git が失敗する場合は動かさない |
| 退避の作成と検証 (S9) | **fail-close**: 退避が必要なのに作れなかったら動かさない |
| admin entry のコピー、rename (§6.2) | **fail-close**: 失敗したら何も変えずに停止する。rename 後の失敗 (meta 書き込み、prune) は trash の実体を残し、戻せる状態で `error` を記録する |
| lease の読み取り・生存判定 | 壊れている・読めない・判定できないときは動かさない。lease が無いことは静止の証拠にならない |
| purge の再検査 (§6.3) | **fail-close**: 1 つでも外れたら削除しない。lease の無い対象は自動では削除しない |
| 保持記録の読み込み | 壊れていたら何も回収しない |
| 回収条件の観測 (`gh`) | 観測できなければ条件不成立と見なす |
| 監査ログの追記 | **fail-close** (その run の回収・purge を行わない) |
| lease を書く hook | **fail-open**: 失敗しても session を落とさない (だから回収は破壊的にしない) |
| doctor check / SessionStart の警告 | **fail-open**: 警告の生成に失敗しても落とさない |
| Windows のロック・使用中 | その対象だけ記録して先へ進む。残りの対象は続ける |
| S6 (primary の node_modules 欠落) | **run 全体を止める** (以降の対象を処理しない) |

## 9. 関数の契約 (simple signature)

実装 PR で置く純粋関数と薄い adapter の境界。層を増やさず、判定を純粋関数にして副作用から切り離す。

- `classifyTarget(facts, record | undefined, now, config) => TargetState`: §3 の状態を導く純粋関数。
- `evaluateReap(facts, record | undefined, state, context) => { allow: true, archive: ArchivePlan | null, deleteBranch: boolean } | { allow: false, reason: DenyReason }`: §6 の S1 から S4 と S7 を判定する純粋関数。lease の生存判定 (pid の存在と起動時刻の一致) と mtime は facts として渡す。`DenyReason` は列挙 (`protected_target` / `retained` / `current_cwd` / `lease_alive` / `lease_active` / `activity_unknown` / `active_recently` / `cross_volume` など)。
- `evaluatePurge(trashFacts, now) => { allow: true } | { allow: false, reason }`: §6.3 の再検査を判定する純粋関数。
- `planRun(targets, config) => { run: Target[]; deferred: Target[] }`: 20 件上限 (reap と purge を別に) を適用する純粋関数。
- adapter (副作用): `git` / `gh` / ファイルの read と write、trash への rename、purge 時の junction の unlink、lease の読み取りと生存判定、archive ref の作成と読み戻し、監査ログの追記。

## 10. 既存の残骸の初回回収手順

1. 実装 PR の後、`ut-tdd worktree prune` (dry-run) の出力を PR コメントに貼り、分類 (回収できる / 保持中 / 回収できない) の件数を記録する。
2. 保持が要る worktree / branch (作業中の lane、blocked な PLAN など) には、`ut-tdd worktree retain` で理由と期限を付ける。これは**各保持者が行う**。
3. `ut-tdd worktree prune --apply` を、1 run 20 件で繰り返し、dry-run の「回収できる」が 0 になるまで続ける。run ごとに監査ログと件数を記録する。実体の削除は trash に移してから 14 日後の purge で起きる (lease が無かった対象は人の確認が要る)。
4. 保持記録を持たない stale な branch は、§3 の T0 の規則に従う (T0 に仮の保持記録、due は T0 + 7 日、T0 + 9 日で reap)。一括では消さない。T0 は `prune` の再実行で動かない。
5. 完了条件は issue #1069 のとおり: (a) merge 後に安全な worktree / branch が自動で回収され (trash)、14 日後に消える、(b) 残すものは全て理由と期限 / 条件を持つ、(c) 既存の残骸が保持付きのものを除いて片付く。

## 11. 実装 PR の順序 (1 PR = 1 論点)

1. 契約 (本書 + L7 test-design) と pair-freeze。本 PR。
2. Red: `it.fails` で候補 ID (CANDIDATE-U-WTLIFE-*) を引用し、安全条件と退避の oracle を入れる。
3. Green A: `evaluateDeletion` / `classifyTarget` / `planRun` (純粋関数) と保持記録の read / write。
4. Green B: 退避 (archive ref)、trash への rename、purge の adapter (junction unlink を含む。PLAN-L6-661 の primitive と共有できる部分は共有)。
5. Green C: `pr merge` の後処理 (`merged` の記録のみ。fail-open)。
6. Green D: `ut-tdd worktree prune` (dry-run 既定 / `--apply` / `--purge-confirmed <id>`)、`retain` / `extend`。
7. Green E: doctor check `worktree-retention` と SessionStart / EOD の警告。
8. 既存の残骸の回収 (§10)。

各 Green の後に Refactor (または「Refactor なし (理由)」) を置く (`CLAUDE.md` §PR スコープ規律 5)。

## 12. 決定事項 (control lane、2026-10-15)

1. **削除 primitive の所有**: PLAN-L6-661 の `ut-tdd worktree remove` が先に入ればそれを共有する。先に入らなければ Green B が同じ契約の primitive を置き、661 はそれを呼ぶ側に回る。どちらかは実装着手時に PLAN-L6-661 の status を実測して決める。
2. **稼働中の判定と回収の性質**: pid の生存と起動時刻の一致で判定し (古さに関わらず生存なら動かさない)、mtime が 6 時間静止であることを併せて要求する。lease が無いことは静止の証拠にしない。回収 (reap) は破壊的にせず、退避の検証後に同一 volume の rename で trash へ移し、実体の削除は 14 日後の purge だけが再検査付きで行い、lease が無かった対象は人の `--purge-confirmed` を要する。`pr merge` の後処理は記録のみ。

## 13. 採らない案

- **追跡する保持台帳** (tracked file): worktree はマシン固有で、他 PC の記録が正本に見える。
- **保持状態の永続化 (state 列を持つ)**: git と保持記録から導出できる状態を別に保存すると stale 化する。
- **既存の `src/runtime/worktree-lifecycle/` へ状態を足す**: あれは worker 用 worktree の create / terminal handoff の関心で、人手 lane の branch 回収とは別。結合すると既存の oracle を壊す。
- **reap で `git worktree remove` / `--force` を使う**: 稼働中の reader の内容を失う。rename で trash に移す。
- **lease の無い worktree を静止と見なす**: hook は fail-open で、書かない session がありうる。
- **未コミットの変更がある worktree を無期限に残す**: PO が「無音は自動回収」と決めた (2026-10-15)。代わりに退避で成果を守る。
- **doctor を fail-close にする**: 初日に既存の 145 / 540 で全作業が止まる。まず warn とし、残骸の回収後に再評価する。
