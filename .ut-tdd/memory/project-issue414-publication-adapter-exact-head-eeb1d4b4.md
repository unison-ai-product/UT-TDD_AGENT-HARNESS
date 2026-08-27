---
memory_id: memory:project:issue414-publication-adapter-exact-head-eeb1d4b4
kind: project
title: "Issue #414 Pack publication adapter exact-head evidence"
tags: ["issue-414", "pack-publication", "canary", "exact-head", "node-npm"]
updated_at: 2026-08-27T08:20:00Z
---

Issue #414 Pack publication adapter is rebased onto `origin/main` `c12184c2`.

- subject: `feat/issue414-publication-adapter`
- exact_head: `eeb1d4b4603333a33bc10aae92ad1c699b89ccf9`
- base: `c12184c22a3df234371111b94c6b7c70302080a5`
- worker_model: `gpt-5.6-luna` implementation lane; non-author review pending
- scope: pure Pack publication intent/FSM, injected GitHub/Pack ports, approval/identity/nonce/CAS fail-close, publication receipt
- remote_mutation: none (including tests); no merge performed
- toolchain: Node `v24.13.0`, npm `11.6.2`; Bun not used
- targeted: `node scripts/run-vitest-snapshot.ts tests/pack-publication-adapter.test.ts --reporter=dot --maxWorkers=1 --minWorkers=1` — exit 0, 9 tests
- relevant prior exact-head run: manifest/staging/assets + adapter — exit 0, 42 tests (before 007–009 additions); rerun pending on rebased HEAD
- typecheck: `npm run typecheck` — exit 0 before rebase; rerun pending on rebased HEAD
- lint: Biome targeted — exit 0 before rebase; rerun pending on rebased HEAD
- plan_lint: PLAN-L7-519 and PLAN-REVERSE-519 — exit 0 before rebase; rerun pending on rebased HEAD
- canonical_trace: `docs/test-design/harness/L7-unit-test-design.md` now registers U-PACKPUB-REMOTE-001..009 1:1
- ci: PR #447 old head failed due draft-plan landing and missing canonical trace; new rebased CI pending
- dependency: PR #438 / PLAN-L7-515 remains draft/unmerged; no #438 files/contracts changed or assumed
