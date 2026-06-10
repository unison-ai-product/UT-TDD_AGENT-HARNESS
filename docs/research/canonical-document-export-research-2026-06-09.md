---
artifact_type: research_memo
status: confirmed
created: 2026-06-09
updated: 2026-06-09
related_audit: .ut-tdd/audit/A-126-canonical-document-export.md
related_requirements: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md#6811-canonical-document-export-a-126-2026-06-09
---

# Canonical Document Export Research Memo

## Scope

This memo records the Web research basis for A-126. It is a research artifact, not an implementation source of truth. The authoritative scope is requirements, physical-data, ADR, PLAN, and test-design artifacts.

Research question:

- How should canonical UT-TDD documents such as concept, requirements, detailed design, PLAN, ADR, and test-design docs be converted to spreadsheet / Excel / PPTX outputs for human review?
- Which outputs should be built-in and which should be optional renderers?
- How should generated files remain traceable to the source Markdown/doc artifacts without becoming source of truth?

## Source Check

Checked on 2026-06-09.

| Source | URL | Relevant finding | UT-TDD decision |
|---|---|---|---|
| ExcelJS | https://github.com/exceljs/exceljs | Official project describes an Excel workbook manager for reading, manipulating, and writing spreadsheet data. The project exposes TypeScript definitions. | Optional XLSX renderer candidate for structured document matrices, trace tables, and multi-sheet design exports when package readiness is proven. |
| SheetJS Community Edition | https://docs.sheetjs.com/ | Official docs describe a JavaScript interface across Excel and other spreadsheet formats and broad runtime support. | Optional spreadsheet parser/writer candidate, especially when broad file-format compatibility matters. |
| PptxGenJS | https://github.com/beautifulai/PptxGenJS and https://gitbrent.github.io/PptxGenJS/ | Official project creates OOXML PowerPoint presentations with JavaScript/TypeScript examples, tables, charts, images, and export APIs. | Optional PPTX renderer candidate for concept, requirements, detailed design, gate, and handover decks. |
| D2 exports | https://www.d2lang.com/tour/exports/ | D2 CLI can export diagrams to formats including PPTX. | Optional diagram-to-deck bridge for architecture/design visuals, not a general presentation generator. |

## Document Conversion Matrix

| Source document family | Spreadsheet / XLSX view | PPTX view | Notes |
|---|---|---|---|
| Concept /企画 | objective, audience, value, constraints, KPI, risks, decisions | executive story, scope, value, roadmap, decision points | Good for stakeholder review; should preserve source section IDs. |
| Requirements /要件定義 | FR/AC/AT tables, priority, status, owner, trace targets, acceptance gaps | requirement summary, scope boundaries, risk/decision slides | Must not lose FR/AC IDs or acceptance text. |
| L4-L6 design /詳細設計 | module/function/API/DB/contract matrices, dependency rows, unresolved carry | architecture/design walkthrough with diagrams and key decisions | Links back to source docs and PLANs are mandatory. |
| PLAN / workflow | plan metadata, dependencies, DoD, evidence, blockers | plan brief, schedule, risks, gate state | Useful for PM/TL review and handover. |
| ADR / decision docs | decision matrix, alternatives, consequences, follow-ups | decision narrative and tradeoff slides | Decision status and date must be visible. |
| Test-design / evidence | oracle matrix, GWT rows, green definitions, missing coverage | quality/readiness summary slides | Quantitative evidence and qualitative review remain separate fields. |

## Selection Matrix

| Export profile | Trigger / use | Value | Default state | Hard requirements |
|---|---|---|---|---|
| `doc-csv-matrix` | requirements/design/PLAN/test-design table extraction | Zero-dependency sortable baseline. | Built-in, enabled. | Deterministic columns, escaped cells, source path/section per row. |
| `doc-markdown-summary` | GitHub-readable conversion summary | Human-readable without Office tooling. | Built-in, enabled. | Stable section order and source links. |
| `doc-xlsx-workbook` | multi-sheet requirements/design/trace workbook | Excel-readable workbook with filters, frozen headings, source links, and review columns. | Optional renderer, disabled until package declared. | Renderer readiness, bounded sheet names, source digest, redaction profile, artifact hash. |
| `doc-pptx-deck` | concept/requirements/design/ADR/gate deck | Narrative slides generated from source document structure. | Optional renderer, disabled until package declared. | Renderer readiness, deck template policy, source digest, redaction profile, artifact hash. |
| `doc-d2-pptx-diagram` | architecture / relation graph / workflow diagrams in PPTX | Reuses diagram sources for presentation output. | Optional renderer. | D2 readiness; graph/doc snapshot freshness; no raw evidence payload. |

## Workflow Integration

1. Parse canonical documents into a document structure projection: source path, section ID, heading, table rows, decisions, trace IDs, status, and evidence links.
2. Build spreadsheet/deck datasets from that document structure; do not scrape generated Office files back into truth.
3. Redact before rendering.
4. CSV and Markdown summary exports are built-in baseline outputs.
5. XLSX and PPTX renderers are optional adapters; missing availability returns a finding.
6. Generated files are recorded as `document_export_artifacts` with source digest and redaction profile.

## Safety / Quality Rules

- Do not export raw provider transcripts, credentials, secrets, PII, raw MCP payloads, screenshots, or browser traces unless a future human-approved policy explicitly allows a redacted attachment profile.
- Every export artifact must record source document paths, section IDs, renderer, format, path, hash, and evidence path.
- Source section IDs / FR IDs / PLAN IDs / ADR IDs must remain visible in generated spreadsheet/deck output.
- Large exports should split sheets/slides by document family or section instead of truncating silently.
- Office-format generation must never install packages implicitly.
- Generated spreadsheets and decks are derived artifacts. Canonical Markdown/docs remain source of truth.

## Residual Work

- Add A-126 requirements, physical-data projection, ADR/backlog/audit, workflow triggers, and L6/L7/Reverse route.
- Implement future canonical-doc parser/export dataset builders after TDD Red.
- Add renderer readiness probes for ExcelJS / SheetJS / PptxGenJS / D2 PPTX if a later L7 PLAN authorizes source changes.
