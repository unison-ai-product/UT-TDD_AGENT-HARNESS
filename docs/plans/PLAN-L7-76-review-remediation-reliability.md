---
plan_id: PLAN-L7-76-review-remediation-reliability
title: "PLAN-L7-76 (troubleshoot): L7 reliability remediation — DB rebuild atomicity, non-git doctor, agent-slots atomic write"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-17
updated: 2026-06-17
backprop_decision: not_required
backprop_decision_reason: "Internal harness self-application tooling (lint gate / runtime dispatch / guard / governance mechanism); hardens the harness's own enforcement and does not change the product's external requirement / design / test-design contract, so there is no upstream backprop target."
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: claude-opus-4-8
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-17"
    tests_green_at: "2026-06-17"
    verdict: pass
    scope: "External status-review report (ut-tdd-latest-fix-status-review.md) findings verified against current branch code and the genuinely-present, policy-free reliability defects fixed test-first: P0 rebuildHarnessDb non-atomic truncate+reproject (mid-rebuild failure left the projection DB truncated/half-built), P1 change-impact / change-set-integrity fail-close in a non-git (ZIP-only) checkout (inconsistent with the existing non-git fail-open convention in tracked-canonical / runtime-portability), and P1 agent-slots non-atomic state write (torn-write corruption under concurrent hooks). Each fix is covered by a Red→Green Vitest case; typecheck / Biome / full Vitest / doctor all green."
    worker_model: claude-opus-4-8
    reviewer_model: claude-opus-4-8
agent_slots:
  - role: tl
    slot_label: "TL - L7 reliability remediation from external status review"
generates:
  - artifact_path: docs/plans/PLAN-L7-76-review-remediation-reliability.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: src/runtime/agent-slots.ts
    artifact_type: source_module
  - artifact_path: src/lint/change-impact.ts
    artifact_type: source_module
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
  - artifact_path: tests/agent-slots.test.ts
    artifact_type: test_code
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-44-harness-db-master.md
  requires:
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
    - docs/adr/ADR-005-distribution-model-and-central-ui.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-76 (troubleshoot): L7 reliability remediation from external status review

## 0. Objective

An external status-review report (`ut-tdd-latest-fix-status-review.md`) was raised
against a snapshot ZIP. Verify each finding against the **current branch code**
(the report inferred "未修正" purely from a matching ZIP hash, not from re-reading
the live tree) and close the findings that are (a) genuinely present in current
code and (b) pure reliability defects with no governance/contract decision
attached. Findings that are already addressed, not actually present, or that
require a PO governance decision (requirements current/future split, `status
--json` / `skill suggest` contract direction, MCP launch-argv contract) are
recorded as disposition only and are **out of scope** here.

## 1. Scope

In scope (verified-present, policy-free reliability fixes):

- **P0 — `rebuildHarnessDb` atomicity** (`src/state-db/projection-writer.ts`):
  wrap `truncateProjectionTables` + the full `project*` sequence in a single
  `BEGIN IMMEDIATE` / `COMMIT` transaction with `ROLLBACK` on error (the same
  idiom already used by `projectTokenUsage`). A mid-rebuild exception now rolls
  back to the prior committed projection instead of leaving the DB truncated or
  half-populated.
- **P1 — non-git `doctor`** (`src/lint/change-impact.ts`, `src/doctor/index.ts`):
  add `isGitRepository(repoRoot)` and have `checkChangeImpact` /
  `checkChangeSetIntegrity` **skip** (`ok:true`, "skipped (not a git
  repository)") when the checkout is not a git work-tree, matching the existing
  non-git fail-open convention in `tracked-canonical` / `runtime-portability`. A
  git-present-but-broken `status` still fail-closes via the existing catch. CI
  always runs in a git repo, so CI behavior is unchanged.
- **P1 — `agent-slots` atomic write** (`src/runtime/agent-slots.ts`):
  `nodeAgentSlotsDeps.writeText` stages to a unique temp file and `renameSync`s
  over the target, so a concurrent hook (PreToolUse agent-guard / SubagentStop)
  or a crash mid-write never leaves a torn/partial JSON that `loadSlots` would
  discard as corrupt. Temp files are cleaned up on rename failure.

Out of scope (disposition recorded, not changed here):

- Already addressed in current code: README presence; PLAN/`src` ownership
  baseline (doctor `impl-plan-trace` already OK).
- Governance / contract-direction decisions reserved for PO: requirements
  current/future/carry CLI split; `status --json` and `skill suggest` public I/O
  contract one-directional reconcile; MCP config `command`/`args` launch contract
  (needs a profile-level `mcpCommand`/`mcpArgs` schema).
- Larger semantic change, deferred: session-digest event-level high-watermark
  idempotency (current session-level fold can under-count append-heavy sessions);
  full multi-process lost-update prevention for agent-slots (needs file locking).

## 2. Acceptance Criteria

- `rebuildHarnessDb` is atomic: injecting a failure during projection leaves the
  prior `plan_registry` projection intact (rollback), not truncated to 0 rows.
- `checkChangeImpact` / `checkChangeSetIntegrity` return `ok:true` with a
  "skipped (not a git repository)" message in a non-git directory, and still
  fail-close on an unreadable repo root.
- `nodeAgentSlotsDeps` round-trips slot state through the real fs and leaves no
  `*.tmp-*` temp file behind.
- typecheck / Biome / full Vitest / `ut-tdd doctor` stay green; src traces to a
  PLAN `generates` (this PLAN) and the change set carries design + test artifacts.

## 3. Test Design Pairing

Unit test design entries: `docs/test-design/harness/L7-unit-test-design.md`
(U-DBPROJ-ATOMIC-01, U-CHGIMPACT-NONGIT-01, U-SLOT-009). Red→Green verified:
the atomicity case fails on the pre-fix tree (`plan_registry` 188 → 0) and passes
after the transaction wrapper.

## 4. Status

Confirmed. Implemented and verified 2026-06-17 (Vitest Red→Green for the three
fixes + full suite + doctor green). Remaining review findings are disposition-only
(see §1 out of scope) and await PO governance decisions or a separate deferred
PLAN.
