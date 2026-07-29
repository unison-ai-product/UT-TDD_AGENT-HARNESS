---
plan_id: PLAN-L6-69-active-upgrade-frontier-right-arm-contract
title: "PLAN-L6-69 (add-design): active upgrade frontier / right-arm coverage契約"
kind: add-design
layer: L6
sub_doc: function-spec
drive: fullstack
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/plans/PLAN-L4-24-declarative-vmodel-contract-right-arm.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
review_evidence:
  - reviewer: codex-subagent-post-test-confirm-review
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-10T17:04:38+09:00"
    tests_green_at: "2026-07-10T17:03:36+09:00"
    verdict: approve
    scope: "schedule/revision/right-armのfail-close契約、design freezeとprogram acceptの分離、L6/L7/Reverse ownershipを受入。"
    green_commands:
      - kind: unit_test
        command: "bunx vitest run tests/vmodel-pair.test.ts tests/right-arm-gate-planning.test.ts tests/upgrade-frontier.test.ts tests/plan-lint.test.ts tests/backfill-pairing.test.ts tests/vmodel-source-assets.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T17:00:23+09:00"
        evidence_path: tests/right-arm-gate-planning.test.ts
        output_digest: "sha256:2bbf22c3f583cec8beaa658998fe3d3ef6683f996d58b6d7ff7dd094acca9086"
        anchor_commit: 487ccd318a7e27f56ea35764d6204f35300d91d4
agent_slots:
  - role: tl
    slot_label: "TL - schedule/right-arm fail-close境界"
  - role: se
    slot_label: "SE - parser/analyzer公開関数契約"
  - role: qa
    slot_label: "QA - malformed/unrelated/archived negative oracle"
generates:
  - artifact_path: docs/plans/PLAN-L6-69-active-upgrade-frontier-right-arm-contract.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L4-24-declarative-vmodel-contract-right-arm.md
  requires:
    - docs/plans/PLAN-L1-07-vmodel-engine-swap-requirements-delta.md
  references:
    - docs/plans/PLAN-L4-24-declarative-vmodel-contract-right-arm.md
    - docs/governance/vmodel-upgrade-schedule.md
    - docs/process/vmodel-contract.yaml
---

# PLAN-L6-69: active upgrade frontier / right-arm coverage契約

## 問題

既存roadmapの全greenはactive engine-swapのyellow/redを隠せる。単純なMarkdown parserはschedule欠落・空・header破損を
空frontierへ変換できる。right-armは無関係、archived、draftの`kind=verify`をL8〜L14完了へ数えられる。

## 契約

- schedule必須表と列、非空行、一意plan IDを検証し、欠落・破損は`CLEAR`にせずfail-closeする。
- green/non-draftだけを完了、yellow/draftを進行中、redをhard failureとしてroadmapへ合成する。
- right-armは`PLAN-L1-07`または`PLAN-L4-24`へlinkedかつconfirmed/completedのverify PLANだけを数える。
- L4-24 design freezeはlinked verify PLAN全層の起票を要求し、program acceptだけが全層confirmed/completedを要求する。

## 受入条件

- malformed/empty/duplicate schedule、red rowがnegative oracleで落ちる。
- unrelated/archived/draft verify PLANを7層並べてもcompleteにならない。
- active yellow/draftはdoctor失敗にせず、`IN-PROGRESS`を必ず表示する。
- L6-69が公開契約と不変条件、paired L7 unit-test-designがU-VUP-FRONTIER/U-RIGHT-ARM oracle設計、
  L7-416がsource/test codeと実行証拠を所有する。
