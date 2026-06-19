---
status: confirmed
layer: L6
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
---

# DDD/TDD Rules SSoT

This document is the requirements-level SSoT for DDD and TDD strictness in the UT-TDD harness. It complements `docs/governance/coding-rules.md`: coding rules constrain TypeScript implementation shape, while this document constrains domain boundaries, invariant trace, TDD evidence, test oracle strength, and integration-test granularity.

## Rules

```yaml
ddd_tdd_rules:
  - id: domain-boundary
    enforcement: hard
    owner: src/lint/ddd-tdd-rules.ts
    intent: source modules must not import higher-level runtime or CLI modules across governance/domain boundaries.
  - id: invariant-test-trace
    enforcement: hard
    owner: src/lint/ddd-tdd-rules.ts
    intent: every declared domain invariant must name an L7 U-* oracle.
  - id: red-first-evidence
    enforcement: hard
    owner: src/lint/ddd-tdd-rules.ts
    intent: confirmed TDD PLANs marked tdd_red_required must record red_at and green_at in chronological order.
  - id: test-oracle-strength
    enforcement: hard
    owner: src/lint/ddd-tdd-rules.ts
    intent: test cases must contain explicit expect/assert oracles and must not rely only on truthiness checks.
  - id: integration-gwt
    enforcement: hard
    owner: src/lint/ddd-tdd-rules.ts
    intent: L8 IT-* rows must carry Given/When/Then granularity.
  - id: unit-oracle-substance
    enforcement: hard
    owner: src/lint/ddd-tdd-rules.ts
    intent: L7 unit test-design U-*-NNN rows must describe a real expected behavior (non-skeleton), not only a link/citation (IMP-083 residual).
```

## Domain Boundary Map

| Source area | Allowed direction | Forbidden examples |
|---|---|---|
| `src/lint/**` | governance lint may read docs/source text and return pure findings | importing `src/runtime/**`, `src/doctor/**`, or CLI orchestration |
| `src/runtime/**` | runtime state/logging may call lower-level helpers and schema | importing governance lint or V-model checker modules |
| `src/schema/**` | schema is a lower-level contract package | importing feature, runtime, lint, or CLI modules |

Boundary checks are intentionally conservative. When a shared type is needed across two areas, move it to a lower-level module rather than importing upward.

## Invariants

- id: DDD-INV-001 oracle: U-DDDTDD-001 - Governance/domain modules remain acyclic and lower-level contracts do not depend on higher-level runtime orchestration.
- id: DDD-INV-002 oracle: U-DDDTDD-002 - Domain invariant declarations are not accepted unless the L7 test-design artifact carries an explicit U-* oracle.
- id: DDD-INV-003 oracle: U-DDDTDD-003 - TDD implementation evidence is Red-first: `red_at <= green_at` for confirmed plans that require TDD evidence.
- id: DDD-INV-004 oracle: U-DDDTDD-004 - Unit tests expose a concrete oracle, not only execution without assertions or truthiness checks.
- id: DDD-INV-005 oracle: U-DDDTDD-005 - Integration tests are confirmable at Given/When/Then granularity.

## Workflow Placement

- Forward L6: define or update domain boundaries, invariants, and rule IDs before L7 implementation begins.
- Add-feature `add-design`: every feature that changes domain boundaries, invariants, workflow evidence, or test granularity must update this SSoT or explicitly state no impact.
- L7 Red: `add-impl` plans that require TDD must record Red-first evidence before review evidence can be treated as freeze-ready.
- L8 integration: every IT-* row must use Given/When/Then; placeholder integration rows are carry only and cannot be counted as confirmable.
- Quantitative vs qualitative split: mechanical checks (`vitest`, `doctor`, lint) must run before qualitative review; critical DDD/TDD points must carry both quantitative evidence and agent/human review evidence.
- Doctor/CI: `checkDddTddRules` runs in `ut-tdd doctor` and in the shared harness check pipeline through the doctor command.

## Machine Check Contract

`src/lint/ddd-tdd-rules.ts` loads this document, workflow docs, `src/**/*.ts`, `tests/**/*.ts`, PLAN docs, and the L7/L8 test-design docs. It returns deterministic violations for rule drift, workflow anchor drift, boundary drift, invariant oracle gaps, missing Red-first evidence, weak test oracles, and missing GWT integration granularity.

## Baseline Debt

No active DDD/TDD baseline debt is registered. The analyzer supports exact `path:line rule` baseline keys for future staged hardening, but current repo guard is clean without suppressions.
