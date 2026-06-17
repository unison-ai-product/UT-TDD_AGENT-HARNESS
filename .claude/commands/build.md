---
description: Implement against a frozen spec/test design with UT-TDD quality gates
argument-hint: "<PLAN id or feature>"
---

Implement incrementally for UT-TDD. Use the `incremental-implementation` skill.

Target: $ARGUMENTS

Entry condition: the PLAN's `parent_design` points to an existing L5/L6 design,
`ut-tdd plan lint` passes, and the paired L6 test design exists. If any is
missing, stop and resolve the design gap first (do not implement ahead of design).

Quality baseline before trace-freeze:
- Types: zero `any`; `unknown` + type guard for external input; no non-null
  assertions on external values; ≤3 args (else a typed options object).
- Naming/structure: match local conventions; kebab-case files; one
  responsibility per function; early return over deep nesting.
- Descent obligation: every new file traces to an L5/L6 artifact via the PLAN
  `generates` list; update `generates` if new files appear.

Gate sequence:

```
implement → bun run typecheck → bun run lint → bun run test
→ ut-tdd doctor → ut-tdd review --uncommitted → record evidence in .ut-tdd/audit/
→ trace-freeze → review → accept
```

Do not skip `ut-tdd review --uncommitted` — it produces the evidence required
before trace-freeze. Stay within the active PLAN scope.
