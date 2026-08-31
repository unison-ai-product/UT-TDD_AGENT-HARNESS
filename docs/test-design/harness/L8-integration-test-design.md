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
related_l5_ui_detail: docs/design/harness/L5-detailed-design/ui-detail.md
next_pair_freeze: L5
v2_import: docs/migration/v2-import-ledger.md
created: 2026-05-29
updated: 2026-07-30
---

# UT-TDD Agent Harness — L8 結合テスト設計 (④ / IT-*)

> **layer (作成層 = V-pair key)**: L5 (詳細設計) / **executed_at_layer (実施層)**: L8 (結合テスト) / **artifact**: ④ テスト設計 (V-model 右、② L5 詳細設計 全 sub-doc と対)
> **pair (V-model L5↔L8)**: `docs/design/harness/L5-detailed-design/{physical-data,module-decomposition,internal-processing,if-detail}.md` 4 sub-doc 全体 ↔ 本書 1 doc
> **status**: confirmed (D0-R redesignで再openしたL5↔L8 pairは、§5のIT-RGK-PHYS-001..042を含む独立review後に再凍結した)
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
| IT-UI-01 | `ui-detail.md` RouteRegistry and QueryState contracts plus L2 screen IDs. | Screen route and query parsing are integrated in a frontend adapter fixture. | Route ID maps to one adapter, and URL state round-trips without mutating harness state. | router -> query parser -> screen adapter boundary. | Duplicate route IDs fail; query defaults are deterministic. | Unknown screen ID, malformed query, stale route alias. |
| IT-UI-02 | `ui-detail.md` DataProvider, EvidenceLink, and TelemetryBadge contracts. | A screen adapter loads projected DB/doc evidence and renders provenance labels. | Evidence links remain explicit and provenance distinguishes runtime, projection, advisory, stale, and unknown. | data provider -> evidence component -> UI state boundary. | Missing evidence is visible; UI does not create source-of-truth state. | Empty projection, stale evidence, hidden provenance. |
| IT-UI-03 | `ui-detail.md` MarkdownViewer and CopyButton contracts. | Markdown/frontmatter rendering and command-text copy are exercised together. | Markdown is sanitized, source path remains visible, and copy control emits text only. | markdown renderer -> copy control -> browser UI boundary. | No script execution and no command execution from UI. | Embedded script, missing source path, accidental shell execution. |
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

## Appendix D: 駆動モデルルーター内部処理 結合テスト設計 (PLAN-L5-10、2026-07-07)

> 設計ペア: `docs/design/harness/L5-detailed-design/internal-processing.md` Appendix C (駆動モデルルーター
> 内部処理)。関数契約粒度の単体は L7-unit-test-design.md「PLAN-L6-38 Router Function Contracts Addendum」
> (U-ROUTE-R1〜R10、正式 3 桁採番は add-impl 時)。本 Appendix は route eval CLI ↔ lint ↔ doctor ↔ 台帳 audit doc のモジュール間結合を扱う。
> **実行時期**: 本 Appendix の IT-ROUTE は internal-processing.md Appendix C.6 carry の add-impl (routeFiling / 全 mode kind×layer 制約 / two-phase intake の lint 実装) が着地した後に④実行する設計である。現行実装 (`ROUTE_MODE_ALLOWED_KINDS` = add-feature のみ / `READY_DEPENDENCY_STATUSES` = confirmed/completed のみ) では IT-ROUTE-03/04 は未成立が期待値 (design-first の正常形であり、実装前 green を主張しない)。

| IT-ID | Given | When | Then | Fixture / Boundary | Assertions | Negative / Edge |
|---|---|---|---|---|---|---|
| IT-ROUTE-01 | 既知 signal (失敗系 + 能動 + 未知 token の混在 fixture) | `ut-tdd route eval --signal <s> --format json` を実行する。 | filing target 完全形 (mode / allowed_kinds / layer_band / sub_doc_hint / pairing_obligation / forward_insufficient_reason) が JSON で返り、未知 token は `mode=forward` + warn になる。 | route eval CLI -> route-map -> filing target serializer boundary。 | 非 forward 出力は reason を必ず持つ。失敗系競合は Incident > Recovery > Reverse > Refactor。最長一致が維持される。 | 未知 token、複数 token 競合、escalation 境界 signal (approval 昇格)、legacy command 混入 route-map (exit 1)。 |
| IT-ROUTE-02 | 非 forward 決定を返す signal fixture | route eval が非 forward mode を決定する。 | `.ut-tdd/audit/` 配下の append-only 記録に `{signal, mode, forward_insufficient_reason, decided_at}` が残る。 | route eval -> audit appender boundary。 | 記録失敗は decision を変えない (fail-open 記録 + stderr surface)。forward 決定は audit 対象外。 | audit dir 書込不可、重複 signal 連続実行 (append 冪等性)。 |
| IT-ROUTE-03 | L4 §3.1 band 外の (route_mode, kind, layer) を持つ PLAN fixture + draft-debt 台帳 fixture | `ut-tdd plan lint` / `ut-tdd doctor` を実行する。 | band 外 PLAN は `route_mode_kind_layer_mismatch`、設計祖先なし L7 impl は `l7_cold_intake` で fail-close する。台帳 entry は promote_by 有効 + justification 時のみ免除。 | plan frontmatter loader -> lint-policy 台帳 -> doctor aggregation boundary。 | 全 mode に kind/layer 制約が効く (`allowedKinds` 未定義 fall-through が無い)。期限超過 debt は draft でも fail。 | promote_by 欠落 entry、justification 無き新規 allowlist 追加、archived PLAN (対象外)。 |
| IT-ROUTE-04 | add-impl PLAN + 対の Reverse PLAN (双方 draft) fixture | two-phase intake で draft 起票 → 片方を confirmed へ昇格する。 | draft 間は requires_not_ready にならず intake が通り、confirmed 昇格時のみ双方 pairing ready を要求して未 ready は fail-close する。 | plan lint (requires/backfill-pairing) -> status 遷移検証 boundary。 | intake 緩和が draft 間に限定され confirmed 系 gate へ漏れない。既存 READY_DEPENDENCY_STATUSES 規律が confirmed 以降で不変。 | Reverse 参照欠落の add-impl (intake でも fail)、forward_routing 未宣言 Reverse との同時昇格。 |

## Appendix E: 変動点外部化設計 lint 結合テスト設計 (PLAN-L5-12、2026-07-07)

> 設計ペア: `docs/design/harness/L5-detailed-design/internal-processing.md` Appendix C.7 (変動点外部化設計)。
> 本 Appendix は「宣言された変動点 × 外部化設計の存在」を検査する設計時 lint の結合挙動を扱う。
> **実行時期**: C.7 の設計時 lint 実装 (C.6 carry の add-impl) が着地した後に④実行する design-first。
> 実装前 green は主張しない。

| IT-ID | 前提 (Given) | 操作 (When) | 期待結果 (Then) | モジュール境界 | 不変条件 |
|---|---|---|---|---|---|
| IT-EXT-01 | 変動点を宣言し外部化設計 (config schema/registry 参照) を持つ設計 doc fixture | `ut-tdd doctor` を実行する。 | 変動点×外部化設計が揃うため green。 | design-doc loader -> 変動点マーカー parser -> 外部化存在検査 boundary。 | 外部化設計あり = green (誤検知しない)。 |
| IT-EXT-02 | 変動点を宣言したが外部化設計が無い設計 doc fixture | `ut-tdd doctor` を実行する。 | `externalization_design_missing` が**永続エラー**として fail-close (一度きり warn でなく毎回)。 | 同上。 | 宣言変動点に外部化なし = 永続 fail (absence-blindness 根治)。時間経過で消音しない。 |
| IT-EXT-03 | opt-out を宣言した箇所 (十分な反証理由 + TL 承認あり / 形骸理由 / TL 承認なし の 3 fixture) | `ut-tdd doctor` を実行する。 | 4 類型 (a)-(d) への反証 + TL 承認 record を持つ opt-out のみ pass。形骸理由 (実質空 / 4 類型言及なし) と TL 承認なしは fail。opt-out 一覧は常時表示。 | opt-out 台帳 + review record boundary。 | 理由付き opt-out ≠ 無言の欠落。opt-out は判定基準への反証を要し hollow rationalization を弾く。 |
| IT-EXT-05 | registry/config は存在するが参照キー (mode/kind 等) が欠落した fixture (version-up 穴の再現) | `ut-tdd doctor` を実行する。 | 未知キーは Pack 既定へ **fail-close** し、fail-open (制約なしとして通過) しない。 | registry loader -> 既定 fallback boundary。 | 未知キー = fail-close (`if (!allowedKinds) return []` 型 fail-open の回帰ガード)。 |
| IT-EXT-04 | 変動点宣言なしだが実体は registry/config で外部化されている箇所の fixture (過大宣言の逆) | `ut-tdd doctor` を実行する。 | 宣言が無い箇所は検査対象外 (lint は宣言駆動、全 doc を強制外部化しない = 過大外部化を強制しない)。 | 変動点マーカー parser boundary。 | lint は宣言された変動点のみ検査 (speculative generality を lint 自身が強制しない)。 |

## Appendix F: Vモデル spec IR projection 結合テスト設計 (PLAN-L5-13、2026-07-08)

> 設計ペア: `docs/design/harness/L5-detailed-design/physical-data.md` §9.9。
> 本 Appendix は、docs / PLAN / test-design / 工程表 / activation profile から `spec_defs` / `spec_relations` / `schedule_entries` / `activation_entries` / `detector_route_candidates` を rebuildable projection として作る境界を扱う。
> **実行時期**: U3 L7 の schema / projection writer 実装後に④実行する design-first。現時点では実装前 green を主張しない。

| IT-ID | 前提 (Given) | 操作 (When) | 期待結果 (Then) | モジュール境界 | 不変条件 |
|---|---|---|---|---|---|
| IT-SPECIR-01 | design doc / PLAN / test-design heading / 工程表 fixture と空の `.ut-tdd/harness.db` | `ut-tdd db rebuild` を実行する。 | `spec_defs` / `spec_relations` / `schedule_entries` / `activation_entries` が deterministic に作られ、再実行しても row 数と digest が変わらない。 | markdown/frontmatter loader -> spec-ir projector -> SQLite boundary。 | projection は authoring source を変更しない。 |
| IT-SPECIR-02 | `spec_relations` が未定義 `spec_id` を参照する fixture | `ut-tdd doctor` または spec-ir projection check を実行する。 | `spec-ir-orphan-relation` finding が作られ fail-close する。silent skip / auto repair はしない。 | spec-ir relation resolver -> findings projection boundary。 | orphan relation 0 が完了条件。 |
| IT-SPECIR-03 | finding / quality_signal / schedule / activation が同じ subject を指す fixture | detector route candidate projection を実行する。 | `detector_route_candidates` は subject / signal / current_location / evidence を保持するが、FilingTarget の `allowed_kinds` / `layer_band` / `sub_doc_hint` / `pairing_obligation` は L4 function §3.2.1 由来で再導出される。 | findings + schedule + activation -> route candidate -> route eval boundary。 | detector は filing target を創作しない。設計 SSoT 不在なら candidate は non-ready finding になる。 |
| IT-SPECIR-04 | activation profile が out-of-scope/deferred だが理由が無い fixture、または secret-like payload を含む fixture | spec-ir / activation projection を実行する。 | 理由なし除外は `activation-reason-missing` finding、secret-like payload は DB 挿入前に拒否される。 | activation loader -> projection sanitizer -> findings boundary。 | profile 除外は理由必須。raw/secret/PII は spec IR table に保存しない。 |

## Appendix G: feedback lifecycle projection 結合テスト設計 (PLAN-L5-15、2026-07-10)

> 設計ペア: `docs/design/harness/L5-detailed-design/physical-data.md` §9 と
> `PLAN-L5-15-feedback-lifecycle-physical-data`。source観測、append-only lifecycle、DB rebuild、
> takeover surfaceの境界を結合検証する。

| IT-ID | 前提 (Given) | 操作 (When) | 期待結果 (Then) | モジュール境界 | 不変条件 |
|---|---|---|---|---|---|
| IT-FLC-01 | 同一source generationのopen feedbackとlifecycle log | DB rebuildを2回実行する。 | open transitionは重複せず、rowとsurface件数が不変。 | source projector -> lifecycle reconciler -> SQLite | rebuildは消化stateを創作・巻戻ししない。 |
| IT-FLC-02 | TTLを超えたtelemetryと、同時刻のgate/actionable | lifecycle reconcileとtakeover selectを実行する。 | telemetryだけackされ、gate/actionableはopenのまま。 | lifecycle policy -> DB -> surface | TTLは安全・判断signalを消さない。 |
| IT-FLC-03 | ack済みfeedbackと元quality signal/finding | takeover selectを実行する。 | feedback eventもsource fallbackも表示されない。 | feedback_events + lifecycle -> fallback dedupe | terminal stateを別経路で再表示しない。 |
| IT-FLC-04 | 同一event IDで意味状態が変わったsource | generationを更新してreconcileする。 | 旧generationはterminal、新generationだけopen。 | generation builder -> lifecycle log -> projection | 同一generationは再openせず、新観測は埋没させない。 |
| IT-FLC-05 | sourceが消滅したactionable feedback | rebuild/reconcileを実行する。 | lifecycleはclosedとなり、理由と時刻がappend-onlyで残る。 | source absence detector -> lifecycle appender | silent deleteせず監査履歴を残す。 |
| IT-FLC-06 | `.ut-tdd/logs`不在、またはDB/log書込失敗 | append/reconcile/Stop summaryを実行する。 | 正常時はdirectoryを作り永続化、失敗時はhook exit 0。 | hook -> filesystem -> DB | fail-openはruntime継続であり、正常書込の無観測消失を許可しない。 |

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
| `verification_design` | Verification environment, data reality, measurement method, evaluation threshold, and execution procedure are explicit in the selected IT-* evidence plan. |

Minimum G8 close profile for the first L8 ascent:

| Profile item | Mandatory evidence |
|---|---|
| Strategy and plan | This `G8-WORKFLOW` section plus the concrete child PLAN scope. |
| Selection | At least one coherent boundary family such as IT-MODULE + IT-STATE, or a justified higher-risk family such as IT-ADAPTER / IT-DB. |
| Procedure | Targeted test command(s) and `doctor` after wiring. |
| Evidence | Integration evidence manifest under `.ut-tdd/evidence/g8-integration/*.json`, or PLAN `review_evidence.green_commands` that names the selected IT-* IDs. |
| Exit | `g8-integration-workflow` doctor check OK and no selected mandatory IT-* failure. |

## Engine-swap integration verification (PLAN-L5-16〜22)

| IT-ID | Given | When | Then | 必須証拠 |
|---|---|---|---|---|
| `IT-VMSOURCE-01` | manifest宣言値109/163/21/8のauthored records | projection全削除後にrebuildする | identity集合・edge・finding digestが一致する | rebuild前後manifest、row identity diff 0 |
| `IT-VMSOURCE-02` | 欠番/重複/orphan/理由なしdisposition/unknown profile/overlay競合fixture | loader+projectorを実行する | 各安定findingでfail-closeする | negative fixture、expected finding/exit |
| `IT-PLANASSET-01` | v1 PLAN全件とnumeric core collision | canonical adapter+ledgerへmigrationする | 損失0、曖昧自動選択0、collision全件をmaterializeする | migration ledger、loss report |
| `IT-WORKFLOW-01` | append-only transition/evidence列 | rebuild+reduceする | state/evidence usabilityが同一でstale/別revision evidenceを拒否する | event digest、reduction result |
| `IT-VMCONTRACT-01` | L0-L14/G0.5-G14 authored contract | compileする | registry/doctor/roadmapのrule identityとdigestが一致する | compiled manifests 3面diff 0 |
| `IT-DOCLEDGER-01` | baseline `3d232e9c`のroot/docs tree object、`docs_tree` 921件receipt、その他必須zoneのcoverage expansion delta、空projection | snapshot capture→init→materialize→projection rebuildを実行する | 全zoneのsnapshot/ledger/projectionが同じidentity集合・digestを持ち、全path exactly once、unclassified/phantom/duplicate/case-fold collision 0 | zone別raw NUL/member hash、root/docs tree OID、selection/snapshot digest、`docs_tree` 921件基準receipt、全zone row diff 0 |
| `IT-DOCLEDGER-02` | baseline後のadd/modify/delete/rename、exactly-one decision、正常event chain、未更新/改竄ledger | decision join→reducer→final closureを実行する | 正常4 kindはfinal path/blob集合と一致。decision/snapshot未束縛、未登録、illegal遷移、sequence gap/duplicate、空/非空chain改竄を別identityで拒否し、明示renameなしをdelete/addの片側だけで閉じない | decision/delta chain/reduction digest、finding manifest、期待exit |
| `IT-DOCLEDGER-03` | frontmatter/Markdown/wiki/anchor/PLAN/spec/test IDを含むtracked blobとbroken/unknown fixture | reader群→reference graph→closure analyzerを結合する | 正常edgeはstable identity、parse error/orphan/anchor欠落/stale canonical assertionは別findingでfail-close | reader receipt、edge/finding manifest、expected exit |
| `IT-DOCLEDGER-04` | blocking finding、正しいroute、route欠落、別snapshot/別finding digestのroute | debt verifierとclosure reportを実行する | 正しいrouteだけがfindingへjoinするがclosureはblockedのまま。欠落/stale routeを別findingにする | finding-route coverage manifest、route digest、exit 1 |
| `IT-DOCLEDGER-05` | 同一Git snapshotに対するCLI `diff|references check|check|report`とdoctor consumer | 全query surfaceを実行する | finding ID、subject、snapshot digest、exitが一致し、どのsurfaceもledger/authoring docs/DB truthを更新しない | surface parity receipt、source/DB before-after diff 0 |
| `IT-DOCLEDGER-06` | parse、複合FK、row write、swap各境界のfault fixtureと既存Green projection | transactional rebuildを実行する | 全faultで部分行0、旧Green projection digest不変、temporary table残留0、authoring source更新0になる | fault matrix、rollback receipt |
| `IT-DOCLEDGER-07` | canonical/archive/history/否定文/引用/negative fixtureとlegacy command参照 | authored zoneとtyped reference policyを評価する | 全文書をexactly once台帳化しつつ旧語の存在だけではfailせず、規範参照・authority逆流・現行legacy実行例だけをstable findingにする | zone別count、positive/negative policy finding |
| `IT-MODULE-01` | engine-swap module graph | dependency auditを実行する | domain逆依存、barrel cycle、doctor/CLI逆importが0になる | module graph、cycle count 0 |
| `IT-PROJECTION-REBUILD-01` | captured source bundle、SQLite transaction adapter、CLI/doctor composition root | 同一bundleで`ut-tdd db rebuild`、doctor rebuild、drive fallbackを実行する | 全入口が同一`ProjectionRebuildCommand`を通り、table identity/digest/receiptが一致する | source digest、入口別row diff 0、composition inventory |
| `IT-PROJECTION-REBUILD-02` | row/finding write境界の故障注入、secret-like finding payload | rebuildを実行する | guard拒否またはwrite失敗時は既存projectionを保持し、row/finding部分commit 0、authoring source更新0 | transaction rollback evidence、expected finding/exit |
| `IT-PROJECTION-REBUILD-03` | source/test全consumerとlegacy facade path (`tests/projection-writer.test.ts`を含む) | migration完了auditを実行する | 旧testを新application/adapter境界へ移行し、`projection-writer.ts`実体・互換re-export・importがsource/testとも0、source adapter→application→SQLite transaction以外の逆辺0 | import graph、legacy path search、test inventory、cycle 0 |
| `IT-ASSESS-01` | 163 item assessment | evidence/debtをjoinする | pending 0、verified 3面、partial/gap debt route 100%を満たす | assessment/debt coverage manifest |
| `IT-SELFPROOF-01` | contract ruleとmutation corpus | 独立process verifierを実行する | receipt exactly once、全mutation kill、正常fixture false-positive 0になる | receipt、mutation survivor 0 |

全ITはauthoring sourceを変更しないread/rebuild境界で実行し、DB/生成viewから判断を逆生成しない。
`IT-DOCLEDGER-01..07`は実装前TDD Redである。既存921件receiptはbaseline数量証拠に限定し、
typed reference closure、route freshness、surface parityのGreen代用にしない。

## Execution Ledger / GitHub integration (PLAN-L5-23、2026-07-15)

| IT-ID | Given | When | Then | Evidence |
| --- | --- | --- | --- | --- |
| `IT-EXEP-01` | episode/event/outboxの空DB | Forward外commandをcommit | eventとoutboxが同一transactionで各1件、途中faultは双方0件 | transaction receipt、row identity |
| `IT-EXEP-02` | 固定authored source bundle | DB削除後にrebuild | episode/event digestと順序が完全一致し、GitHub由来値でsourceを補完しない | pre/post table diff 0 |
| `IT-GHISS-01` | retry可能outboxとfake GitHub port | success/timeout/5xxを順に注入 | successはE4、timeoutはreconcile、5xxはpending維持、Issue重複0 | call log、outbox state、remote marker |
| `IT-GHISS-02` | signed webhook fixture | duplicate/out-of-order deliveryを受信 | delivery IDでdedupeし、許可遷移だけをappend。署名不正はdomain row 0 | inbox/event diff |
| `IT-REENTRY-01` | drive検証Greenとtarget revision | 中間test→certificate→合流→合流後test | E8〜E11が順序通り、revision変更時はcertificate stale | event digest、test receipts |
| `IT-PR-01` | E11到達episode | draft PR projectionを再送 | exact head SHAを持つdraft PR 1件へ収束 | remote PR ID、mapping、outbox receipt |
| `IT-MERGE-01` | cross-provider reviewとrequired checks | head SHA変化を各境界で注入 | 同一SHA時だけE14、変化時はcertificate/review失効 | merge authorization receipt |
| `IT-CIAGG-01` | runtime workflowにLinux/Windows legと最終`harness-check`があり、三jobが同一run attempt・同一HEAD SHAでsuccess | workflow構造検査とaggregate判定を実行 | 最終jobの`needs`集合が両legと完全一致し、`always()`と明示result guardが成立する場合だけGreen | workflow topology report、三job result、aggregate receipt |
| `IT-CIAGG-02` | 各legへ`failure`、`cancelled`、`skipped`、`neutral`、`timed_out`、`action_required`、未知値、欠落を一つずつ注入 | aggregate判定を実行 | どの負例も最終`harness-check`をGreenにせず、片leg successやworkflow conclusionから補完しない | result mutation matrix、期待exit、survivor 0 |
| `IT-CIAGG-03` | validな三job証拠に対しHEAD SHA、run attempt、workflow revision、required check set、protection revisionを各一箇所だけ変更 | E13 receiptを検証してE14 authorizationを試行 | 全変異をstaleとして拒否し、別run・別attempt・別HEADのleg合成を行わずE13/E14 delta 0 | field mutation matrix、ledger/outbox diff 0 |
| `IT-CIAGG-04` | runtime dual-leg fixture、consumer template single-leg fixture、profile明示値 | `github-ci-policy`を両profileで実行 | runtimeだけ三job topologyを要求し、templateへWindows legを推測追加しない。profile欠落・本文偽装・余剰`needs`はfail-close | profile別violation set、workflow fixture digest |
| `IT-CIAGG-05` | valid E13 aggregate receiptと、required contextが`harness-check`一件のbranch protection observation | 自動merge/E14 projectionを実行 | E14はaggregate receipt digestだけへ束縛され、個別leg receiptでは進まない。実設定の未適用・乖離・取得不能はclosureをblock | protection revision、required set digest、E13/E14 event receipt |
| `IT-CLOSE-01` | merged PR | main CI・Issue close・learning projectionを順に実行 | 全成功時だけE15。再実行してclosure/learning fact重複0 | E15 receipt、learning identity |

SQLite FK/UNIQUE/CHECK/複合PKは各1違反fixtureでDDL自身が拒否する。adapterのmock成功だけ、row countだけ、
GitHub remote stateだけをGreen証拠にしない。`IT-CIAGG-01..05` は
L6 `harness-check` aggregate gate / E13 receipt契約を結合境界で検証するL8 ascentであり、構造検査、結果値の
全負例、receipt鮮度、runtime/template profile分離、branch protection/E14消費境界の全てがGreenに
なるまで「両OS CI済み」またはmerge可能を主張しない。

## Node build image候補integration pair（Issue #152 D0-N）

以下はD0時点では設計候補であり、F0の対応integration testと実装を同一commitへ追加した場合だけ
`IT-NODEBOOT-*`へ昇格する。

| 候補ID | 結合条件 | Green oracle |
|---|---|---|
| `CAND-NODEBOOT-101` | clean checkout + static exact Node/npm pin + `npm ci` | lock graphが再現され、compiled generationやruntime custodyを検証対象に含めない |
| `CAND-NODEBOOT-102` | generated CLI + receipt loader | 同一subject revision/dependency closureだけを起動 |
| `CAND-NODEBOOT-103` | Linux/Windows Node bootstrap job | 両OSで同じreceipt schema・test IDを実行しF0c evidenceを生成 |
| `CAND-NODEBOOT-104` | 一方のbootstrap legがfailure/cancel/skip | 最終aggregateは必ずnon-success |
| `CAND-NODEBOOT-105` | Node bootstrapと既存harness legが別HEAD/run attempt | evidence合成を拒否 |
| `CAND-NODEBOOT-106` | Issue #153 envelope下のcandidate固有failure | envelopeでwaiveせずmergeをblock |

F0aはtoolchain、F0bはsealed generation、F0cはworkflow配線とaggregateを所有する。
toolchain、build/receipt、CI YAMLを同じ原子PRへ再結合しない。

## Node cutover候補integration pair（Issue #152 D0-N）

cutoverの競合・永続化・slice admissionはbuild-image用`CAND-NODEBOOT-101..106`へ混在させず、
PLAN-L7-458 `CAND-CUTOVER-101..113`とexact pairにする。D0では候補であり、source/testとRed実測を
owner revisionの同一commitへ追加した場合だけ正式`IT-CUTOVER-*`へ昇格する。

| 候補ID | 結合条件 | Green oracle |
|---|---|---|
| `CAND-CUTOVER-101` | seed/genesis/next sequence mutation | seed null/seq0/ver0、first receipt seq0、CAS後head seq0/ver1、以後N+1だけを許可 |
| `CAND-CUTOVER-102` | 同一expected previous receiptへ2 append | latest+1が1件、fork 0、loser retry/write 0 |
| `CAND-CUTOVER-103` | evidence/receipt append各barrierでprocess crash | atomic transactionで両方存在又は両方0、partial chain 0 |
| `CAND-CUTOVER-104` | reverse/rollback command | append 0、既存receipt_digest chain不変 |
| `CAND-CUTOVER-105` | receipt/evidence GC又は直接削除 | deletion API 0又はchain-only verification Red |
| `CAND-CUTOVER-106` | registry順D0→F0a→F0b→F0c→Q0 admission chainと最初のF0b legacy backfill | 通常D0は5 inputs（ReviewBundle outer 1 + AttestedTrackedReceiptRecord exact 4）を維持し、後続predecessor+owned evidenceだけ連結。別caseで#484だけが`NODE-SLICE-LEGACY-BACKFILL-REGISTRY-v1`の`legacy.d0-admission` / `legacy.f0a-custody`からD0/F0a二receiptをatomic・exactly once生成する。D0はsource/merge SHA・exact 4 plan-admission rows・bound Git blobs、F0aはsource/tree/merge SHA・predecessor integrity digest・exact 8 Git rowsだけを再構成する。reviewerFamily/model/PASS注入はadmissionへ影響せず、legacy rowsは`family_status=unverified_family`/`review_authority=none`。legacy setを通常D0へ入力、D0 4-row/F0a 8-row Git closureの欠落・各row/closure digest mutation、片側mint、再利用は全てRed、欠落・不一致は`legacy_evidence_unavailable` |
| `CAND-CUTOVER-107` | payload mutation、session count/outer/edge、v1 ID/revision/window mismatch、wrong authority/key、forgery、provider binding、Candidate/path/head/WorkEvent mutation | Session exact10/self9+combined payload+outer二段+edge exact1、immutable v1/rev1、Candidate11/self10、WorkEvent12/self11、paths/head契約を要求 |
| `CAND-CUTOVER-108` | NULL PK/check、DB subject spoof、migration rebuild failure、Receipt/Content prefix混同、q0 kind typo、source preimage曖昧、marker/field/digest/partial-index/edge/core mutation | strict generated subject DB、transactional rebuild、digest型exact、q0.runtime-no-fallback literal、single JSON preimage、partial UNIQUE、edge exact 1を要求 |
| `CAND-CUTOVER-109` | `.ut-tdd/ledger/cutover-ledger.db` canonical書込と並行してSQLite online backup | backup snapshotのhead、全receipt refs、object digestが単一時点で整合 |
| `CAND-CUTOVER-110` | trusted backupからrestore | restore後のhead、全refs、typed object digestが元ledgerとexact一致 |
| `CAND-CUTOVER-111` | schema migration各barrierで失敗注入 | DDL、data、`user_version`を単一transactionで全rollback |
| `CAND-CUTOVER-112` | cutover DB runtimeより新しい未知schema又はdowngrade要求 | cutover DB open/migration 0、canonical bytes不変でfail-close。PLAN ledger/harness projection DBへ波及0 |
| `CAND-CUTOVER-113` | projection rebuild中にcutover append | single read snapshotをstaging generationへ全投影しcomplete後atomic publish。appendは次世代、世代混在0、canonical DB不変 |

`NODE-Q0-CASE-MANIFEST-v1-BEGIN`
{"artifact_id":"NODE-Q0-CASE-MANIFEST-v1","expected_case_ids":["CAND-CUTOVER-101","CAND-CUTOVER-102","CAND-CUTOVER-103","CAND-CUTOVER-104","CAND-CUTOVER-105","CAND-CUTOVER-106","CAND-CUTOVER-107","CAND-CUTOVER-108","CAND-CUTOVER-109","CAND-CUTOVER-110","CAND-CUTOVER-111","CAND-CUTOVER-112","CAND-CUTOVER-113","CAND-NODEBOOT-101","CAND-NODEBOOT-102","CAND-NODEBOOT-103","CAND-NODEBOOT-104","CAND-NODEBOOT-105","CAND-NODEBOOT-106"],"schema_version":"node-q0-case-manifest.v1"}
`NODE-Q0-CASE-MANIFEST-v1-END`

zod schema `src/schema/cutover-transition.ts` / `src/schema/node-slice-admission.ts`からruntime
`src/runtime/cutover-transition.ts` / `src/runtime/node-slice-admission.ts`、test
`tests/cutover-transition.test.ts` / `tests/node-slice-admission.test.ts`へ同一candidateをtraceする。

## Resource Kernel物理統合（PLAN-L5-25、2026-07-22）

mock/contract laneはwireとfailure isolationを、実OS laneはcustody強制を検証する。mock GreenをJob/cgroup Greenへ
読み替えず、各caseはcontrol/workload別created count、custody identity、event sequence、empty/reap proofを保存する。

| ID | boundary / fault injection | expected |
|---|---|---|
| `IT-RGK-PHYS-001` | valid requestを分割read/writeしresponseをcorrelate | 一件だけdecodeし同一request IDへ応答、余剰byte 0 |
| `IT-RGK-PHYS-002` | oversize、partial、invalid UTF-8、duplicate/unknown field、trailing byte | decoder `PreDispatchWireFault`からNode Kernel境界でexactly once `protocol_failure`。validated request ID前のresponse 0、launcher/custody call 0、raw bytes/secret/path保存0 |
| `IT-RGK-PHYS-003` | mutating dispatch後response ID/version/bundle digestを一要素ずつ変異 | PostDispatchResponseFault→indeterminate、direct spawn/terminal seal 0、actual factへreconcile |
| `IT-RGK-PHYS-004` | 同一request ID/token digest/idempotency identityのspawnをtimeout後再送 | pending/indeterminate/result recordから実phaseへreconcileしprocess最大1。attempt/nonceだけ同じ新requestはreplay拒否 |
| `IT-RGK-PHYS-005` | Windows create→assign間でclient crash | suspended root resume 0、custodianがterminate/reap |
| `IT-RGK-PHYS-006` | Windows assign成功後launcher/client crash | Job handle custodyを維持しdeadline後Job empty/orphan 0 |
| `IT-RGK-PHYS-007` | Linux clone/start barrierと事後attach fallbackを競合 | user code開始時からcgroup所属、事後attachはcapability failure |
| `IT-RGK-PHYS-008` | Linux broker/subreaper crashとdouble-fork | reconcile後`populated=0`、zombie/managed orphan 0 |
| `IT-RGK-PHYS-009` | root先行exit、terminate/cancel競合 | root exitではreturnせず、empty→reap後だけterminal |
| `IT-RGK-PHYS-010` | request pre-decode faultとmutating dispatch後のpipe/response decode/correlation fault、companion/journal crash | pre-decodeだけside effect 0。post-dispatchは全てindeterminate→reconcile→actual phase/fact。確定前terminal receipt 0、片肺0 |
| `IT-RGK-PHYS-011` | unsupported OS・権限不足・capability欠落 | probe後managed workload生成前拒否、control/workload identityを別保存、soft fallback 0 |
| `IT-RGK-PHYS-012` | binary/schema/target/signature/SBOMを各一箇所変異 | admission前`bundle_failure`、PATH探索/download 0 |
| `IT-RGK-PHYS-013` | 旧componentを旧manifestで直接復帰後、floor超の新sequence manifestへ再review・再署名 | 旧manifest復帰は拒否。新manifestがcompanion/protocol/D0-N receiptと実OS oracleを再通過した場合だけ利用 |
| `IT-RGK-PHYS-014` | Bun binary/lockfile/API無しのNode+Cargo lane | 同じwire/custody oracleを実行しBun invocation 0 |
| `IT-RGK-PHYS-015` | verified companionへprobe後、journal append前/後・token seal前/後でcrash | barrier前はmanaged root 0、再開時は同一probe digest/tokenだけを一度使用 |
| `IT-RGK-PHYS-016` | stage token/leaseのexecution/spec/bundle/attempt/custody/executor/boot/deadline/policy/authenticatorを各変異し、同nonce別payload、旧variant、各state release_custodyを投入 | 不正を各境界で拒否しcustody/managed root 0。別execution/bundle fact再利用0、releaseはempty/reap fact commit後だけ |
| `IT-RGK-PHYS-017` | custody nonce予約/再利用/別execution移送、executor arm/lease/attach/commit前後crash、prepared又はsuspendedでdeadline/cancel | 不正nonceはcreate 0。prepared/attached_suspendedからterminating→empty/reap/release、resume 0、実phase receipt。commit後はexecutorがcustody維持 |
| `IT-RGK-PHYS-018` | authority crash後、Rust native observation/journal/current epochを各変異しTS recoverAuthorityをCAS競合 | Rustはfact以外delta 0。変異/stale/replayはreissue 0、TS winnerだけepoch+1 lease+trace atomic、loser delta 0 |
| `IT-RGK-PHYS-019` | bundle内key、未review signer、signature substitution | `BundleTrustPort`のbinding不一致でcontrol process 0 |
| `IT-RGK-PHYS-020` | manifestのbundle revision/component digest/schema/targetを各変異 | 一要素でも不一致ならverified handle 0 |
| `IT-RGK-PHYS-021` | `F-1`、`F+同digest`、`F+別digest`のmanifestを再activation | 正規署名でも順にstale/replay/equivocationとして拒否し、current bundle/accepted fact/control launch不変 |
| `IT-RGK-PHYS-022` | 現在floorより厳密に大きいsequenceの新manifestとしてrollback対象を再署名。同sequence以下も併走 | `>`かつ通常のtrust/component/target検証を再通過した場合だけactivate候補。同sequence以下はactivate 0 |
| `IT-RGK-PHYS-023` | trust port missing/unknown/failure | PATH探索、runtime download、direct spawnへfallbackせず利用停止 |
| `IT-RGK-PHYS-024` | activation port failureを各公開barrierで注入 | partial publish 0、旧verified bundle又は利用停止だけを観測 |
| `IT-RGK-PHYS-025` | companion、protocol、D0-N generation receiptの一要素だけを旧値へ戻す | bundle identity不一致で拒否しcontrol process 0。rollbackはfloor超の新manifest再署名だけを許可 |
| `IT-RGK-PHYS-026` | D0 adapterへrotation、signed clock、re-anchor、物理log依存を注入 | deferred ownership違反としてRed、抽象port境界を維持 |
| `IT-RGK-PHYS-027` | create→spawn→resume完全positive chain | stage token 3枚とpredecessor factが連鎖しcustody/root各最大1 |
| `IT-RGK-PHYS-028` | 各stageで消費+pending commit、side effect、indeterminate、reconciled、result前後にcrashし4 digestとphase/fact digestを各変異してretry | 全stateにrequest digest継承。reconciled後crashはexact一致からnative再実行0でresult commit。他stateも一致時だけreconcile/継続/同result、変異・record欠測は拒否、custody/root増殖0 |
| `IT-RGK-PHYS-029` | effective deadline直前/同時/直後のspawn/resumeとcleanup CAS競合 | deadline後execution 0、winnerがcleanup leaseを同時発行してcleanup_onlyへ一方向遷移しempty/releaseへ収束 |
| `IT-RGK-PHYS-030` | recovery deadline超過後のexecutor/supervisor | overdue/admission blockを記録し、kill/reap/releaseは停止しない |
| `IT-RGK-PHYS-031` | Node/authority same-boot再起動とCAS競合 | winnerだけcleanup lease、旧epoch拒否、生成/attach/resume 0 |
| `IT-RGK-PHYS-032` | host rebootのRust cross-boot observationをTS CAS競合/replay | TS winnerだけboot-fenced lease+trace→empty→release→unblock。Rust/敗者/replay delta 0 |
| `IT-RGK-PHYS-033` | cross-boot observation欠損、boot chain不一致、旧custody identity再利用 | quarantine/admission block維持、新lease/root 0 |
| `IT-RGK-PHYS-034` | empty fact commitからcontrol shutdownまで各barrier crash | release→fact→disarm→revoke+released atomic commit→terminal seal→shutdown順を再開し、二重release・revoke後未完操作・早期seal・survivor 0 |
| `IT-RGK-PHYS-035` | active custody、pending response、未解決pending-dispatch、indeterminate、reconciled-without-result、未flush terminal outboxを一つずつ残してshutdown_companion | 各caseでcontrol shutdown 0、custody/authority delta 0。全条件解消後だけshutdown |
| `IT-RGK-PHYS-036` | deadline/cancel、host reboot、empty/releaseを組み合わせauthority mode全from/toを駆動 | 合法5辺だけjournal+lease/factと同時commit。不正backward/self/skipはauthority/OS delta 0、revokedから再開0 |
| `IT-RGK-PHYS-037` | 正常root exitとdescendant遅延exit | root exitでcleanup leaseへ遷移し、descendant empty/reap前release 0。empty後release→disarm→revoke+released→terminal sealへ到達 |
| `IT-RGK-PHYS-038` | 3 lease variantを各operationへcross-dispatchし、schema/mode/boot fieldも一要素ずつ変異 | operation×variant表の合法組だけ実行。boot-fenced terminate/旧boot monotonic field、variant外fieldはdecode/dispatch前拒否 |
| `IT-RGK-PHYS-039` | same/cross observation全field、signer key/policy、variant forbidden fieldをmutation | Rust pinned native signer→TS BundleTrust verifierだけがGreen。unknown/別bundle key、field混同、自己包含はCAS/lease/trace 0 |
| `IT-RGK-PHYS-040` | same/cross-boot recoveryでRust fact laneとTS transaction laneを個別crash/spy | Rustはnative fact以外のDB/CAS/lease/trace 0。TSだけがfact+journal/current epoch一致後にCAS+lease+traceをatomic commitし、各crash retryでwinner1/重複0 |
| `IT-RGK-PHYS-041` | mutating dispatch後responseへoversize/partial/invalid UTF-8/JSON/schema/trailing/mismatchを各注入 | 全case PostDispatchResponseFault→indeterminate、side effect 0推測/terminal seal 0。actual native fact後だけresult/receipt |
| `IT-RGK-PHYS-042` | release各barrier crashとraw OS identityの別custody_generation再利用を競合 | 同generationはabsenceへ収束、別generationは削除0+quarantine。effect最大1、Rust marker/DB 0。fact後だけdisarm→revoke+released |

freezeは全fixture、対象OS、required capability、観測点、negative expectedを固定し、Windows/Linux実runner不足を
deferのままconfirmedへ昇格しない。

### Resource Kernel物理統合 freeze属性（PLAN-L5-25 §7 pair-freeze条件、2026-07-30）

上表の 42 case それぞれについて、`lane` / `対象OS + required capability` / `fixture` / `観測点 (保存する fact)` /
`negative expected` / `created count (control/workload)` を本節で固定する。これが PLAN-L5-25 §7 の
「L8で正負oracle、fixture、観測点、control/workload別created countをfreezeする」条件の実体である。

`fixture` 列は識別子と一行説明だけを持つ。識別子の宣言だけでは第三者が freeze を検証できないため、
**fixture の正本は `docs/test-design/harness/resource-kernel-fixture-manifest.yaml`** とし、各 fixture の
配置先 path・入力構成・生成規則・L5 契約節への citation・実体の有無 (`status`) をそこで固定する。
`status: planned` の entry は path が実在してはならず (実在したら Red)、実体が無いのに配置済みと
読ませる偽装を構造的に禁じる。突合は `tests/resource-kernel-fixture-manifest.test.ts` が実 repo で行う。

`lane` の語彙は 3 値に閉じる。`mock` = mock/contract integration lane (wire・token・lease・journal・CAS を
in-process fake と injected fault で駆動し、OS custody を主張しない)。`real-OS` = 実 runner lane
(実 Job / 実 cgroup v2 でのみ Green を主張できる)。`mock+real-OS` = 両 lane で同一 case を実行し、
mock Green を実 custody Green へ読み替えない。`created count` は `control` = companion control process、
`workload` = managed root process の生成数期待値であり、`≤1` は「最大 1、超過は Red」を意味する。

| ID | lane | 対象OS / required capability | fixture | 観測点 (保存する fact) | negative expected | created count (control/workload) |
|---|---|---|---|---|---|---|
| `IT-RGK-PHYS-001` | mock | OS非依存 / capability不要 (wire層のみ) | `fx-rgk-frame-split`: 4byte length前置frameを任意境界で分割read/write する pipe harness | decoded request ID、response correlation ID、余剰byte数 | 分割位置に依存した二重decode、余剰byte>0 | control 1 / workload 0 |
| `IT-RGK-PHYS-002` | mock | OS非依存 / capability不要 | `fx-rgk-predecode-corpus`: oversize / partial / invalid UTF-8 / duplicate field / unknown field / trailing byte の 6 系統 corpus | `PreDispatchWireFault` kind、正規化後の`protocol_failure`件数、launcher call数、custody call数、log/receipt内のraw bytes・secret・path出現数 | validated request ID発行前のresponse>0、`protocol_failure`が2回以上または0回、launcher/custody call>0、raw bytes/secret/path保存>0 | control 1 / workload 0 |
| `IT-RGK-PHYS-003` | mock | OS非依存 / capability不要 | `fx-rgk-response-mutate`: mutating dispatch後のresponseから ID / version / bundle digest を一要素ずつ変異 | `PostDispatchResponseFault`、`DispatchIndeterminate`の6 field、reconcile後のactual phase/fact digest | direct spawn>0、terminal seal>0、side effect 0の推測確定 | control 1 / workload ≤1 (reconcile結果に一致) |
| `IT-RGK-PHYS-004` | mock | OS非依存 / capability不要 | `fx-rgk-idempotent-retry`: 同一 request ID + token digest + idempotency identity をtransport timeout後に再送。attempt/nonceだけ同じ別requestも投入 | pending / indeterminate / result record、idempotency identity、reconcile後のphase | process>1、replay requestの受理 | control 1 / workload ≤1 |
| `IT-RGK-PHYS-005` | real-OS | Windows / Job object create+assign、non-inherit handle | `fx-rgk-win-crash-before-assign`: create後 assign前に client process を強制終了 | suspended root resume回数、custodian terminate/reap fact、Job empty proof | suspended root resume>0、reapなしで終了 | control 1 / workload ≤1 (suspendedのまま、resume 0) |
| `IT-RGK-PHYS-006` | real-OS | Windows / Job object + SCM custodian、別failure domain | `fx-rgk-win-crash-after-assign`: assign成功後に launcher と client を落とす | Job handle custody保持、deadline後のJob empty proof、orphan数 | Job handle喪失、deadline後orphan>0 | control 1 / workload 1 |
| `IT-RGK-PHYS-007` | real-OS | Linux / cgroup v2 + `clone3(CLONE_INTO_CGROUP)` | `fx-rgk-linux-start-in-cgroup`: clone/start barrier と事後attach fallback を競合させる | user code開始時点のcgroup所属、事後attach試行のcapability failure | 事後attachがhard custodyとして受理される、開始後attach | control 1 / workload 1 |
| `IT-RGK-PHYS-008` | real-OS | Linux / subreaper + `cgroup.kill` + `cgroup.events populated` | `fx-rgk-linux-broker-crash`: broker/subreaper crash と double-fork を同時に起こす | reconcile後の`populated`値、zombie数、managed orphan数 | `populated!=0`、zombie>0、managed orphan>0 | control ≤1 (再起動broker) / workload 1 |
| `IT-RGK-PHYS-009` | mock+real-OS | 両OS / custody terminate + empty proof | `fx-rgk-root-exit-race`: root先行exit と terminate/cancel を競合投入 | custody state遷移列、root exit fact、empty+reap proof、terminal receipt発行時刻 | root exitでterminal返却、empty/reap前のterminal | control 1 / workload 1 |
| `IT-RGK-PHYS-010` | mock | OS非依存 / capability不要 (failure domain injection) | `fx-rgk-fault-domains`: pre-decode fault、post-dispatch pipe/decode/correlation fault、companion crash、journal crash を別domainとして注入 | 各domainのfault kind、side effect数、indeterminate→reconcile→actual phase列、片肺(journalのみ/nativeのみ)検出 | pre-decodeでside effect>0、post-dispatchで確定前terminal receipt>0、片肺>0 | control ≤1 / workload ≤1 |
| `IT-RGK-PHYS-011` | mock+real-OS | 両OS / capability欠落・権限不足を再現 (Windows: Job作成権限剥奪 / Linux: cgroup write不可) | `fx-rgk-capability-absent`: unsupported OS stub、権限不足、required capability空 | probe fact、capability集合、`control_process_created`と`managed_root_created`の別値、拒否理由 | managed workload生成後の拒否、soft fallback>0、capability集合の共通最小への丸め | control 1 / workload 0 |
| `IT-RGK-PHYS-012` | mock | OS非依存 / bundle検証のみ | `fx-rgk-bundle-mutate`: binary / schema / target / signature / SBOM を各一箇所変異した 5 bundle | admission前の`bundle_failure`、PATH探索call数、download call数 | admission通過、PATH探索>0、download>0 | control 0 / workload 0 |
| `IT-RGK-PHYS-013` | mock | OS非依存 / trust + activation port | `fx-rgk-rollback-resign`: 旧componentを旧manifestで直接復帰、および floor超sequenceで再review・再署名した新manifest | 旧manifest復帰の拒否理由、新manifestのcompanion/protocol/D0-N receipt照合結果、実OS oracle再通過記録 | 旧manifest直接復帰の受理、oracle再通過なしのactivate | control ≤1 (新manifest受理時のみ) / workload 0 |
| `IT-RGK-PHYS-014` | mock+real-OS | 両OS / Node + Cargo のみ (Bun binary・lockfile・APIを環境から除去) | `fx-rgk-bun-absent`: PATHからBunを除去し Bun lockfile / Bun API 参照を持たない lane で同一wire/custody oracleを実行 | Bun invocation数、実行したwire/custody oracle ID集合 | Bun invocation>0、Bun不在で実行不能となるoracle>0 | control 1 / workload ≤1 |
| `IT-RGK-PHYS-015` | mock | OS非依存 / journal durability | `fx-rgk-barrier-crash`: verified companionへprobe後、journal append前/後、token seal前/後の 4 点でcrash | probe digest、journal append記録、token seal記録、再開時に使用したprobe digest/token | barrier前のmanaged root>0、同一probe digest/tokenの2回使用 | control 1 / workload 0 (barrier前) |
| `IT-RGK-PHYS-016` | mock | OS非依存 / token authenticator port | `fx-rgk-token-mutate`: `AdmissionStageTokenV1`のexecution/spec/bundle/attempt/custody/executor/boot/deadline/policy/authenticator を各変異、同nonce別payload、旧variant、各stateの`release_custody`を投入 | 拒否境界 (decode前/verify前/dispatch前)、custody作成数、managed root数、fact再利用検出、release前提条件 | 不正tokenでcustody/managed root>0、別execution/bundle factの再利用、empty/reap fact commit前のrelease | control 1 / workload 0 |
| `IT-RGK-PHYS-017` | mock+real-OS | 両OS / custody create + attach | `fx-rgk-nonce-executor`: custody nonce予約/再利用/別execution移送、executor arm/lease/attach/commit の前後crash、prepared又はsuspendedでdeadline/cancel | nonce予約record、custody identity、state遷移列 (`prepared`/`attached_suspended`→`terminating`→`empty_proven`→`released`)、resume数、実phase receipt | 不正nonceでcreate>0、resume>0、commit後にexecutorがcustodyを失う | control 1 / workload ≤1 |
| `IT-RGK-PHYS-018` | mock | OS非依存 / CAS + native observation signer | `fx-rgk-authority-cas`: authority crash後にRust native observation / journal / current epoch を各変異し、TS `recoverAuthority`をCAS競合させる | Rust側delta (fact以外)、CAS勝者のepoch値、lease+trace commit atomicity、敗者delta | Rustがfact以外のdeltaを持つ、変異/stale/replayでreissue>0、敗者delta>0、winnerが2以上 | control 1 / workload 0 |
| `IT-RGK-PHYS-019` | mock | OS非依存 / `BundleTrustPort` | `fx-rgk-trust-binding`: bundle内key、未reviewのsigner、signature substitution の 3 系統 | trust decision digest、policy revision、binding照合結果、control process生成数 | binding不一致でcontrol process>0 | control 0 / workload 0 |
| `IT-RGK-PHYS-020` | mock | OS非依存 / manifest schema digest | `fx-rgk-manifest-mutate`: manifestのbundle revision / component digest / schema / target を各変異 | verified handle発行数、不一致要素の識別 | 一要素不一致でverified handle>0 | control 0 / workload 0 |
| `IT-RGK-PHYS-021` | mock | OS非依存 / accepted-sequence fact store | `fx-rgk-activation-sequence`: `F-1`、`F+同digest`、`F+別digest`の 3 manifestを順に再activation | 拒否分類 (stale / replay / equivocation)、current bundle、accepted fact、control launch数 | 正規署名を理由とした受理、current bundle/accepted factの変化、control launch>0 | control 0 / workload 0 |
| `IT-RGK-PHYS-022` | mock | OS非依存 / accepted-sequence fact store | `fx-rgk-rollback-floor`: 現在floorより厳密に大きいsequenceの再署名manifestと、同sequence以下のmanifestを併走 | sequence比較結果、trust/component/target再検証記録、activate候補判定 | 同sequence以下のactivate>0、再検証なしのactivate | control 0 / workload 0 |
| `IT-RGK-PHYS-023` | mock | OS非依存 / `TrustDecisionPort` | `fx-rgk-trust-port-absent`: trust port missing / unknown version / failure の 3 系統 | fail-close理由、PATH探索call数、download call数、direct spawn call数、利用停止状態 | PATH探索・download・direct spawnへのfallback>0 | control 0 / workload 0 |
| `IT-RGK-PHYS-024` | mock | OS非依存 / activation port | `fx-rgk-activation-fail`: activation port failureを各公開barrierで注入 | 各barrierでの公開状態、観測されたbundle (旧verified / 利用停止)、partial publish検出 | partial publish>0、未検証bundleの観測 | control 0 / workload 0 |
| `IT-RGK-PHYS-025` | mock | OS非依存 / bundle identity照合 | `fx-rgk-receipt-revert`: companion / protocol / D0-N generation receipt の一要素だけを旧値へ戻す | bundle identity照合結果、拒否理由、control process生成数、許可されたrollback形式 | identity不一致でcontrol process>0、floor超再署名以外のrollback受理 | control 0 / workload 0 |
| `IT-RGK-PHYS-026` | mock | OS非依存 / D0 defer境界 | `fx-rgk-deferred-ownership`: D0 adapterへ鍵rotation、signed clock、re-anchor、物理log依存を注入 | deferred ownership違反検出、抽象port境界の維持 | 注入がGreenとして通る、port境界に具体PKI/time/storageが露出 | control 0 / workload 0 |
| `IT-RGK-PHYS-027` | real-OS | 両OS / Windows: Job create+assign+resume / Linux: cgroup v2 + `clone3(CLONE_INTO_CGROUP)` | `fx-rgk-positive-chain`: create→spawn→resume の完全positive chain (stage token 3枚) | stage token 3枚の消費列、predecessor fact digest連鎖、custody identity、root identity、適用limit | token流用、predecessor fact不連鎖、custody>1、root>1 | control 1 / workload 1 |
| `IT-RGK-PHYS-028` | mock | OS非依存 / dispatch record store | `fx-rgk-dispatch-digests`: 各stageで消費+pending commit、side effect、indeterminate、reconciled、result の前後にcrashし、4 digestとphase/fact digestを各変異してretry | 全stateのrequest digest継承、reconciled後retryのnative再実行数、result commit、custody/root数 | request digest継承欠落、reconciled一致時にnative再実行>0、変異・record欠測の受理、custody/root増殖 | control 1 / workload ≤1 |
| `IT-RGK-PHYS-029` | mock+real-OS | 両OS / durable deadline executor | `fx-rgk-deadline-race`: effective deadline直前/同時/直後のspawn/resume と cleanup CAS を競合 | wall/monotonic観測点、`effective_deadline_monotonic_ms`、cleanup lease発行数、state遷移方向 | deadline後execution>0、cleanup lease>1、`cleanup_only`から`live`への復帰 | control 1 / workload ≤1 (deadline前のみ) |
| `IT-RGK-PHYS-030` | mock | OS非依存 / recovery deadline policy | `fx-rgk-recovery-overdue`: recovery deadline超過後のexecutor/supervisor動作 | overdue fact、新規admission遮断記録、kill/reap/release の実行継続記録 | overdue factなし、admission遮断なし、terminate/prove/releaseの拒否 | control ≤1 / workload ≤1 |
| `IT-RGK-PHYS-031` | mock | OS非依存 / same-boot recovery observation | `fx-rgk-same-boot-restart`: Node/authority の same-boot再起動をCAS競合させる | CAS勝者、発行lease variant (`CleanupAuthorityLeaseV1`)、旧epoch commandの拒否 | 敗者へのlease発行、旧epoch受理、生成/attach/resume>0 | control ≤1 / workload 0 |
| `IT-RGK-PHYS-032` | mock+real-OS | 両OS / host reboot fixture (boot ID変化)、cross-boot fact観測 | `fx-rgk-cross-boot`: host rebootのRust cross-boot observationをTS CASへ競合投入し、replayも併走 | boot ID対、`platform_boot_fact_digest`、boot-fenced lease、trace、empty→release→unblock列、Rust/敗者/replayのdelta | Rust/敗者/replayのdelta>0、boot-fenced以外のlease発行、empty proof先取り | control ≤1 / workload 0 |
| `IT-RGK-PHYS-033` | mock | OS非依存 / quarantine + admission block | `fx-rgk-boot-fence-missing`: cross-boot observation欠損、boot chain不一致、旧custody identity再利用 | quarantine状態、admission block記録、新lease発行数、managed root数 | quarantine解除、admission block解除、新lease>0、root>0 | control 0 / workload 0 |
| `IT-RGK-PHYS-034` | mock+real-OS | 両OS / custody release + authority revoke + deadline executor disarm | `fx-rgk-release-barriers`: empty fact commitからcontrol shutdownまで各barrierでcrash | 順序記録 (release→fact→disarm→revoke+released atomic→terminal seal→shutdown)、二重release検出、revoke後の未完操作、survivor数 | 二重release>0、revoke後の未完操作>0、早期seal、survivor>0 | control 1 / workload 0 (release時点) |
| `IT-RGK-PHYS-035` | mock | OS非依存 / shutdown precondition評価 | `fx-rgk-shutdown-preconditions`: active custody、pending response、未解決pending-dispatch、indeterminate、reconciled-without-result、未flush terminal outbox を一つずつ残して`shutdown_companion` | 各caseのshutdown実行数、custody delta、authority delta、全条件解消後のshutdown | 未解消条件でcontrol shutdown>0、custody/authority delta>0 | control 1→0 (全条件解消時のみ) / workload 0 |
| `IT-RGK-PHYS-036` | mock | OS非依存 / authority mode journal | `fx-rgk-authority-modes`: deadline/cancel、host reboot、empty/release を組み合わせ authority mode の全 from/to を駆動 | 実行された辺の集合 (合法 5 辺)、journal+lease/fact同時commit、不正辺のauthority/OS delta | 合法5辺以外の実行、backward/self/skipでのdelta>0、`revoked`からの再開 | control ≤1 / workload ≤1 |
| `IT-RGK-PHYS-037` | real-OS | 両OS / descendant tracking + empty proof | `fx-rgk-descendant-delay`: 正常root exit と descendant遅延exit | cleanup lease遷移、descendant生存記録、empty/reap proof、release→disarm→revoke+released→terminal seal列 | descendantのempty/reap前release>0、root exit単独のterminal | control 1 / workload 1 |
| `IT-RGK-PHYS-038` | mock | OS非依存 / lease authenticator port | `fx-rgk-lease-cross-dispatch`: 3 lease variantを各operationへcross-dispatchし、schema / mode / boot field も一要素ずつ変異 | operation×variant合法表との一致、拒否時点 (decode前 / dispatch前)、実行されたoperation集合 | 表外組合せの実行、boot-fenced terminate、旧boot monotonic fieldの受理、variant外fieldの通過 | control 1 / workload 0 |
| `IT-RGK-PHYS-039` | mock | OS非依存 / pinned native signer + `BundleTrustPort` verifier | `fx-rgk-observation-mutate`: same/cross observation全field、signer key/policy、variant forbidden field をmutation | signer identity、verifier判定、CAS/lease/trace実行数 | pinned signer以外でGreen、unknown/別bundle key受理、field混同・自己包含の通過、CAS/lease/trace>0 | control 1 / workload 0 |
| `IT-RGK-PHYS-040` | mock+real-OS | 両OS / Rust fact lane と TS transaction lane を個別crash可能 | `fx-rgk-recovery-lanes`: same/cross-boot recoveryでRust fact laneとTS transaction laneを個別にcrash/spy | Rust側のDB/CAS/lease/trace delta、TS側のfact+journal/current epoch一致確認、CAS+lease+trace atomic commit、crash retryごとのwinner数 | Rustがnative fact以外のdeltaを持つ、TSが一致確認前にcommit、winner!=1、重複>0 | control ≤1 / workload 0 |
| `IT-RGK-PHYS-041` | mock | OS非依存 / response decode層 | `fx-rgk-response-inject`: mutating dispatch後のresponseへ oversize / partial / invalid UTF-8 / JSON / schema / trailing / mismatch を各注入 | 全caseの`PostDispatchResponseFault`、`DispatchIndeterminate`、terminal seal数、actual native fact後のresult/receipt | side effect 0の推測、terminal seal>0、native fact確定前のresult/receipt | control 1 / workload ≤1 |
| `IT-RGK-PHYS-042` | mock+real-OS | 両OS / `CustodyReleasePort.ensureAbsent` + custody_generation | `fx-rgk-release-generation`: release各barrierでcrashさせ、raw OS identityの別`custody_generation`再利用を競合投入 | `release_id`、`CustodyAbsentFact`、削除effect数、quarantine fact、Rust側marker/DB delta、disarm/revoke順序 | 別generationの削除>0、quarantineなし、effect>1、Rust marker/DB delta>0、fact前のdisarm | control 1 / workload 0 |

lane別の内訳は次のとおりで、合計は 27 + 6 + 9 = 42 件 (上表の全行)。上表の `lane` 列が正本であり、
この一覧は同じ集合の再掲である。

- `mock` 27 件: `001`、`002`、`003`、`004`、`010`、`012`、`013`、`015`、`016`、`018`、`019`、`020`、`021`、`022`、`023`、`024`、`025`、`026`、`028`、`030`、`031`、`033`、`035`、`036`、`038`、`039`、`041`
- `real-OS` 6 件: Windows専用 `005`、`006` / Linux専用 `007`、`008` / 両OS `027`、`037`
- `mock+real-OS` 9 件: `009`、`011`、`014`、`017`、`029`、`032`、`034`、`040`、`042`

実 runner 証拠を要する case は `real-OS` 6 件 + `mock+real-OS` 9 件 = 15 件であり、この 15 件が
PLAN-L5-25 の confirmed 昇格を律速する。残る 27 件は mock/contract lane だけで Red-freeze / Green 判定が閉じる。

**この freeze が主張しないこと (誤読防止)**: 本節は fixture・観測点・negative expected・created count の
**設計固定**であり、実行実測ではない。`real-OS` / `mock+real-OS` lane の Windows/Linux 実 runner 証拠は
未取得であり、PLAN-L5-25 の `status: confirmed` 昇格条件は本節の freeze ではなく実 runner 証跡である
(条件分離は PLAN-L5-25 §0.1 / §7.2 が保持する)。mock lane Green を Job/cgroup Green へ読み替えない。
