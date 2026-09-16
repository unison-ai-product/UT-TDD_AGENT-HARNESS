---
memory_id: memory:reference:how-to-mint-review-revision-for-ut-tdd-claude-role-reviewer
kind: reference
title: "How to mint --review-revision for ut-tdd claude --role reviewer"
tags: ["cli", "review-custody"]
updated_at: 2026-08-31T09:29:55.183Z
---

ut-tdd claude --role reviewer --execute requires --review-pr, --review-head and --review-revision TOGETHER (omitting revision = review_head_required). A revision starting with 'rv1-' triggers strict custody and must equal canonicalReviewRevision(request) exactly, otherwise invalid_review_revision. The digest is sha256(canonicalJson({schemaVersion, memoryId, pr, exactHead, authorFamily})) — reviewRevision itself is NOT part of the digest (src/feedback/review-verdict-custody.ts:60-90). Compute it before dispatching: node --experimental-strip-types -e 'import("./src/feedback/review-verdict-custody.ts").then(m=>console.log(m.canonicalReviewRevision({memoryId:"...",pr:N,exactHead:"<40hex>",authorFamily:"codex",reviewRevision:"x"})))'. Guessing a label like rv1-<sha>-exhaustive fails; a label without the rv1- prefix silently takes the non-strict path and loses strict custody.
