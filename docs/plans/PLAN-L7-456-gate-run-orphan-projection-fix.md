---
plan_id: PLAN-L7-456-gate-run-orphan-projection-fix
title: "PLAN-L7-456 (impl): gate-run projection の false orphan 修正"
kind: impl
layer: L7
drive: db
status: confirmed
route_signal: regression_dev
route_mode: recovery
created: 2026-07-21
updated: 2026-07-21
owner: SE / QA
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
backprop_decision: not_required
backprop_decision_reason: "既存 gate_runs / workflow_runs projection 契約の実装不整合修正であり、新規上流要件を追加しない。"
agent_slots:
  - role: se
    slot_label: "SE — gate-run projection join と legacy alias 解決の修正"
  - role: qa
    slot_label: "QA — false orphan 正例と真正 orphan 負例の回帰固定"
generates:
  - artifact_path: docs/plans/PLAN-L7-456-gate-run-orphan-projection-fix.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
dependencies:
  parent: PLAN-RECOVERY-14-db-orphan-debt-closure
  requires:
    - PLAN-L7-363-routine-gate-run-projection
  blocks: []
  references:
    - docs/plans/PLAN-RECOVERY-14-db-orphan-debt-closure.md
    - docs/plans/PLAN-L7-363-routine-gate-run-projection.md
    - docs/design/harness/L5-detailed-design/physical-data.md
review_evidence:
  - reviewer: codex
    review_kind: cross_agent
    reviewed_at: "2026-07-21T15:49:00+09:00"
    tests_green_at: "2026-07-21T14:10:00+09:00"
    verdict: approve
    worker_model: claude-sonnet-5
    reviewer_model: gpt-5.6-sol
    scope: "PR #110 HEAD 691a479405f29d0486814d3ffbc42680fc5dafa1 の projection-writer.ts と U-DBPROJ-GATE-02/03/04 に限定した claim-blind review。Issue #87 全体および PLAN-RECOVERY-14 の残作業は判定対象外。stable ID join、alias ambiguity、真正 orphan fail-close を独立確認し、コードsliceは PASS。"
    green_commands:
      - kind: unit_test
        command: "bunx vitest run tests/projection-writer.test.ts -t 'PLAN-RECOVERY-14' --reporter=verbose; bunx vitest run tests/drive-db-registration.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-21T14:10:00+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:5b6cb68715df80dba11564602f7c9d51844f7816e7f5b280186c4308d11cd4fb"
        anchor_commit: 691a479405f29d0486814d3ffbc42680fc5dafa1
---

# PLAN-L7-456: gate-run projection の false orphan 修正

## 目的と境界

`projectGateRunEvidence` が実在PLANの gate evidenceを `workflow_orphans` /
`orphan_gate_run` に誤投影する二つの実装不整合だけを修正する完了sliceである。
実環境の17+17行再測定、真正orphanの退役、誤配置runtime state清掃、
unresolved-join feedback整理は親 `PLAN-RECOVERY-14` に残し、本PLANの完了claimへ含めない。

## 実装

1. gate由来 `workflow_runs.drive_run_id` を、`projectDriveRuns` が生成する
   `stableId("drive-run", `${planId}:documented`)` に一致させる。
2. gate evidenceのlegacy short plan IDを既存 `resolveProjectedPlanId` で解決する。
3. ambiguous / nonexistent aliasはraw IDを維持し、真正orphanをfail-closeする。

## AC / DoD

- [x] gate由来workflow rowがdocumented drive rowへjoinし、false `workflow_orphans`を生成しない。
- [x] unique legacy short IDが現行PLAN IDへ解決され、false `orphan_gate_run`を生成しない。
- [x] 実在しないPLAN IDはorphanのまま残り、検出を握り潰さない。
- [x] U-DBPROJ-GATE-02/03/04とdrive-db-registration回帰がGreen。
- [x] 691a4794のコード・テストsliceを非author Codexがclaim-blind reviewしPASS。
- [x] 親Recovery PLANの未完了事項を本sliceの完了claimから明示的に除外する。

## 検証証跡

実装・テストはcommit `73ca280e`、PLAN review記録を含む対象HEADは
`691a479405f29d0486814d3ffbc42680fc5dafa1`。上記 `review_evidence` はコードsliceに
限定し、Issue #87全体のPASSを意味しない。
