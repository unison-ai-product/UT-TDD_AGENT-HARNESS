---
plan_id: PLAN-L7-478-worktree-topology-pf4-migration-acceptance
title: "PLAN-L7-478 (impl): PF4 aggregate migration acceptance・byte vector・Reverse R4"
kind: impl
layer: L7
drive: be
route_signal: forward
route_mode: forward
status: confirmed
created: 2026-08-05
updated: 2026-08-20
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
  - artifact_path: src/runtime/worktree-topology-migration.ts
    artifact_type: source_module
  - artifact_path: tests/worktree-topology-migration.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-474-worktree-topology-detector.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-477-worktree-topology-pf3-doctor-advisory.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/256
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-20T16:47:56+09:00"
    tests_green_at: "2026-08-20T16:56:19+09:00"
    verdict: pass
    scope: >-
      PF4 bounded implementation preflight。worktree収集・doctor・削除・prune・repairを追加せず、
      findings 0と許可remap後identity集合の一致だけを純粋に判定する。U-WTTOPO-013は同数でも
      別identityへの置換を拒否し、U-WTTOPO-018は文書のliteral preimage/SHA-256を独立計算で固定する。
      実装workerはgpt-5.6-luna effort=high。non-author Claude closing reviewとReverse R4は後続gateである。
    worker_model: gpt-5.6-luna
    reviewer_model: gpt-5.6-luna
    green_commands:
      - kind: unit_test
        command: "node scripts/run-vitest-snapshot.ts tests/worktree-topology-migration.test.ts --reporter=dot"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-20T16:56:19+09:00"
        evidence_path: tests/worktree-topology-migration.test.ts
        output_digest: "sha256:88187f3d5ee4f00481c5a0a800a345d50d3ee283729310617a60495c88cca9ce"
        anchor_commit: 5d4d3c604794aa0a14121cb8ab1cb7020d2e4746
      - kind: typecheck
        command: "npm run typecheck"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-20T16:42:55+09:00"
        evidence_path: src/runtime/worktree-topology-migration.ts
        output_digest: "sha256:f8dfe2d05fa9b1396b04c21b876a91a03ca9a68181bae252d0ad883e665f7bdf"
        anchor_commit: 5d4d3c604794aa0a14121cb8ab1cb7020d2e4746
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

known vectorとaggregate acceptance Green、Reverse R4、PF4 exact HEAD closing PASSを満たした時点で
PF4をmerge可能にする。全子landed確認、master closing PASS、master confirmed遷移、Issue #232 closeは
PF4自身のexit条件へ含めず、masterのpost-PF4 stepが所有する。
