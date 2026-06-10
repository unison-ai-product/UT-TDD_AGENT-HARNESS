---
artifact_type: research_memo
status: confirmed
created: 2026-06-09
updated: 2026-06-09
related_audit: .ut-tdd/audit/A-124-cross-artifact-graph-tooling.md
related_requirements: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md#689-cross-artifact-relation-graph--visualization--tool-adapters-a-124-2026-06-09
---

# Cross-Artifact Graph / Diagram Tooling Research Memo

## Scope

This memo records the Web research basis for A-124. It is a research artifact, not an implementation source of truth. The authoritative scope remains requirements §6.8.9, ADR-002 A-124, physical-data §9.5, and the L6/L7 relation-graph PLANs.

Research question:

- Which installable developer tools can help build or validate dependency graphs, dead-code/dead-node signals, and diagram exports?
- Which tools should be modeled as optional adapters rather than core sources of truth?
- What outputs should be normalized into `harness.db` projection rows?

## Source Check

Checked on 2026-06-09.

| Source | URL | Relevant finding | UT-TDD decision |
|---|---|---|---|
| dependency-cruiser | https://github.com/sverweij/dependency-cruiser | Official project describes validation and visualization of JS/TS dependencies with custom rules, build reports, and graph outputs including DOT examples piped to Graphviz. | Preferred optional adapter for import/dependency rules, circular dependencies, forbidden dependencies, missing package dependencies, orphan detection, and DOT graph evidence. |
| Knip docs | https://knip.dev/ | Knip finds unused dependencies, exports, and files in JavaScript/TypeScript projects and ships many framework/tool plugins. | Optional adapter for dead-node and unused-edge signals. Use as evidence/projection input, not as the core graph source. |
| Madge | https://github.com/pahen/madge | Madge generates visual module dependency graphs, finds circular dependencies, and can use Graphviz for visual graph output. | Optional lightweight adapter for circular dependency and graph visualization. Secondary to dependency-cruiser where rule policy is required. |
| Graphviz output formats | https://graphviz.org/docs/outputs/ | Graphviz supports output formats including DOT language, JSON, PDF, PNG, and SVG; `-T` selects the target format. | Optional renderer for large graph snapshots and CI artifacts. Gate on normalized `diagram_artifacts`, not renderer output alone. |
| GitHub Mermaid diagrams | https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams | GitHub renders Mermaid diagrams in Issues, Discussions, pull requests, wikis, and Markdown files using fenced `mermaid` blocks. | Preferred documentation diagram format for review/handover because it is readable in GitHub Markdown. |
| Mermaid project | https://github.com/mermaid-js/mermaid | Mermaid is a Markdown-inspired diagramming/charting tool for generating diagrams from text definitions. | Use Mermaid as the default graph export for small/medium relation and workflow views. |
| D2 documentation | https://d2lang.com/ and https://www.d2lang.com/tour/exports/ | D2 is a declarative text-to-diagram language; CLI exports include SVG, PNG, PDF, PPTX, GIF, ASCII, and stdout. | Optional renderer for cleaner architecture/review diagrams. Requires adapter readiness before use. |

## Selection Matrix

| Adapter | Trigger / use | Value | Default state | Hard requirements |
|---|---|---|---|---|
| `dependency-cruiser` | source import graph, dependency rules, forbidden import policy | Rule-bearing dependency validation plus DOT/graph evidence. | Optional, disabled until package declared. | Normalize rule violations to `findings`; store command/version/scope in `tool_runs`. |
| `knip` | unused dependency/export/file audit | Dead-node and unused-edge signals for relation graph cleanup. | Optional, disabled until package declared. | Treat false positives as findings needing review; no auto-delete by default. |
| `madge` | circular dependency quick check, graph image helper | Lightweight circular dependency and visual graph evidence. | Optional, disabled until package declared. | Do not make Madge the policy source where dependency-cruiser rules exist. |
| `graphviz-dot` | DOT to SVG/PDF/PNG rendering | Large graph rendering and CI artifact output. | Optional renderer. | Renderer availability is environment state; missing renderer returns finding. |
| `mermaid` | Markdown-native relation/workflow diagrams | Review/handover diagrams that render in GitHub Markdown. | Preferred default export for docs. | Deterministic node IDs/order; raw evidence payload excluded from diagram text. |
| `d2` | architecture/review diagram export | Higher-quality diagram rendering for design review. | Optional renderer. | Adapter readiness required; no implicit installation. |

## Workflow Integration

1. Core relation graph collector stays TypeScript/Bun and rebuildable from docs/source/tests/PLAN/state/logs.
2. Optional adapters run only when allow-listed by workflow/profile rules.
3. Raw adapter output is saved as bounded evidence.
4. Normalized rows are written later to `tool_runs`, `graph_nodes`, `dependency_edges`, `impact_results`, `graph_snapshots`, `diagram_artifacts`, and `findings`.
5. Gates consume normalized rows only.

## Safety / Quality Rules

- External tools are adapters, not authoring sources.
- Missing adapter availability is a finding and does not invalidate unrelated local checks.
- Mermaid is preferred for Markdown evidence because it renders in GitHub contexts.
- DOT/Graphviz and D2 are optional renderer profiles and must not install implicitly.
- Auto-fix/delete behavior from external tools is out of scope unless a future PLAN adds explicit human approval and rollback evidence.

## Residual Work

- Implement PLAN-L7-32 relation graph pure functions after TDD Red.
- Add optional adapter profile probes for dependency-cruiser, Knip, Madge, Graphviz, Mermaid, and D2.
- Add DB collector/rebuild for A-124 graph and diagram projection rows.
- Adapter probe route is PLAN-L6-33 / PLAN-L7-34 / PLAN-REVERSE-34.
