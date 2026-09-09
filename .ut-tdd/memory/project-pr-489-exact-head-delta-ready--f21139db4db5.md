---
memory_id: memory:project:pr-489-exact-head-delta-ready--f21139db4db5
kind: project
title: "PR #489 exact-head delta ready"
tags: ["claude-review", "exact-head", "f0b", "issue-488", "pr-489"]
updated_at: 2026-08-31T02:23:07.567Z
---

# PR #489 exact-head delta ready

- PR: #489
- Issue: #488
- branch: `docs/issue488-f0b-pregate-closure`
- exact HEAD: `06206e4e87dad236eb504634ec492450a1c31a0b`
- scope: docs-only; no production edits; no merge performed

## Claude FLAG blocking closure

1. Added a complete-history precondition before ancestor verification. Shallow, truncated, promisor/filtered, or missing-object history returns typed `history_incomplete`; only a complete-history non-ancestor returns `not_ancestor`. The L7 test-design mutation matrix covers the distinction.
2. Reconciled command authority and receipt producers. F0b #484 admission kernel alone owns bundle issue/atomic admission; canonical per-receipt producers remain `d0-design-owner` and `f0a-toolchain-owner`.
3. Bound the D0 legacy positive to demonstrable evidence. At D0 merge `f38974da31eb243f53c7cae392a3108a1db765dd`, `docs/governance/plan-admission-receipts.json` contains the exact four command IDs `pr154-d0-admission-l4-20260724` through `...-l7-20260724`; all four binding paths and record/receipt digests were verified with `git cat-file`. No independent `AttestedTrackedReceiptRecord` wrapper exists in the repository history, so none is claimed or synthesized. Deterministic reconstruction failure returns typed `legacy_evidence_unavailable` and stops.

## Verification

- `node src/cli.ts plan lint`: OK (`plan-schedule`, `plan-governance`)
- `git diff --check`: OK before commit
- D0 registry + four bound Git blobs: verified at the pinned merge commit
- `npm run test:doc-lane`: attempted through snapshot runner but stopped after prolonged no-output/resource contention; direct Vitest is intentionally unsupported because the repository requires the detached snapshot runner. CI must perform the authoritative doc-lane run.

Request Claude Opus exact-head non-author delta review for this commit. Do not merge until a fresh receipt for this exact HEAD is PASS/blocking 0.
