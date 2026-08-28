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
review execution回数、canonical receipt path、PR comment、feedback Memoryを独立に観測する。production parserを
oracleとして再利用せず、Git command出力とfilesystem/port deltaをtest側で読み直す。

## Candidate matrix

| Candidate | Stimulus / mutation | 独立oracle |
| --- | --- | --- |
| `CANDIDATE-U-RVATT-046` | `before_review`でcurrent HEADを別commitへ移動。HEAD比較削除mutationも適用 | `consume_head_moved`、review execution 0、canonical receipt/comment/Memory 0 |
| `CANDIDATE-U-RVATT-047` | exact HEADのtracked fileをindex、worktree、rename、unmerged、submodule dirtyの各形で1点変更。dirty比較削除mutationも適用 | `consume_tree_dirty`、review execution 0、全publish 0。tracked `.ut-tdd/**`変更もdeny |
| `CANDIDATE-U-RVATT-048` | `.ut-tdd/**`外のuntracked file、absolute/`..`相当の不正status pathを入力。許可範囲拡張mutationを適用 | `consume_tree_dirty`、review execution 0、全publish 0 |
| `CANDIDATE-U-RVATT-049` | untracked `.ut-tdd/review/verdicts/...`と`.ut-tdd/memory/...`だけを生成。一律untracked deny mutationを適用 | 正常reviewへ進み、mutationだけがRed。tracked `.ut-tdd/**`許可とは混同しない |
| `CANDIDATE-U-RVATT-050` | reviewer stub内でHEADを別commitへ移動。post HEAD比較削除mutationを適用 | reviewer execution exactly 1、`consume_head_moved`、canonical receipt/comment/Memory 0 |
| `CANDIDATE-U-RVATT-051` | reviewer stub内でtracked fileを変更。post dirty比較削除とpost fenceをreceipt write後へ移動するmutationを個別適用 | reviewer execution exactly 1、`consume_tree_dirty`、canonical receipt/comment/Memory 0。write後検査mutationはreceipt現物出現でRed |

## Composition boundary oracle

`CANDIDATE-U-RVATT-050/051`は`publishReceipt` mockの呼出回数だけではGreenにしない。review executionが返す
verdictをcanonical receiptへcreate-exclusive writeする直前にpost snapshotが評価されるproduction compositionを
通し、deny fixtureでは`.ut-tdd/review/receipts/<digest>.json`が存在しないことを直接確認する。

## Typed reason propagation

CLI composition testはJSON resultとexit codeを同時に検査する。HEAD系は`consume_head_moved`、tree/status系は
`consume_tree_dirty`へ固定し、generic `reviewer_execution_failed`、`invalid_review_envelope`、例外文字列への
埋没を拒否する。phase診断`before_review` / `before_receipt`はreasonを置換しない。

## Scope fence

- request retraction、retry、attempt auditの件数は本test-designのoracleにしない。
- `PLAN-L7-520`のproduction関数をmockして本candidateをGreenにしない。
- tree SHA一致を別HEAD receiptの再利用許可へ使わない。
- 実装PRは`src/cli/review-live.ts`、`src/feedback/live-review-projection.ts`、対応testに限定し、隣接custodyを
  変更する場合は別PLANへrouteする。
