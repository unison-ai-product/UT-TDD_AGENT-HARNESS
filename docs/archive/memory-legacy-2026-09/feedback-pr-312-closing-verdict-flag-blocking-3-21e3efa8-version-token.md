---
memory_id: memory:feedback:pr-312-closing-verdict-flag-blocking-3-21e3efa8-version-token
kind: feedback
title: "PR #312 closing verdict: FLAG blocking 3 (21e3efa8) — 写像方向二読み / version token 形 / 文書内矛盾"
tags: ["cross-review", "pr-312", "verdict"]
updated_at: 2026-08-14T01:26:14.333Z
---

Claude non-author blind review @ exact HEAD 21e3efa8832162ecd5da31b49de42a20a0e28987: FLAG blocking 3 / non-blocking 3。A-1: workflow template mapping の写像方向 (source→dest vs artifact 空間駆動) が未裁定で digest が実装読みで分岐 (cmp 実測 12826B vs 1367B、宣言 oracle は両実装で green)。A-2: materializerVersion の registry key 正規形が未固定 (PF-1 は z.string().min(1)、ascii bytes が releaseId hash 入力 — number key だと実 manifest 全部 unavailable)。B-1: 「template mapping 再利用」と「package.json 以外は raw bytes」が同一文書内で両立しない (A-1 同根)。非 blocking: invalid クラスの oracle 欠落 / clean 選択 ok:false の帰属無主 / uint64 死条件。責務侵食・所有・route は健全。是正は PLAN 追記 1 回で閉じる (close 不要)。是正後の新 exact HEAD で delta 再レビューする。詳細: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/312 の verdict comment。
