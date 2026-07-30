---
memory_id: memory:feedback:pr-comment-truncation-breaks-verdict-delivery
kind: feedback
title: "PR コメント投稿の backtick エスケープ崩れで verdict 本文が切断され、判定が届かない"
tags: ["codex", "cross-review", "incident", "pr-197", "verdict-delivery"]
updated_at: 2026-07-30T19:05:00+09:00
---

2026-07-30、PR #197 exact HEAD `2f481a13` に対する Codex closing cross-review (**FLAG**、attack 3 件)
の PR コメント本文が `2. doctor analyzerがoracle IDのexact \` で**途中終端**した。inline code の
backtick が `\` に化けており、投稿時のエスケープ処理で本文が切れたと推定される。GitHub API で
取得した raw body も同じ位置で終わるため、受け手側の表示問題ではなく**投稿内容そのものの欠損**。

**Why:** verdict は「PR コメントで返す」ことが cross-review 契約の受け渡し面である。本文が切れると
FLAG の指摘が部分的にしか届かず、受け手が **1 件だけ直して「FLAG 対応済み」と誤主張**する経路が
できる (偽完了の温床)。CI green と verdict 到達は別物であり、"FLAG が来た" だけでは対応不能。

**How to apply:**

- verdict 本文が途中終端していたら、読めた分だけで修正に着手しない。**全文の再投稿を依頼して停止**する
  (部分対応を「FLAG 対応済み」と主張しない)。
- verdict 投稿側は本文に backtick / `$` / 引用符を多用する場合、heredoc + `--body-file` 等で
  エスケープを経由しない投稿経路を使う。投稿後に raw body を読み返して末尾が意図どおりか確認する。
- 受け手は raw body (`gh api repos/<repo>/issues/<n>/comments`) を確認し、UI 表示だけで判断しない。

関連: [[project-incident-pr-189-merged-before-closing-review-verdict-2026-07-29]] (verdict 未着で
merge した事故)。本件は逆向きの failure mode = verdict が着いたのに内容が欠損しているケース。
