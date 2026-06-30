---
plan_id: PLAN-L7-191-distribution-helix-wording-erasure
title: "PLAN-L7-191 (impl): clean distribution wording and dogfood governance curation"
kind: impl
layer: L7
drive: be
status: confirmed
created: 2026-06-29
updated: 2026-06-30
owner: Codex
parent_design: docs/design/harness/L6-function-design/setup-solo-team.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
agent_slots:
  - role: se
    slot_label: "SE - curate clean-distribution governance docs, neutralize legacy source names in outward-facing docs, and add regression tests"
  - role: tl
    slot_label: "TL - verify clean artifact has no legacy runtime name residue and dogfood audit docs stay excluded"
generates:
  - artifact_path: docs/plans/PLAN-L7-191-distribution-helix-wording-erasure.md
    artifact_type: markdown_doc
  - artifact_path: src/setup/index.ts
    artifact_type: source_module
  - artifact_path: tests/setup.test.ts
    artifact_type: test_code
  - artifact_path: tests/workflow-contracts.test.ts
    artifact_type: test_code
  - artifact_path: docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
    artifact_type: doc_update
  - artifact_path: docs/adr/ADR-005-distribution-model-and-central-ui.md
    artifact_type: doc_update
  - artifact_path: docs/governance/README.md
    artifact_type: doc_update
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-157-distribution-clean-pull.md
    - docs/plans/PLAN-L7-190-distribution-runtime-asset-projection.md
  references:
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
    - docs/adr/ADR-005-distribution-model-and-central-ui.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-30T22:02:00+09:00"
    tests_green_at: "2026-06-30T22:01:00+09:00"
    verdict: approve
    scope: "Clean distribution wording and dogfood governance curation."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    notes:
      - "Clean distribution curation now denies known and future dogfood governance audit/runtime-parity/extraction-plan documents."
      - "Outward-facing ADR/governance docs and workflow fixtures no longer expose the legacy source runtime name in clean artifacts."
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\setup.test.ts tests\\workflow-contracts.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T22:01:00+09:00"
        evidence_path: tests/setup.test.ts
        output_digest: "sha256:ea0224e0f382481080f49cfe13f82e3677dee84dc515d26bc081b9c7770a397a"
      - kind: unit_test
        command: "bun run vitest run tests\\setup.test.ts tests\\workflow-contracts.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T10:57:19+09:00"
        evidence_path: tests/workflow-contracts.test.ts
        output_digest: "sha256:8eb0101a8553633629ade102ad6d4a1482708bded088d9a5b28785bf2ad879be"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-30T22:01:00+09:00"
        evidence_path: src/setup/index.ts
        output_digest: "sha256:93ef1c5aac32640863c505a626081f971f19c971c6d90db46d94be51f776a4b7"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-30T22:01:00+09:00"
        evidence_path: src/setup/index.ts
        output_digest: "sha256:93ef1c5aac32640863c505a626081f971f19c971c6d90db46d94be51f776a4b7"
      - kind: smoke
        command: "bun -e \"buildCleanDistributionPlan smoke: artifactCount=421, denylistViolations=[], legacy-name hits=[]\""
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T10:58:00+09:00"
        evidence_path: docs/governance/README.md
        output_digest: "sha256:2714e0ffd09470610e2bd55861d03012b3ed213dcbd7d9d0ac50576bb747572b"
      - kind: smoke
        command: "bun -e \"buildCleanDistributionPlan smoke: artifactCount=421, denylistViolations=[], legacy-name hits=[]\""
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T10:58:00+09:00"
        evidence_path: docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
        output_digest: "sha256:7a60fa3ff043ce0de969aae2dcafb4d59fd3adce0dce71864c35a87c48d40cec"
      - kind: smoke
        command: "bun -e \"buildCleanDistributionPlan smoke: artifactCount=421, denylistViolations=[], legacy-name hits=[]\""
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T10:58:00+09:00"
        evidence_path: docs/adr/ADR-005-distribution-model-and-central-ui.md
        output_digest: "sha256:1a2394432a0353ebfb84cd5ff74dee413b3583c9809f604c1a8bcda49f7c9321"
---

# PLAN-L7-191: clean distribution wording and dogfood governance curation

## Scope

This closes the clean-distribution wording and governance curation gap for the
local distribution package.

- `src/setup/index.ts` keeps the explicit dogfood governance denylist and adds
  pattern denies for future `*-audit-*`, `legacy-debt`, `runtime-parity`, and
  `extraction-plan` governance documents.
- `tests/setup.test.ts` verifies explicit and future-pattern dogfood documents
  are excluded, and scans the real clean artifact text set for legacy runtime
  name residue.
- `tests/workflow-contracts.test.ts` uses a generic legacy command token in
  negative fixtures instead of the historical source runtime name.
- ADR-001, ADR-005, and `docs/governance/README.md` preserve their design
  decisions while replacing outward-facing historical source names and dangling
  migration links with neutral source-cutover language.

## Boundary

Historical migration, archive, and audit documents are not scrubbed in place.
They remain historical evidence, but they are excluded from the clean
distribution channel.

## Acceptance

- Real clean distribution artifact: `ok=true`, `artifactCount=421`,
  `denylistViolations=[]`, `legacy-name hits=[]`.
- Targeted setup/workflow tests pass.
- `lint` and `typecheck` pass.
- Review evidence is tied to the re-run commands above, not a mechanical
  digest restamp.
