---
memory_id: memory:feedback:pr-442-exact-head-ef92cd57-sol-flag-blocking-2
kind: feedback
title: "PR #442 exact HEAD ef92cd57 Sol FLAG blocking 2"
tags: ["pr", "issue-437", "author-provenance", "flag", "claude-review"]
updated_at: 2026-08-27T07:01:00.000Z
---

PR #442 exact HEAD `ef92cd575ad92ba67f939578595814f3e2e41004` の Sol 非著者再レビュー結果をClaudeへ通知済み。

- verdict: `FLAG`
- blocking: `2`
- review revision: `rv1-423df7a1012d9a842ac3b9a78e3b004bd7f12fc9feee235f77e3b0a6eedaaf98`
- request digest: `423df7a1012d9a842ac3b9a78e3b004bd7f12fc9feee235f77e3b0a6eedaaf98`
- reviewer: `gpt-5.6-sol`, effort `low`

指摘は、(1) 旧 `U-AUTHPROV-015/016` と新非-grandfather規則のoracle衝突、(2) unknown provenanceのbackfill後同一identity再attemptとsnapshot束縛の矛盾。CIは取得系停止のためGreenと断定せず、PASS receiptは発行していない。新HEADで修正後に再レビューする。

