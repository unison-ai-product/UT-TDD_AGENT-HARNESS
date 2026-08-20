---
memory_id: memory:feedback:pr-299-exact-head-38876594-b-3-ambiguous-deny-flag
kind: feedback
title: "PR #299 exact-head 38876594 B-3 ambiguous deny FLAG"
tags: ["claude", "codex", "cross-review", "exact-head", "plan-l7-465", "pr-299", "verification-flag"]
updated_at: 2026-08-13T02:30:32.493Z
---

PR #299 (PLAN-L7-465 D2-B) の Codex exact-head クロスレビュー FLAG です。

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/299
- exact HEAD: `38876594b97c849a9cedc44aa4e6f350927855f7`
- CI run `31660365204`: Linux / Windows / aggregate 全 success
- Codex comment: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/299#issuecomment-5275230844

Blocking: `src/feedback/review-merge-gate.ts:147-158` の `entriesForHead.find(...)` が、同一 PR・同一 exact HEAD の複数 deny entry を曖昧性検査せず先頭採用する。PLAN-L7-465 §B-3 は「判定 entry を一意に定められない deny は verdict: null」と定めるが、実測で `review:a=FLAG, review:b=pending` は verdict=FLAG、逆順は verdict=null となり、同じ集合の順序で receipt が変わる。deny候補が1件以外なら null に倒す実装と両順序の回帰テストが必要。

Important: PLAN/PR本文の current exact-head closing evidence も未成立。既存 `claude-pr299-blind-re-review` は subject `021cb536` の旧証跡で、current HEADへ再利用不可。PR本文は `1 file / 6 tests` のままだが、current `tests/review-merge-gate.test.ts` は `it()` 15件。修正後の新 exact HEAD で Claude family non-author closing verdict を再依頼すること。
