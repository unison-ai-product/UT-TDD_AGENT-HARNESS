---
plan_id: PLAN-L7-178-d-contract-dsl-g8-evidence
title: "PLAN-L7-178: D-CONTRACT DSL G8 evidence closure"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-29
updated: 2026-06-29
owner: Codex
parent_design: docs/plans/PLAN-L7-177-adapter-error-policy-g8-evidence.md
backprop_decision: not_required
backprop_decision_reason: "This closes the already-designed L8 IT-ADAPTER-03 D-CONTRACT DSL proof. It adds deterministic YAML fixture validation without changing lower-layer requirements."
agent_slots:
  - role: se
    slot_label: "SE - D-CONTRACT DSL evidence"
  - role: tl
    slot_label: "TL - routing/gate fail-close verification"
  - role: aim
    slot_label: "AIM - G8 manifest evidence update"
generates:
  - artifact_path: docs/plans/PLAN-L7-178-d-contract-dsl-g8-evidence.md
    artifact_type: markdown_doc
  - artifact_path: src/workflow/routing-contracts.ts
    artifact_type: source_module
  - artifact_path: src/workflow/contracts.ts
    artifact_type: source_module
  - artifact_path: tests/workflow-contracts.test.ts
    artifact_type: test_code
  - artifact_path: .ut-tdd/evidence/g8-integration/20260626-it-adapter-asset-expansion.json
    artifact_type: json_config
dependencies:
  parent: docs/plans/PLAN-L7-177-adapter-error-policy-g8-evidence.md
  requires:
    - docs/test-design/harness/L8-integration-test-design.md
    - docs/design/harness/L5-detailed-design/if-detail.md
    - src/workflow/routing-contracts.ts
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-29T12:09:30+09:00"
    tests_green_at: "2026-06-29T12:09:30+09:00"
    verdict: approve
    scope: "L8 IT-ADAPTER-03 D-CONTRACT DSL fixture loading and G8 evidence promotion."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\workflow-contracts.test.ts tests\\g8-integration-workflow.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T12:09:30+09:00"
        evidence_path: tests/workflow-contracts.test.ts
        output_digest: "sha256:8eb0101a8553633629ade102ad6d4a1482708bded088d9a5b28785bf2ad879be"
---

# PLAN-L7-178: D-CONTRACT DSL G8 evidence closure

## Objective

Close the direct L8 evidence gap for `IT-ADAPTER-03`: `mode-routing.yaml` and `gate-checks.yaml` style D-CONTRACT fixtures are parsed and validated before any workflow execution depends on them.

## Scope

- Keep the proof provider-independent so Claude Code and Codex share the same contract.
- Add pure YAML + zod validation in `src/workflow/routing-contracts.ts`.
- Re-export the validation surface through `src/workflow/contracts.ts`.
- Cover valid parse plus fail-close cases for unknown mode, missing gate, circular routing, and non-`ut-tdd` recommended commands.
- Promote `IT-ADAPTER-03` in the G8 adapter/asset manifest.

## Acceptance

- Valid mode-routing and gate-checks fixtures parse deterministically.
- Unknown routing modes fail before execution.
- Required gate IDs missing from gate-checks fail before execution.
- Circular route dependencies fail before execution.
- Gate `next_action` commands reuse `recommendedCommandV1Schema` and reject legacy/non-`ut-tdd` commands.
- G8 manifest records `IT-ADAPTER-03` as mandatory passed with no remaining deferred adapter/asset items.

## Residual L8 Partial Coverage

- No `IT-ADAPTER-*` or `IT-ASSET-*` items remain deferred in the G8 adapter/asset manifest.
