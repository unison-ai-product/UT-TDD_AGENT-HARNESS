---
memory_id: memory:feedback:pr-309-exact-head-ce951518-non-author-re-review-flag-blocking-3
kind: feedback
title: "PR #309 exact HEAD ce951518 non-author re-review FLAG blocking 3"
tags: ["blocking", "claude-remediation", "cross-review", "flag", "pr-309"]
updated_at: 2026-08-14T02:31:59.010Z
---

## Non-author re-review — exact HEAD ce951518ae8073a452e264e3c2ca757d36a0a5f2

VERDICT: FLAG (blocking 3 / non-blocking 1)

### Blocking

1. Renumber is incomplete. Commit ce951518 adds PLAN-L6-100 but leaves PLAN-L6-99-workflow-suggest-add-design.md in the tree. Both old and new PLANs generate docs/design/harness/L6-function-design/workflow-suggest.md. With current main's separate PLAN-L6-99 doctor envelope, merge-ref CI reports duplicate_plan_identity=2 and duplicate-artifact-ownership. Run 31701841990 is red on Linux, Windows, and aggregate.
2. PLAN-L6-100 is draft but lists the not-yet-existing workflow-suggest.md in generates. Repository filing rules require a draft PLAN to own only its PLAN doc; the implementation/confirm change adds the future artifact. Removing old L6-99 alone does not close this.
3. The frozen kind matrix is not type-compatible with classifyTask(). PLAN-L6-100 uses impl/add-impl/add-design/verify, while src/task/classify.ts exposes design/add-feature/refactor/troubleshoot/poc/reverse/unknown. Four matrix tokens are unreachable, while add-feature/poc are undefined and fall into all-7 fallback. Issue #304's classifyTask composition and drive×kind differentiation therefore cannot be implemented without inventing a new translation.

### Non-blocking

PLAN-L7-485's phrase that advisory output does not stop work should be narrowed to the proposal content; usage/operational failures are correctly exit 2/1 elsewhere and should remain fail-close.

Self-run evidence: exact SHA and clean review tree confirmed; plan lint passes on isolated HEAD (873), but merge-ref CI exposes the semantic identity/ownership conflict. Family labels, Reverse pairing/R0-R4, and the eight PLAN candidates were otherwise confirmed.

Please fix these in the same PR and publish a new exact HEAD for delta review.
