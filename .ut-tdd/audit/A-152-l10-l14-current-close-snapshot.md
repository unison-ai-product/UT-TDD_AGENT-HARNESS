# A-152 - L10-L14 current close snapshot

- **date**: 2026-06-30
- **scope**: current local close state for L10-L14 / distribution readiness after A-150 and A-151 remediation.
- **boundary**: local evidence only. This record does not claim public GitHub publication, remote CI, signed release artifacts, production deployment, UAT signoff, or post-publication consumer operation.

## Current machine state

Latest local commands:

- `bun src\cli.ts status --json`: `activeDraftTotal=0`, `openDefers=0`, `nonTerminalPlansTotal=7`, `versionUpParked=7`.
- `bun src\cli.ts feedback list --emit`: `gate=0`, `actionable=0`; remaining rows are telemetry/info.
- `bun src\cli.ts db rebuild`: projection OK, `rows=34225`.
- `bun src\cli.ts doctor`: OK, including `pair-freeze`, `l6-completion`, `l7-completion`, `frontend-design-coverage`, `green-command-digest`, and `forward-convergence`.
- `bun src\cli.ts doctor --strict-telemetry-provenance`: OK.

## Local close conclusion

L10-L14 are locally closeable only in the scoped sense below:

- **L10 UX / mock boundary**: locally closed for the current mock stage. `screen-impl-pair-freeze`, `g10-ux-workflow`, and L1/L2/L10 trace gates are green. Future high-fidelity prototype or implementation must reopen the L1/L2/L10 pair contract.
- **L11 UAT**: local workflow evidence is green, but user/PO UAT acceptance remains `human_required`.
- **L12 release acceptance**: local distribution and setup gates are green, but clean release acceptance on an approved release target remains `human_required`.
- **L13 post-deploy**: no released consumer deployment exists in this local run; post-deploy observation remains `external_required`.
- **L14 operations feedback**: local feedback projection gates are green; real released-consumer operations data remains `external_required`.

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

Local distribution readiness is green for:

- clean setup/export curation and dogfood exclusion,
- adapter templates for Claude and Codex,
- shipped hook guard wiring through portable `ut-tdd hook ...` entrypoints,
- bare `ut-tdd` PATH readiness documentation and setup warning,
- MIT license with UNISON-TECHNOLOGY copyright,
- design/governance/ADR Japanese-language gate.

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
