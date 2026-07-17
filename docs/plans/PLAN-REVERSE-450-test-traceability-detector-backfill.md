---
plan_id: PLAN-REVERSE-450-test-traceability-detector-backfill
title: "PLAN-REVERSE-450: test-traceability 検出器強化の backfill"
kind: reverse
layer: cross
drive: db
status: draft
route_signal: drift
route_mode: reverse
workflow_phase: R0
confirmed_reverse_type: design
created: 2026-07-17
updated: 2026-07-17
owner: PO / Codex
parent_design: docs/plans/PLAN-L7-450-test-traceability-detector-hardening.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - 検出器改修の実装観測と design/test-design への gap-only backfill"
review_evidence: []
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-450-test-traceability-detector-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-450-test-traceability-detector-hardening.md
  requires: []
  references:
    - docs/plans/PLAN-L7-143-harness-db-warn-remediation.md
  blocks: []
---

# PLAN-REVERSE-450: test-traceability 検出器強化 backfill

R0 で W1-W4 実装 (remediation 分岐 / duplicate-artifact-ownership fail-close / deliverable trace 拡張 /
台帳外増分 hard gate) を観測する。R1-R3 で実装事実と L7-450 の想定 (baseline 棚卸し結果、
縮小専用台帳との双方向一致、CI/doctor の finding 集合共有) の差分だけを記録し (gap-only)、
R4 で Forward 再合流条件を固定する。
実装結果で設計を自動承認せず、trace 対象 root の追加や severity 変更は PLAN/ADR へ戻す。
再蓄積カーブが実際に止まったか (W4 AC) を R2 の照合点に含める。
