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
