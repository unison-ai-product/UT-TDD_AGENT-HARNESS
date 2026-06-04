---
plan_id: PLAN-REVERSE-06-workflow-improvements
title: "PLAN-REVERSE-06 (reverse/fullback): workflow 改善 (IMP-047/049/050) を上位整合へ back-fill — §6.8.5 handover 強制側 + §G.4 直列/並列規約 + orchestration 用語。新 FR 不要 (process governance)"
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
    slot_label: "TL — §6.8.5 handover 強制側の明文化 / §G.4 直列・並列規約 (3条件) の整合 / orchestration 用語 back-merge / .claude/CLAUDE.md(binding) と requirements(正本) の二重明文化整合のレビュー (claude-only は code-reviewer 代替)"
  - role: po
    slot_label: "PO — R3 intent (handover-on-completion を機械 surface で強制 / 直列化は 3 条件のみが正当理由 / agent-slots は process governance で新 FR 不要) の検証 (§1.8 R3 必須)"
generates: []
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-06-handover-enforcement.md
    - docs/plans/PLAN-L7-07-handover-prefill-scope.md
    - docs/plans/PLAN-L7-08-agent-slots.md
  blocks: []
---

# PLAN-REVERSE-06 (reverse/fullback): workflow 改善を上位整合へ back-fill

## §0 位置づけ

Add-feature で bottom-up 実装した workflow 改善 3 系統 (IMP-047 handover 強制 / IMP-049 直列・並列規約 / IMP-050 agent-slots) を、**上位 governance doc へ整合 back-fill** する fullback。新 FR は起こさず、既存 §6.8 (handover = progress governance) / §G.4 (PLAN 本文構造) / 用語集の明確化のみ (IMP-048 は §6.8.5 内のノイズ低減で別 FR 不要)。

- 駆動モデル: **Reverse / fullback** (forward 合流先 = L1)。
- promotion: reuse-as-is (実装済挙動をそのまま正本へ反映)。

## §1 back-fill 内容 (R0→R4)

- **R0 観測**: IMP-047 (handover 手動忘れ) / IMP-049 (直列化理由未記録) / IMP-050 (Layer-2 欠落) の 3 ギャップ。
- **R1-R2 as-is 復元**: 実装済の checkHandoverDiscipline (Stop-hook + doctor) / §G.4 直列・並列トークン規約 / agent-slots + team schema。
- **R3 intent 検証 (PO 必須)**: ①handover-on-completion を agent 記憶でなく機械 surface で強制してよいか ②直列化は 3 条件 (file_conflict/downstream_dependency/shared_state) のみを正当理由とし「重いから直列」を排してよいか ③agent-slots は process governance (新 FR 不要) でよいか。
- **R3 検証結果 (2026-06-04、PO 委譲「両リバースの検証と確定を完遂」+ intra_runtime_subagent + 客観 evidence)**: **全 intent HOLDS = 確定**。
  - ①HOLDS: `checkHandoverDiscipline` (src/handover/index.ts) + Stop-hook (.claude/hooks/session-log.ts、fail-open) + doctor `checkHandover` の 3 機構で機械 surface (U-HOVER-010)。
  - ②HOLDS: `.claude/CLAUDE.md` + requirements §G.4 に 3 条件明文化 / `mustSerialize` が 3 条件 OR (U-TEAM-002)。
  - ③HOLDS: 新 FR 起こさず (`tests/fr-registry-audit.test.ts` 9 pass = FR drift なし)、§6.8/§G.4/§10 の明確化に留まる。
- **R4 合流 (本 PLAN で実施済)**:
  - `.claude/CLAUDE.md`: §G.4 注入規則に直列/並列明示 + 3 条件、並列実行節に機械支援 (agent-slots/doctor/team schema) を追記。
  - `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md` §G.4: 直列/並列トークン規約 (IMP-049) を機械検証条件として追記。
  - handover §6.8.5 の強制側 (checkHandoverDiscipline) は実装で具現化済 (用語 back-fill のみ残)。

## §工程表

### Step 1: [直列] R3 intent を PO 検証へ提示
3 intent を平易な言葉で提示し PO の OK を得る。**直列理由: downstream_dependency** (PO 承認が R4 合流の前提)。

### Step 2: [直列] R4 governance back-fill (.claude/CLAUDE.md + requirements §G.4)
直列/並列規約 + 機械支援を明文化。**直列理由: shared_state** (governance 共有 doc を変更)。

### Step 3: [並列] review Step (self / code-reviewer)
二重明文化 (binding vs 正本) の整合・非破壊を review (claude-only = code-reviewer 代替)。

### Step 4: [直列] 用語集 back-fill
agent-slot / 直列化 3 条件 / handover discipline / peak_parallel を用語集へ。**直列理由: shared_state**。

## §実装計画

| 項目 | 情報源 |
|---|---|
| §6.8.5 handover 強制側の明文化 | 既存資料 (実装済 checkHandoverDiscipline) + IMP-047 |
| §G.4 直列/並列規約 (3条件) | IMP-049 backlog + team.ts mustSerialize |
| orchestration 用語 | 設計 doc agent-slots.md (L6-07) |
| R3 intent | PO 検証 (本 PLAN §1 R3) |

## §6 用語更新

- **handover discipline**: PLAN 活動があるのに CURRENT.json が未生成/stale/drift の状態を機械が warn する規律 (IMP-047)。
- **直列化 3 条件**: file_conflict / downstream_dependency / shared_state (IMP-049)。
- **agent-slot / peak_parallel**: Layer-2 オーケストレーションの記録単位 / 同時実行ピーク (IMP-050)。
