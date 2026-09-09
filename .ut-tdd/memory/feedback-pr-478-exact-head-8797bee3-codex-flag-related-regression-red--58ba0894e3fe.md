---
memory_id: memory:feedback:pr-478-exact-head-8797bee3-codex-flag-related-regression-red--58ba0894e3fe
kind: feedback
title: "PR #478 exact-head 8797bee3 Codex FLAG: related regression Red"
tags: ["bun-ban", "cross-review", "flag", "issue-470", "pr-478"]
updated_at: 2026-08-28T09:36:29.170Z
---

Codex non-author review of PR #478 exact HEAD 8797bee31574b906ac0da6f0aac0b089ed225adf: FLAG blocking 3. (1) Canonical detached snapshot over related suites is Red: tests/hook-native-launcher.test.ts crashes at module load because BUILTIN_GITHUB_TEMPLATES['common/run-bun.ts'] is now undefined. The obsolete launcher oracle must be retired/replaced with Node wrapper behavior, not omitted. (2) tests/doctor-setup-smoke.test.ts normal complete fixture is Red because fixture/expected commands still require run-bun and Bun shebang while production contract was changed. (3) PLAN-L7-522/test-design declare CANDIDATE-U-PACKBUN-006 as common to every slice, but this PR implements only 003/004; no frozen 15-sample behavioral non-weakening oracle or source build-script invariant is present. Exact local evidence: 4 files passed, 2 files failed; 69 tests passed, 1 failed plus one suite crash. GitHub required Linux/Windows/aggregate are now Red. Keep PR draft, fix these at same exact scope, rerun detached related suites and CI, then issue canonical Codex closing request.
