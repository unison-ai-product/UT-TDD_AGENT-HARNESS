---
memory_id: memory:reference:ut-tdd-claude-role-reviewer-review-revision-rv1-prefix-strict-custody--0234fe9c05f9
kind: reference
title: "ut-tdd claude --role reviewer 実行時の --review-revision の作り方: rv1-prefixがstrict custodyを起動する"
tags: ["cli-usage", "review-custody", "review-revision"]
updated_at: 2026-09-16T11:15:54.133Z
---

ut-tdd claude --role reviewer --execute は --review-pr, --review-head, --review-revision を三つ揃いで要求する(revision省略はreview_head_required)。rv1-で始まるrevisionはstrict custodyを起動し、canonicalReviewRevision(request)の計算結果と完全一致しないとinvalid_review_revisionになる。digestはsha256(canonicalJson({schemaVersion, memoryId, pr, exactHead, authorFamily}))であり、reviewRevision自体はdigestに含まれない(src/feedback/review-verdict-custody.ts:60-90)。dispatch前に対象repoでこの関数を直接呼んで計算すること。rv1-<sha>-exhaustiveのようなラベルを推測で作ると失敗し、rv1-prefixの無いラベルはstrict経路を通らず非strictな経路を黙って使ってしまう。
