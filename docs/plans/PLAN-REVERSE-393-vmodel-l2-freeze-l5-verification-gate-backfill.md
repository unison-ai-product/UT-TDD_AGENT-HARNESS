---
plan_id: PLAN-REVERSE-393-vmodel-l2-freeze-l5-verification-gate-backfill
title: "PLAN-REVERSE-393 (reverse): L2/L5 forward freeze contract gate backfill"
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
created: 2026-07-08
updated: 2026-07-09
owner: PO / TL
parent_design: docs/plans/PLAN-L7-393-vmodel-l2-freeze-l5-verification-gate.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T19:10:51+09:00"
    tests_green_at: "2026-07-09T19:10:51+09:00"
    verdict: approve
    scope: "PLAN-L7-393 の add-impl を PLAN-L6-48 / L7 oracle / typed spec へ backfill 済み。"
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/vmodel-forward-freeze-contracts.test.ts tests/vmodel-pair.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T19:10:51+09:00"
        evidence_path: tests/vmodel-forward-freeze-contracts.test.ts
        output_digest: "sha256:27efe2eb587a22d42f4668213f1e827cb8526596f9573789949feb9d5b012d4b"
        anchor_commit: 1afa132c9368fc362706db102880e020d7ba3d24
backprop_scope:
  - layer: L6-function-design
    artifact_path: docs/plans/PLAN-L6-48-vmodel-l2-freeze-l5-verification-design.md
    status: created
    reason: "U13a forward freeze contract design を追加した。"
  - layer: test-design
    artifact_path: docs/test-design/harness/L7-unit-test-design.md
    status: updated
    reason: "U-FREEZE-CONTRACT oracle と TVMS-010/011 本文を追加した。"
  - layer: governance
    artifact_path: docs/governance/vmodel-typed-spec-definitions.md
    status: updated
    reason: "VMS-010/011 と TVMS-010/011 を typed spec 台帳へ追加した。"
agent_slots:
  - role: tl
    slot_label: "TL - reverse backfill"
  - role: qa
    slot_label: "QA - trace closure"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-393-vmodel-l2-freeze-l5-verification-gate-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L6-48-vmodel-l2-freeze-l5-verification-design.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L7-393-vmodel-l2-freeze-l5-verification-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/governance/vmodel-typed-spec-definitions.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-393-vmodel-l2-freeze-l5-verification-gate.md
  requires:
    - docs/plans/PLAN-L6-48-vmodel-l2-freeze-l5-verification-design.md
  references:
    - docs/plans/PLAN-L7-393-vmodel-l2-freeze-l5-verification-gate.md
    - docs/governance/vmodel-typed-spec-definitions.md
---

# PLAN-REVERSE-393: L2/L5 forward freeze contract gate backfill

## R0 問題

`PLAN-L7-393` は `src/vmodel/lint.ts` と doctor wiring を追加する add-impl である。
HARNESS の add-impl は上流設計と oracle へ戻す必要があるため、本 Reverse で U13a の設計差分を閉じる。

## R1 観測

- ZIP 107 は L2 prototype agreement freeze と L5 verification design readiness を明示した。
- 既存 `pair-freeze` は pair の存在を検査するが、L2 の合意証跡と L5/L8 の GWT 被覆までは名前付きで検査しない。

## R2 逆復元

- `PLAN-L6-48` が U13a の L6 設計差分を持つ。
- `docs/test-design/harness/L7-unit-test-design.md` が TVMS-010/011 と U-FREEZE-CONTRACT-* oracle を持つ。
- `docs/governance/vmodel-typed-spec-definitions.md` が VMS-010/011 と TVMS-010/011 を台帳化する。

## R3 判断

forward routing は L6/L7 の追加設計・追加実装で足りる。要求変更ではなく、ZIP 107 の既存 V-model 改善を HARNESS の検出契約へ落とす backfill である。

## R4 合流

`PLAN-L7-393` は本 Reverse を `dependencies.requires` に持つ。doctor の backfill gate はこの接続を確認する。
