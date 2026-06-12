---
plan_id: PLAN-REVERSE-13-cross-review-enforcement
title: "PLAN-REVERSE-13 (reverse/back-fill): cross-review semantic 強制を governance へ合流 — concept §2.1.2.1 / requirements §7.8.7 の「実行時強制」に機械着地を明示 (IMP-076)"
kind: reverse
layer: cross
drive: agent
status: confirmed
created: 2026-06-05
updated: 2026-06-05
owner: PM (Opus) / PO (人間)
workflow_phase: R4
forward_routing: gap-only
promotion_strategy: reuse-as-is
confirmed_reverse_type: design
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-05"
    tests_green_at: "2026-06-05"
    verdict: pass
    scope: "Add-feature (cross-review semantic 強制 IMP-076) の back-fill。concept §2.1.2.1/§10.3 + requirements §7.8.7 機械着地注記 + glossary merge。pmo-sonnet PASS (Critical 0)。code-reviewer は IMP-009 truncate のため pmo-sonnet 確定。claude-only TL 代替"
agent_slots:
  - role: tl
    slot_label: "TL — concept §2.1.2.1 / requirements §7.8.7 への機械着地注記が設計意図と整合するかレビュー"
generates:
  - artifact_path: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-14-cross-review-enforcement.md
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-REVERSE-13 (reverse/back-fill): cross-review semantic 強制を governance へ合流

## §0 位置づけ

Add-feature (PLAN-L6-13 add-design + PLAN-L7-14 add-impl) の bottom-up build を、**上位 governance へ戻す**ことで 1 サイクル完結 ([[feedback_impl_must_backfill_to_design]]、IMP-051)。concept §2.1.2.1 が「`same_model_approval: forbidden` を実行時強制」と設計済の箇所に **実装着地 (review_evidence worker/reviewer_model + checkReviewEvidence crossReviewViolations) を明示注記**する。

## §工程表

### Step 1: [直列] concept §2.1.2.1 機械着地注記
- 直列理由 = **file_conflict** (concept を書く)。核心ルール 2 (same_model_approval) に「機械着地 = review_evidence worker/reviewer_model + checkReviewEvidence (IMP-076)」を注記。

### Step 2: [直列] requirements §7.8.7 + concept §10 用語
- 直列理由 = **downstream_dependency**。requirements §7.8.7 に IMP-076 着地注記 + concept §10.3 に same_model_approval / worker_model 用語 back-merge。

### Step 3: [直列] review Step (intra_runtime_subagent)
- 直列理由 = **downstream_dependency**。governance 整合をレビュー。通過後 confirmed flip。

## §実装計画

- **concept §2.1.2.1** (情報源: L7-14 実装): same_model_approval 核心ルールに機械着地注記。
- **requirements §7.8.7** (情報源: L7-14): IMP-076 着地注記。
- **concept §10.3** (情報源: L6-13 §6): same_model_approval / worker_model 用語。

## §6 用語更新

> back-merge 実施側 (L6-13 §6 の same_model_approval / worker_model / reviewer_model を concept §10 へ merge する Reverse)。新規語追加なし。

## §8 DoD

- [x] concept §2.1.2.1 + requirements §7.8.7 機械着地注記 + concept §10 用語 back-merge
- [x] doctor checkBackfill green (L7-14 が Reverse 合流済 = 孤児0 / glossary merge 済)
- [x] review 前置 (pmo-sonnet PASS) → confirmed flip
- [x] IMP-076 → implemented
