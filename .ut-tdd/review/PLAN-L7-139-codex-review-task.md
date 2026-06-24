# DESK REVIEW (cross-runtime judgement gate) — PLAN-L7-139 Codex hook adapter

You are the QA reviewer in a hybrid Claude+Codex setup. Claude authored the change;
you (Codex, a different model family) are the independent judgement gate. This is a
**desk review of the current UNCOMMITTED working tree only**. Do NOT review recent
commits, other PLANs, or unrelated foreign changes (e.g. PLAN-L2-05/06 are NOT in
scope). Do NOT modify any files. Output a written verdict only.

## Scope (review exactly these working-tree artifacts)

- `hooks.json` (new) — repo-root Codex hook adapter
- `src/lint/codex-hook-adapter.ts` (new) — parity / drift fail-close gate
- `tests/codex-hook-adapter.test.ts` (new) — U-CXHOOK regression tests
- `src/doctor/index.ts` (changed) — `checkCodexHookAdapter` wiring
- `src/lint/project-hook.ts` (changed) — exported `REQUIRED` / `FORBIDDEN_PATH_RE` as shared SSoT
- `docs/plans/PLAN-L7-139-codex-hook-adapter.md` (new) — the PLAN
- `AGENTS.md`, `docs/governance/repository-structure.md`, `docs/test-design/harness/L7-unit-test-design.md` (changed) — docs

## Context (verify, do not trust blindly)

Goal: give the Codex CLI runtime the same repo-local guardrails Claude has (foreign-edit
work-guard + session lifecycle), reusing the SAME TypeScript entrypoints with no logic fork.

Claude claims it confirmed the following from the real `codex.exe` (codex-cli 0.128.0) binary
strings; please sanity-check the reasoning, not just accept it:

- Codex hook payload field names match Claude: `tool_name` / `tool_input` / `file_path` /
  `hook_event_name`. Events: PreToolUse/PostToolUse/SessionStart/Stop (no SubagentStop).
- Codex tool names differ from Claude, so matchers are mapped, not copied:
  `Edit|Write|MultiEdit` -> `apply_patch|write_file`; `Bash` -> `exec_command|local_shell`.
- Codex has no subagent (Agent) tool and no SubagentStop event, so `agent-guard` and
  `subagent-stop` are documented N/A (intentionally omitted), not missing.

## Questions to answer (be adversarial)

1. Correctness of the matcher mapping: would `apply_patch|write_file` actually fire Codex's
   PreToolUse for file edits? Is `work-guard.ts`'s `tool_input.file_path ?? tool_input.path`
   extraction valid for Codex's `apply_patch` payload, or is there a real risk it carries no
   `file_path` (multi-file patch) so the guard silently no-ops = false parity? This is the
   known open residual — give your read.
2. Is the `agent-guard`/`subagent-stop` "N/A" justified, or does Codex have any spawn/subagent
   surface that SHOULD be guarded?
3. Fail-close completeness of `analyzeCodexHookAdapter`: are there divergence cases it would
   miss (a hooks.json that looks like parity but isn't)?
4. Does anything here risk degrading the existing Claude `.claude/settings.json` hooks, the
   `codex-wrapper-parity` gate (U-ADAPTER-009), or write to global `~/.codex/`?
5. Is the PLAN classification (kind=troubleshoot, backprop_decision=not_required, mirroring
   PLAN-L7-114-work-guard) appropriate, or should this have been a fuller L6->L7 descent?

## Output format

- Verdict: approve / approve-with-changes / reject
- Findings: Critical / Important / Minor, each with file:line and a concrete fix
- Explicit answer to the apply_patch payload risk (Q1)
