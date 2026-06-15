---
plan_id: PLAN-L7-54-merged-plan-status-gate
title: "PLAN-L7-54: merged-plan-status hard gate — merge 済み artifact + draft PLAN の不整合検出"
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
    scope: "merged-plan-status hard gate (analyzeMergedPlanStatus 純関数 + loadMergedPlanStatusInput loader + checkMergedPlanStatus doctor 配線 + 6→8 unit/integration テスト)。検出規則 (kind ∈ {impl,add-impl,refactor} かつ status ∉ {confirmed,completed,accepted} かつ generates src 実在 → violation)、fail-open(docs/plans不在)/fail-close(repo root 不在) の使い分け、review-evidence gate との相補 (status 正確性 vs 証跡要求、別関心) を検証。Critical=0、APPROVE。Important I-1 (refactor の kind 集合非対称) / I-2 (accepted 扱い) は意図的 scope 差として merged-plan-status.ts に明文化、Minor (add-impl/refactor/accepted テスト) は追加で対応。"
agent_slots:
  - role: tl
    slot_label: "TL - merged-plan-status integrity gate 設計 + 配線"
generates:
  - artifact_path: src/lint/merged-plan-status.ts
    artifact_type: source_module
  - artifact_path: tests/merged-plan-status.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-51-descent-obligation.md
  requires:
    - docs/design/harness/L4-basic-design/architecture.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-54: merged-plan-status hard gate

## Objective

設計の柱3 (自動化で V-model state DB を管理しフィードバック機構にする) の実体化。**generated src
artifact が repo に merge 済みなのに owning PLAN が draft / 未 confirm のまま放置される**不整合を
doctor が fail-close 検出する。

**動機 (PO 指摘 2026-06-15)**: PLAN-L7-53 (Learning Engine) は kind=impl の実装が main に merge
済・全テスト green だったが status=draft + review_evidence=[] のまま放置され、**人手 grep でしか
発見できなかった**。既存 review-evidence gate は confirmed/completed PLAN にのみ証跡を要求するため、
draft の PLAN は素通りする (absence-blindness、[[feedback_coverage_not_substance]] / descent
absence-blindness と同型)。state DB が「フィードバック機構」なら、この不整合は機械が surface すべき。

## WBS

| WBS ID | Work | Source target | Test target | Gate | 並直 |
|---|---|---|---|---|---|
| WBS-L7-54-01 | `analyzeMergedPlanStatus` 純関数 + `loadMergedPlanStatusInput` loader + `mergedPlanStatusMessages`。規則 = 産出 kind × 未 confirm × src 実在 → violation | `src/lint/merged-plan-status.ts` | `tests/merged-plan-status.test.ts` | `vitest tests/merged-plan-status.test.ts` | [直列] |
| WBS-L7-54-02 | `checkMergedPlanStatus` を doctor へ配線 (runDoctor.ok 連動、hard gate) + 配線メタテスト + fail-close 列挙登録 | `src/doctor/index.ts` | `tests/doctor.test.ts` | `ut-tdd doctor` + `vitest tests/doctor.test.ts` | [直列] |

## Acceptance Criteria

- [x] draft の artifact-producing PLAN で generates src が実在 (merged) → violation・doctor ok=false。
- [x] confirmed/completed/accepted PLAN は merged artifact ありでも violation にしない。
- [x] draft でも src 未 merge (真に作業中) は violation にしない (false-positive 防止)。
- [x] design/poc 等 非産出 kind は対象外。
- [x] docs/plans 不在は fail-open、repo root 不在は fail-close。
- [x] review-evidence gate と相補 (status 正確性 vs 証跡要求、別関心) を code 明文化。
- [x] 実 repo で merged-plan-status OK (PLAN-L7-53 を confirmed 化後、他に違反なし)。
- [x] typecheck / biome / 全 vitest / doctor green。
- [x] review 前置: code-reviewer (intra_runtime_subagent) verdict=APPROVE。Important は意図的 scope 差として明文化、Minor はテスト追加で対応。

## 壊さない / 再発させない

- **本 gate は status 正確性を強制する** = src を merge したら PLAN を draft のままにしない。これを緩める
  (artifact-producing kind を外す / draft を許す) と PLAN-L7-53 同型の放置が再発する。
- **review-evidence gate との二重 gate で absence-blindness を塞ぐ**: 本 gate (merge→confirm 強制) +
  review-evidence (confirm→証跡要求)。片方だけにしない。
