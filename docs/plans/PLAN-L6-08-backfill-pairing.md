---
plan_id: PLAN-L6-08-backfill-pairing
title: "PLAN-L6-08 (add-design): 駆動モデル back-fill pairing 完全性の機能設計 — KIND_BACKFILL マトリクス + impl⇔Reverse / impl⇔glossary 検査 (IMP-051)"
kind: add-design
layer: L6
drive: fullstack
status: confirmed
created: 2026-06-04
updated: 2026-06-04
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — KIND_BACKFILL 要否マトリクスの妥当性 (どの駆動が設計へ戻す義務を負うか) / Reverse pairing の向き (reverse.requires→impl) / glossary 照合の表記ゆれ吸収 (normalizeTerm) / doctor hard/fail-close のレビュー (claude-only は code-reviewer 代替)"
generates:
  - artifact_path: docs/design/harness/L6-function-design/backfill-pairing.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L7
github_issue_id: null
dependencies:
  parent: docs/plans/PLAN-L6-06-handover-mechanism.md
  requires: []
  blocks: []
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-05"
    tests_green_at: "2026-06-05"
    verdict: approve
    scope: "code-reviewer 事後 review APPROVE (Critical 0)。KIND_BACKFILL 要否マトリクス / analyze 純関数 + loader 分離 / U-BACKFILL 網羅。Important (normalizeTerm 単体テスト追加・checkBackfill comment 整合) は carry"
---

# PLAN-L6-08 (add-design): 駆動モデル back-fill pairing 完全性の機能設計 (IMP-051)

## §0 位置づけ

PO 指摘「実装したら Reverse でドキュメントまで戻す制御が要る / DB で解決し要件を広げるべき」を受けた機能設計。駆動モデルを整理し、bottom-up build した実装が **設計ドキュメントへ戻る (Reverse 合流 + glossary back-merge)** ことを機械が surface する完全性検査を定義する。V-model pair 完全性 ([[feedback_vmodel_state_db_completeness]]) を impl⇔Reverse / impl⇔glossary へ拡張する。本 harness 開発で実際に「impl 後 Reverse 放置 → PO 指摘」が起きた再発防止が動機。

- 駆動モデル: **Add-feature** (本機構自身を Add-feature で作りドグフード)。
- 親: `PLAN-L6-06-handover-mechanism` (handover discipline と同型の規律機械化、drive=fullstack 一致)。

## §1 設計する責務

設計 doc 正本 = `docs/design/harness/L6-function-design/backfill-pairing.md`。要約:
- **KIND_BACKFILL マトリクス**: kind→back-fill 要否 (required/conditional/none)。駆動モデル整理の機械正本。
- **checkReversePairing**: `kind=reverse` の `requires` が指す impl を「back-fill 済」とし、required (add-impl) で未参照 = 孤児。
- **checkGlossaryMerge**: PLAN §6 用語更新 の宣言語を L0 §10 用語集と照合 (`normalizeTerm` で複合ラベルの表記ゆれ吸収)。
- **surface**: `ut-tdd doctor` が hard/fail-close (reverseOrphans/glossaryGaps)。conditionalPending は message surface のみ。

テスト設計 (③) = L7-unit-test-design.md §1.11 U-BACKFILL。

## §工程表

### Step 1: [直列] 設計 doc 起草 (backfill-pairing.md)
KIND_BACKFILL マトリクス + 2 検査の DbC。**直列理由: downstream_dependency** (Step 2 テスト設計が関数 signature に依存)。

### Step 2: [直列] テスト設計 back-fill (U-BACKFILL)
L7-unit-test-design.md に §1.11 追記。**直列理由: downstream_dependency**。

### Step 3: [並列] review Step (self / code-reviewer)
マトリクス妥当性・pairing の向き・表記ゆれ吸収を review (claude-only = code-reviewer 代替)。

### Step 4: [直列] 用語更新
§6 用語更新。**直列理由: shared_state** (共有 glossary を更新)。

## §実装計画

| 項目 | 情報源 |
|---|---|
| KIND_BACKFILL 要否 | PM 判断 (駆動モデル整理: bottom-up=required / forward=none / reverse・recovery=戻す本体) + concept §2.5 9-mode |
| Reverse pairing の向き | 既存資料 (REVERSE-0X.requires→impl の確立パターン) |
| glossary 照合 (normalizeTerm) | 既存資料 (concept §10 living glossary 原則) |
| hard/fail-close 方針 | PO 提案 (handover discipline と同型、段階強制) |

## §6 用語更新

- **back-fill pairing**: 駆動モデルが設計ドキュメントまで戻す完全性 (Reverse 合流 + glossary back-merge)。
- **KIND_BACKFILL マトリクス**: kind→back-fill 要否の正本表。
- (用語集本体 = L0 §10 への back-merge は `PLAN-REVERSE-07` で実施)
