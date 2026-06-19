# UT-TDD Coding Rules

This document is the coding-rule SSoT for the TypeScript/Bun core.
Requirements reference: `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md` §7.6.1.
Executable gate: `src/lint/coding-rules.ts` through `ut-tdd doctor`.

## Workflow Placement

Coding-rule documentation is a workflow step, not an after-the-fact CI note.

- Forward L6: before G6/G7 handoff, confirm `docs/governance/coding-rules.md` is unchanged and still applicable, or update it with the function design delta.
- Add-feature: the `add-design` PLAN records coding-rule impact; `add-impl` starts only after the rule impact is either `unchanged` or reflected in this SSoT and paired U-CODE tests.
- Refactor / Retrofit / Recovery / Reverse fullback: any change to implementation language, lint tool, naming, typing, error-handling style, or generated-code boundary updates this SSoT before implementation freeze.
- Review: `bun run typecheck`, `bun run lint`, `npx vitest run`, and `ut-tdd doctor` must be green before reviewer approval.

## Machine Policy

The following block is machine-read by `loadCodingRulePolicy`. Rule IDs must match the lint implementation.

```yaml
coding_rules:
  version: 1
  applies_to:
    source:
      - "src/**/*.ts"
    tests:
      - "tests/**/*.ts"
  rules:
    - id: no-explicit-any
      severity: error
      scope: ["source", "test"]
      description: "Do not use explicit any; use unknown, generics, or concrete types."
    - id: no-suppression-comment
      severity: error
      scope: ["source", "test"]
      description: "Do not use TypeScript, ESLint, or Biome suppression comments."
    - id: file-name-kebab
      severity: error
      scope: ["source", "test"]
      description: "TypeScript files must be kebab-case, kebab-case .test.ts, or index.ts."
    - id: max-source-params
      severity: error
      scope: ["source"]
      description: "Source functions, methods, constructors, and arrows must have at most 3 params; use an input object otherwise."
    - id: structured-error-handling
      severity: error
      scope: ["source"]
      description: "Catch blocks must record, convert, return explicit failure state, or document fail-open intent; undocumented empty and rethrow-only catch blocks are prohibited."
    - id: module-boundary
      severity: error
      scope: ["source"]
      description: "Core modules must not import against the defined dependency direction; move shared logic to lower-level modules."
    - id: machine-surface-language
      severity: error
      scope: ["source", "test"]
      description: "Machine-facing CLI, doctor, lint, gate, JSON, env, status, and oracle surfaces must use stable ASCII English decision tokens."
```

## Machine Surface Language

Machine-readable and machine-parsed surfaces use stable ASCII English tokens.
Human prose may be Japanese, but the decision word that tools, agents, logs, and
tests rely on must not depend on Japanese text or symbols.

Required ASCII decision tokens include:

- `OK`
- `violation`
- `warning`
- `skipped`
- `note`
- `error`
- `ready` / `not ready`

This applies to CLI output, `doctor` messages, lint/gate messages, JSON keys,
environment variable names, rule IDs, oracle IDs, status words, and test
assertions over those surfaces. Japanese explanation may follow the token, but
the token itself remains ASCII.

## Human Notes

- `bun run typecheck`, `bun run lint`, `npx vitest run`, and `ut-tdd doctor` are the minimum verification set for TypeScript core changes.
- Test helper arity is not capped by `max-source-params`; tests still obey no-any, no suppression comments, and naming rules.
- Fail-open is allowed only when the catch block returns/records explicit state or documents the fail-open intent in-place; silent catch blocks and rethrow-only catch blocks are not exceptions.
- Boundary rules are intentionally minimal in v2: `lint` stays pure, `runtime` stays below governance checks, and `schema` stays below feature modules.
- Exceptions are not inline comments. Add a policy PLAN first, then update this SSoT and the lint tests together.
