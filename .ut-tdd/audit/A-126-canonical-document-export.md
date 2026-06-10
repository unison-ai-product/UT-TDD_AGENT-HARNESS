# A-126 Canonical Document Export

Date: 2026-06-09
Context: User clarified that the needed scope is conversion of canonical documents such as requirements, planning/concept, detailed design, PLAN, ADR, and test-design docs into spreadsheet / Excel / PPTX outputs for human review.

## Current State

A-124 and A-125 scope relation graphs, diagram exports, MCP/test profiles, and normalized evidence. They do not yet define conversion of canonical UT-TDD documents into spreadsheet/Excel/PPTX formats.

Current canonical documents remain Markdown and structured project docs. That is correct for source of truth, but weak for humans who need sortable requirement matrices, detailed design workbooks, or presentation decks.

## Research Evidence

Detailed source URLs and selection matrix are recorded in `docs/research/canonical-document-export-research-2026-06-09.md`.

Primary/official sources checked:

- ExcelJS: Excel workbook read/write/manipulation for Node/browser with TypeScript definitions.
- SheetJS CE: broad JavaScript spreadsheet format support.
- PptxGenJS: JavaScript/TypeScript OOXML PowerPoint generation.
- D2 exports: diagram export including PPTX.

## Decision

Canonical document export is in scope, but generated Office/spreadsheet files are **derived artifacts**, not source-of-truth documents.

The core path is:

1. Parse canonical docs into a structured document projection.
2. Preserve source path, section ID, FR/AC/AT/PLAN/ADR IDs, status, trace, and evidence links.
3. Build spreadsheet/deck datasets from that structure.
4. Redact before rendering.
5. Render built-in CSV / Markdown summary outputs by default.
6. Render XLSX / PPTX only through optional adapter profiles with readiness evidence.
7. Record generated artifacts in DB projection rows with source digest and redaction profile.

## Back-Propagation Decision

`backprop_decision`: `requires_requirement_backprop`

Reason: The request changes accepted conversion surfaces for requirements, concept/planning, detailed design, PLAN, ADR, and test-design documents. It affects requirements, DB projection, workflow triggers, L6 function contracts, L7 oracles, and future gate/handover usage.

## Changes

- Add requirements §6.8.11 for canonical document export.
- Add physical-data §9.7 projection tables and invariants.
- Add ADR-002 A-126 addendum.
- Add IMP-126 backlog row.
- Back-propagate A-126 to L1/L3 functional requirements as an existing FR bundle extension.
- Add L6/L7/Reverse PLAN route for future implementation.

## Residual Work

Future implementation should create L7 TDD Red before source changes for:

- `ut-tdd export docs --kind requirements|concept|design|plan|adr|test-design --format csv|md|xlsx|pptx`
- canonical document parser / export dataset builder
- redaction policy for document conversion
- optional ExcelJS / SheetJS / PptxGenJS / D2 PPTX renderer probes
- DB collector/rebuild for `document_export_*` projection rows
