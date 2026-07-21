---
plan_id: PLAN-REVERSE-365-harness-db-currency-backfill
title: "PLAN-REVERSE-365: Stop hook 駆動 harness.db currency 維持の backfill"
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
owner: PO / Claude
parent_design: docs/plans/PLAN-L7-365-harness-db-currency-hook.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - Stop hook rebuild 実装の観測と design/test-design への gap-only backfill"
review_evidence: []
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-365-harness-db-currency-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-365-harness-db-currency-hook.md
  requires: []
  references:
    - docs/plans/PLAN-L7-369-db-currency-doctor-gate.md
    - docs/plans/PLAN-L7-348-runtime-state-recoverability.md
  blocks: []
---

# PLAN-REVERSE-365: Stop hook 駆動 harness.db currency 維持の backfill

R0 で PLAN-L7-365 Step 2 実装 (`src/state-db/stop-refresh.ts` の `refreshHarnessDbOnStop` と
`session summary` 配線、token ingest 統合、fail-open 境界) を観測する。R1-R3 で実装事実と
L6 function-spec / session-log 設計の想定 (配線層 = session-log core でなく CLI 層に置いた層分離
判断、doctor read-only 維持の設計判断) の差分だけを記録し (gap-only)、R4 で Forward 再合流条件を
固定する。実装結果で設計を自動承認せず、rebuild 頻度・コスト境界 (Stop 毎 full rebuild) の変更が
必要になった場合は PLAN/ADR へ戻す。staleness 再発カーブが実際に止まったか (issue #78 の
db-currency violation が session 境界を跨いで再発しないか) を R2 の照合点に含める。
