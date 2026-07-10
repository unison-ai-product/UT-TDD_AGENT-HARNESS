---
plan_id: PLAN-L6-70-source-catalog-profile-resolver-contracts
title: "PLAN-L6-70 (add-design/function-spec): source catalog / profile overlay resolver契約"
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
    slot_label: "SE - catalog aggregate / profile resolver signatures"
  - role: qa
    slot_label: "QA - U-DISP/U-PROFILE negative oracle"
generates:
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L5-16-vmodel-source-profile-physical-data.md
  requires: []
  blocks:
    - docs/plans/PLAN-L7-417-source-disposition-profile-projection.md
---

# PLAN-L6-70: source catalog / profile overlay resolver契約

- `DocumentDispositionCatalog.create(input): Result<Catalog, CatalogViolation[]>`はmanifest宣言件数と実record件数、edge/disposition不変条件を完全生成時に検証する。109/163/21/8はchecked ZIP revisionのacceptance fixtureであり、aggregateへ恒久定数化しない。
- `traceSource(sourceId)`と`unresolved()`はqueryのみで状態を変更しない。
- `resolveProfile(catalog, selection)`はsize baseline→product overlay→explicit overrideの順で決定論的に解決し、unknownと同優先度競合をfail-closeする。
- `U-DISP-001..005`、`I-DISP-001`、`U-PROFILE-001..005`をL7 test-designへ固定する。
