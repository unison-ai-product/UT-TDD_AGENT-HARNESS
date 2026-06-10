# A-124 Cross-Artifact Graph / Diagram / Tooling Hardening

Date: 2026-06-09
Context: User asked whether cross-cutting dependency detection, diagramming, and development tool/plugin support can be strengthened.

## Current State

Implemented today:

- `module-drift`: detects `src/` module set vs L4 architecture listing.
- `asset-drift`: detects internal agent/skill/prompt asset drift.
- `change-impact`: coarse check that `src` changes include some design and test/test-design update.
- PLAN dependencies and V-model pair/trace checks.

Not yet implemented:

- Cross-artifact relation graph.
- Import graph reverse dependency impact.
- Doc/PLAN/FR reference graph impact.
- DB projection dependency impact.
- Diagram export from graph snapshots.
- Tool adapter normalization for dependency-cruiser / Knip / Madge / Graphviz / Mermaid / D2.

Doctor evidence still reports this as future work:

```text
doctor: scaffold stub (relation-graph / dependency-drift / regression expansion は後続 PLAN)
```

## External Tool Research

Detailed source URLs and selection matrix are recorded in `docs/research/cross-artifact-graph-tooling-research-2026-06-09.md`. This audit keeps only the routing summary.

Primary/official sources checked:

- dependency-cruiser: validates and visualizes JavaScript/TypeScript dependencies with configurable rules and DOT output.
- Knip: detects unused dependencies, exports, and files in JavaScript/TypeScript projects.
- Madge: generates dependency graphs and detects circular dependencies.
- Graphviz: renders DOT graphs to SVG and other output formats.
- GitHub/Mermaid: Mermaid diagrams render in GitHub Markdown contexts.
- D2: text-to-diagram language with CLI export to SVG/PNG/PDF.

## Decision

The core collector stays TypeScript/Bun and writes normalized projection rows to `harness.db`.

External tools are optional adapters:

1. Run the tool.
2. Store raw output as evidence.
3. Normalize to `graph_nodes`, `dependency_edges`, `tool_runs`, `findings`, `graph_snapshots`, and `diagram_artifacts`.
4. Gate only on normalized rows, not on tool-specific output.

## Changes

- Added requirements §6.8.9 for cross-artifact relation graph, visualization, and tool adapters.
- Added `docs/research/cross-artifact-graph-tooling-research-2026-06-09.md` as the Web research evidence memo.
- Added physical-data §9.5 DB projection tables and invariants.
- Added ADR-002 A-124 addendum.
- Added IMP-118 / IMP-119 / IMP-120.
- Back-propagated A-124 to L1/L3 functional requirements as an existing FR bundle extension.

## Back-Propagation Decision

`backprop_decision`: `requires_requirement_backprop`

Reason: The request changes what the harness must be able to detect and automate, not just how a lower-layer implementation is arranged. It extends the existing FR bundles around V-model state, trace, feedback, learning, DB projection, internal asset drift, coding/DDD rules, and automation.

## Residual Work

Future implementation should create L6/L7 PLANs for:

- `ut-tdd graph impact --changed <path>`
- `ut-tdd graph export --format mermaid|dot|d2`
- DB collector/rebuild for graph projections
- optional tool adapter probes and normalized `tool_runs`

Current routing:

- Relation graph core: PLAN-L6-31 / PLAN-L7-32 / PLAN-REVERSE-32.
- MCP/external verification profile safety: PLAN-L6-32 / PLAN-L7-33 / PLAN-REVERSE-33.
- Optional graph/diagram tool adapter probes: PLAN-L6-33 / PLAN-L7-34 / PLAN-REVERSE-34.
