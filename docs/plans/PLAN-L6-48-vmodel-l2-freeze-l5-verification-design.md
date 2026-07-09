---
plan_id: PLAN-L6-48-vmodel-l2-freeze-l5-verification-design
title: "PLAN-L6-48 (add-design): V-model L2 prototype freeze and L5 verification design contract"
kind: add-design
layer: L6
sub_doc: function-spec
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-08
updated: 2026-07-09
owner: PO / TL
parent_design: docs/plans/PLAN-L7-391-agent-contract-detect-gate.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T19:10:51+09:00"
    tests_green_at: "2026-07-09T19:10:51+09:00"
    verdict: approve
    scope: "U13a add-design slice. ZIP 107 の L2 prototype agreement freeze と L5 shift-left verification design を HARNESS の Forward freeze contract として設計に追加。"
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/vmodel-forward-freeze-contracts.test.ts tests/vmodel-pair.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T19:10:51+09:00"
        evidence_path: tests/vmodel-forward-freeze-contracts.test.ts
        output_digest: "sha256:27efe2eb587a22d42f4668213f1e827cb8526596f9573789949feb9d5b012d4b"
        anchor_commit: 1afa132c9368fc362706db102880e020d7ba3d24
agent_slots:
  - role: tl
    slot_label: "TL - L2 prototype freeze / L5 verification contract"
  - role: qa
    slot_label: "QA - V-model freeze contract oracle"
generates:
  - artifact_path: docs/plans/PLAN-L6-48-vmodel-l2-freeze-l5-verification-design.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/vmodel-pair-freeze.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L8-integration-test-design.md
    artifact_type: test_design
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/governance/vmodel-typed-spec-definitions.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-391-agent-contract-detect-gate.md
  requires:
    - docs/plans/PLAN-L7-391-agent-contract-detect-gate.md
  references:
    - docs/governance/vmodel-upgrade-schedule.md
    - docs/governance/vmodel-typed-spec-definitions.md
    - docs/design/harness/L2-screen/
    - docs/design/harness/L5-detailed-design/
    - docs/test-design/harness/L8-integration-test-design.md
---

# PLAN-L6-48: V-model L2 prototype freeze and L5 verification design contract

## 0. 役割

本 PLAN は U13a として、ZIP 107 の「L2 凍結ゲート(プロト合意)」と「L5 までに検証設計を整備する」指示を HARNESS の設計正本へ落とす。
L2 は画面プロトタイプ合意の証跡なしに L3 凍結へ進めない。L5 は詳細設計だけでなく L8 検証設計との対称性を持つ。

## 1. 設計内容

1. L2 screen sub-doc 6 件は `status=confirmed`、`pair_artifact=L10`、`next_pair_freeze=L10`、かつ G2/PO/prototype agreement の証跡を持つ。
2. L5 detailed-design sub-doc 5 件は `status=confirmed`、`pair_artifact=L8`、`next_pair_freeze=L8` を持つ。
3. L8 integration test design は `executed_at_layer=L8`、`pair_artifact=docs/design/harness/L5-detailed-design/`、GWT 粒度の IT case を持つ。
4. `ui-detail.md` も L5 詳細設計の一部として L8 で被覆される。
5. 実装 gate は `PLAN-L7-393` で `forward-freeze-contracts` doctor check として追加する。

## 2. 不変条件

- L2 placeholder/carry の存在だけでは prototype agreement freeze とみなさない。
- L5 の pair-frontmatter が緑でも、L8 側が GWT/coverage を欠く場合は検証設計未整備とみなす。
- 検出器は設計差分を創作しない。対象 path と L2/L5 の正本は本 PLAN と既存 design/test-design doc から読む。

## 3. 受け入れ条件

- `forward-freeze-contracts - OK` が doctor に現れる。
- `tests/vmodel-forward-freeze-contracts.test.ts` が L2 証跡欠落、L8 被覆欠落、real repo green を検証する。
- VMS-010 / TVMS-010 が typed spec 台帳と owned artifact に現れる。

## U13 typed spec owned artifact

```yaml
spec:
  defines:
    - id: VMS-010
      kind: forward-freeze-contract-design
      traces_from: [VMS-008]
      traces_to: [VMS-011, VMS-012]
      tests: [TVMS-010]
```

VMS-010 は ZIP 107 の L2 prototype agreement と L5 verification design を HARNESS の Forward freeze contract として定義する設計である。
