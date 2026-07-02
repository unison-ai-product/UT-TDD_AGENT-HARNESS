---
plan_id: PLAN-REVERSE-263-route-mode-kind-backfill
title: "PLAN-REVERSE-263: route_mode-kind consistency design back-fill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: be
status: draft
route_signal: design_gap
route_mode: reverse
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - route_mode-kind back-fill scope"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-263-route-mode-kind-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
  requires: []
  references:
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/process/modes/add-feature.md
    - docs/design/harness/L6-function-design/function-spec.md
---

# PLAN-REVERSE-263: route_mode-kind consistency design back-fill

## 状態

draft 起票。`PLAN-L7-263-route-mode-kind-certificate` が実装へ進む場合に、上位設計へ戻すべき判断点を記録する。現時点では R0 の設計 gap メモであり、R1 以降の成果物は未確定。

## 背景

route certificate lint は `route_signal` から `route_mode` を検査するが、`route_mode` と `kind` の組み合わせまでは検査していない。add-feature route で `kind: impl` を許すと、add-impl の parent / back-fill 義務が弱くなる可能性がある。

## Back-Fill 候補

- requirements の kind / route / drive の関係を明文化する。
- `docs/process/modes/add-feature.md` に、起票時の `kind` 選択ルールを追記する。
- `docs/design/harness/L6-function-design/function-spec.md` に、lint 入出力と enforcement cutoff の契約を追記する。

## 未着手 DoD

- [ ] route_mode-kind の対応表を設計側で確定する。
- [ ] L7 実装 PLAN の lint 仕様と上位設計が一致する。
- [ ] 既存 debt を hard fail へ直行させず、段階是正として扱う。
