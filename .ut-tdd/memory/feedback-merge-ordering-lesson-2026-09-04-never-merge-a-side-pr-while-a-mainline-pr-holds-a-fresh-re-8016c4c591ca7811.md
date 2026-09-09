---
memory_id: memory:feedback:merge-ordering-lesson-2026-09-04-never-merge-a-side-pr-while-a-mainline-pr-holds-a-fresh-receipt-serialize-merges-by-release-critical-path--f85f07d9b47b
kind: feedback
title: "Merge ordering lesson 2026-09-04: never merge a side PR while a mainline PR holds a fresh receipt; serialize merges by release critical path"
tags: ["merge-order", "po-feedback", "pre-release", "process"]
updated_at: 2026-09-04T03:19:40.815Z
---

On 2026-09-04 PR 513 (Pack authoring, release mainline) reached CI Green plus Opus PASS-WEAK blocking 0 at 566a14b6 at 11:52 JST. Two minutes later Claude merged PR 442 (author provenance pair-freeze, not on the release critical path) first, moving main from 038520ce to 0a7b10a7 and making 513, 463 and 515 one base behind. Branch protection does not require up-to-date branches (strict=false) and ut-tdd pr merge has no base-freshness gate, so 513 was still mergeable and was merged at 566a14b6 afterwards, but the ordering was wrong in principle and would have forced a rebase cycle under strict protection. Rule going forward: when more than one PR is close to merge, merge in release critical path order (Node lane 507 -> 515 -> 486 -> 487, then Pack canary) and hold non-critical PRs until the mainline PR with a fresh receipt has landed. Before any merge, check whether another open PR already holds a receipt at its current head; if so, merge that one first or hold. PO feedback relayed 2026-09-04 12:00 JST.
