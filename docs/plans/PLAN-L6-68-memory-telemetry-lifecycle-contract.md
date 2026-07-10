---
plan_id: PLAN-L6-68-memory-telemetry-lifecycle-contract
title: "PLAN-L6-68 (add-design): memory 昇格 nudge と telemetry lifecycle 契約"
kind: add-design
layer: L6
sub_doc: memory
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-52-signals-schedule-live-handover.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: tl
    slot_label: "TL - durable memory / telemetry 消化境界の設計"
  - role: se
    slot_label: "SE - session summary と feedback projection のread/write分離"
  - role: qa
    slot_label: "QA - TTL、source解消、memory書込み有無のoracle"
generates:
  - artifact_path: docs/plans/PLAN-L6-68-memory-telemetry-lifecycle-contract.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/memory.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/forced-stop-feedback.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L6-52-signals-schedule-live-handover.md
  requires:
    - docs/plans/PLAN-L7-189-shared-harness-memory-cross-runtime.md
    - docs/plans/PLAN-L7-246-feedback-event-lifecycle.md
  references:
    - docs/plans/PLAN-L7-392-memory-promotion-handover-digest.md
    - docs/plans/PLAN-REVERSE-392-memory-promotion-digest-backfill.md
review_evidence: []
---

# PLAN-L6-68: memory 昇格 nudge と telemetry lifecycle 契約

## Gap

memory は durable knowledge のauthoring/projectionを持つが、sessionにcommitまたはPLAN遷移が
あったのにmemoryが書かれなかったことを検出する契約を持たない。feedback_eventsも投影ごとに
openを再生成するため、telemetryを直接削除/更新すると投影正本と監査履歴が衝突する。

## 設計方針

1. Stop summaryはsession内のcommit/plan_switchとmemory writeだけを照合し、前者あり・後者なしの時に
   `memory_promotion_missed` telemetry candidateをbest-effortで記録する。memory本文やgit差分は読まない。
2. feedback eventのsource projectionと消化状態を分離する。telemetryはTTL後にack可能だが、gate/actionableは
   TTLで消さず、source解消時だけclosed/supersededにする。全遷移はtimestamp/reasonを監査可能に残す。
3. 消化済みtelemetryをprojectionが勝手にopenへ戻さず、同一sourceの新観測だけが新generationを作る。
4. DB不在・lock・破損はStop/SessionStartを止めない。nudgeはwarnのみでmemory書込みを強制しない。

## 降下

PLAN-L7-392はnudge、TTL/auto-ack、feedback surfaceの流量表示を実装する。PLAN-L7-246はsource解消と
世代交代のclose、actionable routingを実装する。両者は同じlifecycle recordを共有し、固定4段digestを再実装しない。
