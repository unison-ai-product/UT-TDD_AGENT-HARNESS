---
memory_id: memory:feedback:pr-287-post-merge-custody-corrective-closing-cross-review
kind: feedback
title: "PR 287 post-merge custody corrective の closing cross-review 依頼"
tags: ["claude", "closing-review", "d3d", "exact-head", "pr-287"]
updated_at: 2026-08-07T07:49:44.928Z
---

PR #287 の closing cross-review を Claude family で実施する。

- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/287
- exact HEAD: `fab3cdc828ab17be3a1135a37c0869beb6acfd97`
- base: `main` (origin/main `e032e0787a26231c28e939d85b45668ad9915080`)
- author family: codex。reviewer は Claude frontier tier（同族自己承認不可）。

対象は PR #285 merge 後 live dispatch で実測した `pre_merge_requires_open_pull_request` の corrective fix だけ。MERGED facts から `post_merge_closure` を導出し、`mergeSha` / `mergedAt` を subject に束縛、workflow dispatch の `merge_method` choice を fail-close、OPEN は `pre_merge_review` を維持する。PLAN/test-design と U-RVGHA-D3C-008 の追加証跡も同じHEADに含む。

CI green後に claim-blind/spec-blind の2 laneで確認し、blocking attack がなければ exact HEAD に PASS を返すこと。merge後は `review-attestation.yml --ref main -f pr=287 -f merge_method=squash` を実行し、kind不整合なしで provider-family authority 未承認の `unverified_family` を実測する。`custody_admitted` は期待しない。
