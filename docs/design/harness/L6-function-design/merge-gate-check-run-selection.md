---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_merge_gate_check_run_selection
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
created: 2026-10-16
issue: 1104
related_issue: 1423
---

> **L6 contract marker**: `evaluateChecksGreen(rollup: unknown[]) => boolean` は unit-test 粒度の contract とする。DbC pre/post/invariant は同じ head の古い check run の扱いを U-RVMG-035..046 に対応づける。

# merge gate の check run 選択規則 - 機能設計 (Issue #1104)

## §1 Scope (範囲)

対象は `src/feedback/review-merge-gate.ts` の `readGhView` が `gh pr view --json headRefOid,state,statusCheckRollup` から導く `checksGreen` の判定である。現行は rollup の全エントリが `conclusion === "SUCCESS"` であることを要求するため、PR の close / reopen などで同じ head に古い失敗 run が残ると、最新 run が緑でも `state:verdict` で deny される。本設計は「同じ check の古い run を、新しい run があるときだけ除外する」ことでこれを解消する。review verdict、exact HEAD 束縛、第二観測の規則は変えない。

## §2 gh が返すフィールド (実測、2026-10-16)

`gh pr view --json statusCheckRollup` の CheckRun エントリは `__typename` / `name` / `workflowName` / `status` / `conclusion` / `startedAt` / `completedAt` / `detailsUrl` を持つ。`detailsUrl` は `https://github.com/<owner>/<repo>/actions/runs/<run id>/job/<job id>` の形で、**workflow run の id を取り出せる**。同じ run 内の job は `startedAt` が同時刻になりやすい (実測)。未完了の job は `conclusion` が空文字、`completedAt` が `0001-01-01T00:00:00Z` である。StatusContext (commit status) は `workflowName` / `conclusion` / `detailsUrl` を持たない。

## §3 Functions (関数)

| 関数 | contract |
|---|---|
| `evaluateChecksGreen(rollup: unknown[]) => boolean` | rollup を §4 の規則で判定する。`checksGreen` の唯一の導出点とする。 |

## §4 判定規則 (DbC)

| 区分 | 内容 |
|---|---|
| pre | `rollup` は配列である (配列でなければ従来どおり `gh PR facts invalid`)。 |
| post-1 | rollup が空、または 1 件でも対象エントリの `conclusion` が `SUCCESS` でなければ false (従来どおり、`U-RVMG-010`)。ただし post-2 で除外された古い run のエントリは対象外。 |
| post-2 (重複の定義と統合の条件) | check 名 = `workflowName` (欠落は空) + `name` (StatusContext は `context`)。同じ check 名のエントリが 2 件以上ある状態を**重複**と呼ぶ。重複グループは、(a) 全エントリが CheckRun、(b) `workflowName` が非空、(c) `detailsUrl` から run id を取れる、(d) `startedAt` が parse できる有効な時刻、(e) 異なる run id が 2 つ以上、をすべて満たすときに限り**統合**でき、最新の run 以外のエントリを除外する。 |
| post-3 (最新の決め方) | 最新の run = グループ内で run ごとの最早 `startedAt` が最も新しい run。**開始順**で決め、`completedAt` は使わない (完了順は実行順序を保証しない)。最新の run が 2 つ以上 (同時刻) で決められないとき、または最新の run に同じ check 名のエントリが 2 件以上あるときは false。最新の run のエントリが未完了または `conclusion` 欠落なら、古い run が SUCCESS でも false。 |
| post-4 (順序を決められない重複は常に deny) | 重複グループが統合の条件 (a)〜(e) を 1 つでも満たさない場合 (同じ run id 内の同名エントリ、`workflowName` 欠落、StatusContext 混在、`detailsUrl` 欠落、`startedAt` の欠落・不正・同時刻など) は、**全エントリが SUCCESS でも false**。重複が無い check (同名が 1 件だけ) は統合の対象外で、post-1 だけで判定する。 |
| invariant | 最新が SUCCESS 以外のとき、古い SUCCESS で緑にならない。同じ run 内の別 job の失敗を、後から完了した SUCCESS で消さない。判定は同一の `gh` 応答だけから導き、追加の `gh` 呼び出しを足さない。第二観測 (`evaluatedHeadSha`) の束縛は変えない (`U-RVMG-011`)。 |

同じ run を丸ごと再実行して run id が変わらない場合は post-4 により deny になる (fail-close。古い失敗が残る場合も、全件 SUCCESS でも同じ)。その場合は再 push や close / reopen で新しい run を作る。

## §5 oracle 対応

`U-RVMG-035`〜`046` を `docs/test-design/harness/L7-unit-test-design.md` の「同じ head の古い check run (Issue #1104)」に置く。実テストは `tests/review-merge-gate.test.ts`。

## §6 baseline を持つ gate の並行 PR 競合 (Issue #1423)

### §6.1 事象

doc-split gate と code-size gate は、既存の超過を `docs/governance/*-baseline.json` に記録し、縮小しか許さない。2026-10-27、#1408 が `L7-unit-test-design.md` の行数を baseline に記録した。同じファイルを別 PR (#1414) が 2 行足して先に merge していた。#1408 の CI は #1414 を含まない main に対して緑で、merge 後の main だけが赤になった (#1418 で復旧)。原因は、PR の CI が古い main に対する結果で、baseline の対象を並行 PR が変えると、どちらの CI も緑のまま main が赤になることである。

### §6.2 方式 (merge wrapper での拒否)

`runPrMerge` に、`checksGreen` と review dispatch の判定の後、`gh pr merge` の前の判定を 1 つ足す。純粋関数 `evaluateBaselineConflict(prChanged, mainChanged, gates) => { conflicts: { gate; paths }[] }` と、git を読む adapter に分ける。

- `prChanged`: PR head と `merge-base(PR head, origin/main)` (以下 mb) の差の path。`git diff -M --name-status` の rename は旧 path と新 path の両方を含む。
- `mainChanged`: mb と取得し直した `origin/main` の先端の差の path。mb より後に main で変わった path は、PR の CI が見ていないものとして扱う (CI が実際に検証した base は `gh pr view` から取れないので、見逃さない側に倒す。誤拒否は許し、見逃しは許さない)。
- `gates`: gate ごとの `{ name, inScope(path), baselinePath }`。`inScope` と `baselinePath` は各 gate の定数 (doc-split gate §2 / §5、code-size gate §2 / §5) を import して使い、wrapper に複製しない。
- ある gate の競合: `P` = `prChanged` のうち対象、`M` = `mainChanged` のうち対象 (baseline ファイルも対象に含む) として、次のいずれかを満たす。
  1. `P` と `M` に共通の path がある。
  2. baseline ファイルが `P` にあり、`M` が空でない。
  3. baseline ファイルが `M` にあり、`P` が空でない。

  2 と 3 は、異なるファイルの変更でも干渉するためである。code-size の `functionExcess` は合計で縮小のみを判定し、baseline は 1 ファイル 1 行だが他 PR が縮めた行を前提にする。どの競合も、片側が対象を変えていなければ成り立たない。baseline に載らない新規ファイルは、各 gate が単独で `new-*-over-limit` として止めるので、1〜3 のどれにも当たらない別ファイルどうしは拒否しない。
- 競合が 1 件でもあれば、§6.6 の再計算に進む。再計算で許可されなければ merge しない (fail-close)。reason は `baseline_conflict`、終了コードは非 0 (既存の DENY と同じ 1)。標準出力に gate 名と競合 path を出し、「`git merge origin/main` で main を取り込み、CI が緑になってから再実行する」と案内する。取り込むと mb が進み、競合は解消される。新しい head には新しい review が必要になる (exact-HEAD 束縛は変えない)。
- git の起動・`fetch`・差分の取得に失敗したとき、mb を解決できないときは `baseline_conflict_unknown` で拒否する (「競合なし」にしない)。git には `windowsHide: true` を付ける (issue #693)。

### §6.3 保証の限界

判定の後、merge までの間に main が進む時間差は残る。この方式単独で main の赤を 0 にはしない。到達点は、判定時点で観測できる並行変更を merge 前に止めることで、残りの窓は main の doctor (doc-split / code-size の hard gate) が検知する。

### §6.4 採らなかった案

- merge preview の tree で全 gate を常に再計算する案: 競合の無い PR にまで再計算の時間をかける。**競合した gate だけを再計算する形は §6.6 で採用した** (Issue #1559)。当初の不採用理由 (wrapper が gate の実装全部を呼ぶ、gate の追加に追随が要る) は、各 gate が `check(repoRoot)` 1 本の境界を既に持ち、`BASELINE_GATES` への登録が既に追随点であることから、競合時に限る再計算には当たらないと判断した。
- GitHub の branch protection (require up-to-date) に頼る案: repo 設定への依存になり、設計文書の外で規則が決まる。変更が無関係な PR まで全て取り込みと CI の取り直しを強いる。
- 対象 path が同じときだけ拒否する案: 別ファイルの変更と baseline の変更が干渉する場合 (§6.2 の 2・3) を見逃す。

### §6.6 競合時の再計算 (Issue #1559)

#### 事象

§6.2 は path の重なりだけで拒否する。2026-11-05 の 1 日で #1552・#1555・#1556・#1558 の 4 件が `baseline_conflict` で拒否され、そのうち 3 件は現 main と合成した tree で code-size を計算すると finding が無かった。拒否のたびに、main の取り込み → CI (13〜14 分) → 非著者の再検の往復が 1 回増えた。

#### 方式

§6.2 で競合が見つかったときだけ、次を行う。競合が無い PR は従来どおり再計算しない。

1. **合成**: 取得し直した `origin/main` と PR の exact head を `git merge-tree --write-tree` で合成する。衝突があれば、従来の `baseline_conflict:...` のまま拒否する (再計算しない)。
2. **展開**: `git commit-tree <tree> -p origin/main -p <head>` で合成 commit を作る。一時 worktree の親は、`ut-tdd pr merge` を実行した cwd で `git rev-parse --show-toplevel` を求め、その結果を `fs.realpathSync.native` で実体 path にした repository root の親ディレクトリとする。linked worktree から実行したときも、その linked worktree の root を使い、main worktree を探しにいかない。親ディレクトリ直下に `fs.mkdtempSync(<親>/ut-tdd-baseline-preview-<PR 番号>-)` で一意なディレクトリを原子的に作り、合成 commit を detached で展開する。既存 path は再利用・上書き・削除しない。path の直書きや OS 分岐はせず、設定・環境変数・追加 seam も設けない。一時 worktree に `node_modules` の link (junction / symlink) は作らず、gate はそれ無しで動かす。第 1 親を main にするので、gate が読む `merge-base HEAD origin/main` は `origin/main` になり、baseline の比較元は main の baseline になる。
3. **再計算**: 競合した gate だけを、その gate の `check(repoRoot)` で計算する。`BASELINE_GATES` の各 entry に `check` を足し、wrapper に gate の実装を複製しない。doc-split と code-size の両方を対象にする (片方だけの実装にしない。§6.1 の事故は doc-split 側で起きた)。
4. **判定**: 再計算した全 gate の結果が `ok` (finding 0 件) なら、その競合を解消済みとして merge へ進む。`summary` の `over` / `stale` が 0 であることは判定に使わない。`over` は `*-required` の件数 (上限超過。実測が記録値を上回る場合も含む)、`stale` は `*-stale-baseline` の件数 (記録値が実測より大きい・上限内に戻った・対象から消えた行) であり、baseline の記録値そのものが比較元より増えた場合の `*-baseline-grown` と、`*-class-changed`・`*-initial-baseline-*`・`*-input-unreadable`・`code-size-baseline-base-unreadable` を数えないためである。§6.1 の並行 PR の干渉は、2 つの形で現れる。1 つは、合成後の実測が baseline の記録値を上回る形で、`*-required` として `over` に数えられる (#1408 の事故はこの形)。もう 1 つは、並行 PR の結果として合成後の baseline の記録値そのものが比較元 (現 main) より増える形で、`*-baseline-grown` になり `over` にも `stale` にも数えられない。後者を見逃さないため、判定は `ok` で行う。
5. **失敗**: git の版が `merge-tree --write-tree` に足りない、git の起動・合成・展開に失敗した、cwdからrepository rootまたは実体pathを解決できない、repository root の親を解決できない、repository root が filesystem root で配置先が無い、一時ディレクトリまたは worktree を作れない、またはいずれかの gate が `ok` でない場合は拒否する。親の解決失敗またはrepository rootがfilesystem rootの場合は `baseline_conflict_unknown:preview_parent_unresolved`、親への書込み失敗を含む一時ディレクトリの作成失敗は `baseline_conflict_unknown:preview_dir_create_failed` とする。gate の finding があれば `baseline_conflict_recomputed:<gate>=<finding の符号>`、それ以外は既存の `baseline_conflict_unknown:<理由>`。許可に倒す経路を作らない。
6. **後始末**: 許可・拒否・例外 (gate の `check` の例外、`commit-tree` 後の展開失敗、途中の中断を含む) のどの経路でも `finally` で `git worktree remove --force <path>` → 残ったディレクトリの削除 → `git worktree prune` の順に実行する。前段が失敗しても後続を試み、各処理はこの順を保つ。後始末の判定は許可／拒否を決めた後に行い、後始末の失敗でその判定を変えない。失敗時は stderr に警告し、receipt の `preview` に `cleanup: "failed"` と理由を記録する。
7. **証跡**: `merge_intent` の receipt に `preview` として、`mainSha`・`headSha`・合成した `treeSha`・合成 commit の SHA・再計算した gate ごとの `{ name, ok, findings }` を記録する。後始末に失敗した場合は同じ`preview`に`cleanup: "failed"`と理由も記録する。merge の後に、GitHub が作った merge commit の tree SHA を追記し、`treeSha` との一致・不一致を残す。`merge-tree` と GitHub の merge は、rename の検出の違いで tree が変わることがある。不一致の場合も merge は既に済んでいるので、main の doctor (§6.3) が検知する前提を保ち、原因の調査に使う証跡とする。

#### 実測 (2026-11-05、Windows、git 2.52.0、PR #1562 と当時の origin/main)

| 段 | 時間 |
|---|---|
| `git fetch` | 6.8 秒 |
| `merge-tree --write-tree` と `commit-tree` | 2.4 秒 |
| detached での展開 (既存 worktree の checkout) | 1.7 秒 |
| code-size の計算 | 21.1 秒 |
| doc-split の計算 | 8.6 秒 |

合計は約 41 秒で、DENY 1 回で増える往復 (CI 13〜14 分と再検) より小さい。一時 worktree を新しく作る場合は、作成と削除の時間が加わる。実装の PR は、wrapper の中で計った時間を本節に追記する。

#### 保証と限界

- 再計算で許可した PR は、非著者の再検を取り直さずに merge する。gate の対象外の path だけが変わった MERGEABLE な PR は、base が進んでも従来から再検なしで merge しており、保証の水準は変わらない。exact-HEAD の review の束縛は変えない。
- 判定から merge までの時間差 (§6.3) は残る。合成で衝突した PR (同じ登録行を並行 PR が変えた場合など) は従来どおり拒否され、author の取り込みが要る。DENY を 0 にする方式ではない。
- 同じ共有ファイルに並行 PR が行を足す衝突は、CLAUDE.md §PR スコープ規律 6 の直列化で減らす。本節はその代わりではなく補完である。

### §6.5 oracle 対応

`CANDIDATE-U-RVMG-047`〜`049` を `docs/test-design/harness/L7-unit-test-design.md` の「同じ head の古い check run (Issue #1104)」の表に置く (§6 の oracle も同じ表に追記し、本書の対にする)。実テストは `tests/review-merge-gate-baseline-conflict.test.ts`。§6.6 の oracle は `docs/test-design/harness/L7-merge-baseline-recompute-test-design.md` の `U-RVMG-050`〜`054` に置く (共有の `L7-unit-test-design.md` には足さない)。047 の (a)〜(d) は doc-split / code-size の両 gate で競合を検出する期待を維持し、最終可否は §6.6 の再計算に従う。finding 0 件なら `U-RVMG-050` に従い許可し、合成衝突・finding・再計算失敗なら `U-RVMG-051` / `052` に従い拒否して merge を呼ばない。
