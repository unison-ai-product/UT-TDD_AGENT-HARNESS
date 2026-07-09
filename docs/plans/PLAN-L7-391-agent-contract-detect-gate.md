---
plan_id: PLAN-L7-391-agent-contract-detect-gate
title: "PLAN-L7-391 (add-impl): V-model agent contract detect gate"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-08
owner: PO / TL
parent_design: docs/plans/PLAN-L6-47-agent-contract-authoring-source.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T17:20:00+09:00"
    tests_green_at: "2026-07-08T17:20:00+09:00"
    verdict: approve
    scope: "U12d add-impl slice。agent_contracts projection と agent-contract-detection doctor gate を追加した。"
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/spec-ir-projections.test.ts tests/doctor.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T17:20:00+09:00"
        evidence_path: tests/doctor.test.ts
        output_digest: "sha256:5af700330b849715556c32f87893914ad87b56e32c4ebd0b0f478400d474ec46"
        anchor_commit: d55666212ce10793624e61bf019a755b174d7fc3
agent_slots:
  - role: tl
    slot_label: "TL - agent contract detect gate"
  - role: se
    slot_label: "SE - state-db / doctor wiring"
  - role: qa
    slot_label: "QA - unknown doctor gate regression"
generates:
  - artifact_path: docs/plans/PLAN-L7-391-agent-contract-detect-gate.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/spec-ir-projections.ts
    artifact_type: source_module
  - artifact_path: src/doctor/db-projection.ts
    artifact_type: source_module
  - artifact_path: src/doctor/check-definition-groups.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db-tables-spec-ir.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db-indexes.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db.ts
    artifact_type: source_module
  - artifact_path: tests/spec-ir-projections.test.ts
    artifact_type: test_code
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-47-agent-contract-authoring-source.md
  requires:
    - docs/plans/PLAN-REVERSE-391-agent-contract-detect-gate-backfill.md
  references:
    - docs/governance/vmodel-agent-contracts.md
    - docs/plans/PLAN-L6-47-agent-contract-authoring-source.md
---

# PLAN-L7-391: V-model agent contract detect gate

## 0. 役割

本 PLAN は U12d として、agent contract authoring source を DB projection と doctor hard gate へ接続する。
`agent.read_first` / `agent.done_when` は実行前の参照順序と完了条件であり、検出器が欠落を fail-close する。

## 1. 実装内容

1. `agent_contracts` table と `idx_agent_contracts_target` を schema registry に追加する。
2. `parseAgentContractRows` で `docs/governance/vmodel-agent-contracts.md` を投影する。
3. `analyzeAgentContractIntegrity` で ID、target、defines、read_first、done_when、未知 doctor gate を検査する。
4. `checkAgentContractDetection` を doctor dependency/db group と full profile に追加する。
5. unit test / doctor test で正常投影、欠落 read_first、invalid done_when、unknown gate、missing root を固定する。

## 2. 不変条件

- `done_when` は `doctor:<gate-id>` 形式に正規化済みでなければならない。
- `knownDoctorGateIds` が渡された doctor 経路では、未登録 gate を OK にしない。
- DB row は検索用であり、source doc / target doc を mutation しない。

## 3. 受け入れ条件

- `doctor: agent-contract-detection - OK` が real repo doctor に現れる。
- malformed fixture が `agent-contract-read-first-missing` / `agent-contract-done-when-invalid` / `agent-contract-doctor-gate-unknown` を出す。
- VMS-009 / TVMS-009 が typed spec 台帳と所有 artifact 宣言に現れる。

## U12 typed spec owned artifact

```yaml
spec:
  defines:
    - id: VMS-009
      kind: agent-contract-detect-gate
      traces_from: [VMS-008]
      tests: [TVMS-009]
```

VMS-009 は agent contract を DB projection と doctor hard gate に接続する実装境界である。
