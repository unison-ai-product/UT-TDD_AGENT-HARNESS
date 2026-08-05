---
plan_id: PLAN-L7-476-worktree-topology-pf2-os-collector
title: "PLAN-L7-476 (impl): PF2 OS collector・realpath/reparse・retained refs"
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
    slot_label: "SE - 薄いOS collectorとtyped observationを実装する"
  - role: qa
    slot_label: "QA - Windows reparse/realpathとretained ref解決を実OSで検証する"
generates:
  - artifact_path: docs/plans/PLAN-L7-476-worktree-topology-pf2-os-collector.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-474-worktree-topology-detector.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-475-worktree-topology-pf1-pure-analyzer.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/254
review_evidence: []
---

# PF2: OS collector・realpath/reparse・retained refs

本PLANはmaster `PLAN-L7-474` のforward implementation partitionであり、独立Reverseを起票しない。
Reverse R1〜R4とaggregate acceptanceはmasterと`PLAN-REVERSE-474`が所有する。

## Entry

PF1がmainへmergeし、Issue #254がReadyへ更新されていること。

## Scope / owner

`CANDIDATE-WTTOPO-007`、`012`、`014`、`016`、`017`を所有する。porcelain、gitdir/admin、
command failure、retained refとsymbolic aliasをtyped facts/findingsへ変換し、正常値へ丸めない。

`CANDIDATE-WTTOPO-016`は文字列fixtureだけではGreenにしない。Windows上で実reparse pointを作り、
`realpath.native`相当の実観測から同じidentityへ収束する証跡を必須とする。作成不能な環境では
skip GreenではなくOS能力不足として明示し、Windows CI laneを正本証拠にする。

## Exit

owner oracleのRed→Green、実OS証跡、同commitでの`U-*`昇格、exact HEAD CI、closing PASSを満たす。
