---
plan_id: PLAN-REVERSE-10-vmodel-pair-lint
title: "PLAN-REVERSE-10 (reverse/fullback): vmodel pair-freeze lint を上位整合へ — requirements §6.8.3/§2.4 整合確認 + L6 doc frontmatter 規約 + concept §10 用語 back-fill (IMP-067)"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: fullback
drive: agent
status: confirmed
created: 2026-06-05
updated: 2026-06-12
owner: PM (Opus) / PO (人間)
forward_routing: L3
promotion_strategy: reuse-as-is
agent_slots:
  - role: tl
    slot_label: "TL — pair-freeze lint が requirements §6.8.3 (設計 PLAN 完了 PR で vmodel-lint 必須) / §2.4 (12 edge は別) の既存定義と矛盾しないか / L6 6 doc の frontmatter 補完が pair freeze 規約に整合するか / concept §10 用語追加の妥当性のレビュー (claude-only は code-reviewer 代替)"
  - role: po
    slot_label: "PO — R3 intent (設計層 pair freeze を機械検査してよいか / L6 機能設計 doc の frontmatter 必須化 / pair-freeze は hard/fail-close 導入でよいか) 検証。PO /goal 2026-06-05「カバーすべき機能を起票して対応 + doc カバレッジ review・改善 + チェック機構も改修」で授権済"
generates: []
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-11-vmodel-pair-lint.md
  references:
    - docs/plans/PLAN-L6-10-vmodel-pair-lint.md
---

# PLAN-REVERSE-10 (reverse/fullback): vmodel pair-freeze lint の上位整合

## §0 位置づけ

PLAN-L6-10 (設計) / L7-11 (実装) で導入した **設計層 pair freeze lint** (design⇔test-design の pair_artifact 双方向整合・孤児0) を上位整合へ back-fill する。新規要件は追加せず (既存 FR `vmodel-lint` の設計層部分の実装)、① 既存 requirements §6.8.3/§2.4 と矛盾しないことの確認、② L6 機能設計 doc の frontmatter 必須化規約の明文化、③ concept §10 用語 (pair-freeze lint / self-pair) の back-merge を行う。

## §工程表

### Step 1: [直列] requirements 整合確認 + L6 frontmatter 規約注記
- 直列理由 = **downstream_dependency** (L7-11 実装の整合先を確認)。requirements §6.8.3 (設計 PLAN 完了 PR で vmodel-lint 必須) が pair-freeze 検査で満たされること、§2.4 の 12 edge trace とは別レイヤーであることを確認。L6 機能設計 doc は YAML frontmatter (layer/pair_artifact) を持つことを規約として明示 (HTML コメントのみは機械検査を素通りする穴、本 cycle で 6 doc 補完済)。

### Step 2: [直列] concept §10 用語 back-merge
- 直列理由 = **file_conflict** (concept §10 を編集)。「pair-freeze lint (設計層)」「self-pair」を §10 用語集へ追加 (living glossary、backfill lint の glossary gap を解消)。

### Step 3: [直列] review Step (intra_runtime_subagent)
- 直列理由 = **downstream_dependency**。code-reviewer で上位整合の正しさ (既存定義と非矛盾) をレビュー。

## §実装計画

- **requirements/concept** (情報源: PLAN-L6-10 設計 + 既存 §6.8.3/§2.4): 既存定義との非矛盾確認 + L6 frontmatter 規約注記 + §10 用語追加。
- back-fill の向き = 「Reverse (本 PLAN) が impl (L7-11) を requires」(doctor backfill が pairing を辿る)。

## §6 用語更新

- **pair-freeze lint (設計層)**: design doc (①) ⇔ test-design doc (③) の `pair_artifact` 双方向整合・孤児0 を検査する vmodel lint の設計層部分 (G1-G6 pair freeze の機械担保、requirements §6.8.3)。G7 の 4 artifact 12 edge trace とは別レイヤー。→ concept §10 へ back-merge (本 PLAN Step 2)。
- **self-pair**: `pair_artifact: self` の doc (wireframe mock 自体が③ペア、L2⇔L10、IMP-039/058)。pair-freeze lint は孤児扱いしない。→ concept §10 へ back-merge。

## §7 DoD
- [x] requirements §6.8.3/§2.4 との非矛盾確認 + L6 frontmatter 規約注記
- [x] concept §10 に「pair-freeze lint (設計層)」「self-pair」を back-merge (glossary gap 解消)
- [x] doctor backfill 行で本 cycle の Reverse 孤児 0 / glossary gap 0 を確認
- [x] review 前置 (code-reviewer)
