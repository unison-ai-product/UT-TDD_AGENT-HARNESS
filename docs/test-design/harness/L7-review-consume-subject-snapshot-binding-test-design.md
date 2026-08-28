---
title: "L7 review consume subject snapshot binding test design"
layer: L7
executed_at_layer: L7
status: draft
plan_id: PLAN-L7-521-review-consume-subject-snapshot-binding
updated: 2026-08-28
---

# Review consume subject snapshot binding test design

対になる契約は`docs/plans/PLAN-L7-521-review-consume-subject-snapshot-binding.md`。本pair-freezeでは
candidateだけを定義し、implementation PRがproduction compositionへ到達するRed testを追加した時点で
`U-RVATT-*`へ昇格する。

## Subject observation fixture

各caseは一時Git repositoryを作成し、canonical requestの`exactHead`、current HEAD、porcelain v1 NUL stream、
provider reviewer spawn回数、child execution result、親projection port呼出回数、canonical receipt path、PR comment、feedback
Memoryを独立に観測する。production parserをoracleとして再利用せず、Git command出力とfilesystem/port deltaを
test側で読み直す。

## Candidate matrix

| Candidate | Stimulus / mutation | 独立oracle |
| --- | --- | --- |
| `CANDIDATE-U-RVATT-046` | `before_review`でcurrent HEADを別commitへ移動。HEAD比較削除mutationも適用 | `consume_head_moved`、review execution 0、canonical receipt/comment/Memory 0 |
| `CANDIDATE-U-RVATT-047` | exact HEADのtracked fileをindex、worktree、rename、unmerged、submodule dirtyの各形で1点変更。dirty比較削除mutationも適用 | `consume_tree_dirty`、review execution 0、全publish 0。tracked `.ut-tdd/**`変更もdeny |
| `CANDIDATE-U-RVATT-048` | `.ut-tdd/**`外のuntracked file、absolute/`..`相当の不正status pathを入力。許可範囲拡張mutationを適用 | `consume_tree_dirty`、review execution 0、全publish 0 |
| `CANDIDATE-U-RVATT-049` | untracked `.ut-tdd/review/verdicts/...`と`.ut-tdd/memory/...`だけを生成。一律untracked deny mutationを適用 | 正常reviewへ進み、mutationだけがRed。tracked `.ut-tdd/**`許可とは混同しない |
| `CANDIDATE-U-RVATT-050` | delegation childがspawnするprovider reviewer stub内でHEADを別commitへ移動。post HEAD比較削除mutationを適用 | provider spawn exactly 1、child result返却時receipt 0、`consume_head_moved`、親projection呼出0、canonical receipt/comment/Memory 0 |
| `CANDIDATE-U-RVATT-051` | provider reviewer stub内でtracked fileを変更。child receipt write残存、post dirty比較削除、post fenceを親projection後へ移動するmutationを個別適用 | provider spawn exactly 1、child result返却時receipt 0、`consume_tree_dirty`、親projection呼出0、canonical receipt/comment/Memory 0。各mutationはreceipt現物出現でRed |

## Composition boundary oracle

`CANDIDATE-U-RVATT-050/051`は`publishReceipt` mockの呼出回数だけではGreenにしない。
delegation childのprovider spawn→execution result返却（receipt 0）と、親`consumeLiveReview`の
pre snapshot→`runReview`→post snapshot→projection portというproduction compositionを通す。post denyでは
projection port呼出0と`.ut-tdd/review/receipts/<digest>.json`不在を直接確認する。正常系ではpost fence成功後に
projection port exactly 1、create-exclusive receipt exactly 1を確認する。child内receipt writeを残すmutation、
post fenceを親projection後へ移動するmutationはreceipt現物出現でRedになる。

## Typed reason propagation

CLI composition testはJSON resultとexit codeを同時に検査する。HEAD系は`consume_head_moved`、tree/status系は
`consume_tree_dirty`へ固定し、generic `reviewer_execution_failed`、`invalid_review_envelope`、例外文字列への
埋没を拒否する。phase診断`before_review` / `before_receipt`はreasonを置換しない。

## Scope fence

- request retraction、retry、attempt auditの件数は本test-designのoracleにしない。
- `PLAN-L7-520`のproduction関数をmockして本candidateをGreenにしない。
- tree SHA一致を別HEAD receiptの再利用許可へ使わない。
- 実装PRはsubject snapshot専用module、`src/cli/delegation.ts`のexecution result化、
  `src/feedback/live-review-projection.ts`のpre/post fenceと親projection順序、`src/cli/review-live.ts`のport配線、
  `src/feedback/review-attestation.ts`の親projection seam、対応testを所有する。
- `PLAN-L7-520`のattempt custody / create-exclusive semanticsは再定義せず、親projectionから再利用する。
