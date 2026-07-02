---
plan_id: PLAN-L7-263-route-mode-kind-certificate
title: "PLAN-L7-263 (refactor draft): route_mode-kind consistency lint"
kind: refactor
layer: L7
drive: be
status: draft
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "Draft discovery/refactor candidate only. It records the route_mode-kind lint gap but does not implement a new lint or change process contracts in this slice."
created: 2026-07-02
updated: 2026-07-02
owner: PM / PO
parent_design: docs/design/harness/L6-function-design/function-spec.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: po
    slot_label: "PO - route_mode-kind consistency decision"
  - role: tl
    slot_label: "TL - route certificate lint scope review"
generates:
  - artifact_path: docs/plans/PLAN-L7-263-route-mode-kind-certificate.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-212-route-certificate-governance.md
  requires: []
  references:
    - docs/process/modes/add-feature.md
    - src/plan/lint.ts
    - src/lint/backfill-pairing.ts
    - src/schema/route-map.ts
---

# PLAN-L7-263: route_mode-kind consistency lint

## 状態

draft 起票。PO 指摘により、`route_mode` と `kind` の組み合わせを機械検査する必要性を記録する。実装・検証・Reverse back-fill は未着手であり、この draft 自体は doctor を壊さない refactor 候補メモとして保持する。

## 背景

add-feature mode は `add-design` と `add-impl` を内包する運用で、独立した `kind: add-feature` は存在しない。一方で、既存 PLAN の一部に `route_mode: add-feature` と `kind: impl` の組み合わせがあり、add-impl に必要な parent / Reverse back-fill 義務を回避した形になり得る。

この盲点は refactoring-driven model の起票品質に関わる。route certificate lint が `route_signal` と `route_mode` の整合だけを見て、`kind` との整合を見ないためである。

## 根本原因 (2026-07-02 実証): draft add-impl はデッドロックで成立しない

本 PLAN を正規形 (kind=add-impl + PLAN-REVERSE-263 の双方向 requires) で起票試行した結果、現行ルールの衝突を実証した:

- `requires_not_ready` (plan-governance): requires 先は `READY_DEPENDENCY_STATUSES = {confirmed, completed}` のみ — **draft を requires にできない** (`src/plan/lint-policy.ts:21`)。
- `KIND_BACKFILL[add-impl] = required` (backfill-pairing): **draft 段階から** REVERSE plan の requires による参照を要求 (`src/lint/backfill-pairing.ts:8,157`)。

両立する起票が存在しない (REVERSE が draft add-impl を requires すると前者に違反、requires を外すと後者の reverseOrphan)。**32 本が kind=impl に流れた慣行の構造要因はこのデッドロック**であり、個々の起票ミスだけではない。よって本 lint の実装 slice は整合検査の追加と同時に**デッドロック解消**を含める: 案 (a) backfill の pairing 判定に REVERSE plan の `dependencies.parent` 参照を許容 (requires は landed 後に張る)、案 (b) `requires_not_ready` に reverse-pairing エッジの例外を設ける — 選定は TL レビュー + PO 確定。解消後、本 PLAN と既存 debt を add-impl + Reverse pairing へ昇格する (昇格実例第 1 号)。

## 候補スコープ

- `route_mode: add-feature` では `kind` を `add-design` / `add-impl` に限定する。
- 既存 PLAN への一括 hard fail は避け、enforcement date と debt 台帳を分ける。
- debt 台帳の扱いは `PLAN-REVERSE-263-route-mode-kind-backfill.md` で設計 back-fill として検討する。
- 実装する場合は `src/plan/lint.ts` と route map 周辺に限定し、GitHub 操作や release 操作へは広げない。

## 未着手 DoD

- [ ] route_mode-kind の対応表を PO 確定する。
- [ ] 新規の不整合 PLAN を plan lint で fail させる。
- [ ] 既存 debt を台帳化し、段階是正として surface する。
- [ ] process / requirements / L6 function design のいずれかへ back-fill する。
