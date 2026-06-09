---
plan_id: PLAN-L6-18-review-evidence-stale
title: "PLAN-L6-18 (add-design): review-evidence stale approval 双方向化 (IMP-080)"
kind: add-design
layer: L6
drive: agent
status: confirmed
created: 2026-06-08
updated: 2026-06-08
owner: PM / Codex TL
agent_slots:
  - role: tl
    slot_label: "TL - draft/降格 PLAN に approve 証跡が残る stale approval を設計"
generates:
  - artifact_path: docs/design/harness/L6-function-design/review-evidence.md
    artifact_type: design_doc
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
dependencies:
  parent: docs/plans/PLAN-L6-12-review-evidence.md
  requires: []
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

# PLAN-L6-18 (add-design): review-evidence stale approval 双方向化 (IMP-080)

## §0 位置づけ

IMP-071 は confirmed/completed に review_evidence を要求する片方向だった。un-freeze 後の draft PLAN に `verdict: approve` が残る stale approval を検出し、freeze 取り下げ残骸を止める。

## §3 工程表 (Step + 進捗)

### Step 1: [直列] stale approval rule 設計
直列理由: downstream_dependency
`status` が confirmed/completed 以外で approve/pass 系 verdict を持つ PLAN を violation とする。

### Step 2: [直列] ReviewEntry 拡張設計
直列理由: downstream_dependency
`extractReviewEntries` で `verdict` を抽出し、既存 U-XREVIEW/U-TORDER と共存させる。

### Step 3: [直列] message / doctor 挙動設計
直列理由: downstream_dependency
既存 `checkReviewEvidence` hard 経路に staleApprovalViolations を追加する。

### Step 4: [直列] review
直列理由: downstream_dependency
self/pmo-sonnet review で draft+approve / confirmed+approve / draft+none の oracle を確認する。

## §3.1 実装計画

- 情報源: PLAN-L6-12、`src/lint/review-evidence.ts`、C-1 監査結果。
- L7 で `ReviewEntry.verdict`、`staleApprovalViolations`、U-REVIEW-007/008 を追加する。

## §6 用語更新

新規 glossary term は追加しない。review_evidence の逆方向検査として扱う。

## §8 DoD

- [ ] draft + approve が stale approval として検出される
- [ ] confirmed + approve と draft + 証跡なしは ok
