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
    reviewed_at: "2026-06-25T17:48:30+09:00"
    tests_green_at: "2026-06-25T17:47:25+09:00"
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
        completed_at: "2026-06-25T17:46:41+09:00"
        evidence_path: tests/relation-graph-loader.test.ts
        output_digest: "sha256:8b119a0324d46bf51628db846951cb9745c10bcb15f7017cc970e3b66a49af2b"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T17:47:06+09:00"
        evidence_path: src/graph/loader.ts
        output_digest: "sha256:d4194530fe20b96ef4740ccdf70dbe323771ee2dfc3a4529b9e580e86602cffc"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T17:46:51+09:00"
        evidence_path: src/graph/loader.ts
        output_digest: "sha256:d4194530fe20b96ef4740ccdf70dbe323771ee2dfc3a4529b9e580e86602cffc"
      - kind: smoke
        command: "bun run src\\cli.ts db rebuild"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T17:47:25+09:00"
        evidence_path: src/graph/loader.ts
        output_digest: "sha256:d4194530fe20b96ef4740ccdf70dbe323771ee2dfc3a4529b9e580e86602cffc"
---

# PLAN-L7-156: top-level reference doc graph node

## Objective

Prevent the relation graph DB gate from reporting `missing-projection` when a
tracked top-level reference document is deleted or otherwise changed while the
file is absent from the working tree.

> **訂正 (PO 2026-06-25)**: 対象参照 doc を repo 直下から `docs/reference/ai-agent-harness-directory-reference.md`
> へ移設。loader 定数 `TOP_LEVEL_REFERENCE_DOCS` → `REFERENCE_DOCS` に改称し新パスを指す (本 PLAN 名・objective の
> "top-level" は歴史的呼称)。node は引き続き materialize される (パスのみ変更)。loader.ts / test 更新に伴う
> green_commands digest は green 再実行のうえ再整合済。

## Scope

- Add known top-level tracked reference docs to the relation graph source set as
  design nodes.
- Preserve existing process-doc and agent-doc graph coverage.
- Add fixture and real-repo regression checks for
  `docs/reference/ai-agent-harness-directory-reference.md`.

## Acceptance Criteria

- `docs/reference/ai-agent-harness-directory-reference.md` materializes as a relation graph
  node even when absent from the fixture repository.
- Change impact analysis for that path does not emit `missing-projection`.
- Targeted relation graph loader tests, typecheck, lint, DB rebuild, and doctor
  pass.
