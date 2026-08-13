---
plan_id: PLAN-L7-483-oracle-test-citation-trace
title: "PLAN-L7-483 (impl): oracle test-label citation の逆向き trace"
kind: impl
layer: L7
sub_doc: function-spec
drive: be
route_signal: forward
route_mode: forward
status: confirmed
created: 2026-08-13
updated: 2026-08-13
owner: PO / TL
parent_design: docs/plans/PLAN-L7-244-right-arm-citation-gate.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: se
    slot_label: "SE - test-label citation collector と逆向き ratchet を実装する"
  - role: qa
    slot_label: "QA - fixture 除外・baseline stale・新規 citation の regression を検証する"
generates:
  - artifact_path: docs/plans/PLAN-L7-483-oracle-test-citation-trace.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/oracle-test-citation.ts
    artifact_type: source_module
  - artifact_path: src/lint/oracle-test-citation-baseline.ts
    artifact_type: source_module
dependencies:
  parent: docs/plans/PLAN-L7-244-right-arm-citation-gate.md
  requires: []
  blocks: []
  references:
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/259
    - docs/plans/PLAN-REVERSE-41-substance-lints.md
    - docs/plans/PLAN-L7-480-oracle-id-token-boundary.md
    - docs/plans/PLAN-L7-482-oracle-provenance-uniqueness.md
    - docs/plans/PLAN-L6-98-oracle-test-citation-contract.md
    - docs/design/harness/L6-function-design/oracle-test-citation-trace.md
    - docs/test-design/harness/L7-unit-test-design.md
github_issue_id: 259
backprop_decision: not_required
backprop_decision_reason: >-
  既存 oracle-test-trace の片方向検査を逆向きへ対称化する内部ゲート修理であり、L0-L6 の要件・
  外部仕様・実行契約を変更しない。分類契約は既存 test-design の citation 規律を機械化するため、
  上流要件への逆伝播は不要とする。
review_evidence:
  - reviewer: claude-opus-5
    review_kind: cross_agent
    reviewed_at: "2026-08-13T08:39:01Z"
    tests_green_at: "2026-08-13T08:38:33Z"
    verdict: approve
    scope: >-
      PR #306 の非author blind delta review。exact HEAD
      11c994ebd9ebb113bae85fa08e724329626392af に対して、regex literal 境界後も静的 label を
      収集すること、it.skip / describe.only / test.todo の modifier label を収集すること、
      1517 citation sites から導出した未宣言 584 ID と 584 ID baseline の集合一致、
      新規 ID / stale baseline の fail-close、34 regression tests、Linux / Windows / aggregate CI
      を確認し PASS (blocking 0) と判定した。
    worker_model: gpt-5.6-luna
    reviewer_model: claude-opus-5
    citations:
      - "PR #306 comment 5278022928 (PASS; exact HEAD 11c994eb)"
      - "GitHub Actions run 31682029143 (Linux/Windows/aggregate success)"
      - "commit 11c994eb (regex literal / modifier remediation)"
    green_commands:
      - kind: unit_test
        command: "GitHub Actions run 31682029143 (harness-check-linux/windows/aggregate)"
        runner: ci
        scope: full
        exit_code: 0
        completed_at: "2026-08-13T08:38:33Z"
        evidence_path: tests/oracle-test-trace.test.ts
        output_digest: "sha256:f1ffa9663ffd316557565ed1f24c480b89648c1bde8a06de9b40ac999bc8317e"
        anchor_commit: 11c994ebd9ebb113bae85fa08e724329626392af
---

# PLAN-L7-483: oracle test-label citation の逆向き trace

## 位置づけ

Issue #259 の bounded slice。`oracle-test-trace` が持つ
`test-design declared → tests referenced` の片方向検査に、tests の明示的な test-label citation
から `test-design` へ戻る検査を追加する。#206 の宣言 provenance uniqueness (#290) と、
`PLAN-REVERSE-41` の既存 forward orphan 検査は所有範囲を維持する。

## V-model 対

| 層 | 正本 | 検証対 |
|---|---|---|
| L6 | `docs/design/harness/L6-function-design/oracle-test-citation-trace.md` | L7 の分類・境界 oracle |
| L7 | `src/lint/oracle-test-trace.ts` の reverse trace | `docs/test-design/harness/L7-unit-test-design.md` の `U-OIDGATE-008..013` |
| L8 | 既存 doctor/static gate 配線 | `tests/oracle-test-trace.test.ts` の TDD regression |

## 工程

1. [直列] L6 分類契約と L7 test-design の自己記述を pair-freeze する。
2. [直列] test-label collector、既存債務 baseline、逆向き analyzer を実装する。
3. [直列] doctor/static の既存 `oracle-test-trace` 経路で hard gate 化し、fixture 除外と
   baseline ratchet を実 repo で検証する。
4. [直列] exact-head CI と非author closing review を取得する。

## 分類と ratchet

- 宣言必須の citation surface は、`tests/**/*.ts` の `describe` / `it` / `test` が実行する
  **静的な最初のラベル文字列**だけとする。`it.each(...)("label", ...)` と `skipIf(...)("label", ...)`
  の chained label も同じ surface として扱う。
- 本文・コメント・fixture 配列・snapshot・module code・baseline module に現れる ID は citation
  site としない。これにより架空 fixture と設計文書の再引用を機械的に分離する。
- 既存の未宣言 label citation は `ORACLE_TEST_CITATION_BASELINE` に凍結し、新規 ID と stale
  baseline を fail-close する。baseline は集合一致テストで管理し、件数だけを信頼しない。
- dynamic label はこの slice の静的 citation surface 外であり、ID の検証根拠にはしない。動的
  label の規律拡張は別 issue とする。

## 完了条件

- [x] L6 契約、L7 test-design、implementation、unit test が同じ PR に揃う。
- [x] `U-OTT-001..006` を test-design に自己宣言し、ゲート自身の設計片側欠落を解消する。
- [x] 新規 test-label citation は宣言が無ければ hard gate が失敗する。
- [x] 現存の 500 件超の debt は baseline として可視化し、fixture/doc 引用は検出しない。
- [x] exact-head の Linux/Windows/aggregate CI と非author closing review が揃うまで merge しない。

## Exit

exact HEAD `11c994ebd9ebb113bae85fa08e724329626392af` で Linux / Windows / aggregate CI と
Claude non-author review `PASS (blocking 0)` が成立した。doc-only の confirm commit は新HEADで
delta 追認し、実装契約を変更していないことを確認してから merge する。
