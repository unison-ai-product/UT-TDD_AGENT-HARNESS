---
plan_id: PLAN-L7-142-relation-graph-requirement-nodes
title: "PLAN-L7-142 (troubleshoot): relation graph loader requirement nodes"
kind: troubleshoot
layer: L7
drive: db
status: confirmed
created: 2026-06-24
updated: 2026-06-24
owner: Codex / PO
backprop_decision: not_required
backprop_decision_reason: "Relation graph loader coverage fix for requirement nodes, archived plan filtering, and pair filtering; no runtime user behavior changes."
review_evidence:
  - reviewer: codex-gpt-5.x
    review_kind: cross_agent
    reviewed_at: "2026-07-01T16:17:00+09:00"
    tests_green_at: "2026-07-01T16:16:00+09:00"
    verdict: approve
    scope: "Relation graph loader requirement-node supply, archived plan filtering, pair filtering, and regression test validation."
    worker_model: claude-opus
    reviewer_model: codex-gpt-5.x
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/relation-graph-loader.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: tests/relation-graph-loader.test.ts
        output_digest: "sha256:e42d9d2be60e6b383cc51c291009e3e8104f2c60db8dca17737be0cfb3eb34d6"
agent_slots:
  - role: tl
    slot_label: "TL - relation graph loader requirement-node review"
  - role: aim
    slot_label: "AIM - troubleshoot and cross-runtime review"
generates:
  - artifact_path: docs/plans/PLAN-L7-142-relation-graph-requirement-nodes.md
    artifact_type: markdown_doc
  - artifact_path: src/graph/loader.ts
    artifact_type: source_module
  - artifact_path: tests/relation-graph-loader.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
  references:
    - docs/plans/PLAN-L7-32-cross-artifact-relation-graph.md
---

# PLAN-L7-142: relation graph requirement node coverage gap

## 0. 検出

harness.db feedback_events が stale-edge を継続検出したため、relation graph loader の requirement node 供給を確認した。原因は PLAN 側が `derives-from -> requirement:FR-L1-*` edge を持つ一方で、loader が top-level `requirements` node を materialize していなかったことである。

## 1. 是正

`src/graph/loader.ts` は FR-L1 registry と PLAN が参照する FR id を `RequirementInput[]` として返す。archived PLAN は live graph から除外し、pairArtifact は `docs/test-design/` 配下だけを test-design node として扱う。

## 2. 受け入れ条件

- real repo loader で stale-edge が 0 である。
- requirement node が 1 件以上 materialize される。
- `tests/relation-graph-loader.test.ts` が regression fence として通る。
