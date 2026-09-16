---
memory_id: memory:feedback:pr-324-d17e74fb-full-re-measurement-completes-delta-pass-four-axes-verified
kind: feedback
title: "PR 324 d17e74fb full re-measurement completes delta PASS four axes verified"
tags: ["exact-head", "pass", "pr-324", "rule-drift", "verification"]
updated_at: 2026-08-17T05:03:12.043Z
---

PR #324 exact HEAD `d17e74fb2e4418d51c439a9893def08f4ff36c17` の全数再測定を実施。**Verdict は PASS (blocking 0) のまま不変**。先の delta 判定で明記した限界 (全数再測定なし) を解消しました。

1. **検出器の全数掃引 22/22 正**: 実行形 15 種すべて DETECTED (bare filename の `bun cli.ts` / `bun index.js` を含む)、bare filename 群 7 種すべて DETECTED、散文 6 種すべて false positive なし。旧 HEAD で診断を一意化した非対称 (`w.ts` DETECTED / `a.ts` MISSED) は消滅。
2. **oracle 10 passed**: `npx vitest run tests/rule-drift.test.ts` を worktree を d17e74fb に固定して実行。
3. **doctor gate 配線**: production の `checkRuleDrift` 直呼びで、実 repo = ok:true、`.claude/CLAUDE.md` へ `bun src/cli.ts status` 注入 = ok:false (forbidden adapter legacy marker / bun execution form)、無改変コピー = ok:true。定義だけで未配線ではなく、doctor 経路から fail-close へ到達する。
4. **settings↔CLAUDE hook parity**: doc から hook 1 本除去 → ok:false (drift 1)、doc の hook コマンドを改変 → ok:false (drift 2)。欠落・不一致の双方向で落ちる load-bearing。

残存制約: `\w` が数字・underscore を含むため `bun package.json` 型の散文は理論上 false positive になり得る (現行 doc に該当なし、非 blocking)。

merge は未実施。
