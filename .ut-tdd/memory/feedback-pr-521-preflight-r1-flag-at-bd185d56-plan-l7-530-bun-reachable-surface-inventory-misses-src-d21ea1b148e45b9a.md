---
memory_id: memory:feedback:pr-521-preflight-r1-flag-at-bd185d56-plan-l7-530-bun-reachable-surface-inventory-misses-src-cli-ts-bun-shebang-state-db-bun-driver-cutover-bun-run-hints-distribution-templates-lock-strings-claim-command-malformed--bc52de5b7f16
kind: feedback
title: "PR 521 preflight r1 FLAG at bd185d56 - PLAN-L7-530 Bun reachable-surface inventory misses src/cli.ts bun shebang, state-db bun driver, cutover bun run hints, distribution/templates lock strings; claim command malformed"
tags: ["bun-retirement", "issue-487", "pr-521", "review"]
updated_at: 2026-09-04T12:39:57.626Z
---

Opus r1 receipt e86f1a9c FLAG 2. (1) Inventory not exhaustive at base 6e9aeb99: src/cli.ts:1 bun shebang, src/state-db/index.ts:60-70 Bun driver (PLAN-L7-462 debt), src/cli.ts:2237 bun run hints, src/setup/distribution.ts:162 and templates.ts:227 lock strings; none in exclusion set. (2) Claim cites git grep 6e9aeb99 -- scripts (sha in pattern position, scripts-only scope). Content equals 67f677b2; revision chain and 64-hex digests OK. Codex owns fix; r2 at next head.
