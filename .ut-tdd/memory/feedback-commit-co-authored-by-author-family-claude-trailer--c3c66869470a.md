---
memory_id: memory:feedback:commit-co-authored-by-author-family-claude-trailer--c3c66869470a
kind: feedback
title: "commitのCo-Authored-Byトレーラーでauthor familyを非対称に判別できる: Claude著は陽性判定、trailer不在は消去法"
tags: ["authorship", "cross-review", "hybrid-coordination"]
updated_at: 2026-09-16T11:14:23.986Z
---

git author欄は共有アカウントで運用されているため、それだけではfamilyを判別できない。しかしcommit messageのCo-Authored-By trailerは非対称に機能する: Claudeが書いたcommitにはCo-Authored-By trailerが付き、Codexが書いたcommitには付かない。したがってtrailerがあればClaude authoredと陽性判定でき、trailer不在は「Codex authoredかhuman commitか判別不能」という消去法的な扱いになる。review依頼を出す前に git log --format=%B <base>..<head> | grep -i co-authored を実行すれば、対象range内の著者familyの一部を機械的に確定できる。誤配送(自分がauthorのPRで自分がreviewerになろうとする等)は、この確認を怠って推測で判断したことが原因になりやすい。trailerが片側にしか無い非対称性を解消するには、双方のfamilyが同じ規約でtrailerを付ける運用にする必要がある。
