---
plan_id: PLAN-REVERSE-35-canonical-document-export
title: "PLAN-REVERSE-35 (reverse): canonical document export fullback"
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
    slot_label: "TL - canonical document export fullback"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-35-canonical-document-export.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-35-canonical-document-export.md
  requires:
    - docs/plans/PLAN-L6-34-canonical-document-export.md
    - docs/plans/PLAN-L7-35-canonical-document-export.md
---

# PLAN-REVERSE-35 (reverse): canonical document export fullback

## §0 Position

Reverse pairing for the future PLAN-L7-35 implementation. This PLAN remains draft until source implementation exists.

## §1 R0 Evidence

Expected evidence after L7:

- parser output for concept, requirements, detailed design, PLAN, ADR, and test-design fixtures;
- CSV/Markdown built-in render evidence;
- optional XLSX/PPTX/D2 renderer readiness findings;
- source snapshot hash and generated artifact metadata;
- CLI smoke output if an export command is added.

## §2 R1 Observed Gap

Expected gaps to classify:

- whether requirements §6.8.11 needs additional document families;
- whether physical-data §9.7 needs more projection columns;
- whether ADR-002 A-126 needs to distinguish document import from document export;
- whether workflow docs need stricter rules for stale generated Office files.

## §3 R2 Alignment

Forward implementation must align with:

- requirements §6.8.11;
- physical-data §9.7;
- ADR-002 A-126;
- A-126 research memo;
- IMP-126.

## §4 R3 / R4

2026-06-11 L7 implementation evidence exists for canonical document export:

- PLAN-L7-35: U-DOCEXPORT-001..012 green for canonical document parsing, deterministic datasets, built-in CSV/Markdown rendering, optional renderer readiness findings, normalized projection rows, derived-artifact boundary, and stale source snapshot detection.
- Backprop decision: no lower-layer requirements / physical-data / ADR meaning change was discovered; generated Office/spreadsheet/deck outputs remain derived artifacts.
- Safety boundary: no package installation, external Office renderer invocation, canonical doc mutation, or generated artifact gate truth is introduced.

R4 fullback outcome: Forward L7 canonical document export implementation has merged back to this Reverse plan with no additional governance/backlog additions required.

## §8 DoD

- [x] L7 implementation evidence exists.
- [x] New lower-layer discoveries are classified with `backprop_decision`.
- [x] Requirements / physical-data / ADR / backlog are unchanged because implementation did not change their meaning.
- [x] Generated Office/spreadsheet files remain derived artifacts and do not replace canonical docs.
