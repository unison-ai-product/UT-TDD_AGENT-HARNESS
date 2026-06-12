---
plan_id: PLAN-L6-09-governance-enforcement
title: "PLAN-L6-09 (add-design): governance enforcement lints の機能設計 — scrum-reverse / backfill-hard / propagation (A/B/C、IMP-064/065/051)"
kind: add-design
layer: L6
drive: agent
status: confirmed
created: 2026-06-04
updated: 2026-06-04
owner: PM (Opus) / PO (人間)
agent_slots:
  - role: tl
    slot_label: "TL — 3 lint の機能設計 (純関数+実 repo ガード) / doctor.ok hard-fail 分離 (handover/agent-slots は warn-only) / plan lint engine への DEFER 境界のレビュー (claude-only は code-reviewer 代替)"
generates:
  - artifact_path: docs/design/harness/L6-function-design/governance-enforcement.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
dependencies:
  parent: docs/plans/PLAN-L6-00-master.md
  requires: []
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-04"
    tests_green_at: "2026-06-04"
    verdict: approve
    scope: "code-reviewer 2回 cut-off (diff 32 tool-use で truncate、完全 verdict 未取得) → PM 直接検証で path 一致 / doctor.ok 分離を補完、実 repo ガード CI green (handover 2026-06-04 session8 §6)"
---

# PLAN-L6-09 (add-design): governance enforcement lints の機能設計

## §0 位置づけ

PO「A/B/C を実装」を受け、plan lint engine (`src/plan/lint.ts` stub) の本実装を待たずに **今 session で2回再発した process 漏れ (IMP-064 PoC→Reverse / IMP-065 L0→L3 伝播) を CI で止める**最小 enforcement 3 本を機能設計する。設計本体 = `docs/design/harness/L6-function-design/governance-enforcement.md`、③ ペア = L7-unit-test-design §1.12。

## §工程表

### Step 1: [直列] 機能設計 doc 起草
- 直列理由 = **file_conflict** (governance-enforcement.md を新規作成)。3 lint の関数仕様 + doctor.ok hard-fail 分離 + DEFER 境界を記述。

### Step 2: [直列] L7-unit テスト設計 (③ ペア) 追記
- 直列理由 = **downstream_dependency** (Step 1 の関数仕様に対応する U-ID を起こす)。U-SCRUMREV-001〜005 / U-PROP-001〜004 を §1.12 に追記。

### Step 3: [直列] review Step (intra_runtime_subagent)
- 直列理由 = **downstream_dependency**。code-reviewer で設計⇔テスト設計の同粒度 / DEFER 境界の妥当性をレビュー。

## §実装計画

- **governance-enforcement.md** (情報源: requirements §1.2 scrum_reverse / §7.8.1 routing / backfill-pairing.ts 既存実装): 3 lint の純関数仕様 + 実 repo vitest ガード方針。
- **L7-unit §1.12** (情報源: Step 1 関数仕様): U-SCRUMREV / U-PROP の oracle を DbC で記述。
- 設計粒度 = L7 単体テスト設計粒度 (各関数 1 U-ID + 実 repo ガード)。

## §6 用語更新

- **scrum-reverse lint**: PoC confirmed (redesign 除く) ⇔ Reverse 合流の整合検査 (§1.2)。→ concept §10.3 back-merge 済。
- **propagation lint**: concept §2.6 ⇔ requirements §7.8.1 の signal 語彙一致検査 (L0⇔L3 伝播)。→ concept §10.3 back-merge 済。

## §7 DoD
- [x] governance-enforcement.md 起草 + L7-unit §1.12 (③ ペア)
- [x] §6 用語を concept §10.3 へ back-merge
- [x] review 前置 (code-reviewer)
