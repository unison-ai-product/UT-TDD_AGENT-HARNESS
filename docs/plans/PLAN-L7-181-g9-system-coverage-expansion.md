---
plan_id: PLAN-L7-181-g9-system-coverage-expansion
title: "PLAN-L7-181: G9 system coverage expansion"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-29
updated: 2026-06-29
owner: Codex
parent_design: docs/plans/PLAN-L7-179-g9-system-workflow.md
backprop_decision: not_required
backprop_decision_reason: "This expands executable evidence projection for existing L9 ST rows. It does not change requirements or lower-layer design contracts."
agent_slots:
  - role: tl
    slot_label: "TL - L9 ST coverage mapping"
  - role: qa
    slot_label: "QA - targeted system-test command verification"
  - role: aim
    slot_label: "AIM - G9 expanded manifest registration"
generates:
  - artifact_path: docs/plans/PLAN-L7-181-g9-system-coverage-expansion.md
    artifact_type: markdown_doc
  - artifact_path: src/lint/g9-system-workflow.ts
    artifact_type: source_module
  - artifact_path: tests/g9-system-workflow.test.ts
    artifact_type: test_code
  - artifact_path: .ut-tdd/evidence/g9-system/20260629-st-system-expanded.json
    artifact_type: json_config
dependencies:
  parent: docs/plans/PLAN-L7-179-g9-system-workflow.md
  requires:
    - docs/plans/PLAN-L7-179-g9-system-workflow.md
    - .ut-tdd/evidence/g9-system/20260629-st-system-minimum.json
    - docs/test-design/harness/L9-system-test-design.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-29T13:29:00+09:00"
    tests_green_at: "2026-06-29T13:28:00+09:00"
    verdict: approve
    scope: "Expanded G9 system evidence manifest mapping all non-placeholder L9 ST rows to executable local test groups plus CI boundary evidence."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\gate-static.test.ts tests\\vmodel-pair.test.ts tests\\impl-plan-trace.test.ts tests\\entity-coverage.test.ts tests\\review-evidence.test.ts tests\\g9-system-workflow.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T13:18:00+09:00"
        evidence_path: tests/gate-static.test.ts
        output_digest: "sha256:4830898f4dd9b8132ecd4d071ab89c8c46eecde288b5bd0efaa2ecb12bb87b0e"
      - kind: unit_test
        command: "bun run vitest run tests\\dependency-drift.test.ts tests\\agent-guard.test.ts tests\\cli-surface.test.ts tests\\doctor.test.ts tests\\g9-system-workflow.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T13:24:00+09:00"
        evidence_path: tests/dependency-drift.test.ts
        output_digest: "sha256:27155d10c52c95cda5006062aa099a49e7bf97f27420356464ed42e34939aeca"
      - kind: unit_test
        command: "bun run vitest run tests\\workflow-contracts.test.ts tests\\drive-model-passage.test.ts tests\\forward-convergence.test.ts tests\\backfill-pairing.test.ts tests\\gate-review-tier.test.ts tests\\skill-recommend.test.ts tests\\team-run.test.ts tests\\g9-system-workflow.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T13:22:00+09:00"
        evidence_path: tests/workflow-contracts.test.ts
        output_digest: "sha256:2517ed3ae8331803d1ecd330ee6e6a483be111b5cb43b5701343032949725561"
      - kind: unit_test
        command: "bun run vitest run tests\\asset-catalog.test.ts tests\\asset-drift.test.ts tests\\agent-slots.test.ts tests\\cli-surface.test.ts tests\\skill-recommend.test.ts tests\\workflow-contracts.test.ts tests\\g9-system-workflow.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T13:19:00+09:00"
        evidence_path: tests/asset-catalog.test.ts
        output_digest: "sha256:ee7d6328665e0d264e4d182669d63665a5223754247be413c4b5022776e42631"
      - kind: unit_test
        command: "bun run vitest run tests\\runtime-adapter.test.ts tests\\agent-guard.test.ts tests\\codex-hook-adapter.test.ts tests\\runtime-hook-entrypoints.test.ts tests\\dependency-drift.test.ts tests\\g9-system-workflow.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-29T13:22:00+09:00"
        evidence_path: tests/runtime-adapter.test.ts
        output_digest: "sha256:0cedb685f30b70e6c1faf09ec35b65077ed17294bcff7671e16b28803417a460"
---

# PLAN-L7-181: G9 system coverage expansion

## Objective

Expand G9 from the minimum family-spanning manifest to an ST-row manifest that maps every non-placeholder L9 system-test row to executable evidence.

## Scope

- Add `20260629-st-system-expanded.json` under `.ut-tdd/evidence/g9-system/`.
- Permit `.github/workflows/` as G9 CI-boundary evidence for ST rows whose proof is the pushed workflow run.
- Cover all L9 `ST-DATA-*`, `ST-ARCH-*`, `ST-FUNC-*`, implemented `ST-ASSET-*`, and `ST-EXT-*` rows.
- Keep `ST-ASSET-04` explicit as deferred because the L9 design marks it as a placeholder / implementation-detail carry.
- Treat `ST-EXT-03` as CI-boundary evidence and verify it with the pushed GitHub Actions run after commit.

## Acceptance

- `g9-system-workflow` accepts the expanded manifest.
- Targeted system-test command groups for data, architecture, function, asset, and external-interface rows pass locally.
- `doctor` and DB feedback stay green after DB rebuild.
- GitHub Actions `harness-check` passes on the pushed commit, completing the CI-boundary part of `ST-EXT-03`.
