---
plan_id: PLAN-L7-184-g10-ux-workflow
title: "PLAN-L7-184: G10 UX workflow"
kind: troubleshoot
layer: L7
drive: fe
status: confirmed
created: 2026-06-29
updated: 2026-06-29
owner: Codex
parent_design: docs/plans/PLAN-L7-183-doctor-test-performance.md
backprop_decision: not_required
backprop_decision_reason: "This mechanizes the existing L10 UX verification route. It does not change the V-model pair or lower-layer product requirements."
dependencies:
  parent: docs/plans/PLAN-L7-183-doctor-test-performance.md
  requires:
    - docs/process/gates.md
    - docs/design/harness/L10-ux/visual-design.md
    - src/lint/g10-ux-workflow.ts
    - tests/g10-ux-workflow.test.ts
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-29T14:15:00+09:00"
    tests_green_at: "2026-06-29T14:14:08+09:00"
    verdict: approve
    scope: "G10 UX workflow lint, evidence manifest, doctor wiring, and live-repo regression coverage."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\g10-ux-workflow.test.ts tests\\lint-wiring.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T14:14:08+09:00"
        evidence_path: tests/g10-ux-workflow.test.ts
        output_digest: "sha256:56d268e7f01d5f6ab958d20023e0740661beadc62eeee8c6d847c89924e756a9"
agent_slots:
  - role: tl
    slot_label: "TL - G10 workflow mechanization"
  - role: qa
    slot_label: "QA - UX evidence manifest regression"
  - role: aim
    slot_label: "AIM - doctor lint wiring"
generates:
  - artifact_path: docs/plans/PLAN-L7-184-g10-ux-workflow.md
    artifact_type: markdown_doc
  - artifact_path: docs/process/gates.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L10-ux/visual-design.md
    artifact_type: design_doc
  - artifact_path: src/lint/g10-ux-workflow.ts
    artifact_type: source_module
  - artifact_path: tests/g10-ux-workflow.test.ts
    artifact_type: test_code
  - artifact_path: .ut-tdd/evidence/g10-ux/20260629-ux-minimum.json
    artifact_type: json_config
---

# PLAN-L7-184: G10 UX workflow

## Objective

Move G10 from placeholder-only UX prose to the same minimum mechanical pattern
used for G8 and G9:

- workflow granularity in the L10 UX artifact
- gate definition in `docs/process/gates.md`
- evidence manifest under `.ut-tdd/evidence/g10-ux/`
- doctor lint and regression tests

## Scope

- Add `g10-ux-workflow` lint with UXV family coverage checks.
- Wire the lint into `doctor` so missing G10 evidence fail-closes.
- Add live-repo and pure regression tests.
- Register the minimum G10 evidence manifest for visual, token, a11y, VRT, and UX review coverage.

## Acceptance

- `g10-ux-workflow` fails when workflow markers, G10 gate markers, mandatory UXV coverage, or the evidence manifest are missing.
- The live repository passes `g10-ux-workflow`.
- `doctor` includes `doctor: g10-ux-workflow - OK`.
- The full local verification profile remains green before confirmation.
