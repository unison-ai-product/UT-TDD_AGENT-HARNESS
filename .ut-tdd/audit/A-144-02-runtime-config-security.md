# A-144-02 - Runtime config & setup security (incl. GPT-5 verification)

- **index**: [A-144 judge audit index](./A-144-judge-audit-index.md)
- **related units**: [01 distribution](./A-144-01-distribution-packaging.md) (DIST-1 guard portability)
- **basis**: GPT-5/5Pro review claims independently verified against HEAD. `cli.ts` / `src/setup/*` are creator-in-flight; `src/schema/team.ts`, `src/runtime/adapter.ts`, `.claude/settings.json`, `vitest.config.ts` are NOT being touched by the creator.

## SEC-1 [HIGH] `setup --team` with 0 team flags passes → CODEOWNERS placeholders remain (GPT-5 #1) — creator-in-flight

`src/cli.ts:2600` (HEAD):
```
const teamCount = [opts.tlTeam, opts.qaTeam, opts.poTeam].filter(Boolean).length;
if (teamCount > 0 && teamCount < 3) { /* error */ }
const teams = teamCount === 3 ? {...} : undefined;
```
Errors only on 1-2 flags; **0 flags passes** → `teams=undefined`. `renderCommonFiles` (src/setup/index.ts:307) replaces CODEOWNERS placeholders only `if (... && plan.teams)`, so a `--team` run with no slugs emits CODEOWNERS containing literal `{{TL_TEAM}}` / `{{QA_TEAM}}` / `{{PO_TEAM}}`.

**Verdict (verified TRUE)**. `cli.ts`/`src/setup` are creator-in-flight (likely being fixed from the GPT-5 review). Re-verify at the creator commit boundary.

**Recommendation**: require all 3 slugs when phase `0-B`; fail-close on any residual `{{...}}` placeholder in generated CODEOWNERS.

## SEC-2 [HIGH / Security] model override is prefix-only + `.cmd` launch uses `shell:true` (GPT-5 #2) — NOT touched

`src/schema/team.ts:37`:
```
/^(gpt-|claude-|codex-)/.test(model) || ["haiku","sonnet","opus","local"].includes(model)
```
Prefix-only (no end-anchor, no safe-charset). `src/runtime/adapter.ts:273` uses `shell: true`; comment (lines 44-45) states Windows `codex` resolves to `.cmd` and `buildProviderInvocation` folds into a `cmd.exe` shell string. The (config/YAML-sourced) model value flows into that shell string.

**Verdict (verified TRUE, Security)**: a value like `claude-x; <cmd>` satisfies the prefix check and reaches a `shell:true` command line = command-injection surface. Real risk once team YAML / model overrides are consumer- or share-sourced (the distribution case). **This is the most severe finding and is currently NOT being touched by the creator.**

**Recommendation**: `modelOverrideSchema = /^(?:gpt|claude|codex)-[A-Za-z0-9._:-]+$/` (full match, safe charset); avoid `shell:true` even on the `.cmd` path (resolve the real executable and pass argv). Add a negative test with an injection payload. Escalate as a security change.

## SEC-3 [MED] `max_parallel` has no upper cap (GPT-5 #5) — NOT touched

`src/schema/team.ts:71`: `max_parallel: z.number().int().positive().default(8)` — `.positive()` with no `.max()`. The team executor launches per `max_parallel`; a misconfigured/hostile YAML (e.g. 1000) → mass provider launch.

**Verdict (verified TRUE)**. **Recommendation**: add `.max(N)` (e.g. 8-16) or a cost/rate-limit gate; verify whether the team executor honors the `agent-slots` `DEFAULT_MAX_PARALLEL=8` runtime cap or only the schema.

## SEC-4 [MED / verify] agent-guard matcher `"Agent"` is environment-specific

`.claude/settings.json:5` uses `PreToolUse` `"matcher": "Agent"`; `agent-guard.ts` self-documents "matcher='Agent' でのみ発火". In the Claude **Agent SDK** environment the subagent tool is `Agent`, so the guard fires here. Standard Claude Code **CLI** has historically named the subagent tool `Task`; if the dogfood is ever run via the CLI, the matcher would silently never match and the guard would no-op (the "looks-guarded-but-isn't" trap).

**Verdict**: confidence medium — needs authoritative confirmation of the subagent tool name per target runtime (CLI vs SDK). Moot for consumers only because the adapter omits the guard entirely (DIST-1).

**Recommendation**: confirm the tool name across target runtimes; if the CLI uses `Task`, make the matcher cover both (`Agent|Task`) and add a test that asserts the guard actually fires.
