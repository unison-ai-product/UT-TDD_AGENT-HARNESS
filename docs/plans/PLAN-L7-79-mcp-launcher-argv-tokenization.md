---
plan_id: PLAN-L7-79-mcp-launcher-argv-tokenization
title: "PLAN-L7-79 (troubleshoot): generated MCP launcher config carries a tokenized argv instead of the whole command string as one arg"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-19
updated: 2026-06-19
backprop_decision: not_required
backprop_decision_reason: "Internal harness self-application tooling (lint gate / runtime dispatch / guard / governance mechanism); hardens the harness's own enforcement and does not change the product's external requirement / design / test-design contract, so there is no upstream backprop target."
owner: Claude TL
review_evidence:
  - reviewer: codex-gpt-5
    review_kind: cross_agent
    reviewed_at: "2026-06-19"
    tests_green_at: "2026-06-19"
    verdict: pass
    scope: "renderGeneratedMcpConfig no longer packs the whole profile command string into a single args element. A tokenizeCommand helper splits profile.command into command head + argv tail so the executable is never re-included in args (command=\"bun\", args=[\"run\",\"test\"], not args=[\"bun run test\"]). The probe-hint executable is only a fallback for the command word, never for args. Codex cross-review (claude-opus-4-8 worker, codex-gpt-5 reviewer) verdict pass: args is derived only from command tokens after the head; wrapper commands whose head differs from executable resolve correctly; the plain whitespace tokenizer matches the profile-command contract. Regression oracle U-MCPPROFILE-013 asserts the tokenized argv and that args never equals the whole command string."
    worker_model: claude-opus-4-8
    reviewer_model: codex-gpt-5
  - reviewer: gpt-5.4-mini
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-19"
    tests_green_at: "2026-06-19"
    verdict: pass
    scope: "Follow-up: Codex design/implementation review of the tokenize fix found a probe false-confidence gap — probeVerificationProfile only checked the probe-hint executable (e.g. bun) while renderGeneratedMcpConfig launches the command head (e.g. ut-tdd for wrapper profiles), so probe readiness did not cover the generated launcher's launchability. Codex added profileCommandHead + a `launcher` readiness check (commandOk(head, [--help]) when head differs from executable) and oracle U-MCPPROFILE-014. gpt-5.4-mini qualitative subagent review was also run for design/implementation alignment and HELIX separation. Result: the launcher-readiness fix is covered by L6/L7 design/test updates and full regression is green; residual broader design issue is that single-runtime checklist enforcement is split between gate and doctor, to be handled by a separate review-evidence/gate unification PLAN."
    worker_model: codex-gpt-5
    reviewer_model: gpt-5.4-mini
  - reviewer: claude-opus-4-8
    review_kind: cross_agent
    reviewed_at: "2026-06-19"
    tests_green_at: "2026-06-19"
    verdict: pass
    scope: "Cross-provider review of the codex→claude provider handover for the launcher-readiness follow-up. Claude (reviewer) read the diff and verified: the new `launcher` probe check validates exactly the command head renderGeneratedMcpConfig emits (`profileCommandHead`), so probe readiness now covers the generated config's launchability (closes the false-confidence gap where probe only checked the `executable` hint while wrapper profiles launch a different head such as ut-tdd); the `head !== executable` guard avoids redundant checks for runner-backed profiles; existing probe tests (testcontainers docker-unavailable, mcp-inspector refusal) stay green; U-MCPPROFILE-014 cites the explicit oracle id. typecheck + biome + full Vitest + doctor (readability/review-evidence/trace) green. Deeper item — profile.command is a display/template string with placeholders for non-runner MCP-server profiles, so the generated config remains an approximate suggestion — is deferred to a separate design PLAN."
    worker_model: codex-gpt-5
    reviewer_model: claude-opus-4-8
agent_slots:
  - role: tl
    slot_label: "TL - MCP launcher argv tokenization reliability fix"
generates:
  - artifact_path: docs/plans/PLAN-L7-79-mcp-launcher-argv-tokenization.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/verification-profile.ts
    artifact_type: source_module
  - artifact_path: tests/verification-profile.test.ts
    artifact_type: test_code
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L7-44-harness-db-master.md
  requires:
    - docs/plans/PLAN-L7-33-mcp-profile-config-safety.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-79 (troubleshoot): MCP launcher argv tokenization

## 0. Objective

`renderGeneratedMcpConfig` produced an `mcpServers.<id>` entry whose `args` was
`[profile.command]` — the entire command string packed into a single argv
element — while `command` was `profile.executable ?? profile.command.split(" ")[0]`.
For a profile like `bun-unit` (`command: "bun run test"`, `executable: "bun"`)
this emitted `command:"bun", args:["bun run test"]`, double-including the
executable and handing an external MCP launcher a malformed argv. For wrapper
profiles whose `command` head differs from `executable` (e.g. `mcp-inspector-smoke`
with `command:"ut-tdd …"`, `executable:"bun"`) it emitted a `command` that does
not match the args, which would not run at all.

## 1. Scope

In scope:

- Add `tokenizeCommand(command)` that splits a profile command into a
  whitespace-delimited argv array (empty tokens dropped).
- `renderGeneratedMcpConfig` sets `command` = the command head token and `args`
  = the remaining tokens. `executable` is only a defensive fallback for the
  command word (never for args) because it is a PATH-probe hint that can differ
  from the command head.
- Regression test (U-MCPPROFILE-013) asserts the tokenized argv and that the
  whole command string never appears as a single arg.

Out of scope:

- Changing the external MCP client config schema (`{command, args, env}` is the
  standard MCP launcher shape and is unchanged — only `args` is now populated
  correctly).
- Shell-quoted command strings (profile commands are plain whitespace-separated
  words; no profile uses quoting today).

## 2. Acceptance Criteria

- For `bun-unit`, generated server is `command:"bun"`, `args:["run","test"]`.
- For a wrapper profile whose command head differs from `executable`, `command`
  is the command head, not the probe-hint executable.
- No generated server has the whole command string as a single `args` element.
- Existing U-MCPPROFILE-004..006 stay green; typecheck, lint, full Vitest, and
  `ut-tdd doctor` stay green.

## 3. Test Design Pairing

Unit test design entry: `docs/test-design/harness/L7-unit-test-design.md`
(U-MCPPROFILE-013). Red->Green: pre-fix `args` is `[profile.command]` (whole
string); post-fix it is the tokenized tail and the executable is not re-included.

## 4. Status

Confirmed. Implemented and cross-reviewed 2026-06-19. Disposition (D#5) was
TL-approved before implementation; the concrete diff was Codex cross-reviewed
(verdict pass) with the caller-invariant risks documented.

Follow-up (2026-06-19, codex→claude provider handover): Codex review of the
tokenize fix surfaced a probe false-confidence gap (probe checked only the
executable hint, not the generated launcher command head). Codex added a
`launcher` readiness check (oracle U-MCPPROFILE-014). Two gpt-5.4-mini
qualitative subagent reviews were also run: one for design/implementation
alignment and one for HELIX separation. The probe now validates the same command
head the generated config launches. Residual broader item — single-runtime
checklist enforcement is split between `gate` and `doctor` surfaces — is
deferred to a separate review-evidence/gate unification PLAN, not closed here.
