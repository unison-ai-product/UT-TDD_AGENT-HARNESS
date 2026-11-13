---
description: Pre-ship fan-out — parallel draft analyses by generic subagents, then a go/no-go from the delegation path with a rollback plan
argument-hint: "[optional scope note]"
---

`/ship` is a fan-out orchestrator for UT-TDD. It runs up to three generic
subagents in parallel against the current change to draft analyses, then merges
them into a go/no-go proposal with a mandatory rollback plan. The go/no-go
judgement itself comes from the delegation path, not from a subagent. Use it
before a trace-freeze→accept transition or an L12 deploy.

First establish the change set and gate state:
- `ut-tdd review --uncommitted` — the deterministic review packet for the worktree.
- `ut-tdd status` — execution mode (judgement gates need cross-agent or
  intra_runtime_subagent review evidence).
- `ut-tdd doctor` — structural governance must be green before a GO.

## Phase A — parallel fan-out

Issue all three Agent calls in a single turn so they run in parallel (sequential
calls defeat the purpose). Each call uses only a generic `subagent_type`
(`general-purpose` / `Explore` / `Plan` / `claude`) and passes an explicit `model`
(the `PreToolUse(Agent)` guard blocks anything else, #1002; `fable` is not
allowed). The harness keeps no specialist subagent definitions, so pass the
expertise per task as skills, decision packs, or design excerpts:

1. **Code review draft** — five-axis review (correctness, readability,
   architecture, security, performance) on the staged/uncommitted change. Pass
   the `code-review-and-quality` skill.
2. **Security draft** — vulnerability + threat pass (input validation, secrets,
   auth/authz, dependency risk). Pass the `security-and-hardening` and
   `threat-model` skills.
3. **Test coverage draft** — happy path, edge cases, error paths, concurrency.
   Pass the `test-driven-development` skill.

Subagents cannot spawn subagents and return only their report to this session.
Their output is draft input only: it is never a review verdict or a merge basis.

## Phase B — merge in main context

The main agent (not a subagent) synthesizes: aggregate Critical/Important
findings from the code review draft and any failing typecheck/lint/test; promote
any Critical/High security finding to a blocker; cross-check coverage gaps from
the test draft; verify infrastructure, migrations, and docs directly.

## Phase C — decision

The go/no-go judgement comes from the delegation path
(`ut-tdd claude|codex --role <role>`, a non-authoring family's frontier reviewer)
and review custody. Present the synthesis as the input to that judgement:

```markdown
## Ship Decision: GO | NO-GO
### Blockers (must fix)        — [source: finding + file:line]
### Recommended fixes          — [source: finding + file:line]
### Acknowledged risks         — [risk + mitigation]
### Rollback plan              — trigger conditions; rollback steps; recovery target
### Subagent drafts (full)
```

Reference the `ci-deploy-and-rollback` skill for the rollback section.

## Rules

1. The three Phase A drafts run in parallel, never sequentially.
2. Subagents do not call each other; the main agent merges in Phase B.
3. The rollback plan is mandatory before any GO.
4. Any Critical finding defaults the verdict to NO-GO unless the user explicitly
   accepts the risk.
5. Skip the fan-out only if the change touches ≤2 files, the diff is <50 lines,
   and it does not touch auth, payments, data access, or config/env. Otherwise
   default to fan-out.
6. Record the decision and the draft evidence in `.ut-tdd/audit/` before the
   accept gate.
