---
memory_id: memory:project:parallel-dispatch-472-s1-c-and-484-f0b-from-main-a3a4fd3d--cd63a9457931
kind: project
title: "Parallel dispatch #472 S1-c and #484 F0b from main a3a4fd3d"
tags: ["bun-ban", "claude", "forward", "issue-472", "issue-484", "luna", "node-bootstrap", "parallel-dispatch"]
updated_at: 2026-09-01T03:51:43.500Z
---

# Parallel dispatch: Issue #472 and Issue #484

## Shared baseline

- current main: `a3a4fd3d93a2ccf1d0c51826d862dd9ba442f9a3`
- #470/S1-b and #471/S1-a are merged
- #488 F0b pre-gate and #499/#501 F0a.5 provenance are merged
- do not use stale local branches as a baseline; create bounded worktrees below `C:\dev\`

## Lane A — Issue #472 / S1-c (Claude-owned)

- remove both source workflow `oven-sh/setup-bun@v2` steps
- update only source-profile required-step expectations in `src/lint/github-ci-policy.ts`
- retain all Bun deny rules and Pack-profile policy
- prove `CANDIDATE-U-PACKBUN-005` (source acceptance Green, Bun install/download/invocation trace 0)
- evaluate `U-PACKBUN-006` without weakening detection
- keep `package.json` `build: bun build ...`, Node producer, Pack CI, #484-#487, #463, and #490 out of scope
- Red first, then focused oracle trace, Linux/Windows/aggregate CI, exact-head non-author receipt

## Lane B — Issue #484 / F0b (Luna worker, Opus pre/post gate)

- dispatch `gpt-5.6-luna` only after the already-merged #488/#499 admission rows are verified against this main
- implement only `buildNodeGeneration`, immutable `NodeBootstrapReceipt`, executable/source/lock/toolchain custody,
  minimal slice-admission schema/kernel increment, and exactly-once legacy D0/F0a backfill
- use the bounded paths from Issue #484: node-toolchain provenance, `src/runtime/node-bootstrap.ts`,
  `scripts/build-node.mjs`, `tsconfig.node.json`, focused F0b tests
- prove `CAND-NODEBOOT-001..016`, `018`, `102`, `205`
- do not implement F0c/#485, Q0/#486, final Bun deletion/#487, consumer placement/#463, or CI matrix activation
- record `worker_model=gpt-5.6-luna` at the exact revision; Red→Green, Linux/Windows/aggregate CI,
  Opus non-author closing receipt, and Reverse evidence are required

These lanes are path-disjoint and may run concurrently. If main post-merge CI later fails, stop new merge attempts,
but do not discard the work; rebase and rerun the exact gates from the corrected main.
