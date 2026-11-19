---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_canonical_document_export
pair_artifact: docs/test-design/harness/L7-canonical-document-export-test-design.md
next_pair_freeze: L7
issue: 1032
---

## 2026-06-09 canonical document export 追補 (A-126 / PLAN-L6-34)

この追補は requirements §6.8.11 と A-126 research memo を、canonical UT-TDD documents を spreadsheet / Excel / PPTX outputs へ変換する L6 function contracts に降下する。これ自体は Office-format generation を許可しない。後続 L7 implementation が満たすべき pure document-structure と export-dataset rules を定義する。

| 関数 | signature | 前提 | 事後 | invariant | oracle |
|---|---|---|---|---|---|
| `parseCanonicalDocumentStructure` | parseCanonicalDocumentStructure(input: CanonicalDocumentInput) => CanonicalDocumentProjection | source docs は repo-relative path と text として与える。document family は concept、requirements、design、plan、adr、test-design のいずれかとする。 | section、heading、table、decision、trace ID、status field、evidence link、source anchor を返す。 | canonical Markdown/docs は source of truth のままにする。generated export は FR/AC/AT/PLAN/ADR ID を導入または drop できない。 | U-DOCEXPORT-001..003 |
| `buildDocumentExportDataset` | buildDocumentExportDataset(input: DocumentExportDatasetInput) => DocumentExportDataset | document projection、requested format、export profile を与える。 | source path、section ID、ID column、status、trace、evidence link を持つ deterministic row/sheet/slide-outline record を返す。 | dataset は rendering 前に redact する。large docs は truncate せず family/section で split する。 | U-DOCEXPORT-004..006 |
| `renderDocumentExport` | renderDocumentExport(input: DocumentExportRenderInput, deps: DocumentExportRendererDeps) => DocumentExportRenderResult | dataset と renderer profile を与える。CSV/Markdown は built-in、XLSX/PPTX/D2 は readiness を要求する。 | generated artifact metadata または renderer-unavailable finding を返す。 | renderer execution は optional であり、package を implicit install しない。 | U-DOCEXPORT-007..009 |
| `recordDocumentExportArtifact` | recordDocumentExportArtifact(input: DocumentExportArtifactInput) => DocumentExportProjectionRows | render result、source snapshot hash、redaction profile、evidence path を与える。 | `document_export_runs`、`document_export_datasets`、`document_export_artifacts` projection row を返す。 | generated file は derived artifact とする。gate truth は canonical docs、normalized row、recorded human decision に残す。 | U-DOCEXPORT-010..012 |

対応 document family:

- concept / planning documents は objective、value、scope、KPI、risk、decision、roadmap を扱う。
- requirements は FR/AC/AT、priority、acceptance、trace、owner/status を扱う。
- detailed design は module/function/API/DB/contract row、dependency、unresolved carry を扱う。
- PLAN は frontmatter、dependency、generated artifact、DoD、evidence、blocker を扱う。
- ADR は decision、alternative、consequence、follow-up、status/date を扱う。
- test-design は U/IT/AT oracle、GWT row、green definition、missing coverage を扱う。

export default:

- CSV と Markdown summary は built-in とする。
- XLSX は ExcelJS または SheetJS readiness による optional とする。
- PPTX は PptxGenJS readiness による optional とする。
- D2 PPTX は architecture/workflow diagram のみに対する optional とする。
