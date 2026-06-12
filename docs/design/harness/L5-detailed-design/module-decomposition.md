---
layer: L5
sub_doc: module-decomposition
status: confirmed
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L8
plan: docs/plans/PLAN-L5-02-module-decomposition.md
v2_import: docs/migration/v2-import-ledger.md
---

> **SSoT 参照**: 方式 (Level 1/2 building block) = [architecture.md](../L4-basic-design/architecture.md) §3 / 実装 = `src/` / state 操作対象 = [physical-data.md](./physical-data.md)。本 doc は architecture §3 の 7 building block を **実装単位の関数群・公開 IF・依存方向**に詳細化する (arc42 §5 Level 2 / IEEE 1016 §5)。
>
> **用語更新 (G.9) / 機能要求更新 (G.10) の所在**: per-工程 delta は生成元 [PLAN-L5-02](../../../plans/PLAN-L5-02-module-decomposition.md) の §6/§7 に記録。
> **V-pair**: `pair_artifact = L8-integration-test-design.md` (L5↔L8 集合 pair、PLAN-L5-00-master 経由)。

# UT-TDD Agent Harness — L5 詳細設計: モジュール分割 (Module-Decomposition)

architecture.md §3 の 7 building block を実装単位のモジュール (関数群・公開 IF) に詳細化する (PLAN-L5-02)。export は `src/` の実装と 1:1、L7 完遂時点の module surface は下表の実装証跡へ着地済み。

## §1 module インベントリ

| module | path | 実装状態 | 責務 (architecture §3) |
|---|---|---|---|
| **cli** | `src/cli.ts` | 実装済 (scaffold) | コマンドディスパッチ + 副作用端点 |
| **schema** | `src/schema/index.ts` + `frontmatter.ts` | 実装済 | enum/契約の単一正本 (安定核) |
| **lint** | `src/lint/*.ts` (5 file) | 実装済 | doc/PLAN/trace 静的検証 |
| **plan** | `src/plan/lint.ts` | stub | PLAN lint |
| **vmodel** | `src/vmodel/lint.ts` | stub | V-model 4 artifact trace lint |
| **runtime** | `src/runtime/detect.ts` + `agent-guard.ts` | 実装済 | mode 検出 + agent-guard 判定 |
| **doctor** | `src/doctor/index.ts` | 実装済 (scaffold) | 統合検証集約 |
| **workflow** | `src/workflow/contracts.ts` + `src/workflow/readiness.ts` | 実装済 | 11 mode workflow エンジン (function §3) |
| **session** | `src/handover/` + `src/runtime/session-log.ts` | 実装済 | Handover 操作 (function §4、L6 carry IMP-019) |
| **telemetry** | `src/feedback/engine.ts` + `src/state-db/projection-writer.ts` | 実装済 (Phase B web 集約は別範囲) | Evaluation 集計 (Phase B、function §5) |
| **hook** | `src/runtime/session-log.ts` + `src/runtime/agent-slots.ts` | 実装済 | 5 イベント hook (function §4) |
| **review** | `ut-tdd review --uncommitted` + `src/lint/review-evidence.ts` | 実装済 | doc-reviewer 召喚 (FR-45) |
| **skill** | `src/skills/recommend.ts` + `src/workflow/contracts.ts#suggestSkillInjection` | 実装済 | L 別 skill 注入 (FR-12) |
| **roster** | `src/runtime/agent-slots.ts#resolveRosterCapability` + `src/lint/asset-drift.ts` | 実装済 | 内部資産 subagent registry + capability/model 解決 + guard allowlist 整合 (FR-L1-46/48) |
| **cutover** | `ut-tdd cutover --to --dry-run` | 実装済 (approval gate) | ロールバック (FR-10/26) |
| **adapter** | `src/runtime/adapter.ts` + `src/runtime/provider-handover.ts` | 実装済 | 外部 service 隔離 (external-if §6) |

## §2 各 module の内部関数群 (実装済 = 実 export、1:1)

### §2.1 schema (安定核、依存末端)
- `index.ts`: 11 enum 定数 + schema (`kindSchema`/`layerSchema`/`driveSchema`/`statusSchema`/`roleSchema`/`workflowPhaseSchema`/`decisionOutcomeSchema`/`reverseTypeSchema`/`forwardRoutingSchema`/`promotionStrategySchema`/`artifactTypeSchema`/`orchestrationModeSchema`) + `V_MODEL_PAIRS` + `recommendedCommandV1Schema` + 型 export
- `frontmatter.ts`: `planIdSchema` / `agentSlotSchema` / `generatesEntrySchema` / `dependenciesSchema` / `frontmatterBaseSchema` / `frontmatterSchema` (superRefine) / `Frontmatter` 型
- **schema status**: `subDocSchema` (IMP-026) / `planIdSchema` 層別 regex (IMP-004) は `src/schema` に実装済み

### §2.2 lint (共通様式 = `loadX`/`analyzeX(docs?)`/extractor)
| lint module | 公開 IF (export) |
|---|---|
| `g3-trace.ts` | `loadDocs` / `extractFrL1Ids` / `extractL3FrIds` / `extractAcIds` / `extractAtIds` / `extractL1NfrIds` / `extractL3NfrIds` / `extractL3CarryFrL1Ids` / `analyzeG3Trace` / `G3TraceResult` |
| `entity-coverage.ts` | `loadBusiness` / `extractPrimaryEntities` / `extractL3DerivedEntities` / `analyzeEntityCoverage` / `EntityCoverageResult` |
| `fr-registry-audit.ts` | `loadFrDocs` / `parseFrRows` / `extractReferencedFrL1Nums` / `extractExplainedGapNums` / `extractDeclaredCounts` / `analyzeFrRegistry` (+ 4 interface) |
| `doc-consistency.ts` | `loadDocConsistencyDocs` / `expandFrL1Refs` / `checkCarryConsistency` / `checkScreenIdValidity` / `checkNfrCount` / `analyzeDocConsistency` (+ 2 interface) |
| `improvement-backlog.ts` | `VALID_STATUS` / `VALID_CANDIDATE` / `loadBacklog` / `parseBacklogEntries` / `analyzeImprovementBacklog` (+ 2 interface) |

### §2.3 runtime
- `detect.ts`: `ExecutionMode` 型 / `RuntimeDetection` interface / `detectMode()` (binary+probe+env → mode)
- `agent-guard.ts`: `ModelFamily`/`ResolvedFamily` 型 / `AgentGuardContext`/`GuardDecision` interface / `normalizeModelFamily()` / `evaluateAgentGuard()` (判定本体、fail-close)

### §2.4 cli / plan / vmodel / doctor
- `cli.ts`: `program` (commander)。action は runtime/doctor/plan/vmodel を呼ぶ薄い dispatcher
- `plan/lint.ts`: `LintResult` interface / `lintPlan(path?)` (stub → schema frontmatter validate を実装)
- `vmodel/lint.ts`: `lintVmodel(path?)` (stub → 4 artifact trace を実装)
- `doctor/index.ts`: `runDoctor()` (lint 群 + state 突合を集約)

## §3 公開 IF (signature 概要)

| module | 代表公開関数 | signature 概要 (詳細型は L6/L7) |
|---|---|---|
| lint (各) | `analyzeX(docs?: Source): Result` | docs 注入可 (pure)、result = `{orphans[], totals}` |
| lint (各) | `loadX(): Source` | fs 読込 (副作用端点) |
| runtime | `detectMode(): RuntimeDetection` | env/binary から mode |
| runtime | `evaluateAgentGuard(input, ctx): GuardDecision` | allowlist/model 判定 |
| plan/vmodel | `lintX(path?): LintResult` | `{ok, messages[]}` |
| doctor | `runDoctor(): LintResult` | 集約 |

> 詳細な引数/戻り値の DbC (pre/post) は internal-processing (PLAN-L5-03) で記述。

## §4 依存方向の物理保証

- **一方向**: cli/doctor → (plan/vmodel/lint/runtime) → schema。schema は何も import しない (安定核)
- **循環禁止**: import グラフに循環なし (D-03=0)。`ut-tdd vmodel lint` / dependency lint (knip 候補、L3 §7.1) で機械検証 carry
- **fs 隔離**: lint の `loadX()` が fs 読込端点、`analyzeX(docs?)` は pure (テスト注入可)。fs は依存方向ルール対象外 (architecture §3 注記)
- **副作用端点**: cli (stdout/exitCode) と hook のみが副作用を持つ。core ロジックは純粋関数

## §5 L7 closure module boundary

| module | 責務 | 配置依存 | carry |
|---|---|---|---|
| workflow | 11 mode の phase 遷移エンジン (function §3) | schema (Workflow 集約) | L6 pseudocode (IMP-019) |
| session | Handover CURRENT.json 操作 + stale 判定 | schema (Handover) | L6 |
| telemetry | Evaluation 集計 (invocation_log/score) | schema (Evaluation) | Phase B |
| hook | 5 イベント hook (state 自動登録) | runtime/state | L7 + CLI 整備後 |
| review | doc-reviewer 召喚 (FR-45) | adapter | L7 |
| skill | L 別 skill 注入 (FR-12) | schema | L7 |
| roster | 内部資産 subagent registry: **scan→registry** (`.claude/agents/*.md` を in-memory scan、永続なし fs 正本、ADR-004) → **capability/model resolve** → **guard allowlist 整合** (`roster check` の核)。確定設計 (PLAN-DISCOVERY-02 Discovery confirmed): **ID = filename stem** (agent-guard の `.claude/agents/<id>.md` 解決単位に一致)、**capability class ⊥ model family** (直交、pmo class 内に haiku/sonnet 混在)、filename↔frontmatter `name` 不一致は **nameMismatch WARN** | schema/fs (一方向)。`runtime(guard) → roster` 参照 (循環なし、移行段階は guard ハードコード維持) | L6 (関数 signature / capability resolver アルゴリズム / frontmatter parse の zod 化 / agents dir パス解決) + L7 実装。PLAN-L5-05 / PLAN-DISCOVERY-02 |
| cutover | ロールバック (FR-10/26、CLI のみ S5=b) | state | L7 |
| adapter | 外部 service 隔離 (Claude/Codex/gh、external-if §6) | (外部 SDK 隔離) | L7 + if-detail (PLAN-L5-04) |

> L7 closure module boundary は上表の実装証跡で閉じる。追加の UI / web projection / external adapter 実適用は Phase B または human-approved runbook の範囲であり、L7 完遂の隠れ carry として扱わない。
> **roster の依存方向 (確定設計)**: `roster → schema/fs` の一方向のみ、roster は runtime/guard を import しない (循環 0)。guard 側の整合は `runtime → roster` の向きで扱い、L7 実装証跡は `src/runtime/agent-slots.ts#resolveRosterCapability`、`src/lint/asset-drift.ts`、`src/lint/placeholder-deps.ts` に置く。spike による実証経緯は PLAN-DISCOVERY-02 §5 (使い捨て、本設計書には残さない)。

## §6 lint 共通様式の module 構造

5 lint は共通テンプレート: `HERE = dirname(fileURLToPath(import.meta.url))` → `loadX()` (repo doc を fs 読込) → `analyzeX(docs?)` (pure、docs 注入でテスト) → result object (`{orphans[], totals}`)。テストは `orphans === []` + `totals > 0` (非空虚) を assert。新 lint (plan-id-schema [IMP-004] / doc-consistency 第2弾 [IMP-001/002] / glossary-delta [G.9]) も同様式で追加。

## §7 ADR-002 候補 (依存方向ルール、G4 escalation ①)

| 論点 | 内容 | 判断 |
|---|---|---|
| ADR-002 | §4 依存方向ルール (schema 安定核 + 循環禁止 + fs 隔離) | **採択済 ([ADR-002](../../../adr/ADR-002-dependency-direction-and-auto-map.md)、PO 承認 2026-05-29)**。加えて **依存マップ自動生成 + 構想 vs 実装 drift lint** を機能化 (IMP-032)。本 doc §4 + architecture §3 が「期待依存マップ」の設計根拠 |

> ADR-003 (adapter 境界) は if-detail (PLAN-L5-04) で扱う (採択済)。
> **依存マップ drift 機能 (ADR-002 / IMP-032)**: 実 import グラフを生成し §4 の期待依存と照合、循環/逆依存/想定外 edge を fail-close。L7 で `knip`/`madge` 流用実装。

## §8 carry → L6 機能設計 / L7 実装

- 各 module 内部関数の **アルゴリズム / pseudocode** = L6 機能設計 (IEEE 1016 §5.7、IMP-019)
- 公開関数の **DbC pre/post** = internal-processing (PLAN-L5-03、IMP-014)
- **L7 module 実装証跡** (workflow/session/telemetry/hook/review/skill/cutover/adapter) = `src/workflow/`、`src/handover/`、`src/runtime/`、`src/feedback/`、`src/skills/`、`src/assets/`、CLI surface、doctor hard gates
- **schema 拡張**: `subDocSchema` (IMP-026) / `planIdSchema` 層別 regex (IMP-004) = 実装済み
- **dependency lint** (循環検出 + schema 一方向保証) = L7 (knip 候補)

## Appendix A: L5 internal asset back-fill completion (PLAN-L5-06 / PLAN-L5-07)

### A.1 skill module integration

PLAN-L5-06 closes the L5 module-integration slice for FR-L1-47.

| component | L5 responsibility | dependency direction | carry |
|---|---|---|---|
| skill catalog | Scan `docs/skills/**/*.md` as layer-1 source documents and expose an in-memory catalog; no persistent `.ut-tdd` state is introduced. | `skill -> schema/fs`; no import from runtime/guard. | L6 defines scorer and injector signatures; L7 implements catalog loading. |
| recommender | Resolve candidate skills from task/layer/drive context and return ranked recommendations without mutating project state. | Pure analyzer after catalog load. | L6 defines scoring inputs and deterministic tie-breaks. |
| injector | Produce layer-scoped injection sets for runtime prompts while preserving ADR-004 layer-1/layer-2 separation. | Consumes catalog/recommender output; does not rewrite skill source docs. | L7 materializes injection in provider adapters. |

This concretizes the existing `skill` module stub without creating a second lint or catalog subsystem.

### A.2 asset-drift rule integration

PLAN-L5-07 closes the L5 module-integration slice for FR-L1-49.

| integration point | L5 contract | carry |
|---|---|---|
| rule registry | `asset-drift` is an IMP-033 rule instance registered in the shared rule engine, not a new standalone lint module. | L6 defines predicate signatures and regex details. |
| doc registry auto-enroll | `.claude/agents/*.md` and `docs/skills/**/*.md` are discovered through the same `loadX -> analyzeX` pattern used by existing lint modules. | L7 implements scanner wiring. |
| fail-close route | doctor/gate surfaces unresolved asset drift and placeholder dependency gaps as non-green validation results. | L7 connects to `runDoctor` and gate checks. |
| dependency-drift coexistence | `asset-drift` sits beside ADR-002 dependency-drift; both are IMP-033 rule types and must not duplicate ownership. | L7 import-map implementation remains under dependency-drift. |

These additions complete the L5 integration boundary for skill and drift assets while leaving function-level algorithms to L6 and implementation state to L7.

### A.3 descent-obligation module integration (PLAN-L6-35 / FR-L1-03)

PLAN-L6-35 closes the L5 module-integration slice for FR-L1-03's descent-completeness (抜け漏れ検出). It strengthens the existing `vmodel pair-freeze` (document-driven) into an upstream-driven, absence-detecting check.

| component | L5 responsibility | dependency direction | carry |
|---|---|---|---|
| descent adjacency matrix | Materialize `document-system-map.md §1` (layer × artifact × V-pair) as a single machine-readable rule set; no new SSoT, it derives from governance docs. | `descent-obligation -> schema/fs`; no import from runtime/guard. | L6 defines `AdjacencyRule` shape and `condition` semantics. |
| obligation generator | Drive obligations from upstream requirement + matrix (not from downstream self-declaration); reuse `relation-graph.ts` node/edge substrate (`requirement`/`design`/`test-design`/`source`/`test`) rather than a second graph. | Pure analyzer over loaded artifacts; consumes relation-graph projection. | L6 defines `generateObligations` / `analyzeDescentObligations` signatures and DbC. |
| defer ledger + impl-ahead | Read open defers (`explicit_l7_defer` / `placeholder_deps`, physical-data §7); treat src-landed + undischarged design/test-design defer as an impl-ahead violation. | Pure; defers are an input, not mutated. | L6 defines defer validity and impl-ahead rule; L7 wires `descent_obligations` projection + `runDoctor`. |

This concretizes a new `lint/descent-obligation` module reusing the relation-graph substrate; it does not duplicate pair-freeze (which becomes the document-driven subset) or impl-plan-trace (PLAN-ID coverage). Function-level algorithms stay in L6; lint/projection/doctor wiring is L7 (add-impl, Codex 委譲).

## Appendix B: Harness DB Feedback Modules (PLAN-L5-08)

PLAN-L5-08 adds a DB-centered reference-feedback slice without replacing the existing lint/rule modules.

| module | path intent | responsibility | dependency direction |
|---|---|---|---|
| `state-db` | `src/state-db/` | SQLite connection, migration, projection upsert, rebuild from docs/state/logs. | `state-db -> schema`; no import from CLI adapters. |
| `projection-writer` | `src/state-db/projection-writer.ts` | Convert PLAN, artifact, gate, hook, model, skill, and finding records into `harness.db` rows. | Consumes normalized records from loaders; does not parse provider transcripts. |
| `search-index` | `src/search/` | Maintain `search_index` and serve `ut-tdd find` queries across PLAN/artifact/finding/skill/model/session. | Reads projection DB; may call loaders only during rebuild. |
| `feedback-engine` | `src/feedback/` | Aggregate repeated findings, unresolved dependencies, stale approvals, skill firing rates, and model selection signals. | Reads DB projections and emits `feedback_events`; does not mutate source docs. |
| `automation-readiness` | `src/workflow/readiness.ts` | Join workflow/gate/doctor/CI projections and classify ready/blocked/human-required automation states. | Reads DB projections and gate docs; does not execute workflow steps. |
| `guardrail-ledger` | `src/guardrail/ledger.ts` | Normalize agent-guard, review evidence, escalation, and human signoff decisions into `guardrail_decisions`. | Reads policy/evidence; never bypasses human approval requirements. |
| `asset-catalog` | `src/assets/catalog.ts` | Catalog skill/roster/command docs with trigger/capability/drift metadata for search and recommendation. | Reads markdown/YAML sources; does not persist prompt bodies beyond redacted metadata. |

Boundary rule: lint modules remain the first-class detectors. The DB layer records and cross-references their outputs; it does not hide failed checks by treating projection failure as success.
## Appendix B: L5 trace coverage addendum (descent-obligation)

This L5 module-decomposition sub-doc is the machine-readable L4->L5 landing point for modules that are decomposed in §1-§5 and their appendices. The rows are trace coverage for existing module boundaries / public IF / carry notes, not new feature scope.

| trace set | L5 receiving block |
|---|---|
| FR-L1-01 / FR-L1-02 / FR-L1-04 / FR-L1-05 / FR-L1-06 / FR-L1-07 / FR-L1-09 / FR-L1-10 / FR-L1-11 / FR-L1-13 / FR-L1-14 / FR-L1-15 / FR-L1-16 / FR-L1-17 / FR-L1-18 | CLI, schema, lint, runtime, doctor, workflow, guard, and recovery module IF boundaries |
| FR-L1-23 / FR-L1-24 / FR-L1-25 / FR-L1-26 / FR-L1-27 / FR-L1-29 / FR-L1-30 | scrum/fullback, add-feature, refactor, retrofit, research, screen, and frontend workflow module boundaries |
| FR-L1-36 / FR-L1-38 / FR-L1-43 / FR-L1-45 / FR-L1-50 | evaluation, model/PoC measurement, doc-review, and DDD/TDD strictness module boundaries |
| FR-L1-08 / FR-L1-12 / FR-L1-19 / FR-L1-21 / FR-L1-22 / FR-L1-28 | runtime routing, skill injection, learning feedback, test perspective, FE detector, and two-stage design module boundaries |
| FR-L1-31 / FR-L1-32 / FR-L1-33 / FR-L1-34 / FR-L1-35 | context, folder, asset mapping, integration-map, and infrastructure readiness module boundaries |
| FR-L1-37 / FR-L1-39 / FR-L1-41 / FR-L1-44 | model recommendation, task classification, drive detection, and onboarding module boundaries |
