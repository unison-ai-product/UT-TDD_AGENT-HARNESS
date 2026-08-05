---
plan_id: PLAN-L7-475-worktree-topology-pf1-pure-analyzer
title: "PLAN-L7-475 (impl): PF1 pure analyzer・canonical identity/remap"
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
    slot_label: "SE - pure typed analyzerとcanonical identity/remapをTDD実装する"
  - role: qa
    slot_label: "QA - PF1 owner oracleの順序不変・fail-safe・collisionを検証する"
generates:
  - artifact_path: docs/plans/PLAN-L7-475-worktree-topology-pf1-pure-analyzer.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-474-worktree-topology-detector.md
  requires: []
  blocks: []
  references:
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/253
review_evidence: []
---

# PF1: pure analyzer・canonical identity/remap

本PLANはmaster `PLAN-L7-474` のadd-impl lifecycleを実行可能な粒度へ分けたforward implementation
partitionであり、独立したadd-feature/Reverse lifecycleではない。Reverse R1〜R4とaggregate acceptanceは
masterと`PLAN-REVERSE-474`が所有する。

## Entry

PF-0 correctionがmainへmergeし、Issue #253がBlockedからReadyへ更新されていること。

## Scope / owner

`CANDIDATE-WTTOPO-001`〜`006`、`008`〜`011`を所有する。Git I/O、realpath/reparse実証、
doctor結線、aggregate migration acceptanceは所有しない。PR #243のpure実装commitは本契約へ
適合する部分だけ再利用し、commit自体を正本扱いしない。

`CANDIDATE-WTTOPO-009`はfindingsだけでなく、countsの各bucketとretirable集合を含む全出力が
入力順に依存しないことを要求する。canonical remapはroot/prefix境界、longest-prefix、escape、
many-to-one/cross-path collisionを純粋判定する。

## Exit

owner oracleのRed→Green、同commitでの`U-*`昇格、exact HEAD CI、非author closing PASSを満たす。
