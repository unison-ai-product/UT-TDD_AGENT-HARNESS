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
| `stale` | 保持記録が無く、未 merge で最終活動から 7 日以上 | doctor が警告する (消すかは人が決める)。自動削除はしない | doctor |
| `merged` | PR が MERGED で、head branch の先端が `origin/main` に含まれる | §6 の安全条件を満たせば即削除。外れたら理由を出して残す (merge は成功のまま) | `pr merge` の後処理 / `worktree prune` |
| `retained` | 保持記録が有効 (理由 + 回収期限または回収条件) | 期限・条件まで保持。回収の自動実行はしない | - |
| `warning` | `retained` の期限の 3 日前から | SessionStart と EOD 棚卸しで保持者 (lane) へ警告。延長は理由と新しい期限を書き直す | doctor / session start |
| `expired` | 期限を過ぎた、または回収条件が成立した | 猶予 2 日の間、毎回警告する | doctor / session start |
| `reaped` | 猶予 (2 日) が切れた | §7 の退避を先に行い、§6 の安全条件を満たせば自動削除する | `worktree prune --apply` |

- **無音は自動回収**: 警告に応答が無ければ `reaped` へ進む。保持を続けるときだけ延長の操作 (理由と新しい期限) が要る。
- 日数 (stale 7 日 / 警告 3 日前 / 猶予 2 日 / 退避 ref の保持 90 日 / 稼働中判定 6 時間) は既定値で、設定で変えられる。
- `ut-review-*` など review 用の固定 worktree は対象外 (どの状態にも入れない)。
- 回収条件 (`issue_closed:#N` / `pr_merged:#N`) の成立は `gh` で観測する。観測に失敗した場合は成立と見なさない (消さない側に倒す)。
- `stale` は保持記録の無い対象に出る警告であり、その後に保持記録を付ければ `retained` に入り、付けなければ猶予なしでは消さない (消すのは `merged` と `reaped` だけ)。stale のまま放置された対象の最終処理は §10 の 4 に従う。

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
| `pr merge` の後処理 | `runPrMerge` が `ok` を返したあと、その PR の head branch について §6 を評価し、満たせば worktree を外して local branch を消す。対象は 1 件だけなので 20 件の上限は関係しない。結果は `pr merge` の出力に 1 行足す (`cleanup=removed` / `cleanup=kept:<reason>` / `cleanup=error:<reason>`) |
| `ut-tdd worktree prune` | 既定は dry-run。対象を「消せる / 保持中 (理由・期限) / 消せない (理由)」に分けて列挙する。`--apply` を付けたときだけ実行し、1 run の削除は 20 件まで。超えた分は次回へ回す。`--apply` は dry-run と同じ判定関数を使い、判定の経路を 2 本にしない |
| doctor check `worktree-retention` | **warn のみ** (fail-close にしない)。(a) 期限切れ・条件成立の保持、(b) `stale`、(c) 理由なしまたは壊れた保持記録、(d) `warning` / `expired` の件数を出す。出力は `branch: state (reason)` と末尾の集計行 |
| SessionStart / EOD 棚卸し | `warning` / `expired` の対象と、直近の退避 (archive ref 名と取り戻し方) を `escalationLines` に載せる。EOD 棚卸し (`CLAUDE.md` §定期棚卸し) の 1 行に `ut-tdd worktree prune` (dry-run) を足す |

## 6. 削除前の安全条件

削除してよいのは、次の**全て**を満たすときだけ。1 つでも外れたら消さず、理由を出して残す。判定は削除の直前に評価し直す (キャッシュした判定を使わない)。判定前に `git fetch origin` を行い、失敗したら削除しない。

| # | 条件 | 判定 |
|---|---|---|
| S1 | 先端が main に含まれる | `git merge-base --is-ancestor refs/heads/<b> origin/main`。含まれないときは、§7 の退避 ref の作成と読み戻しに**成功**した場合のみ次へ進める。PR が MERGED でも先端が含まれなければ、退避なしでは消さない (#707) |
| S2 | 対象が対象外ではない | worktree 名が `ut-review-*` ではない、primary checkout (`C:/dev/UT-TDD-agent-harness`) ではない、`git worktree list` に登録されている、`C:/dev` 直下である |
| S3 | 保持記録が無い、または期限切れ・条件成立から猶予 2 日が切れた | 有効な保持記録がある間は消さない |
| S4 | 現在の作業 worktree ではない | 呼び出し元の cwd がその worktree 配下なら消さない |
| S5 | `node_modules` が junction なら先に外す | worktree 直下の `node_modules` が reparse point なら、link だけを外す (中身を辿って消さない)。外した後に不在を確かめ、確かめられなければ**remove へ進まない** |
| S6 | remove の後に primary の健全性を確かめる | 直後に primary の `node_modules` が存在することを確かめる。欠けていたら以降の削除を全て止め、監査ログに `error` を残す |
| S7 | 稼働中ではない (`worktree prune` のみ) | worktree の `logs/HEAD` の更新が 6 時間以内なら稼働中の可能性として消さない。`pr merge` の後処理には適用しない (§12 の未決 2) |
| S8 | 1 run の削除が 20 件以内 (`worktree prune` のみ) | 超過分は次回 |
| S9 | 退避が必要なら退避が完了している | §7。退避の ref を作れなかった、または読み戻した oid が一致しなかった場合は**消さない** |
| S10 | 監査ログへ追記できる | §4 |

- **force を使わない**。`git worktree remove --force` は使わない。branch は S1 を満たした後にだけ消す。Windows のロック (他プロセスが掴んでいる、`EBUSY` / `EPERM`) で消せないときは、`error:locked` を監査ログに記録して先へ進み、再試行しない (次回の run に回す)。
- 未コミットの変更は**自動削除の阻害要件ではなく、退避の対象**である (PO 追記 2026-10-15。§7)。ただし `pr merge` の後処理 (`merged`) では、未コミットの変更がある worktree は退避せず**消さない** (merge 直後に作者が作業を続けている可能性があるため)。`reaped` のときだけ退避して消す。

## 7. 退避

「無音で消えても成果が失われない」ための仕組み。退避先は `refs/ut-tdd/archive/<branch>` (branch 名の `/` はそのまま階層になる)。退避 ref は 90 日で回収する (`worktree prune --apply` が、監査ログの退避イベントの `at` から 90 日を超えた archive ref を削除する。commit の committer date は使わない)。

1. **未コミットの変更** (追跡ファイルの変更、staged の変更、未追跡ファイル): 素の `git stash create` は**未追跡ファイルを捕まえない** (一時 repo での実測)。issue #1069 コメントの「`git stash create` 相当 (未追跡ファイルを含む)」はそのままでは成り立たないので、次の手順に固定する。worktree 内で、実 index に触れずに行う。
   1. `GIT_INDEX_FILE=<一時ファイル>` を設定し、`git read-tree HEAD` で一時 index を HEAD に初期化する。
   2. 同じ一時 index に `git add -A` する (`.gitignore` を尊重する。追跡の変更・削除・未追跡ファイル・入れ子の未追跡 dir を含む)。
   3. `git write-tree` で tree を得て、`git commit-tree <tree> -p HEAD -m <msg>` で commit を作る。
   4. 一時 index を削除する。実 index・作業ツリー・stash リストは変えない。
   - **ignored ファイルは意図的に退避から除く**: `node_modules` (再生成可能で巨大。junction の先を辿る事故も避ける)、`.ut-tdd/` の runtime state・log (機械固有で、ほかの場所に正本がある)、build 成果物 (`dist/` 等)。復元で byte 同一を保証する範囲は「`.gitignore` に該当しない全ファイル」であり、除外する集合は実装で明示的な定数として持つ (暗黙に増減させない)。ignored に誤分類された手書きの成果物は退避されないことが既知の限界で、監査ログに除外した件数を残す。
2. **main に含まれない commit**: branch の先端をそのまま `refs/ut-tdd/archive/<branch>` に `git update-ref` する。1 と 2 の両方があるときは 1 の commit (親は HEAD = branch 先端) を `git update-ref refs/ut-tdd/archive/<branch> <commit>` で載せる。
3. **読み戻し検証**: `git rev-parse refs/ut-tdd/archive/<branch>` が、作った oid と一致することを確かめる。一致しなければ S9 で**削除しない**。
4. 同名の archive ref が既にあるときは上書きせず、`refs/ut-tdd/archive/<branch>@<yyyymmddThhmmssZ>` を使う。
5. **取り戻し方** (監査ログと SessionStart に出す): `git worktree add C:/dev/<name> refs/ut-tdd/archive/<branch>` で復元する。未コミット分を含む場合は、その commit の tree が作業ツリーに展開される。
6. archive ref は remote へ push しない (local の保険)。

## 8. fail-open / fail-close

| 工程 | 失敗時 |
|---|---|
| `pr merge` の後処理全体 | **fail-open**: 後処理が失敗しても、`pr merge` の終了コードと結果 (`ok`) は merge の成否だけで決まる。後処理の例外は握って `cleanup=error:<reason>` として出す |
| 削除前の安全条件 (S1 から S10) の評価 | **fail-close** (消さない): 評価できない・判定が割れる・git が失敗する場合は消さない |
| 退避の作成と検証 (S9) | **fail-close**: 退避が必要なのに作れなかったら消さない |
| 保持記録の読み込み | 壊れていたら何も削除しない |
| 回収条件の観測 (`gh`) | 観測できなければ条件不成立と見なす |
| 監査ログの追記 | **fail-close** (その run の削除を行わない) |
| doctor check / SessionStart の警告 | **fail-open**: 警告の生成に失敗しても doctor / session start を落とさない |
| Windows のロック | その対象だけ記録して先へ進む。残りの対象は続ける |
| S6 (primary の node_modules 欠落) | **run 全体を止める** (以降の対象を処理しない) |

## 9. 関数の契約 (simple signature)

実装 PR で置く純粋関数と薄い adapter の境界。層を増やさず、判定を純粋関数にして副作用から切り離す。

- `classifyTarget(facts, record | undefined, now, config) => TargetState`: §3 の状態を導く純粋関数。
- `evaluateDeletion(facts, record | undefined, state, context) => { allow: true, archive: ArchivePlan | null } | { allow: false, reason: DenyReason }`: §6 の S1 から S5 と S7 を判定する純粋関数。`DenyReason` は列挙 (`tip_not_in_main` / `protected_target` / `retained` / `current_cwd` / `junction_unresolved` / `active_recently` / `dirty_on_merged` など)。
- `planRun(targets, config) => { delete: Target[]; deferred: Target[] }`: 20 件上限を適用する純粋関数。
- adapter (副作用): `git` / `gh` / ファイルの read と write、junction の unlink、archive ref の作成と読み戻し、監査ログの追記。

## 10. 既存の残骸の初回回収手順

1. 実装 PR の後、`ut-tdd worktree prune` (dry-run) の出力を PR コメントに貼り、分類 (消せる / 保持中 / 消せない) の件数を記録する。
2. 保持が要る worktree / branch (作業中の lane、blocked な PLAN など) には、`ut-tdd worktree retain` で理由と期限を付ける。これは**各保持者が行う**。
3. `ut-tdd worktree prune --apply` を、1 run 20 件で繰り返し、dry-run の「消せる」が 0 になるまで続ける。run ごとに監査ログと件数を記録する。
4. 保持記録を持たない stale な branch は、初回に限り、記録の付与を促す警告 (SessionStart と EOD) を 1 週間出したあと、`retained` 扱いの仮記録 (理由: 初回回収の猶予、期限: 警告開始から 3 日 + 猶予 2 日) を機械が付け、通常の `warning` から `reaped` に乗せる。一括では消さない。
5. 完了条件は issue #1069 のとおり: (a) merge 後に安全な worktree / branch が自動で消える、(b) 残すものは全て理由と期限 / 条件を持つ、(c) 既存の残骸が保持付きのものを除いて片付く。

## 11. 実装 PR の順序 (1 PR = 1 論点)

1. 契約 (本書 + L7 test-design) と pair-freeze。本 PR。
2. Red: `it.fails` で候補 ID (CANDIDATE-U-WTLIFE-*) を引用し、安全条件と退避の oracle を入れる。
3. Green A: `evaluateDeletion` / `classifyTarget` / `planRun` (純粋関数) と保持記録の read / write。
4. Green B: 退避 (archive ref) と削除 adapter (junction unlink を含む。PLAN-L6-661 の primitive と共有)。
5. Green C: `pr merge` の後処理 (fail-open)。
6. Green D: `ut-tdd worktree prune` (dry-run 既定 / `--apply`)、`retain` / `extend`。
7. Green E: doctor check `worktree-retention` と SessionStart / EOD の警告。
8. 既存の残骸の回収 (§10)。

各 Green の後に Refactor (または「Refactor なし (理由)」) を置く (`CLAUDE.md` §PR スコープ規律 5)。

## 12. 未決事項

1. **削除 primitive の所有**: PLAN-L6-661 の `ut-tdd worktree remove` は draft で未実装 (`src/cli.ts` に `worktree` command は無い)。既定は「661 の primitive が先」だが、間に合わない場合は Green B で同じ契約の primitive を 1 箇所に置き、661 はその module を呼ぶ側に回る。実装着手時に PLAN-L6-661 の status を実測して決める。
2. **稼働中の 6 時間ガード**: 手運用 script にある。本書は `worktree prune` のみに適用し、`pr merge` の後処理には適用しない、と暫定した。merge 直後は S1 (先端が main に含まれる) と S4 (cwd) が防護になる、という判断を実装 PR の review で確かめる。

## 13. 採らない案

- **追跡する保持台帳** (tracked file): worktree はマシン固有で、他 PC の記録が正本に見える。
- **保持状態の永続化 (state 列を持つ)**: git と保持記録から導出できる状態を別に保存すると stale 化する。
- **既存の `src/runtime/worktree-lifecycle/` へ状態を足す**: あれは worker 用 worktree の create / terminal handoff の関心で、人手 lane の branch 回収とは別。結合すると既存の oracle を壊す。
- **force 削除でロックを突破する**: ロックしているプロセスの作業を壊す。記録して次回に回す。
- **未コミットの変更がある worktree を無期限に残す**: PO が「無音は自動回収」と決めた (2026-10-15)。代わりに退避で成果を守る。
- **doctor を fail-close にする**: 初日に既存の 145 / 540 で全作業が止まる。まず warn とし、残骸の回収後に再評価する。
