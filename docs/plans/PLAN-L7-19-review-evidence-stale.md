---
plan_id: PLAN-L7-19-review-evidence-stale
title: "PLAN-L7-19 (add-impl): review-evidence stale approval 実装 (IMP-080)"
kind: add-impl
layer: L7
drive: agent
status: confirmed
created: 2026-06-08
updated: 2026-06-12
owner: PM / Codex TL
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-12"
    tests_green_at: "2026-06-12"
    verdict: approve_after_fixes
    scope: "L7 completion audit A-135: U-REVIEW stale approval artifacts exist, target tests and full npm test green, G4/G7 codex-only checklist review passed with .ut-tdd/audit/A-135-l7-completion-review-checklist.yaml."
agent_slots:
  - role: tl
    slot_label: "TL - review-evidence analyzer 拡張"
  - role: qa
    slot_label: "QA - U-REVIEW stale approval oracle を確認"
generates:
  - artifact_path: src/lint/review-evidence.ts
    artifact_type: source_module
  - artifact_path: tests/review-evidence.test.ts
    artifact_type: test_code
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
dependencies:
  parent: docs/plans/PLAN-L6-18-review-evidence-stale.md
  requires: []
---

# PLAN-L7-19 (add-impl): review-evidence stale approval 実装 (IMP-080)

## §0 位置づけ

PLAN-L6-18 の機能設計を `src/lint/review-evidence.ts` と `tests/review-evidence.test.ts` に実装する。

## §3 工程表 (Step + 進捗)

### Step 1: [直列] ReviewEntry / parser 拡張
直列理由: file_conflict
`verdict` を抽出し、既存 tests_green_at / model 抽出を壊さない。

### Step 2: [直列] analyzer 拡張
直列理由: downstream_dependency
`staleApprovalViolations` を追加し、ok 条件へ連動する。

### Step 3: [直列] tests 追加
直列理由: downstream_dependency
draft+approve -> violation、confirmed+approve -> ok、draft+none -> ok を追加する。

### Step 4: [直列] review
直列理由: downstream_dependency
self/pmo-sonnet review で IMP-071/076/077 既存 oracle の回帰がないことを確認する。

## §3.1 実装計画

- 情報源: PLAN-L6-18、既存 `review-evidence.ts`、`tests/review-evidence.test.ts`。
- add-impl back-fill は PLAN-REVERSE-18 で受ける。

## §6 用語更新

新規 glossary term は追加しない。review_evidence の既存語彙を拡張する。

## §8 DoD

- [x] stale approval oracle が追加されている
- [x] 既存 U-REVIEW/U-XREVIEW/U-TORDER が green
- [x] PLAN-REVERSE-18 が本 PLAN を requires している
