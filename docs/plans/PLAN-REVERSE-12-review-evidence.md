---
plan_id: PLAN-REVERSE-12-review-evidence
title: "PLAN-REVERSE-12 (reverse/back-fill): review_evidence 機械強制を governance へ合流 — requirements §7.8.7 機械強制注記 + concept §10 用語 back-merge (IMP-071、L7-13 の back-fill pairing)"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: agent
status: confirmed
created: 2026-06-05
updated: 2026-06-05
owner: PM (Opus) / PO (人間)
forward_routing: gap-only
promotion_strategy: reuse-as-is
agent_slots:
  - role: tl
    slot_label: "TL — requirements §7.8.7 への機械強制注記の整合 / concept §2.1.2.1 review tier との一貫性レビュー"
generates:
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-05"
    tests_green_at: "2026-06-05"
    verdict: approve_after_fixes
    scope: "requirements §7.8.7 機械強制注記 + concept §10 用語 back-merge (L7-13 と同一 review に内包、claude-only intra_runtime_subagent 代替)"
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-05"
    tests_green_at: "2026-06-05"
    verdict: approve_after_fixes
    scope: "hard 化 (runDoctor.ok 連動 + U-REVIEW-006 missing==[] 昇格) + 履歴 15 件 back-fill の honesty (転記/事後 review/truncate 明記)。APPROVE Critical 0、Important 2 (warn-first コメント残留) 修正後"
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-13-review-evidence.md
---

# PLAN-REVERSE-12 (reverse/back-fill): review_evidence を governance へ合流

## §0 位置づけ

PLAN-L7-13 (add-impl) の bottom-up build を上位 governance へ合流させる back-fill pairing (IMP-051、add-impl → Reverse 必須)。`dependencies.requires` に L7-13 を宣言し doctor checkBackfill の「Reverse 無き impl」検知を満たす。**review 前置 MUST の機械強制化** (doc-only → doctor checkReviewEvidence) を requirements §7.8.7 に注記 + concept §10 用語 (review_evidence) を back-merge。

## §工程表

### Step 1: [直列] requirements §7.8.7 へ機械強制注記
- 直列理由 = **file_conflict** (requirements を書く)。「review 前置 MUST は doctor checkReviewEvidence (review_evidence、warn-first→hard) で機械強制 (IMP-071)」を §7.8.7 に追記。concept §2.1.2.1 の「review 記録なければ gate exit 1」の実装着地を明示。

### Step 2: [直列] concept §10 用語 back-merge
- 直列理由 = **downstream_dependency**。L6-12 §6 の review_evidence を concept §10.3 機構用語へ merge (doctor checkBackfill の glossary gap 検知を満たす)。

### Step 3: [直列] review Step (intra_runtime_subagent)
- 直列理由 = **downstream_dependency**。code-reviewer で governance 整合をレビュー。通過後 confirmed flip。

## §実装計画

- **requirements §7.8.7** (情報源: L7-13 実装 + concept §2.1.2.1): review 前置の機械強制注記。
- **concept §10.3** (情報源: L6-12 §6): review_evidence 用語 back-merge。

## §6 用語更新

> back-merge 実施側 (L6-12 §6 の review_evidence を concept §10 へ merge する Reverse)。新規語の追加なし。

## §8 DoD

- [x] requirements §7.8.7 機械強制注記 + concept §10 用語 back-merge
- [x] doctor checkBackfill green (L7-13 が Reverse 合流済 = 孤児0 / glossary merge 済)
- [x] review 前置 (code-reviewer) → 通過後 confirmed flip
- [x] **hard 化 (2026-06-05、back-fill 完了後)**: 履歴 15 件を back-fill (missing 29→0、L6-08/L7-09 は code-reviewer 事後 review、L6-09/L7-10 は truncate を scope 明記) → `runDoctor.ok` に `reviewEvidence.ok` 連動 + U-REVIEW-006 を `missing==[]` へ昇格 (CI fail-close、U-BACKFILL-006 と同パターン)。**新規 design/impl PLAN の review-skip freeze が機械で止まる状態が完成**
