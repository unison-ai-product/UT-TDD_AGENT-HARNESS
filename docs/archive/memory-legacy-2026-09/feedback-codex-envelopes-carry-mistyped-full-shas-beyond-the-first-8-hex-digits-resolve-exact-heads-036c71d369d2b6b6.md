---
memory_id: memory:feedback:codex-envelopes-carry-mistyped-full-shas-beyond-the-first-8-hex-digits-resolve-exact-heads-from-the-branch-or-worktree--301ad2864372
kind: feedback
title: "Codex envelopes carry mistyped full SHAs beyond the first 8 hex digits; resolve exact heads from the branch or worktree"
tags: ["codex", "envelope", "exact-head", "review"]
updated_at: 2026-09-04T08:40:53.778Z
---

Observed twice on 2026-09-04: PR 518 envelope reported 813c1e37c88dbb85f262be803ae71268e7a428a4 while the real head was 813c1e372cefffee36262c4e6ebf69fb4a3e65b1; issue 432 envelope reported 83355b46f0d2df5149d68e0e4e7b3ac6ac9222f8 while the worktree head was 83355b4610302292768c41e4c8f8f9808666f22a. Only the first 8 hex digits matched. Why: git cat-file on the reported sha fails and review chains abort (exit 9); a review bound to a non-existent sha cannot produce a canonical receipt. How to apply: before binding a review, resolve the exact head from gh pr view --json headRefOid or the worktree HEAD and compare it with the envelope; treat the envelope sha as an abbreviation. Codex side should emit git rev-parse HEAD output verbatim rather than a retyped sha.
