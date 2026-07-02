---
plan_id: PLAN-L7-272-red-first-activation
title: "PLAN-L7-272 (add-impl): Red-first 強制の発火化 (tdd_red_required 使用 0 本の解消)"
kind: add-impl
layer: L7
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/governance/ddd-tdd-rules.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - marker 既定 ON 化の適用範囲 (TDD 経路の kind) 確定"
  - role: tl
    slot_label: "TL - 段階導入 (不在 surface → 既定 ON) の誤検知境界レビュー"
  - role: se
    slot_label: "SE - marker 既定化 + 不在 surface + red_at/green_at 運用経路"
generates:
  - artifact_path: docs/plans/PLAN-L7-272-red-first-activation.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-28-red-first-tdd-evidence.md
  requires: []
  references:
    - .ut-tdd/audit/A-179-deviation-model-tdd-ddd-gap-audit-2026-07-02.md
    - docs/governance/ddd-tdd-rules.md
    - src/lint/ddd-tdd-rules.ts
---

# PLAN-L7-272 (add-impl): Red-first 強制の発火化

## Status

draft 起票 (A-179 T-1)。正規形 = parent: PLAN-L6-28 (Red-first を定義した設計 PLAN、drive 一致) + Reverse pairing = PLAN-REVERSE-272。

## 背景 — 原則はあるが一度も発火していない

- governance 正本に `red-first-evidence` ルール (`red_at <= green_at`、DDD-INV-003、oracle U-DDDTDD-003) と lint 実装が存在する。
- しかしトリガーの **`tdd_red_required` marker を付けた PLAN が 0 本** (grep: 定義 PLAN L6-28 のみ)。**test-first は一度も機械検証されていない** — テスト後書きでも green 証跡は同一に見える。skill 発火 0 (A-178 G-8) と同型の「実装済み・発火ゼロ」。

## スコープ

1. **不在 surface (Phase 0)**: TDD 経路の kind (impl/add-impl、TDD-STYLE-DRIVE-FIRING の strong fit 対象) で `tdd_red_required` 未設定の confirmed PLAN を doctor が advisory surface。
2. **既定 ON 化 (Phase 1)**: enforcement-date cutoff で新規 TDD 経路 PLAN は marker 既定 ON (opt-out には理由必須、backprop_decision_reason と同型)。切替は PO 判断。
3. **red_at/green_at の運用経路**: 記録手順 (テスト先行実行の失敗証跡 → red_at 刻印) を process doc 化し、green_commands digest と接続。PLAN-L7-273 (test_results ingest) が landed したら一次データから自動刻印へ寄せる。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | 適用範囲の PO 確定 + 段階設計 (TL) | 直列 |
| 2 | 不在 surface (advisory) 実装 | 直列 |
| 3 | 既定 ON (cutoff) + 運用経路 doc + test | 直列 |

## DoD

- [ ] marker 不在の TDD 経路 confirmed PLAN が surface される (test 固定)
- [ ] cutoff 後の新規 PLAN で red_at 無し green のみが fail する (test 固定)
- [ ] red_at 記録の運用手順が process doc に存在する
