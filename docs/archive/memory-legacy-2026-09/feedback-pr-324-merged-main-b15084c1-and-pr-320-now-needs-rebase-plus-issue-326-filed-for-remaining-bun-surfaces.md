---
memory_id: memory:feedback:pr-324-merged-main-b15084c1-and-pr-320-now-needs-rebase-plus-issue-326-filed-for-remaining-bun-surfaces
kind: feedback
title: "PR 324 merged main b15084c1 and PR 320 now needs rebase plus issue 326 filed for remaining bun surfaces"
tags: ["issue-326", "merge", "pr-319", "pr-320", "pr-324", "rebase"]
updated_at: 2026-08-17T09:12:06.319Z
---

## #324 は merge 済み

exact HEAD `d17e74fb` を squash merge しました。main = `b15084c1`。issue #322 は AC 達成により自動 close されています。

**merge 経路の実測**: `node src/cli.ts pr merge` は **main の CLI に存在しません** (`error: unknown command 'pr'`)。`src/cli/pr-merge.ts` はファイルとしてありますが `src/cli.ts` へ配線されておらず、D2 wrapper は未配備です。また `.ut-tdd/review/receipts` は main に追跡履歴が 1 件もなく、#315 / #317 / #318 も receipt なしで merge されています。したがって現行の運用規則は「exact HEAD に束縛された PASS verdict の受領後に merge」であり、receipt / wrapper はこれから D2 で強制する将来仕様です。この確認を怠って「wrapper 経由のみ」を制約として扱ったため、本日 merge 可能な PR を数時間止めました。

## #320 は rebase が必要

#324 が入ったことで conflict しました。両方が触るファイルは 2 件です:

- `docs/test-design/harness/L7-unit-test-design.md` (#324 = U-RDRIFT-005〜008 の行、#320 = U-RELMAN-012 系の行)
- `src/doctor/test-repository-isolation.ts` (両者の callsite ledger)

内容の対立ではなく追記位置の衝突なので解消は機械的です。**rebase は author である Codex の作業**とします。私が rebase すると author が入れ替わり、本日ずっと問題になった構図を再生産します。rebase 後は HEAD が動くので `bdda726a` の私の PASS は superseded になり、新 exact HEAD で delta review を取り直します。full SHA で通知してください。

## #319 は FLAG のまま

blocking 1 (inbox filename truncation で operationId が脱落し再 dispatch が恒久 fail) は未是正です。是正案と oracle 要件は前便のとおりです。

## issue #326 を起票

#324 の gate は adapter doc 3 枚しか検査しません。`.claude/commands/` (build.md / code-simplify.md / test.md / ut-tdd-test.md) と `.github/PULL_REQUEST_TEMPLATE.md` に Bun 実行形が残っており、rule-drift の射程外です。`test.md` は `Use Vitest (bun run test), not bun test` と使い分けまで教えています。親は #134、#322 の再オープンではなく別スライスとして起票しました (#322 の成果目標は 3 枚に明示限定されており AC は達成済みのため)。

なお `bun.exe` は本日時点で稼働中です (PID 11584 / 104MB 実測)。宣言上は permanent ban ですが実行は継続しています。

#324 の closing review でこの射程限定を非 blocking としても挙げなかったのは私の見落としです。
