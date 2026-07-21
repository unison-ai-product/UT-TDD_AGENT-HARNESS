---
plan_id: PLAN-REVERSE-452-forward-escape-contract-backfill
title: "PLAN-REVERSE-452: forward escape 契約関数 (U-EXISSUE Red→Green) の backfill"
kind: reverse
layer: cross
drive: be
status: draft
route_signal: drift
route_mode: reverse
workflow_phase: R0
confirmed_reverse_type: design
created: 2026-07-17
updated: 2026-07-17
owner: PO / Claude
parent_design: docs/plans/PLAN-L7-452-forward-escape-contract-red.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - 契約実装観測と L6-83 §2-§5 / test-design への gap-only backfill"
review_evidence: []
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-452-forward-escape-contract-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-452-forward-escape-contract-red.md
  requires: []
  references:
    - docs/plans/PLAN-L6-83-forward-escape-issue-contract.md
  blocks: []
---

# PLAN-REVERSE-452: forward escape 契約関数 backfill

R0 で U-EXISSUE-001..006 の Red→Green 実装 (src/execution/forward-escape.ts) を観測する。
R1-R3 で実装事実と L6-83 §2-§5 の差分だけを記録する (gap-only):

- 11 駆動モデル enum / escape signal 分類表が L6-83 §1 の閉じた分類と一致するか。
- payload digest の正準化範囲が §2 冪等 key 契約を過不足なく写像するか。
- `U-EXISSUE-*` を docs/test-design/harness/L7-unit-test-design.md へ登録する。
- L7-436 (episode 集約) 実装時に本契約関数へ委譲する接続点を確定する。
- blind review 軽微所見の設計判断を確定する: reconcile の duplicate 判定が
  body digest 完全一致に限られる盲点 (近似重複 Issue の非検出) と、削除と
  別 repository 再配置が `issue-missing` に畳まれ独立 finding にならない点。
  L6-83 §4 の語彙拡張が必要なら PLAN/ADR へ戻す (実装での勝手な拡張はしない)。

R4 で Forward 再合流条件を固定する。実装結果で L6-83 契約を自動改訂しない。
