# A-150 - L7-L14 substance gap integrated audit

- **date**: 2026-06-30
- **source**: PO / ClaudeCode independent findings, verified against local `status`, `doctor`, `feedback`, and `harness.db` projections.
- **scope**: L7-L14 local close readiness, distribution package boundary, workflow coverage, drive-model convergence, and telemetry provenance.
- **boundary**: This is a local audit record. It does not claim external GitHub publication, remote CI, signed tarball release, tag push, or post-publication consumer install.

## Summary

Local workflow structure is strong: V-model layers, drive-model exit convergence, doctor gates, relation graph projection, and local green evidence are present. The remaining closure risk is not lack of structure. The repeated gap is projection versus substance: several gates prove presence, hash alignment, or declared contracts, while the higher claim requires runtime provenance, shipped enforcement, consumer install behavior, or concrete downstream closure.

## Integrated findings

| id | severity | area | finding | current disposition |
| --- | --- | --- | --- | --- |
| A150-01 | high | distribution | Consumer adapters must ship subagent/command rosters with enforced guard parity, not only definitions. | Rechecked on 2026-06-30: portable `ut-tdd hook agent-guard`, `ut-tdd hook work-guard`, and Claude `ut-tdd hook subagent-stop` are present in adapter templates; Codex `spawn_agent|spawn_agents_on_csv` and `apply_patch|write_file` are wired with `blockOnFailure`. Residual boundary: live consumer hook firing on real published install remains post-publication smoke. |
| A150-02 | high | distribution / OS | Distributed adapter templates invoke bare `ut-tdd`; consumer PATH/global-link setup must exist before hooks can fire. | Rechecked by mini explorer on 2026-06-30: README documents `bun link` / `bun link ut-tdd`, setup preflight warns when `ut-tdd` is missing, and consumer readiness / clean distribution smoke tests exist. Residual gap: setup warns and documents PATH linking but does not automatically create a consumer-local `.ut-tdd/bin` or global link. |
| A150-03 | high | green evidence integrity | `green-command-digest` can be satisfied by restamping digest files; digest equality alone does not prove current-command rerun. | Remediated on 2026-06-30 by A-153: all affected command groups were rerun, 63 stale `green_commands` rows were rebound in the same packet, and `ut-tdd doctor --strict-green-command-digest` now passes. Future corrections must remain rerun-bound; hash-only restamp remains prohibited. |
| A150-04 | high | DB telemetry provenance | `hook_events` is genuine runtime telemetry, but runtime-capability claims must distinguish projection rows from real session/log provenance. | Rechecked on 2026-06-30: `PLAN-L7-188` child slices and `ut-tdd doctor --strict-telemetry-provenance` provide provenance-aware fail-close; current strict doctor is green. `ut-tdd telemetry scan --json` ingested 136905 Claude/Codex session runs into persisted `model_runs`; persisted DB now has runtime provenance in all four monitored telemetry tables. Residual boundary: deterministic `db rebuild` is not itself telemetry capture; strict close requires runtime rows or explicit telemetry scan evidence. |
| A150-05 | med-high | distribution curation | Blanket `docs/governance/` clean allow could include dogfood audit records. | Rechecked by mini explorer on 2026-06-30: current implementation is not blanket prefix allow. `src/setup/index.ts` uses per-file allow plus deny/curation patterns, and setup/distribution tests cover dogfood governance exclusions. Residual note: violation reporting is mostly asserted through `artifactPaths` / `excludedPaths` negative tests. |
| A150-06 | medium | design coverage | FE design slots are defined and L3/L5/L6 bodies now exist, but FE right-arm verification substance remains incomplete for later layers. | Rechecked on 2026-06-30: `frontend-design-coverage` reports body present 6 / pending 0 and `document-system-map` cites `screen-functional`, `ui-detail`, and `screen-spec` bodies. Residual gap: L8/L9 FE viewpoints and L11/L12/L14 operational/acceptance FE evidence remain under-populated. |
| A150-07 | medium | drive-model entry | Drive-model exit convergence is strong; entry enforcement must distinguish what is already hard-gated from what remains an authoring/selection boundary. | Rechecked on 2026-06-30: kind-drive compatibility is effectively enforced because all 12 kinds permit only the 5 specialist drives via `driveSchema`, while `add-*` parent drive compatibility is hard-gated by `parent_drive_mismatch`; kind-layer authoring is guarded by schema/plan-governance; signal routing has `route eval` / `routeSignalToMode` coverage and approval gates. Local remediation added `version_deferral -> version-up` routing and requires `version_target` parked drafts to carry `route_signal: version_deferral` plus `route_mode: version-up`. Residual boundary: general newly authored PLANs are not yet required to carry a route-eval certificate proving that the selected kind/mode came from the detected entry signal. Research/Recovery downstream absorption remains partially soft unless landed through downstream design/test/guard artifacts. |
| A150-08 | medium | runtime matcher | Claude subagent matcher name may differ by runtime surface (`Agent` versus `Task`), creating a possible silent guard miss outside the current SDK environment. | Rechecked on 2026-06-30: adapter template uses `Agent|Task`, closing the known matcher split. Residual boundary: real consumer Claude Code hook firing remains post-publication smoke. |

## Local remediations recorded in this slice

- `PLAN-L7-208` now owns the public design/governance/ADR language-gate change set explicitly through `generates`.
- `PLAN-L7-209` closes the governance relation graph `missing-projection` gap by materializing all `docs/governance/**/*.md` files as design nodes.
- `impact_results` projection now closes working-tree relation impacts only when the changed artifact is generated by a successful PLAN and that PLAN has review evidence plus `tests_green_at`.
- This keeps dependency impact as substance-aware telemetry: unowned or unevidenced changes remain open; owned and reviewed changes stop producing false red dependency feedback.
- Consumer adapter templates now include portable enforced guard hooks for Claude and Codex (`ut-tdd hook agent-guard`, `ut-tdd hook work-guard`, and Claude `ut-tdd hook subagent-stop`) and keep real repo `.claude/.codex` dogfood settings out of clean distribution artifacts.
- VSCode / IDE settings are intentionally local suggestions rather than distributed runtime state: `.vscode/mcp.json` is not written by generated MCP config, and `.vscode/` is outside the clean distribution allowlist.
- Follow-up judge findings on workflow coverage, drive-model entry/certificate boundaries, and telemetry provenance are consolidated in `.ut-tdd/audit/A-154-workflow-drive-telemetry-substance-audit.md`.

## Additional judge findings on workflow coverage, drive model, and DB telemetry

The 2026-06-30 independent judge pass confirms that the workflow definitions are structurally strong, but the same projection-versus-substance boundary appears in three more areas.

### Workflow coverage

The document-system map is a strong coverage definition: L0-L14 artifacts, V-pairs, FE/UI descent slots, and right-arm test-design layers are grounded in recognized standards and are enforced by broad doctor gates (`descent-obligation`, `frontend-design-coverage`, `proposal-document-coverage`, `doc-consistency`, `entity-coverage`, and G8/G9/G10 workflow checks).

The remaining weakness is not the coverage model. It is right-arm population and substance:

- FE left-arm slots for L3 screen-functional, L5 ui-detail, and L6 screen-spec are now body-populated.
- FE right-arm verification coverage for L8/L9/L11/L12/L14 remains under-populated.
- `frontend-design-coverage` proves slot/file/schema alignment and surfaces pending bodies, but does not prove that present bodies are substantive.

Disposition: not a consumer-distribution blocker. It blocks a stronger claim that the dogfood product's FE verification body is fully populated across the right arm.

### IDE and adapter distribution boundary

The clean package boundary separates local editor convenience from runtime adapter state:

- `.vscode/` is not in the clean distribution allowlist.
- Generated MCP config targets `.ut-tdd/local/mcp.generated.json`, not `.vscode/mcp.json`.
- Claude and Codex adapter settings are distributed as templates under `docs/templates/adapter/` and generated into the consumer repository by setup.
- Consumer-owned adapter files are preserved unless they contain a managed block or the user explicitly confirms overwrite.

Disposition: local VSCode settings are intentionally not shipped. Claude/Codex hooks, agents, and commands are shipped through setup templates, not by copying dogfood `.claude/.codex` runtime files.

### Drive model

The drive-model taxonomy and exit convergence are among the stronger surfaces. `modes/README.md` makes Forward L0-L14 the common exit, while `pair-freeze`, `forward-convergence`, `backfill-pairing`, and `drive-model-passage` catch most orphaned design or implementation output.

Residual gaps are now narrower than the original finding. The following entry-side checks are hard-gated:

- `drive ∈ {be,fe,fullstack,db,agent}` is enforced by schema.
- The kind-drive matrix currently has no forbidden cells beyond the specialist-drive enum.
- `add-design` / `add-impl` parent drive compatibility is enforced by `plan-governance` (`parent_drive_mismatch`).
- kind-layer authoring constraints are enforced by schema and plan-governance.
- signal-to-mode route evaluation exists and has contract / approval tests.
- `version_deferral` is now routed to `version-up` so parked future-version work has a concrete entry route without introducing a new `kind`.
- `version_target` parked drafts now fail `plan-governance` unless they carry `route_signal: version_deferral` and `route_mode: version-up`; the six current parked PLANs have that certificate.

The remaining gaps are certificate-side and authoring-selection-side:

- `drive-model-passage` validates the passage certificate structure, not every historical drive instance's realized absorption.
- Research-to-ADR and Recovery-to-prevention outputs can remain soft unless a downstream design/test/guard landing is separately checked.
- General new PLAN authoring does not yet require a route-eval certificate linking every detected entry signal to the chosen kind/mode.

Disposition: A150-07 remains a residual workflow-hardening item, but not because kind-drive, route-map definitions, or version-up parked routing are absent. Exit convergence and most entry validation are locally strong; the remaining gap is proving that every selected authoring route came from the observed signal, plus downstream landing checks for peripheral modes.

### DB telemetry

`hook_events` is genuine runtime telemetry and proves that the hook backbone is firing across many sessions. Structural projection tables such as `plan_registry`, `descent_obligations`, `trace_edges`, `test_cases`, `artifact_registry`, and graph/roadmap tables are valid projections because they intentionally mirror canonical source artifacts.

The risk is in tables whose names imply runtime operation:

- `skill_invocations` can be projection-only unless runtime skill events with non-empty `session_id` are present.
- `test_runs` can mirror `review_evidence.green_commands` unless runtime verification events are captured from session logs.
- `guardrail_decisions` needs forced-stop or guard runtime provenance, not only an empty schema.
- `model_runs` needs token/cost/runtime rows or explicit scan evidence before being used as cost telemetry.

Disposition: this is no longer only an untracked concern. `PLAN-L7-188` and its child slices (`PLAN-L7-193`, `PLAN-L7-199`, `PLAN-L7-200`, `PLAN-L7-201`, `PLAN-L7-205`) establish the remediation pattern:

- distinguish runtime rows from projection rows,
- keep default CI self-sufficient,
- expose `ut-tdd doctor --strict-telemetry-provenance` as the fail-close verification-cycle gate,
- require runtime provenance for "fired/used/works" claims.

2026-06-30 verification evidence:

- `bun src\cli.ts doctor --strict-telemetry-provenance`: green.
- `bun src\cli.ts doctor --strict-green-command-digest`: green after A-153 rerun-bound digest correction.
- `bun src\cli.ts telemetry scan --json`: 136905 runs ingested, provider CLIs not invoked.
- Persisted telemetry provenance after scan:
  - `skill_invocations`: runtime 5 / projection 1700.
  - `test_runs`: runtime 401 / projection 396.
  - `guardrail_decisions`: runtime 40 / projection 2.
  - `model_runs`: runtime 112852 / projection 528.

Residual boundary: deterministic `db rebuild` alone is not runtime telemetry capture. A verification cycle that wants to close DB telemetry substance must run strict provenance checks against a DB state populated with real session/log telemetry or an explicit `ut-tdd telemetry scan`.

## Remaining close boundary

L7-L14 can be described as locally validated only when doctor, DB rebuild, digest, feedback gate errors, and targeted tests are green. Full close still requires external/publication work:

- clean GitHub distribution repository or branch
- remote CI on the published state
- tag and signed tarball publication
- post-publication consumer install smoke
- consumer hook/subagent/command enforcement smoke on Claude and Codex surfaces

Until those are completed, release/UAT close remains `external_required` / `human_required`, not product-shipped close.
