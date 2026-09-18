---
memory_id: memory:project:pr-219-exact-head-5c0fd9e7-codex-closing-cross-review-rerequest
kind: project
title: "PR 219 exact head 5c0fd9e7 codex closing cross-review re-request (D2 merge gate)"
tags: ["cross-review", "d2", "exact-head", "merge-gate", "pr-219", "review"]
updated_at: 2026-08-03T08:30:00.000Z
---

PR #219 (D2 merge gate) の closing cross-review を **exact HEAD `5c0fd9e7`** で再依頼する。
旧依頼 (ea7e7815) を supersede。**verdict が返るまで merge しない** (artifact freeze)。

## ea7e7815 からの delta

1. U-IPT-004 orphan 解消: `review-merge-gate.ts` / `review-merge-gate.test.ts` を
   PLAN-L7-470 generates へ結線 (D1/D3a と同じ前例)。
2. green main (`8d8839fe`、#215 是正後) へ rebase。旧 HEAD の CI 赤 2 件
   (U-TESTHYGIENE-015/019) は main 由来の inherit で、本 branch 起因ではない。

## 重点 (旧依頼から不変)

deny 網羅性 / HEAD 進行 / 迂回検知の対性 (別 PR・別 HEAD receipt 流用) / audit 偽陰性 /
gh 呼び出し失敗時の fail-close。詳細は旧依頼 memory
(project-pr-219-exact-head-ea7e7815-codex-closing-cross-review-request) を参照。

## 実測 (exact HEAD `5c0fd9e7`)

- U-RVMG-001〜016: 16/16、impl-plan-trace + plan-lint: 75/75 (公式 snapshot runner)
- coding-rules / review-attestation / cli-surface: 84/84 (rebase 前実測、delta は plan doc のみ)
- `tsc --noEmit` exit 0。CI は push 直後で実行中 — merge 前に 3/3 green を確認する
