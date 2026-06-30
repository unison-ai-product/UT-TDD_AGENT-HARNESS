---
plan_id: PLAN-L6-36-screen-spec-body
title: "PLAN-L6-36: populate FE screen-spec body"
kind: design
layer: L6
sub_doc: screen-spec
drive: fe
status: confirmed
created: 2026-06-30
updated: 2026-06-30
owner: Codex TL
status_note: "Confirmed local body population for A146-6: L6 screen-spec is no longer slot-only."
agent_slots:
  - role: tl
    slot_label: "TL - per-screen function specification descent"
generates:
  - artifact_path: docs/design/harness/L6-function-design/screen-spec.md
    artifact_type: design_doc
  - artifact_path: docs/governance/document-system-map.md
    artifact_type: doc_update
  - artifact_path: src/lint/frontend-design-coverage.ts
    artifact_type: source_module
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L7
dependencies:
  parent: docs/plans/PLAN-L6-00-master.md
  requires:
    - docs/design/harness/L5-detailed-design/ui-detail.md
    - docs/design/harness/L4-basic-design/ui-standard.md
    - docs/design/harness/L3-functional/screen-functional.md
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
    scope: "L6 FE screen-spec body population. Targeted frontend-design-coverage and sub-doc catalog drift tests passed before review evidence recording."
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/frontend-design-coverage.test.ts tests/sub-doc-catalog-drift.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T13:35:50+09:00"
        evidence_path: tests/frontend-design-coverage.test.ts
        output_digest: "sha256:59d6ade3af544d0df04d5bc4de0a5d7e50398019d8e614e973da6a6ec79d86ad"
---

# PLAN-L6-36: populate FE screen-spec body

## Scope

Populate `docs/design/harness/L6-function-design/screen-spec.md` so the FE design left arm contains per-screen function specifications for all 15 dashboard screens.

## Acceptance

- The document defines common screen contracts, events, validation rules, and per-screen functions.
- `frontend-design-coverage` treats L6 as `body: present` with a real file path.
- The L6 spec remains copy-only/read-only and prepares L7 unit-test targets without declaring implementation completion.
