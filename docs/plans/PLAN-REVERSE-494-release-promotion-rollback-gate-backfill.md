---
plan_id: PLAN-REVERSE-494-release-promotion-rollback-gate-backfill
title: "PLAN-REVERSE-494: S3 promotion / rollback gateの上流合流"
kind: reverse
layer: cross
drive: agent
workflow_phase: R0
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
status: draft
created: 2026-08-20
updated: 2026-08-20
owner: PM / Codex
parent_design: docs/plans/PLAN-L7-494-release-promotion-rollback-gate.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - S3実装差分のL6へのbackfill判定"
  - role: qa
    slot_label: "QA - exact identity、precedence、PF5 fault oracleの再検収"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-494-release-promotion-rollback-gate-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-494-release-promotion-rollback-gate.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-102-release-promotion-rollback-gate.md
    - docs/plans/PLAN-L7-494-release-promotion-rollback-gate.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/363
review_evidence: []
---

# PLAN-REVERSE-494: S3 promotion / rollback gateの上流合流

## 1. R0予約

L7実装で初めて確定する物理型・照合順序を、実測前にL6の完成事実として書かないためのReverse予約である。
R1以降はexact implementation HEAD、U-RELMAN 10件、Linux / Windows / aggregate CI、非著者reviewを
根拠に進める。

## 2. backfill対象

- control exact HEAD / PLAN revisionをCI・D1・D2・claim/spec receipt間で束縛し、PF3 artifact revisionとは
  分離する二軸identity。
- manifest current pointerと`currentRelease`の照合、およびevidence digest expected binding。
- D1=`ReviewDispatchEntry`、D2=`MergeGateDecision`、評価facts=`MergeGateFacts`という1:1 source mapping。
- `invalid_input`からallowまでのpromotion reason precedence。
- rollback candidateのdeterministic pointer delta/digestと、availability欠落のfail-close。
- PF5 restore失敗を`rollback_failed/applied=indeterminate`として保持するclassification。

## 3. R1からR4

- R1: source/test/trace差分をexact HEADへ固定する。
- R2: 10 oracleの独立mutation、composition spy、prior state不変を再実行する。
- R3: Claude Opus 5が非著者でidentityとfault境界を攻撃し、未反証blockingを0にする。
- R4: 実測で必要と判明した差分だけを`PLAN-L6-102`とL7 test-designへ戻す。

新apply engine、CLI、Pack copy、consumer runtime、D1/D2/D3の変更は本Reverseの対象外である。
