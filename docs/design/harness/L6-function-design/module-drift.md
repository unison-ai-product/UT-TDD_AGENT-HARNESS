---
layer: L6
artifact_type: design_doc
status: confirmed
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
created: 2026-06-08
plan: docs/plans/PLAN-L6-15-module-drift.md
---

> **L6 contract marker**: `parseListedModules`, `scanActualModules`, `analyzeModuleDrift`, `loadModuleDocs`, and `moduleDriftMessages` are the unit-test-granularity contracts. DbC pre/post is in §2-§3. L7 oracle family: U-MDRIFT-001..005.

# module-drift lint — 機能設計 (① / PLAN-L6-15、IMP-075)

> **V-pair**: `pair_artifact = L7-unit-test-design.md §1.16` (L6↔L7)。DbC 契約から単体テスト oracle (U-MDRIFT-*) を導出。

## §0 スコープ

**「architecture §3.1 building block 集合 ⊇ `src/` 実在 module」の包含 drift を機械検査** (IMP-075)。

背景: A-103 (L4 見直し) で handover/setup/web/lint が「実装済かつ設計 doc が将来扱い」の back-fill 漏れ (= harness 自身が [[feedback_impl_must_backfill_to_design]] を L4 で破った) を **手動監査**で発見した。柱 2「doc×機械厳格化」「柱 3 自動化で state 管理」に照らすと、impl→design back-fill 漏れ (meta-drift) を手動 audit に頼るのは under-design。本設計は **`src/` 実在 module がすべて architecture §3.1 に列挙されているか** (actual ⊆ listed) を doctor hard gate で検査する純関数 lint を定義する。

**スコープ外**:
- **逆向き (listed ⊋ actual = 将来 module)**: 設計が web/roster/skills 等を「将来」列挙し src 未実在は drift ではない (宣言済 carry)。検査しない。
- **asset-drift (internal asset cutover / FR-L1-49)**: current slice is implemented as a separate doctor hard gate for enrolled internal assets (`.claude/agents`, `.claude/agent-memory`, `docs/skills`, `docs/templates/prompts`). Full roster/skills dependency semantics remain future work outside this module-drift lint.
- **import グラフ drift (循環/逆依存)**: ADR-002/IMP-032 (knip/madge) の別 PLAN。本 lint は module **集合の包含**のみ。

## §1 入力 (設計 listed / 実在 actual)

- **listed**: `docs/design/harness/L4-basic-design/architecture.md` の §3.1 表 1 列目 `**name**` building block 名。
- **actual**: `src/` top-level の **dir 名** + **top-level `*.ts` の basename** (`cli.ts` → `cli`)。

## §2 純関数 (parse / analyze)

```text
parseListedModules(architectureText: string) -> string[]
scanActualModules(srcDir: string) -> string[]
analyzeModuleDrift(docs: { listed, actual }) -> { orphans, listedCount, actualCount, ok }
```

- **parseListedModules**:
  - **Precondition**: architecture.md 全文。
  - **対象切り出し**: `§3.1` 見出し〜次見出し (`§3.2` 等) に限定 (§3.2 代表 module の太字を巻き込まない、過検知回避)。
  - **抽出**: 表行 1 列目 `^\|\s*\*\*([a-z][a-z0-9_-]*)\*\*` のみ。重複排除。
  - **Postcondition**: §3.1 不在 → `[]` (パース失敗を空虚 ok にしない、§3 で listedCount 0 検出可)。
- **scanActualModules**:
  - dir + top-level `*.ts` を module 名に正規化、sort + 重複排除。
- **analyzeModuleDrift**:
  - **Postcondition**: `orphans = actual \ listed` (実在だが未列挙)。`ok = orphans.length===0`。`listedCount/actualCount` は非空虚ガード用。

## §3 I/O loader + messages

- `loadModuleDocs(repoRoot)`: architecture.md を読み `parseListedModules`、`src/` を `scanActualModules` → `{ listed, actual }`。
- `moduleDriftMessages(result)`: orphan 0 → `"OK (… 孤児 0)"` / orphan あり → 件数 + module 列 + 「設計 doc へ back-fill (impl→design)」+ `[[feedback_impl_must_backfill_to_design]]`。

### §3.1 FR asset-drift alias

| Function | Signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `analyzeAssetDrift` | analyzeAssetDrift(input: AssetDriftInput) => AssetDriftResult | enrolled agent/agent-memory/skill/prompt docs and guard allowlist are supplied; absent roots in isolated fixtures skip without failing unrelated checks. | returns legacy source path residue, legacy runtime delegation command residue, legacy runtime name residue, empty docs-skills, and guard allowlist entries without matching agent docs as violations. | asset-drift is separate from module-drift but feeds the same finding/back-fill feedback loop; prompt bodies and secrets are not persisted. | U-FR-L1-49 / U-ASSETDRIFT-001..007 |
| `analyzeChangeImpact` | analyzeChangeImpact(input: ChangeImpactInput) => ChangeImpactResult | current change set file paths are supplied. | returns `missingDesign` or `missingTest` when any `src/**` change lacks a design PLAN/doc update or test/test-design update in the same change set. | source changes cannot silently bypass design back-fill or test evidence; documentation-only changes do not require source tests. | U-CHGIMPACT-001..004 |
| `analyzeCodingRules` | analyzeCodingRules(docs: CodingRulesDoc[], policy?: CodingRulesPolicy, workflowDocs?: CodingWorkflowDoc[]) => CodingRulesResult | TypeScript source/test docs, coding-rule SSoT, and workflow placement docs are supplied. | returns violations for explicit `any`, TS/lint suppression comments, TS file names outside kebab-case / kebab-case `.test.ts` / `index.ts`, source functions with more than 3 parameters, empty/rethrow-only catch blocks, module-boundary drift, machine-surface language drift, SSoT policy drift, and missing workflow anchors. | coding rules are requirements-level SSoT and workflow artifact; tests keep no-any/suppression/naming checks, while max-params / structured-error / module-boundary apply to `src/**`; CLI/doctor/lint/gate decision tokens stay ASCII even when surrounding prose is Japanese. | U-CODE-001..010 |
| `analyzeDddTddRules` | analyzeDddTddRules(input: DddTddInputs) => DddTddResult | DDD/TDD rule SSoT, workflow docs, source/test docs, PLAN docs, and L7/L8 test-design docs are supplied. | returns violations for policy drift, workflow anchor drift, domain-boundary imports, invariant oracle gaps, missing Red-first evidence, weak test oracles, and missing integration GWT. | quantitative checks are separated from qualitative review, but freeze-significant points require both test evidence and reviewer evidence. | U-DDDTDD-001..009 / U-FR-L1-50 |

### Cross-Artifact Relation Graph Addendum (A-124/A-125 / PLAN-L6-31)

This addendum is the L6 function-design entry for the cross-artifact graph and verification-profile projection. It closes the design gap exposed by PLAN-RECOVERY-03: relation graph source code is not authorized until these contracts are covered by L7 unit oracles and an L7 implementation PLAN.

| Function | Signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `collectRelationGraphProjection` | collectRelationGraphProjection(input: RelationGraphSourceSet) => RelationGraphProjection | docs, source paths, tests, PLAN metadata, audit records, and verification evidence paths are supplied as text/metadata fixtures; missing optional roots are explicit empty sets. | returns normalized nodes and edges for requirements, PLANs, design docs, test-design docs, source files, tests, DB tables, verification profiles, external tools, diagrams, and findings. | The graph is a rebuildable projection, not an authoring source; projection rows do not copy raw MCP responses, browser traces, screenshots, provider transcripts, secrets, or credentials. | U-RELGRAPH-001..003 |
| `analyzeRelationImpact` | analyzeRelationImpact(input: RelationImpactInput) => RelationImpactResult | changed paths and a graph projection are supplied; changed paths are repo-relative and normalized. | returns directly changed nodes, impacted upstream/downstream nodes, required follow-up actions, and findings for missing design/test/DB/evidence coverage. | A lower-layer change can require reverse/backprop actions; docs-only changes do not require source tests unless the graph marks a behavioral contract. | U-RELGRAPH-004..006 |
| `exportRelationDiagram` | exportRelationDiagram(snapshot: RelationGraphSnapshot, format: "mermaid" \| "dot" \| "d2") => DiagramArtifact | a graph snapshot and requested format are supplied; Mermaid is always available, DOT/D2 are optional adapters gated by installed tooling. | returns deterministic diagram text with stable node IDs and edge labels; unavailable optional adapters return a finding instead of invoking tools implicitly. | Diagram export is evidence for review/handover and must not mutate source docs or DB state. | U-RELGRAPH-007..008 |
| `collectVerificationEvidenceProjection` | collectVerificationEvidenceProjection(input: VerificationEvidenceRecord[]) => VerificationProfileProjection | saved A-125 evidence records from `.ut-tdd/evidence/verification-profiles/*.json` are supplied after schema validation. | returns `verification_profiles`, `verification_recommendations`, `mcp_server_runs`, and `external_tool_findings` projection rows with evidence paths. | External execution remains opt-in; projection stores summaries and classification, not raw external payloads. | U-RELGRAPH-009..010 |

**Required impact classes**:

- source -> sibling test, L6 design contract, L7 oracle, PLAN, and reverse/backprop guard;
- design/test-design -> paired artifact, PLAN DoD, and trace-freeze evidence;
- physical-data / DB projection docs -> DB table nodes, rebuild contract, and upstream requirement/ADR nodes;
- verification-profile evidence -> external-tool profile, MCP server/tooling decision, evidence path, and sanitized finding rows;
- diagram export -> review/handover artifact with stale-source detection.

**Workflow guard**: if `src/**` relation-graph source is created before PLAN-L6-31 has L7 oracle coverage and PLAN-L7-32 has a TDD Red entry, the change is a Recovery event, not a valid implementation shortcut.

### Tool Adapter Probe Addendum (A-124 / PLAN-L6-33)

This addendum defines the L6 contract for optional graph/diagram development-tool adapters. It is separate from the core relation graph collector: adapters can improve evidence quality, but the TypeScript/Bun collector and DB projection remain the source of gate-normalized truth.

| Function | Signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `catalogToolAdapters` | catalogToolAdapters(input: ToolAdapterCatalogInput) => ToolAdapterCatalogResult | researched adapter metadata, package refs, executable names, trigger signals, and output formats are supplied. | returns deterministic adapter profiles for dependency-cruiser, Knip, Madge, Graphviz DOT, Mermaid, and D2. | adapters are optional, disabled until declared/available, and cannot become authoring sources. | U-TOOLADAPTER-001..002 |
| `probeToolAdapter` | probeToolAdapter(input: ToolAdapterProbeInput, deps: ToolAdapterProbeDeps) => ToolAdapterProbeResult | adapter profile, package metadata, executable check, and workspace scope are supplied. | returns readiness checks for package/executable/config/scope without installing or running destructive actions. | missing adapter availability is a finding, not a silent pass or unrelated check failure. | U-TOOLADAPTER-003..005 |
| `normalizeToolAdapterRun` | normalizeToolAdapterRun(input: ToolAdapterRunEvidence) => ToolAdapterProjection | raw adapter evidence path, command, exit code, version, scope, and parsed output summary are supplied. | returns normalized `tool_runs`, `dependency_edges`, `diagram_artifacts`, and `findings` rows. | raw DOT/JSON/SVG/Mermaid/D2 output remains evidence; gates consume normalized projection rows only. | U-TOOLADAPTER-006..008 |
| `planDiagramRefresh` | planDiagramRefresh(input: DiagramRefreshInput) => DiagramRefreshPlan | graph snapshot digest, existing diagram artifacts, requested format, and adapter readiness are supplied. | returns refresh/mark-stale/no-op actions for Mermaid/DOT/D2 diagram artifacts. | stale diagrams cannot be treated as current review evidence. Optional renderer absence returns a finding. | U-TOOLADAPTER-009..010 |

### Coding Rules Addendum

- **coding-rules**: requirements `Coding Rules SSoT` から `src/lint/coding-rules.ts` へ落とす TS core 規約。explicit `any`、TS/lint suppression comment、TS file-name drift、source max-params drift は doctor hard failure。
- **workflow placement**: Forward L6 and Add-feature `add-design` must confirm or update `docs/governance/coding-rules.md` before implementation freeze. The workflow docs carry `CODING-RULE-WORKFLOW` anchors so this is machine-auditable.
- **doctor contract**: `checkCodingRules(repoRoot)` loads `docs/governance/coding-rules.md`, `docs/process/forward/L00-L06-design-phase.md`, `docs/process/modes/add-feature.md`, `docs/process/modes/README.md`, `src/**/*.ts`, and `tests/**/*.ts`; it runs `analyzeCodingRules` and links `ok` to `runDoctor.ok`.
- **error handling**: fail-open is allowed only when a catch block returns/records explicit failure state or documents fail-open intent in-place. Undocumented empty and rethrow-only catch blocks are `structured-error-handling` violations.
- **module boundary**: `lint` must not import runtime/doctor/CLI feature modules, `runtime` must not import governance checks, and `schema` must stay below feature modules. Violations are `module-boundary`.
- **machine-surface language**: machine-facing CLI/doctor/lint/gate/status messages may include Japanese explanation, but their decision token must be stable ASCII English (`OK`, `violation`, `warning`, `skipped`, `note`, `error`, `ready`, `not ready`). Japanese-only decision words in machine message lines are `machine-surface-language` violations. **Impl (2026-06-19、A-141)**: `analyzeCodingRules` の `violatesMachineSurfaceLanguage` が machine-surface 行パターン × 非 ASCII 判定語 × ASCII token 不在で検出し、`describe`/`it`/`test` のタイトル literal は除外 (false-positive 回避)。`REQUIRED_RULE_IDS` + SSoT `coding-rules.md` に `machine-surface-language` を登録。oracle U-CODE-010。実 repo violations 0。
- **scope split**: no-any / no-suppression / file naming apply to source and tests. max-params / structured-error-handling / module-boundary apply only to `src/**`; test helper arity is governed by readability and local test design.

### DDD/TDD Strictness Addendum (FR-L1-50)

- **DDD/TDD rule SSoT**: `docs/governance/ddd-tdd-rules.md` defines rule IDs for `domain-boundary`, `invariant-test-trace`, `red-first-evidence`, `test-oracle-strength`, and `integration-gwt`.
- **workflow placement**: Forward L6, Add-feature, and mode index docs carry `DDD-TDD-WORKFLOW` anchors so rule placement is not left to reviewer memory.
- **quantitative/qualitative split**: `analyzeDddTddRules` provides mechanical evidence before review; gate-significant DDD/TDD decisions still require reviewer evidence, so the two are bundled for freeze readiness rather than collapsed into one signal.
- **unit-oracle-substance (IMP-083 残差、2026-06-19)**: `integration-gwt` が L8 IT-* 行の Given/When/Then 非空を見るのと対に、`unitOracleSubstanceViolations` は **L7 unit test-design の `U-XXX-NNN` 行** (末尾数字必須 = `U-ID` ヘッダ除外) の expected-behavior セルが**実ケース**を持つ (空 / trivial < 6 字 / skeleton marker `-`/TODO/骨格 でない) ことを検査する。pair-freeze (link) / oracle-test-trace (citation) / test-oracle-strength (test コード assert) は U-* 行の**期待結果セル中身**を見ないため、freeze 時の骨格凍結を素通りさせていた穴 (IMP-083) を FR-L1-50 配下で塞ぐ。oracle U-DDDTDD-009。**IMP-082 (descent substance) は別途 IMP-090/092 の `l6-fr-coverage` (FR→L6 type body + pseudocode) で被覆済 = superseded**。
- **doctor contract**: `checkDddTddRules(repoRoot)` loads the SSoT, workflow docs, PLAN docs, L7/L8 test-design docs, and TS source/test files; `runDoctor.ok` fails when DDD/TDD strictness violations exist.

### Impl-Plan-Trace Addendum (IMP-088 / FR-L1-18 descent / PLAN-REVERSE-40)

`module-drift` (src⇔architecture §3.1) と `pair-freeze` (design⇔test-design) はいずれも **PLAN を見ない**ため、「設計 doc に名前が載れば PLAN 無しでも通る」穴 (A-108 orphan の根因) が残る。本 addendum は FR-L1-18 (横断検出・**接続欠損**) の descent として impl→PLAN トレーサビリティを定義する。

| Function | Signature | pre | post | invariant | oracle |
|---|---|---|---|---|---|
| `analyzeImplPlanTrace` | analyzeImplPlanTrace(input: ImplPlanTraceInput) => ImplPlanTraceResult | `src/**.ts` 集合 + PLAN generates/本文に出現した src パス集合 + baseline allowlist が供給される。 | traced でも baseline でもない src を `orphans` に返し、NEW orphan 有無で `ok` を決める。 | baseline は known-debt の段階導入であり**縮小のみ可**。IMP-087 の 4 orphan は baseline でなく PLAN generates への back-fill で trace 解消する。 | U-IPT-001..005 |

- **baseline 根拠**: 2026-06-10 実測 (`find src -name '*.ts'` vs PLAN generates) で 12 孤児。うち 4 (IMP-087: review-tier/rule-drift/team-run/provider-handover) は PLAN-REVERSE-40 generates へ back-fill、残 8 (asset-drift/change-impact/doc-consistency/entity-coverage/g3-trace/improvement-backlog/readability/shared) を baseline。
- **doctor 配線**: `checkImplPlanTrace(repoRoot)` を **hard/fail-close** で配線。CI 回帰網 `U-IPT-004` と doctor の両方で実 repo orphan 0 を維持する。

## §4 doctor 配線 (hard/fail-close)

`checkModuleDrift(repoRoot)` を `runDoctor` に **hard/fail-close** で配線。I/O 失敗は violation として `ok=false` を返し、module-drift があれば `ut-tdd doctor` は失敗する。

## §5 段階導入 / hard 化判断

- **hard 化完了**: A-103 back-fill 後、実 repo 孤児0 (handover/setup/web 列挙済) を確認し、CI 回帰網 (U-MDRIFT-005) と doctor.ok 連動の両方で fail-close する。

## §6 用語更新

- **module-drift**: architecture §3.1 設計 module 集合 ⊇ `src/` 実在 module の包含 drift (impl→design back-fill 漏れ)。asset-drift (内容整合) / dependency-drift (import グラフ) と別検査。
- **change-impact**: `src/**` の差分に対し、同一 change set 内の design PLAN/doc 更新と tests または test-design 更新を要求する修正漏れ検出。semantic な「変更不要」判断は将来の relation-graph/dependency-drift に委ねるが、コード変更が設計・テスト更新なしで通過する穴は doctor で塞ぐ。

## §7 carry

- **hard 化**: 完了。`checkModuleDrift.ok` / `checkImplPlanTrace.ok` は `runDoctor.ok` に連動する。
- **粒度の深化**: 現状 top-level module 集合のみ。Level 2 (代表 module 内部ファイル) 粒度の drift は対象外 (§3.2 は人手)。
- **asset-drift**: `analyzeAssetDrift` (FR-L1-49) is implemented as the current hard gate slice for internal asset cutover. It recursively scans `.claude/agents/*.md`, `.claude/agent-memory/**/*.md`, `docs/skills`, and `docs/templates/prompts/*.md` assets, fails on legacy source personal path residue, legacy runtime delegation command residue, legacy runtime name/env residue, empty `docs/skills`, and guard allowlist entries without matching agent docs. It intentionally does not parse prompt bodies into persistent state; the markdown assets remain the source of truth.
