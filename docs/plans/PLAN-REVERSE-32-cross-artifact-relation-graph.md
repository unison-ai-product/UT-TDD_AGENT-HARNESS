---
plan_id: PLAN-REVERSE-32-cross-artifact-relation-graph
title: "PLAN-REVERSE-32 (reverse): cross-artifact relation graph fullback"
kind: reverse
layer: cross
drive: fullstack
status: draft
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
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

R3 and R4 remain pending until implementation evidence exists. No governance document may claim relation graph completion before this Reverse closes.

## §8 DoD

- [ ] L7 implementation evidence exists.
- [ ] New lower-layer discoveries are classified with `backprop_decision`.
- [ ] Requirements / physical-data / ADR / backlog are updated if implementation changes their meaning.
- [ ] Recovery-03 does not recur in this implementation path.
