# A-151 - Green command digest rerun bind

- **date**: 2026-06-30
- **reason**: `green-command-digest` reported stale `output_digest` values after source/test formatting and `projection-writer` changes.
- **boundary**: This record binds digest updates to actual local reruns. It does not claim remote CI, release publication, or consumer UAT.

## Rerun evidence before digest update

The digest update was performed only after these commands were rerun locally:

- `bun run lint`: pass
- `bun run typecheck`: pass
- `bun run vitest run tests\projection-writer.test.ts --reporter=dot`: pass, 19 tests

Earlier in the same verification slice, these commands also passed:

- `bun run vitest run tests\design-language.test.ts --reporter=dot`
- `bun run vitest run tests\relation-graph-loader.test.ts --reporter=dot`
- `bun src\cli.ts db rebuild`

## Digest update scope

`output_digest` values were updated mechanically for PLAN green-command records whose `evidence_path` now hashes to a different current file hash. This was not used as a substitute for green rerun evidence; the reruns above are the binding evidence for the touched code/test paths.

## Residual concern

The current digest gate still proves file-hash alignment, not command-output provenance. A future hardening should make the gate store command-run provenance directly, so `output_digest` cannot be updated without an adjacent rerun record.
