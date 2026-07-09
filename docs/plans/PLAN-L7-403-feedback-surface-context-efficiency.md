---
plan_id: PLAN-L7-403-feedback-surface-context-efficiency
title: "PLAN-L7-403 (add-impl): feedback surface context efficiency"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-09
updated: 2026-07-09
owner: PO / Codex
parent_design: docs/plans/PLAN-L7-366-takeover-surface-warn-actionable.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T13:10:00+09:00"
    tests_green_at: "2026-07-09T13:05:00+09:00"
    verdict: approve
    scope: "context efficiency audit F2/F3。takeover feedback surface を group-first cap に変更し、attempt-escalation surface に表示上限と breadcrumb を追加した。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/feedback-surface.test.ts tests/attempt-escalation.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T13:05:00+09:00"
        evidence_path: tests/feedback-surface.test.ts
        output_digest: "sha256:9568e906a8acfd0ecee9398f70554db93d9dd5ad3508540960895575db39d051"
agent_slots:
  - role: tl
    slot_label: "TL - context efficiency surface contract"
  - role: se
    slot_label: "SE - feedback and escalation surface implementation"
  - role: qa
    slot_label: "QA - starvation and cap oracle"
generates:
  - artifact_path: docs/plans/PLAN-L7-403-feedback-surface-context-efficiency.md
    artifact_type: markdown_doc
  - artifact_path: src/feedback/surface.ts
    artifact_type: source_module
  - artifact_path: src/runtime/attempt-escalation.ts
    artifact_type: source_module
  - artifact_path: tests/feedback-surface.test.ts
    artifact_type: test_code
  - artifact_path: tests/attempt-escalation.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-366-takeover-surface-warn-actionable.md
  requires:
    - docs/plans/PLAN-L7-366-takeover-surface-warn-actionable.md
    - docs/plans/PLAN-RECOVERY-05-iron-law-attempt-escalation.md
    - docs/plans/PLAN-REVERSE-403-feedback-surface-context-efficiency-backfill.md
  references:
    - docs/governance/context-efficiency-audit-2026-07-09.md
    - docs/plans/PLAN-L7-137-feedback-surface-taxonomy.md
    - docs/plans/PLAN-L7-88-handover-summary-injection-cap.md
---

# PLAN-L7-403: feedback surface context efficiency

## 0. 背景

`docs/governance/context-efficiency-audit-2026-07-09.md` は、SessionStart surface の固定予算は概ね守られている一方で、
takeover feedback surface が `signal_type` 多様性を失う欠陥を検出した。
同時に、attempt escalation surface だけが他の SessionStart surface と異なり上限を持たないことも検出した。

## 1. 実装スコープ

- `selectTakeoverFeedback` は open feedback rows を `bucket/severity/signal_type` で group 化してから表示対象 group を選ぶ。
- 表示対象 group の count は実 row 数を維持し、単一 group の大量 row が他 group を不可視化しない。
- `renderEscalationSignals` は検出件数 total を維持しつつ、既定 10 件だけを表示し、残件は breadcrumb にする。
- `evaluateAttemptEscalation` の検出件数や順序は変えない。cap は表示責務に限定する。

## 2. 受け入れ条件

- `detector_route_candidate:*` が多数行あっても、別 `signal_type` の `unresolved-join` group が `limit` 内に表示される。
- takeover output の group count は実件数を示す。
- attempt escalation は上限超過時に breadcrumb を出し、`maxSignals<=0` では無制限表示できる。
- L6 function-spec と L7 unit oracle へ契約が戻っている。
