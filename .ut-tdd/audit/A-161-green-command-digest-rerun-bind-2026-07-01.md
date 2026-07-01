# A-161 - Green command digest rerun bind

- **date**: 2026-07-01
- **scope**: stale `green_commands.output_digest` rows for `src/cli.ts` and `tests/cli-surface.test.ts`
- **reason**: 前回まで advisory として残っていた 28 件の digest mismatch は、全て `src/cli.ts` または `tests/cli-surface.test.ts` の古い file hash を参照していた。hash だけの restamp にしないため、現在の source/test evidence を再実行し、その実行 packet に束ねて digest を更新した。

## Rerun Packet

| command | result |
| --- | --- |
| `bun run vitest run tests\cli-surface.test.ts --reporter=dot` | pass: 1 file / 29 tests |
| `bun run typecheck` | pass |
| `bun run lint` | pass |

## Bound Evidence Hashes

| evidence_path | sha256 |
| --- | --- |
| `src/cli.ts` | `sha256:eccbd8a33367495b48d5c6af7651194e11bd9579a3528a888c1dab912c6981b0` |
| `tests/cli-surface.test.ts` | `sha256:40b2d026600e6bb6a989088a24b5594326f3a0decc9b01d9266b48ffe5ac4f3e` |

## Updated Scope

Only rows whose `evidence_path` is one of the two paths above were rebound. No unrelated `output_digest` values were changed.

Affected PLAN docs:

- `docs/plans/PLAN-L7-131-plan-complete-handover.md`
- `docs/plans/PLAN-L7-138-quality-branch-audit.md`
- `docs/plans/PLAN-L7-157-distribution-clean-pull.md`
- `docs/plans/PLAN-L7-158-refactor-detector-precision-and-policy-extraction.md`
- `docs/plans/PLAN-L7-170-external-review-remediation.md`
- `docs/plans/PLAN-L7-189-shared-harness-memory-cross-runtime.md`
- `docs/plans/PLAN-L7-194-green-command-digest-hard-gate.md`
- `docs/plans/PLAN-L7-197-github-ops-workflow-hardening.md`
- `docs/plans/PLAN-L7-199-runtime-model-telemetry-provenance.md`
- `docs/plans/PLAN-L7-203-windows-provider-spawn-verbatim.md`
- `docs/plans/PLAN-L7-205-strict-telemetry-provenance-doctor.md`
- `docs/plans/PLAN-L7-211-skill-index-category-materialization.md`
- `docs/plans/PLAN-L7-213-project-local-setup-wrapper.md`
- `docs/plans/PLAN-L7-215-model-effort-advisor-routing.md`
- `docs/plans/PLAN-REVERSE-131-plan-complete-handover.md`
- `docs/plans/PLAN-REVERSE-138-quality-branch-audit.md`

## Boundary

This evidence closes the local digest-integrity advisory for current file hashes. It does not by itself prove external release/UAT/post-release telemetry.
