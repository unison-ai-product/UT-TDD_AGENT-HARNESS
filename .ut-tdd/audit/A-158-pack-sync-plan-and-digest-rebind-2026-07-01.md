# A-158 - Pack sync plan and digest rebind

- **date**: 2026-07-01
- **scope**: Pack repo 反映を非破壊 `distribution sync-plan` として追加し、同一検証サイクルの green 実行に束ねて stale `green_commands.output_digest` を再束ねした。
- **boundary**: この変更は Pack repo へ push/tag/release しない。remote mutation、署名 tarball、PO UAT、post-release telemetry は外部・人間境界として残る。

## 追加した機構

`buildPackSyncPlan(exportPlan, sourcePaths, stagingDir, branch)` と `ut-tdd distribution sync-plan --json` を追加した。

- 入力は `buildCleanDistributionPlan` の clean artifact set。
- 出力は Pack repo、branch、staging dir、`sourcePath -> artifactPath` copy plan、`git status`/commit/tag/push の human-approved command list。
- `docs/plans`、`docs/design/harness`、`docs/test-design`、`.ut-tdd`、runtime DB、UI は copy plan に入れない。
- `docs/skills/*` source は Pack artifact では root `skills/*` に写像する。現 source repo で root `skills/*` がある場合は root を優先する。
- command は plan を emit するだけで、clone/copy/commit/push/release は実行しない。

## Green evidence before digest rebind

| command | result |
| --- | --- |
| `bun run vitest run tests\setup.test.ts tests\cli-surface.test.ts --reporter=dot` | pass: 2 files / 44 tests |
| `bun run typecheck` | pass |
| `bun run lint` | pass |
| `bun src\cli.ts distribution sync-plan --tag v0.1.0 --staging-dir tmp-pack-stage --json` | pass: `ok=true` |
| `bun src\cli.ts db rebuild` | pass: rows 34840 |
| `bun run vitest run tests\drive-db-registration.test.ts tests\doctor.test.ts --reporter=dot` | pass: 2 files / 40 tests |
| `bun src\cli.ts doctor` | pass |
| `bun run test` | pass: 121 files / 1248 tests |

## Digest rebind

After the green run above, `doctor --strict-green-command-digest` reported 49 stale digest rows. Only those `output_digest` values were rebound to the current `evidence_path` SHA-256. An accidental broad `completed_at` rewrite was reverted by restoring `completed_at` lines from HEAD, leaving only digest rows and the new PLAN-L7-157 text changed.

Post-rebind check:

- `bun src\cli.ts doctor --strict-green-command-digest`: `green-command-digest — OK`; exit was still blocked by stale DB fingerprint before rebuild, as expected after PLAN edits.

## Judgment

This rebind is not a hash-only restamp. It is tied to the full local green cycle above. It still proves local evidence/file-hash integrity, not external publication, signed artifact delivery, PO UAT, or post-release telemetry.
