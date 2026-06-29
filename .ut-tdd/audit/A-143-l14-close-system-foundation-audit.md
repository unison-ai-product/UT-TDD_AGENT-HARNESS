# A-143 - L14 Close System Foundation Audit

- **date**: 2026-06-29
- **scope**: L14 close readiness across workflow definition, system foundation, dual-runtime operation, distribution packaging, nonbreaking update, brownfield onboarding, cross-project test utility, drive-model bookbinding, and release boundary
- **source of truth**: current worktree, `bun run src/cli.ts status --json`, `bun run src/cli.ts doctor`, tracked PLAN/test/design artifacts

## Result

The repository is locally closed for the current L8-L14 verification band and system-foundation gates. Full public release close remains bounded by explicit human/external actions: clean public repo creation, tag push, signed tarball publication, and post-publication acceptance on a real consumer project.

## L14 Close System Foundation Audit Matrix

| Item | Audit question | Current evidence | Gap / boundary | Next action | Status |
|---|---|---|---|---|---|
| workflow-definition | Are the L0-L14 workflow definitions and right-arm rollback rules coherent and machine-backed? | `docs/process/forward/L08-L14-verification-phase.md`, `docs/process/forward/overview.md`, `src/lint/roadmap-registry.ts`, `tests/roadmap.test.ts` | none | Keep roadmap/program-coverage doctor gates active as workflow definitions evolve | `closed` |
| system-foundation | Is the harness a viable system-development foundation rather than doc-only policy? | `src/doctor/index.ts`, `tests/doctor.test.ts`, `src/lint/runtime-portability.ts`, `tests/runtime-portability.test.ts`, `package.json` | none | Keep full `bun run test`, `typecheck`, `lint`, `doctor`, and CI `harness-check` as release gates | `closed` |
| claude-codex-parity | Does the design operate for both Claude Code and Codex without claiming false parity? | `AGENTS.md`, `CLAUDE.md`, `.claude/CLAUDE.md`, `src/lint/codex-hook-adapter.ts`, `tests/runtime-hook-entrypoints.test.ts` | Codex hosted/API tools cannot be mechanically intercepted by repo-local hooks | Preserve explicit preflight discipline for hosted/API Codex surfaces and keep `codex-hook-adapter` caveat visible | `partial` |
| clean-distribution-package | Is there a clean package/export path that excludes dogfood state and installs elsewhere? | `src/setup/index.ts`, `tests/setup.test.ts`, `tests/distribution-acceptance.test.ts`, `docs/plans/PLAN-L7-157-distribution-clean-pull.md`, `README.md`, `LICENSE` | actual clean public repo and signed tarball are not published from this local run | Execute publication only after PO approval; keep local clean install smoke green before cut | `external_required` |
| version-up-nonbreaking | Can updates be introduced without breaking existing projects? | `src/setup/index.ts`, `tests/setup.test.ts`, `docs/process/modes/version-up.md`, `docs/plans/PLAN-REVERSE-140-forward-convergence-version-up-backfill.md` | true multi-version consumer upgrade is not proven until a released tag exists | Run tag-pin upgrade/rollback smoke after publication; keep version-up parked work visible | `external_required` |
| brownfield-onboarding | Can the harness be introduced into an in-progress project without overwriting user work? | `src/setup/index.ts`, `tests/setup.test.ts`, `docs/templates/adapter/AGENTS.md`, `docs/templates/adapter/CLAUDE.md`, `docs/templates/adapter/.claude/settings.json` | none for local managed-block behavior; real consumer repo validation remains post-publication | Re-run brownfield smoke on the first clean consumer repo before full release signoff | `closed` |
| cross-project-test-workflow | Do tests and workflow gates work for projects other than this dogfood repository? | `tests/distribution-acceptance.test.ts`, `tests/runtime-portability.test.ts`, `src/setup/index.ts`, `.github/workflows/harness-check.yml` | clean temporary package smoke is covered; an independent real project is not yet mutated | Use the clean package on a separate acceptance repo after publication and record the result | `partial` |
| l1-l2-mock-roundtrip | Does an L2 mock/prototype remain traceable back to L1 requirements instead of becoming ungoverned UI design? | `docs/design/harness/L2-screen/wireframe.md`, `docs/design/harness/L2-screen/screen-list.md`, `src/lint/screen-impl-pair-freeze.ts`, `src/lint/doc-consistency.ts`, `tests/screen-impl-pair-freeze.test.ts`, `tests/projection-writer.test.ts` | current low-fi governance and pair-freeze are covered; a future high-fi/prototype artifact still needs explicit L1 back-prop review evidence | When a high-fi/prototype mock is introduced, record L1 requirement feedback and rerun G1 trace / L10 UX pair-freeze checks | `partial` |
| drive-model-bookbinding | Does V-model Forward absorb other drive-model design groups into a bookbound program record? | `docs/design/harness/L4-basic-design/function.md`, `docs/process/modes/README.md`, `src/lint/forward-convergence.ts`, `tests/forward-convergence.test.ts`, `src/lint/drive-model-passage.ts` | none for current registered modes and convergence rules | Keep forward-convergence and drive-model-passage doctor gates hard as new modes are added | `closed` |
| l8-l14-right-arm | Are L8-L14 closed under the current local workflow definition? | `.ut-tdd/audit/A-132-l8-l14-verification-band-execution.md`, `.ut-tdd/audit/A-136-cycle-p4-verification-audit.md`, `docs/plans/PLAN-M-00-verify-cutover.md`, `tests/projection-writer.test.ts` | L12/L13 production deploy, post-deploy observation, and PO final signoff are human/external | Do not claim production release close until PO signoff and post-deploy evidence are recorded | `human_required` |
| release-publication-boundary | Is final distribution packaging complete as a public release artifact? | `docs/plans/PLAN-L7-157-distribution-clean-pull.md`, `src/setup/index.ts`, `tests/distribution-acceptance.test.ts`, `LICENSE` | clean GitHub repo creation, tag push, signed tarball, checksum, and signature are external publication actions | Perform public release cut only after explicit PO approval and record artifact checksums/signature | `external_required` |
| green-evidence-integrity | Are green command evidence records strong enough for final hard close? | `src/lint/green-command-digest.ts`, `tests/green-command-digest.test.ts`, `docs/plans/PLAN-L7-132-green-command-digest-integrity.md` | `doctor` currently reports 114 historical digest mismatches as advisory note, not hard failure | Correct historical digests or explicitly migrate them before making digest integrity a hard L14 close condition | `partial` |

## Current Command Evidence

- `bun run src\cli.ts status --json`: active draft `0`, open defers `0`, non-terminal L7 `2`, both `versionUpParked`.
- `bun run src\cli.ts doctor`: all hard gates pass; `green-command-digest` remains advisory with historical mismatches.
- `bun run test`: 117 test files / 1183 tests passed after adding the L14 close audit and audit relation-graph projection.
- `bun run src\cli.ts db rebuild --json`: `ok=true`, `graph_nodes=891`, `dependency_edges=886`, `findings` output empty.
- `feedback_events`: prior `missing-projection` error for `.ut-tdd/audit/A-143-l14-close-system-foundation-audit.md` is resolved after projecting `.ut-tdd/audit/*.md` into the relation graph.
- `git status --short`: clean before this audit slice.

## Boundary

This audit does not authorize production infrastructure, credential, publication, or destructive migration actions. It converts those actions into explicit L14 close boundaries instead of allowing local green gates to imply public release completion.
