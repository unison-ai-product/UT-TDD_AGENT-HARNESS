---
plan_id: PLAN-REVERSE-33-mcp-profile-config-safety
title: "PLAN-REVERSE-33 (reverse): MCP profile config and safety fullback"
kind: reverse
layer: cross
drive: fullstack
status: draft
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
agent_slots:
  - role: tl
    slot_label: "TL - MCP profile safety fullback"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-33-mcp-profile-config-safety.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-33-mcp-profile-config-safety.md
  requires:
    - docs/plans/PLAN-L6-32-mcp-profile-config-safety.md
    - docs/plans/PLAN-L7-33-mcp-profile-config-safety.md
---

# PLAN-REVERSE-33 (reverse): MCP profile config and safety fullback

## §0 Position

Reverse pairing for the future PLAN-L7-33 implementation. This PLAN remains draft until source implementation exists.

## §1 R0 Evidence

Expected evidence after L7:

- Docker MCP Toolkit profile metadata and readiness checks;
- generated MCP config dry-run output;
- safety findings for source trust, package integrity, read-only toolsets, workspace mounts, Docker controls, and credential non-persistence;
- CLI smoke and evidence records if a dry-run command is added.

## §2 R1 Observed Gap

Expected gaps to classify:

- whether requirements §6.8.10 needs a stricter generated-config command surface;
- whether physical-data §9.6 needs new projection columns for profile trust and safety findings;
- whether ADR-002 A-125 needs to distinguish Docker MCP Toolkit profile isolation from generic MCP profiles.

## §3 R2 Alignment

Forward implementation must align with:

- requirements §6.8.10;
- physical-data §9.6;
- ADR-002 A-125;
- A-125 research memo;
- IMP-121..124 and IMP-125 recovery guard.

## §4 R3 / R4

R3 and R4 remain pending until implementation evidence exists. No governance document may claim generated MCP config or profile safety lint complete before this Reverse closes.

## §8 DoD

- [ ] L7 implementation evidence exists.
- [ ] New lower-layer discoveries are classified with `backprop_decision`.
- [ ] Requirements / physical-data / ADR / backlog are updated if implementation changes their meaning.
- [ ] No generated local config or external profile execution bypasses explicit approval gates.
