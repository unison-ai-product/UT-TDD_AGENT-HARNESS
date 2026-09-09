---
memory_id: memory:feedback:pr-387-closure-bounce-merged-pre-merge-review-receipt--41fb97a78e1d
kind: feedback
title: "PR 387 closure bounce: 既に MERGED で pre_merge_review receipt は成立しない"
tags: ["bounce", "post-merge", "pr-387", "receipt", "review-custody"]
updated_at: 2026-08-27T03:08:08.555Z
---

PR #387 の provider E2E closure 依頼を指定どおりには実行できない。前提が 2 点崩れている。

## 1. PR #387 は既に MERGED である

依頼は「Post the result to PR #387. Do not merge.」と書いているが、PR #387 は既に **MERGED** (merged head `2a160759c7063bda39c950d6f0c50523d0ebcf5b`、required CI 3/3 SUCCESS)。依頼が前提とする「merge 前に canonical receipt を作る」状態は既に過ぎている。

これは前提の齟齬であって、判定の齟齬ではない。content review の PASS-WEAK / blocking 0 に異論は無い。

## 2. 指定コマンドは merge 後には有効な receipt を作れない

`src/feedback/review-custody.ts` の `kindCoherenceDetail` が次を要求する:

```
if (receipt.receiptKind === "pre_merge_review") {
  if (facts.state !== "OPEN") return "pre_merge_requires_open_pull_request";
  if (facts.mergeSha !== null) return "pre_merge_carries_merge_fact";
```

PR #387 は `state=MERGED` かつ `mergeSha` を持つので、`pre_merge_review` receipt は
`pre_merge_requires_open_pull_request` で fail-close する。merge 後に整合する receipt kind は
`post_merge_closure` のみで、そちらは `mergeSha` / `mergeMethod` / `mergedAt` を要求する
(`POST_MERGE_FIELDS`)。指定された dispatcher コマンドはこれらを取らない。

したがって指定コマンドをそのまま流すと、成立しない receipt を作りにいくか、途中で fail-close する。どちらにしても目的 (`.ut-tdd/review/receipts/592c1440....json` の生成) は達成できない。方式をその場で作り替えることはしない。

## 確認したいこと

- 目的が **監査証跡の後追い補完**なら、`post_merge_closure` kind で mint し直す必要がある。その場合の正規コマンドを示してほしい (指定されたものとは別のはず)。
- 目的が **merge 前 gate の成立**なら、既に merge 済みなので遡及できない。事後記録として `post_merge_closure` を残すのが妥当と考えるが、判断は依頼側に委ねる。

## 3. 指定された worktree は私が削除していた (復元済み)

`C:\dev\ut-issue386-review-receipt` は本日の worktree 整理で削除した。PR #387 が MERGED でありローカルに未コミット変更が無かったため、片付け対象に入れた。custody が worktree-local である以上、これは私の判断ミスである。

branch `codex/issue386-review-receipt` の ref は残っていたため、**同一 exact HEAD で復元済み**:

```
$ git worktree add /c/dev/ut-issue386-review-receipt codex/issue386-review-receipt
HEAD is now at 2a160759 fix(test): stub Claude provider in review dry-run
$ git -C /c/dev/ut-issue386-review-receipt rev-parse HEAD
2a160759c7063bda39c950d6f0c50523d0ebcf5b
```

ただし **worktree-local だった custody state (`.ut-tdd/review/` 配下の request / verdict / attempt) は復元されていない**。branch の tracked 内容のみが戻っている。attempt-1 を local に作る前提の手順は、この点を踏まえて再確認してほしい。

なお当該 branch は **origin に存在しない**ローカル専用 ref である。今後 custody を worktree-local に置く場合、その worktree を「PR が merged だから不要」と判定する片付けは危険なので、私の側の整理基準からは custody worktree を除外する。
