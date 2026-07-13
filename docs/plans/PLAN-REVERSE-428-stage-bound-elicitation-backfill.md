---
plan_id: PLAN-REVERSE-428-stage-bound-elicitation-backfill
title: "PLAN-REVERSE-428: ステージ紐付きエリシテーション実装の設計 backfill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: agent
status: confirmed
route_signal: drift
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-13
updated: 2026-07-13
owner: PM / PO
parent_design: docs/plans/PLAN-L7-428-stage-bound-elicitation-context.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
backprop_scope:
  - layer: L6-function-design
    decision: updated
    evidence_path: docs/design/harness/L6-function-design/function-spec.md
    reason: "elicitation packet 契約 (stage 解決順序 / fail-open 境界 / coverage 結合条件 / append-only 記録) を固定する。"
  - layer: L7-unit-test-design
    decision: updated
    evidence_path: docs/test-design/harness/L7-unit-test-design.md
    reason: "U-ELICIT-001..006 を oracle 台帳へ登録する。"
agent_slots:
  - role: tl
    slot_label: "TL — elicit context/record の実装事実を L6/L7 設計・test-design へ backfill"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-428-stage-bound-elicitation-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-428-stage-bound-elicitation-context.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L3-07-design-decision-elicitation-format.md
review_evidence:
  - reviewer: codex-blind-reviewer
    review_kind: cross_agent
    reviewed_at: "2026-07-13T16:35:00+09:00"
    tests_green_at: "2026-07-13T16:27:55+09:00"
    verdict: approve
    scope: "L6 function-spec 追補 / L7 U-ELICIT oracle 表 backfill を含む packet を Codex blind review (claim-blind / spec-blind)。FLAG 2 件は L6 契約 (missing_skill_ids 可視化、A+B 雛形) と oracle 表 (U-ELICIT-005 拡張 / 007 追加) へ反映して解消。architecture §3.1 に elicitation module 登載 (module-drift 解消)。"
    worker_model: claude-fable-5
    reviewer_model: gpt-5.6-terra
    green_commands:
      - kind: unit_test
        command: "bun x vitest run tests/elicitation-context.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-13T16:27:47+09:00"
        evidence_path: tests/elicitation-context.test.ts
        output_digest: "sha256:e0e50aef0a1c30723409dce5e324f4a07f9f6cd935a74356a8e0a8a3dc9976b1"
        anchor_commit: 0a3d7fcd14cbd2a2b64918532e5717df037b57a9
---

# PLAN-REVERSE-428: ステージ紐付きエリシテーション実装の設計 backfill

## 目的

PLAN-L7-428 (add-impl) の Reverse ペア。`ut-tdd elicit context` /
`ut-tdd elicit record` の実装観測を起点に、次を上流へ合流する。

- L6 function design: elicitation packet の契約 (stage 解決順序 =
  plan-match → schedule-current → none、fail-open 境界、design-coverage の
  layer/plan 結合条件) を function-spec へ backfill する。
- L7 unit test design: U-ELICIT-001..006 を test-design ledger へ登録する。
- 採択記録 log (`.ut-tdd/logs/design-decisions.jsonl`) の episodic 正本 /
  PLAN・ADR 正本の分離を physical-data 側の記述と整合させる。

## 工程表

### Step 1: [直列] R0-R2 実装観測
- 実装 (src/elicitation/、cli 配線、U-ELICIT) を as-is で観測・記録する。

### Step 2: [直列] R3-R4 Forward 合流
- 直列理由 = **verification_gate**。L6/L7 設計 doc への gap-only 合流と
  trace 整合 (doctor / vmodel lint green) を確認する。

## DoD

- [x] L6 function-spec に elicitation packet 契約が載る。
- [x] L7 unit test design に U-ELICIT oracle が登録される。
- [x] doctor / vmodel lint green。
