---
plan_id: PLAN-L7-78-claude-stdin-prompt-dispatch
title: "PLAN-L7-78 (troubleshoot): claude dispatch delivers prompts via stdin so native tool markup cannot leak through argv"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-19
updated: 2026-06-19
backprop_decision: not_required
backprop_decision_reason: "Internal harness self-application tooling (lint gate / runtime dispatch / guard / governance mechanism); hardens the harness's own enforcement and does not change the product's external requirement / design / test-design contract, so there is no upstream backprop target."
owner: Codex TL
review_evidence:
  - reviewer: codex-gpt-5
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-19"
    tests_green_at: "2026-06-19"
    verdict: pass
    scope: "Claude provider dispatch no longer sends task text through `-p <task>`. `buildAdapterPlan` emits fixed Claude argv (`--print --input-format text` plus model/effort flags) and carries the prompt in `AdapterPlan.stdin`, matching the existing Codex stdin transport. Regression coverage proves native ClaudeCode tool markup such as `<invoke name=\"Bash\">...` and multi-line prompt text do not appear in argv or the provider invocation string; fake `ut-tdd claude --execute` receives the prompt on stdin while preserving session lifecycle evidence. Follow-up recurrence analysis found an interactive Claude VSCode transcript emitting XML-like pseudo tool calls as assistant text, so repository Claude policy now explicitly forbids `court` / `<invoke>` pseudo tool text and hook status messages are ASCII to avoid adding corrupted context."
    worker_model: codex-gpt-5
    reviewer_model: codex-gpt-5
agent_slots:
  - role: tl
    slot_label: "TL - claude stdin prompt dispatch reliability fix"
generates:
  - artifact_path: docs/plans/PLAN-L7-78-claude-stdin-prompt-dispatch.md
    artifact_type: markdown_doc
  - artifact_path: src/runtime/adapter.ts
    artifact_type: source_module
  - artifact_path: tests/runtime-adapter.test.ts
    artifact_type: test_code
  - artifact_path: tests/runtime-hook-entrypoints.test.ts
    artifact_type: test_code
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
  - artifact_path: CLAUDE.md
    artifact_type: markdown_doc
  - artifact_path: .claude/CLAUDE.md
    artifact_type: markdown_doc
  - artifact_path: .claude/settings.json
    artifact_type: source_module
dependencies:
  parent: docs/plans/PLAN-L7-44-harness-db-master.md
  requires:
    - docs/plans/PLAN-L7-77-codex-stdin-prompt-dispatch.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-78 (troubleshoot): claude stdin prompt dispatch

## 0. Objective

Claude provider dispatch still carried task text on argv as `claude --print -p
<task>`. That left a second transport path where multi-line text, shell
metacharacters, or ClaudeCode native tool markup such as `<invoke name="Bash">`
could be treated as command-line structure or leak as visible text instead of
staying inert prompt content.

PLAN-L7-77 fixed the same class of issue for Codex because Windows `.cmd`
wrapping could truncate prompts. This PLAN completes the provider boundary by
using stdin for Claude prompts as well.

## 1. Scope

In scope:

- `buildAdapterPlan` emits Claude argv as fixed flags only:
  `--print --input-format text` plus optional `--model` / `--effort`.
- Claude prompt text is carried in `AdapterPlan.stdin`, never in `args`.
- `ut-tdd claude --execute` feeds stdin through the existing adapter wrapper and
  continues to record SessionStart / PostToolUse / Stop evidence.
- Regression tests cover multi-line native tool markup and the fake Claude
  execution path.
- Repository Claude runtime policy explicitly forbids writing XML-like pseudo
  tool calls (`court`, `<invoke>`, `<parameter>`) as assistant text; corrupted
  transcript residue must not be continued.
- `.claude/settings.json` status messages are ASCII so hook summaries do not add
  mojibake to future Claude context.

Out of scope:

- Changing Claude Code's native interactive UI protocol.
- Re-enabling legacy raw Claude or HELIX wrapper paths.

## 2. Acceptance Criteria

- `buildAdapterPlan` for Claude contains `--print --input-format text`, does not
  contain `-p`, and stores task text in `plan.stdin`.
- A prompt containing `<invoke name="Bash">...` and newlines does not appear in
  Claude argv or the provider invocation string.
- `ut-tdd claude --execute` fake-provider smoke receives task text on stdin and
  still writes the expected session lifecycle digest.
- Targeted adapter tests, typecheck, lint, and doctor pass.
- Claude runtime policy contains an explicit native-tool-only rule so interactive
  Claude Code sessions do not treat pseudo tool markup as a valid output style.

## 3. Test Design Pairing

Unit test design entry: `docs/test-design/harness/L7-unit-test-design.md`
(U-ADAPTER-008). Red->Green: pre-fix Claude prompt text is embedded in `-p
<task>`; post-fix it is delivered via stdin and absent from argv.

## 4. Status

Confirmed. Implemented and verified 2026-06-19. Recurrence follow-up added the
interactive Claude Code native-tool policy guard after transcript evidence showed
the failure was assistant text generated by Claude VSCode, not argv leakage from
the UT-TDD adapter.
