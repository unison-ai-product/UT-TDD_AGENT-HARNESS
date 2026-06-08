---
layer: L5
sub_doc: physical-data
status: confirmed
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L8
plan: docs/plans/PLAN-L5-01-physical-data.md
v2_import: docs/migration/v2-import-ledger.md
---

> **SSoT 参照**: 論理モデル = [data.md](../L4-basic-design/data.md) (L4) / 実装 enum SSoT = `src/schema/index.ts` / 永続化方針 = file-based (`.ut-tdd/`、YAML+JSON、SQLite 不採用、[ADR-001](../../../adr/ADR-001-ut-tdd-harness-redesign-and-language.md))。本 doc は data.md §8 の論理 state schema を **物理 schema (フィールド型/必須任意/default/file レイアウト)** に詳細化する (D-DB)。
>
> **用語更新 (G.9) / 機能要求更新 (G.10) の所在**: per-工程 delta は生成元 [PLAN-L5-01](../../../plans/PLAN-L5-01-physical-data.md) の §6/§7 に記録 (L4 sub-doc と同規約)。
> **V-pair**: `pair_artifact = L8-integration-test-design.md` は L5 sub-doc 群の集合 pair (PLAN-L5-00-master 経由、L5↔L8)。

# UT-TDD Agent Harness — L5 詳細設計: 物理データ設計 (Physical-Data)

data.md (論理ドメインモデル) の §8 state schema を、`.ut-tdd/` file-based state の **物理 schema** に詳細化する (PLAN-L5-01-physical-data)。各 file は `src/schema` の zod で読込時 validate する。

## §1 state file レイアウト

```
.ut-tdd/
├── plan_registry/<plan_id>.json          # Plan 集約 (本文は docs/plans/*.md)
├── artifact/
│   ├── <artifact_id>.json                # Artifact 集約
│   └── trace/<plan_id>.json              # trace edge list (双方向 12 edge)
├── phase.yaml                            # Workflow 集約 (現工程位置)
├── gate_runs/<gate_id>-<ts>.json         # gate 判定証跡 (append)
├── mode.yaml                             # 実行 mode (値オブジェクト)
├── handover/CURRENT.json                 # Handover 集約 (最新 1 件)
├── audit/
│   ├── failure_log.jsonl                 # 監査 (append-only)
│   ├── agent-invocations/<ts>.json       # agent-guard 記録
│   └── *.jsonl                           # Evaluation (Phase B、invocation_log 等)
└── drive/<drive>/                        # drive 別区画 (FR-L1-40、be/fe/...)
    └── plan_registry/<plan_id>.json      # 区画隔離された Plan state
```

> `<ts>` = ISO8601 timestamp。`.ut-tdd/` の大半は gitignored (runtime state)。本文 doc (`docs/plans/*.md`) は git 追跡、registry JSON は state。

## §2 集約別 物理 schema (JSON フィールド)

### §2.1 Plan (`plan_registry/<plan_id>.json`)

| フィールド | 型 | 必須/任意 | default | 制約 / zod |
|---|---|---|---|---|
| `plan_id` | string | 必須 | — | PlanId パターン (§4)。primary key |
| `title` | string | 必須 | — | 1 文字以上 |
| `kind` | enum | 必須 | — | `kindSchema` (12 種) |
| `layer` | enum | 必須 | — | `layerSchema` (16 種) |
| `sub_doc` | enum\|null | 条件付き | null | design+L1-L6 で必須、`VALID_SUB_DOCS[layer]` (IMP-026) |
| `drive` | enum | 必須 | — | `driveSchema` (9 種) |
| `status` | enum | 必須 | `"draft"` (運用既定) | `statusSchema` (draft/confirmed/completed/archived)。zod `.default("draft")` 追加は L7 carry (§8) |
| `workflow_phase` | enum\|null | 条件付き | null | kind=poc/reverse で必須、`workflowPhaseSchema` (10) |
| `decision_outcome` | enum\|null | 条件付き | null | kind=poc+S4 で必須、`decisionOutcomeSchema` (3) |
| `confirmed_reverse_type` | enum\|null | 条件付き | null | kind=reverse で必須、`reverseTypeSchema` (5) |
| `forward_routing` | enum\|null | 条件付き | null | reverse+R4 で必須、`forwardRoutingSchema` (5) |
| `promotion_strategy` | enum\|null | 条件付き | null | reverse+R4 で必須、`promotionStrategySchema` (4) |
| `agent_slots` | array<{role,slot_label}> | 任意 | `[]` | `agentSlotSchema` = {role:`roleSchema`, slot_label} のみ (frontmatter.ts 実装)。**model フィールドは持たない** — subagent の model 明示は agent-guard (別経路、`.claude/hooks/agent-guard.ts`) が管理。plan_registry に model を二重保存しない |
| `generates` | array<{artifact_path,artifact_type}> | 任意 | `[]` | artifact_type=`artifactTypeSchema` (19) |
| `dependencies` | {parent?,requires[],blocks[]} | 任意 | `{}` | 循環依存禁止 (§7) |
| `carry` | array<string> | 任意 | `[]` | child entity |
| `created`/`updated` | string(date) | 必須 | — | ISO date |

### §2.2 Artifact (`artifact/<artifact_id>.json` + `trace/<plan_id>.json`)

| フィールド | 型 | 必須/任意 | 制約 |
|---|---|---|---|
| `artifact_id` | string | 必須 | primary key |
| `artifact_type` | enum | 必須 | `artifactTypeSchema` (19) |
| `path` | string | 必須 | repo 相対 path |
| `pair_artifact` | string\|null | 任意 | V-model pair (6 組、§7) |
| `trace.edges` | array<{from,to,kind}> | 必須 | 双方向 12 directed edge (G7) |
| `acceptance_criteria` | array<{ac_id,...}> | 任意 | AcId パターン (§4) |
| `acceptance_tests` | array<{at_id,...}> | 任意 | AtId、AC↔AT 被覆 |

### §2.3 Workflow (`phase.yaml` + `gate_runs/`)

| フィールド | 型 | 必須/任意 | 制約 |
|---|---|---|---|
| `current_phase` | enum | 必須 | `layerSchema` (L0-L14) |
| `gates.<gate_id>.status` | enum | 必須 | `pending`/`passed`/`failed`/`bypassed` |
| `gates.<gate_id>.evidence` | string(path) | 任意 | `gate_runs/<gate_id>-<ts>.json` |
| (gate_runs file) `gate_id` | string | 必須 | GateId パターン (§4)。primary key |
| (gate_runs file) `timestamp` | string(ts) | 必須 | ISO8601、ファイル名 `<ts>` と一致 |
| (gate_runs file) `plan_id` | string\|null | 任意 | 関連 Plan への参照 (foreign key) |
| (gate_runs file) `checks` | array<{name,result}> | 必須 | 決定論 check 結果 (FR-05) |

### §2.4 mode (`mode.yaml`、値オブジェクト state)

| フィールド | 型 | 必須/任意 | 制約 |
|---|---|---|---|
| `mode` | enum | 必須 | `orchestrationModeSchema` (`VALID_ORCHESTRATION_MODES` 5 種) |
| `runtime` | object | 任意 | detect 結果 (claude/codex 検出、standalone/claude-only/codex-only/hybrid) |
| `drive` | enum\|null | 任意 | 既定 drive (`driveSchema`) |
| `updated` | string(ts) | 必須 | ISO8601 |

### §2.5 Handover (`handover/CURRENT.json`)

| フィールド | 型 | 必須/任意 | 制約 |
|---|---|---|---|
| `state` | enum | 必須 | `current`/`consumed`/`stale` |
| `next_action` | string | 必須 | — |
| `context` | object | 任意 | session 引継ぎ |
| `created` | string(ts) | 必須 | stale 判定基準 |

### §2.6 Evaluation (`audit/*.jsonl`、Phase B)

| フィールド | 型 | 必須/任意 | 制約 |
|---|---|---|---|
| `batch_id` | string | 必須 | primary key |
| `invocation_log` | array | 任意 | AI 呼び出し記録 (FR-L1-20、append-only) |
| `scores` | object | 任意 | accuracy_score / kpi (Phase B) |

## §3 値オブジェクトの物理表現 + SubDoc zod 化 (IMP-026)

data.md §3 の 12 値オブジェクトは全て **enum string** で物理表現 (JSON では文字列)。

| 値オブジェクト | 物理表現 | src/schema 状態 |
|---|---|---|
| Kind/Layer/Drive/WorkflowPhase/ArtifactType/DecisionOutcome/PromotionStrategy/ForwardRouting/Role/OrchestrationMode/ReverseType | enum string | **実装済** (11 zod enum) |
| Status (lifecycle) | enum string (`VALID_STATUSES` 4 種) | **実装済** (data.md §5 lifecycle の物理) |
| **SubDoc** | enum string (層別) | **未実装 → 本 doc で zod 化を設計 (IMP-026)** |

**SubDoc zod 化方針 (IMP-026 解消設計)** — 値域は **requirements §1.10.G.1 が SSoT** (以下は G.1 verbatim):
```
// src/schema/index.ts へ追加 (L7 実装):
export const VALID_SUB_DOCS = {
  L1: ["business", "functional", "screen", "technical", "nfr"],              // 5
  L2: ["screen-list", "screen-flow", "wireframe", "ui-element"],             // 4
  L3: ["business-requirement", "functional-requirement", "nfr-grade"],       // 3
  L4: ["architecture", "function", "screen", "data", "external-if"],         // 5
  L5: ["internal-processing", "module-decomposition", "physical-data", "if-detail"], // 4
  L6: ["function-spec", "class-design", "edge-case"],                        // 3
} as const;
// subDocSchema = layer に応じた z.enum (frontmatter superRefine で layer×sub_doc 整合)
```
> 値域の SSoT は requirements §1.10.G.1。本 doc は物理化 (zod 定数 + superRefine) を設計し、実装は L7 (`src/schema` 追加 + frontmatter.ts superRefine 拡張)。
> **⚠ 既存 doc との不整合 (IMP-029)**: 実在の L3 sub-doc frontmatter は `sub_doc: functional` / `business-detail` 等で、G.1 spec の `functional-requirement` / `business-requirement` と食い違う。IMP-026 実装時に既存 doc の `sub_doc` 値を G.1 へ正規化するか G.1 を実態へ合わせるかの decision が必要 (本 doc は G.1 を SSoT として記述)。

## §4 ID 採番 / index / 参照整合

| ID 型 | 物理パターン (regex) | 採番 | index |
|---|---|---|---|
| PlanId (**設計仕様**) | `^PLAN-L\d+-\d{2}-[a-z0-9-]+$` (層別) / `^PLAN-\d{3}-[a-z0-9-]+$` (cross) | 起票時 (layer×sub-doc 通し連番) | filename = plan_id |
| FrL1Id | `^FR-L1-\d{2}$` | 要求定義時 | registry 内 key |
| FrId | `^FR-\d{2}$` | L3 詳細化時 | — |
| AcId | `^AC-(FR\|NFR\|UX)-\d{2}-\d{2}$` 等 | AC 設計時 | artifact 内 |
| AtId | `^AT-.+$` | テスト設計時 | artifact 内 |
| ImpId | `^IMP-\d{3}$` | backlog 観測時 | backlog table |
| GateId | `^G\d+(\.\d+)?$` (G0.5-G14) | 固定 | phase.yaml key |

- **参照整合 (物理)**: 集約間は ID 文字列参照のみ (data.md §2)。孤児検出 = 参照先 file/key の存在確認 (`ut-tdd doctor`)。
- **採番衝突防止**: 同一 layer+sub_doc の status∉archived 2 重起票は plan lint で exit 1 (requirements §G.1)。
- **⚠ 実装 regex との乖離 (IMP-004)**: 上記「設計仕様」regex (層別 `PLAN-L\d+-\d{2}-slug`) に対し、`src/schema/frontmatter.ts` の現 `planIdSchema` = `^(PLAN-\d{3}(-[a-z0-9-]+)?|PLAN-MM-\d{3})$` は **3 桁形式のみ**で層別 ID を通さない。現行 PLAN (PLAN-L4-01-data 等) は plan lint 有効化で全件 reject される。**SSoT decision (層別を正本とし frontmatter.ts regex を拡張) を plan-id-schema lint 実装前に確定** (IMP-004、§8 carry)。

## §5 state file ↔ `src/schema` zod 1:1 対応

| state file | zod スキーマ (src/schema) | 検証タイミング |
|---|---|---|
| `plan_registry/*.json` (frontmatter 部) | `frontmatter.ts` (frontmatterBaseSchema + kind 別 superRefine) | PLAN 起票 / lint |
| 各 enum フィールド | `kindSchema`/`layerSchema`/`driveSchema`/... (index.ts、11) | 読込時 |
| sub_doc | `subDocSchema` (**L7 で追加、IMP-026**) | 読込時 (実装後) |
| status | `statusSchema` | 読込時 |
| `gate_runs/*.json` の command | `recommendedCommandV1Schema` | gate 実行時 |

> **読込原則**: state file は読込時に必ず zod で `parse` し、不正な state を早期 fail-close (ADR-001 enum drift 根絶)。書込時は型付きオブジェクト → JSON serialize。

## §6 drive 別区画 (FR-L1-40)

- 物理: `.ut-tdd/drive/<drive>/plan_registry/<plan_id>.json` (`<drive>` ∈ `VALID_DRIVES` 9 種)
- 隔離不変条件: 同一 plan_id が複数 drive 区画に存在 → fail-close (data.md §6、`ut-tdd doctor` 検出)
- `skip_sub_doc` 機械強制: drive×sub_doc 整合 (requirements §G.1: fe/fullstack/agent で L2/L10 skip → exit 1)

## §7 不変条件の物理検証点

| data.md §6 不変条件 | 物理検証点 | 実装 |
|---|---|---|
| 逆ピラミッド禁止 | artifact trace に design+impl あれば test_design+test_code edge 必須 | G6/G7 (trace file 検証) |
| pair = V-model 6 組 | `pair_artifact` ↔ `V_MODEL_PAIRS` 照合 | zod refine (実装済 enum) |
| **ペア未充足 = back-fill 未完の機械検知 (A-84)** | 設計 artifact に対し対のテスト設計 artifact が state に不在、または `placeholder_deps` 未解消 → fail-close。back-fill 完了まで error 継続 (V-model 最終整合=孤児0 を DB 側で保証、人手非依存) | **doctor / vmodel lint (L7)**、FR-L1-49 drift lint も同機構 (IMP-033 rule) |
| kind=poc → S0-S4 ∧ cross | frontmatter superRefine | **実装済** (frontmatter.ts) |
| kind=design+L1-L6 → sub_doc ∈ VALID_SUB_DOCS | superRefine (SubDoc zod 後) | **L7 (IMP-026)** |
| agent_slot.model allowlist | agent-guard (別経路) | **実装済** |
| 集約間参照整合 | doctor check (ID 参照の存在確認) | L7 carry |

> **back-fill の整合保証 (PO 確定 2026-06-01)**: 上位設計 (L4 等) が仕様未確定で対のテスト設計を書けない項目は Artifact に `placeholder_deps` (依存: どの層で何が確定したら書けるか) を持たせる。L6 機能設計で仕様確定 → テスト設計を back-fill → `placeholder_deps` 解消。**未解消の placeholder / pair edge 欠落は doctor が孤児として fail-close**し、V-model 状態が最終的に整う (孤児 0) ことを **DB(state) 側から機械保証**する。「入るべきところが入っていなければ DB 側からも検知」(PO)。`placeholder_deps` フィールドの物理 schema は L7 で zod 化 (§8 carry)。

## §8 carry → L7 実装

- **SubDoc zod 化** (IMP-026): `src/schema/index.ts` に `VALID_SUB_DOCS` + `subDocSchema` 追加、`frontmatter.ts` superRefine 拡張 (layer×sub_doc) + テスト
- **state 読込/書込 module**: `.ut-tdd/` file ↔ zod parse/serialize の実装 (architecture.md runtime/state)
- **doctor check_business_entity_coverage**: state file ↔ src/schema 齟齬検出の実装 (data.md §8 / L1 §10.2 carry)
- **`placeholder_deps` + ペア未充足検知** (A-84、PO back-fill 整合保証): Artifact schema に `placeholder_deps: array<{waiting_layer, waiting_spec}>` を追加し、doctor / vmodel lint で「設計 artifact に対の test_design artifact 不在 or `placeholder_deps` 未解消 → fail-close」を実装。back-fill 完了で解消、V-model 最終整合 (孤児0) を DB 側で機械保証。FR-L1-49 drift lint と同じ IMP-033 rule engine に rule 型として登録。**`waiting_layer` の2類型 (A-85 self-review I-3)**: ① **spec back-fill 型** (`waiting_layer` = 設計層、例 L6) = 対のテスト設計を*書く*のに上位仕様 (関数 signature 等) 確定待ち (例 ST-ASSET-04)。② **実装状態解消型** (`waiting_layer` = L7) = テスト設計は書けているが検証対象の状態が実装/コンテンツ整備で初めて materialize する (例 ST-ASSET-05 skill curate 完了 / ST-ASSET-07 guard→roster 切替)。doctor は両型とも `waiting_layer` 到達まで未充足を fail-close 継続 (L7 は実装層だが「いつまで未充足を許容するか」の境界として有効)
- **物理 schema の object 型詳細** (agent_slots/generates/dependencies の入れ子型) は L7 実装時に zod object で確定
- evaluation_batch (Phase B) の物理 schema は Phase B telemetry 着手時に詳細化
