---
plan_id: PLAN-REVERSE-138-quality-branch-audit
title: "PLAN-REVERSE-138: read-only quality and branch audit backfill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: be
status: confirmed
created: 2026-06-23
updated: 2026-06-23
owner: Codex
forward_routing: L4
promotion_strategy: reuse-with-hardening
backprop_scope:
  - layer: requirements
    decision: not_impacted
    evidence_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    reason: "The slice exposes maintenance visibility only; no new destructive branch operation or product requirement is introduced."
  - layer: L4-basic-design
    decision: updated
    evidence_path: docs/design/harness/L4-basic-design/architecture.md
    reason: "The new read-only audit module is registered in the src module inventory."
  - layer: L5-detailed-design
    decision: updated
    evidence_path: docs/design/harness/L5-detailed-design/if-detail.md
    reason: "The CLI interface catalog now lists audit quality and branch audit surfaces."
  - layer: L6-function-design
    decision: updated
    evidence_path: docs/design/harness/L6-function-design/function-spec.md
    reason: "The function spec records bucket semantics and non-destructive branch classification."
  - layer: implementation
    decision: updated
    evidence_path: src/audit/quality.ts
    reason: "The implementation adds read-only quality and branch analyzers plus CLI routing."
agent_slots:
  - role: tl
    slot_label: "TL - quality and branch audit backfill"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-138-quality-branch-audit.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L7-138-quality-branch-audit.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/if-detail.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: src/audit/quality.ts
    artifact_type: source_module
  - artifact_path: src/audit/branches.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
dependencies:
  parent: docs/plans/PLAN-L7-138-quality-branch-audit.md
  requires:
    - docs/plans/PLAN-L7-138-quality-branch-audit.md
---

# PLAN-REVERSE-138: read-only quality and branch audit backfill

## Objective

Backfill design evidence for the read-only maintenance audit surfaces requested
after the feedback taxonomy cleanup.

## Scope

- Register `src/audit/` in architecture module inventory.
- Record CLI contracts for `audit quality` and `branch audit`.
- Keep branch deletion, remote pruning, force operations, and history rewrites
  outside this PLAN.

## Acceptance Criteria

- `PLAN-L7-138` has a paired reverse backfill.
- Architecture, L5 IF, and L6 function design describe the new surfaces.
- Doctor remains green after DB rebuild.
