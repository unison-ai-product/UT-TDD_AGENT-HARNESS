---
plan_id: PLAN-REVERSE-253-advisor-triggers-backfill
title: "PLAN-REVERSE-253: advisor 自動発火条件の設計 back-fill 確認"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: agent
status: draft
route_signal: design_gap
route_mode: reverse
created: 2026-07-03
updated: 2026-07-03
owner: PM / PO
agent_slots:
  - role: tl
    slot_label: "TL - advisor 発火条件の設計影響範囲確認 (back-fill not_required 宣言)"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-253-advisor-triggers-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-253-orchestrator-model-identity-advisor-triggers.md
  requires: []
  references:
    - CLAUDE.md
    - docs/design/harness/L6-function-design/function-spec.md
    - .ut-tdd/audit/A-177-orchestration-layer-audit-2026-07-02.md
---

# PLAN-REVERSE-253: advisor 自動発火条件の設計 back-fill 確認

## 状態

2026-07-03 起票 (PLAN-L7-253 の add-impl 昇格に伴う Reverse pairing)。本 PLAN は重い設計変更を行う Reverse ではなく、**上位要求が既存 trace 済みであることを確認し back-fill not_required を宣言する軽量 Reverse** である。

## 背景

PLAN-L7-253-orchestrator-model-identity-advisor-triggers は、CLAUDE.md に既存する規約 (Sonnet 以下は advisor を使う規約、L167/L170-172) の機械実装である。上位要求が変更されるわけではなく、advisor エンジン完成後に発火条件のみ欠落していた実装上の gap を埋める。

A-177 F-1/F-2 所見: engine 完成・発火条件のみ欠落 (policy は prose 規約として存在、機械発火未実装)。

## R0 Evidence (設計影響範囲分析)

- **CLAUDE.md L167**: `ut-tdd advisor --task "..." --current-model <model>` の規約が存在 (prose)。
- **CLAUDE.md L170-172**: Sonnet 以下の orchestrator が advisor を使う規約が存在 (prose)。
- **A-177 F-1**: advisor エンジン (`src/team/advisor-policy.ts`) 完成済みで発火経路が CLI 手動 1 本のみ。
- **A-177 F-2**: `src/runtime/detect.ts` が provider までしか検出できず model identity が不明。

上記から、PLAN-L7-253 の実装は **既存要求の実装であり新規要求の追加ではない**。設計 doc (L6 function-spec、L3 要件) への変更は不要。

## back-fill 判断: not_required

上位要求 (CLAUDE.md 規約) は既存 trace 済みであり、L7-253 の実装によって:

- `docs/design/harness/L6-function-design/function-spec.md` の追記は不要 (既存の advisor-policy 契約行で網羅)。
- L3 要件ドキュメントへの追記は不要 (advisor 使用規約は CLAUDE.md に正本化済み)。
- `docs/governance/` や `docs/test-design/` への追記は不要。

よって **back-fill は not_required** と判断する。PLAN-L7-253 の `backprop_decision: not_required` に対応する Reverse 確認として本 PLAN を記録する。

## forward_routing (将来 R4 へ遷移時の想定)

R4 到達時は `forward_routing: gap-only`、`promotion_strategy: reuse-as-is` を宣言し、本 PLAN を confirmed とする。設計追補不要のため L1-L6 生成物は produces しない。

## DoD

- [ ] PLAN-L7-253 が confirmed へ遷移する前に本 PLAN が back-fill not_required を宣言している
- [ ] 設計 doc 変更が不要であることが R0 分析に明記されている
- [ ] 本 PLAN が PLAN-L7-253 の `generates:` に記載されている
