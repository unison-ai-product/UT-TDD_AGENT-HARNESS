---
layer: L6
sub_doc: function-spec
status: confirmed
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L7
plan: docs/plans/PLAN-L6-93-node-bootstrap-contract.md
replacement_issue: 152
superseded_plan: docs/plans/PLAN-L6-01-function-spec.md
v2_import: docs/migration/v2-import-ledger.md
---

## 2026-06-09 FR 単体 coverage 追補

- L6 を close する前に、L1 FR registry を `fr-registry-audit` で parse し、登録済み FR はすべて `fr-unit-coverage.md` に表現する。
- `fr-unit-coverage.md` は各 FR-L1 row を、1 つの L6 spec path、1 つの deterministic unit contract、1 つの U-* oracle に対応づける。
- `src/lint/l6-fr-coverage.ts` はこの rule の mechanical guard であり、`ut-tdd doctor` に配線されている。
- `fr-unit-coverage.md` に列挙する contracts は unit-test-granularity specifications である。L7 は direct unit tests として実装しても、confirmed follow-up PLAN へ route してもよい。ただし implementation time に欠けている FR coverage を発明してはいけない。

## 2026-06-09 Harness DB feedback function 追補

この追補は requirements §6.8.6 / §6.8.7 と L5 `physical-data.md` §9 / `internal-processing.md` Appendix B を L6 function-level contracts へ降下する。SQLite DB は docs/state/logs の rebuildable projection であり、authoring source ではない。

| 関数 | signature | 前提 | 事後 / oracle |
|---|---|---|---|
| `recordProjectionEvent` | `(event: ProjectionEvent, deps: HarnessDbDeps) => ProjectionRowRef` | `event.plan_id` または `event.session_id` が存在し、`deps.dbPath` は `.ut-tdd/` 配下に解決される。 | ID を検証し、該当 projection table row を upsert して `{table, id, evidence_path}` を返す。source docs は rewrite しない。 |
| `analyzeDbConstraintCoverage` | `(db: DbIntrospectionPort, tables?: TableDef[]) => DbConstraintCoverageResult` | `DbIntrospectionPort`はread-only `prepare().get/all`だけを公開し、lint/query層は具象`HarnessDb`をimportしない。 | typed schemaとSQLite introspectionを照合し、table/NOT NULL/PK/FK/UNIQUE/CHECKの欠落をfindingへ返す。state-dbへの逆依存とmodule cycleを作らない。 |
| `rebuildHarnessDb` | `(input: RebuildInput, deps: HarnessDbDeps) => RebuildResult` | repo root は読込可能で、DB path は `.ut-tdd/` 配下にある。 | projection tables を truncate し、正規化済み docs/state/log digest を replay して `search_index` と `quality_signals` を再計算する。同一入力では deterministic。 |
| `stableId` | `(prefix: string, value: string) => string` | prefix は空でない projection namespace、value は raw subject ID または空文字を許容する。 | ASCII safe な value は既存 ID を維持し、正規化で情報が落ちる場合は `--<sha256 12hex>` suffix を付ける。空 value は `unknown` sentinel に正規化する。projection / feedback / skill / workflow の row ID 生成はこの helper を共有し、local regex copy を増やさない。 |
| `computeSkillMetrics` | `(rows: SkillMetricInput) => QualitySignal[]` | recommendation / invocation rows が与えられ、分母 0 は明示される。 | layer/drive/plan/model ごとに `fired/recommended` と `accepted/fired` を算出する。欠落 row は findings とし、成功を捏造しない。 |
| `findReference` | `(query: ReferenceQuery, deps: HarnessDbDeps) => ReferenceHit[]` | DB が存在する、または caller が先に rebuild を要求している。 | `search_index` と直接 ID tables を検索し、path、ID、reason、source table、evidence path を返す。read-only とする。 |
| `emitFeedbackEvents` | `(findings: FindingRow[], signals: QualitySignal[]) => FeedbackEvent[]` | findings / signals は正規化済みである。 | 反復 gap、未解決 blocker、dependency stall、品質 regression pattern を feedback events に集約する。PLAN 変更は自動承認しない。 |
| `recordGuardrailDecision` | `(decision: GuardrailDecision, deps: HarnessDbDeps) => ProjectionRowRef` | guardrail 名、decision、evidence path が存在する。 | block/allow/human-required を evidence 付きで保存する。`human-required` は projection rebuild で downgrade できない。 |
| `catalogAutomationAssets` | `(input: CatalogAutomationAssetsInput) => AssetCatalogResult`（`input = { repoRoot?: string; db: HarnessDb }`、型は `src/assets/catalog.ts` 正本、PLAN-L7-52 C-4 で実装に整合化 2026-06-15） | 承認 root は実装内定数 `SOURCES`（`docs/skills` / `.claude/agents` / `docs/commands`）を単一正本とする（caller は roots を渡さない） | skill/roster/command doc を path・trigger/capability・search token・drift status で catalog 化し `{ ok, assets: string[], findings }` を返す; prompt 本文・secret・provider transcript は copy しない; drift / empty-catalog / invalid-root は `findings` として可視化 |
| `recordTestRunEvidence` | `(input: TestRunEvidenceInput, deps: HarnessDbDeps) => ProjectionRowRef[]` | command evidence は runner/scope/timestamps/exit code/evidence path を持つ。repo root と DB path は `.ut-tdd/` 配下に解決される。 | `test_runs` と任意の `test_cases`、`test_results`、`test_artifact_edges` を upsert する。`plan_id` / `oracle_id` 欠落は findings とし、silent pass にしない。 |
| `projectRuntimeTestRunFromSessionEvent` | `(input: RuntimeTestRunProjectionInput) => void` | session event は `.ut-tdd/logs/session/*.jsonl` 由来で、`session_id`、`plan_id`、`ts` が存在する。 | sanitized target が既知 verification verb の Bash `tool_use` event なら、非空 `session_id`、`runtime=hook-session-log`、`scope=runtime-hook`、session JSONL evidence path、hook outcome 由来 pass/fail を持つ `test_runs` row を 1 件 upsert する。verification 以外は無視する。 |
| `projectRuntimeGuardrailDecisionFromSessionEvent` | `(input: RuntimeGuardrailDecisionProjectionInput) => void` | session event は `.ut-tdd/logs/session/*.jsonl` 由来で、`session_id`、`plan_id`、`ts` が存在する。 | `forced_stop` event なら、非空 `session_id`、`guardrail=forced-stop`、`decision=block`、`mode=runtime-hook`、session JSONL evidence path を持つ `guardrail_decisions` row を 1 件 upsert する。guardrail 以外は無視する。 |
| `projectRuntimeSkillInvocationFromSessionEvent` | `(input: RuntimeSkillInvocationProjectionInput) => void` | session event は `.ut-tdd/logs/session/*.jsonl` 由来で、`session_id`、`plan_id`、`ts` が存在し、`automation_assets` は skill rows を含む。 | sanitized target が `Bash (skill)` の Bash `tool_use` event なら、plan-context skill assets を rank し、非空 `session_id`、`source=runtime-hook:skill-suggest`、hook outcome 由来 accepted status を持つ `skill_invocations` rows を upsert する。generic Bash event は無視する。 |
| `projectRuntimeModelTelemetryForDoctor` | `(db: HarnessDb) => void` | doctor が in-memory harness DB を rebuild 済みで、runtime transcript directories は `UT_TDD_CLAUDE_SESSIONS_DIR` / `UT_TDD_CODEX_SESSIONS_DIR` または OS default から読む。 | provider を起動せず既存 Claude/Codex JSONL logs を scan し、token/cost backed `model_runs` rows を telemetry provenance 評価用に overlay する。deterministic `db rebuild` は source-only のままにする。 |
| `evaluateGreenDefinition` | `(input: GreenDefinitionInput, deps: HarnessDbDeps) => GreenDefinitionResult` | changed artifact kind に対する profile と required command kinds が既知である。 | computed green time、missing commands、non-zero exits、DB projection refs を返す。confirmed review evidence は result が green かつ `computed_green_at <= reviewed_at` の場合だけ有効。 |
| `computeUtHistorySignals` | `(input: UtHistoryInput, deps: HarnessDbDeps) => QualitySignal[]` | test run/result rows は正規化済みで、分母 0 は明示される。 | oracle coverage、plan green rate、flake score、duration regression、green-definition compliance を算出する。non-green signals は `findings` に合流する。 |
| `analyzeRefactorCandidates` | `(inputs: RefactorCandidateInput[]) => RefactorCandidate[]` (`candidateRank` 順、入力は `loadRefactorCandidateInputs(repoRoot)` 由来) | source module/function inputs は正規化済みで、構造 threshold (module size、body length、duplicate-body hash、literal repeat count) は明示される。 | behavior-invariant な 5 種 refactor candidate (`split-module` / `extract-helper` / `deduplicate-function` / `externalize-literal` / `externalize-policy`) を deterministic に検出し、`quality_signals` (`metric=refactor_candidate:<kind>`) と `feedback_events` surface へ project する。空/0 入力は明示的に扱い、候補を捏造しない (PLAN-L7-147 / Reverse back-fill PLAN-REVERSE-141)。 |
| `projectRefactorCandidateSignals` | `(repoRoot, db, deps) => void` | `analyzeRefactorCandidates` の出力と既存 `refactor_candidates` row を読める。 | candidate ごとに安定 `candidate_key` を作り、`refactor_candidates` へ lifecycle row を upsert する。既存 state が `accepted` / `rejected` / `implemented` の場合は rebuild で `open` に戻さない。`quality_signals.status=warn` と feedback 発火は `state=open` かつ high-confidence 上位候補に限定する。 |
| `decideRefactorCandidate` | `(db, { candidate_key, state, decided_at, linked_plan_id? }) => ContractResult-like` | candidate row が存在する。`accepted` / `implemented` は `linked_plan_id` を持つ。 | triage decision を永続化する。`rejected` は linked plan を要求しない。存在しない candidate や不足した decision input は fail-close する。 |

unit oracle families:

- U-FR-L1-06 / U-FR-L1-19 / U-FR-L1-20 / U-FR-L1-40 / U-FR-L1-41 は projection write/rebuild、drive partitioning、feedback event generation を覆う。
- U-FR-L1-12 / U-FR-L1-46 / U-FR-L1-47 は skill recommendation、roster capability、skill metric inputs を覆う。
- U-FR-L1-33 / U-FR-L1-34 / U-FR-L1-48 / U-FR-L1-49 は search/reference reduction、command cataloging、asset drift detection を覆う。
- `analyzeRefactorCandidates` (refactor candidate detector) は同じ projection oracle family (U-FR-L1-06/19/20/40/41) 配下の additive `quality_signals` / `feedback_events` projection である。4 種 detection は `tests/projection-writer.test.ts` で覆う (L7 descent: `docs/test-design/harness/L7-unit-test-design.md`)。
- `projectRefactorCandidateSignals` の lifecycle oracle は `refactor_candidates` の永続 state を対象にする。
  `rejected` / `implemented` が rebuild で再 open 化しないことを `tests/projection-writer.test.ts` で固定する。

### 2026-06-23 feedback surface taxonomy 追補

`feedback_events` は findings、quality signals、artifact progress から派生する notification queue である。authoring source ではなく、queue rows が best-effort の `plan_id` を持つ場合に追加の `unresolved-join` findings を作ってはいけない。resolvable PLAN join guard は source projection tables に適用し、notification queue 自体には適用しない。

human-facing feedback surfaces は stored severity を変えずに、open rows を 3 つの display buckets へ分類しなければならない:

| bucket | 判定 rule | surface 表示 |
|---|---|---|
| `gate` | severity が `error` または `fail` | acceptance を block し得るため、`signal_type` で group 化して先に表示する。 |
| `actionable` | telemetry 以外の `warn` rows | `signal_type` ごとに count と代表 next action を表示する。 |
| `telemetry` | `info` rows および `artifact_progress_yellow`、`missing-test-oracle-id`、`skill_firing_rate`、`skill_acceptance_rate` などの高頻度 measurement signals | takeover output では row ごとに列挙せず、signal count で要約する。 |

`selectTakeoverFeedback` と text `ut-tdd feedback list` output はこの taxonomy を使う。個別 queue rows が必要な consumers 向けには、`ut-tdd feedback list --json` を raw audit path として残す。
SessionStart takeover surface は **group-first cap** とする。open rows を `bucket/severity/signal_type` で先に group 化し、gate/actionable group を上位 N 群だけ表示対象にする。単一 `signal_type` が多数行を占有しても他の actionable cluster を不可視にしてはいけない。表示 group の count は group 内の実件数を示し、隠れた group/row は breadcrumb で `ut-tdd feedback list --json` へ誘導する。

attempt escalation surface は直前 session の連続失敗 loop を上限付きで表示する。`renderEscalationSignals` は total 件数を header に保持しつつ、既定 10 件だけを列挙し、残件は breadcrumb とする。これは SessionStart の固定予算を守るための surface cap であり、`evaluateAttemptEscalation` の検出件数は削らない。

### 2026-06-23 read-only quality / branch audit 追補

hardcode/security/debt detection と large branch cleanup は、まず read-only audits として surface する。source files、Git branches、remotes、harness state は mutate しない。

| 関数 | signature | 前提 | 事後 / oracle |
|---|---|---|---|
| `runQualityAudit` | `(repoRoot, opts) => QualityAuditResult` | repo root は読込可能で、archive/migration/runtime-state paths は既定で除外する。 | secret-like または危険な実行 risk は `gate` findings、hardcoded path/endpoint/model/provider と legacy runtime references は `actionable` findings、TODO/FIXME markers は `telemetry` findings として返す。text output は要約し、JSON は tooling に十分な raw 情報を残す。 |
| `loadBranchAudit` | `(repoRoot, opts) => BranchAuditResult` | git local refs は読込可能である。 | current/protected/gone/merged/stale evidence により local branches を `keep`、`delete-candidate`、`review` に分類する。branch の削除や rewrite は行わない。 |

## 2026-06-09 MCP profile config / safety 追補 (A-125 / PLAN-L6-32)

この追補は requirements §6.8.10 と A-125 research memo を、MCP profile catalog hardening の L6 function contracts へ降下する。これ自体は profile execution を許可しない。後続 L7 implementation が満たすべき pure checks と generated-config rules を定義する。

| 関数 | signature | 前提 | 事後 | invariant | oracle |
|---|---|---|---|---|---|
| `catalogVerificationProfiles` | catalogVerificationProfiles(input: VerificationProfileCatalogInput) => VerificationProfileCatalogResult | built-in profiles と調査済み external candidates を source URL、package reference、trigger signals、risk fields 付きで与える。 | Docker MCP Toolkit、MCP Inspector、Playwright MCP、GitHub read-only MCP、Vitest browser、Testcontainers、MSW を含む deterministic profile rows を返す。 | external profiles は既定で disabled とし、discovery/config metadata であって trusted execution ではない。 | U-MCPPROFILE-001..003 |
| `renderGeneratedMcpConfig` | renderGeneratedMcpConfig(input: GeneratedMcpConfigInput) => GeneratedMcpConfigResult | selected profiles は allow-list 済み、workspace root は既知、secret values は env var 名だけで表す。 | Git-tracked secrets を書かず、generated local config text と target path suggestion を返す。各 `mcpServers.<id>` は tokenized launcher argv (`command` = command head、`args` = remaining tokens) を持ち、command 文字列全体を 1 arg にしない (PLAN-L7-79)。 | filesystem/git profiles は workspace-root scoped とする。user home mounts と inline tokens は violations。 | U-MCPPROFILE-004..006, U-MCPPROFILE-013 |
| `analyzeVerificationProfileSafety` | analyzeVerificationProfileSafety(input: VerificationProfileSafetyInput) => VerificationProfileSafetyResult | profile catalog、local package metadata、config text、任意の Docker profile metadata を与える。 | unverified source、package mismatch、missing allow-list、broad toolset、write-enabled GitHub profile、global mount、credential persistence、missing Docker controls を findings として返す。 | `trusted` 前には official source verification と package integrity が必須で、registry/catalog presence だけでは不足。 | U-MCPPROFILE-007..010 |
| `probeVerificationProfile` | probeVerificationProfile(id: string, deps: VerificationProbeDeps) => VerificationProbeResult \| null | profile id と command/probe dependencies を与える。 | activation、executable/package/auth prerequisites、probe-hint executable と異なる generated launcher command head の readiness checks を返す。 | generated launcher command が利用できなければ、package/executable probe hint が利用可能でも profile は ready にならない。 | U-MCPPROFILE-014 |
| `planExternalProfileActivation` | planExternalProfileActivation(input: ExternalProfileActivationInput) => ExternalProfileActivationPlan | trigger signals、relation graph impact、profile readiness、safety findings を与える。 | 推奨 profile ごとに必要な probe、MCP Inspector smoke、human approval、refusal steps を返す。 | external activation は workflow evidence であり、package install や MCP server 有効化を黙って行えない。 | U-MCPPROFILE-011..012 |

安全 default:

- Docker MCP Toolkit は profile-isolation candidate であり、Docker Desktop/toolkit availability が証明されるまでは optional のままにする。
- GitHub MCP は read-only と narrow toolset を default とする。write-capable profile variant は `requires_human_approval` を要求する。
- generated MCP config は local/environment state であり、committed credential や user-specific absolute home path を導入してはならない。
- tool/profile output は evidence/projection row へ normalize する。raw MCP response、screenshot、trace、provider transcript は DB row から除外する。

## 2026-06-09 canonical document export 追補 (A-126 / PLAN-L6-34)

この追補は requirements §6.8.11 と A-126 research memo を、canonical UT-TDD documents を spreadsheet / Excel / PPTX outputs へ変換する L6 function contracts に降下する。これ自体は Office-format generation を許可しない。後続 L7 implementation が満たすべき pure document-structure と export-dataset rules を定義する。

| 関数 | signature | 前提 | 事後 | invariant | oracle |
|---|---|---|---|---|---|
| `parseCanonicalDocumentStructure` | parseCanonicalDocumentStructure(input: CanonicalDocumentInput) => CanonicalDocumentProjection | source docs は repo-relative path と text として与える。document family は concept、requirements、design、plan、adr、test-design のいずれかとする。 | section、heading、table、decision、trace ID、status field、evidence link、source anchor を返す。 | canonical Markdown/docs は source of truth のままにする。generated export は FR/AC/AT/PLAN/ADR ID を導入または drop できない。 | U-DOCEXPORT-001..003 |
| `buildDocumentExportDataset` | buildDocumentExportDataset(input: DocumentExportDatasetInput) => DocumentExportDataset | document projection、requested format、export profile を与える。 | source path、section ID、ID column、status、trace、evidence link を持つ deterministic row/sheet/slide-outline record を返す。 | dataset は rendering 前に redact する。large docs は truncate せず family/section で split する。 | U-DOCEXPORT-004..006 |
| `renderDocumentExport` | renderDocumentExport(input: DocumentExportRenderInput, deps: DocumentExportRendererDeps) => DocumentExportRenderResult | dataset と renderer profile を与える。CSV/Markdown は built-in、XLSX/PPTX/D2 は readiness を要求する。 | generated artifact metadata または renderer-unavailable finding を返す。 | renderer execution は optional であり、package を implicit install しない。 | U-DOCEXPORT-007..009 |
| `recordDocumentExportArtifact` | recordDocumentExportArtifact(input: DocumentExportArtifactInput) => DocumentExportProjectionRows | render result、source snapshot hash、redaction profile、evidence path を与える。 | `document_export_runs`、`document_export_datasets`、`document_export_artifacts` projection row を返す。 | generated file は derived artifact とする。gate truth は canonical docs、normalized row、recorded human decision に残す。 | U-DOCEXPORT-010..012 |

対応 document family:

- concept / planning documents は objective、value、scope、KPI、risk、decision、roadmap を扱う。
- requirements は FR/AC/AT、priority、acceptance、trace、owner/status を扱う。
- detailed design は module/function/API/DB/contract row、dependency、unresolved carry を扱う。
- PLAN は frontmatter、dependency、generated artifact、DoD、evidence、blocker を扱う。
- ADR は decision、alternative、consequence、follow-up、status/date を扱う。
- test-design は U/IT/AT oracle、GWT row、green definition、missing coverage を扱う。

export default:

- CSV と Markdown summary は built-in とする。
- XLSX は ExcelJS または SheetJS readiness による optional とする。
- PPTX は PptxGenJS readiness による optional とする。
- D2 PPTX は architecture/workflow diagram のみに対する optional とする。

### FR registry 関数契約表

この table は、L6 spec が本 file である `fr-unit-coverage.md` rows の function-spec 側 descent である。FR matrix が prose-only coverage claim になることを防ぐ。各 row は意図的に unit-test size とし、1 つ以上の named functions、具体的な signature shape、DbC pre/post/invariant、正確な U-FR oracle を持つ。

<!-- machine marker for DbC gate: | Function(s) | Signature | pre | post | invariant | oracle | -->
| FR | 関数 | signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|---|
| FR-L1-01 | `planDraft` | planDraft(input: PlanDraftInput, deps: PlanDraftDeps) => PlanDraftResult | 必須 ID/path は正規化済みで、必要 evidence が存在する。 | deterministic な U-FR-L1-01 result を返す。evidence 欠落は violation/finding とする。 | source docs は read-only。generated state/projection は rebuildable。secret や provider transcript は保存しない。 | U-FR-L1-01 |
| FR-L1-02 | `sprintCheck` | sprintCheck(input: SprintCheckInput, deps: SprintCheckDeps) => SprintCheckResult | 必須 ID/path は正規化済みで、必要 evidence が存在する。 | deterministic な U-FR-L1-02 result を返す。evidence 欠落は violation/finding とする。 | source docs は read-only。generated state/projection は rebuildable。secret や provider transcript は保存しない。 | U-FR-L1-02 |
| FR-L1-04 | `frontmatterSchema`, `parseRequires` | frontmatterSchema(input: FrontmatterSchemaInput, deps: FrontmatterSchemaDeps) => FrontmatterSchemaResult<br>parseRequires(input: ParseRequiresInput, deps: ParseRequiresDeps) => ParseRequiresResult | 必須 ID/path は正規化済みで、必要 evidence が存在する。 | deterministic な U-FR-L1-04 result を返す。evidence 欠落は violation/finding とする。 | source docs は read-only。generated state/projection は rebuildable。secret や provider transcript は保存しない。 | U-FR-L1-04 |
| FR-L1-06 | `recordProjectionEvent`, `rebuildHarnessDb` | recordProjectionEvent(input: RecordProjectionEventInput, deps: RecordProjectionEventDeps) => RecordProjectionEventResult<br>rebuildHarnessDb(input: RebuildHarnessDbInput, deps: RebuildHarnessDbDeps) => RebuildHarnessDbResult | event は `plan_id` または `session_id` を持つ。`deps.dbPath` は `.ut-tdd/` 配下にあり、source docs/logs は readable とする。 | projection row を deterministic に upsert または rebuild し、`search_index` と `quality_signals` を recompute する。 | DB は rebuildable projection であり authoring source ではない。source docs は rewrite しない。 | U-FR-L1-06 |
| FR-L1-08 | `routeSignalToMode` | routeSignalToMode(input: RouteSignalToModeInput, deps: RouteSignalToModeDeps) => RouteSignalToModeResult | signal type、evidence path、current plan/mode context が存在する。 | reason 付き candidate mode(s) を返し、workflow state は mutate しない。 | unknown signal は finding または no-route result とし、silent success にしない。 | U-FR-L1-08 |
| FR-L1-09 | `evaluateAgentGuard` | evaluateAgentGuard(input: EvaluateAgentGuardInput, deps: EvaluateAgentGuardDeps) => EvaluateAgentGuardResult | subagent/model family と allow-raw context を与える。 | evidence 付き allow/block/bypass decision を返す。禁止された same-model または raw call は明示許可がない限り block する。 | credential や provider transcript は永続化しない。 | U-FR-L1-09 |
| FR-L1-11 | `recordCrossCuttingEvent` | recordCrossCuttingEvent(input: RecordCrossCuttingEventInput, deps: RecordCrossCuttingEventDeps) => RecordCrossCuttingEventResult | event は type、severity、subject、evidence path を持つ。 | interrupt/debt/drift/readiness event を記録、または validation violation を返す。 | recording は append/projection のみであり、gate approval はできない。 | U-FR-L1-11 |
| FR-L1-12 | `suggestSkillInjection` | suggestSkillInjection(input: SuggestSkillInjectionInput, deps: SuggestSkillInjectionDeps) => SuggestSkillInjectionResult | task text、layer、kind/drive、catalog snapshot を与える。 | reason 付き deterministic ranked skill/command candidates を返す。 | missing catalog rows は findings とする。recommendations は prompt bodies を copy しない。 | U-FR-L1-12 |
| FR-L1-13 | `enforceForwardOrder` | enforceForwardOrder(input: EnforceForwardOrderInput, deps: EnforceForwardOrderDeps) => EnforceForwardOrderResult | current layer/gate と prior gate statuses が既知である。 | Forward order と required gates が満たされる場合だけ pass を返す。 | exceptions は explicit evidence を要求し、blocked gates を黙って skip できない。 | U-FR-L1-13 |
| FR-L1-14 | `routeReverseR4` | routeReverseR4(input: RouteReverseR4Input, deps: RouteReverseR4Deps) => RouteReverseR4Result | reverse type、R4 evidence、`forward_routing`、`promotion_strategy` が存在する。 | Forward target または blocking violation を返す。 | confirmed reverse evidence だけが Forward へ merge できる。 | U-FR-L1-14 |
| FR-L1-15 | `decideDiscoveryS4` | decideDiscoveryS4(input: DecideDiscoveryS4Input, deps: DecideDiscoveryS4Deps) => DecideDiscoveryS4Result | hypothesis、PoC verification evidence、outcome が存在する。 | routing requirements 付きの confirmed/rejected/pivot decision を返す。 | rejected/pivot を confirmed として扱えない。 | U-FR-L1-15 |
| FR-L1-19 | `emitFeedbackEvents` | emitFeedbackEvents(input: EmitFeedbackEventsInput, deps: EmitFeedbackEventsDeps) => EmitFeedbackEventsResult | normalized findings と quality signals を与える。 | repeated gaps、unresolved blockers、dependency stalls、regressions を feedback events にする。 | feedback events は PLAN を edit も approve もしない。 | U-FR-L1-19 |
| FR-L1-22 | `detectFrontendDrift` | detectFrontendDrift(input: DetectFrontendDriftInput, deps: DetectFrontendDriftDeps) => DetectFrontendDriftResult | mock/token/a11y/visual/state evidence roots は与えられる、または明示的に absent とする。 | evidence paths 付き deterministic drift signals を返す。 | optional roots の absent は明示し、silent pass にしない。 | U-FR-L1-22 |
| FR-L1-23 | `routeScrumFullback` | routeScrumFullback(input: RouteScrumFullbackInput, deps: RouteScrumFullbackDeps) => RouteScrumFullbackResult | increment evidence と S4 decision が存在する。 | Forward target(s) と required back-fill artifacts を返す。 | confirmed increments だけが Forward に入れる。 | U-FR-L1-23 |
| FR-L1-25 | `assertRefactorInvariant` | assertRefactorInvariant(input: AssertRefactorInvariantInput, deps: AssertRefactorInvariantDeps) => AssertRefactorInvariantResult | before/after behavior evidence、regression results、linked regression `test_ids` が存在する。 | external behavior が不変、regression evidence が green、少なくとも 1 件の test ID が linked の場合だけ pass。 | refactor は新しい functional scope を導入できず、test-ID-linked green evidence なしに close できない。 | U-FR-L1-25 |
| FR-L1-26 | `evaluateRetrofitMatrix` | evaluateRetrofitMatrix(input: EvaluateRetrofitMatrixInput, deps: EvaluateRetrofitMatrixDeps) => EvaluateRetrofitMatrixResult | migration/config/rollback fixtures を与える。 | readiness classification と blocking evidence を返す。 | rollback evidence なしに staged migration は ready にならない。 | U-FR-L1-26 |
| FR-L1-27 | `evaluateResearchDecision` | evaluateResearchDecision(input: EvaluateResearchDecisionInput, deps: EvaluateResearchDecisionDeps) => EvaluateResearchDecisionResult | research memo、source list、ADR candidate を与える。 | decision-ready または missing evidence 付き blocked を返す。 | research output は ADR や requirement trace を bypass できない。 | U-FR-L1-27 |
| FR-L1-28 | `mergeTwoStageAgentDesign` | mergeTwoStageAgentDesign(input: MergeTwoStageAgentDesignInput, deps: MergeTwoStageAgentDesignDeps) => MergeTwoStageAgentDesignResult | Phase 1/2 design artifacts と drive=agent handoff evidence が存在する。 | merged design state または explicit gap list を返す。 | merged output は layer boundaries を保持し、provider transcripts を copy できない。 | U-FR-L1-28 |
| FR-L1-29 | `validateScreenDesignWorkflow` | validateScreenDesignWorkflow(input: ValidateScreenDesignWorkflowInput, deps: ValidateScreenDesignWorkflowDeps) => ValidateScreenDesignWorkflowResult | IA、screen list、flow、wireframe/mock、componentization outputs を与える。 | screen design artifacts と pair traces が complete の場合だけ pass。 | UI workflow は backend-only evidence から complete にできない。 | U-FR-L1-29 |
| FR-L1-30 | `validateFrontendDesignWorkflow` | validateFrontendDesignWorkflow(input: ValidateFrontendDesignWorkflowInput, deps: ValidateFrontendDesignWorkflowDeps) => ValidateFrontendDesignWorkflowResult | visual design、token SSoT、a11y、VRT、UX evidence を与える。 | frontend polish gates に対する pass または missing artifact list を返す。 | accessibility と token evidence は first-class であり、advisory text に落とさない。 | U-FR-L1-30 |
| FR-L1-08 / FR-L1-25 / FR-L1-29 / FR-L1-30 | `classifyDriveTddFits` | classifyDriveTddFits(input?: { modes?: string[] }, deps: ClassifyDriveTddFitsDeps) => ClassifyDriveTddFitsResult | drive/mode names は与えられる、または全件対象として省略される。 | 各 drive model / design specialty について TDD compatibility、Red trigger sources、Yellow state、Green requirements を返す。 | classification は advisory/read-only であり、PLAN complete はできない。 | U-FR-L1-08 / U-FR-L1-25 / U-FR-L1-29 / U-FR-L1-30 |
| FR-L1-39 / FR-L1-41 | `classifyProposalDocumentCoverage` | classifyProposalDocumentCoverage(input: ClassifyTaskInput, deps: ClassifyProposalDocumentCoverageDeps) => ProposalDocumentCoverage | proposal/task text、任意の affected files、任意の dependencies を与える。 | use-case pack ごとに minimum required design docs、test-design docs、evidence、gates、research adoption decisions、rejected research inputs、recommended subagent lanes を返す。 | required docs は additive。LLM/minor wording は削除できない。unknown または low-confidence classification は coverage を縮小せず escalate する。cheap mini/spark lanes は research や bounded work を早めても、risk close や coverage 削減はできない。 | U-FR-L1-39 |

proposal-stage subagent lane names は advisory であり、`tierFor` / `routeTeamMembers` の execution router SSoT を置換しない。`T2-mini` は低コスト research/document inventory lane、`T2-spark` は低コスト bounded implementation lane、`T1-worker` は通常 implementation lane、`T0-frontier` は gated judgement である。`PROPOSAL_SUBAGENT_LANES` はこれら lane の model、`parallel_slots`、`closing_authority`、guard text を定義する。mini/spark lanes は複数の disjoint workers を並列実行できるが、risk close や required coverage 削減はできない。frontier judgement は single-slot かつ明示 gate 対象である。ここで別の `strong` model-band label を導入してはいけない。`strong` は他所で compatibility adjective として使われており、この contract では `T1-worker` が曖昧さのない cost-tier name である。

`team suggest --design-docs` はこれら advisory lanes を proposal coverage team definition へ橋渡しする。Non-closing lanes (`T2-mini`, `T2-spark`, `T1-worker`) は model override、ownership shard、low/medium effort を持つ具体的な `TeamMember` rows になる。`T0-frontier` は judgement guidance のままで executable member として emit しないため、frontier approval は `team run` 経由で bypass できない。cross-provider review を保持するため、最初の parallel shard 後に Claude-side TL review member を追加する。
| FR-L1-32 | `validateFolderRules` | validateFolderRules(input: ValidateFolderRulesInput, deps: ValidateFolderRulesDeps) => ValidateFolderRulesResult | path registry と artifact kind を与える。 | misplaced process docs/tests/state に対する violations を返す。 | folder policy は file rewrite なしで検査する。 | U-FR-L1-32 |
| FR-L1-33 | `catalogExistingAssets` | catalogExistingAssets(input: CatalogExistingAssetsInput, deps: CatalogExistingAssetsDeps) => CatalogExistingAssetsResult | approved asset roots を与える。 | command/skill/detector/template/state/hook/doc/test assets を coverage status で分類する。 | catalog は metadata だけを保存し、prompt bodies と secrets は source docs に残す。 | U-FR-L1-33 |
| FR-L1-34 | `prioritizeCapabilityGaps` | prioritizeCapabilityGaps(input: PrioritizeCapabilityGapsInput, deps: PrioritizeCapabilityGapsDeps) => PrioritizeCapabilityGapsResult | asset catalog、workflow impact、missing route/recover signals を与える。 | reason 付き deterministic priority order を返す。 | priority は PLAN 化されるまで advisory とする。 | U-FR-L1-34 |
| FR-L1-35 | `renderFoundationReadiness` | renderFoundationReadiness(input: RenderFoundationReadinessInput, deps: RenderFoundationReadinessDeps) => RenderFoundationReadinessResult | infrastructure category inventory を与える。 | implemented/designed/missing categories を報告する。 | report は missing categories を implemented として扱えない。 | U-FR-L1-35 |
| FR-L1-36 | `projectSkillEvaluations` | projectSkillEvaluations(db: HarnessDb, opts?: { asOf?: string }) => void | skill_invocations と plan_registry rows が存在する。asOf は ISO timestamp (default = nowIso())。 | accepted=1 invocation を持つ skill_id ごとに `skill_evaluations` row を 1 件書く。skill_rating = success_count / adoption_count。asOf から 30 日以内に invocation がなければ unused_flag = 1。cold-start (0 invocations) は 0 rows で throw しない。 | unused skills は auto-delete しない。削除は human-only。success states ("confirmed"/"completed") は source に記録し、single-source-of-truth hardcoded とする理由を持つ。 | U-FR-L1-36 |
| FR-L1-43 | `projectPocEvaluations` | projectPocEvaluations(db: HarnessDb, opts?: { asOf?: string }) => void | plan_registry は PLAN frontmatter 由来の decision_outcome を持つ kind="poc" rows を含む。 | `poc_evaluations` summary row (id="poc-evaluation:summary") を 1 件書く。poc_success_rate = confirmed_count / total_count、confirmed_count、rejected_count、pivot_count、total_count、evaluated_at を保持する。decision_outcome 空の PoC PLANs は分母から除外し、cold-start (0 decided PoC PLANs) は 0 rows で throw しない。 | pivot は non-success と数える。decision_outcome values は理由付き single-source-hardcoded。row id は常に "poc-evaluation:summary" (rebuild ごとに summary row 1 件)。 | U-FR-L1-43 |
| FR-L1-38 | `projectModelEvaluations` | projectModelEvaluations(db: HarnessDb, repoRoot: string) => void | model_runs table は projectReviewModelRuns と、token/cost telemetry 用の `projectTokenUsage` で populate 済み。evaluation 実行には .ut-tdd/config/model-opt-in.yaml が enabled:true で存在する。PLAN_SUCCESS_STATUSES は success inference の single-source constant。 | opt-in disabled (file absent または enabled!=true) なら 0 rows を書いて return。有効なら distinct model ごとに success_rate = success_count / run_count (`model_runs.plan_id` → `plan_registry.status IN PLAN_SUCCESS_STATUSES`) を持つ `model_evaluations` row を書く。cold-start (0 model_runs) は 0 rows で throw しない。token/cost rows は file-scan のみで `ut-tdd telemetry scan` が取り込む。 | cost-efficiency (tokens_per_success/cost_per_success) は PLAN-L7-57 と PLAN-L7-58 で discharge 済み。cost は既知 model の local pricing tables だけで計算し、未公開/unknown models は cost_usd=null のまま (cost 捏造なし)。success states は PLAN_SUCCESS_STATUSES で single-source-hardcoded。 | U-FR-L1-38 |
| FR-L1-37 | `recommendModelEffort` | recommendModelEffort(input: RecommendModelEffortInput, deps: RecommendModelEffortDeps) => RecommendModelEffortResult | task、drive、layer、size、uncertainty signals を与える。 | model family と reasoning effort recommendation を返す。 | model recommendation は evidence として記録し、hidden prompt state にしない。 | U-FR-L1-37 |
| FR-L1-39 | `scoreTaskComplexity` | scoreTaskComplexity(input: ScoreTaskComplexityInput, deps: ScoreTaskComplexityDeps) => ScoreTaskComplexityResult | size、dependency、uncertainty、affected artifact signals を与える。 | deterministic score と class を返す。 | unknown inputs は explicit uncertainty を生み、low complexity と捏造しない。 | U-FR-L1-39 |
| FR-L1-40 | `resolveDriveStatePartition` | resolveDriveStatePartition(input: ResolveDriveStatePartitionInput, deps: ResolveDriveStatePartitionDeps) => ResolveDriveStatePartitionResult | drive/mode/kind/layer を与える。 | `.ut-tdd/drive/<drive>` partition と skip/defer rules を返す。 | drive state は plan/session で join し、他 drive partitions を汚染しない。 | U-FR-L1-40 |
| FR-L1-41 | `classifyDrive` | classifyDrive(input: ClassifyDriveInput, deps: ClassifyDriveDeps) => ClassifyDriveResult | PLAN/code/dependency evidence を与える。 | drive と orchestration mode input を confidence 付きで分類する。 | low confidence は finding/confirmation need とし、certainty を捏造しない。 | U-FR-L1-41 |
| FR-L1-42 | `buildAdapterPlan` | buildAdapterPlan(input: BuildAdapterPlanInput, deps: BuildAdapterPlanDeps) => BuildAdapterPlanResult | provider、role、task、plan、execution mode を与える。 | UT-TDD-only plan flags を provider に転送せず、provider command plan と boundary flags を返す。 | provider boundary separation と handover context を保持する。 | U-FR-L1-42 |
| FR-L1-47 | `catalogSkills`, `recommendSkills` | catalogSkills(input: CatalogSkillsInput, deps: CatalogSkillsDeps) => CatalogSkillsResult<br>recommendSkills(input: RecommendSkillsInput, deps: RecommendSkillsDeps) => RecommendSkillsResult | skill docs と task/layer/drive context を与える。 | catalog entry と deterministic recommendation を返す。 | missing metadata は finding にする。skill source docs は rewrite しない。 | U-FR-L1-47 |
| FR-L1-48 | `buildCommandCatalog` | buildCommandCatalog(input: BuildCommandCatalogInput, deps: BuildCommandCatalogDeps) => BuildCommandCatalogResult | command docs と CLI surface inputs を与える。 | command assets を UT-TDD CLI subcommand contracts に対応づける。 | search rows は rebuildable であり、authoring source にはならない。 | U-FR-L1-48 |
| FR-L1-51 | `deriveArtifactProgressDecision`, `projectArtifactProgress` | deriveArtifactProgressDecision(input: ArtifactProgressDecisionInput) => ArtifactProgressDecision<br>projectArtifactProgress(db: HarnessDb, graph?: RelationGraphProjection) => void | source artifact nodes、covered-by test edges、impact results、recovery PLAN IDs は正規化済み。 | red/yellow/green color と linked test/dependency reason を持つ rebuildable `artifact_progress` rows を書く。 | DB rows は derived state のみ。green には linked test evidence と dependency clear が必要。missing dependency/back-propagation では red が残る。 | U-FR-L1-51 |

### FR registry 型本体 / pseudocode 実体

本 section は A-110 MUST-2 を close する。上記 row は L6 unit contract である。implementation body は L7 に置いてよいが、各 named function は typed input/result body と pseudocode anchor または explicit L7 defer のいずれかを持つ。`explicit_l7_defer` は L6 contract がここで freeze され、L7 implementation が新しい requirement を発明してはならないことを意味する。

共通 value body:

```ts
type EvidencePath = string;
type Finding = { code: string; severity: "info" | "warn" | "error"; evidence_path: EvidencePath; message: string };
type ContractResult = { ok: boolean; findings: Finding[]; evidence_paths: EvidencePath[] };
type HarnessDbDeps = { repoRoot: string; dbPath: string; readText(path: string): string | null; now(): string };
type ProjectionRef = { table: string; id: string; evidence_path: EvidencePath };
type QualitySignal = { signal_type: string; subject_id: string; score?: number; evidence_path: EvidencePath };
```

| 関数 | 型 body | pseudocode / implementation_state |
|---|---|---|
| `planDraft` | `PlanDraftInput { title; kind; layer; sub_doc?; generates[] } -> PlanDraftResult extends ContractResult { path; plan_id }` | implemented pseudocode §2.1 |
| `sprintCheck` | `SprintCheckInput { target; redEvidence; greenEvidence } -> SprintCheckResult extends ContractResult { ordered }` | implemented pseudocode §2.4 |
| `frontmatterSchema` | `unknown -> Frontmatter` | zod parse として実装済み。pseudocode = schema を validate し、typed frontmatter を返すか throw する。 |
| `parseRequires` | `ParseRequiresInput { frontmatterText; planPath } -> ParseRequiresResult extends ContractResult { requires[] }` | implemented pseudocode: `analyzePlanGovernance` に実装済み。list fields を parse し、PLAN IDs/paths を normalize し、unresolved と not-completed findings を emit する。 |
| `analyzePlanGovernance.routeCertificate` | `PlanFrontmatter { created; status; route_signal?; route_mode? } -> PlanGovernanceViolation[]` | 2026-07-01 以降に作成される non-archived PLAN は `route_signal` と `route_mode` を必須とし、`routeSignalCandidates(route_signal)` が返す mode 候補に `route_mode` が含まれなければ `route_certificate_mismatch` で fail-close する。既存 PLAN は遡及 backfill せず、future authoring の入口適合を強制する。 |
| `analyzeGateIdFormat` | `GateIdFormatInput { markdownDocs; evidenceManifests } -> GateIdFormatResult { checked; violations[]; ok }` | PLAN-L7-395 / IMP-072。Forward/right-arm の GateId は `G0.5` または `G1`〜`G14` だけを正規形とする。`docs/governance/gate-design.md` / `docs/process/gates.md` の gate 表と `.ut-tdd/evidence/**/*.json` の `gate` field を読み、`G15` / `G01` / `gate-3` などを `invalid_forward_gate_id` で fail-close する。`G8/G9`、`G12/G13/G14` のような表上の shorthand は個別 gate に分解して検査する。roadmap 固有 gate (`G-L7.A` 等) は `roadmap-registry` 側の別スキーマで扱い、本関数の対象外。 |
| `analyzePlanGovernance.routeModeKind` | `PlanFrontmatter { plan_id; status; route_mode?; kind } -> PlanGovernanceViolation[]` | PLAN-L7-263 / PLAN-RECOVERY-10。`ROUTE_MODE_ALLOWED_KINDS` の対応表を実在 mode 全体へ適用し、kind が外れる non-archived PLAN を `route_mode_kind_mismatch` で fail-close する。既存 debt は `docs/governance/route-mode-kind-debt-audit-2026-07-02.md` 台帳と同期した allowlist で免除: legacy landed は恒久免除、draft debt は status=draft の間のみ免除し、着手時に add-impl + Reverse pairing への昇格を強制する。未知 `route_mode` は fail-open せず violation にする。 |
| `routeFiling` | `RouteFilingInput { signal; context?: { spine_stage? } } -> FilingTarget { mode; allowed_kinds[]; layer_band[]; sub_doc_hint?; pairing_obligation; forward_insufficient_reason?; origin?: { signal?; plan_id? }; requires_human_approval: boolean }` | PLAN-L6-38 (機構 = internal-processing.md Appendix C)。pre: signal は route-map token (最長一致解決) または未知 token。`context.spine_stage` は roadmap rollup / forward-convergence から機械導出 (stage-aware intake、Appendix C.2b): L8-L14 上昇中〜到達後は駆動モデル filing のみ提示し、L8 以降のコード修正には Reverse による本体設計 (L1-L6) 修正義務を pairing_obligation に含める。post: 既知 token → mode は `routeSignalToMode` と一致し layer_band/allowed_kinds は L4 §3.1 表と一致。**未知 token / 例外条件不成立 → `mode=forward` を返す (default) + 未知 token は warn**。invariant (Forward 正規、PO 2026-07-07): 非 forward の FilingTarget は `forward_insufficient_reason` 無しに生成されない。invariant (cold L7 禁止): いかなる signal に対しても `(kind=impl 単独, layer=L7)` を filing 入口として emit しない。invariant (spine 閉域、PO 2026-07-07): L14 到達・forward-convergence 稼働済みの現段階では plain `kind=impl` の filing target をいかなる mode でも emit しない — 実装作業は add-impl (Reverse pairing) / troubleshoot / refactor / retrofit としてのみ提示する。失敗系 signal 競合は L4 §3.2 全順序 (Incident > Recovery > Reverse > Refactor)。escalation 境界 signal は mode 非依存で `requires_human_approval=true` へ昇格。invariant (Reverse 出所必須、PO 2026-07-07): `mode=reverse` の FilingTarget は origin 参照 (origin signal / origin PLAN — Discovery 終点 / Scrum 完了 / drift / add-feature back-fill / Recovery exit / L8+ コード修正義務) を必須で含み、出所なき standalone reverse は途中導入 (既走プロジェクト onboarding) signal の場合のみ emit する (それ以外 fail-close)。 |
| `analyzePlanGovernance.routeModeKindLayer` | `PlanFrontmatter { plan_id; status; route_mode?; kind; layer? } -> PlanGovernanceViolation[]` | PLAN-L6-38 / PLAN-L7-263 additive hardening。`routeModeKind` の layer 拡張として `ROUTE_MODE_LAYER_BANDS` を参照し、`route_mode` の許容 layer band 外なら `route_mode_kind_layer_mismatch` で fail-close する。実装済み band は `add-feature=L3-L7`、`incident=L7|cross`、`reverse/recovery=cross`、`refactor/version-up=L7`、`verify=L8-L14`。免除は routeModeKind と同じ debt allowlist を使い、legacy landed は恒久免除、draft debt は status=draft の間のみ免除する。`promote_by` 期限・justification まで含む escape hardening は internal-processing Appendix C.4 の carry であり、現行 L7 実装はまだ期限判定を持たない。oracle: `U-PLANGOV-011v4` / `tests/plan-lint.test.ts`。 |
| `analyzePlanGovernance.verifyGateBinding` | `PlanFrontmatter { status; kind; layer?; verification_gate? } -> PlanGovernanceViolation[]` | PLAN-L7-396 / PLAN-RECOVERY-10 additive hardening。`kind=verify` の non-archived PLAN は `verification_gate` を必須とし、`layer=L8..L14` と `G8..G14` を 1:1 で結合する。欠落は `verify_gate_missing`、層と gate のズレまたは non-verify PLAN の `verification_gate` 宣言は `verify_gate_layer_mismatch` で fail-close する。`frontmatterSchema` も同じ契約を持ち、PLAN authoring 時点で右腕工程と gate の二重正本化を止める。oracle: `U-PLANGOV-011v5` / `tests/frontmatter.test.ts`。 |
| `analyzeRightLungDocGovernance` | `RightLungDocGovernanceInput { docs[] } -> RightLungDocGovernanceResult { checked; violations[]; ok }` | PLAN-L7-397 / PLAN-RECOVERY-10 additive hardening。右肺 doc 3 点セット (テスト設計 + 検証戦略 + 検証設計) を横断検査する。対象は L8/G8、L9/G9、L10/G10、L12/G12、L14/G14 の test-design doc。各 doc に `Gx-WORKFLOW` と `test_strategy` / `test_plan` / `test_conditions` / `coverage_items` / `test_procedures` / `execution_evidence` / `exit_criteria` / `defect_routing` / `verification_design`、および層別 test case ID family (`IT-` / `ST-` / `UXV-` / `AT-` / `OT-`) を要求し、欠落時は `right-lung-doc-governance` doctor hard gate で fail-close する。G8/G9/G10 の深い evidence manifest 検査は既存個別 lint の責務、本関数は全右肺 doc の minimum workflow shape を固定する。oracle: `U-RLG-001..003` / `tests/right-lung-doc-governance.test.ts`。 |
| `projectVerificationDefectRoutingRefactorCandidates` | `ProjectVerificationDefectRoutingRefactorCandidatesInput { db; nowIso; stableId } -> void` | PLAN-L7-410 / PLAN-RECOVERY-10 Step 4.4 additive hardening。`findings` の open verification finding (`source=verification-evidence` または L8/L9/L10/L12/L14 right-lung test-design evidence) のうち、`refactor` / `structural` / `smell` / `maintainability` 等の defect_routing 語を持つ所見だけを `refactor_candidates.kind=verification-defect-routing` と `quality_signals.source=verification-defect-routing` へ投影する。`accepted` / `rejected` / `implemented` の triage state と `linked_plan_id` は `projectRefactorCandidateSignals` と同じく rebuild 後も保持する。invariant: DB は authoring source ではないため、Refactor PLAN 本文や設計差分を生成・承認しない。Reverse route は既存 `detector_route_candidates` / `routeFiling` 経路の責務として分離する。oracle: `U-REFACTOR-ROUTE-001` / `tests/projection-writer.test.ts`。 |
| `assertL7HasDesignAncestor` | `AssertL7DesignAncestorInput { plan; registry } -> PlanGovernanceViolation[]` | PLAN-L6-38 (`l7-cold-intake` doctor check の関数契約)。post: `layer=L7` の impl 系 PLAN (`impl`/`add-impl`) は `dependencies.parent` 連鎖が設計層 PLAN (L4/L5/L6 の design/add-design) に到達しなければ `l7_cold_intake` violation で fail-close。invariant: L7 は実装工程の PLAN であり設計判断の home ではない — add-feature.md Step 3/4 (経路 B でも add-design→add-impl 親子必須) の機械化であり、bottom-up の順序自由 (要件 L1/L3 後追い back-fill) は変えない。two-phase intake (Appendix C.5): 対の Reverse PLAN が draft でも intake 許容、confirmed 昇格時に双方 ready を要求。 |
| `loadSpecIrSources` | `LoadSpecIrSourcesInput { repo_root; roots?: RepoRelativePath[]; include?: SpecIrSourceKind[] } -> SpecIrSourceBundle { sources[]; findings[] }` | PLAN-L6-39/PLAN-L7-405。pre: `roots` は repo-relative で、既定は docs / PLAN / test-design / schedule / activation profile の canonical root に加え、PLAN が正当に参照する `docs/governance` / `docs/adr` / `docs/process` / `docs/migration` を `reference_doc` として読む。post: source path、section anchor、frontmatter summary、content_hash、layer/sub_doc 候補を返す。source docs は rewrite しない。invariant: raw provider transcript、secret-like payload、PII-like payload は projection input へ載せず finding 化する。missing root は silent success ではなく warn finding。 |
| `parseSpecDefs` | `ParseSpecDefsInput { bundle: SpecIrSourceBundle } -> SpecDefDraftResult { defs[]; findings[] }` | PLAN-L6-39/42/PLAN-L7-405。post: L4 `SpecDef` を L5 `spec_defs` row draft へ変換し、`spec_id` / `source_path` / `section_anchor` / `layer` / `sub_doc` / `status` / `owner` / `source_hash` を deterministic に生成する。所有 artifact 本文または bootstrap governance doc の `spec.defines` 宣言は `section_anchor=spec.defines:<id>` として格納し、既存の見出し由来定義より優先して検索・検出に使う。`spec_id` の ASCII 正規化で情報が落ちる場合は hash suffix を付け、非ASCII見出しを同一 ID に潰さない。invariant: DB は authoring source ではないため、未知 layer/sub_doc、重複 ID、空 definition は finding/fail-close 候補にし、補完した仕様を創作しない。ただし layer/sub_doc catalog 違反は L1-L6 の design document row に限定し、PLAN / test-design / typed spec / reference doc の補助行を設計 doc 違反として扱わない。frontmatter `doc_type: index` / `doc_type: verification-roadmap` を宣言するメタ doc は catalog 実体ではないため `spec_kind: design_meta_doc` に分類し、sub_doc catalog 検証の対象外とする (PLAN-L7-429)。 |
| `parseSpecRelations` | `ParseSpecRelationsInput { bundle; defs } -> SpecRelationDraftResult { relations[]; findings[] }` | PLAN-L6-39/42/PLAN-L7-405。post: relation_kind は `defines` / `requires` / `verifies` / `pairs` / `derives` / `supersedes` / `traces_from` / `traces_to` / `tests` の allowlist に限定し、L5 `spec_relations` row draft を返す。PLAN dependency は完全 plan_id に加えて一意な短縮 ID (`PLAN-L7-65` など) を同一 PLAN family に解決する。`spec.defines[].traces_from` / `traces_to` / `tests` は宣言 ID 宇宙へ解決し、参照先が無ければ finding。`spec_relations` は仕様 IR 内の依存であり、横断 impact graph (`dependency_edges`) と二重正本化しない。PLAN frontmatter の `requires` / `pair_artifact` のうち spec-ir ソース外 artifact への evidence 参照 (`src/` / `tests/` / `scripts/` / `skills/` / `.ut-tdd/` / `.claude/` / `.github/` / `docs/research/` prefix、および `CLAUDE.md` / `AGENTS.md` / `package.json` / `docs/improvement-backlog.md`) は spec 依存 relation の解決対象外とし、orphan finding を発火しない。`pair_artifact: self` は PLAN-REVERSE-12 規定通り unresolved orphan として finding 化し続ける (PLAN-L7-429)。 |
| `parseScheduleEntries` | `ParseScheduleEntriesInput { bundle } -> ScheduleEntryDraftResult { entries[]; findings[] }` | PLAN-L6-39/383。post: `docs/governance/vmodel-upgrade-schedule.md` を第一入力として `schedule_entries` row draft (`schedule_entry_id`, `plan_id`, `layer`, `sub_doc`, `v_pair`, `predecessor_plan_ids`, `current_location`, `rag`, `status`, `blocked_reason`, `source_path`, `source_hash`, `indexed_at`) を返す。専用工程表に掲載された `plan_id` は PLAN frontmatter fallback より優先し、未掲載 PLAN のみ fallback 生成する。plan_id 未解決、空 current_location、未知 rag は finding 候補。invariant: 工程表は現在地把握の入力であり、PLAN status / dependencies を直接 mutate しない。 |
| `selectScheduleLiveState` | `SelectScheduleLiveStateInput { db } -> ScheduleLiveState { current[]; next[]; blocked[]; entries[] }` | PLAN-L6-52。`schedule_entries` のうち専用工程管理表由来 row を第一入力とし、`test_runs` / `gate_runs` の PLAN 単位最新 signal と `review_evidence_registry` の最新review snapshotを join する。最新時刻はISO文字列順ではなくUTC instantで比較し、同一instantは後置row/entryを採用する。`approve` / `approve_after_fixes` / `pass` / `pass-with-fixes` は成功、`request-changes` / `changes_requested` / `reject` / `fail` / `blocked` / `revise` 系は差し戻し、`note` は中立とする。post: authoring source の `rag` を `authoring_rag` として保持し、失敗 signal がある場合だけ `effective_rag=red` と `signal_state=contradiction` を返す。未知/空ragは楽観的greenにせずyellowへfail-closedし、passing signalだけでyellow/redをgreenに昇格しない。専用工程表rowが存在する場合、PLAN frontmatter fallback rowは現在地選択へ混入させない。`predecessor_plan_ids` はDB serializationの `|` とauthoring tableの `,` の両方を読む。`current[]` は `blocked_reason` がなく未解決predecessorを持たない着手可能laneを全件、`next[]` は未解決predecessor待ちのlane、`blocked[]` は明示blockされたlaneを排他的に返す。contradictionも依存順序を迂回しない。invariant: live state は read-model であり、工程表、PLAN frontmatter、`schedule_entries.rag` を更新しない。 |
| `selectSessionStartDigest` / `renderSessionStartDigest` | `SelectSessionStartDigestInput { db; head_commits[]; escalation_lines[] } -> SessionStartDigest` / `SessionStartDigest -> string` | PLAN-L6-52 / PLAN-L7-412。SessionStart を固定4段 `1 state-and-gates / 2 HEAD / 3 actionable / 4 memory` へ統合する。state は `selectScheduleLiveState` の current/next/blocked、最新 `gate_runs` 全件、直前sessionのIron Law escalationを含む。schedule/gate/feedback/memoryは単一read transaction snapshotから読み、gate queryを共有する。actionable は open feedback group 上位5件、telemetry は件数要約のみ、memory は `.ut-tdd/memory` projection 上位5件。post: 旧 feedback/memory/escalation個別出力を重複表示しない。invariant: DB/HEAD不在・lock・破損は fail-open で runtime 起動を止めず、prose handover を状態入力に使わない。 |
| `parseActivationEntries` | `ParseActivationEntriesInput { bundle } -> ActivationEntryDraftResult { entries[]; findings[] }` | PLAN-L6-39/41。post: `docs/governance/vmodel-activation-profiles.md` を第一入力として `activation_entries` row draft (`activation_entry_id`, `profile_id`, `target_kind`, `target_id`, `scope_status`, `target_version`, `defer_reason`, `enabled`, `source_path`, `plan_id`, `indexed_at`) を返す。専用 activation profile に掲載された `plan_id` は PLAN frontmatter fallback より優先し、未掲載 PLAN のみ fallback 生成する。`scope_status=out_of_scope|deferred` かつ `defer_reason` 空、profile 欠落、工程表未接続は finding/fail-close 候補。invariant: 駆動モデル選択の厳格化は profile + 工程表 + routeFiling の組み合わせで行い、暗黙 default で有効化しない。 |
| `joinActivationScheduleReviews` | `JoinActivationScheduleReviewsInput { activations; schedules } -> ActivationScheduleReviewDraftResult { reviews[]; findings[] }` | PLAN-L6-41。post: `activation_entries.plan_id` と `schedule_entries.plan_id` を join し、`activation_schedule_reviews` row draft (`activation_schedule_review_id`, `profile_id`, `plan_id`, `schedule_entry_id`, `activation_entry_id`, `scope_status`, `enabled`, `target_version`, `defer_reason`, `current_location`, `rag`, `schedule_status`, `layer`, `sub_doc`, `v_pair`, `source_path`, `indexed_at`) を返す。invariant: join は read-model であり、profile / 工程表 / PLAN frontmatter を更新しない。工程表に存在しない `target_kind=plan` は `activation-schedule-missing` finding にする。 |
| `parseDocumentCatalogEntries` | `ParseDocumentCatalogEntriesInput { bundle } -> DocumentCatalogEntryDraftResult { entries[]; findings[] }` | PLAN-L4-20。post: `docs/governance/vmodel-document-catalog.md` を第一入力として `document_catalog_entries` row draft (`document_catalog_entry_id`, `doc_type_id`, `layer`, `sub_doc`, `category`, `requirement_class`, `applicability`, `default_status`, `source_doc_family`, `authoring_source_path`, `projection_table`, `profile_controlled`, `skip_reason_required`, `source_path`, `indexed_at`) を返す。invariant: `document-system-map.md` は意味定義の正本、本 parser は機械可読カタログ正本だけを読む。 |
| `parseDocumentScaleProfileEntries` | `ParseDocumentScaleProfileEntriesInput { bundle } -> DocumentScaleProfileEntryDraftResult { entries[]; findings[] }` | PLAN-L4-20。post: `docs/governance/vmodel-document-scale-profiles.md` を第一入力として `document_scale_profile_entries` row draft (`document_scale_profile_entry_id`, `profile_id`, `doc_type_id`, `decision`, `detail_override`, `status_override`, `reason`, `required_plan_id`, `source_path`, `indexed_at`) を返す。`decision=adopt|conditional|skip|defer`、`detail_override=lite|standard|detailed`、`status_override=minimal|standard|required|skipped|draft|profile_controlled` を正規値とする。invariant: 規模 profile は文書採用粒度の正本であり、version-up wave の対象 PLAN を制御する `vmodel-activation-profiles.md` と混同しない。 |
| `joinDocumentScaleProfileReviews` | `JoinDocumentScaleProfileReviewsInput { profile_entries; catalog_entries } -> DocumentScaleProfileReviewDraftResult { reviews[]; findings[] }` | PLAN-L4-20。post: `document_scale_profile_entries.doc_type_id` と `document_catalog_entries.doc_type_id` を join し、`document_scale_profile_reviews` row draft (`document_scale_profile_review_id`, `profile_id`, `doc_type_id`, `decision`, `detail_override`, `status_override`, `reason`, `required_plan_id`, `catalog_layer`, `catalog_sub_doc`, `requirement_class`, `catalog_default_status`, `catalog_profile_controlled`, `catalog_skip_reason_required`, `source_path`, `indexed_at`) を返す。invariant: join は read-model であり、catalog/profile を更新しない。catalog 欠落、skip/defer/conditional の理由欠落、`required_plan_id` 未解決は finding 化する。 |
| `buildScopeDryRunPreview` | `BuildScopeDryRunPreviewInput { profile_id; activation_profile_id?; capability_flags[]; db } -> ScopePreviewResult { ok; documents[]; activations[]; gates[]; detectors[]; findings[]; summary }` | PLAN-L6-57 / PLAN-L7-398。post: `document_scale_profile_reviews` を profile_id で読み、`decision=adopt|conditional|skip|defer` を `resolved_scope_status=in_scope|conditional|skipped|deferred` へ解決する。`capability_flags` は conditional 文書の `doc_type_id` / `catalog_sub_doc` / `requirement_class` に一致した場合だけ `in_scope` へ昇格する。`activation_profile_id` が指定された場合は `activation_schedule_reviews` を併記する。profile 不在は error finding、`required_plan_id` 未投影や activation profile 不在は warn finding。invariant: dry-run は read-only surface であり、profile / PLAN / docs / DB 正本を mutate しない。doctor profile の pass/fail 判定とは分離し、どの detector/gate/doc が対象になるかだけを説明する。 |
| `analyzeDesignDocCrossIntegrity` | `AnalyzeDesignDocCrossIntegrityInput { defs; relations; catalog_entries } -> DesignDocCrossIntegrityResult { checked_docs; duplicate_definitions[]; dependency_cycles[]; findings[]; ok }` | PLAN-L6-59。post: `document_catalog_entries` で対象文書集合を確定し、`spec_defs` の `spec_id + source_path` を定義元 map にして、同一 ID が複数 authoring source で定義された場合は `design-doc-duplicate-definition` finding にする。`spec_relations` は source doc 間 edge へ射影し、同一 doc 内自己参照を除いた DFS で doc-level cycle を `design-doc-dependency-cycle` finding にする。invariant: module import cycle (`dependency-drift`) や typed-spec trace closure の片方向欠落とは責務を分ける。検出器は ID / doc edge / filing target を補完せず、catalog と typed spec projection から再構築する。 |
| `parseAgentContractRows` | `ParseAgentContractRowsInput { bundle } -> AgentContractResult { contracts[] }` | PLAN-L6-47。post: `docs/governance/vmodel-agent-contracts.md` の `agent_contracts` YAML から `agent_contracts` row draft (`agent_contract_id`, `target_path`, `defines`, `read_first`, `done_when`, `source_path`, `source_hash`, `indexed_at`) を返す。invariant: ZIP の `agent.done_when` を Python command として移植せず、HARNESS の `doctor:<gate-id>` 契約に正規化する。 |
| `analyzeTypedSpecTraceClosure` | `AnalyzeTypedSpecTraceClosureInput { defs; relations } -> TypedSpecTraceClosureResult { typedSpecCount; relationCount; findings[]; ok }` | PLAN-L6-43。post: typed spec 宣言だけを対象に `traces_to`↔相手 `traces_from`、`tests`↔test spec `traces_from` を突合し、片側欠落を `typed-spec-trace-reverse-missing` / `typed-spec-test-backlink-missing` finding にする。test を要求する kind に test edge が無い場合は `typed-spec-test-missing`。invariant: 閉包を projection 側で補完せず、doctor hard gate が fail-close できる finding として返す。 |
| `deriveSpecRagClosureEntries` | `DeriveSpecRagClosureEntriesInput { defs; relations; closureFindings; indexedAt } -> SpecRagClosureEntryRow[]` | PLAN-L6-61。post: typed spec 宣言を `spec_rag_closure_entries` row へ投影し、`requires_test`、upstream/downstream/test 到達数、typed-spec closure finding 数、`rag`、`closure_status`、`impact_summary` を deterministic に返す。`traces_from` / `requires` は `PLAN-L6-60` の impact traversal と同じく依存元から影響先へ反転し、`traces_to` / `tests` は宣言方向を使う。`pairs` は spec RAG の到達判定に混入しない。invariant: `schedule_entries.rag` を更新せず、spec 閉包 RAG と工程 RAG を分離する。 |
| `analyzeTypedSpecLedgerBodySync` | `AnalyzeTypedSpecLedgerBodySyncInput { defs; relations; sources } -> TypedSpecLedgerBodySyncResult { typedSpecCount; ledgerRowCount; findings[]; ok }` | PLAN-L6-44。post: typed spec 宣言を、同じ authoring source の本文実体、`spec_id` / `ledger_sources` / `v_phase` 台帳、relation の phase 方向と突合する。本文実体欠落、台帳行欠落、未知台帳ID、重複台帳ID、phase 欠落、phase 逆流を finding にする。invariant: 台帳や本文を DB projection から補完せず、source docs から rebuild して判定する。 |
| `analyzeTypedSpecOwnedArtifactDispersal` | `AnalyzeTypedSpecOwnedArtifactDispersalInput { defs; sources } -> TypedSpecOwnedArtifactDispersalResult { typedSpecCount; dispersedSpecCount; findings[]; ok }` | PLAN-L6-45。post: typed spec 宣言の `source_path` が台帳 `ledger_sources` のいずれかと一致することを検査し、一致しない宣言を `typed-spec-owned-source-mismatch` finding にする。invariant: central bootstrap doc は移行足場であり、所有外 ID の宣言元になれない。 |
| `analyzeTypedSpecPhaseLayerAlignment` | `AnalyzeTypedSpecPhaseLayerAlignmentInput { defs; sources } -> TypedSpecPhaseLayerAlignmentResult { typedSpecCount; alignedSpecCount; findings[]; ok }` | PLAN-L6-46。post: typed spec 台帳の `v_phase` と宣言元 artifact の owner phase (`typed_spec_phase_owner` / `executed_at_layer` / `layer` / path 由来 layer) を突合し、owner phase 欠落を `typed-spec-owner-phase-missing`、不一致を `typed-spec-phase-layer-mismatch` finding にする。invariant: governance doc のような横断 artifact は `typed_spec_phase_owner` を明示し、検出器が layer を推測で創作しない。 |
| `analyzeAgentContractIntegrity` | `AnalyzeAgentContractIntegrityInput { contracts; sources; knownDoctorGateIds? } -> AgentContractIntegrityResult { contractCount; findings[]; ok }` | PLAN-L6-47。post: agent contract の ID、target path、defines、read_first、done_when を検査し、欠落や未知 doctor gate を `agent-contract-*` finding にする。invariant: `read_first` / `done_when` を projection 側で補完せず、source docs と doctor gate ID から fail-close 判定する。 |
| `projectSpecIr` | `ProjectSpecIrInput { defs; relations; schedules; activations; activation_schedule_reviews; document_catalog_entries; document_scale_profile_entries; document_scale_profile_reviews; spec_rag_closure_entries; candidates?; db } -> ProjectSpecIrResult { rows_by_table; findings[] }` | PLAN-L6-39/41/L4-20/L6-61。post: `spec_defs` / `spec_relations` / `schedule_entries` / `activation_entries` / `activation_schedule_reviews` / `document_catalog_entries` / `document_scale_profile_entries` / `document_scale_profile_reviews` / `spec_rag_closure_entries` / `detector_route_candidates` を deterministic upsert し、同一入力の rebuild は row counts と IDs が安定する。invariant: projection は rebuildable であり authoring source ではない。source docs / PLAN / test-design / schedule / activation profile / document catalog / document scale profile / spec RAG は書き換えない。 |
| `projectDesignPairFreezeFindings` / `projectDesignQualityCoverage` | `ProjectDesignDetectionInput { repoRoot; db } -> void` | PLAN-L7-368。post: `analyzePairFreeze(loadPairDocs())` の orphan を `findings.kind=design-pair-orphan:<reason>`、設計品質 lint 群の違反数を `coverage(scope=design-quality, metric=violation_count)` へ投影する。invariant: 既存 file-driven lint の判定ロジックを再実装せず、source docs / PLAN / test-design は書き換えない。 |
| `checkDesignDetection` | `DoctorDeps.repoRoot -> LintResult` | PLAN-L7-368。post: DB 投影 fact (`coverage.scope=design-quality` と `findings.kind=design-pair-orphan:*`) を読み、coverage 欠落、blocked coverage、open pair orphan を `doctor: design-detection - violation` として hard gate 化する。invariant: doctor message は DB 集約結果だけを報告し、既存 file-driven check と同じ違反詳細を二重出力しない。 |
| `analyzeSpecIrIntegrity` | `AnalyzeSpecIrIntegrityInput { defs; relations; schedules; activations; activation_schedule_reviews; document_scale_profile_entries; document_scale_profile_reviews } -> SpecIrIntegrityResult { findings[]; quality_signals[] }` | PLAN-L6-39/41/43/L4-20。post: orphan relation、typed spec trace closure 不一致、未知 layer/sub_doc、activation reason 欠落、activation と工程表の join 欠落、document scale profile の未知 decision/detail/status、catalog join 欠落、skip/defer/conditional 理由欠落、`required_plan_id` 未解決、secret-like evidence/value、schedule/PLAN 不整合、raw markdown body 永続化を検出し、finding/quality_signal へ変換する。invariant: parse 失敗や欠損を silent skip しない。fail-close 対象は doctor/detector 層で route_signal へ昇格できる形に保つ。 |
| `checkTypedSpecTraceClosure` | `DoctorDeps.repoRoot -> LintResult` | PLAN-L6-43/PLAN-L7-387。post: source docs から `collectSpecIrProjection` を再構築し、`analyzeTypedSpecTraceClosure` の `ok=false` を `doctor: typed-spec-trace-closure - violation` として hard gate 化する。invariant: harness.db の既存 row を正本にせず、authoring source から rebuild して判定する。 |
| `checkTypedSpecLedgerBodySync` | `DoctorDeps.repoRoot -> LintResult` | PLAN-L6-44/PLAN-L7-388。post: source docs から `collectSpecIrProjection` と source snapshot を再構築し、`analyzeTypedSpecLedgerBodySync` の `ok=false` を `doctor: typed-spec-ledger-body-sync - violation` として hard gate 化する。invariant: harness.db の既存 row を正本にせず、台帳・本文・phase の欠落を silent repair しない。 |
| `checkTypedSpecOwnedArtifactDispersal` | `DoctorDeps.repoRoot -> LintResult` | PLAN-L6-45/PLAN-L7-389。post: source docs から `collectSpecIrProjection` と source snapshot を再構築し、`analyzeTypedSpecOwnedArtifactDispersal` の `ok=false` を `doctor: typed-spec-owned-artifact-dispersal - violation` として hard gate 化する。invariant: spec 宣言を DB や bootstrap から補完せず、所有 artifact の本文に戻す。 |
| `checkTypedSpecPhaseLayerAlignment` | `DoctorDeps.repoRoot -> LintResult` | PLAN-L6-46/PLAN-L7-390。post: source docs から `collectSpecIrProjection` と source snapshot を再構築し、`analyzeTypedSpecPhaseLayerAlignment` の `ok=false` を `doctor: typed-spec-phase-layer-alignment - violation` として hard gate 化する。invariant: `v_phase` と artifact frontmatter のズレを検出側で補完しない。 |
| `checkAgentContractDetection` | `DoctorDeps.repoRoot -> LintResult` | PLAN-L6-47/PLAN-L7-391。post: source docs から agent contract projection と source snapshot を再構築し、`analyzeAgentContractIntegrity` の `ok=false` を `doctor: agent-contract-detection - violation` として hard gate 化する。invariant: ZIP の `detect green` は `doctor:<gate-id>` の存在と green に翻訳し、Python tools を実行経路にしない。 |
| `deriveDetectorRouteCandidates` | `DeriveDetectorRouteCandidatesInput { findings; quality_signals; spec_ir; filing_target_ssot } -> DetectorRouteCandidateResult { candidates[]; findings[] }` | PLAN-L6-39。post: finding/spec/schedule/activation を join し、L5 `detector_route_candidates` row draft (`route_candidate_id`, `source_table`, `source_id`, `detector_id`, `finding_kind`, `severity`, `subject_kind`, `subject_id`, `filing_target_id`, `target_layer`, `target_sub_doc`, `candidate_status`, `reason`, `evidence_path`, `computed_at`) を返す。invariant: FilingTarget を創作せず、target snapshot は L4 function §3.2.1 / `routeFiling` SSoT から得る。SSoT 不在、route_signal unknown、target mismatch は non-ready finding。 |
| `reviewDetectorRouteCandidate` | `DetectorRouteCandidateLike -> DetectorRouteCandidateReview { route_signal; filing_target; snapshot_mismatch; review_status; next_action }` | PLAN-L6-40。post: candidate の `filing_target_id=routeFiling:*` から route signal を取り出し、`routeFiling` SSoT の `FilingTarget` 完全形 (`mode`, `allowed_kinds`, `layer_band`, `sub_doc_hint`, `pairing_obligation`, `forward_insufficient_reason`, `requires_human_approval`) と candidate snapshot を並べた review DTO を返す。`feedback_events.next_action` はこの DTO の人間向け要約であり、DB schema を増やさない。invariant: candidate source row / PLAN / schedule は更新しない。target snapshot と `layer_band` が食い違う場合は `review_status=snapshot_mismatch` とし、silent repair しない。 |
| `recordProjectionEvent` | `RecordProjectionEventInput { event; source_path } -> RecordProjectionEventResult { ref: ProjectionRef }` | implemented pseudocode: SQLite adapter正本は`src/state-db/sqlite-projection-store.ts`。schema列への正規化、PK補完、secret fail-close、plan join findingを所有する。`src/state-db/projection-writer.ts`は既存public signatureの互換facadeだけを保持する。 |
| `rebuildHarnessDb` | `RebuildHarnessDbInput { roots[]; truncate: true } -> RebuildHarnessDbResult extends ContractResult { rows_by_table; search_rows; signals }` | implemented pseudocode: 再構築順序のapplication orchestrationは`src/state-db/projection-writer.ts`に残る。SQLite transactionは`sqlite-transaction.ts`、再構築可能tableの消去と`refactor_candidates`保持は`sqlite-projection-rebuild.ts`が所有し、docs/state/logs replay後に`search_index`と`quality_signals`を再計算する。 |
| `recordTestRunEvidence` | `TestRunEvidenceInput { command; runner; scope; started_at; completed_at; exit_code; evidence_path; cases? } -> RecordTestRunEvidenceResult { refs[] }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。Bun/vitest/doctor/lint evidence を UT history projection に集約し、failure digests を redact し、raw provider transcripts は永続化しない。 |
| `evaluateGreenDefinition` | `GreenDefinitionInput { profile; required_commands[]; command_evidence[]; reviewed_at? } -> GreenDefinitionResult extends ContractResult { computed_green_at?; missing[]; non_green[] }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。required commands が absent/non-zero、または computed green time が review time より後なら fail する。 |
| `computeUtHistorySignals` | `UtHistoryInput { plan_id?; window? } -> ComputeUtHistorySignalsResult { signals[] }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。oracle coverage、plan green rate、flake score、duration regression、green-definition compliance を compute する。 |
| `routeSignalToMode` | `RouteSignalToModeInput { signal; current_plan?; drive? } -> RouteSignalToModeResult extends ContractResult { candidates[] }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。signal を classify し、allowed modes を rank する。unknown signal は finding にする。 |
| `evaluateAgentGuard` | `AgentGuardInput + AgentGuardContext -> GuardDecision` | runtime guard として実装済み。pseudocode = model family を normalize し、worker/reviewer boundaries を compare して allow/block を返す。 |
| `recordCrossCuttingEvent` | `RecordCrossCuttingEventInput { type; subject_id; severity; evidence_path } -> RecordCrossCuttingEventResult { ref: ProjectionRef }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。projection event を append し、gate approve はしない。 |
| `suggestSkillInjection` | `SuggestSkillInjectionInput { task; layer; drive; catalog } -> SuggestSkillInjectionResult extends ContractResult { candidates[] }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。catalog を filter し、triggers を score して deterministic ranked skills を返す。 |
| `enforceForwardOrder` | `EnforceForwardOrderInput { layer; gate; prior_gates } -> EnforceForwardOrderResult extends ContractResult { allowed }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。prior PASS または explicit exception evidence を要求する。 |
| `routeReverseR4` | `RouteReverseR4Input { reverse_type; r4_evidence; forward_routing } -> RouteReverseR4Result extends ContractResult { target_plan? }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。Forward merge 前に confirmed reverse evidence を validate する。 |
| `decideDiscoveryS4` | `DecideDiscoveryS4Input { hypothesis; poc_evidence; outcome } -> DecideDiscoveryS4Result extends ContractResult { decision }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。pivot/confirmed ambiguity を reject し、routing を記録する。 |
| `emitFeedbackEvents` | `EmitFeedbackEventsInput { findings; quality_signals } -> EmitFeedbackEventsResult { events[] }` | implemented pseudocode: `src/feedback/engine.ts` に実装済み。repeated gaps/stalls/regressions を group し、PLAN は edit しない。 |
| `detectFrontendDrift` | `DetectFrontendDriftInput { mock_root?; token_root?; a11y?; vrt? } -> DetectFrontendDriftResult extends ContractResult { drift_signals[] }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。optional root は silent pass ではなく absent-by-contract で扱う。 |
| `routeScrumFullback` | `RouteScrumFullbackInput { increment; s4_decision } -> RouteScrumFullbackResult extends ContractResult { forward_targets[] }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。confirmed increments だけを許可する。 |
| `assertRefactorInvariant` | `AssertRefactorInvariantInput { before; after; regression } -> AssertRefactorInvariantResult extends ContractResult { unchanged }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。behavior evidence を compare し、green regression を要求する。 |
| `evaluateRetrofitMatrix` | `EvaluateRetrofitMatrixInput { migration; config; rollback } -> EvaluateRetrofitMatrixResult extends ContractResult { readiness }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。rollback evidence 欠落時は fail する。 |
| `evaluateResearchDecision` | `EvaluateResearchDecisionInput { memo; sources; adr_candidate? } -> EvaluateResearchDecisionResult extends ContractResult { decision_ready }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。research は ADR/requirement trace を bypass できない。 |
| `mergeTwoStageAgentDesign` | `MergeTwoStageAgentDesignInput { phase1; phase2; handoff } -> MergeTwoStageAgentDesignResult extends ContractResult { merged? }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。layer boundaries を保持し、provider transcript content を redact する。 |
| `validateScreenDesignWorkflow` | `ValidateScreenDesignWorkflowInput { ia; screens; flow; wireframe; mock; components } -> ValidateScreenDesignWorkflowResult extends ContractResult { complete }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。backend-only evidence では screen design を complete にできない。 |
| `validateFrontendDesignWorkflow` | `ValidateFrontendDesignWorkflowInput { visual; tokens; a11y; vrt; ux } -> ValidateFrontendDesignWorkflowResult extends ContractResult { complete }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。a11y/token/VRT は first-class evidence とする。 |
| `classifyDriveTddFits` | `ClassifyDriveTddFitsInput { modes? } -> ClassifyDriveTddFitsResult extends ContractResult { fits[] }` | `src/workflow/contracts.ts` に実装済み。Red trigger vocabulary として DB/projected signal names を使うが、DB や PLAN は mutate しない。 |
| `classifyProposalDocumentCoverage` | `ClassifyTaskInput { text; affected_files?; dependencies? } -> ProposalDocumentCoverage { granularity; patterns[]; required_design_docs[]; required_test_docs[]; required_evidence[]; required_gates[]; research_adoption[]; research_rejections[]; escalators[]; guardrails[]; findings[] }` | implemented pseudocode: `src/task/classify.ts` に実装済み。proposal text を screen/UI、UX/usability、API/IF、data/DB、batch/report、report output、async/job flow、notification/message、common component、security/privacy、error/observability/audit、ops/release/migration、NFR、test design、workflow/gate、agent orchestration、discovery 向けの additive required document packs に map する。 |
| `analyzeProposalDocumentCoverage` | `ProposalDocumentCoverageLintInput { repoRoot; routingDocText; classifyCoverage; scenarios? } -> ProposalDocumentCoverageLintResult { ok; checkedScenarios; checkedPatterns[]; violations[] }` | implemented pseudocode: `src/lint/proposal-document-coverage.ts` に実装済み。representative proposal scenarios、required document path existence、cross-layer routing doc inclusion、routing pattern markers、cross-artifact trace escalation、shrinkage guard behavior を検証する。classifier は注入し、lint dependency direction を neutral に保つ。 |
| `validateFolderRules` | `ValidateFolderRulesInput { path; artifact_kind; registry } -> ValidateFolderRulesResult extends ContractResult { violations[] }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。files を rewrite せず placement を check する。 |
| `catalogExistingAssets` | `CatalogExistingAssetsInput { roots: string[] } -> CatalogExistingAssetsResult extends ContractResult { assets: AssetCatalogEntry[] }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。catalog metadata のみで、prompt bodies/secrets は保持しない。 |
| `prioritizeCapabilityGaps` | `PrioritizeCapabilityGapsInput { assets; workflow_impact; missing_routes } -> PrioritizeCapabilityGapsResult { priorities[] }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。priority は PLAN 化されるまで advisory。 |
| `renderFoundationReadiness` | `RenderFoundationReadinessInput { categories[] } -> RenderFoundationReadinessResult extends ContractResult { implemented; designed; missing }` | `src/workflow/contracts.ts` に実装済み。missing categories を implemented と報告できない。 |
| `recommendModelEffort` | `RecommendModelEffortInput { task; drive; layer; size; uncertainty } -> RecommendModelEffortResult { model_family; reasoning_effort; evidence_path }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。recommendation は recorded evidence であり hidden prompt state ではない。 |
| `scoreTaskComplexity` | `ScoreTaskComplexityInput { size; dependencies; uncertainty; affected_artifacts } -> ScoreTaskComplexityResult { score; class; findings[] }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。unknowns は uncertainty を生み、low complexity と扱わない。 |
| `resolveDriveStatePartition` | `ResolveDriveStatePartitionInput { drive; mode; kind; layer; plan_id?; session_id? } -> ResolveDriveStatePartitionResult { partition_path; skip_sub_doc[] }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。drive state は plan/session で join し、他 drives を汚染しない。 |
| `classifyDrive` | `ClassifyDriveInput { plan; code_delta?; dependency_delta? } -> ClassifyDriveResult { drive; confidence; findings[] }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。low confidence は finding/human confirmation を要求する。 |
| `buildAdapterPlan` | `BuildAdapterPlanInput { provider; role; task; plan; execution_mode } -> BuildAdapterPlanResult extends ContractResult { command_plan; boundary_flags[] }` | implemented pseudocode: `src/runtime/adapter.ts` に実装済み。provider boundary flags を保持する。 |
| `checkCodexWrapperParity` | `DoctorDeps -> { messages: string[]; ok: boolean }` | implemented pseudocode: `src/doctor/index.ts` に実装済み。Claude hooks が project-settings based であることを検証し、Codex parity は `ut-tdd codex --execute` wrapper lifecycle tests と stdin adapter oracles で提供される。 |
| `catalogSkills` | `CatalogSkillsInput { skill_docs: SkillDocRef[] } -> CatalogSkillsResult extends ContractResult { skills: SkillCatalogEntry[] }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。metadata のみを扱い、source docs は SSoT のままにする。 |
| `recommendSkills` | `RecommendSkillsInput { task; layer; drive; catalog } -> RecommendSkillsResult { recommendations[]; findings[] }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。missing metadata は finding にする。 |
| `buildCommandCatalog` | `BuildCommandCatalogInput { command_docs[]; cli_surface } -> BuildCommandCatalogResult extends ContractResult { commands[] }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。search rows は rebuildable projection。PLAN-REVERSE-395 の as-is CLI 復元により、`commands[]` は `command` (例: `ut-tdd trace impact`)、source path、required/optional args、options、`hasJson` / json alias、expected exit profile (0/1/2/provider-propagated)、category (core/delegation/distribution/feedback) を持つ command registry として扱う。`src/cli.ts` と registrar (`src/cli/delegation.ts` / `src/cli/distribution.ts` / `src/cli/feedback.ts`) が SSoT 生成元であり、`builder catalog` や prose 代表導線だけで完全集合を再構成してはならない。PLAN-L6-64 shell completion はこの registry を入力にし、未登録 command path を候補化しない。 |
| `projectSkillEvaluations` | `SkillEvaluationsInput { asOf?: string } -> void` | implemented pseudocode: `src/state-db/skill-projections.ts` に core 実装、`src/state-db/projection-writer.ts` に既存 public signature の wrapper を保持。skill_invocations + plan_registry から per-skill rating/adoption/success/unused を算出し、cold-start は zero rows。 |
| `projectPocEvaluations` | `PocEvaluationsInput { asOf?: string } -> void` | implemented pseudocode: pure集計coreは `src/projection/domain/poc-evaluations.ts`、meaningful read/store portを結ぶapplicationは `src/projection/application/project-poc-evaluations.ts`、SQLite read/persistは`src/state-db/sqlite-projection-store.ts`、既存public APIの互換facadeは `src/state-db/projection-writer.ts`。summary row は 1 件で、poc_success_rate = confirmed/(confirmed+rejected+pivot)。decided PoC PLANs がなければ zero rows。pivot は non-success。 |
| `projectModelEvaluations` | `ModelEvaluationsInput { repoRoot: string } -> void` | implemented pseudocode: repository opt-in adapterは`src/projection/adapters/model-evaluation-config.ts`、application/pure計算は`src/projection/application/project-model-evaluations.ts`と`domain/model-evaluations.ts`、grouped SQLite read/persistは`src/state-db/sqlite-projection-store.ts`、旧public facadeは`projection-writer.ts`。.ut-tdd/config/model-opt-in.yaml (enabled:true) で opt-inする。per-model success_rate = success_count/run_count、cold-startはzero rows。**cost-efficiency DISCHARGED** (PLAN-L7-57 token telemetry + PLAN-L7-58 cost enrichment): cross-runtime session JSONLからtoken efficiencyを取り込み、published pricingのないmodelはcost=nullのまま捏造しない。分子=全model run token/cost、分母=PLAN成功数の意図的な非対称を維持する。取り込みは`ut-tdd telemetry scan`。 |
| `projectOperationalMetrics` | `OperationalMetricsInput { computedAt } -> void` | implemented pseudocode: pure policyは`src/projection/domain/operational-metrics.ts`、application event生成は`src/projection/application/project-operational-metrics.ts`、drive/hook/workflow grouped readとpersistは`src/state-db/sqlite-projection-store.ts`、旧rebuild facadeは`projection-writer.ts`。drive成功statusはcompleted/confirmed/documented、threshold 0.8。statusは丸め前の率で判定し、表示値だけ4桁にする。NULL modeはliteral unknownと同じ`unknown` groupへ正規化・合算し、completed過少計上とsignal ID衝突を防ぐ。trouble/blocked/human/retryは0件をpass、非0をwarnとし、0母数をsilent skipせず0としてsignal化する。 |
| `deriveArtifactProgressDecision` | `ArtifactProgressDecisionInput { linkedTestCount: number; dependencyChecked: boolean; openDependencyImpacts: number; recoveryPlanIds?: string[] } -> ArtifactProgressDecision { state: dependency_unchecked/implemented_unverified/verified; color: red/yellow/green; reason: string }` | `src/state-db/projection-writer.ts` に実装済み。pseudocode = dependency unchecked または open impacts があれば red、linked tests なしまたは recovery active なら yellow、それ以外は green。 |
| `projectArtifactProgress` | `ArtifactProgressProjectionInput { graph?: RelationGraphProjection; db: HarnessDb } -> void` | `src/state-db/projection-writer.ts` に実装済み。pseudocode = source nodes を collect し、covered-by test edges を count し、impact_results/recovery PLANs を join し、decision を derive して rebuildable `artifact_progress` rows を upsert する。 |

## 2026-06-09 L6 completion readiness 追補

`analyzeL6Completion` は G6 readiness aggregator である。`freezeInputReady` (status flip 前の G6 audit に trace/substance が ready) と final `ready` (confirmed docs/plans、confirmed L7、G6 PASS 後の L6 completion) を分離する。これは L6 design doc status、各 L6 doc の owning `plan:` reference、各 L6 doc の `pair_artifact`、L6 doc filename による L7 reverse reference、minimum unit-contract substance marker (contract/signature、DbC または oracle、U-* oracle family)、base L6 `kind=design` PLAN status と review evidence、L7 unit-test-design status、G6 gate table row を読む。Post-G6 `kind=add-design` PLAN は add-feature/backfill/review evidence で統制し、base G6 completion を reopen しない。unit oracle は `L7-unit-test-design.md` の U-L6COMP-001..005 とする。

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
| `nextActionForMode` | `(mode: ExecutionMode) => string` | — | mode→judgment-gate guidance (`NEXT_ACTION_BY_MODE` SSoT)。純関数・副作用なし。`ut-tdd status --json` が 6 検出フィールドに `nextAction` を additive 付加する公開契約 (PLAN-L7-84、A-138 ITEM-1、camelCase)。値は先頭 token + 人間可読 (`human-review-required:` / `single-runtime:` / `cross-review-ready:`)、ASCII のみ |
| `isReadOnlyDelegationRole` / `detectWorkingTreeMutation` / `assessReviewSession` / `reviewGuardMessages` / `summarizeStagedReview` (review-guard) | `assessReviewSession({role,before,after}) => ReviewSessionAssessment` 他 | before/after は git status --porcelain 由来の path 配列 (純関数・git/fs 端点なし、I/O は cli の loadChangedFiles/loadStagedFiles) | 委譲レビューの非破壊性強制 (IMP-137、PLAN-L7-85)。read-only (相談/検証 archetype = tl/qa/uiux + review エイリアス) が working tree を変更したら `violation=true` で検知。`ut-tdd <provider> --role <read-only> --execute` が spawn 前後の変更を assess し warning surface (exit 不変=fail-open)、`ut-tdd review --staged` が staged 集合を doctor と共に確認し混入を fail-close。worker/未知ロールは対象外 (誤検知回避) |
| `normalizeModelFamily` | `(raw: string \| null \| undefined) => ModelFamily \| null` | — | family ∈ {opus,sonnet,haiku} or `null` (判定不能・曖昧は fail-close) |
| `evaluateAgentGuard` | `(input: AgentGuardInput, ctx: AgentGuardContext) => GuardDecision` | input.subagent_type 存在 / ctx に `resolveAgentFamily` + `allowRaw` 提供 | `decision.code ∈ {0,2}` を**返す**。`code=2` の exit 実行は hook shim (`.claude/hooks/agent-guard.ts`) の責務 — 本関数は純粋 (process.exit しない)。bypass は `bypassed=true` + message warn |
| `resolveActivePlan` / `recordEvent` / `compressPlanDigest` / `onStop` (session-log) | `session-log.md §3` 参照 | — | **fail-OPEN** (常に 0、guard と逆)。`compressPlanDigest` は純関数・idempotent。詳細は `session-log.md` (PLAN-L6-03 add-design 差分) |

### §1.3 schema / plan / vmodel / doctor 連携

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

PLAN-L7-363 以降、`appendGateRun` は `writeGateRunEvidence` として CLI 判定後に必ず呼び出される。
判定結果そのものは `evaluateGateReview` + `evaluateStaticGate` の合成であり、証跡書込の失敗は gate
exit code を変えない。証跡 JSON は `.ut-tdd/gate_runs/<gate>-<timestamp>-<hash>.json` に append され、
`schema_version`、`gate_run_id`、`gate_id`、`timestamp/checked_at`、`plan_id`、`session_id`、
`mode`、`review_kind`、`worker_model`、`reviewer_model`、`checklist_path`、`coverage_summary_path`、
`command`、`checks[]`、`messages[]` を持つ。`plan_id` は `--plan`、`UT_TDD_PLAN_ID`、current-plan/branch
推定の順で解決する。

`rebuildHarnessDb` は `.ut-tdd/gate_runs/*.json` を読み、既存 `gate_runs` 列
(`gate_run_id/gate_id/plan_id/status/checked_at/evidence_path`) と `workflow_runs`
(`workflow=routine-gate`, `phase=<gate_id>`) へ投影する。`projectRetryEvents` は同一
`(plan_id, workflow, phase)` の複数 workflow row を retry として検出する。`gate-run-coverage` doctor
check は workflow row に対応する gate row 欠落、orphan gate row、plan_id 空の gate row、壊れた gate
evidence JSON を fail-close で検出する。

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

### §2.4 `sprint check` (FR-02、TDD Red-first 検査)

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

### §4.3 自動 enroll pseudocode

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
| **L7.7** | L7 closure module surface (workflow/session/cutover/review/skill/asset 等) | schema | 実装済 (`src/workflow/`、`src/handover/`、`src/runtime/`、`src/skill-engine/`、`src/assets/`、CLI surface) |

> 各 Sprint = TDD Red-first (L7 entry、§1.10 line 671)。先行 ④ 単体テストコードは L7 単体テスト設計 (pair) の U-* に対応。

## §6 carry → edge-case (L6) / L7 実装

- 各関数の `@edge-*` docstring per-function 確定 = [edge-case.md](./edge-case.md) (IMP-014、internal-processing §7 枠を展開)
- signature の TS 実体化 + DbC docstring 転記 = L7 (parent_design = 本 doc)
- pseudocode (§2/§4.3) の実装 = L7 各 Sprint
- DbC → U-* test oracle 導出 = L7 単体テスト設計 (pair、document-system-map §3)
- **G6 freeze**: 本 doc の signature + pseudocode + 型 + WBS を G6 で凍結 (L7 の parent_design 正本)
## Appendix B: BR-21 評価 trace coverage 追補

BR-21 evaluation hooks は Phase B oriented だが、L4/L5 module boundaries がそれらを名指した時点で function-design trace は L6 を skip してはいけない。この追補は現行 evaluation surfaces の L6 contract landing points を記録する。詳細な algorithm expansion は担当する Phase B PLAN に残す。

| trace | L6 contract landing |
|---|---|
| FR-L1-36 | skill evaluation input は Learning Engine aggregation 前に skill metric feedback として normalize する。 |
| FR-L1-38 | model evaluation input は recommendation updates 前に model/effort quality feedback として normalize する。 |
| FR-L1-43 | PoC success measurement input は recipe/risk aggregation 前に verification outcome feedback として normalize する。 |

## Appendix C: L7 clean checkout DB projection 不変条件

clean checkout では、`harness-check` が tests の前に deterministic `db rebuild` を実行しなければならない。ignored local session logs が無い場合、projection layer は tracked provider handover evidence から `hook_events` を導出する。また persistent `.ut-tdd/harness.db` が無い場合、`ut-tdd skill suggest --json` は source から read-only in-memory DB を rebuild しなければならない。

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

共通 invariant: `analyzeDriveDbRegistration` は純粋関数 (DB アクセスは呼び出し元の `checkDriveDbRegistration` が担う)。必須 mode 集合はハードコード定数を廃止し (PLAN-L7-243)、stats 収集側が plan_registry (route_mode 正本 + legacy フォールバック、`src/schema/mode-catalog.ts` の `workflowModeForPlan`) から導出した `expectedModes` を突合する。`docs/process/modes/` の mode doc に `MODE_CATALOG_DOC_FILES` 写像が無い場合は `mode_catalog_unmapped` で fail-close する (新 mode 追加の取りこぼし防止)。legacy stats (expectedModes 未提供) のみ `LEGACY_REQUIRED_MODES` (`Discovery/Forward/Recovery/Reverse/Verification`) で従来水準を維持。orphan 検査は stats フィールドの正値チェックで行い、DB クエリを直接発行しない。

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

### D.6 `src/state-db/guardrail-invariants.ts` + guardrail advisory projection 追補 (PLAN-L7-52 C-1 option C, 2026-06-15)

parent PLAN = PLAN-L7-48 / PLAN-L7-52。L7-48 監査で唯一の機能リスク = guardrail 不変条件が本番経路で参照されない silent bypass。PO 承認の **option C (warn-first / 非ブロック)** を実装。不変条件ロジックを `src/state-db/guardrail-invariants.ts` に SSoT 抽出し、書込経路 (fail-close) と projection 経路 (warn-first) が共有する。state-db 配置は `guardrail ↔ state-db` の module cycle 回避のため (dependency-drift gate)。`src/guardrail/ledger.ts` は型と `inspectGuardrailInvariants` を re-export。

| 関数 (実 export) | signature | pre | post |
|---|---|---|---|
| `inspectGuardrailInvariants` | `(input: GuardrailDecisionInput) => GuardrailInvariantInspection` | 純粋関数; fs/DB アクセスなし; `isSecretLike` (state-db/index、SECRET_PATTERN SSoT) のみ参照 | `violations[]` を返す: ① `evidence_path` が secret 様 → `secret-evidence`、② `reviewer_model` と `worker_model` が両方定義済かつ一致 → `same-model-self-review` (空文字/undefined は非該当 = blank を self-review と誤判定しない)、③ `decision==="human-required"` かつ `evidence_path` 空 / `human_signoff_required` かつ `evidence_path` 空 → `human-required-without-evidence`。`normalizedDecision` は `normalizeDecision(input)` の結果 (self-review / human-required-without-evidence は `block`)。**書込経路と projection 経路の唯一の正本**。SECRET_PATTERN は各プレフィックス (sk-/ghp_/github_pat_/xox*) の後に最低 16 文字を要求する (実トークン最短 ~48 文字)。`assertNoSensitivePayload` は PK 列を secret パターン検査から除外する (PK = 構造化 ID、誤検知防止) |
| `recordGuardrailDecision` (ledger.ts) | `(db, input) => GuardrailDecisionRow` | DB 書込端点 | `inspectGuardrailInvariants` を呼び `secret-evidence` 違反があれば throw (fail-close); それ以外は `normalizedDecision` で `guardrail_decisions` に upsert; `block` 時は `findings` に `guardrail-block` (warn) を記録 |
| `projectGuardrailInvariantAdvisories` (projection-writer.ts) | `(db) => void` | `rebuildHarnessDb` 内で `projectReviewEvidenceRegistry` の後に呼ぶ (= CLI 再構築時、**非 API 前提に整合**); committed `review_evidence_registry` 行を読む | 各行を `GuardrailDecisionInput` (空 model は `undefined` 化) に写像し `inspectGuardrailInvariants` で検査; 各 violation を **非ブロックの advisory finding** (`kind=guardrail-invariant-advisory:<rule>`, severity=`warn`, source=`guardrail-invariant-advisory`) として `recordFinding`。subject は `advisorySubject(rule, reviewEvidenceId)` = `guardrail-self-review:<rule>:<sha1(12)>` で **plan-id-free** (readiness の `subject_id LIKE '%plan_id%'` に非合致 → automation readiness を flip しない); 追跡用 plan 参照は `evidence_path` に保持 (readiness は evidence_path を走査しない)。projected decision は不変 |

invariant: option C は authz outcome を一切変えない (advisory のみ)。実ブロックする **hard-gate (option A)** は authorization/human-signoff の仕様確定に該当し PO 留保 (CLAUDE.md Guard Rule)。advisory は warn-first phased rollout の Phase 0 (descent-obligation §7 と同型)。U-* = IT-GUARDRAIL-ADVISORY-01。`same-model-self-review` の空文字非該当は blank evidence の false-positive を防ぐための必須不変条件。

## 2026-06-17 コスト階層 Dual-Provider Role Router 追補 (PLAN-L7-75 back-fill)

この addendum は §7.8.7.1 (hybrid 機能分散 MUST) / §1.8 (VALID_ROLES) / FR-L1-39 (classifyTask) を
L6 機能契約へ降ろし、PLAN-L7-75 で実装した `src/task/tier-router.ts` の Forward 設計を back-fill する
(drive=agent / kind=impl の bottom-up 実装に対する設計同期)。役割をコスト階層 (T0/T1/T2) × 2 provider
(claude/codex) で配置し、原則安く・上位帯は明示許可ゲートに保つ。task module 配下に置き、`task→team` の
import edge を一方向 (acyclic) に保つ (cycle 回避は dependency-drift gate が機械強制)。

3 archetype (役割の根本種別): **相談 (consult)** = tl/uiux (上位帯エスカレーション・プランナー、read-only)、
**ワーカー (worker)** = se/docs (実装・文書、下位帯)、**検証 (verify)** = qa (テスト通過後カバレッジ相談、上位帯)。
ティア表 `TIER_TABLE`: T0 = `{claude: claude-opus-4-8, codex: gpt-5.5}` (フロンティア/明示許可)、
T1 = `{claude: claude-sonnet-4-6, codex: gpt-5.4}` (ワーカー専門)、T2 = `{claude: claude-haiku-4-5,
codex: gpt-5.3-codex-spark}` (ワーカー軽量)。

**モデル id 単一正本 (`MODEL_IDS`、PLAN-L7-58 carry 解消)**: model id 文字列の正本は `src/team/model-policy.ts`
の `MODEL_IDS` カタログ 1 箇所であり、`TIER_TABLE` (tier-router) と `modelForProvider` (model-policy) は
両方ともこの catalog を参照して合成する。従来は両者が同じ id literal を二重に持ち typo/drift の温床だった。
`MODEL_IDS.codex.frontier` = `gpt-5.5` (= `TIER_TABLE.T0.codex` = `modelForProvider` "frontier" family) のように
1 値 1 定義へ収束させた。oracle U-MODELID-001..004 が「合成一致」と「生 literal 不在」を fail-close で検査する
(価格表 `src/state-db/token-tracker.ts` は外部 pricing 由来の superset で別正本、統合対象外)。

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

### 2026-07-01 model / effort routing 追補

PO 追加指示により、`src/team/model-policy.ts` は difficulty だけでなく task intent を deterministic に導出する。
intent は `docs` / `research` / `implementation` / `lightweight` / `review` / `uiux` / `general` の 7 値で、
role・engine・task text から推定する。これは provider 配置そのものを無制限に上書きするものではなく、
既存の cross-provider router (worker=creation、consult/verify=judgement、T0 明示許可) の上で、
選ばれた member の model/effort 既定を決める policy である。

モデル系統の既定:

- docs 系: Claude Sonnet 系を優先する。
- research 系: Claude Haiku 系を優先する。
- implementation 系: GPT/Codex 系を優先する。
- lightweight 系: GPT/Codex の spark / mini lane を使い、並列 shard で閉鎖権限を持たせない。
- design / implementation review: T0 reviewer として GPT frontier (`gpt-5.5`) または Claude Opus (`claude-opus-4-8`) 以上を明示許可ゲート付きで使う。
- UI/UX 系: Claude Sonnet 系を優先し、effort は `xhigh` とする。

effort 既定:

- Claude 系は `high` を標準にする。
- GPT/Codex 系は `middle` を標準にする。
- review / critical judgement は一段上げ、GPT frontier review は `xhigh`、Claude/Opus review は `high` とする。
- spark / mini など軽量モデル lane は `high` を標準にする。
- UI/UX は `xhigh` を指定する。

`ReasoningEffort` は後方互換の `medium` を残しつつ、PO 語彙の `middle` と `xhigh` を追加する。
team proposal lane の mini/spark は `effort=high` で生成し、review aggregator は `high`、critical aggregator は
`xhigh` を使う。oracle: U-TEAM-MODEL intent / effort tests、U-TEAM launch proposal lane effort tests。

## 2026-06-19 skill suggest free-text surface 追補 (A-138 ITEM-2)

FR-L1-12 (`suggestSkillInjection`) / FR-L1-47 (`recommendSkills`) の公開 CLI `ut-tdd skill suggest` は
従来 `--plan <id>` (harness.db `plan_registry` 文脈) のみだった。**additive 拡張** (cross_agent TL/Codex 裏取り済)
として **`--text <自由文>`** を足し、未登録タスクからも suggest 可能にする。

- `recommendSkillsForText(db, taskText)`: `classifyTask` (FR-L1-39) で kind/drive/risk を導き、
  synthetic `SkillScoringContext` (`layer=""` / `workflowMode = workflowModeForKind(kind)`) を作って
  PLAN 版と同じ `rankSkills` に通す。`scoreSkill` は `SkillScoringContext` (layer/drive/workflowMode) を取り、
  PLAN 版・text 版で共有 (重複排除)。`reference` は `text:<slug>` sentinel。
- **契約不変**: 既定出力は現行 flat ranked rows (rank/score/reason) を維持。
  `--plan` / `--text` は **相互排他** (どちらか一方必須、両方/無は exit 1)。`--record` は **`--plan` 専用**
  (未登録 text を DB へ書かない、fail-close)。後方互換: 既存 `--plan` 呼び出し・既定出力は不変。
- **3-bucket 出力 (`--buckets`、A-138 ITEM-2 PO 残課題 → PO「TL 結果に合わせる」で確定)**: flat ranked rows を
  `bucketRecommendations` で **required / recommended / optional** に再編成する **additive view**。score band を正本と
  する閾値 `SKILL_BUCKET_THRESHOLDS` = required ≥ 0.8 (layer+drive_model 双方一致 = gate/workflow 直結) /
  recommended ≥ 0.5 (品質寄与) / それ未満 = optional (補助)。`--buckets` 無指定時は flat (既定不変)。
  TL(Codex) 素案の bucket 名・意味論を採用、閾値は scoreSkill の加点設計に対応。oracle: skill-recommend
  bucketRecommendations test。
- `skills→task` import は一方向 (dependency-drift cycles 0)。oracle: `tests/skill-recommend.test.ts`
  (recommendSkillsForText の flat-list + risk reason)。`workflowModeForKind`: reverse→Reverse / poc→Discovery /
  refactor→Refactor / troubleshoot→Recovery / verify→Verify / それ以外→Forward。
## 2026-06-23 dynamic skill injection materialization 追補 (PLAN-L7-135)

FR-L1-12 / FR-L1-47 は recommendation row だけでは close しない。runtime contract は 2 step とする。

- `buildSkillInjectionSet(db, recommendations, { generatedAt? })` は `SkillInjectionSet { plan_id, generated_at, entries[], required_paths[], optional_paths[], missing_skill_ids[] }` を返す。entry は `skill_id`、`skill_path`、`tier` (`required|recommended|optional`)、`inject_at` (`before_work|on_demand`)、`reason`、`rank`、`score` を持つ。
- `buildAdapterPlan(intent, mode)` は `contextInjection` を受け取り、scoped path を `UT-TDD context injection` 配下の provider stdin へ append する。Codex と Claude は同じ adapter contract を共有する。argv は fixed command flag のままとし、prompt body や skill body は持たせない。

CLI wiring:

- `ut-tdd skill suggest --plan <id> --inject --json` は、`--record` も存在する場合を除き DB row を書かず manifest を出力する。
- `ut-tdd codex|claude --plan <id> ...` は `harness.db` projection から skill injection を解決し、adapter plan へ渡す。
- `ut-tdd team run --plan <id> ...` は同じ injection をすべての runtime member adapter へ渡し、worker/reviewer provider separation を維持する。
- `ut-tdd task route --plan <path> --execute` は PLAN file から `plan_id` を抽出し、同じ injection manifest を解決し、cost-tier routing 後に `routeToAdapterPlan(..., { contextInjection })` 経由で渡す。

## 2026-06-23 Linux/POSIX wrapper readiness 追補

runtime entrypoint は TypeScript/Bun first のままとし、OS wrapper は thin に限る。`scripts/ut-tdd` は Linux/POSIX `sh` entrypoint である。これは `set -e` を有効化し、compiled binary が存在する場合は `dist/ut-tdd` を実行し、それ以外は `bun run "$ROOT/src/cli.ts" "$@"` へ fallback する。wrapper は Bash-only syntax、Python runtime dispatch、legacy runtime name を導入してはならない。

`ut-tdd codex|claude --plan` の dynamic skill context injection は runtime startup 時の opportunistic 動作とする。current working tree が harness DB projection を rebuild できない場合、例えば hook/adapter smoke test 用 temp repo では、adapter execution は `UT-TDD context injection` block なしで継続する。task prompt と lifecycle digest は通常通り完了する。missing injection は adapter launch failure ではなく absent context として観測可能にする。

## 2026-07-01 上位モデル advisor command 追補

`src/team/advisor-policy.ts` は、Sonnet-class Claude または下位 GPT/Codex model が
orchestrator で、判断に迷う場合に上位モデルへ相談するための deterministic policy である。
公開 CLI は `ut-tdd advisor` とし、既定は dry-run adapter plan、`--execute` 指定時だけ
provider CLI を起動する。

| 関数 / CLI | signature / command | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `buildAdvisorDecision` | `(input: AdvisorInput) => AdvisorDecision` | `task` と `mode` がある。`provider` は未指定可。 | `provider`、上位 `model`、`effort`、`task_intent`、`adapterPlan` を返す。 | Claude advisor は Opus (`claude-opus-4-8`) + `high`、Codex advisor は GPT frontier (`gpt-5.5`) + `xhigh`。下位 orchestrator からの相談は `current_model_lower_than_advisor=true` で surface する。 | U-CLI-ADVISOR dry-run / execute |
| `ut-tdd advisor` | `--task/--task-file`, `--provider`, `--current-model`, `--reason`, `--plan`, `--mode`, `--execute`, `--json` | `--task` と `--task-file` は相互排他。`provider` は `claude` / `codex` のみ。 | dry-run では adapter plan JSON を返す。`--execute` では既存 adapter 実行と同じ session logging を通して provider を起動する。 | advisor は read-only judgement prompt であり、file edit や gate close を主張しない。 | `tests/cli-surface.test.ts` |

## 2026-06-23 artifact progress workflow trigger 追補

`deriveArtifactProgressDecision(input)` は static test link だけでなく test-run と dependency-check evidence を使う。

- `red`: dependency check が missing、または open dependency impact が残っている。
- `yellow`: recovery が active、linked test がない、または linked test はあるが passing `test_runs` row が接続されていない。
- `green`: 1 件以上の linked passing `test_runs` row が存在し、dependency impact が clean と確認されている。

`projectArtifactProgress(db, graph)` は file-backed source/design/test-design/plan/requirement node を project する。これは `dependency_check_run_id`、`dependency_checked_at`、`passed_test_run_ids`、`passed_test_run_count`、`recovery_plan_ids` を記録する。projection は rebuildable `artifact_progress_events` row も書き込み、red/yellow row を `source_table="artifact_progress"` 付きで `feedback_events` へ mirror する。これにより workflow routing は DB state から開始できる。

## PLAN-L6-60 ID 起点 trace impact traversal 追補 (2026-07-08)

| 関数 | signature | 契約 |
|---|---|---|
| `analyzeTraceImpact` | `AnalyzeTraceImpactInput { db; spec_id } -> TraceImpactResult { root?; upstream[]; downstream[]; tests[]; edges[]; findings[] }` | `spec_defs` / `spec_relations` のうち `section_anchor=spec.defines:*` の typed ID 宇宙を読み、指定 `spec_id` の上流・下流・テスト影響を deterministic に返す。document-level の `requires` / `pairs` は artifact graph の責務であり、ID traversal へ混入させない。`traces_from` / `requires` は依存元から影響先へ向きを反転し、`traces_to` / `tests` は宣言方向を影響方向として扱う。unknown ID または空 projection は finding で fail-close し、source docs / PLAN / DB projection source は書き換えない。 |
| `ut-tdd trace impact --id <id>` | CLI read-only command | `analyzeTraceImpact` の結果を text または `--json` で返す。`change-impact.ts` はファイル差分検出、`trace impact` は設計 ID 起点 traversal として責務を分ける。PLAN-L6-61 の RAG 閉包台帳はこの出力契約を入力にできる。 |

## PLAN-L6-61 spec RAG 閉包台帳追補 (2026-07-08)

| 関数 / command | signature | 契約 |
|---|---|---|
| `deriveSpecRagClosureEntries` | `DeriveSpecRagClosureEntriesInput { defs; relations; closureFindings; indexedAt } -> SpecRagClosureEntryRow[]` | `section_anchor=spec.defines:*` の typed spec だけを対象に、要求からテストまでの到達状態を RAG 化する。test を要求する spec が test 到達 0 なら `rag=red` / `closure_status=missing_test`、test 到達済みで typed-spec closure finding があれば `yellow` / `partial`、finding なしなら `green` / `closed`。 |
| `ut-tdd trace rag --id <id> --json` | CLI read-only command | `spec_rag_closure_entries` を DB から読み、text または JSON で表示する。DB row を source doc に逆書きせず、`ut-tdd db rebuild` 済み projection を観測するだけにする。 |

spec RAG と工程 RAG は別の read-model である。`spec_rag_closure_entries.rag` は spec の test 到達と closure finding を表し、`schedule_entries.rag` は工程管理表の進捗・ready 状態を表す。CLI、doctor、detector はこの 2 つを同じ signal として扱ってはならない。

## PLAN-L6-50 ID 単位実行割当台帳追補 (2026-07-09)

| 関数 / command | signature | 契約 |
|---|---|---|
| `deriveExecutionAssignmentLedger` | `DeriveExecutionAssignmentLedgerInput { defs; relations; schedules; existing_assignments; indexedAt } -> ExecutionAssignmentLedgerRow[]` | `spec_defs` の typed spec ID と `spec_relations` の V 字対 / test edge、工程管理表の現在地を入力に、ID 単位の実装・検証・review task row を deterministic に導出する。`assignment_id` は `spec_id + task_kind` から作る stable ID とし、同一入力で row 数・ID・archived 判定が揺れてはならない。 |
| `mergeExecutionAssignmentLedger` | `MergeExecutionAssignmentLedgerInput { derived; existing_authoring_rows } -> ExecutionAssignmentLedgerMergeResult { rows; archived; findings }` | 既存の手動 status/evidence を温存し、新規 ID は planned として追加し、宣言から消えた ID は削除せず `archived` + reason へ退避する。projection や detector は authoring source を書き換えない。 |
| `checkExecutionAssignmentLedger` | `CheckExecutionAssignmentLedgerInput { rows; defs } -> ContractResult` | `done/pass/fail` の evidence 欠落、宣言外 spec、target artifact 欠落、archive reason 欠落、同一 assignment の重複を finding 化する。`done/pass/fail` の evidence は command、PR、path、issue など検証可能アンカーを要求し、「確認しました」だけの自然文はアンカーとして扱わない。 |
| `ut-tdd assignment check --json` | CLI read-only command | authoring source と DB projection を読み、台帳違反を JSON/text で返す。source doc を補完創作せず、実装完了も承認もしない。 |

実行割当台帳は ZIP `assign.py` / `docs/assign.yaml` 相当の HARNESS 翻訳である。PLAN 粒度の
`review_evidence.green_commands` は証跡履歴として残すが、ID 単位の実行・検証対象を代替しない。
検出系は PLAN 粒度 evidence に合わせて台帳を薄めず、typed spec ID と V-pair から導いた実行単位に合わせる。

## Vモデルengine-swap進捗投影契約

### ActiveUpgradeFrontier

`docs/governance/vmodel-upgrade-schedule.md`を唯一のauthoring sourceとし、`plan_id`、`current_location`、`rag`、
`status`、`blocked_reason`を正規化する。separatorは各列3個以上の`-`だけを許可し、RAGは`green/yellow/red`、
statusはschema `VALID_STATUSES`から導出する。表欠落、必須列欠落、空表、重複`plan_id`、空ID、未知enumは入力不正としてfail-closeし、
`CLEAR`へ変換してはならない。`green`かつ非draftだけを完了行とし、`yellow`またはdraftは`IN-PROGRESS`、
`red`はdoctor hard violationとする。DB/roadmapの既存greenはactive upgradeのyellow/redを隠してはならない。

公開関数契約:

- `parseUpgradeFrontier(markdown): UpgradeFrontierEntry[]` — 必須表を検証し、未完行を工程表順で返す。構造不正は例外。
- `upgradeFrontierMessage(entries): string` — 0件のみ`CLEAR`、1件以上は`IN-PROGRESS`を返す。
- `checkRoadmap(repoRoot)` — source欠落/破損/redをhard failure、yellow/draftを可視な進行中として扱う。

### EngineSwapRightArmCoverage

L8〜L14の完了判定はrepository全体の`kind=verify`件数ではなく、frontmatterの`dependencies.parent/requires/references`で
`PLAN-L1-07`または`PLAN-L4-24`を構造的に依存・参照するengine-swap verify PLANだけを対象とする。本文の偶発言及はlinkにしない。`archived`、無関係、draftのverify PLANは
層の完了証拠に数えない。L4-24がdraftなら、全層が存在してもstateは`in_progress`のままにする。
L4-24がconfirmed/completedになるdesign freezeでは、linkedかつ非archivedのL8〜L14 PLANが全層起票済みであることだけを要求し、
下流実行中を許可する。`program_exit_status=accepted`へのprogram accept遷移で初めて、linkedかつconfirmed/completedの
L8〜L14全層をhard gateにする。`program_exit_status=in_progress`では未完層を`IN-PROGRESS`表示し、設計承認とprogram完遂を再結合しない。

公開関数契約:

- `loadRightArmGatePlanningInput(repoRoot)` — verify PLANごとにlayer/status/engine-swap linkを読み取る。
- `analyzeRightArmGatePlanning(input)` — linked active verify PLANだけで不足層を計算し、design statusと整合するstateを返す。
- `rightArmGatePlanningMessages(result)` — draftは`IN-PROGRESS`、完了は`OK`、契約違反は`violation`を返す。

### AdditiveRevisionFreeze

既存confirmed artifactへ意味変更を上書きせず、delta design docは`revision_track=additive`と
`revision_base_artifact=<confirmed base path>`を持つ。verification groupはbase docsだけで既存freezeを集計し、
valid additive revisionを別frontierとして`IN-PROGRESS`表示する。base欠落、base未confirmed、layer不一致は
additive免除を認めず、通常draftとしてbase freezeをfail-closeする。design→test-designの逆参照は既存directory集合参照に加え、
delta同士のexact artifact pathを許可する。

## Vモデル engine-swap L6契約群 (PLAN-L6-70〜77)

### ドメインobject / catalog / profile

- `DocumentDispositionCatalog.create(input): Result<Catalog, CatalogViolation[]>`
- `Catalog.traceSource(sourceId): SourceItemTargetTrace` / `Catalog.unresolved(): CatalogViolation[]`
- `resolveProfile(catalog, selection): Result<ResolvedProfile, ProfileViolation[]>`
- `PlanRevision.create(input): Result<PlanRevision, PlanRevisionError>`
- `PlanAsset.create(input, deps)` / `PlanAsset.reconstruct(revisions)` / `PlanAsset.revise(command)`
- `EvidenceRecord.create(input, issuer?)` / `EvidenceRecord.isUsableFor(subject, policy, now)`

完全constructor/factoryでinvalid stateを拒否し、reviseは旧instance/evidenceを変更せず新asset+eventを返す。
profile解決順はsize baseline→product overlay→explicit overrideで、unknownと同優先度競合をfail-closeする。

### Forward FSM / contract compiler契約

- `ForwardWorkflow.reconstruct(subject, events): Result<ForwardWorkflow, WorkflowError>`
- `ForwardWorkflow.explain(command, context): GuardVerdict`
- `ForwardWorkflow.transition(command, context): Result<WorkflowTransition, WorkflowError>`
- `reduceForward(events): Result<ForwardState, WorkflowError>`
- `VModelContract.create(dto): Result<VModelContract, ContractViolation[]>`
- `compileVModelContract(contract): CompiledContract`

FSM commandはeventだけを返し、current stateはreducerで導出する。compilerは同一rule identityからdetector registry、
doctor definition、roadmap obligationを生成し、source/generated digest drift時は実行前にfail-closeする。

### 文書監査 / semantic assessment / 自己証明

- `captureDocsSnapshot(gitPort): DocsSnapshot`
- `materializeDispositionBatch(command, current): CommandResult`
- `validateDispositionLedger(snapshot, ledger, targetResolver): ContractResult`
- `analyzeDocumentReferences(snapshot, readers): ReferenceClosureResult`
- `evaluateSemanticItem(input, policy): SemanticAssessmentVerdict`
- `routeAssessmentDebt(verdict, routeFilingPort): DebtRouteResult`
- `runSelfProof(request, deps): Promise<SelfProofReport>`

snapshot queryはGit objectからraw NUL path集合を読む。batch commandはselectorを全path recordへmaterializeし、validatorは
selectorを再評価しない。semantic evaluatorはauthored evidenceを照合するだけでverdictを創作しない。meta-verifierは
ProcessRunner/Hasher/ReceiptStoreをport注入し、検査対象detectorのverdict関数をoracleとしてimportしない。

### Projection rebuild application契約 (PLAN-L6-75 / L7-423残DoD)

- `HarnessProjectionSourcePort.load(): HarnessProjectionSourceBundle` はrepository I/Oをadapterへ閉じ込め、bundleにcaptured revision、capturedAt、source digestを必ず含める。application/domainはrepo root、filesystem、YAML、SQLiteを知らない。
- `ProjectionRebuildCommand.rebuild(request): ProjectionRebuildResult` はbundleからpure projector群を順序決定的に実行し、一つの`ProjectionTransactionPort.transaction(session => ...)`内でclear、event、finding、joinをcommitする。失敗時は既存投影を保持し、部分commitを許さない。
- `ProjectionWritePort.writeAll(writes)` は`ProjectionEvent`と`ProjectionFinding`のdiscriminated unionだけを受ける。event/findingの全string fieldは共通payload guardを通り、secret-like値は永続化前に拒否する。列名がprimary keyまたは`*_id`であることだけでは例外にならない。構造IDは、各入力componentをpayload guardで検査した後に内部`ProjectionIdFactory`が生成したbranded `ProjectionId`だけを指す。authoring source、subject、evidence、path、外部IDをcastして`ProjectionId`に昇格すること、または任意文字列をID列へ移して検査を回避することを禁止する。
- 旧public `recordFinding` が残る移行期間も、adapterはfindingを`ProjectionWrite`へ正規化して同じpayload guardとwrite sessionへ委譲する。guard拒否時はrow、join findingとも0件であり、direct upsert、field別のguard省略、secretを含む任意IDの例外を許可しない。
- pure projectorは`projectX(bundleSlice, context): readonly ProjectionWrite[]`であり、DB/FS/clock/cryptoをimportしない。時刻・`ProjectionIdFactory`はimmutable `ProjectionContext`から注入する。固定bundleのwrite列、順序、digestは再実行して同一である。bundleの`capturedRevision`、`capturedAt`、`sourceDigest`は各入口で欠落・空文字・別capture混在を拒否し、HEAD名だけをworking-tree内容のrevision証明として流用しない。
- CLI、doctor、drive rebuild fallbackはcomposition rootとしてsource adapter、SQLite transaction store、clockを注入する。全consumer移行後にのみ旧`projection-writer.ts`を削除し、互換facadeを完了の代用にしない。

### DTO / error / finding / exit 契約

| 型 | 必須field | 不変条件 / error |
|---|---|---|
| `PlanAssetInput` | `assetId`, `alias`, `initialRevision`, `canonicalPayload`, `dependencies[]` | 空ID、重複dependency、revision≠1、payload digest不一致は`PlanAssetError` |
| `RevisePlanCommand` | `assetId`, `baseRevision`, `changeSet`, `actor`, `reason` | base≠latest、空reason、identity変更は拒否 |
| `EvidenceInput` | `evidenceId`, `evidenceKind`, `subjectId`, `subjectRevision`, `sourceCommit`, branded `commandArgs`, kind別typed `claims`, `outputDigest`, `exitCode`, typed `producer`, `producedAt`, `expiresAt?`, `supersedesEvidenceId?` | claimsを含むrecord digestをcanonical fieldから内部生成する。issuerがある場合はauthority/key version/producer/record digestを長さprefix frame化してattestationを発行する。非0 exitと未署名recordも監査用recordとしてvalid |
| `EvidencePolicy` | `policyId`, `revision`, `requirements[]`（各要素=`requirementId`, `requiredKind`, `minCount`, `maxCount?`, `acceptedProducers[]`, `exitRule`, typed `claimsRule`）、`maxAge?`、composition root固定`EvidenceAttestationVerifierPort` | 全nested ruleをdefensive copy/deep freezeする。trusted verifierがauthority/key/producer binding/署名を検証したrecordだけをfrontier候補にする。未署名・署名不正、別kind/revision/commit、期限切れ、producer外、exit/claims不適合を件数へ数えず、requirement別eligible/rejected IDをstable順で返す |
| `WorkflowCommand` | `subjectId`, `expectedFrom`, `to`, `actor`, `reason?`, `evidenceIds[]` | 許可表外、sequence不整合、guard不足は`WorkflowError` |
| `WorkflowContext` | `subjectRevision`, `events[]`, `evidence[]`, `now`, `policyRevision` | event/evidenceが別subjectならfail-close |
| `VModelContractDto` | `revision`, `layers[]`, `gates[]`, `pairs[]`, `exceptions[]`, `evidencePolicies[]`, `defectRoutes[]` | exactly-once、未知参照、理由なし例外は`ContractViolation[]` |
| `DocsSnapshot` | `commit`, `treeOid`, `trackedCount`, `pathSetSha256`, `pathStreamAlgorithm` | algorithmは`git-ls-tree-z-v1`、working tree値で代替禁止 |
| `DispositionRecord` | `path`, `blobOid`, `zone`, `disposition`, `reason?`, `targets[]`, `planIds[]`, `impactTags[]`, `applicationStatus` | conditional field不足は`DispositionFinding` |
| `SemanticAssessmentInput` | `itemId`, `sourceRevision`, `applicability`, `designEvidence[]`, `runtimeEvidence[]`, `testEvidence[]`, `review`, `debtRoute?` | verified 3面、gap route、conditional理由を強制 |
| `SelfProofRequest` | `contractRevision`, `sourceHash`, `compiledHash`, `rules[]`, `fixtures[]`, `mutations[]`, `surfaces[]` | rule/fixture/mutation/surface identityを重複なく1回ずつ定義 |
| `SelfProofDeps` | `processRunner`, `sourceHasher`, `receiptStore`, `clock` | detector verdict関数をdependencyとして受け取らない |

#### catalog / profile / migration DTO詳細

| 型 | 必須field | ordering / finding |
|---|---|---|
| `CatalogInput` | `manifestIdentity { auditedOn, zipSha256 }`, `declaredCounts`, `sources[]`, `items[]`, `categories[]`, `metaSourceMappings[]`, `sourceItemEdges[]`, `sourceTargetEdges[]`, `itemTargetEdges[]` | manifest provenance表の`audited_on`+`sha256`をそのまま使用しrevisionを創作しない。stable ID昇順でcanonical digestを作る。件数不一致=`catalog-count-mismatch` |
| `CatalogSource` | `sourceId`, `ordinal`, `sourceTitle`, `disposition`, `targetRef`, `reason`, `rowDigest`, `manifestDigest` | ordinalはsource IDからだけ導出。ID/ordinal重複=`catalog-source-duplicate`、判断/reason欠落=`catalog-disposition-incomplete` |
| `CatalogCategory` | `categoryId`, `categoryName`, `rowDigest` | authoringにないordinal/revisionを生成しない。ID重複=`catalog-category-duplicate` |
| `MetaSourceMapping` | `metaSourceRef`, `allowedSourceStatus`, `sourceFilePolicy`, `reason`, `rowDigest` | item sourceが109 source外の場合の唯一のtyped endpoint。status/file policy不一致をorphanとして拒否 |
| `CatalogItem` | `itemId`, `itemName`, `categoryId`, `sourceStatus`, `sourceRef`, `sourceFile`, `rowDigest` | category/source edge欠落=`catalog-orphan-edge` |
| `SourceItemEdge` | `edgeId`, `sourceId`, `itemId`, `sourceStatus`, `sourceFile`, `rowDigest` | edgeIdは`sourceRef,itemId`のframed digestだけから導出し、reasonを創作しない |
| `SourceTargetEdge` | `edgeId`, `sourceId`, `targetType`, `targetRef`, `disposition`, `rowDigest` | targetType=`plan_alias|artifact_family|artifact_path|target_slot`。source targetはitem targetのdefaultではない |
| `ItemTargetEdge` | `edgeId`, `itemId`, `targetStatus`, `reason`, `sourceDigest`, `targetKind?`, `targetRef?`, `planId?` | targetKind=`artifact_path|artifact_family|plan_alias|target_slot`。runtimeでsource→targetを継承・推論しない。pendingはtarget禁止、adopt/merge/reference/deferのtarget欠落=`catalog-item-target-incomplete` |
| `DocumentProfileDecision` | `decisionId`, `profileId`, `docTypeId`, `decision`, `detailOverride`, `statusOverride`, `reason`, `rowDigest`, `requiredPlanId?` | semantic itemへmapしない。conditional/skip/deferはreason必須、deferはPLAN必須 |
| `DocumentProfile` | `profileId`, `profileAxis`, `profileRank`, `description`, `defaultStatus`, `defaultDetail`, `scopePolicy`, `rowDigest` | profile master全fieldをround-tripし、decision rowをmaster代用にしない |
| `DocumentProfileCatalogInput` | `sourcePath`, `sourceDigest`, `profiles: DocumentProfile[]`, `decisions: DocumentProfileDecision[]` | strict loaderの単一出力。profile/decision IDとFKをcreate前に検証 |
| `DocumentProfileCatalog.create` | `(input: DocumentProfileCatalogInput) -> Result<DocumentProfileCatalog, CatalogViolation[]>` | master全field/entryをlossless保持。unknown enum/FK/duplicateをfail-closeしresolverへvalid aggregateだけ渡す |
| `ProfileSelection` | `sizeProfileId`, `productProfileIds[]`, `explicitDecisions[]`, `capabilityFlags[]` | product IDはstable昇順、同precedence同slot異値=`profile-overlay-conflict`、同値duplicateもidentity重複で拒否 |
| `ResolvedDocumentDecision` | `docTypeId`, `decision`, `detail`, `status`, `reason`, `winningDecisionId`, `appliedDecisionIds[]`, `requiredPlanId?` | core/security detailを弱化しない。required slot欠落=`profile-decision-missing` |
| `ResolvedProfile` | `selectionDigest`, `decisions: ResolvedDocumentDecision[]`, `applicationReceipt[]`, `findings[]` | size→stable product→explicitの適用順をreceiptへ保持し、未定義をdefault生成しない |
| `LegacyPlanDto` | `repositoryIdentity`, `sourcePath`, `legacyPlanId`, `knownFrontmatter`, `unknownFrontmatter`, `bodyDigest`, `sourceCommit` | field loss=`plan-migration-loss`、numeric core衝突=`plan-migration-collision`。unknown fieldもcanonical payloadへ保持 |
| `LegacyPlanMigrationDecision` | `migrationId`, `legacyPlanId`, `assetId`, `decision`, `resolvedAlias?`, `collisionGroup?`, `lossFields[]`, `reason`, `reviewPlanId?` | assetIdはfull IDから必ず生成。ambiguous/lossはresolvedAliasを自動選択禁止 |

legacy `asset_id`は初回migration時だけ、UTF-8 length-prefixed frame
`["ut-tdd-plan-legacy-v1", repositoryIdentity, legacyPlanId]`のSHA-256から
`plan:legacy:<64 lowercase hex>`として決定する。各frameは`uint32 big-endian byte length + bytes`、文字列はNFCであることを
検証して非NFCを拒否し、UTF-8 bytesを勝手に正規化しない。`repositoryIdentity`はroot tracked正本
`ut-tdd.project.json`の`schema_version=ut-tdd.project/v1`、`repository_identity`に明示するcase-sensitive owner/name
（本repo=`unison-ai-product/UT-TDD_AGENT-HARNESS`）だけを読み、Git tracked blob/HEAD receiptを検証してremote URLから推測しない。
config不在またはcallerが明示したfork identityとの不一致は`plan-repository-identity-missing`として明示入力を要求する。
validなHEAD tracked configはremote有無に関係なく成功し、config欠落時もremote URLからidentityを補完しない。
checkout path、branch、`.git` suffix、layer、ordinal、source pathを入力にしない。
生成後はledgerの`asset_id`を正本とし、rename/layer変更で再計算しない。frame algorithm/version、入力値、digestを
`legacy_plan_migration_events`のtyped columnとrevision payloadへ記録する。

`loadTrackedProjectIdentity({bytes,receipt,expectedRepositoryIdentity?})`は固定path、Git object format、HEAD commit、
blob OID、raw content SHA-256をpureに照合し、`repositoryIdentity`と`receiptDigest`を返す。
`loadProjectIdentityFromHead({repoRoot,expectedRepositoryIdentity?})`だけがGit adapterとしてHEAD regular blobを読む。
index/working tree/remoteを正本にせず、config schema不正、identity文法不正、provenance不一致をそれぞれ
`plan-project-config-invalid`、`plan-repository-identity-invalid`、`plan-repository-identity-provenance-invalid`で分離する。
identityはtrim一致・NFC・exactly one slashのASCII owner/nameとし、`.git` suffixを拒否する。

v1/v2 parserは`schema_version=ut-tdd.plan/v2`の有無でdiscriminated unionにし、v1 unknown frontmatter key、
本文digest、依存・artifact・review evidenceを落とさない。short aliasはexact full IDを先に照合し、prefix候補が2件以上なら
候補をstable順で返す`plan-migration-collision`とし、最初の候補を選ばない。現HEADのcollision 27群/55 PLANは
`legacy_plan_migration_events`へexactly once materializeする。full legacy IDからのasset IDはcollisionに関係なく生成し、
判断未確定行は`resolvedAlias=NULL`+`reviewPlanId`必須とする。

legacy migration applicationは`observe` / `decide` / `revise`のdiscriminated commandと純粋reducerを正本にする。
初期状態へ許されるのは`observe(pending)`だけで、既存streamへ`observe`を重ねない。`decide`はpendingから
`migrated|rekeyed|rejected`へ1回だけ進め、`revise`はterminal decisionから別decisionへ明示的review証跡付きで進める。
全commandは`expectedSequence`と`expectedDecision`を持ち、不一致は`plan-migration-state-conflict`として行増加0にする。
event列はsequence連続、first=`observed`、以後`decided|revised`、occurredAt非減少、legacyPlanId/assetId/repository identity/
identity algorithm+input+digest/source digest不変を全step replayで検査する。

decision field matrixは次を完全表とし、applicationとDDLの両方で同じ契約を強制する。

| decision | resolvedAlias | collisionGroup | lossFields | reviewPlanId | reason |
|---|---|---|---|---|---|
| `pending` | NULL | 衝突時必須 | 空可 | 必須 | 非空 |
| `migrated` | full legacy aliasと一致 | NULL | 空 | NULL | 非空 |
| `rekeyed` | legacy aliasと異なるcanonical full alias | 必須 | 空 | 必須 | 非空 |
| `rejected` | NULL | 任意 | 1件以上 | 必須 | 非空 |

`observe`はmigration stream/current/receiptだけをatomic appendし、derived asset identityを参照しても
`plan_assets`や架空revisionを生成しない。`decide(migrated|rekeyed)`だけがPlanAsset revision 1、canonical payload、alias event/current、
migration event/current、global receiptを1 transactionでappendする。`rejected`はPlanAsset/revision/aliasを生成しない。
このためpending/rejected eventの`asset_id`はidentity-derived valueとして保持するがPlanAsset FK対象にせず、terminal adopted targetは
nullable `(target_asset_id,target_revision)` composite FKで実在revisionへ束縛する。canonical payloadはsourcePath/sourceCommit、
frontmatter/body/unknown field digest、inventory digest、identity receiptをlosslessに保持する。

global receiptはmigration eventと双方向exactly-oneで、subject=`legacy_migration(legacyPlanId)`、result=`migration_event`、
command type=`migration.observe|decide|revise`、payload digest、result ref、recordedAtがeventと一致する。event-only/current-only/
receipt-only streamはすべて`plan-ledger-unavailable`とし、reducer replayとprojectionの集合差を許さない。
各insert境界のfault injection、2 writer競合、file reopenでtransaction delta 0または同一digest stateを証明する。

`LegacyMigrationDryRun.run(repoRoot)`はsource commitのtracked PLAN全件とdecision manifestをexactly-onceで結合し、
`total=emitted`、legacy ID一意、decision field matrix、collision manifestの欠落・余剰・group不一致を検査する。
各recordはsource path/commit/blob OID/content digest、delegation targetを持ち、reportはinventory/report digestを返す。
完了PLANの`generates`はHEADの非空fileまたは配下に非空blobを持つdirectory familyへ突合する。
snapshotは`commit:path`から取得した実blob bytesで再検証し、working tree再hashやreport内自己比較を証拠にしない。
role delegationは`vmodel-role-contracts.md`の7 role全単射をHEADからstrict loadし、既存slotを
`role + slotLabel + contractRef`へlossless projectionする。target slotはHEAD item ledgerとHEAD document catalogを
`resolveCanonicalTarget`で照合する。未知role、contract欠落、slot欠落はglobal findingとしてfail-closeする。

canonical JSONはobject keyをUTF-8 bytewise昇順、array順序保持、numberはsafe integer、stringはNFC検証済みUTF-8、
boolean/nullをそのままframe化し、空白を持たない。YAML tag、anchor、merge key、非string map key、safe integer外numberは
lossless変換不能として`plan-migration-loss`にする。未知fieldは`unknownFrontmatter`のcanonical JSONと元frontmatter digestを
両方保持し、値をstring化しない。`EvidenceRecord.isUsableFor`はsubject/revision/commit、kind、producer、expiryとpolicy固有の
`exitRule/expectedExit`を照合する。非0 exitはRed policyでusableになり得るが、Green/accept policyではusable=falseにする。
record自体は削除しない。`claims`はRedのexpected/observed findingとtodo/skip、runner/test、trace orphan/stale、review verdict/reviewer、gate failure、acceptance/retention decision、exception actor/reason/resume/replacementをkind別discriminated DTOで保持し、`outputDigest`や自由文から意味を逆推定しない。supersessionは同subject/revision/kindの全履歴からactive frontierを作り、orphan/cycle/forkをfail-closeする。producer値域はcontract registryから読み、未知producerを
記録時finding、accept時fail-closeとする。argvはsecret-scan/redaction port通過後の値だけを保存する。
`recordDigest`は保存recordの改ざん検出でありproducer真正性ではない。真正性は`evidence-attestation/v1`のHMAC-SHA256 attestationをcomposition root固定のtrusted verifierで検証し、unknown authority/key、producer binding不一致、署名不一致、未署名をfail-closeする。issuerとverifierは別capabilityとし、verifierに発行surfaceを持たせない。kernelのfinal verifierだけがmodule-private WeakMapへcanonical verify closureを登録でき、policyはその非偽造capture以外を拒否する。公開register、caller供給のallow-all verifier、`attested=true`の自己申告は契約外とする。

全append commandは`commandPayloadDigest`を返す。digestはcommand type、subject identity、入力DTOのcanonical frameだけから作り、
command ID、clock、event ID、resultを含めない。同一command IDの再送はこのdigestをconstant-time比較し、一致時だけ既存event/resultを返す。
global receiptのsubjectは`plan_revision(assetId+revision)`、`reservation(reservationId)`、
`legacy_migration(legacyPlanId)`のdiscriminated unionとし、plan以外へ架空revisionを補完しない。

authoring loaderはsource manifest、source disposition、semantic item catalog、source-target edge、item-target ledger、
document profileの6正本を、見出し名・column集合・row幅・inline code delimiter・UTF-8・revision/provenance digestまで厳密に読む。
未知/重複column、欠落row、row幅不一致、silent skipはそれぞれ`catalog-authoring-schema-invalid`、
`catalog-authoring-row-invalid`、`catalog-authoring-count-invalid`としてfail-closeする。複数findingは
`ruleId, subjectId, evidenceRefs`のbytewise stable順にし、canonical digestはlength-prefixed frameで計算する。

catalog createはauthoring構造がvalidなら`pending_review`を保持したまま成功できる。pendingは完了判断ではなく、
`unresolved()`が純粋queryとしてstable ID順に全件返す。accept/closeだけがpending 0を要求し、DB空集合やsource-targetから
targetを補完しない。`traceSource()` / `unresolved()`はaggregate digestを変更しない。

finding identityは少なくとも`catalog-count-mismatch`、`catalog-source-duplicate`、
`catalog-category-duplicate`、`catalog-item-duplicate`、`catalog-edge-duplicate`、
`catalog-profile-duplicate`、`catalog-orphan-edge`、`catalog-disposition-incomplete`、
`catalog-item-target-incomplete`、`profile-unknown`、`profile-overlay-conflict`、
`profile-decision-missing`を予約し、全findingが`ruleId,subjectId,message,severity,evidenceRefs[]`を持つ。

`AuthoringProvenancePort.receipts(paths)`はgit index/HEADから`path,blobOid,contentDigest,sourceCommit`を返す。
loaderはbundleとreceiptのpath集合完全一致、Git blob OID、SHA-256、40hex commitを検証してからparseし、working tree内容から
receiptを自己発行しない。不一致は`catalog-provenance-invalid`。純粋verifierはportと分離し、mutation fixtureで改竄、欠落、余剰、
duplicate、invalid commitをすべてkillする。

`TargetRegistry`はPLAN aliases、git tracked paths、一意basename path aliases、明示family members、document target slotsだけを持つ。
`resolveCanonicalTarget`は4 kindを存在検証し、未解決・多義・phantomをfail-closeする。`reconcileDispositionTarget`は表示aliasと
typed edgeのcanonical集合を比較し、文字列近似やfilesystem探索によるdefault生成をしない。

#### Forward FSM完全遷移表

正常系の各行は隣接遷移だけを許す。`expectedFrom`不一致、sequence欠番、同一`commandId`で異なるpayloadはそれぞれ
`forward-expected-state-mismatch`、`forward-sequence-invalid`、`forward-command-conflict`とする。

event空集合の初期stateはrevisionごとの`proposed`、次sequenceは1とする。sequenceは1始まりで連続し、event IDと
command IDはsubject横断で一意、同一event ID異payloadは`forward-event-conflict`、同一command ID+同一payloadは既存eventを返す。
reducer入力は`sequence,eventId`の順でcanonicalizeせず、受領順がsequence昇順でない場合もfail-closeする。event digestは
subject/revision/sequence/command payload digest/from/to/resume/reason/source commit/evidence IDのcanonical JSONから生成し、clockやDB rowidを含めない。

| command | from | to | 必須guard/evidence | finding / 備考 |
|---|---|---|---|---|
| `plan` | proposed | planned | 承認済みscope / PLAN identity | `forward-plan-evidence-missing` |
| `prepare_pair_freeze` | planned | pair_freeze_ready | 左右artifact宣言済み | `forward-pair-artifact-missing` |
| `freeze_pair` | pair_freeze_ready | pair_frozen | pair reciprocity合格 | `forward-pair-freeze-missing` |
| `freeze_red` | pair_frozen | red_frozen | 実行時に期待finding/exitで失敗したRed evidence | `forward-red-evidence-missing`。todo/skip不可 |
| `start_implementation` | red_frozen | implementing | Red revision一致 | `forward-red-revision-mismatch` |
| `complete_implementation` | implementing | implementation_complete | 実装digest / targeted Green | `forward-implementation-evidence-missing` |
| `prepare_trace_freeze` | implementation_complete | trace_freeze_ready | generates/requirement/test edgeをmaterialize済み | `forward-trace-evidence-missing` |
| `freeze_trace` | trace_freeze_ready | trace_frozen | orphan/stale edge 0件 | `forward-trace-freeze-missing` |
| `prepare_review` | trace_frozen | review_ready | tests_green_atとreview scope | `forward-review-evidence-missing` |
| `approve_review` | review_ready | reviewed | 独立reviewer / approve verdict | `forward-review-not-approved` |
| `accept` | reviewed | accepted | 必須test/gate/PO acceptance evidence | `forward-accept-evidence-missing` |
| `archive` | accepted | archived | replacement/retention reason | `forward-archive-context-missing`。archivedはterminal |
| `block` | proposed〜reviewedの正常状態 | blocked | `resumeState=from`、actor/reason/revision/commit/evidence | `forward-exception-context-missing` |
| `reject` | planned〜review_readyの正常状態またはblocked | rejected | `resumeState=from`、reviewer/actor/reason/revision/evidence | accepted/archiveからreject不可 |
| `supersede` | proposed〜reviewedの正常状態またはblocked/rejected | superseded | replacement asset/revision、reason、evidence | supersededはterminal |
| `reopen` | blockedまたはrejected | reopened | `resumeState`、reason、new evidence、同一subject revision | `forward-resume-state-invalid` |
| `resume` | reopened | reopen eventの`resumeState` | resume先guardを再評価 | 過去guardを流用せず、accepted/archived/supersededへresume不可 |

例外contextはnormal state 1件だけを`resumeState`として保持し、例外stackを作らない。blockedからrejectする場合はblockedを
resume先にせず、block eventが保持した元normal stateをrejectedへ継承する。reopenはblocked/rejectedをreopenedへ写し、
resumeだけが元normal stateへ戻す。reopenの同一revisionはstate復帰だけに使用し、意味変更は`PlanAsset.revise`で新revisionを作り
新revisionの`proposed`から開始する。superseded/archivedはterminal、acceptedはarchive以外不可とする。

#### Forward evidence policy表

| policy / transition | required kind | cardinality | subject/expiry/producer条件 |
|---|---|---:|---|
| `pair-freeze/v1` | `design-pair-review` | 1以上 | 同asset/revision、exit 0、expiryなし、review producer |
| `red-freeze/v1` | `red-test-run` | 1以上 | policyの`expectedExit`（非0可）+expected finding一致、todo/skip禁止、同revision/source commit |
| `implementation/v1` | `targeted-test-run`, `implementation-digest` | 各1以上 | exit 0、同revision、accepted runner |
| `trace-freeze/v1` | `trace-closure` | 1以上 | orphan/stale 0、同revision/source commit |
| `review/v1` | `green-test-run`, `independent-review` | 各1以上 | tests_green_at≤reviewed_at、reviewer policy適合 |
| `accept/v1` | `green-test-run`, `gate-run`, `acceptance-decision` | 各1以上 | 非期限切れ、exit 0、同revision/commit、PO/human要件をprofileから適用 |
| exception command | `exception-context` | 1以上 | actor/reason/source commit/resumeまたはreplacementを同recordで拘束 |

`EvidencePolicy`はkind、min/max cardinality、maxAge、accepted producers、`exitRule=exact|nonzero|any`、`expectedExit?`、`claimsRule=recorded|review-approved|red-observed|trace-clean|gate-passed|decision(expected)`、subject revision/source commit一致をtyped fieldで持つ。
不足kindと不適格record IDをstable順で返し、別revision・policyのexitRule不適合・期限切れrecordを件数へ数えない。

| ポリシーID | 必須証跡kind | 必要件数 | exit規則 | 許可producer |
|---|---|---:|---|---|
| `scope-approval/v1` | `scope-approval` | 1以上 | exact 0 | `human|po` |
| `pair-artifact/v1` | `pair-artifact-declaration` | 1以上 | exact 0 | `codex|claude|human` |
| `trace-materialization/v1` | `trace-materialization` | 1以上 | exact 0 | `codex|claude|ci` |
| `green-review-ready/v1` | `green-test-run` | 1以上 | exact 0 | `ci|codex|claude` |
| `retention/v1` | `retention-decision` | 1以上 | exact 0 | `human|po` |

command→policyは次の完全表を正本とし、実装switchに暗黙defaultを持たない。

| command | policy ID |
|---|---|
| `plan` | `scope-approval/v1` |
| `prepare_pair_freeze` | `pair-artifact/v1` |
| `freeze_pair` | `pair-freeze/v1` |
| `freeze_red` | `red-freeze/v1` |
| `start_implementation` | `red-freeze/v1` |
| `complete_implementation` | `implementation/v1` |
| `prepare_trace_freeze` | `trace-materialization/v1` |
| `freeze_trace` | `trace-freeze/v1` |
| `prepare_review` | `green-review-ready/v1` |
| `approve_review` | `review/v1` |
| `accept` | `accept/v1` |
| `archive` | `retention/v1` |
| `block|reject|supersede|reopen|resume` | `exception-context/v1` |

`scope-approval`、`pair-artifact`、`trace-materialization`、`green-review-ready`、`retention`は各遷移表の必須fieldを
kind 1以上・同revision・accepted producerで要求する。policy ID未登録は`forward-policy-missing`でfail-closeする。

#### workflow CLI共通envelope

`workflow status|transition|explain`は同じapplication service verdictを使用する。JSON応答は`ok`、`command`、
`subject { asset_id, revision, alias }`、`current_state`、任意の`requested_state`、`verdict`、`findings[]`、
`evidence_ids[]`、任意の`event_id`、`state_digest`を返す。正常exit 0、domain/guard違反1、usage/schema違反2、I/O/transaction失敗3。
`status`と`explain`は書込み0、`transition`はevent append+projectionを1 transactionで行う。aliasは418のexact resolverだけを使い、
ambiguous=`plan-migration-collision`、unknown=`plan-asset-not-found`、future revision=`plan-revision-not-found`とする。
CLI/hook/doctorはrule ID、verdict、exit classを変換せず、同じrequest digestなら同じcommand ID再送を冪等に扱う。

`P-FSM-001` generatorはseedをevidenceへ記録し、0〜64 event、全normal/exception command、valid/invalid evidence、
duplicate/gap/out-of-order sequenceを生成する。shrinkerは連続chunk削除→単event削除→optional evidence/reason縮小の順で、
subject/revisionを勝手に変更しない。最低10,000列または全state×command pairを網羅し、非許可state到達0、invalid列受理0を要求する。

#### reservation / self-proof port契約

| port / method | signature | 契約 |
|---|---|---|
| `ReservationService.reserve` | `(request: { reservationId; namespace; ordinal; assetId; leaseMs; commandId }) -> Result<ReservationLease, ReservationError>` | injected clockとversioned key-ring portからraw tokenを発行し、ledgerへは`keyVersion + hash`だけ渡す。token=`utl1.<keyVersion>.<base64url(HMAC-SHA256(secret, length-prefixed commandId/reservationId/namespace/ordinal/assetId/occurredAt/expiresAt))>`。再送はeventのkeyVersion/時刻を読み、同version keyで同じraw leaseを再導出しconstant-time hash照合。key保管adapterをdomain/applicationへ埋め込まない |
| `PlanLedger.reserve` | `(record: { reservationId; namespace; ordinal; assetId; leaseKeyVersion; leaseTokenHash; commandId; occurredAt; expiresAt }, tx) -> Result<ReservationEvent, ReservationError>` | key version+hash-only記録adapter。event/current/receiptを同一transactionでappendし、いずれのfaultでも3表delta 0 |
| `PlanIdReservation.release` | `(reservationId, leaseToken, commandId, tx) -> Result<ReleaseEvent, ReservationError>` | token hashをconstant-time照合し、二重releaseは同一結果。期限切れ/他tokenを拒否 |
| `PlanIdReservation.reconstruct` | `(events, now) -> Result<ReservationState, ReservationError>` | sequence/lease重複0、wall clockをeventへ混入しない |
| `ProcessRunner.run` | `(request: { executable; args[]; cwd; envAllowlist; stdinDigest?; timeoutMs; maxStdoutBytes; maxStderrBytes }) -> Promise<ProcessObservation>` | shell文字列連結禁止。timeout/signal/exceptionを`exitKind=exited|timeout|signal|spawn_error`へ正規化し、出力超過はtruncate finding |
| `SourceHasher.hash` | `(frames: Array<{ label; bytes }>, algorithm='sha256') -> Digest` | `labelLength+label+byteLength+bytes`でframe化し、文字列連結collisionを禁止。改行/encodingを勝手に正規化しない |
| `ReceiptStore.append` | `(receipt, expectedPreviousDigest?) -> Result<AppendReceipt, ReceiptConflict>` | append-only、receipt ID/digest冪等。既存ID異payload、previous digest不一致をconflict |
| `ReceiptStore.load` | `(ruleId, contractRevision) -> Receipt[]` | rule/revision/verifiedAt/receiptIdの決定論順。DB空集合をauthoring receiptの代替にしない |

reservation event空集合は`unreserved`、最初の`reserved`はsequence 1とする。許可遷移は
`unreserved→active(reserved)`、`active→released(released)`、`active→expired(expired)`だけで、released/expiredはterminal。
releaseとexpireの競合は`BEGIN IMMEDIATE`で先にreceiptを確定したcommandだけが成功し、後続は
`plan-id-reservation-not-active`。同一command ID+同一payload再送は同じevent/lease result、異payloadは
`plan-id-reservation-command-conflict`。reconstructはsequence、event/command identity、token hash、expiry条件を再検証し、
event全削除→canonical ledger再読込後のstate/event/command payload digest集合差0を要求する。

#### L7実装ownership DAG

`PLAN-L7-423`は各bounded contextの機能実装を重複所有しない。共通`kernel`とmodule-boundary/cycle/CQS移行だけを所有し、
417=disposition/profile、418=PLAN Asset/reservation/migration、419=Forward FSM/CLI、420=contract compilerを所有し、
421=right-arm/right-lung、422=document dispositionを各source ownerとする。順序は
`418 -> 419`、`417 + 419 + 420 + 422 -> 423`、`422 + 423 -> 424`、
`420 + 421 + 424 -> 425`とする。419は418のidentity/evidence port確定後に開始する。adapter間の共有は
kernel DTO/portだけで行い、別contextのdomainを直接importしない。

共通返却は`Result<T, E>`または`ContractResult { ok, findings[] }`とし、findingは`ruleId`、`subjectId`、
`message`、`severity`、`evidenceRefs[]`を持つ。authoring/validation commandは違反時exit 1、CLI usageはexit 2、
正常はexit 0とする。空/nullで失敗を表現しない。

### method別 事前条件 / 事後条件 / 不変条件

| メソッド | 事前条件 | 事後条件 | 不変条件 |
|---|---|---|---|
| `PlanAsset.create` | 完全input、revision=1 | 1 revisionのimmutable asset | asset ID不変 |
| `PlanAsset.reconstruct` | sequence付き全revision | latestを指すasset | 欠番/重複0 |
| `PlanAsset.revise` | base=latest、reason/evidence policy適合 | 新asset+`PlanRevisionAdded` event | 旧instance/digest不変 |
| `ForwardWorkflow.transition` | expectedFrom=current、guard pass | append可能なevent 1件 | stateを直接mutationしない |
| `reduceForward` | 同subject、sequence一意 | 決定論的state/verdict | 非許可state到達0 |
| `compileVModelContract` | validated contract | registry/doctor/roadmap manifests | rule ID/digest集合一致 |
| `validateDispositionLedger` | immutable baseline+materialized records | stable findings | path exactly once、判断非創作 |
| `evaluateSemanticItem` | authored evidence+policy | verdict+不足集合 | evidence不足をverifiedにしない |
| `runSelfProof` | independent ports+fixtures | receipt/report | 対象detectorの判定をoracleにしない |

### L7 test ID

- Plan Asset: `U-PA-001..007`
- Forward FSM: `U-FSM-001..007`, `P-FSM-001`
- Contract: `U-VMC-001..005`, `I-VMC-001`
- Disposition/profile: `U-DISP-001..005`, `I-DISP-001`, `U-PROFILE-001..005`
- ドキュメント台帳／ドメイン／意味評価: `U-DOCLEDGER-001..005`, `U-DOMAIN-001..004`, `U-ASSESS-001..006`
- Self-proof: `U-SP-001..008`, `I-SP-001..002`, `M-SP-001..007`

各IDはpre/post/invariant、positive/negative fixture、expected finding/exitをL7 unit-test-designへ結び、
implementation前のRed freeze、mutation survivor 0、正常fixture false-positive 0を要求する。

## PLAN-L7-428 ステージ紐付きエリシテーション追補 (PLAN-REVERSE-428 backfill、2026-07-13)

設計判断エリシテーション (governance 正本 = `docs/governance/design-decision-elicitation.md`) の
runtime 契約。実装 = `src/elicitation/context.ts` / `src/elicitation/record.ts`、CLI = `ut-tdd elicit`。

### 文脈選択 `selectElicitationContext(db, { repoRoot, planId? })`

- **stage 解決順序 (固定)**: ① `planId` 指定時は `selectScheduleLiveState` の entries から
  plan-match (`stage_source="plan-match"`、工程表 row 不在なら stage=null のまま plan registry のみ
  解決)。② 省略時は current 先頭 (`stage_source="schedule-current"`、その plan_id を対象へ昇格)。
  ③ どちらも無ければ `stage_source="none"`。自己ステージ認識は **PLAN 粒度** (step 粒度は
  PLAN-L7-419 Forward FSM 実装後に結合)。
- **decision defaults**: `recommendSkillsForPlan` (limit=8) → `buildSkillInjectionSet` の skill asset
  path から frontmatter `decision_points` を抽出し、「聞かずに既定で進められる判断」として返す。
  skill 読取は **fail-open**: 読めない asset に加え、asset path 未解決 (`missing_skill_ids`) も `unreadable_skills[]` へ可視化し packet 全体は返す (推薦済み既定判断の静かな欠落を許さない)。
  `when`/`choose` を欠く point は除外。
- **design coverage**: `spec_defs` を `plan_id = ? OR layer = ?` で結合し、spec 件数 /
  lifecycle 分布 / 代表 10 件と、その spec 集合に接続する `spec_relations` 件数を返す
  (checked-ZIP 由来 typed-spec 投影の判断文脈化)。plan 未解決時は null。
- **render**: `[1/4 stage] [2/4 design-coverage] [3/4 defaults] [4/4 template]` の固定 4 段。
  template は `## 設計判断依頼` 雛形へ plan_id + current_location を埋め込み、選択肢行は A (推奨) + B の 2 行以上を含む (governance §共通ルール 1 の 2〜4 個)。

### 採択記録 `appendDesignDecision(repoRoot, input)`

- 採択記録は `.ut-tdd/logs/design-decisions.jsonl` へ **append-only** (stage =
  plan_id + current_location 付き、session_id は `resolveRuntimeSessionId`)。
- **fail-close**: plan_id / topic / chosen / reason の空は throw (exit 1)。
- 正本分離: この log は episodic 記録面であり、設計判断の正本は PLAN 設計判断節 / ADR
  (feedback lifecycle と同じ「append-only log + 正本分離」方針)。DB projection 化は
  消費側需要が出た後続 PLAN で行う (現時点で新規テーブル無し)。

oracle: `tests/elicitation-context.test.ts` (U-ELICIT-001..007)。

## PLAN-L7-421 テスト実行snapshot／検出provenance契約 (backprop、2026-07-13)

### `runSnapshotTests(args, repoRoot)`

- pre: Git sourceはtop-level canonical pathが`repoRoot`とexact一致する場合だけGit扱いし、開始時のcommit OIDを
  一度だけ捕捉する。Git時の入力はこのOIDのtree objectだけであり、index、untracked、未commit worktree差分は
  意図的に測定対象外とする。未commit変更を検証する場合は隔離fixture又はcommit済OIDを明示して使い、origin
  worktree fenceは差分を検出してもsnapshot入力へ昇格させない。非Git Packはlive sourceを一度だけwritable execution snapshotへcopyする。
- post: referenceは捕捉済みexecutionから依存install／DB rebuildより前に生成する。Gitは捕捉OIDとreference HEADの
  一致、非Gitはexecution captureとの内容一致を検証し、live sourceを二度読まない。DB rebuild後にreferenceへ追加
  できるruntime inputは`.ut-tdd/harness.db`と`.ut-tdd/logs/feedback-lifecycle.jsonl`だけとする。
- invariant: source/execution/reference/cacheを分離する。non-Git copyではpath segmentとして現れる`.git`、`.ut-tdd`、
  `node_modules`を全階層で除外する（Git cloneの`.git`はrevision検証に必要でありこのcopy除外規則の対象外）。
  referenceはtest process起動前にsealし、終了時cleanupの直前だけunsealする。seal、source/reference fingerprint
  差分、revision mismatch、cleanup失敗はResult error・exit 1でfail-closeする。正常終了はexit 0、CLI usageはexit 2とする。
  snapshot内のinstall、DB rebuild、VitestはBun executableを解決して起動し、Vitest workerのNode executableを継承しない。
  CLIを実行するtestは依存を持つexecution snapshotをcwd/sourceに使い、reference snapshotはread-only入力だけに使う。

### `analyzeTestRepositoryIsolation(input)`

- test sourceのread API、path、`process`、HEAD rootのprovenanceをAST bindingから解決する。named／namespace／
  const／destructuring alias、関数内alias、静的path concat、async API、bracket accessを同じcanonical sinkへ正規化する。
- 各sinkは`head_snapshot`又は`isolated_fixture`のprovenance modeを持つ。契約台帳はmode別call countをexactに要求し、
  `process.cwd()`と相対path readはwritable execution fixture、`headSnapshotRoot()`起点のreadはread-only HEAD snapshotとして計上する。
- root取得の裸式、`void`、未使用binding、assertion-only使用は契約callへ算入しない。repository read sinkへ到達したrootだけを
  台帳へ計上する。HEAD root又はそのalias／静的derived pathをNode/Bunの直接mutation sinkへ渡すことは契約件数と無関係にhard violationとする。
  `open`／`openSync`はwrite-capable flagをfail-closeし、FD/FileHandleを経る任意dataflowはPLAN-L7-425の独立自己証明対象とする。
- 新規read、mode別件数差、stale契約、live root由来、HEAD write、scan errorは全てhard violationとし、コメントや文字列は数えない。
  件数のSSoTは`REPOSITORY_READ_CONTRACTS`であり、L7表はoracle IDと意味論だけを持つ。test sourceの追加・削除・
  read mode変更は同一commitで台帳を更新し、実repoのU-TESTHYGIENE-015でpath/mode/call数のexact equalityを確認する。
  表示用総数は導出値であり固定定数化しない。

### 永続DBテストの所有責務

- persistent DB ownerは`tests/**/*.test.ts`を再帰走査し、DB acquisition aliasを正規化して自動発見する。
- ownerは`support/temp-tree`由来の`removeTestTree`を実行可能経路で呼び、raw recursive `rm`／`rmSync`を
  named／namespace／element／alias／options chainの全表現で使用しない。
- `if(false)`、constant-false `&&`、constant-true `else`のcleanupは証拠としない。本PLANの実行可能性判定はこれら
  定数dead pathまでであり、任意CFGのpost-dominator、interprocedural dataflow、mutation survivor 0はPLAN-L7-425の
  独立自己証明範囲とする。

## PLAN-L6-83 駆動モデル準拠PLAN Admission契約

### `PlanAdmissionPolicy.evaluate(request)`

`PlanAdmissionRequest` は `command_id`、actor、occurred_at、route signal、route mode、technical drive、
完全な `(kind, layer, sub_doc?, workflow_phase?, branch_prefix)` tuple、requested PLAN/asset/body digestを持つ。
Forward escapeではさらにorigin PLAN revision/state、escape reason、reentry target、E4投影済みGitHub
Issue binding (`episode_id` / projection digestを含む) を必須とする。Issue番号だけはbindingとして不十分である。

postは許可時だけimmutable `PlanAdmissionCertificate`を返す。certificateはpolicy version、request digest、
tuple digest、route/origin/Issue/reentry binding、issued_at、自己digestを持つ。未知/曖昧signal、未知drive mode、
未登録tuple、branch不一致、工程表不一致、backdate、archived偽装、`--force`によるpolicy迂回は全て
structured violationであり、Forward fallbackを返さない。

`routeFiling`は人間向け候補提示に限定する。authoring許可には使わず、許可tuple catalogを唯一の正本とする。
catalogはmodeごとのkind/layer独立集合ではなく、Incidentの`troubleshoot/L7`と`recovery/cross`のような
相関を一件ずつ持つ完全tuple集合である。

### `admitPlanDraft(request, ports)`

順序は `evaluate → reserve ID → append admission receipt → PlanAsset.create → temp write/fsync/rename → projection`
で固定する。全portは同一transaction境界に置き、failure時はsource file、reservation、ledger、DB、outboxを
rollbackする。同一`command_id + request digest`の再送は同certificateを返し、同じcommand IDでpayloadが違えば
`plan-admission-command-conflict`として拒否する。成功時だけfrontmatterにcertificate ID/digest/policy versionを
参照として記録する。

Admission receiptとPLAN本文のdigest、asset/revision、route tupleを`verifyPlanAdmissionReceipt(diff, ledger)`が
再照合する。新規追加、rename、frontmatter/body直接編集、receiptなし、stale receiptはhook/pre-push/CIでexit 1。
既存履歴はbaseline前のreceipt欠落だけを遡及改ざんせず、HEAD差分の新規/変更PLANへ強制する。

## PLAN-L6-83..85 Forward離脱 / GitHub関数契約

```ts
class ExecutionEpisode {
  static observe(input: ObserveEscapeInput): ExecutionEpisode;
  selectDrive(input: SelectDriveInput): EpisodeEvent;
  recordProjection(input: GithubProjectionResult): EpisodeEvent;
  certifyReentry(input: ReentryEvidenceInput): ReentryCertificate;
  authorizeMerge(input: MergeEvidenceInput): MergeAuthorization;
}

interface GithubProjectionPort {
  projectIssue(command: ProjectIssueCommand): Promise<ProjectionReceipt>;
  projectDraftPullRequest(command: ProjectPullRequestCommand): Promise<ProjectionReceipt>;
  closeIssue(command: CloseIssueCommand): Promise<ProjectionReceipt>;
}
```

契約不変条件:

- `observe`は通常Forward入力をescape episodeへ昇格しない。escape typeがある時だけE0を生成する。
- `selectDrive`はcanonical drive enumとorigin/escape/PLAN kind/branch kindを同時検証し、未知・不整合を拒否する。
- Issue projectionはE2より前、drive plan freezeはE4より前に実行できない。同じidempotency keyは同じreceiptを返す。
- `certifyReentry`はE6のdrive検証とE8のForward中間testをorigin revisionへ束縛してE9 certificateを発行し、片方欠落を拒否する。E9はE10で一度だけconsumeし、E11の合流後testはE12 draft PRの前提として別に検証する。
- draft PRはE11後だけ生成する。merge authorizationは別provider cross-review PASS、required CI、exact head、
  re-entry certificate、accept evidenceをAND条件で要求する。
- GitHub inboundはremote observationをappendするだけで、domain eventのsequence/payloadを更新しない。
- E15はescapeをL/type/cause/drive/recurrence identity別learning factへ投影し、上流actionまたは理由付きno-changeを必須にする。

### `harness-check` aggregate gate / E13 receipt契約

runtime source workflowは、Linux実行leg `harness-check-linux` とWindows実行leg
`harness-check-windows`、および両legを束ねる最終job `harness-check` を別jobとして持つ。
最終jobは `needs` の集合が二つのlegと完全一致し、`always()` で必ず評価される。判定は両方の
`needs.<leg>.result === 'success'` の論理積だけをGreenとし、`failure`、`cancelled`、`skipped`、
`neutral`、`timed_out`、`action_required`、未知値、結果欠落をfail-closeする。個別legの成功や
workflow全体の曖昧なconclusionを最終Greenへ読み替えない。

`GithubCiPolicy` はruntime dual-leg profileとconsumer template single-leg profileを明示入力で
区別する。runtime profileには上記三job topologyを要求し、job名、`needs` 完全一致、`always()`、
明示result guardの欠落・余剰依存・循環・同名job偽装をviolationにする。template profileには
runtime固有のWindows legを推測追加しない。profileをworkflow本文やjob数から自己推論してはならない。

E13へappendできる `AggregateCiReceipt` は少なくとも `repositoryIdentity`、`workflowIdentity`、
`workflowRevision`、`runId`、`runAttempt`、`headSha`、`requiredCheckSetDigest`、
`protectionRevision`、Linux/Windows各legの `jobId`・`name`・`conclusion`、aggregate jobの
`jobId`・`name`・`conclusion`、receipt digestをlosslessに保持する。三jobは同一workflow run、
同一run attempt、同一HEAD SHAに属し、job identityは互いに異なり、required contextは最終
`harness-check`一件でなければならない。両legとaggregateの全てが`success`の場合だけvalidである。

HEAD SHA、run attempt、workflow revision、required check set、protection revisionのいずれかが
変化したreceiptはstaleであり、後続runの証拠へ合成しない。E13 reducerはremote observationだけでなく
このvalid receiptを要求する。E14のmerge authorization、自動merge、Execution Ledger projectionは
個別legや片OSのreceiptを参照せず、E13に束縛されたaggregate receipt digestだけを参照する。
branch protectionのrequired contextも `harness-check` 一件へ固定し、実GitHub設定が未適用・乖離・
取得不能なら「設定済み」と推測せずclosureをblockする。

## Node self-host bootstrap機能契約（Issue #152 D0-N）

`buildNodeGeneration(candidateRevision)`はexact Node `24.13.0` / npm `11.6.2`、review済み
toolchain provenance（Node distribution archive digest、同梱npm CLI expected digest、package/lock identity）、
`package-lock.json`、builder/source graphを入力とし、compiled ESMと`NodeBootstrapReceipt`を
同一generationへ原子的に公開する。receiptは少なくとも
`subject_revision`、Node/npm absolute executable path・version・digest、lock digest、
external dependency closure digest、builder policy/digest、source graph digest、
compiled entrypoint relative path/digest、toolchain provenance digest、generation IDを持つ。

`loadNodeGeneration(expectedRevision)`はappend-only activation marker集合を読み、
全digest、exact version、review済みprovenance、dependency closure、subject revisionを照合する。同じ
versionを返す別npm CLIもexpected digestが異なれば拒否する。不一致・欠落・未知schema・
symlink escape・partial publishではtyped failureを返し、spawnを呼ばない。成功時だけ
`shell=false`、Windowsでは`windowsHide=true`でsealed Node executable + compiled ESMを起動する。
Bun、bunx、tsx、TS直実行、ambient PATH、runtime downloadへのfallbackは禁止する。

原子性oracleはpublish各barrierのfault injectionと並行readerで、旧完全generationまたは新完全generation
以外を観測しないことを要求する。markerはtemporary write + file sync + close後、存在しない一意final名へ
same-filesystem renameする。readerはvalidated monotonic markerの最高complete sequenceだけを採用し、
temp/torn/invalid/reservation-only markerを無視する。rollbackも旧generationを指す新しいmarkerのappendであり、
履歴を上書きしない。CLI先行・receipt後行の二段rename、既存pointer上書き、shell/native helper/Rust依存は契約違反である。

## PLAN-L6-92 Resource Kernelプロトコル・エラー・プラットフォームポート契約

本節は`PLAN-L5-25`のL6降下であり、`L7-unit-test-design.md`の`U-RGK-WIRE-*`、`U-RGK-ERROR-*`、
`U-RGK-CAP-*`、`U-RGK-LIFE-*`、`U-RGK-PORT-*`、`U-RGK-BUNDLE-*`と対を成す。

### ワイヤ/エラー代数

`decodeFrame(bytes, limits)`は4-byte lengthとexact JSON DTOを検証し、一つのrequestまたは
`protocol_failure`を返す純粋関数とする。`encodeFrame`はcanonical bytesを決定論的に返す。
コマンド代数はlauncher参照を持たない`Probe(ProbeRequest)`、sealed token必須の`Execute(ExecuteRequest)`、
`Custody(CustodyCommand)`で閉じる。phaseは`ControlPhase`と`WorkloadPhase`へ分離し、単一`process_created`を禁止する。
エラー直和は次の値だけで閉じる: `protocol_failure | bundle_failure | capability_failure | validation_failure | launch_failure | custody_failure | deadline | cpu_budget | memory_budget | process_budget | output_budget | cancelled | process_failure | orphan_detected`。未知native codeを成功や一般process failureへ丸めない。

### メソッド契約

| メソッド | 事前条件 | 事後条件 / 不変条件 |
|---|---|---|
| `canonicalizeBundleManifest` | schema/bundle/sequence/prior sequence/authority/key/algorithm/registry revision/issued/expiry/component digestが全て型付き | 固定順length-framed bytesとdigestを返し、欠落・duplicate・unknown fieldを拒否 |
| `verifyBundle` | trust identityとtarget明示 | canonical payload全体のsignatureとcore/companion/schema/SBOM/targetの全一致時だけverified handle |
| `TrustStorePort.loadRegistry` | installer組込authority registry revision | authority-key binding、rotation chain、revocation epoch、algorithm allowlistを返し、bundle自己申告鍵をrootにしない |
| `TrustedClockPort.readEvidence` | platform secure timeまたはregistry許可authorityのsigned time evidence | authority/digest/issued/expiry/boot/monotonicを返し、ambient `Date.now()`へfallbackしない |
| `reduceClockAnchor` | durable lastAccepted anchor + evidence | missing/corrupt/rollbackを拒否。signed re-anchorだけがboot/monotonic continuityを再確立 |
| `authorizeBundle` | signature verified manifest + registry + clock anchor + activation head | downgrade・期限外・失効・prior sequence不一致・floor未満を拒否し、manifest/trust/clockを束縛したauthorization digestを返す |
| `BundleActivationLogPort.append` | authorization済record、prior sequence=head.sequence | bundle digest/sequence/prior sequence/authorization digest/registry revision/clock evidence digestを一transactionでappend。current/floorは同log投影、未commit intent無視 |
| `negotiateCapabilities` | verified probe | required集合を完全包含する場合だけselection。不足は開始前failure |
| `recordProbe` | verified control identity、strict probe | probe digestをdurable append。managed root side effect 0 |
| `sealAdmission` | recorded probe、完全capability、deadline内 | attempt/nonce/bundle/probe/deadlineを結ぶtoken。空required拒否 |
| `dispatchCommand` | closed command union | Probeからlauncher 0、token無しExecuteでmanaged root 0 |
| `reduceCustody` | attempt、nonce、sequence連続 | 合法遷移だけ受理し、resume-before-attach、release-before-emptyを拒否 |
| `launchAttached` | verified bundle、prepared custody、deadline内 | attach-before-user-code。失敗時resume 0とcleanup proof |
| `terminateAndProveEmpty` | created custody | terminate→empty→reap。proof不能時success 0 |
| `normalizeNativeError` | strict native errorとprocess phase | phase整合したclosed errorへ変換しN/Aと欠測を区別 |

### プラットフォームポート/責務非重複

`PlatformPort`は`probe/createCustody/spawnAttached/resume/observe/terminateTree/proveEmpty/release`で構成する。
`CustodyAuthorityPort`は`prepareAuthority/commitHandoff/recoverAuthority/enforceDeadline/revokeAuthority`で構成し、
handoff commit前resume、stale epoch/nonce、dual-crash証拠欠測からのsuccessを拒否する。
Windowsはsuspended create・Job assign・non-inherit handle、Linuxはstart-in-cgroup・broker/subreaper・
`populated=0`+reapを必須とする。Node clientはtransport/deadline、TS domainはpolicy/journal/receipt、RustはOS custody factを
それぞれ一意に所有する。RustにPLAN分類、admission、GitHub、DB/CAS判断、journal reducerを追加した場合は契約違反とする。
Bun依存またはdirect spawn fallbackを追加する実装は入力条件にかかわらずRedとする。
