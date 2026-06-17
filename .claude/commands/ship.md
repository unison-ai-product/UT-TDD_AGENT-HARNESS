---
description: Pre-ship fan-out — parallel code-reviewer / security-audit / qa-test, then synthesize a go/no-go with a rollback plan
argument-hint: "[optional scope note]"
---

`/ship` is a fan-out orchestrator for UT-TDD. It runs three allowlisted
specialist subagents in parallel against the current change, then merges their
reports into a single go/no-go decision with a mandatory rollback plan. Use it
before a trace-freeze→accept transition or an L12 deploy.

First establish the change set and gate state:
- `ut-tdd review --uncommitted` — the deterministic review packet for the worktree.
- `ut-tdd status` — execution mode (judgement gates need cross-agent or
  intra_runtime_subagent review evidence).
- `ut-tdd doctor` — structural governance must be green before a GO.

## Phase A — parallel fan-out

Issue all three Agent calls in a single turn so they run in parallel (sequential
calls defeat the purpose). Each `subagent_type` must be allowlisted by the
`PreToolUse(Agent)` guard, and each call must pass an explicit `model` matching
the agent frontmatter family:

1. **code-reviewer** — five-axis review (correctness, readability, architecture,
   security, performance) on the staged/uncommitted change. Reference the
   `code-review-and-quality` skill.
2. **security-audit** — vulnerability + threat pass (input validation, secrets,
   auth/authz, dependency risk). Reference the `security-and-hardening` and
   `threat-model` skills.
3. **qa-test** — test-coverage analysis: happy path, edge cases, error paths,
   concurrency. Reference the `test-driven-development` skill.

Subagents cannot spawn subagents and return only their report to this session.

## Phase B — merge in main context

The main agent (not a subagent) synthesizes: aggregate Critical/Important
findings from code-reviewer and any failing typecheck/lint/test; promote any
Critical/High security-audit finding to a blocker; cross-check coverage gaps
from qa-test; verify infrastructure, migrations, and docs directly.

## Phase C — decision

```markdown
## Ship Decision: GO | NO-GO
### Blockers (must fix)        — [persona: finding + file:line]
### Recommended fixes          — [persona: finding + file:line]
### Acknowledged risks         — [risk + mitigation]
### Rollback plan              — trigger conditions; rollback steps; recovery target
### Specialist reports (full)
```

Reference the `ci-deploy-and-rollback` skill for the rollback section.

## Rules

1. The three Phase A personas run in parallel, never sequentially.
2. Personas do not call each other; the main agent merges in Phase B.
3. The rollback plan is mandatory before any GO.
4. Any Critical finding defaults the verdict to NO-GO unless the user explicitly
   accepts the risk.
5. Skip the fan-out only if the change touches ≤2 files, the diff is <50 lines,
   and it does not touch auth, payments, data access, or config/env. Otherwise
   default to fan-out.
6. Record the decision and specialist evidence in `.ut-tdd/audit/` before the
   accept gate.
