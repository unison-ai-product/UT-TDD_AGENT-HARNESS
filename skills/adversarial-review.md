---
schema_version: skill.v1
name: adversarial-review
skill_type: review
applies_to:
  layers:
    - L2
    - L3
    - L4
    - L5
    - L6
    - L7
    - L8
    - L10
    - L12
  drive_models:
    - Forward
    - Add-feature
    - Reverse
    - Recovery
    - Refactor
decision_points:
  - when: "ut-tdd doctor and ut-tdd vmodel lint are both green at a gate"
    choose: "read the design doc body and verify the claim is substantiated"
    over: "accepting green doctor/lint output as proof the content is correct"
    because: "doctor and lint check structure, not substance — coverage without substance is a named failure mode"
  - when: "a biome-ignore or ts-ignore suppression appears in the diff"
    choose: "fail the review unless the suppression carries a PLAN-linked rationale"
    over: "letting an unexplained suppression pass because the rest of the diff is clean"
    because: "unexplained suppressions are gate evasion and defeat the purpose of the lint gate"
  - when: "reviewing a PLAN in hybrid mode"
    choose: "require a different runtime or subagent family as the reviewer"
    over: "accepting self-review as the only recorded review evidence"
    because: "self-review as sole evidence in hybrid mode is an explicit anti-pattern — hybrid exists to get an independent check"
  - when: "only part of the PLAN's diff changed since the last review pass"
    choose: "review the full PLAN scope again"
    over: "reviewing only the partial diff since the last pass"
    because: "running review on a partial diff is a named anti-pattern that can miss regressions in already-touched files"
  - when: "an L6 test-design doc is missing for a new function but L7 code already exists"
    choose: "record it as an open obligation in review_evidence"
    over: "treating the working L7 implementation as sufficient evidence of coverage"
    because: "absent layer artifacts must be surfaced even when downstream code exists, per the trace-completeness check"
  - when: "a gate has no recorded review_evidence entry"
    choose: "treat the gate as not cleared"
    over: "treating ut-tdd doctor green as implicit gate clearance"
    because: "a gate with no recorded evidence is not cleared, regardless of doctor status"
---

# adversarial review

Independent, assumption-challenging review required at judgement gates G2, G4,
G5, G6, and G7 in the Forward cycle (FR-L1-13 workflow, FR-L1-21 cross-agent
review). Adversarial review differs from self-review: the reviewer actively
attempts to falsify the work rather than confirm it.

## When to load this skill

- Crossing a pair-freeze, trace-freeze, or accept gate in hybrid or
  intra-runtime-subagent mode.
- A `ut-tdd review --uncommitted` finding is ambiguous and needs independent
  judgement.
- A Recovery cycle must demonstrate that the original failure path is closed.
- An Add-feature PLAN with a new agent capability requires safety reasoning.

## Adversarial stance

The reviewer's starting assumption is that the artifact is wrong or incomplete.
Evidence must defeat that assumption, not paper over it. Specific failure modes
to probe:

- **Coverage without substance.** `ut-tdd doctor` green and `ut-tdd vmodel lint`
  passing do not mean design content is correct. Read each design doc to verify
  the claim it makes is actually substantiated in the body.
- **Gate evasion.** Check that every `// biome-ignore` and `// @ts-ignore` has a
  PLAN-linked rationale. Unexplained suppressions fail the review.
- **Trace completeness.** Every FR mentioned in the PLAN's `review_evidence`
  field should map to a real design doc or test assertion, not just an ID string.
- **Absent layer artifacts.** If an L6 test-design doc is missing for a new
  function, note it as an open obligation even if L7 code exists.
- **Handover freshness.** If the session crosses a runtime boundary, verify
  `.ut-tdd/handover/CURRENT.json` is present, non-stale, and the carry list
  matches `ut-tdd status` output.

## Review procedure by gate

**G2 (pair-freeze — design ready for implementation):**
1. `ut-tdd plan lint` exits 0.
2. `ut-tdd doctor` exits 0.
3. Read the design doc body — not just the header table.
4. Confirm the design is at the stated layer's expected granularity (L5 = unit
   test boundary, not L3 feature-level prose).
5. Record finding in PLAN `review_evidence` with reviewer identity and outcome.

**G4/G5 (trace-freeze — implementation complete):**
1. `bun run typecheck`, `bun run lint`, `bun run test` all exit 0 on HEAD.
2. `ut-tdd doctor` exits 0.
3. Confirm no `.skip` or `todo` in Vitest scope without PLAN rationale.
4. Spot-check three test assertions: do they exercise the specified behaviour or
   only verify the happy path?
5. Record finding.

**G6/G7 (accept — final acceptance):**
1. `ut-tdd review --uncommitted` no blocking findings.
2. All G4/G5 conditions still green.
3. ADR set to `Accepted` where applicable.
4. Handover updated or closed.

## Evidence format

Record adversarial review evidence in the PLAN's `review_evidence` field:

```
reviewer: <agent-slug or "intra_runtime_subagent">
gate: G5
outcome: PASS | FAIL | CONDITIONAL
findings:
  - <specific finding or "none">
timestamp: <ISO-8601>
```

A gate with no recorded evidence is not cleared, regardless of `ut-tdd doctor`
status.

## Anti-patterns

- Treating `ut-tdd doctor` green as the only required check — doctor sees
  structure, not substance.
- Running review on a partial diff — always review the full PLAN scope.
- Self-review as the only review evidence in hybrid mode — hybrid mode requires
  a different runtime or subagent family.
