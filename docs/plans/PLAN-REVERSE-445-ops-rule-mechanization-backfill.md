---
plan_id: PLAN-REVERSE-445-ops-rule-mechanization-backfill
title: "PLAN-REVERSE-445: 運用ルール機構化の設計 back-fill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: be
status: draft
route_signal: design_gap
route_mode: reverse
created: 2026-07-16
updated: 2026-07-16
owner: PO / Claude
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: tl
    slot_label: "TL - launch guard / env 境界 / lock 検知の設計 back-fill scope"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-445-ops-rule-mechanization-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-445-ops-rule-mechanization.md
  requires: []
  references:
    - docs/plans/PLAN-L7-445-ops-rule-mechanization.md
---

# PLAN-REVERSE-445: 運用ルール機構化の設計 back-fill

## 状態

draft 起票 (PLAN-L7-445 の Reverse pairing、R0 メモ)。インシデント由来の実装先行
(2026-07-16 doctor storm / stale index.lock / session-id リーク) を設計へ back-fill する。

## Back-Fill 候補

- ランタイム横断の「多重起動・再試行の実行モデル」(singleton 対象コマンドの選定基準、
  launch 台帳の正規化キー設計、fail-close 閾値) を L6 function design へ 1 節追記する。
- snapshot runner の env 境界 (何を子プロセスへ伝播させないか) を検証設計 doc に明文化する。
- git lock の所有・後始末責務 (作成者ランタイム責務、stale 判定基準) を hybrid 協調設計へ追記する。

## DoD

- [ ] 多重起動実行モデルが設計 doc に記録される。
- [ ] snapshot env 境界と git lock 責務が設計 doc に記録される。
