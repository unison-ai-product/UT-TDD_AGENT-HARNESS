---
description: Implement against a frozen spec/test design with UT-TDD quality gates
argument-hint: "<GitHub Issue number or feature>"
---

Implement incrementally for UT-TDD. Use the `incremental-implementation` skill.

Target: $ARGUMENTS

Entry condition: the Issue identifies the frozen design revision and its paired
test design. Resolve any design gap before implementation.

Quality baseline before trace-freeze:
- Types: zero `any`; `unknown` + type guard for external input; no non-null
  assertions on external values; ≤3 args (else a typed options object).
- Naming/structure: match local conventions; kebab-case files; one
  responsibility per function; early return over deep nesting.
- Descent obligation: trace each new file to its L5/L6 design artifact and record
  the implemented scope in the PR.

Gate sequence:

```
implement → npm run typecheck → npm run lint → npm run test
→ ut-tdd doctor → ut-tdd review --uncommitted → record evidence in .ut-tdd/audit/
→ trace-freeze → review → accept
```

Do not skip `ut-tdd review --uncommitted` — it produces the evidence required
before trace-freeze. Stay within the scope of the Issue and frozen design.
