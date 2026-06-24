---
layer: L6
artifact_type: design_doc
status: confirmed
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
plan: docs/plans/PLAN-L6-21-fr-unit-coverage.md
---

> **L6 contract marker**: `analyzeL6FrCoverage(input: L6FrCoverageDocs) => L6FrCoverageResult` is the unit-test-granularity contract. DbC pre/post/invariant requires every FR registry row to resolve to an L6 spec, named contract, and matching U-FR oracle.

# L6 FR Unit Coverage Matrix

This matrix is the L6 entry guard for function design. It proves that the L1 FR registry is complete before L6 closure and that every FR has a unit-test-level contract and U-* oracle.

Rules:

- Source FR list: `docs/design/harness/L1-requirements/functional-requirements.md` §1, parsed by `fr-registry-audit`.
- Coverage is complete only when every FR-L1 row has one L6 spec path, one deterministic unit contract, and one U-* oracle.
- The contract name may be implemented later, but it must be narrow enough to become a unit test without inventing a new requirement at L7.
- L6 docs remain design SSoT; `harness.db` and other DB projections are not authoring sources.

Added requirement bundle mapping:

| Added requirement | Covered FR rows | Unit contract focus |
|---|---|---|
| SQLite reference-feedback projection for V-model state and non-V-model drives | FR-L1-06, FR-L1-19, FR-L1-20, FR-L1-40, FR-L1-41 | projection event write/rebuild, repeated-gap feedback, plan/session digest, drive partition and classification |
| Logs for drive/model/session/hook runs | FR-L1-07, FR-L1-20, FR-L1-37, FR-L1-39, FR-L1-40, FR-L1-41, FR-L1-42 | session event recording, digest metrics, model effort/complexity/adapter plan, drive state |
| Skill firing and recommendation metrics | FR-L1-12, FR-L1-46, FR-L1-47 | deterministic skill suggestion, roster capability, skill catalog and recommendation |
| Search-cost reduction through reference graph/search index | FR-L1-33, FR-L1-34, FR-L1-48, FR-L1-49 | asset catalog, capability gap prioritization, command catalog, asset drift detection |
| Mechanical quality feedback and dependency/finding detection | FR-L1-05, FR-L1-17, FR-L1-18, FR-L1-19, FR-L1-45, FR-L1-49 | gate evidence, review evidence, module/asset drift, feedback events, doc review tier |
| DDD/TDD strictness automation | FR-L1-50 | domain boundary, invariant trace, Red-first evidence, oracle strength, integration GWT |
| Artifact progress color projection | FR-L1-51 | artifact red/yellow/green derivation from linked tests, dependency impact, and recovery/fullback evidence |

| FR | L6 spec | unit contract | unit oracle |
|---|---|---|---|
| FR-L1-01 | docs/design/harness/L6-function-design/function-spec.md | `planDraft` validates kind/layer/sub_doc, atomically publishes PLAN, and rejects duplicate IDs. | U-FR-L1-01 |
| FR-L1-02 | docs/design/harness/L6-function-design/function-spec.md | `sprintCheck` requires frozen L6 design and Red test evidence before Green implementation evidence. | U-FR-L1-02 |
| FR-L1-03 | docs/design/harness/L6-function-design/vmodel-pair-freeze.md | `analyzePairFreeze` detects missing design/test-design pair references and bidirectional trace gaps. | U-FR-L1-03 |
| FR-L1-04 | docs/design/harness/L6-function-design/function-spec.md | `frontmatterSchema` and `parseRequires` preserve kind/generates/requires deviation planning. | U-FR-L1-04 |
| FR-L1-05 | docs/design/harness/L6-function-design/governance-enforcement.md | `evaluateGateReview` and gate lint messages fail-close when required gate evidence is absent. | U-FR-L1-05 |
| FR-L1-06 | docs/design/harness/L6-function-design/function-spec.md | `recordProjectionEvent` and `rebuildHarnessDb` define V-model state DB projection rows without becoming source-of-truth. | U-FR-L1-06 |
| FR-L1-07 | docs/design/harness/L6-function-design/session-log.md | `recordEvent`, `onSessionStart`, `onPostToolUse`, and `onStop` record hook/session events and plan digests fail-open. | U-FR-L1-07 |
| FR-L1-08 | docs/design/harness/L6-function-design/function-spec.md | `routeSignalToMode` maps drift/degradation/runaway/incident signals to Recovery/Incident/Reverse/Refactor candidates. | U-FR-L1-08 |
| FR-L1-09 | docs/design/harness/L6-function-design/function-spec.md | `evaluateAgentGuard` blocks disallowed subagent/model combinations and records bypass semantics. | U-FR-L1-09 |
| FR-L1-10 | docs/design/harness/L6-function-design/handover-mechanism.md | `runHandover` and cutover boundary contracts preserve restart point, correction history, and rollback handoff. | U-FR-L1-10 |
| FR-L1-11 | docs/design/harness/L6-function-design/function-spec.md | `recordCrossCuttingEvent` records interrupt/debt/drift/readiness events without blocking the active mode. | U-FR-L1-11 |
| FR-L1-12 | docs/design/harness/L6-function-design/function-spec.md | `suggestSkillInjection` resolves layer/drive/kind skill and command injection candidates deterministically. | U-FR-L1-12 |
| FR-L1-13 | docs/design/harness/L6-function-design/function-spec.md | `enforceForwardOrder` validates Forward gate/order transitions from PLAN through accept. | U-FR-L1-13 |
| FR-L1-14 | docs/design/harness/L6-function-design/function-spec.md | `routeReverseR4` validates reverse type, forward_routing, and promotion_strategy before Forward merge. | U-FR-L1-14 |
| FR-L1-15 | docs/design/harness/L6-function-design/function-spec.md | `decideDiscoveryS4` validates hypothesis evidence, PoC verification, and decide outcome. | U-FR-L1-15 |
| FR-L1-16 | docs/design/harness/L6-function-design/forced-stop-feedback.md | `classifyFeedback` and recovery proposal contracts distinguish incident/runaway feedback from normal comments. | U-FR-L1-16 |
| FR-L1-17 | docs/design/harness/L6-function-design/governance-enforcement.md | `checkReviewEvidence` and CI evidence contracts require local gate proof before CI/PR acceptance. | U-FR-L1-17 |
| FR-L1-18 | docs/design/harness/L6-function-design/module-drift.md | `analyzeModuleDrift` and doctor aggregation surface dependency/contract/connection/regression gaps. | U-FR-L1-18 |
| FR-L1-19 | docs/design/harness/L6-function-design/function-spec.md | `emitFeedbackEvents` aggregates repeated failures, successful recipes, and prevention rules as learning inputs. | U-FR-L1-19 |
| FR-L1-20 | docs/design/harness/L6-function-design/session-log.md | `compressPlanDigest` plus DB projection contracts preserve execution logs, failures, budget, and metrics inputs. | U-FR-L1-20 |
| FR-L1-21 | docs/design/harness/L6-function-design/vmodel-pair-freeze.md | `analyzeTestPerspectiveGate` detects missing test viewpoints and duplicate test-level coverage. | U-FR-L1-21 |
| FR-L1-22 | docs/design/harness/L6-function-design/function-spec.md | `detectFrontendDrift` returns deterministic FE detector signals for mock, token, a11y, visual, and state drift. | U-FR-L1-22 |
| FR-L1-23 | docs/design/harness/L6-function-design/function-spec.md | `routeScrumFullback` converts increment evidence into Forward targets with confirmed decision outcome. | U-FR-L1-23 |
| FR-L1-24 | docs/design/harness/L6-function-design/backfill-pairing.md | `analyzeBackfill` requires add-impl to have Reverse back-fill and glossary merge where applicable. | U-FR-L1-24 |
| FR-L1-25 | docs/design/harness/L6-function-design/function-spec.md | `assertRefactorInvariant` requires regression evidence and unchanged external behavior for refactor mode. | U-FR-L1-25 |
| FR-L1-26 | docs/design/harness/L6-function-design/function-spec.md | `evaluateRetrofitMatrix` validates staged migration, config impact, and rollback readiness. | U-FR-L1-26 |
| FR-L1-27 | docs/design/harness/L6-function-design/function-spec.md | `evaluateResearchDecision` validates research memo evidence and ADR decision readiness. | U-FR-L1-27 |
| FR-L1-28 | docs/design/harness/L6-function-design/function-spec.md | `mergeTwoStageAgentDesign` validates Phase 1/Phase 2 merge state and drive=agent handoff. | U-FR-L1-28 |
| FR-L1-29 | docs/design/harness/L6-function-design/function-spec.md | `validateScreenDesignWorkflow` validates IA, screen list, flow, wireframe, mock, and componentization outputs. | U-FR-L1-29 |
| FR-L1-30 | docs/design/harness/L6-function-design/function-spec.md | `validateFrontendDesignWorkflow` validates visual design, token SSoT, a11y, visual regression, and UX polish gates. | U-FR-L1-30 |
| FR-L1-31 | docs/design/harness/L6-function-design/handover-mechanism.md | `checkHandoverDiscipline` detects context/handover freshness for automated restart. | U-FR-L1-31 |
| FR-L1-32 | docs/design/harness/L6-function-design/function-spec.md | `validateFolderRules` validates process docs and test placement against UT-TDD folder policy. | U-FR-L1-32 |
| FR-L1-33 | docs/design/harness/L6-function-design/function-spec.md | `catalogExistingAssets` classifies command/skill/detector/template/state/hook/doc/test assets by coverage status. | U-FR-L1-33 |
| FR-L1-34 | docs/design/harness/L6-function-design/function-spec.md | `prioritizeCapabilityGaps` ranks skill/command gaps by workflow impact and missing route/recover capability. | U-FR-L1-34 |
| FR-L1-35 | docs/design/harness/L6-function-design/function-spec.md | `renderFoundationReadiness` reports implemented/designed/missing infrastructure categories. | U-FR-L1-35 |
| FR-L1-36 | docs/design/harness/L6-function-design/function-spec.md | `projectSkillEvaluations` computes per-skill rating, adoption count, success count, and unused flag from skill_invocations + plan_registry; cold-start zero-row; no auto-delete. | U-FR-L1-36 |
| FR-L1-43 | docs/design/harness/L6-function-design/function-spec.md | `projectPocEvaluations` projects one summary row with poc_success_rate = confirmed/(confirmed+rejected+pivot) from plan_registry (kind=poc, decision_outcome set); cold-start zero-row; pivot is non-success. | U-FR-L1-43 |
| FR-L1-38 | docs/design/harness/L6-function-design/function-spec.md | `projectModelEvaluations` computes per-model success_rate by joining model_runs.plan_id -> plan_registry.status IN PLAN_SUCCESS_STATUSES; opt-in (model-opt-in.yaml enabled:true); cold-start zero-row; token/cost efficiency is discharged by PLAN-L7-57/58 through file-scanned runtime session telemetry, with unknown/unpublished pricing kept null. | U-FR-L1-38 |
| FR-L1-37 | docs/design/harness/L6-function-design/function-spec.md | `recommendModelEffort` maps task/drive/layer signals to model family and reasoning effort. | U-FR-L1-37 |
| FR-L1-39 | docs/design/harness/L6-function-design/function-spec.md | `scoreTaskComplexity` computes size/dependency/uncertainty scores, `classifyProposalDocumentCoverage` derives additive required design/test-design document packs from proposal text, and `analyzeProposalDocumentCoverage` verifies routing/doc-path/guardrail consistency. | U-FR-L1-39 |
| FR-L1-40 | docs/design/harness/L6-function-design/function-spec.md | `resolveDriveStatePartition` maps drive to `.ut-tdd/drive/<drive>` state and skip_sub_doc behavior. | U-FR-L1-40 |
| FR-L1-41 | docs/design/harness/L6-function-design/function-spec.md | `classifyDrive` classifies PLAN/code/dependency evidence into drive and orchestration mode input. | U-FR-L1-41 |
| FR-L1-42 | docs/design/harness/L6-function-design/function-spec.md | `buildAdapterPlan` and provider handover contracts preserve context, PLAN, budget, and provider boundary separation. | U-FR-L1-42 |
| FR-L1-44 | docs/design/harness/L6-function-design/setup-solo-team.md | `planSetup` and onboarding baseline contracts establish harness state for existing projects. | U-FR-L1-44 |
| FR-L1-45 | docs/design/harness/L6-function-design/review-evidence.md | `analyzeReviewEvidence` requires doc-reviewer/review-tier evidence for large doc and gate artifacts. | U-FR-L1-45 |
| FR-L1-46 | docs/design/harness/L6-function-design/agent-slots.md | `resolveRosterCapability` and guard integration contracts map subagent roster to capability/model class. | U-FR-L1-46 |
| FR-L1-47 | docs/design/harness/L6-function-design/function-spec.md | `catalogSkills` and `recommendSkills` curate UT-TDD skill pack metadata and trigger candidates. | U-FR-L1-47 |
| FR-L1-48 | docs/design/harness/L6-function-design/function-spec.md | `buildCommandCatalog` maps internal command assets to UT-TDD CLI subcommand contracts. | U-FR-L1-48 |
| FR-L1-49 | docs/design/harness/L6-function-design/module-drift.md | `analyzeAssetDrift` detects legacy source path/runtime residue, empty docs-skills, nested agent-memory residue, and roster/guard drift. | U-FR-L1-49 |
| FR-L1-50 | docs/design/harness/L6-function-design/module-drift.md | `analyzeDddTddRules` detects DDD/TDD SSoT drift, domain-boundary imports, invariant oracle gaps, missing Red-first evidence, weak test oracles, and L8 GWT gaps. | U-FR-L1-50 |
| FR-L1-51 | docs/design/harness/L6-function-design/function-spec.md | `deriveArtifactProgressDecision` and `projectArtifactProgress` derive red/yellow/green artifact rows from linked passing test run rows, dependency impact check metadata, recovery PLANs, and feedback trigger projection without treating DB rows as authoring source. | U-FR-L1-51 |
