---
layer: L2
sub_doc: screen-list
status: confirmed
artifact_role: supplemental_screen_detail
parent_doc: docs/design/harness/L1-requirements/screen-requirements.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
related_docs:
  - docs/design/harness/L2-screen/screen-list.md
  - docs/design/harness/L2-screen/screen-flow.md
  - docs/design/harness/L2-screen/ui-element.md
  - docs/design/harness/L2-screen/wireframe.md
pair_artifact: docs/design/harness/L2-screen/wireframe.md
next_pair_freeze: L10
plan: docs/plans/PLAN-L2-01-screen-list.md
created: 2026-06-24
updated: 2026-06-24
---

# L2 Screen Detail Design

This document fills the gap between the screen list, transition design, UI component catalog, and low-fi wireframes. It is the per-screen design sheet for reviewers who need to answer: what is shown, where the data comes from, what the user can do, what happens on errors, and which upstream requirement is covered.

The authoritative screen IDs and URLs remain in [screen-list.md](./screen-list.md). The authoritative transition edges remain in [screen-flow.md](./screen-flow.md). Component definitions remain in [ui-element.md](./ui-element.md). Layout sketches remain in [wireframe.md](./wireframe.md).

## 1. Detail Sheet Schema

Every screen detail entry MUST cover the following fields.

| Field | Required | Definition |
|---|---:|---|
| Screen ID | yes | One of PM-01..PM-06, HM-01..HM-08, GD-01. |
| Purpose | yes | The user decision or review task the screen supports. |
| Persona | yes | Primary human user. AI runtimes do not operate the UI directly. |
| Route | yes | Canonical URL from `screen-list.md`. |
| Inputs | yes | Path params, query params, local state, files, DB projections, or command output used to render the screen. |
| Display Blocks | yes | Major visual/data regions in reading order. |
| Controls | yes | Read-only navigation, filters, expanders, copy actions, and manual refresh. Direct mutation actions are prohibited unless a later requirement explicitly permits them. |
| Validation / Empty State | yes | What the screen shows when data is missing, stale, invalid, or partially projected. |
| Error State | yes | Fail-close behavior, fallback rendering, and next_action guidance. |
| Security / Permission | yes | Persona, scope, and whether secrets/PII are rendered. |
| State Persistence | yes | URL query, path, session, local client state, or none. |
| Trace | yes | BR/UX/FR-L1 and L2 documents that justify the screen. |
| Test / Review Hook | yes | Manual or automated checks expected before claiming the screen implemented. |

## 2. Common Rules

| Rule | Requirement |
|---|---|
| Read-only UI | All screens are read-only unless a future signed-off requirement adds mutation. Copy buttons may write to clipboard only. |
| CLI execution | UI may display copyable CLI text, but does not execute `ut-tdd` commands. |
| Unknown data | Unknown, stale, and not-yet-projected data are explicit states, not blank success. |
| Trace links | Any screen showing a plan, artifact, gate, or document must expose the upstream/downstream trace link when available. |
| Secrets | Secrets, tokens, local absolute personal paths, and private provider payloads must be redacted before rendering. |
| Refresh | Default auto-refresh is 30 seconds where live state is shown; manual refresh is display-only. |
| Deep links | Screen state that affects review context must be shareable through route or query parameters. |

## 3. Screen Detail Matrix

| Screen | Purpose | Inputs | Display Blocks | Controls | Empty / Error State | Trace / Test Hook |
|---|---|---|---|---|---|---|
| PM-01 Project Overview Dashboard | Let PO see project/layer progress and detect blocked gates quickly. | project registry, plan digests, gate status, artifact progress projection; query `mode`, `phase`, `status`, `drive`, `tier`. | hierarchy selector, L0-L14 heatmap, blocked item strip, polling status. | filter, layer cell navigation to PM-02, gate-fail navigation to PM-03, copy current view URL. | Empty project registry shows setup guidance and `ut-tdd status`; gate failures are red with next_action. | BR-01, BR-06, UX-02, FR-L1-01/08/13/20; verify heatmap count against projection rows. |
| PM-02 Layer View | Let reviewer inspect one project/layer and its plans, carries, stale items, and phase state. | `:case`, `:L`, plan registry, carry list, stale detector output, scrum/additive mode fields. | layer summary, plan table, carry list, phase/status row, linked sub-doc list. | filter plan rows, open PM-03 for selected gate, open PM-06 for design docs, copy plan path. | Missing layer shows 404 with escaped path and return link to PM-01. | BR-01/04, FR-L1-01/02/04/13/14/15/23/29; verify all linked plans exist or are marked missing. |
| PM-03 Gate + Blocker View | Let PO/TL inspect gate pass/fail/bypass evidence and decide next action. | gate run records, review evidence, failing lint/test output, bypass record, generated next_action. | gate result panel, evidence table, blocker table, next action card, CLI copy block. | copy next_action/interrupt/resume commands, navigate HM-05 audit, navigate GD-01 troubleshooting. | Missing evidence is fail-close; bypass without reviewer/signoff is red. | BR-02/05, UX-03, FR-L1-05/11/16/17/45; verify every fail has one next_action. |
| PM-04 Trace View | Let reviewer inspect upstream/downstream coverage and V-pair status. | trace graph, artifact registry, pair-freeze state, doctor trace output. | graph, missing edge table, pair status table, trace detail drawer. | filter by plan/artifact/status, open PM-06 doc preview, open HM-07 doctor detail. | Missing mandatory trace edge is red and links to remediation guidance. | BR-01/03/07, FR-L1-03/18; verify graph has no orphan mandatory artifacts. |
| PM-05 Handover View | Let the next runtime resume from the correct state without stale prose. | `.ut-tdd/handover/CURRENT.json`, handover archives, session digest summary. | current handover card, next action, carry details, stale warning, archive list. | navigate to target screen from next_action, copy handover summary, open archive. | Missing handover is warning, not failure; stale handover must show generated_at and source. | UX-03, FR-L1-01/31/42; verify stale threshold and next_action target. |
| PM-06 Design Doc Viewer | Let PO/TL read canonical docs and trace without leaving the harness UI. | doc catalog, markdown files, frontmatter, Mermaid/ASCII code blocks, trace keys. | doc tree, frontmatter panel, markdown preview, TOC, trace links. | filter by layer/status/drive, copy path, open PM-04 trace, navigate internal doc links. | Unrenderable Markdown falls back to raw escaped text; missing doc shows catalog error. | BR-01/07, FR-L1-01/32; verify rendering does not execute embedded scripts. |
| HM-01 Feature List | Let operator inspect FR implementation status and related screens/plans. | FR registry, implementation status projection, plan links, screen trace map. | hierarchy selector, FR status table, plan links, screen links. | filter by status/priority/category, open PM-06 for screen requirement, export visible rows. | Unknown FR status is warning; missing trace is red for P0. | BR-06, UX-02, FR-L1-33/35; verify P0 FR rows have screen trace. |
| HM-02 Coverage Heatmap | Let operator find weak coverage by perspective and axis. | coverage projection, review/audit results, missing artifact counts. | axis selector, 8x5 heatmap, cell detail table, recommended task text. | switch axes, open HM-01 filtered list, copy remediation prompt. | Missing metric source is gray with source name; low coverage is red. | BR-06/22, FR-L1-33/34/35/46/47/48/49; verify cell totals reconcile to row details. |
| HM-03 Wiring View | Let operator inspect static architecture and live failure wiring. | hook state, provider state, routing config, mode/drive mapping, connection health. | architecture diagram, connection table, mode transition arrows, failure overlays. | select connection, filter by runtime/hook/drive, copy diagnostic command. | Failed connection is red and links to HM-05/HM-07 evidence. | BR-03, FR-L1-07/08/40/42; verify no direct UI execution path exists. |
| HM-04 DB View | Let operator inspect `.ut-tdd` state and projection consistency. | SQLite projection, JSON state files, integrity check output. | table explorer, row detail, integrity summary, orphan/drift list. | select table, filter rows, copy SQL/read command, open trace row target. | Corrupt DB or missing table shows fail-close diagnostic and no partial green. | BR-05/07/20, FR-L1-06/07/51; verify row count matches integrity summary. |
| HM-05 Audit / Execution Log | Let operator inspect runtime actions, model use, guard decisions, and review events. | session logs, audit files, guard decisions, token/cost telemetry, skill injection records. | invocation table, guard decision list, skill tab, hook fire tab, evidence links. | filter by runtime/result/date/role, copy audit path, open related PM-03 gate. | Missing log segment is warning with segment ID; guard block is explicit. | BR-02/03/08, FR-L1-09/12/20; verify private payload redaction. |
| HM-06 Recovery View | Let operator inspect recovery runs, resume points, and rollback guidance. | recovery plans, incident records, handover state, audit trail. | recovery log, resume point list, rollback copy block, current incident status. | copy rollback/resume command, open PM-03 gate, open HM-05 evidence. | No safe rollback shows human-escalation message, not a generated destructive command. | UX-03, FR-L1-10/16; verify destructive commands are never auto-executed. |
| HM-07 Doctor Result View | Let operator inspect `ut-tdd doctor` structure and severity. | doctor JSON/text result, check catalog, last run metadata. | result tree, severity summary, failed check detail, suggested command. | filter severity, copy command, open PM-04 trace for trace failures. | Doctor unavailable is red with provider/runtime diagnostic. | BR-03/05/07, FR-L1-02/11/18; verify severity mapping. |
| HM-08 Learning / Effectiveness View | Let operator inspect model/skill effectiveness and feedback recipes. | model metrics, skill metrics, feedback events, recipe registry. | KPI cards, model/skill tables, recipe list, trend placeholders. | filter model/skill/task, copy recipe prompt, open GD-01 learning guide. | Insufficient sample size shows warning and hides ranking claims. | BR-21, FR-L1-19/20; verify sample-size guard. |
| GD-01 Guide / Docs | Let users read operational guidance, troubleshooting, onboarding, and CLI reference. | guide markdown, category route, related doc links. | side nav, markdown body, related links, search placeholder. | category navigation, internal links, copy CLI snippets. | Unknown category shows escaped 404 and link to guide index. | BR-08, UX-03, FR-L1-19/27/32/44; verify category path escaping. |

## 4. Screen Detail Coverage Checklist

Before a screen is claimed implemented, review evidence MUST include:

- route and screen ID match `screen-list.md`
- primary blocks match `ui-element.md`
- navigation edges match `screen-flow.md`
- visible layout has a corresponding `wireframe.md` section or an approved L10 high-fi artifact
- all error and empty states above have either a test, a screenshot, or a documented manual verification
- no screen contains a direct mutation path that bypasses CLI/governance gates

## 5. Carry

- L10 UX refinement should turn this detail sheet into high-fi review checks: actual labels, spacing, color contrast, and screenshot evidence.
- L7/L8/L9 test design should reference the `Test / Review Hook` column when screen implementation starts.
- PM-06 should include this document in its design doc tree once the doc catalog reads L2 additions.
