---
plan_id: PLAN-L6-98-oracle-test-citation-contract
title: "PLAN-L6-98 (add-design): oracle test-label citation 逆向き契約"
kind: add-design
layer: L6
sub_doc: function-spec
drive: be
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-08-13
updated: 2026-08-13
owner: PO / TL
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - citation surface と fixture 除外境界を freeze する"
  - role: qa
    slot_label: "QA - static label / chained label / dynamic label の境界を検証する"
generates:
  - artifact_path: docs/plans/PLAN-L6-98-oracle-test-citation-contract.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-29-test-oracle-strength.md
  requires:
    - docs/plans/PLAN-L6-29-test-oracle-strength.md
  references:
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/259
    - docs/design/harness/L6-function-design/oracle-test-citation-trace.md
    - docs/plans/PLAN-L7-483-oracle-test-citation-trace.md
github_issue_id: 259
backprop_decision: not_required
backprop_decision_reason: >-
  既存の test-oracle-strength を citation surface へ具体化する追加設計であり、L0-L5 の要件や
  外部実行仕様は変更しない。L7 実装への降下時に本契約を pair freeze する。
review_evidence: []
---

# PLAN-L6-98: oracle test-label citation 逆向き契約

Issue #259 の設計 slice。test-design を検証の正本として維持するため、実行 test label の静的
oracle citation を test-design の正確な宣言 row へ戻す分類契約を定義する。

## 工程

1. [直列] `oracle-test-citation-trace.md` の static/chained/dynamic/fixture 境界を freeze する。
2. [直列] L7 `PLAN-L7-483` の collector/analyzer と `U-OIDGATE-008..013` の pair を確認する。
3. [直列] non-author review と exact-head CI の証跡を `review_evidence` へ反映し、confirmed 化する。

## 受入条件

- `describe` / `it` / `test` の静的 label だけを宣言必須面とする。
- fixture、コメント、snapshot、baseline、dynamic label は誤検出しない。
- 既存 debt は要素集合 baseline とし、新規 citation と stale baseline は fail-close する。
