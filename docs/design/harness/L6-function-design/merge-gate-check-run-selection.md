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
- 競合が 1 件でもあれば merge しない (fail-close)。reason は `baseline_conflict`、終了コードは非 0 (既存の DENY と同じ 1)。標準出力に gate 名と競合 path を出し、「`git merge origin/main` で main を取り込み、CI が緑になってから再実行する」と案内する。取り込むと mb が進み、競合は解消される。新しい head には新しい review が必要になる (exact-HEAD 束縛は変えない)。
- git の起動・`fetch`・差分の取得に失敗したとき、mb を解決できないときは `baseline_conflict_unknown` で拒否する (「競合なし」にしない)。git には `windowsHide: true` を付ける (issue #693)。

### §6.3 保証の限界

判定の後、merge までの間に main が進む時間差は残る。この方式単独で main の赤を 0 にはしない。到達点は、判定時点で観測できる並行変更を merge 前に止めることで、残りの窓は main の doctor (doc-split / code-size の hard gate) が検知する。

### §6.4 採らなかった案

- merge preview の tree で gate を再計算する案: wrapper が gate の実装全部を呼び、遅く重くなる。gate が増えるたびに wrapper が追随する。
- GitHub の branch protection (require up-to-date) に頼る案: repo 設定への依存になり、設計文書の外で規則が決まる。変更が無関係な PR まで全て取り込みと CI の取り直しを強いる。
- 対象 path が同じときだけ拒否する案: 別ファイルの変更と baseline の変更が干渉する場合 (§6.2 の 2・3) を見逃す。

### §6.5 oracle 対応

`CANDIDATE-U-RVMG-047`〜`049` を `docs/test-design/harness/L7-unit-test-design.md` の「同じ head の古い check run (Issue #1104)」の表に置く (§6 の oracle も同じ表に追記し、本書の対にする)。実テストは `tests/review-merge-gate.test.ts`。
