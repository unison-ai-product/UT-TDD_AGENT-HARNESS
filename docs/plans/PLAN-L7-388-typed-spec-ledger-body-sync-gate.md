---
plan_id: PLAN-L7-388-typed-spec-ledger-body-sync-gate
title: "PLAN-L7-388 (add-impl): typed spec ledger/body sync doctor gate"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / TL
parent_design: docs/plans/PLAN-L6-44-typed-spec-ledger-and-body-sync.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T15:17:26+09:00"
    tests_green_at: "2026-07-08T15:17:26+09:00"
    verdict: approve
    scope: "U10b add-impl slice。typed spec ledger/body/phase sync を state-db analyzer と doctor hard gate に接続した。"
    green_commands:
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T15:17:26+09:00"
        evidence_path: src/state-db/spec-ir-projections.ts
        output_digest: "sha256:91f5337c20ce0f12b50111cf54538ebd284899d4288846b929d060a3e40547bb"
      - kind: unit_test
        command: "bun run vitest run tests/spec-ir-projections.test.ts tests/doctor.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T15:17:26+09:00"
        evidence_path: tests/spec-ir-projections.test.ts
        output_digest: "sha256:5d1fe4fb21773cf4cb8495d80e51ed602ac0c9d272013516d25c5e58706049ea"
agent_slots:
  - role: tl
    slot_label: "TL - typed spec ledger/body sync gate"
  - role: se
    slot_label: "SE - state-db / doctor wiring"
  - role: qa
    slot_label: "QA - typed spec sync regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-388-typed-spec-ledger-body-sync-gate.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/spec-ir-projections.ts
    artifact_type: source_module
  - artifact_path: src/doctor/db-projection.ts
    artifact_type: source_module
  - artifact_path: tests/spec-ir-projections.test.ts
    artifact_type: test_code
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-44-typed-spec-ledger-and-body-sync.md
  requires:
    - docs/plans/PLAN-REVERSE-388-typed-spec-ledger-body-sync-gate-backfill.md
  references:
    - docs/plans/PLAN-L7-387-typed-spec-trace-closure-gate.md
---

# PLAN-L7-388: typed spec ledger/body sync doctor gate

## 0. 役割

本 PLAN は U10b として、typed spec の台帳・本文・phase 同期を doctor hard gate に接続する。

## 1. 実装内容

1. `analyzeTypedSpecLedgerBodySync` を state-db projection に追加する。
2. `checkTypedSpecLedgerBodySync` を doctor の dependency/db group に追加する。
3. `typed-spec-ledger-body-sync` を full doctor profile に登録する。
4. real repo OK、malformed fixture、missing root fail-close を test で固定する。

## 2. 不変条件

- 判定は source docs から rebuild する。
- `ledger_sources` / `v_phase` は bootstrap 台帳から読む。
- 本文実体は `spec.defines` block と ledger table だけでは満たさない。

## 3. 受け入れ条件

- `doctor: typed-spec-ledger-body-sync - OK` が real repo doctor に表示される。
- malformed typed spec fixture で body/ledger/phase findings が出る。
- targeted vitest、`tsc --noEmit`、`db rebuild`、`doctor` が green。
