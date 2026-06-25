---
plan_id: PLAN-L7-164-agent-slots-roster-split
title: "PLAN-L7-164: agent slots roster resolver split"
kind: refactor
layer: L7
drive: agent
status: confirmed
created: 2026-06-25
updated: 2026-06-25
owner: Codex
parent_design: docs/process/modes/refactor.md
backprop_decision: not_required
backprop_decision_reason: "Behavior-invariant split of roster capability resolution from agent slot lifecycle state. No CLI/API behavior, persisted schema, or workflow semantics changed."
agent_slots:
  - role: se
    slot_label: "SE - agent slots roster resolver split"
  - role: tl
    slot_label: "TL - runtime roster invariant review"
generates:
  - artifact_path: docs/plans/PLAN-L7-164-agent-slots-roster-split.md
    artifact_type: markdown_doc
  - artifact_path: src/runtime/agent-slots.ts
    artifact_type: source_module
  - artifact_path: src/runtime/agent-slots-roster.ts
    artifact_type: source_module
  - artifact_path: tests/agent-slots.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-163-workflow-contracts-policy-extraction.md
  requires:
    - docs/process/modes/refactor.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-25T20:26:50+09:00"
    tests_green_at: "2026-06-25T20:26:50+09:00"
    verdict: approve
    scope: "Split roster capability resolution from the agent slot lifecycle module while preserving the legacy agent-slots re-export."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\agent-slots.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T20:26:25+09:00"
        evidence_path: tests/agent-slots.test.ts
        output_digest: "sha256:4ba79df8616947d7aa79bb8e118432be118bca2df24ba1f73780c08634c1e9ff"
      - kind: unit_test
        command: "bun run vitest run tests\\agent-slots.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T20:26:25+09:00"
        evidence_path: src/runtime/agent-slots.ts
        output_digest: "sha256:314909224372631dfcf07978c2349ca272f7c5658fa7c0af415d51067a330d38"
      - kind: unit_test
        command: "bun run vitest run tests\\agent-slots.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-25T20:26:25+09:00"
        evidence_path: src/runtime/agent-slots-roster.ts
        output_digest: "sha256:2ed9b18fb43b81f4b551db6e694a517bc46367a154b027b8487a7cf1165eee4e"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-25T20:26:37+09:00"
        evidence_path: src/runtime/agent-slots.ts
        output_digest: "sha256:314909224372631dfcf07978c2349ca272f7c5658fa7c0af415d51067a330d38"
---

# PLAN-L7-164: agent slots roster resolver split

## Objective

Reduce the remaining `split-module` pressure in `src/runtime/agent-slots.ts` by
separating roster capability resolution from slot lifecycle state management.

## Scope

- Move `resolveRosterCapability` and its roster result/input types to
  `src/runtime/agent-slots-roster.ts`.
- Preserve the existing `src/runtime/agent-slots.ts` public surface by
  re-exporting the resolver and types.
- Keep the existing `tests/agent-slots.test.ts` oracle and point the roster
  unit directly at the sidecar module.

## Acceptance Criteria

- Agent slot lifecycle behavior remains unchanged.
- Roster capability resolution keeps exact-match role/capability semantics.
- `tests/agent-slots.test.ts`, typecheck, lint, DB rebuild, and doctor pass.
