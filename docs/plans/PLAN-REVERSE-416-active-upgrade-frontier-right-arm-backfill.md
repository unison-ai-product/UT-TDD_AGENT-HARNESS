---
plan_id: PLAN-REVERSE-416-active-upgrade-frontier-right-arm-backfill
title: "PLAN-REVERSE-416: active upgrade frontier / right-arm gate back-fill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: fullstack
status: confirmed
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
route_signal: drift
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-with-hardening
parent_design: docs/plans/PLAN-L7-416-active-upgrade-frontier-right-arm-gate.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
review_evidence:
  - reviewer: codex-subagent-post-test-confirm-review
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-10T17:04:38+09:00"
    tests_green_at: "2026-07-10T17:03:36+09:00"
    verdict: approve
    scope: "observed false-greenのL6/L7 back-fill、reuse-with-hardening、双方向Forward合流、negative oracleを受入。"
    green_commands:
      - kind: unit_test
        command: "bunx vitest run tests/vmodel-pair.test.ts tests/right-arm-gate-planning.test.ts tests/upgrade-frontier.test.ts tests/plan-lint.test.ts tests/backfill-pairing.test.ts tests/vmodel-source-assets.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-10T17:00:23+09:00"
        evidence_path: tests/backfill-pairing.test.ts
        output_digest: "sha256:0a2f8aeb712cdf2edb03b35e4a6b7278cdbe5a6b01f3df045ee80b135f1dead4"
        anchor_commit: 71a023b2c74ca15dbc88c4453ca7c9adb05ca58a
backprop_scope:
  - layer: L6-function-design
    decision: updated
    evidence_path: docs/design/harness/L6-function-design/function-spec.md
    reason: "schedule構造/enumとengine-swap structured linkage/statusのfail-close契約を先に固定した。"
  - layer: L7-unit-test-design
    decision: updated
    evidence_path: docs/test-design/harness/L7-unit-test-design.md
    reason: "malformed/red/unknown scheduleとunrelated/archived/draft verifyのnegative oracleを固定した。"
agent_slots:
  - role: tl
    slot_label: "TL - observed false-greenからL6契約へのback-fill判定"
  - role: qa
    slot_label: "QA - negative controlとdoctor surface parity"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-416-active-upgrade-frontier-right-arm-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-416-active-upgrade-frontier-right-arm-gate.md
  requires:
    - docs/plans/PLAN-L7-416-active-upgrade-frontier-right-arm-gate.md
  references:
    - docs/plans/PLAN-L6-69-active-upgrade-frontier-right-arm-contract.md
    - docs/plans/PLAN-L7-416-active-upgrade-frontier-right-arm-gate.md
---

# PLAN-REVERSE-416: active upgrade frontier / right-arm gate back-fill

## R0 Evidence

既存doctorはbase roadmap全greenの裏にactive U18を隠し、right-armは無関係`kind=verify`のlayerだけで完了扱いできた。
初回修正もschedule欠落/unknown enum、archived design、本文の偶発PLAN IDをfalse-greenにできる負例を残した。

## R1 Observed Gap

実装側parser/analyzerの入力制約がL6公開契約に存在せず、表示追加が設計上のhard/soft状態と一致していなかった。

## R2 Alignment

- schedule authoring sourceの表/列/separator/RAG/status/unique IDをL6で定義する。
- engine-swap linkはfrontmatter dependency構造だけから導出する。
- L4-24 statusはdraft/confirmed/completedだけを許し、欠落/unknown/archivedをfail-closeする。

## R3/R4 Back-fill

L6 function-specとpaired L7 unit-test-designを更新済み。本Reverseはcontract/back-fill、targeted negative oracle、
independent design reviewで閉じる。L7-416のsource/test code、full doctor、CIはL7実装PLAN側で閉じ、L6/Reverseの設計承認と再結合しない。
