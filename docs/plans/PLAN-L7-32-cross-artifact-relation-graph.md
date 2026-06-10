---
plan_id: PLAN-L7-32-cross-artifact-relation-graph
title: "PLAN-L7-32 (add-impl): cross-artifact relation graph and verification profile projection"
kind: add-impl
layer: L7
drive: fullstack
status: draft
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
agent_slots:
  - role: tl
    slot_label: "TL - relation graph implementation"
  - role: qa
    slot_label: "QA - relation graph oracles"
generates:
  - artifact_path: src/lint/relation-graph.ts
    artifact_type: source
  - artifact_path: tests/relation-graph.test.ts
    artifact_type: test
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-31-cross-artifact-relation-graph.md
  requires:
    - docs/plans/PLAN-L6-31-cross-artifact-relation-graph.md
    - docs/plans/PLAN-REVERSE-32-cross-artifact-relation-graph.md
---

# PLAN-L7-32 (add-impl): cross-artifact relation graph and verification profile projection

## §0 Position

This PLAN is the only authorized L7 implementation entry for A-124 / A-125 relation graph source work. It exists because PLAN-RECOVERY-03 proved that ad-hoc source creation is unsafe.

## §1 Entry Conditions

Implementation must not start until:

- PLAN-L6-31 has confirmed function signatures and U-* oracles.
- `tests/relation-graph.test.ts` is created first as TDD Red entry and fails only because implementation is absent.
- Existing `verification-profile` tests remain green.
- No raw MCP response, browser trace, screenshot, provider transcript, secret, or credential is stored in the projection rows.

## §2 Implementation Scope

Allowed implementation after entry conditions are met:

- `src/lint/relation-graph.ts`: pure relation graph analyzer / projection normalizer.
- `tests/relation-graph.test.ts`: unit fixtures for source/test/design/DB/MCP evidence impacts.
- CLI wiring only after pure functions are green: `ut-tdd graph impact`, `ut-tdd graph export`, and evidence projection collector.

Out of scope:

- Actual external tool installation.
- Actual MCP server invocation beyond A-125 readiness gates.
- SQLite write path before DB collector/rebuild profile is confirmed.

## §3 Work Schedule

### Step 1: [直列] TDD Red oracle

直列理由: downstream_dependency. The relation graph contract must fail for missing implementation before source is added.

### Step 2: [直列] Pure projection functions

直列理由: downstream_dependency. CLI / DB writer must depend on deterministic pure output.

### Step 3: [並列] CLI smoke and docs back-fill

CLI smoke and doc back-fill can proceed after pure function green.

### Step 4: [直列] review

直列理由: downstream_dependency. typecheck / lint / vitest / doctor must be green before review evidence is recorded.

## §8 DoD

- [ ] Red test exists before source implementation.
- [ ] `bun run test tests/relation-graph.test.ts tests/verification-profile.test.ts` passes.
- [ ] `bun run typecheck`, `bun run lint`, and `bun run src/cli.ts doctor` pass.
- [ ] Reverse fullback closes governance/backlog additions.
