---
layer: L6
executed_at_layer: L7
artifact_type: test_design
status: confirmed
pair_artifact: docs/design/harness/L6-function-design/canonical-document-export.md
issue: 1032
---

# 文書エクスポートのテスト設計

### §1.16.1d U-DOCEXPORT (A-126 canonical document export)

> Pair = `canonical-document-export.md` Canonical Document Export Addendum (A-126 / PLAN-L6-34). These oracles cover conversion of concept, requirements, detailed design, PLAN, ADR, and test-design documents into CSV/Markdown/XLSX/PPTX derived artifacts. They do not authorize package installation or source implementation without PLAN-L7-35 TDD Red evidence.

| ID | Target | Oracle |
|---|---|---|
| U-DOCEXPORT-001 | `parseCanonicalDocumentStructure` supported families | parser accepts concept, requirements, design, plan, adr, and test-design document families with repo-relative source paths. |
| U-DOCEXPORT-002 | source anchors preserved | headings, section IDs, FR/AC/AT IDs, PLAN IDs, ADR IDs, status fields, and evidence links remain present in the projection. |
| U-DOCEXPORT-003 | malformed/unsupported docs | unsupported family or missing source path returns a finding and does not fabricate export rows. |
| U-DOCEXPORT-004 | `buildDocumentExportDataset` deterministic rows | same document projection and export profile produce stable row/sheet/slide-outline ordering. |
| U-DOCEXPORT-005 | redaction before render | secret-like, credential-like, PII-like, raw provider, and raw MCP payload fields are redacted or refused before rendering. |
| U-DOCEXPORT-006 | large document splitting | large requirements/design docs split by document family or section instead of silent truncation. |
| U-DOCEXPORT-007 | built-in CSV/Markdown render | CSV and Markdown summary render without external package readiness. |
| U-DOCEXPORT-008 | optional XLSX readiness | XLSX request without ExcelJS/SheetJS readiness returns a renderer-unavailable finding, not an implicit install. |
| U-DOCEXPORT-009 | optional PPTX readiness | PPTX request without PptxGenJS/D2 readiness returns a renderer-unavailable finding, not an implicit install. |
| U-DOCEXPORT-010 | `recordDocumentExportArtifact` projection rows | successful render creates `document_export_runs`, `document_export_datasets`, and `document_export_artifacts` rows with source snapshot hash. |
| U-DOCEXPORT-011 | generated artifact boundary | generated spreadsheet/deck edits do not mutate canonical docs or gate truth. |
| U-DOCEXPORT-012 | stale source snapshot | source digest mismatch marks an existing export artifact stale before review/handover use. |

> **Status (PLAN-L7-35, 2026-06-11)**: U-DOCEXPORT-001..012 promoted to green `it` in `tests/document-export.test.ts` against `src/export/document-export.ts` — supported family parsing, source anchors, deterministic datasets, redaction, built-in CSV/Markdown rendering, optional renderer findings, projection rows, derived-artifact boundary, and stale source snapshot detection are pure and do not mutate canonical docs.
