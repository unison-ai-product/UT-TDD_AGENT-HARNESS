---
plan_id: PLAN-L7-33-mcp-profile-config-safety
title: "PLAN-L7-33 (add-impl): MCP profile config and external verification safety"
kind: add-impl
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-11
owner: Codex TL / PO
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-11"
    tests_green_at: "2026-06-11"
    verdict: pass
    scope: "U-MCPPROFILE-001..012 promoted to green tests. Docker MCP Toolkit profile metadata, generated local MCP config rendering, profile safety findings, and activation planning are implemented as pure functions. Critical 0 / Important 0. No package installation, MCP server execution, profile enablement, committed .vscode/mcp.json write, or inline credential persistence is introduced."
    worker_model: codex-gpt-5
    reviewer_model: codex-gpt-5-intra-runtime-review
agent_slots:
  - role: tl
    slot_label: "TL - MCP profile safety implementation"
  - role: qa
    slot_label: "QA - U-MCPPROFILE oracle"
generates:
  - artifact_path: src/lint/verification-profile.ts
    artifact_type: source_module
  - artifact_path: tests/verification-profile.test.ts
    artifact_type: test_code
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-32-mcp-profile-config-safety.md
  requires:
    - docs/plans/PLAN-L6-32-mcp-profile-config-safety.md
    - docs/plans/PLAN-REVERSE-33-mcp-profile-config-safety.md
---

# PLAN-L7-33 (add-impl): MCP profile config and external verification safety

## §0 Position

This is the future L7 implementation entry for PLAN-L6-32. It is the authorized route for adding Docker MCP Toolkit to the profile catalog and implementing generated MCP config / external-profile safety lint.

## §1 Entry Conditions

Implementation must not start until:

- PLAN-L6-32 has confirmed function contracts and U-MCPPROFILE oracles.
- `tests/verification-profile.test.ts` receives a TDD Red case for U-MCPPROFILE behavior before source changes.
- Existing verification-profile, doctor, typecheck, and lint checks are green before review evidence.
- No generated config writes committed secrets or user-specific absolute home paths.

## §2 Implementation Scope

Allowed implementation after entry conditions are met:

- Add Docker MCP Toolkit as an optional disabled profile with Docker/toolkit readiness checks.
- Add pure functions for generated config rendering and safety analysis.
- Extend CLI only after pure functions are green, likely under `ut-tdd mcp profile config` or a dry-run-only equivalent.

Out of scope:

- Actual package installation.
- Actual MCP server execution or profile enablement.
- Writing `.vscode/mcp.json` or other Git-tracked local config.

## §3 Work Schedule

### Step 1: [直列] TDD Red oracle

直列理由: downstream_dependency. U-MCPPROFILE behavior must fail for missing implementation before source changes.

### Step 2: [直列] Pure catalog/config/safety functions

直列理由: downstream_dependency. CLI or DB projection must depend on deterministic pure output.

### Step 3: [並列] CLI dry-run surface and docs back-fill

CLI dry-run and documentation back-fill can proceed after pure functions are green.

### Step 4: [直列] review

直列理由: downstream_dependency. typecheck / lint / targeted tests / doctor must be green before review evidence.

## §8 DoD

- [x] Red test exists before source implementation.
- [x] U-MCPPROFILE-001..012 pass.
- [x] `bun run vitest run tests/verification-profile.test.ts` passes before review.
- [x] `bun run typecheck` and `bun run lint` pass before review.
- [x] Reverse fullback closes governance/backlog additions.
