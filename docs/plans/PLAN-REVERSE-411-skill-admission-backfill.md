---
plan_id: PLAN-REVERSE-411-skill-admission-backfill
title: "PLAN-REVERSE-411 (reverse): skill admission gate 実装の上位整合 backfill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: agent
status: draft
route_signal: drift
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-09
updated: 2026-07-09
owner: PO / Codex
parent_design: docs/plans/PLAN-L7-411-skill-admission-gate.md
review_evidence: []
agent_slots:
  - role: tl
    slot_label: "TL - PLAN-L7-411 実装後に L6/L7/L0 用語へ backfill する範囲を確認"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-411-skill-admission-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-411-skill-admission-gate.md
  requires: []
---

# PLAN-REVERSE-411: skill admission gate 実装の上位整合 backfill

## 0. 位置づけ

`PLAN-L7-411-skill-admission-gate` は `PLAN-L6-67` の L6 契約を L7 実装へ降下する add-impl である。
add-impl が単独で着地しないよう、本 Reverse は実装後に L6 設計、L7 oracle、L0 用語へ実装事実を
backfill するためのペアとして起票する。

## 1. R0-R4 方針

- R0: L7 実装が `skill-admission.md` §4-§8 の契約を満たしたか確認する。
- R1: 実装中に変わった関数名、台帳配置、policy 配置、doctor surface を L6 へ戻す。
- R2: `U-SKILL-ADMIT-001..009` と実テストの対応を L7 単体テスト設計へ同期する。
- R3: judge/LLM が CI・doctor 合否に入らないこと、admit 権限が機械判定に閉じていることを PO/TL 観点で検証する。
- R4: skill admission gate 用語を L0 用語集へ back-merge するか、既存 skill/learning 用語の拡張に留めるかを確定する。

## 2. DoD

- [ ] PLAN-L7-411 が confirmed になった後、実装事実を L6/L7 へ同期する。
- [ ] skill admission gate 用語の L0 back-merge 要否を判定する。
- [ ] doctor / plan lint / targeted tests の green evidence を review_evidence に記録する。
