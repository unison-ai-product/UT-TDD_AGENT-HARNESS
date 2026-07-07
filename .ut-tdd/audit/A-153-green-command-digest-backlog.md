# A-153 - green-command digest backlog correction

- **date**: 2026-06-30
- **scope**: `ut-tdd doctor --strict-green-command-digest` backlog after `dd5092e`.
- **boundary**: rerun-bound correction record. This file does not claim release/UAT close.

## Summary

`ut-tdd doctor --strict-green-command-digest` previously fail-closed because 63
`review_evidence.green_commands` rows no longer matched the current hash of their
`evidence_path`. The backlog has now been corrected by rerunning the command
groups below and updating the affected `completed_at` / `output_digest` rows in
the same correction packet.

This was intentionally not corrected by mechanical restamp. Most mismatches were
historical evidence rows whose referenced source or test files changed after the
original green run. The correction packet therefore reran the listed commands
before rebinding digests, preserving the projection/substance boundary called out
in A-150.

Current classification:

| metric | value |
| --- | ---: |
| mismatch rows before correction | 63 |
| mismatch rows after correction | 0 |
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

## Rerun Command Groups

The backlog collapsed to the command groups below. The correction packet ran
each executable group, updated the corresponding `completed_at`, and updated
only the digest rows covered by that same run. The `distribution package` row
used a real temporary output directory in place of the recorded `<temp>` marker,
while preserving the same package operation.

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

Local L10-L14 close now has strict green-command digest evidence rebound to the
current file state through rerun-bound correction.

Verification:

- all command groups above: pass
- `bun -e "checkGreenCommandDigests(...)"`: mismatch count 0
- `bun src\cli.ts doctor --strict-green-command-digest`: green-command-digest OK; a subsequent `db rebuild` is required after PLAN frontmatter edits so DB fingerprints match the updated sources

Future corrections must keep this rule: do not update hashes without command
reruns, and do not claim that digest equality alone proves runtime substance.
