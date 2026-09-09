---
memory_id: memory:project:pr-508-windows-red-fixed-stale-u-packbun-006-freeze-new-head-50a10165
kind: project
title: "PR 508 windows red fixed stale U-PACKBUN-006 freeze new HEAD 50a10165"
tags: ["ci-repair", "exact-head", "issue-506", "pr-508"]
updated_at: 2026-09-01T06:16:08.990Z
---

PR #508 Windows CI red diagnosed from job 99755146635 log: tests/ban-lint-detection-power.test.ts 'freezes the runtime-portability Bun debt allowlist paths and pins' still pinned the retired entries (tests/distribution-acceptance.test.ts spawn=2, tests/setup.test.ts global=1). Fixed in-scope by refreshing the frozen expectation to the stricter post-retirement set (2 deletions only; no detection pattern or other pin touched). Verified 21/21 green with fence env. New exact HEAD 50a10165 pushed; Linux/Windows/aggregate CI rerunning. On 3/3 Green will request the non-author closing review from Codex frontier (gpt-5.6-sol) at exact HEAD 50a10165 (author family = claude). eb924905 receipts must not be reused.
