---
layer: L5
executed_at_layer: L8
artifact_type: test_design
status: confirmed
pair_artifact: docs/design/harness/L5-detailed-design/
parent_doc: docs/plans/PLAN-L5-00-master.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_l5_physical_data: docs/design/harness/L5-detailed-design/physical-data.md
related_l5_module: docs/design/harness/L5-detailed-design/module-decomposition.md
related_l5_internal: docs/design/harness/L5-detailed-design/internal-processing.md
related_l5_if_detail: docs/design/harness/L5-detailed-design/if-detail.md
next_pair_freeze: L5
v2_import: docs/migration/v2-import-ledger.md
created: 2026-05-29
updated: 2026-06-09
---

# UT-TDD Agent Harness — L8 結合テスト設計 (④ / IT-*)

> **layer (作成層 = V-pair key)**: L5 (詳細設計) / **executed_at_layer (実施層)**: L8 (結合テスト) / **artifact**: ④ テスト設計 (V-model 右、② L5 詳細設計 全 sub-doc と対)
> **pair (V-model L5↔L8)**: `docs/design/harness/L5-detailed-design/{physical-data,module-decomposition,internal-processing,if-detail}.md` 4 sub-doc 全体 ↔ 本書 1 doc
> **status**: confirmed (L5↔L8 pair freeze。§5 が全 IT-* に GWT 粒度の confirmed IT case 設計を提供)
> **granularity correction (2026-06-08)**: resolved。各 IT-* は §5 で Given/When/Then、fixture、module boundary setup、mock/adapter 条件、期待 assertion、negative/edge coverage を備える。§1/§2 は §5 が upgrade する candidate skeleton として残す。
> **encoding fix (2026-06-09)**: G5 freeze commit (14792e3) で本書本文 (§0-§4 / Appendix A) が UTF-8→CP932 誤読により文字化けしていたため、直前の clean 版 (7d6449c) から日本語本文を復元。§5 / Appendix B は英語で無傷のため現行を保持。
> **PLAN**: `docs/plans/PLAN-L5-{01..04}-*.md` の pair_artifact / DoD で本書参照

## §0 量閉じ原則 (L5 ↔ L8)

L5 詳細設計の各契約 (DbC) が L8 結合テスト (IT-*) で被覆されること (孤児 = 0)。

- **internal-processing**: 各操作の DbC pre/post/invariant (§3/§4/§5) + edge docstring (§7) → 契約遵守 IT 必須
- **if-detail**: adapter 詳細契約 (§1-§5) + エラー分類→fail-close (§4) → 境界統合 IT 必須
- **module-decomposition**: module 間の公開 IF 呼び出し (依存方向) → module 結合 IT 必須
- **physical-data**: state file ↔ zod の読込/書込整合 (§5) → 永続化結合 IT 必須
- 孤児 = 0 (L7 で `ut-tdd vmodel lint` の edge 5-8 照合に接続)

## §1 結合テスト (IT-*) — candidate skeleton

> L8 = module 間 / 内外境界の **結合**を対象 (L9 system test より下位、L12 受入 AT より実装寄り)。個別 IT ケースは §5 (Confirmed IT Case Design) で GWT 粒度に展開済み。本節は §5 が upgrade する前段の candidate mapping として残す。

### §1.1 IT-CONTRACT (internal-processing DbC 由来)
| IT-ID (候補) | 検証対象 | シナリオ |
|---|---|---|
| IT-CONTRACT-01 | `plan draft` の pre/post (§3/§4) | precondition 違反入力 → fail-close / 正常入力 → file+registry postcondition 成立 |
| IT-CONTRACT-02 | `gate` の post + invariant (§4/§5) | gate pass → phase.yaml + gate_runs 証跡 / V-model 順序 invariant |
| IT-CONTRACT-03 | edge docstring (§7、edge 5-8) ↔ 実装関数 | @edge-normal/error/boundary/throws が AT と双方向 trace |

### §1.2 IT-ADAPTER (if-detail D-CONTRACT 由来)
| IT-ID (候補) | 検証対象 | シナリオ |
|---|---|---|
| IT-ADAPTER-01 | adapter intent → 結果型 (§1/§2) | invokeWorker intent → InvokeResult (mock provider) |
| IT-ADAPTER-02 | エラー分類 → fail-close (§4) | absent→degradation / auth→fail-close / timeout→skip |
| IT-ADAPTER-03 | D-CONTRACT DSL (§5) | mode-routing.yaml / gate-checks.yaml の zod 読込 validate |

### §1.3 IT-MODULE (module-decomposition 由来)
| IT-ID (候補) | 検証対象 | シナリオ |
|---|---|---|
| IT-MODULE-01 | 依存方向 (schema 一方向・循環禁止) | module 間 import グラフに循環なし |
| IT-MODULE-02 | lint 共通様式 (loadX→analyzeX) | loadX (fs) + analyzeX (pure) の結合動作 |

### §1.4 IT-STATE (physical-data 由来)
| IT-ID (候補) | 検証対象 | シナリオ |
|---|---|---|
| IT-STATE-01 | state file ↔ zod 読込/書込 (§5) | 書込→読込で zod parse 成立 / 不正 state → fail-close |
| IT-STATE-02 | drive 別区画 (§6) | 区画隔離 + 跨ぎ汚染検出 |

### §1.5 IT-ASSET (内部資産 roster 由来、PLAN-L5-05 / PLAN-DISCOVERY-02 Discovery confirmed)
| IT-ID (候補) | 検証対象 | シナリオ |
|---|---|---|
| IT-ASSET-01 | `roster list` scan→registry (module-decomp §1/§5) | `.claude/agents/*.md` 全件が registry (id=filename stem) に入る (PLAN-DISCOVERY-02 spike = 19 件実証) / capability class ⊥ model family に決定論解決 |
| IT-ASSET-02 | `roster check` ↔ guard allowlist 整合 (internal-proc §4 post) | allowlist 突合 = missingFromRoster=0 ∧ nameMismatches=0 で ok/exit 0 / 乖離 (allowlist にあり .md 無し、filename↔name 不一致) 注入 → **fail-close**/exit 1。nonAllowlisted (be-* / db-schema / devops-deploy) は乖離でなく既知集合 |
| IT-ASSET-03 | `runtime(guard) → roster` 依存方向 (module-decomp §4) | Implemented L7 evidence: `src/runtime/agent-slots.ts#resolveRosterCapability` resolves roster capability without importing `runtime/agent-guard`; integration check remains dependency-lint/module-boundary scope. |

## §2 量閉じ一覧 (L5 契約 → IT 被覆、孤児チェック)

- internal-processing §3/§4/§5/§7 DbC → IT-CONTRACT-01〜03 + roster D-API (`roster list/check`) → IT-ASSET-01〜02 (`ut-tdd asset` FR-L1-48 は L6 carry `waiting_layer:L6` で IT 被覆も L6 後追い、孤児でなく carry 明示)
- if-detail §1-§5 → IT-ADAPTER-01〜03
- module-decomposition §4 依存方向 / §6 lint 様式 → IT-MODULE-01〜02 + roster module (§1/§5) → IT-ASSET-01/03
- physical-data §5/§6 → IT-STATE-01〜02
- **孤児 (契約で IT 候補未対応) = 0** を §5 confirmed case 設計で機械確認の対象とする。本節の candidate mapping は §5 で GWT 粒度に展開済み。

## §3 trace (④ → ②)

本書の各 IT-* は `docs/design/harness/L5-detailed-design/` の 4 sub-doc の契約と相互 reference。**G5 (詳細設計ゲート = DbC freeze 点)** で 4 sub-doc 全体 ⇔ 本書 1 doc の pair 宣言を確定し、双方向 trace freeze は G7 で実施 (L3↔L12 / L4↔L9 と同型)。

## §4 carry / 次工程

- **L7 実装**: 全 IT-* を vitest 結合テストに変換 (TDD 強制 FR-02、Red 先行)。DbC docstring (internal-processing §7) の @edge-* ↔ AT 照合
- **G7 trace freeze**: 4 artifact 双方向 12 edge 凍結時に本書 IT ↔ L5 契約の trace 確定
- **外部ツーリング IT の明示 carry (A-128 F-2 / IMP-128、2026-06-10)**: **IT-RELGRAPH-01..04 / IT-DOCEXPORT-01..03 (計 7 件) は現時点で対応する実結合テスト未着手の正規 defer** であり、**PLAN-L7-32 (relation graph) / PLAN-L7-35 (doc export) の TDD Red entry 待ち** (A-127 implementation-pending boundary と同一)。L7 の U-RELGRAPH / U-DOCEXPORT carry (L7-unit-test-design §4) と対で管理する。本宣言により「明示 defer なき未実装」(under-design) には該当しない。

## Appendix A: L5 back-fill IT coverage candidate map (PLAN-L5-06 / PLAN-L5-07)

### A.1 IT-ASSET additions for skill and drift

| IT-ID | Source contract | Scenario |
|---|---|---|
| IT-ASSET-04 | skill catalog integration (module-decomposition Appendix A.1 / internal-processing Appendix A.1) | `docs/skills/**/*.md` scan produces an in-memory catalog; missing optional roots are reported as empty-with-evidence; no `.ut-tdd` persistent state is created. |
| IT-ASSET-05 | skill recommender/injector integration (PLAN-L5-06) | catalog + task/layer/drive context produces deterministic recommendations and layer-scoped injection sets; scoring and injector signatures remain L6 carry (`waiting_layer:L6`). |
| IT-ASSET-06 | `asset-drift` rule integration (module-decomposition Appendix A.2 / internal-processing Appendix A.2) | rule registry contains `asset-drift`; enrolled agent/skill docs are checked; unresolved drift surfaces through doctor/gate as non-green validation. |
| IT-ASSET-07 | placeholder dependency gap integration (physical-data §7 + PLAN-L5-07) | unresolved placeholder dependencies stay visible until their waiting layer; reaching the layer without materialization fails validation instead of silently passing. |

### A.2 Coverage mapping statement

- PLAN-L5-06 skill contracts -> IT-ASSET-04 and IT-ASSET-05.
- PLAN-L5-07 asset-drift contracts -> IT-ASSET-06 and IT-ASSET-07.
- Existing roster contracts remain covered by IT-ASSET-01 through IT-ASSET-03.

## §5 Confirmed IT Case Design (G5 Freeze)

This section upgrades the previous candidate skeleton to confirmed integration-test design granularity. Every IT-* row has Given/When/Then, fixture, module boundary setup, assertion, and negative/edge coverage. L6/L7 carry items remain implementation-detail carry only; the integration boundary and expected behavior are frozen here.

DDD/TDD strictness automation (`src/lint/ddd-tdd-rules.ts` / `integration-gwt`) machine-checks this section: any `IT-*` row without explicit Given / When / Then is not confirmable for freeze evidence. This quantitative check runs before qualitative review, and gate-significant integration evidence requires both.

| IT-ID | Given | When | Then | Fixture / Boundary | Assertions | Negative / Edge |
|---|---|---|---|---|---|---|
| IT-CONTRACT-01 | A valid and invalid `plan draft` request, a temp `docs/plans` workspace, and an empty plan registry. | The plan draft flow validates frontmatter, writes a PLAN, and updates registry evidence. | Valid input creates a PLAN and registry entry; invalid input fails before write. | CLI -> plan module -> schema -> fs boundary; temp fs fixture. | Exit 0 with file+registry postcondition, or exit 1 with no partial write. | Missing `plan_id`, invalid layer, duplicate ID, readonly target. |
| IT-CONTRACT-02 | A gate request with prior phase state and gate-design ledger fixture. | The gate flow records pass/fail evidence and updates phase state. | Gate pass creates gate_runs evidence and preserves V-model order invariant. | gate module -> phase state -> audit ledger boundary. | Gate status, audit record, and phase transition agree. | Gate skipped out of order, missing evidence, stale park state. |
| IT-CONTRACT-03 | Functions or docs carrying edge annotations and mapped AT references. | Edge docstring scan is compared with L5 DbC and AT trace. | Each edge 5-8 class maps to an AT or explicit carry. | code/doc parser -> trace map boundary. | No orphan `@edge-*`, no AT without source contract. | Unknown edge tag, conflicting normal/error classification. |
| IT-ADAPTER-01 | A mock provider adapter and provider-independent worker intent. | The adapter invokes worker/reviewer intent and normalizes the result. | Result is returned as provider-independent `InvokeResult`. | core -> adapter -> mock provider boundary. | Intent fields preserved; result/error union is valid. | Provider returns malformed payload or missing output. |
| IT-ADAPTER-02 | Adapter error fixtures for absent provider, auth failure, rate limit, and timeout. | The adapter maps each error to fail-close/degradation/skip policy. | Auth fails closed; absent provider degrades only where allowed; timeout is bounded. | adapter -> policy mapper -> CLI exit boundary. | Error class, exit code, and next_action match D-CONTRACT. | Retry exhaustion, mixed partial success, unknown provider error. |
| IT-ADAPTER-03 | `mode-routing.yaml` and `gate-checks.yaml` fixtures. | D-CONTRACT DSL is loaded and validated. | Valid DSL parses; invalid routing/gate definitions fail before execution. | config loader -> zod schema -> workflow boundary. | Schema parse success/failure is deterministic. | Unknown mode, missing gate, circular routing. |
| IT-MODULE-01 | A module import graph containing expected schema-first dependency direction. | Import graph check walks public and internal module imports. | No cycle exists and schema remains one-way dependency root. | src module graph -> dependency analyzer boundary. | Cycle count 0; forbidden reverse import count 0. | Injected cycle, helper importing CLI, lint importing doctor. |
| IT-MODULE-02 | A lint module fixture with `loadX` and pure `analyzeX`. | Loader reads fixtures and analyzer is run with provided docs. | I/O stays in loader, analyzer is deterministic and side-effect free. | fs loader -> pure analyzer -> message boundary. | Same input yields same result; messages match violation set. | Analyzer reading fs, loader hiding parse failure, unstable message order. |
| IT-STATE-01 | Valid and invalid `.ut-tdd` state files plus schema fixtures. | State is written, read back, and parsed through zod. | Valid state round-trips; invalid state fails closed before use. | state fs -> zod schema -> doctor boundary. | Parse result matches schema and preserves IDs. | Missing required field, unknown enum, corrupt JSON/YAML. |
| IT-STATE-02 | Two drive partitions with overlapping artifact IDs. | Drive-scoped state is read and cross-drive contamination is checked. | Each drive remains isolated unless an explicit trace edge allows linkage. | `.ut-tdd/drive/<drive>` -> state loader boundary. | No cross-drive read without declared edge. | Same ID in two drives, missing drive, invalid skip_sub_doc. |
| IT-ASSET-01 | `.claude/agents/*.md` fixture set and roster registry fixture. | `roster list` scans markdown and builds the registry. | Every file becomes one deterministic registry row. | markdown source -> roster module -> registry boundary. | ID equals filename stem; capability class is independent of model family. | Duplicate filename stem, missing name, unsupported metadata. |
| IT-ASSET-02 | Roster registry and guard allowlist fixtures. | `roster check` compares registry names and allowlist entries. | Matching sets pass; missing roster or name mismatch fails closed. | roster module -> guard allowlist boundary. | `missingFromRoster=0` and `nameMismatches=0` for pass. | Non-allowlisted known agents stay informational, not failure. |
| IT-ASSET-03 | Import graph fixture for runtime, guard, and roster modules. | Dependency-direction check verifies `runtime -> roster` only. | Roster never imports runtime/guard; L7 resolver is implemented in `src/runtime/agent-slots.ts`. | runtime/guard/roster import boundary. | Cycle count 0; reverse dependency count 0. | Hidden transitive import or resolver that fabricates capabilities. |
| IT-ASSET-04 | `docs/skills/**/*.md` fixture and empty optional roots. | Skill catalog scan produces an in-memory catalog. | Present skills are cataloged; missing optional roots return empty-with-evidence. | docs/skills -> skills catalog boundary. | No persistent `.ut-tdd` state is created. | Malformed skill metadata, duplicate skill ID, missing root evidence. |
| IT-ASSET-05 | Skill catalog plus task/layer/drive context. | Recommender/injector computes recommendations and layer-scoped injection set. | Recommendations are deterministic and injection set is scoped to the requested layer. | catalog -> recommender -> injector boundary. | Same input produces same ordered set; unsupported layer fails closed. | Tie score, unknown drive, missing required skill. |
| IT-ASSET-06 | Rule registry containing `asset-drift` and enrolled doc fixtures. | Asset-drift rule runs against agent/skill docs. | Drift is surfaced through doctor/gate as non-green validation. | rule registry -> doc scan -> doctor/gate boundary. | Rule registration exists; violation count maps to non-green output. | legacy absolute path, legacy runtime command, empty docs/skills. |
| IT-ASSET-07 | Placeholder dependency records with `waiting_layer` and current layer. | Placeholder check compares unresolved dependency against current layer. | Before waiting layer it remains visible carry; at/after waiting layer unresolved state fails. | physical-data placeholder registry -> vmodel/doctor boundary. | Carry is explicit and becomes failure at threshold. | Missing waiting layer, stale placeholder after materialization, orphan edge. |
## Appendix B: DB Reference-Feedback IT Additions (PLAN-L5-08)

| IT-ID | Given | When | Then | Fixture / Boundary | Assertions | Negative / Edge |
|---|---|---|---|---|---|---|
| IT-DB-01 | Valid PLAN/artifact/gate/finding fixtures and empty `.ut-tdd/harness.db`. | Projection writer records normalized events into SQLite. | Rows exist in plan/artifact/gate/finding projections and can be joined by `plan_id`. | docs/state loaders -> projection-writer -> SQLite boundary. | No orphan projection rows; duplicate replay is idempotent. | Missing `plan_id` and `session_id`, corrupt DB, duplicate key replay. |
| IT-DB-02 | Drive/model/session fixtures across Forward, Add-feature, Reverse, and Recovery modes. | `drive_runs`, `hook_events`, and `model_runs` are projected and joined. | Each run has drive/mode/layer/kind and joins to PLAN/session evidence. | runtime/session log -> state-db boundary. | Cross-drive contamination count is 0; unresolved join becomes finding. | Unknown drive, mode-kind mismatch, dangling session. |
| IT-DB-03 | Skill recommendation rows and skill invocation rows for the same PLAN/session. | Skill metrics are computed by layer/drive/plan. | Firing and acceptance rates are materialized as quality signals. | skill recommender/invocation log -> feedback-engine boundary. | Denominator is recommendations; numerator is actual fired invocations. | Recommendation without invocation, invocation without recommendation, zero denominator. |
| IT-SEARCH-01 | Search index built from PLAN/artifact/finding/skill/model/session fixtures. | `ut-tdd find` queries exact IDs and fuzzy terms. | Ranked references include subject type, ID, path, reason, and evidence path. | search-index -> SQLite -> CLI boundary. | Exact ID wins; stale index is detectable and rebuildable. | Deleted source doc, ambiguous query, redacted content query. |
| IT-FEEDBACK-01 | Open findings and quality signals with repeated stale approval, orphan trace, and schedule lint patterns. | Feedback engine groups signals and emits feedback events. | Repeated gaps become visible feedback events with next_action references. | findings/quality_signals -> feedback-engine boundary. | Event references source findings; auto event does not approve or edit PLAN. | Conflicting severity, closed finding, missing evidence path. |
| IT-AUTOMATION-01 | Workflow/gate/doctor/CI projection fixtures for ready, blocked, and human-required plans. | Automation readiness is evaluated. | Each workflow row is classified and includes blocking evidence where not ready. | workflow_runs/gate_runs/findings -> automation-readiness boundary. | Missing evidence cannot produce ready; blocked rows reference open findings. | Stale gate pass, skipped doctor check, human-required without signoff. |
| IT-GUARDRAIL-01 | Agent-guard, review_evidence, same-model, tests-before-review, and escalation fixtures. | Guardrail decisions are normalized into `guardrail_decisions`. | Allowed/blocked/human-required decisions are queryable by plan/session. | guardrail policy/evidence -> guardrail-ledger -> SQLite boundary. | Same-model cross-agent approval and missing human signoff become block decisions. | Naive self-review, PII scope, missing evidence path. |
| IT-ASSET-DB-01 | Skill/roster/command markdown fixtures with valid, empty, and legacy-runtime drift cases. | Automation assets are cataloged and indexed. | Valid assets appear in catalog/search; drift and empty catalog become findings. | docs/.claude sources -> asset-catalog -> search-index boundary. | Prompt bodies are not copied; trigger/capability metadata is searchable. | Duplicate asset ID, legacy runtime command, malformed metadata. |
| IT-RELGRAPH-01 | Source/design/test/PLAN/audit fixtures plus an empty graph projection DB. | Relation graph projection is rebuilt from repository artifacts. | Nodes and edges exist for requirements, PLANs, design docs, test-design docs, source files, tests, DB tables, verification profiles, diagrams, and findings. | repository artifact loaders -> relation graph projection -> SQLite/search boundary. | No orphan graph rows; duplicate rebuild is idempotent; graph rows remain rebuildable projections. | Missing artifact path, duplicate node ID, stale source doc, unsupported artifact kind. |
| IT-RELGRAPH-02 | A changed `src/**` file fixture and graph edges to paired test/design/PLAN/reverse nodes. | Impact analysis expands the changed node through the graph. | Required actions include sibling test, L6 design contract, L7 oracle, PLAN DoD, and reverse/backprop guard where applicable. | changed-files loader -> relation impact analyzer -> finding/workflow boundary. | Missing paired artifact becomes a finding; docs-only changes do not require source tests unless a behavioral edge exists. | Untracked file, rename, deleted source, missing graph projection. |
| IT-RELGRAPH-03 | Physical-data DB projection fixtures and verification-profile evidence records. | Evidence projection collector normalizes verification records and links them to graph nodes. | `verification_profiles`, `verification_recommendations`, `mcp_server_runs`, and `external_tool_findings` rows join to graph nodes by evidence path/profile ID. | `.ut-tdd/evidence` -> verification evidence projection -> relation graph / SQLite boundary. | Raw MCP/browser/provider payloads are excluded; redacted summaries and counts are queryable. | Malformed evidence schema, secret-like field, external run without opt-in, missing evidence path. |
| IT-RELGRAPH-04 | A relation graph snapshot and Mermaid/DOT/D2 export requests. | Diagram export is generated for review/handover. | Mermaid output is deterministic; optional DOT/D2 adapters require installed tooling and otherwise return findings without implicit installation. | relation graph snapshot -> diagram exporter -> evidence artifact boundary. | Stable node order and edge labels; no mutation of DB/source docs during export. | Adapter missing, stale graph snapshot, raw evidence payload in diagram text. |
| IT-DOCEXPORT-01 | Concept, requirements, detailed design, PLAN, ADR, and test-design fixtures with headings, tables, IDs, and evidence links. | Canonical document export projection is built. | Source paths, section IDs, FR/AC/AT IDs, PLAN IDs, ADR IDs, status fields, and evidence links appear in deterministic dataset rows. | markdown docs -> document parser -> export dataset boundary. | No ID loss; unsupported document family becomes a finding. | Missing source path, malformed table, duplicate section ID, unsupported family. |
| IT-DOCEXPORT-02 | A document export dataset and CSV/Markdown/XLSX/PPTX profile requests. | Export renderer boundary is invoked. | CSV and Markdown render as built-in outputs; XLSX/PPTX/D2 requests require renderer readiness and otherwise return findings. | export dataset -> renderer profile -> artifact metadata boundary. | No implicit package install; redaction runs before renderer. | Missing ExcelJS/SheetJS/PptxGenJS/D2, secret-like field, oversized document. |
| IT-DOCEXPORT-03 | Generated document export artifact metadata and a changed source document digest. | Export artifact freshness is checked. | `document_export_artifacts` rows are marked current or stale based on source snapshot hash. | document export projection -> stale checker -> review/handover boundary. | Stale Office/spreadsheet artifacts cannot be treated as current evidence. | Source digest mismatch, deleted source doc, manually edited export file. |

## Appendix C: Proposal Document Coverage Integration Addendum

Pair = `src/task/classify.ts#classifyProposalDocumentCoverage` and
`docs/design/harness/L3-functional/functional-requirements.md`
FR-L1-39 addendum.

These integration cases verify the boundary where proposal text becomes a
required design/test-design document set. The rule is intentionally additive:
each matched pattern contributes its own documents, evidence, and gates. A later
LLM summary may add rationale, but it must not remove the deterministic
requirements produced here.

| IT-ID | Given | When | Then | Fixture / Boundary | Assertions | Negative / Edge |
|---|---|---|---|---|---|---|
| IT-DOCCOV-01 | Proposal text mentioning screen UI, API, DB, batch/report, async job, notification, security/privacy, observability/audit, release, and NFR terms. | `ut-tdd task classify --design-docs --json` is run. | `document_coverage.patterns` contains every matching pack and `granularity` is the highest matched level. | CLI -> task classifier -> JSON serializer boundary. | Required design docs, test docs, evidence, and gates are unioned without duplicates. | Overlapping keywords, repeated words, mixed English/Japanese terms. |
| IT-DOCCOV-02 | Proposal text that says the work is minor/simple and asks to skip design. | Document coverage classification is evaluated. | Shrinkage wording becomes a finding only; required documents are not removed and granularity is not lowered. | proposal parser -> guardrail evaluator boundary. | `llm-shrinkage-ignored` is emitted and required-doc count stays additive. | "not needed", "skip", Japanese minor/omit terms, low drive confidence. |
| IT-DOCCOV-03 | Discovery/research proposal text plus candidate external templates. | Research adoption mapping is produced. | Adoptable templates are split into `incorporate`, `reference`, `exclude`, or `ut-tdd-specific`. | research mapping -> coverage output boundary. | Marketing/vendor templates are rejected; UT-TDD workflow/agent templates stay UT-TDD-specific. | Vendor-specific formats, generic marketing templates, untestable checklist prose. |
| IT-DOCCOV-04 | A proposal classified with security/privacy, migration, or other escalation-sensitive terms. | Coverage classification combines `classifyTask` findings with document packs. | Granularity reaches at least G4 and human/risk evidence is required. | task risk classifier -> document coverage boundary. | `nfr`, `technical-requirements`, `system-test-design`, and approval evidence are present. | Low confidence drive, multiple risk terms, missing affected files. |

## §6 G8-WORKFLOW: integration verification workflow

This section defines the executable workflow granularity for closing L8/G8. It
keeps the confirmed IT-* case design above, but adds the missing layer that turns
case rows into a repeatable verification process. The model follows the common
test strategy -> test plan -> test condition / coverage item -> test procedure
-> evidence -> exit gate chain, mapped to UT-TDD artifacts.

| Workflow key | G8 contract |
|---|---|
| `test_strategy` | Risk-based integration verification for L5 contracts. Prioritize changed module, state, adapter, asset, DB, search, feedback, automation, guardrail, relation graph, document export, and proposal coverage boundaries. |
| `test_plan` | For each L8 slice, select the impacted IT-* rows, declare mandatory / optional / deferred status, and bind each selected row to test files, doctor checks, or verification profiles before execution. |
| `test_conditions` | Every selected IT-* row must retain Given / When / Then, fixture or boundary setup, assertions, and negative / edge coverage. Missing GWT granularity is a design failure, not an execution skip. |
| `coverage_items` | Coverage is measured by selected IT-* IDs, source boundary, paired L5 contract, executable evidence path, and explicit defer reason where applicable. |
| `test_procedures` | Procedures are concrete commands such as targeted `vitest`, `bun run src\cli.ts doctor`, DB rebuild/projection checks, or verification-profile commands. Procedures must be runnable without external production mutation unless the slice is explicitly gated. |
| `execution_evidence` | The integration evidence manifest records command, exit code, IT-* IDs, evidence path, selected/deferred counts, and failure routing. Green unit tests alone do not close G8 unless the manifest maps them to IT-* coverage. |
| `exit_criteria` | G8 passes only when all mandatory selected IT-* rows have passing evidence, all defers are explicit and not past their waiting layer, no blocking doctor lint remains, and review evidence is recorded for gate-significant changes. |
| `defect_routing` | Failure routes to L8 correction when the test/evidence is wrong, Reverse when L5/L6 contract is wrong, Refactor when integration structure is weak, Recovery when a regression is found, and Incident for production-impacting failures. |

Minimum G8 close profile for the first L8 ascent:

| Profile item | Mandatory evidence |
|---|---|
| Strategy and plan | This `G8-WORKFLOW` section plus the concrete child PLAN scope. |
| Selection | At least one coherent boundary family such as IT-MODULE + IT-STATE, or a justified higher-risk family such as IT-ADAPTER / IT-DB. |
| Procedure | Targeted test command(s) and `doctor` after wiring. |
| Evidence | Integration evidence manifest under `.ut-tdd/evidence/g8-integration/*.json`, or PLAN `review_evidence.green_commands` that names the selected IT-* IDs. |
| Exit | `g8-integration-workflow` doctor check OK and no selected mandatory IT-* failure. |
