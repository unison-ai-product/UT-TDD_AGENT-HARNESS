---
plan_id: PLAN-L6-99-doctor-result-envelope-measurement-contract
title: "PLAN-L6-99 (add-design): doctor result envelope 実測面契約"
kind: add-design
layer: L6
sub_doc: function-spec
drive: agent
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-08-13
updated: 2026-08-13
owner: PO / TL
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - 宣言値と実測値の境界を freeze する"
  - role: qa
    slot_label: "QA - 縮小実行の偽 full envelope を負 oracle で検証する"
generates:
  - artifact_path: docs/plans/PLAN-L6-99-doctor-result-envelope-measurement-contract.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/doctor-result-envelope-measurement.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L7-461-ci-cost-speedup-phase2.md
  requires:
    - docs/plans/PLAN-L7-461-ci-cost-speedup-phase2.md
  references:
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/193
    - docs/design/harness/L6-function-design/doctor-result-envelope-measurement.md
    - docs/plans/PLAN-L7-484-doctor-result-envelope-measurement.md
github_issue_id: 193
backprop_decision: not_required
backprop_decision_reason: >-
  既存 doctor result envelope の虚偽申告経路を契約どおり fail-close する修理であり、
  外部要求や実行機能を追加しない。
review_evidence:
  - reviewer: claude-pr310-closing-delta
    review_kind: cross_agent
    reviewed_at: "2026-08-13T12:15:00Z"
    tests_green_at: "2026-08-13T11:29:58Z"
    verdict: pass-weak
    worker_model: gpt-5.6-luna
    reviewer_model: claude-opus-5
    scope: "PR #310 exact HEAD e064a6605fd44ae50087f3927862c4143deb04ef。Claude blind-reviewer が U-DOCTORENV-016 の旧 CLI 投影 mutation 赤化、writer 型狭化、L6 signature と test-design の一致を再導出し blocking 0。親レーンが CI run 31694626856 の Linux / Windows / aggregate SUCCESS を独立照合。"
    lane: claim-blind
    subject_head: "e064a6605fd44ae50087f3927862c4143deb04ef"
    attack_trials: 4
    citations:
      - "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/310#issuecomment-5280288483"
      - "https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/actions/runs/31694626856"
    green_commands:
      - kind: unit_test
        command: "node scripts/run-vitest-snapshot.ts tests/cli-surface.test.ts -t U-DOCTORENV-016"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-13T11:22:48Z"
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:181ab4f9befec61fe37921f1fe1bc6fee5f5e1c70647fbf7ca2dd079017b4c3f"
        anchor_commit: e064a6605fd44ae50087f3927862c4143deb04ef
---

# PLAN-L6-99: doctor result envelope 実測面契約

Issue #193 の設計 slice。envelope の `scope` / `profile` / `check_ids` / strict options は CLI の
指定値や full registry の再計算値ではなく、同じ doctor 実行が実際に採用した profile と check
集合から生成する。

## 工程

1. [直列] L6 契約と L7 負 oracle を pair-freeze する。
2. [直列] measured execution を result と observation surface の単一戻り値として実装する。
3. [完了・直列] exact-head CI と非author review を取得して confirmed 化する。

## 受入条件

- setup-smoke / named profile / toolchain は full envelope を生成しない。
- full 実行の `check_ids` は実際に走った definition 集合と一致する。
- strict option は省略せず、consumer expectation と完全一致しなければ採用しない。
