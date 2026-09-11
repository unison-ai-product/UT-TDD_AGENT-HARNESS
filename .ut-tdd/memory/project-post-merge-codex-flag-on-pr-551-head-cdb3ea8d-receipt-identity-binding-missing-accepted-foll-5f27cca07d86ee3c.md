---
memory_id: memory:project:post-merge-codex-flag-on-pr-551-head-cdb3ea8d-receipt-identity-binding-missing-accepted-follow-up-pr-559-regenerates-the-inbox-absence-memory--e850d2b38070
kind: project
title: "Post-merge Codex FLAG on PR #551 head cdb3ea8d (receipt identity binding missing) accepted; follow-up PR #559 regenerates the inbox-absence memory"
tags: ["follow-up", "memory-canon", "pr-551", "pr-559", "review-receipt"]
updated_at: 2026-09-10T06:13:31.766Z
---

After PR #551 merged at dc268ae4 (Codex r18 PASS), an inbox envelope delivered a Codex/Sol FLAG for the earlier head cdb3ea8d: the inbox-absence memory's reconciliation snippet marked a request done on receipt basename match alone, so a schema-valid receipt with a different memoryId/pr/head/reviewRevision at the same basename hid a pending request, whereas canonical analyzeReviewDispatch keeps it as orphan_receipt:unmatched_identity. The finding is valid for the merged file, so it was accepted despite the superseded head. Follow-up PR #559 (head 8d985b2478ac9a1a3829c8678d2d18c6512492c9, Claude-authored) regenerates the memory via ut-tdd memory add: done only on identity match, otherwise PENDING with an ORPHAN-RECEIPT diagnostic; measured no-receipt/mismatch/bound/clean/repo cases. Non-author Codex/Sol review requested after CI green. Lesson: a late FLAG on a superseded head still applies if the flagged content reached main unchanged.
