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
| `catalogAutomationAssets` | `(roots: AssetRoot[], deps: HarnessDbDeps) => AutomationAsset[]` | roots are approved docs/.claude locations | catalogs skill/roster/command docs with path, trigger/capability/search token/drift status; does not copy prompt bodies, secrets, or provider transcripts |
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
| `renderGeneratedMcpConfig` | renderGeneratedMcpConfig(input: GeneratedMcpConfigInput) => GeneratedMcpConfigResult | selected profiles are allow-listed, workspace root is known, and secret values are represented only by env var names. | returns generated local config text and target path suggestion without writing Git-tracked secrets. | filesystem/git profiles are workspace-root scoped; user home mounts and inline tokens are violations. | U-MCPPROFILE-004..006 |
| `analyzeVerificationProfileSafety` | analyzeVerificationProfileSafety(input: VerificationProfileSafetyInput) => VerificationProfileSafetyResult | profile catalog, local package metadata, config text, and optional Docker profile metadata are supplied. | returns findings for unverified source, package mismatch, missing allow-list, broad toolset, write-enabled GitHub profile, global mount, credential persistence, or missing Docker controls. | official source verification and package integrity are required before `trusted`; registry/catalog presence alone is insufficient. | U-MCPPROFILE-007..010 |
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
| `parseRequires` | `ParseRequiresInput { frontmatterText; planPath } -> ParseRequiresResult extends ContractResult { requires[] }` | explicit_l7_defer; parse list fields, normalize repo paths, emit unresolved findings |
| `recordProjectionEvent` | `RecordProjectionEventInput { event; source_path } -> RecordProjectionEventResult { ref: ProjectionRef }` | explicit_l7_defer; validate ID, upsert projection row, return ref |
| `rebuildHarnessDb` | `RebuildHarnessDbInput { roots[]; truncate: true } -> RebuildHarnessDbResult extends ContractResult { rows_by_table; search_rows; signals }` | explicit_l7_defer; truncate projection, replay docs/state/logs, recompute `search_index` and `quality_signals` |
| `recordTestRunEvidence` | `TestRunEvidenceInput { command; runner; scope; started_at; completed_at; exit_code; evidence_path; cases? } -> RecordTestRunEvidenceResult { refs[] }` | explicit_l7_defer; collect Bun/vitest/doctor/lint evidence into UT history projection, redact failure digests, never persist raw provider transcripts |
| `evaluateGreenDefinition` | `GreenDefinitionInput { profile; required_commands[]; command_evidence[]; reviewed_at? } -> GreenDefinitionResult extends ContractResult { computed_green_at?; missing[]; non_green[] }` | explicit_l7_defer; fail when required commands are absent/non-zero or computed green time is after review time |
| `computeUtHistorySignals` | `UtHistoryInput { plan_id?; window? } -> ComputeUtHistorySignalsResult { signals[] }` | explicit_l7_defer; compute oracle coverage, plan green rate, flake score, duration regression, and green-definition compliance |
| `routeSignalToMode` | `RouteSignalToModeInput { signal; current_plan?; drive? } -> RouteSignalToModeResult extends ContractResult { candidates[] }` | explicit_l7_defer; classify signal, rank allowed modes, unknown signal becomes finding |
| `evaluateAgentGuard` | `AgentGuardInput + AgentGuardContext -> GuardDecision` | implemented runtime guard; pseudocode = normalize model family, compare worker/reviewer boundaries, return allow/block |
| `recordCrossCuttingEvent` | `RecordCrossCuttingEventInput { type; subject_id; severity; evidence_path } -> RecordCrossCuttingEventResult { ref: ProjectionRef }` | explicit_l7_defer; append projection event, never approve gates |
| `suggestSkillInjection` | `SuggestSkillInjectionInput { task; layer; drive; catalog } -> SuggestSkillInjectionResult extends ContractResult { candidates[] }` | explicit_l7_defer; filter catalog, score triggers, return deterministic ranked skills |
| `enforceForwardOrder` | `EnforceForwardOrderInput { layer; gate; prior_gates } -> EnforceForwardOrderResult extends ContractResult { allowed }` | explicit_l7_defer; require prior PASS or explicit exception evidence |
| `routeReverseR4` | `RouteReverseR4Input { reverse_type; r4_evidence; forward_routing } -> RouteReverseR4Result extends ContractResult { target_plan? }` | explicit_l7_defer; validate confirmed reverse evidence before Forward merge |
| `decideDiscoveryS4` | `DecideDiscoveryS4Input { hypothesis; poc_evidence; outcome } -> DecideDiscoveryS4Result extends ContractResult { decision }` | explicit_l7_defer; reject pivot/confirmed ambiguity and record routing |
| `emitFeedbackEvents` | `EmitFeedbackEventsInput { findings; quality_signals } -> EmitFeedbackEventsResult { events[] }` | explicit_l7_defer; group repeated gaps/stalls/regressions, never edit PLANs |
| `detectFrontendDrift` | `DetectFrontendDriftInput { mock_root?; token_root?; a11y?; vrt? } -> DetectFrontendDriftResult extends ContractResult { drift_signals[] }` | explicit_l7_defer; optional roots must be absent-by-contract, not silent pass |
| `routeScrumFullback` | `RouteScrumFullbackInput { increment; s4_decision } -> RouteScrumFullbackResult extends ContractResult { forward_targets[] }` | explicit_l7_defer; confirmed increments only |
| `assertRefactorInvariant` | `AssertRefactorInvariantInput { before; after; regression } -> AssertRefactorInvariantResult extends ContractResult { unchanged }` | explicit_l7_defer; compare behavior evidence and require green regression |
| `evaluateRetrofitMatrix` | `EvaluateRetrofitMatrixInput { migration; config; rollback } -> EvaluateRetrofitMatrixResult extends ContractResult { readiness }` | explicit_l7_defer; fail when rollback evidence is missing |
| `evaluateResearchDecision` | `EvaluateResearchDecisionInput { memo; sources; adr_candidate? } -> EvaluateResearchDecisionResult extends ContractResult { decision_ready }` | explicit_l7_defer; research cannot bypass ADR/requirement trace |
| `mergeTwoStageAgentDesign` | `MergeTwoStageAgentDesignInput { phase1; phase2; handoff } -> MergeTwoStageAgentDesignResult extends ContractResult { merged? }` | explicit_l7_defer; preserve layer boundaries and redact provider transcript content |
| `validateScreenDesignWorkflow` | `ValidateScreenDesignWorkflowInput { ia; screens; flow; wireframe; mock; components } -> ValidateScreenDesignWorkflowResult extends ContractResult { complete }` | explicit_l7_defer; backend-only evidence cannot complete screen design |
| `validateFrontendDesignWorkflow` | `ValidateFrontendDesignWorkflowInput { visual; tokens; a11y; vrt; ux } -> ValidateFrontendDesignWorkflowResult extends ContractResult { complete }` | explicit_l7_defer; a11y/token/VRT are first-class evidence |
| `validateFolderRules` | `ValidateFolderRulesInput { path; artifact_kind; registry } -> ValidateFolderRulesResult extends ContractResult { violations[] }` | explicit_l7_defer; check placement without rewriting files |
| `catalogExistingAssets` | `CatalogExistingAssetsInput { roots: string[] } -> CatalogExistingAssetsResult extends ContractResult { assets: AssetCatalogEntry[] }` | explicit_l7_defer; catalog metadata only, no prompt bodies/secrets |
| `prioritizeCapabilityGaps` | `PrioritizeCapabilityGapsInput { assets; workflow_impact; missing_routes } -> PrioritizeCapabilityGapsResult { priorities[] }` | explicit_l7_defer; priority is advisory until converted to PLAN |
| `renderFoundationReadiness` | `RenderFoundationReadinessInput { categories[] } -> RenderFoundationReadinessResult extends ContractResult { implemented; designed; missing }` | explicit_l7_defer; missing categories cannot be reported implemented |
| `recommendModelEffort` | `RecommendModelEffortInput { task; drive; layer; size; uncertainty } -> RecommendModelEffortResult { model_family; reasoning_effort; evidence_path }` | explicit_l7_defer; recommendation is recorded evidence, not hidden prompt state |
| `scoreTaskComplexity` | `ScoreTaskComplexityInput { size; dependencies; uncertainty; affected_artifacts } -> ScoreTaskComplexityResult { score; class; findings[] }` | explicit_l7_defer; unknowns produce uncertainty, not low complexity |
| `resolveDriveStatePartition` | `ResolveDriveStatePartitionInput { drive; mode; kind; layer; plan_id?; session_id? } -> ResolveDriveStatePartitionResult { partition_path; skip_sub_doc[] }` | explicit_l7_defer; drive state joins by plan/session and never contaminates other drives |
| `classifyDrive` | `ClassifyDriveInput { plan; code_delta?; dependency_delta? } -> ClassifyDriveResult { drive; confidence; findings[] }` | explicit_l7_defer; low confidence requires finding/human confirmation |
| `buildAdapterPlan` | `BuildAdapterPlanInput { provider; role; task; plan; execution_mode } -> BuildAdapterPlanResult extends ContractResult { command_plan; boundary_flags[] }` | explicit_l7_defer; provider boundary flags are preserved |
| `catalogSkills` | `CatalogSkillsInput { skill_docs: SkillDocRef[] } -> CatalogSkillsResult extends ContractResult { skills: SkillCatalogEntry[] }` | explicit_l7_defer; metadata only, source docs remain SSoT |
| `recommendSkills` | `RecommendSkillsInput { task; layer; drive; catalog } -> RecommendSkillsResult { recommendations[]; findings[] }` | explicit_l7_defer; missing metadata is a finding |
| `buildCommandCatalog` | `BuildCommandCatalogInput { command_docs[]; cli_surface } -> BuildCommandCatalogResult extends ContractResult { commands[] }` | explicit_l7_defer; search rows are rebuildable projection |

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
| `lintPlan` | `(path?: string) => LintResult` | path 省略時カレント | `{ok, messages[]}`、state 不変 (read-only) |
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
| `SubDoc` | 値オブジェクト (zod enum) | §1.10.G.1 VALID_SUB_DOCS の層別 enum。値 = L1:[business,functional,screen,technical,nfr] / L2:[screen-list,screen-flow,wireframe,ui-element] / L3:[business-requirement,functional-requirement,nfr-grade] / L4:[architecture,function,screen,data,external-if] / L5:[internal-processing,module-decomposition,physical-data,if-detail] / L6:[function-spec,class-design,edge-case] | IMP-026 (L7 実装、未) |
| `PlanId` | 値オブジェクト (zod regex) | **現行** = `src/schema/frontmatter.ts:28` `^(PLAN-\d{3}(-[a-z0-9-]+)?\|PLAN-MM-\d{3})$`。**IMP-004 で層別拡張予定** (`PLAN-L<N>-NN` 形式を許容、L7) | IMP-004 (L7、現行値が G6 凍結対象) |
| `RuleType` | 判別共用体 (discriminated union) | `{ id: "pair-exists" \| "ref-resolves" \| "trace-bidir" \| "upstream-coverage" \| "count-matches" \| "id-format" \| "dup-id" \| "glossary-delta" \| "dependency-drift" \| "backlog-format" }` (discriminant = `id`、§4) | IMP-033 (L6 本 doc §4) |
| `GuardDecision` | interface (実装済、`src/runtime/agent-guard.ts:55`) | `{ code: 0 \| 2, message?: string, bypassed?: boolean }` (exit code を返すのみ、block boolean は持たない) | 実装済 |
| `RuntimeDetection` | interface (実装済、`src/runtime/detect.ts:10`) | `{ mode: ExecutionMode, claude: boolean, codex: boolean, currentRuntime: "claude"\|"codex"\|null, availableRuntimes: string[], missingRuntimes: string[] }` | 実装済 |
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
| **L7.1** | schema 拡張 (`subDocSchema` IMP-026 / `planIdSchema` 層別 IMP-004) | — (安定核) | 未 |
| **L7.2** | `lintPlan` 本実装 (stub → frontmatter validate) | schema | stub→本 |
| **L7.3** | `lintVmodel` 本実装 (12 edge trace) | schema | stub→本 |
| **L7.4** | `runDoctor` 統合 (5 lint + state 突合) | lint 群 | scaffold→本 |
| **L7.5** | rule engine 10 型 + auto-enroll (IMP-033) | schema/lint | 未 |
| **L7.6** | dependency-drift lint (knip/madge、ADR-002/IMP-032) | runtime | 未 |
| **L7.7** | 未実装 module (workflow/session/cutover 等) | schema | 未 (後続 PLAN 分割可) |

> 各 Sprint = TDD Red-first (L7 entry、§1.10 line 671)。先行 ④ 単体テストコードは L7 単体テスト設計 (pair) の U-* に対応。

## §6 carry → edge-case (L6) / L7 実装

- 各関数の `@edge-*` docstring per-function 確定 = [edge-case.md](./edge-case.md) (IMP-014、internal-processing §7 枠を展開)
- signature の TS 実体化 + DbC docstring 転記 = L7 (parent_design = 本 doc)
- pseudocode (§2/§4.3) の実装 = L7 各 Sprint
- DbC → U-* test oracle 導出 = L7 単体テスト設計 (pair、document-system-map §3)
- **G6 freeze**: 本 doc の signature + pseudocode + 型 + WBS を G6 で凍結 (L7 の parent_design 正本)
