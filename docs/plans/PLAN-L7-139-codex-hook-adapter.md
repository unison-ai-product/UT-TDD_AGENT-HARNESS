---
plan_id: PLAN-L7-139-codex-hook-adapter
title: "PLAN-L7-139: Codex hook adapter (orchestrator-rule parity)"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-24
updated: 2026-06-24
owner: Claude
backprop_decision: not_required
backprop_decision_reason: "Developer-local runtime guard parity: gives the Codex CLI the same repo-local foreign-edit / session-lifecycle hooks Claude already has, enforcing the existing hybrid Git rule. It does not change product requirements or runtime user behavior (mirrors PLAN-L7-114-work-guard, which is the Claude side of the same guard)."
agent_slots:
  - role: tl
    slot_label: "TL - Codex hook adapter (repo-local .codex/hooks.json, parity gate)"
  - role: aim
    slot_label: "AIM - troubleshoot classification + cross-runtime guard parity review"
generates:
  - artifact_path: docs/plans/PLAN-L7-139-codex-hook-adapter.md
    artifact_type: markdown_doc
  - artifact_path: .codex/hooks.json
    artifact_type: json_config
  - artifact_path: .codex/config.toml
    artifact_type: json_config
  - artifact_path: src/lint/codex-hook-adapter.ts
    artifact_type: source_module
  - artifact_path: src/lint/hook-invocation.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: tests/codex-hook-adapter.test.ts
    artifact_type: test_code
  - artifact_path: tests/work-guard.test.ts
    artifact_type: test_code
  - artifact_path: tests/hook-native-launcher.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires:
    - PLAN-L7-114-work-guard
review_evidence:
  - reviewer: claude-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-24T12:20:00+09:00"
    tests_green_at: "2026-06-24T12:17:00+09:00"
    verdict: approve
    scope: "Cross-runtime (Codex/gpt-5.5) desk review returned REJECT (see body '## Cross-runtime review'); all three substantive findings verified TRUE against the real codex.exe 0.128.0 binary (233.8MB, strings inspection) and addressed in code. (Critical) work-guard now extracts edit targets from the apply_patch freeform patch body (`*** Update/Add/Delete File:` / `*** Move to:`, multi-file) so the foreign-edit block actually fires for apply_patch — runtime-agnostic pure fn `extractEditTargets`, Claude file_path path unchanged. (Important) spawn_agent N/A falsehood corrected: subagent-stop is genuinely N/A (no SubagentStop event) but the spawn_agent surface is recorded as a real, currently-unguarded deferred follow-up (CODEX_DEFERRED_SURFACE), not absent. (Important) analyzer hardened: `type===\"command\"` required + token-exact path matching. status=confirmed because the deliverables are merged (merged-plan-status hard-requires confirmed+evidence for merged artifacts) and the change is unit-green (32 tests); the end-to-end live Codex hook-payload run is a documented hardening follow-up, not a confirmation blocker (the parser is payload-key-agnostic, so the residual is only whether Codex puts the patch in tool_input at all — the freeform single-arg binary evidence makes that low-risk)."
    worker_model: claude-opus-4-8
    reviewer_model: claude-opus-4-8
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-24T12:17:00+09:00"
        evidence_path: src/runtime/work-guard.ts
        output_digest: "sha256:ad589a73486d347838c5b913d7746df7b8037a50c2e97baa29790b2c22b8c81b"
        anchor_commit: 562d9eaffd2aa2f46edc6c24b61570665aa26b65
      - kind: unit_test
        command: "bun run vitest run tests/work-guard.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-24T12:17:00+09:00"
        evidence_path: tests/work-guard.test.ts
        output_digest: "sha256:5ff89dd03a0e6ec91733514d7c94ee10a7bf2dbe8b148a24c73d779a0681c35b"
        anchor_commit: 69b1521e2ae6f78e87deed9491859a4688767b79
      - kind: unit_test
        command: "bun run vitest run tests/codex-hook-adapter.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-24T12:17:00+09:00"
        evidence_path: tests/codex-hook-adapter.test.ts
        output_digest: "sha256:cac7af4022bdcc150395b3ab2ed6295d167485c3508f99224f817bb5ca3c128d"
        anchor_commit: 442e279bbf31626689d57c2f2f5a89f1dad52241
---

# PLAN-L7-139: Codex hook adapter (orchestrator-rule parity)

## Status

`confirmed`. The deliverables are merged in the working tree, and
`merged-plan-status` hard-requires a confirmed + review_evidence-backed PLAN for
any merged deliverable — leaving finished, verified work under a `draft` PLAN
would itself be a state-drift violation. The foreign-edit guard parity is
implemented, unit-green (32 tests), and the cross-runtime (Codex) review's REJECT
findings are all addressed. The end-to-end live confirmation — running `codex` in
this repo and observing a real `work-guard` block on a foreign `apply_patch` edit
— is a documented **hardening follow-up**, not a confirmation blocker:
`extractEditTargets` is payload-key-agnostic (leaf-scan), so the only residual is
whether Codex includes the patch in the PreToolUse `tool_input` at all, which the
binary's freeform single-argument evidence makes low-risk. See **Follow-ups**.

## Problem

Claude Code enforces orchestration guardrails via `.claude/settings.json` hooks
(`work-guard` foreign-edit block, session lifecycle). The Codex CLI runtime had
project rules in `AGENTS.md` but **no mechanical hook enforcement** for direct /
interactive use, so a developer running `codex` in this repo could edit foreign
uncommitted files without the block Claude applies. This is the Codex side of the
same guard `PLAN-L7-114-work-guard` built for Claude.

The feasibility spike `PLAN-DISCOVERY-06-orchestrator-rule-parity` confirmed
(ADOPT) that Codex CLI 0.128.0 ships a Claude-compatible hook system (`hooks.json`,
`PreToolUse`/`PostToolUse`/`SessionStart`/`Stop`, `permissionDecision: deny`,
payload field names shared with Claude). This PLAN lands the implementation.

## What it does

- **`.codex/hooks.json`**: Codex hook adapter mirroring the Claude guards,
  reusing the SAME TypeScript entrypoints (`.claude/hooks/work-guard.ts`,
  `bun src/cli.ts session ...`) with NO logic fork. Repo-relative; never writes
  global `~/.codex/`.
- **`.codex/config.toml`**: enables project-local hooks explicitly with
  `[features].hooks = true`; Codex loads project `.codex/` layers only for
  trusted projects.
- **Explicit scope boundary**: `.codex/hooks.json` is a Codex CLI / Codex IDE
  project-local hook source. It does **not** intercept hosted API/developer
  tool calls supplied by the surrounding chat runtime (for example this
  session's `apply_patch`). A live smoke on 2026-06-24 confirmed that this
  session's API-provided `apply_patch` can edit an untracked file without the
  repo hook firing, while the same payload sent directly to
  `.claude/hooks/work-guard.ts` exits 2 and blocks. Therefore `doctor`
  must not imply that `.codex/hooks.json` mechanically guards all Codex-branded
  execution surfaces.
- **Matcher mapping** (Codex tool names differ from Claude; a literal copy would
  never fire = false parity. Confirmed from the `codex.exe` 0.128.0 binary):
  - `Edit|Write|MultiEdit` -> `apply_patch|write_file` (work-guard).
  - `Bash` -> `exec_command|local_shell` (PostToolUse session logging).
- **`work-guard` apply_patch path extraction** (the cross-runtime REJECT fix):
  Codex's `apply_patch` is **freeform** and carries no `tool_input.file_path` —
  the edited paths live in the patch body (`*** Update File:` / `*** Add File:` /
  `*** Delete File:` / `*** Move to:`, multi-file). The original
  `file_path ?? path` extraction silently no-op'd for apply_patch = false parity.
  `src/runtime/work-guard.ts` now exposes a runtime-agnostic pure fn
  `extractEditTargets` that returns the explicit `file_path`/`path` for Claude /
  `write_file`, or parses ALL patch-body paths for apply_patch. The entrypoint
  evaluates every target and blocks if any is foreign-uncommitted. Claude's
  behavior is unchanged (it always sends `file_path`).
- **N/A vs deferred (the cross-runtime REJECT correction)**:
  - `subagent-stop` (`SubagentStop`) is **genuinely N/A**: codex.exe 0.128.0
    exposes only `PreToolUse`/`PostToolUse`/`SessionStart`/`Stop`/
    `UserPromptSubmit` hook events (no `SubagentStop`, confirmed by binary).
  - `agent-guard` is **NOT N/A**. Codex has a real sub-agent surface
    (`spawn_agent` / `wait_agent` / `list_agents` / `close_agent` /
    `spawn_agents_on_csv` — 19 `spawn_agent` occurrences, "This spawn_agent tool
    provides you access to sub-agents"). It is recorded as a **deferred,
    currently-unguarded surface** (`CODEX_DEFERRED_SURFACE`), not an absent one.
    Wiring an agent-guard analog needs a Codex allowlist/model design because
    `spawn_agent` semantics (model inheritance, `agent_role`, canonical task name)
    differ from Claude's `subagent_type`.
- **`src/lint/codex-hook-adapter.ts` + doctor `codex-hook-adapter`**: fail-close
  parity check that `.codex/hooks.json` declares the same guard entrypoints as
  `.claude/settings.json` with Codex matchers, `blockOnFailure` on the guard, no
  `$CLAUDE_PROJECT_DIR` (Codex would not expand it), and no global `~/.codex/`
  reference. Hardened per review: only `type==="command"` hooks satisfy a guard,
  and the script-path token must match exactly (no loose substring). The
  entrypoint set is shared with `src/lint/project-hook.ts` `REQUIRED` (SSoT); a
  one-sided entrypoint is `entrypoint_drift`.
- **`tests/codex-hook-adapter.test.ts`** (U-CXHOOK-001..014) +
  **`tests/work-guard.test.ts`** (`extractEditTargets` cases): real-repo
  regression + every fail-close branch + shared-guard runtime-agnostic parity +
  apply_patch multi-file path extraction (the false-parity regression).

## Cross-runtime review (hybrid judgement gate)

`ut-tdd codex --role qa --task-file .ut-tdd/review/PLAN-L7-139-codex-review-task.md
--plan PLAN-L7-139-codex-hook-adapter --execute` (reviewer = gpt-5.5, a different
model family) returned **Verdict: reject**. All three substantive findings were
verified TRUE against the real `codex.exe` 0.128.0 binary and addressed:

| Finding | Severity | Verified | Resolution |
| --- | --- | --- | --- |
| `apply_patch` carries no `file_path` -> work-guard no-ops = false parity | Critical | TRUE (freeform, "accepts exactly one argument", path in patch body) | `extractEditTargets` parses patch-body paths (multi-file) |
| `agent-guard` "N/A" wrong: `spawn_agent` sub-agent family exists | Important | TRUE (19x `spawn_agent`, tool family) | corrected to `CODEX_DEFERRED_SURFACE` (real, unguarded, deferred) |
| analyzer should require `type==="command"` + stricter tokens | Important | n/a (design) | added `type==="command"` + token-exact path matching |
| status=confirmed premature | Minor | n/a | status=draft until live hook-payload run |

## Acceptance criteria

1. Codex `.codex/hooks.json` exists, mirroring the Claude guard
   entrypoints with Codex matchers. (U-CXHOOK-001)
2. `doctor` `codex-hook-adapter` fails closed when the Codex adapter diverges
   from the Claude hook config (missing guard, literal-copy matcher, dropped
   `blockOnFailure`, `$CLAUDE_PROJECT_DIR`, global `~/.codex/`, entrypoint
   drift, non-`command` hook, loose token match). (U-CXHOOK-002..010, 013, 014)
3. No global `~/.codex/` writes; config stays repo-relative. (U-CXHOOK-009)
4. `work-guard` extracts apply_patch patch-body paths (multi-file) so the
   foreign-edit block fires for Codex's primary edit tool, not just `write_file`;
   Claude `file_path` behavior unchanged. (`extractEditTargets` tests in
   `tests/work-guard.test.ts`)
5. `subagent-stop` documented genuinely N/A; `spawn_agent` recorded as a real,
   currently-unguarded **deferred** surface (not N/A); shared guard logic
   verified runtime-agnostic. (U-CXHOOK-011, U-CXHOOK-012)
6. `doctor` surfaces the hosted API/developer-tool limitation explicitly:
   `.codex/hooks.json` covers direct Codex CLI/IDE sessions, but not this
   chat/runtime's injected `apply_patch` tool path.

## Follow-ups (hardening, not confirmation blockers)

- **Live hook-payload run**: run `codex` in this repo and confirm `work-guard`
  actually blocks a foreign `apply_patch` edit — verifies the exact PreToolUse
  `tool_input` key carrying the patch (binary-inspected, not yet observed live).
  `write_file` payload still also unconfirmed live. Low residual risk because
  `extractEditTargets` is payload-key-agnostic.
- **Hosted API tool enforcement**: repo files cannot make the surrounding
  platform call `.codex/hooks.json` before its injected developer tools. True
  mechanical enforcement for this chat/API path requires platform-level hook
  support or removal of the raw `apply_patch` surface. As a repo-side
  countermeasure, `ut-tdd guard preflight` runs the same `work-guard` decision
  before hosted/API edits: it accepts explicit targets, patch files, or stdin
  apply_patch bodies, returns exit 2 on foreign uncommitted targets, and reports
  `apiToolPathEnforced=false` so callers do not confuse preflight with mechanical
  hook interception.
- **`spawn_agent` guard**: design a Codex agent-guard analog (allowlist / model
  policy for the `spawn_agent` tool family) and wire it into `.codex/hooks.json`.

## 2026-06-29 follow-up discharge

The deferred `spawn_agent` guard surface is now locally wired:

- `.codex/hooks.json` includes `PreToolUse` matcher `spawn_agent|spawn_agents_on_csv`
  with `bun .claude/hooks/agent-guard.ts` and `blockOnFailure: true`.
- Consumer adapter templates include the portable equivalent
  `ut-tdd hook agent-guard`.
- `evaluateAgentGuard` recognizes Codex `spawn_agent` / `spawn_agents_on_csv`
  and accepts `subagent_type`, `agent_type`, `agent`, `role`, or `name` as the
  subagent identifier plus `model` / `model_family`.
- `codex-hook-adapter` no longer reports `spawn_agent` as a deferred surface;
  only `SubagentStop` remains N/A for Codex.
- **SSoT materializer**: emit `.claude/settings.json` and `.codex/hooks.json` from one
  source (`ut-tdd setup`) instead of two hand-maintained adapters; currently the
  `codex-hook-adapter` drift gate keeps them in sync.

## 2026-07-22 Issue #123 add-impl 追補

Claude hook の shell-free exec form 導入では、Codex hook serialization を同時に推測変更しない。
shared contract は `HookInvocation { executable, args }` (`args` は argv) までとし、Claude / Codex の JSON projection は
別 serializer が所有する。Codex の structured `args` capability が runtime 実機または公式 schema で
証明されるまでは、Codex serializer は既存の実証済み形式を保持する。

`codex-hook-adapter` の parity は raw command 文字列の同一性ではなく、runtime 固有 config を正規化した
executable+argv の意味論、matcher、fail-close policy の一致を検証する。Claude exec form を Codex に
要求すること、または Codex の shell form を Claude に許容することはどちらも禁止する。

Issue #123 で新設した semantic invocation SSoT、source native launcher、対応 regression は
本 PLAN の add-impl 成果物とする。`tests/hook-native-launcher.test.ts` は repository root を
live tree として直接検証せず、snapshot runner が用意した writable execution snapshot を
`process.cwd()` から 1 回参照する `isolated_fixture` 契約とする。この呼出し数は
`test-repository-isolation` が fail-close し、実装側の例外 allowlist ではなく本 PLAN と
L7 test design による設計 trace を正本とする。

## 2026-07-23 Windows process custody の未解消境界

`windowsHide: true` はコンソール窓を抑止するだけで、launcher とその子孫を同じ
process-tree custody に収容しない。現在の `node -> bun` launcher は POSIX signal を子へ転送するが、
Windows の `TerminateProcess` 終了時に孫 process を回収する保証を持たない。この seam は未解消であり、
shell-free 起動の Green を `orphan_count=0` の証拠として扱ってはならない。

恒久解は Issue #134 の Node + Rust 移行で、Rust Resource Kernel が Windows Job Object を所有し、
launcher・provider・全子孫の終了と空 custody receipt を検証する。Issue #134 が受入されるまでは
本 PLAN を Windows process custody 完了証拠に使用せず、`ST-RGK-*` を未充足のまま
fail-closeする。

## 訂正注記 (2026-08-06)

`.claude/hooks/run-bun.ts` (hook launcher shim) は PLAN-L7-462 PR-C (Bun 撤退 step 1) で撤去され、hooks は node 直起動になった。generates から当該 artifact を除去 (plan-artifact-existence の phantom 化対応)。launcher の挙動契約は consumer 向け template (src/setup/templates.ts "common/run-bun.ts") 側に存続し、その撤去は PLAN-L7-462 step 2 が所有する。
