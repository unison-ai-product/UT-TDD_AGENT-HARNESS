---
plan_id: PLAN-L7-446-model-policy-enforcement
title: "PLAN-L7-446 (add-impl): モデル選定ポリシーの残り面機械強制 (agent-guard / team lint / model_runs drift)"
kind: add-impl
layer: L7
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-16
updated: 2026-07-16
owner: PO / Claude (起票) / Codex (実装)
parent_design: docs/design/harness/L6-function-design/cross-review-enforcement.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE (Codex) - agent-guard 拡張 / teams lint / model_runs 投影と drift 検知"
review_evidence: []
generates:
  - artifact_path: docs/plans/PLAN-L7-446-model-policy-enforcement.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-86-drive-plan-admission-contract.md
  requires: []
  references:
    - docs/plans/PLAN-L7-255-delegation-model-effort-injection.md
    - docs/plans/PLAN-L7-254-judgment-gate-reviewer-tier-matrix.md
    - src/team/model-policy.ts
    - .claude/hooks/agent-guard.ts
---

# PLAN-L7-446 (add-impl): モデル選定ポリシーの残り面機械強制

## 背景 (PO 指摘 2026-07-16)

「駆動モデルを適切に選んでいない」。task-kind 割当 / effort ladder (PO rule 2026-07-14) は
正規委譲経路では PLAN-L7-255 で機械強制されたが、他の launch 面は素通り:

- Claude Agent tool: agent-guard は tier floor のみで、task-kind → モデル割当・ladder 既定
  effort を検証しない (floor 超えなら off-policy でも通る)。
- `ut-tdd team run`: teams yaml のモデル/effort 指定にポリシー検証なし。
- `escalateShallowResponse` (浅い応答の 1 段引き上げ) は呼び出し経路がなく死んでいる。
- 実行実績の観測面 (`model_runs` 投影) が未実装で、off-policy 実行を事後検出できない
  (PLAN-L7-255 の残 DoD)。

## スコープ

1. **agent-guard 拡張**: floor 検査に加え、prompt から `inferTaskIntent` 相当で task-kind を推定し、
   PO 割当モデル・ladder 既定 effort との突合を行う。逸脱は warn-first (Phase 0)、
   PO 判断で fail-close (Phase 1) へ昇格 (PLAN-L7-254 §3 と同型の段階導入)。
2. **team 定義 lint**: teams yaml を `MODEL_IDS` / `MODEL_EFFORT_LADDER` / `REVIEW_LANE_MODELS` で
   スキーマ検証し、doctor チェックに組み込む (ladder 外 effort / lane 違反 / 未登録モデルを fail)。
3. **model_runs telemetry 投影 + `model-policy-drift` doctor チェック**: 委譲・subagent 実行の
   model/effort/routing source を harness.db へ投影し、ポリシーとの突合で off-policy 実行を
   検出して feedback event 化する (まず観測、強制は 1 の Phase に従う)。
4. **`escalateShallowResponse` の配線**: advisor / 委譲リトライ経路から呼び、浅い応答時の
   1 段エスカレーションを実際に効かせる (最小配線でよい)。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | agent-guard task-kind/ladder 突合 (warn-first) + test | 直列 |
| 2 | teams yaml lint + doctor 配線 + test | 並列可 (Step 1 と独立) |
| 3 | model_runs 投影 + drift 検知 + test | 並列可 |
| 4 | escalateShallowResponse 配線 + test | 並列可 |
| 5 | typecheck + targeted green + doctor 実走 | 直列 (最後) |

## DoD

- [ ] off-policy な subagent model/effort が warn surface される (test 固定)
- [ ] ladder 外 effort / lane 違反の teams yaml が doctor で fail する (test 固定)
- [ ] 委譲実行の model/effort/source が model_runs へ投影され drift 検出できる (test 固定)
- [ ] 浅い応答エスカレーションが呼び出し経路を持つ (test 固定)
- [ ] 正当なポリシー準拠実行を誤検知しない (test 固定)
