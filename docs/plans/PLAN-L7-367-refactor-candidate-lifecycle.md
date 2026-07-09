---
plan_id: PLAN-L7-367-refactor-candidate-lifecycle
title: "PLAN-L7-367 (add-impl): refactor candidate lifecycle projection"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-07
updated: 2026-07-08
owner: PM / PO / TL
parent_design: docs/plans/PLAN-L6-49-refactor-and-qa-release-gates.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
review_evidence:
  - reviewer: codex-tl
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-08T20:05:00+09:00"
    tests_green_at: "2026-07-08T20:05:00+09:00"
    verdict: approve
    scope: "Refactor candidate lifecycle table と rebuild 永続 state の U13c add-impl slice。"
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/projection-writer.test.ts tests/state-db.test.ts tests/workflow-contracts.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-08T20:05:00+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:3ca1b40b5467e5ec0c46899e441f53acbc2d81ef8172333993072b5c5ee3a581"
        anchor_commit: f51d1f04c306e5afba492da2a85cabd9591e15a9
agent_slots:
  - role: tl
    slot_label: "TL - lifecycle boundary and existing detector compatibility"
  - role: se
    slot_label: "SE - refactor_candidates lifecycle table and rebuild preservation"
generates:
  - artifact_path: docs/plans/PLAN-L7-367-refactor-candidate-lifecycle.md
    artifact_type: markdown_doc
  - artifact_path: src/schema/harness-db.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db-tables-core.ts
    artifact_type: source_module
  - artifact_path: src/schema/harness-db-indexes.ts
    artifact_type: source_module
  - artifact_path: src/state-db/refactor-candidates.ts
    artifact_type: source_module
  - artifact_path: src/state-db/feedback-projections.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
  - artifact_path: tests/state-db.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-49-refactor-and-qa-release-gates.md
  requires:
    - docs/plans/PLAN-REVERSE-367-refactor-candidate-lifecycle-backfill.md
  references:
    - docs/plans/PLAN-L7-147-refactor-candidate-detector.md
    - docs/plans/PLAN-L7-150-refactor-candidate-closure-sweep.md
    - docs/plans/PLAN-L6-49-refactor-and-qa-release-gates.md
    - docs/governance/vmodel-refactor-qa-release-gates.md
---

# PLAN-L7-367: refactor candidate lifecycle projection

## 0. 役割

本 PLAN は ZIP108 の Refactor 改善戦略を、検出だけで終わらない永続 lifecycle へ進める。
既存 `PLAN-L7-147` は detector と `quality_signals` 投影、`PLAN-L7-150` は closure sweep を担う。
本 PLAN はそれらを supersede しない。detector の出力を `refactor_candidates` に写し、triage 済みの
`accepted` / `rejected` / `implemented` state が `rebuildHarnessDb` の truncate/rebuild で `open` に戻らない
ようにする。

## 1. 実装差分

1. `refactor_candidates` table を schema registry に追加する。
2. `refactorCandidateKey` で candidate identity を安定化する。
3. `projectRefactorCandidateSignals` が `quality_signals` に加えて lifecycle row を upsert する。
4. `decideRefactorCandidate` が `accepted` / `rejected` / `implemented` を記録する。
5. `truncateProjectionTables` は `refactor_candidates` を消さず、rebuild 後も triage state を保持する。

## 2. 不変条件

- DB は detector output の projection であり、Refactor PLAN や設計文書の authoring source ではない。
- `open` の高信頼候補だけが feedback actionable として再提示される。
- `rejected` / `implemented` の候補は再検出されても `open` に戻らない。
- `accepted` / `implemented` は `linked_plan_id` を要求する。
- public behavior や harness.db semantics を変える Refactor は Add-feature / Retrofit へ切り替える。

## 3. 受け入れ条件

- `migrate` が `refactor_candidates` table と index を作る。
- rebuild で新規候補が `state=open` として登録される。
- `decideRefactorCandidate(... state: rejected ...)` 後の rebuild で state が保持される。
- rejected candidate の `quality_signals.status` は `pass` になり、feedback event は再発火しない。
- 既存 `quality_signals` / `feedback_events` 投影は後方互換で残る。

## 4. 検証

- `bun run vitest run tests/projection-writer.test.ts tests/state-db.test.ts tests/workflow-contracts.test.ts`
- `bun run tsc --noEmit`
- `bun run lint`
- `bun run src/cli.ts doctor`
