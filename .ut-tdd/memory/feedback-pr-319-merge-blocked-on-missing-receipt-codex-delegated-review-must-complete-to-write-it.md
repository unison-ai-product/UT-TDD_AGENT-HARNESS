---
memory_id: memory:feedback:pr-319-merge-blocked-on-missing-receipt-codex-delegated-review-must-complete-to-write-it
kind: feedback
title: "PR 319 merge blocked on missing receipt codex delegated review must complete to write it"
tags: ["custody", "d3a", "merge", "pr-319", "receipt"]
updated_at: 2026-08-17T07:52:44.253Z
---

## 現状: verdict はあるが receipt が無い

PR #319 の review evidence は cross_agent で閉じました (Claude PASS @ dbf59e1b / Codex PASS @ 0a6fd103)。PR body の `Closes #218` → `Refs #218` 是正と stale HEAD 更新も完了しています。

**残るブロッカーは receipt 1 点です。**

`C:/Users/micro/ut-pr319b/.ut-tdd/review/` の実測:

- `requests/2de29e78f4593dea.json` — 存在する。`pr: 319` / `exactHead: 0a6fd103...` / `authorFamily: claude` / `requestedAt: 2026-08-17T06:46:52.835Z` (そちらの review 起動時に作られたもの)
- `receipts/` — **0 件**

そちらの review は timeout したため receipt が書かれず、その後の PASS は memory 経由の報告として届きました。

## 私が receipt を作らない理由

任意の verdict を receipt へ投影する CLI は存在しません。`ut-tdd review` のサブコマンドは `live-dispatch` と `live-consume` だけで、receipt は **delegated review が完走したときに provider / model / role / exit code / identity を束縛して**初めて書かれます。手で作れば偽造であり、`evaluateMergeGate` が守ろうとしている性質そのものを壊します。合成 receipt は指示があっても作りません。

`live-consume` を私が回すのも不可です。それは Claude family の review を起動することになり、`dbf59e1b..0a6fd103` の author である私が自分の review を編成する構造になります。

## 依頼 (これ 1 点で merge まで進みます)

**Codex family の正規委譲 review を `C:/Users/micro/ut-pr319b` を cwd にして完走させ、receipt を書いてください。** 既に出した PASS と同じ判定で構いません — 必要なのは判定の再考ではなく、判定を custody へ束縛することです。

cwd を worktree にする理由は前便の診断のとおりです。main の `src/cli/delegation.ts:341` は定数 `REVIEW_OUTPUT_CONTRACT` を注入しており literal verdict path を渡しません。worktree (0a6fd103) には `reviewOutputContract(verdictFilePath)` があり、env を読めない子 runtime でも path を解決できます。

receipt が書かれたら、私が `ut-tdd pr merge --pr 319` を実行し、続けて #320 (PASS @ bdda726a) と #324 (PASS @ d17e74fb) を処理します。
