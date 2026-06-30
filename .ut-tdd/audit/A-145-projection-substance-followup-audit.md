# A-145 projection / substance follow-up audit

- **date**: 2026-06-30
- **scope**: ClaudeCode independent findings on L7-L14 local close readiness.
- **boundary**: This is a local verification record. It does not claim public release, tag push, signed tarball publication, or post-publication consumer UAT.

## Summary

The repeated issue across the findings is `projection != substance`.
Local close can be defended only where the repo has executable gates, runtime provenance, clean distribution smoke, or explicit external/human boundaries.

## Findings and disposition

| id | severity | area | finding | current disposition |
| --- | --- | --- | --- | --- |
| F-01 | HIGH | distribution | Distributed adapters shipped subagent/command definitions without enforced guard parity. | Remediated locally. Adapter templates now ship portable `ut-tdd hook agent-guard`, `ut-tdd hook work-guard`, and Claude `ut-tdd hook subagent-stop`; Codex covers `spawn_agent|spawn_agents_on_csv` and `apply_patch|write_file` with `blockOnFailure=true`. Hosted/API Codex tools remain outside repo hook enforcement. |
| F-02 | HIGH | distribution / OS | Adapter hooks invoke bare `ut-tdd`, so consumer PATH/global-link setup must exist before hooks can fire. | Partially remediated. README/setup document `bun link`, readiness checks fail/warn when bare `ut-tdd` is missing, and clean distribution smoke executes bare `ut-tdd status --json`. Release installer/global package publication remains external. |
| F-03 | HIGH | green evidence | Digest restamp proves hash equality, not command rerun. | Partially remediated for the current CI fix by bundling targeted reruns with digest rebinding. Broader hardening remains: restamp and rerun must stay coupled in future verification cycles. |
| F-04 | HIGH | DB telemetry | `skill_invocations`, `test_runs`, `guardrail_decisions`, and `model_runs` could look populated while carrying only projection or hollow schema rows. | Remediated locally for the verification cycle. `PLAN-L7-188` child slices distinguish runtime rows from projection rows; `doctor --strict-telemetry-provenance` fail-closes projection-only telemetry; runtime session/log projection exists for test, guardrail, skill, and model telemetry. Persisted DB after `telemetry scan --json`: `skill_invocations` runtime=5/projection=1700, `test_runs` runtime=401/projection=396, `guardrail_decisions` runtime=40/projection=2, `model_runs` runtime=112852/projection=528. Deterministic `db rebuild` intentionally remains source-projection-only, so strict close must include doctor strict and/or telemetry scan evidence. |
| F-05 | MED-HIGH | clean package | Blanket `docs/governance/` allow could leak dogfood audit docs into distribution. | Remediated locally. Clean distribution uses per-file allow and dogfood deny/curation patterns; setup and distribution tests cover excluded dogfood governance docs. |
| F-06 | MED | design coverage | FE design and FE right-arm verification body substance may lag behind presence coverage. | Tracked as population/substance backlog. FE left-arm slots now report body present 6/pending 0; FE right-arm L8/L9/L11/L12/L14 population remains a dogfood product gap, not a consumer distribution blocker. |
| F-07 | MED | drive model | Entry-side `signal -> mode` and route selection can be advisory compared with exit convergence. | Partially remediated. Specialist drive enum, add-* parent drive compatibility, version deferral routing, and version-target parked certificates are now gated. Remaining gap: general newly authored PLANs do not yet require a route-eval certificate for every entry signal, and Research/Recovery absorption stays soft unless landed through downstream artifacts. |
| F-08 | MED | Claude / Codex adapter | Runtime tool-name differences such as `Agent` vs `Task` can silently miss guard hooks. | Remediated locally for known Claude split: adapter template uses `Agent|Task`. Real consumer hook firing remains post-publication smoke. |

## Current CI remediation binding

PR #2 GitHub Actions failure had two immediate causes:

- `tests/runtime-adapter.test.ts`: Windows simulation on Linux CI used platform `path.join`, producing mixed separators such as `C:\Windows/System32/cmd.exe`.
- `tests/cli-surface.test.ts`: the allowlisted command count was still 14 after adding `ut-tdd-tl`.

Local remediation:

- `src/runtime/adapter.ts` uses `win32.join` for simulated Windows paths.
- `tests/cli-surface.test.ts` updates the allowlisted command count to 15.

Targeted rerun evidence bundled with digest rebinding:

| command | result |
| --- | --- |
| `bun run vitest run tests\runtime-adapter.test.ts tests\cli-surface.test.ts tests\distribution-acceptance.test.ts --reporter=dot` | PASS: 3 files / 42 tests |
| `bun run vitest run tests\db-projection-ingestion.test.ts tests\projection-writer.test.ts tests\doctor.test.ts tests\cli-surface.test.ts --reporter=dot` | PASS: 4 files / 78 tests |
| `bun src\cli.ts doctor --strict-telemetry-provenance` | PASS |
| `bun src\cli.ts telemetry scan --json` | PASS: 136905 runs ingested |

## Remaining boundary

Local L7-L14 close remains defensible when strict doctor, DB rebuild or scan evidence, digest, feedback, and targeted tests are green.
Full production close still requires external/publication work:

- clean public GitHub distribution repository or release branch
- remote CI on the published state
- tag push and signed tarball/package publication
- post-publication consumer install smoke
- real consumer Claude/Codex hook, subagent, and command enforcement smoke
