---
plan_id: PLAN-REVERSE-528-pack-authoring-template-scope-backfill
title: "PLAN-REVERSE-528: Pack authoring template scope backfill"
kind: reverse
layer: cross
drive: agent
workflow_phase: R0
confirmed_reverse_type: design
route_signal: design_gap
route_mode: reverse
status: draft
created: 2026-09-01
updated: 2026-09-01
owner: Codex / Luna
forward_routing: gap-only
promotion_strategy: reuse-as-is
parent_design: docs/plans/PLAN-L7-528-pack-authoring-template-scope.md
pair_artifact: docs/test-design/harness/L7-pack-authoring-template-scope-test-design.md
github_issue_id: 482
agent_slots:
  - role: qa
    slot_label: "QA - Pack-only authoring差分をL6-101へ戻す必要性を再検証する"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-528-pack-authoring-template-scope-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-528-pack-authoring-template-scope.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
    - docs/plans/PLAN-L7-528-pack-authoring-template-scope.md
    - docs/test-design/harness/L7-pack-authoring-template-scope-test-design.md
review_evidence: []
backprop_decision: required
backprop_decision_reason: "authoring assetのsource非依存とdeny境界がL6-101 consumer独立受入へ影響するかR4でgap-only判定する。"
---

# PLAN-REVERSE-528: Pack authoring template scope backfill

## R0: 対象

Forward の `PLAN-L7-528` に対する slice-scoped Reverse 対である。現時点では R0 のリンクだけを
固定し、実装・Green・Pack publication・canary完了は主張しない。

## R1〜R3: 後続確認

Forward implementationが同一 inventoryを clean plan、materializer、tar、Pack-only smokeへ降下した後、
`CANDIDATE-PACKTPL-001..007` の実測結果を確認する。追加 allowlist、source/runtime fallback、
personal path、Bun、legacy-HELIX execution pathを新規に発見した場合だけ、該当差分を記録する。

## R4: backfill境界

実証された差分だけを `PLAN-L6-101-pack-independent-multi-consumer-acceptance.md` の Pack-only / source
非依存受入へ戻す。既存の publication、consumer runtime、version identity、`PLAN-L7-166` の setup
template catalogは再所有しない。差分が無い場合も「backfill済み」とは言わず、`not_required` 判定と
根拠をこの Reverse の後続 revisionへ記録する。
