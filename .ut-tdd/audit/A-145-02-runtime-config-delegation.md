# A-145-02 - Feature review: Runtime config, delegation & security

- **index**: [A-145 feature review index](./A-145-feature-review-index.md) · **gaps**: [A-144-02 audit](./A-144-02-runtime-config-security.md)
- This is the **most mature unit** — the safety + session-lifecycle core of the harness.

## Features

| feature | purpose | key module | maturity |
|---|---|---|---|
| `status` | mode detection (standalone/claude-only/codex-only/hybrid) + outstanding surface | `src/runtime/detect.ts`, `src/lint/outstanding.ts` | mature |
| `codex` / `claude` | provider adapter plan + delegated execution | `src/runtime/adapter.ts` | mature |
| `session start` / `session summary` | SessionStart/Stop hooks → session-log digest + handover warnings | `src/runtime/session-log.ts` | mature |
| `hook post-tool-use` | PostToolUse → session-log | `src/runtime/session-log.ts` | mature |
| `hook agent-guard` | PreToolUse(Agent): subagent allowlist + explicit-model + opus-override | `src/runtime/agent-guard.ts`, `agent-slots.ts` | mature (matcher caveat SEC-4) |
| `hook work-guard` | PreToolUse(Edit/Write): block foreign uncommitted edits | `src/runtime/work-guard.ts` | mature |
| `hook subagent-stop` | SubagentStop: release a guard slot | `src/runtime/agent-slots.ts` | mature |
| `guard preflight` | manual work-guard for hosted/API runtimes | `src/runtime/work-guard.ts` | mature |
| `roster list/check` | scan `.claude/agents` + verify against guard allowlist | `src/assets/catalog.ts` | mature |
| `handover` (+ `provider export/status`) | session digest → CURRENT.json + scaffold; provider handover package | `src/handover/index.ts`, `src/runtime/provider-handover.ts` | mature |
| `plan use` / `plan complete` | active-plan marker + completion handover | `src/handover/index.ts` | mature |
| `route eval` | signal → mode + RecommendedCommand (approval policy) | `src/workflow/contracts.ts` | mature |
| `team run` / `team suggest` | validate→plan→execute hybrid team; launch policy | `src/team/run.ts`, `src/team/launch-policy.ts` | mature |
| gates | `project-hook`, `codex-hook-adapter`, `codex-wrapper-parity`, `rule-drift`, `asset-drift`, `guardrail-invariants`(substance), `agent-slots`, `mode` | `src/lint/*` | mostly presence; `guardrail-invariants` is substance |

## Strengths
- Hooks/guards are wired and real: `hook_events` = 10082 events across 167 sessions (genuine telemetry, see [R-04](./A-145-04-db-registration-projection.md)).
- Provider delegation passes the task via stdin (out-of-band), avoiding argv injection of the prompt body; detect is spawnability-based, not name-presence.
- work-guard is one-shot marker-bypassed with audited reason; foreign-edit protection is the cross-runtime safety backbone.
- `guardrail-invariants` is one of only 4 substance gates (checks review_kind/model meaning, not just presence).

## Maturity verdict
Functionally the strongest unit. The serious issues are **security**, see audit [A-144-02](./A-144-02-runtime-config-security.md): **SEC-2 (HIGH/Security)** model override is prefix-only + `.cmd` `shell:true` = injection (creator NOT touching); SEC-1 (CODEOWNERS 0-team passes, creator-in-flight); SEC-3 (max_parallel no cap); SEC-4 (agent-guard matcher `"Agent"` env-specific). The guard *mechanism* is mature in dogfood but **not portable to consumers** — cross-ref [DIST-1](./A-144-01-distribution-packaging.md).
