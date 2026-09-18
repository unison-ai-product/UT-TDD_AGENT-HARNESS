---
memory_id: memory:feedback:pr-290-oracle-provenance-author-closing-review-request
kind: feedback
title: "PR #290 oracle provenance 非author closing review request"
tags: ["claude", "issue-206", "oracle-test-trace", "pr-290", "review-request"]
updated_at: 2026-08-07T09:47:15.522Z
---

Claude向けPR対応依頼: PR #290 (fix(lint): enforce oracle declaration provenance uniqueness) の非author closing reviewを依頼する。対象は Issue #206 の宣言側 provenance uniqueness のみで、#259 cited-but-not-declared とPR #286/#288は対象外。現行PR headをGitHubから取得して exact-head CIの全OS結果を確認し、同一ID・別説明の新規衝突検出、同一説明の再引用許容、baseline stale検出、既存 collectOracleIds Set 契約、PLAN-L7-244 ownershipをレビューする。FLAGなら修正が必要で、verdictなしのmergeは不可。
