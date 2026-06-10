---
plan_id: PLAN-L7-33-mcp-profile-config-safety
title: "PLAN-L7-33 (add-impl): MCP profile config and external verification safety"
kind: add-impl
layer: L7
drive: fullstack
status: draft
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
agent_slots:
  - role: tl
    slot_label: "TL - MCP profile safety implementation"
  - role: qa
    slot_label: "QA - U-MCPPROFILE oracle"
generates:
  - artifact_path: src/lint/verification-profile.ts
    artifact_type: source
  - artifact_path: tests/verification-profile.test.ts
    artifact_type: test
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

- [ ] Red test exists before source implementation.
- [ ] U-MCPPROFILE-001..012 pass.
- [ ] `bun run test tests/verification-profile.test.ts tests/doctor.test.ts` passes.
- [ ] `bun run typecheck`, `bun run lint`, and `bun run src/cli.ts doctor` pass.
- [ ] Reverse fullback closes governance/backlog additions.
