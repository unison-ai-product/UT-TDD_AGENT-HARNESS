---
memory_id: memory:project:codex-dispatch-507-rebase-to-current-main-plus-start-424-and-482
kind: project
title: "Codex dispatch 507 rebase to current main plus start 424 and 482"
tags: ["dispatch", "issue-424", "issue-482", "issue-484", "pr-507", "release-blocker"]
updated_at: 2026-09-01T08:11:43.455Z
---

PO direction (2026-09-01, via Claude orchestrator): three items for the Codex lane, effective immediately.

1. PR #507 (#484 F0b) — do not let it sit on the stale base. Its merge-base is still a3a4fd3d while main has advanced to b17a8ec7 (post #508 Bun-spawn retirement and #509 S1-c setup-bun removal; source CI no longer installs Bun, and the runtime-portability allowlists shrank). Current head 16e892f7 has the B4 contract correction (cross-reviewed PASS/0), B1-B3 repairs (authoritative builder execution + real external closure + real-compile/mutation oracles), the coding-rules object-param fix, and the order-independent B2 oracle; focused 24/24 Green locally; CI is running now. After this CI completes, rebase feat/issue484-f0b-node-generation onto b17a8ec7, rerun the focused gates on the rebased head (especially anything touching runtime-portability allowlists and github-ci-policy, which #508/#509 changed), push the rebased head, get Linux/Windows/aggregate Green, then request the fresh non-author Claude Opus closing review at that exact head. Claude stands by to run the Opus review immediately on request.

2. Issue #424 (Release blocker: project-scoped canonical Memory/notification root across worktreesand providers) — start now. This session observed the pain live today: review requests, receipts, and wake envelopes written in per-worktree .ut-tdd/ roots were invisible to the other party until manually mirrored, and the claude-memory-wake inbox lives under .git/ut-tdd-runtime keyed by workspace id. File/refresh the PLAN with route certificate, freeze the canonical-root contract (single project-scoped root, worktree- and provider-agnostic) before implementation, cross-review the freeze, then implement bounded slices. High-impact: it touches the notification trust root, so keep the contract freeze reviewable and do not big-bang the migration.

3. Issue #482 (Pack scope: close the silent exclusion of PLAN / design / V-model authoring templates) — start now as an independent lane. Scope per the issue body: extend CLEAN_ALLOW_PREFIXES / required set so consumers can start 企画→設計→PLAN→検証 without source-repo reference; blocking dependency of the first Internal Canary. Path-disjoint from #507 and #424, so it can run in parallel (worker tier implementation, opposite-family closing review).

Ordering: #507 rebase is the top priority (Node producer lane unblocks #463 and F0c). #424 and #482 run in parallel lanes. All merges via ut-tdd pr merge with exact-head non-author receipts, as usual.
