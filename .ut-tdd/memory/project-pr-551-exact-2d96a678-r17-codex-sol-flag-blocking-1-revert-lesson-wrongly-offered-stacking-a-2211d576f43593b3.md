---
memory_id: memory:project:pr-551-exact-2d96a678-r17-codex-sol-flag-blocking-1-revert-lesson-wrongly-offered-stacking-a-fix-commit-regenerated-at-dc268ae4--2ad776e952b3
kind: project
title: "PR #551 exact 2d96a678 r17 Codex Sol FLAG blocking 1 (revert lesson wrongly offered stacking a fix commit), regenerated at dc268ae4"
tags: ["exact-head", "flag", "memory-delivery", "pr-551", "review-receipt"]
updated_at: 2026-09-10T05:25:59.794Z
---

PR #551 exact HEAD 2d96a67879eb43a12935e68433f0acf9536bfb52: Codex gpt-5.6-sol non-author closing review r17 verdict FLAG blocking 1 (receipt 07c091ea1f6459c4b32db836a92afa495274566e6644505adbc9ed6af25ea441). The regenerated git-revert subject memory offered stacking a follow-up commit after push as a remedy; since harness-check.yml feeds the last 20 subjects (git log --format=%s -n 20) to github guard, the offending Revert subject stays in the window and exit 1 persists. Remedy dc268ae4 regenerated the memory via ut-tdd memory add --body-file: pre-push amend/reword only; post-push history repair is decided with the PO, never by a follow-up commit. Delivery stays 15.
