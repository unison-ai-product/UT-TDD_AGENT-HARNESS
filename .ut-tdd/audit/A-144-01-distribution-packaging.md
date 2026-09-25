# A-144-01 - Distribution & packaging

- **index**: [A-144 judge audit index](./A-144-judge-audit-index.md)
- **related units**: [02 runtime-config & security](./A-144-02-runtime-config-security.md) (adapter guard wiring), [04 db registration](./A-144-04-db-registration-projection.md)
- **related PLANs**: [PLAN-L7-190](../../docs/plans/PLAN-L7-190-distribution-runtime-asset-projection.md) (runtime asset projection), [PLAN-L7-191](../../docs/plans/PLAN-L7-191-distribution-helix-wording-erasure.md) (HELIX scrub), [PLAN-L7-157](../../docs/plans/PLAN-L7-157-distribution-clean-pull.md) (clean pull)
- **memory**: [[project_harness_distribution_public_private_boundary]]

## DIST-1 [HIGH] consumer adapter ships NO enforced guards

dogfood `.claude/settings.json` wires 6 hook events (PreToolUse(Agent)=agent-guard, PreToolUse(Edit|Write|MultiEdit)=work-guard, SessionStart, PostToolUse, Stop, SubagentStop). The distributed adapters wire only 3 (SessionStart/PostToolUse/Stop = session logging):

- `docs/templates/adapter/.claude/settings.json` (HEAD): no PreToolUse(Agent), no work-guard, no SubagentStop.
- `docs/templates/adapter/.codex/hooks.json` (HEAD): SessionStart/PostToolUse/Stop only.
- The adapter ships NO `.claude/hooks/` scripts. dogfood guards call `bun "$CLAUDE_PROJECT_DIR/.claude/hooks/agent-guard.ts"` — repo-local TS that does not exist in a consumer; in a consumer `$CLAUDE_PROJECT_DIR` is the consumer repo.

**Verdict**: the 19 subagent + 9 command definitions are now projected (creator committed), but the **governance that controls them (allowlist / explicit-model / foreign-edit / slot release) is not portable**. A `ut-tdd guard` manual preflight exists (`src/cli.ts:782`, "manual guard checks for non-hooked runtimes") but it is discipline-based, not an enforced hook. So a consumer gets logging + the roster, but none of the harness's signature enforcement. `locally-enforced ≠ shipped-enforced`.

**Recommendation**: expose guards as portable subcommands (`ut-tdd hook agent-guard` / `ut-tdd hook work-guard`) and wire them in both adapters as `ut-tdd`-routed PreToolUse hooks (same portable pattern as the session hooks). agent-guard + SubagentStop should ship with the roster; work-guard may be hybrid-opt-in. See matcher caveat SEC-4 in [02](./A-144-02-runtime-config-security.md).

## DIST-2 [HIGH] `ut-tdd` is wired bare but never put on PATH

Adapters wire hooks to bare `ut-tdd session start` etc. `package.json` `bin.ut-tdd = ./dist/ut-tdd` (a compiled artifact, `build = bun build --compile`). README install = `bun install` → `bun run build` (local `dist/ut-tdd`) → run via explicit `scripts/ut-tdd.ps1`. No `bun link` / global install / PATH addition found in README/`src/setup`/`scripts`; `dist/` is not in `CLEAN_ALLOW`.

**Verdict**: in a consumer repo, a fired hook calling bare `ut-tdd` will not resolve → hooks unfire. This is why `brownfield-onboarding=closed` (A-143) is *local managed-block only* and does not prove consumer hook firing. "Development OS" must self-establish its command on the consumer PATH.

**Recommendation**: have setup/install `bun link` (or generate a PATH shim / wrap hooks to a resolvable path), and add a consumer-side smoke that a fired hook resolves `ut-tdd`.

## DIST-3 [MED-HIGH] blanket `docs/governance/` ALLOW leaks dogfood docs

`CLEAN_ALLOW_PREFIXES` (src/setup/index.ts) admits `docs/governance/` wholesale. That ships dogfood-specific dated audits/migration docs, e.g. `conditional-backfill-decision-audit-2026-06-22.md`, `forward-convergence-legacy-debt-audit.md`, `reverse-fullback-backprop-audit-2026-06-22.md`, plus the HELIX migration docs (DIST-5). Prefix-allow cannot separate methodology (ship: concept/requirements/coding-rules/gate-design/...) from dogfood records (don't ship).

**Verdict**: contradicts the PO requirement "evacuate harness-development's own artifacts from the distribution". Broader than DIST-5/L7-191.

**Recommendation**: replace blanket prefix-allow with per-doc curation (methodology allowlist) or a dogfood deny pattern (`*-audit-*.md`, `*extraction-plan*`, `*parity*`); add a distribution-acceptance assertion that no dogfood doc is in `artifactPaths`.

## DIST-4 [MED] generated workflow is main-fixed + unconditional Bun (GPT-5 #3/#4) — creator-in-flight

`src/setup/templates.ts` `common/harness-check.yml`: `on.push.branches:[main]` / `pull_request.branches:[main]` and steps `bun install --frozen-lockfile` / `bun run typecheck` / `bun run test` unconditionally. `detectProjectScale` reads `repos/{owner}/{repo}/branches/main/protection` (hardcoded `main`, `src/setup/index.ts:222`).

**Verdict (verified TRUE)**: non-Bun/TS consumers break CI on setup; non-`main` default branch (master/develop/trunk) → workflow never triggers and protection read misses. `src/setup`/`templates.ts` are creator-in-flight; re-verify at the creator's commit boundary.

**Recommendation**: detect default branch (`gh repo view --json defaultBranchRef`); make workflow generation opt-in or package-manager/script-aware.

## DIST-5 [LOW / parked] HELIX wording in distribution surface

6 distribution-ALLOW docs still mention HELIX (ADR-001/005, governance/README, extraction-plan, runtime-parity audit, workflow-contracts test). Current state is reference-only-correct (not wrong, just present), so v1 ships safely as-is; parked as [PLAN-L7-191](../../docs/plans/PLAN-L7-191-distribution-helix-wording-erasure.md). Pull forward only if zero-association at v1 is required.
