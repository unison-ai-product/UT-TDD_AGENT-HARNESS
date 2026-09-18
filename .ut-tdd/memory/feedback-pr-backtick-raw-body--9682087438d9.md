---
memory_id: memory:feedback:pr-backtick-raw-body--9682087438d9
kind: feedback
title: "PRコメント本文がbacktickエスケープ崩れで途中終端することがある: 受け手はraw bodyで末尾を確認し、部分対応で済ませない"
tags: ["cross-review", "pr-comment", "verdict-delivery"]
updated_at: 2026-09-16T11:14:42.250Z
---

verdict本文にinline codeのbacktickを多用すると、投稿時のエスケープ処理で本文が途中終端することがある。verdictは「PRコメントで返す」ことがcross-review契約の受け渡し面であり、本文が切れるとFLAGの指摘が部分的にしか届かず、受け手が読めた分だけ直して「FLAG対応済み」と誤主張する経路ができる(偽完了の温床)。CI greenとverdict到達は別物であり、verdictが来ただけでは対応の正当性を保証しない。受け手はverdict本文が途中終端していたら、読めた分だけで修正に着手せず全文の再投稿を依頼して停止する。投稿側は本文にbacktick/$/引用符を多用する場合、heredoc + --body-fileのようなエスケープを経由しない投稿経路を使い、投稿後にAPI経由でraw bodyを読み返して末尾が意図どおりか確認する。受け手はUI表示だけで判断せずAPI経由のraw bodyを確認する。
