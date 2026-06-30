---
layer: L3
sub_doc: screen-functional
status: confirmed
parent_doc: docs/design/harness/L2-screen/screen-list.md
pair_artifact: docs/test-design/harness/L3-acceptance-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_l1_screen: docs/design/harness/L1-requirements/screen-requirements.md
related_l2_screen_list: docs/design/harness/L2-screen/screen-list.md
related_l2_ui_element: docs/design/harness/L2-screen/ui-element.md
plan: docs/plans/PLAN-L3-06-screen-functional-body.md
next_pair_freeze: L12
created: 2026-06-30
updated: 2026-06-30
---

# L3 Screen Functional Requirements

This document is the L3 FE/UI functional layer for the central UT-TDD dashboard. It converts the L1 screen requirements and L2 screen/UI model into screen-level functional requirements and acceptance criteria. It does not define visual style, component internals, or implementation code.

## 1. Scope

The product UI scope is the 15-screen central dashboard defined by L1 and L2:

- PM: PM-01 through PM-06
- HM: HM-01 through HM-08
- GD: GD-01

All screens are read-only. The UI may navigate, filter, sort, refresh local projections, expand details, and copy CLI-ready text. It must not execute AI providers, mutate project state, approve gates, start recovery, or write files.

## 2. Cross-Screen Functional Invariants

| ID | Requirement | Acceptance criteria |
|---|---|---|
| SF-RO | Read-only surface | Given any screen is open, When the user clicks a primary control, Then the result is navigation, filtering, expansion, refresh, or copy-only text generation. |
| SF-CLI | CLI handoff | Given a command-producing control is used, When the user copies it, Then the UI writes text to the clipboard and does not execute the command. |
| SF-STATE | URL state | Given filters, selected project, layer, status, or screen tab are changed, When the page is reloaded or shared, Then the same view state is restored from the URL. |
| SF-EVIDENCE | Evidence links | Given a card, table row, or graph node summarizes harness state, When the user opens details, Then the underlying artifact path, PLAN id, gate id, or DB projection source is visible. |
| SF-EMPTY | Empty/error/loading | Given any data set is empty, stale, failing, or loading, Then the screen uses the common five-state model from L4 ui-standard and never hides the reason. |
| SF-TRACE | V-model trace | Given a screen renders layer, gate, trace, or review status, Then upstream and downstream artifacts remain navigable through explicit links. |

## 3. Per-Screen Functional Requirements

| Screen | Function | Acceptance criteria |
|---|---|---|
| PM-01 Project Portfolio Dashboard | Show project x L0-L14 health, active carries, and gate status at portfolio level. | Given project data exists, When the dashboard loads, Then each project row exposes layer status, open carries, and next action without requiring raw DB inspection. |
| PM-02 Process View | Show one project's workflow/deep-dive across active phases and sub-docs. | Given a user selects a project/layer, When PM-02 opens, Then the screen lists relevant PLANs, sub-docs, pair status, and stale or blocked work. |
| PM-03 Gate & Summary View | Show gate results, evidence, and generated next-action text. | Given a gate has passed or failed, When the gate row is opened, Then status, evidence path, failure reason, and copyable remediation prompt are visible. |
| PM-04 Trace View | Show four-artifact trace and V-pair consistency. | Given a PLAN, artifact, test, or gate node exists, When the node is selected, Then upstream and downstream trace edges are shown with missing edges highlighted. |
| PM-05 Handover View | Show current handover state and carry continuity. | Given handover state exists, When PM-05 loads, Then current next action, stale age, carry list, and archive references are visible. |
| PM-06 Design Document Viewer | Render L0-L14 design documents with Markdown, YAML frontmatter, Mermaid, and ASCII diagrams. | Given a document path is selected, When PM-06 renders it, Then frontmatter, headings, diagrams, and source links remain inspectable. |
| HM-01 Feature Inventory View | Show FR/feature implementation status. | Given FR registry and implementation projection exist, When HM-01 loads, Then status counts, drilldown rows, and evidence links are visible. |
| HM-02 Coverage Heatmap View | Show feature, test, telemetry, and weak-point coverage. | Given coverage projections exist, When a cell is selected, Then the screen explains coverage source, status, and unresolved gap. |
| HM-03 Runtime Wiring View | Show static architecture and runtime error surfaces. | Given runtime wiring data exists, When HM-03 loads, Then provider, hook, adapter, and failure boundaries are visible. |
| HM-04 Database Browser View | Show harness DB table health and projected rows. | Given DB metadata exists, When a table is selected, Then columns, row count, indexes, and projection provenance are shown. |
| HM-05 Audit Log View | Show AI execution, guard, budget, and skill evidence. | Given hook/model/review telemetry exists, When the user filters by session or plan, Then events and provenance class remain visible. |
| HM-06 Recovery View | Show forced-stop, rollback, and resume guidance. | Given a recovery signal exists, When HM-06 opens, Then the user gets copyable CLI text and evidence references, not direct execution. |
| HM-07 Doctor Results View | Show `ut-tdd doctor` checks and remediation cues. | Given doctor output exists, When HM-07 loads, Then pass/fail/advisory groups, evidence, and next command text are visible. |
| HM-08 AI Effect Data & Learning View | Show model, skill, recipe, and learning-engine metrics. | Given telemetry exists, When HM-08 loads, Then real runtime provenance is separated from projected or advisory evidence. |
| GD-01 Guide & Docs View | Show static knowledge, ADRs, and governance docs. | Given a guide or ADR is selected, When GD-01 renders it, Then links, frontmatter, and source path remain visible. |

## 4. Acceptance Scenario Families

### SF-GWT-01 Read-Only Command Handoff

Given a user is viewing HM-06 recovery guidance,
When the user clicks the command control,
Then the UI copies the CLI command text,
And no recovery command is executed by the UI.

### SF-GWT-02 Evidence Drilldown

Given PM-03 shows a failing gate,
When the user opens the failing gate details,
Then the UI shows the gate id, source artifact, failure message, and copyable remediation prompt.

### SF-GWT-03 Trace Navigation

Given PM-04 shows a V-model trace node,
When the user selects the node,
Then the UI shows upstream and downstream artifact links,
And missing trace edges are visually separated from passing edges.

### SF-GWT-04 Telemetry Provenance Split

Given HM-05 or HM-08 shows test, skill, model, or guard telemetry,
When the data row comes from projection rather than runtime capture,
Then the provenance is labelled as projected/advisory and is not presented as fired runtime evidence.

## 5. Downstream Contracts

- L4 `ui-standard` supplies shared states, colors, layout density, components, and accessibility constraints.
- L5 `ui-detail` must keep state, routing, data loading, and component decomposition within the read-only command-handoff boundary.
- L6 `screen-spec` must turn every row in section 3 into item/event/validation/transition-level screen specs.
- L12 acceptance tests must exercise the scenario families in section 4 for the UI product surface before production release claims.
