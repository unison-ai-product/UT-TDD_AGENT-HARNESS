---
plan_id: PLAN-L6-12-review-evidence
title: "PLAN-L6-12 (add-design): review 前置の機械強制 — review_evidence 機能設計 (confirmed design/impl PLAN が review 証跡なしで素通りするのを doctor が surface、IMP-071)"
kind: add-design
layer: L6
drive: agent
status: confirmed
created: 2026-06-05
updated: 2026-06-05
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — review_evidence の対象 kind/status 選定 (過検知回避) / hasEvidence presence 検出の堅牢性 / concept §2.1.2.1 review tier との整合 / 既存 backfill-pairing lint との非重複のレビュー (claude-only は code-reviewer 代替)"
generates:
  - artifact_path: docs/design/harness/L6-function-design/review-evidence.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-05"
    tests_green_at: "2026-06-05"
    verdict: approve_after_fixes
    scope: "review-evidence 機能設計 + L7-13 実装一式 (APPROVE 条件付き → I-1 loader 堅牢性 / I-2 テストコメント / m-3/m-4 修正後)。cross-agent 不在=claude-only intra_runtime_subagent 代替"
dependencies:
  parent: docs/plans/PLAN-L6-00-master.md
  requires: []
---

# PLAN-L6-12 (add-design): review 前置の機械強制 (review_evidence) 機能設計

## §0 位置づけ

PO 指摘「§3.6 を review 前置スキップで freeze → 設計上の問題は許さない」を受ける。**review 前置 MUST (CLAUDE.md / requirements §7.8.7 / concept §2.1.2.1) が doc-only で機械強制ゼロ** (src grep 0 / plan lint=stub / doctor 非検査) のため、freeze (status→confirmed) / commit が review 証跡なしで素通りした (harness が柱 2「doc×機械厳格化」を自分のレビュー規律で破る under-design、IMP-071)。concept §2.1.2.1 は「review 記録が無ければ gate を exit 1」と機械ゲート設計済だが未実装だった穴を塞ぐ。本体 = `review-evidence.md`、③ ペア = L7-unit (U-REVIEW)。実装 = PLAN-L7-13。

## §工程表

### Step 1: [直列] 機能設計 doc 起草
- 直列理由 = **file_conflict** (review-evidence.md を新規作成)。`analyzeReviewEvidence` / `loadReviewPlans` / `hasReviewEvidence` の純関数仕様 + 対象選定規約 (KIND_REVIEW_REQUIRED = design/add-design/impl/add-impl、STATUS = confirmed/completed、過検知回避の根拠) + review_evidence schema (reviewer/review_kind/reviewed_at/verdict/scope) を記述。

### Step 2: [直列] L7-unit テスト設計 (③ ペア) 追記
- 直列理由 = **downstream_dependency** (Step 1 の関数仕様に対応する U-ID)。U-REVIEW-001〜006 を §1.15 に追記。

### Step 3: [直列] review Step (intra_runtime_subagent)
- 直列理由 = **downstream_dependency**。code-reviewer で対象選定の過検知回避 / concept §2.1.2.1 review tier 整合 / 既存 backfill-pairing との非重複をレビュー。

## §実装計画

- **review-evidence.md** (情報源: concept §2.1.2.1 review tier + requirements §7.8.7 + backfill-pairing.ts pattern): review 前置証跡の純関数仕様 + warn-first→hard の段階方針 + freeze 後増分追補も entry append。
- **L7-unit §1.14** (情報源: Step 1): U-REVIEW の oracle。
- 設計粒度 = L7 単体テスト設計粒度。

## §6 用語更新 (living glossary delta)

| 用語 | 種別 | 定義 / 変更点 | L0 §10 back-merge |
|---|---|---|---|
| **review_evidence** | 確定 | design/impl/add-* PLAN が confirmed (gate/freeze 到達) 前に通した review 前置を frontmatter に構造記録する証跡 (reviewer / review_kind=cross_agent\|intra_runtime_subagent\|human / reviewed_at / verdict / scope)。doctor checkReviewEvidence が未記録を surface (review-skip の silent 化を機械で塞ぐ、IMP-071) | back-merge (REVERSE-12) |

## §7 機能要求更新 (FR registry delta)

> **機能要求更新なし**。review_evidence は既存 review 前置 MUST (requirements §7.8.7) の機械強制であり、新規 FR-L1 を生まない。

## §8 DoD

- [x] review-evidence.md 起草 + L7-unit §1.15 (③ ペア U-REVIEW)
- [x] §6 用語を concept §10 へ back-merge (REVERSE-12)
- [x] review 前置 (code-reviewer、claude-only 代替記録) → 通過後 review_evidence 記録 + confirmed flip
