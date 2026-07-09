---
plan_id: PLAN-L7-410-defect-routing-refactor-candidates
title: "PLAN-L7-410 (add-impl): verification defect_routing to Refactor candidate lifecycle"
kind: add-impl
layer: L7
drive: db
status: confirmed
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-09
updated: 2026-07-09
owner: Codex
parent_design: docs/plans/PLAN-RECOVERY-10-right-lung-quality-assurance.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L8
agent_slots:
  - role: tl
    slot_label: "TL - defect_routing Refactor lifecycle boundary"
  - role: se
    slot_label: "SE - verification finding projection and lifecycle preservation"
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-09T21:14:00+09:00"
    tests_green_at: "2026-07-09T21:13:00+09:00"
    verdict: approve
    scope: "PLAN-RECOVERY-10 Step 4.4 の verification defect_routing -> Refactor candidate lifecycle 接続。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run tsc --noEmit"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-09T21:13:00+09:00"
        evidence_path: src/state-db/feedback-projections.ts
        output_digest: "sha256:5003250200f263eea333914960a842dbcea620d35ad93bffb8c3ffdcda5a9e0a"
      - kind: unit_test
        command: "bun run vitest run tests\\projection-writer.test.ts tests\\state-db.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T21:12:00+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:7fbed17ede44ed62063555512d05a2e856b4acd3fd7d33087bf7a47da81fa8aa"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-09T21:12:00+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:7fbed17ede44ed62063555512d05a2e856b4acd3fd7d33087bf7a47da81fa8aa"
      - kind: lint
        command: "bun run src\\cli.ts plan lint docs\\plans\\PLAN-L7-410-defect-routing-refactor-candidates.md docs\\plans\\PLAN-REVERSE-410-defect-routing-refactor-backfill.md docs\\plans\\PLAN-RECOVERY-10-right-lung-quality-assurance.md"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-09T21:12:00+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:7fbed17ede44ed62063555512d05a2e856b4acd3fd7d33087bf7a47da81fa8aa"
      - kind: smoke
        command: "bun run src\\cli.ts db rebuild"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-09T21:13:00+09:00"
        evidence_path: src/state-db/feedback-projections.ts
        output_digest: "sha256:5003250200f263eea333914960a842dbcea620d35ad93bffb8c3ffdcda5a9e0a"
generates:
  - artifact_path: docs/plans/PLAN-L7-410-defect-routing-refactor-candidates.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-REVERSE-410-defect-routing-refactor-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: src/state-db/feedback-projections.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: src/state-db/refactor-candidates.ts
    artifact_type: source_module
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-RECOVERY-10-right-lung-quality-assurance.md
  requires:
    - docs/plans/PLAN-L7-367-refactor-candidate-lifecycle.md
    - docs/plans/PLAN-REVERSE-410-defect-routing-refactor-backfill.md
  references:
    - docs/plans/PLAN-RECOVERY-10-right-lung-quality-assurance.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/test-design/harness/L7-unit-test-design.md
    - docs/test-design/harness/L8-integration-test-design.md
---

# PLAN-L7-410: verification defect_routing to Refactor candidate lifecycle

## 背景

`PLAN-RECOVERY-10` Step 4.4 は、右肺の `defect_routing` 出口を品質改善ループへ接続することを求めている。
`PLAN-L7-367` で `refactor_candidates` lifecycle はできたが、検証所見からその lifecycle へ入る投影が
未接続だった。そのため右肺 doc は `defect_routing` marker を持っていても、検証所見が Refactor 候補として
triage される DB 面を持たなかった。

## 実装スコープ

1. open `findings` のうち、`source=verification-evidence` または L8/L9/L10/L12/L14 right-lung test-design
   evidence を持つ所見を対象にする。
2. 対象所見の kind / subject / evidence path に `refactor`、`structural`、`smell`、`maintainability` などの
   defect routing 語が含まれる場合だけ、`refactor_candidates.kind=verification-defect-routing` へ投影する。
3. 同じ所見を `quality_signals.source=verification-defect-routing` へ投影し、open candidate は warn、
   triage 済み candidate は pass とする。
4. `decideRefactorCandidate` による `accepted` / `rejected` / `implemented` と `linked_plan_id` は rebuild 後も
   保持する。

## 非スコープ

- DB から Refactor PLAN 本文や設計差分を生成・承認しない。
- Reverse 起票の route は既存 `detector_route_candidates` / `routeFiling` 経路に残す。本 PLAN は Step 4.4 の
  Refactor lifecycle 接続を閉じる。
- 右肺 doc の marker 充足検査は `right-lung-doc-governance` の責務であり、本 PLAN では marker の文面を
  authoring source として補完しない。

## DoD

- [x] `projectVerificationDefectRoutingRefactorCandidates` が verification finding fixture から
      `verification-defect-routing` candidate と quality signal を作る。
- [x] `accepted` candidate の `linked_plan_id` が rebuild 後も保持される。
- [x] L6 function spec と L7 unit oracle に Step 4.4 の Refactor lifecycle 接続を backfill する。
- [x] `bun run tsc --noEmit` と対象 vitest が green。
