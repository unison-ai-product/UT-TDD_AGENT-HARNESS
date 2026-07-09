---
plan_id: PLAN-L7-196-runtime-config-hardening
title: "PLAN-L7-196 (impl): runtime config hardening for team parallel cap and Claude guard matcher portability"
kind: impl
layer: L7
drive: be
status: confirmed
created: 2026-06-29
updated: 2026-06-30
owner: Codex
parent_design: docs/design/harness/L6-function-design/agent-slots.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "Codex SE - cap team max_parallel and harden Claude guard matcher portability"
  - role: tl
    slot_label: "Codex TL - verify runtime config hardening evidence"
generates:
  - artifact_path: docs/plans/PLAN-L7-196-runtime-config-hardening.md
    artifact_type: markdown_doc
  - artifact_path: src/schema/team.ts
    artifact_type: source_module
  - artifact_path: tests/team-schema.test.ts
    artifact_type: test_code
  - artifact_path: src/lint/project-hook.ts
    artifact_type: source_module
  - artifact_path: .claude/settings.json
    artifact_type: config
  - artifact_path: docs/templates/adapter/.claude/settings.json
    artifact_type: template
  - artifact_path: docs/design/harness/L6-function-design/agent-slots.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/design/harness/L6-function-design/agent-slots.md
  requires:
    - docs/plans/PLAN-L7-64-team-runner-launch.md
    - docs/plans/PLAN-L7-157-distribution-clean-pull.md
  references:
    - .ut-tdd/audit/A-144-02-runtime-config-security.md
    - .ut-tdd/audit/A-145-02-runtime-config-delegation.md
review_evidence:
  - reviewer: local-vitest
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-30T10:43:30+09:00"
    tests_green_at: "2026-06-30T10:42:58+09:00"
    verdict: approve
    scope: "PLAN-L7-196 runtime config hardening: max_parallel cap plus Claude guard matcher and consumer template enforcement."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    notes:
      - "team schema rejects max_parallel above the runtime cap and preserves default 8."
      - "project/setup/codex hook regression tests keep current and consumer adapter hook contracts green."
      - "SEC-3 closed by MAX_TEAM_PARALLEL=8 and zod .max(MAX_TEAM_PARALLEL)."
      - "SEC-4 closed for current dogfood config by Agent|Task matcher and for consumer template by portable ut-tdd guard hooks."
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\team-schema.test.ts tests\\project-hook.test.ts tests\\setup.test.ts tests\\codex-hook-adapter.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T10:39:47+09:00"
        evidence_path: tests/team-schema.test.ts
        output_digest: "sha256:39e64a5d87d7cfc4417ac5b94c67c574d12695bed0c7f027950ae4604965f676"
        anchor_commit: 1041009386a9500ae95d3304f72e20375ee9a123
      - kind: unit_test
        command: "bun run vitest run tests\\team-schema.test.ts tests\\project-hook.test.ts tests\\setup.test.ts tests\\codex-hook-adapter.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T10:39:47+09:00"
        evidence_path: src/lint/project-hook.ts
        output_digest: "sha256:e7644618bd16aa587f614da0622ae3055472c44e390084a34d15e89f223e2dc9"
        anchor_commit: 1041009386a9500ae95d3304f72e20375ee9a123
      - kind: unit_test
        command: "bun run vitest run tests\\team-schema.test.ts tests\\project-hook.test.ts tests\\setup.test.ts tests\\codex-hook-adapter.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T10:39:47+09:00"
        evidence_path: docs/templates/adapter/.claude/settings.json
        output_digest: "sha256:b1d5d8176a68a35f405921e8233dbcb41cb2a5a10985e709c7e3f8ad5452e29c"
        anchor_commit: 38067e639148f6d16ffe2bc640c48bf7458fe66d
---

# PLAN-L7-196 Runtime Config Hardening

## Finding

A-144/A-145 identified two runtime configuration gaps:

- SEC-3: `.ut-tdd/teams/*.yaml` accepted unbounded `max_parallel`, so a malformed or hostile team definition could request excessive provider launches.
- SEC-4: the dogfood Claude `agent-guard` hook matched only `Agent`, while Claude runtime surfaces can differ between `Agent` and `Task`.

The distribution audit also showed that consumer adapter settings must ship enforced guard hooks, not only session logging.

## Scope

Implemented in this PLAN:

- Add `MAX_TEAM_PARALLEL = 8` and enforce it with `z.number().int().positive().max(MAX_TEAM_PARALLEL).default(MAX_TEAM_PARALLEL)`.
- Add regression coverage that default/explicit `8` is accepted and values above `8` are rejected.
- Change the repo-local Claude agent guard matcher from `Agent` to `Agent|Task`.
- Change the project hook lint SSoT to require `Agent|Task`.
- Add portable `ut-tdd hook agent-guard`, `ut-tdd hook work-guard`, and `ut-tdd hook subagent-stop` entries to `docs/templates/adapter/.claude/settings.json`.
- Back-fill the L6 design and L7 unit-test design with the new `max_parallel` cap oracle.

Out of scope:

- External clean repository publication and tag push.
- Live standard-Claude-Code CLI proof of whether the tool name is `Task`; this plan fail-closes by accepting both names.
- SEC-1 CODEOWNERS/team placeholder hardening.

## Acceptance

- `max_parallel` above `8` is rejected at schema parse time.
- Current dogfood `.claude/settings.json` and `project-hook` lint agree on `Agent|Task`.
- Consumer adapter template contains enforced portable Claude guard hooks.
- Targeted runtime config tests pass.
- Full doctor/lint/typecheck/digest verification is recorded before commit.
