---
plan_id: PLAN-L7-35-canonical-document-export
title: "PLAN-L7-35 (add-impl): canonical document export"
kind: add-impl
layer: L7
drive: fullstack
status: draft
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
agent_slots:
  - role: tl
    slot_label: "TL - canonical document export implementation"
  - role: qa
    slot_label: "QA - U-DOCEXPORT oracle"
generates:
  - artifact_path: src/export/document-export.ts
    artifact_type: source
  - artifact_path: tests/document-export.test.ts
    artifact_type: test
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-34-canonical-document-export.md
  requires:
    - docs/plans/PLAN-L6-34-canonical-document-export.md
    - docs/plans/PLAN-REVERSE-35-canonical-document-export.md
---

# PLAN-L7-35 (add-impl): canonical document export

## §0 Position

This is the future L7 implementation entry for PLAN-L6-34. It is the authorized route for adding source code for `ut-tdd export docs`.

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
- CLI surface after pure functions are green: `ut-tdd export docs --kind ... --format ...`.

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

- [ ] Red test exists before source implementation.
- [ ] U-DOCEXPORT-001..012 pass.
- [ ] `bun run test tests/document-export.test.ts tests/doctor.test.ts` passes.
- [ ] `bun run typecheck`, `bun run lint`, and `bun run src/cli.ts doctor` pass.
- [ ] Reverse fullback closes governance/backlog additions.
