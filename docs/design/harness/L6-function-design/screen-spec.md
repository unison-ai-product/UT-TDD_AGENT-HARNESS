---
layer: L6
sub_doc: screen-spec
status: confirmed
parent_doc: docs/design/harness/L5-detailed-design/ui-detail.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l3_screen_functional: docs/design/harness/L3-functional/screen-functional.md
related_l5_ui_detail: docs/design/harness/L5-detailed-design/ui-detail.md
related_l4_ui_standard: docs/design/harness/L4-basic-design/ui-standard.md
plan: docs/plans/PLAN-L6-36-screen-spec-body.md
next_pair_freeze: L7
created: 2026-06-30
updated: 2026-06-30
---

# L6 Screen Function Specifications

This document defines per-screen function-level UI behavior for the central UT-TDD dashboard. It is the L6 pair for L7 unit tests and must stay below L5 architecture while remaining above implementation code.

## 1. Common Function Contract

L6 contract marker: screen specs expose deterministic signatures, DbC pre/post conditions, and U-SCREEN oracle families for L7.

```ts
type ScreenFunctionSpec<TQuery, TViewModel> = {
  screenId: string;
  parseQuery(input: URLSearchParams): TQuery;
  validateQuery(input: TQuery): ValidationResult;
  loadViewModel(input: { projectId: string; query: TQuery }): Promise<ViewState<TViewModel>>;
  handleEvent(event: ScreenEvent, state: TViewModel): ScreenEventResult;
};
```

Contract signatures:

| Signature | Contract |
|---|---|
| `parseScreenQuery(input) => ScreenQuery` | parse URL parameters into typed query state. |
| `validateScreenQuery(query) => ValidationResult` | reject or normalize invalid query values. |
| `loadScreenViewModel(projectId, query) => ViewState` | read projection data and produce one L4 state. |
| `handleScreenEvent(event, state) => ScreenEventResult` | return navigation/filter/expand/refresh/copy-only output. |

Preconditions:

- `projectId` is present for PM/HM/GD project-scoped routes.
- `screenId` matches one of the 15 registered screens.
- query parameters use documented enum values or are normalized to defaults.

Postconditions:

- returned view state is one of loading, ok, empty, stale, or error
- events return navigation, filter update, expansion, refresh request, or clipboard text
- no event executes shell, provider, workflow mutation, file write, or gate approval

Invariants:

- DbC invariant: URL query state is the only durable UI state.
- DbC invariant: runtime telemetry claims require runtime provenance fields.
- DbC invariant: command-producing events return clipboard text only.

## 2. Common Events

| Event | Input | Output | Validation |
|---|---|---|---|
| `selectProject` | project id | route update | project id is non-empty |
| `selectLayer` | L0-L14 | query update | layer is known |
| `setFilter` | key/value | query update | key belongs to screen adapter |
| `sortTable` | column/direction | query update | column exists in current table |
| `openDetail` | stable row/node id | local expansion or route update | id exists in current view model |
| `copyCommand` | command template id | clipboard text result | template is render-only |
| `refreshProjection` | none | reload request | no direct DB mutation |

## 3. Per-Screen Specs

| Screen | Function | Inputs | Events | Validation and output |
|---|---|---|---|---|
| PM-01 | `renderProjectPortfolioDashboard` | projects, layer summaries, gate summaries, carry counts | select project, filter status, open layer | Reject unknown layer/status filters; output portfolio heatmap and next-action rows. |
| PM-02 | `renderProcessView` | project id, layer, phase, plan list, sub-doc list | select layer, open PLAN, open sub-doc | Normalize missing layer to current active layer; output process detail and stale markers. |
| PM-03 | `renderGateSummaryView` | project id, gate run list, evidence paths | filter gate, open evidence, copy remediation | Unknown gate id produces empty state; output gate result cards and remediation text. |
| PM-04 | `renderTraceView` | trace nodes, trace edges, selected artifact | select node, filter missing edges, open artifact | Missing selected node becomes graph-level view; output trace graph and edge table. |
| PM-05 | `renderHandoverView` | CURRENT handover, archive list, carry list | open carry, copy next-action, filter stale | Missing CURRENT produces empty state with archive fallback; output current handover summary. |
| PM-06 | `renderDesignDocumentViewer` | document path, markdown source, frontmatter, diagram blocks | select document, copy path, open source | Path must resolve inside approved docs roots; output rendered doc plus source/frontmatter. |
| HM-01 | `renderFeatureInventoryView` | FR registry, implementation status, PLAN links | filter FR, open evidence, sort table | Unknown FR filter is ignored; output dense FR table and evidence links. |
| HM-02 | `renderCoverageHeatmapView` | coverage metrics, weak-point dimensions | select cell, filter dimension | Cell id must exist; output heatmap plus source metric details. |
| HM-03 | `renderRuntimeWiringView` | provider config, hooks, adapter graph, runtime errors | select node, copy diagnostic command | Unknown node clears selection; output wiring graph and diagnostic evidence. |
| HM-04 | `renderDatabaseBrowserView` | table metadata, row counts, indexes, projection provenance | select table, filter rows, sort columns | Table name must be known; output schema, count, and provenance sample. |
| HM-05 | `renderAuditLogView` | hook events, model runs, review evidence, guard events | filter session, filter plan, open event | Session/plan filters are optional; output event stream with provenance badges. |
| HM-06 | `renderRecoveryView` | forced stops, rollback/update guidance, resume checkpoints | select incident, copy recovery command | Incident id must be known for detail view; output copy-only recovery command text. |
| HM-07 | `renderDoctorResultsView` | doctor checks, severities, evidence paths | filter severity, open check, copy command | Severity filter must be known; output grouped pass/fail/advisory rows. |
| HM-08 | `renderAiEffectLearningView` | model metrics, skill metrics, recipes, learning candidates | filter model, filter skill, open recipe | Runtime metrics require session/source fields; projected metrics are labelled advisory. |
| GD-01 | `renderGuideDocsView` | guide index, ADR list, selected source | select guide, select ADR, copy link | Path must resolve inside approved guide/doc roots; output rendered guide and source metadata. |

## 4. Validation Rules

| Rule | Applies to | Failure behavior |
|---|---|---|
| `knownScreenId` | all screen adapters | route to not-found empty state with evidence path to route registry |
| `knownProjectId` | all project routes | show project selection empty state |
| `knownLayer` | PM-01, PM-02, PM-04 | normalize to current active layer and show warning badge |
| `knownStatus` | tables/heatmaps | drop invalid status filter and keep unfiltered result |
| `safeDocPath` | PM-06, GD-01 | block render and show error state |
| `runtimeProvenanceRequired` | HM-05, HM-08 | label row as projected/advisory unless session/source exists |
| `copyOnlyCommand` | PM-03, HM-03, HM-06, HM-07 | return text for clipboard only |

## 5. L7 Unit Test Targets

| Oracle | Unit target | Expected result |
|---|---|---|
| U-SCREEN-001 | `parseScreenQuery(input) => ScreenQuery` | missing or invalid query values normalize to documented defaults. |
| U-SCREEN-002 | `validateScreenQuery(query) => ValidationResult` | unknown screen id, layer, status, and unsafe path are deterministic validation errors. |
| U-SCREEN-003 | `handleScreenEvent(event, state) => ScreenEventResult` | events return only navigation, filter, expand, refresh, or copy results. |
| U-SCREEN-004 | `loadScreenViewModel(projectId, query) => ViewState` | loading, ok, empty, stale, and error states are preserved without silent collapse. |
| U-SCREEN-005 | `classifyTelemetryProvenance(row) => TelemetryProvenance` | runtime claims are rejected unless runtime source/session fields exist. |
| U-SCREEN-006 | `buildRouteRegistry(screens) => RouteRegistry` | registry contains exactly 15 screen ids and no duplicate paths. |

These U-SCREEN oracles are the L7 unit contract for `screen-spec.md`.
