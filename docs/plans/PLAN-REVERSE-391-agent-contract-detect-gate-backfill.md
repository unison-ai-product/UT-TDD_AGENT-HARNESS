---
plan_id: PLAN-REVERSE-391-agent-contract-detect-gate-backfill
title: "PLAN-REVERSE-391: V-model agent contract detect gate backfill"
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
updated: 2026-07-08
owner: PO / TL
parent_design: docs/plans/PLAN-L7-391-agent-contract-detect-gate.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T17:20:00+09:00"
    tests_green_at: "2026-07-08T17:20:00+09:00"
    verdict: approve
    scope: "PLAN-L7-391 からの design/test-design/governance back-fill。agent contract の authoring source と doctor gate を上流設計へ戻した。"
    green_commands:
      - kind: doctor
        command: "bun run src/cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-08T17:20:00+09:00"
        evidence_path: docs/governance/vmodel-agent-contracts.md
        output_digest: "sha256:08f83631602f5fdac67a8192069abf151fe0211c130b0ef504c13d978c168664"
backprop_scope:
  - layer: L4-basic-design
    artifact_path: docs/design/harness/L4-basic-design/data.md
    status: updated
    reason: "AgentContract entity を追加した。"
  - layer: L5-detailed-design
    artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    status: updated
    reason: "`agent_contracts` physical table と index を追加した。"
  - layer: L6-function-design
    artifact_path: docs/design/harness/L6-function-design/function-spec.md
    status: updated
    reason: "parse/analyze/doctor contract を追加した。"
  - layer: test-design
    artifact_path: docs/test-design/harness/L7-unit-test-design.md
    status: updated
    reason: "U-AGENT-CONTRACT-R1..R4 oracle を追加した。"
  - layer: governance
    artifact_path: docs/governance/vmodel-agent-contracts.md
    status: created
    reason: "agent contract authoring source を追加した。"
  - layer: governance
    artifact_path: docs/governance/vmodel-typed-spec-definitions.md
    status: updated
    reason: "VMS-008/VMS-009 と TVMS-008/TVMS-009 を台帳へ追加した。"
agent_slots:
  - role: tl
    slot_label: "TL - agent contract backfill"
  - role: qa
    slot_label: "QA - reverse trace check"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-391-agent-contract-detect-gate-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/vmodel-agent-contracts.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/vmodel-upgrade-schedule.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/vmodel-typed-spec-definitions.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-391-agent-contract-detect-gate.md
  requires:
    - PLAN-L6-47-agent-contract-authoring-source
---

# PLAN-REVERSE-391: V-model agent contract detect gate backfill

## 0. 役割

本 PLAN は U12d の doctor gate 実装で確定した agent contract の意味を、
L4/L5/L6/test-design/governance へ戻す Reverse backfill である。

## 1. 戻し先

- L4: `AgentContract` entity を追加する。
- L5: `agent_contracts` table / `idx_agent_contracts_target` を追加する。
- L6: `parseAgentContractRows` / `analyzeAgentContractIntegrity` / `checkAgentContractDetection` を追加する。
- L7 test-design: U-AGENT-CONTRACT-R1..R4 を追加する。
- governance: `vmodel-agent-contracts.md` と typed spec 台帳へ VMS-008/VMS-009 を追加する。

## 2. 受け入れ条件

- 戻し先の設計差分が PLAN-L6-47 / PLAN-L7-391 と整合する。
- `doctor` と targeted tests が green である。
