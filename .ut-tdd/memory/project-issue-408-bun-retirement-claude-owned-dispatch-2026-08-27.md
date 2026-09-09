---
memory_id: memory:project:issue-408-bun-retirement-claude-owned-dispatch
kind: project
title: "Issue #408 Bun permanent-ban Pack/consumer Node migration — Claude-owned dispatch"
tags: ["bun-retirement", "claude-owned", "issue-408", "node", "pack", "release-blocker"]
updated_at: 2026-08-27T17:20:00+09:00
---

# Issue #408 Claude-owned implementation dispatch

Issue #408 is still open, has no assignee, and has no active implementation PR.
Closed PRs #411 and #415 are historical/partial slices; PR #430 is the prerequisite
contract freeze only. Do not treat any of them as completion evidence for #408.

- Issue: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/408
- source baseline: `origin/main` `c12184c22a3df234371111b94c6b7c70302080a5`
- ownership: Claude lane owns the contract decision, cross-review, and closure
- implementation worker: `gpt-5.6-luna`, effort `high`, after the contract is accepted
- post-gate: Claude non-author exact-head receipt; Codex does not merge or close

## Required implementation boundary

Remove the Pack/consumer Bun execution contract, not merely add another denylist:

- generated consumer wrappers must not emit `#!/usr/bin/env bun`, `run-bun.ts`, or `findBun`
- Pack/consumer setup and CI must use Node/npm and must not install or invoke Bun
- `src/cli/distribution.ts` must not probe `bun` or `~/.bun` for the consumer path
- distribution/setup acceptance oracles must be rewritten for Node and remove `runBun` fixtures
- Pack/consumer workflow `setup-bun` and Bun commands must be removed
- Pack/consumer-origin Bun entries must leave the portability allowlist
- existing consumer migration, deadline, notification, and rollback procedure must be recorded

The source harness build-retirement contract in PLAN-L6-93 / PR #430 remains the
separate prerequisite. Do not silently broaden this slice to `bun:sqlite`, source
control-plane migration, remote publication, Pack canary, or stable promotion.

## Required V-model evidence

Create one bounded implementation PR for #408 from current main. Before implementation,
confirm the PLAN/test-design pair and its exact revision. Use Node/npm only. Add Red
oracles for each listed Bun surface, then Green implementation and Linux/Windows/aggregate
CI. Record exact HEAD, PLAN revision, worker model, commands, remaining migration boundary,
and Claude closing review in HARNESS Memory. Close #408 only after the canonical receipt
is available; do not fabricate a receipt or use a direct GitHub merge path.

This file is a task notification for the existing Issue #408. It does not mint a new
Issue or PR and must be consumed through the normal Claude VS Code/HARNESS Memory route.
