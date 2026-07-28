---
plan_id: PLAN-REVERSE-465-provider-execution-receipt-backfill
title: "PLAN-REVERSE-465: provider execution capability / terminal receipt design back-fill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: agent
status: draft
route_signal: design_gap
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-22
updated: 2026-07-22
owner: Codex TL / PO
agent_slots:
  - role: tl
    slot_label: "TL - provider execution boundary back-fill"
  - role: qa
    slot_label: "QA - design/test contract pairing review"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-465-provider-execution-receipt-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/external-if.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/test-design/harness/L9-system-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-465-provider-execution-receipt-contract.md
  requires: []
  references:
    - docs/plans/PLAN-L6-20-runtime-adapter-session-lifecycle.md
    - docs/design/harness/L4-basic-design/external-if.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/test-design/harness/L7-unit-test-design.md
    - docs/test-design/harness/L9-system-test-design.md
review_evidence: []
---

# PLAN-REVERSE-465: provider execution capability / terminal receipt design back-fill

## 状態

`PLAN-L7-465-provider-execution-receipt-contract` の実装観測から、既存provider adapter設計に
capability preflight、terminal receipt、process-tree cleanup証明の欠落が判明した。本PLANは
その差分を実装の既成事実へ追従させるのではなく、L4/L6設計とL7/L9検証契約へR4で引き戻し、
Forward再合流条件を固定するdraftである。

## Reverse判定

- 起点は既存provider実装で観測された設計欠落であり、実装を捨てるredesignではない。
- 再利用可能なport / receipt純粋関数を残し、設計と検証契約を上流へback-fillするため
  `confirmed_reverse_type: design` / `promotion_strategy: reuse-as-is` とする。
- native Job Object / cgroup実装は本back-fillの成功証拠へ含めず、Resource Kernel側の
  `ST-RGK-*` で別途実証する。

## R1-R4 back-fill範囲

- L4 `external-if.md`: required capabilityと起動前fail-close境界。
- L6 `function-spec.md`: request / preflight / terminal receipt / cleanup結果の関数契約。
- L7 `L7-unit-test-design.md`: `U-ADAPTER-010..015` の単体oracle。
- L9 `L9-system-test-design.md`: `ST-EXT-07` のsystem boundaryとnative custody証拠の分離。

## Forward再合流

R4差分は `PLAN-L6-20-runtime-adapter-session-lifecycle` を設計祖先とする
`PLAN-L7-465-provider-execution-receipt-contract` へ再合流する。Forward側の実装完了は、
unit fakeのGreenだけでOS custodyを主張せず、G9 evidenceとResource Kernelのnative検証を
それぞれのacceptance gateで閉じることを条件とする。

## 完了条件

- [x] Reverse側parentがForward側 `PLAN-L7-465` を指し、back-fill pairingが双方向契約を満たす。
- [x] L4/L6設計とL7/L9検証の各差分が対応づけられている。
- [x] Forward再合流先と設計祖先が明示されている。
- [ ] クロスレビューと実行証拠を記録し、R4をconfirmする。
