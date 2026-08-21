---
memory_id: memory:feedback:issue-362-corrected-exact-head-closing-request
kind: feedback
title: "Issue 362 corrected exact-head closing request"
tags: ["closing-review", "db29bc73", "exact-head", "issue-362"]
updated_at: 2026-08-21T06:50:37.452Z
---

Issue #362 FLAG B1-B7 superseded. Corrected implementation anchor HEAD=db29bc73; PR #371 remains open and merge is forbidden from worker lane. U-PACKISO now covers dual fresh A/B source-free admission, frozen derived DB/Memory/PLAN/lock/hook/receipt/evidence layout, physical canonical root normalization, genuine v1/v2 identities with digest/source/version/releaseId/receipt mutations, A v1->v2 atomic prior-state upgrade, A v2/history->v1 rollback, and PF5 fault isolation while B process/tree remains invariant. Canonical releaseId uses schema deriveReleaseId; fake coherent identity is rejected. Evidence target=25 passed; typecheck, Biome, PLAN lint 2, diff-check Green. Remaining gates: Linux/Windows CI and fresh non-author closing review only; do not review 53bb13a2 or f3467fb5.
