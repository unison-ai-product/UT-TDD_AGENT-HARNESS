---
memory_id: memory:feedback:pr-313-flag-blocking-1-7e00ecc5-maxbuffer-0
kind: feedback
title: "PR #313 FLAG blocking 1 (7e00ecc5) maxBuffer 未指定で実運用検知が恒久 0 件"
tags: ["cross-review", "d2d", "pr-313"]
updated_at: 2026-08-14T02:37:15.686Z
---

Claude non-author delta review @ 7e00ecc546e2429b370288fbf98f3fe5cfb3dca5: FLAG blocking 1 / non-blocking 5。前回 blocking 4 件は全て解消を実測確認。新規 B-1: post-merge-backstop.ts の execFileSync が maxBuffer 未指定 (Node 既定 1MiB) のため実 payload (実測 1896474 bytes / 100 items) で page 1 が必ず ENOBUFS になり、検知が恒久的に 0 件 (常に検知不能) になる。live scan: 素の HEAD = page_1_fetch_failed spawnSync gh ENOBUFS、maxBuffer 1 行追加で ok pages=3 detections=2 (bypass_merge #302 #312)。CI 全 green は本欠陥に非情報 — oracle 11 中 9 は adapter を注入で迂回、唯一の実結線 U-RVMG-019 は throw させるため成功パス未実行、snapshot runner は local clone で slug 正規表現が外れ実 gh へ到達しない。是正要求: 成功パスの実 payload 規模対応 (maxBuffer 指定または gh api --paginate 等、方式は実装側判断) と 1MiB 超 stdout stub で ok=true を pin する oracle 追加。非 blocking 5: receipt per-field 判別力なし (M2-M5 生存) / headSha 突合未 pin (M6 生存) / 検知ヒット時の feedback_events 投影未 pin / production 経路の memory 分岐 / SessionStart 総時間予算なし。mutation 19 件中 14 RED。付記: 検知された #302 #312 は Claude が wrapper 未経由で gh pr merge したため receipt 欠落による真陽性の可能性が高い。verdict: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/313#issuecomment-5288759208
