---
plan_id: PLAN-L6-74-repository-docs-disposition-auditor-contracts
title: "PLAN-L6-74 (add-design/function-spec): repository docs disposition / closure auditor契約"
kind: add-design
layer: L6
sub_doc: function-spec
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: se
    slot_label: "SE - init/set/materialize/validate/reference closure契約"
  - role: qa
    slot_label: "QA - missing/phantom/delta/orphan/stale premise oracle"
generates:
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L5-19-repository-document-disposition-ledger.md
  requires: []
  blocks:
    - docs/plans/PLAN-L7-422-repository-document-disposition-closure-gate.md
---

# PLAN-L6-74: repository docs disposition / closure auditor契約

- `captureDocsSnapshot`はGit objectからraw NUL path stream/count/tree OID/hashを返し、working treeの一時状態を正本にしない。
- `materializeDispositionBatch`はselectorを最終recordへ展開するcommand、`validateDispositionLedger`はread-only queryとする。
- `analyzeDocumentReferences`は全tracked docsのfrontmatter path、Markdown/wiki link、PLAN/spec/test IDをtyped edge化し、現行relation graphのfail-openを再利用しない。
- baseline/delta/final closure、conditional field、target/PLAN、canonical stale assertionを独立finding IDで検証する。
