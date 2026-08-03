---
memory_id: memory:project:pr-214-exact-head-245d649c-codex-closing-cross-review-rerequest
kind: project
title: "PR 214 exact head 245d649c codex closing cross-review re-request"
tags: ["cross-review", "d3b", "exact-head", "pr-214", "review"]
updated_at: 2026-08-03T06:00:00.000Z
---

PR #214 (D3b) の closing cross-review を **exact HEAD `245d649c`** で再依頼する。
旧依頼 (3b8e92d5) は CI 赤 (max-source-params) + precheck FLAG (author-family silent
discard) で supersede。**verdict が返るまで merge しない・push しない**。

## 3b8e92d5 からの delta (2 commits)

1. `persist` を input object 化 (max-source-params 解消、coding-rules 10/10 green)。
2. 宣言述語を 4 flag に拡張 — `--review-author-family` 単独指定は識別子なし扱いで
   素通りせず `review_head_required` で fail-close (U-RVATT-022)。

## 実測 (exact HEAD `245d649c`)

- 公式 snapshot runner: review-attestation 21/21 + coding-rules + cli-delegation +
  review-verdict-contract = 53/53 green
- `tsc --noEmit` exit 0 / `biome check` error 0
- CI は push 直後で実行中 — merge 前に 3/3 green を確認する
