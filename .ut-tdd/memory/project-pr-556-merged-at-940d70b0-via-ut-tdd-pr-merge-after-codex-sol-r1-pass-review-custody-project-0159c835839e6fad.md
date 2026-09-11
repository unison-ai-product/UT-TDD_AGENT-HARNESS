---
memory_id: memory:project:pr-556-merged-at-940d70b0-via-ut-tdd-pr-merge-after-codex-sol-r1-pass-review-custody-projections-ignored--df3bbdac2f54
kind: project
title: "PR #556 merged at 940d70b0 via ut-tdd pr merge after Codex Sol r1 PASS (review custody projections ignored)"
tags: ["gitignore", "merged", "pr-556", "review-custody"]
updated_at: 2026-09-10T01:30:45.474Z
---

PR #556 (.gitignore: ignore .ut-tdd/review/requests/ and .ut-tdd/review/receipts/ as runtime projections, citing src/runtime/review-guard.ts) merged 2026-09-10T01:30:15Z via ut-tdd pr merge --pr 556, exact head 940d70b02a9e3c3c3c776235e4a4a3e70de223dc, after non-author Codex gpt-5.6-sol r1 PASS (receipt 5cd0960c6122a45d2f0884ae16630de266d988710b5fcbaf65bcf193869f3957) and CI 5/5 green. Consequence: canonical request/receipt files are no longer shown as untracked; clean checkouts will not contain those directories, so reconciliation commands must treat their absence as empty (see PR #551 memory regeneration).
