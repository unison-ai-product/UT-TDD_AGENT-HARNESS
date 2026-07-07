---
plan_id: PLAN-REVERSE-255-delegation-injection-backfill
title: "PLAN-REVERSE-255: 委譲経路 model/effort routing 注入の設計 back-fill 確認"
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
    slot_label: "TL - delegation routing 注入の設計影響範囲確認 (back-fill not_required 宣言)"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-255-delegation-injection-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-255-delegation-model-effort-injection.md
  requires: []
  references:
    - CLAUDE.md
    - docs/design/harness/L6-function-design/function-spec.md
    - .ut-tdd/audit/A-177-orchestration-layer-audit-2026-07-02.md
---

# PLAN-REVERSE-255: 委譲経路 model/effort routing 注入の設計 back-fill 確認

## 状態

2026-07-03 起票 (PLAN-L7-255 の add-impl 昇格に伴う Reverse pairing)。本 PLAN は重い設計変更を行う Reverse ではなく、**上位要求が既存 trace 済みであることを確認し back-fill not_required を宣言する軽量 Reverse** である。

## 背景

PLAN-L7-255-delegation-model-effort-injection は、CLAUDE.md に既存する routing 規約 (effort 既定 routing、L167) の正規委譲経路への配線実装である。policy 自体 (`src/team/model-policy.ts`) は実装済みであり、上位要求が変更されるわけではない。

A-177 F-4/F-6/F-7 所見: policy 実装済み・正規委譲経路 (`runtimeCommand`、`task route`) への配線欠落 (effort が spawn 引数まで届かず片肺測定)。

## R0 Evidence (設計影響範囲分析)

- **CLAUDE.md L167**: effort 既定 routing 規約が存在 (prose: `claude=high, codex=middle` 等)。
- **A-177 F-4**: `ut-tdd codex/claude --role` 経路で role→model/effort マッピングが無い (provider CLI 既定で起動)。
- **A-177 F-6**: `routeToAdapterPlan` が effort を adapter plan に渡さず spawn で欠落。
- **A-177 F-7**: 同族承認 (same_model_approval: forbidden) の不変条件との整合が未文書化。

上記から、PLAN-L7-255 の実装は **既存要求の配線実装であり新規要求の追加ではない**。設計 doc (L6 function-spec、L3 要件) への変更は不要。

## back-fill 判断: not_required

上位要求 (CLAUDE.md routing 規約) は既存 trace 済みであり、L7-255 の実装によって:

- `docs/design/harness/L6-function-design/function-spec.md` の追記は不要 (model-policy / tier-router の既存契約行が対応)。
- L3 要件ドキュメントへの追記は不要 (routing 規約は CLAUDE.md に正本化済み)。
- `docs/governance/` や `docs/test-design/` への追記は不要。

なお、routing 原則の明文化 (スコープ 3: CLAUDE.md/AGENTS.md の Model/Effort Routing 節追記) は PLAN-L7-255 本体のスコープ内で実施するため、別途 Reverse back-fill は不要。

よって **back-fill は not_required** と判断する。PLAN-L7-255 の `backprop_decision: not_required` に対応する Reverse 確認として本 PLAN を記録する。

## forward_routing (将来 R4 へ遷移時の想定)

R4 到達時は `forward_routing: gap-only`、`promotion_strategy: reuse-as-is` を宣言し、本 PLAN を confirmed とする。設計追補不要のため L1-L6 生成物は produces しない。

## DoD

- [ ] PLAN-L7-255 が confirmed へ遷移する前に本 PLAN が back-fill not_required を宣言している
- [ ] 設計 doc 変更が不要であることが R0 分析に明記されている
- [ ] 本 PLAN が PLAN-L7-255 の `generates:` に記載されている
