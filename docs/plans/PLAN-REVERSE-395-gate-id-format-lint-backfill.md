---
plan_id: PLAN-REVERSE-395-gate-id-format-lint-backfill
title: "PLAN-REVERSE-395 (reverse): GateId 形式 lint backfill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: fullstack
status: confirmed
route_signal: design_gap
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-09
updated: 2026-07-09
owner: PO / TL
parent_design: docs/plans/PLAN-L7-395-gate-id-format-lint.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T10:50:00+09:00"
    tests_green_at: "2026-07-09T10:50:00+09:00"
    verdict: approve
    scope: "PLAN-L7-395 の GateId 形式 lint を L4 data / L6 function-spec / L7 unit oracle / IMP-072 へ backfill 済み。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/gate-id-format.test.ts tests/doctor-rule-quality.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T10:50:00+09:00"
        evidence_path: tests/gate-id-format.test.ts
        output_digest: "sha256:7e484e36a3f7f6534e4ff8076a7f7d42425f9a6f52f7cbe69061d4e44167f5e9"
        anchor_commit: 48d89bbca4b341ce1013fb91eb4c9187d4119497
backprop_scope:
  - layer: L4-basic-design
    artifact_path: docs/design/harness/L4-basic-design/data.md
    status: updated
    reason: "GateId entity の検証 lint 欄を gate-id-format 実装済みに更新した。"
  - layer: L6-function-design
    artifact_path: docs/design/harness/L6-function-design/function-spec.md
    status: updated
    reason: "analyzeGateIdFormat の関数契約を追加した。"
  - layer: test-design
    artifact_path: docs/test-design/harness/L7-unit-test-design.md
    status: updated
    reason: "U-GID oracle を追加した。"
  - layer: backlog
    artifact_path: docs/improvement-backlog.md
    status: updated
    reason: "IMP-072 を implemented に更新した。"
agent_slots:
  - role: tl
    slot_label: "TL - reverse backfill"
  - role: qa
    slot_label: "QA - oracle citation"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-395-gate-id-format-lint-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L7-395-gate-id-format-lint.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/improvement-backlog.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-395-gate-id-format-lint.md
  requires: []
  references:
    - docs/plans/PLAN-L7-395-gate-id-format-lint.md
    - docs/design/harness/L4-basic-design/data.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/test-design/harness/L7-unit-test-design.md
---

# PLAN-REVERSE-395: GateId 形式 lint backfill

## R0 問題

`PLAN-L7-395` は IMP-072 の GateId 形式 lint を実装する add-impl である。GateId は L4 data の
entity ID 規約で定義され、L6 function-spec と L7 unit oracle にも戻す必要があるため、本 Reverse で
設計差分を backfill する。

## R4 合流結果

- `docs/design/harness/L4-basic-design/data.md` が GateId の検証先を `gate-id-format` として持つ。
- `docs/design/harness/L6-function-design/function-spec.md` が `analyzeGateIdFormat` 契約を持つ。
- `docs/test-design/harness/L7-unit-test-design.md` が `U-GID-001..003` oracle を持つ。
- `docs/improvement-backlog.md` が IMP-072 を implemented として持つ。
