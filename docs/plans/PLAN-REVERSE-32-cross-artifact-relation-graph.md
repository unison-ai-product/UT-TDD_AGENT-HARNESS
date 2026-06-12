---
plan_id: PLAN-REVERSE-32-cross-artifact-relation-graph
title: "PLAN-REVERSE-32 (reverse): cross-artifact relation graph fullback"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: fullback
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-11
owner: Codex TL / PO
forward_routing: L5
promotion_strategy: reuse-as-is
agent_slots:
  - role: tl
    slot_label: "TL - relation graph fullback"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-32-cross-artifact-relation-graph.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-32-cross-artifact-relation-graph.md
  requires:
    - docs/plans/PLAN-L6-31-cross-artifact-relation-graph.md
    - docs/plans/PLAN-L7-32-cross-artifact-relation-graph.md
    - docs/plans/PLAN-L7-36-relation-graph-export.md
---

# PLAN-REVERSE-32 (reverse): cross-artifact relation graph fullback

## §0 Position

Reverse pairing for the future A-124 / A-125 relation graph implementation. This PLAN is draft until L6/L7 implementation actually lands.

## §1 R0 Evidence

Expected evidence after L7:

- relation graph pure functions and tests;
- CLI smoke output for impact / export / evidence projection;
- DB projection row contracts for graph and verification profiles;
- any newly discovered requirements or workflow rules.

## §2 R1 Observed Gap

Expected gaps to extract:

- whether changed-file impact needs a new FR / AC;
- whether diagram export adds a new acceptance artifact;
- whether DB collector/rebuild requires additional migration or doctor rules.

## §3 R2 Alignment

Forward implementation must align with:

- requirements §6.8.8 / §6.8.9 / §6.8.10;
- physical-data §9.5 / §9.6;
- ADR-002 A-124 / A-125;
- IMP-118..125.

## §4 R3 / R4

2026-06-11 L7 implementation evidence exists for the split relation graph span:

- PLAN-L7-32: U-RELGRAPH-001..006 green for relation graph collection and impact expansion.
- PLAN-L7-36: U-RELGRAPH-007..010 green for deterministic Mermaid export, unavailable DOT/D2 adapter findings, and A-125 verification evidence projection.
- Backprop decision: no lower-layer requirements / physical-data / ADR meaning change was discovered; DB write path and external adapter execution remain out of scope for this L7 span.
- Recovery-03 recurrence check: implementation stayed under authorized PLAN files and source/test owners; `vendor/helix-source/` was not edited.

R4 fullback outcome: Forward L7 relation graph implementation has merged back to this Reverse plan with no additional governance/backlog additions required.

## §8 DoD

- [x] L7 implementation evidence exists.
- [x] New lower-layer discoveries are classified with `backprop_decision`.
- [x] Requirements / physical-data / ADR / backlog are unchanged because implementation did not change their meaning.
- [x] Recovery-03 does not recur in this implementation path.
