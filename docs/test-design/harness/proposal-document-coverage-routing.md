---
layer: L1-L9
executed_at_layer: L7-L14
artifact_type: test_design
status: draft
pair_artifact: docs/design/harness/L3-functional/functional-requirements.md
related_function: src/task/classify.ts
related_cli: src/cli.ts
created: 2026-06-24
---

# Proposal Document Coverage Routing

This document is the test-design meta layer for
`classifyProposalDocumentCoverage`. It defines how proposal text is converted
into required design and test-design coverage across UT-TDD layers.

The classifier is a coverage floor, not an optimizer. When multiple patterns
match, the expected result is the union of every required document, evidence
item, and gate. LLM wording such as "minor", "simple", "not needed", or "skip"
is treated as a finding only and must not remove required documents.

## 1. Coverage Tiers

| Tier | Meaning | Required test-design response |
|---|---|---|
| G0 | Documentation-only or no product behavior change. | Keep trace/audit evidence. Do not create implementation-only work without a paired design artifact. |
| G1 | Narrow local behavior with stable contract. | Require L7 unit oracle plus the paired L6 design contract. |
| G2 | Single artifact family or low-risk UI/data/API change. | Require L7 plus the nearest pair test design, usually L12 acceptance or L8 integration. |
| G3 | Cross-document feature, UI flow, API/data coupling, or low drive confidence. | Require L7/L8 and acceptance trace. Include cross-artifact trace evidence. |
| G4 | Security, privacy, NFR, migration, release, operational, or multi-pattern high-risk change. | Require L7/L8/L9 plus L12 or L14 as applicable, with human/risk approval evidence. |
| G5 | Discovery/research where implementation shape is unknown. | Require research decision evidence before reducing to G1-G4. Unknowns increase coverage rather than decreasing it. |

## 2. Pattern To Test-Design Mapping

| Coverage pattern | L7 unit | L8 integration | L9 system | L12 acceptance | L14 operational | Notes |
|---|---|---|---|---|---|---|
| `screen-ui` | Component/render contract when behavior exists. | UI state to API/model boundary when present. | Multi-screen workflow and navigation behavior. | Required for user-visible workflow and PO acceptance. | Required only when operational observability or dashboard behavior changes. | Requires L1/L2 screen docs and cross-artifact trace. |
| `business-flow` | Business rule oracle when local rules exist. | Required when workflow crosses module, state, or adapter boundaries. | Required for end-to-end business process and alternate path behavior. | Required for PO-visible flow acceptance. | Required when the flow changes operator procedure, monitoring, or recovery. | Business flow evidence connects requirements, screen flow, function behavior, and acceptance trace. |
| `frontend-design` | Token/component function oracle when logic exists. | Design token/component integration when shared. | Accessibility and visual consistency as system behavior when cross-screen. | Required for user-facing changes. | Usually reference only unless operator dashboard behavior changes. | External UI/UX templates are reference unless converted into UT-TDD evidence. This row is the **verification (right-arm)** routing; the **design (left-arm) FE/UI doc per V-model layer (L0-L14)** is defined in [document-system-map §1c](../../governance/document-system-map.md). |
| `ux-research-usability` | Not normally unit-level. | Not normally integration-level. | Usability risk may drive system scenario coverage. | Required as acceptance evidence or UAT input. | Optional operations feedback loop when post-release usability is measured. | Research enriches evidence; it never replaces required trace docs. |
| `api-if` | Request/response parser and validation oracle. | Required for adapter/contract boundary. | Required when API behavior affects end-to-end workflow. | Required when externally visible behavior changes. | Required when API availability or runbook changes. | Must include negative/error contract cases. |
| `data-db` | Schema/model/invariant oracle. | Required for persistence/query boundary. | Required for state consistency and migration behavior. | Required when business-visible data changes. | Required for migration/recovery/backup concerns. | Physical data and trace evidence are mandatory for persisted changes. |
| `backend-function` | Required. | Required when more than one module or adapter participates. | Required when workflow/CLI/system behavior changes. | Required when behavior is user/business visible. | Optional unless operational behavior changes. | Prevents implementation-only backend work. |
| `batch-report` | Processing rules, filters, grouping, idempotency. | Required for source data to processor/output boundary. | Required for schedule, retry, volume, and failure behavior. | Required when output is user/business-visible. | Required for job operation, monitoring, rerun, and recovery. | Batch and report evidence must include large-volume and failure cases. |
| `report-output` | Formatting helper oracle when applicable. | Required for data-to-output rendering boundary. | Required for output lifecycle and consumer workflow. | Required for sample output acceptance. | Required when operations owns generation/delivery. | Output layout, sort/grouping, format, and encoding are evidence. |
| `async-job-flow` | Retry/idempotency helper oracle. | Required for queue/message/worker boundary. | Required for ordering, replay, dead-letter, and recovery. | Required if business-visible completion/failure exists. | Required for runbook, alerts, and recovery. | Missing failure path is under-design. |
| `notification-message` | Template/recipient rule oracle. | Required for delivery adapter boundary. | Required for delivery failure and privacy behavior. | Required for user-facing notification behavior. | Required when operations monitors delivery. | Must include locale/timezone and redaction cases when relevant. |
| `common-component` | Required shared component oracle. | Required for consumers of shared component. | Required when component affects multiple workflows. | Required when user-visible. | Optional. | Consumers must be traced to avoid hidden blast radius. |
| `security-privacy` | Required negative authorization and redaction oracles. | Required for auth/session/permission boundary. | Required for abuse cases and cross-module enforcement. | Required for acceptance of role/permission behavior. | Required for auditability and incident response. | Escalates to at least G4 and requires human approval evidence. |
| `error-observability-audit` | Error taxonomy and redaction oracle. | Required for logging/audit/alert integration. | Required for failure observability behavior. | Required when user-facing failures change. | Required for monitoring, alert, and audit operations. | Dashboard screenshots alone are not sufficient evidence. |
| `ops-release-migration` | Migration/release helper oracle when deterministic. | Required for migration/cutover boundary. | Required for rollback, compatibility, and deployment flow. | Required when behavior changes are released to users. | Required for cutover, runbook, and rehearsal evidence. | No operational prose without executable or reviewable oracle. |
| `nfr-quality` | Required only for measurable local invariant. | Required for performance/security/reliability boundaries. | Required for system quality scenario. | Required when acceptance threshold is business-visible. | Required for operations-grade NFR. | Generic NFR wishes must become measurable grade/evidence rows. |
| `test-design` | Required for L7 oracle generation. | Required for boundary examples and GWT. | Required for system scenarios. | Required for acceptance criteria. | Required for operational criteria when applicable. | Test templates are incorporated only when they add oracle substance. |
| `workflow-gate` | Required for gate/routing function contracts. | Required for CLI/gate/state integration. | Required for end-to-end workflow and review-tier behavior. | Required when process acceptance changes. | Required when operational gate/runbook behavior changes. | UT-TDD-specific, not generic external process template adoption. |
| `agent-orchestration` | Required for slot/roster/model policy oracle. | Required for provider/adapter/handover boundary. | Required for mode fallback and cross-runtime behavior. | Required where user-facing workflow changes. | Required for handover/recovery operations. | External agent templates are reference unless converted into UT-TDD guard evidence. |
| `discovery` | No unit coverage until decision narrows scope. | Prototype integration evidence only if executable. | System hypothesis evidence only if measurable. | Required decision evidence for continue/pivot/reject. | Optional operational learning evidence. | G5 does not authorize fewer docs; it postpones reduction until evidence exists. |

## 3. Research Adoption Rules

| Disposition | Use in UT-TDD | Rejection guard |
|---|---|---|
| `incorporate` | Convert the template into deterministic required docs, evidence, or test cases. | Reject if it is only a screenshot, generic prose, or lacks an oracle. |
| `reference` | Use vocabulary/checklists as prompts for measurable UT-TDD evidence. | Reject if it would become a substitute for pair artifacts or trace. |
| `ut-tdd-specific` | Keep the UT-TDD design as the source of truth and use external material only as background. | Reject external templates that conflict with UT-TDD gates, roles, or V-model pairs. |
| `exclude` | Keep out of required coverage. | Marketing templates, vendor-only formats, and LLM-minimal-design claims stay excluded. |

## 4. Required Test Oracles

| Oracle ID | Target | Expected behavior |
|---|---|---|
| DOCROUTE-U-01 | `classifyProposalDocumentCoverage` | Multiple matched patterns produce union coverage without duplicate document rows. |
| DOCROUTE-U-02 | `classifyProposalDocumentCoverage` | Shrinkage wording emits `llm-shrinkage-ignored` and does not lower granularity. |
| DOCROUTE-U-03 | `classifyProposalDocumentCoverage` | Security/privacy, migration, production, or external API risk escalates to at least G4 with approval evidence. |
| DOCROUTE-U-04 | `classifyProposalDocumentCoverage` | Discovery/research terms keep G5 until narrowing evidence exists. |
| DOCROUTE-IT-01 | `ut-tdd task classify --design-docs --json` | CLI JSON includes both base task classification and document coverage. |
| DOCROUTE-IT-02 | Research adoption output | Adopt/reference/exclude decisions are explicit and explain what is not incorporated. |
| DOCROUTE-ST-01 | Cross-pattern proposal | L7/L8/L9/L12/L14 requirements match the tier and pattern table above. |

## 5. Guardrails

- Required documents are additive.
- Unknown or low-confidence classification increases coverage.
- LLM wording cannot remove required documents.
- External templates cannot replace UT-TDD pair artifacts, trace, or gate evidence.
- Every incorporated template must add a testable oracle, measurable threshold,
  required evidence item, or required document row.
- Mini/spark subagents are optimization lanes only: `T2-mini` is for research,
  adoption split, and document inventory work; `T2-spark` is for bounded
  low-risk implementation or lint/test patches. Multiple `T2-mini` and
  `T2-spark` subagents may run in parallel when ownership is disjoint
  (`parallel_slots` from `PROPOSAL_SUBAGENT_LANES`), but they cannot close
  G4/G5 risk, authorize frontier work, or reduce the required document set.
  Guard marker: cheap lanes cannot close G4/G5 risk.

## 6. Subagent Routing Oracles

| Oracle ID | Target | Expected behavior |
|---|---|---|
| DOCROUTE-U-05 | Cheap parallel lanes | Low-risk G1/G2 work recommends `docs:T2-mini` and may recommend `se:T2-spark` for bounded implementation. |
| DOCROUTE-U-06 | Risk escalation | G4/G5 or risk-flagged work recommends gated `qa:T0-frontier` or `tl:T0-frontier` judgement and does not recommend `T2-spark` as the closing lane. |
| DOCROUTE-U-07 | Japanese proposal terms | Japanese terms for report output, async queue, notification, shared component, security, and operations trigger the same coverage packs as English terms. |
| DOCROUTE-U-08 | Parallel subagent lanes | Recommended mini/spark lanes expose `parallel_slots > 1`, `ownership` disjointness, and `closing_authority=false`; frontier judgement exposes `parallel_slots=1`, single judgement ownership, and `closing_authority=true`. |
| DOCROUTE-IT-03 | `team suggest --design-docs` bridge | Proposal mini/spark/T1 lanes become concrete team members with ownership shards and model overrides; `T0-frontier` remains judgement guidance and is not emitted as an executable team member. |
