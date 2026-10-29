---
layer: L6
sub_doc: function-spec
status: confirmed
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L7
issue: 152
v2_import: docs/migration/v2-import-ledger.md
---

## 2026-06-09 FR 単体 coverage 追補

- L6 を close する前に、L1 FR registry を `fr-registry-audit` で parse し、登録済み FR はすべて `fr-unit-coverage.md` に表現する。
- `fr-unit-coverage.md` は各 FR-L1 row を、1 つの L6 spec path、1 つの deterministic unit contract、1 つの U-* oracle に対応づける。
- `src/lint/l6-fr-coverage.ts` はこの rule の mechanical guard であり、`ut-tdd doctor` に配線されている。
- `fr-unit-coverage.md` に列挙する contracts は unit-test-granularity specifications である。L7 は direct unit tests として実装しても、confirmed follow-up PLAN へ route してもよい。ただし implementation time に欠けている FR coverage を発明してはいけない。

### Issue #848: FR registry 退役行の判定分岐（契約のみ・未実装）

`analyzeL6FrCoverage` の退役分岐は `fr-unit-coverage.md` の Issue #848 節を唯一の詳細契約とする。判定起点はFR registry側の `fr_state` であり、registryの既存7列だけの行および `fr_state` 欠落／空欄行は後方互換でactiveとなる。active rowの `retirement_ref` は空欄／未指定に限り、非空ならfail-closeする。通常のactive rowには従来どおり正式な `U-<FR-L1-ID>` の完全一致を要求し、候補oracleで代替しない。退役rowの `retirement_ref` は、設計文書参照（`docs/design/` または `docs/adr/` 配下の実在するpathと、その文書内に完全一致でちょうど1つ存在する見出し）またはIssue参照（`#<正の整数>`、書式のみ検査）の閉じた文法に限り、PLAN参照を含む文法外はfail-closeする。退役rowに限り、L7 test-design候補表または正式表の宣言を認めるが、宣言行target／expected欄に当該FRの完全IDが必要で、別FR宣言の流用やID欠落はfail-closeする。対応する実test fileはoracle IDを完全一致で引用する（test本文でのFR ID引用は要求しない）。candidateから正式oracleへの昇格はcoverage matrix、test-design表、実test引用の3面を同一PRで変更し、混在状態は通過させない。

doctorとL6 descent／closure readerは同じanalyzer判定を共有する。function-specへretired markerを追加する旧CFAC案は採用しない。この契約PRでは `FR-L1-38` を含むregistry row、source、testsを変更せず、退役分岐は未実装の設計契約として残す。`PLAN-L6-21` の正規改訂と必要なprojection／ledger記録は、この契約文書の所有・参照・検証追跡に限る。これらの追跡更新は退役分岐の実装・検証済みの根拠ではなく、契約本文の代替にもならない。候補IDはformal IDへ昇格するまで候補のままである。

## 2026-06-09 Harness DB feedback function 追補

この追補は requirements §6.8.6 / §6.8.7 と L5 `physical-data.md` §9 / `internal-processing.md` Appendix B を L6 function-level contracts へ降下する。SQLite DB は docs/state/logs の rebuildable projection であり、authoring source ではない。

| 関数 | signature | 前提 | 事後 / oracle |
|---|---|---|---|
| `recordProjectionEvent` | `(event: ProjectionEvent, deps: HarnessDbDeps) => ProjectionRowRef` | `event.plan_id` または `event.session_id` が存在し、`deps.dbPath` は `.ut-tdd/` 配下に解決される。 | ID を検証し、該当 projection table row を upsert して `{table, id, evidence_path}` を返す。source docs は rewrite しない。 |
| `analyzeDbConstraintCoverage` | `(db: DbIntrospectionPort, tables?: TableDef[]) => DbConstraintCoverageResult` | `DbIntrospectionPort`はread-only `prepare().get/all`だけを公開し、lint/query層は具象`HarnessDb`をimportしない。 | typed schemaとSQLite introspectionを照合し、table/NOT NULL/PK/FK/UNIQUE/CHECKの欠落をfindingへ返す。state-dbへの逆依存とmodule cycleを作らない。 |
| `rebuildHarnessDb` | `(input: RebuildInput, deps: HarnessDbDeps) => RebuildResult` | repo root は読込可能で、DB path は `.ut-tdd/` 配下にある。 | projection tables を truncate し、正規化済み docs/state/log digest を replay して `search_index` と `quality_signals` を再計算する。同一入力では deterministic。 |
| `stableId` | `(prefix: string, value: string) => string` | prefix は空でない projection namespace、value は raw subject ID または空文字を許容する。 | ASCII safe な value は既存 ID を維持し、正規化で情報が落ちる場合は `--<sha256 12hex>` suffix を付ける。空 value は `unknown` sentinel に正規化する。projection / feedback / skill / workflow の row ID 生成はこの helper を共有し、local regex copy を増やさない。 |
| `computeSkillMetrics` | `(rows: SkillMetricInput) => QualitySignal[]` | recommendation / invocation rows が与えられ、分母 0 は明示される。 | layer/drive/plan/model ごとに `fired/recommended` と `accepted/fired` を算出する。欠落 row は findings とし、成功を捏造しない。 |
| `findReference` | `(db: HarnessDb, query: string) => SearchReferenceResult[]`（型は `src/search/index.ts` 正本、#1169 A5-C11 で実装に整合化） | `db` は開いた harness DB で、`search_index` が rebuild 済みである。`query` は空白のみでもよい（trim 後に空なら検索しない）。 | `search_index` の行を token 一致で採点し、`subject_type`、`subject_id`、`path`、`title`、`tokens`、`summary`、`updated_at`、`evidence_path`、`reason`（`exact-id` / `token-match`）、`score` を持つ行を score 降順で返す（`subject_id` が query と完全一致すれば `exact-id`）。空 query と score 0 の行は返さない。read-only とする。 |
| `emitFeedbackEvents` | `(findings: FindingRow[], signals: QualitySignal[]) => FeedbackEvent[]` | findings / signals は正規化済みである。 | 反復 gap、未解決 blocker、dependency stall、品質 regression pattern を feedback events に集約する。PLAN 変更は自動承認しない。 |
| `recordGuardrailDecision` | `(decision: GuardrailDecision, deps: HarnessDbDeps) => ProjectionRowRef` | guardrail 名、decision、evidence path が存在する。 | block/allow/human-required を evidence 付きで保存する。`human-required` は projection rebuild で downgrade できない。 |
| `catalogAutomationAssets` | `(input: CatalogAutomationAssetsInput) => AssetCatalogResult`（`input = { repoRoot?: string; db: HarnessDb }`、型は `src/assets/catalog.ts` 正本、PLAN-L7-52 C-4 で実装に整合化 2026-06-15） | caller は roots を渡さない。roster root は `.claude/agents`、command root は `docs/commands` とする（`assetSources()`）。skill の走査は `resolveSkillFiles(repoRoot)`（`src/shared/embedded-skills.ts`）に委ねる。consumer root は、`skills/` があればそれ、無ければ埋め込み skill asset が 0 件のときに限り `docs/skills/` とし、どちらでもなければ consumer root は無い。埋め込み skill は `.ut-tdd/assets/skills/` から読む（対象 path は埋め込み asset の一覧、一覧が空なら同ディレクトリの実ファイル）。同じ相対 path が consumer root にあれば consumer 側を採り（override）、無ければ埋め込み側を採る。consumer root にだけある skill も加える（#1169 A5-C12） | skill/roster/command doc を path・trigger/capability・search token・drift status で catalog 化し `{ ok, assets: string[], findings }` を返す; prompt 本文・secret・provider transcript は copy しない; drift / empty-catalog / invalid-root は `findings` として可視化 |
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

attempt escalation surface は直前 session の連続失敗 loop を上限付きで表示する。`renderEscalationSignals` は total 件数を header に保持しつつ、既定 10 件だけを列挙し、残件は breadcrumb とする。これは SessionStart の固定予算を守るための surface cap であり、`evaluateAttemptEscalation` の検出件数は削らない。既定の表示上限 (cap、`src/runtime/attempt-escalation.ts` の `DEFAULT_ESCALATION_SURFACE_LIMIT`) を下げるときは、PO 承認を得て定数を変更する（#1169 A5-C01）。

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
| FR-L1-12 | `recommendSkillsForText`, `recommendSkillsForPlan` | recommendSkillsForText(db: HarnessDb, taskText: string, options?: { limit?: number; recordedAt?: string }) => SkillRecommendation[]<br>recommendSkillsForPlan(db: HarnessDb, planId: string, options?: { limit?: number; recordedAt?: string }) => SkillRecommendation[] | task text または PLAN、layer、kind/drive、catalog snapshot (harness.db) を与える。 | reason 付き deterministic ranked skill candidates を返す (skill 部分は再接続済み。推奨 command 候補は未配線の設計済み範囲で、`rankSkills` は `asset_type=skill` だけを読む。L1 FR-L1-12 の 5 要素は縮小しない)。 | missing catalog rows は空の結果とする。recommendations は prompt bodies を copy しない。 | U-FR-L1-12 |
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
| FR-L1-33 | `catalogAutomationAssets` | catalogAutomationAssets(input: CatalogAutomationAssetsInput) => AssetCatalogResult | 承認 root（roster / command は `assetSources()`、skill は `resolveSkillFiles()`。行 `catalogAutomationAssets` を参照）を走査する。 | skill/roster/command doc を catalog 化し drift を findings にする。 | catalog は metadata だけを保存し、prompt bodies と secrets は source docs に残す。 | U-FR-L1-33 |
| FR-L1-34 | `prioritizeCapabilityGaps` | prioritizeCapabilityGaps(input: PrioritizeCapabilityGapsInput, deps: PrioritizeCapabilityGapsDeps) => PrioritizeCapabilityGapsResult | asset catalog、workflow impact、missing route/recover signals を与える。 | reason 付き deterministic priority order を返す。 | priority は PLAN 化されるまで advisory とする。**退役 (#1084)**: 実装は live な呼び出し元が無く削除予定。契約は未配線の設計済み範囲。 | U-FR-L1-34 |
| FR-L1-35 | `renderFoundationReadiness` | renderFoundationReadiness(input: RenderFoundationReadinessInput, deps: RenderFoundationReadinessDeps) => RenderFoundationReadinessResult | infrastructure category inventory を与える。 | implemented/designed/missing categories を報告する。 | report は missing categories を implemented として扱えない。**退役 (#1084)**: 実装は live な呼び出し元が無く削除予定。契約は未配線の設計済み範囲。 | U-FR-L1-35 |
| FR-L1-36 | `projectSkillEvaluations` | projectSkillEvaluations(db: HarnessDb, opts?: { asOf?: string }) => void | skill_invocations と plan_registry rows が存在する。asOf は ISO timestamp (default = nowIso())。 | accepted=1 invocation を持つ skill_id ごとに `skill_evaluations` row を 1 件書く。skill_rating = success_count / adoption_count。asOf から 30 日以内に invocation がなければ unused_flag = 1。cold-start (0 invocations) は 0 rows で throw しない。 | unused skills は auto-delete しない。削除は human-only。success states ("confirmed"/"completed") は source に記録し、single-source-of-truth hardcoded とする理由を持つ。 | U-FR-L1-36 |
| FR-L1-43 | `projectPocEvaluations` | projectPocEvaluations(db: HarnessDb, opts?: { asOf?: string }) => void | plan_registry は PLAN frontmatter 由来の decision_outcome を持つ kind="poc" rows を含む。 | `poc_evaluations` summary row (id="poc-evaluation:summary") を 1 件書く。poc_success_rate = confirmed_count / total_count、confirmed_count、rejected_count、pivot_count、total_count、evaluated_at を保持する。decision_outcome 空の PoC PLANs は分母から除外し、cold-start (0 decided PoC PLANs) は 0 rows で throw しない。 | pivot は non-success と数える。decision_outcome values は理由付き single-source-hardcoded。row id は常に "poc-evaluation:summary" (rebuild ごとに summary row 1 件)。 | U-FR-L1-43 |
| FR-L1-38 | `projectModelEvaluations` | projectModelEvaluations(db: HarnessDb, repoRoot: string) => void | **退役予定 (PLAN-L6-789 / Issue #789)**: 本契約 PR は実装を変更しない。退役完了時の目標は評価行の生成 0 と表示専用 scan であり、PR1 / 昇格 / PR2 の順に実装と引用を切り替える。現時点の正式 oracle は U-FR-L1-38、退役候補は CANDIDATE-U-TOKRET-001..005。現行契約: model_runs table は projectReviewModelRuns と、token/cost telemetry 用の `projectTokenUsage` で populate 済み。evaluation 実行には .ut-tdd/config/model-opt-in.yaml が enabled:true で存在する。PLAN_SUCCESS_STATUSES は success inference の single-source constant。 | opt-in disabled (file absent または enabled!=true) なら 0 rows を書いて return。有効なら distinct model ごとに success_rate = success_count / run_count (`model_runs.plan_id` → `plan_registry.status IN PLAN_SUCCESS_STATUSES`) を持つ `model_evaluations` row を書く。cold-start (0 model_runs) は 0 rows で throw しない。token/cost rows は file-scan のみで `ut-tdd telemetry scan` が取り込む。 | cost-efficiency (tokens_per_success/cost_per_success) は PLAN-L7-57 と PLAN-L7-58 で discharge 済み。cost は既知 model の local pricing tables だけで計算し、未公開/unknown models は cost_usd=null のまま (cost 捏造なし)。success states は PLAN_SUCCESS_STATUSES で single-source-hardcoded。 | U-FR-L1-38 |
| FR-L1-37 | `recommendModelEffort` | recommendModelEffort(input: RecommendModelEffortInput, deps: RecommendModelEffortDeps) => RecommendModelEffortResult | task、drive、layer、size、uncertainty signals を与える。 | model family と reasoning effort recommendation を返す。 | model recommendation は evidence として記録し、hidden prompt state にしない。 | U-FR-L1-37 |
| FR-L1-39 | `scoreTaskComplexity` | scoreTaskComplexity(input: ScoreTaskComplexityInput, deps: ScoreTaskComplexityDeps) => ScoreTaskComplexityResult | size、dependency、uncertainty、affected artifact signals を与える。 | deterministic score と class を返す。 | unknown inputs は explicit uncertainty を生み、low complexity と捏造しない。 | U-FR-L1-39 |
| FR-L1-40 | `resolveDriveStatePartition` | resolveDriveStatePartition(input: ResolveDriveStatePartitionInput, deps: ResolveDriveStatePartitionDeps) => ResolveDriveStatePartitionResult | drive/mode/kind/layer を与える。 | `.ut-tdd/drive/<drive>` partition と skip/defer rules を返す。 | drive state は plan/session で join し、他 drive partitions を汚染しない。**退役 (#1084)**: `resolveDriveStatePartition` / `validateDriveStatePartitions` は live な呼び出し元が無く削除予定。契約は未配線の設計済み範囲。 | U-FR-L1-40 |
| FR-L1-41 | `classifyDrive` | classifyDrive(input: ClassifyDriveInput, deps: ClassifyDriveDeps) => ClassifyDriveResult | PLAN/code/dependency evidence を与える。 | drive と orchestration mode input を confidence 付きで分類する。 | low confidence は finding/confirmation need とし、certainty を捏造しない。 | U-FR-L1-41 |
| FR-L1-42 | `buildAdapterPlan` | buildAdapterPlan(input: BuildAdapterPlanInput, deps: BuildAdapterPlanDeps) => BuildAdapterPlanResult | provider、role、task、plan、execution mode を与える。 | UT-TDD-only plan flags を provider に転送せず、provider command plan と boundary flags を返す。 | provider boundary separation と handover context を保持する。 | U-FR-L1-42 |
| FR-L1-47 | `scanSkillCatalog`, `recommendSkillsForPlan` | scanSkillCatalog(input?: { repoRoot?: string; root?: string; optionalRoots?: string[] }) => SkillCatalogResult<br>recommendSkillsForPlan(db: HarnessDb, planId: string, options?: { limit?: number; recordedAt?: string }) => SkillRecommendation[] | skill docs と PLAN の layer/drive context を与える。 | catalog entry と deterministic recommendation を返す。 | missing metadata は finding にする。skill source docs は rewrite しない。 | U-FR-L1-47 |
| FR-L1-48 | `catalogAutomationAssets` | catalogAutomationAssets(input: CatalogAutomationAssetsInput) => AssetCatalogResult | command doc を承認 root から走査する。 | command doc を catalog 化し drift を findings にする。 | search rows は rebuildable であり、authoring source にはならない。 | U-FR-L1-48 |
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
| `parseScheduleEntries` | `ParseScheduleEntriesInput { bundle; repoRoot } -> ScheduleEntryDraftResult { entries[]; findings[] }` | PLAN-L6-39/383/PLAN-L7-471。post: `docs/governance/vmodel-upgrade-schedule.md` を第一入力として `schedule_entries` row draftを返す。admission済みPLANはstrictなembedded receipt、tracked receipt hash chain、binding、canonical content digestを共有resolverで照合し、全て一致したrevisionだけを採用する。partial receipt、未追跡receipt、digest不一致、対応PLAN不在は工程表行・fallback行ともwrite-zero。receipt不在legacyだけはself-reference証跡を除外したcanonical content tokenを使う。invariant: `source_hash`はfingerprint専用でrevision代替にしない。専用工程表はPLAN status / dependenciesを直接 mutate しない。 |
| `queueGithubProjection` / `claimGithubProjection` / `persistProjectSync` / `markGithubProjectionFailed` | `QueueGithubProjectionInput -> outboxId` / `(db,outboxIds) -> void` / `PersistProjectSyncInput -> void` | PLAN-L6-85/PLAN-L7-471。payloadを閉じた5項目のcanonical JSONとSHA-256 digestで保存する。未着手PLANの`headSha=""`はProject field clearを表す正規値として許容し、他の必須値は空を拒否する。同一digest再送だけstatus/attemptを保持し、変更digestは新identityへ置換する。remote mutation前に全intentを`pending|applied -> applying`へatomic claimし、同じlogical keyが`applying`中のenqueueはfail-closeする。remote成功後はcurrent outbox IDと`applying`を再照合し、Project projection/binding保存と`applied`化を同一transactionでcommitする。失敗はclaim済みintentだけをclosed reason付き`pending`へ戻す。invariant: stale workerは新payloadを完了・rollbackできず、secret/raw errorを保存しない。 |
| `syncRepositoryBindings` | `RepositoryBindingSyncInput { db; repositoryId; repoRoot; gh; now } -> RepositoryBindingSyncResult` | PLAN-L7-471。typed PR traceのPLANをcanonical PLAN source、schedule revision、trace revisionでexact照合する。admission revisionはtracked receiptとcontent digestまで照合し、legacyだけcanonical tokenを許す。さらに`repositoryId`でscopedしたcompare APIで`trace.base_sha`がPR HEADの祖先または同一であることを確認し、`ahead|identical`以外とprovider errorは`base-sha-unverified`でwrite-zeroにする。工程表hashやtrace自己申告でrevisionを補完しない。 |
| `readGithubEvidence` / `deriveStoredForwardReadiness` / `rebuildExecutionReadiness` | `(db,repoRoot,repositoryId?) -> ForwardEvidence[] / ForwardReadinessRow[]` / `(db,repoRoot,now?) -> ForwardReadinessRow[]` | Project同期のderiveではrepository IDを必須入力としてbindingとProject itemを同一repositoryへ限定する。別repositoryの同一PLAN/revision/check/PRをProject mutationへ混入させない。一方、PK=`plan_id`の永続`execution_readiness_projection`はrepositoryで分割できないため、rebuildはrepository引数を持たず常に全体snapshotを保存する。scoped deriveでglobal projectionを削除・置換してはならない。 |
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
| `analyzeTypedSpecOwnedArtifactDispersal` | `AnalyzeTypedSpecOwnedArtifactDispersalInput { defs; sources } -> TypedSpecOwnedArtifactDispersalResult { typedSpecCount; dispersedSpecCount; findings[]; ok }` | PLAN-L6-45。post: typed spec 宣言の `source_path` が台帳 `ledger_sources` のいずれかと一致することを検査し、一致しない宣言を `typed-spec-owned-source-mismatch` finding にする。invariant: central bootstrap doc は移行足場であり、所有外 ID の宣言元になれない。宣言元になれるのは `loadSpecIrSources` が source に取る `docs/` 配下の markdown だけであり、`tests/*.ts` は宣言元にならない (`src/state-db/spec-ir-projections.ts` `loadSpecIrSources`、`tests/` は evidence 参照の prefix 扱い)。test 側の typed spec (`TVMS-*`) は test-design に宣言する。 |
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
| `recommendSkillsForText` | `(db: HarnessDb, taskText: string, options?: RecommendSkillsOptions { limit?: number; recordedAt?: string }) -> SkillRecommendation[] (Result 型は配列そのもの)` | implemented: `src/skill-engine/recommend.ts` に実装済み。`classifyTask` で kind/drive/risk を導き、`ut-tdd skill suggest --text` (`src/cli.ts`) が呼ぶ。 |
| `recommendSkillsForPlan` | `(db: HarnessDb, planId: string, options?: RecommendSkillsOptions { limit?: number; recordedAt?: string }) -> SkillRecommendation[] (Result 型は配列そのもの)` | implemented: `src/skill-engine/recommend.ts` に実装済み。`ut-tdd skill suggest --plan` (`src/cli.ts`) が呼ぶ。 |
| `catalogAutomationAssets` | `(input: { repoRoot?: string; db: HarnessDb }) -> AssetCatalogResult { ok; assets: string[]; findings }` | implemented: `src/assets/catalog.ts` に実装済み。`ut-tdd asset catalog` (`src/cli.ts`) が呼ぶ。skill/roster/command doc の catalog 化と drift 判定を担う。 |
| `scanSkillCatalog` | `(input?: { repoRoot?: string; root?: string; optionalRoots?: string[] }) -> SkillCatalogResult { ok; entries; findings; scannedRoots; optionalRoots }` | implemented: `src/assets/catalog.ts` に実装済み。skill 本文は保存せず metadata だけを扱う。 |
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
| `prioritizeCapabilityGaps` | `PrioritizeCapabilityGapsInput { assets; workflow_impact; missing_routes } -> PrioritizeCapabilityGapsResult { priorities[] }` | **退役 (#1084)** (pseudocode 状態は未配線の設計済み範囲): src から import する live な呼び出し元が無く、テストが渡した入力を並べ替えるだけ。契約は未配線の設計済み範囲として残し、実装とテストは後続の実装 PR で撤去する (oracle ID は削除せず退役扱い)。 |
| `renderFoundationReadiness` | `RenderFoundationReadinessInput { categories[] } -> RenderFoundationReadinessResult extends ContractResult { implemented; designed; missing }` | **退役 (#1084)** (pseudocode 状態は未配線の設計済み範囲): src から import する live な呼び出し元が無く、テストが渡した category を数え直すだけ。契約は未配線の設計済み範囲として残し、実装とテストは後続の実装 PR で撤去する (oracle ID は削除せず退役扱い)。 |
| `recommendModelEffort` | `RecommendModelEffortInput { task; drive; layer; size; uncertainty } -> RecommendModelEffortResult { model_family; reasoning_effort; evidence_path }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。recommendation は recorded evidence であり hidden prompt state ではない。 |
| `scoreTaskComplexity` | `ScoreTaskComplexityInput { size; dependencies; uncertainty; affected_artifacts } -> ScoreTaskComplexityResult { score; class; findings[] }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。unknowns は uncertainty を生み、low complexity と扱わない。 |
| `resolveDriveStatePartition` | `ResolveDriveStatePartitionInput { drive; mode; kind; layer; plan_id?; session_id? } -> ResolveDriveStatePartitionResult { partition_path; skip_sub_doc[] }` | **退役 (#1084)** (pseudocode 状態は未配線の設計済み範囲): src から import する live な呼び出し元が無く、組み立てた path を自分で照合するだけ (対の `validateDriveStatePartitions` も同様)。契約は未配線の設計済み範囲として残し、実装とテストは後続の実装 PR で撤去する (oracle ID は削除せず退役扱い)。 |
| `classifyDrive` | `ClassifyDriveInput { plan; code_delta?; dependency_delta? } -> ClassifyDriveResult { drive; confidence; findings[] }` | implemented pseudocode: `src/workflow/contracts.ts` に実装済み。low confidence は finding/human confirmation を要求する。 |
| `buildAdapterPlan` | `BuildAdapterPlanInput { provider; role; task; plan; execution_mode } -> BuildAdapterPlanResult extends ContractResult { command_plan; boundary_flags[] }` | implemented pseudocode: `src/runtime/adapter.ts` に実装済み。provider boundary flags を保持する。 |
| `checkCodexWrapperParity` | `DoctorDeps -> { messages: string[]; ok: boolean }` | implemented pseudocode: `src/doctor/index.ts` に実装済み。Claude hooks が project-settings based であることを検証し、Codex parity は `ut-tdd codex --execute` wrapper lifecycle tests と stdin adapter oracles で提供される。 |
| ~~`buildCommandCatalog`~~ | (退役、#1084) | **退役 (#1084)**: `ut-tdd builder catalog` からだけ呼ばれ、固定配列を自分自身へ照合する自己検証で常に成功した。CLI 面の registry (`command`、source path、args、options、`hasJson`、exit profile、category) は external-if.md §(g) と PLAN-L6-64 / PLAN-L7-449 が持つ未配線の設計であり、この退役は registry の設計を取り消さない。 |
| `projectSkillEvaluations` | `SkillEvaluationsInput { asOf?: string } -> void` | implemented pseudocode: `src/state-db/skill-projections.ts` に core 実装、`src/state-db/projection-writer.ts` に既存 public signature の wrapper を保持。skill_invocations + plan_registry から per-skill rating/adoption/success/unused を算出し、cold-start は zero rows。 |
| `projectPocEvaluations` | `PocEvaluationsInput { asOf?: string } -> void` | implemented pseudocode: pure集計coreは `src/projection/domain/poc-evaluations.ts`、meaningful read/store portを結ぶapplicationは `src/projection/application/project-poc-evaluations.ts`、SQLite read/persistは`src/state-db/sqlite-projection-store.ts`、既存public APIの互換facadeは `src/state-db/projection-writer.ts`。summary row は 1 件で、poc_success_rate = confirmed/(confirmed+rejected+pivot)。decided PoC PLANs がなければ zero rows。pivot は non-success。 |
| `projectModelEvaluations` | `ModelEvaluationsInput { repoRoot: string } -> void` | implementation_state: implemented; retirement staged per PLAN-L6-789 (PR1 / promotion / PR2)。現時点では rebuild / doctor / telemetry scan からの caller が存在する。PR1 で caller / SQLite read、PR2 で domain / application / adapter / port を撤去する予定であり、撤去済みとは扱わない。現行 implemented pseudocode: repository opt-in adapterは`src/projection/adapters/model-evaluation-config.ts`、application/pure計算は`src/projection/application/project-model-evaluations.ts`と`domain/model-evaluations.ts`、grouped SQLite read/persistは`src/state-db/sqlite-projection-store.ts`、旧public facadeは`projection-writer.ts`。.ut-tdd/config/model-opt-in.yaml (enabled:true) で opt-inする。per-model success_rate = success_count/run_count、cold-startはzero rows。**cost-efficiency DISCHARGED** (PLAN-L7-57 token telemetry + PLAN-L7-58 cost enrichment): cross-runtime session JSONLからtoken efficiencyを取り込み、published pricingのないmodelはcost=nullのまま捏造しない。分子=全model run token/cost、分母=PLAN成功数の意図的な非対称を維持する。取り込みは`ut-tdd telemetry scan`。 |
| `projectOperationalMetrics` | `OperationalMetricsInput { computedAt } -> void` | implemented pseudocode: pure policyは`src/projection/domain/operational-metrics.ts`、application event生成は`src/projection/application/project-operational-metrics.ts`、drive/hook/workflow grouped readとpersistは`src/state-db/sqlite-projection-store.ts`、旧rebuild facadeは`projection-writer.ts`。drive成功statusはcompleted/confirmed/documented、threshold 0.8。statusは丸め前の率で判定し、表示値だけ4桁にする。NULL modeはliteral unknownと同じ`unknown` groupへ正規化・合算し、completed過少計上とsignal ID衝突を防ぐ。trouble/blocked/human/retryは0件をpass、非0をwarnとし、0母数をsilent skipせず0としてsignal化する。 |
| `deriveArtifactProgressDecision` | `ArtifactProgressDecisionInput { linkedTestCount: number; dependencyChecked: boolean; openDependencyImpacts: number; recoveryPlanIds?: string[] } -> ArtifactProgressDecision { state: dependency_unchecked/implemented_unverified/verified; color: red/yellow/green; reason: string }` | `src/state-db/projection-writer.ts` に実装済み。pseudocode = dependency unchecked または open impacts があれば red、linked tests なしまたは recovery active なら yellow、それ以外は green。 |
| `projectArtifactProgress` | `ArtifactProgressProjectionInput { graph?: RelationGraphProjection; db: HarnessDb } -> void` | `src/state-db/projection-writer.ts` に実装済み。pseudocode = source nodes を collect し、covered-by test edges を count し、impact_results/recovery PLANs を join し、decision を derive して rebuildable `artifact_progress` rows を upsert する。 |

### VMS-007 typed spec phase/layer alignment の契約 (PLAN-L6-46 の移設先)

本節は VMS-007 (`typed-spec-phase-layer-alignment`、`traces_from: VMS-004`、検証 `TVMS-007`) の契約を所有する移設先である。VMS-007 は typed spec 台帳の `v_phase` と、宣言元 artifact から解決した owner phase を一致させる設計であり、検出系が owner phase を推測で作らないことを保証する。これにより VMS-004 の `traces_to` は VMS-007 に解決する。契約の実体は上の `analyzeTypedSpecPhaseLayerAlignment` / `checkTypedSpecPhaseLayerAlignment` の行と、L5 `physical-data.md` の `typed-spec-owner-phase-missing` 診断が持つ。

`spec.defines` の VMS-007 宣言 block は、PLAN 退役作業 #1295 で本文書へ移設した。PLAN-L6-46 側の同一 block を除き、`docs/governance/vmodel-typed-spec-definitions.md` の VMS-007 の `ledger_sources` も本文書 (`function-spec.md`) へ付け替える。同一 ID の二重宣言は作らない。

## 2026-06-09 L6 completion readiness 追補

**現実装の旧挙動（後続 Green で置換する対象）**: `analyzeL6Completion` は G6 readiness aggregator である。`freezeInputReady` (status flip 前の G6 audit に trace/substance が ready) と final `ready` (confirmed docs/plans、confirmed L7、G6 PASS 後の L6 completion) を分離する。2026-10-14 時点の実装は L6 design doc status、各 L6 doc の owning `plan:` reference、各 L6 doc の `pair_artifact`、L6 doc filename による L7 reverse reference、minimum unit-contract substance marker (contract/signature、DbC または oracle、U-* oracle family)、base L6 `kind=design` PLAN status と review evidence、単一の `L7-unit-test-design.md` status、G6 gate table row を読む。Post-G6 `kind=add-design` PLAN は add-feature/backfill/review evidence で統制し、base G6 completion を reopen しない。この段落は現実装の説明であり、PLAN 所有必須・単一L7参照を正式な目標契約として追加するものではない。正式 oracle family は `L7-unit-test-design.md` の U-L6COMP-001..012 である。

doctor 配線: `checkL6Completion` (`src/doctor/process-quality.ts`、`l6-completion` check) は hard/fail-close であり、`ok` は final `ready` と一致する (`freezeInputReady` だけでは `ok` にならない)。入力を読めない場合・集約が例外を投げた場合も `violation` を返して `ok=false` とし、silent PASS を作らない。2026-10-14 時点の実装が出す旧診断一覧は draft docs / owning plan 欠落・未解決 / L7 pair 欠落 / L7 reverse reference 欠落 / unit-contract substance 不足 / draft PLAN / L7 draft / G6 not-pass である。これは旧挙動の説明に限り、正式契約では `issue:` だけで正当な所有者を持つ文書を owning PLAN 欠落のみで not-ready としない。`ready=true` は全条件が揃った場合に限り、`freezeInputReady=true` は status・gate の flip 前でも trace/substance が揃えば成立する (U-L6COMP-002 / 004)。

### L6 completion の範囲と inventory (PLAN-L6-00 から還流、#958)

- L6 completion の範囲は、原本の `function-spec` / `edge-case` に限らない。`docs/design/harness/L6-function-design/` 配下を生成または改訂する L6 add-design PLAN の成果物はすべて G6 readiness の対象である。
- **現実装の旧挙動**: L6 設計文書全体の pair artifact を `docs/test-design/harness/L7-unit-test-design.md` の 1 本に固定し、各文書の U-* oracle family をそこから読む。これは後続 Green で置換する現実装の説明であり、正式な目標契約では各 L6 文書が選択した `pair_artifact` と、その同一文書内の oracle family / 逆参照を使う。
- 追加要求 (SQLite projection・drive/model ログ・skill 発火指標・検索コスト削減・機械品質検査) は `fr-unit-coverage.md` の FR-L1 行が受ける。
- G6 audit の正式な目標入力条件は、(1) 各文書に所有者 (`plan:` または `issue:`)、選択した `pair_artifact`、unit 契約の中身がある、(2) 所有する PLAN が実在する場合はその design / add-design PLAN に構造 lint 違反がない、(3) 選択した各 L7 文書に対応する U-* family がある、(4) `l6-fr-coverage` / `pair-freeze` / `plan-schedule` / `review-evidence` と typecheck / vitest / doctor が green、である。最終完了は、全文書が confirmed、実在する所有 PLAN は confirmed (または confirmed PLAN で supersede)、選択された全 L7 文書が confirmed、gate-design に G6 PASS と audit 参照が記録された状態である。
- クラス設計は非 OOP のため縮退し、本 doc §3 に統合する (上記)。
- **PLAN 退役に向けた改訂 (#958、未実装の目標契約)**: PLAN は工程②の最後に一括で退役させる (PO 2026-10-14)。そのため、L6 completion の入力から PLAN と単一の L7 文書への依存を外す。実装 (`src/lint/l6-completion.ts`) は 2026-10-14 時点で旧規則のままであり、`plan:` が `docs/plans/PLAN-L6-*.md` の実在 path を指すこと (`DOC_PLAN_RE` / `unresolvedDocPlans`)、`pair_artifact` が `L7-unit-test-design.md` であること (`PAIR_ARTIFACT_RE`)、その本文が L6 文書のファイル名を含むこと (`missingL7DocRefs`) を要求している。以下の箇条書きは旧実装記述に優先する正式な未実装目標契約である。各文書の所有者は有効な `plan:` または `issue:` で示し、`pair_artifact` が選択した同一のL7文書へ逆参照を束縛する。目標の規則は次のとおり。
  - 所有者: 各 L6 文書は、`plan:` (実在する PLAN の path) か `issue:` (GitHub issue の番号、正の整数) のどちらか 1 つ以上を持つ。どちらも無い文書と、`plan:` が実在しない path を指す文書は、従来どおり not-ready にする。`issue:` の番号が GitHub に実在するかは検査しない (オフラインで決まる入力だけを使う)。
  - 対: `pair_artifact` は `docs/test-design/harness/L7-*.md` のどれでもよい。そのファイルが実在し、frontmatter に `artifact_type: test_design` と `executed_at_layer: L7` を持つこと (右腕の文書は、設計層を `layer`、実行層を `executed_at_layer` で表す。共有の `L7-unit-test-design.md` は `layer: L6` / `executed_at_layer: L7` で、この条件を満たす)。
  - 逆参照: L6 文書のファイル名を、その L6 文書の `pair_artifact` が指す文書の本文が含むこと。別の `L7-*.md` にだけ名前があっても、対は成立しない (指定した対と逆参照を同じ文書に束縛する)。
  - base L6 の `kind=design` PLAN の status の検査 (`draftPlans` / `missingReviewPlans`) は、PLAN が実在する間だけ行う。`docs/plans/` が無いか、L6 の PLAN が 0 件なら、その項目は空集合として扱い、not-ready の理由にしない。
  - L7 の status: L6 文書の `pair_artifact` が指す文書の集合 (重複を除く) のすべてが `status: confirmed` であること。1 本でも draft か status が無い文書があれば not-ready にする。単一の `l7Status` (L7-unit-test-design.md の status) だけで判定しない。
  - G6 の PASS は、従来どおり必須とする。
  - 既存 oracle の改訂と正式昇格: `U-L6COMP-006..012` を正式 oracle として引用する。U-L6COMP-001 の「owning `plan:` が無い」は「所有者 (`plan:` か `issue:`) が無い」に、U-L6COMP-002 の「owning L6 PLAN へ解決する」は「所有者が、実在する PLAN か正の整数の issue へ解決する」に置き換える。U-L6COMP-006..011 は上の所有者・対・逆参照・PLAN status / L7 status 規則を検証し、U-L6COMP-012 は正式 oracle 集合に相反する旧 oracle が併存しないことを検証する。001 / 002 の「L7 の `pair_artifact`」「L7 から名前で参照される」「L7 が confirmed」は、上の対・逆参照・L7 の status の規則に置き換える。旧い文面は、置き換えた時点で残さない (同じ入力に反対の判定を求める oracle を併存させない)。
  - `issue:` は文書の出自 Issue を指す。改訂したときは改訂した Issue へ更新する。
  - 上の表の「所有 PLAN」の列は、PLAN を退役させるときに、対応する issue へ置き換える (#1360 で出自 Issue の列へ置き換え済み)。

| L6 設計文書 | 出自 Issue | L7 oracle family |
|---|---|---|
| `function-spec.md` | #152 | `U-FUNC` / `U-CORE` / `U-RULE` / `U-FR-L1-*` |
| `edge-case.md` | #1360 | `U-EDGE` |
| `session-log.md` | #1360 | `U-SLOG` |
| `forced-stop-feedback.md` | #1360 | `U-FSF` |
| `setup-solo-team.md` | #1360 | `U-SETUP` |
| `handover-mechanism.md` | #1360 | `U-HOVER` |
| `agent-slots.md` | #1360 | `U-SLOT` / `U-TEAM` |
| `backfill-pairing.md` | #1360 | `U-BACKFILL` |
| `governance-enforcement.md` | #1360 | `U-SCRUMREV` / `U-PROP` |
| `vmodel-pair-freeze.md` | #1360 | `U-VPAIR` / `U-VTRIG` |
| `review-evidence.md` | #1360 | `U-REVIEW` |
| `cross-review-enforcement.md` | #1360 | `U-XREVIEW` |
| `test-before-review.md` | #1360 | `U-TORDER` |
| `module-drift.md` | #1360 | `U-MDRIFT` / `U-FR-L1-49` / `U-DDDTDD` / `U-FR-L1-50` |
| `gate-confirm.md` | #1360 | `U-GCONF` |
| `plan-schedule-lint.md` | #1360 | `U-PLANSCH` |
| `fr-unit-coverage.md` | #848 | `U-FR-L1-01..50` |

この表は現時点の PLAN 起点 inventory であり、後から追加された L6 文書 (descent-obligation / skill-index など) の oracle family を網羅しない。これは正式な目標契約上の必須所有者形式を限定しない。後発文書の対応は、正式契約では各文書の所有者 (`plan:` または `issue:`) と選択した L7 文書に束縛される。

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

PLAN-L7-363 以降、`appendGateRun` は `writeGateRunEvidence` として CLI 判定後に必ず呼ぶ。gate verdict は `evaluateGateReview` + `evaluateStaticGate` の合成であり、証跡書込の失敗も verdict / exit を変えず stderr 警告にする。
新規 final は `.ut-tdd/gate_runs/<lowercase hex(sha256(UTF-8 bytes of gate_run_id))>.json` とし、完成 JSON を同一 filesystem 上の一意な `.tmp-*` (末尾 `.json` 以外) temp に書き、hard link で no-clobber publish する。temp は reader の `*.json` glob 外に置く。ID 以外の hash 入力・別名救済はなく、hash collision も拒否する。
同じ ID の並行実行は一方だけ publish し、EEXIST / link 非対応・失敗を含む全書込失敗は警告に留める。crash した temp は次の実行で削除せず、retry は新しい ID を使う。
旧 `<gate>-<timestamp>-<hash>.json` も読み、全形式を内容の ID で照合して同じ ID の重複を拒否する。schema は `schema_version`、`gate_run_id`、`gate_id`、`timestamp/checked_at`、`plan_id`、`session_id`、`mode`、`review_kind`、`worker_model`、`reviewer_model`、`checklist_path`、`coverage_summary_path`、`command`、`checks[]`、`messages[]` を持つ。
`plan_id` は `--plan`、`UT_TDD_PLAN_ID`、current-plan/branch 推定の順で解決し、無ければ `null` (欠陥ではない)。新規 ID は `gate-run:${compactSlug(gateId)}:${sha256(runSeed).slice(0, 12)}` (`runSeed = [gateId, checkedAt, sessionId ?? "", process.pid].join(":")`) とし PLAN を含めず、既存 ID を移行・再計算しない。coverage は既存証跡の不整合 (6 列の不一致・同じ ID の重複など) と、証跡全体が 0 件の場合を fail-close で検出するが、新規 publish に失敗した実行を個別に検出する保証はない (CANDIDATE-U-GATE-009/010)。

`rebuildHarnessDb` は `.ut-tdd/gate_runs/*.json` を読み、既存 `gate_runs` 列
(`gate_run_id/gate_id/plan_id/status/checked_at/evidence_path`) と `workflow_runs`
(`workflow=routine-gate`, `phase=<gate_id>`, `workflow_run_id=stableId("gate-workflow", gate_run_id)`)
へ投影する。gate 実行と PLAN の関係は次のとおりとする (Issue #1359、修正版 A)。

- **実行の識別と整合**: `plan_id` は任意の旧属性であり、解決できなければ空のまま投影する。実行の識別は
  `gate_run_id` だけで行い、整合は `gate_id` (空は不正) と、解決できる `evidence_path` (`.ut-tdd/gate_runs/`
  配下の JSON が読め、その `gate_run_id` と `gate_id` が行と一致する) で確かめる。`plan_id` が空であることを
  理由に、`workflow_runs` への投影を省いたり照合から外したりしない。
- **workflow との対応は実行単位**: `routine-gate` の workflow row と gate row は `workflow_run_id` の導出で
  1 対 1 に対応させ、`phase` と `gate_id`、`plan_id` の一致を確かめる。`plan_id` だけで照合しない (無関係な
  1 件の gate row が他の実行を充足したことにしない)。PLAN の無い `routine-gate` row の `drive_run_id` は空とし、
  drive との結合検査 (`drive-db-registration`) は `routine-gate` 以外の workflow row にだけ掛ける。
- **PLAN 単位の consumer**: `evaluateAutomationReadiness` は `routine-gate` row を実行単位で判定し、対応する
  gate row が `passed` であることを必要条件にする (失敗・対応の欠落は blocked。同じ `plan_id` の別実行の成功を
  借りない)。`selectScheduleLiveState` など PLAN 単位で gate signal を読む consumer は、`plan_id` が空の row を
  どの PLAN にも帰属させない。表示だけの consumer (`selectSessionStartDigest`、job summary) は空の `plan_id`
  をそのまま表示する。
- **seed (A-132)**: `.ut-tdd/audit/A-132-l8-l14-verification-band-execution.md` (2026-06-11 の L8〜L14
  local verification band の実行記録) を歴史的な投影元として使う場合、対象は `G-VERIFY.L8`〜`G-VERIFY.L14`
  の 7 件の `gate_runs` row だけとし、`status` は `historical` (現在の判定ではない) とする。seed は PLAN の
  有無に依存せず、`plan_id` は空、`evidence_path` は A-132 の path とする。A-132 の存在だけで `passed` の
  gate row、`passed_local` の workflow row、`passed` の coverage row を作らない。seed row は
  `gate_runs` の 0 件を避ける入力にはなるが、`routine-gate` の workflow row との対応を充足しない。
  **正規の seed row** は次をすべて満たす row だけとする: `gate_id` が `G-VERIFY.L8`〜`G-VERIFY.L14` の
  どれか、`gate_run_id` が `stableId("verification-band-gate", <layer>)` (`<layer>` は `gate_id` の
  `G-VERIFY.` を除いた部分) と一致、`evidence_path` が A-132 の固定 path と一致し、その A-132 が repo に
  実在、`status` が `historical`、`plan_id` が空、同じ `gate_id` の seed row が 1 件だけ。正規の seed row
  に限り、JSON 証跡の検査、JSON 証跡集合との鮮度比較、`routine-gate` workflow row との双方向の対応検査から
  外す。`status=historical` だけでは外さない。`status=historical` なのに上の条件を 1 つでも満たさない row、
  および上の 7 件以外の `G-VERIFY.*` row は違反とする。
- **retry**: `projectRetryEvents` と運用指標の `retry_groups` は、`plan_id` の有無にかかわらず
  `routine-gate` row を retry の推定の対象外とする (同じ gate の別実行を retry の系列と見分ける識別子が無く、
  PLAN の無い無関係な実行を 1 群にまとめないため)。代わりの作業単位ができたら、その単位で retry を定め直す。
  それ以外の workflow は従来どおり同一 `(plan_id, workflow, phase)` の複数 row を retry とする。

`writeGateRunEvidence` は証跡を排他作成し衝突時は上書き・別名救済をせず拒否する (gate verdict / exit は従来どおり)。
`gate-run-coverage` は現在の `.ut-tdd/gate_runs/*.json` を正本として、新規証跡を投影し、証跡の無い DB-only gate row と、同じ実行に対応する `routine-gate` workflow row を正規 seed 以外除外する。新規追加・DB-only 行の除外・実在証跡と DB row の比較は、投影全体の単一 transaction (`BEGIN IMMEDIATE`) 内で行う。
実在証跡と対応 DB 行の `gate_run_id` / `gate_id` / `plan_id` / `status` / `checked_at` / `evidence_path` は全て比較し、不一致は fail-close、両方空の `plan_id` は一致とする。
全証跡を独立に評価して不一致を見落とさないが、1 件でも不一致があれば追加・削除を含む投影全体を rollback し、旧 DB 状態を保つ。証跡が無い実行の gate row と、`stableId("gate-workflow", gate_run_id)` で導出される対応 workflow row は両方とも除外するため、証跡欠落による対応欠落 violation にはしない。正常に再投影した後の再実行は同じ結果を返し、DB 状態も変えない (冪等)。次も fail-close で検出する:
`gate_runs` の 0 件、seed を名乗るのに正規でない row、実在証跡に対応する `routine-gate` workflow row と gate row の片側欠落、
空の `gate_id`、不正 JSON・識別の不一致 (`gate_run_id` / `gate_id`)。
`plan_id` が空の gate row と、`plan_registry` に無い `plan_id` を持つ gate row は、それだけでは違反にしない。
A-132 だけがあり JSON 証跡が無い clean tree では、`gate_runs` は正規の seed row 7 件で、violation は 0 となる。

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

### D.1 退役記録: `src/lint/plan-dod.ts`

`plan-dod` は PLAN の DoD 台帳だけを検査する doctor check として、後続の #1382 PR2 で退役させる目標である。この docs-only PR の時点では実装はまだ存在する。PR2 適用後は旧関数契約 (`loadPlanDodDocs` / `analyzePlanDod` / `planDodMessages`) を active な L6 契約から外し、履歴記録として扱う。唯一の production consumer は `src/doctor/process-quality.ts` の wrapper を通る doctor 配線である。PLAN の schema や他の DoD 関連契約の退役は対象外。

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
        | "missing_registered_hook_events" | "missing_required_mode"
        | "mode_catalog_unmapped";   // docs/process/modes/ にあるが写像 (MODE_CATALOG_DOC_FILES) に無い mode doc。doc 名は `mode` に入る (#1169 A5-C13)
  count?: number; mode?: string;
}
interface DriveDbRegistrationResult {
  stats: DriveDbRegistrationStats | null; violations: DriveDbRegistrationViolation[]; ok: boolean;
}
```

共通 invariant: `analyzeDriveDbRegistration` は純粋関数 (DB アクセスは呼び出し元の `checkDriveDbRegistration` が担う)。必須 mode 集合はハードコード定数を廃止し (PLAN-L7-243)、stats 収集側が plan_registry (route_mode 正本 + legacy フォールバック、`src/schema/mode-catalog.ts` の `workflowModeForPlan`) から導出した `expectedModes` を突合する。`docs/process/modes/` の mode doc に `MODE_CATALOG_DOC_FILES` 写像が無い場合は `mode_catalog_unmapped` で fail-close する (新 mode 追加の取りこぼし防止)。legacy stats (expectedModes 未提供) のみ `LEGACY_REQUIRED_MODES` (`Discovery/Forward/Recovery/Reverse/Verification`) で従来水準を維持。orphan 検査は stats フィールドの正値チェックで行い、DB クエリを直接発行しない。

#### PLAN 撤去後の扱い (#1168 A4)

`docs/plans/` を物理撤去する (#1078 / #1170) と、`plan_registry` と、そこから導出する `drive_runs` / `workflow_runs` / `model_runs` / `skill_recommendations` / `skill_invocations` が 0 件になる。現行の検査は次の 3 種に分かれる。この節は既存の検査を狭め、routine-gate の独立照合を除き新しい検査や機構は足さない。

入力の由来 (実装の根拠):

| 検査 / 統計 | 入力の由来 | 根拠 (file:line) | 処遇 |
|---|---|---|---|
| `empty_plan_registry` | `plan_registry` の行数。PLAN ファイル由来 | `src/lint/drive-db-registration.ts:73`, `src/state-db/drive-registration.ts:100` | 退役 |
| `stale_plan_registry` / `stale_plan_registry_fingerprint` | `docs/plans/*.md` の件数と frontmatter hash | `drive-db-registration.ts:74-85`, `drive-registration.ts:34-59,173-174,206-207` | 退役 (0 件同士は一致するが、検査自体を置かない) |
| `missing_drive_runs` / `plans_without_drive_run` | `drive_runs` は projectPlans が返した PLAN ごとに投入する | `drive-db-registration.ts:86-89`, `src/state-db/projection-writer.ts:440-470` | 退役 |
| `missing_workflow_runs` | `workflow_runs` は PLAN ID を持つ gate 実行と固定の検証帯 PLAN から投入する | `drive-db-registration.ts:90`, `projection-writer.ts:1096,1242-1252` | 退役 |
| `workflow_orphans` | `workflow_runs` → `drive_runs` の JOIN。式は `plan_registry` を経由しないが、`workflow_runs` は PLAN ID を持つ gate 証跡から作られ、`drive_runs` は PLAN のループ内でしか作られないため、PLAN を撤去すると orphan が残る(実質 PLAN 由来) | `drive-db-registration.ts:91-93`, `drive-registration.ts:110-116`, `projection-writer.ts:443,475-477,1225-1253` | `planCount` が 1 以上なら routine-gate 以外を維持 (下記 c)。0 件のときは評価しない |
| `missing_model_runs` | レビュー証跡のある PLAN の `crossEntries` から投入 (token 計測の session 行は別経路で、fallback rebuild は `skipTokenTelemetry`) | `drive-db-registration.ts:94`, `projection-writer.ts:663-690,705,203` | 退役 |
| `model_orphans` | `plan_registry` への JOIN (PLAN の所属に依存)。`role='session'` の行は除外済み | `drive-db-registration.ts:95-97`, `drive-registration.ts:123-129` | `planCount` が 1 以上のときだけ維持 (下記 c) |
| `missing_skill_recommendations` / `missing_skill_invocations` | PLAN ごとの推薦と、そのレビュー受理・runtime hook の PLAN から投入 | `drive-db-registration.ts:98-109`, `src/state-db/skill-projections.ts:115,131`, `src/state-db/runtime-projections.ts:173` | 退役 |
| `skill_recommendation_orphans` / `skill_invocation_orphans` | `plan_registry` への JOIN (PLAN の所属に依存) | `drive-db-registration.ts:101-105,107-109`, `drive-registration.ts:131-145` | `planCount` が 1 以上のときだけ維持 (下記 c) |
| `missing_registered_hook_events` | `hook_events` を `plan_registry` に JOIN した件数。session log の `plan_id` が PLAN に解決できる行だけ数える | `drive-db-registration.ts:110-112`, `drive-registration.ts:146-151`, `projection-writer.ts:500-516` | 退役 |
| `missing_required_mode` | 期待 mode は `plan_registry` の `route_mode` / `kind` から導出する (`workflowModeForPlan`) | `drive-registration.ts:71-86`, `drive-db-registration.ts:113-115` | 退役 (c の「期待 mode が空」で自然に 0 件になる。`LEGACY_REQUIRED_MODES` は PLAN 無しの経路で使わない) |
| `mode_catalog_unmapped` | `docs/process/modes/` と `MODE_CATALOG_DOC_FILES` の差分。PLAN 非依存 | `drive-registration.ts:90-96`, `drive-db-registration.ts:116-118` | **維持 (変更なし)** |
| `missing_db` | `.ut-tdd/harness.db` の有無。PLAN 非依存 | `drive-db-registration.ts:67-72` | **維持 (変更なし)** |
| `hookOrphans` (統計のみ。違反理由にしない) | 現行でも違反に使わない | `drive-db-registration.ts:30` の合格メッセージ | 変更なし |

(a) 退役する検査: 入力が PLAN 由来のものは、`docs/plans/` が無い・空のときに違反にしてはならない。`stats.planCount` が 0 の入力に対して、上の「退役」の行は違反を返さない。

(b) 変更しない検査: `missing_db` と `mode_catalog_unmapped`。どちらも PLAN の有無に関係しない。`planCount` が 0 のときに残る違反はこの 2 つだけである。`planCount` が 1 以上の検査は、routine-gate の除外を除き現行の振る舞いを変えない。

routine-gate の `workflow_runs` 行は §2.2 の gate 証跡と実行単位の照合で守るため、`workflow_orphans` の drive JOIN 検査から PLAN の有無にかかわらず常に除外する。`planCount >= 1` でも routine-gate 以外の既存 JOIN 評価を維持する。

(c) 入力が混在する検査の変更:

- **PLAN 由来の orphan (`workflow_orphans` / `model_orphans` / `skill_recommendation_orphans` / `skill_invocation_orphans`)**: `plan_registry` に所属する行かどうかを見る検査で、orphan 検査を一括で残すことはしない。`planCount` が 1 以上のときは JOIN を維持し、routine-gate 行を除いて現行どおり評価する。`planCount` が 0 のときは所属先が存在しないので評価しない (違反にしない)。`model_orphans` で `role='session'` を除外する条件は変えない。
- **期待 mode**: `expectedModes` は `plan_registry` から導出する。`planCount` が 0 なら空集合となり `missing_required_mode` は出ない。`expectedModes` が未提供 (legacy DB) のときの `LEGACY_REQUIRED_MODES` 照合は、`planCount` が 0 のときは行わない。
- **必須統計の件数 (`missing_*`)**: PLAN 非依存の源 (session の token 計測、hook の生ログ) だけで数えた値で「1 件以上」を要求する検査は置かない。現行の件数は PLAN に紐づく投入のみを数えており、PLAN 非依存の件数を要求すると、計測が無い clone で恒常的に赤くなるため。

`planCount` が 0 のときの期待動作 (`analyzeDriveDbRegistration`):

- `stats` が `null` なら従来どおり `violations=[{reason:"missing_db"}]`, `ok=false`。
- `stats.planCount === 0` かつ `unmappedCatalogDocs` が空なら `violations=[]`, `ok=true`。`driveRuns` / `workflowRuns` / `modelRuns` / `skillRecommendations` / `skillInvocations` / `registeredHookEvents` / `modes` が全て 0・空でも同じ。
- `stats.planCount === 0` でも `unmappedCatalogDocs` があれば `mode_catalog_unmapped` だけを返し `ok=false`。
- 合格メッセージ (`driveDbRegistrationMessages`) は `plans=0` を含めて出す。
- 実装は PLAN 撤去前でも成立する: `planCount` が 1 以上では routine-gate 行の orphan 除外だけを変え、他の検査結果は変えない。`planCount` が 0 では PLAN 由来の検査を退役する。

この変更は既存の検査の撤去・限定であり、routine-gate は §2.2 の独立照合で守る。PLAN ID を要件にしない (#1166)。

### D.5 `src/lint/fr-roadmap-coverage.ts`

parent PLAN = PLAN-L7-50。L6 契約なし着地分の後追い明文化。oracle ID 宣言は L7 oracle slice で別途行うため本サブセクションでは省略し、関数 signature + DbC + doctor 配線のみを記録する。

| 関数 (実 export) | signature | pre | post | doctor 配線 |
|---|---|---|---|---|
| `analyzeFrRoadmapCoverage` | `(docs: FrRoadmapCoverageDoc[]) => FrRoadmapCoverageResult` | `docs` は `loadFrRoadmapCoverageDocs` 等で事前に取得したもの; fs アクセスなし (純粋); `repoRoot` は `process.cwd()` で補完 | `FrRoadmapCoverageResult` を返す; `checked=docs.length`; 各 doc の残留 bucket テーブル (`## Residual Feature Buckets`) が存在しない場合 `violations` に `missing_section` を積む; 既定 bucket 集合 (R1〜R9) のうち doc 内に未出現のものは `missing_expected_bucket` として違反; 解決が特定できない open 行は `ambiguous_resolution` 違反; `closed` 行には closure evidence セクション (`## Residual Feature Closure Evidence`) の対照検査を行い、source/test 参照先の fs 実在を `process.cwd()` 基準で検証; 全 violations = 0 かつ open rows = 0 のとき `ok=true` | `checkFrRoadmapCoverage` → `runDoctor.ok` / `runDoctor.messages` |
| `analyzeFrRoadmapCoverageWithRoot` | `(docs: FrRoadmapCoverageDoc[], repoRoot: string) => FrRoadmapCoverageResult` | `docs` は取得済み; `repoRoot` は fs 実在確認の基点パス; `analyzeFrRoadmapCoverage` の実装委譲先 (repoRoot を明示渡し) | 同上; closure evidence の source/test 参照先は `join(repoRoot, path)` で存在検証; `missing_evidence_file` 違反はファイルが実在しない場合に積む; 純粋性の例外 = fs 実在確認 (`existsSync`) を内部で呼ぶ | `checkFrRoadmapCoverage` の内部委譲先 |
| `loadFrRoadmapCoverageDocs` | `(repoRoot?: string) => FrRoadmapCoverageDoc[]` | `repoRoot` 省略時は `process.cwd()` を使用; fs 端点; 対象ファイルが存在しない場合は空配列を返す (fail-open) | `.ut-tdd/audit/A-133-upstream-vmodel-coverage-audit.md` を読み込み `FrRoadmapCoverageDoc[]` として返す; `file` フィールドは `join(".ut-tdd", "audit", "A-133-upstream-vmodel-coverage-audit.md")` (repo 相対) | `checkFrRoadmapCoverage` の唯一の fs 端点 |
| `frRoadmapCoverageMessages` | `(result: FrRoadmapCoverageResult) => string[]` | `result` は `analyzeFrRoadmapCoverage` / `analyzeFrRoadmapCoverageWithRoot` の返り値; 純粋関数 | `checked=0` のとき bucket テーブル不在を示す単一違反メッセージを返す; violations > 0 のとき最大 8 件のサンプル (`file[:bucket]:reason`) を含む違反メッセージを返す; open rows > 0 のとき status 別カウントと bucket 一覧を含むメッセージを返す; すべて解決済みのとき `OK (checked=N, buckets=N, closure=N)` 形式の合格メッセージを返す | `checkFrRoadmapCoverage` → `runDoctor.messages` |

closure evidence 表の `PLAN / WBS` 列は互換のために維持する。後続の #1382 PR2 で、closed 行の任意の文脈情報として扱い、空欄や参照pathの実在を検査しないよう実装する。source/test 参照先の実在検査は維持する。

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
  file: string; bucket: string; planTarget?: string;
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
    | "missing_source_target"
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

## 2026-10-21 lint gate 契約 back-fill (#1169 A5-C04 / C05 / C06)

実装が正本。契約が設計文書に無く、起票時の記述だけに残っていた 3 つの doctor hard gate を、現行 src から書き起こして固定する (出典: #1169 の移管表 A5-C04 / C05 / C06)。いずれも `src/doctor/check-definition-groups.ts` の `full(...)` 登録 (profile = `full` のみ) で、check の `ok=false` は doctor 全体の失敗になる (advisory ではなく hard gate)。

### D.7 `analyzeVerificationProfileGate` (A5-C04、`src/lint/verification-profile.ts`)

| 関数 (実 export) | signature | 入力 | 出力 |
|---|---|---|---|
| `analyzeVerificationProfileGate` | `(recommendation: VerificationRecommendationResult) => VerificationProfileGateResult` | `recommendVerificationProfiles(changedFiles)` の結果 (`changedFiles` / `recommendations` / `edges` / `missingProfiles` / `ok`)。純粋関数 | `{ recommendation, activationPlan, defaultRunnableProfiles, externalProfiles, findings, ok }` |
| `verificationProfileGateMessages` | `(result: VerificationProfileGateResult) => string[]` | 上の結果 | `ok` なら `verification-profile - OK (N profiles recommended; default_runnable=N; external_gated=N)` の 1 行。違反なら `verification-profile - violation` + finding ごとに `<code>[ <profileId>]: <message>` |
| `loadVerificationRecommendation` | `(repoRoot?: string) => VerificationRecommendationResult` | `loadChangedFiles(repoRoot)` (`git status --porcelain`) の変更ファイル | `recommendVerificationProfiles` の結果 |

判定 (finding の `code` は `VerificationProfileGateFindingCode` の全 4 値):

| code | 条件 |
|---|---|
| `recommendation-without-signal` | 推奨された profile の `signals` が空 |
| `missing-default-profile` | 推奨が 1 件以上あるのに `defaultEnabled` の profile が 0 件 |
| `unrunnable-default-profile` | `defaultEnabled` の推奨 profile に具体 runner (`PROFILE_RUNNERS[id]`) が無い |
| `external-without-activation-plan` | `defaultEnabled=false` の推奨 profile について、`planExternalProfileActivation({ allowExternal: false })` の step に `human-approval` と `refuse-run` の両方が無い |

- `ok = recommendation.ok && findings.length === 0`。推奨が 0 件 (変更ファイルに該当 profile なし) なら finding は出ず、`recommendation.ok` に従う。
- `defaultRunnableProfiles` は runner を持つ default 推奨 profile の id 昇順、`externalProfiles` は外部 / 既定無効の推奨 profile の id 昇順。`findings` は `code:profileId` の昇順。
- 外部 profile は既定で無効のまま、承認と拒否の経路を持つことだけを証明する。このゲートは profile を実行しない。

doctor 配線: `checkVerificationProfile(repoRoot)` (`src/doctor/lint-gates.ts`) が `loadVerificationRecommendation` → `analyzeVerificationProfileGate` → `verificationProfileGateMessages` を委譲し `{ messages, ok: r.ok }` を返す。check 名 `verification-profile`、`full` profile、hard gate。`repoRoot` が存在しない場合は `verification-profile - violation: repo root could not be read`、読み取り中の例外は `verification-profile - violation: changed file graph could not be read` で、どちらも `ok=false` (fail-close)。非 git の skip は無い (change-impact 系と異なり、`git status` が失敗すれば fail-close)。

oracle: `tests/verification-profile.test.ts` の「hard-gates default runnable profiles while routing external profiles to approval/refusal」(正常系: `ok=true` / `defaultRunnableProfiles` / `externalProfiles` / `human-approval` と `refuse-run` の step / メッセージ内 `default_runnable=2`) と、`tests/doctor.test.ts` の repo root 不在時の fail-close 検査 (`checkVerificationProfile(missingRoot)`)。テスト設計の oracle ID は未登録 (`docs/test-design/` に本関数の ID は無い)。4 つの finding code を個別に落とす異常系のテストは、現時点で存在しない。

### D.8 `analyzeChangeSetIntegrity` (A5-C05、`src/lint/change-impact.ts`)

| 関数 (実 export) | signature | 入力 | 出力 |
|---|---|---|---|
| `analyzeChangeSetIntegrity` | `(input: ChangeSetIntegrityInput) => ChangeSetIntegrityResult` | `{ changedFiles: string[]; dependencyDrift?: DependencyDriftResult \| null }`。純粋関数 | `{ changedFiles, sourceFiles, designFiles, testFiles, categories, warnings, blockers, ok }` |
| `changeSetIntegrityMessages` | `(result: ChangeSetIntegrityResult) => string[]` | 上の結果 | 1 行目 `change-set-integrity - OK\|violation (categories=...; warnings=N; blockers=N)`、続けて blocker ごとに `change-set-integrity - block <code>: <message>[ (<modules>)]`、warning ごとに `change-set-integrity - warn <code>: <message>` |
| `isGitRepository` | `(repoRoot?: string) => boolean` | `git rev-parse --is-inside-work-tree` | `true` のときのみ true (失敗は false) |

型: `ChangeSetCategory = "source" | "design" | "test"`。`ChangeSetIntegrityFindingCode = "incomplete-artifact-set" | "singleton-artifact-set" | "dependent-regression-untouched"`。`ChangeSetIntegrityFinding = { code; severity: "warn" | "error"; message; files?; modules? }`。

分類 (path は `\` を `/` に正規化し、重複除去して昇順):

- source = `^src/.+\.(ts|tsx)$`
- design = `^docs/design/harness/.+\.md$` または `^docs/plans/PLAN-.+\.md$` (実装の正規表現どおり。後者は PLAN 凍結後も実装が数えている分類であり、本節が新規に要件とするものではない)
- test = `^tests/.+\.test\.ts$` または `^docs/test-design/harness/.+\.md$`
- `.ut-tdd/harness.db-journal|shm|wal` は `parseGitPorcelain` が変更集合から除外する。rename は新 path を採る。

判定:

| code | severity | 出力先 | 条件 |
|---|---|---|---|
| `singleton-artifact-set` | `warn` | `warnings` | 該当 category がちょうど 1 種 (source のみ / design のみ / test のみ) |
| `incomplete-artifact-set` | `warn` | `warnings` | category が 1〜2 種 (全体で欠ける category を列挙)。さらに source があり design か test が無い場合は、source files を対象にもう 1 件 (`source changes are missing design/plan + test/test-design` の欠落分) |
| `dependent-regression-untouched` | `error` | `blockers` | `dependencyDrift` が非 null かつ source 変更あり、変更 module を `moduleEdges` の `to` とする依存元 module (変更 module 自身を除く) が 1 つ以上あり、その変更 module または依存元 module を対象とする `testCoverage` の `from` のうち変更集合に含まれる test が 0 件 |

- 変更 module は `src/<dir>/...` なら `<dir>`、`src/<name>.ts(x)` なら `<name>`。
- `ok = blockers.length === 0`。warning は非ブロックで、`ok` に影響しない (warn-first)。変更集合が空なら category 0 で finding なし、`ok=true`。source のみの変更は上の 2 規則に同時に該当するため `singleton-artifact-set` 1 件 + `incomplete-artifact-set` 2 件の warning になる。

doctor 配線: `checkChangeSetIntegrity(repoRoot)` (`src/doctor/lint-gates.ts`)。`repoRoot` 不在は `change-set-integrity - violation: repo root could not be read` で `ok=false`。`isGitRepository` が false なら `change-set-integrity — skipped (not a git repository)` で `ok=true` (非 git の fail-open。ZIP 展開の配布物で変更集合を確定できないため)。git がある場合は `analyzeDependencyDrift(loadDependencyDriftInput(repoRoot))` と `loadChangedFiles(repoRoot)` を入力に委譲し、読み取り中の例外は `change-set-integrity - violation: change/dependency graph could not be read` で `ok=false` (fail-close)。check 名 `change-set-integrity`、`full` profile、hard gate (blockers だけが落とす)。

oracle: `tests/change-impact.test.ts` の describe `change-impact lint` 内の 4 件、すなわち「warns when only one artifact category is touched」「warns when a change set has only a partial artifact set」「blocks when dependent modules exist and mapped regression tests are untouched」「passes dependency block when a mapped regression test is part of the change set」 (いずれもテスト設計の oracle ID は未登録)。非 git の skip と root 不在の fail-close は `U-CHGIMPACT-NONGIT-01` (`docs/test-design/harness/L7-unit-test-design.md`、`tests/doctor.test.ts` の「skips change-impact / change-set-integrity in a non-git directory instead of failing closed」)。同一ファイル内の `U-CHGIMPACT-001`〜`004` は `analyzeChangeImpact` / `parseGitPorcelain` の oracle であり、`analyzeChangeSetIntegrity` の oracle ではない。

### D.9 `analyzeRuntimePortability` (A5-C06、`src/lint/runtime-portability.ts`)

| 関数 (実 export) | signature | 入力 | 出力 |
|---|---|---|---|
| `analyzeRuntimePortability` | `(docs: RuntimePortabilityDoc[]) => RuntimePortabilityResult` | `RuntimePortabilityDoc = { path: string; text: string }` の配列。純粋関数 (fs なし) | `{ checked: docs.length, violations: RuntimePortabilityViolation[], ok }`。`RuntimePortabilityViolation = { path; line; rule: string; message }` (`rule` は union ではなく文字列。下表が現行の全値) |
| `loadRuntimePortabilityDocs` | `(repoRoot?: string) => RuntimePortabilityDoc[]` | `git ls-files --cached --others --exclude-standard` (tracked + untracked かつ ignore 外)。git が失敗する場合は `package.json` / `tsconfig.json` / `package-lock.json` と `src` / `.claude/hooks` / `scripts` 配下を filesystem 走査する fallback | 走査面 = `package.json` / `tsconfig.json` / `package-lock.json` と `src/` / `.claude/hooks/` / `scripts/` / `tests/` 配下のうち実在するファイル (`src/web/` は `.gitkeep` 以外除外)、path 昇順 |
| `runtimePortabilityMessages` | `(result: RuntimePortabilityResult) => string[]` | 上の結果 | OK なら `runtime-portability - OK (checked=N, TS/Bun/Node surfaces clean)`。違反なら `runtime-portability - violation N (<path>:<line>:<rule>, ...最大 8 件)` |

判定 (violation の `rule` 全値、`ok = violations.length === 0`):

| 対象 | rule | 条件 |
|---|---|---|
| `package.json` | `package-json-invalid` | JSON として読めない (以降の package 検査は行わない) |
| | `package-missing-esm` | `type` が `module` でない |
| | `package-missing-node-engine` | `engines.node` が無い (`engines.bun` は任意) |
| | `package-missing-compiled-build` | `scripts.build` が `node scripts/build-node.mjs` を呼ばない |
| | `package-bin-not-source-cli` | `bin["ut-tdd"]` (または文字列 `bin`) が `./src/cli.ts` でない |
| | `package-missing-typecheck` | `scripts.typecheck` が `tsc --noEmit` を含まない |
| | `package-missing-vitest-full-suite` | `scripts.test` が Vitest runner (`vitest run` または `scripts/run-vitest-snapshot.ts`、`npm run test:vitest-snapshot` 経由の間接参照も可) を指さない |
| | `package-missing-fast-test-lane` | `test:fast` が Vitest runner を指さない、または `--exclude tests/projection-writer.test.ts` / `--exclude tests/cli-surface.test.ts` を欠く |
| | `package-missing-db-test-lane` | `test:db` が Vitest runner を指さない、または `tests/db-projection-ingestion.test.ts` / `tests/drive-db-registration.test.ts` / `tests/projection-writer.test.ts` を欠く |
| | `package-missing-cli-test-lane` | `test:cli` が Vitest runner を指さない、または `tests/cli-surface.test.ts` / `tests/runtime-hook-entrypoints.test.ts` を欠く |
| | `package-missing-node-fallback-smoke` | `test:node-fallback` が Vitest runner を指さない、または `tests/state-db.test.ts` / `tests/runtime-portability.test.ts` を欠く |
| `tsconfig.json` | `tsconfig-invalid` | JSON として読めない |
| | `tsconfig-not-strict` | `compilerOptions.strict !== true` |
| | `tsconfig-missing-node-types` | `compilerOptions.types` に `node` が無い |
| 各ファイル | `core-non-typescript-file` | `src/` 配下で拡張子が `.ts` / `.gitkeep` 以外 |
| | `hook-non-typescript-file` | `.claude/hooks/` 配下で `.ts` 以外 |
| | `disallowed-runtime-language` | `src/` または `.claude/hooks/` 配下の `.py` / `.sh` / `.bash` / `.js` / `.mjs` / `.cjs` |
| | `script-wrapper-unapproved` | `scripts/` 配下で、承認集合 (薄い wrapper `scripts/ut-tdd` / `scripts/ut-tdd.ps1` / `scripts/run-vitest-snapshot.ts`、build `scripts/build-node.mjs`、CI `scripts/node-generation-ci.mjs` / `scripts/node-generation-ci-aggregate.mjs` / `scripts/pack-canary-acceptance.mjs`、git hook `scripts/git-hooks/pre-push` / `scripts/git-hooks/secret-scan-diff.ts`) 外のファイル |
| | `script-wrapper-not-thin` | wrapper (`run-vitest-snapshot.ts` を除く) の非コメント行が 12 行超、または `src/cli.ts` と `dist/ut-tdd` の 2 つの文字列のうち、いずれか一方でも含まない (両方の dispatch 先を含むことが必須) |
| | `script-wrapper-python` | wrapper が `python` / `python3` を含む |
| | `git-hook-entrypoint-python` | `scripts/git-hooks/pre-push` が `python` / `python3` を含む |
| | `git-hook-entrypoint-not-thin` | `scripts/git-hooks/pre-push` が `node` と `secret-scan-diff.ts` の両方を含まない |
| | `git-hook-scanner-not-reusing-core` | `scripts/git-hooks/secret-scan-diff.ts` が `src/lint/secret-scan` を参照しない |
| | `source-shell-runtime` | `src/` (`src/runtime/` を除く) が `spawn` / `exec` 系の第 1 引数に `bash` / `sh` / `python` / `python3` / `powershell` / `pwsh` / `cmd` を直接渡す |
| | `bun-runtime-spawn` | `src/` / `.claude/hooks/` / `scripts/` / `tests/` で bun の child-process 起動 (`spawn*` / `exec*` への `"bun"`、`findBun(`、`?? "bun"`、`"/c", "bun"`、`["bun", [`、`exec bun`) |
| | `bun-module-import` | 同範囲で `"bun:<英小文字>"` 形の import 文字列 |
| | `bun-global-reference` | 同範囲で `Bun.` / `Bun[` / `Bun?.` / `Bun?.[` (optional chaining を含む) / `typeof Bun` / `).Bun` / `globalThis.Bun` / `process.versions.bun` |
| | `local-absolute-path` | `tests/` 以外で利用者ローカルの絶対 path (`<ドライブ>:\Users\`、`/home/`、`/Users/`、`~/<旧ソース repo>`) を含む (`<旧ソース repo>` は旧ソース repo の名前を表すプレースホルダー。公開 repo のため名前を書かない。実装は `src/lint/personal-path.ts` の `LEGACY_SOURCE_REPO` から組み立てる) |
| | `legacy-runtime-marker` | `src/` / `.claude/hooks/` / `scripts/` が旧 runtime の env / 状態ディレクトリ / コマンド / agent 接頭辞の marker を含む |
| `src/state-db/index.ts` | `sqlite-driver-fallback-missing` | `node:sqlite` の文字列を含まない (`bun:sqlite` は任意の残存) |

- bun 系 3 rule は行単位で数え、`BUN_SPAWN_DEBT_ALLOWLIST` / `BUN_IMPORT_DEBT_ALLOWLIST` / `BUN_GLOBAL_DEBT_ALLOWLIST` (path 完全一致 + 許容行数 pin) に載る path は pin までの行を許し、pin を超えた行だけを違反にする。載らない path は pin=0 で全行 fail-close。pin は検出語彙の fixture と本 lint 自身の定義行だけを対象とし、増加は Issue #134 の帰属を要する (恒久 bypass ではない)。同数の入れ替えは静的には検出できない (実装注記の限界)。
- 検出は repo に実在するイディオムの再流入を止める網であり、変数経由の間接 spawn やテンプレート補間の `bun:${...}` は対象外。

doctor 配線: `checkRuntimePortability(repoRoot)` (`src/doctor/rule-quality.ts`) が `loadRuntimePortabilityDocs` → `analyzeRuntimePortability` → `runtimePortabilityMessages` を委譲する。check 名 `runtime-portability`、`full` profile (`rules-and-process` group)、hard gate。`repoRoot` 不在は `runtime-portability - violation: repo root could not be read`、実行中の例外は `runtime-portability - violation: TS/Bun/Node portability lint could not run` で `ok=false`。git 不在は loader が filesystem 走査へ縮退するため skip せず検査を続ける (`U-CHGIMPACT-NONGIT-01` の記述が言う runtime-portability の非 git 方針と一致)。

oracle: `tests/runtime-portability.test.ts` の `U-RPORT-001`〜`U-RPORT-018` (`004A` を含む)。ただしテスト設計 (`docs/test-design/`) には `U-RPORT-*` の登録が無く、ID はテストファイル内の命名のみ。対応は、正常系 = 001 / 004 / 004A / 015、非 TS・shell 系 = 002、package / tsconfig / test lane = 003 / 008 / 009、untracked 走査 = 005、旧 marker = 006、git 不在 fallback = 007、git-hooks = 010〜014、bun 3 rule と allowlist の範囲・pin = 016 / 017 / 018。

### 注記 (実装と起票時記述の差分)

- A5-C04: 起票時の記述は「`verification-profile` を doctor hard gate にする」までで、4 つの finding code と `recommendation.ok` との AND は実装側にだけある。実装を正本とした。
- A5-C05: 起票時の記述は `runDoctor.ok` への直接配線だった。現行は `check-definition-groups.ts` の `full("change-set-integrity", ...)` 登録 (hard gate) で、非 git の skip (`isGitRepository`) は後から入った実装であり起票時記述に無い。
- A5-C06: 起票時の記述は「TS/Bun core」前提で、bun 系 3 rule (`bun-runtime-spawn` / `bun-module-import` / `bun-global-reference`) と debt allowlist、`node:sqlite` 主ドライバ必須、`engines.node` 必須、git-hooks entrypoint の 3 rule、`script-wrapper-unapproved` の承認集合 (build / CI / git hook) は実装側にだけある。runtime 正本は Node で、`engines.bun` は任意の残存宣言である。

## 2026-06-17 コスト階層 Dual-Provider Role Router 追補 (PLAN-L7-75 back-fill)

この addendum は §7.8.7.1 (hybrid 機能分散 MUST) / §1.8 (VALID_ROLES) / FR-L1-39 (classifyTask) を
L6 機能契約へ降ろし、PLAN-L7-75 で実装した `src/task/tier-router.ts` の Forward 設計を back-fill する
(drive=agent / kind=impl の bottom-up 実装に対する設計同期)。役割をコスト階層 (T0/T1/T2) × 2 provider
(claude/codex) で配置し、原則安く・上位帯は明示許可ゲートに保つ。task module 配下に置き、`task→team` の
import edge を一方向 (acyclic) に保つ (cycle 回避は dependency-drift gate が機械強制)。

3 archetype (役割の根本種別): **相談 (consult)** = tl/uiux (上位帯エスカレーション・プランナー、read-only)、
**ワーカー (worker)** = se/docs (実装・文書、下位帯)、**検証 (verify)** = qa (テスト通過後カバレッジ相談、上位帯)。
ティア表 `TIER_TABLE`: T0 = `{claude: MODEL_IDS.claude.opus, codex: MODEL_IDS.codex.frontier}` (フロンティア/明示許可)、
T1 = `{claude: MODEL_IDS.claude.sonnet, codex: MODEL_IDS.codex.luna}` (ワーカー専門)、T2 = `{claude: MODEL_IDS.claude.haiku,
codex: MODEL_IDS.codex.spark}` (ワーカー軽量)。

**モデル id 単一正本 (`MODEL_IDS`、PLAN-L7-58 carry 解消)**: model id 文字列の正本は `src/team/model-policy.ts`
の `MODEL_IDS` カタログ 1 箇所であり、`TIER_TABLE` (tier-router) と `modelForProvider` (model-policy) は
両方ともこの catalog を参照して合成する。従来は両者が同じ id literal を二重に持ち typo/drift の温床だった。
`MODEL_IDS.codex.frontier` (= `TIER_TABLE.T0.codex` = `modelForProvider` "frontier" family) のように
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
- design / implementation review: T0 reviewer として GPT frontier (`MODEL_IDS.codex.frontier`) または Claude Opus (`MODEL_IDS.claude.opus`) 以上を明示許可ゲート付きで使う。
- UI/UX 系: Claude Sonnet 系を優先し、effort は `xhigh` とする。

effort 既定:

- Claude 系は `high` を標準にする。
- GPT/Codex 系は `middle` を標準にする。
- review / critical judgement は一段上げ、GPT frontier review は `xhigh`、Claude/Opus review は `middle` とする。
- spark / mini など軽量モデル lane は `high` を標準にする。
- UI/UX は `xhigh` を指定する。

Codex への effort は stdin ではなく argv で注入する。`buildAdapterPlan`（`src/runtime/adapter.ts`）は provider 向けに正規化した effort（`middle` は `medium`）を `-c model_reasoning_effort=<effort>` として渡す。oracle: U-DELEG-005（`docs/test-design/harness/L7-unit-test-design.md`、#1169 A5-C14）。

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

runtime entrypoint は TypeScript/Node とし、OS wrapper は thin に限る。`scripts/ut-tdd` は Linux/POSIX `sh` entrypoint である。これは `set -e` を有効化し、compiled binary が存在する場合は `dist/ut-tdd` を実行し、それ以外は `node "$ROOT/src/cli.ts" "$@"` へ fallback する。wrapper は Bash-only syntax、Python runtime dispatch、legacy runtime name を導入してはならない。

`ut-tdd codex|claude --plan` の dynamic skill context injection は runtime startup 時の opportunistic 動作とする。current working tree が harness DB projection を rebuild できない場合、例えば hook/adapter smoke test 用 temp repo では、adapter execution は `UT-TDD context injection` block なしで継続する。task prompt と lifecycle digest は通常通り完了する。missing injection は adapter launch failure ではなく absent context として観測可能にする。

## 2026-07-01 上位モデル advisor command 追補

`src/team/advisor-policy.ts` は、Sonnet-class Claude または下位 GPT/Codex model が
orchestrator で、判断に迷う場合に上位モデルへ相談するための deterministic policy である。
公開 CLI は `ut-tdd advisor` とし、既定は dry-run adapter plan、`--execute` 指定時だけ
provider CLI を起動する。

| 関数 / CLI | signature / command | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `buildAdvisorDecision` | `(input: AdvisorInput) => AdvisorDecision` | `task` と `mode` がある。`provider` は未指定可。 | `provider`、上位 `model`、`effort`、`task_intent`、`adapterPlan` を返す。 | 技術判断 (`implementation` / `troubleshooting`) は Sol (`MODEL_IDS.codex.frontier`) + `low`、設計・進行・デザイン判断 (`design` / `progress` / `uiux`) は Fable (`MODEL_IDS.claude.fable`) + `low` を一次とし、他方を fallback にする (PO 2026-07-29)。orchestrator が frontier 級 (opus) の場合、相談は provider を問わず `adversarial` へ切り替える。下位 orchestrator からの相談は `current_model_lower_than_advisor=true` で surface する。 | U-CLI-ADVISOR dry-run / execute、U-ROUTE2-011〜U-ROUTE2-014 |
| `ut-tdd advisor` | `--task/--task-file`, `--provider`, `--decision`, `--current-model`, `--reason`, `--plan`, `--mode`, `--execute`, `--json` | `--task` と `--task-file` は相互排他。`provider` は `claude` / `codex` のみ。`--decision` の受理集合は `ADVISOR_DECISION_KINDS` (SSoT) と一致する。 | dry-run では adapter plan JSON を返す。`--execute` では既存 adapter 実行と同じ session logging を通して provider を起動する。 | advisor は read-only judgement prompt であり、file edit や gate close を主張しない。CLI 側に受理集合を別持ちしない (別持ちが `uiux` / `troubleshooting` を指定不能にする drift を生んでいた)。 | `tests/cli-surface.test.ts` |

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

### 台帳 row / gate ID 契約 (未実装)

**未実装**: 本節の authoring source・row・gate ID は L6 設計 freeze 済みだが、`src/` / `tests/` に実装は無い
(実装は PLAN-L6-50 §3.3 が後続 L7 add-impl へ送ったまま未起票。所有は PLAN-L6-50 / VMS-014 / TVMS-014)。

authoring source は tracked file `docs/governance/vmodel-execution-assignment-ledger.md` とし、harness.db は
検索用 projection であって正本にしない。row は最低限次の論理列を持つ。

| field | 契約 |
|---|---|
| `assignment_id` | `spec_id` + `task_kind` から作る stable ID。rebuild で変わらない |
| `spec_id` | `spec_defs.spec_id` に存在する ID |
| `task_kind` | `implementation` / `verification` / `review` |
| `target_artifacts` | 対応設計・実装・テスト・review packet の path 配列 |
| `completion_criteria` | `implementation` は対応 test / oracle、`verification` は検証レベルと再実行対象を含む |
| `status` | `planned` / `in_progress` / `done` / `pass` / `fail` / `archived` |
| `evidence` | command / PR / path / issue などの検証可能アンカー配列。`done` / `pass` / `fail` では必須 |
| `archived_reason` | `archived` のときだけ必須。宣言から消えた ID は削除せず `archived` へ退避する |

| gate ID | 検出条件 |
|---|---|
| `execution-assignment-evidence-missing` | `done` / `pass` / `fail` なのに evidence が空、または「確認しました」等の非アンカーだけ |
| `execution-assignment-unknown-spec` | `spec_id` が `spec_defs` に存在しない |
| `execution-assignment-target-missing` | `target_artifacts` または `completion_criteria` が空 |
| `execution-assignment-archive-reason-missing` | `archived` なのに `archived_reason` が無い |
| `execution-assignment-non-idempotent` | 同一入力で `assignment_id` / row 数 / archived row が揺れる |

`checkExecutionAssignmentLedger` が finding 化する「同一 assignment の重複」は上表と別の既存契約であり、本表で置き換えない。

移行元: `docs/plans/PLAN-L6-50-execution-assignment-ledger.md` (issue #648)

## harness.db on-disk currency 契約 (PLAN-L7-365)

on-disk `.ut-tdd/harness.db` の**鮮度 (currency)** だけを扱う。backup / recovery ledger / recovery-probe の
recoverability 軸は PLAN-L7-348 の範囲であり、本節に混ぜない。projection ロジック自体は変えない。

### 自動追従の置き場所

- 自動 re-projection は **Stop hook 境界** に置く。doctor は read-only を保ち、stale を remediation 付きの fail で
  報告するだけで自動修復しない (doctor singleton 規律 PLAN-L7-442 を壊さないため)。
- DB I/O は pure な log 圧縮 core (`src/runtime/session-log.ts` onStop) に入れず、CLI 層 `session summary` が担う。
- `session summary` は refresh を **detached fire-and-forget** で起動して即 return する (`spawnDetachedStopRefresh`)。
  Stop hook の timeout 予算内で同期 full rebuild を行わない。起動しなかった場合は stderr に理由
  (`dirty-marker-unavailable` / `coordinator-unavailable` / `missing-entrypoint` / `bun-runtime-refused` /
  `unsupported-refresh-entrypoint` / `ownership-handoff-failed` / `spawn-error: ...`) を出し、exit 0 を維持する。
  active owner が居る場合は `coalesced` として畳み、警告しない。
- 内部エントリ `ut-tdd session db-refresh --generation <id>` が実 refresh を行う。`refreshHarnessDbOnStop` は persisted
  harness.db を full rebuild し、完走後に条件付き VACUUM (PLAN-L7-457) を行う。例外・lock を含む全失敗は
  `skippedReason` (`rebuild-failed` / `rebuild-error: ...`) へ落とし throw しない (fail-open)。
- token / cost ingest は Stop refresh に**含めない** (`skipTokenTelemetry: true`、`tokenRunsIngested` は常に 0)。
  手動 `ut-tdd telemetry scan` の所有整理は別 slice。

### 多重 Stop の coalescing

`runCoalescedStopRefresh` は lease を持つ owner 1 つだけが refresh を実行する。実行中に来た Stop は dirty demand に畳み、
owner は完了後に最大 1 回だけ再実行する (1 回目と合わせて最大 2 run)。失敗時は failure を記録し、demand を再試行可能に
戻してから lease を解放する。detached child への ownership 引き継ぎの詳細 (birth 検証・PID 再利用) は
`src/state-db/stop-refresh-coordinator.ts` の実装と U-DBCURRENCY 系テストを正とし、本節では契約化しない
(三者照合未了、移行証跡 g2 の保留項目)。

### `db-currency` の doctor 検査

`checkDbCurrency` は persisted harness.db の plan registry を現行 `docs/plans` と突き合わせ (`analyzeDbCurrency`)、
次の violation を独立に fail-close する: `missing_db`、`stale_plan_registry` (`count` = DB 件数 − 期待件数)、
`stale_plan_registry_fingerprint`。repo root または DB が読めない場合も violation とする。

移行元: `docs/plans/PLAN-L7-365-harness-db-currency-hook.md` (issue #648)

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

### EngineSwapRightArmCoverage 退役記録

`EngineSwapRightArmCoverage` と `loadRightArmGatePlanningInput` / `analyzeRightArmGatePlanning` / `rightArmGatePlanningMessages` のPLAN-only doctor check契約は、後続の #1382 PR2 で退役させる目標である。この docs-only PRの時点では実装はまだ存在する。PR2適用後は、linked verify PLANに基づくL8〜L14の不足層、design status、program exit statusの旧判定を含めて退役し、旧関数名と判定範囲は履歴記録として扱う。唯一の production consumer は `src/doctor/workflow-quality.ts` を通る doctor 配線である。

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

- `ForwardWorkflow.reconstruct(subject, events, evidencePolicy?): ForwardResult<ForwardWorkflow>`
- `ForwardWorkflow.explain(command, context): ForwardGuardVerdict`
- `ForwardWorkflow.transition(command, context): ForwardResult<ForwardTransition>`
- `reduceForward(events): ForwardReduction | ForwardError`
- `VModelContract.create(dto): Result<VModelContract, ContractViolation[]>`
- `compileVModelContract(contract): CompiledContract`

FSM commandはeventだけを返し、current stateはreducerで導出する。compilerは同一rule identityからdetector registry、
doctor definition、roadmap obligationを生成し、source/generated digest drift時は実行前にfail-closeする。

### 文書監査 / semantic assessment / 自己証明

- `captureDocsSnapshot(gitPort): DocsSnapshot`
- `materializeDispositionBatch(command, current): CommandResult`
- `validateDispositionLedger(snapshot, ledger, targetResolver): ContractResult`
- `analyzeDocumentReferences(input): DocumentReferenceAnalysisResult`
- `evaluateSemanticItem(input, policy): SemanticAssessmentVerdict`
- `routeAssessmentDebt(verdict, routeFilingPort): DebtRouteResult`
- `runSelfProof(request, deps): Promise<SelfProofReport>`

snapshot queryはGit objectからraw NUL path集合を読む。batch commandはselectorを全path recordへmaterializeし、validatorは
selectorを再評価しない。semantic evaluatorはauthored evidenceを照合するだけでverdictを創作しない。meta-verifierは
ProcessRunner/Hasher/ReceiptStoreをport注入し、検査対象detectorのverdict関数をoracleとしてimportしない。

#### リポジトリ文書snapshot／disposition／reference closureのfreeze (PLAN-L6-74)

```ts
type RepositoryDocsSnapshotResult =
  | { ok: true; value: RepositoryDocsSnapshot }
  | { ok: false; errors: readonly DocumentSnapshotError[] };

type DocumentClosureResult = {
  snapshotIdentity: RepositoryDocsSnapshotIdentity;
  findings: readonly DocumentClosureFinding[];
  routeRequirements: readonly DocumentDebtRouteRequirement[];
  closure: "closed" | "blocked";
};

type DocumentMemberIdentity = {
  path: string;
  blobOid: string;
  contentDigest: string;
};

type DocumentDeltaEvent =
  | { deltaId: string; kind: "add"; sequence: number; fromSnapshotDigest: string; toSnapshotDigest: string; after: DocumentMemberIdentity; decisionDigest: string }
  | { deltaId: string; kind: "modify"; sequence: number; fromSnapshotDigest: string; toSnapshotDigest: string; before: DocumentMemberIdentity; after: DocumentMemberIdentity; decisionDigest: string }
  | { deltaId: string; kind: "delete"; sequence: number; fromSnapshotDigest: string; toSnapshotDigest: string; before: DocumentMemberIdentity; decisionDigest: string }
  | { deltaId: string; kind: "rename"; sequence: number; fromSnapshotDigest: string; toSnapshotDigest: string; before: DocumentMemberIdentity; after: DocumentMemberIdentity; decisionDigest: string };

type DocumentDeltaDecision = {
  deltaId: string;
  ledgerId: string;
  fromSnapshotDigest: string;
  toSnapshotDigest: string;
  operationKind: "add" | "modify" | "delete" | "rename";
  before?: DocumentMemberIdentity;
  after?: DocumentMemberIdentity;
  affectedPath: string;
  record: DocumentDispositionInput;
  decisionDigest: string;
};

type DocumentDeltaReplayResult =
  | { ok: true; effective: readonly DocumentMemberIdentity[]; reductionDigest: string; deltaChainDigest: string }
  | { ok: false; findings: readonly DocumentDeltaFinding[]; deltaChainDigest: string };

type DocumentReferenceTargetKind =
  | "document"
  | "anchor"
  | "plan"
  | "spec"
  | "test"
  | "adr"
  | "external";

type DocumentReferenceTarget =
  | { kind: "document"; path: string }
  | { kind: "anchor"; path: string; fragment: string }
  | { kind: "plan" | "spec" | "test" | "adr"; id: string }
  | { kind: "external"; scheme: string; authority: string; reference: string };

type DocumentReferenceSyntax =
  | "frontmatter_path"
  | "markdown_inline"
  | "markdown_reference"
  | "wiki_link"
  | "heading_anchor"
  | "typed_id";

type ReadDocumentReferencesInput = {
  snapshot: RepositoryDocsSnapshot;
  blobs: readonly RepositoryDocumentBlob[];
  parserRevision: "document-reference-parser-v1";
  syntaxRevision: "document-reference-syntax-v1";
  anchorRevision: "markdown-anchor-v1";
  uriSchemeRegistryRevision: string;
  frontmatterSchemaRevision: string;
  frontmatterSchemaDigest: string;
};

type RepositoryDocumentBlob = {
  snapshotDigest: string;
  source: DocumentMemberIdentity;
  bytes: Uint8Array;
  bytesDigest: string;
  provenanceDigest: string;
};

type DocumentReferenceEdge = {
  referenceId: string;
  snapshotDigest: string;
  source: DocumentMemberIdentity;
  syntax: DocumentReferenceSyntax;
  sourceStartByte: number;
  sourceEndByte: number;
  rawTarget: string;
  target: DocumentReferenceTarget;
  semanticResponsibility?: string;
  applicabilityCondition?: string;
  readerId: string;
  readerRevision: string;
  edgeDigest: string;
};

type DocumentReferenceOccurrenceDraft = {
  syntax: DocumentReferenceSyntax;
  sourceStartByte: number;
  sourceEndByte: number;
  rawTarget: string;
  target: DocumentReferenceTarget;
  semanticResponsibility?: string;
  applicabilityCondition?: string;
};

type DocumentReferenceParseReason =
  | "source-member-missing"
  | "source-member-extra"
  | "source-blob-mismatch"
  | "source-content-digest-mismatch"
  | "syntax-invalid"
  | "encoding-invalid"
  | "scheme-unknown"
  | "target-noncanonical"
  | "reader-exception";

type DocumentReferenceReaderRegistryError =
  | {
      reasonCode: "reader-missing" | "reader-duplicate" | "reader-ambiguous";
      syntaxKind: DocumentReferenceSyntax;
      registryDigest: string;
      evidenceDigest: string;
      findingId: string;
    }
  | {
      reasonCode: "reader-revision-missing";
      readerId: string;
      registryDigest: string;
      evidenceDigest: string;
      findingId: string;
    }
  | {
      reasonCode: "syntax-binding-mismatch";
      bindingKind: "uri-scheme-registry" | "frontmatter-schema";
      registryDigest: string;
      evidenceDigest: string;
      findingId: string;
    };

type DocumentReferenceParseError = {
  reasonCode: DocumentReferenceParseReason;
  source: DocumentMemberIdentity;
  sourcePath: string;
  readerId: string;
  sourceStartByte: number;
  sourceEndByte: number;
  evidenceDigest: string;
  findingId: string;
};

type DocumentReferenceParseErrorDraft = {
  reasonCode: DocumentReferenceParseReason;
  sourceStartByte: number;
  sourceEndByte: number;
};

type DocumentReferenceReaderRegistration = {
  readerId: string;
  readerRevision: string;
  claimedSyntaxKinds: readonly DocumentReferenceSyntax[];
  read(blob: RepositoryDocumentBlob): {
    edges: readonly DocumentReferenceOccurrenceDraft[];
    errors: readonly DocumentReferenceParseErrorDraft[];
  };
};

type DocumentReferenceReaderRegistry = {
  registryDigest: string;
  syntaxBinding: {
    uriSchemeRegistryRevision: string;
    frontmatterSchemaRevision: string;
    frontmatterSchemaDigest: string;
  };
  readers: readonly DocumentReferenceReaderRegistration[];
};

type DocumentReferenceGraph = {
  snapshotDigest: string;
  edges: readonly DocumentReferenceEdge[];
  receipts: readonly DocumentReferenceParseReceipt[];
  graphDigest: string;
};

type DocumentReferenceRegistrySet = {
  snapshotDigest: string;
  anchorRegistryDigest: string;
  planRegistryDigest: string;
  adrRegistryDigest: string;
  specRegistryDigest: string;
  testRegistryDigest: string;
};

type DocumentReferenceAnalysisFinding = {
  reasonCode:
    | "target-missing"
    | "anchor-missing"
    | "anchor-ambiguous"
    | "typed-id-missing"
    | "typed-id-ambiguous"
    | "authority-forbidden"
    | "stale-inbound"
    | "semantic-mismatch"
    | "applicability-mismatch"
    | "supersession-cycle";
  referenceId: string;
  evidenceDigest: string;
  findingId: string;
};

type DocumentReferenceAnalysisInputReason =
  | "graph-snapshot-mismatch"
  | "registry-snapshot-mismatch"
  | "registry-revision-missing"
  | "policy-revision-missing"
  | "receipt-missing"
  | "receipt-duplicate"
  | "receipt-stale";

type DocumentReferenceAnalysisInputError = {
  reasonCode: DocumentReferenceAnalysisInputReason;
  subjectIdentity: string;
  evidenceDigest: string;
  findingId: string;
};

type DocumentReferenceAnalysisResult =
  | {
      ok: true;
      graph: DocumentReferenceGraph;
      findings: readonly DocumentReferenceAnalysisFinding[];
      analysisDigest: string;
      closure: "closed" | "blocked";
    }
  | {
      ok: false;
      errors: readonly DocumentReferenceAnalysisInputError[];
      analysisDigest: string;
      closure: "blocked";
    };

interface RepositoryDocumentBlobPort {
  load(input: {
    snapshotId: string;
    path: string;
    blobOid: string;
    contentDigest: string;
  }): Promise<Uint8Array>;
}

type DocumentReferenceParseReceipt = {
  receiptId: string;
  snapshotDigest: string;
  source: DocumentMemberIdentity;
  sourceBytesDigest: string;
  revisions: {
    parserRevision: string;
    syntaxRevision: string;
    anchorRevision: string;
    uriSchemeRegistryRevision: string;
    frontmatterSchemaRevision: string;
    frontmatterSchemaDigest: string;
    readerRegistryDigest: string;
  };
  readerId: string;
  readerRevision: string;
  edgeSetDigest: string;
  errorSetDigest: string;
  receiptDigest: string;
};

type ReadDocumentReferencesResult =
  | { ok: true; graph: DocumentReferenceGraph; errors: readonly [] }
  | {
      ok: false;
      errors: readonly (
        | DocumentReferenceParseError
        | DocumentReferenceReaderRegistryError
      )[];
      diagnostics: {
        edges: readonly DocumentReferenceEdge[];
        receipts: readonly DocumentReferenceParseReceipt[];
      };
    };

captureRepositoryDocsSnapshot(
  input: CaptureRepositoryDocsSnapshotInput,
  git: GitObjectSnapshotPort,
): Promise<RepositoryDocsSnapshotResult>;

materializeDispositionBatch(
  command: MaterializeDispositionBatchCommand,
  current: DocumentDispositionLedger,
): Result<DocumentDispositionLedger, readonly DocumentDispositionError[]>;

loadRepositoryDocumentBlobs(
  snapshot: RepositoryDocsSnapshot,
  port: RepositoryDocumentBlobPort,
): Promise<Result<readonly RepositoryDocumentBlob[], readonly DocumentReferenceError[]>>;

readDocumentReferences(
  input: ReadDocumentReferencesInput,
  registry: DocumentReferenceReaderRegistry,
): ReadDocumentReferencesResult;

analyzeDocumentReferences(
  input: {
    snapshot: RepositoryDocsSnapshot;
    graph: DocumentReferenceGraph;
    registries: DocumentReferenceRegistrySet;
    anchorRegistryRevision: string;
    authorityPolicyRevision: string;
    applicabilityPolicyRevision: string;
  },
): DocumentReferenceAnalysisResult;

replayDocumentDeltas(
  input: ReplayDocumentDeltasInput,
): DocumentDeltaReplayResult;

analyzeRepositoryDocumentClosure(
  input: AnalyzeRepositoryDocumentClosureInput,
  targets: DocumentTargetResolver,
): DocumentClosureResult;

verifyDocumentDebtRoutes(
  findings: readonly DocumentClosureFinding[],
  routes: readonly DocumentDebtRoute[],
): DocumentDebtRouteVerification;
```

`ReplayDocumentDeltasInput`はbaseline/final snapshot、event列、`decisions`列、ledger/policy identity、
expected delta chain digestを不可分に持つ。domainのdecisionはvalidated `record`を合成し、
physical adapterだけがL5の正規化columnへlossless展開する。

#### typed reference reader契約 (後続slice候補、unit oracle ID未採番)

`RepositoryDocumentBlobPort`は`snapshotId,path,blobOid,contentDigest`を全て受け取り、固定commitの
Git object byte列だけを返す。working tree fallbackを持たない。`loadRepositoryDocumentBlobs`は
final snapshot memberとblob入力のexact集合を検証し、欠落・余剰・duplicate・case-fold collisionを
parse前に拒否する。成功時はsnapshot/member/bytes digestから`provenanceDigest`を生成した
`RepositoryDocumentBlob`だけを返す。`readDocumentReferences`はauthoritative snapshotとsealed blobの
exact集合を再検証するため、callerが同じ形のDTOを組み立ててもauthorityへ昇格できない。
readerはfinal snapshotの各memberと、そのmemberのblobから得た不変byte列だけを入力とする。
blob `bytes`のSHA-256は`source.contentDigest`と一致し、`snapshotDigest`、path、blob OID、
content digestの不一致はそれぞれ`source-member-extra|source-blob-mismatch|
source-content-digest-mismatch`を返す。snapshot member欠落は`source-member-missing`とする。
working tree、DB、既存relation graph、別snapshotのblobを
不足入力の補完へ使わない。入力byte列とinput DTOは変更しない。

reader registryは`readerId,readerRevision,claimedSyntaxKinds`を持つimmutable factoryで生成し、
全syntax kindをexactly once所有する。missing/duplicate/ambiguous claim、空revision、
requestとimmutable `syntaxBinding`の不一致はsource非依存の
`DocumentReferenceReaderRegistryError`として生成時又はparse前に拒否する。
registry digestを各receiptへ束縛し、配列順又はplugin登録順をwinner選択へ使わない。
scheme/frontmatter registryのrevision/digestはregistry側のimmutable `syntaxBinding`を正本とし、
request自己申告との不一致をparse前にfail-closeする。
readerが返せるのはoccurrence/error draftだけであり、`referenceId`、`source`、revision、
evidence digestを自己申告できない。coreがsealed blobとrevision setから完成edge/error/receiptを生成する。
reader出力のgetter/iterator例外、同一draft重複、閉じたreason code外の値は全てtyped errorへfail-closeする。
成功結果だけが`snapshotDigest`付きgraphを公開し、blocked結果はgraphを持たずdiagnosticsだけを返す。

`document-reference-syntax-v1`が受理するsurface:

| syntax | 受理する形 | typed target |
|---|---|---|
| `frontmatter_path` | schema registryでpath/ID fieldと宣言されたYAML scalar/list。未知fieldをpathと推測しない | field schemaが宣言したkind |
| `markdown_inline` | CommonMark inline link/image destination。画像も依存edgeとして保持する | path/anchor/external |
| `markdown_reference` | reference useとdefinitionを同一blob内でexactly once結合する | path/anchor/external |
| `wiki_link` | `[[path]]`、`[[path#fragment]]`、`[[path#fragment\|label]]` | document/anchor |
| `heading_anchor` | ATX/Setext headingと明示 `{#id}`。anchor slugは`markdown-anchor-v1`で導出する | anchor definition |
| `typed_id` | prose又はinline codeのtoken境界にある完全なPLAN/ADR/spec/test ID。fenced code、引用fixture、部分一致は除外する | plan/adr/spec/test |

Markdown parserはcode fence、inline code、escape、reference definitionを構文として扱い、
正規表現のkeyword hitだけでedgeを作らない。ただしinline code全体がtyped ID一個と一致する場合は
明示参照として扱う。frontmatterは先頭documentだけを読み、duplicate key、alias、merge key、
非scalar pathをparse errorにする。reference labelの未定義・重複、wiki delimiter不整合、
不正UTF-8、NUL、malformed percent tripletを空edgeへ変換しない。

`markdown-anchor-v1`はheading文字列をUnicode NFC化し、Unicode 15.1のDefault Case Folding表でcase fold後に
文字・数字・`_`・`-`以外を除去し、連続whitespaceを`-`一個へ変換し、連続`-`を一個へ畳む。
空slugを拒否し、同一blob内の重複headingは文書順に2件目から`-1`,`-2`を付ける。
明示`{#id}`はpercent decodeせずNFC case-sensitive identityとし、自動slugとの衝突も
`anchor-ambiguous`へ送る。fragmentはsingle percent decode後NFC化し、同じ規則で比較する。

内部pathはsource directoryを基準にPOSIX規則で一度だけ解決し、`\`、absolute、drive/UNC、
NUL、空segment、repository rootを越える`..`を拒否する。`.`/`..`を解決した後にUnicode NFC化し、
fragmentもpercent decodeを一度だけ行ってNFC化する。percent decode後の再decodeは禁止し、
encoded `/`、`\`、NUL、dot segmentは拒否する。external URIは入力で固定した閉じた
scheme syntax registryにあるschemeだけをURIとしてparseし、scheme不在をexternalへ推測しない。
readerはschemeをASCII lowercase、hostをUnicode 15.1 / UTS #46 nontransitionalでIDNA ASCII lowercaseへ
正規化し、userinfoを拒否し、
HTTP/HTTPSのdefault portだけを除去する。percent tripletは一度だけ検証してhexをuppercase化し、
path/query/fragmentの意味順を変えない。scheme/authorityの許可判断と到達性確認は行わない。

readerは構文抽出と正規化までを担当し、targetの実在、authority、disposition、
applicability、archive/superseded意味判定を行わない。analyzerだけがfinal snapshot、
anchor registry、PLAN/ADR/spec/test registryをexact revisionで解決する。短縮ID又は同一IDの
複数registry hitは一件を選ばず`typed-id-ambiguous`、未知IDは`typed-id-missing`とする。
external scheme/authorityはanalyzerへ明示された`authorityPolicyRevision`で
`authority-forbidden`を判定し、readerのURI構文registryと混同しない。

edge identity frameは
```text
snapshot_digest, source_path, source_blob_oid, source_content_digest, syntax_kind,
source_start_byte, source_end_byte, target_kind, raw_target, normalized_target,
normalized_fragment, semantic_responsibility, applicability_condition,
parser_revision, syntax_revision, anchor_revision, uri_scheme_registry_revision,
frontmatter_schema_revision, frontmatter_schema_digest, reader_registry_digest,
reader_id, reader_revision
```
の順の`canonical-frame-v1`とする。edgeはこのdigestのunsigned
UTF-8 byte順で返す。同一identityの重複surfaceは勝手にdedupeせず、byte rangeを含む別edgeとして残す。

parse receipt frameは
```text
snapshot_digest, source_path, source_blob_oid, source_content_digest, source_bytes_digest,
parser_revision, syntax_revision, anchor_revision, uri_scheme_registry_revision,
frontmatter_schema_revision, frontmatter_schema_digest, reader_registry_digest, reader_id, reader_revision,
edge_set_digest, error_set_digest
```
の順とする。edge/error集合は各identity digestのstable sortを
length-prefixed frame化する。edge 0件の正常blobもreceiptを返し、errorが一件でもあれば
receiptと全errorを返すがGreen graphへ昇格しない。reader例外も
`reader-exception`へ型付けし、握り潰さない。

U006のsource parseに対する閉じたreason codeは
```text
source-member-missing|source-member-extra|source-blob-mismatch|source-content-digest-mismatch|
syntax-invalid|encoding-invalid|scheme-unknown|target-noncanonical|reader-exception
```
とする。source非依存のreader registry reasonは
```text
reader-missing|reader-duplicate|reader-ambiguous|reader-revision-missing|syntax-binding-mismatch
```
とする。U007のresolver/policy reasonは
```text
target-missing|anchor-missing|anchor-ambiguous|typed-id-missing|typed-id-ambiguous|
authority-forbidden|stale-inbound|semantic-mismatch|applicability-mismatch|supersession-cycle
```
とし、readerが先回りして生成しない。

U006 parse findingのevidence frameは
```text
snapshot_digest, source_path, source_blob_oid, source_content_digest, reader_id,
reader_revision, reason_code, source_start_byte, source_end_byte, parser_revision,
syntax_revision, anchor_revision, uri_scheme_registry_revision, reader_registry_digest,
frontmatter_schema_revision, frontmatter_schema_digest
```
の順とする。
finding IDは`doc-reference-parse-error,source_path,evidence_digest`から導出し、
出力順は`source_path,source_start_byte,reader_id,reason_code,finding_id`のunsigned UTF-8 byte順とする。
一blob内の正常edgeとerrorを両方収集するが、error一件以上のgraphはblockedであり、
正常edgeだけをclosure authorityへ昇格しない。

reader registry errorのevidence frameはreason別に
```text
ownership: registry_digest, syntax_kind, reason_code, matching_registration_multiset_frame
revision:  registry_digest, reader_id, reason_code, claimed_syntax_set_frame
binding(uri): registry_digest, binding_kind, reason_code,
              request_uri_scheme_registry_revision, registry_uri_scheme_registry_revision
binding(frontmatter): registry_digest, binding_kind, reason_code,
              request_frontmatter_schema_revision, request_frontmatter_schema_digest,
              registry_frontmatter_schema_revision, registry_frontmatter_schema_digest
```
の順とする。`matching_registration_multiset_frame`は対象syntaxをclaimする全registrationを
`reader_id,reader_revision,claimed_syntax_set_frame`のlength-prefixed
`canonical-frame-v1`にし、そのframe byte列のunsigned UTF-8順でsortする。完全重複もdedupeせず
出現回数分保持する。`claimed_syntax_set_frame`はsyntax kindをunsigned UTF-8順でsortし、
重複を拒否したlength-prefixed frameとする。空値は空文字のlength 0としてframeへ残し、
missing revision errorをdigest生成前に消さない。
finding IDのsubjectはownership errorでは`syntax_kind`、revision errorでは`reader_id`、
binding errorでは`binding_kind`とし、
`doc-reference-reader-registry-error,subject,evidence_digest`から導出する。
source path、byte span、架空reader ID又はsyntax kindのsentinelを合成せず、
`reason_code,subject,finding_id`のunsigned UTF-8 byte順で返す。

U007 analyzerは次のseedを使用する。
```text
graph_digest, snapshot_digest, anchor_registry_digest, plan_registry_digest,
adr_registry_digest, spec_registry_digest, test_registry_digest, anchor_registry_revision,
authority_policy_revision, applicability_policy_revision
```
この値をanalysis seedへ束縛する。
各finding evidenceはseed、`reference_id,reason_code,target_identity`から導出し、analysis digestは
seedとstable finding ID集合から生成する。registry又はpolicy revision欠落、graphと別snapshotの
registry、receipt欠落・重複・staleをblockedにし、既存relation graphから補完しない。
入力契約違反の閉じたreason codeは
```text
graph-snapshot-mismatch|registry-snapshot-mismatch|registry-revision-missing|
policy-revision-missing|receipt-missing|receipt-duplicate|receipt-stale
```
とする。evidence frameは次の順とする。
```text
graph_digest,snapshot_digest,anchor_registry_digest,plan_registry_digest,adr_registry_digest,
spec_registry_digest,test_registry_digest,anchor_registry_revision,authority_policy_revision,
applicability_policy_revision,subject_identity,subject_detail,reason_code
```
`subject_detail`は`receipt-duplicate`だけ、同一receipt owner配下の全`receiptDigest`を
unsigned UTF-8順でsortし完全重複も保持したlength-prefixed multiset frame、その他は空文字とする。finding IDは
`doc-reference-analysis-input-error,subject_identity,evidence_digest`から導出し、
全入力契約違反をstable順の`ok:false` resultで返す。domain findingを合成せず、未型付け例外へ変換しない。
`subject_identity`はreason別に次へ固定する。

| reason | subject identity |
|---|---|
| `graph-snapshot-mismatch` | `graph:<graph.graphDigest>` |
| `registry-snapshot-mismatch` | `registries:<registries.snapshotDigest>` |
| `registry-revision-missing` | `field:anchorRegistryRevision` |
| `policy-revision-missing` | 欠落fieldごとに`field:authorityPolicyRevision`又は`field:applicabilityPolicyRevision` |
| `receipt-missing` | `member:<member_identity_digest>` |
| `receipt-duplicate` | `receipt-owner:<receipt_owner_digest>`（同一owner配下を1 findingとする） |
| `receipt-stale` | `receipt:<receiptDigest>` |

`member_identity_digest`は`path,blob_oid,content_digest`の順のlength-prefixed
`canonical-frame-v1`のSHA-256とする。`receipt_owner_digest`は
`member_identity_digest,reader_id,reader_revision`の順のlength-prefixed
`canonical-frame-v1`のSHA-256とする。receipt ownerはsource member×reader identity/revisionであり、
同一ownerにreceiptが2件以上あれば
receipt digestが同一か相違するかを問わず`receipt-duplicate`とする。複数field又はmemberの違反は
subjectごとに1 errorを生成し、表外のsubject選択やsentinelを許さない。

property testはblob順・reader順・error入力順の全permutationでedge/receipt/finding digest一致と
入力deep-equal不変を検査する。mutation testはsnapshot/blob比較、unknown scheme拒否、
parse error保持、parser/schema/reader revision frame、stable sortを一つずつ除去した変異を全てkillする。

DbC:

- `captureRepositoryDocsSnapshot` 事前条件: repository identity、full commit OID、リポジトリroot tree OID、
  `selection_revision=repository-documents-v1`とselector digestをcallerが明示する。
  `GitObjectSnapshotPort`はL5 §9.15.2の全zoneをGit objectからraw NUL path streamとblob OIDで返す。
  short SHA、symbolic HEADだけ、working tree scan、zone欠落、未分類文書の暗黙除外を拒否する。
- post: pathはUTF-8 repo-relative canonical formでstable byte順、各pathは一回だけ、`trackedCount`は
  entry数と一致し、`pathSetSha256`はGitが返した終端NUL付きbyte streamそのもの、
  `snapshotDigest`はrepository identity、commit、root tree、selection revision/digest、path hash、
  zone集合digest、member集合digestのfield-name付きlength-prefixed frameから生成する。zone集合は
  selector digest、tree OID、member count、zone member digestを全5 zone分保持する。baseline 921件は`docs_tree`
  zoneだけのfixtureであり、全zoneの`trackedCount`へ固定しない。
- `materializeDispositionBatch` pre: commandはsnapshot identity、selector、decision、actor、reason、
  command IDを持つ。post: selectorをその時点のsnapshot pathへ一度だけ展開し、各pathの個別recordと
  selector receiptを返す。同じcommand ID+digestは冪等、異なるpayloadは
  `doc-ledger-command-conflict`とする。
- `readDocumentReferences(input: ReadDocumentReferencesInput, registry: DocumentReferenceReaderRegistry): ReadDocumentReferencesResult`
  pre: `input.snapshot`は`captureRepositoryDocsSnapshot`が発行したauthoritative final snapshot、
  `input.blobs`は`loadRepositoryDocumentBlobs`が同snapshotから発行したsealed blobのexact集合とする。
  parser/syntax/anchor revisionを全て明示し、URI scheme/frontmatter schemaのrevision/digestはimmutable
  `registry.syntaxBinding`と一致する。registryは全`DocumentReferenceSyntax`をnon-empty revision付き
  typed readerへexactly once割り当て、missing/duplicate/ambiguous ownershipを許さない。
  post: 各snapshot memberの不変byte列だけを読み、source blob×readerのparse receipt、canonical edge、
  閉じたU006 parse errorをstable unsigned UTF-8 byte順で返す。errorが0件のときだけ`ok:true`の
  `snapshotDigest`付きgraphを公開し、1件以上なら`ok:false`として全errorとdiagnosticsを返しgraphへ
  昇格させない。reader/getter/iterator例外は`reader-exception`、未知schemeは`scheme-unknown`へ型付けし、
  空edge又は正常結果へ変換しない。
  invariant: `input`、blob byte列、registryを変更せず、working tree、DB、既存relation graph、
  別snapshotのblobから補完しない。callerが組み立てた同形DTOをsnapshot/blob authorityへ昇格させず、
  reader draftに`referenceId`、source/revision/evidence identityの自己申告を許さない。authoring docs、
  ledger、Git indexへの書込みその他の外部副作用を持たない。
- 参照解析関数の契約は次のとおり。
  ```ts
  analyzeDocumentReferences(input: { snapshot: RepositoryDocsSnapshot; graph: DocumentReferenceGraph;
    registries: DocumentReferenceRegistrySet; anchorRegistryRevision: string; authorityPolicyRevision: string;
    applicabilityPolicyRevision: string }): DocumentReferenceAnalysisResult
  ```
  pre: `graph`は成功した`readDocumentReferences`が生成したGreen graphを名乗る候補であり、
  analyzerは同一`input.snapshot.snapshotDigest`への束縛と全snapshot memberのparse receipt exactly onceを
  authorityへ昇格する前に再検証する。`registries`も同snapshotへ束縛され、
  anchor/PLAN/ADR/spec/test registry digestとanchor/authority/applicability policy revisionを全て明示する。
  post: final snapshotとexact registry/policy revisionだけでdocument/anchor/typed-ID/authority/semantic/
  applicability/supersessionを解決し、閉じたU007 reason codeのfinding、stable `analysisDigest`、
  `closed|blocked`を返す。未知・複数hitは任意候補を選ばず`*-missing|*-ambiguous`、
  registry/policy revision欠落、別snapshot graph/registry、receipt欠落・重複・staleは
  閉じた`DocumentReferenceAnalysisInputError`を全件返す`ok:false` blocked resultとする。
  domain不適合を未型付け例外又はsilent successへ変換しない。
  invariant: readerの構文抽出責務を再実行せず、既存relation graph、archive/superseded fallback、
  DB rowで欠落を補完しない。snapshot、graph、registriesを変更せず、authoring docs、ledger、DB、
  working tree、Git indexへの書込みその他の外部副作用を持たない。
- `analyzeRepositoryDocumentClosure` 事前条件: snapshot、ledger、reference graph、canonical assertion、
  debt routeは同じsnapshot digestへ束縛される。post:全snapshot pathをexactly once判定し、
  ledger phantomとbaseline後のadd/modify/delete/renameを双方向比較し、全reference endpointとanchor、
  canonical assertionのblob digestを再検証する。
- invariant: queryはledger、authoring docs、DB、Git indexを更新しない。selector再評価、source edgeからの
  disposition継承、DB rowによる欠落record補完、archive/superseded文書への暗黙fallbackを禁止する。
- applicability invariant: canonical値域は`applicable|conditional|deferred|not_applicable`、
  application status値域は`pending|applied|verified`とする。`conditional`はreason/observed condition/reevaluation trigger、
  `deferred`はreason/reevaluation trigger/PLAN、`not_applicable`はreason/deciderを必須とする。
  入力語`skip|defer`はauthoring境界でそれぞれ`not_applicable|deferred`へ正規化し、closure queryは
  canonical値だけを受け取る。kind固有でないfieldはNULLとし、disposition enumへ混入させない。
- delta invariant: snapshot memberはpath/blob OID/content digestを保持し、deltaをsequence順にreplayして
  final snapshotと完全比較する。raw Git差分はrenameを推測せずadd/modify/deleteとして観測する。
  明示rename deltaだけが対応するdelete+addを消費し、未登録renameはdelete/addの別findingとして返す。
  各eventは同じ`deltaId`の`DocumentDeltaDecision`とexactly onceで結合し、eventの`decisionDigest`、
  ledger、snapshot pair、operation、before/after member、affected path、disposition/applicability後条件を
  再検証する。自己申告digest、decision欠落・余剰・重複、
  add文書の判断欠落をGreenにしない。

delta reducerの遷移表:

| kind | 事前条件 | state更新 | 拒否reason |
|---|---|---|---|
| `add` | after path不在 | after memberを追加 | `path-already-exists` |
| `modify` | before pathが存在しblob/content一致、before/after path同一 | after memberへ置換 | `source-missing|stale-before|path-changed` |
| `delete` | before pathが存在しblob/content一致 | before pathを削除 | `source-missing|stale-before` |
| `rename` | before pathが存在しblob/content一致、after path不在、旧新pathが異なる | oldを削除しafterを追加 | `source-missing|stale-before|target-exists|same-path` |

入力順を権威にせず`sequence,event_digest`昇順でreplayするが、sequenceは1始まり・gap/duplicateなし、
`previousEventDigest`は直前event digestと一致しなければならない。event frameは次の順序の
`canonical-frame-v1`とする。

```text
delta_id, ledger_id, sequence, kind, from_snapshot_digest, to_snapshot_digest, from_path,
to_path, before_blob_oid, before_content_digest, after_blob_oid, after_content_digest,
decision_digest, previous_event_digest
```

先頭chain seedは`ledger_id, baseline_snapshot_digest, policy_revision`、
各stepは`previous_chain_digest, event_digest`をframe化してSHA-256とし、最終値を`deltaChainDigest`とする。
replay結果はfinal snapshotのpath/blob/content集合と完全一致させ、余剰deltaも成功扱いしない。
空event列でもchain seedとexpected chain digestを必ず比較する。chain全体の不一致は
`operation_kind=chain`、subject=`ledger_id`、sequence=0のfindingとし、架空のadd/deleteへ分類しない。
sequence/chain/event/decision/snapshot検証が一件でも失敗した時点でreducer stateをpoisonし、以後のeventを
stateへ適用しない。duplicate sequenceは全該当eventをcanonical tie-break順でfinding化し、入力順でwinnerを選ばない。
baseline/final member path重複もMap last-winsせず、replay前にblocked findingとする。
exact pathだけでなくUnicode NFC後のcase-fold path衝突をbaseline/final双方でblockedにする。
`createDocumentDeltaEvent`と`createDocumentDeltaDecision`は正のsafe integer sequence、非空ID/digest、
repo-relative NFC `/` path、非空blob/content identityを検査するfactoryとし、absolute/backslash/NUL/
`.`/`..`/空segmentを持つinvalid stateを生成しない。
物理`from_snapshot_id/to_snapshot_id`はsnapshot digestから一意に導出する
`document-snapshot:sha256:<digest>`とし、APIのdigestとprojection IDの対応を再計算して検証する。

`DocumentDeltaFinding`のoperation kindは`add|modify|delete|rename|chain`とする。evidence frameは
次の順序とする。

```text
baseline_snapshot_digest, final_snapshot_digest, delta_chain_digest, reason_code, sequence,
operation_kind, from_path, to_path, before_blob_oid, before_content_digest, after_blob_oid,
after_content_digest, policy_revision
```

subjectはadd=`to_path`、delete=`from_path`、
modify=`from_path`、invalid event=`delta_id`であり、finding IDはrule/subject/evidence digestから導出する。
出力順は`operation_kind, subject_identity, sequence, finding_id`のunsigned UTF-8 byte順とする。
成功結果はeffective member集合とそのreduction digest、delta chain digestを返す。blocked結果もfindingと
delta chain digestを返すが、poison後のpartial effective集合をprojection authorityとして公開しない。
outer `DocumentClosureResult`も成功時のeffective集合/reduction digestと全結果のdelta chain digestを保持し、
application/DB adapterがreducer内部stateを再推測しない。

typed finding/error:

| ID | 発火条件 | closure / debt route |
|---|---|---|
| `docs-snapshot-revision-missing` | full commit/tree/repository identity欠落 | blocked、上流capture defect |
| `docs-snapshot-stream-malformed` | NUL stream、UTF-8、count、tree/hash不整合 | blocked、Recovery |
| `doc-disposition-missing` | baseline snapshot pathにbaseline recordなし | blocked、L4-25/L7-422 route必須 |
| `doc-disposition-phantom` | baseline ledger pathがbaseline snapshotにない | blocked、削除/rename判断route必須 |
| `doc-disposition-duplicate` | pathまたはcase-fold identity重複 | blocked、ledger correction |
| `doc-disposition-incomplete` | canonical applicabilityのkind別field、application status、disposition後条件不足 | blocked、設計判断route必須 |
| `doc-selection-unclassified` | selector zone外のtracked document、又は必須zone欠落 | blocked、上流selection設計route必須 |
| `doc-delta-unregistered` | baseline後の未登録差分、illegal delta遷移、sequence/chain/final集合不一致 | blocked、reason codeと差分identity別route必須 |
| `doc-reference-parse-error` | reader例外、未知scheme、構文不正 | blocked、reader defect |
| `doc-reference-orphan` | source/target path、typed ID、anchor不在 | blocked、source owner route必須 |
| `doc-canonical-assertion-stale` | assertionのtarget blob/digestがsnapshotと不一致 | blocked、assertion owner route必須 |
| `doc-debt-route-missing` | blocking findingにactive routeなし | blocked、route filing |
| `doc-debt-route-stale` | finding/snapshot/PLAN digestがrouteと不一致 | blocked、route再審査 |

`DocumentDebtRoute`は`routeId`、`findingId`、`findingDigest`、`snapshotDigest`、`subjectIdentity`、
`filingTargetId`、`planId`、`status`、`reason`、`reviewedBy`、`reviewedAt`を必須とする。active routeは
findingを消さず、`closure="closed"`はfinding 0の場合だけ返す。既知gapをroute済みとして可視化する
ことと、完了判定をGreenにすることを分離する。CLIはGreen=0、contract/closure violation=1、
usage=2を維持する。

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
| `PlanAssetInput` | `assetId`, `alias`, `payload`, `bodyDigest` (`PlanAsset.create`の入力。revisionは1固定、`contentDigest`は`hashCanonical({alias, bodyDigest, payload})`で内部計算、dependenciesはcanonical payload (frontmatter)内に含まれ独立フィールドを持たない) | 不正`assetId`、空alias、`bodyDigest`の形式不正は`PlanAssetError` (`plan-asset-invalid-id` / `plan-revision-invalid`)。dependency重複・payload digest不一致の検査は実装にも PLAN-L6-71 の設計判断にも存在しない (#977で除去) |
| `RevisePlanCommand` | `assetId`, `baseRevision`, `changeSet`, `actor`, `reason` | base≠latest、空reason、identity変更は拒否 |
| `EvidenceRecordInput` | `evidenceId`, `evidenceKind`, `subjectId`, `subjectRevision`, `sourceCommit`, branded `commandArgs`, kind別typed `claims`, `outputDigest`, `exitCode`, typed `producer`, `producedAt`, `expiresAt?`, `supersedesEvidenceId?` | claimsを含むrecord digestをcanonical fieldから内部生成する。issuerがある場合はauthority/key version/producer/record digestを長さprefix frame化してattestationを発行する。非0 exitと未署名recordも監査用recordとしてvalid |
| `EvidencePolicy` | `policyId`, `revision`, `requirements[]`（各要素=`requirementId`, `requiredKind`, `minCount`, `maxCount?`, `acceptedProducers[]`, `exitRule`, typed `claimsRule`）、`maxAge?`、composition root固定`EvidenceAttestationVerifierPort` | 全nested ruleをdefensive copy/deep freezeする。trusted verifierがauthority/key/producer binding/署名を検証したrecordだけをfrontier候補にする。未署名・署名不正、別kind/revision/commit、期限切れ、producer外、exit/claims不適合を件数へ数えず、requirement別eligible/rejected IDをstable順で返す |
| `ForwardCommand` | `event`, `commandId?`, `expectedFrom?`, `sourceCommit?`, `evidenceIds?`, `exceptionContext?` | 許可表外、sequence不整合、guard不足は`ForwardError`（`ok:false`, `ruleId`, `exitCode`, `message?`） |
| `ForwardSubject` | `subjectId`, `subjectRevision`, `sourceCommit` | `ForwardWorkflow.reconstruct(subject, events)`は、subjectが不正、またはeventの`subjectId`/`subjectRevision`/`sourceCommit`が1件でもsubjectと不一致ならfail-close（`forward-ledger-unavailable`） |
| `ForwardEvidenceContext` | `evidence?`, `now?`, `authorFamily?`, `evidencePolicy?` | 旧`WorkflowContext`をsubject（上記）とevidence文脈へ分離した。`explain`/`transition`の第2引数であり、eventは`reconstruct`時にsubjectへ束縛済み |
| `VModelContractDto` | `revision`, `layers[]`, `gates[]`, `pairs[]`, `exceptions[]`, `evidencePolicies[]`, `defectRoutes[]` | exactly-once、未知参照、理由なし例外は`ContractViolation[]` |
| `DocsSnapshot` | `commit`, `treeOid`, `trackedCount`, `pathSetSha256`, `pathStreamAlgorithm` | algorithmは`git-ls-tree-z-v1`、working tree値で代替禁止 |
| `DocumentDispositionInput` | `baselinePath`, `disposition`, `reason`, `targets[]`, `planIds[]`, `applicationStatus`, `applicability{kind, reason?, observedCondition?, reevaluationTrigger?, planId?, decider?}` | conditional field不足は`DispositionFinding`。旧`DispositionRecord`の`blobOid`/`zone`はsnapshot側（`DocsSnapshot`、L5 physical-data §zone/frame `(path, blob_oid, content_sha256, file_mode, zone)`）が保持し、入力DTOには含めない。旧`impactTags[]`は上位設計にも実装にも定義が無いため撤去した（issue #977 CD-31） |
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
| `ItemTargetEdge` | `edgeId`, `itemId`, `targetStatus`, `reason`, `sourceDigest`, `targetKind?`, `targetRef?`, `planId?`, `designPath?` | targetKind=`artifact_path|artifact_family|plan_alias|target_slot`。`designPath`はL5 §9.15.4の別個のsemantic管理・設計参照であり、判断targetではない。runtimeでsource→targetを継承・推論しない。pendingはtarget禁止、adopt/merge/reference/deferのtyped target欠落=`catalog-item-target-incomplete`、deferは有効な`designPath`必須で`planId`不要。非NULL `planId` はlegacy互換としてplan FKを維持する |
| `DocumentProfileDecision` | `decisionId`, `profileId`, `docTypeId`, `decision`, `detailOverride`, `statusOverride`, `reason`, `rowDigest`, `requiredPlanId?` | semantic itemへmapしない。conditional/skip/deferはreason必須、deferはPLAN必須 |
| `DocumentProfile` | `profileId`, `profileAxis`, `profileRank`, `description`, `defaultStatus`, `defaultDetail`, `scopePolicy`, `rowDigest` | profile master全fieldをround-tripし、decision rowをmaster代用にしない |
| `createProfileCatalog` 入力 | `profiles: DocumentProfile[]`, `decisions: DocumentProfileDecision[]`, `knownDocTypeIds`, `requiredDocTypeIds`, `coreDocTypeIds`, `knownCapabilityFlags?` | `sourcePath`/`sourceDigest`はdomain入力に含めず、`TrackedDocumentProfileCatalog`（`src/profile/adapters/tracked-profile-loader.ts`: `sourcePath`, `sourceDigest`, `catalogSourcePath`, `catalogSourceDigest`, `catalog`）がloader側で保持する。profile/decision IDとFKをcreate前に検証 |
| `createProfileCatalog` | `(input) -> Result<ProfileCatalog>`（`{ok:true,value}` / `{ok:false,findings: ProfileFinding[]}`） | master全field/entryをlossless保持。unknown enum/FK/duplicateをfail-closeしresolverへvalid aggregateだけ渡す |
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

PLAN全件のdry-runとdecision manifest（`LegacyMigrationDryRun`/`buildLegacyPlanInventory()`/CLI `plan-asset migration-dry-run`）は#1168（PR #1257）で退役した。
残るのは`legacy-plan-inventory`の`parseLegacyPlanSource`/`inventoryProjectionDigest`と`legacy-plan-adapter`の`deriveLegacyAssetId`で、CLI `revision-digest`も維持する。
それに先立つA4 bounded retirement (#1168)では、完了PLANの`generates`の実在を求める`plan-generated-target-missing`判定を、特定pathの例外ではなく判定全体として退役した（Greenは#1241）。
dry-runが持っていたそれ以外の検査（`plan-generated-target-invalid`、role/design contractのmissing・hollow検査、`commit:path`のblob再検証、role delegationのslot projection）も、#1257でdry-runの実装ごと退役した。PLAN本文・履歴は変更していない。

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

T1のitem-target ledgerでは`design_path`列をstrict schemaへ追加し、空欄は未設定として`designPath`へlosslessにmapする。
非空値はL5 §9.15.4の完全なrepo-relative `docs/design/` tracked path規則で検証し、basename aliasやPLAN IDから補完しない。
`designPath`はitem-target edgeのcanonical digestとprojectionへ含める。active 163件はすべて
`pending_review`を維持し、`designPath=docs/design/harness/L5-detailed-design/physical-data.md`、`planId=NULL`とする。
item identity/status/target kind・ref/reason/source digestの値・集合は変えず、pending判断を昇格・推論しない。
deferはvalidな`designPath`を要しPLAN IDを要しない一方、非NULLのlegacy `planId`は既存plan FK検証を維持する。

このT1 schema移行は`addMissingColumns`による列追加だけでは完了しない。旧defer CHECKを置換するtable rebuildと
`rebuildHarnessDb`のcanonical projection rebuild/swapを同一のtransaction/savepoint rollback境界へ含め、
source・FK・CHECK・digest検証の失敗ではschemaとprojection双方をrollbackして旧Green投影を保持する。
これは未実装の設計契約であり、実装済みを意味しない。

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

`expectedFrom`不一致は`forward-transition-illegal`、sequence欠番は`forward-sequence-invalid`、同一`commandId`で異なるpayloadは
`forward-command-conflict`とする。

event空集合の初期stateはrevisionごとの`proposed`、次sequenceは1とする。sequenceは1始まりで連続し、event IDと
command IDはsubject横断で一意、同一event ID異payloadは`forward-event-conflict`、同一command ID+同一payloadは既存eventを返す。
reducer入力は`sequence,eventId`の順でcanonicalizeせず、受領順がsequence昇順でない場合もfail-closeする。event digestは
subject/revision/sequence/command payload digest/from/to/resume/reason/source commit/evidence IDのcanonical JSONから生成し、clockやDB rowidを含めない。

| event | from | to | 必須evidence (requirementId) | 欠落時のrule |
|---|---|---|---|---|
| `plan` | `proposed` | `planned` | `scope-approval` (producer: po/human) | `forward-evidence-missing` |
| `prepare-pair-freeze` | `planned` | `pair_freeze_ready` | `pair-artifact-declaration` + `design-pair-review` | `forward-evidence-missing` |
| `freeze-pair` | `pair_freeze_ready` | `pair_frozen` | `pair-artifact-declaration` + `design-pair-review` | `forward-evidence-missing` |
| `freeze-red` | `pair_frozen` | `red_frozen` | `red-test-run` (exitは非0、24時間以内) | `forward-evidence-missing` |
| `begin-implementation` | `red_frozen` | `implementing` | `pair-artifact-declaration` + `red-test-run` | `forward-red-evidence-missing` |
| `complete-implementation` | `implementing` | `implementation_complete` | `implementation-digest` + `targeted-test-run` | `forward-evidence-missing` |
| `prepare-trace-freeze` | `implementation_complete` | `trace_freeze_ready` | `trace-materialization` | `forward-evidence-missing` |
| `freeze-trace` | `trace_freeze_ready` | `trace_frozen` | `trace-closure` + `green-test-run` | `forward-evidence-missing` |
| `prepare-review` | `trace_frozen` | `review_ready` | `trace-closure` + `green-test-run` | `forward-trace-freeze-missing` |
| `submit-review` | `review_ready` | `reviewed` | `independent-review` | `forward-evidence-missing` |
| `accept` | `reviewed` | `accepted` | `independent-review` + `gate-run` | `forward-accept-evidence-missing` |
| `archive` | `accepted` | `archived` | `acceptance-decision` + `retention-decision` (producer: po/human) | `forward-evidence-missing`。`archived`は`terminal` |
| `block` | `proposed`〜`reviewed`の正常state (`accepted` / `archived`を除く) | `blocked` | `exception-context` | `forward-exception-context-missing` |
| `supersede` | `proposed`〜`accepted`の正常state (`archived`を除く。`accepted`を含む) | `superseded` | `exception-context` | `forward-exception-context-missing` |
| `reject` | `review_ready` または `reviewed` | `rejected` | `exception-context` | `forward-exception-context-missing` |
| `reopen` | `blocked` / `superseded` / `rejected` | `reopened` | `exception-context` | `forward-exception-context-missing` |
| `resume` | `reopened` | `planned` | `exception-context` | `forward-exception-context-missing` |

正本は`src/forward/domain/transition-policy.ts`の`TRANSITION_POLICY`であり、この表はその写しである (検査は`tests/forward/fsm.test.ts`の`U-FSM-001`〜`009`)。
拒否の優先順位は、表に無いeventを`forward-transition-illegal`とした上で、(1) 例外commandのcontext、(2) 必須evidence、(3) 表のfrom / `expectedFrom`の順とし、
最初に失敗した検査のruleを返す。`forward-transition-illegal`(exit 1)となるのは、表に無いeventの場合と、context・evidenceを満たしたうえで、現在のstateが表のfromに無い場合、または指定された`expectedFrom`が現在のstateと一致しない場合である
(例: contextの無い`archived`からの`block`は`forward-exception-context-missing`でexit 2、`U-FSM-006`)。正常系の各行は隣接遷移だけを許す。
上の遷移表と下の要件定義表は`TRANSITION_POLICY`と一致する。evidenceの要件定義はeventごとに`transition-policy.ts`が持ち、policy IDやcommand→policyの対応表はsrcに存在しない。

例外eventは`exception-context`だけを必須evidenceとする。blockはaccepted / archivedから出せず、rejectは`review_ready` / `reviewed`からだけ出せる。
supersedeはacceptedを含むarchived以外の全正常stateから出せ、supersededは`reopen`で`reopened`へ戻せる。
`resume`は`reopened`から`planned`へ戻し、元のnormal stateへは戻さない (resume後は`planned`から表のとおり再度進める)。
archivedだけがterminalで、acceptedから許されるeventは`archive` / `supersede`である。

#### Forward evidence要件定義表

srcにはevent横断で共有するpolicy ID (`review/v1`等) の表は無い。必須evidenceは、`TRANSITION_POLICY`の各eventが持つ`EvidenceRequirementSpec` (`requirementId` / `requiredKind` / `acceptedProducers` / `exitRule` / `claimsRule` / `maxAgeMs?`) の列挙だけで定義される。
下表は`src/forward/domain/transition-policy.ts`の要件生成関数 (`requirement` / `pair` / `review` / `red` / `test` / `implementation` / `trace` / `decision` / `exception`) の写しである。
`exitRule`の既定は`exact 0`、`claimsRule`の既定は無し (各行が明示する)。`期限`は`maxAgeMs`で、`24時間`は`24 * 60 * 60 * 1000`ミリ秒、`なし`は未設定である。

| requirementId | required kind | 許可producer | exitRule | claimsRule | 期限 | 使用event |
|---|---|---|---|---|---|---|
| `scope` | `scope-approval` | `po` / `human` | `exact 0` | `recorded` | なし | `plan` |
| `pair-artifact` | `pair-artifact-declaration` | `codex` / `claude` / `human` | `exact 0` | `recorded` | なし | `prepare-pair-freeze` / `freeze-pair` / `begin-implementation` |
| `design-pair-review` | `design-pair-review` | `codex` / `claude` | `exact 0` | `review-approved` | なし | `prepare-pair-freeze` / `freeze-pair` |
| `red` | `red-test-run` | `codex` / `claude` / `ci` | `nonzero` | `red-observed` | 24時間 | `freeze-red` / `begin-implementation` |
| `implementation` | `implementation-digest` | `codex` / `claude` | `exact 0` | `recorded` | なし | `complete-implementation` |
| `targeted` | `targeted-test-run` | `codex` / `claude` / `ci` | `exact 0` | `recorded` | 24時間 | `complete-implementation` |
| `trace-materialization` | `trace-materialization` | `codex` / `claude` / `ci` | `exact 0` | `recorded` | なし | `prepare-trace-freeze` |
| `trace-closure` | `trace-closure` | `codex` / `claude` / `ci` | `exact 0` | `trace-clean` | 24時間 | `freeze-trace` / `prepare-review` |
| `green` | `green-test-run` | `ci` | `exact 0` | `recorded` | 24時間 | `freeze-trace` / `prepare-review` |
| `independent-review` | `independent-review` | `codex` / `claude` (著者familyを除く) | `exact 0` | `review-approved` | なし | `submit-review` / `accept` |
| `gate` | `gate-run` | `ci` | `exact 0` | `gate-passed` | 24時間 | `accept` |
| `acceptance` | `acceptance-decision` | `po` / `human` | `exact 0` | `decision` (expected=`accepted`) | なし | `archive` |
| `retention` | `retention-decision` | `po` / `human` | `exact 0` | `decision` (expected=`archive`) | なし | `archive` |
| `exception` | `exception-context` | `po` / `human` / `codex` / `claude` | `exact 0` | `recorded` | なし | `block` / `supersede` / `reject` / `reopen` / `resume` |

`red`の`claimsRule=red-observed`は、`todoCount`と`skipCount`が0で、`expectedFindingIds`と`observedFindingIds`が(順序を除いて)一致することを要求する。
`trace-closure`の`claimsRule=trace-clean`は`orphanCount`と`staleCount`が共に0であることを、`gate`の`claimsRule=gate-passed`は`failedGateIds`が空であることを要求する。

評価は`ForwardEvidencePolicy` (`src/forward/application/forward-evidence-policy.ts`) が行う。要件ごとに、`policyId=forward/<requirementId>`・revision 1の単一要件`EvidencePolicy` (`src/plan-asset/domain/evidence-policy.ts`) を組み立てて評価する。
- cardinalityは`targeted-test-run`だけ`minCount=1` (上限なし)、それ以外は`minCount=1` / `maxCount=1`とする。適格recordが2件以上あると`excessCount`により不適格となる。
- `independent-review`の許可producerは、評価contextの`authorFamily`が与えられたときだけ著者familyを除いた集合になり、`authorFamily`が無いときは空集合になる (適格recordは0件)。
- 適格なrecordは、有効 (supersedeされていない) で、attestationの検証に通り、`requiredKind`・subject・revision・source commitが一致し、許可producerのrecordで、`expiresAt`前で、`exitRule`と`claimsRule`を満たし、`maxAgeMs`以内のものだけである。別revision・期限切れ・`exitRule`不適合のrecordは件数に数えない。
- 不足は`<requirementId>:missing`として返し、適格・不適格のevidence IDはbytewiseの昇順で返す。

#### workflow CLI共通envelope

`workflow status|transition|explain`は同じapplication service verdictを使用する。JSON応答は`ok`、`command`、
`subject { asset_id, revision, alias }`、`current_state`、任意の`requested_state`、`verdict`、`findings[]`、
`evidence_ids[]`、任意の`event_id`、`state_digest`を返す。正常exit 0、domain/guard違反1、usage/schema違反2、I/O/transaction失敗3。
`status`と`explain`は書込み0、`transition`はevent append+projectionを1 transactionで行う。aliasは418のexact resolverだけを使い、
ambiguous=`plan-migration-collision`、unknown=`plan-asset-not-found`、future revision=`plan-revision-not-found`とする。
CLI/hook/doctorはrule ID、verdict、exit classを変換せず、同じrequest digestなら同じcommand ID再送を冪等に扱う。

実装済みのexit class割当と検査順序は次のとおり (`src/forward/domain/workflow.ts:70-108`)。検査は (1) eventが許可表にあるか、
(2) 例外commandのcontext、(3) 必須evidence、(4) 現stateからのedgeと`expectedFrom`の順に行い、最初に失敗した検査のruleを返す。
(1) で許可表外のeventは`forward-transition-illegal`でexit 1。(2) のcontext不足は`forward-exception-context-missing`、
(3) の必須evidenceの欠落・期限切れは表のspecialized ruleまたは`forward-evidence-missing`で、いずれもexit 2とし、
期限切れrecordをeligibleに数えない。(4) の現stateから辿れないedge・`expectedFrom`不一致は (2)(3) を通過した場合に限り
`forward-transition-illegal`でexit 1となる。したがってedgeが不正でもevidenceが欠けていればexit 2が先に返る
(例: `proposed`からevidence無しの`accept`は`forward-accept-evidence-missing`でexit 2)。
ledger/projectionが利用不能、ledgerとprojectionのstate/digest不一致、subject不一致は`forward-ledger-unavailable`でexit 3とし、
PLAN frontmatterのstatusからstateを補完しない。拒否時はevent/outbox/外部intentを生成しない。`explain`は有効なqueryであれば
policyが遷移を拒否してもexit 0で`verdict: explain`と拒否ruleを返す。

移行元: `docs/plans/PLAN-L7-419-forward-fsm-transition-workflow-cli.md` (issue #648)

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
- Forward FSM: `U-FSM-001..009`, `P-FSM-001`
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
  snapshot内のinstall、DB rebuild、Vitestはrunnerが解決したNode executable（`resolveNodeBinary`）と`resolveNpmCli`のnpm-cli.jsを直接起動する。
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

> 訂正 (2026-08-05、Issue #231): 旧三job契約は現行workflowの事実として残るが、D2 targetでは
> CI aggregate receiptと最終merge authorizationを別job/checkへ分離する。旧`harness-check`を
> CI入力と最終required出力の双方に使う契約は自己参照になるため、本節のtarget契約でsupersedeする。

target runtime source workflowは、Linux実行leg `harness-check-linux` とWindows実行leg
`harness-check-windows`、両legを束ねる非required CI job `harness-ci-aggregate`、D2が最終判断を
投影する唯一のrequired job/check `harness-check` を別identityとして持つ。`harness-ci-aggregate`は
`needs` の集合が二つのlegと完全一致し、`always()` で必ず評価される。判定は両方の
`needs.<leg>.result === 'success'` の論理積だけをGreenとし、`failure`、`cancelled`、`skipped`、
`neutral`、`timed_out`、`action_required`、未知値、結果欠落をfail-closeする。個別legの成功や
workflow全体の曖昧なconclusionをCI aggregate Greenへ読み替えない。最終`harness-check`は
E13 `AggregateCiReceipt`、D1 `merge_ready`候補、D3d `custody_admitted`のANDだけを受け、
自身のconclusionをE13/D1入力へ戻さない。

`GithubCiPolicy` はruntime dual-leg profileとconsumer template single-leg profileを明示入力で
区別する。**D2 targetのruntime profile**には上記四job topologyを要求し、現行三jobprofileは
target実装PRが移行するまで既存契約として検証する。targetではjob名、`needs` 完全一致、`always()`、
明示result guardの欠落・余剰依存・循環・同名job偽装をviolationにする。template profileには
runtime固有のWindows legを推測追加しない。profileをworkflow本文やjob数から自己推論してはならない。

E13へappendできる `AggregateCiReceipt` は少なくとも `repositoryIdentity`、`workflowIdentity`、
`workflowRevision`、`runId`、`runAttempt`、`headSha`、`requiredCheckSetDigest`、
`protectionRevision`、Linux/Windows各legの `jobId`・`name`・`conclusion`、CI aggregate job
`harness-ci-aggregate`の`jobId`・`name`・`conclusion`、receipt digestをlosslessに保持する。この三jobは
同一workflow run、同一run attempt、同一HEAD SHAに属し、job identityは互いに異なる。required
contextは別identityの最終`harness-check`一件でなければならない。両legとCI aggregateの全てが
`success`の場合だけE13 receiptはvalidである。最終`harness-check`をreceiptへ混入したら拒否する。

HEAD SHA、run attempt、workflow revision、required check set、protection revisionのいずれかが
変化したreceiptはstaleであり、後続runの証拠へ合成しない。E13 reducerはremote observationだけでなく
このvalid receiptを要求する。E14のmerge authorization、自動merge、Execution Ledger projectionは
個別legや片OSのreceiptを参照せず、E13に束縛されたCI aggregate receipt digest、D1候補、D3d custody
のANDを参照する。その結果だけをrequired `harness-check`へ投影する。branch protectionのrequired
contextは`harness-check`一件へ固定し、`harness-ci-aggregate`をrequiredへ追加しない。実GitHub設定が
未適用・乖離・取得不能なら「設定済み」と推測せずclosureをblockする。

## 2026-07-22 Hook executable+argv contract 追補 (Issue #123)

| 関数 | signature | 前提 | 事後 | invariant | oracle |
|---|---|---|---|---|---|
| `parseHookInvocation` | `(raw: RawHookInvocation) => HookInvocation \| null` | `command` と任意の `args` を受ける。 | runtime 固有 JSON を `executable`、`args` (意味上の argv)、`tokens`、`serialization` へ正規化する。不正型は `null`。 | shell quoting を exec-form argv の代用にせず、`args` 存在時は token 境界を保持する。 | U-HOOKEXEC-001..002 |
| `invocationEquals` | `(actual: HookInvocation, expected: { executable: string; args: readonly string[] }) => boolean` | 両 invocation は正規化済み。 | executable と argv の長さ・順序・値が完全一致するときだけ true。 | 部分文字列、追加 token、近似 path を受理しない。 | U-HOOKEXEC-003..004 |
| `wrapperHookArgs` | `(id: RequiredProjectHookId) => readonly string[]` | id は REQUIRED に存在する。 | consumer wrapper entrypoint と hook subcommand を token 配列で返す。 | source/built-in/docs template の argv 正本を分岐させない。 | U-HOOKEXEC-005..006 |
| `analyzeProjectHooks` | `(docs: ProjectHookDoc[]) => ProjectHookResult` | setup/source の Claude hook config を与える。 | 6 hook の executable、argv、policy、個数を照合し、shell-form command、欠落 token、追加 token、argv spoofing を fail-close finding にする。 | detector の都合で設計を shell form に戻さない。 | U-HOOKEXEC-006..007 |
| `observeWindowsHookDispatch` | `(run: HookSmokeRun, deps: ProcessTraceDeps) => HookDispatchObservation` | project-local `.ut-tdd/bin/ut-tdd.mjs` wrapper の source と実行結果を観測できる。 | `spawnSync(process.execPath, argv, { shell: false, windowsHide: true })` の静的/source 契約、shell host token 不在、正常実行 outcome、entrypoint 欠落時 exit 127 を返す。 | process-tree ancestry の観測は主張しない。shell 経由または期待外 executable/exit を受理しない。 | U-HOOKEXEC-008 |

`HookInvocation` は `{ executable: string; args: readonly string[] }` (`args` は意味上の argv)。Claude / Codex の config JSON は
runtime 固有 projection であり、意味論正本ではない。これにより project-hook、doctor、setup、Pack
template が同じ invocation を比較しつつ、runtime ごとの schema capability を混同しない。
## Node self-host bootstrap機能契約（Issue #152 D0-N）

関数`buildNodeGeneration(candidateRevision)`はexact Node `24.22.1` / npm `11.19.1`、review済み
検証済みツールチェーン来歴（Node配布物digest、同梱npm CLIの期待digest、package/lock identity）、
入力には`package-lock.json`とbuilder/source graphも含め、compiled ESMと`NodeBootstrapReceipt`を
同一generationへ原子的に公開する。receiptは少なくとも
receipt項目は`subject_revision`、Node/npm実行ファイルの絶対path・version・digest、lock digest、
外部dependency closure digest、builder policy/digest、source graph digest、
compiled entrypointの相対path/digest、toolchain provenance digest、generation IDを持つ。

関数`loadNodeGeneration(expectedRevision)`はappend-only activation marker集合を読み、
全digest、exact version、review済みprovenance、dependency closure、subject revisionを照合する。同じ
versionを返す別npm CLIもexpected digestが異なれば拒否する。不一致・欠落・未知schema・
symlink escape・partial publishではtyped failureを返し、spawnを呼ばない。成功時だけ
`shell=false`、Windowsでは`windowsHide=true`でsealed Node executable + compiled ESMを起動する。
Bun、bunx、tsx、TS直実行、ambient PATH、runtime downloadへのfallbackは禁止する。

`publishActivation`はexact path `dist/node-publish.lock/`をatomic `mkdir`で取得できた場合だけ、取得後の
max sequence `N`から`N+1`を割り当てる。同時writerは`publish-lease-busy`でfail-closeしretryしない。
`owner.json`欠落・破損をunlock根拠にせず、別path、open-wx、steal、clear、recovery APIを禁止する。
crash残留lockは後続recovery PLANまで永久にpublishをblockする。marker rename後crashではreaderだけが
complete markerを利用できる。

process-crash atomicity oracleは各barrierのfault injectionと並行readerで、旧完全generationまたは新完全generation
以外を観測しないことを要求する。markerはtemporary write + file sync + close後、存在しない一意final名へ
same-filesystem renameする。POSIXは可能な場合parent directoryをsyncする。Windows Node-only F0bはpower-loss後の
最新marker persistenceも旧marker存在も保証しない。検証可能complete markerが1件以上なら最大sequenceを選択し、
0件なら`node-activation-marker-missing`でfail-closeする。power-loss
durable activationはResource Kernel bundle trust floorの後続責務であり、F0 receiptへ虚偽のdurable claimを入れない。

F0b rollbackは同一subject revision限定。cross-revision rollbackとtarget revision変更APIはunsupportedで
fail-closeし、通常はgit revertから新revisionをbuildする。F0bはautomatic GC、generation deletion API、
lease recovery/steal/clearを実装しない。CLI先行・receipt後行の二段rename、既存pointer上書き、
shell/native helper fallbackは契約違反である。

`initializeCutoverChain`は空chain、sequence 0、expected head nullだけでinventory/review/admission evidence setを検証してgenesisを作る。
`appendCutoverTransition`は空chainを拒否し、validated receipt chain、previous/current state、subject revision、evidence receipt、
review/admission receiptを受け、許可された隣接一方向遷移だけをappendする。返す
`CutoverTransitionReceipt`の唯一のfield順は`schema_version`、`registry_id`、`transition_id`、`sequence`、
`subject_revision`、`previous_state`、`current_state`、`evidence_set_digest`、`review_digest`、
`admission_digest`、`previous_receipt_digest`、`receipt_digest`である。別名`evidence_digest` /
`chain_digest`は受理しない。precondition不成立、skip/reverse/replay、revision又はchain不一致はtyped errorでfail-closeし、
`projectCutoverState`はvalidated chainだけをfoldしてcurrent stateを返す。

空chainは`uninitialized`で開始不可。genesisは`previous_state=null`、`previous_receipt_digest=null`、
`current_state=inventory_frozen`とinventory evidence+review/admissionを要求する。edge-discriminated evidenceは
kind/count/producer/subject revision/digest/exit successをexact照合し、wrong edge/replay/skipを拒否する。

edge registryはL5のgenesis、inventory→shadow、shadow→primary、primary→bun_removed、bun_removed→sealedの
5 Edge IDを`CUTOVER-EVIDENCE-REGISTRY-v1`から識別unionとして実装し、別edgeのevidence型を受理しない。
inventory→shadowだけは各producer receiptのslice commit subjectとcandidate HEADのdescendant closureを検証し、
同一subjectを要求しない。transition receiptはcandidate HEADをsubjectとし、stale/replay/non-ancestorを拒否する。
`review_digest` / `admission_digest`は全edgeで非nullかつ対応registry rowのevidence receipt
`receipt_digest`とexact一致する。`evidence_set_digest`はregistry row順の固定tupleをUTF-8 canonical JSON、
decimal byte-length framing、SHA-256 lowercase hexで算出し、duplicateとcross-OS差を拒否する。
sealed edgeは`PLAN-RECOVERY-16` / `PLAN-L7-452`のtyped rowを両方要求する。
`SliceEvidenceReceipt`は11-field pre-attestation tuple、record digest、nested attestation、wrapper receipt digestを使う。
generic kindはtyped `EvidencePayloadObject`をobject receipt digestで取得してpayload bytesを再hashする。
SliceEvidenceとpayload objectのkind/owner/attestation producer/payload schemaを
L5 `CUTOVER-PAYLOAD-SCHEMA-REGISTRY-v1`のclosed discriminated unionへexact照合する。payloadはRFC 8785
canonical JSON→UTF-8→RFC 4648 base64url paddingなしへ一意化し、decode bytesをSHA-256で再hashする。
arbitrary bytes、schema spoof、cross-kind/cross-owner/cross-semantic replayを拒否する。
subject revisionは`git-sha1:<40 lowerhex>|git-sha256:<64 lowerhex>`だけを許し、outer/payloadをexact一致させる。
payload object/decoded payload/envelopeのschema version literal及び`payload_schema == schema_id`もexact照合する。
同じ共通GitObjectId型をCutover candidate/transition、Review lane/bundle、L6 confirmation、Slice admission/evidenceへ
適用しraw hexを拒否する。tracked/L6/reviewを含む全receipt schema versionをliteral v1へ閉じる。
Q0 expected caseは同subjectのimmutable attested CaseManifestObjectから取得し、executed setを照合する。
正本は`docs/test-design/harness/L8-integration-test-design.md`内の
`NODE-Q0-CASE-MANIFEST-v1-BEGIN/END` exact 1組に挟まれたexact 1 JSON objectとする。
artifact ID/path、marker数、duplicate/unknown fieldを検証し、RFC 8785 canonical object UTF-8 bytesから
artifact digestを再計算する。manifest arrayはparsed arrayと順序込みexact一致させる。
parserはraw MarkdownのUTF-8 LF、backtick込みmarker exact行、前後空白0、間のnonblank JSON exact 1行、
required/allowed 3 fields exactを要求する。Q0 payload refは`edge_kind='q0.case-manifest'`,
`ordinal=0` exact 1とする。DB discriminatorは`evidence_type`だけとしtyped union kindと双方向一致させる。
Case IDはUTF-8 code-point昇順unique arrayとし、set digestは
`SHA-256(lowerhex)(UTF-8(RFC8785 canonical JSON(array)))`で再計算する。test-design artifact digestも
subject GitObjectId時点のcanonical bytesから再計算する。core/outer owner一致とclosed mapの`ci`を検証し、
同一subjectは同一outer digestだけ冪等、異digestは競合拒否する。q0.authoring/q0.runtime-no-fallbackは同じouter digestを
typed `cutover_evidence_refs` edgeで参照し、missing/orphan/split manifestを拒否する。
ReceiptDigestはraw lowerhex 64、ContentDigestは`sha256:`付きlowerhex 64へ分離しprefix混同を拒否する。
artifact digest preimageはmarker間single parsed JSONのRFC 8785 UTF-8 bytesだけとする。DB subjectはsigned
payload JSONからgenerated columnで導出し、strict NOT NULL tableのtransactional rebuild migrationを要求する。
ReviewBundleはattested CandidateAuthorshipReceipt outer digestをnested ref exact 1で参照し、provider由来の
全writer identity/session/runtime setとreviewerをdisjoint検証する。自己申告author fieldを受理しない。
IdentityDigestはcanonical identity objectのRFC 8785/UTF-8 ContentDigestとする。bundleへbase revisionを追加し、
authorshipのsubject/artifact/base及びPR review base/merge-baseとexact一致させる。trusted work event ReceiptDigest
集合がbase..subject全product path/commitをcoverし、そのsorted arrayからprovenance ContentDigestを再導出する。
WorkProvenanceEventはtouched_pathsを含むexact 12/self除外11-field core+outer envelopeとし、authorshipへevent digest arrayと
ordinal順typed edge exact Nを持たせる。ReviewBundleはexact 8/self除外7とする。genesis receipt sequenceは0、
CAS後head sequence 0/version 1とする。
SessionIdentityDigestへraw sessionを置換し、first-parent各commit diffのnormalized path exact setをevent arrayと
照合する。head CASはexpected sequenceを含み、同transactionのMAX receipt sequenceと一致させる。
SessionIdentityReceipt outer envelopeをWorkEvent/ReviewLaneがtyped edge exact 1で参照しchain-only再導出する。
tracked changed pathsは除外0でexact照合し、head digestもMAX sequence row receipt digestと一致させる。
session coreはManagedSessionAttestationとouter EvidenceAttestationを二段検証する。managed verifierのclosed
trust registryがUT-TDD managed session authorityを検証し、外部provider API署名を仮定しない。
WorkEvent/laneとsession receiptのprovider/runtimeをexact一致させる。
管理対象trust registry 3 rowについてrevision、issued_at validity、wrong authority/key、forgery、provider binding、
stable subject+session同時証明を検証する。
SessionIdentityはexact10/self9 core+outer二段検証、combined payloadだけを使い、`identity.session` edge exact1を
要求する。immutable v1/revision 1だけを使い、expiryでadmissionをfail-closeする。
active signing-key compromiseの自動検出、rotation、revocationはD0実行経路に存在しない。侵害が外部security
incidentとして報告された時点で該当authorityを運用停止し、managed-session verification、admission、cutoverを
全面fail-closeして既存receiptをmerge/activation根拠に使わない。再開はsecurity/PO承認の別ADR/PLAN、新registry
ID v2、再review/reissueを必須とし、immutable v1を書き換えない。これはmachine Green oracle又はhistorical
determinism claimではなく、明示的な高影響運用境界である。
projection rebuildはsingle read snapshot→staging generation→complete marker→atomic publishとする。
aggregateはL5 profile registryのprofile revision、required lanes/set digestとobserved setをexact照合する。
`ReviewBundleReceipt`はexact 8-field core/self除外7-field ordered preimageとexact 7-field
`AttestedReceiptEnvelope`を使い、
claim-blind/spec-blindのexact 2 lane PASSとartifact/revision一致を要求する。lane schemaのprovider、
reviewer model、execution mode、runtime familyをdigest/attestationへ封印する。hybridはprovider/session/identity/
runtime family/authorを分離する。codex-only/claude-onlyはruntime family一致を許す代わりに
異model+独立session/identityを必須とする。standaloneはAI laneを禁止し、provider=human/model=none/
runtime=humanのdistinct reviewer 2名と独立session/evidenceを要求する。条件を満たせなければfail-closeする。
Issue #153でも2 laneを維持する。
chain entryだけでbundle/admission/evidenceを再検証可能にする。attested coreの参照はすべてouter envelope
`receipt_digest`だけとし、core receipt digest、payload `evidence_digest`又はaliasで取得しない。
ReviewBundle→lane、SliceEvidence→ReviewBundle及びQ0 predecessorまで同じ規則を使う。
`SliceEvidenceReceipt`はkindで
discriminateし、review/admission kindは各ReviewBundle/CutoverAdmission receipt digestへのtyped ref、
generic kindだけはpayload object receipt digestとcontent専用payload digestを持つ。owner IDと既存EvidenceProducer enumを分離し、ownerをpreimageへ、
`human|po|codex|claude|ci`だけをverifier inputへ渡す。wrong mappingとreceipt digest自己参照を拒否する。
append commandはlatest sequence+1とexpected previous digestを要求し、exclusive lock内CASでreceipt+evidenceを
atomic appendする。double genesis、fork、CAS loser、crash partialをtyped failureにする。

cutover/final revisionの許可はslice receiptと分離した`CutoverAdmissionReceipt`を使う。fieldは
edge/candidate head/prior validated Q0又はcutover receipt/execution mode/decision/既存EvidenceRecordの
authority ID+key version+signature+producer+record digest/receipt digestで、genesisはvalidated Q0
`SliceAdmissionReceipt`をdirect参照し、以後は直前cutover receiptをpriorに要求する。独自`issuer_key_id`は持たない。全edgeのfresh admissionを
正規producer registryで発行し、skip/replay/別edge/slice receipt流用を拒否する。
CutoverAdmissionはowner、EvidenceProducer、nested authorityを分離し、L5
`CUTOVER-ADMISSION-PRODUCER-MAP-v1`の5 edgeと`authority_id == attestation.authorityId`をexact照合する。
edge別allowed authority ID/keyVersionもclosed照合し、別trusted CI authority replayを拒否する。
ReviewLane preimageはversionを含むexact 11 fields/self除外として固定する。
SliceAdmission coreは8 fields/self除外7-field ordered preimageへ固定する。
execution modeはReviewLane/Bundle及びactual admission modeとexact一致させる。
ReviewLane/Bundle coreはproducer/record digest/nested attestationを持つ
exact `AttestedReceiptEnvelope`に格納し、両admission receiptは既存`EvidenceRecord` /
`EvidenceAttestationVerifierPort`へ委譲する。attestationはnested
`{schemaVersion:"evidence-attestation/v1",algorithm:"hmac-sha256",authorityId,keyVersion,signature}`だけを持ち、
producer/recordDigestは`verify({producer,recordDigest},attestation)` inputとしてsubject/edge bindingと共に
trusted verifierで検証する。unsigned/forged/untrusted、author reviewer、mode別independence違反を拒否する。
production append portは`.ut-tdd/ledger/cutover-ledger.db` SQLiteだけを使い、`BEGIN IMMEDIATE`、WAL、
`synchronous=FULL`、head digest/version条件付きUPDATE、chain+sequence/receipt digest UNIQUEを単一transactionで
実行する。affected row 0のCAS loserは全insert rollback+retry 0。commit/fsync barrier後だけ成功を返す。
cutover DBは独自migration registry/`user_version`を所有する。canonical ledger保守portはSQLite online backupで同一時点snapshotを作り、restore後のhead・全refs・object digestを
元とexact照合する。migrationはbackup後の単一transactionで実行し、途中失敗を全rollbackする。未知newer schema、
downgrade、projectionからのcanonical復元はfail-closeする。`.ut-tdd/harness.db`はrebuildable projectionだけ、
`.ut-tdd/ledger/harness-ledger.db`はPLAN ledgerだけを所有し、projection writerはcutover DBをread-only投影する。

`admitNodeSlice`はversion/slice/predecessor/subject/required inputs/decision/producer/receipt digestを持つ
coreをexact `AttestedReceiptEnvelope<SliceAdmissionReceipt>`へ格納し、producer/record digest/nested attestationを
既存verifierで検証してD0→F0a→F0b→F0c→Q0を実装する。typed unionへraw SliceAdmission coreを保存しない。
core producer ownerとouter envelope producer ownerをexact一致させ、wrong outer owner/mappingを拒否する。
F0b/F0c/Q0へそれぞれ直前のF0a custody/F0b sealed build/
F0c aggregate receiptを要求する。`CAND-NODEBOOT-017..020`はedit-start hookでなくcandidate commitのmerge admissionで、
gate test/schema/runtimeをproduct changeより先にTDD実装し同一commitを評価する。receipt欠落、別revision、owner違反、
skip/replayはrejected receiptを残しmergeを拒否する。保存時は各sliceの
`predecessor_receipt_digest`と`required_input_receipt_digests`をexplicit refsへ展開し、D0 SliceAdmissionから
既存ReviewBundleReceiptのouter envelope digestをtyped root refとして保存する。
Q0からD0 rootsまでchain-only closureが切れた場合は拒否する。
required inputはL5 `NODE-SLICE-INPUT-REGISTRY-v1`順でdigest化する。D0はReviewBundle 1、canonical
AttestedTrackedReceiptRecord exact 4だけを要求する。tracked projectionの
integrity-only recordをformal plan admission-checkには使えてもD0 genesis trustには使わず、既存EvidenceAttestationへ
record digestとfull bindingを束縛したwrapperだけをeligibleにする。unsigned/self-hash/forged/untrusted/
wrong/missing/duplicate/stale/content binding driftを拒否する。F0a/F0b/F0c/Q0もregistryをexact照合する。

例外は最初のF0b candidateに対するIssue #484の一回限りbackfillだけである。ここではL5
`NODE-SLICE-LEGACY-BACKFILL-REGISTRY-v1`の`legacy.d0-admission`と`legacy.f0a-custody`を順にexact照合する。
Git固定された`LegacyD0TrackedReceiptSetV1`をattested wrapperだと見なさず、L5固定tupleから
`LegacyD0AdmissionBackfillReceiptV1`と`LegacyF0aCustodyBackfillReceiptV1`の二receiptをatomicにmintする。
legacy D0行のcanonical preimageはL5 internal-processing §`NODE-SLICE-LEGACY-BACKFILL-REGISTRY-v1`が定義する
RFC 8785/JCS bare array（固定command順のexact 4 full record object、exact record/binding field、UTF-8 BOMなし・末尾改行なし）を
唯一の正本として参照する。F0a行はF0a source HEAD/tree/merge SHAと、path昇順のexact 8 Git row（`blob_oid`, `content_digest`, `path`）だけを
RFC 8785/JCS bare arrayとして再構成し、L5固定digestへexact一致させる。reviewer family/model、verdict、
retrospective review record又はcustody admittedは入力にせず、`family_status=unverified_family`、
`review_authority=none`とする。注入された`reviewerFamily`/`reviewerModel`/`PASS`も判定結果を変えない。
command authorityと各rowの`d0-design-owner` / `f0a-toolchain-owner` producerを混同してはならない。
通常D0 eligibility判定へこのlegacy setを渡してはならず、固定履歴を再構成不能なら
`legacy_evidence_unavailable`、partial/double mint又は再利用はtyped rejectとする。

> **退役注記 (#977)**: 以下のcutover genesis / `L6ConfirmationReceipt` (CD-37) は退役済み。Node切替がこのchainなしで
> 完了 (sealed) したため (#487 close、#152 / #153 close)、実装予定はない。範囲・根拠・有効のまま残る部分
> (`SliceAdmissionReceipt`等)・削除の所管 (#592 D2 / D3)は
> [internal-processing.md](../L5-detailed-design/internal-processing.md) §Node切替receipt chain の退役注記を正本とする。
> `projectGithubReviewLaneReceipts` (GitHub review lane projection)とは別物。

production cutover genesisは`L6ConfirmationReceipt` exact 1を要求する。PLAN-L6-93のexact plan/revision、
status confirmed、content digest、candidate HEADとtrusted nested attestationをchain-onlyで再検証し、
CutoverAdmissionの`l6_confirmation_receipt_digest` direct refと一致させる。
L6 confirmationはplan/revision/status/content/head/tracked digest/owner/attestation producerをrecord digestへ、
nested attestationをwrapper receipt digestへ固定順で封印する。ReviewBundleはbundle execution modeを持ち、
両lane及びactual admission modeとexact一致させる。

cutover 3関数`initializeCutoverChain` / `appendCutoverTransition` / `projectCutoverState`の実装先は
`src/runtime/cutover-transition.ts`、pair testは`tests/cutover-transition.test.ts`である。
`admitNodeSlice`のkernel/testは`src/runtime/node-slice-admission.ts` /
`tests/node-slice-admission.test.ts`、zod正本は`src/schema/cutover-transition.ts` /
`src/schema/node-slice-admission.ts`である。D0では将来生成契約としてfreezeする。

## PLAN-L6-92 Resource Kernelプロトコル・エラー・プラットフォームポート契約

本節は`PLAN-L5-25`のL6降下であり、`L7-unit-test-design.md`の`U-RGK-WIRE-*`、`U-RGK-TRUST-*`、
`U-RGK-ERROR-*`、`U-RGK-CAP-*`、`U-RGK-LIFE-*`、`U-RGK-PORT-*`、`U-RGK-BUNDLE-*`と対を成す。

### ワイヤ/エラー代数

`decodeRequestFrame(bytes, limits)`は4-byte lengthとexact JSON DTOを検証し、一つのrequestまたはtyped
`PreDispatchWireFault`を返す純粋関数とする。`decodeResponseFrame(bytes, correlation, dispatch_state)`は
valid response又はtyped `PostDispatchResponseFault`を返し、mutating dispatch後の全decode/correlation failureを
pre-dispatchへ降格させない。`PreDispatchWireFault`はwire responseやworkload domainの`NativeError`ではなく、Node `CustodyClient`が
Execution Kernel境界でexactly once closed `protocol_failure`へ正規化する。decode失敗時のlauncher/custody side effectは0である。
`encodeFrame`はcanonical bytesを決定論的に返す。
コマンド代数はlauncher参照を持たない`Probe(ProbeRequest)`、sealed token必須の`Execute(ExecuteRequest)`、
native factだけを返す`RecoveryObservation(RecoveryObservationCommand)`、
`RecoveryCustody(RecoveryCustodyCommand)`、control processだけを扱う`ControlCommand`の5 variantで閉じる。`Execute.operation`だけが
`create_custody | spawn_attached | resume`を所有し、`AdmissionToken`とattempt/custody/bundle/probe bindingを必須とする。
`RecoveryObservation.operation`は`observe_recovery_fact | prove_boot_fence`だけを所有してnative observation factを返し、
authority/journal delta 0とする。`RecoveryCustody.operation`は`observe | terminate_tree | prove_empty | release_custody`だけを所有し、
`ControlCommand.shutdown_companion`を別unionとする。TypeScript内部`recoverAuthority`は
`SameBootExecutorRecoveryObservationV1 | CrossBootFenceObservationV1`だけを入力とし、
`observe/prove_empty/release_custody`は両cleanup variant、`terminate_tree`は`CleanupAuthorityLeaseV1`だけを必須とする。
全leaseの共通fieldは`authority_epoch/execution_id/execution_spec_digest/attempt_id/custody_nonce/bundle_digest/`
を前半の必須項目とし、`custody_identity/executor_id/deadline_unix_ms/termination_policy_digest/recovery_grace_ms/`
を後半の必須項目とする。さらに
`recovery_deadline_unix_ms/lease_nonce/issuer_key_id/authenticator`だけを認証項目とする。exact variant schemaは次で閉じる。

| schema/version literal | mode | 追加必須field | fixed allowed operations |
|---|---|---|---|
| `execution-authority/v1` | `live` | `boot_id/effective_deadline_monotonic_ms/recovery_deadline_monotonic_ms` | `spawn_attached,resume` |
| `cleanup-authority/v1` | `cleanup_only` | `boot_id/effective_deadline_monotonic_ms/recovery_deadline_monotonic_ms/predecessor_lease_digest/cleanup_transition_fact_digest` | `observe,terminate_tree,prove_empty,release_custody` |
| `boot-fenced-cleanup/v1` | `boot_fenced` | `previous_boot_id/current_boot_id/platform_boot_fact_digest/cleanup_deadline_monotonic_ms` | `observe,prove_empty,release_custody` |

boot-fenced variantはwall deadlineを共通fieldで保持するが、`boot_id`と旧bootのmonotonic deadlineを禁止し、
`cleanup_deadline_monotonic_ms`をcurrent boot domainで再導出する。variant間field、operation、unknown fieldをstrict rejectする。
launcher、managed-root生成、resumeの型参照を持たない。
same-boot observationは`schema_version/executor_id/execution_id/execution_spec_digest/attempt_id/custody_nonce/`
を識別項目とし、`bundle_digest/custody_identity/previous_authority_epoch/boot_id/effective_deadline_monotonic_ms/`
を実行項目とする。加えて
`termination_policy_digest/recovery_grace_ms/recovery_deadline_monotonic_ms/last_transition_digest/recovery_nonce/`
を回復項目とし、
`issuer_key_id/authenticator`を認証項目とする。このexact fieldだけを持つ。cross-boot observationは
`schema_version/executor_id/execution_id/execution_spec_digest/attempt_id/custody_nonce/bundle_digest/`
を識別項目とし、`custody_identity/previous_authority_epoch/previous_boot_id/current_boot_id/platform_boot_fact_digest/`
を起動境界項目とする。さらに
`deadline_unix_ms/recovery_deadline_unix_ms/observed_wall_unix_ms/observed_monotonic_ms/`
を時刻観測項目とし、
`termination_policy_digest/recovery_grace_ms/last_transition_digest/recovery_nonce/issuer_key_id/authenticator`
のexact fieldだけを持ち、旧boot monotonic/lease/authority mode/launcher fieldを禁止する。
`create_custody`はexecutor binding付きexecution leaseを返す。create/spawn/resumeはadmission chain上の
別stage tokenを直前durable factの確認後に一回ずつ発行・消費し、`spawn_attached | resume`はtokenと同じleaseを照合する。
`release_custody`は`empty_proven`かつreap proof後だけ許可し、`shutdown_companion`はcustody stateを変更しない。
phaseは`ControlPhase`と`WorkloadPhase`へ分離し、単一`process_created`を禁止する。
エラー直和は次の値だけで閉じる: `protocol_failure | bundle_failure | capability_failure | validation_failure | launch_failure | custody_failure | deadline | cpu_budget | memory_budget | process_budget | output_budget | cancelled | process_failure | orphan_detected`。未知native codeを成功や一般process failureへ丸めない。

### メソッド契約

| メソッド | 事前条件 | 事後条件 / 不変条件 |
|---|---|---|
| `canonicalizeBundleManifest` | schema/bundle revision/floor/component digestが全て型付き | 固定順length-framed bytesとdigestを返し、欠落・duplicate・unknown fieldを拒否 |
| `verifyBundle` | trust identityとtarget明示 | canonical payload全体のsignatureとcompanion/protocol/SBOM/target/D0-N generation receiptの全一致時だけverified handle |
| `BundleTrustPort.verify` | review済みtrust policy revisionとmanifest | ADR/L5の`TrustDecisionPort`をL6へ適応する唯一のadapter。`accepted` decisionとdecision digest/policy versionをverified handleへ束縛し、rejected、署名不一致、floor未満を拒否する。key rotation等の具体方式はD0外 |
| `BundleActivationPort.activate` | verified handle、expected floor | 現在floorより厳密に大きいsequenceの再署名manifestだけを原子的にactivateする。同sequenceは同payloadでも新規activationに使わず、別payloadならfail-closeする。storage・clock・recovery方式はD0外 |
| `negotiateCapabilities` | verified probe | required集合を完全包含する場合だけselection。不足は開始前failure |
| `recordProbe` | verified control identity、strict probe | probe digestをdurable append。managed root side effect 0 |
| `reserveCustodyNonce` | execution/spec/attempt確定、token未seal | OS identityとは別の一意creation nonceを予約。同nonce再利用・別execution移送を拒否 |
| `issueCreateCustodyToken` | recorded probe、完全capability、予約済みcustody nonce、deadline内 | admission chainとsequence 1を束縛し一度だけ発行。空required拒否 |
| `issueSpawnAttachedToken` | create fact commit済み、current execution lease | sequence 2、custody/executor/epoch/lease nonce、create fact digestを束縛。未commit・別chain・replay拒否 |
| `issueResumeToken` | attached factとhandoff commit済み、current execution lease | sequence 3、attached fact/handoff digestを束縛。skip/reorder/replay拒否 |
| `consumeAdmissionStageToken` | expected phase/operation、未消費token又は同一pending record | token消費と`consumed_pending_dispatch(request/token/idempotency/request digest)`を同一transactionでcommit。pending→indeterminate→reconciled→resultを同じrequest digestで継承。exact retryだけfact reconcile/side effect 0時の継続/同resultを許可し、digest不一致又はrecord欠測はreplay拒否 |
| `AdmissionTokenAuthenticatorPort.seal/verify` | wire DTOからauthenticator自身だけ除外したcanonical V1 payload、issuer key ID/policy revision | 非自己包含preimageへoperation/token nonceを束縛し、unknown key/version、偽造、同nonce別payload/別operation replayをside effect前拒否。具体key storage/rotationはD0外 |
| `AuthorityLeaseAuthenticatorPort.issue/verify` | wire DTOからauthenticator自身だけ除外したexact variant payload、execution/spec、executor/custody、boot、deadline/policy | 非自己包含preimageへlease nonceとallowed operationsを束縛し、unknown key/version、偽造、同nonce別payloadをattach/recovery前拒否。具体key storage/rotationはD0外 |
| `NativeObservationSignerPort.seal` / `RecoveryObservationAuthenticatorPort.verify` | Rust: pinned companion bundleのnative signer identity。TS: `BundleTrustPort`が検証済みのbundle signer/policy revisionとauthenticatorを除くexact observation payload | Rustはnative factだけをsealしauthority delta 0。TSはunknown signer/version、別bundle key、same/cross schema混同、field変異をCAS前拒否。具体key storage/rotationはD0外 |
| `recoverSameBootAuthority` | Rust/executor認証observation、durable journal、current epoch | TSがsemantic全binding一致時だけepochをCAS+1しcleanup lease+traceを同一transactionで発行。Rust DB/CAS/lease/trace 0 |
| `recoverCrossBootAuthority` | old/new boot native fence observation、durable journal、current epoch | TSがemptyを先取りせずCAS+1でboot-fenced cleanup lease+traceだけを発行。そのleaseでempty後release。Rust DB/CAS/lease/trace 0 |
| `transitionAuthorityToCleanup` | live execution authority、deadline/cancel/abort/normal-root-exit/terminate-intent、current epoch | epoch CASと同じtransactionで新lease nonce/authenticatorのcleanup leaseを発行しexecution capabilityを不可逆除去。敗者lease 0 |
| `sealMonotonicDeadline` | TypeScript: verified token、Rustから受けた同時観測wall/monotonic fact、boot ID | TypeScriptがremainingをbudgetとwall残時間の小さい方へ固定してsigned arm request/journalへcommit。cross-bootも新boot観測から非延長で再導出する。Rustは観測と供給済みdeadlineの強制だけを所有し、開始後wall jumpによる延長0 |
| `dispatchCommand` | closed `Probe | Execute | RecoveryObservation | RecoveryCustody | ControlCommand` union | Observationはnative factだけでauthority delta 0。Execute/cleanup leaseをdiscriminant分離しboot-fenced terminate拒否、生成・resume能力0。release-before-empty拒否。control shutdownはcustody delta 0 |
| `normalizePreDispatchWireFault` | typed `PreDispatchWireFault`、correlation state | Kernel境界でexactly once `protocol_failure`へ変換する。validated request ID前はwire response 0、raw invalid bytes/secret/絶対pathをerror/receiptへ保存しない |
| `markPostDispatchResponseFault` | mutating dispatch済み、typed `PostDispatchResponseFault` | EOF/pipeだけでなくresponseのframing/UTF-8/JSON/schema/trailing/correlation不正を必ずindeterminateへ遷移。side effect 0推測・terminal seal 0 |
| `reconcileDispatchIndeterminate` | request/token/idempotency/request digest全一致、authority/journal/native facts、又はdurable reconciled record | response lossをside effect 0へ推測せずindeterminate→reconciled→resultへactual phase/fact digestを一意に確定。reconciled後crashは4 digest+actual phase/fact digest一致からnative再実行0でresult commit。全stateでrequest digestを継承 |
| `reduceCustody` | attempt、nonce、sequence連続 | 正常辺とprepared/attached-suspendedからterminatingへのcleanup辺だけを受理し、resume-before-attach、release-before-emptyを拒否 |
| `launchAttached` | verified bundle、prepared custody、deadline内 | attach-before-user-code。失敗時resume 0とcleanup proof |
| `terminateAndProveEmpty` | created custody | terminate→empty→reap。proof不能時success 0 |
| `releaseCustody` | empty/reap fact、raw OS identity+非再利用custody_generationを束縛したdeterministic release_idがjournal commit済み | Rust `ensureAbsent`は同一generationの終状態absenceへ冪等収束。raw identityが別generationへ再利用済みなら削除せずquarantine。存在→不在effect最大1、Rust durable marker/DB 0。fact commit→disarm→revoke+released atomic |
| `shutdownCompanion` | active custody 0、pending response 0、未解決pending/indeterminate/reconciled-without-result 0、terminal outbox flush済み | control processだけを終了しcustody/authority state delta 0 |
| `normalizeNativeError` | strict native errorとprocess phase | phase整合したclosed errorへ変換しN/Aと欠測を区別 |

### プラットフォームポート/責務非重複

`PlatformPort`は`probe/createCustody/spawnAttached/resume/observe/observeRecoveryFact/terminateTree/proveEmpty/ensureAbsent/proveBootFence`で構成し、
control process終了は`ControlShutdownPort`へ分離する。
`CustodyAuthorityPort`は`prepareAuthority/commitHandoff/recoverAuthority/recordDeadlinePolicy/armDeadlineExecutor/revokeAuthority`で構成し、
handoff commit前resumeとstale epoch/nonceを拒否する。Linuxはbroker外deadline ownerをmanaged root開始前にarmし、
dual-crash後も期限内kill→bounded recovery→reap/orphan 0を完遂する。ownerをarm不能なら開始前拒否し、
証拠欠測を`custody_failure`へ変換するだけでは既存workloadの生存を許さない。
lease verifierはcreate/spawn/resumeだけをeffective deadlineで拒否する。cleanup leaseはeffective deadline後も
observe/terminate/prove/releaseに有効で、recovery deadline超過はoverdue findingと新規admission遮断を追加するが
cleanup拒否理由にはしない。cross-bootでは元wall recovery deadlineから新bootのmonotonic上限を非延長で再導出する。
Windowsはsuspended create・Job assign・non-inherit handle、Linuxはstart-in-cgroup・broker/subreaper・
`populated=0`+reapを必須とする。Node clientはtransport/deadline、TS domainはpolicy/journal/receipt、RustはOS custody factを
それぞれ一意に所有する。TypeScriptはdeadline policy決定とsigned arm request/journalを所有し、
別failure domainのRust/native `DurableDeadlineExecutor`だけがdeadline killを強制してenforcement factを返す。
RustにPLAN分類、admission、GitHub、DB/CAS判断、journal reducerを追加した場合は契約違反とする。
Bun依存またはdirect spawn fallbackを追加する実装は入力条件にかかわらずRedとする。

bundle rollbackは過去artifactを直接再activationせず、現在floorより厳密に大きいsequenceの新revisionとしてmanifestを再署名し、
通常のtrust・component・target検証を再通過させる。D0はtrust/activationを抽象portに留め、
rotation、revocation transport、secure clock、re-anchor、物理log schemaを後続implementation revisionへ送る。

## 2026-08-31 legacy slice receipt 境界

`LegacyD0AdmissionBackfillReceiptV1` と `LegacyF0aCustodyBackfillReceiptV1` は、PR #154/#192以前に
存在しなかったreceipt producerを一度だけ移行するための **integrity-only** 証拠である。関数契約上、両receiptが
証明するのは、#484 admission kernelが immutable Git source/tree/merge と固定行集合を現在再構成し、migration
decisionを発行できたことだけである。過去のreview実施、custody admitted、provider family、verdictを証明せず、
`family_status=unverified_family`、`review_authority=none`として通常のD0 eligibilityへ入力してはならない。
入力に注入された`reviewerFamily`、`reviewerModel`、`PASS`その他の自己申告は、receiptの判定結果を変えない。
固定行・Git blob・chain・digestの欠落または不一致は`legacy_evidence_unavailable`で停止し、歴史的reviewを推測して
補完しない。二receiptの発行は#484だけが同一atomic operationでexactly once実施し、通常registryへ一般化しない。

## 2026-10-15 Windows leg の vitest 3 shard 契約 (Issue #1063)

> 本節は Issue #1063 項目 2 の契約であり、実装は含まない。`harness-check-windows` の job 形状を変えるため、
> `GithubCiPolicy` の oracle (`checkLaneSkipSafety` 系) と対のテスト設計
> (`docs/test-design/harness/L7-windows-ci-single-snapshot-test-design.md` 末尾の `CANDIDATE-U-CISHARD-*`) を先に凍結する。

### 背景 (実測)

`harness-check` の律速は Windows leg (job 1521〜1567 秒、うち vitest step 1429〜1465 秒) である。Linux leg は
576〜964 秒で、aggregate は両 leg の最大値になる。Windows の vitest は Duration 1328 秒、テスト時間合計 3589 秒で
並列度は約 2.7 (逆算)。上位 25 ファイルが全ファイル時間の約 87% を占める。実測の出所は main 成功 3 run
(38694546173 / 38692344625 / 38690207164) の job log である。

### 決定 1: matrix 1 job (job id `harness-check-windows` を維持)

`harness-check-windows` を `strategy.matrix.shard: ["1/3", "2/3", "3/3"]` + `fail-fast: false` の 1 job にする。
明示 3 job (`harness-check-windows-1..3`) は採らない。

| 観点 | matrix 1 job (採用) | 明示 3 job (不採用) |
| --- | --- | --- |
| required check 名 | required context は `harness-check` 1 件のみ (branch protection 実測: `contexts=["harness-check"]`)。`harness-check-windows (1/3)` 等の表示名は required に入らず、保護設定の変更が不要 | 同左。ただし job が 3 個に増える |
| aggregate | `needs.harness-check-windows.result` が matrix 全 instance の集約 (1 つでも failure / cancelled なら success にならない) で、`REQUIRED_AGGREGATE_COMMAND` と `needs` 完全一致の既存契約が不変 | `RUNTIME_LEGS` が 6 要素になり、aggregate の `needs` と result 式の全てを書き換える |
| policy | step manifest は 1 組のまま。`strategy` の照合だけを追加する | step manifest を 3 job 分に複製するため drift 源が増える |
| shard 集合の欠落 | matrix 定義 (`shard` 配列) をポリシーが exact 照合する (決定 3) | 3 job の存在を `needs` で照合する |

### 決定 2: policy 契約の変更範囲

- Windows leg の許可キーを `runs-on` / `steps` から `runs-on` / `strategy` / `steps` へ広げる。他の job
  (Linux、node-generation 系) は従来のキー集合のまま (`strategy` を持たせたら violation)。
- `strategy` は `{ "fail-fast": false, matrix: { shard: ["1/3", "2/3", "3/3"] } }` と exact に一致する。
  shard 数・順序・`fail-fast: true`・`include` / `exclude` の追加・動的 matrix (`fromJSON`) は violation。
- step manifest の差分は test step 1 つだけで、`npm run test:windows -- --shard=${{ matrix.shard }}` になる。
  それ以外の step (typecheck / db rebuild / toolchain doctor / classify) は全 shard で同一に実行する。
  重複実行は runner 時間を増やすが wall time は増やさず、特定 shard にだけ検査を置くことで
  「その shard が skip された run が通る」穴を作らない。
- job レベルの `if`、matrix の一部 shard だけを skip する条件、`continue-on-error` は引き続き禁止する。
- 実装 PR は Issue #898 の Green (`src/lint/github-ci-policy.ts` を変更する) が main に入った後に出す。

### 決定 3: aggregate が 3 shard を検証する方法

aggregate の `needs.harness-check-windows.result == success` を一次ゲートとして維持する。matrix 全 instance が
成功した場合だけ success になるため、1 つでも failure / cancelled / skipped があれば既存の
`test ... = "success"` が Red になる。二次の束縛として、各 shard は終了時に次の evidence を
artifact `windows-shard-<index>-attempt-<run_attempt>` として upload する。

- `run_id`、`run_attempt`、`head_sha`、`shard` (例: `2/3`)、vitest が実行したテストファイル数と結果。

aggregate は lane 判定に束縛して検証する。lane は `.github/workflows/harness-check.yml` の
`classify changed files` step の出力 `steps.classify.outputs.lane` (`full` / `doc`、実装は
`src/github/change-lane.ts`、判定不能・新種 path は必ず `full`) であり、Windows の
`test:windows` step は `lane == 'full'` のときだけ走る。doc lane では `source-doc-lane` doctor だけが走り、
vitest evidence は生成されない。したがって evidence の要否を無条件にせず、lane で分ける。

- **full lane**: 全 3 shard の evidence を必須とする。要求は次の全てである。
  1. shard 集合がちょうど `{1/3, 2/3, 3/3}` で、重複・欠落・余剰がない。
  2. 全 evidence の `run_id` と `run_attempt` が aggregate 自身と一致し、`head_sha` が checkout した HEAD と一致する。
  3. 全 shard の結果が成功で、**各 shard の実行ファイル数がそれぞれ正の整数**である (合計が正でも
     `[10,0,10]` のように 1 つでも 0 の shard があれば拒否する。空振りした shard の成功を通さない)。
- **doc lane**: vitest evidence は期待しない (3 shard 全て無くてよい)。ただし lane 判定そのものを
  同じ run / attempt / HEAD に束縛した `lane` evidence (各 leg の classify 出力) で検証する。
  aggregate が checkout した HEAD の変更ファイルから `src/github/change-lane.ts` の判定で自前に lane を再計算し、
  claimed lane と食い違う場合は拒否する。特に「evidence が無い + claimed `doc` + 再計算が `full`」は
  full lane を doc lane に偽装した run として Red にする。doc lane で 3 shard evidence が存在する矛盾も拒否する。

「失敗した job だけ再実行」で新 attempt が始まると、前 attempt で成功した shard は今 attempt の artifact を
持たない。この場合 aggregate は `attempt_binding_mismatch` で Red になり、全 job 再実行を要求する
(既存運用: rerun は常に全 job)。artifact 名に attempt を含めるのは、upload-artifact v4 の同名衝突を避けつつ、
別 attempt の evidence を今 attempt の証拠として拾わないためである。

### 決定 4: shard 失敗の報告

- `fail-fast: false` で、1 つの shard の失敗が他 shard を打ち切らない。全 shard の失敗ファイルを 1 回の run で
  集められるため、再実行の往復が減る。
- 各 shard は `harness-check-windows (i/3)` として個別に Red / Green になる。aggregate の失敗メッセージは
  どの shard が欠落または不成功かを列挙する。
- job summary (`github summary`) は shard ごとの所要時間と失敗ファイルを出す。

### 決定 5: shard の分割単位と等価性

- 分割は vitest 組み込みの `--shard=i/3` を使う。ファイルを手で割り当てる方式は、テスト追加のたびに
  割当表を保守する必要があり、drift 源になるため採らない。
- `W` (既存の `test:windows` の選択集合、PLAN-L7-526) の 3 shard の和は `W` に一致し、shard 同士は
  互いに素である。これは `vitest list --shard=i/3` の結果で機械的に確かめる。
- snapshot runner (`scripts/run-vitest-snapshot.ts`) は shard ごとに別 runner 上で 1 回ずつ起動する。
  sealed execution snapshot、foreign-write fence、reference fingerprint、test-repository-isolation と
  global-setup の fence は shard ごとに従来どおり成立する (runner を共有しない)。`--shard` は runner の
  引数として vitest へ透過される必要があり、透過されず全件実行になる退行は Red にする。
- shard の偏りは vitest の既定 sequencer 次第である。最大ファイル (`memory-legacy-archive` 約 489 秒) は
  Issue #1063 項目 1 で縮める前提とし、本契約は偏りの補正 (手動分割) を含めない。

### 決定 6: Linux は shard しない

Linux leg は 576〜964 秒で、Windows を shard した後の次の律速になるが、現時点ではクリティカルパス外である。
Linux には `doctor` と DB 系テストがあり、shard すると doctor singleton や projection の前提 (PLAN-L7-442)
との相互作用を新たに検証する必要があるため、Windows の効果を実測してから別 Issue で判断する。

### 固定費と期待時間

shard ごとに固定費がかかる (snapshot 作成 約 23 秒、`npm ci` 約 28 秒、db rebuild 約 36 秒、seal / fingerprint /
cleanup 約 21 秒で合計約 110 秒。typecheck 約 14 秒と workflow 側 db rebuild 約 36 秒も shard ごと)。

| 項目 | 現状 | 3 shard 後の見積り |
| --- | --- | --- |
| vitest 本体 | 約 1330 秒 | 約 1330 / 3 ≒ 443 秒 (偏り 1.3 倍想定で最大約 575 秒) |
| 固定費 + typecheck | 約 160 秒 | 約 160 秒 (並列のため増えない) |
| job wall time | 約 1521〜1567 秒 | 約 600〜750 秒 (10〜12.5 分) |

見積りは Issue #1063 の実測からの逆算であり、実装 PR の exact HEAD の run で測り直して置き換える
(未計測値を達成値として書かない)。runner 時間 (課金) は約 3 倍の固定費を払うため、wall time と引き換えに増える。

### 採らない案

| 案 | 不採用の理由 |
| --- | --- |
| 重い e2e を non-required の別 job に逃がす | required gate `harness-check` が弱まる。回帰を merge 後にしか検出できない |
| path filter で e2e を絞る | 変更ファイルの推定誤りが無検査の穴になる。doc lane の fail-close 方針 (PLAN-L7-455) に反する |
| `isolate:false` / `--pool=threads` | 支配要因は子プロセス spawn で効果が小さく、global state の汚染と fence の前提崩れのリスクが大きい |
| テスト手動分割 (明示ファイル割当) | 追加・改名のたびに割当表が drift する。組み込み `--shard` で足りる |
| larger runner (8 vCPU) | コード変更なしで約 8 分短縮できるが有料。別判断 (PO) の対象であり、shard と併用も可能 |

### 実装 PR の順序

`design-protection-diff-gate.md` §10.2 / §10.3 に従い、実装 PR (src/ か scripts/ を含む PR) は設計文書と
test-design に触れない。

1. **契約 (本 PR)**: 設計と candidate oracle を凍結する (docs のみ)。
2. **登録 + Red**: `it.fails` のテストを候補 ID (`CANDIDATE-U-CISHARD-*`) で引用して入れる。テストは実 workflow と
   `RUNTIME_STEP_MANIFESTS` を読むため、`test-repository-isolation` の `repositoryReadContracts` 登録行だけを同じ PR に足す
   (§10.3 の 1。src/ は登録行に限る)。
3. **昇格 (src/ を含まない)**: `CANDIDATE-U-CISHARD-*` を正式 ID へ昇格し、テスト名の引用を書き換える。
4. **実装 Green**: policy + workflow + aggregate step で `it.fails` を `it` に戻す。Issue #898 の Green
   (`src/lint/github-ci-policy.ts` を変更する) が main に入った後に出す。

Issue #1063 項目 1 (`memory-legacy-archive` の git 呼び出しバッチ化) は独立で、shard の偏りを減らすため先が望ましい。

## PLAN 退役に伴う typed spec 宣言の移設 (#1295)

```yaml
spec:
  defines:
    - id: VMS-007
      kind: typed-spec-phase-layer-alignment
      traces_from: [VMS-004]
      tests: [TVMS-007]
```

VMS-007 は typed spec 台帳の `v_phase` と宣言元 artifact の owner phase を一致させる設計である。
修正版 ZIP 107 の V-model level 定義と各 doc の agent 契約を HARNESS の L0-L14 / frontmatter 正本へ翻訳する前段として、
検出系が層を推測で作らないことを保証する。

```yaml
spec:
  defines:
    - id: VMS-008
      kind: agent-contract-authoring-source
      traces_from: [VMS-004]
      traces_to: [VMS-009, VMS-010]
      tests: [TVMS-008]
```

VMS-008 は ZIP の doc-local agent 契約を HARNESS の authoring source として保持する設計である。

```yaml
spec:
  defines:
    - id: VMS-010
      kind: forward-freeze-contract-design
      traces_from: [VMS-008]
      traces_to: [VMS-011, VMS-012]
      tests: [TVMS-010]
```

VMS-010 は ZIP 107 の L2 prototype agreement と L5 verification design を HARNESS の Forward freeze contract として定義する設計である。

```yaml
spec:
  defines:
    - id: VMS-014
      kind: execution-assignment-ledger
      traces_from: [VMS-004]
      tests: [TVMS-014]
```

VMS-014 は ID 単位実行割当台帳の L6 設計契約である。typed spec authoring source を上流に持ち、
対応 oracle は TVMS-014 である。

```yaml
spec:
  defines:
    - id: VMS-015
      kind: schedule-live-session-digest
      traces_from: [VMS-004]
      tests: [TVMS-015]
```

VMS-015 は工程 live state と固定4段 SessionStart digest の L6 設計契約である。
