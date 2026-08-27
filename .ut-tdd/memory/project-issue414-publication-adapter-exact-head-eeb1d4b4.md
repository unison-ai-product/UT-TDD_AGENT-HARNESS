---
memory_id: memory:project:issue414-publication-adapter-exact-head-eeb1d4b4
kind: project
title: "Issue #414 Pack publication adapter exact-head evidence"
tags: ["issue-414", "pack-publication", "canary", "exact-head", "node-npm"]
updated_at: 2026-08-27T09:08:00Z
---

Issue #414 Pack publication adapter is rebased onto `origin/main` `c12184c2`.

- subject: `feat/issue414-publication-adapter`
- exact_head: `8229abe0eddb93ca1f08df3aea3b24bf60e9c569`
- base: `c12184c22a3df234371111b94c6b7c70302080a5`
- worker_model: `gpt-5.6-luna` implementation lane; non-author review pending
- scope: pure Pack publication intent/FSM, injected GitHub/Pack ports, approval/identity/nonce/CAS fail-close, publication receipt
- remote_mutation: none (including tests); no merge performed
- toolchain: Node `v24.13.0`, npm `11.6.2`; Bun not used
- targeted: CI scoped regression covered `tests/pack-publication-adapter.test.ts` with 9 direct U-PACKPUB-REMOTE-001..009 tests; all checks green
- trace/VMSRC: local oracle audit OK (orphans/duplicates/undeclared/stale all empty); U-VMSRC-009 canonical remote ID list 001..009 asserted
- typecheck: `npm run typecheck` — exit 0 at exact_head 8229abe0
- lint: `npm exec -- biome check src tests` — exit 0 at exact_head 8229abe0
- plan_lint: PLAN-L7-519 and PLAN-REVERSE-519 — exit 0 at exact_head 8229abe0
- canonical_trace: `docs/test-design/harness/L7-unit-test-design.md` is the sole declaration provenance for U-PACKPUB-REMOTE-001..009; dedicated matrix is reference-only
- ci: PR #447 run `33055615194` — Linux, Windows, aggregate all SUCCESS at exact_head 8229abe0
- dependency: PR #438 / PLAN-L7-515 remains draft/unmerged; no #438 files/contracts changed or assumed
