---
plan_id: PLAN-L7-73-claude-native-semver-resolution
title: "PLAN-L7-73 (troubleshoot): semver-newest native Claude resolution (A-137 #6)"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-17
updated: 2026-06-17
backprop_decision: not_required
backprop_decision_reason: "Internal harness self-application tooling (lint gate / runtime dispatch / guard / governance mechanism); hardens the harness's own enforcement and does not change the product's external requirement / design / test-design contract, so there is no upstream backprop target."
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: claude-opus-4-8
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-17"
    tests_green_at: "2026-06-17"
    verdict: pass
    scope: "Discharge A-137 #6 deferred carry: native Claude resolution sorted full paths lexicographically, so 1.9.0 outranked 1.10.0 and mixed-source path prefixes dominated version order. Replaced with per-source version extraction + numeric semver comparison (newestVersioned). PM verified via tsc, Biome, 2 new Vitest cases (lexicographic-trap + mixed-source/platform-suffix), full regression, and doctor. No public signature change (internal resolution only), so no Reverse pairing required."
    worker_model: claude-opus-4-8
    reviewer_model: claude-opus-4-8
agent_slots:
  - role: tl
    slot_label: "TL - native Claude semver resolution"
generates:
  - artifact_path: docs/plans/PLAN-L7-73-claude-native-semver-resolution.md
    artifact_type: markdown_doc
  - artifact_path: src/runtime/adapter.ts
    artifact_type: source_module
  - artifact_path: tests/runtime-adapter.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-68-provider-dispatch-portability.md
  requires:
    - .ut-tdd/audit/A-137-unusable-provider-dispatch-audit.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
  references:
    - src/runtime/detect.ts
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
---

# PLAN-L7-73: semver-newest native Claude resolution

## 0. Objective

Discharge the A-137 #6 deferred carry ("Native Claude version sort — mixed-source
lexicographic sorting may not pick semver-newest native binary") so that
`ut-tdd claude --execute` and the spawnability probe resolve to the genuinely
newest installed native Claude binary.

## 1. Problem

`resolveClaudeNativeCommand` collected native binary candidates from two sources
(`%APPDATA%\Claude\claude-code\<version>\claude.exe` and the VS Code extension
`anthropic.claude-code-<version>`), concatenated them, and picked the newest via
`newestExisting`, which sorted the **full path strings lexicographically** and
took the last element. Two defects followed:

1. Lexicographic version order is wrong: `1.9.0` sorts after `1.10.0` (because
   `"9" > "1"` at the third character), so an older binary could be chosen as
   "newest".
2. With mixed sources the comparison is dominated by the differing path prefix,
   not the version, so the selected binary depends on root path ordering rather
   than the actual version.

## 2. Scope

Allowed changes:

- native Claude binary selection in `src/runtime/adapter.ts`: extract the version
  per source (appData directory name; VS Code extension dir name after the
  `anthropic.claude-code-` prefix) and compare numerically by semver core,
  ignoring pre-release / build / platform suffixes;
- a stable tie-break that keeps the first listed (preferred) source on equal
  versions;
- Vitest coverage for the lexicographic trap and the mixed-source case.

Out of scope:

- Codex resolution (`[codex.exe, codex.cmd]` carries no version; its `.exe`
  preference via `newestExisting` is unchanged);
- any change to the public `resolveClaudeNativeCommand` signature or the
  spawnability probe contract;
- external provider CLI behavior.

## 3. Acceptance Criteria

- Given native candidates `1.9.0` and `1.10.0`, resolution returns the `1.10.0`
  binary.
- Given an appData `1.0.0` and a VS Code `anthropic.claude-code-1.2.0-win32-x64`,
  resolution returns the `1.2.0` binary (semver compared across sources, platform
  suffix ignored).
- `UT_TDD_CLAUDE_BIN` override and PATH fallback behavior are unchanged.
- typecheck / Biome / Vitest / `ut-tdd doctor` stay green; the src file traces to
  this PLAN's `generates`.

## 4. Verification

- `bunx vitest run tests/runtime-adapter.test.ts`
- `bun run typecheck`
- `bun run lint`
- `bun run test`
- `bun run src\\cli.ts doctor`

## 5. Status

Draft. Implemented and verified 2026-06-17. No contract change, so no Reverse
back-fill is required (A-137 #6 was the last open carry of PLAN-L7-68).
