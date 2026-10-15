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

> **L6 contract marker**: 本書は worktree と local branch の保持・回収の契約である。関数の simple signature は §9 に置く。oracle の詳細 (CANDIDATE-U-WTLIFE-NNN) は `docs/test-design/harness/L7-worktree-lifecycle-test-design.md` が固定する。実装 PR は本書の対 freeze 後に別に出す (本 PR は契約のみ)。

# worktree とブランチのライフサイクル — 関数設計 (issue #1069)

## 1. 目的

「作った側が merge 後に畳む」は規律だけで、機械の裏付けが無く、worktree とブランチが溜まり続ける。方針 (PO 2026-10-15、issue #1069 本文と 2 コメント) は **既定は消す。残すなら理由と回収時期を書く。黙っていれば消える** である。本書はその方針を、状態遷移・保持記録・回収前の安全条件・trash・復元・実行面に落とす。

設計の核は 2 つ。(1) **回収 (reap) は破壊的にしない**。worktree の実体を同一 volume の rename で trash へ移すだけで、byte を一切変えない。(2) **実体の最終削除 (purge) は、追跡内容が main に完全に含まれると証明できるものだけ自動**にする。それ以外は人が確認して消す。

既存の機構との境界:

- `src/runtime/worktree-lifecycle/` (PLAN-L7-501 / PLAN-L7-513) は、harness が worker 用に作る worktree の create / terminal handoff / lease 解放を扱う。人手や lane が作った worktree と local branch の回収は持たない。本書はそこへ状態を足さず、別の関心として独立に置く。新規 module は `src/runtime/worktree-retention/` とする。
- PLAN-L6-661 (draft) は 1 本の worktree を安全に外す primitive の契約である。本書の回収は `git worktree remove` を使わず rename で行うので、661 とは junction の扱い (S5) だけを共有する (§12 の 1)。

## 2. 現状実測 (2026-10-15)

| 対象 | 件数 | 備考 |
|---|---|---|
| worktree | 145 (本 worktree 作成後は 146) | `git worktree list` |
| local branch | 540 (本 worktree 作成後は 545)、うち main へ merge 済み 212 | issue #1069 の実測 |
| remote branch | 183 | リポジトリの merge 時自動削除は有効 |

根拠となる現行コード:

- `src/cli/pr-merge.ts:13-33` の `pr merge` は `runPrMerge` を呼んで結果を出すだけで、merge 後の後片付けが無い。`gh pr merge` は `src/feedback/review-merge-gate.ts:521` の `mergePullRequest` port が実行する。後処理の差し込み位置は、`registerPrMergeCommands` の action 内で、`runPrMerge` が `ok` を返したあとである。
- doctor の check 登録は `src/doctor/index.ts:148,175` (`worktree-topology-advisory` と同じ場所)。SessionStart の digest は `src/handover/session-start-digest.ts:295,346` で、`escalationLines` を受ける。
- 手運用の `~/.claude/scripts/wt-remove-batch.sh` (PO 2026-10-13) は、1 回 20 本、C:/dev 直下・登録済み・main checkout 以外・未コミット 0・HEAD が origin/main に含まれる、を確かめ、`logs/HEAD` の更新が 360 分以内なら止まり、`node_modules` が junction なら外してから remove し、直後に main の `node_modules` の存在を確かめる。本書はこれを機械に移す。
- `.ut-tdd/state/*` は gitignore (`.gitkeep` のみ追跡)。

事故の教訓:

- #707: merge 済み PR でも、merge 後の push で branch 先端に main へ未到達の commit が残る。branch を消す前に先端が main に含まれることを確かめる。
- 2026-09-16 (通算 5 回、PLAN-L6-661): worktree の `node_modules` が directory junction のとき、`git worktree remove` が junction を辿り primary の `node_modules` を空にした。**junction は先に外して不在を確かめ、`git worktree remove` は使わず、junction を辿る操作をしない**。

## 3. 状態遷移

対象は branch 単位の 1 本 (worktree があれば紐づける)。状態は保持記録 (§4) と git の観測値から**導出**し、状態そのものを別に永続化しない。

| 状態 | 入る条件 | 起きること | 主体 |
|---|---|---|---|
| `active` | 作成直後、または PR 未 merge で最終活動から 7 日未満 | 何もしない | - |
| `stale` | 保持記録が無く、未 merge で最終活動から 7 日以上 (検出時刻を T0 とする) | T0 に仮の保持記録を作る (下の T0 規則)。以後 `warning` から `expired`、`reaped` へ進む | doctor / prune |
| `merged` | PR が MERGED で、head branch の先端が `origin/main` に含まれる | `pr merge` の後処理は**何も動かさず**、`merged` (merge commit と時刻) を記録するだけ。回収は `worktree prune` が §6 を満たしたときに行う | `pr merge` の後処理 (記録のみ) / `worktree prune` |
| `retained` | 保持記録が有効 (理由 + 回収期限または回収条件) | 期限・条件まで保持 | - |
| `warning` | `retained` の期限の 3 日前から | SessionStart と EOD 棚卸しで保持者 (lane) へ警告。延長は理由と新しい期限を書き直す | doctor / session start |
| `expired` | 期限を過ぎた、または回収条件が成立した | 猶予 2 日の間、毎回警告する | doctor / session start |
| `reaped` | `merged` で §6 を満たした、または猶予 (2 日) が切れた | §6.2 の回収 (trash への同一 volume の rename)。**削除はしない** | `worktree prune --apply` |
| `trashed` | trash に移した | 14 日間、元の path へ戻せる | - |
| `purged` | §6.3 の自動 purge、または人の `--purge-confirmed` | trash の実体を削除する | `worktree prune` |

- **無音は自動回収**: 警告に応答が無ければ `reaped` (trash) へ進む。保持を続けるときだけ延長の操作が要る。
- 日数 (stale 7 日 / 警告 3 日前 / 猶予 2 日 / trash の保持 14 日 / 静止判定 6 時間) は既定値で、設定で変えられる。
- `ut-review-*` など review 用の固定 worktree は対象外 (どの状態にも入れない)。
- 回収条件 (`issue_closed:#N` / `pr_merged:#N`) の成立は `gh` で観測する。観測に失敗した場合は成立と見なさない。
- 時計は 1 本にする。`stale` を初めて検出した時刻を **T0** とし、T0 に仮の保持記録 (reason: 初回の stale 回収、holder: 機械、due: T0 + 7 日) を作る。T0 から due までの 7 日が警告期間で、状態は T0 から `warning`。due で `expired`、due + 2 日 (= T0 + 9 日) で `reaped`。`prune` を再実行しても T0 は動かない。保持者が延長すれば通常の延長 (§4) になる。

## 4. 保持記録

残す worktree / branch の記録。理由なしの保持は認めない。

| field | 型 | 内容 |
|---|---|---|
| `target_kind` | `"worktree"` または `"branch"` | 対象の種別 |
| `branch` | string | 対象 branch (必須) |
| `worktree_path` | string または null | worktree の絶対 path (正規化済み)。branch のみなら null |
| `reason` | string (空不可) | 保持する理由 |
| `holder_lane` | string (空不可) | 保持者 (lane 名) |
| `due` | `{ date: "YYYY-MM-DD" }` または `{ condition: "issue_closed:#N" \| "pr_merged:#N" }` | 回収期限または回収条件。どちらか 1 つ |
| `extensions` | array of `{ at, reason, previous_due, new_due, by }` | 延長の履歴。延長は reason と新しい due を必須とする |
| `created_at` | ISO 8601 | 記録日時 |

- **置き場**: `.ut-tdd/state/worktree-retention.json` (1 ファイル、branch をキーとする)。worktree はマシン固有で他の clone と共有できないため、追跡しない (`.gitignore` の `.ut-tdd/state/*` で既に untracked)。
- 書き込みは一時ファイルへ書いて rename する。読み込み時にファイルが壊れていれば**保持が有るものとして扱い、何も動かさない**。
- 記録の操作は `ut-tdd worktree retain --branch <b> --reason <r> --holder <lane> (--until <date> | --until-condition <c>)` と `ut-tdd worktree extend --branch <b> --reason <r> --until <date>`。`reason` か `holder` が空、due が 0 個または 2 個のとき非 0 で終了し、記録を作らない。
- **監査ログ**: 回収 (`trashed`)・purge (`purged`)・戻し (`restored`)・延長・拒否は `.ut-tdd/logs/worktree-lifecycle.jsonl` に 1 行 1 イベントで追記する (`at` / `action` / `branch` / `worktree_path` / `result` / `reason`)。追記に失敗した場合、その run の回収・purge は行わない。

## 5. 実行面

| 面 | 内容 |
|---|---|
| `pr merge` の後処理 | `runPrMerge` が `ok` を返したあと、その PR の head branch を `merged` として記録する。**何も動かさない**。結果は出力に 1 行足す (`cleanup=recorded` / `cleanup=error:<reason>`)。他プロセスの cwd は portable に観測できず、merge 直後の移動は稼働中の worktree を壊しうるため |
| `ut-tdd worktree prune` | 既定は dry-run。対象を「回収できる / 保持中 (理由・期限) / 回収できない (理由)」に分けて列挙し、自動 purge の対象と「purge 要確認」(確認 purge が要る trash。失われるもの付き) も出す。`--apply` を付けたときだけ回収と自動 purge を実行し、それぞれ 1 run 20 件まで。`--apply` は dry-run と同じ判定関数を使う |
| `ut-tdd worktree prune --purge-confirmed <id...>` | 確認 purge。最大 20 id を 1 run で受け、各 id を個別に再検査する (§6.3) |
| doctor check `worktree-retention` | **warn のみ**。期限切れ・条件成立の保持、`stale`、理由なしまたは壊れた保持記録、`warning` / `expired` の件数、purge 要確認の件数を出す |
| SessionStart / EOD 棚卸し | `warning` / `expired` の対象と、trash に移した対象の戻し方・purge 要確認の件数を `escalationLines` に載せる。EOD の 1 行に `ut-tdd worktree prune` (dry-run) を足す |

## 6. 回収前の安全条件

回収 (reap) は実体を削除せず、同一 volume の rename で trash へ移すだけである (§6.2)。回収は `merged` と `expired` の**どちらにも同じ経路**で行う。回収してよいのは次の**全て**を満たすときだけ。1 つでも外れたら動かさず、理由を出して残す。判定は実行の直前に評価し直す。判定前に `git fetch origin` を行い、失敗したら動かさない。

| # | 条件 | 判定 |
|---|---|---|
| S2 | 対象が対象外ではない | worktree 名が `ut-review-*` ではない、primary checkout ではない、`git worktree list` に登録されている、`C:/dev` 直下である |
| S3 | 保持記録が無い、または期限切れ・条件成立から猶予 2 日が切れた | 有効な保持記録がある間は動かさない |
| S4 | 呼び出し元の作業 worktree ではない (補助) | 呼び出し元の cwd がその worktree 配下なら動かさない。他プロセスの cwd は観測できないので安全の根拠にしない |
| S5 | `node_modules` の junction を先に外す | worktree 直下の `node_modules` が reparse point なら、link だけを外し、**不在を確かめる**。確かめられなければ rename へ進まない。junction を辿る操作 (中身の列挙・削除・`git worktree remove`) をしない (2026-09-16 の primary `node_modules` 消失事故の再発防止)。復元時は junction を作り直す (§7) |
| S6 | 回収と purge の直後に primary の健全性を確かめる | primary の `node_modules` が存在することを確かめる。欠けていたら run 全体を止め、`error` を記録する |
| S7 | 稼働中の証拠が無い | (a) lease (§6.1) が読めて pid が**生存かつ起動時刻が一致**する場合は、古さに関わらず `lease_alive` で動かさない (起動時刻が読めない生存 pid は生存として扱う。pid が生存でも起動時刻が異なれば再利用として死んでいると扱う)。(b) lease の `updated_at` が 6 時間以内なら `lease_active`。(c) lease が壊れている・読めない・判定できないときは `activity_unknown`。(d) lease が**無い**ことは静止の証拠にならない。静止の根拠は mtime だけで、worktree 配下 (`node_modules` と `.git` を除く) のどのファイルの mtime も 6 時間以内ではない。6 時間以内なら `active_recently`、読めなければ `activity_unknown` |
| S8 | 1 run の回収が 20 件以内 | 超過分は次回 (purge も別に 20 件) |
| S10 | 監査ログへ追記できる | §4 |

(S1 と S9 は、archive commit の廃止により欠番。)

### 6.1 lease と残る危険

- **lease**: harness 管理の session (Claude と Codex。既存の PostToolUse / SessionStart の hook) は、動いている worktree の `.ut-tdd/state/worktree-lease.json` (untracked) を heartbeat として更新する。項目は `pid` / `process_start_time` / `provider` / `session` / `updated_at`。生存判定は `process.kill(pid, 0)` で存在を調べ、`process_start_time` があれば現在の起動時刻と照合する。
- hook は fail-open なので、lease が書かれない session がありうる。**lease が無いことを静止の証拠にしない** (S7 d)。回収が破壊的でないので、lease が無い session が読んでいても内容は失われない。
- **残る危険 (明示)**: 回収で変わるのは path だけである。Windows では handle や cwd があると rename が失敗して何も変わらない。POSIX では handle が有効なまま残る。harness の外のプロセス (人間のエディタ、外部ツール) も同様。

### 6.2 回収 (reap): trash への移動

順序は固定で、どの段で失敗しても以降を行わない。

1. §6 の条件を満たす。
2. `node_modules` が junction なら外し、不在を確かめる (S5)。
3. **index 保護 ref を作る**: rename の前に、worktree の実 index が参照する object を GC から守る。実 index の**コピー**に対する `write-tree` (`git write-tree` は cache-tree 拡張を更新して index file に書き戻すため、実 index に直接実行しない。Sol r3 が 110→129 byte の増加を測定): `git -C <worktree> rev-parse --git-path index` で実 index の path を解決し、その file を byte 単位で一時 file にコピーし、`GIT_INDEX_FILE=<一時コピー> git -C <worktree> write-tree` を実行して、終わったら一時コピーを削除する。worktree の改行変換などは通らず、index の内容そのまま。得た tree から `git commit-tree <tree> -p <HEAD>` で commit を作り、`git update-ref refs/ut-tdd/trash/<entry-id>/index <commit> 0000000000000000000000000000000000000000` (既存なら失敗する create-only) で ref を作る。commit の oid を `meta.json` の `index_ref_oid` に記録する。`write-tree` が失敗する (未解決の conflict を含む index など) か、`update-ref` が失敗した (ref が既にある等) ときは、**回収を拒否**する。どの失敗経路でも、実 index の file は byte 単位で変わらず(書かれるのは一時コピーだけ)、一時コピーは削除される。index にだけある object (HEAD=A、staged=B、worktree=C の B) は、admin entry を prune すると GC の起点でなくなり、trash の `.admin/` のコピーも起点ではないため、この ref が無いと GC で失われる。未追跡・ignored のファイルは object ではなく trash の中の生 byte なので ref は要らない。
3b. admin entry (`<git-common-dir>/worktrees/<name>/`) を trash の隣 (`<name>.admin/`) に**コピー**する。コピーできなければ中止する。
4. worktree の directory を `<git-common-dir>/ut-tdd-trash/worktrees/<yyyymmddThhmmssZ>-<name>` へ **同一 volume の rename** で移す。copy も delete もしない。byte は一切変わらない (改行、clean filter の対象、権限を含む)。volume が異なる場合は `cross_volume`、rename が失敗した場合 (Windows で使用中など) は `error:rename_failed` を記録し、**何も変えずに停止**する (再試行しない)。停止時、S5 で外した junction は作り直す。
5. 隣に `<yyyymmddThhmmssZ>-<name>.meta.json` を書く。
6. `git worktree prune` で git の worktree 一覧から外す。
7. **branch**: `merged_clean` (下) のときだけ、`git update-ref -d refs/heads/<b> <oid>` で消す。`<oid>` は消す直前に読み直した先端で、`git merge-base --is-ancestor <oid> origin/main` が真であることを確かめたもの。`git branch -d` は使わない (merged 判定が HEAD / upstream に依存する)。それ以外の branch は**消さない**。
8. 監査ログに `trashed` を追記し、S6 の健全性を確かめる。

**`meta.json`**: `original_path` / `branch` / `head_oid` (回収時点の HEAD) / `moved_at` / `reason` / `index_ref_oid` (index 保護 ref が指す commit の oid) / `lease_evidence` (`dead_pid` / `pid_reuse` / `none` / `undeterminable`) / `merged_clean` (真偽) / `dirty_file_count` / `unmerged_commit_count`。

**`merged_clean`**: 回収時点で次の**両方**が真。(1) `git merge-base --is-ancestor <head_oid> origin/main`。(2) 追跡・未追跡の変更が無い (`git status --porcelain` が空。ignored は数えない)。

### 6.3 purge: trash の実体削除

- **自動 purge の対象**: `merged_clean` が真で、trash に移して 14 日が過ぎたものだけ。実行の直前に次を再検査する。
  - (a) trash の中に alive な lease の pid (起動時刻一致) が無い。lease が壊れている・読めないときも削除しない。
  - (b) trash の中のどのファイルの mtime も `moved_at` より後ではない。mtime が読めなければ削除しない。
  - (c) 監査ログへ追記できる。
  - 削除前に `node_modules` の junction があれば link だけを外し、不在を確かめる (辿らない)。実体の削除が済んだあとに、index 保護 ref を `git update-ref -d refs/ut-tdd/trash/<entry-id>/index <index_ref_oid>` で消す (expected-oid つき。oid が異なれば消さず、`error` を記録する)。
- **残るリスク (明示)**: `merged_clean` の追跡内容は main に含まれると証明できるが、次の **ignored の runtime 状態**と、稼働中の reader の作業途中の状態は purge で失われる。lease が無い reader は検出できない。`.gitignore` 由来の主なカテゴリ: `.ut-tdd/state/*`、`.ut-tdd/logs/`、`.ut-tdd/review/{requests,receipts,verdicts}/`、`.ut-tdd/gate_runs/`、`.ut-tdd/cache/*`、`.ut-tdd/tmp/`、`.ut-tdd/archive/`、`.ut-tdd/harness.db`、`.env*`、`.claude/settings.local.json`、`node_modules`。これらは機械生成または machine 固有で、repository の正本は main にあるため、自動 purge の対象として受け入れる。
- **それ以外の trash** (`merged_clean` が偽。dirty・unmerged を含む。lease が無かったもの、判定不能のものも、`merged_clean` が真でなければここに入る): **自動 purge しない**。dry-run と EOD に「purge 要確認」として、元の path・`moved_at`・経過日数・失われるもの (`dirty_file_count`、`unmerged_commit_count`) を出す。人が `ut-tdd worktree prune --purge-confirmed <id...>` で消す。
  - 1 run に最大 20 id。各 id を**個別に**再検査する (静止の再確認、mtime、監査ログ)。
  - 削除の前に、項目ごとに失われるもの (dirty file 数、`origin/main` から到達できない commit 数) を表示する。
  - 未 merge の branch の削除は**ここでだけ**行う。`git update-ref -d refs/heads/<b> <expected-oid>` で、`<expected-oid>` は確認の時点で読み直して表示した oid。現在の oid が異なれば (trash の間に branch が進んだ) その項目を拒否し、branch も実体も消さない。
  - 複数 id のうち 1 つが拒否されても他の項目は続ける。拒否は監査ログに残る。

## 7. 復元

trash から戻す (purge される前)。archive commit は持たない。trash の実体が byte 同一の正本である。

1. `<name>.admin/` を `<git-common-dir>/worktrees/<name>/` へ戻す。
2. trash の directory を `original_path` へ rename する。
3. **index 保護 ref を確かめる**: `refs/ut-tdd/trash/<entry-id>/index` が存在し `index_ref_oid` と一致し、その tree が戻した index の tree と等しいことを(§6.2 の 3 と同じく、実 index の一時コピーに対する `write-tree` で求める。実 index には書かない)確かめる(rename と repair の後)。一致しなければ、復元を完了と報告せず `error` を出す(ref は消さない)。
3b. branch を `meta.json` に合わせて整える。branch が**無い**ときは `head_oid` に作り直す。**同じ oid** にあるときはそのまま。**異なる oid** にあるときは動かさず、戻した worktree を `head_oid` で detach したままにして報告する。
4. `git worktree repair <original_path>` を実行する。
5. S5 で外した `node_modules` の junction を、必要なら作り直す。

復元が検証を通ったら、`git update-ref -d refs/ut-tdd/trash/<entry-id>/index <index_ref_oid>` で ref を消す (expected-oid つき)。

結果として `git rev-parse HEAD` が `head_oid` (unborn にならない) になり、index・作業ツリー・未追跡・ignored は reap 前と byte 同一で、`git worktree list` に現れる。`restored` を監査ログに残す。

## 8. fail-open / fail-close

| 工程 | 失敗時 |
|---|---|
| `pr merge` の後処理 | **fail-open**: 終了コードと `ok` は merge の成否だけで決まる。例外は握って `cleanup=error:<reason>` |
| 回収前の安全条件 (S2 から S10) の評価 | **fail-close** (動かさない) |
| junction の外しと不在確認 (S5) | 確かめられなければ rename へ進まない |
| index 保護 ref の作成 (§6.2 の 3) | **fail-close**: `write-tree` か `update-ref` の失敗は回収を拒否する。実 index file は byte 同一のまま(`write-tree` は一時コピーにだけ行う)で、一時コピーは削除される |
| admin entry のコピー、rename (§6.2) | **fail-close**: 何も変えずに停止 (外した junction は作り直す)。rename 後の失敗 (meta 書き込み、prune) は trash の実体を残し、戻せる状態で `error` |
| lease の読み取り・生存判定 | 壊れている・読めない・判定できないときは動かさない。lease が無いことは静止の証拠にならない |
| 自動 purge の再検査 | **fail-close**: 1 つでも外れたら削除しない |
| 確認 purge の oid 不一致 | その項目を拒否 (branch も実体も消さない) |
| 保持記録の読み込み | 壊れていたら何も回収しない |
| 監査ログの追記 | **fail-close** |
| lease を書く hook | **fail-open** (だから回収は破壊的にしない) |
| doctor check / SessionStart の警告 | **fail-open** |
| S6 (primary の node_modules 欠落) | **run 全体を止める** |

## 9. 関数の契約 (simple signature)

- `classifyTarget(facts, record | undefined, now, config) => TargetState`: §3 の状態を導く純粋関数。
- `evaluateReap(facts, record | undefined, state, context) => { allow: true, mergedClean: boolean } | { allow: false, reason: DenyReason }`: §6 の S2〜S4 と S7 を判定する純粋関数。`DenyReason`: `protected_target` / `retained` / `current_cwd` / `lease_alive` / `lease_active` / `activity_unknown` / `active_recently` / `cross_volume` など。
- `evaluateAutoPurge(trashFacts, now) => { allow: true } | { allow: false, reason }`: `merged_clean` と §6.3 の再検査を判定する純粋関数。
- `evaluateConfirmedPurge(trashFacts, expectedOid) => { allow: true, loss } | { allow: false, reason }`: 個別の再検査と oid 一致を判定し、失われるものを返す。
- `planRun(targets, config) => { run, deferred }`: 20 件上限を reap と purge に別に適用する純粋関数。
- adapter (副作用): `git` / `gh` / ファイルの read と write、junction の unlink、trash への rename、lease の読み取りと生存判定、監査ログの追記。

## 10. 既存の残骸の初回回収手順

1. 実装 PR の後、`ut-tdd worktree prune` (dry-run) の出力を PR コメントに貼り、分類の件数を記録する。
2. 保持が要る worktree / branch には、各保持者が `ut-tdd worktree retain` で理由と期限を付ける。
3. `ut-tdd worktree prune --apply` を、1 run 20 件で繰り返し、「回収できる」が 0 になるまで続ける。run ごとに監査ログと件数を記録する。実体の削除は、`merged_clean` のものは 14 日後に自動で、それ以外は人の `--purge-confirmed` で起きる。
4. 保持記録を持たない stale な branch は、§3 の T0 の規則に従う。一括では消さない。
5. 完了条件は issue #1069 のとおり: (a) merge 後に安全な worktree / branch が自動で回収され (trash)、`merged_clean` は 14 日後に消える、(b) 残すものは全て理由と期限 / 条件を持つ、(c) 既存の残骸が保持付きのものを除いて片付く。

## 11. 実装 PR の順序 (1 PR = 1 論点)

1. 契約 (本書 + L7 test-design) と pair-freeze。本 PR。
2. Red: `it.fails` で候補 ID を引用し、回収前の安全条件と trash の oracle を入れる。
3. Green A: `evaluateReap` / `classifyTarget` / `planRun` (純粋関数) と保持記録の read / write。
4. Green B: trash への rename、junction の外し、restore の adapter (PLAN-L6-661 と共有できる部分は共有)。
5. Green C: `pr merge` の後処理 (`merged` の記録のみ)。
6. Green D: `ut-tdd worktree prune` (dry-run 既定 / `--apply` / `--purge-confirmed`)、`retain` / `extend`、自動 purge。
7. Green E: doctor check `worktree-retention` と SessionStart / EOD の警告、lease を書く hook。
8. 既存の残骸の回収 (§10)。

各 Green の後に Refactor (または「Refactor なし (理由)」) を置く (`CLAUDE.md` §PR スコープ規律 5)。

## 12. 決定事項 (control lane、2026-10-15)

1. **junction の扱いの共有**: PLAN-L6-661 の primitive が先に入れば S5 の junction 外しを共有する。先に入らなければ Green B が同じ契約で置き、661 はそれを呼ぶ側に回る。実装着手時に 661 の status を実測して決める。
2. **稼働中の判定と回収の性質**: pid の生存と起動時刻の一致で判定し (古さに関わらず生存なら動かさない)、mtime が 6 時間静止であることを併せて要求する。lease が無いことは静止の証拠にしない。回収は破壊的にせず、実体の削除は `merged_clean` の自動 purge と、人の確認 purge だけが行う。
3. **archive commit の廃止**: index commit / worktree commit による退避は廃止した。`git add -A` は改行変換や clean filter で byte 同一にならず、tree hash の検証も正規化後の tree を比べるため、byte 保存の根拠にならない。trash の rename が worktree 内のファイルの byte を保つ。ただし index にだけある object (staged の B) は、admin entry を prune すると GC の起点でなくなる (trash の admin コピーも起点ではない。Sol r2 が `git gc` で再現)。branch が保つのは commit から辿れる object だけなので、「branch が object を到達可能に保つ」は index 専用の object には成り立たない。そのため reap の前に `git write-tree` + `commit-tree` で commit を作り、`refs/ut-tdd/trash/<entry-id>/index` で保護する (§6.2 の 3)。復元と purge でこの ref を expected-oid つきで消す。未追跡・ignored のファイルは trash の中の生 byte で、object ではない。

## 13. 採らない案

- **追跡する保持台帳** (tracked file): worktree はマシン固有で、他 PC の記録が正本に見える。
- **保持状態の永続化 (state 列を持つ)**: git と保持記録から導出できる状態を別に保存すると stale 化する。
- **既存の `src/runtime/worktree-lifecycle/` へ状態を足す**: 別の関心で、結合すると既存の oracle を壊す。
- **reap で `git worktree remove` / `--force` を使う**: 稼働中の reader の内容を失い、junction を辿る事故の原因になる。rename で trash に移す。
- **archive commit (I/W) による退避**: byte 同一にならない (autocrlf・clean filter)。rename で足りる。
- **lease の無い worktree を静止と見なす**: hook は fail-open で、書かない session がありうる。
- **dirty / 未 merge の trash を自動 purge する**: main に無い内容が失われる。人の確認を要する。
- **doctor を fail-close にする**: 初日に既存の 145 / 540 で全作業が止まる。まず warn とする。
