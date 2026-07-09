---
plan_id: PLAN-REVERSE-363-gate-run-projection-backfill
title: "PLAN-REVERSE-363 (reverse): gate run projection backfill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: db
status: confirmed
route_signal: design_gap
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-09
updated: 2026-07-09
owner: TL / QA
parent_design: docs/plans/PLAN-L7-363-routine-gate-run-projection.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
agent_slots:
  - role: tl
    slot_label: "TL - gate run projection backfill"
  - role: qa
    slot_label: "QA - gate evidence regression oracle"
review_evidence:
  - reviewer: codex-explorer-plato
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T20:26:36+09:00"
    tests_green_at: "2026-07-09T20:26:36+09:00"
    verdict: approve
    scope: "PLAN-L7-363 の gate_runs 永続化を L6 function spec / L7 oracle / doctor gate へ backfill。"
    green_commands:
      - kind: unit_test
        command: "bunx vitest run tests/cli-surface.test.ts tests/projection-writer.test.ts tests/doctor.test.ts -t \"gate run|gate-run|persisted gate\" --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T20:26:36+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:562197278c07523074f729efd42fc6c5839aa6fe581862c1b951b3f67d21cf73"
backprop_scope:
  - layer: L6-function-design
    artifact_path: docs/design/harness/L6-function-design/function-spec.md
    status: updated
    reason: "gate run evidence writer / projection / doctor coverage の contract を追加した。"
  - layer: test-design
    artifact_path: docs/test-design/harness/L7-unit-test-design.md
    status: updated
    reason: "U-GATE-007/008、U-DBPROJ-GATE-01、U-DOCTOR-GATE-01 を追加した。"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-363-gate-run-projection-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-363-routine-gate-run-projection.md
  requires:
    - docs/plans/PLAN-L7-363-routine-gate-run-projection.md
---

# PLAN-REVERSE-363: gate run projection backfill

## 0. 役割

`PLAN-L7-363` は `ut-tdd gate` の実行事実を `.ut-tdd/gate_runs`、`gate_runs`、
`workflow_runs`、`retry_events` へ接続する add-impl である。本 Reverse はその実装事実を L6 function
contract と L7 oracle へ戻し、検証実行が DB / doctor で後監査可能になることを Forward 正本へ合流させる。

## 1. Backfill 内容

- L6: `writeGateRunEvidence`、`.ut-tdd/gate_runs/*.json` schema、`projectGateRunEvidence`、
  `gate-run-coverage` doctor check の契約を `function-spec.md` に追加。
- L7: CLI 証跡生成、証跡書込失敗時の verdict 保持、DB projection、retry 検出、doctor coverage の oracle を
  `L7-unit-test-design.md` に追加。

## 2. R4 判定

`forward_routing=gap-only` とする。今回の backfill は既存 FR-L1-05 / FR-L1-06 / FR-L1-20 の実装・設計
精緻化であり、新規要求 ID は起こさない。`promotion_strategy=reuse-as-is` とし、実装済みの証跡 writer /
projection / doctor gate をそのまま採用する。

## 3. 完了条件

- [x] `PLAN-L7-363` が `dependencies.requires` で本 Reverse に接続され、add-impl orphan にならない。
- [x] L6 function spec に gate run evidence schema / DB projection / doctor coverage contract がある。
- [x] L7 unit oracle に CLI / projection / doctor regression がある。
