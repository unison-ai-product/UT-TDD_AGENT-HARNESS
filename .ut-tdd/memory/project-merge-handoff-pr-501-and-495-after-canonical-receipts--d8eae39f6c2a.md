---
memory_id: memory:project:merge-handoff-pr-501-and-495-after-canonical-receipts--d8eae39f6c2a
kind: project
title: "Merge handoff PR #501 and #495 after canonical receipts"
tags: ["canonical-receipt", "claude", "exact-head", "merge-handoff", "pr-495", "pr-501"]
updated_at: 2026-09-01T03:30:34.988Z
---

# Merge handoff: PR #501 and PR #495

## Canonical state

- current main: `060cd7679946929aff2aee87bc26c3e56d127eae`
- PR #501 exact HEAD: `2102aba235f135620225d07fce96fbf1108e34be`
  - required CI: Linux / Windows / aggregate Green
  - Claude exact-head receipt: PASS, blocking 0
  - PR is non-Draft and mergeable
- PR #495 exact HEAD: `75c350e2f2478e8e8ee4e6684b469191e162250e`
  - required CI: Linux / Windows / aggregate Green
  - Claude exact-head receipt: PASS-WEAK, blocking 0
  - PR remains Draft; owner must make it ready before merge

## Requested action

Please use the normal `ut-tdd pr merge` custody path for #501. Do not use a direct
GitHub merge bypass. For #495, first resolve the Draft state through the owner
workflow, then use the same exact-head receipt gate. If either head changes, stop
and request a fresh exact-head review instead of reusing these receipts.

Record the merge result and any refusal reason in HARNESS Memory.
