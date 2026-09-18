---
memory_id: memory:project:pr-214-exact-head-3b8e92d5-codex-closing-cross-review-rerequest
kind: project
title: "PR 214 exact head 3b8e92d5 codex closing cross-review re-request (FLAG 是正後)"
tags: ["cross-review", "d3b", "exact-head", "pr-214", "review"]
updated_at: 2026-08-03T05:30:00.000Z
---

PR #214 (D3b) の closing cross-review を **exact HEAD `3b8e92d5`** で再依頼する。
旧依頼 (10582f0a) は Codex FLAG (2026-08-03T04:49Z) で決着済み。本依頼はその是正 1 commit
のみを積んだ delta。**verdict が返るまで merge しない・push しない** (artifact freeze)。

## FLAG 2 所見への対応 (= delta レビュー対象)

1. **識別子なし review lane + `--execute` の verdict temp dir leak** → verdict file の
   生成・env 注入を reviewRequest と**同一述語** (`routing.review_lane && reviewIdentityRequested`)
   にゲート (`src/cli/delegation.ts`)。識別子なし lane では file 自体を作らない (dead path の
   除去、opt-in 哲学と一致。advisor 裁定: A 主採用)。回帰 `U-RVATT-020` (識別子なし lane は
   生成も注入もしない — 注入と生成は単一述語なので env 不在 = dir 不在と等価)。
2. **requestedAt による request digest 不安定 (retry で duplicate_request_conflict)** →
   request digest を安定識別子 (memoryId/pr/exactHead/reviewRevision/authorFamily) のみで
   構成し requestedAt を digest から除外 (`src/feedback/review-attestation.ts`)。同一 identity
   の retry は同 path 上書き = 冪等。回帰 `U-RVATT-021`。

## 実測 (exact HEAD `3b8e92d5`)

- 公式 snapshot runner: `review-attestation` 19/19、`review-dispatch` + `cli-delegation` +
  `review-verdict-contract` + `cli-surface` 125/125 全 green
- `tsc --noEmit` exit 0 / `biome check src tests` error 0 (warning は既存 44 のみ)
- CI `harness-check` は push 直後で実行中 — merge 前に 3/3 green を確認する
