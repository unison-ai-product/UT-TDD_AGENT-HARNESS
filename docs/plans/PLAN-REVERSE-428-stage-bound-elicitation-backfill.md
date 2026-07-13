---
plan_id: PLAN-REVERSE-428-stage-bound-elicitation-backfill
title: "PLAN-REVERSE-428: ステージ紐付きエリシテーション実装の設計 backfill"
kind: reverse
layer: cross
workflow_phase: R0
drive: agent
status: draft
route_signal: drift
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-13
updated: 2026-07-13
owner: PM / PO
parent_design: docs/plans/PLAN-L7-428-stage-bound-elicitation-context.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL — elicit context/record の実装事実を L6/L7 設計・test-design へ backfill"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-428-stage-bound-elicitation-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-428-stage-bound-elicitation-context.md
  requires: []
  blocks: []
  references:
    - docs/governance/design-decision-elicitation.md
review_evidence: []
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

- [ ] L6 function-spec に elicitation packet 契約が載る。
- [ ] L7 unit test design に U-ELICIT oracle が登録される。
- [ ] doctor / vmodel lint green。
