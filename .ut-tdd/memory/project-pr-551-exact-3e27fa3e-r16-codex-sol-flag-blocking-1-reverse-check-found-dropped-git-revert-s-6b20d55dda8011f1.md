---
memory_id: memory:project:pr-551-exact-3e27fa3e-r16-codex-sol-flag-blocking-1-reverse-check-found-dropped-git-revert-subject-commitlint-lesson-regenerated-at-16471bf6-and-2d96a678--a21d2cd47927
kind: project
title: "PR #551 exact 3e27fa3e r16 Codex Sol FLAG blocking 1 (reverse check found dropped git-revert subject commitlint lesson), regenerated at 16471bf6 and 2d96a678"
tags: ["exact-head", "flag", "memory-delivery", "pr-551", "review-receipt"]
updated_at: 2026-09-10T05:04:19.976Z
---

PR #551 exact HEAD 3e27fa3eb7186f1b3c19b7d1733e52005257c0bd: Codex gpt-5.6-sol non-author closing review r16 verdict FLAG blocking 1 (receipt f0fc6f4fde83c0c38c5afcdee4027be77dbcbf9ce47b463490d93698e9718d22). Reverse check found the PR #529 / #520 memories in the dropped set carried a durable lesson: git revert's default subject Revert "..." fails CONVENTIONAL_COMMIT_RE in src/github/ops-guard.ts (lowercase revert: required) and no canonical equivalent exists on main. Remedy 16471bf6 regenerated the general rule via ut-tdd memory add --body-file; 2d96a678 corrected its verification step because node src/cli.ts github guard requires --head-ref and --commit-file (measured: default subject -> commitlint-invalid exit 1, revert: subject -> exit 0). Delivery 14 -> 15. Lesson: every command embedded in a memory must be executed as written before delivery, including its required arguments.
