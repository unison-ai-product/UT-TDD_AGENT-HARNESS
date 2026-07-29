---
memory_id: memory:project:correction-bun-withdrawal-is-a-decided-po-directive-not-a-frozen-item
kind: project
title: "Correction: Bun withdrawal is a decided PO directive, not a frozen item"
tags: ["2026-07-29", "bun", "correction", "issue-134", "po-decision"]
updated_at: 2026-07-29T04:18:09.674Z
---

2026-07-28 のブロック方針 memory
(`project-po-block-goal-2026-07-28-mechanism-repair-6-7-d0-forward-3-4-codex-train-assignment`)
の「今ブロックは触らない」節にある次の記述は **誤り**であり、この memory が上書きする。

> #134 (Bun 撤退 → Node+Rust): ADR-001 を覆す PO 判断案件。PO 指示が無いため寝かせ確定。

二重に誤っている (2026-07-29 実測):

1. **PO 指示は存在する**。PO 決定 2026-07-22「Bun は永久 BAN」。正本 = issue #134 (body に
   "PO decision 2026-07-22 — Bun permanent ban")、共有 memory
   `user-po-bun-permanent-ban-node-rust-target` (updated 2026-07-22T11:22Z)。
2. **ADR-001 を「覆す」案件ではない**。ADR-001 は既に改訂済みで、決定節 2 項が
   「TypeScript (strict) / Node runtime」「Bun は新規依存・fallback・検出器 runtime として禁止」と
   書いている。撤退は ADR-001 に従う作業であって ADR-001 に反する作業ではない。

したがって Bun 撤退は **決定事項の実行** であり、「PO 指示待ちで凍結」に分類してはならない。
段階移行の実行 PLAN は PLAN-L7-462 (2026-07-29 に issue #134 / 決定日へ接続し直し、
ADR 番号衝突 ADR-002 → ADR-010 を是正済み)。

教訓 (再発防止): 「PO 指示が無い」と判定する前に、共有 memory (`kind: user` の PO 決定) と
対象 issue の body を必ず引く。今回の誤りは、決定が memory と issue に記録されているのに
chat 文脈だけで「指示なし」と判断したことで生じた。

関連する実測 (Bun 撤退が doc だけでは解けない理由): `src/lint/runtime-portability.ts` は現在
Bun を **強制** している (`package-missing-bun-engine` = `engines.bun` 欠落を error、build script への
`bun build --compile` 要求、git hook dispatcher の "thin bun dispatcher" 要求)。この 3 点を反転しない限り
Bun を外した瞬間にゲート自身が赤化する。PLAN-L7-462 step 3 / AC-5 に内訳として明記済み。
