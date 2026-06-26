---
plan_id: PLAN-L7-171-g8-adapter-asset-evidence
title: "PLAN-L7-171: G8 adapter/asset evidence expansion"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-26
updated: 2026-06-26
owner: Codex
parent_design: docs/plans/PLAN-L7-169-g8-integration-evidence-manifest.md
backprop_decision: not_required
backprop_decision_reason: "The change corrects G8 evidence-manifest lint granularity and adds a partial Adapter/Asset evidence manifest. It does not alter L8 test design semantics or product runtime behavior."
agent_slots:
  - role: se
    slot_label: "SE - G8 Adapter/Asset evidence inventory"
  - role: tl
    slot_label: "TL - G8 manifest validator correction"
  - role: aim
    slot_label: "AIM - L8 evidence partial-coverage audit"
generates:
  - artifact_path: docs/plans/PLAN-L7-171-g8-adapter-asset-evidence.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/g8-integration-workflow.ts
    artifact_type: source_module
  - artifact_path: tests/g8-integration-workflow.test.ts
    artifact_type: test_code
  - artifact_path: .ut-tdd/evidence/g8-integration/20260626-it-adapter-asset-expansion.json
    artifact_type: json_config
dependencies:
  parent: docs/plans/PLAN-L7-169-g8-integration-evidence-manifest.md
  requires:
    - docs/plans/PLAN-L7-169-g8-integration-evidence-manifest.md
    - docs/plans/PLAN-L7-170-g8-evidence-graph-node.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-26T21:16:51+09:00"
    tests_green_at: "2026-06-26T21:16:51+09:00"
    verdict: approve
    scope: "G8 manifest aggregate family validation and Adapter/Asset partial evidence expansion."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\g8-integration-workflow.test.ts tests\\runtime-adapter.test.ts tests\\skill-recommend.test.ts tests\\asset-drift.test.ts tests\\asset-catalog.test.ts tests\\placeholder-deps.test.ts tests\\agent-guard.test.ts tests\\agent-slots.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-26T21:16:51+09:00"
        evidence_path: tests/g8-integration-workflow.test.ts
        output_digest: "sha256:2eab00f92a5bda76ff43a4b215d4620c117939e3221f808603492b5c7ed77d91"
---

# PLAN-L7-171 G8 Adapter/Asset Evidence Expansion

## Metadata

- kind: troubleshoot
- layer: L7
- status: done
- owner: Codex
- created: 2026-06-26
- parent: PLAN-L7-169-g8-integration-evidence-manifest
- scope: Extend G8 integration evidence beyond the initial MODULE/STATE minimum while preserving honest partial coverage for unproven Adapter/Asset cases.

## Problem

The first G8 integration evidence manifest made MODULE/STATE coverage executable, but the workflow validator required those families inside every manifest. That blocked incremental L8 climb work because Adapter/Asset evidence has to be added as a separate manifest without pretending it independently satisfies the whole G8 minimum.

## Decision

Move required-family checks from per-manifest validation to aggregate workflow validation. Add a second manifest for Adapter/Asset coverage, marking only IT-ASSET-05 and IT-ASSET-06 as mandatory passed. Keep ADAPTER and the remaining ASSET cases as partial until direct provider invocation, roster CLI, optional-root, and threshold proofs exist.

## Generated Artifacts

- `src/lint/g8-integration-workflow.ts`
- `tests/g8-integration-workflow.test.ts`
- `.ut-tdd/evidence/g8-integration/20260626-it-adapter-asset-expansion.json`
- `docs/plans/PLAN-L7-171-g8-adapter-asset-evidence.md`

## Verification

- `bun run vitest run tests\runtime-adapter.test.ts tests\skill-recommend.test.ts tests\asset-drift.test.ts tests\asset-catalog.test.ts tests\placeholder-deps.test.ts tests\agent-guard.test.ts tests\agent-slots.test.ts`
- `bun run vitest run tests\g8-integration-workflow.test.ts tests\runtime-adapter.test.ts tests\skill-recommend.test.ts tests\asset-drift.test.ts tests\asset-catalog.test.ts tests\placeholder-deps.test.ts tests\agent-guard.test.ts tests\agent-slots.test.ts`
- `bun run typecheck`
- `bun run lint`
- `bun run src\cli.ts db rebuild`
- `bun run src\cli.ts doctor`

## Residual Partial Coverage

- `IT-ADAPTER-01`: AdapterPlan intent is covered; provider mock to `InvokeResult` normalization is not.
- `IT-ADAPTER-02`: absent/auth/rate-limit/timeout classifier behavior remains unproven.
- `IT-ADAPTER-03`: mode-routing/gate-check config schema fixture proof remains unproven.
- `IT-ASSET-01..04,07`: catalog, guard, resolver, skill catalog, and placeholder checks have unit coverage, but their L8 rows still need direct CLI/import/threshold closure.
