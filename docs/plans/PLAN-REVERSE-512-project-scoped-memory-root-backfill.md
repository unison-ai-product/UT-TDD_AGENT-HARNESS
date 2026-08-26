---
plan_id: PLAN-REVERSE-512-project-scoped-memory-root-backfill
title: "PLAN-REVERSE-512: project-scoped Memory root backfill"
kind: reverse
layer: cross
drive: fullstack
route_signal: design_gap
route_mode: reverse
status: draft
workflow_phase: R0
confirmed_reverse_type: design
created: 2026-08-26
updated: 2026-08-26
owner: PO / TL
github_issue_id: 424
parent_design: docs/plans/PLAN-L7-512-project-scoped-memory-root.md
pair_artifact: docs/test-design/harness/L7-project-scoped-memory-root-test-design.md
agent_slots:
  - role: qa
    slot_label: "QA - exact HEADでisolationとmigration mutationを再検証する"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-512-project-scoped-memory-root-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-512-project-scoped-memory-root.md
  requires: []
  blocks: []
  references:
    - docs/test-design/harness/L7-project-scoped-memory-root-test-design.md
review_evidence: []
---

# PLAN-REVERSE-512

## R0

Forward実装中。R1ではcandidateを正式oracleへ昇格し、R2でproject/root/envelope/migrationを独立変異、
R3でclean Pack・二worktree・二provider・別projectをaggregate検収し、R4で上位契約へ再合流する。
