---
plan_id: PLAN-L7-151-refactor-scout-agent
title: "PLAN-L7-151: refactor scout agent and policy externalization detector"
kind: refactor
layer: L7
drive: db
status: confirmed
created: 2026-06-25
updated: 2026-06-25
owner: Codex
parent_design: docs/process/modes/refactor.md
backprop_decision: not_required
backprop_decision_reason: "This adds an advisory refactor scout surface and detector heuristic within the existing Refactor/DB feedback workflow. It does not change public CLI/API behavior, persisted schema, or requirements semantics."
agent_slots:
  - role: se
    slot_label: "SE - refactor scout detector"
  - role: tl
    slot_label: "TL - policy externalization triage"
generates:
  - artifact_path: docs/plans/PLAN-L7-151-refactor-scout-agent.md
    artifact_type: markdown_doc
  - artifact_path: .claude/agents/refactor-scout.md
    artifact_type: markdown_doc
  - artifact_path: src/runtime/agent-guard.ts
    artifact_type: source_module
  - artifact_path: src/graph/loader.ts
    artifact_type: source_module
  - artifact_path: src/state-db/refactor-candidates.ts
    artifact_type: source_module
  - artifact_path: src/task/tier-router.ts
    artifact_type: source_module
  - artifact_path: src/task/tier-router-policy.ts
    artifact_type: source_module
  - artifact_path: docs/process/modes/refactor.md
    artifact_type: markdown_doc
  - artifact_path: tests/agent-guard.test.ts
    artifact_type: test_code
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
  - artifact_path: tests/relation-graph-loader.test.ts
    artifact_type: test_code
  - artifact_path: tests/tier-router.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-150-refactor-candidate-closure-sweep.md
  requires:
    - docs/plans/PLAN-L7-150-refactor-candidate-closure-sweep.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-25T17:02:30+09:00"
    tests_green_at: "2026-06-25T17:02:30+09:00"
    verdict: approve
    scope: "Refactor Scout advisory agent, externalize-policy detector heuristic, and tier-router policy extraction."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\tier-router.test.ts tests\\model-id-ssot.test.ts tests\\agent-guard.test.ts tests\\projection-writer.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T16:48:56+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:54a0128ece0ed84a75ca94323c74181c81089262a4ef81d406621640215a82dd"
      - kind: unit_test
        command: "bun run vitest run tests\\tier-router.test.ts tests\\model-id-ssot.test.ts tests\\agent-guard.test.ts tests\\projection-writer.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T16:48:56+09:00"
        evidence_path: tests/tier-router.test.ts
        output_digest: "sha256:8c4f57122634806872c53d35f865fc5bf0219653ab04348ba84aee014aa27ed4"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T16:47:13+09:00"
        evidence_path: src/state-db/refactor-candidates.ts
        output_digest: "sha256:0e270c1572d46850fe94dd43359a38c04b75ecc7b23a62cf8bf983f74c8f601a"
      - kind: unit_test
        command: "bun run vitest run tests\\relation-graph-loader.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T17:00:41+09:00"
        evidence_path: tests/relation-graph-loader.test.ts
        output_digest: "sha256:8b119a0324d46bf51628db846951cb9745c10bcb15f7017cc970e3b66a49af2b"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T16:49:22+09:00"
        evidence_path: src/graph/loader.ts
        output_digest: "sha256:d4194530fe20b96ef4740ccdf70dbe323771ee2dfc3a4529b9e580e86602cffc"
      - kind: smoke
        command: "bun run src\\cli.ts db rebuild"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T16:50:09+09:00"
        evidence_path: docs/process/modes/refactor.md
        output_digest: "sha256:915ec6686156b8ed12e57a18b666105a488bc3ae85c31e1d89db2c1336ac94b4"
      - kind: doctor
        command: "bun run src\\cli.ts doctor"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T16:51:00+09:00"
        evidence_path: docs/process/modes/refactor.md
        output_digest: "sha256:915ec6686156b8ed12e57a18b666105a488bc3ae85c31e1d89db2c1336ac94b4"
---

# PLAN-L7-151: refactor scout agent and policy externalization detector

## Objective

Add a Refactor Scout advisory agent and teach the detector to surface policy
externalization candidates such as stage-based subagent/skill injection rules
embedded in code.

## Scope

- Add an allowlisted `refactor-scout` Claude subagent prompt.
- Keep the Scout advisory only: detect, classify, propose PLAN inputs, and
  suggest verification fences. It must not autonomously rewrite production code.
- Add `externalize-policy` candidate detection to the existing DB refactor
  candidate pipeline.
- Document that stage/subagent/skill/model/route/approval rules are
  externalization candidates when they live as code branches instead of a
  catalog/config/rule module.
- Materialize allowlisted agent prompts in the relation graph so prompt changes
  do not bypass impact analysis.
- Externalize the tier router's role/tier/model/review policy tables into a
  dedicated policy module while keeping the existing router public exports
  stable.

## Acceptance Criteria

- `refactor-scout` is accepted by `agent-guard` only with a matching model
  family.
- `externalize-policy` candidates are emitted for stage/subagent injection
  policy fixtures.
- `.claude/agents/refactor-scout.md` has a relation graph node and impact
  analysis does not emit `missing-projection` for it.
- A true-positive policy candidate is resolved by moving tier router policy
  data/functions out of orchestration code and covering the new module directly.
- Existing refactor candidate projection behavior remains intact.
- Targeted tests, typecheck, lint, DB rebuild, and doctor pass.
