---
plan_id: PLAN-L6-31-cross-artifact-relation-graph
title: "PLAN-L6-31 (add-design): cross-artifact relation graph and verification profile projection"
kind: add-design
layer: L6
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-11
owner: Codex TL / PO
review_evidence:
  - reviewer: codex-intra-runtime-review
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-11"
    tests_green_at: "2026-06-11"
    verdict: pass
    scope: "PLAN-L6-31 close: L6 module-drift relation graph contracts, L7 U-RELGRAPH oracles, PLAN-L7-32/36 implementation spans, and REVERSE-32 back-fill are present; doctor/review-evidence green."
    worker_model: codex-gpt-5
    reviewer_model: codex-gpt-5-intra-runtime-review
agent_slots:
  - role: tl
    slot_label: "TL - relation graph / DB projection design"
generates:
  - artifact_path: docs/design/harness/L6-function-design/module-drift.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/test-design/harness/L8-integration-test-design.md
    artifact_type: test_design
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-00-master.md
  requires:
    - docs/plans/PLAN-L6-00-master.md
    - .ut-tdd/audit/A-124-cross-artifact-graph-tooling.md
    - .ut-tdd/audit/A-125-mcp-external-verification-profile-scope.md
    - docs/plans/PLAN-REVERSE-31-codex-l7-overstep.md
---

# PLAN-L6-31 (add-design): cross-artifact relation graph and verification profile projection

## §0 Position

This PLAN is the proper L6 entry for A-124 / A-125 implementation. It prevents relation graph source work from starting without a function-level design, unit oracle, and DB projection contract.

## §1 Scope

Design the function contracts for:

- Cross-artifact graph projection from docs / source / tests / PLAN / audit / evidence into normalized rows.
- Impact expansion from changed files to affected FR / PLAN / design / test / DB table / diagram nodes.
- Diagram export contract for Mermaid first, with DOT / D2 as optional adapters.
- Verification profile recommendation using relation graph signals plus the existing A-125 profile catalog.
- Evidence collector contract for `.ut-tdd/evidence/verification-profiles/*.json` into DB projection rows.

## §2 Inputs

- Requirements §6.8.8 / §6.8.9 / §6.8.10.
- L5 physical-data §9.5 / §9.6.
- ADR-002 A-124 / A-125 addenda.
- IMP-118..125.
- Existing `src/lint/verification-profile.ts` first slice.

## §3 Function Contract Draft

| function | contract |
|---|---|
| `analyzeRelationImpact` | changed files -> graph nodes, dependency edges, impacted nodes, required actions, missing graph evidence findings |
| `collectRelationGraphProjection` | repository docs/source/tests/PLAN/audit/evidence -> rebuildable projection rows |
| `exportRelationDiagram` | graph snapshot -> Mermaid text; optional DOT/D2 adapters are disabled unless installed |
| `collectVerificationEvidenceProjection` | saved verification evidence -> `verification_profiles`, `verification_recommendations`, `mcp_server_runs`, `external_tool_findings` rows |

## §4 Test Design

Unit oracles must cover:

- Source file change recommends sibling test, L6 design, and graph impact row.
- DB projection doc change surfaces affected DB tables and upstream docs.
- MCP / verification evidence files normalize into projection rows without storing raw secrets or provider transcripts.
- Diagram export emits stable Mermaid for audit/handover.
- Missing graph projection produces a finding rather than silently passing.

## §5 Workflow Guard

No `src/lint/relation-graph.ts`, DB collector, or graph CLI implementation is authorized until this PLAN has:

- pair artifact coverage in L7 unit test design;
- TDD Red entry in the L7 implementation PLAN;
- Reverse pairing for any lower-layer discovery.

## §8 DoD

- [x] L6 function signatures are documented.
- [x] U-* unit oracles are added to L7 unit test design.
- [x] L8 integration GWT rows are added for DB projection rebuild.
- [x] L7 implementation PLAN references this PLAN.
- [x] Reverse fullback PLAN exists for any governance changes.

Status is `confirmed`: design/test-design coverage is present, PLAN-L7-32/36 implementation spans are confirmed, and review evidence is recorded. Further relation graph expansion remains under its own L7/Reverse PLANs.
