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

> **SSoT 参照**: 論理モデル = [data.md](../L4-basic-design/data.md) (L4) / 実装 enum SSoT = `src/schema/index.ts` / 永続化方針 = `.ut-tdd/` YAML/JSON state + `.ut-tdd/harness.db` SQLite projection DB ([ADR-001](../../../adr/ADR-001-ut-tdd-harness-redesign-and-language.md))。本 doc は data.md §8 の論理 state schema を **物理 schema (フィールド型/必須任意/default/file レイアウト + projection table)** に詳細化する (D-DB)。
>
> **用語更新 (G.9) / 機能要求更新 (G.10) の所在**: per-工程 delta は生成元 [PLAN-L5-01](../../../plans/PLAN-L5-01-physical-data.md) の §6/§7 に記録 (L4 sub-doc と同規約)。
> **V-pair**: `pair_artifact = L8-integration-test-design.md` は L5 sub-doc 群の集合 pair (PLAN-L5-00-master 経由、L5↔L8)。

# UT-TDD Agent Harness — L5 詳細設計: 物理データ設計 (Physical-Data)

data.md (論理ドメインモデル) の §8 state schema を、`.ut-tdd/` YAML/JSON state と `.ut-tdd/harness.db` SQLite projection DB の **物理 schema** に詳細化する (PLAN-L5-01-physical-data)。各 file は `src/schema` の zod で読込時 validate し、projection DB は V-model 製本・別駆動 model run・trace/coverage/finding 照合に使う。

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
| `drive` | enum | 必須 | — | `driveSchema` (5 種、専門職のみ: be/fe/fullstack/db/agent。mode 値除去済 = PLAN-DISCOVERY-04 V7 / PLAN-REVERSE-01 R3。SSoT = data.md §3 / `src/schema/index.ts`) |
| `status` | enum | 省略可 | `"draft"` (運用既定) | `statusSchema.default("draft")` (draft/confirmed/completed/archived) |
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

### §2.7 SQLite projection DB (`harness.db`)

`harness.db` は legacy DB schema を流用せず、YAML/JSON state と docs を正規化して V-model feedback loop に使う projection DB。Bun runtime では `bun:sqlite` を第一候補とし、Node 互換が必要な adapter のみ `better-sqlite3` を検討する。

| table | primary key | 主な列 | 入力 |
|---|---|---|---|
| `plan_registry` | `plan_id` | `kind`, `layer`, `sub_doc`, `drive`, `status`, `parent`, `updated_at`, `decision_outcome`, `source_hash` | `docs/plans/*.md`, `.ut-tdd/plan_registry/*.json` |
| `artifact_registry` | `artifact_id` | `artifact_type`, `path`, `pair_artifact`, `status`, `updated_at` | docs/test-design, source catalog, trace state |
| `model_runs` | `run_id` | `runtime`, `model`, `role`, `drive`, `plan_id`, `started_at`, `completed_at`, `evidence_path` | Codex / Claude / worker / reviewer execution evidence |
| `trace_edges` | `edge_id` | `from_artifact`, `to_artifact`, `edge_kind`, `plan_id`, `status` | artifact trace state |
| `coverage` | `coverage_id` | `scope`, `subject_id`, `metric`, `value`, `threshold`, `status` | test coverage / trace coverage / plan coverage |
| `findings` | `finding_id` | `kind`, `severity`, `subject_id`, `source`, `status`, `evidence_path` | doctor / vmodel lint / review findings |
| `gate_runs` | `gate_run_id` | `gate_id`, `plan_id`, `status`, `checked_at`, `evidence_path` | `.ut-tdd/gate_runs/*.json`, CI evidence |

物理不変条件: `trace_edges` の orphan 0、`coverage.status=fail` の gate fail-close、`findings.status=open` の severity 別 gate 判定、`model_runs.plan_id` と `plan_registry.plan_id` の参照整合を doctor / vmodel lint が検証する。`plan_registry.source_hash` は PLAN markdown 全文の sha256 で、persisted `harness.db` と現在の `docs/plans/*.md` の fingerprint 不一致は `drive-db-registration` hard gate で stale として扱う。projection は自動生成だが、検出対象の機械 SSoT として扱い、入力 state との不一致は `findings` に保存する。

## §3 値オブジェクトの物理表現 + SubDoc zod 化 (IMP-026)

data.md §3 の 12 値オブジェクトは全て **enum string** で物理表現 (JSON では文字列)。

| 値オブジェクト | 物理表現 | src/schema 状態 |
|---|---|---|
| Kind/Layer/Drive/WorkflowPhase/ArtifactType/DecisionOutcome/PromotionStrategy/ForwardRouting/Role/OrchestrationMode/ReverseType | enum string | **実装済** (11 zod enum) |
| Status (lifecycle) | enum string (`VALID_STATUSES` 4 種) | **実装済** (data.md §5 lifecycle の物理) |
| **SubDoc** | enum string (層別) | **実装済** (`VALID_SUB_DOCS` / `subDocSchema` / layer×sub_doc superRefine、IMP-026) |

**SubDoc zod 化方針 (IMP-026 解消済み)** — 値域は **requirements §1.10.G.1 が SSoT** で、`src/schema/index.ts` / `src/schema/frontmatter.ts` に実装済み:
```
// src/schema/index.ts:
export const VALID_SUB_DOCS = {
  L1: ["business", "functional", "screen", "technical", "nfr"],              // 5
  L2: ["screen-list", "screen-flow", "wireframe", "ui-element"],             // 4
  L3: ["business-requirement", "functional-requirement", "nfr-grade"],       // 3
  L4: ["architecture", "function", "screen", "data", "external-if"],         // 5
  L5: ["internal-processing", "module-decomposition", "physical-data", "if-detail"], // 4
  L6: ["function-spec", "class-design", "edge-case"],                        // 3
} as const;
// subDocSchema + frontmatter superRefine で layer×sub_doc 整合を fail-close
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
| sub_doc | `subDocSchema` (**実装済、IMP-026**) | 読込時 |
| status | `statusSchema` | 読込時 |
| `gate_runs/*.json` の command | `recommendedCommandV1Schema` | gate 実行時 |

> **読込原則**: state file は読込時に必ず zod で `parse` し、不正な state を早期 fail-close (ADR-001 enum drift 根絶)。書込時は型付きオブジェクト → JSON serialize。

## §6 drive 別区画 (FR-L1-40)

- 物理: `.ut-tdd/drive/<drive>/plan_registry/<plan_id>.json` (`<drive>` ∈ `VALID_DRIVES` 5 種)
- 隔離不変条件: 同一 plan_id が複数 drive 区画に存在 → fail-close (data.md §6、`ut-tdd doctor` 検出)
- `skip_sub_doc` 機械強制: drive×sub_doc 整合 (requirements §G.1: fe/fullstack/agent で L2/L10 skip → exit 1)

## §7 不変条件の物理検証点

| data.md §6 不変条件 | 物理検証点 | 実装 |
|---|---|---|
| 逆ピラミッド禁止 | artifact trace に design+impl あれば test_design+test_code edge 必須 | G6/G7 (trace file 検証) |
| pair = V-model 6 組 | `pair_artifact` ↔ `V_MODEL_PAIRS` 照合 | zod refine (実装済 enum) |
| **ペア未充足 = back-fill 未完の機械検知 (A-84)** | 設計 artifact に対し対のテスト設計 artifact が state に不在、または `placeholder_deps` 未解消 → fail-close。back-fill 完了まで error 継続 (V-model 最終整合=孤児0 を DB 側で保証、人手非依存) | **doctor / vmodel lint (L7)**、FR-L1-49 drift lint も同機構 (IMP-033 rule) |
| kind=poc → S0-S4 ∧ cross | frontmatter superRefine | **実装済** (frontmatter.ts) |
| kind=design+L1-L6 → sub_doc ∈ VALID_SUB_DOCS | frontmatter superRefine | **実装済** (IMP-026) |
| agent_slot.model allowlist | agent-guard (別経路) | **実装済** |
| 集約間参照整合 | doctor / lint hard gates (backfill、impl-plan-trace、tracked-canonical、dependency-drift、descent-obligation) | 実装済 |

> **back-fill の整合保証 (PO 確定 2026-06-01)**: 上位設計 (L4 等) が仕様未確定で対のテスト設計を書けない項目は Artifact に `placeholder_deps` (依存: どの層で何が確定したら書けるか) を持たせる。L6 機能設計で仕様確定 → テスト設計を back-fill → `placeholder_deps` 解消。最終形では **未解消の placeholder / pair edge 欠落は doctor が孤児として fail-close**し、V-model 状態が最終的に整う (孤児 0) ことを **DB(state) 側から機械保証**する。「入るべきところが入っていなければ DB 側からも検知」(PO)。Current status: dedicated `placeholder-deps` doctor gate is implemented in `src/lint/placeholder-deps.ts` and active design/test-design docs with stale L7 waiting placeholders fail-close.

## §8 carry → L7 実装

- **SubDoc zod 化** (IMP-026): `src/schema/index.ts` に `VALID_SUB_DOCS` + `subDocSchema` 追加、`frontmatter.ts` superRefine 拡張 (layer×sub_doc) + テスト実装済み
- **state 読込/書込 module**: `.ut-tdd/` file ↔ zod parse/serialize の実装 (architecture.md runtime/state)
- **doctor check_business_entity_coverage**: state file ↔ src/schema 齟齬検出の実装 (data.md §8 / L1 §10.2 carry)
- **`placeholder_deps` + ペア未充足検知** (A-84、PO back-fill 整合保証): Artifact schema に `placeholder_deps: array<{waiting_layer, waiting_spec}>` を追加し、doctor / vmodel lint で「設計 artifact に対の test_design artifact 不在 or `placeholder_deps` 未解消 → fail-close」を実装する。back-fill 完了で解消、V-model 最終整合 (孤児0) を DB 側で機械保証。FR-L1-49 drift lint と同じ IMP-033 rule engine に rule 型として登録。**Current status**: active design/test-design docs の L7 待ち `placeholder_deps` と旧「未実装」記述は `src/lint/placeholder-deps.ts` + doctor hard gate で fail-close 済み。**`waiting_layer` の2類型 (A-85 self-review I-3)**: ① **spec back-fill 型** (`waiting_layer` = 設計層、例 L6) = 対のテスト設計を*書く*のに上位仕様 (関数 signature 等) 確定待ち (例 ST-ASSET-04)。② **実装状態解消型** (`waiting_layer` = L7) = テスト設計は書けているが検証対象の状態が実装/コンテンツ整備で初めて materialize する (例 ST-ASSET-05 skill curate 完了 / ST-ASSET-07 guard→roster 切替)。**2類型認識の機械化 (IMP-107、2026-06-19)**: `src/lint/placeholder-deps.ts` が両類型を構造認識する — 型② (L7) の active doc 残存は **hard-fail** (repo は L7 到達済ゆえ解消されるべき)、型① (L1-L6) は item 単位の正当な carry でありうるため **検出数のみ surface** (band freeze ≠ item spec 確定、false-positive 回避)、未知 `waiting_layer` (L0-L14 外) は typo として hard-fail。**型①の threshold** (= IT-ASSET-07「waiting_layer 到達後の未解消 = failure」) は `descent-obligation` lint の impl-ahead 検査 (defer ledger: impl 未着地=deferred carry / 着地済+未 discharge=unmet 違反) が**正本担当**し重複させない。green message は「L7 waits=0 / spec-backfill waits=N [threshold=descent-obligation]」と coverage を明示し、「green = placeholder_deps 完全 fail-close」の誤読を塞ぐ。oracle U-PHDEPS-001..006。
- **物理 schema の object 型詳細** (agent_slots/generates/dependencies の入れ子型) は L7 実装時に zod object で確定
- evaluation_batch (Phase B) の物理 schema は Phase B telemetry 着手時に詳細化
## §9 Harness DB Reference-Feedback Projection (PLAN-L5-08)

PLAN-L5-08 adds the missing L5 slice for the user requirement that SQLite is not just storage, but a reference-feedback mechanism. The DB remains a projection of docs/state/logs, not the authoring source for governance docs.

External reinforcement: SQLite FTS5 supports external/contentless index patterns, so `search_index` is specified as rebuildable projection rather than primary content storage. OpenTelemetry semantic conventions support using named events with attributes for logs/traces/metrics correlation. W3C PROV frames provenance around entity/activity/agent, which maps here to artifact/run/agent or skill.

### §9.1 projection table expansion

| table | primary key | required columns | purpose |
|---|---|---|---|
| `drive_runs` | `drive_run_id` | `plan_id`, `session_id`, `drive`, `mode`, `layer`, `kind`, `started_at`, `completed_at`, `status` | Track every drive/model execution lane, including non-V-model modes. |
| `hook_events` | `event_id` | `session_id`, `plan_id`, `hook_name`, `event_type`, `occurred_at`, `digest`, `evidence_path` | Join SessionStart/PostToolUse/Stop, gate, and PLAN events into state projection. |
| `skill_invocations` | `skill_invocation_id` | `session_id`, `plan_id`, `skill_id`, `layer`, `drive`, `fired_at`, `source`, `accepted` | Persist actual skill firing events. |
| `skill_recommendations` | `skill_recommendation_id` | `session_id`, `plan_id`, `skill_id`, `rank`, `score`, `reason`, `recommended_at` | Persist the denominator for skill firing rate and recommendation quality. |
| `feedback_events` | `feedback_event_id` | `finding_id`, `plan_id`, `signal_type`, `severity`, `status`, `next_action`, `created_at` | Convert repeated findings and drift into replanning input. |
| `quality_signals` | `signal_id` | `source`, `subject_id`, `metric`, `value`, `threshold`, `status`, `computed_at` | Store machine-check metrics: orphan count, coverage, stale approval, gate-confirm coupling, schedule lint. |
| `search_index` | `search_id` | `subject_type`, `subject_id`, `path`, `title`, `tokens`, `summary`, `updated_at` | Reduce lookup cost for PLAN/artifact/finding/skill/model/session queries. |
| `workflow_runs` | `workflow_run_id` | `plan_id`, `drive_run_id`, `workflow`, `phase`, `ready_status`, `blocked_reason`, `human_required`, `checked_at` | Make workflow automation readiness queryable and data-backed. |
| `guardrail_decisions` | `guardrail_decision_id` | `plan_id`, `session_id`, `guardrail`, `decision`, `mode`, `human_signoff_required`, `evidence_path`, `decided_at` | Persist safety decisions for agent-guard, review evidence, escalation, and same-model approval checks. |
| `automation_assets` | `asset_id` | `asset_type`, `path`, `trigger`, `role`, `capability`, `drift_status`, `indexed_at` | Catalog skill/roster/command docs as automation inputs and search subjects. |

Existing tables in §2.7 remain required. New rows must reference existing `plan_registry`, `artifact_registry`, `model_runs`, `findings`, or `gate_runs` when such source IDs exist. Missing join keys become `findings` rows instead of silent skips.

### §9.2 skill/model metrics

Skill firing rate is computed from persisted rows, not from chat memory:

- `skill_firing_rate = count(skill_invocations where fired) / count(skill_recommendations)`
- `skill_acceptance_rate = count(skill_invocations where accepted=true) / count(skill_invocations)`
- `model_selection_trace = model_runs.plan_id + drive_runs.drive_run_id + skill_recommendations.reason`
- `automation_readiness = workflow_runs.ready_status + open findings by plan/workflow + guardrail_decisions.decision`
- `guardrail_block_rate = count(guardrail_decisions where decision=block) / count(guardrail_decisions)`

The DB stores IDs, reasons, scores, and redacted summaries only. Raw provider transcript, secret, credential, and PII are out of scope.

### §9.3 indexes and invariants

Required indexes:

- `idx_plan_layer_drive_status(plan_id, layer, drive, status)`
- `idx_trace_from_to(from_artifact, to_artifact)`
- `idx_findings_subject_status(subject_id, status, severity)`
- `idx_hook_session_plan(session_id, plan_id, occurred_at)`
- `idx_skill_plan_skill(plan_id, skill_id, fired_at)`
- `idx_search_subject(subject_type, subject_id)`

Invariants:

- Every `drive_runs`, `hook_events`, `skill_*`, `feedback_events`, and `quality_signals` row has `plan_id` or `session_id`.
- Every `workflow_runs`, `guardrail_decisions`, and `automation_assets` row has either a source path or evidence path, and non-ready automation never appears as ready without a closing finding.
- Every non-green lint/doctor/vmodel/gate result is representable as `findings` plus optional `quality_signals`.
- `search_index` is rebuildable from docs/state/logs and can be deleted/rebuilt without changing authoritative state.

### §9.4 UT evidence history projection (A-122 / IMP-109)

Phase 2 close review found that the DB design can already project workflow, guardrail, skill, and quality signals, but it cannot yet answer UT-specific feedback questions. Add the following projection tables before Phase 4 DB implementation starts. They remain derived data; the authoring sources are test files, PLAN artifacts, vitest/Bun output, CI logs, and `.ut-tdd/` evidence.

| table | primary key | required columns | purpose |
|---|---|---|---|
| `test_cases` | `test_case_id` | `test_file`, `test_name`, `oracle_id`, `plan_id`, `fr_id`, `artifact_id`, `kind`, `first_seen_at`, `last_seen_at` | Make each UT oracle queryable by PLAN/FR/artifact. |
| `test_runs` | `test_run_id` | `session_id`, `plan_id`, `command`, `runner`, `runtime`, `os`, `shell`, `started_at`, `completed_at`, `exit_code`, `evidence_path`, `output_digest`, `green_definition_id` | Record one executed quantitative test command, especially Bun/vitest/doctor/lint runs. `review_evidence.green_commands[]` is the frontmatter source for PLAN-local green command projection. |
| `test_results` | `test_result_id` | `test_run_id`, `test_case_id`, `status`, `duration_ms`, `failure_digest`, `started_at`, `completed_at` | Track pass/fail/skip/todo by case and run. |
| `test_artifact_edges` | `edge_id` | `test_case_id`, `artifact_id`, `edge_kind`, `plan_id`, `source_path` | Join test evidence back to V-model trace without overloading `trace_edges`. |
| `test_flake_events` | `flake_event_id` | `test_case_id`, `window`, `pass_count`, `fail_count`, `flake_score`, `computed_at`, `evidence_path` | Surface unstable tests and duration regressions as quality signals. |

Required UT-derived metrics:

- `ut_oracle_coverage = count(test_cases where oracle_id is not null) / expected U-* oracle count by plan`.
- `ut_plan_green_rate = count(test_runs where plan_id=X and exit_code=0) / count(test_runs where plan_id=X)`.
- `ut_flake_score` is computed from alternating pass/fail history and stored in `test_flake_events`; non-zero score creates a `quality_signals` row.
- `green_definition_compliance = every test_runs.green_definition_id resolves and every required command in that definition has exit_code=0`.
- `review_green_command_compliance = every 2026-06-23-or-later confirmed/completed review_evidence entry has at least one projected test_runs row with exit_code=0, evidence_path, and output_digest`.

Current implementation note (2026-06-23): `projectReviewEvidenceRegistry` projects `review_evidence.green_commands[]` into `test_runs` during deterministic harness.db rebuild. General UT runner ingestion, flake history, and duration regression projection remain separate IMP-109 scope.

Implementation constraints:

- Bun is the default execution runtime. The collector reads Bun/vitest JSON output when available and falls back to command/evidence digests when individual case data is unavailable.
- DB writes use `bun:sqlite` in the core runtime. External adapters may use a compatibility layer only if they preserve the same schema and rebuild semantics.
- Raw provider transcripts, secrets, and PII are never inserted. `failure_digest` is a bounded digest with redaction applied before persistence.
- A missing `plan_id`, unresolved `oracle_id`, or green definition mismatch becomes a `findings` row; it is not silently dropped.

### §9.5 Cross-artifact relation graph and diagram projection (A-124 / IMP-118..120)

The DB must make cross-cutting impact analysis queryable. The authoring sources remain docs, source files, test files, PLAN frontmatter, audit records, logs, and state files. The relation graph is a rebuildable projection that lets the harness answer: "if this changed, what else must be reviewed, fixed, tested, or redrawn?"

| table | primary key | required columns | purpose |
|---|---|---|---|
| `graph_nodes` | `node_id` | `node_type`, `subject_id`, `section_id` (nullable), `path`, `name`, `layer`, `kind`, `status`, `source`, `indexed_at` | Normalize source files, modules, docs, PLANs, FR/AC/AT IDs, DB tables, tests, findings, and diagrams into graph nodes. `section_id` keeps doc-internal section granularity so impact expansion does not collapse section-level changes into whole-doc nodes (A-128 F-3 / IMP-129①). |
| `dependency_edges` | `edge_id` | `from_node_id`, `to_node_id`, `edge_kind`, `strength`, `source`, `evidence_path`, `is_expected`, `is_actual`, `indexed_at` | Store import/reference/test/projection/implementation edges and distinguish design-declared expected edges from observed actual edges. |
| `impact_rules` | `impact_rule_id` | `trigger_edge_kind`, `trigger_node_type`, `required_node_type`, `required_action`, `severity`, `gate`, `enabled` | Convert relation edges into required co-change, review, test, Reverse, or diagram-refresh actions. |
| `impact_results` | `impact_result_id` | `change_set_id`, `root_node_id`, `impacted_node_id`, `required_action`, `status`, `reason`, `evidence_path`, `computed_at` | Persist one computed impact expansion for a diff/session/PLAN. |
| `artifact_progress` | `artifact_path` | `artifact_type`, `artifact_hash`, `state`, `color`, `linked_test_ids`, `linked_test_paths`, `linked_test_count`, `passed_test_run_ids`, `passed_test_run_count`, `dependency_checked`, `dependency_check_run_id`, `dependency_checked_at`, `dependency_check_source`, `open_dependency_impacts`, `recovery_plan_ids`, `reason`, `indexed_at` | Persist rebuildable artifact progress color rows: red for unchecked/open dependency impact, yellow for implemented but unverified or recovery, green for artifacts with linked passing test runs. |
| `artifact_progress_events` | `artifact_progress_event_id` | `artifact_path`, `artifact_type`, `previous_color`, `color`, `state`, `trigger`, `test_run_ids`, `dependency_check_run_id`, `recovery_plan_ids`, `reason`, `occurred_at` | Rebuildable event view for workflow triggers derived from artifact progress rows. |
| `tool_runs` | `tool_run_id` | `tool_name`, `tool_version`, `command`, `input_scope`, `exit_code`, `started_at`, `completed_at`, `evidence_path` | Record optional adapter runs such as dependency-cruiser, Knip, Madge, Graphviz, Mermaid, or D2. |
| `diagram_artifacts` | `diagram_id` | `graph_snapshot_id`, `format`, `path`, `renderer`, `scope`, `created_at`, `evidence_path` | Store generated Mermaid/DOT/D2/SVG/PNG diagram outputs as traceable artifacts. |
| `graph_snapshots` | `graph_snapshot_id` | `scope`, `node_count`, `edge_count`, `hash`, `created_at`, `source_digest` | Make diagrams and impact results reproducible from a stable graph snapshot. |

Required edge kinds:

- `imports`: TS/JS import relation.
- `references`: Markdown/YAML/JSON path or ID reference.
- `declares_module`: design artifact declares a source module/building block.
- `implements`: source module implements a PLAN/FR/artifact.
- `tests`: test case/file exercises a source module, artifact, FR, or oracle.
- `projects_to`: source doc/state/log projects into a DB table.
- `visualizes`: diagram artifact visualizes a graph snapshot or scope.

`artifact_progress` color semantics (FR-L1-51 / PLAN-L7-56 / PLAN-REVERSE-56):

- `red`: `dependency_checked = 0`, `open_dependency_impacts > 0`, or the changed artifact has missing required design/requirement/test back-propagation according to impact expansion. This includes "implementation exists but L1/L3/L4/L5 registration is missing".
- `yellow`: implementation or recovery work exists, but linked test evidence is absent or no linked passing `test_runs` row exists. New artifacts enter the projection as yellow until dependency and test-run evidence are available.
- `green`: `passed_test_run_count > 0`, `passed_test_run_ids` identify the passing `test_runs` rows, `dependency_checked = 1`, and `open_dependency_impacts = 0`.
- `dependency_check_run_id` / `dependency_checked_at` record the relation-impact check that justified the dependency state. `dependency_checked=1` is not inferred from "no rows" alone.
- `recovery_plan_ids` records active recovery/fullback/refactor PLANs that are returning red/yellow artifacts to green. Active recovery changes red impact rows to yellow recovering rows; closure still requires green test-run evidence and clean dependency impact.
- `feedback_events.source_table/source_id/source_color` records red/yellow `artifact_progress` rows as workflow trigger inputs so recovery/reverse/refactor work can be started from DB state instead of prose handover.

Required indexes:

- `idx_graph_node_type_subject(node_type, subject_id)`.
- `idx_graph_path(path)`.
- `idx_dependency_from_kind(from_node_id, edge_kind)`.
- `idx_dependency_to_kind(to_node_id, edge_kind)`.
- `idx_impact_change_status(change_set_id, status)`.
- `idx_artifact_progress_color(color, state)`.
- `idx_artifact_progress_tests(passed_test_run_count, dependency_checked)`.
- `idx_artifact_progress_events_path(artifact_path, occurred_at)`.
- `idx_feedback_source(source_table, source_id)`.
- `idx_tool_name_scope(tool_name, input_scope)`.
- `idx_diagram_scope_format(scope, format)`.

Invariants:

- Every edge references existing `graph_nodes`.
- Every non-local source change must either produce an `impact_results` row or a `findings` row explaining why impact expansion could not run.
- Expected-vs-actual mismatches become `findings` rows; they are not silently repaired.
- Diagram artifacts are derived from `graph_snapshots`; deleting diagrams does not delete graph state.
- External tool output is normalized before gate use. Tool-specific JSON/DOT/Mermaid/D2 output is evidence, not the gate source of truth.

Tool adapter profile:

- Core parser: TypeScript/Bun AST and Markdown/YAML scanners. This is the default SSoT path.
- Optional dependency rule/graph: `dependency-cruiser`.
- Optional unused dependency/export/file detector: `knip`.
- Optional circular graph helper: `madge`.
- Optional renderers: Graphviz DOT for large SVG/PDF/PNG, Mermaid for GitHub-readable Markdown diagrams, D2 for presentation-quality architecture diagrams.

Initial impact rules:

- A changed `src/**` node requires related design artifact, test/test-design artifact, and reverse dependencies to be reviewed.
- A changed design/test-design doc requires paired V-model artifact and trace edge review.
- A changed DB projection table requires its `projects_to` source docs/state/logs and dependent quality/impact queries to be reviewed.
- A changed relation graph snapshot requires diagram artifacts in the same scope to be refreshed or marked stale.

### §9.6 MCP and external verification profile projection (A-125 / IMP-121..124)

A-125 extends the relation graph with externally installed MCP servers, plugins, and test foundations. These are not authoring sources. They are environment-dependent verification profiles whose discovery, probe result, invocation, and normalized findings must be queryable.

| table | primary key | required columns | purpose |
|---|---|---|---|
| `mcp_server_profiles` | `mcp_profile_id` | `name`, `package_ref`, `source_url`, `transport`, `command`, `args_digest`, `allowed_tools`, `read_only`, `requires_network`, `requires_docker`, `requires_auth`, `risk_tier`, `enabled`, `source`, `indexed_at` | Catalog allowed MCP profiles such as Playwright, GitHub read-only, filesystem-workspace, git-workspace, fetch, sqlite, and Docker MCP gateway profiles. |
| `mcp_profile_triggers` | `trigger_id` | `mcp_profile_id`, `signal`, `workflow`, `layer`, `gate`, `reason`, `enabled` | Map workflow signals to profile recommendations without relying on agent memory. |
| `mcp_server_runs` | `mcp_run_id` | `mcp_profile_id`, `session_id`, `plan_id`, `command`, `method`, `tool_name`, `started_at`, `completed_at`, `exit_code`, `evidence_path`, `normalized_status` | Persist MCP Inspector, profile probe, and allowed MCP tool invocations. |
| `verification_profiles` | `verification_profile_id` | `name`, `profile_type`, `package_refs`, `requires_docker`, `requires_browser`, `requires_network`, `green_definition_id`, `trigger_signals`, `enabled` | Catalog external test foundations such as Vitest browser + Playwright, Testcontainers, and MSW. |
| `verification_recommendations` | `verification_recommendation_id` | `change_set_id`, `plan_id`, `profile_id`, `profile_kind`, `reason`, `source_rule`, `accepted`, `created_at` | Store which MCP/test profiles relation-graph impact expansion recommended for a change. |
| `external_tool_findings` | `external_finding_id` | `source_run_id`, `source_kind`, `finding_type`, `severity`, `subject_id`, `path`, `status`, `digest`, `created_at` | Normalize MCP, browser, container, and mock/test profile output into gate-queryable findings. |

Required indexes:

- `idx_mcp_profile_name(name)`.
- `idx_mcp_triggers_signal(signal, workflow, gate)`.
- `idx_mcp_runs_profile_plan(mcp_profile_id, plan_id, started_at)`.
- `idx_verification_profile_type(profile_type, enabled)`.
- `idx_verification_recommendations_change(change_set_id, profile_kind, accepted)`.
- `idx_external_tool_findings_subject(subject_id, status, severity)`.

Invariants:

- Every enabled MCP profile has an allow-list and an explicit `risk_tier`.
- Profiles with `requires_auth=true` cannot be enabled by repo-tracked config alone.
- Workspace filesystem/git profiles must scope mounts or repository paths to the workspace root.
- Browser and Docker profiles may be recommended without being available; absence becomes a `findings` row, not a silent pass.
- `mcp_server_runs` and `verification_recommendations` join to `tool_runs` (§9.5) or `test_runs` (§9.4) when an external command actually ran (cross-section reference made explicit, A-128 F-3 / IMP-129⑤).
- Gate decisions use normalized profile/run/finding rows. Raw MCP output, screenshots, traces, and logs remain bounded evidence artifacts.

Initial trigger rules:

- `ui_flow`, `web_target`, `browser_regression` -> recommend `playwright-mcp` and `vitest-browser-playwright`.
- `ci_failure`, `pr_review`, `backlog_sync` -> recommend `github-mcp-readonly`; write-capable GitHub profiles require human approval.
- `db_integration`, `migration`, `service_contract` -> recommend `testcontainers-node` plus DB projection review.
- `api_mock_gap`, `flaky_external_api` -> recommend `msw`.
- `mcp_server_added`, `mcp_profile_changed` -> require MCP Inspector `tools/list` smoke before accept.

### §9.7 Canonical document export projection (A-126 / IMP-126)

A-126 adds generated spreadsheet / Excel / PPTX conversions for canonical UT-TDD documents. These outputs are not authoring sources. They are derived from concept/planning docs, requirements, detailed design, PLAN, ADR, test-design, trace rows, and normalized evidence links.

| table | primary key | required columns | purpose |
|---|---|---|---|
| `document_export_profiles` | `document_export_profile_id` | `name`, `source_doc_family`, `format`, `renderer`, `package_ref`, `source_url`, `built_in`, `requires_package`, `requires_d2`, `enabled`, `risk_tier`, `trigger_signals` | Catalog CSV, Markdown summary, XLSX, PPTX, and D2-PPTX export profiles for canonical document families. |
| `document_export_runs` | `document_export_run_id` | `profile_id`, `session_id`, `plan_id`, `source_doc_family`, `source_paths_digest`, `source_snapshot_hash`, `redaction_profile`, `started_at`, `completed_at`, `exit_code`, `evidence_path`, `normalized_status` | Record one document conversion attempt and the source snapshot used to build it. |
| `document_export_datasets` | `document_export_dataset_id` | `export_run_id`, `dataset_kind`, `row_count`, `column_digest`, `source_paths`, `source_section_digest`, `created_at`, `hash` | Persist the pre-render document matrix/deck dataset summary so renderer output can be reproduced or audited. |
| `document_export_artifacts` | `document_export_artifact_id` | `export_run_id`, `format`, `path`, `renderer`, `byte_size`, `hash`, `created_at`, `evidence_path`, `stale_status` | Store generated CSV/Markdown/XLSX/PPTX artifact metadata as traceable document conversion evidence. |
| `document_export_triggers` | `trigger_id` | `document_export_profile_id`, `signal`, `workflow`, `layer`, `gate`, `reason`, `enabled` | Map export trigger signals (requirements §6.8.11, including `document_export_profile_changed`) to export profile recommendations, symmetric to `mcp_profile_triggers` (A-128 F-3 / IMP-129④). |

Required indexes:

- `idx_document_export_profile_family(source_doc_family, format, enabled)`.
- `idx_document_export_run_family(source_doc_family, plan_id)`.
- `idx_document_export_run_snapshot(source_snapshot_hash)`.
- `idx_document_export_artifact_format(format, stale_status)`.
- `idx_document_export_triggers_signal(signal, workflow, gate)`.

Invariants:

- Every export artifact references a `document_export_run`.
- Every export run has source document paths, a source snapshot hash, and redaction profile.
- Built-in CSV / Markdown table exports are available without external packages.
- XLSX / PPTX / D2-PPTX profiles are disabled until renderer readiness is proven; missing renderer availability becomes a finding.
- Export datasets preserve source section IDs, FR/AC/AT IDs, PLAN IDs, ADR IDs, trace IDs, status fields, and evidence links where present.
- Export datasets are redacted before rendering. Raw provider transcripts, credentials, secrets, PII, raw MCP payloads, screenshots, and browser traces are not stored in export rows.
- Generated files are evidence only. Canonical Markdown/docs remain source of truth.

Initial export profiles:

- `doc-csv-matrix`: requirements, design, PLAN, ADR, trace, and test-design matrix rows.
- `doc-markdown-summary`: GitHub-readable conversion summary with source links.
- `doc-xlsx-workbook`: multi-sheet workbook via ExcelJS or SheetJS optional renderer.
- `doc-pptx-deck`: concept/requirements/design/ADR/PLAN/test-design deck via PptxGenJS optional renderer.
- `doc-d2-pptx-diagram`: graph/architecture/workflow diagram deck output via D2 optional renderer.

### §9.8 Screen entity and FR/BR→screen trace projection (IMP-140)

IMP-140: the 15 screens (PM/HM/GD) and their FR/BR→screen trace lived only in the `screen-list.md` / `screen-requirements.md` doc source and were not in harness.db. This projection makes HM-04 (DB browse), HM-01 (feature-list → screen-requirement), and PM-06 (design-doc viewer) DB-driven instead of doc-only. Screens are not-implemented (NFR-08, src/web is Phase B).

| table | primary key | required columns | purpose |
|---|---|---|---|
| `screens` | `screen_id` | `name`, `category`, `url`, `l1_ref`, `status`, `implemented`, `indexed_at` | 15 screens projected from `screen-list.md` §1 (画面 ID / 名 / カテゴリ / URL / L1 参照). `implemented=0` / `status=not-implemented` (NFR-08). |
| `screen_trace` | `screen_trace_id` | `screen_id`, `requirement_id`, `requirement_kind`, `relation`, `source` | FR/BR/UX → screen reverse-trace edges projected from `screen-requirements.md` §5.5. `requirement_kind` ∈ {fr, br, ux}. Powers HM-01 feature-list → screen-requirement navigation from the DB. |

Required indexes:

- `idx_screens_category(category, screen_id)`.
- `idx_screen_trace_screen(screen_id, requirement_kind)`.

Invariants:

- `screens` row count equals the screen-requirements §1 declared count (15 = PM 6 + HM 8 + GD 1); the `doc-consistency` gate counts the same doc source.
- Every `screen_trace.screen_id` references a `screens.screen_id` (no orphan trace edge).
- `screens.implemented=0` until src/web (Phase B); flipping requires NFR-08 implementation-truthfulness evidence.
- Source of truth remains the docs; this projection is a derived read model rebuilt deterministically by `ut-tdd db rebuild` (no separate authoring surface).
