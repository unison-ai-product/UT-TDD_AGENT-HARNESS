# A-152 - L10-L14 current close snapshot

- **date**: 2026-06-30
- **scope**: current local close state for L10-L14 / distribution readiness after A-150/A-151 remediation and the 2026-06-30 projection-vs-substance audit.
- **boundary**: local evidence only. This record does not claim public GitHub publication, remote CI, signed release artifacts, production deployment, UAT signoff, or post-publication consumer operation.

## Current machine state

Latest local commands:

- `bun src\cli.ts status --json`: `activeDraftTotal=0`, `openDefers=0`, `nonTerminalPlansTotal=7`, `versionUpParked=7`.
- `bun src\cli.ts feedback list --emit`: `total=1797`, `gate=0`, `actionable=0`, `telemetry=1797`.
  - telemetry summary: `artifact_progress_yellow=743`, `missing-test-oracle-id=600`, `skill_acceptance_rate=225`, `skill_firing_rate=225`, `large-document-split=1`.
- `bun src\cli.ts db rebuild`: projection OK, `rows=34505`.
- `bun run test`: 119 test files / 1220 tests passed.
- `bun src\cli.ts doctor`: OK, including `pair-freeze`, `l6-completion`, `l7-completion`, `frontend-design-coverage`, `green-command-digest`, and `forward-convergence`.
- `bun src\cli.ts doctor --strict-telemetry-provenance`: OK.
- `bun src\cli.ts distribution plan --json`: export curation OK, but readiness blocked on `ut-tdd-cli` in the current shell. `bun link` registered `ut-tdd`, yet bare `ut-tdd status --json` still failed in this Windows/npm-Bun environment because the linked executable could not resolve a Bun binary. This is a consumer-hook substance gap, not a green close condition.

## Local close conclusion

L10-L14 are locally closeable only in the scoped sense below:

- **L10 UX / mock boundary**: locally closed for the current mock stage. `screen-impl-pair-freeze`, `g10-ux-workflow`, and L1/L2/L10 trace gates are green. Future high-fidelity prototype or implementation must reopen the L1/L2/L10 pair contract.
- **L11 UAT**: local workflow evidence is green, but user/PO UAT acceptance remains `human_required`.
- **L12 release acceptance**: clean export/setup structure is locally tested, but release acceptance is not closed. Current readiness still requires a real shell where bare `ut-tdd --help` succeeds because shipped Claude/Codex hooks call `ut-tdd ...`.
- **L13 post-deploy**: no released consumer deployment exists in this local run; post-deploy observation remains `external_required`.
- **L14 operations feedback**: local feedback projection gates are green; real released-consumer operations data remains `external_required`.

## Feedback telemetry boundary

Current `feedback_events` open rows are measurement telemetry, not gate/actionable blockers:

- `missing-test-oracle-id` is an info-level catalog-quality signal. It tracks test cases that do not expose a `U-*` oracle id after direct-name and enclosing `describe("U-*")` inheritance. It remains useful backlog telemetry for test catalog quality, but it is intentionally summarized and does not block L10-L14 local close.
- `skill_firing_rate` and `skill_acceptance_rate` are info-level skill telemetry signals. They are feedback-loop measurements, not release gates.
- `artifact_progress_yellow` means implemented artifacts lack linked test evidence or are otherwise not fully green at artifact granularity. With `gate=0/actionable=0`, these rows do not represent open red recovery work for the current close.

## Integrated projection-vs-substance findings

The 2026-06-30 independent review converges on one rule: structural coverage, populated projection tables, and digest equality are not enough to claim operational substance. Current disposition:

| severity | area | finding | current disposition |
|---|---|---|---|
| HIGH | distribution | Consumer hooks call bare `ut-tdd`, but `bun link`/PATH presence does not prove the command runs. | Blocked in current shell; `distribution plan` now reports the observed `ut-tdd --help` failure and this snapshot no longer claims green readiness. |
| HIGH | distribution | Shipped adapter must include enforced guard hooks, not only subagent/command definitions. | Implemented for portable `ut-tdd hook agent-guard`, `work-guard`, and Claude `SubagentStop`; still requires real consumer hook firing evidence after publication. |
| HIGH | evidence integrity | Digest restamp must not be treated as green-command re-execution. | `doctor --strict-telemetry-provenance` and this audit distinguish digest/projection evidence from runtime proof; full hardening remains under PLAN-L7-188/192/193 follow-up scope. |
| HIGH | DB telemetry | Some telemetry tables are projection/hollow (`skill_invocations`, `test_runs`, `guardrail_decisions`, model cost/tokens). | Strict telemetry provenance is green for current gate semantics, but runtime capture closure is not claimed. |
| MED-HIGH | clean export | Blanket governance/doc allowlist can leak dogfood audit docs. | `CLEAN_DENY_FILES`/patterns and tests now exclude known dogfood audit/extraction docs. |
| MED | design coverage | FE design/test bodies are partially pending and coverage gates remain partly presence-based. | Tracked as population/substance backlog; not a consumer setup blocker, not a full design-substance close. |
| MED | drive model | Exit convergence is strong, but signal-to-mode and kind/drive entrance enforcement remains softer. | Locally closed only for current gate scope; entrance enforcement is follow-up hardening. |
| MED | runtime matcher | Claude subagent matcher can differ by environment (`Agent` vs `Task`). | Adapter template includes `Agent|Task`; real runtime firing still requires consumer smoke. |

## Parked work

All non-terminal PLANs are deliberately parked as future-version work:

- `PLAN-L6-37-skill-index-category`
- `PLAN-L7-141-web-dashboard-component-derived`
- `PLAN-L7-146-serverless-readonly-share`
- `PLAN-L7-189-shared-harness-memory-cross-runtime`
- `PLAN-L7-197-github-ops-workflow-hardening`
- `PLAN-L7-198-research-recovery-finding-routing`
- `PLAN-L7-204-central-ui-vscode-webview-local`

Each parked PLAN carries:

- `version_target: future`
- `route_signal: version_deferral`
- `route_mode: version-up`

`plan-governance` now fails `version_target` drafts that omit this certificate, so future-version parking is no longer an unproven prose convention.

## Distribution boundary

Local distribution readiness is split:

- **Green locally**: clean setup/export curation, dogfood governance-document exclusion, adapter templates for Claude and Codex, shipped guard hook wiring through `ut-tdd hook ...` entrypoints, MIT license with UNISON-TECHNOLOGY copyright, and design/governance/ADR Japanese-language gate.
- **Blocked on substance**: bare `ut-tdd` consumer execution is not proven in the current shell. The generated hooks are correct to call `ut-tdd ...`, but the consumer environment must prove `ut-tdd --help` succeeds after install/link. The current Windows/npm-Bun setup shows that `bun link` presence alone is insufficient.
- **Telemetry caveat**: `hook_events` is genuine runtime telemetry, while some DB tables are projection or hollow telemetry by design. `doctor --strict-telemetry-provenance` now distinguishes projection-only telemetry, but this snapshot does not claim full runtime capture for skill invocations, guardrail decisions, or model cost/tokens.

Full release close still requires external/publication evidence:

- clean GitHub repository or release branch visible to consumers,
- tag push and tag-pin install/update smoke,
- signed tarball/checksum publication,
- remote CI on the published state,
- consumer install smoke from the published artifact,
- real Claude Code and Codex consumer hook firing, including subagent/command/guard behavior,
- rollback/update smoke on an actual consumer project.

## Supersedes stale local counts

This snapshot supersedes stale counts in older audit prose such as A-143 where non-terminal counts were recorded before later version-up parking. The current source of truth is `status --json` plus the gate outputs listed above.
