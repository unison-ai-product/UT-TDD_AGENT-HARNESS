---
plan_id: PLAN-L6-34-canonical-document-export
title: "PLAN-L6-34 (add-design): canonical document export"
kind: add-design
layer: L6
drive: fullstack
status: draft
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
agent_slots:
  - role: tl
    slot_label: "TL - canonical document export design"
generates:
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-00-master.md
  requires:
    - .ut-tdd/audit/A-126-canonical-document-export.md
    - docs/research/canonical-document-export-research-2026-06-09.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
---

# PLAN-L6-34 (add-design): canonical document export

## §0 Position

This PLAN is the L6 entry for converting canonical UT-TDD documents into spreadsheet / Excel / PPTX outputs. It is not a generic report-export plan. The input scope is concept/planning, requirements, detailed design, PLAN, ADR, and test-design documents.

## §1 Scope

Design function contracts for:

- parsing canonical document structure with source path and section anchors;
- preserving FR/AC/AT/PLAN/ADR IDs, status, trace, and evidence links;
- building deterministic CSV/Markdown/XLSX/PPTX datasets;
- rendering CSV/Markdown as built-in outputs;
- gating XLSX/PPTX/D2 renderers by readiness findings;
- recording generated artifacts as derived `document_export_*` projection rows.

## §2 Inputs

- Requirements §6.8.11.
- Physical-data §9.7.
- ADR-002 A-126 addendum.
- A-126 audit and research memo.

## §3 Function Contracts

The function contracts are documented in `function-spec.md` "Canonical Document Export Addendum":

- `parseCanonicalDocumentStructure`
- `buildDocumentExportDataset`
- `renderDocumentExport`
- `recordDocumentExportArtifact`

## §4 Test Design

The L7 pair artifact adds U-DOCEXPORT-001..012. These oracles cover supported document families, source anchor preservation, deterministic dataset generation, redaction, built-in CSV/Markdown render, optional XLSX/PPTX readiness, projection rows, generated artifact boundary, and stale source detection.

## §5 Workflow Guard

No source implementation for document export is authorized until PLAN-L7-35 has a TDD Red entry and requires PLAN-REVERSE-35.

## §8 DoD

- [x] L6 function signatures are documented.
- [x] U-DOCEXPORT unit oracles are added to L7 unit test design.
- [x] L7 implementation PLAN references this PLAN.
- [x] Reverse pairing PLAN exists for implementation back-fill.

Status remains `draft`: this PLAN defines the entry but does not authorize L7 source changes without TDD Red and review evidence.
