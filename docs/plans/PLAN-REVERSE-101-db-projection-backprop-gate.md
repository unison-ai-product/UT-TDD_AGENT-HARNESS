---
plan_id: PLAN-REVERSE-101-db-projection-backprop-gate
title: "PLAN-REVERSE-101: DB projection backprop gate fullback"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: fullback
drive: db
status: confirmed
created: 2026-06-22
updated: 2026-06-22
owner: Codex
forward_routing: L5
promotion_strategy: reuse-as-is
backprop_scope:
  - layer: requirements
    decision: updated
    evidence_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    reason: "Requirements define the DB projection backprop gate."
  - layer: L4-basic-design
    decision: not_impacted
    reason: "The governance gate does not change external runtime function design."
  - layer: L5-detailed-design
    decision: not_impacted
    reason: "The governance gate does not change detailed runtime data or module design."
agent_slots:
  - role: tl
    slot_label: "TL - regression gate fullback review"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-101-db-projection-backprop-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L7-101-db-projection-backprop-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-101-db-projection-backprop-gate.md
  requires:
    - docs/plans/PLAN-L7-101-db-projection-backprop-gate.md
---

# PLAN-REVERSE-101: DB projection backprop gate fullback

## R0 Evidence

The artifact progress color slice first landed as L7 implementation and only afterward received
requirements, basic design, detailed design, and L6 coverage. The recovered design state is now
captured by PLAN-L7-56 and PLAN-REVERSE-56, but the prevention mechanism must also be represented
as a Reverse/fullback outcome.

## R1 Observed Gap

The missing gate was not a source-code bug. It was a governance blind spot:

- `descent-obligation` catches missing downstream coverage only after an upstream FR exists.
- `plan-governance` did not classify user-visible progress color DB projections as requiring
  upstream backprop evidence.
- A PLAN could therefore touch `harness-db.ts` / `projection-writer.ts` and define
  `artifact_progress` color semantics without carrying requirements and design artifacts.

## R2 Alignment

The fix remains in plan governance rather than in the projection writer. The source artifact,
relation graph, and DB projection behavior are unchanged; only PLAN admissibility changes for
future progress color projection work.

## R3 / R4 Outcome

`plan-governance` now emits `db_projection_backprop_missing` for L7 DB implementation plans that
touch the DB schema/projection writer and introduce progress color semantics without:

- a generated or required `PLAN-REVERSE-*`;
- requirements;
- L1 functional and screen requirements;
- L3 functional carry;
- L4 function design;
- L5 physical-data semantics;
- L6 function spec and FR/unit coverage.

The follow-up R4 gate added on 2026-06-22 also requires fullback Reverse PLANs to name their
actual design/governance/test-design backprop target in `generates`, preventing a PLAN from
claiming fullback while only generating its own markdown record.

## DoD

- [x] Root cause is documented.
- [x] Regression fixture without backprop fails closed.
- [x] Fixture with Reverse and L1-L6 coverage passes.
- [x] PLAN-L7-101 records the implementation and test artifacts.
