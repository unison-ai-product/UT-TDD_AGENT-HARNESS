---
layer: L5
sub_doc: module-decomposition
status: draft
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
> **W-pair**: `pair_artifact = L8-integration-test-design.md` (L5↔L8 集合 pair、PLAN-L5-00-master 経由)。

# UT-TDD Agent Harness — L5 詳細設計: モジュール分割 (Module-Decomposition)

architecture.md §3 の 7 building block を実装単位のモジュール (関数群・公開 IF) に詳細化する (PLAN-L5-02)。export は `src/` の実装と 1:1、未実装 module は責務境界のみ定義。

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
| **workflow** | (未実装) | — | 11 mode workflow エンジン (function §3) |
| **session** | (未実装) | — | Handover 操作 (function §4、L6 carry IMP-019) |
| **telemetry** | (未実装) | — | Evaluation 集計 (Phase B、function §5) |
| **hook** | (未実装、agent-guard 除く) | — | 5 イベント hook (function §4) |
| **review** | (未実装) | — | doc-reviewer 召喚 (FR-45) |
| **skill** | (未実装) | — | L 別 skill 注入 (FR-12) |
| **cutover** | (未実装) | — | ロールバック (FR-10/26) |
| **adapter** | (未実装) | — | 外部 service 隔離 (external-if §6) |

## §2 各 module の内部関数群 (実装済 = 実 export、1:1)

### §2.1 schema (安定核、依存末端)
- `index.ts`: 11 enum 定数 + schema (`kindSchema`/`layerSchema`/`driveSchema`/`statusSchema`/`roleSchema`/`workflowPhaseSchema`/`decisionOutcomeSchema`/`reverseTypeSchema`/`forwardRoutingSchema`/`promotionStrategySchema`/`artifactTypeSchema`/`orchestrationModeSchema`) + `W_MODEL_PAIRS` + `recommendedCommandV1Schema` + 型 export
- `frontmatter.ts`: `planIdSchema` / `agentSlotSchema` / `generatesEntrySchema` / `dependenciesSchema` / `frontmatterBaseSchema` / `frontmatterSchema` (superRefine) / `Frontmatter` 型
- **carry**: `subDocSchema` 追加 (IMP-026) / `planIdSchema` 層別 regex 拡張 (IMP-004)

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

## §5 未実装 module の責務境界

| module | 責務 | 配置依存 | carry |
|---|---|---|---|
| workflow | 11 mode の phase 遷移エンジン (function §3) | schema (Workflow 集約) | L6 pseudocode (IMP-019) |
| session | Handover CURRENT.json 操作 + stale 判定 | schema (Handover) | L6 |
| telemetry | Evaluation 集計 (invocation_log/score) | schema (Evaluation) | Phase B |
| hook | 5 イベント hook (state 自動登録) | runtime/state | L7 + CLI 整備後 |
| review | doc-reviewer 召喚 (FR-45) | adapter | L7 |
| skill | L 別 skill 注入 (FR-12) | schema | L7 |
| cutover | ロールバック (FR-10/26、CLI のみ S5=b) | state | L7 |
| adapter | 外部 service 隔離 (Claude/Codex/gh、external-if §6) | (外部 SDK 隔離) | L7 + if-detail (PLAN-L5-04) |

> 未実装 module は責務境界のみ確定。内部関数は L6 機能設計 / L7 実装で展開。

## §6 lint 共通様式の module 構造

5 lint は共通テンプレート: `HERE = dirname(fileURLToPath(import.meta.url))` → `loadX()` (repo doc を fs 読込) → `analyzeX(docs?)` (pure、docs 注入でテスト) → result object (`{orphans[], totals}`)。テストは `orphans === []` + `totals > 0` (非空虚) を assert。新 lint (plan-id-schema [IMP-004] / doc-consistency 第2弾 [IMP-001/002] / glossary-delta [G.9]) も同様式で追加。

## §7 ADR-002 候補 (依存方向ルール、G4 escalation ①)

| 論点 | 内容 | 判断 |
|---|---|---|
| ADR-002 化 | §4 依存方向ルール (schema 安定核 + 循環禁止 + fs 隔離) を ADR 化するか | **PO/TL 判断 (G5 前)**。本 doc (§4) が設計根拠として先行文書化済、ADR 化しない場合は §4 が正本 (architecture §7 と整合) |

> ADR-003 候補 (adapter 境界) は if-detail (PLAN-L5-04) で扱う。

## §8 carry → L6 機能設計 / L7 実装

- 各 module 内部関数の **アルゴリズム / pseudocode** = L6 機能設計 (IEEE 1016 §5.7、IMP-019)
- 公開関数の **DbC pre/post** = internal-processing (PLAN-L5-03、IMP-014)
- **未実装 module 実装** (workflow/session/telemetry/hook/review/skill/cutover/adapter) = L7
- **schema 拡張**: `subDocSchema` (IMP-026) / `planIdSchema` 層別 regex (IMP-004) = L7
- **dependency lint** (循環検出 + schema 一方向保証) = L7 (knip 候補)
