---
plan_id: PLAN-L7-478-worktree-topology-pf4-migration-acceptance
title: "PLAN-L7-478 (impl): PF4 aggregate migration acceptance・byte vector・Reverse R4"
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
    slot_label: "SE - aggregate migration comparatorとbyte vectorを実装する"
  - role: qa
    slot_label: "QA - known preimage/framing/digestとbefore-after acceptanceを検証する"
  - role: po
    slot_label: "PO - Reverse R4 intentとmaster close条件を確認する"
generates:
  - artifact_path: docs/plans/PLAN-L7-478-worktree-topology-pf4-migration-acceptance.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-474-worktree-topology-detector.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-477-worktree-topology-pf3-doctor-advisory.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/256
review_evidence: []
---

# PF4: aggregate migration acceptance・byte vector・Reverse R4

本PLANはmaster `PLAN-L7-474` のforward implementation partitionであり、独立Reverseを起票しない。
本sliceはaggregate acceptance証拠を作るが、Reverse R4の判定所有者はmasterと`PLAN-REVERSE-474`である。

## Entry

PF3がmainへmergeし、Issue #256がReadyへ更新されていること。

## Scope / owner

`CANDIDATE-WTTOPO-013`、`018`を所有する。PF1〜PF3の出力をaggregateし、findings 0かつ
許可remap後identity集合一致で移設acceptanceを判定する。

`CANDIDATE-WTTOPO-018`は実装と同じ関数で期待値を再計算してはならない。固定identity、UTF-8 bytes、
各fieldの`uint32be` frame、`topology-v1:`付きpreimage、既知SHA-256 lowercase hexを文書fixtureとして
固定し、1 byte/field順/長さ/endian変異を拒否する。

## Exit

known vectorとaggregate acceptance Green、Reverse R4、全子landed確認、最新exact HEAD closing PASS後に
masterをconfirmedへ遷移し、Issue #232をclose可能にする。
