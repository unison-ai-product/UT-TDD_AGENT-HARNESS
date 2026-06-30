---
layer: L5
sub_doc: ui-detail
status: confirmed
parent_doc: docs/design/harness/L4-basic-design/ui-standard.md
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
related_l3_screen_functional: docs/design/harness/L3-functional/screen-functional.md
related_l4_ui_standard: docs/design/harness/L4-basic-design/ui-standard.md
related_l2_ui_element: docs/design/harness/L2-screen/ui-element.md
plan: docs/plans/PLAN-L5-09-ui-detail-body.md
next_pair_freeze: L8
created: 2026-06-30
updated: 2026-06-30
---

# L5 UI Detail Design

This document defines the frontend internal design for the central UT-TDD dashboard. It turns L3 screen-functional requirements and L4 UI standards into reusable UI modules, state boundaries, routing contracts, and integration points.

## 1. Architecture

| Module | Responsibility | Contract |
|---|---|---|
| `AppShell` | Global navigation, project selector, status strip, and content outlet. | Receives current route and project context; never mutates harness state. |
| `RouteRegistry` | Maps screen ids PM-01..GD-01 to route paths, labels, breadcrumbs, and loader keys. | One screen id has exactly one route definition. |
| `QueryState` | Encodes filters, selected layer, status, and detail id into URL query parameters. | URL is the durable UI state; local component state is transient only. |
| `DataProvider` | Reads prepared projections from local API/file-backed sources. | Returns typed result states: loading, ok, empty, stale, error. |
| `EvidenceLink` | Normalizes artifact, PLAN, gate, DB row, and command evidence links. | Always displays source path or stable id; no hidden evidence. |
| `CopyButton` | Copies CLI-ready text or prompts to clipboard. | Copy-only; no shell, provider, or file write execution. |
| `TableView` | Dense tabular projection display with sort/filter/detail expansion. | Keeps row height and states from L4 ui-standard. |
| `GraphView` | Trace, wiring, and dependency visualization. | Provides text fallback and source edge list. |
| `MarkdownViewer` | Renders design docs, ADRs, and guide pages. | Sanitized rendering; frontmatter and source path remain visible. |
| `TelemetryBadge` | Marks runtime, projected, advisory, stale, or unknown provenance. | Runtime claims require session/source evidence, not count presence alone. |

## 2. State Management

| State class | Owner | Persistence | Notes |
|---|---|---|---|
| Project selection | `AppShell` + URL | URL query | Required for shareable views. |
| Screen route | router | URL path | PM/HM/GD screen id maps to a route. |
| Filters and sort | `QueryState` | URL query | Must survive reload and copy-paste. |
| Expanded rows | screen component | in-memory | May reset on reload. |
| Data loading result | `DataProvider` | in-memory | Uses the five-state model: loading, ok, empty, stale, error. |
| Clipboard result | `CopyButton` | in-memory | Shows success/failure only; does not persist. |

No UI state may be the source of truth for harness workflow state. The UI mirrors repository artifacts, local DB projections, and command output.

## 3. Routing

Routes are stable and screen-id aligned:

| Category | Route pattern | Screens |
|---|---|---|
| Project management | `/project/:projectId/pm/:screenId` | PM-01..PM-06 |
| Harness management | `/project/:projectId/hm/:screenId` | HM-01..HM-08 |
| Guide/docs | `/project/:projectId/gd/:screenId` | GD-01 |

Deep links must preserve `layer`, `plan`, `artifact`, `gate`, `table`, `session`, and `status` query parameters where applicable.

## 4. Data Flow

1. Route and query parameters are parsed by `RouteRegistry` and `QueryState`.
2. The screen adapter requests one typed view model from `DataProvider`.
3. `DataProvider` reads local projections or prepared command output and labels provenance.
4. The screen renders L4-compliant components.
5. User interactions update URL state, expand details, navigate, refresh, or copy text.

The UI must not bypass CLI/domain rules. If a command is needed, the UI emits text for `ut-tdd` or provider CLI execution outside the browser.

## 5. Screen Adapter Pattern

Each screen has one adapter:

```ts
type ScreenAdapter<TQuery, TViewModel> = {
  screenId: string;
  parseQuery(input: URLSearchParams): TQuery;
  load(input: { projectId: string; query: TQuery }): Promise<ViewState<TViewModel>>;
  render(input: ViewState<TViewModel>): JSX.Element;
};
```

Adapter rules:

- `parseQuery` is deterministic and side-effect free.
- `load` may read only through the configured `DataProvider`.
- `render` may not trigger shell, provider, or file-write actions.
- every adapter exposes at least one evidence source when data is non-empty.

## 6. Integration Boundaries

| Boundary | Allowed | Forbidden |
|---|---|---|
| Local DB projection | read table metadata, row summaries, provenance fields | schema mutation, ad hoc SQL writes |
| Repository artifacts | read Markdown/YAML/Mermaid source | edit, format, or create artifacts |
| CLI commands | render copyable command text | execute command from UI |
| AI provider state | show captured telemetry and handoff text | invoke Claude/Codex providers directly |
| Browser storage | transient UI preferences only | source-of-truth workflow state |

## 7. Accessibility and Density

L4 `ui-standard` tokens are binding:

- keyboard navigation for tabs, tables, accordions, and copy controls
- focus-visible styling with WCAG 2.2 AA contrast
- non-color status indicators through icon and text label
- dense table layout for repeated operator use
- text fallback for diagrams and graph nodes

## 8. L8 Integration Test Targets

The L8 pair must verify integration between router, query state, data provider, and component rendering:

- route id maps to the correct screen adapter
- URL state round-trips through reload/share
- data states render consistently across empty/stale/error/loading
- copy controls produce text and do not execute commands
- provenance badges distinguish runtime capture from projection/advisory rows
- document viewer renders Markdown/frontmatter/source path without losing evidence links
