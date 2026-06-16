# Session Handover - 2026-06-16

## 1. Completed Scope

- Hardened detector, trace, DB projection, and runtime portability checks.
- Added shared Claude/Codex team runner execution flow.
- Added deterministic task difficulty, model, effort, and team launch policy.
- Added existing-repo setup fallback templates and root README.
- Added `ut-tdd team suggest` for non-destructive subagent launch decisions.

## 2. Key Artifacts

- `PLAN-L7-59` through `PLAN-L7-67`
- `src/lint/runtime-portability.ts`
- `src/lint/db-projection-coverage.ts`
- `src/lint/db-projection-ingestion.ts`
- `src/team/model-policy.ts`
- `src/team/launch-policy.ts`
- `src/team/run.ts`
- `README.md`

## 3. Review Notes

- Intra-runtime subagent review was performed by Godel for the team launch policy and CLI surface.
- Findings addressed:
  - Windows CLI surface test timeout margin.
  - Missing oracle coverage for standard, trivial+risk, and complex launch policy cases.

## 4. Verification

- `bun run typecheck`: pass
- `bun run lint`: pass
- `bun run test:node-fallback`: pass
- `bun src\cli.ts db rebuild --json`: pass
- `bun src\cli.ts doctor`: pass
- `bun run test`: pass, 81 files / 671 tests

## 5. Next Action

- No implementation carry remains for this scope.
- Use `ut-tdd team suggest --task "..." --json` before `ut-tdd team run` when a free-form task needs deterministic subagent launch classification.

## 6. Claude Code Verification Handover - Windows Runtime Portability

### Status

- Branch: `codex/harden-automation-team-launch`
- Pushed head: `574271b fix: scan untracked runtime portability drift`
- Provider handover: `.ut-tdd/handover/provider/20260616084105-codex-to-claude-plan-l7-62-runtime-portability-guard.json`
- Verification target: confirm the harness absorbs Windows-specific runtime/setup drift without hiding real provider CLI limitations.

### Codex Delta To Review

- `src/lint/runtime-portability.ts`
  - `loadRuntimePortabilityDocs()` now scans `git ls-files --cached --others --exclude-standard`.
  - Purpose: tracked files and untracked non-ignored active worktree files are both checked before commit.
- `tests/runtime-portability.test.ts`
  - Added `U-RPORT-005`, which creates a temp git repo with untracked `src/legacy.py`.
  - Expected finding: `core-non-typescript-file` on `src/legacy.py`.
- `docs/plans/PLAN-L7-62-runtime-portability-guard.md`
  - DoD now explicitly includes untracked non-ignored runtime file detection during active setup work.

### Evidence Already Collected On Windows

- `bunx vitest run tests\runtime-portability.test.ts`: pass, 5 tests.
- `bun run lint`: pass.
- `bun run typecheck`: pass.
- `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\ut-tdd.ps1 status --json`: pass, mode `hybrid`.
- `bun run test:node-fallback`: pass.
- `bunx vitest run tests\runtime-hook-entrypoints.test.ts tests\cli-surface.test.ts tests\runtime.test.ts`: pass, 17 tests.
- `bun src\cli.ts db rebuild --json`: pass, findings `[]`.
- `bun src\cli.ts doctor`: pass, including `runtime-portability`, `coding-rules`, `ddd-tdd-rules`, `change-impact`, and `regression-expansion`.
- `bun run test`: pass, 81 files / 672 tests.

### Claude Code Verification Request

Run these from the repository root on Windows:

```powershell
git status --short --branch
bunx vitest run tests\runtime-portability.test.ts
bun run lint
bun run typecheck
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\ut-tdd.ps1 status --json
bun run test:node-fallback
bunx vitest run tests\runtime-hook-entrypoints.test.ts tests\cli-surface.test.ts tests\runtime.test.ts
bun src\cli.ts db rebuild --json
bun src\cli.ts doctor
bun run test
```

Check these points specifically:

- `runtime-portability` fails closed for untracked non-ignored runtime drift, not only committed files.
- Windows wrapper coverage still uses PowerShell / `.cmd` / canonical `cmd.exe` paths without shell-string dispatch.
- SQLite fallback still passes through `bun:sqlite` / `node:sqlite` environments.
- `CLAUDE_CODE_EFFORT_LEVEL` and team/provider dry-run surfaces remain machine-readable.
- Any remaining risk is classified as external provider CLI host behavior, not harness-owned invocation/detection behavior.

### Residual Boundary

The harness now detects the Windows-relevant repo/runtime drift it owns. It still cannot guarantee every external Claude/Codex CLI installation on every Windows host; that boundary is handled by adapter invocation guards, status detection, and fail-close diagnostics.
