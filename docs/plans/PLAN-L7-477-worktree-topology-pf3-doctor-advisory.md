---
plan_id: PLAN-L7-477-worktree-topology-pf3-doctor-advisory
title: "PLAN-L7-477 (impl): PF3 doctor advisory wiring"
kind: impl
layer: L7
drive: be
route_signal: forward
route_mode: forward
status: draft
created: 2026-08-05
updated: 2026-08-05
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/governance-enforcement.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - collector/analyzerをdoctor advisoryへ薄く結線する"
  - role: qa
    slot_label: "QA - empty no-opとhard-gate不変を検証する"
generates:
  - artifact_path: docs/plans/PLAN-L7-477-worktree-topology-pf3-doctor-advisory.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-474-worktree-topology-detector.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-476-worktree-topology-pf2-os-collector.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/255
review_evidence: []
---

# PF3: doctor advisory wiring

本PLANはmaster `PLAN-L7-474` のforward implementation partitionであり、独立Reverseを起票しない。
Reverse R1〜R4とaggregate acceptanceはmasterと`PLAN-REVERSE-474`が所有する。

## Entry

PF2がmainへmergeし、Issue #255がReadyへ更新されていること。

## Scope / owner

`CANDIDATE-WTTOPO-015`を所有する。CI等のempty factsは完全no-op、findingはadvisory表示するが
doctor全体のhard-gate/exit codeを変えない。削除・prune・repairは行わない。

## Exit

empty/advisoryのTDD、doctor registry parity、exact HEAD CI、closing PASSを満たす。
