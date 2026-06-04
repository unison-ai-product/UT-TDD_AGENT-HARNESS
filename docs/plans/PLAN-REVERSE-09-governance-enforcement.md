---
plan_id: PLAN-REVERSE-09-governance-enforcement
title: "PLAN-REVERSE-09 (reverse/fullback): governance enforcement lints を上位整合へ — requirements §7.8.1/§1.2/§1.10 + concept §2.6 back-fill (A/B/C、IMP-064/065/051)"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: fullback
drive: agent
status: confirmed
created: 2026-06-04
updated: 2026-06-04
owner: PM (Opus) / PO (人間)
forward_routing: L3
promotion_strategy: reuse-as-is
agent_slots:
  - role: tl
    slot_label: "TL — §7.8.1 forced_stop 追加 / §1.2 scrum_reverse の機械強制化 / §1.10 機械検証条件への 3 lint 追記 / concept §2.6 design_uncertain sync のレビュー"
  - role: po
    slot_label: "PO — R3 intent (PoC→Reverse / L0⇔L3 伝播 / backfill を CI hard-fail で強制してよいか) 検証。PO「A/B/C を実装」2026-06-04 で授権済"
generates: []
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-10-governance-enforcement.md
  references:
    - docs/plans/PLAN-L6-09-governance-enforcement.md
---

# PLAN-REVERSE-09 (reverse/fullback): governance enforcement lints の上位整合

## §0 位置づけ

`PLAN-L7-10` (add-impl) の Reverse 合流 (KIND_BACKFILL required)。新 lint 3 本が検査する規範を上位正本へ back-fill し、「doc 上だけの規律」から「機械強制」へ昇格させた事実を記録する。本 PLAN が L7-10 を requires することで、L7-10 自身の scrum-reverse/backfill lint が pairing を green にする (dogfood)。

## §1 R0-R4

| phase | 内容 | 状態 |
|-------|------|------|
| **R0** | 起点 = L7-10 実装 (3 lint + doctor.ok 連動)。今 session で IMP-064/065 を2回再発させた漏れが動機 | done |
| **R1** | Observed: `confirmed_reverse_type=fullback` → 実施 (実装完遂後の文書整合、requirements line 821) | done |
| **R2** | (normalize 不要、fullback) | skip |
| **R3** | Intent (PO「A/B/C を実装」授権 + intra_runtime_subagent code-reviewer 代替) | confirmed |
| **R4** | fullback: 下記 §2 の back-fill 適用 | done |

## §2 back-fill 内容

- **requirements §7.8.1 route-map**: recovery 行に `forced_stop` を追加 (concept §2.6 にあり requirements に欠けていた = propagation lint が検出、IMP-065)。
- **concept §2.6 signal table**: Discovery 行に `design_uncertain` token を追加 (requirements にあり concept に欠けていた、IMP-065 token 完成)。
- **§1.2 scrum_reverse の機械強制**: 「confirmed poc → reverse」が doc 規範のみだったのを `scrum-reverse lint` + 実 repo vitest ガードで CI fail-close 化 (IMP-064 再発防止)。
- **§1.10 機械検証条件**: backfill(IMP-051) を doctor.ok hard-fail へ昇格 (warn-first → CI fail-close)。
- **実 repo 孤児解消**: DISCOVERY-02 frontmatter `promotion_strategy: redesign` 欠落 (IMP-066) を補完。

## §6 用語更新

- (既存語の適用) `scrum-reverse lint` / `propagation lint` は concept §10.3 に L6-09/L7-10 で back-merge 済 — 本 Reverse は適用のみ (新規 back-merge 不要)。

## §7 DoD
- [x] requirements §7.8.1 + concept §2.6 の signal 語彙 sync (propagation lint green)
- [x] §1.2/§1.10 の機械強制化を記録 (CI vitest + doctor.ok hard-fail)
- [x] requires=L7-10 で pairing 宣言 (backfill/scrum-reverse lint green)
- [x] R3 PO 授権 + code-reviewer 代替 evidence
