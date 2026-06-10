---
plan_id: PLAN-L6-33-tool-adapter-probes
title: "PLAN-L6-33 (add-design): graph and diagram tool adapter probes"
kind: add-design
layer: L6
drive: fullstack
status: draft
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
agent_slots:
  - role: tl
    slot_label: "TL - tool adapter probe design"
generates:
  - artifact_path: docs/design/harness/L6-function-design/module-drift.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-31-cross-artifact-relation-graph.md
  requires:
    - .ut-tdd/audit/A-124-cross-artifact-graph-tooling.md
    - docs/research/cross-artifact-graph-tooling-research-2026-06-09.md
---

# PLAN-L6-33 (add-design): graph and diagram tool adapter probes

## §0 Position

This PLAN is the L6 entry for optional dependency/diagram tool adapter probes. It does not replace the core TypeScript/Bun relation graph collector.

## §1 Scope

Design function contracts for dependency-cruiser, Knip, Madge, Graphviz DOT, Mermaid, and D2 adapter catalog/probe/normalization/stale diagram refresh planning.

## §2 Contracts

The function contracts are documented in `module-drift.md` "Tool Adapter Probe Addendum":

- `catalogToolAdapters`
- `probeToolAdapter`
- `normalizeToolAdapterRun`
- `planDiagramRefresh`

## §3 Test Design

The L7 pair artifact adds U-TOOLADAPTER-001..010.

## §5 Guard

No package installation, source implementation, or external command execution is authorized by this PLAN alone. L7 requires PLAN-L7-34 TDD Red and PLAN-REVERSE-34.
