---
plan_id: PLAN-L7-77-codex-stdin-prompt-dispatch
title: "PLAN-L7-77 (troubleshoot): codex dispatch delivers the prompt via stdin so Windows .cmd shell-wrapping cannot truncate multi-line prompts"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-19
updated: 2026-06-19
backprop_decision: not_required
backprop_decision_reason: "Internal harness self-application tooling (lint gate / runtime dispatch / guard / governance mechanism); hardens the harness's own enforcement and does not change the product's external requirement / design / test-design contract, so there is no upstream backprop target."
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: claude-opus-4-8
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-19"
    tests_green_at: "2026-06-19"
    verdict: pass
    scope: "Live-reproduced defect: ut-tdd codex --execute resolves codex to codex.cmd on Windows; buildProviderInvocation wraps .cmd into a single shell:true cmd.exe command string, so a multi-line / metacharacter task prompt is truncated at the first newline (cmd.exe splits on newline and treats < > | ( ) as operators). Two consecutive live cross-review dispatches received only the first prompt line. Root cause verified by a deterministic buildProviderInvocation probe. Fix: codex prompt is delivered via stdin (codex exec [PROMPT]: '-' or no positional reads stdin) and only fixed flags ride the command line, so the cmd.exe wrapper cannot mangle it. Covered by U-ADAPTER-007 (Red→Green: prompt absent from args and from the wrapped shell command string; carried in plan.stdin). typecheck / Biome / full Vitest / doctor green; live end-to-end re-confirmed by a multi-line codex exec that received the full prompt."
    worker_model: claude-opus-4-8
    reviewer_model: gpt-5.5
agent_slots:
  - role: tl
    slot_label: "TL - codex stdin prompt dispatch reliability fix"
generates:
  - artifact_path: docs/plans/PLAN-L7-77-codex-stdin-prompt-dispatch.md
    artifact_type: markdown_doc
  - artifact_path: src/runtime/adapter.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/team/run.ts
    artifact_type: source_module
  - artifact_path: tests/runtime-adapter.test.ts
    artifact_type: test_code
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-44-harness-db-master.md
  requires:
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-77 (troubleshoot): codex stdin prompt dispatch

## 0. Objective

The hybrid cross-review channel (`ut-tdd codex --execute`, `ut-tdd team run
--route`) silently truncates real prompts on Windows. `codex` resolves to a
`.cmd` shim, and `buildProviderInvocation` wraps `.cmd` invocations into a single
`shell: true` cmd.exe command string. cmd.exe splits that string at the first
newline and treats `< > | ( )` as operators, so any multi-line / metacharacter
task prompt is truncated to its first line. Two consecutive live cross-review
dispatches confirmed Codex received only the first prompt line. This is the
"live end-to-end never exercised" residual of the A-137 provider-dispatch work
surfacing as a real defect (presence ≠ usable). Claude is unaffected because it
resolves to `claude.exe` (`shell: false`, argv passed directly).

## 1. Scope

In scope (verified-present reliability fix):

- **`src/runtime/adapter.ts`** — `AdapterPlan` gains `stdin?: string`.
  `buildAdapterPlan` for codex emits `args = ["exec", -m <model>, "-"]` (no inline
  prompt) and `stdin = task`; `codex exec [PROMPT]` reads instructions from stdin
  when the positional is `-` (or absent). Claude is unchanged (`--print … -p
  <task>`, no stdin) — `claude.exe` is not shell-wrapped.
- **`src/cli.ts`** — the `ut-tdd <provider>` execute path (`spawnSync`) passes
  `input: plan.stdin` with a piped stdin; the `ut-tdd team run --execute`
  `runCommand` writes `stdin` to the child. Prompt no longer rides the cmd.exe
  command line.
- **`src/team/run.ts`** — `TeamRunnerDeps.runCommand` carries `stdin`;
  `executeMember` forwards `member.adapter.stdin`.

Out of scope:

- Claude prompt delivery (unaffected; `claude.exe` is not a `.cmd`).
- The legacy local HELIX `cli/codex` guard shim (removed separately on 2026-06-19;
  unrelated to this code path).

## 2. Acceptance Criteria

- `buildAdapterPlan` for codex carries the task in `plan.stdin`, not in `args`;
  `args` contains `exec` and the `-` stdin sentinel and never the prompt text.
- A multi-line / metacharacter prompt does not appear in the
  `buildProviderInvocation` wrapped cmd.exe command string for codex.
- Claude was unchanged in this PLAN; PLAN-L7-78 supersedes that follow-up by
  moving Claude task text to `plan.stdin`.
- typecheck / Biome / full Vitest / `ut-tdd doctor` stay green; src traces to this
  PLAN `generates`.
- Live re-confirmation: a multi-line `codex exec` through `ut-tdd codex --execute`
  receives the full prompt (cross-review channel restored).

## 3. Test Design Pairing

Unit test design entry: `docs/test-design/harness/L7-unit-test-design.md`
(U-ADAPTER-007). Red→Green: pre-fix the multi-line prompt is embedded in the
wrapped shell command string (truncatable); post-fix it is carried on stdin and
absent from args and the command string.

## 4. Status

Confirmed. Implemented and verified 2026-06-19.
