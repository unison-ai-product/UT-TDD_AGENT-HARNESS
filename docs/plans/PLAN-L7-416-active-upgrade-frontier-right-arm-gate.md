---
plan_id: PLAN-L7-416-active-upgrade-frontier-right-arm-gate
title: "PLAN-L7-416 (add-impl): active upgrade frontier / right-arm gate"
kind: add-impl
layer: L7
drive: fullstack
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-69-active-upgrade-frontier-right-arm-contract.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/design/harness/L6-function-design/function-spec.md
next_pair_freeze: L7
review_evidence:
  - reviewer: codex-subagent-post-test-confirm-review
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-10T17:04:38+09:00"
    tests_green_at: "2026-07-10T17:03:36+09:00"
    verdict: approve
    scope: "revision-aware freeze、active frontier、structured right-arm coverage、accepted-before-design負例、legacy tuple、Reverse pairingを受入。"
    green_commands:
      - kind: typecheck
        command: "bunx tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-10T16:54:00+09:00"
        evidence_path: src/vmodel/lint.ts
        output_digest: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        anchor_commit: 71a023b2c74ca15dbc88c4453ca7c9adb05ca58a
      - kind: unit_test
        command: "bunx vitest run tests/vmodel-pair.test.ts tests/right-arm-gate-planning.test.ts tests/upgrade-frontier.test.ts tests/plan-lint.test.ts tests/backfill-pairing.test.ts tests/vmodel-source-assets.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T17:00:23+09:00"
        evidence_path: tests/vmodel-pair.test.ts
        output_digest: "sha256:0a2f8aeb712cdf2edb03b35e4a6b7278cdbe5a6b01f3df045ee80b135f1dead4"
        anchor_commit: 71a023b2c74ca15dbc88c4453ca7c9adb05ca58a
agent_slots:
  - role: se
    slot_label: "SE - schedule parser / right-arm analyzer実装"
  - role: qa
    slot_label: "QA - negative controlとdoctor surface parity"
  - role: tl
    slot_label: "TL - false-green除去と最終検収"
generates:
  - artifact_path: docs/plans/PLAN-L7-416-active-upgrade-frontier-right-arm-gate.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-416-active-upgrade-frontier-right-arm-backfill.md
    artifact_type: markdown_doc
  - artifact_path: src/vmodel/upgrade-frontier.ts
    artifact_type: source_module
  - artifact_path: src/vmodel/lint.ts
    artifact_type: source_module
  - artifact_path: src/doctor/roadmap-verification.ts
    artifact_type: source_module
  - artifact_path: src/lint/right-arm-gate-planning.ts
    artifact_type: source_module
  - artifact_path: tests/upgrade-frontier.test.ts
    artifact_type: test_code
  - artifact_path: tests/right-arm-gate-planning.test.ts
    artifact_type: test_code
  - artifact_path: tests/vmodel-pair.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-69-active-upgrade-frontier-right-arm-contract.md
  requires:
    - docs/plans/PLAN-L6-69-active-upgrade-frontier-right-arm-contract.md
    - docs/plans/PLAN-REVERSE-416-active-upgrade-frontier-right-arm-backfill.md
  references:
    - docs/plans/PLAN-REVERSE-416-active-upgrade-frontier-right-arm-backfill.md
    - docs/governance/vmodel-upgrade-schedule.md
    - docs/process/vmodel-contract.yaml
---

# PLAN-L7-416: active upgrade frontier / right-arm gate

## 実装

L6契約に従い、工程表の構造不正をfail-closeするpure parser、roadmap合成、engine-swap linkage/statusを考慮する
right-arm analyzerを実装する。yellow/draftは通常進行として表示し、red・malformed・confirmed設計の層不足だけをhard failureにする。

## テスト

- valid yellow/draft、all-green、missing table/columns/rows、duplicate ID、red row。
- unrelated、archived、draft、linked confirmed verify PLAN。
- L4-24 draft/confirmedとL8〜L14不足の組合せ。
- full doctorでactive frontierとright-arm surfaceを確認する。

## DoD

- [x] 設計契約をL6 function-specへ追加。
- [x] parser/analyzerと負例を実装。
- [x] independent reviewを記録しconfirmed化。
- [x] DB rebuild 59,393行、自己参照DoD解消後のfull doctorはEXIT=0。

CIはconfirmed前DoDへ循環依存させず、push後のPR release gateとして別に検収する。
