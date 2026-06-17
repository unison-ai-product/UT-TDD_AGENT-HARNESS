---
description: Five-axis code review — correctness, readability, architecture, security, performance
argument-hint: "[optional file/scope]"
---

Run a five-axis review of the current change (uncommitted or recent commits) for
UT-TDD. Use the `code-review-and-quality` skill; pull security from
`security-and-hardening` and adversarial framing from `adversarial-review`.

Start from the deterministic packet: `ut-tdd review --uncommitted`.

Review across all five axes:

1. **Correctness** — matches the design/spec? edge cases handled? tests adequate
   and asserting real oracles (not `toBeTruthy` on complex objects)?
2. **Readability** — clear names, straightforward logic, matches local style?
3. **Architecture** — follows existing patterns, clean boundaries, right
   abstraction; V-model descent obligation satisfied (impl traces to L5/L6 design)?
4. **Security** — input validated, no secrets/PII in code or docs, escalation
   boundaries respected (auth/payments/PII never silently changed)?
5. **Performance** — no N+1, no unbounded ops on hot paths?

Categorize findings as Critical / Important / Suggestion with specific
`file:line` references and fix recommendations.

Gate awareness: `ut-tdd gate <id>` reads the execution mode from `ut-tdd status`;
judgement gates require cross-agent review evidence (hybrid) or
`intra_runtime_subagent` evidence (single runtime) — self-review alone does not
clear the accept gate. Confirm `ut-tdd doctor` exits 0 before approving.
