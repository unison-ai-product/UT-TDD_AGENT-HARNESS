---
plan_id: PLAN-L3-06-screen-functional-body
title: "PLAN-L3-06: populate FE screen-functional body"
kind: design
layer: L3
sub_doc: screen-functional
drive: fe
status: confirmed
created: 2026-06-30
updated: 2026-06-30
owner: Codex TL
status_note: "Confirmed local body population for A146-6: L3 screen-functional is no longer slot-only."
agent_slots:
  - role: tl
    slot_label: "TL - FE screen functional descent"
generates:
  - artifact_path: docs/design/harness/L3-functional/screen-functional.md
    artifact_type: design_doc
  - artifact_path: docs/governance/document-system-map.md
    artifact_type: doc_update
  - artifact_path: src/lint/frontend-design-coverage.ts
    artifact_type: source_module
pair_artifact: docs/test-design/harness/L3-acceptance-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L12
dependencies:
  parent: docs/plans/PLAN-L3-00-master.md
  requires:
    - docs/design/harness/L1-requirements/screen-requirements.md
    - docs/design/harness/L2-screen/screen-list.md
    - docs/design/harness/L2-screen/ui-element.md
  blocks:
    - docs/plans/PLAN-L7-141-web-dashboard-component-derived.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-30T13:36:11+09:00"
    tests_green_at: "2026-06-30T13:35:50+09:00"
    verdict: approve
    worker_model: codex-gpt-5
    reviewer_model: codex-gpt-5
    scope: "L3 FE screen-functional body population. Targeted frontend-design-coverage and sub-doc catalog drift tests passed before review evidence recording."
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/frontend-design-coverage.test.ts tests/sub-doc-catalog-drift.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T13:35:50+09:00"
        evidence_path: tests/frontend-design-coverage.test.ts
        output_digest: "sha256:59d6ade3af544d0df04d5bc4de0a5d7e50398019d8e614e973da6a6ec79d86ad"
        anchor_commit: 3dbd7babd2d9dac6893003fd6a9c6eb107bed3af
---

# PLAN-L3-06: populate FE screen-functional body

## Scope

Populate `docs/design/harness/L3-functional/screen-functional.md` so the FE design left arm no longer stops at a registered slug for L3.

## Acceptance

- The document contains screen-level functional requirements and acceptance scenario families for all 15 central dashboard screens.
- `frontend-design-coverage` treats L3 as `body: present` with a real file path.
- The change remains read-only and does not claim implementation completion.
