---
plan_id: PLAN-L7-174-skill-catalog-g8-evidence
title: "PLAN-L7-174: skill catalog G8 evidence closure"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-29
updated: 2026-06-29
owner: Codex
parent_design: docs/plans/PLAN-L7-173-roster-boundary-g8-evidence.md
backprop_decision: not_required
backprop_decision_reason: "This closes the already-designed L8 IT-ASSET-04 skill catalog integration proof. It adds a scan-only in-memory catalog path without changing the L8 test design contract or the existing persistent automation asset projection."
agent_slots:
  - role: se
    slot_label: "SE - skill catalog scan implementation"
  - role: tl
    slot_label: "TL - in-memory/no-persistence verification"
  - role: aim
    slot_label: "AIM - G8 manifest evidence update"
generates:
  - artifact_path: docs/plans/PLAN-L7-174-skill-catalog-g8-evidence.md
    artifact_type: markdown_doc
  - artifact_path: src/assets/catalog.ts
    artifact_type: source_module
  - artifact_path: tests/asset-catalog.test.ts
    artifact_type: test_code
  - artifact_path: .ut-tdd/evidence/g8-integration/20260626-it-adapter-asset-expansion.json
    artifact_type: json_config
dependencies:
  parent: docs/plans/PLAN-L7-173-roster-boundary-g8-evidence.md
  requires:
    - docs/plans/PLAN-L7-173-roster-boundary-g8-evidence.md
    - docs/test-design/harness/L8-integration-test-design.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-29T10:58:46+09:00"
    tests_green_at: "2026-06-29T10:58:46+09:00"
    verdict: approve
    scope: "L8 IT-ASSET-04 docs/skills scan-only catalog, optional-root empty evidence, malformed/duplicate fail-close, and G8 evidence promotion."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\asset-catalog.test.ts tests\\g8-integration-workflow.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T10:58:46+09:00"
        evidence_path: tests/asset-catalog.test.ts
        output_digest: "sha256:01f47022dbd0fd7d9613b693f6822a6fbef10956560d13977383bbfce8c1f3f0"
---

# PLAN-L7-174: skill catalog G8 evidence closure

## Objective

Close the direct L8 evidence gap for `IT-ASSET-04`: `docs/skills/**/*.md` scan into an in-memory catalog with optional-root empty evidence and no `.ut-tdd` persistent state.

## Scope

- Add `scanSkillCatalog()` as a scan-only path separate from persistent `catalogAutomationAssets()`.
- Catalog markdown skill metadata into deterministic rows.
- Return missing optional roots as `optional-root-empty` info findings.
- Fail closed on malformed frontmatter and duplicate skill IDs.
- Promote only `IT-ASSET-04` in the G8 manifest.

## Acceptance

- Fixture `docs/skills/*.md` produces an in-memory skill catalog.
- Missing optional root returns explicit empty-with-evidence without making the result non-green.
- Malformed metadata and duplicate IDs are errors.
- The scan-only path does not create `.ut-tdd` state.
- Real repository has a non-empty `docs/skills` markdown catalog.

## Residual L8 Partial Coverage

- `IT-ADAPTER-01..03` remain unclosed until provider invocation, error policy, and DSL fixture proofs exist.
- `IT-ASSET-07` remains partial until threshold behavior is proven at the current layer boundary.
