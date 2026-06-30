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
| **vmodel** | `src/vmodel/lint.ts` | stub（仮実装） | V-model 4 artifact trace lint |
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

### §2.4 cli / plan / vmodel / doctor の配置
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

## §5 L7 closure module boundary（閉包境界）

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

## Appendix A: L5 内部資産 back-fill 完了 (PLAN-L5-06 / PLAN-L5-07)

### A.1 skill module integration（統合）

PLAN-L5-06 は FR-L1-47 の L5 module-integration slice を close する。

| component | L5 responsibility（責務） | dependency direction（依存方向） | carry |
|---|---|---|---|
| skill catalog | `docs/skills/**/*.md` を layer-1 source document として scan し、in-memory catalog を公開する。永続 `.ut-tdd` state は導入しない。 | `skill -> schema/fs`。runtime/guard から import しない。 | L6 が scorer と injector signature を定義し、L7 が catalog loading を実装する。 |
| recommender | task/layer/drive context から candidate skill を解決し、project state を mutate せず ranked recommendation を返す。 | catalog load 後の pure analyzer。 | L6 が scoring input と deterministic tie-break を定義する。 |
| injector | ADR-004 layer-1/layer-2 separation を維持しながら、runtime prompt 向け layer-scoped injection set を作る。 | catalog/recommender output を消費し、skill source docs は rewrite しない。 | L7 が provider adapter で injection を materialize する。 |

これは second lint/catalog subsystem を作らず、既存の `skill` module stub を具体化する。

### A.2 asset-drift rule integration（統合）

PLAN-L5-07 は FR-L1-49 の L5 module-integration slice を close する。

| integration point（統合点） | L5 contract | carry |
|---|---|---|
| rule registry | `asset-drift` は新しい standalone lint module ではなく、shared rule engine に登録する IMP-033 rule instance とする。 | L6 が predicate signature と regex detail を定義する。 |
| doc registry auto-enroll | `.claude/agents/*.md` と `docs/skills/**/*.md` は、既存 lint module と同じ `loadX -> analyzeX` pattern で discover する。 | L7 が scanner wiring を実装する。 |
| fail-close route | doctor/gate は unresolved asset drift と placeholder dependency gap を non-green validation result として surface する。 | L7 が `runDoctor` と gate check へ接続する。 |
| dependency-drift coexistence | `asset-drift` は ADR-002 dependency-drift と並ぶ。どちらも IMP-033 rule type であり、ownership を重複させない。 | L7 import-map implementation は dependency-drift 配下に残す。 |

これらの追加により、skill と drift asset の L5 integration boundary を完了する。function-level algorithm は L6、implementation state は L7 に残す。

### A.3 descent-obligation module integration（統合） (PLAN-L6-35 / FR-L1-03)

PLAN-L6-35 closes the L5 module-integration slice for FR-L1-03's descent-completeness (抜け漏れ検出). It strengthens the existing `vmodel pair-freeze` (document-driven) into an upstream-driven, absence-detecting check.

| component | L5 responsibility（責務） | dependency direction（依存方向） | carry |
|---|---|---|---|
| descent adjacency matrix | `document-system-map.md §1` (layer × artifact × V-pair) を single machine-readable rule set として materialize する。新しい SSoT は作らず、governance docs から derive する。 | `descent-obligation -> schema/fs`。runtime/guard から import しない。 | L6 が `AdjacencyRule` shape と `condition` semantics を定義する。 |
| obligation generator | upstream requirement + matrix から obligations を drive する (downstream self-declaration には依存しない)。second graph ではなく `relation-graph.ts` node/edge substrate (`requirement`/`design`/`test-design`/`source`/`test`) を reuse する。 | loaded artifacts 上の pure analyzer。relation-graph projection を consume する。 | L6 が `generateObligations` / `analyzeDescentObligations` signatures と DbC を定義する。 |
| defer ledger + impl-ahead | open defers (`explicit_l7_defer` / `placeholder_deps`, physical-data §7) を read し、src-landed + undischarged design/test-design defer を impl-ahead violation として扱う。 | Pure。defers は input であり mutate しない。 | L6 が defer validity と impl-ahead rule を定義し、L7 が `descent_obligations` projection + `runDoctor` を wire する。 |

これは relation-graph substrate を reuse する新しい `lint/descent-obligation` module を具体化する。pair-freeze (document-driven subset になる) や impl-plan-trace (PLAN-ID coverage) は duplicate しない。Function-level algorithm は L6 に残し、lint/projection/doctor wiring は L7 (add-impl, Codex 委譲) とする。

## Appendix B: Harness DB feedback module（feedback モジュール） (PLAN-L5-08)

PLAN-L5-08 は既存 lint/rule module を置き換えず、DB-centered reference-feedback slice を追加する。

| module | path intent（配置意図） | responsibility（責務） | dependency direction（依存方向） |
|---|---|---|---|
| `state-db` | `src/state-db/` | SQLite connection、migration、projection upsert、docs/state/logs からの rebuild。 | `state-db -> schema`。CLI adapter から import しない。 |
| `projection-writer` | `src/state-db/projection-writer.ts` | PLAN、artifact、gate、hook、model、skill、finding record を `harness.db` row へ変換する。 | loader 由来の normalized record を消費し、provider transcript は parse しない。 |
| `search-index` | `src/search/` | `search_index` を維持し、PLAN/artifact/finding/skill/model/session 横断の `ut-tdd find` query を提供する。 | projection DB を読む。rebuild 中のみ loader を呼び出してよい。 |
| `feedback-engine` | `src/feedback/` | repeated finding、unresolved dependency、stale approval、skill firing rate、model selection signal を集約する。 | DB projection を読み `feedback_events` を出す。source doc は mutate しない。 |
| `automation-readiness` | `src/workflow/readiness.ts` | workflow/gate/doctor/CI projection を join し、ready/blocked/human-required automation state を分類する。 | DB projection と gate docs を読む。workflow step は実行しない。 |
| `guardrail-ledger` | `src/guardrail/ledger.ts` | agent-guard、review evidence、escalation、human signoff decision を `guardrail_decisions` へ normalize する。 | policy/evidence を読む。human approval requirement を bypass しない。 |
| `asset-catalog` | `src/assets/catalog.ts` | search/recommendation 向け trigger/capability/drift metadata 付きで skill/roster/command docs を catalog 化する。 | markdown/YAML source を読む。redacted metadata を超えて prompt body は persist しない。 |

boundary rule: lint modules は first-class detector のままにする。DB layer はその outputs を記録・cross-reference するが、projection failure を success 扱いして failed checks を隠してはいけない。
## Appendix B: L5 trace coverage 追補 (descent-obligation)

この L5 module-decomposition sub-doc は、§1-§5 と付録で分解された module の machine-readable な L4->L5 landing point である。各行は existing module boundaries / public IF / carry notes の trace coverage であり、新規 feature scope ではない。

| trace set | L5 受け取り block |
|---|---|
| FR-L1-01 / FR-L1-02 / FR-L1-04 / FR-L1-05 / FR-L1-06 / FR-L1-07 / FR-L1-09 / FR-L1-10 / FR-L1-11 / FR-L1-13 / FR-L1-14 / FR-L1-15 / FR-L1-16 / FR-L1-17 / FR-L1-18 | CLI、schema、lint、runtime、doctor、workflow、guard、recovery module IF boundaries を受け取る |
| FR-L1-23 / FR-L1-24 / FR-L1-25 / FR-L1-26 / FR-L1-27 / FR-L1-29 / FR-L1-30 | scrum/fullback、add-feature、refactor、retrofit、research、screen、frontend workflow module boundaries を受け取る |
| FR-L1-36 / FR-L1-38 / FR-L1-43 / FR-L1-45 / FR-L1-50 | evaluation、model/PoC measurement、doc-review、DDD/TDD strictness module boundaries を受け取る |
| FR-L1-08 / FR-L1-12 / FR-L1-19 / FR-L1-21 / FR-L1-22 / FR-L1-28 | runtime routing、skill injection、learning feedback、test perspective、FE detector、two-stage design module boundaries を受け取る |
| FR-L1-31 / FR-L1-32 / FR-L1-33 / FR-L1-34 / FR-L1-35 | context、folder、asset mapping、integration-map、infrastructure readiness module boundaries を受け取る |
| FR-L1-37 / FR-L1-39 / FR-L1-41 / FR-L1-44 | model recommendation、task classification、drive detection、onboarding module boundaries を受け取る |
