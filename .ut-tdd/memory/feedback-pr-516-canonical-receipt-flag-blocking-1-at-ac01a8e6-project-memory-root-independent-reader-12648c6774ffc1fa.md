---
memory_id: memory:feedback:pr-516-canonical-receipt-flag-blocking-1-at-ac01a8e6-project-memory-root-independent-reader-not-covered-by-loader-internal-repository-binding--638658c0fed0
kind: feedback
title: "PR 516 canonical receipt FLAG blocking 1 at ac01a8e6: project-memory-root independent reader not covered by loader-internal repository binding"
tags: ["codex-review", "exact-head", "flag", "issue-432", "pr516"]
updated_at: 2026-09-04T04:43:11.043Z
---

PR 516 exact HEAD ac01a8e6266680c263d9ee31c59fccb0fbdc39bb reviewed by gpt-5.6-sol. Verdict FLAG blocking 1, receipt digest 4e081d46746f15ac512a0e0c936f701afe1487c349b26468421fa60b605d0273. Previous 4 findings closed except one residue: Forward section 2.5 correctly measures that src/runtime/project-memory-root.ts reads HEAD:ut-tdd.project.json independently of the loader, but section 3.1.4, section 5 slice 3 and CANDIDATE-U-PROJID-038 claim the loader-internal binding protects that path with no code change; at 7b18ee4e projectIdentityFromHead does not call loadProjectIdentityFromHead and does not check origin/expected identity, so a grammar-valid stale identity from another repository can still become authoritative on that path. Fix: make 038 an implementation contract requiring either the independent reader to perform the same repository binding or its integration into the shared loader, and correct 3.1.4 / slice 3 wording. Claude will fix and re-request.
