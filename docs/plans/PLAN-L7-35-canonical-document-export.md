---
plan_id: PLAN-L7-35-canonical-document-export
title: "PLAN-L7-35 (add-impl): canonical document export"
kind: add-impl
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-11
owner: Codex TL / PO
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-11"
    tests_green_at: "2026-06-11"
    verdict: pass
    scope: "U-DOCEXPORT-001..012 promoted to green tests. Canonical document parsing, deterministic dataset building, built-in CSV/Markdown rendering, optional renderer readiness findings, artifact projection rows, derived-artifact boundary, and stale source snapshot detection are implemented as pure functions. Critical 0 / Important 0. No package installation, Office renderer invocation, generated artifact gate truth, or canonical doc mutation is introduced."
    worker_model: codex-gpt-5
    reviewer_model: codex-gpt-5-intra-runtime-review
agent_slots:
  - role: tl
    slot_label: "TL - canonical document export implementation"
  - role: qa
    slot_label: "QA - U-DOCEXPORT oracle"
generates:
  - artifact_path: src/export/document-export.ts
    artifact_type: source_module
  - artifact_path: tests/document-export.test.ts
    artifact_type: test_code
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-34-canonical-document-export.md
  requires:
    - docs/plans/PLAN-L6-34-canonical-document-export.md
    - docs/plans/PLAN-REVERSE-35-canonical-document-export.md
---

# PLAN-L7-35 (add-impl): canonical document export

## §0 Position

This is the L7 implementation entry for PLAN-L6-34. Phase 3 implements the canonical document export core as pure TypeScript projection functions; a runnable `ut-tdd export docs` CLI surface is a follow-up route and is not claimed by this PLAN.

## §1 Entry Conditions

Implementation must not start until:

- PLAN-L6-34 has confirmed function contracts and U-DOCEXPORT oracles.
- `tests/document-export.test.ts` receives a TDD Red case for U-DOCEXPORT behavior before source changes.
- Existing doctor, typecheck, lint, and targeted tests are green before review evidence.
- Optional Office renderers remain disabled until readiness evidence exists.

## §2 Implementation Scope

Allowed implementation after entry conditions are met:

- Pure parser for canonical document structures.
- Dataset builders for document matrix and deck outline outputs.
- Built-in CSV and Markdown summary rendering.
- Renderer readiness probes for XLSX/PPTX/D2 profiles.
- CLI surface is out of Phase 3 scope; add it as a follow-up after the pure export core is stable.

Out of scope:

- Actual package installation.
- Treating generated XLSX/PPTX as source of truth.
- Importing edits from Office files into canonical docs without a separate approved import workflow.

## §3 Work Schedule

### Step 1: [serial] TDD Red oracle

U-DOCEXPORT behavior must fail for missing implementation before source changes.

### Step 2: [serial] Pure parser and dataset builder

CLI and renderer code depend on deterministic document projection output.

### Step 3: [parallel] Built-in render and optional renderer probes

CSV/Markdown render and external renderer readiness checks can proceed after pure functions are green.

### Step 4: [serial] review

typecheck / lint / targeted tests / doctor must be green before review evidence.

## §8 DoD

- [x] Red test exists before source implementation.
- [x] U-DOCEXPORT-001..012 pass.
- [x] `bun run vitest run tests/document-export.test.ts` passes before review.
- [x] `bun run typecheck` and `bun run lint` pass before review.
- [x] Reverse fullback closes governance/backlog additions.
