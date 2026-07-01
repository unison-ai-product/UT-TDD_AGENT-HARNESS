# A-160 - Pack sync-pack command sync

- **date**: 2026-07-01
- **source commit**: `f017d6c feat: add clean pack sync command`
- **Pack repository**: `unison-ai-product/UT-TDD_AGENT-HARNESS-Pack`
- **Pack commit**: `9cf9d31 chore: sync clean pack f017d6c`
- **Pack author**: `unison-ai-product <253932653+unison-ai-product@users.noreply.github.com>`

## Scope

`ut-tdd distribution sync-pack --repo-dir <Pack checkout>` を source repo から clean Pack repo へ反映した。

この command は既存 Pack checkout を clean artifact set へ同期する。既定では配布対象外ファイルが残っていれば fail-close し、`--prune-local` が明示された場合だけ Pack checkout 内の余剰ファイルをローカル削除する。`git add` / commit / push は実行せず、次に実行すべき git command を evidence として返す。

## Local Pack Verification Before Push

Commands run in the temporary Pack clone:

| command | result |
| --- | --- |
| `bun run typecheck` | pass |
| `bun run lint` | pass |
| `bun run vitest run tests\cli-surface.test.ts -t "updates a local Pack checkout" --reporter=dot` | pass: 1 test |
| `bun run vitest run tests\setup.test.ts tests\distribution-acceptance.test.ts tests\skill-recommend.test.ts tests\skill-scaffold.test.ts tests\dependency-drift.test.ts --reporter=dot` | pass: 5 files / 42 tests |
| `bun src\cli.ts setup --solo; bun .ut-tdd\bin\ut-tdd.mjs doctor --setup-smoke` | pass: `doctor: setup-smoke - OK (checked=22, failed=0)` |

Full `tests\cli-surface.test.ts` is not the Pack CI contract because one existing source-self-test references source-only `docs/plans/*`, which the Pack intentionally excludes. The `sync-pack` behavior added in `f017d6c` was verified with the targeted test above.

## Boundary Inspection

`sync-pack --prune-local --json` reported:

- `ok=true`
- `copiedArtifacts=428`
- `unmanagedExistingPaths=[]`
- `prunedPaths=[]`
- `destructiveRemoteMutation=false`
- `actualRemoteMutationRequiresPoApproval=true`

Forbidden path inspection before push found no Pack root hits for:

- `docs/plans`
- `docs/design`
- `docs/test-design`
- `.ut-tdd`
- `src/web`
- `docs/adr`
- `docs/skills`
- `.claude`
- `.codex`
- root `AGENTS.md`
- root `CLAUDE.md`

## Remote Verification

Pack push:

- `git push origin main`: `6969e4a..9cf9d31 main -> main`

GitHub Actions:

- run: `28512897311`
- job: `84517307051`
- status: pass
- workflow: `harness-check`
- steps: checkout, setup bun, install deps, typecheck, pack smoke tests, lint, setup smoke

## Remaining Boundary

This closes the clean Pack sync command propagation evidence. It does not close:

- signed tarball publication
- PO UAT / release acceptance
- post-release telemetry from a real consumer deployment
