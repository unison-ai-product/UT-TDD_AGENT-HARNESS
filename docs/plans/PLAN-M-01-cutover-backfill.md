---
plan_id: PLAN-M-01-cutover-backfill
title: "PLAN-M-01: legacy-source isolation backfill roadmap"
kind: design
layer: L14
drive: fullstack
status: completed
created: 2026-06-11
updated: 2026-06-11
owner: Codex TL / PO
master_hub: true
agent_slots:
  - role: tl
    slot_label: "TL - cutover stale-doc backfill owner"
  - role: docs
    slot_label: "Docs - ADR-001 and cutover strategy alignment reviewer"
generates:
  - artifact_path: docs/plans/PLAN-M-01-cutover-backfill.md
    artifact_type: markdown_doc
roadmap:
  layer: cutover
  gates:
    - id: G-CUTOVER.A
      name: stale strategy evidence
      exit_criteria: "ADR-001 and A-130 evidence identify the legacy-source cutover strategy as stale and requiring backfill before execution."
    - id: G-CUTOVER.B
      name: cutover route ready
      exit_criteria: "The stale strategy is routed to a concrete backfill roadmap and the cutover program band is covered in roadmap rollup."
  spans:
    - plan_id: PLAN-M-01-cutover-backfill
      after_gate: entry
      before_gate: G-CUTOVER.A
    - plan_id: PLAN-M-00-verify-cutover
      after_gate: G-CUTOVER.A
      before_gate: G-CUTOVER.B
dependencies:
  parent: PLAN-M-00-verify-cutover
  requires:
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
    - docs/migration/helix-source-inventory.md
    - docs/plans/PLAN-L7-44-harness-db-master.md
  references:
    - .ut-tdd/audit/A-130-harness-db-segment-accept.md
    - docs/migration/helix-to-ut-tdd-cutover-strategy.md
review_evidence:
  - reviewer: codex-intra-runtime-review
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-11"
    tests_green_at: "2026-06-11"
    verdict: pass
    scope: "Cutover backfill completion: stale legacy-source cutover strategy is rewritten to ADR-001 current truth and harness.db roadmap/review evidence projections are implemented. No production cutover, credential, infrastructure, or destructive state operation is authorized."
    worker_model: codex-gpt-5
    reviewer_model: codex-gpt-5-intra-runtime-review
---

# PLAN-M-01: legacy-source isolation backfill roadmap

## 0. Position

This plan is the cutover band host for the program roadmap registry. It converts the A-130 carry into a concrete route:

- ADR-001 says source concepts may be referenced, but executable behavior is rebuilt in TypeScript/Bun under UT-TDD-owned paths.
- The previous cutover strategy can no longer be treated as executable truth without backfill.
- harness.db L7 close makes cutover visible, but it does not authorize production or destructive migration.

## 1. Scope

In scope:

- Register cutover as a covered program band.
- Rewrite the stale strategy document into UT-TDD-owned truth aligned to ADR-001.
- Project roadmap rollup and review evidence metadata into `harness.db`.

Out of scope:

- Running production cutover.
- Modifying vendor snapshot files.
- Changing credentials, infrastructure, repository protection, or external service configuration.

## 3. 工程表

### Step 1: [直列] stale strategy evidence capture

Serial reason: downstream_dependency.

Use ADR-001, A-130, and the migration inventory to define the stale condition: legacy runtime paths, Python code-port assumptions, or old source command routes must not remain as executable UT-TDD guidance.

### Step 2: [直列] cutover roadmap registration

Serial reason: downstream_dependency.

Register `roadmap.layer: cutover` so `PROGRAM_BANDS.cutover` is covered by a concrete roadmap instead of parked carry text.

### Step 3: [直列] verification

Serial reason: downstream_dependency.

Run roadmap and doctor checks to prove the cutover band is covered and no frontier remains from parked cutover work.

### Step 4: [直列] review

Serial reason: shared_state.

Record review evidence. The review scope is intentionally limited to backfill registration and must not be read as approval to perform production cutover.

## 3.1 実装計画

- The backfill route is a documentation and roadmap registration change.
- `docs/migration/helix-to-ut-tdd-cutover-strategy.md` is now backfilled to current UT-TDD-owned execution/state rules.
- `harness.db` projection now includes roadmap rollups, band coverage, gate progress, and review evidence registry rows.
- Rollback is non-destructive: revert the document/projection commit and rebuild `.ut-tdd/harness.db` from sources.

## 4. DoD

- [x] `roadmap.layer: cutover` exists in a confirmed PLAN.
- [x] Cutover no longer depends only on `.ut-tdd/audit/A-130...` carry text.
- [x] Production-impacting cutover execution remains out of scope and requires human approval.
- [x] Cutover strategy doc is backfilled to ADR-001 current truth.
- [x] `harness.db` rebuild projects roadmap and review evidence feedback rows.
