# Claude Code Runtime Policy - UT-TDD Agent Harness

## Active Runtime Boundary

This repository's Claude Code runtime is part of UT-TDD Agent Harness.
Legacy-source-derived hooks, subagents, memory, and `legacy local state/`
are historical or migration material. They are not current runtime state or
execution paths.

Current runtime boundary:

- Runtime CLI: `ut-tdd`
- Runtime state: `.ut-tdd/`
- Core implementation: `src/`
- Hook configuration: `.claude/settings.json`

Claude Code read priority is `../CLAUDE.md` -> this file ->
`../docs/governance/README.md`. Codex project rules are in `../AGENTS.md`.

## Hooks

Active hooks in `.claude/settings.json` must call package-local UT-TDD commands
only. Do not enable hooks that depend on personal legacy runtime paths.

- `PreToolUse(Agent|Task)`: `bun "$CLAUDE_PROJECT_DIR/.claude/hooks/agent-guard.ts"`
- `PreToolUse(Edit|Write|MultiEdit)`: `bun "$CLAUDE_PROJECT_DIR/.claude/hooks/work-guard.ts"`
- `SessionStart`: `bun "$CLAUDE_PROJECT_DIR/src/cli.ts" session start`
- `PostToolUse(Edit|Write|MultiEdit|Bash|PowerShell)`: `bun "$CLAUDE_PROJECT_DIR/src/cli.ts" hook post-tool-use`
- `Stop`: `bun "$CLAUDE_PROJECT_DIR/src/cli.ts" session summary`
- `SubagentStop`: `bun "$CLAUDE_PROJECT_DIR/src/cli.ts" hook subagent-stop`

Historical behavior may be referenced for migration, but implementation must
live in UT-TDD-owned paths.

## Doctor Invocation Discipline (PLAN-L7-442)

`ut-tdd doctor` is a long-running, read-only, **singleton** inspection. A second
concurrent run fail-fasts with exit 2 and the holder's pid. Rules:

- exit 2 (already running) means **wait for the running doctor**; do not retry,
  do not re-launch with a different invocation form (`bun -e`, `--json`, direct
  `runDoctor`). Retry storms starve the machine (2026-07-16 incident: 16
  concurrent doctors, 31MB free RAM).
- Prefer scoped/targeted checks (`--scope toolchain`, direct check functions in
  tests) when you only need a slice.

## PLAN Rules

Before creating or updating PLAN files, inspect existing `docs/plans/` entries.
Prefer extending an existing PLAN over creating an overlapping one.

PLAN requirements:

- `plan_id` is unique and matches the filename.
- `kind`, `layer`, `status`, `dependencies`, and `review_evidence` match the
  current schema.
- Schedule steps show parallel or serial mode.
- `kind=add-impl` carries the required Reverse pairing.
- Design / implementation / add-* changes update terminology and L0 glossary
  where relevant.
- Review evidence is recorded before asking for confirmation gates.
- New PLANs carry a route certificate (`route_signal` + `route_mode`), and the
  mode must allow the `kind` (SSoT: `src/schema/route-filing.ts` — e.g.
  troubleshoot⇔incident, refactor⇔refactor). `kind` = poc / recovery /
  troubleshoot also requires an `aim` agent slot.
- **Draft PLANs must not list already-existing files in `generates`.** A draft
  PLAN whose declared deliverable already exists in the tree trips
  `merged-plan-status` and `duplicate-artifact-ownership`. Declare only the
  PLAN doc itself at filing time; the implementing PR updates `generates`
  together with the confirm (2026-07-28 lesson: PR #167 went red on this).

PLAN claim discipline (errata countermeasure, PLAN-L7-89):

- A falsifiable safety / completeness claim in `review_evidence` or AC — e.g.
  "blast radius 0", "no false positives", "N green", "fully covered" — must
  cite the test or command that substantiates it, not be asserted in prose.
  The mechanical substitute for a prose claim is a real-repo regression test
  (the gate run against the repo), never a sentence (`coding ≠ substance`).
- When a confirmed PLAN's claim is later found wrong, do not silently overwrite
  it: the successor PLAN declares `supersedes: [<old plan_id>]` and the
  superseded PLAN gets a correction note naming the successor. `doctor
  plan-supersession` fail-closes if a declared supersede target is missing or
  lacks the reciprocal back-reference (errata stay bidirectional).

Use `ut-tdd plan lint`, targeted tests, and `ut-tdd doctor`.

## Runtime And Delegation

Current command path:

- Status: `ut-tdd status`
- Doctor: `ut-tdd doctor`
- Handover: `ut-tdd handover`
- Codex delegation: `ut-tdd codex --role <role> --task "..."`
- Claude delegation: `ut-tdd claude --role <role> --task "..."`
- Team run: `ut-tdd team run --definition .ut-tdd/teams/<team>.yaml`

Runtime mode is one of `standalone`, `claude-only`, `codex-only`, or `hybrid`.
In `hybrid`, judgement gates should use a different runtime / model family when
feasible. In single-runtime modes, record `intra_runtime_subagent` review
evidence as the substitute.

Do not make raw `codex exec` or raw `claude` the normal path for UT-TDD work.
Use UT-TDD wrappers so session lifecycle, handover warnings, and audit evidence
can be recorded.

## 着手前 advisor 合意形成 (PO ルール 2026-07-28、Claude 固有)

Opus / Sonnet が orchestration を担当するとき、**設計・実装・修正の方式判断は着手前に
`ut-tdd advisor` で合意形成する**。対象は「trade-off が実在する方式選択」に限る
(`docs/governance/design-decision-elicitation.md` と同じ線引き。自明な修正・可逆な作業・
自力で確定できる事実は対象外)。

- 実行: `ut-tdd advisor --decision design --current-model <model> --execute --task "..."`
  (`--plan <id>` を付けると発火ログが PLAN に紐づく)。技術/設計/トラブルシューティングは
  `gpt-5.6-sol` 一次、デザイン/UI は `claude-fable-5` 一次 (Model / Effort Routing 節)。
- **advisor の回答を鵜呑みにしない**。前提が事実か実測で確かめ、食い違ったら実測を突き返す
  (2026-07-28 実例: doctor 二重実行の方式判断で、memo 共有テストが 1 件でなく 19 件という
  実測を差し戻して初回推奨が撤回された)。
- 採択結果は PLAN の設計判断節へ記録する。推奨と異なる決定 (override) をした場合は、
  その根拠となる実測 (run URL / テスト名 / 計測値) を併記する。

これは**ルールであって機械強制ではない**。fail-close ゲートは作らない (2026-07-28 判断:
相談 baseline が 16 発火 / 10 PLAN = 841 PLAN 中であり、いまゲート化すると初日でほぼ全作業が
止まる。未計測のまま機構を建てない)。

遵守は既存の発火ログで随時 spot-check できる (`ut-tdd advisor` は
`.ut-tdd/logs/session/advisor-<provider>-<ts>.jsonl` を書き、`projectHookEvents` が
harness.db の `hook_events` へ投影する。session_id は `advisor-` prefix):

```bash
# 直近の advisor 発火を PLAN 別に数える (EOD close-out で 1 本流す)
bun -e "const fs=require('fs'),d='.ut-tdd/logs/session';let n=0,by={};for(const f of fs.readdirSync(d).filter(x=>x.startsWith('advisor-')))for(const l of fs.readFileSync(d+'/'+f,'utf8').split(/\r?\n/)){if(!l.trim())continue;const o=JSON.parse(l);if(o.event_type==='tool_use'){n++;by[o.plan_id]=(by[o.plan_id]||0)+1}}console.log(n,by)"
```

**機構化 (telemetry + 不在検知) の起票条件**: spot-check で (a) 対象 kind の直近 20 PLAN が
advisor 発火ゼロ、または (b) override が実測併記なしで複数回発生、のいずれかを観測したとき。
それまで `docs/plans/PLAN-L6-96-advisor-consultation-telemetry.md` は条件付き保留とする。

## Native Tool Invocation

Claude Code tools must be invoked through Claude Code's native tool-use
mechanism only. Never print or continue XML-like pseudo tool calls such as
`<invoke name="Bash">`, `<parameter name="command">`, or role markers such as
`court`.

If a previous transcript contains XML-like pseudo tool calls, treat that
transcript as corrupted context. Do not echo, repair, or continue the XML. Use
the native Claude Code tool UI for Read/Grep/Bash/Edit/Write, or provide a
plain fenced command for a human to run if the native tool is unavailable.

## Subagent Guard

`PreToolUse(Agent|Task)` uses:

```bash
bun "$CLAUDE_PROJECT_DIR/.claude/hooks/agent-guard.ts"
```

Rules:

1. `subagent_type` must be in the allowlist.
2. Agent calls without a model are blocked.
3. The requested model must be at or above the capability family declared in
   the agent frontmatter (a floor, not an exact pin) — downgrades (cost-cutting)
   are blocked; escalating to the orchestrator's own tier or higher is allowed.
   Worker-role subagents (be-api / be-logic / db-schema / devops-deploy /
   pmo-haiku / refactor-scout / etc.) stay pinned to a lower tier;
   quality-check / gate subagents (code-reviewer / blind-reviewer / ut-tdd-tl /
   security-audit / qa-test) declare an opus floor. Review must never be
   lower-tier than the orchestrator it reviews (PO principle 2026-07-08,
   PLAN-L7-399).
4. Bypass is allowed only with `UT_TDD_ALLOW_RAW_AGENT=1` and must leave
   evidence.
5. Invalid stdin JSON or unverifiable state fails closed.

Allowlist:

- `be-api`
- `be-logic`
- `db-schema`
- `devops-deploy`
- `refactor-scout`
- `pmo-sonnet`
- `pmo-haiku`
- `pmo-project-explorer`
- `pmo-project-scout`
- `pmo-tech-docs`
- `pmo-tech-fork`
- `pmo-tech-news`
- `pdm-tech-innovation`
- `pdm-marketing-innovation`
- `pdm-innovation-manager`
- `code-reviewer`
- `blind-reviewer`
- `security-audit`
- `qa-test`
- `ut-tdd-tl`

`blind-reviewer` is a review/gate subagent (opus floor) that judges the artifact
against spec and self-run tests only, with the author's claims, self-assessment,
intent, prior verdicts, and identity withheld by the orchestrator when it builds
the packet. It runs two lanes — claim-blind (vs spec/AC) and spec-blind (artifact
internal soundness). It is the subagent-scoped precursor to the full adversarial
mechanism in `docs/plans/PLAN-L6-53-adversarial-review-mechanism.md`. In `hybrid`
the blind review should run on the provider that did not author the change (Claude
subagent for Codex-authored work, `ut-tdd codex --role blind-reviewer` for
Claude-authored work) so attacker/defender providers stay separated; single-runtime
modes record `intra_runtime_subagent` evidence instead.

Source-snapshot exploration is not an active Claude Code subagent route. Use
project-focused agents for repository inspection and treat migration snapshots
as read-only material.

## Parallel Task Limit

Tasks that do not depend on each other may be submitted in parallel, default
upper limit **8** concurrent subagent slots (`DEFAULT_MAX_PARALLEL` in
`src/runtime/agent-slots.ts`, IMP-050). `agent-slots` records fire/release and
warns when active slots reach this limit; it does not hard-block above it
(fail-open advisory, not a fail-close gate). This restores the reference that
`src/runtime/agent-slots.ts` and `docs/design/harness/L6-function-design/agent-slots.md`
point back to (PLAN-RECOVERY-12, issue #85).

## Guard Rules

- Escalate before changing authentication, authorization, payments, PII,
  licenses, production infrastructure, destructive operations, or external API
  assumptions.
- `PreToolUse(Edit|Write|MultiEdit)` blocks edits to uncommitted files not
  touched by the current Claude session. This prevents one runtime from
  overwriting the other runtime's in-flight work. Override with
  `UT_TDD_ALLOW_FOREIGN_EDIT=1` (env, human/out-of-band) or, mid-session, by
  writing a non-empty reason to `.ut-tdd/state/foreign-edit-override`; marker
  bypasses are audited to `.ut-tdd/logs/foreign-edit-overrides.jsonl`. An empty
  marker does not bypass (no silent override without a recorded reason). The
  marker is **one-shot**: it is consumed (deleted) on the foreign edit it
  authorizes, so a stale marker cannot keep bypassing the guard. The env
  override is human-managed and not consumed.
- The foreign-edit-override marker is **not scoped to the session that wrote
  it**: any process reading `.ut-tdd/state/foreign-edit-override` before it is
  consumed can spend it — it is first-come, first-served across concurrent
  sessions, not an authorization tied to the writer's own next foreign edit
  (observed 2026-07-17T01:33:51, a separate session consumed another
  session's marker; see `.ut-tdd/logs/foreign-edit-overrides.jsonl`).
- Do not treat `legacy local state/` as active runtime state.
- Do not write secrets, PII, or credentials into docs, examples, or audit
  evidence.
- Respect explicit fail-open / fail-close hook design; do not ignore hook
  failures silently.
- Native Windows behavior is first-class. WSL2 is optional compatibility, not a
  required condition.

## Cutover Boundary

UT-TDD imports design concepts from previous framework but current product code is
TypeScript/Bun. Do not describe legacy Python modules or legacy commands as the
current operating path.

Current cutover evidence:

- migration strategy docs under `docs/migration/`
- `docs/plans/PLAN-M-01-cutover-backfill.md`
- `docs/plans/PLAN-L7-44-harness-db-master.md`
- `tests/projection-writer.test.ts`
- `src/state-db/projection-writer.ts`

## Local Preconditions

- `bun` is available on PATH.
- `CLAUDE_PROJECT_DIR` points to the repository root during hook execution.
- `.ut-tdd/` is writable generated runtime state.
- `.claude/settings.json` uses package-local commands only.
- Personal absolute paths are not required for normal operation.

## UT-TDD Adapter Rule Markers

This section is machine-checked by `rule-drift` so Codex and Claude adapters do
not silently diverge.

- Shared project context: `../CLAUDE.md`
- Codex project rules: `../AGENTS.md`
- Modes: `standalone` / `claude-only` / `codex-only` / `hybrid`
- Status: `ut-tdd status`
- Doctor: `ut-tdd doctor`
- Handover: `ut-tdd handover`
- Codex delegation: `ut-tdd codex --role <role> --task "..."`
- Claude delegation: `ut-tdd claude --role <role> --task "..."`
- Team run: `ut-tdd team run --definition .ut-tdd/teams/<team>.yaml`
