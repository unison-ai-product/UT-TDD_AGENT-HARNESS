---
plan_id: PLAN-L6-02-edge-case
title: "PLAN-L6-02: L6 機能設計 — 関数別エッジケース + @edge-* docstring 確定"
kind: design
layer: L6
sub_doc: edge-case
drive: fullstack
status: confirmed
created: 2026-05-29
updated: 2026-05-29
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: aim
    slot_label: "AIM — エッジケース網羅性 (正常/異常/境界/throws) のレビュー"
generates:
  - artifact_path: docs/design/harness/L6-function-design/edge-case.md
    artifact_type: design_doc
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L7
dependencies:
  parent: docs/plans/PLAN-L6-00-master.md
  requires:
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/design/harness/L5-detailed-design/internal-processing.md
  references:
    - docs/governance/document-system-map.md
related_l0_extra: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
v2_import: docs/migration/v2-import-ledger.md
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: cross_agent
    worker_model: codex:gpt-5.4
    reviewer_model: claude:pmo-sonnet
    tests_green_at: "2026-06-09T13:00:00+09:00"
    reviewed_at: "2026-06-09T13:10:23+09:00"
    verdict: approve
    scope: "G6 L6 completion final recheck; lint/typecheck/vitest/doctor green; L6 FR coverage and guardrail coverage reviewed"
---

# PLAN-L6-02: L6 機能設計 — 関数別エッジケース + @edge-* docstring 確定

## §0 位置づけ

L6 機能設計の ① 必須 sub-doc = **edge-case**。internal-processing §7 で G5 凍結した `@edge-*` docstring 枠を、function-spec (§1/§2) の関数別に**正常/異常/境界/throws の 4 観点で展開**する (PLAN-L6-00 §2、IMP-014)。各 edge は L7 単体テスト設計の U-* と双方向 trace (孤児 0)。V-pair = L7 単体テスト設計。

## §1 設計範囲

1. function-spec §1 の各実装済関数に `@edge-normal / @edge-error / @edge-boundary / @throws` を確定
2. core 操作 (plan/gate/trace/sprint) の異常系・境界系を internal-processing §6 fail-close 形式に整合
3. 各 edge → L7 単体テスト U-* の oracle 紐付け (trace 方向)

## §2 設計計画 (Step)

1. Step 1: 実装済関数 (analyzeX/detectMode/evaluateAgentGuard/lintX/runDoctor) の 4 観点 edge
2. Step 2: core 操作 (plan draft/gate/trace/sprint) の 4 観点 edge
3. Step 3: edge↔AT/U-* trace 方針 (vmodel lint の edge 5-8 照合、carry)
4. Step 4: self-review (pmo-sonnet) → G6 readiness

## §3 carry (PLAN-L6-00 §4)

- IMP-014: `@edge-*` docstring を per-function 確定 (本 doc が正本)、L7 で実関数 docstring へ転記
- internal-processing §7: edge 5-8 形式 (`@edge-normal`→AT-01 / `@edge-error`→AT-02 / `@edge-boundary`→AT-03 / `@throws`)

## §4 DoD

- [ ] function-spec §1 の実装済関数すべてに 4 観点 edge を確定
- [ ] core 操作の異常/境界系を fail-close 形式 (internal-processing §6) に整合
- [ ] 各 edge → L7 U-* の trace 方針を記載
- [ ] artifact = `docs/design/harness/L6-function-design/edge-case.md` を pair=L7 で生成
- [ ] self-review 通過
