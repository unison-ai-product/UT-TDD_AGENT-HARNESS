---
plan_id: PLAN-L7-202-adr-governance-relation-graph-node
title: "PLAN-L7-202 (impl): ADR and governance README relation graph projection"
kind: impl
layer: L7
drive: be
status: confirmed
created: 2026-06-30
updated: 2026-06-30
owner: Codex
parent_design: docs/plans/PLAN-L7-32-cross-artifact-relation-graph.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
backprop_decision: not_required
backprop_decision_reason: "DB feedback exposed a relation graph loader coverage gap for ADR/governance docs. The fix extends projection coverage only; no schema, product workflow, or public CLI semantics changed."
agent_slots:
  - role: se
    slot_label: "SE - materialize ADR and governance README relation graph nodes"
  - role: tl
    slot_label: "TL - verify missing-projection feedback is closed by real loader impact tests"
generates:
  - artifact_path: docs/plans/PLAN-L7-202-adr-governance-relation-graph-node.md
    artifact_type: markdown_doc
  - artifact_path: src/graph/loader.ts
    artifact_type: source_module
  - artifact_path: tests/relation-graph-loader.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-32-cross-artifact-relation-graph.md
  requires:
    - docs/plans/PLAN-L7-32-cross-artifact-relation-graph.md
    - docs/plans/PLAN-L7-156-top-level-reference-doc-graph-node.md
  references:
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
    - docs/adr/ADR-005-distribution-model-and-central-ui.md
    - docs/governance/README.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-30T11:14:20+09:00"
    tests_green_at: "2026-06-30T11:13:07+09:00"
    verdict: approve
    scope: "Close DB feedback missing-projection findings for ADR and governance README changes."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    notes:
      - "loadRelationGraphSourceSet now walks docs/adr/*.md into design-like graph nodes."
      - "docs/governance/README.md is included with other canonical governance docs."
      - "Fixture and real-repo loader tests assert ADR-001, ADR-005, and governance README impact no longer emit missing-projection."
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\relation-graph-loader.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T11:13:07+09:00"
        evidence_path: tests/relation-graph-loader.test.ts
        output_digest: "sha256:059140121829947cc7b3c0e1940d21979c5277249e7e4b94c6d5a87de3da111b"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-30T11:13:07+09:00"
        evidence_path: src/graph/loader.ts
        output_digest: "sha256:055b93545785609a87658ed82d16a4c8ccc23efe860c3796369dea983f98e76d"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-30T11:12:38+09:00"
        evidence_path: src/graph/loader.ts
        output_digest: "sha256:055b93545785609a87658ed82d16a4c8ccc23efe860c3796369dea983f98e76d"
---

# PLAN-L7-202: ADR and Governance README Relation Graph Projection

## Finding

`harness.db` feedback surfaced three `missing-projection` gate findings after
the clean-distribution curation commit:

- `docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md`
- `docs/adr/ADR-005-distribution-model-and-central-ui.md`
- `docs/governance/README.md`

The files were legitimate changed artifacts, but the relation graph loader did
not materialize ADR docs and only allowed one governance document. Impact
analysis therefore failed closed instead of silently falling back.

## Change

- Walk `docs/adr/*.md` and add every ADR as a design-like graph node.
- Add `docs/governance/README.md` to canonical governance graph coverage.
- Extend fixture and real-repo loader tests so ADR and governance README changes
  do not emit `missing-projection`.

## Acceptance

- `bun run vitest run tests\relation-graph-loader.test.ts` passes.
- `bun run lint` passes.
- `bun run typecheck` passes.
- After DB rebuild, `doctor` no longer surfaces the three missing-projection
  gate feedback items.
