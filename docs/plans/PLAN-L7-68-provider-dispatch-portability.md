---
plan_id: PLAN-L7-68-provider-dispatch-portability
title: "PLAN-L7-68 (troubleshoot): provider dispatch portability and handover split"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-16
updated: 2026-06-16
backprop_decision: not_required
backprop_decision_reason: "Internal harness self-application tooling (lint gate / runtime dispatch / guard / governance mechanism); hardens the harness's own enforcement and does not change the product's external requirement / design / test-design contract, so there is no upstream backprop target."
owner: Codex TL
review_evidence:
  - reviewer: codex-self-review
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-16"
    tests_green_at: "2026-06-16"
    verdict: pass
    scope: "Provider dispatch portability, capability-based runtime detection, handover mechanical/explicit split, and HELIX runtime-env separation. Critical 0 / High 0 in self-review; full regression evidence is recorded in session output."
    worker_model: codex-gpt-5
    reviewer_model: codex-gpt-5-intra-runtime-review
agent_slots:
  - role: tl
    slot_label: "TL - provider dispatch portability"
generates:
  - artifact_path: src/runtime/adapter.ts
    artifact_type: source_module
  - artifact_path: src/runtime/detect.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/runtime/provider-handover.ts
    artifact_type: source_module
  - artifact_path: tests/runtime-adapter.test.ts
    artifact_type: test_code
  - artifact_path: tests/runtime.test.ts
    artifact_type: test_code
  - artifact_path: tests/runtime-hook-entrypoints.test.ts
    artifact_type: test_code
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
  - artifact_path: tests/provider-handover.test.ts
    artifact_type: test_code
  - artifact_path: docs/handover/handover-mechanical-explicit.md
    artifact_type: markdown_doc
  - artifact_path: .ut-tdd/audit/A-137-unusable-provider-dispatch-audit.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-34-tool-adapter-probes.md
  requires:
    - .ut-tdd/audit/A-137-unusable-provider-dispatch-audit.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
    - docs/design/harness/L6-function-design/handover-mechanism.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
---

# PLAN-L7-68: provider dispatch portability and handover split

## 0. Objective

Close A-137 by making provider dispatch actually spawnable, by making runtime availability capability-based, and by separating machine-readable provider handover from explicit human handover.

## 1. Scope

Allowed changes:

- native Claude/Codex binary resolution in the shared runtime adapter;
- Windows `.cmd` / `.bat` invocation handling;
- `team run --execute` routing through the same provider invocation path as single-provider execution;
- provider availability detection through spawnability probes;
- `UT_TDD_CLAUDE_BIN` / `UT_TDD_CODEX_BIN` override names;
- removal of legacy wrapper env coupling from provider execution;
- provider handover `handover_kind: "mechanical"`;
- explicit handover markdown that carries judgement and next actions.

Out of scope:

- changing external provider CLI behavior;
- depending on `helix` commands as UT-TDD product runtime;
- storing secrets or raw provider transcripts in handover files.

## 2. Acceptance Criteria

- `ut-tdd status` reports provider availability only when provider commands are spawnable.
- `ut-tdd codex --execute` can resolve Codex through native auto-discovery or `UT_TDD_CODEX_BIN`.
- `ut-tdd claude --execute` can resolve Claude through native auto-discovery or `UT_TDD_CLAUDE_BIN`.
- `team run --execute` uses the shared provider invocation path.
- Windows command scripts are invoked without Node shell/args deprecation warnings.
- Provider handover packages include `handover_kind: "mechanical"`.
- Explicit handover markdown includes the human-readable state and does not rely on provider JSON for nuanced judgement.
- UT-TDD-owned runtime/test surfaces no longer require legacy HELIX provider override or raw-wrapper env names.

## 3. Verification

Required before closing:

- `bunx vitest run tests/runtime-adapter.test.ts tests/runtime.test.ts`
- `bunx vitest run tests/runtime-hook-entrypoints.test.ts tests/cli-surface.test.ts tests/provider-handover.test.ts`
- `bun run typecheck`
- `bun run lint`
- `bun run src\\cli.ts doctor`
- `rg "HELIX_CODEX_BIN|HELIX_CLAUDE_BIN|HELIX_ALLOW_RAW" src tests docs/handover .ut-tdd/handover --glob "!vendor/**"`

## 4. Current Status

Implementation is confirmed for the PLAN-L7-68 slice after targeted tests, typecheck, lint, and doctor cleanup. PLAN-L7-69 remains a separate draft ticket for expanded encoding-corruption automation.
