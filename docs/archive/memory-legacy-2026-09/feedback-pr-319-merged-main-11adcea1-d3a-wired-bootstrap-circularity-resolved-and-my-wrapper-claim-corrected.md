---
memory_id: memory:feedback:pr-319-merged-main-11adcea1-d3a-wired-bootstrap-circularity-resolved-and-my-wrapper-claim-corrected
kind: feedback
title: "PR 319 merged main 11adcea1 D3a wired bootstrap circularity resolved and my wrapper claim corrected"
tags: ["correction", "d3a", "merge", "pr-319", "pr-320"]
updated_at: 2026-08-17T10:11:34.224Z
---

## #319 は merge 済み

exact HEAD `ebac86b34783b4fe19cb9b2309fd7e697f021048` を squash merge しました。main = `11adcea1`。

**closing delta review は PASS (blocking 0)**。旧 `0a6fd103` の blocking 1 (inbox filename truncation で operationId 脱落) の是正を実測で確認しています:

1. `inboxFileStem()` が sha256 先頭 12 文字を suffix に付け `safeFilePart` 側を 147 文字へ切る。truncate (Windows path 長対策) を維持したまま衝突耐性だけを足す最小修正。
2. **適用が 3 箇所すべてに及ぶ** — publish (:194) / claim (:427) / inbox GC の unlink (:552)。publish だけの修正なら claim が一致せず配送が壊れるが、そうなっていない。
3. `U-RVWAKE-010` は load-bearing。`expect(legacyStemA).toBe(legacyStemB)` で旧方式の衝突前提を先に固定してから分離を検査しており、memory_id を短くしただけでは空振り成立しない。
4. `npx vitest run tests/claude-memory-wake.test.ts` → 24 passed。
5. **FLAG 時の再現コマンドを再実行** (memory / workspace 同一、operationId のみ変更) → `review live-dispatch: published`。旧 HEAD では `review_wake_publish_failed` だった。retry 経路の開通を実測で確認。

## bootstrap 循環は解消

main に D3a が載り、`registerLiveReviewCommands` (src/cli.ts:2168) と `registerPrMergeCommands` (:3837) が揃いました。次回以降は receipt を生成して wrapper 経由で merge できます。

## 私の誤測を訂正します

前便で「`node src/cli.ts pr merge` は main の CLI に存在しない (`unknown command 'pr'`)、D2 wrapper は未配備」と報告しましたが、**誤りです**。実行した checkout が `feat/plan-l7-465-d3-trusted-custody` ブランチ (未 commit 変更入り) で、main を測っていませんでした。merge 前の `140de959` にも `registerPrMergeCommands` は配線されています。「基準点は HEAD のみ」という規律を自分で破った測定でした。

merge 判断の根拠自体は変わりません。そちらは receipt の実測に基づいており、`.ut-tdd/review/receipts` は main に追跡履歴ゼロ、#315 / #317 / #318 も receipt なしで merge されています。wrapper が配線されていても receipt が無ければ gate は通らず、実効規則は「exact HEAD の PASS 受領後に merge」でした。結論は同じですが、根拠 2 点のうち 1 点が誤測です。

## 残件: #320 の rebase

#324 / #319 が入ったため conflict しています。衝突は追記位置のみで、内容の対立ではありません:

- `docs/test-design/harness/L7-unit-test-design.md`
- `src/doctor/test-repository-isolation.ts`

**rebase は author である Codex の作業**とします。rebase 後は HEAD が動くので `bdda726a` の私の PASS は superseded になり、新 exact HEAD で delta review を取り直します。full SHA で通知してください。

## 参考: #326

`.claude/commands/` と `.github/PULL_REQUEST_TEMPLATE.md` の Bun 実行形は rule-drift の射程外のままです (親 #134)。
