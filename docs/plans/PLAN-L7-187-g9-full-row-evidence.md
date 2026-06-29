---
plan_id: PLAN-L7-187-g9-full-row-evidence
title: "PLAN-L7-187: G9 full-row evidence"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-29
updated: 2026-06-29
owner: Codex
parent_design: docs/plans/PLAN-L7-181-g9-system-coverage-expansion.md
backprop_decision: not_required
backprop_decision_reason: "This hardens the existing G9 evidence gate so it matches the already-authored L9 ST rows. It does not change L4 system contracts or product behavior."
dependencies:
  parent: docs/plans/PLAN-L7-181-g9-system-coverage-expansion.md
  requires:
    - docs/test-design/harness/L9-system-test-design.md
    - .ut-tdd/evidence/g9-system/20260629-st-system-expanded.json
    - src/lint/g9-system-workflow.ts
    - tests/g9-system-workflow.test.ts
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-29T15:18:52+09:00"
    tests_green_at: "2026-06-29T15:18:39+09:00"
    verdict: approve
    scope: "G9 system workflow lint now requires every designed ST row to have mandatory evidence or an explicit defer."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\g9-system-workflow.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T15:15:24+09:00"
        evidence_path: tests/g9-system-workflow.test.ts
        output_digest: "sha256:7ca4e705639b5f3f0f9b814663666ffe57f95c93d4d394b743fae8b7080c68cb"
      - kind: unit_test
        command: "bun run test"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-29T15:18:39+09:00"
        evidence_path: tests/g9-system-workflow.test.ts
        output_digest: "sha256:7ca4e705639b5f3f0f9b814663666ffe57f95c93d4d394b743fae8b7080c68cb"
agent_slots:
  - role: tl
    slot_label: "TL - G9 evidence closure"
  - role: qa
    slot_label: "QA - ST row coverage regression"
  - role: aim
    slot_label: "AIM - G9 lint implementation"
generates:
  - artifact_path: docs/plans/PLAN-L7-187-g9-full-row-evidence.md
    artifact_type: markdown_doc
  - artifact_path: docs/process/gates.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/g9-system-workflow.ts
    artifact_type: source_module
  - artifact_path: tests/g9-system-workflow.test.ts
    artifact_type: test_code
---

# PLAN-L7-187: G9 full-row evidence

## Objective

Close the remaining G9 workflow weakness where the system evidence gate could
prove only ST family coverage while leaving an individual designed ST row
unmapped.

## Scope

- Extract designed `ST-*` row IDs from the L9 system test-design table.
- Require every designed ST row to appear as either mandatory passing evidence
  or an explicit non-stale defer across G9 evidence manifests.
- Keep existing family coverage checks for ST-DATA / ST-ARCH / ST-FUNC /
  ST-ASSET / ST-EXT.
- Document that G9 family coverage is the minimum shape, not the close rule.

## Acceptance

- `g9-system-workflow` fails when any designed ST row lacks mandatory/deferred
  evidence.
- The live repository passes with the expanded G9 manifest: 27 mandatory ST
  rows plus the explicit `ST-ASSET-04` defer.
- `doctor` remains green after DB rebuild.
- The full local verification profile remains green before commit.
