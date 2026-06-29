---
plan_id: PLAN-L7-190-distribution-runtime-asset-projection
title: "PLAN-L7-190: Distribution runtime asset projection"
kind: impl
layer: L7
drive: be
status: confirmed
created: 2026-06-29
updated: 2026-06-29
owner: Codex
parent_design: docs/design/harness/L6-function-design/setup-solo-team.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
backprop_decision: not_required
backprop_decision_reason: "This closes a distribution/runtime-asset gap inside the existing setup and clean distribution contract. It does not change upstream product requirements or persisted schema."
dependencies:
  parent: docs/design/harness/L6-function-design/setup-solo-team.md
  requires:
    - docs/plans/PLAN-L7-157-distribution-clean-pull.md
    - docs/plans/PLAN-L7-139-codex-hook-adapter.md
agent_slots:
  - role: se
    slot_label: "SE - adapter runtime asset projection"
  - role: qa
    slot_label: "QA - clean distribution acceptance"
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-29T18:12:00+09:00"
    tests_green_at: "2026-06-29T18:07:00+09:00"
    verdict: approve
    scope: "Project Claude subagent/slash-command runtime assets into setup and clean distribution while keeping dogfood runtime state excluded."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\setup.test.ts tests\\distribution-acceptance.test.ts tests\\cli-surface.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T18:07:00+09:00"
        evidence_path: tests/setup.test.ts
        output_digest: "sha256:8bc2bf108f9f5f112f456d6cb1b5d26c849b413c5d47aab9b36c2b6e123c7a07"
      - kind: smoke
        command: "bun run vitest run tests\\setup.test.ts tests\\distribution-acceptance.test.ts tests\\cli-surface.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T18:07:00+09:00"
        evidence_path: tests/distribution-acceptance.test.ts
        output_digest: "sha256:f3a7dc28d3e4ccfe11e9553265177f1c1e6ed104d07c97600ed2864bfa97d83f"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-29T18:07:00+09:00"
        evidence_path: src/setup/index.ts
        output_digest: "sha256:5f5196d61b85fe3a934b6a4a12336c65992f8ac83d529ca59dd513c57ab91e6c"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-29T18:07:00+09:00"
        evidence_path: src/setup/templates.ts
        output_digest: "sha256:7e0249231e819dfe6a6d6456096057e1c77cf38dfdf7173a771994821b110537"
generates:
  - artifact_path: docs/plans/PLAN-L7-190-distribution-runtime-asset-projection.md
    artifact_type: markdown_doc
  - artifact_path: src/setup/index.ts
    artifact_type: source_module
  - artifact_path: src/setup/templates.ts
    artifact_type: source_module
  - artifact_path: tests/setup.test.ts
    artifact_type: test_code
  - artifact_path: tests/distribution-acceptance.test.ts
    artifact_type: test_code
  - artifact_path: docs/templates/adapter/.claude/agents/be-api.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/agents/be-logic.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/agents/code-reviewer.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/agents/db-schema.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/agents/devops-deploy.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/agents/pdm-innovation-manager.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/agents/pdm-marketing-innovation.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/agents/pdm-tech-innovation.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/agents/pmo-haiku.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/agents/pmo-project-explorer.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/agents/pmo-project-scout.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/agents/pmo-sonnet.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/agents/pmo-tech-docs.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/agents/pmo-tech-fork.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/agents/pmo-tech-news.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/agents/qa-test.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/agents/refactor-scout.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/agents/security-audit.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/commands/build.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/commands/code-simplify.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/commands/sdd-plan.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/commands/sdd-review.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/commands/ship.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/commands/spec.md
    artifact_type: template
  - artifact_path: docs/templates/adapter/.claude/commands/test.md
    artifact_type: template
---

# PLAN-L7-190: Distribution runtime asset projection

## Objective

Make the clean distribution package carry the Claude Code and Codex runtime
assets needed by a consumer repository after `ut-tdd setup`, without copying the
dogfood repository's private runtime state into the public channel.

## Problem

`PLAN-L7-157` made the clean package installable and added minimal adapter
templates. The remaining gap was runtime asset completeness:

- Claude subagent roster templates were not fully projected.
- Claude slash command templates were not fully projected.
- Codex hook/config templates were present, but acceptance did not prove they
  travelled with the expanded runtime asset set.
- The previous PLAN draft was parked for a future version and contained
  unreadable text, which weakened the L10-L14 distribution audit trail.

## Scope

- Add consumer-safe adapter templates under `docs/templates/adapter/.claude`.
- Expand setup `COMMON_FILES` so `ut-tdd setup` projects the Claude subagent
  roster and slash commands into brownfield consumers.
- Expand clean distribution required paths so the runtime assets are not
  accidentally dropped from the release channel.
- Expand rollback/readiness metadata so managed runtime assets are visible in
  update and rollback planning.
- Extend setup and clean distribution acceptance tests for the expanded runtime
  asset set.

## Non-Goals

- Do not publish the clean repository, push tags, or sign tarballs from this
  local close cycle.
- Do not copy dogfood `.claude/` runtime files directly into the clean package.
- Do not add hosted/API hook enforcement claims for Codex; `.codex/hooks.json`
  remains scoped to direct Codex CLI/IDE sessions.

## Acceptance

- `planSetup("0-A")` includes Claude subagent and slash command templates.
- `emitSetup` can render those templates even in a consumer repository that has
  no local `docs/templates/adapter` directory.
- `distribution plan --json` includes the expanded adapter runtime assets and
  keeps dogfood `.claude/`, `.codex/`, `.ut-tdd/`, design, plan, and web assets
  out of the clean channel.
- `buildConsumerReadinessPlan` reports the expanded managed path set for
  rollback/update.
- Targeted tests, typecheck, lint, doctor, and clean distribution acceptance are
  green before this PLAN is confirmed.
