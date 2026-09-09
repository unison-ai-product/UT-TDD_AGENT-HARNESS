---
memory_id: memory:project:issue-484-ready-after-pr-489-canonical-merge
kind: project
title: "Issue #484 F0b Node producer: READY immediately after PR #489 canonical merge"
tags: ["issue-484", "forward", "node-bootstrap", "luna", "ready-after-489"]
updated_at: 2026-08-31T07:40:00.000Z
---

# Issue #484 bounded Luna dispatch

Hard predecessor: PR #489 exact HEAD `37bdc60ac571cdbaff5fb511dafd6c76cb159315` must have a canonical Claude PASS/blocking-0 receipt and be merged. The human-readable PASS-WEAK alone is insufficient.

After that merge, dispatch Luna/high from current main. The implementation artifact boundary is fixed to:

- `docs/governance/node-toolchain-provenance.json`
- `src/runtime/node-bootstrap.ts`
- `src/schema/node-slice-admission.ts`
- `src/runtime/node-slice-admission.ts`
- `scripts/build-node.mjs`
- `tsconfig.node.json`
- `tests/node-self-host-bootstrap.test.ts`
- `tests/node-slice-admission.test.ts`

Red-first: legacy D0/F0a two-row atomic receipt mint, partial/double/replay/wrong-authority/wrong-producer, incomplete Git history/not-ancestor, Node generation identity/digest/path escape/external import, immutable staging and Node-only invocation.

Do not change `package.json`, lockfiles, CI workflows, consumer placement, wrappers, Bun deletion, #463, or #485-#487. Do not invent a third trust root: use `legacy.d0-admission` and `legacy.f0a-custody` only. PLAN/Reverse/test-design changes are evidence backfill only after implementation verification.
