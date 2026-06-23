---
layer: L4
sub_doc: data
status: confirmed
pair_artifact: docs/test-design/harness/L9-system-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L9
plan: docs/plans/PLAN-L4-01-data.md
v2_import: docs/migration/v2-import-ledger.md
---

> **SSoT 参照**: ユビキタス言語 = [L0 §10 用語集](../../../governance/ut-tdd-agent-harness-concept_v3.1.md) / ドメイン手法 = DDD (Evans) + Design by Contract (Meyer) ([document-system-map](../../../governance/document-system-map.md) §3) / 実装 SSoT = `src/schema/index.ts` (enum)。本 doc は L1 §10.2 carry を詳細化し、用語独自定義は行わない (anti-corruption layer)。

# UT-TDD Agent Harness — L4 基本設計: データ設計 / ドメインモデル

L1 §10.1 の業務 entity を L4 ドメインモデルへ詳細化する (PLAN-L4-01-data)。永続化は `.ut-tdd/` YAML/JSON state と `.ut-tdd/harness.db` SQLite projection DB の二層 (ADR-001)。値オブジェクトは `src/schema/index.ts` の zod enum と 1:1。

## §1 entity 棚卸し (集約ルート / 値オブジェクト / 参照)

| entity | L4 分類 | 所属集約 | 出典 |
|---|---|---|---|
| **plan** | 集約ルート | Plan | L1 §10.1 |
| agent_slot | entity (子) | Plan | L1 §10.1 |
| carry | entity (子) | Plan | L1 §10.1 |
| sprint | entity (子、L7) | Plan | L1 §10.1 |
| **artifact** | 集約ルート | Artifact | L1 §10.1 |
| pair | entity (子) | Artifact | L1 §10.1 |
| trace | entity (子) | Artifact | L1 §10.1 |
| **phase** | 集約ルート | Workflow | L1 §10.1 |
| gate | entity (子) | Workflow | L1 §10.1 |
| mode | 値オブジェクト | Workflow | L1 §10.1 |
| drive | 値オブジェクト | (Plan 属性) | L1 §10.1 |
| **handover** | 集約ルート | Handover | L1 §10.1 |
| acceptance_criterion / acceptance_test | entity (子) | Artifact (trace 経路) | L1 §10.1.1 |
| plan/skill/model/poc_evaluation, ipa_grade, kpi_metric | entity (子) | Evaluation | L1 §10.1.1 |
| evaluation_batch | 集約ルート | Evaluation | L1 §10.1.1 |
| derived_view | 読みモデル (projection) | (CQRS、集約外) | L1 §10.1.1 |
| cutover_command | コマンド (操作) | (集約外) | L1 §10.1.1 |

→ **5 集約** (Plan / Artifact / Workflow / Handover / Evaluation) + 値オブジェクト群 + 読みモデル (derived_view)。

> **内部資産 (roster / skill catalog) の非 entity 判断 (A-90、ADR-004 整合、PO 確定 2026-06-01)**: subagent roster と skill catalog は **data 集約に含めない**。理由: ADR-004 で markdown (`.claude/agents/*.md` / `docs/skills/**/*.md`) を**唯一正本**とし、TS (層2、roster/skills module) は起動時に scan して **in-memory 構築 (scan-on-demand、永続 state なし)** するため、`.ut-tdd/` に独自の永続 entity を持たない。よって **5 集約モデルは不変** (roster/skill は state を持つ entity ではなく、fs 正本に対する読みモデル)。architecture §3.1 roster/skills building block / function §1.1 / L9 ST-ASSET と本判断で整合 (cross-sub-doc 沈黙 gap を解消)。詳細 = §8 state schema / ADR-004 Consequences。

## §2 集約境界 (Aggregate)

| 集約 | ルート | 境界 (含む entity) | トランザクション一貫性単位 |
|---|---|---|---|
| **Plan** | plan | agent_slot / carry / sprint | 1 PLAN 起票・更新は原子的。agent_slot/carry/sprint は plan を介してのみ変更 |
| **Artifact** | artifact | pair / trace / acceptance_criterion / acceptance_test | 4-artifact + trace edge は artifact 集約内で整合 (G7 trace freeze 単位) |
| **Workflow** | phase | gate | 工程位置と gate 判定は同時更新 (phase 遷移 = gate pass) |
| **Handover** | handover | — | session 引き継ぎ 1 レコードで完結 |
| **Evaluation** | evaluation_batch | plan/skill/model/poc_evaluation / ipa_grade / kpi_metric | 1 評価バッチ内で各評価が整合 (Phase B carry) |

> 集約間は **ID 参照のみ** (直接オブジェクト参照禁止、DDD 原則)。例: artifact.pair は plan を ID で参照。
> **acceptance_criterion / acceptance_test の帰属** (business §10.1.1「FR-* 配下」): AC は FR の受入条件、AT はその検証であり、両者は artifact の **trace 経路 (AC↔AT 被覆、g3-trace R3)** で Artifact 集約に紐づく。FR 自体は artifact (要件 doc) の内容であるため、AC/AT を Artifact 集約の子とする。

## §3 値オブジェクト (Value Object) — 12 種 (`src/schema/index.ts` と 1:1、SubDoc は IMP-026 で zod 化済み)

| 値オブジェクト | 値域 | src/schema |
|---|---|---|
| Kind | charter/impl/design/poc/reverse/add-design/add-impl/refactor/retrofit/recovery/troubleshoot/research (12) | `VALID_KINDS` |
| Layer | L0-L14 + cross (16) | `VALID_LAYERS` |
| Drive | be/fe/fullstack/db/agent (5、専門職のみ) | `VALID_DRIVES` |
| WorkflowPhase | S0-S4 (kind=poc) / R0-R4 (kind=reverse) (10) | `VALID_WORKFLOW_PHASES` |
| ArtifactType | 19 種 (source_module 含む) | `VALID_ARTIFACT_TYPES` |
| DecisionOutcome | confirmed/rejected/pivot (3) | `VALID_DECISION_OUTCOMES` |
| PromotionStrategy | reuse-as-is/reuse-with-hardening/redesign/discard (4) | `VALID_PROMOTION_STRATEGIES` |
| ForwardRouting | L1/L3/L4/L5/gap-only (5) | `VALID_FORWARD_ROUTING` |
| Role | po/tl/qa/aim/uiux/se/docs (7) | `VALID_ROLES` |
| OrchestrationMode | pm_lead/claude_judge/claude_judge_codex_impl/codex_impl_qa_verify/claude_design_impl (5) | `VALID_ORCHESTRATION_MODES` |
| ReverseType | code/design/upgrade/normalization/fullback (5) | `VALID_REVERSE_TYPES` |
| SubDoc | 層別 (L1-L6) | `VALID_SUB_DOCS` / `subDocSchema` / `frontmatterSchema` layer×sub_doc superRefine |

> mode / drive は単独の identity を持たず属性として埋め込むため **値オブジェクト** (entity ではない)。
> **Drive 値域整合 (PLAN-L4-06、drift 是正)**: `VALID_DRIVES` は **専門職 5 種のみ** (be/fe/fullstack/db/agent)。旧記載の mode 値 (scrum/reverse/poc/troubleshoot) は **drive ではなく entry mode** であり、`PLAN-DISCOVERY-04 V7 / PLAN-REVERSE-01 R3` で drive enum から除去済 ([[feedback_drive_is_specialist_not_mode]])。drive=専門職 / mode=駆動モデル を混同しない (mode は function §3.1)。
> **SubDoc 注記**: 値域は requirements §1.10.G.1 VALID_SUB_DOCS (text spec) を `src/schema/index.ts` の `VALID_SUB_DOCS` / `subDocSchema` に定数化済み。`frontmatterSchema` は kind=design + L1-L6 の `sub_doc` 必須と layer 別値域を fail-close で検査する。

## §4 entity ID 規約 (集約横断、既存 lint regex と一致)

| ID 型 | 形式 | 検証 lint |
|---|---|---|
| PlanId | `PLAN-L<N>-<NN>-<slug>` (層別) / `PLAN-<NNN>-<slug>` (cross) | (plan-id-schema、IMP-004 第2弾) |
| FrL1Id | `FR-L1-<NN>` | fr-registry / g3-trace |
| FrId (L3) | `FR-<NN>` | g3-trace |
| AcId | `AC-FR-<NN>-<NN>` / `AC-NFR-*` / `AC-UX-*` | g3-trace |
| AtId | `AT-*` | g3-trace |
| NfrId | `NFR-<NN>` (NFR-09/10 欠番) | g3-trace / doc-consistency |
| GateId | `G<N>` (G0.5-G14) | (形式 lint 未実装 → IMP-072 carry。現状 gate **状態遷移** は doctor/plan lint が検証、ID **形式**検証は L5 carry) |
| ImpId | `IMP-<NNN>` | improvement-backlog |

> ID は値オブジェクト (不変・等価性は値で判定)。採番は集約ルート起票時に確定。

## §5 ライフサイクル (集約ルートの状態遷移)

- **plan.status**: `draft → (TL approve) → active → done → archived` (failは archived + carry note)
- **gate**: `pending → pass | fail` (fail → 該当 mode へ routing、FR-L1-08)
- **freeze** (pair/trace): `pending → frozen` (G1/G3/G4/G5/G6 pair、G7 trace)
- **decision_outcome** (poc): `null → confirmed | rejected | pivot` (S4 でのみ確定)
- **handover**: `current → consumed | stale` (CURRENT.json は最新 1 件)

## §6 不変条件 (Invariant = DbC) — 集約ごと

| 集約 | 不変条件 (常に真) | 機械検証 |
|---|---|---|
| Artifact | **逆ピラミッド禁止**: design + impl が存在すれば test_design + test_code も存在 | G6/G7 fail-close |
| Artifact | pair は V-model 6 組のいずれか (L1↔L14/L2↔L10/L3↔L12/L4↔L9/L5↔L8/L6↔L7) | `V_MODEL_PAIRS` |
| Artifact | FR-L1 registry: 参照される FR-L1 ⊆ 登録済 (§1 機能一覧) | fr-registry-audit 型1 |
| Plan | kind=poc → workflow_phase ∈ {S0-S4} ∧ layer=cross | frontmatter superRefine |
| Plan | kind=reverse ∧ R4 → forward_routing ∧ promotion_strategy 必須 | frontmatter superRefine |
| Plan | kind=design ∧ layer∈[L1-L6] → sub_doc 必須 ∧ ∈ VALID_SUB_DOCS[layer] | G.1/G.3 |
| Plan | agent_slot.model ∈ allowlist、opus は pdm-* のみ | agent-guard |
| Workflow | 前工程未完了で後工程着手不可 (V-model 順序、D-03=0) | doctor / plan lint |
| Evaluation | verified 評価は紐付け (実装/A-番号) 必須 | improvement-backlog |
| Plan | confirmed/completed の design/impl/add-* PLAN は **review 前置証跡 (review_evidence) 必須** (review-skip freeze 禁止) | `doctor checkReviewEvidence` (IMP-071、hard/fail-close) |

## §7 集約間整合性ルール

| ルール | 種別 | 内容 |
|---|---|---|
| artifact.trace ↔ plan.generates | immediate | PLAN が generates する artifact は trace に登録 (G7 で双方向 12 edge) |
| pair_artifact 双方向 | immediate | 設計 artifact の pair_artifact と test 設計の pair が相互参照 |
| AC ↔ AT 被覆 | immediate (G3) | 全 AC が AT で被覆 (孤児 0、g3-trace R3) |
| phase ↔ gate | immediate | phase 遷移は対応 gate pass が前提 |
| evaluation → plan/kpi | eventual (Phase B) | 評価バッチは plan 完了後に非同期集計 (FR-L1-19/20、telemetry) |
| derived_view ← 各集約 | eventual | 読みモデル (HM 画面) は集約 state から projection (CQRS) |

## §8 state schema (`.ut-tdd/`) + `src/schema` 突合

| 集約 / 概念 | `.ut-tdd/` 永続化 | 形式 |
|---|---|---|
| Plan | `plan_registry/<plan_id>.json` + 本文 `docs/plans/*.md` | JSON + markdown |
| Artifact / trace | `artifact/` + `artifact/trace/` | JSON (edge list) |
| Workflow (phase/gate) | `phase.yaml` + `gate_runs` | YAML / JSON-lines |
| mode | `mode.yaml` | YAML |
| Handover | `handover/CURRENT.json` | JSON (最新 1 件) |
| Evaluation (Phase B) | `audit/` (invocation_log / accuracy_score / kpi) | JSON-lines |
| 監査 | `audit/failure_log.jsonl` (local) / チーム共有 audit (別経路) | JSON-lines |
| 内部資産 roster / skill catalog | **永続化なし** (`.claude/agents/*.md` / `docs/skills/**/*.md` が唯一正本、TS が scan-on-demand で in-memory 構築) | markdown (fs 正本、ADR-004 層1) |

**src/schema 突合**: 上記値オブジェクト (§3) は `src/schema/index.ts` の zod enum を SSoT とし、state の JSON/YAML は読込時に zod でバリデート。齟齬検出は `ut-tdd doctor check_business_entity_coverage` (L1 §10.2 carry) で機械化。**§3 値オブジェクト 12 種は src/schema enum と 1:1 一致 (齟齬 0)。SubDoc は requirements §1.10.G.1 spec から `VALID_SUB_DOCS` / `subDocSchema` / layer×sub_doc superRefine へ着地済み (IMP-026)**。

### §8.1 SQLite projection DB (`.ut-tdd/harness.db`)

`.ut-tdd/harness.db` は YAML/JSON state と docs を読み込んで正規化する projection DB であり、legacy DB schema は再利用しない。役割は V-model の製本化、別駆動 model の実行結果保存、trace/coverage/finding の横断照合、doctor/vmodel lint の fail-close 入力である。

| table | 役割 |
|---|---|
| `plan_registry` | PLAN frontmatter / status / layer / sub_doc / drive / dependencies の正規化 |
| `artifact_registry` | 設計・実装・テスト設計・テストコード artifact の catalog |
| `model_runs` | Codex / Claude / worker / reviewer など別駆動 model の実行単位と evidence |
| `trace_edges` | V-model 4 artifact + directed edge の照合 |
| `coverage` | trace coverage / test coverage / plan coverage の集計 |
| `findings` | drift / connection deficiency / regression / review finding の保存 |
| `gate_runs` | gate 判定証跡と doctor/vmodel lint 結果 |

不変条件: projection DB は生成 state だが、検出器の機械 SSoT として扱う。入力となる docs/YAML/JSON と projection の齟齬は doctor が finding として出し、silent repair しない。

## §9 carry → L5 詳細設計

- 各集約の **物理 schema 詳細** (JSON フィールド型・必須/任意・default) は L5 physical-data (D-DB) で確定
- **集約ルートの操作 (API)** = Precondition/Postcondition は L5 D-API / internal-processing で DbC 記述 (IMP-014、edge 5-8 docstring)
- evaluation_batch (Phase B) の集計アーキは L4 architecture + Phase B telemetry carry
- **observability 系値オブジェクト候補** (business §10.4、Phase A): `invocation_log` / `detector_result` / `gate_evidence` / `code_catalog` / `command_catalog` の値オブジェクト/state schema を L5 physical-data で確定 (本 doc では entity 追加なし、候補として carry)
- **SubDoc enum 実装** (IMP-026): requirements §1.10.G.1 の VALID_SUB_DOCS は `src/schema` の zod enum と frontmatter superRefine へ実装済み
- **内部資産 (roster/skill) の back-fill 解消** (A-90、L9 ST-ASSET-04 対応): roster/skill は in-memory scan-on-demand で**永続 state なし** (§8、ADR-004) のため data 集約・物理 state schema に**追加なし**と確定。各 subcommand / capability resolver / recommender / drift 判定の**関数仕様**は L6 機能設計で確定済み (`function-spec.md` / `fr-unit-coverage.md` の FR-L1-12, FR-L1-33, FR-L1-34, FR-L1-46〜49)。L5 physical-data で roster/skill の物理 state 追加は不要 (fs 正本)
