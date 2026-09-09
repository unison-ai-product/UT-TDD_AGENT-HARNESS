---
memory_id: memory:project:issue-484-opus-pre-gate-f0b-sealed-generation-admission--6a5545114706
kind: project
title: "Issue #484 Opus pre-gate: F0b sealed generation admission"
tags: ["f0b", "issue-484", "luna", "node-bootstrap", "opus", "pre-gate"]
updated_at: 2026-08-28T11:58:18.617Z
---

Issue #484 `Node bootstrap F0b: sealed generation producer and immutable receipt` の実装前 contract/admission review依頼。

subject baseline: origin/main 9e8a8a2530fa143cd4c143c57fe31021325cd7c1
worker after PASS: gpt-5.6-luna effort=high
reviewer: Claude Opus 5, non-author/blind

## Gate purpose

merged #192 F0a custody、reviewed/admitted D0、PLAN-L6-93 / PLAN-L7-458のF0b契約を同一subject/revisionへ束縛し、Lunaがbounded F0b implementationを開始できるか判定する。

## Allowed F0b paths

- docs/governance/node-toolchain-provenance.json
- src/runtime/node-bootstrap.ts
- src/schema/node-slice-admission.ts
- src/runtime/node-slice-admission.ts
- scripts/build-node.mjs
- tests/node-self-host-bootstrap.test.ts
- tests/node-slice-admission.test.ts

## Included candidates

CAND-NODEBOOT-001..016, 018, 102, 205 only.

## Required invariants

- deterministic compiled generation and immutable NodeBootstrapReceipt
- Node/npm executable identity, source/lock/dependency closure, compiled CLI, build policy, subject revision digest binding
- dist/node-generations/<generation-id>/ and exact dist/node-publish.lock/ atomic mkdir
- append-only immutable activation marker; partial/torn marker never admitted
- identity/digest/path/symlink/version drift fail-close before process spawn
- Node missing/corrupt: Bun/bunx/tsx/TS-direct/shell fallback spawn 0
- crash/same-revision rollback/concurrent reader: partial generation observation 0

## Explicit exclusions

F0a candidate 017, F0c 019, Q0 020, 103..106, 201..204, final Bun deletion, CI workflow wiring, package.json/package-lock/bun.lock, src/setup/*, consumer placement/runtime switch.

## Requested verdict

Return PASS/blocking 0 only if:

1. #192 F0a custody and D0 admission receipts bind the same subject/revision.
2. PLAN-L6-93 / PLAN-L7-458 provide an implementable F0b contract without unresolved authority/atomicity/fallback holes.
3. candidate set is mutation-discriminating and bounded to F0b.
4. no open PR path lease conflict exists for the seven allowed paths.

If FLAG, list exact blocking contract holes and required authoritative document delta. Do not implement code. On PASS, scheduler will immediately lease a fresh origin/main worktree to Luna for #484.
