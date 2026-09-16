---
memory_id: memory:project:issue-500-exact-head-pack-ci-bun-ban--ff5b04fe0804
kind: project
title: "Issue #500 exact-head Pack CI Bun BAN"
tags: ["bun-ban", "exact-head", "issue-500", "pack-ci"]
updated_at: 2026-08-31T11:32:25.544Z
---

exact_head: 8135fd1b2b2bc4a00dee50f750cd218545176a81
pr: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/502
issue: 500
worker_model: gpt-5.6-luna
scope: Pack-owned GitHub CI policy and Pack workflow template only
changes: Pack required steps are setup-node@v4 (Node 24.13.0, npm cache), npm ci --no-audit --no-fund, npm run typecheck, npm run test:pack, npm run lint, and direct Node setup/doctor commands. Pack policy rejects oven-sh/setup-bun@v2, bun, and bunx execution reachability via forbidden_bun_execution.
oracle: U-PACKBUN-007 covers independent setup-bun, bun install, bun run typecheck, bun run test:pack, bun run lint, bun wrapper, and bunx wrapper mutations; all fail-close.
tests:
- exact-head detached snapshot: tests/github-ci-policy.test.ts 102/102 Green
- typecheck: node node_modules/typescript/bin/tsc --noEmit --pretty false
- Biome: node node_modules/@biomejs/biome/bin/biome check src tests
- plan lint: PLAN-L7-522 and PLAN-REVERSE-522 Green
- doctor: node src/cli.ts doctor --scope toolchain Green; worktree-topology advisory only
- git diff --check Green
ci: GitHub harness-check-linux and harness-check-windows pending at memory creation.
review: draft PR; non-author canonical review not yet requested because required CI is pending.
