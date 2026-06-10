---
plan_id: PLAN-REVERSE-34-tool-adapter-probes
title: "PLAN-REVERSE-34 (reverse): graph and diagram tool adapter probes fullback"
kind: reverse
layer: cross
drive: fullstack
status: draft
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
agent_slots:
  - role: tl
    slot_label: "TL - tool adapter probe fullback"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-34-tool-adapter-probes.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-34-tool-adapter-probes.md
  requires:
    - docs/plans/PLAN-L6-33-tool-adapter-probes.md
    - docs/plans/PLAN-L7-34-tool-adapter-probes.md
---

# PLAN-REVERSE-34 (reverse): graph and diagram tool adapter probes fullback

## §0 Position

Reverse pairing for future PLAN-L7-34 implementation. This PLAN remains draft until source implementation exists.

## §1 Evidence

Expected evidence after L7 includes adapter catalog rows, package/executable readiness findings, normalized tool run rows, diagram stale detection, and CLI smoke if a command is added.

## §2 Alignment

Implementation must align with requirements §6.8.9, physical-data §9.5, ADR-002 A-124, A-124 research memo, and IMP-120.

## §8 DoD

- [ ] L7 implementation evidence exists.
- [ ] No adapter output is treated as gate truth before normalization.
- [ ] Missing external tooling remains a finding, not an implicit install.
