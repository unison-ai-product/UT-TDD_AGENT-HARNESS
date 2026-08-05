---
plan_id: PLAN-REVERSE-474-worktree-topology-detector-backfill
title: "PLAN-REVERSE-474: worktree topology 検出契約の上流合流判定"
kind: reverse
layer: cross
drive: be
route_signal: drift
route_mode: reverse
confirmed_reverse_type: design
created: 2026-08-05
updated: 2026-08-05
owner: PM / PO
parent_design: docs/plans/PLAN-L7-474-worktree-topology-detector.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - link 健全性/寿命判定契約を L4/L6 設計へ合流させるべきかを判定"
  - role: qa
    slot_label: "QA - 実装確定の分類規則 (dirty 最優先の排他規則) と契約記述の照合"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-474-worktree-topology-detector-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-474-worktree-topology-detector.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L4-34-repository-runtime-placement-topology.md
    - docs/design/harness/L6-function-design/governance-enforcement.md
workflow_phase: R0
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
status: draft
review_evidence: []
---

# PLAN-REVERSE-474: worktree topology 検出契約の上流合流判定

`PLAN-L7-474` は worktree の link 健全性・寿命判定という**新しい検出契約**を追加する
(advisory、doctor hard gate ではない)。この契約が L4 (`PLAN-L4-34` repository runtime
placement topology) の移設 acceptance oracle として再利用される前提を持つため、実装確定後に
L4/L6 設計へ gap-only backfill すべきかを判定する。

## スコープ (gap-only)

1. link 健全性の双方向判定規則 (worktree→admin / admin→worktree) を、実装で確定した具体
   フィールド (`.git` file の gitdir 参照形式、`.git/worktrees/<id>/gitdir` back pointer) で
   L6 governance-enforcement 設計へ記述すべきか判定する。
2. liveness 分類の排他規則 (dirty 最優先の fail-safe 順序) を設計契約として明文化すべきか、
   実装内部の判断に留めるかを判定する。
3. `PLAN-L4-34` (未 merge、PR #230) が合流した時点で、本 PLAN の `healthy`/`retirable` oracle を
   移設 acceptance 条件として `PLAN-L4-34` 側から参照させる接続を判定する (本 PLAN 単独では
   `PLAN-L4-34` 未存在のため接続を保留し、`PLAN-L4-34` 側の後続 PLAN 起票時に解決する)。

## Schedule

- R0 (serial): `PLAN-L7-474` 実装 (facts collector + analyzer + doctor advisory 配線) の観測。
- R1 (serial): L4/L6 既存契約との gap 判定 (影響なし面は「影響なし」と明記して閉じる)。
- R2 (serial): 上流への gap-only 追記 (合流が必要と判定された場合のみ)。
- R3 (serial): pair_artifact (`U-WTTOPO-*`) と実装の照合 (QA slot)。
- R4 (serial): Forward 再合流判定 → confirm。

## AC

- AC-1: link 健全性双方向判定規則と liveness 排他分類規則について、L4/L6 契約への合流要否が
  明示的に判定されている (要 backfill / not_impacted のいずれかを理由付きで記録)。
- AC-2: `PLAN-L4-34` との接続要否 (移設 acceptance oracle としての参照関係) が判定されている。
- AC-3: 未判定の面が残っていない。
