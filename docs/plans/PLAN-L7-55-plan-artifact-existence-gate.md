---
plan_id: PLAN-L7-55-plan-artifact-existence-gate
title: "PLAN-L7-55: plan-artifact-existence hard gate — 完了宣言 PLAN の phantom artifact 検出"
kind: impl
layer: L7
drive: db
parent_design: docs/design/harness/L4-basic-design/architecture.md
status: confirmed
created: 2026-06-15
updated: 2026-06-15
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
    tests_green_at: "2026-06-15"
    reviewed_at: "2026-06-15"
    verdict: pass
    scope: "plan-artifact-existence hard gate (analyzePlanArtifactExistence 純関数 + loadPlanArtifactExistenceInput loader + checkPlanArtifactExistence doctor 配線 + 6 unit/integration テスト)。検出規則 (status ∈ {confirmed,completed,accepted} かつ generates[].artifact_path が existsSync=false → phantom violation)、draft 等未確定 status の loader pre-filter (false-positive 回避)、artifact_type 非限定 (src/tests/design/test-design 全対象)、fail-open(docs/plans不在)/fail-close(repo root 不在) を検証。merged-plan-status (PLAN-L7-54) との鏡像相補 (実在×未confirm vs 完了×不在) を確認。実 repo 163 完了 PLAN で phantom 0 = green。"
agent_slots:
  - role: tl
    slot_label: "TL - plan-artifact-existence (phantom/false-completion) gate 設計 + 配線"
generates:
  - artifact_path: src/lint/plan-artifact-existence.ts
    artifact_type: source_module
  - artifact_path: tests/plan-artifact-existence.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-54-merged-plan-status-gate.md
  requires:
    - docs/design/harness/L4-basic-design/architecture.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-55: plan-artifact-existence hard gate

## Objective

設計の柱3 (自動化で V-model state DB を管理しフィードバック機構にする) + 柱6 (テストなし完了宣言禁止の
機械担保) の実体化。**PLAN が confirmed/completed/accepted (完了宣言) なのに、その `generates` で宣言した
artifact がディスク上に存在しない** (phantom / false-completion) 不整合を doctor が fail-close 検出する。

**動機 (PO /goal 2026-06-15、absence-blindness 掃討)**: PLAN-L7-54 (merged-plan-status) は
「artifact が merge 済みなのに PLAN が draft」を検出するが、その**鏡像** = 「PLAN は完了済みなのに
artifact が不在」は全 gate を素通りしていた:

- `merged-plan-status` は status が未 confirm のときだけ発火 → confirmed/completed/accepted を skip。
- `impl-plan-trace` は src→PLAN 方向 (孤児 src) のみ → PLAN→artifact 実在 (欠落) を見ない。
- `review-evidence` は証跡の有無を見るだけ → artifact 実在は見ない。

結果、completed の PLAN が `generates: src/foo.ts` を宣言していても foo.ts が未作成 / 後に削除されて
いれば、state DB は plan_registry を completed・artifact_registry を欠損のまま投影し、**人手 grep で
しか気付けない** (L7-53 phantom 放置と同型の false-confidence、[[feedback_coverage_not_substance]] /
descent absence-blindness)。

これにより PLAN↕artifact 実在マトリクスが 2 gate で完結する:

| | artifact 実在 (merged) | artifact 不在 |
|---|---|---|
| **未 confirm / draft** | merged-plan-status が検出 (L7-54) | OK (作業中) |
| **完了 (confirmed/completed/accepted)** | OK | **plan-artifact-existence が検出 (本 PLAN)** |

## WBS

| WBS ID | Work | Source target | Test target | Gate | 並直 |
|---|---|---|---|---|---|
| WBS-L7-55-01 | `analyzePlanArtifactExistence` 純関数 + `loadPlanArtifactExistenceInput` loader + `planArtifactExistenceMessages`。規則 = 完了 status × generates artifact 不在 → violation。loader が完了 status を pre-filter + existsSync で欠落抽出 | `src/lint/plan-artifact-existence.ts` | `tests/plan-artifact-existence.test.ts` | `vitest tests/plan-artifact-existence.test.ts` | [直列] |
| WBS-L7-55-02 | `checkPlanArtifactExistence` を doctor へ配線 (runDoctor.ok 連動、hard gate) + 配線 (宣言/ok集約/messages 3点) | `src/doctor/index.ts` | `tests/doctor.test.ts` | `ut-tdd doctor` + `vitest tests/doctor.test.ts` | [直列] |

## Acceptance Criteria

- [x] completed/confirmed/accepted PLAN で generates artifact が不在 → violation・doctor ok=false。
- [x] 完了 status で generates artifact が全て実在 → violation にしない。
- [x] draft 等未確定 status は loader で pre-filter (artifact 不在でも violation にしない、false-positive 防止)。
- [x] artifact_type を限定しない (src / tests / design doc / test-design いずれも対象)。
- [x] docs/plans 不在は fail-open、repo root 不在は fail-close。
- [x] merged-plan-status gate と相補 (実在×未confirm vs 完了×不在、鏡像で重複なし) を code 明文化。
- [x] 実 repo で plan-artifact-existence OK (163 完了 PLAN で phantom 0)。
- [x] typecheck / biome / 全 vitest / doctor green。
- [x] review 前置: code-reviewer (intra_runtime_subagent, cross-model) verdict=APPROVE。

## 壊さない / 再発させない

- **本 gate は「完了と言うなら artifact を実在させよ」を強制する**。これを緩める (完了 status を外す /
  artifact_type を src 限定にする) と phantom artifact 放置 (C-5 agent が残した phantom skill 同型) が再発する。
- **merged-plan-status との 2 gate で PLAN↕artifact 実在マトリクスを完結させる**: 片方だけにしない。
- loader は完了 status を pre-filter する (draft を analyzer に渡さない) ことで false-positive を構造的に防ぐ。
  analyzer 側も COMPLETED_STATUSES で二重に絞る (loader バイパスでも安全)。

## Carry / 別 scope (本 PLAN 範囲外、telemetry/auth 依存で infra 未整備)

- **guardrail decision ledger 本番配線**: `recordGuardrailDecision` の runtime 書込経路は依然未配線
  (C-1A 系、auth-gated)。guardrail_decisions テーブルが空でも検出する gate は telemetry/auth 整備後。
- **Learning Engine staleness gate**: skill/poc/model_evaluations は cold-start (0 行) を許すが、
  telemetry が存在するのに評価が stale/欠落を検出する gate は FR-38 cost telemetry 配線後 (named defer)。
