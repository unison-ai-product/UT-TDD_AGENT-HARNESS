---
plan_id: PLAN-L7-172-roster-cli-g8-evidence
title: "PLAN-L7-172: roster CLI G8 evidence closure"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-29
updated: 2026-06-29
owner: Codex
parent_design: docs/plans/PLAN-L7-171-g8-adapter-asset-evidence.md
backprop_decision: not_required
backprop_decision_reason: "This closes already-designed roster list/check D-API evidence for L8 IT-ASSET-01/02. It adds the missing CLI/mechanized proof without changing the L8 test design contract."
agent_slots:
  - role: se
    slot_label: "SE - roster CLI implementation"
  - role: tl
    slot_label: "TL - roster/guard consistency verification"
  - role: aim
    slot_label: "AIM - G8 manifest evidence update"
generates:
  - artifact_path: docs/plans/PLAN-L7-172-roster-cli-g8-evidence.md
    artifact_type: markdown_doc
  - artifact_path: src/assets/catalog.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: cli_extension
  - artifact_path: tests/asset-catalog.test.ts
    artifact_type: test_code
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
  - artifact_path: .ut-tdd/evidence/g8-integration/20260626-it-adapter-asset-expansion.json
    artifact_type: json_config
dependencies:
  parent: docs/plans/PLAN-L7-171-g8-adapter-asset-evidence.md
  requires:
    - docs/plans/PLAN-L7-171-g8-adapter-asset-evidence.md
    - docs/test-design/harness/L8-integration-test-design.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-01T16:17:00+09:00"
    tests_green_at: "2026-07-01T16:16:00+09:00"
    verdict: approve
    scope: "ut-tdd roster list/check CLI surface and G8 IT-ASSET-01/02 evidence promotion."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\asset-catalog.test.ts tests\\cli-surface.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: tests/asset-catalog.test.ts
        output_digest: "sha256:79fc89eec778b9e6c5d317efc8752cb2eef7e5052df7fe179965415a105bf7b4"
---

# PLAN-L7-172: roster CLI G8 evidence closure

## Objective

Close the direct L8 evidence gap for:

- `IT-ASSET-01`: `roster list` scan to registry.
- `IT-ASSET-02`: `roster check` against the guard allowlist.

## Scope

- Add deterministic roster registry scan functions using `.claude/agents/*.md`.
- Add `ut-tdd roster list --json` and `ut-tdd roster check --json`.
- Keep roster code independent from runtime guard code; CLI passes the guard allowlist into the roster check.
- Promote only `IT-ASSET-01` and `IT-ASSET-02` in the G8 manifest.

## Acceptance

- `roster list` returns filename-stem IDs, model family, path, and allowlist membership.
- `roster check` passes when `missingFromRoster=0` and `nameMismatches=0`.
- Injected missing allowlisted agent and filename/name mismatch fail closed.
- Real repo `roster check` passes with allowlisted present and known non-allowlisted agents informational.
- G8 manifest records `IT-ASSET-01` and `IT-ASSET-02` as mandatory passed.

## Residual L8 Partial Coverage

- `IT-ADAPTER-01..03` remain unclosed until provider invocation, error policy, and DSL fixture proofs exist.
- `IT-ASSET-03` remains partial until dependency-direction/import graph proof is recorded against roster boundaries.
- `IT-ASSET-04` remains partial until optional-root empty-with-evidence proof is direct.
- `IT-ASSET-07` remains partial until threshold behavior is proven at the current layer boundary.
