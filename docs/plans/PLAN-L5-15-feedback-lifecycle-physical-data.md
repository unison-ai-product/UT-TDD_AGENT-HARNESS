---
plan_id: PLAN-L5-15-feedback-lifecycle-physical-data
title: "PLAN-L5-15 (add-design/physical-data): feedback source generation / lifecycle 物理設計"
kind: add-design
layer: L5
sub_doc: physical-data
drive: db
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/design/harness/L5-detailed-design/physical-data.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
agent_slots:
  - role: tl
    slot_label: "TL - source projection と durable lifecycle の物理境界"
  - role: se
    slot_label: "SE - generation key / append-only log / SQLite index 設計"
  - role: qa
    slot_label: "QA - rebuild、TTL、再観測、fallback 抑止の結合 oracle"
generates:
  - artifact_path: docs/plans/PLAN-L5-15-feedback-lifecycle-physical-data.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L8-integration-test-design.md
    artifact_type: test_design
  - artifact_path: docs/governance/vmodel-upgrade-schedule.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L5-01-physical-data.md
  requires:
    - docs/plans/PLAN-L5-08-harness-db-feedback.md
  blocks:
    - docs/plans/PLAN-L6-68-memory-telemetry-lifecycle-contract.md
  references:
    - docs/plans/PLAN-L7-246-feedback-event-lifecycle.md
    - docs/plans/PLAN-L7-392-memory-promotion-handover-digest.md
review_evidence: []
---

# PLAN-L5-15: feedback source generation / lifecycle 物理設計

## §0 役割

`feedback_events` は finding / quality signal / artifact progress / hook event から再構築できる観測値、
`feedback_lifecycle` は人間または時間経過による消化状態を失わない append-only 履歴とする。本PLANは、
projection rebuild が消化済みsignalを再openする問題を、source generationを明示する物理設計で解消する。

## §1 物理契約

- `feedback_events.source_generation` は source table/id と意味状態から決定論的に生成し、時刻だけの差で変えない。
- `.ut-tdd/logs/feedback-lifecycle.jsonl` は lifecycle authoring sourceであり、DB tableは再構築可能なprojectionとする。
- lifecycle keyは `(feedback_event_id, source_generation)`。同一generationの`ack/closed/superseded`は再openしない。
- source消滅は`closed`、同一event IDの意味変更は旧generationを`superseded`として新generationを`open`にする。
- takeover surfaceはcurrent generationの最新transitionだけを採用し、terminal eventのsourceをfallback再合成しない。
- telemetryだけをTTL ack対象にし、gate/actionableはsource解消まで残す。

## §2 DoD

- [ ] physical-dataに両table、generation、index、authoring/projection境界がある。
- [ ] L8にrebuild、TTL、generation交代、source解消、fallback抑止の結合oracleがある。
- [ ] L6/L7が本物理設計を親として降下し、detector都合でstateを創作しない。
- [ ] DB不在/lock/破損時もhookはfail-openだが、正常書込時の遷移欠落はtestでfail-closeする。
