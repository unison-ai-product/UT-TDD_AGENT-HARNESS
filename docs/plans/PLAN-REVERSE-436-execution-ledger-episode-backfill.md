---
plan_id: PLAN-REVERSE-436-execution-ledger-episode-backfill
title: "PLAN-REVERSE-436: Execution Episode domain実装のgap-only設計backfill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: fullstack
status: draft
route_signal: drift
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-15
updated: 2026-07-15
owner: PO / Codex
parent_design: docs/plans/PLAN-L7-436-execution-ledger-episode-domain.md
agent_slots:
  - role: tl
    slot_label: "TL - event/reducer/storage実装事実とL4-L6設計差の判定"
  - role: qa
    slot_label: "QA - Red/Green oracleとreplay/rebuild自己証明の再導出"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-436-execution-ledger-episode-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-436-execution-ledger-episode-domain.md
  requires: []
---

# PLAN-REVERSE-436: Execution Episode domain実装backfill

## §0 目的

L7-436の実装をR0で観測し、L4-30/L5-23/L6-83へ未記載の実装事実だけをgap-onlyで戻す。既存設計を実装都合へ縮退させず、設計どおりである箇所は重複追記しない。

## §1 R0-R4手順

| phase | 観測・判定 |
|---|---|
| R0 | domain object、command/event型、E0-E15表、repository transaction、outbox、test failure/Greenをコードから観測する |
| R1 | L4集約境界、L5物理制約、L6 command/validation契約との差分をsignature・storage・failure semantics単位で分類する |
| R2 | `U/P-EXEP-*`を実装者の申告なしに再実行し、違法遷移、crash、replay、rebuild oracleを再導出する |
| R3 | drive model欠落、stale revision、event改変、partial commit、duplicate commandへの攻撃を行う |
| R4 | 真正gapだけをL5 physical-data、L6 function-spec、L7 unit-test-designへbackfillし、不要差分は棄却理由を残す |

## §2 gap-only判定

- 実装が設計のE0-E15や必須fieldを省略した場合は設計を弱めず、L7修正へ戻す。
- SQLite/Windows crashで必要と判明したtransaction/lease制約は、一般化可能な場合だけL5へ戻す。
- reducerやadapter固有のprivate helper名、現在のfixture値、偶発的件数はForward設計へ昇格しない。
- detector/testが実装挙動へ合わせて期待値を緩めた場合はbackfillではなく退行として扱う。

## §3 収束AC

- [ ] R0観測commitと対象file/digestを固定する。
- [ ] `U/P-EXEP-*` Red→Greenとfault injectionを独立再実行する。
- [ ] L4/L5/L6/test-design差分を`backfill | implementation-fix | no-change`へ全件分類する。
- [ ] gap-only backfill後にForward pair、plan lint、targeted test、typecheckがGreenである。
- [ ] cross-review evidenceを得てR4/confirmedへ進める。
