# A-127 External Tooling / Document Export Scope Completion Audit

Date: 2026-06-09
Status: scoped-complete / implementation-pending

## Scope

This audit closes the scoping request for cross-artifact graphing, diagram generation, external MCP/test tooling, workflow triggers, Playwright/UI verification, and canonical document conversion.

The latest user correction is authoritative: the needed document conversion is not a generic review report export. It is conversion of canonical UT-TDD documents such as concept/planning, requirements, detailed design, PLAN, ADR, and test-design documents into spreadsheet / Excel / PPTX derived artifacts for human review.

No source implementation is authorized by this audit. Runtime implementation requires the corresponding L7 PLAN, TDD Red evidence, and Reverse closure.

## Requirement Breakdown

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| R1 | Cross-artifact dependency / relation graph scope is defined. | scoped | A-124; requirements section 6.8.9; physical-data section 9.5; ADR-002 A-124; PLAN-L6-31 / PLAN-L7-32 / PLAN-REVERSE-32 |
| R2 | Diagram / visualization output is included. | scoped | A-124 research; physical-data `diagram_artifacts`; module-drift `exportRelationDiagram`; tool adapter probe route PLAN-L6-33 / PLAN-L7-34 / PLAN-REVERSE-34 |
| R3 | Development plugins/tools were researched with Web evidence and treated as optional adapters. | scoped | `docs/research/cross-artifact-graph-tooling-research-2026-06-09.md`; A-124 adapter matrix; tool adapter workflow docs |
| R4 | MCP servers and external test foundations were researched and scoped. | scoped | A-125; `docs/research/mcp-external-verification-profile-research-2026-06-09.md`; requirements section 6.8.10; physical-data section 9.6 |
| R5 | Trigger automation and workflow entry points are defined. | scoped | `MCP-VERIFICATION-PROFILE-WORKFLOW`, `TOOL-ADAPTER-WORKFLOW`, `CANONICAL-DOCUMENT-EXPORT-WORKFLOW` in process docs; requirements trigger tables |
| R6 | Playwright/UI verification is explicitly included. | scoped | requirements section 6.8.10 recommends Microsoft Playwright MCP for exploratory browser inspection and Vitest Browser Mode with Playwright provider for deterministic browser tests |
| R7 | Safety boundaries are defined. | scoped | A-124/A-125/A-126 safety sections; no implicit package install; optional adapters disabled until readiness evidence; raw external outputs are not gate truth |
| R8 | Proper Forward / Reverse route exists and no unauthorized L7 source implementation is being added. | scoped | PLAN-L6/L7/REVERSE routes for A-124/A-125/A-126; PLAN-RECOVERY-03 / PLAN-REVERSE-31 overstep recovery |
| R9 | Canonical document conversion is scoped for concept/planning, requirements, detailed design, PLAN, ADR, and test-design docs. | scoped | A-126; research memo; requirements section 6.8.11; physical-data section 9.7; function-spec Canonical Document Export Addendum; L7 U-DOCEXPORT; L8 IT-DOCEXPORT |

## Document Export Clarification

Canonical document export covers:

- Concept / planning documents.
- Requirements documents and FR / AC / AT matrices.
- Detailed design documents, including API / DB / contract / module design views.
- PLAN documents and handover-relevant workflow data.
- ADR decision documents.
- Test-design documents and evidence summaries.

The generated CSV / Markdown / XLSX / PPTX files are derived artifacts. They must keep source paths, section IDs, FR / AC / AT IDs, PLAN IDs, ADR IDs, status fields, trace rows, and evidence links. They must not become source of truth.

## Completion Boundary

Scoping is complete when the above evidence exists. Implementation remains pending:

- `ut-tdd export docs --kind ... --format ...`
- canonical document parser and export dataset builder
- optional ExcelJS / SheetJS / PptxGenJS / D2 PPTX renderer readiness probes
- DB collector for `document_export_*` rows
- runtime relation graph and diagram generation
- external MCP/test profile execution beyond the approved first slice

This boundary preserves the recovery decision: design and workflow scope may be strengthened now, but new runtime implementation must return through L7 with TDD Red and Reverse closure.
