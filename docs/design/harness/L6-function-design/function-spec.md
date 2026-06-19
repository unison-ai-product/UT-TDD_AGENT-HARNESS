---
layer: L6
sub_doc: function-spec
status: confirmed
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L7
plan: docs/plans/PLAN-L6-01-function-spec.md
v2_import: docs/migration/v2-import-ledger.md
---

## 2026-06-09 FR Unit Coverage Addendum

- Before L6 can be closed, the L1 FR registry must be parsed by `fr-registry-audit` and every registered FR must be represented in `fr-unit-coverage.md`.
- `fr-unit-coverage.md` maps each FR-L1 row to one L6 spec path, one deterministic unit contract, and one U-* oracle.
- `src/lint/l6-fr-coverage.ts` is the mechanical guard for this rule and is wired into `ut-tdd doctor`.
- Contracts listed in `fr-unit-coverage.md` are unit-test-granularity specifications. L7 may implement them as direct unit tests or route them through a confirmed follow-up PLAN, but it may not invent missing FR coverage at implementation time.

## 2026-06-09 Harness DB Feedback Function Addendum

This addendum lowers requirements §6.8.6/§6.8.7 and L5 `physical-data.md` §9 / `internal-processing.md` Appendix B to L6 function-level contracts. The SQLite DB is a rebuildable projection of docs/state/logs, not the authoring source.

| Function | Signature | pre | post / oracle |
|---|---|---|---|
| `recordProjectionEvent` | `(event: ProjectionEvent, deps: HarnessDbDeps) => ProjectionRowRef` | `event.plan_id` or `event.session_id` is present; `deps.dbPath` resolves under `.ut-tdd/` | validates IDs, upserts the correct projection table row, returns `{table, id, evidence_path}`; never rewrites source docs |
| `rebuildHarnessDb` | `(input: RebuildInput, deps: HarnessDbDeps) => RebuildResult` | repo root is readable; DB path is under `.ut-tdd/` | truncates projection tables, replays normalized docs/state/log digests, recomputes `search_index` and `quality_signals`; deterministic for identical inputs |
| `computeSkillMetrics` | `(rows: SkillMetricInput) => QualitySignal[]` | recommendation/invocation rows are supplied; zero denominator is explicit | computes `fired/recommended` and `accepted/fired` by layer/drive/plan/model; missing rows become findings, not fabricated success |
| `findReference` | `(query: ReferenceQuery, deps: HarnessDbDeps) => ReferenceHit[]` | DB exists or caller requested rebuild first | searches `search_index` plus direct ID tables and returns path, ID, reason, source table, and evidence path; read-only |
| `emitFeedbackEvents` | `(findings: FindingRow[], signals: QualitySignal[]) => FeedbackEvent[]` | findings/signals are normalized | groups repeated gaps, unresolved blockers, dependency stalls, and quality regression patterns into feedback events; does not auto-approve PLAN changes |
| `recordGuardrailDecision` | `(decision: GuardrailDecision, deps: HarnessDbDeps) => ProjectionRowRef` | guardrail name, decision, and evidence path are present | stores block/allow/human-required with evidence; `human-required` cannot be downgraded by projection rebuild |
| `catalogAutomationAssets` | `(input: CatalogAutomationAssetsInput) => AssetCatalogResult`（`input = { repoRoot?: string; db: HarnessDb }`、型は `src/assets/catalog.ts` 正本、PLAN-L7-52 C-4 で実装に整合化 2026-06-15） | 承認 root は実装内定数 `SOURCES`（`docs/skills` / `.claude/agents` / `docs/commands`）を単一正本とする（caller は roots を渡さない） | skill/roster/command doc を path・trigger/capability・search token・drift status で catalog 化し `{ ok, assets: string[], findings }` を返す; prompt 本文・secret・provider transcript は copy しない; drift / empty-catalog / invalid-root は `findings` として可視化 |
| `recordTestRunEvidence` | `(input: TestRunEvidenceInput, deps: HarnessDbDeps) => ProjectionRowRef[]` | command evidence has runner/scope/timestamps/exit code/evidence path; repo root and DB path resolve under `.ut-tdd/` | upserts `test_runs`, optional `test_cases`, `test_results`, and `test_artifact_edges`; missing `plan_id`/`oracle_id` creates findings, not silent pass |
| `evaluateGreenDefinition` | `(input: GreenDefinitionInput, deps: HarnessDbDeps) => GreenDefinitionResult` | profile and required command kinds are known for changed artifact kinds | returns computed green time, missing commands, non-zero exits, and DB projection refs; confirmed review evidence is valid only when result is green and `computed_green_at <= reviewed_at` |
| `computeUtHistorySignals` | `(input: UtHistoryInput, deps: HarnessDbDeps) => QualitySignal[]` | test run/result rows are normalized; zero denominators are explicit | computes oracle coverage, plan green rate, flake score, duration regression, and green-definition compliance; non-green signals join `findings` |

Unit oracle families:

- U-FR-L1-06 / U-FR-L1-19 / U-FR-L1-20 / U-FR-L1-40 / U-FR-L1-41 cover projection write/rebuild, drive partitioning, and feedback event generation.
- U-FR-L1-12 / U-FR-L1-46 / U-FR-L1-47 cover skill recommendation, roster capability, and skill metric inputs.
- U-FR-L1-33 / U-FR-L1-34 / U-FR-L1-48 / U-FR-L1-49 cover search/reference reduction, command cataloging, and asset drift detection.

## 2026-06-09 MCP Profile Config / Safety Addendum (A-125 / PLAN-L6-32)

This addendum lowers requirements §6.8.10 and the A-125 research memo into L6 function contracts for MCP profile catalog hardening. It does not authorize profile execution by itself; it defines the pure checks and generated-config rules that a later L7 implementation must satisfy.

| Function | Signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `catalogVerificationProfiles` | catalogVerificationProfiles(input: VerificationProfileCatalogInput) => VerificationProfileCatalogResult | built-in profiles and researched external candidates are supplied with source URL, package reference, trigger signals, and risk fields. | returns deterministic profile rows including Docker MCP Toolkit, MCP Inspector, Playwright MCP, GitHub read-only MCP, Vitest browser, Testcontainers, and MSW. | external profiles are disabled by default and are discovery/config metadata, not trusted execution. | U-MCPPROFILE-001..003 |
| `renderGeneratedMcpConfig` | renderGeneratedMcpConfig(input: GeneratedMcpConfigInput) => GeneratedMcpConfigResult | selected profiles are allow-listed, workspace root is known, and secret values are represented only by env var names. | returns generated local config text and target path suggestion without writing Git-tracked secrets; each `mcpServers.<id>` carries a tokenized launcher argv (`command` = command head, `args` = remaining tokens), never the whole command string as one arg (PLAN-L7-79). | filesystem/git profiles are workspace-root scoped; user home mounts and inline tokens are violations. | U-MCPPROFILE-004..006, U-MCPPROFILE-013 |
| `analyzeVerificationProfileSafety` | analyzeVerificationProfileSafety(input: VerificationProfileSafetyInput) => VerificationProfileSafetyResult | profile catalog, local package metadata, config text, and optional Docker profile metadata are supplied. | returns findings for unverified source, package mismatch, missing allow-list, broad toolset, write-enabled GitHub profile, global mount, credential persistence, or missing Docker controls. | official source verification and package integrity are required before `trusted`; registry/catalog presence alone is insufficient. | U-MCPPROFILE-007..010 |
| `probeVerificationProfile` | probeVerificationProfile(id: string, deps: VerificationProbeDeps) => VerificationProbeResult \| null | profile id and command/probe dependencies are supplied. | returns readiness checks for activation, executable/package/auth prerequisites, and the generated launcher command head when it differs from the probe-hint executable. | a profile cannot be ready if the generated launcher command is unavailable, even when its package/executable probe hint is available. | U-MCPPROFILE-014 |
| `planExternalProfileActivation` | planExternalProfileActivation(input: ExternalProfileActivationInput) => ExternalProfileActivationPlan | trigger signals, relation graph impact, profile readiness, and safety findings are supplied. | returns required probe, MCP Inspector smoke, human approval, or refusal steps for each recommended profile. | external activation is workflow evidence; it cannot silently install packages or enable MCP servers. | U-MCPPROFILE-011..012 |

Safety defaults:

- Docker MCP Toolkit is a profile-isolation candidate and must remain optional unless Docker Desktop/toolkit availability is proven.
- GitHub MCP defaults to read-only and narrow toolsets; write-capable profile variants require `requires_human_approval`.
- Generated MCP config is local/environment state and must not introduce committed credentials or user-specific absolute home paths.
- Tool/profile output is normalized into evidence/projection rows; raw MCP responses, screenshots, traces, and provider transcripts are excluded from DB rows.

## 2026-06-09 Canonical Document Export Addendum (A-126 / PLAN-L6-34)

This addendum lowers requirements §6.8.11 and the A-126 research memo into L6 function contracts for converting canonical UT-TDD documents into spreadsheet / Excel / PPTX outputs. It does not authorize Office-format generation by itself; it defines the pure document-structure and export-dataset rules that a later L7 implementation must satisfy.

| Function | Signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `parseCanonicalDocumentStructure` | parseCanonicalDocumentStructure(input: CanonicalDocumentInput) => CanonicalDocumentProjection | source docs are supplied as repo-relative paths and text; document family is one of concept, requirements, design, plan, adr, or test-design. | returns sections, headings, tables, decisions, trace IDs, status fields, evidence links, and source anchors. | canonical Markdown/docs remain source of truth; generated exports cannot introduce or drop FR/AC/AT/PLAN/ADR IDs. | U-DOCEXPORT-001..003 |
| `buildDocumentExportDataset` | buildDocumentExportDataset(input: DocumentExportDatasetInput) => DocumentExportDataset | document projection, requested format, and export profile are supplied. | returns deterministic rows/sheets/slide-outline records with source path, section ID, ID columns, status, trace, and evidence links. | dataset is redacted before rendering; large docs split by family/section instead of truncating. | U-DOCEXPORT-004..006 |
| `renderDocumentExport` | renderDocumentExport(input: DocumentExportRenderInput, deps: DocumentExportRendererDeps) => DocumentExportRenderResult | dataset and renderer profile are supplied; CSV/Markdown are built-in; XLSX/PPTX/D2 require readiness. | returns generated artifact metadata or a renderer-unavailable finding. | renderer execution is optional and never installs packages implicitly. | U-DOCEXPORT-007..009 |
| `recordDocumentExportArtifact` | recordDocumentExportArtifact(input: DocumentExportArtifactInput) => DocumentExportProjectionRows | render result, source snapshot hash, redaction profile, and evidence path are supplied. | returns `document_export_runs`, `document_export_datasets`, and `document_export_artifacts` projection rows. | generated files are derived artifacts; gate truth remains canonical docs, normalized rows, and recorded human decisions. | U-DOCEXPORT-010..012 |

Supported document families:

- concept / planning documents -> objective, value, scope, KPI, risks, decisions, roadmap;
- requirements -> FR/AC/AT, priority, acceptance, trace, owner/status;
- detailed design -> module/function/API/DB/contract rows, dependencies, unresolved carry;
- PLAN -> frontmatter, dependencies, generated artifacts, DoD, evidence, blockers;
- ADR -> decision, alternatives, consequences, follow-ups, status/date;
- test-design -> U/IT/AT oracles, GWT rows, green definitions, missing coverage.

Export defaults:

- CSV and Markdown summary are built-in.
- XLSX is optional via ExcelJS or SheetJS readiness.
- PPTX is optional via PptxGenJS readiness.
- D2 PPTX is optional for architecture/workflow diagrams only.

### FR registry function contract table

This table is the function-spec-side descent for rows in `fr-unit-coverage.md` whose L6 spec is this file. It prevents the FR matrix from becoming a prose-only coverage claim. Each row is intentionally unit-test sized: one or more named functions, a concrete signature shape, DbC pre/post/invariant, and the exact U-FR oracle.

| FR | Function(s) | Signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|---|
| FR-L1-01 | `planDraft` | planDraft(input: PlanDraftInput, deps: PlanDraftDeps) => PlanDraftResult | required IDs/paths are normalized and required evidence is present. | returns deterministic U-FR-L1-01 result; missing evidence is a violation/finding. | read-only for source docs; generated state/projection is rebuildable; no secrets or provider transcripts are stored. | U-FR-L1-01 |
| FR-L1-02 | `sprintCheck` | sprintCheck(input: SprintCheckInput, deps: SprintCheckDeps) => SprintCheckResult | required IDs/paths are normalized and required evidence is present. | returns deterministic U-FR-L1-02 result; missing evidence is a violation/finding. | read-only for source docs; generated state/projection is rebuildable; no secrets or provider transcripts are stored. | U-FR-L1-02 |
| FR-L1-04 | `frontmatterSchema`, `parseRequires` | frontmatterSchema(input: FrontmatterSchemaInput, deps: FrontmatterSchemaDeps) => FrontmatterSchemaResult<br>parseRequires(input: ParseRequiresInput, deps: ParseRequiresDeps) => ParseRequiresResult | required IDs/paths are normalized and required evidence is present. | returns deterministic U-FR-L1-04 result; missing evidence is a violation/finding. | read-only for source docs; generated state/projection is rebuildable; no secrets or provider transcripts are stored. | U-FR-L1-04 |
| FR-L1-06 | `recordProjectionEvent`, `rebuildHarnessDb` | recordProjectionEvent(input: RecordProjectionEventInput, deps: RecordProjectionEventDeps) => RecordProjectionEventResult<br>rebuildHarnessDb(input: RebuildHarnessDbInput, deps: RebuildHarnessDbDeps) => RebuildHarnessDbResult | event has `plan_id` or `session_id`; `deps.dbPath` is under `.ut-tdd/`; source docs/logs are readable. | projection rows are upserted or rebuilt deterministically; `search_index` and `quality_signals` are recomputed. | DB is a rebuildable projection, not an authoring source; source docs are never rewritten. | U-FR-L1-06 |
| FR-L1-08 | `routeSignalToMode` | routeSignalToMode(input: RouteSignalToModeInput, deps: RouteSignalToModeDeps) => RouteSignalToModeResult | signal type, evidence path, and current plan/mode context are present. | returns candidate mode(s) with reason and does not mutate workflow state. | unknown signal becomes a finding or no-route result, not silent success. | U-FR-L1-08 |
| FR-L1-09 | `evaluateAgentGuard` | evaluateAgentGuard(input: EvaluateAgentGuardInput, deps: EvaluateAgentGuardDeps) => EvaluateAgentGuardResult | subagent/model family and allow-raw context are supplied. | returns allow/block/bypass decision with evidence; forbidden same-model or raw calls are blocked unless explicitly allowed. | no credential or provider transcript is persisted. | U-FR-L1-09 |
| FR-L1-11 | `recordCrossCuttingEvent` | recordCrossCuttingEvent(input: RecordCrossCuttingEventInput, deps: RecordCrossCuttingEventDeps) => RecordCrossCuttingEventResult | event has type, severity, subject, and evidence path. | records interrupt/debt/drift/readiness event or returns a validation violation. | recording is append/projection only and cannot approve gates. | U-FR-L1-11 |
| FR-L1-12 | `suggestSkillInjection` | suggestSkillInjection(input: SuggestSkillInjectionInput, deps: SuggestSkillInjectionDeps) => SuggestSkillInjectionResult | task text, layer, kind/drive, and catalog snapshot are supplied. | returns deterministic ranked skill/command candidates with reasons. | missing catalog rows become findings; recommendations never copy prompt bodies. | U-FR-L1-12 |
| FR-L1-13 | `enforceForwardOrder` | enforceForwardOrder(input: EnforceForwardOrderInput, deps: EnforceForwardOrderDeps) => EnforceForwardOrderResult | current layer/gate and prior gate statuses are known. | returns pass only when Forward order and required gates are satisfied. | exceptions require explicit evidence and cannot silently skip blocked gates. | U-FR-L1-13 |
| FR-L1-14 | `routeReverseR4` | routeReverseR4(input: RouteReverseR4Input, deps: RouteReverseR4Deps) => RouteReverseR4Result | reverse type, R4 evidence, `forward_routing`, and `promotion_strategy` are present. | returns the Forward target or a blocking violation. | only confirmed reverse evidence can merge into Forward. | U-FR-L1-14 |
| FR-L1-15 | `decideDiscoveryS4` | decideDiscoveryS4(input: DecideDiscoveryS4Input, deps: DecideDiscoveryS4Deps) => DecideDiscoveryS4Result | hypothesis, PoC verification evidence, and outcome are present. | returns confirmed/rejected/pivot decision with routing requirements. | rejected/pivot cannot be treated as confirmed. | U-FR-L1-15 |
| FR-L1-19 | `emitFeedbackEvents` | emitFeedbackEvents(input: EmitFeedbackEventsInput, deps: EmitFeedbackEventsDeps) => EmitFeedbackEventsResult | normalized findings and quality signals are supplied. | repeated gaps, unresolved blockers, dependency stalls, and regressions become feedback events. | feedback events do not edit or approve PLANs. | U-FR-L1-19 |
| FR-L1-22 | `detectFrontendDrift` | detectFrontendDrift(input: DetectFrontendDriftInput, deps: DetectFrontendDriftDeps) => DetectFrontendDriftResult | mock/token/a11y/visual/state evidence roots are supplied or explicitly absent. | returns deterministic drift signals with evidence paths. | absent optional roots are explicit, not silent pass. | U-FR-L1-22 |
| FR-L1-23 | `routeScrumFullback` | routeScrumFullback(input: RouteScrumFullbackInput, deps: RouteScrumFullbackDeps) => RouteScrumFullbackResult | increment evidence and S4 decision are present. | returns Forward target(s) and required back-fill artifacts. | only confirmed increments can enter Forward. | U-FR-L1-23 |
| FR-L1-25 | `assertRefactorInvariant` | assertRefactorInvariant(input: AssertRefactorInvariantInput, deps: AssertRefactorInvariantDeps) => AssertRefactorInvariantResult | before/after behavior evidence and regression results are present. | pass only when external behavior is unchanged and regression evidence is green. | refactor cannot introduce new functional scope. | U-FR-L1-25 |
| FR-L1-26 | `evaluateRetrofitMatrix` | evaluateRetrofitMatrix(input: EvaluateRetrofitMatrixInput, deps: EvaluateRetrofitMatrixDeps) => EvaluateRetrofitMatrixResult | migration/config/rollback fixtures are supplied. | returns readiness classification and blocking evidence. | staged migration cannot be ready without rollback evidence. | U-FR-L1-26 |
| FR-L1-27 | `evaluateResearchDecision` | evaluateResearchDecision(input: EvaluateResearchDecisionInput, deps: EvaluateResearchDecisionDeps) => EvaluateResearchDecisionResult | research memo, source list, and ADR candidate are supplied. | returns decision-ready or blocked with missing evidence. | research output cannot bypass ADR or requirement trace. | U-FR-L1-27 |
| FR-L1-28 | `mergeTwoStageAgentDesign` | mergeTwoStageAgentDesign(input: MergeTwoStageAgentDesignInput, deps: MergeTwoStageAgentDesignDeps) => MergeTwoStageAgentDesignResult | Phase 1/2 design artifacts and drive=agent handoff evidence are present. | returns merged design state or explicit gap list. | merged output preserves layer boundaries and cannot copy provider transcripts. | U-FR-L1-28 |
| FR-L1-29 | `validateScreenDesignWorkflow` | validateScreenDesignWorkflow(input: ValidateScreenDesignWorkflowInput, deps: ValidateScreenDesignWorkflowDeps) => ValidateScreenDesignWorkflowResult | IA, screen list, flow, wireframe/mock, and componentization outputs are supplied. | pass only when screen design artifacts and pair traces are complete. | UI workflow cannot be marked complete from backend-only evidence. | U-FR-L1-29 |
| FR-L1-30 | `validateFrontendDesignWorkflow` | validateFrontendDesignWorkflow(input: ValidateFrontendDesignWorkflowInput, deps: ValidateFrontendDesignWorkflowDeps) => ValidateFrontendDesignWorkflowResult | visual design, token SSoT, a11y, VRT, and UX evidence are supplied. | returns pass or missing artifact list for frontend polish gates. | accessibility and token evidence remain first-class, not advisory text. | U-FR-L1-30 |
| FR-L1-32 | `validateFolderRules` | validateFolderRules(input: ValidateFolderRulesInput, deps: ValidateFolderRulesDeps) => ValidateFolderRulesResult | path registry and artifact kind are supplied. | returns violations for misplaced process docs/tests/state. | folder policy is checked without rewriting files. | U-FR-L1-32 |
| FR-L1-33 | `catalogExistingAssets` | catalogExistingAssets(input: CatalogExistingAssetsInput, deps: CatalogExistingAssetsDeps) => CatalogExistingAssetsResult | approved asset roots are supplied. | classifies command/skill/detector/template/state/hook/doc/test assets by coverage status. | catalog stores metadata only; prompt bodies and secrets stay in source docs. | U-FR-L1-33 |
| FR-L1-34 | `prioritizeCapabilityGaps` | prioritizeCapabilityGaps(input: PrioritizeCapabilityGapsInput, deps: PrioritizeCapabilityGapsDeps) => PrioritizeCapabilityGapsResult | asset catalog, workflow impact, and missing route/recover signals are supplied. | returns deterministic priority order with reason. | priority is advisory until converted into a PLAN. | U-FR-L1-34 |
| FR-L1-35 | `renderFoundationReadiness` | renderFoundationReadiness(input: RenderFoundationReadinessInput, deps: RenderFoundationReadinessDeps) => RenderFoundationReadinessResult | infrastructure category inventory is supplied. | reports implemented/designed/missing categories. | report cannot mark missing categories as implemented. | U-FR-L1-35 |
| FR-L1-36 | `projectSkillEvaluations` | projectSkillEvaluations(db: HarnessDb, opts?: { asOf?: string }) => void | skill_invocations and plan_registry rows exist; asOf is an ISO timestamp (default = nowIso()). | writes one skill_evaluations row per skill_id with accepted=1 invocations; skill_rating = success_count / adoption_count; unused_flag = 1 when no invocation fired within 30 days of asOf; cold-start (0 invocations) writes 0 rows and never throws. | does not auto-delete unused skills; deletion is human-only; success states ("confirmed"/"completed") are documented in source and single-source-of-truth hardcoded with rationale. | U-FR-L1-36 |
| FR-L1-43 | `projectPocEvaluations` | projectPocEvaluations(db: HarnessDb, opts?: { asOf?: string }) => void | plan_registry has kind="poc" rows with decision_outcome populated from PLAN frontmatter. | writes one poc_evaluations summary row (id="poc-evaluation:summary") with poc_success_rate = confirmed_count / total_count, confirmed_count, rejected_count, pivot_count, total_count, evaluated_at; PoC PLANs with empty decision_outcome are excluded from denominator; cold-start (0 decided PoC PLANs) writes 0 rows and never throws. | pivot counts as non-success; decision_outcome values are single-source-hardcoded with rationale; row id is always "poc-evaluation:summary" (one summary row per rebuild). | U-FR-L1-43 |
| FR-L1-38 | `projectModelEvaluations` | projectModelEvaluations(db: HarnessDb, repoRoot: string) => void | model_runs table is populated by projectReviewModelRuns and, for token/cost telemetry, by `projectTokenUsage`; .ut-tdd/config/model-opt-in.yaml exists with enabled:true for evaluation to run; PLAN_SUCCESS_STATUSES is the single-source constant for success inference. | if opt-in disabled (file absent or enabled!=true): writes 0 rows and returns; if enabled: writes one model_evaluations row per distinct model with success_rate = success_count / run_count (join model_runs.plan_id -> plan_registry.status IN PLAN_SUCCESS_STATUSES); cold-start (0 model_runs) writes 0 rows and never throws; token/cost rows are ingested by `ut-tdd telemetry scan` via file-scan only. | cost-efficiency (tokens_per_success/cost_per_success) is discharged by PLAN-L7-57 and PLAN-L7-58; cost is computed only from local pricing tables for known models, and unpublished/unknown models keep cost_usd=null (no fabricated cost); success states are single-source-hardcoded (PLAN_SUCCESS_STATUSES). | U-FR-L1-38 |
| FR-L1-37 | `recommendModelEffort` | recommendModelEffort(input: RecommendModelEffortInput, deps: RecommendModelEffortDeps) => RecommendModelEffortResult | task, drive, layer, size, and uncertainty signals are supplied. | returns model family and reasoning effort recommendation. | model recommendation is recorded as evidence, not hidden prompt state. | U-FR-L1-37 |
| FR-L1-39 | `scoreTaskComplexity` | scoreTaskComplexity(input: ScoreTaskComplexityInput, deps: ScoreTaskComplexityDeps) => ScoreTaskComplexityResult | size, dependency, uncertainty, and affected artifact signals are supplied. | returns deterministic score and class. | unknown inputs produce explicit uncertainty, not low complexity. | U-FR-L1-39 |
| FR-L1-40 | `resolveDriveStatePartition` | resolveDriveStatePartition(input: ResolveDriveStatePartitionInput, deps: ResolveDriveStatePartitionDeps) => ResolveDriveStatePartitionResult | drive/mode/kind/layer are supplied. | returns `.ut-tdd/drive/<drive>` partition and skip/defer rules. | drive state joins by plan/session and cannot contaminate other drive partitions. | U-FR-L1-40 |
| FR-L1-41 | `classifyDrive` | classifyDrive(input: ClassifyDriveInput, deps: ClassifyDriveDeps) => ClassifyDriveResult | PLAN/code/dependency evidence is supplied. | classifies drive and orchestration mode input with confidence. | low confidence becomes finding/confirmation need, not fabricated certainty. | U-FR-L1-41 |
| FR-L1-42 | `buildAdapterPlan` | buildAdapterPlan(input: BuildAdapterPlanInput, deps: BuildAdapterPlanDeps) => BuildAdapterPlanResult | provider, role, task, plan, and execution mode are supplied. | returns provider command plan and boundary flags without forwarding UT-TDD-only plan flags. | provider boundary separation and handover context are preserved. | U-FR-L1-42 |
| FR-L1-47 | `catalogSkills`, `recommendSkills` | catalogSkills(input: CatalogSkillsInput, deps: CatalogSkillsDeps) => CatalogSkillsResult<br>recommendSkills(input: RecommendSkillsInput, deps: RecommendSkillsDeps) => RecommendSkillsResult | skill docs and task/layer/drive context are supplied. | returns catalog entries and deterministic recommendations. | missing metadata becomes a finding; skill source docs are not rewritten. | U-FR-L1-47 |
| FR-L1-48 | `buildCommandCatalog` | buildCommandCatalog(input: BuildCommandCatalogInput, deps: BuildCommandCatalogDeps) => BuildCommandCatalogResult | command docs and CLI surface inputs are supplied. | maps command assets to UT-TDD CLI subcommand contracts. | search rows are rebuildable and do not become authoring source. | U-FR-L1-48 |

### FR registry type body / pseudocode substance

This section closes A-110 MUST-2. Rows above are L6 unit contracts; the implementation body may land in L7, but each named function now has a typed input/result body and either a pseudocode anchor or an explicit L7 defer. `explicit_l7_defer` means the L6 contract is frozen here and the L7 implementation must not invent new requirements.

Common value bodies:

```ts
type EvidencePath = string;
type Finding = { code: string; severity: "info" | "warn" | "error"; evidence_path: EvidencePath; message: string };
type ContractResult = { ok: boolean; findings: Finding[]; evidence_paths: EvidencePath[] };
type HarnessDbDeps = { repoRoot: string; dbPath: string; readText(path: string): string | null; now(): string };
type ProjectionRef = { table: string; id: string; evidence_path: EvidencePath };
type QualitySignal = { signal_type: string; subject_id: string; score?: number; evidence_path: EvidencePath };
```

| function | type body | pseudocode / implementation_state |
|---|---|---|
| `planDraft` | `PlanDraftInput { title; kind; layer; sub_doc?; generates[] } -> PlanDraftResult extends ContractResult { path; plan_id }` | implemented pseudocode §2.1 |
| `sprintCheck` | `SprintCheckInput { target; redEvidence; greenEvidence } -> SprintCheckResult extends ContractResult { ordered }` | implemented pseudocode §2.4 |
| `frontmatterSchema` | `unknown -> Frontmatter` | implemented zod parse; pseudocode = validate schema, return typed frontmatter or throw |
| `parseRequires` | `ParseRequiresInput { frontmatterText; planPath } -> ParseRequiresResult extends ContractResult { requires[] }` | implemented in `analyzePlanGovernance`; parse list fields, normalize PLAN IDs/paths, emit unresolved and not-completed findings |
| `recordProjectionEvent` | `RecordProjectionEventInput { event; source_path } -> RecordProjectionEventResult { ref: ProjectionRef }` | implemented in `src/state-db/projection-writer.ts`; validate ID, upsert projection row, return ref |
| `rebuildHarnessDb` | `RebuildHarnessDbInput { roots[]; truncate: true } -> RebuildHarnessDbResult extends ContractResult { rows_by_table; search_rows; signals }` | implemented in `src/state-db/projection-writer.ts`; truncate projection, replay docs/state/logs, recompute `search_index` and `quality_signals` |
| `recordTestRunEvidence` | `TestRunEvidenceInput { command; runner; scope; started_at; completed_at; exit_code; evidence_path; cases? } -> RecordTestRunEvidenceResult { refs[] }` | implemented in `src/workflow/contracts.ts`; collect Bun/vitest/doctor/lint evidence into UT history projection, redact failure digests, never persist raw provider transcripts |
| `evaluateGreenDefinition` | `GreenDefinitionInput { profile; required_commands[]; command_evidence[]; reviewed_at? } -> GreenDefinitionResult extends ContractResult { computed_green_at?; missing[]; non_green[] }` | implemented in `src/workflow/contracts.ts`; fail when required commands are absent/non-zero or computed green time is after review time |
| `computeUtHistorySignals` | `UtHistoryInput { plan_id?; window? } -> ComputeUtHistorySignalsResult { signals[] }` | implemented in `src/workflow/contracts.ts`; compute oracle coverage, plan green rate, flake score, duration regression, and green-definition compliance |
| `routeSignalToMode` | `RouteSignalToModeInput { signal; current_plan?; drive? } -> RouteSignalToModeResult extends ContractResult { candidates[] }` | implemented in `src/workflow/contracts.ts`; classify signal, rank allowed modes, unknown signal becomes finding |
| `evaluateAgentGuard` | `AgentGuardInput + AgentGuardContext -> GuardDecision` | implemented runtime guard; pseudocode = normalize model family, compare worker/reviewer boundaries, return allow/block |
| `recordCrossCuttingEvent` | `RecordCrossCuttingEventInput { type; subject_id; severity; evidence_path } -> RecordCrossCuttingEventResult { ref: ProjectionRef }` | implemented in `src/workflow/contracts.ts`; append projection event, never approve gates |
| `suggestSkillInjection` | `SuggestSkillInjectionInput { task; layer; drive; catalog } -> SuggestSkillInjectionResult extends ContractResult { candidates[] }` | implemented in `src/workflow/contracts.ts`; filter catalog, score triggers, return deterministic ranked skills |
| `enforceForwardOrder` | `EnforceForwardOrderInput { layer; gate; prior_gates } -> EnforceForwardOrderResult extends ContractResult { allowed }` | implemented in `src/workflow/contracts.ts`; require prior PASS or explicit exception evidence |
| `routeReverseR4` | `RouteReverseR4Input { reverse_type; r4_evidence; forward_routing } -> RouteReverseR4Result extends ContractResult { target_plan? }` | implemented in `src/workflow/contracts.ts`; validate confirmed reverse evidence before Forward merge |
| `decideDiscoveryS4` | `DecideDiscoveryS4Input { hypothesis; poc_evidence; outcome } -> DecideDiscoveryS4Result extends ContractResult { decision }` | implemented in `src/workflow/contracts.ts`; reject pivot/confirmed ambiguity and record routing |
| `emitFeedbackEvents` | `EmitFeedbackEventsInput { findings; quality_signals } -> EmitFeedbackEventsResult { events[] }` | implemented in `src/feedback/engine.ts`; group repeated gaps/stalls/regressions, never edit PLANs |
| `detectFrontendDrift` | `DetectFrontendDriftInput { mock_root?; token_root?; a11y?; vrt? } -> DetectFrontendDriftResult extends ContractResult { drift_signals[] }` | implemented in `src/workflow/contracts.ts`; optional roots must be absent-by-contract, not silent pass |
| `routeScrumFullback` | `RouteScrumFullbackInput { increment; s4_decision } -> RouteScrumFullbackResult extends ContractResult { forward_targets[] }` | implemented in `src/workflow/contracts.ts`; confirmed increments only |
| `assertRefactorInvariant` | `AssertRefactorInvariantInput { before; after; regression } -> AssertRefactorInvariantResult extends ContractResult { unchanged }` | implemented in `src/workflow/contracts.ts`; compare behavior evidence and require green regression |
| `evaluateRetrofitMatrix` | `EvaluateRetrofitMatrixInput { migration; config; rollback } -> EvaluateRetrofitMatrixResult extends ContractResult { readiness }` | implemented in `src/workflow/contracts.ts`; fail when rollback evidence is missing |
| `evaluateResearchDecision` | `EvaluateResearchDecisionInput { memo; sources; adr_candidate? } -> EvaluateResearchDecisionResult extends ContractResult { decision_ready }` | implemented in `src/workflow/contracts.ts`; research cannot bypass ADR/requirement trace |
| `mergeTwoStageAgentDesign` | `MergeTwoStageAgentDesignInput { phase1; phase2; handoff } -> MergeTwoStageAgentDesignResult extends ContractResult { merged? }` | implemented in `src/workflow/contracts.ts`; preserve layer boundaries and redact provider transcript content |
| `validateScreenDesignWorkflow` | `ValidateScreenDesignWorkflowInput { ia; screens; flow; wireframe; mock; components } -> ValidateScreenDesignWorkflowResult extends ContractResult { complete }` | implemented in `src/workflow/contracts.ts`; backend-only evidence cannot complete screen design |
| `validateFrontendDesignWorkflow` | `ValidateFrontendDesignWorkflowInput { visual; tokens; a11y; vrt; ux } -> ValidateFrontendDesignWorkflowResult extends ContractResult { complete }` | implemented in `src/workflow/contracts.ts`; a11y/token/VRT are first-class evidence |
| `validateFolderRules` | `ValidateFolderRulesInput { path; artifact_kind; registry } -> ValidateFolderRulesResult extends ContractResult { violations[] }` | implemented in `src/workflow/contracts.ts`; check placement without rewriting files |
| `catalogExistingAssets` | `CatalogExistingAssetsInput { roots: string[] } -> CatalogExistingAssetsResult extends ContractResult { assets: AssetCatalogEntry[] }` | implemented in `src/workflow/contracts.ts`; catalog metadata only, no prompt bodies/secrets |
| `prioritizeCapabilityGaps` | `PrioritizeCapabilityGapsInput { assets; workflow_impact; missing_routes } -> PrioritizeCapabilityGapsResult { priorities[] }` | implemented in `src/workflow/contracts.ts`; priority is advisory until converted to PLAN |
| `renderFoundationReadiness` | `RenderFoundationReadinessInput { categories[] } -> RenderFoundationReadinessResult extends ContractResult { implemented; designed; missing }` | implemented in `src/workflow/contracts.ts`; missing categories cannot be reported implemented |
| `recommendModelEffort` | `RecommendModelEffortInput { task; drive; layer; size; uncertainty } -> RecommendModelEffortResult { model_family; reasoning_effort; evidence_path }` | implemented in `src/workflow/contracts.ts`; recommendation is recorded evidence, not hidden prompt state |
| `scoreTaskComplexity` | `ScoreTaskComplexityInput { size; dependencies; uncertainty; affected_artifacts } -> ScoreTaskComplexityResult { score; class; findings[] }` | implemented in `src/workflow/contracts.ts`; unknowns produce uncertainty, not low complexity |
| `resolveDriveStatePartition` | `ResolveDriveStatePartitionInput { drive; mode; kind; layer; plan_id?; session_id? } -> ResolveDriveStatePartitionResult { partition_path; skip_sub_doc[] }` | implemented in `src/workflow/contracts.ts`; drive state joins by plan/session and never contaminates other drives |
| `classifyDrive` | `ClassifyDriveInput { plan; code_delta?; dependency_delta? } -> ClassifyDriveResult { drive; confidence; findings[] }` | implemented in `src/workflow/contracts.ts`; low confidence requires finding/human confirmation |
| `buildAdapterPlan` | `BuildAdapterPlanInput { provider; role; task; plan; execution_mode } -> BuildAdapterPlanResult extends ContractResult { command_plan; boundary_flags[] }` | implemented in `src/runtime/adapter.ts`; provider boundary flags are preserved |
| `checkCodexWrapperParity` | `DoctorDeps -> { messages: string[]; ok: boolean }` | implemented in `src/doctor/index.ts`; verifies Claude hooks are project-settings based while Codex parity is provided by `ut-tdd codex --execute` wrapper lifecycle tests and stdin adapter oracles |
| `catalogSkills` | `CatalogSkillsInput { skill_docs: SkillDocRef[] } -> CatalogSkillsResult extends ContractResult { skills: SkillCatalogEntry[] }` | implemented in `src/workflow/contracts.ts`; metadata only, source docs remain SSoT |
| `recommendSkills` | `RecommendSkillsInput { task; layer; drive; catalog } -> RecommendSkillsResult { recommendations[]; findings[] }` | implemented in `src/workflow/contracts.ts`; missing metadata is a finding |
| `buildCommandCatalog` | `BuildCommandCatalogInput { command_docs[]; cli_surface } -> BuildCommandCatalogResult extends ContractResult { commands[] }` | implemented in `src/workflow/contracts.ts`; search rows are rebuildable projection |
| `projectSkillEvaluations` | `SkillEvaluationsInput { asOf?: string } -> void` | implemented in `src/state-db/projection-writer.ts`; per-skill rating/adoption/success/unused from skill_invocations + plan_registry; cold-start zero rows |
| `projectPocEvaluations` | `PocEvaluationsInput { asOf?: string } -> void` | implemented in `src/state-db/projection-writer.ts`; one summary row: poc_success_rate = confirmed/(confirmed+rejected+pivot); cold-start (no decided PoC PLANs) zero rows; pivot is non-success |
| `projectModelEvaluations` | `ModelEvaluationsInput { repoRoot: string } -> void` | implemented in `src/state-db/projection-writer.ts`; opt-in via .ut-tdd/config/model-opt-in.yaml (enabled:true); per-model success_rate = success_count/run_count joining model_runs -> plan_registry; cold-start zero rows; **cost-efficiency DISCHARGED** (PLAN-L7-57 token telemetry + PLAN-L7-58 cost enrichment): token efficiency from cross-runtime session JSONL via `loadRuntimeSessionUsage`/`projectTokenUsage` (CLI-less file scan), $ cost computed locally from `CLAUDE_PRICING` (Claude) and `OPENAI_PRICING` (Codex, official API pricing 2026-06-15); models without published pricing keep cost=null (no fabricated cost); ingested via `ut-tdd telemetry scan` |

## 2026-06-09 L6 Completion Readiness Addendum

`analyzeL6Completion` is the G6 readiness aggregator. It separates `freezeInputReady` (trace/substance is ready for a G6 audit before status flip) from final `ready` (L6 completion after confirmed docs/plans, confirmed L7, and G6 PASS). It reads L6 design doc status, each L6 doc owning `plan:` reference, each L6 doc `pair_artifact`, L7 reverse references by L6 doc filename, minimum unit-contract substance markers (contract/signature, DbC or oracle, and U-* oracle family), base L6 `kind=design` PLAN status and review evidence, L7 unit-test-design status, and the G6 gate table row. Post-G6 `kind=add-design` PLANs are governed by add-feature/backfill/review evidence and do not reopen base G6 completion. The unit oracle is U-L6COMP-001..005 in `L7-unit-test-design.md`.

> **SSoT 参照**: module 公開 IF = [module-decomposition.md](../L5-detailed-design/module-decomposition.md) / DbC pre-post-invariant = [internal-processing.md](../L5-detailed-design/internal-processing.md) §3-§5 / 型の単一正本 = `src/schema/` / pseudocode 標準 = [document-system-map](../../../governance/document-system-map.md) §1 (IEEE 1016 §5.7)。本 doc は公開 IF に **関数 signature + アルゴリズム pseudocode + 型設計 + WBS** を付与する (L6、IEEE 1016 §5.7)。
>
> **V-pair**: `pair_artifact = L7-unit-test-design.md` (L6↔L7)。DbC 契約から単体テスト oracle (U-*) を導出 (document-system-map §3)。
> **class-design 縮退**: UT-TDD core は非 OOP (関数 + zod 値オブジェクト)。型/値オブジェクト設計は本 doc §3 に統合 (PLAN-L6-00 §2、G.13 line 547)。
> **edge 引き渡し**: 各関数の `@edge-*` docstring per-function 確定は [edge-case.md](./edge-case.md) が担当 (IMP-014)。

# UT-TDD Agent Harness — L6 機能設計: 関数仕様 (Function-Spec)

module-decomposition の公開 IF に**関数 signature・pseudocode・型・WBS** を付与する (PLAN-L6-01)。**G6 = 機能設計凍結点** (gate-design §1) の凍結対象を本 doc が確定し、L7 実装の正本 (parent_design) となる。

## §1 関数 signature 表 (実装済 module、module-decomposition §2 と 1:1)

> 詳細型は `src/schema/` を正本とし参照。pre/post は internal-processing §3/§4 への参照。

### §1.1 lint (共通様式 `loadX` / `analyzeX(docs?)`)

| 関数 (実 export、src/lint/) | signature | pre (§3) | post (§4) |
|---|---|---|---|
| `analyzeG3Trace` | `(docs?: DocSource) => G3TraceResult` | docs 省略時 fs 読込可 | `orphans[] == [] ⟺ ok`、totals 全 > 0 |
| `analyzeEntityCoverage` | `(business?: string) => EntityCoverageResult` | 同上 | primary⊇derived 整合、totals > 0 |
| `analyzeFrRegistry` | `(docs?: FrDocSource) => FrRegistryAuditResult` | 同上 | 漏れ 5 型 == 0 で ok |
| `analyzeDocConsistency` | `(docs?: DocConsistencySource) => DocConsistencyResult` | 同上 | carry/screenId/nfr 違反 == 0 で ok |
| `analyzeImprovementBacklog` | `(md?: string) => ImprovementBacklogResult` | 同上 | IMP 形式/status/候補 enum 妥当で ok |
| `loadDocs` / `loadBusiness` / `loadFrDocs` / `loadDocConsistencyDocs` / `loadBacklog` | 各 `() => DocSource \| string \| FrDocSource \| DocConsistencySource \| string` (lint 別、統一型なし) | repo doc path 解決可 | 副作用 = fs read のみ (write なし) |

> 共通 invariant: `analyzeX` は純粋関数 (同入力→同出力、FR-05 決定論)。`loadX` が唯一の fs 端点 (module-decomposition §4)。**引数/戻り型は lint ごとに固有** (統一 `XSource` 型は存在しない。実 export 名・型は `src/lint/*.ts` を正本)。

### §1.2 runtime

| 関数 (実 export、src/runtime/) | signature | pre | post |
|---|---|---|---|
| `detectMode` | `() => RuntimeDetection` | (前提なし) | `mode ∈ {standalone,claude-only,codex-only,hybrid}`、副作用なし |
| `normalizeModelFamily` | `(raw: string \| null \| undefined) => ModelFamily \| null` | — | family ∈ {opus,sonnet,haiku} or `null` (判定不能・曖昧は fail-close) |
| `evaluateAgentGuard` | `(input: AgentGuardInput, ctx: AgentGuardContext) => GuardDecision` | input.subagent_type 存在 / ctx に `resolveAgentFamily` + `allowRaw` 提供 | `decision.code ∈ {0,2}` を**返す**。`code=2` の exit 実行は hook shim (`.claude/hooks/agent-guard.ts`) の責務 — 本関数は純粋 (process.exit しない)。bypass は `bypassed=true` + message warn |
| `resolveActivePlan` / `recordEvent` / `compressPlanDigest` / `onStop` (session-log) | `session-log.md §3` 参照 | — | **fail-OPEN** (常に 0、guard と逆)。`compressPlanDigest` は純関数・idempotent。詳細は `session-log.md` (PLAN-L6-03 add-design 差分) |

### §1.3 schema / plan / vmodel / doctor

| 関数 | signature | pre | post |
|---|---|---|---|
| `frontmatterSchema.parse` | `(data: unknown) => Frontmatter` | — | zod 妥当 or throw ZodError |
| `lintPlan` | `(path?: string, gate?: "schedule" \| "governance" \| "frontmatter" \| "G1-trace" \| "G3-trace") => LintResult` | path 省略時カレント | `{ok, messages[]}`、state 不変 (read-only)。schedule は最小強制、governance/frontmatter は PLAN frontmatter + cross-record strict、G1/G3 は trace gate |
| `lintVmodel` | `(path?: string) => LintResult` | 同上 | 12 edge 照合、孤児で ok=false |
| `runDoctor` | `() => LintResult` | detector/lint の読む doc 解決可 | 全 detector 集約、error≥1 で ok=false/exit 1 |

## §2 core 操作の pseudocode (IEEE 1016 §5.7、IMP-019)

> internal-processing §2 の処理フローをアルゴリズム化。L7 実装の正本。共通骨格 = `入力 → zod validate → state 読込 → 処理 → state 書込 → 出力/exit` (副作用は cli/hook 端点)。

### §2.1 `plan draft` (FR-01)

```
function planDraft(input):
  assert input.title != ""                       # pre (§3)
  assert input.kind in VALID_KINDS
  assert input.layer in VALID_LAYERS
  if input.kind == "design" and input.layer in L1..L6:
    assert input.subDoc is provided              # G.1
  fm = buildFrontmatter(input)
  validated = frontmatterSchema.parse(fm)        # throw → fail-close
  if registry.has(validated.plan_id):
    error("plan_id 重複", FR-01); exit 1
  path = resolvePlanPath(validated)              # §1.10 line 418 規約
  # 原子性 = tmp file + rename (失敗時 file 不変)
  tmpPath = path + ".tmp"
  write(tmpPath, render(validated))
  rename(tmpPath, path)                          # post: 原子的 publish
  registry.add(validated.plan_id, path)
  exit 0
```

### §2.2 `gate <G-ID>` (FR-05、決定論 = AI 呼ばない)

```
function runGate(gId):
  assert gId in G0.5..G14                         # pre
  assert phase.priorGatesPassed(gId)              # V-model 順序 (FR-13)
  checks = loadGateChecks(gId)                    # gate-checks.yaml
  results = []
  for check in checks:                            # 決定論実行のみ
    results.append(check.run())                   # 純粋判定 (no AI)
  status = all(results.ok) ? "passed" : "failed"
  phase.gates[gId].status = status               # post: 証跡
  appendGateRun(gId, results)
  exit status == "passed" ? 0 : 1
```

### §2.3 `trace check` (FR-03)

```
function traceCheck(planId):
  plan = registry.get(planId)                     # pre: 存在
  assert plan.generates is not empty
  artifacts = resolve4Artifacts(plan)             # 設計/実装/テスト設計/テスト
  edges = checkBidir12(artifacts)                 # 双方向 12 edge
  orphans = edges.filter(e => not e.resolved)
  report(edges, orphans)
  exit orphans == [] ? 0 : 1                       # post: fail-close
```

### §2.4 `sprint check` (FR-02、TDD Red-first)

```
function sprintCheck(target):
  assert L6.functionDesignFrozen()                # pre: G6 通過
  redCommit = findRedTestCommit(target)
  greenCommit = findBodyCommit(target)
  assert redCommit.precedes(greenCommit)          # Red-first 順序
  recordTddTrace(redCommit, greenCommit)          # post
  exit ordered ? 0 : 1
```

## §3 型 / 値オブジェクト設計 (class-design 縮退統合)

> UT-TDD は非 OOP。型は zod schema (`src/schema/`) を単一正本とし、本節は L6 で確定する**追加型**のみ。

| 型 | 種別 | 定義 (実 src を正本) | carry |
|---|---|---|---|
| `SubDoc` | 値オブジェクト (plan governance lint) | §1.10.G.1 VALID_SUB_DOCS の層別 enum。現行 `analyzePlanGovernance` が L1-L6 design PLAN の sub_doc 欠落 / 層外値 / duplicate layer+sub_doc / skip_sub_doc reason を検出 | implemented |
| `PlanId` | 値オブジェクト (zod regex) | **現行** = `src/schema/frontmatter.ts` `PLAN-(L0..L14\|DISCOVERY\|REVERSE\|RECOVERY\|M)-NN-slug`。横断 token と kind の整合も `frontmatterSchema` で検証 | implemented |
| `RuleType` | 判別共用体 (discriminated union) | `{ id: "pair-exists" \| "ref-resolves" \| "trace-bidir" \| "upstream-coverage" \| "count-matches" \| "id-format" \| "dup-id" \| "glossary-delta" \| "dependency-drift" \| "backlog-format" }` (discriminant = `id`、§4) | IMP-033 (L6 本 doc §4) |
| `GuardDecision` | interface (実装済、`src/runtime/agent-guard.ts:55`) | `{ code: 0 \| 2, message?: string, bypassed?: boolean }` (exit code を返すのみ、block boolean は持たない) | 実装済 |
| `RuntimeDetection` | interface (実装済、`src/runtime/detect.ts:10`) | `{ mode: ExecutionMode, claude: boolean, codex: boolean, currentRuntime: "claude"\|"codex"\|null, availableRuntimes: string[], missingRuntimes: string[] }`。**検出契約 (A-128 F-7、2026-06-10)**: Windows の binary 探索 (`onPath`) は finder (`where.exe`) を PATH 探索せず `%SystemRoot%\System32` から canonical に解決する — PATH 注入事故 (System32 欠落) で finder 自体が不在となり全 runtime を unavailable と誤検出する事故を防ぐ (oracle = `tests/runtime-hook-entrypoints.test.ts` の wrapper lifecycle 群が壊れた PATH 下でも green) | 実装済 |
| `LintResult` | interface (実装済、`src/plan/lint.ts`) | `{ ok: boolean, messages: string[] }` | 実装済 |

> 値オブジェクト不変条件 = zod schema が parse 時に保証 (internal-processing §5 invariant「state は zod 妥当のみ永続化」の型レベル写像)。クラス階層は導入しない (依存方向 = schema 安定核、module-decomposition §4)。**実装済型は実 src 定義を正本とし、本表はその写し** (発明禁止)。

## §4 IMP-033: クロスチェックエンジン rule 型 (gate-design §5)

> 自動追加型クロスチェック (gate-design §4) の rule registry を構成する 10 型。各 rule = 純粋関数 (FR-05 決定論)。doc registry (frontmatter scan) が enroll、gate binding が G_N へ束ねる。

### §4.1 共通 signature

```
type Rule = (registry: DocRegistry, params: RuleParams) => RuleResult
type RuleResult = { ruleId, ok: boolean, violations: Violation[] }
```

### §4.2 10 rule 型 (signature + 1 行 pseudocode)

| # | rule 型 | signature 概要 | pseudocode 要旨 |
|---|---|---|---|
| 1 | `pair-exists` | `(reg, {layer}) => RuleResult` | 設計 doc に対応する pair (テスト設計) doc が存在するか |
| 2 | `ref-resolves` | `(reg, {field}) => RuleResult` | frontmatter の path 参照 (requires/pair) が repo 内に実在 |
| 3 | `trace-bidir` | `(reg, {from,to}) => RuleResult` | A→B 参照に対し B→A 逆参照が存在 (孤児 0) |
| 4 | `upstream-coverage` | `(reg, {childLayer,parentLayer}) => RuleResult` | 下流 ID が上流 ID で全被覆 (FR↔BR 等) |
| 5 | `count-matches` | `(reg, {declared,actual}) => RuleResult` | §0 件数宣言 = 実カウント (ドリフト検出) |
| 6 | `id-format` | `(reg, {pattern}) => RuleResult` | ID が regex 規約に従う (PlanId/FR-ID 等) |
| 7 | `dup-id` | `(reg, {idKind}) => RuleResult` | ID 一意 (重複 0) |
| 8 | `glossary-delta` | `(reg) => RuleResult` | per-工程の用語更新が glossary に反映 (G.9) |
| 9 | `dependency-drift` | `(reg, {expectedMap}) => RuleResult` | 実 import グラフ = 期待依存マップ (ADR-002/IMP-032) |
| 10 | `backlog-format` | `(reg) => RuleResult` | IMP-NNN 形式 + status/候補 enum 妥当 |

> 既存 5 lint (g3-trace/entity-coverage/fr-registry-audit/doc-consistency/improvement-backlog) は上記の rule インスタンスとして吸収 (gate-design §5)。auto-enroll = doc registry が新 doc の frontmatter (layer/sub_doc/pair_artifact) を scan し該当 rule を自動適用 (手書き lint 不要)。

### §4.3 auto-enroll pseudocode

```
function buildCoverageMap():
  registry = scanFrontmatter(docs/**)            # doc registry
  for doc in registry:
    rules = matchRulesByMetadata(doc)            # layer/sub_doc → 適用 rule
    for rule in rules:
      coverage[doc][rule] = rule(registry, paramsFor(doc))
  bindToGates(coverage)                          # gate binding (G_N)
  return coverage                                # 構造軸 = engine、意味軸 = self-review
```

## §5 WBS (関数群 → L7 実装 Sprint、G6 WBS 要件)

| Sprint | 対象関数群 | 依存 | 状態 |
|---|---|---|---|
| **L7.1** | schema 拡張 (`subDocSchema` IMP-026 / `planIdSchema` 層別 IMP-004) | — (安定核) | 実装済 (`src/schema/index.ts` / `src/schema/frontmatter.ts`) |
| **L7.2** | `lintPlan` 本実装 (schedule + governance/frontmatter + G1/G3 trace gate) | schema / trace lint | implemented; repo debt closed and doctor hard-gates `plan-schedule` / `plan-governance` |
| **L7.3** | `lintVmodel` 本実装 (12 edge trace) | schema | implemented |
| **L7.4** | `runDoctor` 統合 (5 lint + state 突合) | lint 群 | scaffold→本 |
| **L7.5** | rule engine 10 型 + auto-enroll (IMP-033) | schema/lint | 実装済 (`src/lint/*` hard gates + doctor integration) |
| **L7.6** | dependency-drift lint (built-in TS import graph、optional knip/madge は adapter insight、ADR-002/IMP-032) | runtime | 実装済 (`src/lint/dependency-drift.ts` / `tests/dependency-drift.test.ts`、PLAN-REVERSE-42) |
| **L7.7** | L7 closure module surface (workflow/session/cutover/review/skill/asset 等) | schema | 実装済 (`src/workflow/`、`src/handover/`、`src/runtime/`、`src/skills/`、`src/assets/`、CLI surface) |

> 各 Sprint = TDD Red-first (L7 entry、§1.10 line 671)。先行 ④ 単体テストコードは L7 単体テスト設計 (pair) の U-* に対応。

## §6 carry → edge-case (L6) / L7 実装

- 各関数の `@edge-*` docstring per-function 確定 = [edge-case.md](./edge-case.md) (IMP-014、internal-processing §7 枠を展開)
- signature の TS 実体化 + DbC docstring 転記 = L7 (parent_design = 本 doc)
- pseudocode (§2/§4.3) の実装 = L7 各 Sprint
- DbC → U-* test oracle 導出 = L7 単体テスト設計 (pair、document-system-map §3)
- **G6 freeze**: 本 doc の signature + pseudocode + 型 + WBS を G6 で凍結 (L7 の parent_design 正本)
## Appendix B: BR-21 evaluation trace coverage addendum

The BR-21 evaluation hooks are Phase B oriented, but the function-design trace must not skip L6 once L4/L5 module boundaries name them. This addendum records the L6 contract landing points for the current evaluation surfaces; detailed algorithm expansion remains in the owning Phase B PLAN.

| trace | L6 contract landing |
|---|---|
| FR-L1-36 | skill evaluation input is normalized as skill metric feedback before Learning Engine aggregation |
| FR-L1-38 | model evaluation input is normalized as model/effort quality feedback before recommendation updates |
| FR-L1-43 | PoC success measurement input is normalized as verification outcome feedback before recipe/risk aggregation |

## Appendix C: L7 clean checkout DB projection invariant

`harness-check` must run deterministic `db rebuild` before tests in a clean checkout. The projection layer must derive `hook_events` from tracked provider handover evidence when ignored local session logs are absent, and `ut-tdd skill suggest --json` must rebuild a read-only in-memory DB from source when persistent `.ut-tdd/harness.db` is absent.

## Appendix D: PLAN-L7-51 同梱 lint モジュール契約 back-fill (PLAN-L7-52 C-4, 2026-06-15)

PLAN-L7-51 が impl-ahead で着地した 4 モジュール (`plan-dod`, `placeholder-deps`, `l7-completion`, `drive-db-registration`) の L6 契約を後追いで明文化する。parent PLAN = PLAN-L7-51。oracle ID 宣言 (U-* / FR-L1-*) は L7 oracle slice で別途行うため本 addendum では省略し、関数 signature + DbC + doctor 配線のみを記録する。

### D.1 `src/lint/plan-dod.ts`

| 関数 (実 export) | signature | pre | post | doctor 配線 |
|---|---|---|---|---|
| `loadPlanDodDocs` | `(root?: string) => PlanDodDoc[]` | `root` 省略時は `process.cwd()`; `docs/plans/` が存在しない場合は空配列を返す | fs read のみ (write なし); 返り値は `PLAN-L7-*.md` ファイルを sort 順で列挙した `PlanDodDoc[]` | `checkPlanDod` 内部で呼ばれる |
| `analyzePlanDod` | `(docs: PlanDodDoc[]) => PlanDodResult` | `docs` は `loadPlanDodDocs` の返り値相当; 純粋関数 (fs アクセスなし) | `status` が `confirmed` または `completed` の PLAN の DoD セクション内に未チェック項目 (`- [ ]`) が 1 件でもあれば `ok=false`; 対象 PLAN が 0 件の場合は `checked=0` (警告扱い) | `checkPlanDod` が `planDodMessages` とともに `runDoctor` へ集約 |
| `planDodMessages` | `(result: PlanDodResult) => string[]` | `result` は `analyzePlanDod` の返り値 | `checked=0` のとき警告メッセージを 1 件返す; `ok=true` のとき合格メッセージを返す; 違反時は最大 8 件のサンプル (`planId:line`) を含む違反メッセージを返す | `checkPlanDod` → `runDoctor.messages` に `doctor:` プレフィックスで合流 |

型定義:

```ts
interface PlanDodDoc { path: string; planId: string; status: string; text: string }
interface PlanDodViolation { planId: string; path: string; line: number; item: string }
interface PlanDodResult { checked: number; violations: PlanDodViolation[]; ok: boolean }
```

共通 invariant: `analyzePlanDod` は純粋関数 (同入力→同出力)。`loadPlanDodDocs` が唯一の fs 端点。`status` フィルタは `confirmed` / `completed` のみ対象とし、それ以外の PLAN は DoD 検査をスキップする。

### D.2 `src/lint/placeholder-deps.ts`

| 関数 (実 export) | signature | pre | post | doctor 配線 |
|---|---|---|---|---|
| `loadPlaceholderDepsDocs` | `(root?: string) => PlaceholderDepsDoc[]` | `root` 省略時は `process.cwd()`; 対象ディレクトリが存在しない場合は空配列を返す | `docs/design/harness/` と `docs/test-design/harness/` を再帰 walk して `.md` ファイルを収集; path は repo root からの相対パスで正規化; sort 済みで返す | `checkPlaceholderDeps` 内部で呼ばれる |
| `analyzePlaceholderDeps` | `(docs: PlaceholderDepsDoc[]) => PlaceholderDepsResult` | `docs` は `loadPlaceholderDepsDocs` の返り値相当; 純粋関数 | active (`""` / `confirmed` / `completed`) の doc に L7 を待ち先とする未解決の依存宣言行が残る、または専用 doctor rule が未整備との自己申告行が残る場合は `ok=false` | `checkPlaceholderDeps` → `runDoctor` |
| `placeholderDepsMessages` | `(result: PlaceholderDepsResult) => string[]` | `result` は `analyzePlaceholderDeps` の返り値 | `ok=true` のとき合格メッセージ (`checked=N, active L7 waits=0`) を返す; 違反時は最大 8 件のサンプル (`path:line`) を含む違反メッセージを返す | `checkPlaceholderDeps` → `runDoctor.messages` |

型定義:

```ts
interface PlaceholderDepsDoc { path: string; status: string; text: string }
interface PlaceholderDepsViolation { path: string; line: number; detail: string }
interface PlaceholderDepsResult { checked: number; violations: PlaceholderDepsViolation[]; ok: boolean }
```

共通 invariant: active status の判定は lowercase で行う。`placeholder_deps` が残存するドキュメントは design/test-design ともに対象。`analyzePlaceholderDeps` は純粋関数 (fs アクセスなし)。

### D.3 `src/lint/l7-completion.ts`

| 関数 (実 export) | signature | pre | post | doctor 配線 |
|---|---|---|---|---|
| `loadL7CompletionDocs` | `(root?: string) => L7CompletionDoc[]` | `root` 省略時は `process.cwd()`; 対象ディレクトリが存在しない場合は空 | `docs/design/harness/L4-basic-design/`, `L5-detailed-design/`, `L6-function-design/` を再帰 walk; path は repo root からの相対パスで正規化; sort 済みで返す | `checkL7Completion` 内部で呼ばれる |
| `classifyStaleL7Line` | `(line: string) => string \| null` | 任意の文字列行; 純粋関数 | L7 完了後も残存する陳腐化記述 (要約行が残作業を carry と述べる / orchestration 本体を未着手と述べる / CI 配線を後続へ送ると述べる / WBS 行が未完ステータスを保持する など計 6 パターン) を検出し分類メッセージを返す; 該当なし = `null` | `analyzeL7Completion` の内部ヘルパー (外部公開のみ、doc 配線なし) |
| `analyzeL7Completion` | `(docs: L7CompletionDoc[]) => L7CompletionResult` | `docs` は `loadL7CompletionDocs` の返り値相当; 純粋関数 | active status の doc 各行に対して `classifyStaleL7Line` を適用; 1 件でも陳腐化パターンが残存すれば `ok=false`; 対象 doc が 0 件のとき `checked=0` (警告扱い) | `checkL7Completion` → `runDoctor` |
| `l7CompletionMessages` | `(result: L7CompletionResult) => string[]` | `result` は `analyzeL7Completion` の返り値 | `ok=true` のとき合格メッセージ (`checked=N, stale L7 blockers=0`) を返す; 違反時は最大 8 件のサンプル (`path:line`) を含む違反メッセージを返す | `checkL7Completion` → `runDoctor.messages` |

型定義:

```ts
interface L7CompletionDoc { path: string; status: string; text: string }
interface L7CompletionViolation { path: string; line: number; detail: string; sample: string }
interface L7CompletionResult { checked: number; violations: L7CompletionViolation[]; ok: boolean }
```

共通 invariant: 対象スコープは L4-L6 design doc のみ (L7 PLAN 自体は対象外)。`classifyStaleL7Line` は正規表現マッチで判定し false-positive を避けるため `active design doc 内の WBS 表・モジュール一覧・サマリ行` に限定したパターンを使う。`analyzeL7Completion` は純粋関数。

### D.4 `src/lint/drive-db-registration.ts`

| 関数 (実 export) | signature | pre | post | doctor 配線 |
|---|---|---|---|---|
| `analyzeDriveDbRegistration` | `(stats: DriveDbRegistrationStats \| null) => DriveDbRegistrationResult` | `stats` は `.ut-tdd/harness.db` から呼び出し元が事前に取得したもの; `null` = DB 不在 or 読み取り失敗; 純粋関数 | `null` のとき `violations=[{reason:"missing_db"}]`, `ok=false`; stats が供給された場合は plan 登録数・drive runs・workflow/model/skill runs・hook events・必須 mode 5 種 (`Discovery/Forward/Recovery/Reverse/Verification`) の各存在を検査し、1 件でも欠落があれば `ok=false` | `checkDriveDbRegistration` → `runDoctor` |
| `driveDbRegistrationMessages` | `(result: DriveDbRegistrationResult) => string[]` | `result` は `analyzeDriveDbRegistration` の返り値 | `ok=false` のとき最大 8 件の違反理由サンプル (`reason[:mode][=count]`) を含む違反メッセージを返す; `ok=true` のとき全 stats を含む合格メッセージを返す | `checkDriveDbRegistration` → `runDoctor.messages` |

型定義:

```ts
interface DriveDbRegistrationStats {
  planCount: number; driveRuns: number; plansWithoutDriveRun: number;
  expectedPlanCount?: number; planRegistryFingerprint?: string; expectedPlanRegistryFingerprint?: string;
  workflowRuns: number; workflowOrphans: number; modelRuns: number; modelOrphans: number;
  skillRecommendations: number; skillRecommendationOrphans: number;
  skillInvocations: number; skillInvocationOrphans: number;
  registeredHookEvents: number; hookOrphans: number; modes: string[];
}
interface DriveDbRegistrationViolation {
  reason: "missing_db" | "empty_plan_registry" | "stale_plan_registry" | "stale_plan_registry_fingerprint"
        | "missing_drive_runs" | "plans_without_drive_run"
        | "missing_workflow_runs" | "workflow_orphans" | "missing_model_runs" | "model_orphans"
        | "missing_skill_recommendations" | "skill_recommendation_orphans"
        | "missing_skill_invocations" | "skill_invocation_orphans"
        | "missing_registered_hook_events" | "missing_required_mode";
  count?: number; mode?: string;
}
interface DriveDbRegistrationResult {
  stats: DriveDbRegistrationStats | null; violations: DriveDbRegistrationViolation[]; ok: boolean;
}
```

共通 invariant: `analyzeDriveDbRegistration` は純粋関数 (DB アクセスは呼び出し元の `checkDriveDbRegistration` が担う)。必須 mode リスト (`Discovery/Forward/Recovery/Reverse/Verification`) は実装内定数 `REQUIRED_CURRENT_MODES` を単一正本とし、本契約の一覧はその写し。orphan 検査は stats フィールドの正値チェックで行い、DB クエリを直接発行しない。

### D.5 `src/lint/fr-roadmap-coverage.ts`

parent PLAN = PLAN-L7-50。L6 契約なし着地分の後追い明文化。oracle ID 宣言は L7 oracle slice で別途行うため本サブセクションでは省略し、関数 signature + DbC + doctor 配線のみを記録する。

| 関数 (実 export) | signature | pre | post | doctor 配線 |
|---|---|---|---|---|
| `analyzeFrRoadmapCoverage` | `(docs: FrRoadmapCoverageDoc[]) => FrRoadmapCoverageResult` | `docs` は `loadFrRoadmapCoverageDocs` 等で事前に取得したもの; fs アクセスなし (純粋); `repoRoot` は `process.cwd()` で補完 | `FrRoadmapCoverageResult` を返す; `checked=docs.length`; 各 doc の残留 bucket テーブル (`## Residual Feature Buckets`) が存在しない場合 `violations` に `missing_section` を積む; 既定 bucket 集合 (R1〜R9) のうち doc 内に未出現のものは `missing_expected_bucket` として違反; 解決が特定できない open 行は `ambiguous_resolution` 違反; `closed` 行には closure evidence セクション (`## Residual Feature Closure Evidence`) の対照検査を行い、plan/source/test 各参照先の fs 実在を `process.cwd()` 基準で検証; 全 violations = 0 かつ open rows = 0 のとき `ok=true` | `checkFrRoadmapCoverage` → `runDoctor.ok` / `runDoctor.messages` |
| `analyzeFrRoadmapCoverageWithRoot` | `(docs: FrRoadmapCoverageDoc[], repoRoot: string) => FrRoadmapCoverageResult` | `docs` は取得済み; `repoRoot` は fs 実在確認の基点パス; `analyzeFrRoadmapCoverage` の実装委譲先 (repoRoot を明示渡し) | 同上; closure evidence の plan/source/test 参照先は `join(repoRoot, path)` で存在検証; `missing_evidence_file` 違反はファイルが実在しない場合に積む; 純粋性の例外 = fs 実在確認 (`existsSync`) を内部で呼ぶ | `checkFrRoadmapCoverage` の内部委譲先 |
| `loadFrRoadmapCoverageDocs` | `(repoRoot?: string) => FrRoadmapCoverageDoc[]` | `repoRoot` 省略時は `process.cwd()` を使用; fs 端点; 対象ファイルが存在しない場合は空配列を返す (fail-open) | `.ut-tdd/audit/A-133-upstream-vmodel-coverage-audit.md` を読み込み `FrRoadmapCoverageDoc[]` として返す; `file` フィールドは `join(".ut-tdd", "audit", "A-133-upstream-vmodel-coverage-audit.md")` (repo 相対) | `checkFrRoadmapCoverage` の唯一の fs 端点 |
| `frRoadmapCoverageMessages` | `(result: FrRoadmapCoverageResult) => string[]` | `result` は `analyzeFrRoadmapCoverage` / `analyzeFrRoadmapCoverageWithRoot` の返り値; 純粋関数 | `checked=0` のとき bucket テーブル不在を示す単一違反メッセージを返す; violations > 0 のとき最大 8 件のサンプル (`file[:bucket]:reason`) を含む違反メッセージを返す; open rows > 0 のとき status 別カウントと bucket 一覧を含むメッセージを返す; すべて解決済みのとき `OK (checked=N, buckets=N, closure=N)` 形式の合格メッセージを返す | `checkFrRoadmapCoverage` → `runDoctor.messages` |

型定義:

```ts
type FrRoadmapCoverageStatus = "closed" | "scheduled" | "parked" | "PO decision";

interface FrRoadmapCoverageDoc {
  file: string;    // repo 相対パス
  content: string; // ファイル全文
}

interface FrRoadmapCoverageRow {
  file: string; bucket: string; upstreamSource: string;
  currentRoute: string; vmodelState: string;
  requiredNextArtifact: string; status: FrRoadmapCoverageStatus;
}

interface FrRoadmapClosureEvidenceRow {
  file: string; bucket: string; planTarget: string;
  sourceTarget: string; testTarget: string;
  coverageGate: string; status: FrRoadmapCoverageStatus;
}

interface FrRoadmapCoverageViolation {
  file: string; bucket?: string;
  reason:
    | "missing_section" | "missing_table" | "malformed_row"
    | "missing_expected_bucket" | "missing_upstream_source"
    | "missing_current_route" | "missing_vmodel_state"
    | "missing_next_artifact" | "unknown_status" | "ambiguous_resolution"
    | "missing_closure_section" | "missing_closure_table"
    | "malformed_closure_row" | "missing_closure_evidence"
    | "missing_plan_target" | "missing_source_target"
    | "missing_test_target" | "missing_coverage_gate"
    | "missing_evidence_file" | "closure_status_mismatch";
}

interface FrRoadmapCoverageResult {
  checked: number; rows: FrRoadmapCoverageRow[];
  closureRows: FrRoadmapClosureEvidenceRow[];
  openRows: FrRoadmapCoverageRow[];
  violations: FrRoadmapCoverageViolation[]; ok: boolean;
}
```

doctor 配線 (src/doctor/index.ts):

`checkFrRoadmapCoverage(repoRoot)` が `loadFrRoadmapCoverageDocs(repoRoot)` → `analyzeFrRoadmapCoverageWithRoot(docs, repoRoot)` → `frRoadmapCoverageMessages(result)` の順に委譲し、`{ messages, ok }` を返す。`runDoctor` は line 974 で `frRoadmapCoverage = checkFrRoadmapCoverage(deps.repoRoot)` を呼び、`frRoadmapCoverage.ok` を全体 `ok` の AND 条件 (line 1014)、`frRoadmapCoverage.messages` を `doctor:` プレフィックス付きで全メッセージに展開 (line 1057) する。

共通 invariant: `analyzeFrRoadmapCoverage` / `analyzeFrRoadmapCoverageWithRoot` は純粋関数 (fs アクセスは `analyzeFrRoadmapCoverageWithRoot` 内の `existsSync` による closure evidence 存在確認のみ; doc 読み込み端点は `loadFrRoadmapCoverageDocs` に集約)。bucket 検査の対象集合 (R1〜R9) は実装内定数 `EXPECTED_BUCKETS` を単一正本とし、本契約の列挙はその写し。`normalizeStatus` はバッククォート除去後に `VALID_STATUSES` と照合し、不一致は `unknown_status` 違反とする。open bucket の解決文言は `RESOLUTION_PATTERN` 正規表現で検証し、パターン不一致は `ambiguous_resolution` 違反とする。`closed` 行には closure evidence の対照が必須であり、evidence 行が欠落する場合は `missing_closure_evidence` 違反として `ok=false` となる。

### D.6 `src/state-db/guardrail-invariants.ts` + guardrail advisory projection (PLAN-L7-52 C-1 option C, 2026-06-15)

parent PLAN = PLAN-L7-48 / PLAN-L7-52。L7-48 監査で唯一の機能リスク = guardrail 不変条件が本番経路で参照されない silent bypass。PO 承認の **option C (warn-first / 非ブロック)** を実装。不変条件ロジックを `src/state-db/guardrail-invariants.ts` に SSoT 抽出し、書込経路 (fail-close) と projection 経路 (warn-first) が共有する。state-db 配置は `guardrail ↔ state-db` の module cycle 回避のため (dependency-drift gate)。`src/guardrail/ledger.ts` は型と `inspectGuardrailInvariants` を re-export。

| 関数 (実 export) | signature | pre | post |
|---|---|---|---|
| `inspectGuardrailInvariants` | `(input: GuardrailDecisionInput) => GuardrailInvariantInspection` | 純粋関数; fs/DB アクセスなし; `isSecretLike` (state-db/index、SECRET_PATTERN SSoT) のみ参照 | `violations[]` を返す: ① `evidence_path` が secret 様 → `secret-evidence`、② `reviewer_model` と `worker_model` が両方定義済かつ一致 → `same-model-self-review` (空文字/undefined は非該当 = blank を self-review と誤判定しない)、③ `decision==="human-required"` かつ `evidence_path` 空 / `human_signoff_required` かつ `evidence_path` 空 → `human-required-without-evidence`。`normalizedDecision` は `normalizeDecision(input)` の結果 (self-review / human-required-without-evidence は `block`)。**書込経路と projection 経路の唯一の正本**。SECRET_PATTERN は各プレフィックス (sk-/ghp_/github_pat_/xox*) の後に最低 16 文字を要求する (実トークン最短 ~48 文字)。`assertNoSensitivePayload` は PK 列を secret パターン検査から除外する (PK = 構造化 ID、誤検知防止) |
| `recordGuardrailDecision` (ledger.ts) | `(db, input) => GuardrailDecisionRow` | DB 書込端点 | `inspectGuardrailInvariants` を呼び `secret-evidence` 違反があれば throw (fail-close); それ以外は `normalizedDecision` で `guardrail_decisions` に upsert; `block` 時は `findings` に `guardrail-block` (warn) を記録 |
| `projectGuardrailInvariantAdvisories` (projection-writer.ts) | `(db) => void` | `rebuildHarnessDb` 内で `projectReviewEvidenceRegistry` の後に呼ぶ (= CLI 再構築時、**非 API 前提に整合**); committed `review_evidence_registry` 行を読む | 各行を `GuardrailDecisionInput` (空 model は `undefined` 化) に写像し `inspectGuardrailInvariants` で検査; 各 violation を **非ブロックの advisory finding** (`kind=guardrail-invariant-advisory:<rule>`, severity=`warn`, source=`guardrail-invariant-advisory`) として `recordFinding`。subject は `advisorySubject(rule, reviewEvidenceId)` = `guardrail-self-review:<rule>:<sha1(12)>` で **plan-id-free** (readiness の `subject_id LIKE '%plan_id%'` に非合致 → automation readiness を flip しない); 追跡用 plan 参照は `evidence_path` に保持 (readiness は evidence_path を走査しない)。projected decision は不変 |

invariant: option C は authz outcome を一切変えない (advisory のみ)。実ブロックする **hard-gate (option A)** は authorization/human-signoff の仕様確定に該当し PO 留保 (CLAUDE.md Guard Rule)。advisory は warn-first phased rollout の Phase 0 (descent-obligation §7 と同型)。U-* = IT-GUARDRAIL-ADVISORY-01。`same-model-self-review` の空文字非該当は blank evidence の false-positive を防ぐための必須不変条件。

## 2026-06-17 Cost-Tiered Dual-Provider Role Router Addendum (PLAN-L7-75 back-fill)

この addendum は §7.8.7.1 (hybrid 機能分散 MUST) / §1.8 (VALID_ROLES) / FR-L1-39 (classifyTask) を
L6 機能契約へ降ろし、PLAN-L7-75 で実装した `src/task/tier-router.ts` の Forward 設計を back-fill する
(drive=agent / kind=impl の bottom-up 実装に対する設計同期)。役割をコスト階層 (T0/T1/T2) × 2 provider
(claude/codex) で配置し、原則安く・上位帯は明示許可ゲートに保つ。task module 配下に置き、`task→team` の
import edge を一方向 (acyclic) に保つ (cycle 回避は dependency-drift gate が機械強制)。

3 archetype (役割の根本種別): **相談 (consult)** = tl/uiux (上位帯エスカレーション・プランナー、read-only)、
**ワーカー (worker)** = se/docs (実装・文書、下位帯)、**検証 (verify)** = qa (テスト通過後カバレッジ相談、上位帯)。
ティア表 (単一正本 `TIER_TABLE`): T0 = `{claude: claude-opus-4-8, codex: gpt-5.5}` (フロンティア/明示許可)、
T1 = `{claude: claude-sonnet-4-6, codex: gpt-5.4}` (ワーカー専門)、T2 = `{claude: claude-haiku-4-5,
codex: gpt-5.3-codex-spark}` (ワーカー軽量)。`TIER_TABLE.T0` が **フロンティア model id の単一正本**であり、
`src/team/model-policy.ts` の `modelForProvider` "frontier" family もこの id (opus-4-8 / gpt-5.5) に整合する。

| 関数 (実 export) | signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `tierFor` | `(role: RouterRole, difficulty: TaskDifficulty, riskFlags: string[]) => Tier` | role は 5 役 (tl/qa/uiux/se/docs) | archetype が帯を決める: 相談/検証 = T0、ワーカー = (trivial/simple かつ risk 無 → T2、それ以外 → T1) | ワーカーは T0 に到達しない (原則安く) | U-TIER-001/002 |
| `resolveModel` | `(role: RouterRole, tier: Tier, provider: Provider) => string` | tier 確定済 | `TIER_TABLE[tier][provider]` を返す | ワーカー role + T0 は throw (fail-close 不変条件) | U-TIER-003 |
| `route` | `(input: RouteInput, detection: RuntimeDetection, options?: RouteOptions) => RoutingDecision` | task は classifyTask 可能 | 役割を実 provider へ配置 (ワーカー=創出側/主、相談・検証=判断側/相手) し tier モデルを解決。主 provider = `options.primary ?? detection.currentRuntime ?? "claude"` | T0 は指名フロンティア role (tl/qa/uiux) かつ `auth.explicit` でのみ ready、それ以外は `model=null` で `blocked-needs-approval` (明示許可ゲート) | U-TIER-005/006/007/009/010/012 |
| `assignCross` | `(detection: RuntimeDetection, primary?: Provider) => CrossAssign` | detection.mode 既知 | hybrid → `{execution: primary, judgement: other(primary), review_kind: cross_agent}`、単一 runtime → 同 provider + `intra_runtime_subagent` | hybrid は execution≠judgement (連携状態は実装と検証を別 provider にする、一致なら throw) | U-TIER-008 |
| `routeToAdapterPlan` | `(decision: RoutingDecision, task: string, mode: ExecutionMode) => AdapterPlan \| null` | decision 生成済 | ready → 配置済 provider の adapter 実行プラン (command/args)、blocked → null | blocked (T0 未承認) は実行不可 = null (fail-close) | U-TIER-011 |
| `routeTeamMembers` | `(members: {role; task}[], detection: RuntimeDetection, options?: RouteOptions) => TeamMemberRouting[]` | member は role+task を持つ | RouterRole member を route し決定を返す。非 RouterRole (po/aim) は `routed=false` で engine fallback | team run の placement へ流すと worker=主 / 相談・検証=相手 のクロス配置が実 spawn を駆動する | U-TIER-013/014/015 |
| `roster` | `() => RosterBinding[]` | なし | 5 役 × 2 provider の対称ビュー (ワーカー既定 T2、相談/検証 T0) | claude/codex は同一 role・同一 archetype で対称 (GPT も Claude と同設定) | U-TIER-004 |

team 統合 (PLAN-L7-75 §2): `ut-tdd team run --route` は `routeTeamMembers` の決定を per-member
`MemberPlacement` (配置 provider / tier モデル / フロンティアゲート `blockedReason`) に写像し
`buildTeamRunPlan` に注入する。placement は YAML engine 既定を上書きし、`validateTeamRun` は配置済み
provider で hybrid の worker≠reviewer 分離を検証する。T0 の相談・検証 member は `--allow-frontier`
なしで fail-close (exit 1)。router は `src/task/` に置き CLI 合成点で配線する (team→task import を作らない =
`task→team` 一方向を維持、dependency-drift cycles 0)。

invariant 要約: archetype が帯を決める / ワーカーは T0 に絶対到達しない (fail-close) / T0 は明示許可ゲート /
hybrid は実装と検証を別 provider / Codex は Claude と対称。U-* family = U-TIER-001..015。
