# A-146 - Consolidated substance-gap remediation audit

- **date**: 2026-06-29
- **scope**: consolidate the independent judge findings across distribution, verification evidence, DB telemetry, design coverage, and drive-model workflow.
- **basis**: committed HEAD after local remediation through `6d1dc0d test: refresh cli distribution green evidence`.
- **local status**: `status --json` reports hybrid mode, `nonTerminalPlansByLayer.L7=10`, `activeDraftTotal=0`, `openDefers=0`.
- **doctor excerpt**: `plan-governance`, `drive-db-registration`, `l14-close-audit`, `l7-completion`, and `review-evidence` OK. After the follow-up evidence rerun and digest binding, `green-command-digest` reports 0 mismatches.

## Judge verdict

The workflow definition is strong and well grounded. The weak point is not the shape of the V-model or the drive taxonomy; it is the repeated gap between **projection / presence** and **substance / runtime provenance**.

Local closure can be treated as honest only when the claim is scoped as local. Full production or publication close remains blocked by external clean repository/tag/signature publishing, UAT/release layers, and the remaining evidence-integrity work.

## Findings

| id | severity | area | finding | current disposition |
|---|---|---|---|---|
| A146-1 | HIGH | distribution | Consumer adapter must ship enforced guard governance, not only roster and command definitions. | Partially remediated in `src/setup/templates.ts`: portable `ut-tdd hook agent-guard`, `work-guard`, and SubagentStop release commands are projected for Claude; Codex work-guard is projected, while Codex agent-guard remains a known deferred surface because Codex subagent semantics differ. |
| A146-2 | HIGH | distribution / OS | Adapter hooks use bare `ut-tdd`; install flow must ensure `ut-tdd` resolves on consumer PATH. | Locally remediated in the setup/distribution readiness model, README install flow, and package bin contract. `bin.ut-tdd` now points at `./src/cli.ts`, so `bun link` exposes the CLI before a local `dist` build; `runtime-portability` fails if this regresses. Actual public consumer install remains external/post-publication. |
| A146-3 | HIGH | verification evidence | `green-evidence-integrity=closed` cannot rely on hash restamp alone. Green commands must be re-run and tied to the digest update. | Locally remediated for the known mismatch set. Runtime telemetry and CLI/distribution evidence were re-run in `304a586` and `6d1dc0d`; the remaining projection/doctor/verb-classify evidence was re-run on 2026-06-29 and rebound to actual file hashes. |
| A146-4 | HIGH | DB registration | Operation telemetry had facade/hollow tables: skill invocations, test runs, guardrail decisions, and model cost/token surfaces were not cleanly separated by runtime provenance. | Partially remediated by `f301c09`, `102706c`, and `674c59f`. `db-telemetry-provenance` no longer appears as partial in doctor, but `test_runs` still reflects projected green-command evidence and requires the L7-188 capture strategy before stronger claims. |
| A146-5 | MED-HIGH | distribution curation | Blanket `docs/governance/` allowlisting risks leaking dogfood audit/process documents into the clean package. | Open. Requires per-document curation or deny patterns for dogfood audit material. |
| A146-6 | MED | design coverage | FE design coverage has a strong definition, but L3/L5/L6 FE bodies remain unpopulated or pending; current gate mostly checks presence/drift. | Open and tracked as population/substance work. Not a consumer blocker for using the workflow model, but it blocks claiming full FE design population. |
| A146-7 | MED | drive/workflow | Drive-model exits are strongly converged, but entry selection (`signal -> mode`, `kind x drive/layer`) can degrade if authoring metadata is inconsistent. | Partially remediated. `drive` is already constrained to the 5 specialist values and the requirements matrix has no forbidden kind-drive cells; `kind x layer` authoring is now fail-closed for normal PLANs with a `master_hub` exception. `signal -> mode` routing is implemented by `route eval`, but automatic enforcement at every work-entry surface remains a later integration step. |
| A146-8 | MED | runtime compatibility | Claude `Agent` matcher may be environment-dependent if standard CLI surfaces subagents as `Task`; guard can silently miss the intended tool. | Open for runtime confirmation. Must not be claimed closed without target-runtime evidence. |

## Remediation already landed

1. `f301c09 fix: overlay runtime model telemetry in doctor`
   - Doctor overlays real Claude/Codex JSONL token usage into the in-memory DB.

2. `102706c fix: project runtime guardrail provenance`
   - Runtime `forced_stop` session events are projected into `guardrail_decisions` with runtime provenance.

3. `674c59f fix: project runtime skill telemetry provenance`
   - Session-log `Bash (skill)` events now create runtime `skill_invocations`.

4. `304a586 test: refresh telemetry plan green evidence`
   - Re-ran telemetry-related green commands and tied digests to the actual run.

5. `6d1dc0d test: refresh cli distribution green evidence`
   - Re-ran CLI/distribution tests and reduced green-command digest mismatches from 23 to 16.

## Remaining close blockers

These items block stronger close claims:

- `green-command-digest`: no known mismatches remain after the 2026-06-29 rerun/binding pass. Keep the gate advisory until the L7-188 capture strategy distinguishes runtime test provenance from projected plan evidence.
- Distribution curation: replace broad governance allowlisting with curated allow/deny policy for clean package docs.
- Runtime compatibility: confirm Claude subagent hook matcher against the target Claude Code CLI environment.
- Entry enforcement: `kind x layer` is now machine-checked for normal PLAN authoring; remaining work is to force `signal -> mode` routing at every work-entry surface, not only through `ut-tdd route eval`.
- FE population: fill FE L3/L5/L6 bodies and add a substance check, or keep the gap explicitly open.
- External operations: clean GitHub repo creation, tag push, signed tarball publish, release/UAT evidence, and post-publication consumer smoke remain external/human gated.

## Close classification

- **L7 local closure**: acceptable only as local/parked-aware closure for the remediated slices.
- **Full L7 close**: not yet acceptable while parked L7 plans and digest mismatches remain.
- **L8-L10 local workflow close**: acceptable only where the corresponding local tests/doctor gates are green.
- **L12/L13/release/UAT**: external/human required; do not relabel as shipped.

## Next recommended slice

Continue with evidence-integrity reduction first because it directly affects the trustworthiness of all later close claims:

1. Re-run and bind the remaining 16 digest mismatches in small evidence batches.
2. Then fix distribution curation (`docs/governance/` allowlist leakage).
3. Then confirm or repair runtime matcher compatibility and kind/drive entry enforcement.
