---
plan_id: PLAN-L7-257-orchestration-cell-roster
title: "PLAN-L7-257 (impl): orchestration_mode cell→roster 割当 + 標準 team preset (2026-06-05 defer 解除判断)"
kind: impl
layer: L7
drive: agent
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/cross-review-enforcement.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - 2026-06-05 defer (サブエージェント配置は後で) の解除判断 + cell 割当承認"
  - role: tl
    slot_label: "TL - cell→roster 写像設計 (vmodel injection との合成) レビュー"
  - role: se
    slot_label: "SE - roster 宣言 + 標準 team preset + team run 接続"
generates:
  - artifact_path: docs/plans/PLAN-L7-257-orchestration-cell-roster.md
    artifact_type: markdown_doc
dependencies:
  parent: null
  requires: []
  references:
    - .ut-tdd/audit/A-177-orchestration-layer-audit-2026-07-02.md
    - .ut-tdd/audit/A-178-control-layer-gap-audit-2026-07-02.md
    - docs/design/harness/L6-function-design/cross-review-enforcement.md
    - src/vmodel/injection.ts
    - src/task/tier-router.ts
    - .ut-tdd/teams/example-review-team.yaml
    - docs/plans/PLAN-L7-255-delegation-model-effort-injection.md
---

# PLAN-L7-257 (impl): orchestration_mode cell→roster 割当 + 標準 team preset

## Status

draft 起票 (A-177 F-8)。**前提: 本 PLAN の着手は 2026-06-05 PO defer (「サブエージェントの配置とかは後で」、cross-review-enforcement scope OUT / function §3.7) の解除に相当するため、活性化は PO 承認が明示条件**。2026-07-02 の PO 依頼 (オーケストレーション層見直し) を defer 解除の候補シグナルとして起票する。

## 背景

- vmodel injection は drive×layer の `orchestration_mode` 5 値を返し縮退 (`degraded_from/to`) も機械化済み。しかし **cell→具体 roster (どの subagent / Codex role を実際に招集するか)** の写像が無く、orchestration_mode は「誰が判断し誰が実装するか」の抽象値に留まる。
- `.ut-tdd/teams/` は example 1 件のみで、docs / impl / review の標準 preset が無い — Sonnet オーケストレーターが編成を都度考える = 抜け漏れの温床 (Opus 同等化の障害)。
- **追加根拠 (A-178 G-10)**: `resolveVmodelInjection` の呼び出し元は `vmodel show` (表示) の 1 箇所のみで、mandatory_agents / recommended_skills / orchestration_mode の 5 key 注入が委譲・team run に一切流れていない (表示止まり)。本 PLAN スコープ 3 (injection 接続) がこの穴の対応先。

## スコープ

1. **cell→roster 宣言**: orchestration_mode × drive の roster binding (owner subagent / worker engine / reviewer engine) を宣言的正本で定義。tier-router のクロス配置原則 (worker=創出 / consult・verify=判断、族分離) と矛盾しない値のみ許容 (lint)。
2. **標準 team preset**: docs-team / impl-team / review-team の yaml preset を同梱 (`ut-tdd setup` 配布対象)。例: impl-team = se(codex worker)→tl(claude 判断)→qa(T0 verify、frontier gate 背後)。
3. **vmodel injection 接続**: `vmodel show --injection` の orchestration_mode 出力に roster binding を併記し、`team run` へワンステップで渡せる形にする (PLAN-L7-255 の注入と整合)。
4. 不在 agent の縮退は既存規則 (silent fallback 禁止、`degraded_*` 記録) を roster 層でも維持。

## Steps

| Step | 内容 | mode |
|---|---|---|
| 1 | PO defer 解除判断 + cell 割当値の承認 | 直列 |
| 2 | roster 宣言 + 整合 lint | 直列 |
| 3 | 標準 preset + injection 接続 + test | 直列 |

## DoD

- [ ] cell→roster が宣言正本から解決され team run へ渡せる (test 固定)
- [ ] 族分離違反の roster 値が lint fail (test 固定)
- [ ] 標準 preset 3 種が setup 配布物に含まれ fresh consumer で使える (smoke 固定)
