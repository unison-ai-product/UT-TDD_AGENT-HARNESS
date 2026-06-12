---
plan_id: PLAN-REVERSE-33-mcp-profile-config-safety
title: "PLAN-REVERSE-33 (reverse): MCP profile config and safety fullback"
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

2026-06-11 L7 implementation evidence exists for MCP profile config and safety:

- PLAN-L7-33: U-MCPPROFILE-001..012 green for complete profile catalog, Docker MCP Toolkit optional metadata, generated local config rendering, safety findings, and external activation planning.
- Backprop decision: no lower-layer requirements / physical-data / ADR meaning change was discovered; generated local config remains a suggestion under `.ut-tdd/local/`, and external execution/profile enablement remains out of scope.
- Safety boundary: no package installation, MCP server execution, `.vscode/mcp.json` write, committed secret, or user home/global mount is introduced.

R4 fullback outcome: Forward L7 MCP profile safety implementation has merged back to this Reverse plan with no additional governance/backlog additions required.

## §8 DoD

- [x] L7 implementation evidence exists.
- [x] New lower-layer discoveries are classified with `backprop_decision`.
- [x] Requirements / physical-data / ADR / backlog are unchanged because implementation did not change their meaning.
- [x] No generated local config or external profile execution bypasses explicit approval gates.
