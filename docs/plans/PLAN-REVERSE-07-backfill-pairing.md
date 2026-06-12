---
plan_id: PLAN-REVERSE-07-backfill-pairing
title: "PLAN-REVERSE-07 (reverse/fullback): back-fill pairing 機構を上位整合へ back-fill — §1.10.E2 + 起票ルール + L0 §10 用語 (IMP-051)。新 FR 拡張 (V-pair 完全性の対象拡張)"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: fullback
drive: fullstack
status: confirmed
created: 2026-06-04
updated: 2026-06-04
owner: PM (Opus) / PO (人間)
forward_routing: L1
promotion_strategy: reuse-as-is
agent_slots:
  - role: tl
    slot_label: "TL — §1.10.E2 機械検証条件の整合 / 起票ルール (back-fill pairing) の binding 明文化 / L0 §10 用語 back-merge / doctor hard/fail-close のレビュー (claude-only は code-reviewer 代替)"
  - role: po
    slot_label: "PO — R3 intent (駆動モデルは設計まで戻すのが 1 サイクル / add-impl は Reverse 必須 / glossary back-merge は impl 完了条件 / doctor hard/fail-close) の検証 (§1.8 R3 必須)"
generates: []
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-09-backfill-pairing.md
  blocks: []
---

# PLAN-REVERSE-07 (reverse/fullback): back-fill pairing 機構を上位整合へ back-fill

## §0 位置づけ

Add-feature で bottom-up 実装した back-fill pairing 機構 (IMP-051) を上位 governance へ整合 back-fill する fullback。**この PLAN 自身が `PLAN-L7-09` を requires することで、back-fill 機構が自分自身の完全性ルールを満たす (ドグフード)**。要件拡張 = V-model pair 完全性の対象を impl⇔Reverse / impl⇔glossary へ広げる新 FR を含む (PO「DB で解決し要件を広げるべき」)。

- 駆動モデル: **Reverse / fullback** (forward 合流先 = L1)。

## §1 back-fill 内容 (R0→R4)

- **R0 観測**: 本 harness 開発で agent が impl commit 後に Reverse R4 back-fill を放置 → PO 指摘で完遂した再発ギャップ。agent 記憶依存では漏れる。
- **R1-R2 as-is 復元**: 実装済の `KIND_BACKFILL` マトリクス + `checkBackfill` (doctor)。
- **R3 intent 検証 (PO 必須)**: ①駆動モデルは「設計ドキュメントまで戻す」までが 1 サイクルでよいか ②add-impl は Reverse 合流必須 / glossary back-merge は impl 完了条件としてよいか ③doctor hard/fail-close でよいか。
- **R3 検証結果 (2026-06-04、PO 委譲「両リバースの検証と確定を完遂」+ intra_runtime_subagent + 客観 evidence)**: **全 intent HOLDS = 確定**。
  - ①HOLDS: `KIND_BACKFILL` マトリクス (src/lint/backfill-pairing.ts) が駆動モデル→back-fill 要否を表現、`analyzeBackfill` が Reverse 合流 + glossary back-merge を完全性として扱う。
  - ②HOLDS: requirements §1.10.E2 + `.claude/CLAUDE.md` 起票ルールに機械検証条件として明文化、doctor `checkBackfill` が検出、実 repo で孤児 0 / glossary gap 0 (U-BACKFILL-006)。
  - ③HOLDS: `analyzeBackfill.ok` は required orphan + glossary gap で落とし conditional は message のみ。doctor は `checkBackfillResult.ok` を `runDoctor.ok` に連動して fail-close する。
- **R4 合流 (本 PLAN で実施済)**:
  - `requirements §1.10.E2`: back-fill pairing 完全性を機械検証条件として追加。
  - `.claude/CLAUDE.md` 起票ルール: back-fill pairing (add-impl→Reverse 必須 / §6→§10 back-merge) を binding 明文化。
  - `concept §10`: back-fill pairing / KIND_BACKFILL マトリクスを用語集へ back-merge。

## §工程表

### Step 1: [直列] R3 intent を PO 検証へ提示
3 intent を平易な言葉で提示。**直列理由: downstream_dependency** (PO 承認が R4 合流の前提)。

### Step 2: [直列] R4 governance back-fill
§1.10.E2 + 起票ルール + §10 用語。**直列理由: shared_state** (governance 共有 doc を変更)。

### Step 3: [並列] review Step (self / code-reviewer)
binding (CLAUDE.md) vs 正本 (requirements) の二重明文化整合・非破壊を review (claude-only = code-reviewer 代替)。

## §実装計画

| 項目 | 情報源 |
|---|---|
| §1.10.E2 機械検証条件 | 既存資料 (実装済 checkBackfill) + IMP-051 |
| 起票ルール binding | PO 指摘 (PLAN 起票にも同ルール完備) |
| L0 §10 用語 | 設計 doc backfill-pairing.md (L6-08) |
| R3 intent | PO 検証 (本 PLAN §1 R3) |

## §6 用語更新

- **back-fill pairing / KIND_BACKFILL マトリクス**: 駆動モデルが設計まで戻す完全性とその要否正本表 (L0 §10 へ merge 済)。
