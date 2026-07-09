---
plan_id: PLAN-L7-156-top-level-reference-doc-graph-node
title: "PLAN-L7-156: top-level reference doc graph node"
kind: refactor
layer: L7
drive: db
status: confirmed
created: 2026-06-25
updated: 2026-06-25
owner: Codex
parent_design: docs/governance/repository-structure.md
backprop_decision: not_required
backprop_decision_reason: "Relation graph projection coverage is extended for an existing tracked reference artifact. No workflow, schema, CLI, or persisted data contract changes."
agent_slots:
  - role: se
    slot_label: "SE - relation graph top-level reference coverage"
  - role: tl
    slot_label: "TL - DB gate regression review"
generates:
  - artifact_path: docs/plans/PLAN-L7-156-top-level-reference-doc-graph-node.md
    artifact_type: markdown_doc
  - artifact_path: src/graph/loader.ts
    artifact_type: source_module
  - artifact_path: tests/relation-graph-loader.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-155-proposal-research-source-constants.md
  requires:
    - docs/governance/repository-structure.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-01T16:17:00+09:00"
    tests_green_at: "2026-07-01T16:16:00+09:00"
    verdict: approve
    scope: "Materialize tracked top-level reference docs as relation graph design nodes so deletion diffs remain analyzable."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\relation-graph-loader.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: tests/relation-graph-loader.test.ts
        output_digest: "sha256:e42d9d2be60e6b383cc51c291009e3e8104f2c60db8dca17737be0cfb3eb34d6"
        anchor_commit: fe54ac5e76e5785f8dd74de02528c1bff367c880
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/graph/loader.ts
        output_digest: "sha256:7a231cb642507d46f961e0b38fbbd6807c908a3305831a79f235adcbe3152902"
        anchor_commit: fe54ac5e76e5785f8dd74de02528c1bff367c880
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/graph/loader.ts
        output_digest: "sha256:7a231cb642507d46f961e0b38fbbd6807c908a3305831a79f235adcbe3152902"
        anchor_commit: fe54ac5e76e5785f8dd74de02528c1bff367c880
      - kind: smoke
        command: "bun run src\\cli.ts db rebuild"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/graph/loader.ts
        output_digest: "sha256:7a231cb642507d46f961e0b38fbbd6807c908a3305831a79f235adcbe3152902"
        anchor_commit: fe54ac5e76e5785f8dd74de02528c1bff367c880
---

# PLAN-L7-156: top-level reference document graph node

## 目的

tracked top-level reference document が変更または削除されたときに、relation graph DB gate が `missing-projection` を誤って出さないようにする。

## 範囲

`README.md`、`AGENTS.md`、`CLAUDE.md`、`.claude/CLAUDE.md` など、repository root の運用正本を relation graph source set の design node として materialize する。

## 受け入れ条件

- 対象 top-level document の change impact が `missing-projection` にならない。
- `tests/relation-graph-loader.test.ts` が real repo regression fence として通る。
