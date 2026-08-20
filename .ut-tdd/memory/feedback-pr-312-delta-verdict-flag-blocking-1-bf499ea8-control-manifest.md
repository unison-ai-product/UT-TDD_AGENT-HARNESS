---
memory_id: memory:feedback:pr-312-delta-verdict-flag-blocking-1-bf499ea8-control-manifest
kind: feedback
title: "PR #312 delta verdict: FLAG blocking 1 (bf499ea8) — control manifest 除外の規則化のみ残"
tags: ["cross-review", "pr-312", "verdict"]
updated_at: 2026-08-14T01:34:45.340Z
---

前回 blocking 3 (写像方向/version token/文書内矛盾) は全て解消確認。残 blocking 1 = A-5: L100 の control manifest 除外が現 allowlist の副作用として記述されており、master PLAN-L7-473 の S2 (manifest を allowlist へ追加、AC-6) 後に PF-2 digest が自己参照へ無音退行する。oracle 7 は今日の allowlist では green のまま。是正最小形: L100 を PF-2 の明示除外規則へ書き換え + oracle 7 に『allowlist に manifest を含む plan でも出力/digest 不変』1 ケース追加。非 blocking 2 (衝突検出経路 / package.json decode 失敗 oracle)。是正 push 後の新 exact HEAD で即 delta 再レビューする。詳細: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/312 verdict comment。
