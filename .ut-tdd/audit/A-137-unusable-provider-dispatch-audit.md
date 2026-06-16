# A-137 Unusable Provider-Dispatch Feature Audit

Date: 2026-06-16

Goal: 使えない機能の洗い出しと対策 (enumerate features that are configured but not actually usable, and define countermeasures).

## Result

The UT-TDD self-contained command surface (status / doctor / db / plan lint / review --uncommitted / task classify / skill suggest / team suggest / all dry-runs / cutover dry-run / handover) is usable. Single-provider `ut-tdd claude --execute` is usable because it resolves a native `claude.exe`. The unusable surface is **provider CLI dispatch that bypasses native resolution**: `ut-tdd codex --execute`, `ut-tdd team run --execute`, and therefore hybrid cross-review live dispatch. The root cause is a combination of (1) no native resolution for codex, (2) `team run` not routing through `adapterCommand`, and (3) a detection layer that reports `hybrid` from PATH name-presence alone with no capability probe, masking the breakage as a false-positive availability signal.

## Verification Evidence (live, Windows, 2026-06-16)

| Check | Command | Observed |
|---|---|---|
| Gate-review policy | `evaluateGateReview` (4 cases) | cross_agent required / same-model rejected / self-review rejected / missing-kind rejected — all as expected |
| Cross-provider team plan | `team run --definition example-review-team.yaml --mode hybrid` (dry-run) | ok; se→codex, tl→claude on different providers |
| Same-provider fail-close | `team run` on a claude-only team | failed: `requires worker and reviewer on different providers` |
| Single claude dispatch | `ut-tdd claude --role tl --task "..." --execute` | **succeeded**, native `claude.exe` 2.1.138 returned the requested line |
| Codex team dispatch | `team run --execute` (codex worker) | `exit_code=null` spawn failure; tl skipped `dependency failed: se` |
| Claude team dispatch | `team run --execute` (claude worker) | `exit_code=null` spawn failure (team path bypasses native resolution) |
| PATH resolution | `Get-Command -All claude/codex` | `claude`→`ai-dev-kit-vscode\cli\claude` (no native on PATH); `codex`→ dev-kit `codex.ps1` shadowing working `AppData\Roaming\npm\codex.cmd` (codex-cli 0.128.0) |
| Native claude probe | APPDATA + VSCode ext scan | `%APPDATA%\Claude\claude-code\2.1.138\claude.exe` + VSCode ext 2.1.11/2.1.15/2.1.170 all present |

## Unusable-Feature Matrix

| # | Feature | Root cause | Evidence | Countermeasure | Status |
|---|---|---|---|---|---|
| 1 | `ut-tdd codex --execute` | `adapterCommand` resolves native only for claude (`src/cli.ts:229`); bare `codex` → broken dev-kit `codex.ps1` shadowing working `codex.cmd`; `.ps1`/`.cmd` not spawnable under `shell:false` | live spawn failure; `Get-Command -All codex` | Add `resolveCodexNativeCommand()` (prefer `AppData\Roaming\npm\codex.cmd`/`.exe`, honor `HELIX_CODEX_BIN`) + Windows `.cmd` spawn handling; extend `adapterCommand` to cover codex | open |
| 2 | `ut-tdd team run --execute` | runner (`src/cli.ts:1452`) spawns raw `member.adapter.command` and never calls `adapterCommand`, so the native resolution used by the single-provider path is skipped; claude side also hits the broken PATH wrapper | live spawn failure on claude-worker team | Route `team run` `runCommand` through `adapterCommand(provider, command)` | open |
| 3 | Hybrid cross-review live dispatch | depends on #2 (codex worker + claude reviewer); codex worker fails via #1, claude reviewer fails via #2 | sequential team `--execute`, both members failed/skipped | Resolved transitively by #1 + #2 | open |
| 4 | `status`/`doctor` provider availability | `detectMode` (`src/runtime/detect.ts:21`) uses `where/which` name presence only; comment states "capability probe は将来追加"; counts broken dev-kit wrappers as available → false-positive `hybrid` | status reports `hybrid` while no provider is spawnable via team path | Add capability probe: mark a provider available only if the resolved binary launches (`<resolved-bin> --version` exit 0); fail-close the mode otherwise | open |
| 5 | `resolveClaudeNativeCommand` version pick (minor) | `newestExisting` sorts full paths lexicographically across mixed dirs, so "newest" is not semver-newest (picks AppData 2.1.138 over VSCode 2.1.170) | code read `src/cli.ts:196-226` | Sort by parsed semver, scoped per source dir | open (low) |

## Countermeasure Sequencing (dependency order)

1. #2 — route `team run` through `adapterCommand` (small; restores claude side of team/cross-review).
2. #1 — codex native resolution + `.cmd` spawn (restores codex single + team → cross-review live dispatch succeeds).
3. #4 — capability probe in `detect` (the systemic fix; turns false-positive `hybrid` into accurate fail-close and prevents recurrence of #1–#3). 本丸。
4. #5 — semver sort (optional).

## Bootstrap Constraint

Implementation should be delegated to Codex, but the delegation path `ut-tdd codex --execute` is itself broken by #1 (chicken-and-egg). Unblock options:
- (A) Environment-side: reorder PATH so `AppData\Roaming\npm` precedes the dev-kit `cli\`, or set `HELIX_CODEX_BIN` to the native codex, so `ut-tdd codex` works and remaining impl can be delegated to Codex.
- (B) Minimal bootstrap fix lands #1+#2 first to restore the delegation path, then the rest (#4) is delegated to Codex.

PO decision required on (A) vs (B).

## No-Omission Rule

- A provider reported "available" by `status` is not proven usable until its resolved binary actually spawns; presence ≠ spawnable.
- `ut-tdd claude --execute` working does NOT imply `team run --execute` works — the team path bypasses native resolution.
- Cross-review machinery being correct (policy + planning + fail-close) does NOT mean live dispatch is usable; the dispatch layer is a separate, currently-broken concern.
- Countermeasures are not closed until a live `team run --execute` cross-provider run completes and `status` availability reflects real spawnability.
