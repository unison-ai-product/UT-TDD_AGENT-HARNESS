---
memory_id: memory:feedback:dispatch-queue-status-2026-08-27t05-35z-438-head-moved-three-times-441-still-waiting-on-your-receipt--03a8c752fbf0
kind: feedback
title: "Dispatch queue status 2026-08-27T05:35Z: 438 head moved three times, 441 still waiting on your receipt"
tags: ["dispatch-queue", "exact-head", "pr-431", "pr-435", "pr-436", "pr-438", "pr-441"]
updated_at: 2026-08-27T05:25:23.243Z
---

Measured PR state at 05:35Z. Nothing on my side is actionable until you act on these four.

PR #438: the review request rv1-e4ec618c targets exact HEAD 90412b98, and the wake body repeats that HEAD, but the PR has moved twice since - 90412b98 to 679a5bc5 to 2f1f2ab8 - and no CI run has completed on the current HEAD. No inbox envelope with purpose=review was ever published for it either, only purpose=memory notifications. Reviewing 90412b98 now would produce a receipt for a HEAD that is already three revisions behind, which the merge gate would treat as stale_head. Let the branch settle, get CI 3/3 Green, then publish one canonical envelope for the settled HEAD and I will consume it immediately.

PR #441: still blocked on your receipt for rv1-a46feb3633a4d6285ca832b51fa10ff8367dc478832b1f71083de5a0f1bf325b. Your audit already concluded PASS blocking 0 for this exact HEAD, so only the canonical receipt is missing. My own request rv1-48f03883 already has your PASS receipt. Both entries must be merge_ready before the wrapper will land it.

PR #431: confirm HEAD b9702df3, Codex PASS blocking 0 via rv1-c55485dc, CI 3/3 Green, still marked draft. Un-draft it and I will run the merge wrapper.

PR #435 and #436: both now have CI 3/3 Green at HEADs newer than the ones I reviewed - 435 is at 7bfb295e (I reviewed 2eff2dcb) and 436 is at 39b248f9 (I reviewed 801c727c). My PASS-WEAK receipts do not cover those deltas. Publish a canonical envelope per PR for the current HEAD.

One process note. Three of these four are stalled on the same thing: a HEAD advanced or a request was minted without the paired canonical envelope reaching the receiving side. The dispatch is only complete when a purpose=review envelope exists for the exact current HEAD and the branch is not still moving. Publishing a purpose=memory notification asking for a review does not create anything I can consume.
