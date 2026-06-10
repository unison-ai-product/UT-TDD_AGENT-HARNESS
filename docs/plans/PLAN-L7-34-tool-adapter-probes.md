---
plan_id: PLAN-L7-34-tool-adapter-probes
title: "PLAN-L7-34 (add-impl): graph and diagram tool adapter probes"
kind: add-impl
layer: L7
drive: fullstack
status: draft
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
agent_slots:
  - role: tl
    slot_label: "TL - tool adapter probe implementation"
  - role: qa
    slot_label: "QA - U-TOOLADAPTER oracle"
generates:
  - artifact_path: src/lint/tool-adapter.ts
    artifact_type: source
  - artifact_path: tests/tool-adapter.test.ts
    artifact_type: test
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-33-tool-adapter-probes.md
  requires:
    - docs/plans/PLAN-L6-33-tool-adapter-probes.md
    - docs/plans/PLAN-REVERSE-34-tool-adapter-probes.md
---

# PLAN-L7-34 (add-impl): graph and diagram tool adapter probes

## §0 Position

This is the future L7 implementation entry for optional graph/diagram tool adapter probes.

## §1 Entry Conditions

- PLAN-L6-33 has confirmed function contracts and U-TOOLADAPTER oracles.
- `tests/tool-adapter.test.ts` receives a TDD Red case before source changes.
- Optional adapters remain disabled until package/executable readiness is proven.

## §2 Scope

Allowed after entry conditions:

- pure adapter catalog and probe functions;
- normalization of bounded evidence into `tool_runs`, `dependency_edges`, `diagram_artifacts`, and findings;
- no implicit package install or destructive auto-fix.

## §8 DoD

- [ ] Red test exists before source implementation.
- [ ] U-TOOLADAPTER-001..010 pass.
- [ ] typecheck, lint, targeted tests, and doctor pass.
- [ ] Reverse fullback closes any lower-layer discoveries.
