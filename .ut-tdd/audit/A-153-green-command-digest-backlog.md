# A-153 - green-command digest backlog classification

- **date**: 2026-06-30
- **scope**: `ut-tdd doctor --strict-green-command-digest` backlog after `dd5092e`.
- **boundary**: classification only. This file does not restamp historical `output_digest` values.

## Summary

`ut-tdd doctor --strict-green-command-digest` currently fail-closes because 63
`review_evidence.green_commands` rows no longer match the current hash of their
`evidence_path`.

This is intentionally not corrected by mechanical restamp. Most mismatches are
historical evidence rows whose referenced source or test files changed after the
original green run. A hash-only update would make digest equality look like fresh
command execution, repeating the projection/substance problem called out in
A-150.

Current classification:

| metric | value |
| --- | ---: |
| mismatch rows | 63 |
| affected PLANs | 28 |
| affected evidence files | 9 |

Affected evidence files:

- `README.md`
- `package.json`
- `src/cli.ts`
- `src/doctor/index.ts`
- `src/graph/loader.ts`
- `src/setup/index.ts`
- `tests/cli-surface.test.ts`
- `tests/doctor.test.ts`
- `tests/setup.test.ts`

## Exact Command Groups

The backlog collapses to the command groups below. A future correction packet
must run the exact command, update the corresponding `completed_at`, and update
only the digest rows covered by that same run.

| count | command |
| ---: | --- |
| 18 | `bun run typecheck` |
| 14 | `bun run lint` |
| 6 | `bun run vitest run tests/cli-surface.test.ts tests/distribution-acceptance.test.ts --reporter=dot` |
| 2 | `bun run vitest run tests\relation-graph-loader.test.ts` |
| 2 | `bun run vitest run tests\setup.test.ts` |
| 2 | `bun run src\cli.ts doctor` |
| 1 | `bun run vitest run tests\doctor.test.ts tests\green-command-digest.test.ts --reporter=dot` |
| 1 | `bun run tsc --noEmit` |
| 1 | `bun run src\cli.ts db rebuild` |
| 1 | `bun run vitest run tests\cli-surface.test.ts -t "distribution" --reporter=dot` |
| 1 | `bun src\cli.ts distribution package --tag v0.1.0 --out <temp> --json` |
| 1 | `bun run vitest run tests\setup.test.ts tests\cli-surface.test.ts --reporter=dot` |
| 1 | `$env:PATH="$env:USERPROFILE\.bun\bin;$env:APPDATA\npm\node_modules\bun\bin;$env:PATH"; ut-tdd --help` |
| 1 | `$env:PATH="$env:USERPROFILE\.bun\bin;$env:APPDATA\npm\node_modules\bun\bin;$env:PATH"; bun src\cli.ts distribution plan --json` |
| 1 | `bun run vitest run tests\setup.test.ts tests\cli-surface.test.ts` |
| 1 | `bun src\cli.ts distribution plan --tag v0.1.0 --json` |
| 1 | `bun run vitest run tests\setup.test.ts --reporter=dot` |
| 1 | `bun run vitest run tests\doctor.test.ts -t "U-ADAPTER-009"` |
| 1 | `bun run vitest run tests/setup.test.ts` |
| 1 | `bun run test:fast` |
| 1 | `bun run test:db` |
| 1 | `bun run test:cli` |
| 1 | `bun run test` |
| 1 | `bun run vitest run tests\setup.test.ts tests\workflow-contracts.test.ts` |
| 1 | `bun run vitest run tests/db-projection-ingestion.test.ts tests/doctor.test.ts tests/token-tracker.test.ts tests/cli-surface.test.ts --reporter=dot` |
| 1 | `bun run vitest run tests\cli-surface.test.ts -t "strict telemetry provenance" --reporter=dot` |
| 1 | `bun run vitest run tests\quality-audit.test.ts tests\branch-audit.test.ts tests\cli-surface.test.ts -t "quality audit|branch audit" --reporter=dot` |

## Disposition

Local L10-L14 close remains valid under normal `ut-tdd doctor` because the stale
digest rows are surfaced as advisory evidence, not silently ignored.

`--strict-green-command-digest` remains red by design until a dedicated
rerun-bound correction packet is executed. The correction packet must not update
hashes without command reruns and must not claim that digest equality alone
proves runtime substance.
