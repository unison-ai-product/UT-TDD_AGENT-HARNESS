---
plan_id: PLAN-M-00-verify-cutover
title: "PLAN-VERIFY-CUTOVER-00: L8-L14 verification band + HELIX to UT cutover backfill"
kind: design
layer: L14
drive: fullstack
status: confirmed
created: 2026-06-11
updated: 2026-06-11
owner: Codex TL / PO
master_hub: true
agent_slots:
  - role: tl
    slot_label: "TL - verification/cutover roadmap descent owner"
  - role: qa
    slot_label: "QA - L8-L14 verification band acceptance reviewer"
generates:
  - artifact_path: docs/plans/PLAN-M-00-verify-cutover.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-M-01-cutover-backfill.md
    artifact_type: markdown_doc
roadmap:
  layer: L14
  gates:
    - id: G-VERIFY.A
      name: L8-L14 verification roadmap registration
      exit_criteria: "L8-L14 verification band is represented by a confirmed master roadmap; the roadmap registry covers the verification program band without relying on parked status."
    - id: G-VERIFY.B
      name: verification to cutover bridge
      exit_criteria: "HELIX to UT cutover backfill is represented by a registered cutover roadmap and program rollup can surface 5/5 covered bands."
  spans:
    - plan_id: PLAN-M-00-verify-cutover
      after_gate: entry
      before_gate: G-VERIFY.A
    - plan_id: PLAN-M-01-cutover-backfill
      after_gate: G-VERIFY.A
      before_gate: G-VERIFY.B
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-REVERSE-44-roadmap-definition-design.md
    - docs/plans/PLAN-L7-44-harness-db-master.md
  references:
    - docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
    - .ut-tdd/audit/A-130-harness-db-segment-accept.md
    - .ut-tdd/audit/A-131-recovery-04-closure-accept.md
review_evidence:
  - reviewer: codex-intra-runtime-review
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-11"
    tests_green_at: "2026-06-11"
    verdict: pass
    scope: "PLAN-VERIFY-CUTOVER-00 completion: verification band roadmap registration, cutover backfill route registration, roadmap rollup 5/5 coverage, and stale handover replacement. Cross-agent review unavailable in current Codex-only execution; intra-runtime review used as documented fallback."
    worker_model: codex-gpt-5
    reviewer_model: codex-gpt-5-intra-runtime-review
---

# PLAN-VERIFY-CUTOVER-00: L8-L14 verification band + HELIX to UT cutover backfill

## 0. Position

This plan closes the two bands that were intentionally parked by PLAN-REVERSE-44:

- verification: L8-L14 right-arm verification work was parked because no Forward roadmap existed.
- cutover: HELIX to UT cutover was parked because the strategy document is stale after ADR-001 and harness.db close.

Completion here means the bands are no longer invisible parked work. It does not mean production deploy, PO final acceptance for L8-L14, or a destructive cutover. Those require later execution gates.

## 1. Completion Contract

- `PROGRAM_BANDS.verification` is covered by this master roadmap (`roadmap.layer: L14`).
- `PROGRAM_BANDS.cutover` is covered by `PLAN-M-01-cutover-backfill` (`roadmap.layer: cutover`).
- `roadmap-rollup` can report all five program bands as covered and no parked or uncovered band remains.
- The cutover stale-doc problem is routed to a concrete backfill artifact instead of staying only as an audit carry.
- Handover points at the next executable action after this close, not the already-closed L6 frontier.

## 3. 蟾･遞玖｡ｨ

### Step 1: [逶ｴ蛻余] verification band roadmap registration

Serial reason: downstream_dependency.

Register this plan as the L8-L14 verification band host. The band represents right-arm verification execution planning across integration, system, UX, UAT, deployment acceptance, post-deploy verification, and operational feedback.

### Step 2: [逶ｴ蛻余] cutover backfill route registration

Serial reason: downstream_dependency.

Create the paired cutover roadmap (`PLAN-M-01-cutover-backfill`) and make this master depend on it through the second verification gate. The route turns the stale cutover strategy doc from a free-form carry into a registered roadmap item.

### Step 3: [逶ｴ蛻余] machine verification

Serial reason: downstream_dependency.

Run roadmap, doctor, and review-evidence checks. Required evidence:

- `tests/roadmap.test.ts` proves the real repository rollup has verification and cutover covered.
- `bun run src/cli.ts doctor` surfaces `roadmap-rollup` with no frontier.
- `review-evidence` remains OK for confirmed design plans.

### Step 4: [逶ｴ蛻余] review and handover

Serial reason: shared_state.

Record intra-runtime review evidence and update `.ut-tdd/handover/CURRENT.json` so the next action points beyond this plan.

## 3.1 螳溯｣・ｨ育判

- No new TypeScript feature behavior is required beyond test coverage for the existing roadmap registry.
- The implementation uses current `roadmap.layer` string matching; no schema migration is required because `roadmap.layer` already accepts arbitrary strings and `PROGRAM_BANDS.cutover.layers` contains `cutover`.
- `PARKED_BANDS` may remain as historical defer reasons. Covered bands take precedence over parked classification, so a registered verification/cutover roadmap results in `parkedBands=0`.
- Rollback is document-only: remove these two PLAN files and the added test if the registration is judged premature.

## 4. DoD

- [x] L8-L14 verification band has a confirmed roadmap host.
- [x] HELIX to UT cutover has a confirmed backfill roadmap host.
- [x] Program rollup can prove 5/5 covered bands with no parked or uncovered band.
- [x] Stale handover next action is replaced.
- [x] No vendor or HELIX runtime source is edited.
