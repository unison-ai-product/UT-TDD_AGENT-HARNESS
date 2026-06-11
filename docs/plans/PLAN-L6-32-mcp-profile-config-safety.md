---
plan_id: PLAN-L6-32-mcp-profile-config-safety
title: "PLAN-L6-32 (add-design): MCP profile config and external verification safety"
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
    scope: "PLAN-L6-32 close: MCP profile config/safety function contracts, U-MCPPROFILE oracles, PLAN-L7-33 implementation entry, and REVERSE-33 back-fill are present; doctor/review-evidence green."
    worker_model: codex-gpt-5
    reviewer_model: codex-gpt-5-intra-runtime-review
agent_slots:
  - role: tl
    slot_label: "TL - MCP profile config / safety design"
generates:
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-00-master.md
  requires:
    - .ut-tdd/audit/A-125-mcp-external-verification-profile-scope.md
    - docs/research/mcp-external-verification-profile-research-2026-06-09.md
    - docs/plans/PLAN-REVERSE-31-codex-l7-overstep.md
---

# PLAN-L6-32 (add-design): MCP profile config and external verification safety

## §0 Position

This PLAN is the L6 entry for the remaining A-125 work around generated local MCP configuration, Docker MCP Toolkit profile inclusion, and profile safety lint. It is intentionally separate from PLAN-L6-31 relation graph work: graph impact decides what should run; this PLAN defines whether an external profile is safe and ready to run.

## §1 Scope

Design function contracts for:

- complete verification-profile catalog rows, including Docker MCP Toolkit as an optional environment profile;
- generated local MCP config rendering without committed secrets or user-specific global mounts;
- external profile safety analysis for official source, package identity, read-only/narrow toolsets, workspace mounts, Docker controls, and credential non-persistence;
- activation planning from workflow signals to probe/smoke/human-approval/refusal steps.

## §2 Inputs

- Requirements §6.8.10.
- Physical-data §9.6.
- ADR-002 A-125 addendum.
- A-125 audit and research memo.
- Existing `src/lint/verification-profile.ts` first slice.

## §3 Function Contracts

The function contracts are documented in `function-spec.md` "MCP Profile Config / Safety Addendum":

- `catalogVerificationProfiles`
- `renderGeneratedMcpConfig`
- `analyzeVerificationProfileSafety`
- `planExternalProfileActivation`

## §4 Test Design

The L7 pair artifact adds U-MCPPROFILE-001..012. These oracles cover complete profile catalog, disabled-by-default policy, Docker MCP Toolkit optional profile metadata, generated config safety, source trust, package readiness, GitHub read-only guard, Docker controls, trigger routing, and no implicit activation.

## §5 Workflow Guard

No source implementation for Docker MCP Toolkit profile rows, generated MCP config, or profile safety lint is authorized until PLAN-L7-33 has a TDD Red entry and requires PLAN-REVERSE-33.

## §8 DoD

- [x] L6 function signatures are documented.
- [x] U-MCPPROFILE unit oracles are added to L7 unit test design.
- [x] L7 implementation PLAN references this PLAN.
- [x] Reverse pairing PLAN exists for implementation back-fill.

Status is `confirmed`: the L6 entry, L7 oracle coverage, confirmed L7 implementation route, and Reverse pairing are present. External profile execution remains gated by explicit workflow evidence.
