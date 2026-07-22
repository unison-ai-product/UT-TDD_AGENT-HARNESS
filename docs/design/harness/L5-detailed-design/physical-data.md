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
| `route_mode` | string | 省略可 (created>=2026-07-01 は route certificate lint で必須) | `""` | 駆動モデル宣言の正本 (mode 第一級化、PLAN-L7-243)。`drive_runs.mode` は route_mode → plan_id prefix → kind の順で導出 (`src/schema/mode-catalog.ts`) |
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

### §2.6 評価 (`audit/*.jsonl`、Phase B)

| フィールド | 型 | 必須/任意 | 制約 |
|---|---|---|---|
| `batch_id` | string | 必須 | primary key |
| `invocation_log` | array | 任意 | AI 呼び出し記録 (FR-L1-20、append-only) |
| `scores` | object | 任意 | accuracy_score / kpi (Phase B) |

### §2.7 SQLite projection DB の定義 (`harness.db`)

`harness.db` は legacy DB schema を流用せず、YAML/JSON state と docs を正規化して V-model feedback loop に使う projection DB。Bun runtime では `bun:sqlite` を第一候補とし、Node 互換が必要な adapter のみ `better-sqlite3` を検討する。

| table | primary key | 主な列 | 入力 |
|---|---|---|---|
| `plan_registry` | `plan_id` | `kind`, `layer`, `sub_doc`, `drive`, `route_mode`, `status`, `parent`, `updated_at`, `decision_outcome`, `source_hash` | `docs/plans/*.md`, `.ut-tdd/plan_registry/*.json` |
| `artifact_registry` | `artifact_id` | `artifact_type`, `path`, `pair_artifact`, `status`, `updated_at` | docs/test-design、source catalog、trace state を入力とする。 |
| `model_runs` | `run_id` | `runtime`, `model`, `role`, `drive`, `plan_id`, `started_at`, `completed_at`, `evidence_path` | Codex / Claude / worker / reviewer の execution evidence を記録する。 |
| `trace_edges` | `edge_id` | `from_artifact`, `to_artifact`, `edge_kind`, `plan_id`, `status` | artifact trace state |
| `coverage` | `coverage_id` | `scope`, `subject_id`, `metric`, `value`, `threshold`, `status` | test coverage / trace coverage / plan coverage を保存する。 |
| `findings` | `finding_id` | `kind`, `severity`, `subject_id`, `source`, `status`, `evidence_path` | doctor / vmodel lint / review findings を保存する。 |
| `gate_runs` | `gate_run_id` | `gate_id`, `plan_id`, `status`, `checked_at`, `evidence_path` | `.ut-tdd/gate_runs/*.json`, CI evidence |
| spec IR tables | §9.9 | `spec_defs`, `spec_relations`, `schedule_entries`, `activation_entries`, `document_catalog_entries`, `spec_rag_closure_entries`, `detector_route_candidates` | Vモデル仕様 IR / 工程 / 活性化 / 文書カタログ / spec 閉包 RAG / 起票候補 projection。§2.7 基礎表を正本化せず、詳細は §9.9 で定義する。 |

物理不変条件: `trace_edges` の orphan 0、`coverage.status=fail` の gate fail-close、`findings.status=open` の severity 別 gate 判定、`model_runs.plan_id` と `plan_registry.plan_id` の参照整合を doctor / vmodel lint が検証する。`plan_registry.source_hash` は PLAN markdown 全文の sha256 で、persisted `harness.db` と現在の `docs/plans/*.md` の fingerprint 不一致は `drive-db-registration` hard gate で stale として扱う。projection は自動生成だが、検出対象の機械 SSoT として扱い、入力 state との不一致は `findings` に保存する。

telemetry provenance invariant (PLAN-L7-188): 「fired」「used」「executed」「works」を主張するために使う populated telemetry table は、runtime provenance と deterministic projection を区別する。provenance-enforced mode では、`skill_invocations`、`test_runs`、`guardrail_decisions`、`model_runs` が projection-only row (`runtime_rows=0` かつ `projection_rows>0`) だけで populated されている場合は fail-close する。default doctor は runtime capture 配線まで partial migration state として surface してよいが、verification-strategy close は projection-only telemetry を substance として扱えない。doctor は in-memory rebuild に runtime Claude/Codex session usage を overlay し、JSONL token/cost telemetry から値付き `model_runs` row を project する。deterministic `db rebuild` は source projection のままであり、user runtime log は scan しない。session-log `forced_stop` event は runtime safety decision であり、non-empty `session_id`、`mode=runtime-hook`、session JSONL evidence を持つ `guardrail_decisions` へ project する。通常の `tool_use` event は guardrail telemetry を fabricate してはならない。session-log `Bash (skill)` event は runtime skill suggestion/use telemetry であり、non-empty `session_id` と `source=runtime-hook:skill-suggest` を持つ `skill_invocations` へ project する。generic `Bash (bash)` event は invocation metrics を fabricate しないように ignore する。

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
## §9 Harness DB 参照フィードバック projection (PLAN-L5-08)

PLAN-L5-08 は、SQLite を単なる storage ではなく reference-feedback mechanism とする user requirement に対し、欠けていた L5 slice を追加する。DB は docs/state/logs の projection であり、governance docs の authoring source ではない。

外部根拠: SQLite FTS5 は external/contentless index pattern を support するため、`search_index` は primary content storage ではなく rebuildable projection として指定する。OpenTelemetry semantic conventions は logs/traces/metrics correlation のために attribute 付き named event を使える。W3C PROV は provenance を entity/activity/agent で捉えるため、ここでは artifact/run/agent または skill に map する。

### §9.1 projection table 拡張

| table | 主キー | 必須 columns | 目的 |
|---|---|---|---|
| `drive_runs` | `drive_run_id` | `plan_id`, `session_id`, `drive`, `mode`, `layer`, `kind`, `started_at`, `completed_at`, `status` | V-model 以外の mode を含む drive/model 実行 lane を記録する。 |
| `hook_events` | `event_id` | `session_id`, `plan_id`, `hook_name`, `event_type`, `occurred_at`, `digest`, `evidence_path` | SessionStart/PostToolUse/Stop、gate、PLAN event を state projection へ結合する。 |
| `skill_invocations` | `skill_invocation_id` | `session_id`, `plan_id`, `skill_id`, `layer`, `drive`, `fired_at`, `source`, `accepted` | 実際に発火した skill event を永続化する。 |
| `skill_recommendations` | `skill_recommendation_id` | `session_id`, `plan_id`, `skill_id`, `rank`, `score`, `reason`, `recommended_at` | skill firing rate と recommendation quality の denominator を永続化する。 |
| `feedback_events` | `feedback_event_id` | `finding_id`, `plan_id`, `source_table`, `source_id`, `source_generation`, `signal_type`, `severity`, `status`, `next_action`, `created_at` | 再構築可能なsource観測をreplanning inputへ変換する。`source_generation`は意味状態から決定論的に生成し、同一観測のrebuildでは変えない。 |
| `feedback_lifecycle` | `lifecycle_id` | `feedback_event_id`, `source_generation`, `state`, `occurred_at`, `reason` | `.ut-tdd/logs/feedback-lifecycle.jsonl` のappend-only消化履歴を投影する。同一generationのterminal stateをrebuildで再openしない。 |
| `memory_entries` | `memory_id` | `kind`, `title`, `body`, `tags`, `source_path`, `updated_at`, `content_hash` | `.ut-tdd/memory/*.md` の authored memory を Claude/Codex 共有の read model として project する。SessionStart surface はこの table を read-only で読む。 |
| `quality_signals` | `signal_id` | `source`, `subject_id`, `metric`, `value`, `threshold`, `status`, `computed_at` | orphan count、coverage、stale approval、gate-confirm coupling、schedule lint などの machine-check metrics を保存する。 |
| `search_index` | `search_id` | `subject_type`, `subject_id`, `path`, `title`, `tokens`, `summary`, `updated_at` | PLAN/artifact/finding/skill/model/session query の lookup cost を下げる。 |
| `workflow_runs` | `workflow_run_id` | `plan_id`, `drive_run_id`, `workflow`, `phase`, `ready_status`, `blocked_reason`, `human_required`, `checked_at` | workflow automation readiness を query 可能かつ data-backed にする。 |
| `guardrail_decisions` | `guardrail_decision_id` | `plan_id`, `session_id`, `guardrail`, `decision`, `mode`, `human_signoff_required`, `evidence_path`, `decided_at` | agent-guard、review evidence、escalation、same-model approval check の safety decision を永続化する。 |
| `automation_assets` | `asset_id` | `asset_type`, `path`, `trigger`, `role`, `capability`, `drift_status`, `indexed_at` | skill/roster/command docs を automation input と search subject として catalog 化する。 |

§2.7 の existing table は引き続き必須とする。source ID が存在する場合、new row は既存の `plan_registry`、`artifact_registry`、`model_runs`、`findings`、`gate_runs` を参照する。join key 欠落は silent skip ではなく `findings` row にする。

### §9.2 skill/model metrics の定義

skill firing rate は chat memory ではなく persisted row から計算する。

- `skill_firing_rate = count(skill_invocations where fired) / count(skill_recommendations)`
- `skill_acceptance_rate = count(skill_invocations where accepted=true) / count(skill_invocations)`
- provenance 分離 (PLAN-L7-262): 上記 2 metric の分子 (invocations) は
  `source LIKE 'runtime-hook:%'` の実 runtime 発火のみを数える。`auto-projection:*` の
  間接推定行は監査参照用に保持するが metrics へ混ぜない。算出 signal の `source` は
  `skill-metrics:runtime` で算出元を明示する。session_id は空文字を許さず、rebuild 由来行は
  `rebuild:indirect`、session 不明の CLI 経路は `cli:unknown-session` を明示する。
  skill context 注入の成功/skip は session JSONL の `skill_injection` event として記録する
  (silent fail-open の禁止)。
- `model_selection_trace = model_runs.plan_id + drive_runs.drive_run_id + skill_recommendations.reason`
- `automation_readiness = workflow_runs.ready_status + open findings by plan/workflow + guardrail_decisions.decision`
- `guardrail_block_rate = count(guardrail_decisions where decision=block) / count(guardrail_decisions)`

DB が保存するのは ID、reason、score、redacted summary のみにする。raw provider transcript、secret、credential、PII は scope 外とする。

### §9.3 index と invariant

必須 index:

- `idx_plan_layer_drive_status(plan_id, layer, drive, status)`
- `idx_trace_from_to(from_artifact, to_artifact)`
- `idx_findings_subject_status(subject_id, status, severity)`
- `idx_hook_session_plan(session_id, plan_id, occurred_at)`
- `idx_skill_plan_skill(plan_id, skill_id, fired_at)`
- `idx_memory_kind_updated(kind, updated_at)`
- `idx_feedback_source(source_table, source_id)`
- `idx_feedback_lifecycle_event(feedback_event_id, source_generation, occurred_at)`
- `idx_search_subject(subject_type, subject_id)`

不変条件:

- すべての `drive_runs`、`hook_events`、`skill_*`、`feedback_events`、`quality_signals` row は `plan_id` または `session_id` を持つ。
- すべての `workflow_runs`、`guardrail_decisions`、`automation_assets` row は source path または evidence path のいずれかを持ち、non-ready automation は closing finding なしに ready として現れない。
- すべての non-green lint/doctor/vmodel/gate result は `findings` と optional `quality_signals` で表現できる。
- `search_index` は docs/state/logs から rebuild 可能であり、authoritative state を変更せず delete/rebuild できる。
- `feedback_events`は観測projection、`feedback_lifecycle`はdurableな消化履歴projectionである。current generationの最新transitionだけがsurface可否を決め、terminal eventのsourceをfinding/signal fallbackで再表示しない。

### 9.3.1 リファクタ候補 lifecycle 投影

`refactor_candidates` は ZIP108 の Refactor 候補を検出だけで終わらせず、triage state を保持する
永続 lifecycle table である。`quality_signals` は rebuild 可能な signal projection のまま残すが、
`refactor_candidates` は `rebuildHarnessDb` の truncate 対象から外し、`accepted` / `rejected` /
`implemented` の判断を次回 rebuild でも保持する。

| table | 主キー | columns | 目的 |
|---|---|---|---|
| `refactor_candidates` | `candidate_key` | `kind`, `path`, `subject`, `confidence`, `score`, `threshold`, `state`, `linked_plan_id`, `reason`, `first_seen_at`, `last_seen_at`, `decided_at` | detector output の候補 identity と triage state を保持し、false-positive や対応済み候補の再発火を防ぐ。 |

State semantics は次の通り。

- `open`: detector が現在も検出しており、まだ triage されていない。
- `accepted`: Refactor PLAN へ進める判断済み。`linked_plan_id` が必須。
- `rejected`: false-positive または現時点で対応しない判断済み。再検出されても `open` に戻さない。
- `implemented`: 対応済み。`linked_plan_id` が必須。

必要 index:

- `idx_refactor_candidates_state(state, confidence, last_seen_at)`.
- `idx_refactor_candidates_plan(linked_plan_id, state)`.

不変条件:

- DB は projection であり authoring source ではない。`refactor_candidates` は triage state だけを保持し、
  Refactor PLAN 本文や設計差分を生成・承認しない。
- `quality_signals.status=warn` と `feedback_events` は `state=open` の high-confidence 候補だけに限定する。
- `accepted` / `rejected` / `implemented` は rebuild で上書きしない。

### §9.4 UT evidence history projection の定義 (A-122 / IMP-109)

Phase 2 close review では、DB design が workflow、guardrail、skill、quality signal を既に project できる一方で、UT-specific feedback question にはまだ答えられないことが判明した。Phase 4 DB implementation 開始前に、以下の projection table を追加する。これらは derived data のままであり、authoring source は test file、PLAN artifact、vitest/Bun output、CI log、`.ut-tdd/` evidence とする。

| table | 主キー | 必須 columns | 目的 |
|---|---|---|---|
| `test_cases` | `test_case_id` | `test_file`, `test_name`, `oracle_id`, `plan_id`, `fr_id`, `artifact_id`, `kind`, `first_seen_at`, `last_seen_at` | 各 UT oracle を PLAN/FR/artifact で query 可能にする。 |
| `test_runs` | `test_run_id` | `session_id`, `plan_id`, `command`, `runner`, `runtime`, `os`, `shell`, `started_at`, `completed_at`, `exit_code`, `evidence_path`, `output_digest`, `green_definition_id` | 実行済みの定量 test command を 1 run として記録する。主対象は Bun/vitest/doctor/lint run である。`review_evidence.green_commands[]` は PLAN-local green command projection の frontmatter source とする。 |
| `test_results` | `test_result_id` | `test_run_id`, `test_case_id`, `status`, `duration_ms`, `failure_digest`, `started_at`, `completed_at` | case と run ごとの pass/fail/skip/todo を追跡する。 |
| `test_artifact_edges` | `edge_id` | `test_case_id`, `artifact_id`, `edge_kind`, `plan_id`, `source_path` | `trace_edges` を過負荷にせず、test evidence を V-model trace へ戻す。 |
| `test_flake_events` | `flake_event_id` | `test_case_id`, `window`, `pass_count`, `fail_count`, `flake_score`, `computed_at`, `evidence_path` | 不安定 test と duration regression を quality signal として surface する。 |

必須 UT-derived metrics:

- `ut_oracle_coverage = count(test_cases where oracle_id is not null) / expected U-* oracle count by plan`。
- `ut_plan_green_rate = count(test_runs where plan_id=X and exit_code=0) / count(test_runs where plan_id=X)`。
- `ut_flake_score` は alternating pass/fail history から計算し、`test_flake_events` に保存する。non-zero score は `quality_signals` row を作る。
- `green_definition_compliance = every test_runs.green_definition_id resolves and every required command in that definition has exit_code=0`。
- `review_green_command_compliance = every 2026-06-23-or-later confirmed/completed review_evidence entry has at least one projected test_runs row with exit_code=0, evidence_path, and output_digest`。

現在の実装注記 (2026-06-29): `projectReviewEvidenceRegistry` は deterministic harness.db rebuild 中に `review_evidence.green_commands[]` を empty `session_id` の `test_runs` へ project する (projection-only evidence)。さらに `projectHookEvents` は、sanitized Bash target が recognized verification verb (`vitest`、`test`、`tsc`、`doctor`、`lint`、`eslint`) の場合、session-log `tool_use` event から runtime-provenance `test_runs` row を derive し、non-empty `session_id` と session JSONL `evidence_path` を保持する。general UT runner ingestion、flake history、duration regression projection は別の IMP-109 scope に残す。

実装制約:

- Bun を default execution runtime とする。collector は利用可能な場合 Bun/vitest JSON output を読み、individual case data が利用できない場合は command/evidence digest へ fallback する。
- DB write は core runtime で `bun:sqlite` を使う。external adapter は同じ schema と rebuild semantics を維持する場合だけ compatibility layer を使ってよい。
- raw provider transcript、secret、PII は挿入しない。`failure_digest` は persistence 前に redaction を適用した bounded digest とする。
- missing `plan_id`、unresolved `oracle_id`、green definition mismatch は silent drop ではなく `findings` row にする。

### §9.5 cross-artifact relation graph と diagram projection (A-124 / IMP-118..120)

DB は cross-cutting impact analysis を query 可能にしなければならない。authoring sources は docs、source files、test files、PLAN frontmatter、audit records、logs、state files のままとする。relation graph は rebuildable projection であり、「これが変わった場合、他に何を review / fix / test / redraw すべきか」に harness が答えられるようにする。

| table | 主キー | 必須 columns | 目的 |
|---|---|---|---|
| `graph_nodes` | `node_id` | `node_type`, `subject_id`, `section_id` (nullable), `path`, `name`, `layer`, `kind`, `status`, `source`, `indexed_at` | source file、module、docs、PLAN、FR/AC/AT ID、DB table、test、finding、diagram を graph node に正規化する。`section_id` は doc 内 section granularity を保ち、impact expansion が section-level change を whole-doc node に潰さないようにする (A-128 F-3 / IMP-129①)。 |
| `dependency_edges` | `edge_id` | `from_node_id`, `to_node_id`, `edge_kind`, `strength`, `source`, `evidence_path`, `is_expected`, `is_actual`, `indexed_at` | import/reference/test/projection/implementation edge を保存し、design-declared expected edge と observed actual edge を区別する。 |
| `impact_rules` | `impact_rule_id` | `trigger_edge_kind`, `trigger_node_type`, `required_node_type`, `required_action`, `severity`, `gate`, `enabled` | relation edge を required co-change、review、test、Reverse、diagram-refresh action へ変換する。 |
| `impact_results` | `impact_result_id` | `change_set_id`, `root_node_id`, `impacted_node_id`, `required_action`, `status`, `reason`, `evidence_path`, `computed_at` | diff/session/PLAN ごとに算出した impact expansion を 1 件として永続化する。 |
| `artifact_progress` | `artifact_path` | `artifact_type`, `artifact_hash`, `state`, `color`, `linked_test_ids`, `linked_test_paths`, `linked_test_count`, `passed_test_run_ids`, `passed_test_run_count`, `dependency_checked`, `dependency_check_run_id`, `dependency_checked_at`, `dependency_check_source`, `open_dependency_impacts`, `recovery_plan_ids`, `reason`, `indexed_at` | rebuildable な artifact progress color row を永続化する。未検査/open dependency impact は red、実装済みだが未検証または recovery 中は yellow、passing test run に link した artifact は green とする。 |
| `artifact_progress_events` | `artifact_progress_event_id` | `artifact_path`, `artifact_type`, `previous_color`, `color`, `state`, `trigger`, `test_run_ids`, `dependency_check_run_id`, `recovery_plan_ids`, `reason`, `occurred_at` | artifact progress row から派生した workflow trigger 用の rebuildable event view。 |
| `tool_runs` | `tool_run_id` | `tool_name`, `tool_version`, `command`, `input_scope`, `exit_code`, `started_at`, `completed_at`, `evidence_path` | dependency-cruiser、Knip、Madge、Graphviz、Mermaid、D2 など optional adapter run を記録する。 |
| `diagram_artifacts` | `diagram_id` | `graph_snapshot_id`, `format`, `path`, `renderer`, `scope`, `created_at`, `evidence_path` | generated Mermaid/DOT/D2/SVG/PNG diagram output を traceable artifact として保存する。 |
| `graph_snapshots` | `graph_snapshot_id` | `scope`, `node_count`, `edge_count`, `hash`, `created_at`, `source_digest` | diagram と impact result を stable graph snapshot から再現可能にする。 |

必須 edge kind:

- `imports`: TS/JS import relation。
- `references`: Markdown/YAML/JSON path または ID reference。
- `declares_module`: design artifact が source module/building block を declare する。
- `implements`: source module が PLAN/FR/artifact を implement する。
- `tests`: test case/file が source module、artifact、FR、oracle を exercise する。
- `projects_to`: source doc/state/log が DB table へ project する。
- `visualizes`: diagram artifact が graph snapshot または scope を visualize する。

`artifact_progress` color semantics (FR-L1-51 / PLAN-L7-56 / PLAN-REVERSE-56):

- `red`: `dependency_checked = 0`、`open_dependency_impacts > 0`、または changed artifact が impact expansion 上の required design/requirement/test back-propagation を欠く状態。これには「implementation は存在するが L1/L3/L4/L5 registration が欠落する」を含む。
- `yellow`: implementation または recovery work は存在するが、linked test evidence がない、または linked passing `test_runs` row がない状態。new artifact は dependency と test-run evidence が利用可能になるまで yellow として projection に入る。
- `green`: `passed_test_run_count > 0`、`passed_test_run_ids` が passing `test_runs` row を特定する、`dependency_checked = 1`、`open_dependency_impacts = 0` を満たす状態。
- `dependency_check_run_id` / `dependency_checked_at` は dependency state を正当化した relation-impact check を記録する。`dependency_checked=1` は「row がない」ことだけから infer しない。
- `recovery_plan_ids` は red/yellow artifact を green に戻す active recovery/fullback/refactor PLAN を記録する。active recovery は red impact row を yellow recovering row に変えるが、closure には green test-run evidence と clean dependency impact が必要である。
- `feedback_events.source_table/source_id/source_color` は red/yellow `artifact_progress` row を workflow trigger input として記録し、recovery/reverse/refactor work を prose handover ではなく DB state から開始できるようにする。

必須 index:

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

不変条件:

- すべての edge は既存の `graph_nodes` を参照する。
- すべての non-local source change は、`impact_results` row か impact expansion を実行できなかった理由を示す `findings` row のいずれかを生成する。
- expected-vs-actual mismatch は `findings` row になり、silent repair しない。
- diagram artifact は `graph_snapshots` から派生する。diagram を delete しても graph state は delete しない。
- external tool output は gate 利用前に正規化する。tool-specific JSON/DOT/Mermaid/D2 output は evidence であり、gate source of truth ではない。

tool adapter profile:

- core parser: TypeScript/Bun AST と Markdown/YAML scanner。これを default SSoT path とする。
- optional dependency rule/graph は `dependency-cruiser` とする。
- optional unused dependency/export/file detector は `knip` とする。
- optional circular graph helper は `madge` とする。
- optional renderer: large SVG/PDF/PNG には Graphviz DOT、GitHub-readable Markdown diagram には Mermaid、presentation-quality architecture diagram には D2 を使う。

初期 impact rule:

- changed `src/**` node は、related design artifact、test/test-design artifact、reverse dependencies の review を要求する。
- changed design/test-design doc は、paired V-model artifact と trace edge review を要求する。
- changed DB projection table は、対応する `projects_to` source docs/state/logs と dependent quality/impact query の review を要求する。
- changed relation graph snapshot は、同じ scope の diagram artifact refresh または stale marking を要求する。

### §9.6 MCP と external verification profile projection (A-125 / IMP-121..124)

A-125 は relation graph を externally installed MCP servers、plugins、test foundations へ拡張する。これらは authoring source ではない。environment-dependent verification profiles として、discovery、probe result、invocation、normalized findings を query 可能にしなければならない。

| table | 主キー | 必須 columns | 目的 |
|---|---|---|---|
| `mcp_server_profiles` | `mcp_profile_id` | `name`, `package_ref`, `source_url`, `transport`, `command`, `args_digest`, `allowed_tools`, `read_only`, `requires_network`, `requires_docker`, `requires_auth`, `risk_tier`, `enabled`, `source`, `indexed_at` | Playwright、GitHub read-only、filesystem-workspace、git-workspace、fetch、sqlite、Docker MCP gateway などの allowed MCP profile を catalog 化する。 |
| `mcp_profile_triggers` | `trigger_id` | `mcp_profile_id`, `signal`, `workflow`, `layer`, `gate`, `reason`, `enabled` | agent memory に依存せず、workflow signal を profile recommendation へ map する。 |
| `mcp_server_runs` | `mcp_run_id` | `mcp_profile_id`, `session_id`, `plan_id`, `command`, `method`, `tool_name`, `started_at`, `completed_at`, `exit_code`, `evidence_path`, `normalized_status` | MCP Inspector、profile probe、allowed MCP tool invocation を永続化する。 |
| `verification_profiles` | `verification_profile_id` | `name`, `profile_type`, `package_refs`, `requires_docker`, `requires_browser`, `requires_network`, `green_definition_id`, `trigger_signals`, `enabled` | Vitest browser + Playwright、Testcontainers、MSW などの external test foundation を catalog 化する。 |
| `verification_recommendations` | `verification_recommendation_id` | `change_set_id`, `plan_id`, `profile_id`, `profile_kind`, `reason`, `source_rule`, `accepted`, `created_at` | relation-graph impact expansion が change に対して推奨した MCP/test profile を保存する。 |
| `external_tool_findings` | `external_finding_id` | `source_run_id`, `source_kind`, `finding_type`, `severity`, `subject_id`, `path`, `status`, `digest`, `created_at` | MCP、browser、container、mock/test profile output を gate-queryable finding へ正規化する。 |

必須 index:

- `idx_mcp_profile_name(name)`.
- `idx_mcp_triggers_signal(signal, workflow, gate)`.
- `idx_mcp_runs_profile_plan(mcp_profile_id, plan_id, started_at)`.
- `idx_verification_profile_type(profile_type, enabled)`.
- `idx_verification_recommendations_change(change_set_id, profile_kind, accepted)`.
- `idx_external_tool_findings_subject(subject_id, status, severity)`.

不変条件:

- enabled MCP profile はすべて allow-list と explicit `risk_tier` を持つ。
- `requires_auth=true` の profile は repo-tracked config だけでは enable できない。
- workspace filesystem/git profile は mount または repository path を workspace root に scope しなければならない。
- browser と Docker profile は利用不能でも recommendation され得る。absence は silent pass ではなく `findings` row にする。
- external command が実際に走った場合、`mcp_server_runs` と `verification_recommendations` は `tool_runs` (§9.5) または `test_runs` (§9.4) に join する (cross-section reference made explicit, A-128 F-3 / IMP-129⑤)。
- gate decision は normalized profile/run/finding row を使う。raw MCP output、screenshot、trace、log は bounded evidence artifact に留める。

初期 trigger rule:

- `ui_flow`, `web_target`, `browser_regression` -> `playwright-mcp` と `vitest-browser-playwright` を推奨する。
- `ci_failure`, `pr_review`, `backlog_sync` -> `github-mcp-readonly` を推奨する。write-capable GitHub profile は human approval を要求する。
- `db_integration`, `migration`, `service_contract` -> `testcontainers-node` と DB projection review を推奨する。
- `api_mock_gap`, `flaky_external_api` -> `msw` を推奨する。
- `mcp_server_added`, `mcp_profile_changed` -> accept 前に MCP Inspector `tools/list` smoke を要求する。

### §9.7 canonical document export projection の定義 (A-126 / IMP-126)

A-126 は canonical UT-TDD document に対する generated spreadsheet / Excel / PPTX conversion を追加する。これらの output は authoring source ではない。concept/planning docs、requirements、detailed design、PLAN、ADR、test-design、trace rows、normalized evidence links から派生する。

| table | 主キー | 必須 columns | 目的 |
|---|---|---|---|
| `document_export_profiles` | `document_export_profile_id` | `name`, `source_doc_family`, `format`, `renderer`, `package_ref`, `source_url`, `built_in`, `requires_package`, `requires_d2`, `enabled`, `risk_tier`, `trigger_signals` | canonical document family 向けの CSV、Markdown summary、XLSX、PPTX、D2-PPTX export profile を catalog 化する。 |
| `document_export_runs` | `document_export_run_id` | `profile_id`, `session_id`, `plan_id`, `source_doc_family`, `source_paths_digest`, `source_snapshot_hash`, `redaction_profile`, `started_at`, `completed_at`, `exit_code`, `evidence_path`, `normalized_status` | document conversion attempt と、その build に使った source snapshot を 1 件として記録する。 |
| `document_export_datasets` | `document_export_dataset_id` | `export_run_id`, `dataset_kind`, `row_count`, `column_digest`, `source_paths`, `source_section_digest`, `created_at`, `hash` | renderer output を reproduce / audit できるよう、render 前の document matrix/deck dataset summary を永続化する。 |
| `document_export_artifacts` | `document_export_artifact_id` | `export_run_id`, `format`, `path`, `renderer`, `byte_size`, `hash`, `created_at`, `evidence_path`, `stale_status` | generated CSV/Markdown/XLSX/PPTX artifact metadata を traceable document conversion evidence として保存する。 |
| `document_export_triggers` | `trigger_id` | `document_export_profile_id`, `signal`, `workflow`, `layer`, `gate`, `reason`, `enabled` | export trigger signal (requirements §6.8.11、`document_export_profile_changed` を含む) を export profile recommendation へ map する。これは `mcp_profile_triggers` と対称である (A-128 F-3 / IMP-129④)。 |

必須 index:

- `idx_document_export_profile_family(source_doc_family, format, enabled)`.
- `idx_document_export_run_family(source_doc_family, plan_id)`.
- `idx_document_export_run_snapshot(source_snapshot_hash)`.
- `idx_document_export_artifact_format(format, stale_status)`.
- `idx_document_export_triggers_signal(signal, workflow, gate)`.

不変条件:

- export artifact はすべて `document_export_run` を参照する。
- export run は source document paths、source snapshot hash、redaction profile を持つ。
- built-in CSV / Markdown table export は external package なしで利用可能とする。
- XLSX / PPTX / D2-PPTX profile は renderer readiness が証明されるまで disabled とする。renderer availability 欠落は finding にする。
- export dataset は、存在する source section ID、FR/AC/AT ID、PLAN ID、ADR ID、trace ID、status field、evidence link を保持する。
- export dataset は rendering 前に redact する。raw provider transcript、credential、secret、PII、raw MCP payload、screenshot、browser trace は export row に保存しない。
- generated file は evidence に限る。canonical Markdown/docs は source of truth のままとする。

初期 export profile:

- `doc-csv-matrix`: requirements、design、PLAN、ADR、trace、test-design の matrix rows。
- `doc-markdown-summary`: source links 付きの GitHub-readable conversion summary。
- `doc-xlsx-workbook`: ExcelJS または SheetJS optional renderer による multi-sheet workbook。
- `doc-pptx-deck`: PptxGenJS optional renderer による concept/requirements/design/ADR/PLAN/test-design deck。
- `doc-d2-pptx-diagram`: D2 optional renderer による graph/architecture/workflow diagram deck output。

### §9.8 screen entity と FR/BR→screen trace projection (IMP-140)

IMP-140: 15 screens (PM/HM/GD) と FR/BR→screen trace は `screen-list.md` / `screen-requirements.md` doc source のみに存在し、harness.db には存在しなかった。この projection により、HM-04 (DB browse)、HM-01 (feature-list → screen-requirement)、PM-06 (design-doc viewer) は doc-only ではなく DB-driven になる。screens は not-implemented とする (NFR-08、src/web は Phase B)。

| table | 主キー | 必須 columns | 目的 |
|---|---|---|---|
| `screens` | `screen_id` | `name`, `category`, `url`, `l1_ref`, `status`, `implemented`, `indexed_at` | 15 screens projected from `screen-list.md` §1 (画面 ID / 名 / カテゴリ / URL / L1 参照). `implemented=0` / `status=not-implemented` (NFR-08). |
| `screen_trace` | `screen_trace_id` | `screen_id`, `requirement_id`, `requirement_kind`, `relation`, `source` | `screen-requirements.md` §5.5 から FR/BR/UX → screen reverse-trace edge を project する。`requirement_kind` ∈ {fr, br, ux}。HM-01 feature-list → screen-requirement navigation を DB から支える。 |

必須 index:

- `idx_screens_category(category, screen_id)`.
- `idx_screen_trace_screen(screen_id, requirement_kind)`.

不変条件:

- `screens` row count は screen-requirements §1 の declared count (15 = PM 6 + HM 8 + GD 1) と一致する。`doc-consistency` gate も同じ doc source を数える。
- すべての `screen_trace.screen_id` は `screens.screen_id` を参照する (orphan trace edge なし)。
- `screens.implemented=0` は src/web (Phase B) まで維持する。反転には NFR-08 implementation-truthfulness evidence を要求する。
- source of truth は docs のままとする。この projection は `ut-tdd db rebuild` で deterministic に rebuild される derived read model であり、別の authoring surface ではない。

### §9.9 Vモデル spec IR / 工程 / 活性化 / 起票候補 projection (PLAN-L5-13)

PLAN-L4-19 の宣言型 spec IR は、Vモデル改善に伴う検出系・起票補助の DB 正規形である。DB は設計正本ではなく、docs / PLAN / test-design / 工程管理表 / activation profile から deterministic に再構築される projection である。検出系はこの projection を query して不足・孤児・工程ズレ・profile 不一致を見つけるが、最終的な FilingTarget は L4 function §3.2.1 の SSoT から導出する。

| table | 主キー | 必須 columns | 入力 | 目的 |
|---|---|---|---|---|
| `spec_defs` | `spec_id` | `spec_kind`, `layer`, `sub_doc`, `owner_artifact_id`, `owner_path`, `section_anchor`, `title`, `lifecycle_status`, `plan_id`, `source_path`, `source_hash`, `indexed_at` | 所有 artifact 本文の `spec.defines` / `docs/governance/vmodel-typed-spec-definitions.md` bootstrap / design docs / PLAN frontmatter / test-design headings | 要件・設計要素・テスト設計要素を安定 ID と章 anchor で検索可能にする。typed spec 宣言は `section_anchor=spec.defines:<id>` として格納し、見出し推測より優先する。 |
| `spec_relations` | `relation_id` | `from_spec_id`, `to_spec_id`, `relation_kind`, `plan_id`, `status`, `source`, `evidence_path`, `indexed_at` | `spec.defines[].traces_from` / `traces_to` / `tests` / pair 宣言 / design-to-test 参照 / PLAN dependencies | `defines` / `requires` / `verifies` / `pairs` / `derives` / `supersedes` / `traces_from` / `traces_to` / `tests` を edge として保存し、未定義・未参照・双方向不一致・test backlink 欠落・missing-test・ledger mismatch を検出する。 |
| `schedule_entries` | `schedule_entry_id` | `plan_id`, `layer`, `sub_doc`, `v_pair`, `predecessor_plan_ids`, `current_location`, `rag`, `status`, `blocked_reason`, `source_path`, `source_hash`, `indexed_at` | `docs/governance/vmodel-upgrade-schedule.md` / Forward spine / PLAN frontmatter fallback | 現在地と次工程を query 可能にし、工程表の空セル・逆流・未合流 branch を検出する。専用工程表に掲載された `plan_id` は PLAN frontmatter fallback より優先する。`predecessor_plan_ids` は comma を含まない plan_id list の serialized TEXT とする。 |
| `activation_entries` | `activation_entry_id` | `profile_id`, `target_kind`, `target_id`, `scope_status`, `target_version`, `defer_reason`, `enabled`, `source_path`, `plan_id`, `indexed_at` | `docs/governance/vmodel-activation-profiles.md` / activation profile / version target / 適用除外宣言 / PLAN frontmatter fallback | profile ごとの in_scope / out_of_scope / deferred を明示し、駆動モデル選択を厳格化する。専用 activation profile に掲載された `plan_id` は PLAN frontmatter fallback より優先する。 |
| `activation_schedule_reviews` | `activation_schedule_review_id` | `profile_id`, `plan_id`, `schedule_entry_id`, `activation_entry_id`, `target_kind`, `target_id`, `scope_status`, `enabled`, `target_version`, `defer_reason`, `current_location`, `rag`, `schedule_status`, `layer`, `sub_doc`, `v_pair`, `source_path`, `indexed_at` | `activation_entries` × `schedule_entries` | version-up wave の対象/除外/延期理由と現在地を join し、検索・検出が同じ read-model を参照できるようにする。 |
| `document_catalog_entries` | `document_catalog_entry_id` | `doc_type_id`, `layer`, `sub_doc`, `category`, `requirement_class`, `applicability`, `default_status`, `source_doc_family`, `authoring_source_path`, `projection_table`, `profile_controlled`, `skip_reason_required`, `source_path`, `indexed_at` | `docs/governance/vmodel-document-catalog.md` | ZIP `catalog.yaml` 相当の文書種別カタログを投影する。`document-system-map.md` は意味定義、本 table は検出・検索が読む機械可読 read-model。 |
| `spec_rag_closure_entries` | `spec_rag_entry_id` | `spec_id`, `spec_kind`, `layer`, `sub_doc`, `rag`, `closure_status`, `requires_test`, `upstream_count`, `downstream_count`, `test_count`, `finding_count`, `impact_summary`, `source_path`, `indexed_at` | `spec_defs` × `spec_relations` × typed-spec closure findings | 要求・設計 ID がテストまで到達しているかを RAG read-model として保持する。`schedule_entries.rag` とは別概念であり、工程の現在地ではなく spec 閉包状態を表す。 |
| `detector_route_candidates` | `route_candidate_id` | `source_table`, `source_id`, `detector_id`, `finding_kind`, `severity`, `subject_kind`, `subject_id`, `filing_target_id`, `target_layer`, `target_sub_doc`, `candidate_status`, `reason`, `evidence_path`, `computed_at` | findings / quality_signals / spec_relations / schedule_entries / activation_entries | 検出結果を起票候補として保持する。`target_layer` / `target_sub_doc` は function §3.2.1 から再導出した snapshot であり、DB 独自の決定ではない。 |
| `agent_contracts` | `agent_contract_id` | `target_path`, `defines`, `read_first`, `done_when`, `source_path`, `source_hash`, `indexed_at` | `docs/governance/vmodel-agent-contracts.md` の `agent_contracts` 宣言 | ZIP の doc-local agent 契約を HARNESS の authoring source 契約として query 可能にする。`defines` / `read_first` / `done_when` は pipe-serialized TEXT で保持し、projection は source doc を更新しない。 |

必須 index:

- `idx_spec_defs_owner(owner_path, section_anchor)`.
- `idx_spec_defs_kind_layer_status(spec_kind, layer, lifecycle_status)`.
- `idx_spec_defs_plan(plan_id)`.
- `idx_spec_relations_from_kind(from_spec_id, relation_kind)`.
- `idx_spec_relations_to_kind(to_spec_id, relation_kind)`.
- `idx_schedule_plan_status(plan_id, status, rag)`.
- `idx_schedule_layer_subdoc_status(layer, sub_doc, status)`.
- `idx_activation_profile_status(profile_id, scope_status)`.
- `idx_activation_version_status(target_version, scope_status)`.
- `idx_activation_schedule_plan_profile(plan_id, profile_id, scope_status)`.
- `idx_activation_schedule_scope_rag(scope_status, rag, enabled)`.
- `idx_document_catalog_layer_subdoc(layer, sub_doc, applicability)`.
- `idx_document_catalog_doc_type(doc_type_id, default_status)`.
- `idx_spec_rag_closure_rag_status(rag, closure_status)`.
- `idx_spec_rag_closure_spec(spec_id, requires_test)`.
- `idx_detector_candidates_source(source_table, source_id)`.
- `idx_detector_candidates_filing(filing_target_id, severity, candidate_status)`.
- `idx_detector_candidates_subject(subject_id)`.
- `idx_agent_contracts_target(target_path)`.

不変条件:

- すべての `spec_relations.from_spec_id` / `to_spec_id` は `spec_defs.spec_id` を参照する。orphan relation は `findings.kind=spec-ir-orphan-relation` として fail-close する。
- `spec_defs.layer` / `sub_doc` は `VALID_SUB_DOCS` と frontmatter schema に従う。未知 layer/sub_doc は projection で補正せず `findings` にする。
- typed spec 宣言の ID 形式、kind 欠落、重複 ID は `typed-spec-invalid-id` / `typed-spec-kind-missing` / `typed-spec-duplicate-id` finding にする。
- typed spec 宣言の `traces_from` / `traces_to` は双方向に閉じる。片側欠落は `typed-spec-trace-reverse-missing` finding にする。
- typed spec 宣言の `tests` は test spec 側の `traces_from` と閉じる。片側欠落は `typed-spec-test-backlink-missing` finding にし、test を要求する kind に test edge が無い場合は `typed-spec-test-missing` finding にする。
- typed spec 宣言は本文実体、台帳行、V-model phase と突合する。本文実体欠落は `typed-spec-body-missing`、台帳行欠落は `typed-spec-ledger-row-missing`、台帳ID未知は `typed-spec-ledger-unknown-id`、台帳ID重複は `typed-spec-ledger-duplicate-id`、phase 欠落は `typed-spec-ledger-phase-missing`、phase 逆流は `typed-spec-phase-direction-invalid` finding にする。
- typed spec 宣言の `source_path` が台帳 `ledger_sources` に含まれない場合は `typed-spec-owned-source-mismatch` finding にする。これは central bootstrap に残った所有外宣言、または誤った artifact への宣言移動を検出する。
- typed spec 宣言元 artifact から owner phase を解決できない場合は `typed-spec-owner-phase-missing`、台帳 `v_phase` と owner phase が食い違う場合は `typed-spec-phase-layer-mismatch` finding にする。owner phase は `typed_spec_phase_owner`、`executed_at_layer`、`layer`、path 由来 layer の順で解決する。
- agent contract は `target_path` / `defines` / `read_first` / `done_when` を必須とする。`target_path` または `read_first` 参照先欠落は `agent-contract-target-missing` / `agent-contract-read-first-missing`、空 `defines` / `done_when` は `agent-contract-defines-missing` / `agent-contract-done-when-missing`、`done_when` の未知 doctor gate は `agent-contract-doctor-gate-unknown` finding にする。
- `schedule_entries` は工程管理表と PLAN frontmatter fallback の projection であり、PLAN status や dependencies を暗黙更新しない。工程表掲載 row は fallback row に上書きされない。
- `activation_entries.scope_status=out_of_scope|deferred` は理由 (`defer_reason`) を必須とし、理由なし除外は `findings.kind=activation-reason-missing` とする。
- `activation_schedule_reviews` は `activation_entries.plan_id` と `schedule_entries.plan_id` の join 結果である。工程表に存在しない `target_kind=plan` は `findings.kind=activation-schedule-missing` とし、projection 側で工程行を創作しない。
- `document_catalog_entries` は `vmodel-document-catalog.md` からのみ作る。`document-system-map.md` の本文表を直接 scrape して正本化せず、意味定義と機械可読一覧を分離する。
- `spec_rag_closure_entries` は typed spec 宣言と trace closure finding から作る派生 read-model であり、source doc、PLAN、`schedule_entries.rag` を更新しない。`green` は test 到達済みかつ closure finding なし、`yellow` は test 到達済みだが closure finding あり、`red` は test を要求する spec が test 到達 0 の状態を表す。
- `detector_route_candidates` は FilingTarget 決定表ではない。candidate row は signal / subject / evidence / current_location を提供し、`route eval` は L4 function §3.2.1 の FilingTarget SSoT を読んで `allowed_kinds` / `layer_band` / `sub_doc_hint` / `pairing_obligation` を決定する。
- raw provider transcript、secret、credential、PII、未redact payload はいずれの table にも保存しない。
- `spec_relations` は仕様 IR の semantic edge であり、§9.5 `dependency_edges` は横断 impact graph の edge である。両者を同じ table に畳まず、後続 U4 では join で接続する。

実装 carry:

- U3 L7 では `src/schema/harness-db-tables-spec-ir.ts` を新設し、`harness-db-catalog.ts` / `harness-db-indexes.ts` へ registry 連結する。新 table 追加時は `SCHEMA_VERSION` を 19 から bump し、migration は append-only / rebuildable projection とする。
- `src/state-db/projection-writer.ts` は rebuild transaction 内で `projectSpecIr(...)` 系を呼ぶ。parser/projection は `src/state-db/spec-ir-projections.ts` などへ分離し、projection-writer は orchestration に留める。
- candidate 生成は `findings` / `quality_signals` / spec IR / schedule / activation / activation schedule review を join するが、PLAN 起票や frontmatter 更新は行わない。
- `recordProjectionEvent` は schema にない列を保持しないため、列名 typo は U3 L7 の test で検出する。単一 PLAN を表さない値は `plan_id` に入れず、複数 plan は専用 serialized field または relation table へ逃がす。
- L8 は IT-SPECIR-01..04 で、projection の冪等性、orphan fail-close、FilingTarget 非創作、activation 理由必須 / raw payload 非保存を検証する。

## §9.15 Vモデル engine-swap 物理データ群 (PLAN-L5-16〜19 / 21〜22)

### §9.15.1 authoring source と projection 境界

engine-swap の正本は `docs/governance/**`、`docs/process/vmodel-contract.yaml`、PLAN、test-designに置く。
以下のDB tableは検索・join・rebuild用projectionであり、未記入disposition、semantic verdict、profile override、
workflow transition、evidence、doc監査判断を補完してはならない。

| 物理データ群 | 主キー / identity | authoring source | 不変条件 |
|---|---|---|---|
| source/item/target | `source_id`, `item_id`, `edge_id` | source manifest / item catalog / source-target edges / `vmodel-item-target-ledger.md` | manifest宣言件数=record件数、orphan 0。checked fixtureは109/163/21。item targetをsource edgeから推論しない |
| profile | `profile_id`, `override_id` | 規模profile catalog | manifest宣言件数=record件数、unknown/同優先度競合 fail-close。checked fixtureはsize 3 + product 5 |
| PLAN Asset | `asset_id`, `(asset_id, revision)` | PLAN Asset v2 / migration ledger | renameでidentity不変、revision単調増加 |
| workflow/evidence | `event_id`, `evidence_id` | append-only ledger | subject revision/commit/digest/expiry拘束 |
| Vモデルcontract | `(contract_revision, rule_id)` | `vmodel-contract.yaml` | L0-L14/G0.5-G14を重複なく1回ずつ定義 |
| docs disposition | `(baseline_id, path)` | manifest + zone shard | baseline path exactly once、delta明示、pending 0 |
| semantic assessment | `(item_id, assessment_revision)` | self-assessment catalog | verified 3面証拠、partial/gap debt route必須 |
| 自己証明 | `(rule_id, contract_revision, verifier_version)` | 追記専用receipt/corpus | registry/receiptを重複なく1回ずつ定義、mutation survivor 0 |

### §9.15.2 repository文書snapshot / shard schema

`docs/governance/repository-document-disposition/manifest.yaml`は`schema_version`、baseline/final snapshot、
`path_stream_algorithm=git-ls-tree-z-v1`、commit、tree OID、tracked count、raw NUL stream SHA-256、deltaを持つ。
zone shardの全recordは`path`、baseline blob/digest、zone、disposition、reason、targets、plan IDs、impact tags、
authoring provenance、application statusを必須とする。selectorはauthoring CLIの入力に使えるが、最終recordへ
materializeされないselector自体を正本にしない。Markdown ledgerは生成view、DBはprojectionである。

### §9.15.3 索引 / rebuild / 保持

- source/item/target/profileはIDと逆引きtarget、PLAN Assetはalias/revision、workflowはsubject+sequence、evidenceはsubject+revisionへindexを張る。
- docs ledgerはpath/zone/disposition/impact tag、semantic assessmentはverdict/debt PLAN、self-proofはrule/surface/mutationへindexを張る。
- append-only event/receipt/reviewを更新・削除で上書きせず、supersessionを新eventとして記録する。
- projection全削除/rebuild後にrow countだけでなくidentity集合、digest、reduction verdict、finding IDが一致しなければfail-closeする。
- raw ZIP本文、provider transcript、secret、credential、PIIをDB/receiptへ保存しない。

### §9.15.4 column / FK / 並び順 / migration契約

| table | 必須columnと型 | key / FK / nullability | index / ordering |
|---|---|---|---|
| `vmodel_sources` | `source_id TEXT`, `ordinal INTEGER`, `source_title TEXT`, `disposition TEXT`, `target_ref TEXT`, `reason TEXT`, `row_digest TEXT`, `manifest_digest TEXT` | PK=`source_id`、`ordinal` UNIQUE、全列NOT NULL。ordinalは`ZIP-DOC-NNN`のNNNだけから導出 | `ordinal`順 |
| `vmodel_categories` | `category_id TEXT`, `category_name TEXT`, `row_digest TEXT` | PK=`category_id`、全列NOT NULL | category index |
| `vmodel_meta_source_mappings` | `meta_source_ref TEXT`, `allowed_source_status TEXT`, `source_file_policy TEXT`, `reason TEXT`, `row_digest TEXT` | PK=`meta_source_ref`、全列NOT NULL | status/policy index |
| `vmodel_semantic_items` | `item_id TEXT`, `item_name TEXT`, `category_id TEXT`, `source_status TEXT`, `source_ref TEXT`, `source_file TEXT`, `row_digest TEXT` | PK=`item_id`、category/source FK、全列NOT NULL | category/source/item index |
| `vmodel_source_item_edges` | `edge_id TEXT`, `source_id TEXT`, `item_id TEXT`, `source_status TEXT`, `source_file TEXT`, `row_digest TEXT` | PK=`edge_id`、source/item FK、全列NOT NULL | source/item双方index |
| `vmodel_source_target_edges` | `edge_id TEXT`, `source_id TEXT`, `disposition TEXT`, `target_type TEXT`, `target_ref TEXT`, `row_digest TEXT` | PK=`edge_id`、source FK、全列NOT NULL | source/target index |
| `vmodel_item_target_edges` | `edge_id TEXT`, `item_id TEXT`, `target_status TEXT`, `target_kind TEXT?`, `target_ref TEXT?`, `plan_id TEXT?`, `reason TEXT`, `source_digest TEXT` | PK=`edge_id`、item FK、全判断でreason/source digest必須。pendingはtarget NULL、adopt/merge/reference/deferはtyped target必須 | item/status/target index |
| `document_scale_profiles` | `profile_id TEXT`, `profile_axis TEXT`, `profile_rank INTEGER`, `description TEXT`, `default_status TEXT`, `default_detail TEXT`, `scope_policy TEXT`, `row_digest TEXT` | PK=`profile_id`、axis=`size|product`、全列NOT NULL | axis+rank index |
| `document_scale_profile_entries` | `document_scale_profile_entry_id TEXT`, `profile_id TEXT`, `doc_type_id TEXT`, `decision TEXT`, `detail_override TEXT`, `status_override TEXT`, `reason TEXT`, `required_plan_id TEXT?`, `row_digest TEXT` | PK=`document_scale_profile_entry_id`、profile/doc type FK、同一profile/slot UNIQUE | profile+doc type index |
| `plan_assets` | `asset_id TEXT`, `created_at TEXT`, `created_source_commit TEXT`, `identity_algorithm TEXT` | PK=`asset_id`、全列NOT NULL。aliasを保持せずidentity rootだけを所有 | `created_at` / `created_source_commit` index |
| `plan_alias_events` | `alias_event_id TEXT`, `asset_id TEXT`, `sequence INTEGER`, `command_id TEXT`, `command_payload_digest TEXT`, `event_kind TEXT`, `alias TEXT`, `revision INTEGER`, `reason TEXT`, `occurred_at TEXT`, `event_digest TEXT` | PK=`alias_event_id`、`(asset_id,sequence)`/`command_id` UNIQUE、asset/revision composite FK。`event_kind=assigned|retired`、retiredは既存active alias必須、assignedは同alias active禁止 | asset+sequence / alias index |
| `plan_aliases` | `alias_id TEXT`, `asset_id TEXT`, `alias TEXT`, `valid_from_revision INTEGER`, `valid_to_revision INTEGER?`, `last_event_digest TEXT` | alias event reductionから再構築するalias interval projection。PK=`alias_id`、asset/revision composite FK、`valid_to_revision IS NULL`のactive aliasだけpartial UNIQUE | asset+revision / alias partial index |
| `plan_revisions` | `asset_id TEXT`, `revision INTEGER`, `canonical_payload_json TEXT`, `canonical_payload_digest TEXT`, `body_digest TEXT`, `source_path TEXT`, `source_commit TEXT`, `actor TEXT`, `reason TEXT`, `created_at TEXT` | PK=`(asset_id,revision)`、asset FK、全列NOT NULL。canonical payloadはdependency/artifact/workflow/evidence policy/unknown v1 fieldをlossless保持 | revision単調増加 / payload digest index |
| `plan_id_reservation_events` | `reservation_event_id TEXT`, `reservation_id TEXT`, `sequence INTEGER`, `command_id TEXT`, `command_payload_digest TEXT`, `event_kind TEXT`, `namespace TEXT`, `ordinal INTEGER`, `asset_id TEXT`, `lease_key_version TEXT`, `lease_token_hash TEXT`, `occurred_at TEXT`, `expires_at TEXT?`, `event_digest TEXT` | PK=`reservation_event_id`、`(reservation_id,sequence)`/`command_id` UNIQUE、asset FK、`event_kind=reserved|released|expired` CHECK。key versionは`.`を含まない非空値、token生値保存禁止 | reservation+sequence / namespace+ordinal index |
| `plan_id_reservations` | `reservation_id TEXT`, `namespace TEXT`, `ordinal INTEGER`, `asset_id TEXT`, `lease_key_version TEXT`, `lease_token_hash TEXT`, `status TEXT`, `reserved_at TEXT`, `expires_at TEXT`, `closed_at TEXT?`, `last_event_digest TEXT` | reservation event reduction current projection。PK=`reservation_id`、asset FK、status=`active|released|expired`、event stream全件でkey version/hash同一、activeのみclosed NULL、terminalのみclosed必須、`status='active'`の`(namespace,ordinal)`だけpartial UNIQUE | namespace+ordinal partial / status+expiry index |
| `legacy_plan_migration_events` | `migration_event_id TEXT`, `legacy_plan_id TEXT`, `sequence INTEGER`, `command_id TEXT`, `command_payload_digest TEXT`, `event_kind TEXT`, `asset_id TEXT`, `target_asset_id TEXT?`, `target_revision INTEGER?`, `decision TEXT`, `resolved_alias TEXT?`, `collision_group TEXT?`, `loss_fields_json TEXT`, `reason TEXT`, `review_plan_id TEXT?`, `repository_identity TEXT`, `identity_algorithm TEXT`, `identity_input_json TEXT`, `identity_digest TEXT`, `identity_config_path TEXT`, `identity_config_blob_oid TEXT`, `identity_config_content_digest TEXT`, `identity_config_receipt_digest TEXT`, `source_digest TEXT`, `occurred_at TEXT`, `event_digest TEXT` | PK=`migration_event_id`、`(legacy_plan_id,sequence)`/`command_id` UNIQUE。`asset_id`はderived identityでFKにしない。pending/rejectedはtarget両列NULL、migrated/rekeyedは`(target_asset_id,target_revision)`で実在revisionへcomposite FK。`event_kind=observed|decided|revised`。identity configのHEAD receiptをtyped列で保持 | legacy/decision/collision index |
| `legacy_plan_migrations` | `migration_id TEXT`, `legacy_plan_id TEXT`, `asset_id TEXT`, `target_asset_id TEXT?`, `target_revision INTEGER?`, `decision TEXT`, `resolved_alias TEXT?`, `collision_group TEXT?`, `loss_fields_json TEXT`, `reason TEXT`, `review_plan_id TEXT?`, `identity_digest TEXT`, `source_digest TEXT`, `last_event_digest TEXT` | migration event reduction projection。PK=`migration_id`、legacy ID UNIQUE。derived identityとadopted revision targetを分離し、eventと同じdecision-target CHECK/composite FKを持つ | decision/collision index |
| `workflow_transition_events` | `event_id TEXT`, `subject_id TEXT`, `subject_revision INTEGER`, `sequence INTEGER`, `command_id TEXT`, `command_payload_digest TEXT`, `from_state TEXT`, `to_state TEXT`, `resume_state TEXT?`, `actor TEXT`, `reason TEXT`, `source_commit TEXT`, `occurred_at TEXT`, `event_digest TEXT` | PK=`event_id`、UNIQUE=`(event_id,subject_id,subject_revision)`/`(subject_id,sequence)`/`command_id`、`(subject_id,subject_revision)`→plan revision composite FK、例外時reason必須 | subject+sequence昇順 / command index |
| `evidence_records` | `evidence_id TEXT`, `subject_id TEXT`, `subject_revision INTEGER`, `evidence_kind TEXT`, `source_commit TEXT`, `command_json TEXT`, `claims_json TEXT`, `output_digest TEXT`, `exit_code INTEGER`, `producer TEXT`, `produced_at TEXT`, `expires_at TEXT?`, `supersedes_id TEXT?`, `record_digest TEXT`, `attestation_schema TEXT?`, `attestation_algorithm TEXT?`, `authority_id TEXT?`, `attestation_key_version TEXT?`, `attestation_signature TEXT?` | PK=`evidence_id`、UNIQUE=`(evidence_id,subject_id,subject_revision)`、`(subject_id,subject_revision)`→plan revision composite FK、producer/kind CHECK、`claims_json`はkind別schemaをcanonical encode。attestation 5列は全nullまたは全non-null、identifier非空かつdot禁止。未認証recordも監査保存するがpolicy eligibleにはしない。supersedesは同subject/revision/kindの既存recordだけを指し、cycle/fork禁止。非0 exitも保存。commandはredacted argv | subject+revision+kind / supersedes index |
| `workflow_event_evidence` | `event_id TEXT`, `evidence_id TEXT`, `subject_id TEXT`, `subject_revision INTEGER`, `requirement_id TEXT` | PK=`(event_id,evidence_id,subject_id,subject_revision,requirement_id)`、event/evidence subject-revision composite FK | event / evidence索引 |
| `workflow_subject_states` | `subject_id TEXT`, `subject_revision INTEGER`, `current_state TEXT`, `resume_state TEXT?`, `last_sequence INTEGER`, `last_event_id TEXT?`, `state_digest TEXT` | workflow event reduction current projection。PK=`(subject_id,subject_revision)`、plan revision composite FK、`(last_event_id,subject_id,subject_revision)` composite FK（empty時だけNULL） | state / last event index |
| `append_command_receipts` | `command_id TEXT`, `command_type TEXT`, `subject_kind TEXT`, `subject_key TEXT`, `plan_asset_id TEXT?`, `plan_revision INTEGER?`, `command_payload_digest TEXT`, `result_kind TEXT`, `result_ref TEXT`, `recorded_at TEXT`, `receipt_digest TEXT` | PK=`command_id`、全append context横断正本。subject kind=`plan_revision|reservation|legacy_migration`。plan_revision kindだけasset/revision必須+composite FK、他kindは両方NULL | subject/type/time index |
| `authoring_command_group_headers` | `group_id TEXT`, `command_payload_digest TEXT`, `member_set_digest TEXT`, `member_count INTEGER`, `created_at TEXT`, `header_digest TEXT` | 複数authoring成果物を1 commandへ束縛するimmutable header。PK=`group_id`、`member_count > 0`、全列NOT NULL | group PK |
| `authoring_command_group_members` | `group_id TEXT`, `member_id TEXT`, `ordinal INTEGER`, `artifact_path TEXT`, `content_digest TEXT`, `expected_preimage_json TEXT`, `member_digest TEXT` | PK=`(group_id,member_id)`、header FK、`(group_id,ordinal)`と`(group_id,artifact_path)` UNIQUE。member集合はpreimageを含むID昇順canonical frameの`member_set_digest`へ束縛 | group+ordinal / path unique |
| `authoring_command_group_phase_events` | `phase_event_id TEXT`, `group_id TEXT`, `sequence INTEGER`, `command_payload_digest TEXT`, `event_kind TEXT`, `member_id TEXT?`, `publish_receipt_digest TEXT?`, `failure_reason TEXT?`, `occurred_at TEXT`, `previous_event_digest TEXT?`, `event_digest TEXT` | append-only phase journal。`prepared → (member_started → member_published)* → committed`を基本とし、途中失敗は`recovery_required`、明示補償だけ`rolled_back`。member publishはgroup/member composite FKとreceipt digest必須 | group+sequence unique/index |
| `document_snapshots` | `snapshot_id TEXT`, `commit_oid TEXT`, `tree_oid TEXT`, `tracked_count INTEGER`, `path_stream_hash TEXT`, `algorithm TEXT`, `captured_at TEXT` | PK=`snapshot_id`、commit/tree/hash UNIQUE、全列NOT NULL | commit/tree index |
| `document_dispositions` | `baseline_id TEXT`, `path TEXT`, `blob_oid TEXT`, `content_digest TEXT`, `zone TEXT`, `disposition TEXT`, `reason TEXT`, `application_status TEXT`, `provenance_digest TEXT` | PK=`(baseline_id,path)`、snapshot FK、全baseline path exactly once、全列NOT NULL | zone/disposition/status index |
| `document_disposition_targets` | `baseline_id TEXT`, `path TEXT`, `target_ordinal INTEGER`, `target_kind TEXT`, `target_ref TEXT`, `target_digest TEXT` | PK=`(baseline_id,path,target_ordinal)`、disposition FK、target実在CHECK | kind/ref index |
| `document_disposition_plan_edges` | `baseline_id TEXT`, `path TEXT`, `plan_id TEXT`, `edge_kind TEXT` | PK=`(baseline_id,path,plan_id,edge_kind)`、disposition/PLAN FK | plan/path索引 |
| `document_disposition_tags` | `baseline_id TEXT`, `path TEXT`, `impact_tag TEXT` | PK=`(baseline_id,path,impact_tag)`、disposition FK | tag/path索引 |
| `document_delta_events` | `delta_id TEXT`, `baseline_id TEXT`, `kind TEXT`, `from_path TEXT?`, `to_path TEXT?`, `before_blob_oid TEXT?`, `after_blob_oid TEXT?`, `source_commit TEXT`, `event_digest TEXT` | PK=`delta_id`、add/delete/rename/modify別CHECK、snapshot FK | baseline/kind/path index |
| `document_reference_edges` | `reference_id TEXT`, `from_path TEXT`, `to_kind TEXT`, `to_ref TEXT`, `anchor TEXT?`, `source_line INTEGER`, `edge_digest TEXT` | PK=`reference_id`、from disposition FK、typed target/anchor existence CHECK | from/to索引 |
| `document_closure_runs` | `run_id TEXT`, `baseline_id TEXT`, `final_commit_oid TEXT`, `ledger_digest TEXT`, `reference_digest TEXT`, `verdict TEXT`, `executed_at TEXT` | PK=`run_id`、snapshot FK、全列NOT NULL | baseline/time index |
| `document_closure_findings` | `finding_id TEXT`, `run_id TEXT`, `kind TEXT`, `severity TEXT`, `subject_path TEXT`, `target_ref TEXT?`, `message TEXT` | PK=`finding_id`、run FK、targetのみnullable | run/kind/path index |
| `semantic_assessments` | `item_id TEXT`, `assessment_revision INTEGER`, `verdict TEXT`, `applicability TEXT`, `profile_id TEXT?`, `applicability_reason TEXT`, `approval_ref TEXT?`, `source_digest TEXT`, `severity TEXT`, `owner TEXT`, `next_transition TEXT`, `created_at TEXT` | PK=`(item_id,assessment_revision)`、item/profile FK、conditional/NA時reason+profile+approval CHECK | verdict/applicability/owner index |
| `semantic_assessment_evidence` | `item_id TEXT`, `assessment_revision INTEGER`, `evidence_plane TEXT`, `evidence_ref TEXT`, `evidence_digest TEXT` | PK=`(item_id,assessment_revision,evidence_plane,evidence_ref)`、assessment FK、plane=`design|runtime|test` | plane/ref索引 |
| `semantic_assessment_reviews` | `review_event_id TEXT`, `item_id TEXT`, `assessment_revision INTEGER`, `decision TEXT`, `reviewer TEXT`, `reason TEXT`, `occurred_at TEXT`, `supersedes_event_id TEXT?` | PK=`review_event_id`、assessment FK、append-only | item/revision/time索引 |
| `semantic_assessment_debt_routes` | `route_id TEXT`, `item_id TEXT`, `assessment_revision INTEGER`, `plan_id TEXT`, `finding_id TEXT`, `status TEXT`, `owner TEXT`, `next_action TEXT` | PK=`route_id`、assessment/PLAN FK、partial/gap時1件以上必須 | plan/status/owner index |
| `self_proof_receipts` | `receipt_id TEXT`, `rule_id TEXT`, `detector_id TEXT`, `contract_revision TEXT`, `verifier_version TEXT`, `source_commit TEXT`, `source_hash TEXT`, `generated_hash TEXT`, `expected_exit INTEGER`, `actual_exit INTEGER`, `expected_finding_digest TEXT`, `actual_finding_digest TEXT`, `test_run_id TEXT`, `verified_at TEXT` | PK=`receipt_id`、rule+detector+revision+verifier UNIQUE、全列NOT NULL | rule/detector/revision index |
| `self_proof_fixture_executions` | `execution_id TEXT`, `receipt_id TEXT`, `fixture_id TEXT`, `fixture_kind TEXT`, `input_digest TEXT`, `expected_finding_id TEXT?`, `actual_finding_id TEXT?`, `expected_exit INTEGER`, `actual_exit INTEGER`, `duration_ms INTEGER`, `output_digest TEXT` | PK=`execution_id`、receipt FK、fixture identity UNIQUE | receipt/kind/fixture索引 |
| `self_proof_surface_observations` | `observation_id TEXT`, `receipt_id TEXT`, `surface TEXT`, `rule_identity TEXT`, `verdict TEXT`, `exit_code INTEGER`, `evidence_digest TEXT` | PK=`observation_id`、receipt FK、surface=`cli|hook|doctor|ci` CHECK | receipt/surface索引 |
| `self_proof_mutation_results` | `mutation_result_id TEXT`, `receipt_id TEXT`, `mutation_id TEXT`, `mutation_kind TEXT`, `target_digest TEXT`, `survived INTEGER`, `finding_id TEXT?`, `test_run_id TEXT` | PK=`mutation_result_id`、receipt FK、mutation identity UNIQUE、survived=0をclose条件 | receipt/survived/kind index |

`vmodel_item_target_edges` はitem→HARNESS target判断のauthoring projectionであり、`semantic_assessments`はそのtargetが
設計・runtime・testの三面で意味適合するかを判定するreview projectionである。後者からtarget判断を生成・補完せず、前者の
`edge_id` / `source_digest`をassessment evidenceから参照する。rebuild時はledger→target edge→assessmentの一方向で投影し、
同一itemのdigest不一致を`semantic-target-source-drift`としてfail-closeする。

`document_scale_profiles` / `document_scale_profile_entries` / `document_scale_profile_reviews`は同じ`doc_type_id`
bounded contextのmaster / authored decision / derived reviewである。semantic `item_id`へ置換・暗黙mapせず、別名の第二projectionも
作らない。authoring sourceは`vmodel-document-scale-profiles.md`だけとし、master/entry全fieldのround-trip digestと
entry→master/doc catalog FKを検証する。
source dispositionの値域は`adopt|merge|reference|defer|not_applicable|reject`、reasonは全状態必須とする。
item targetは`pending_review|adopt|merge|reference|defer|not_applicable|reject`、target kindは
`artifact_path|artifact_family|plan_alias|target_slot`。`pending_review`はtarget禁止、
`adopt|merge|reference|defer`はtyped target必須、`defer`は実在PLAN必須、その他のplanは任意とする。

現行schema registryがFK、NOT NULL、UNIQUE、CHECK、複合PKを表現できない場合、PLAN-L7-417はregistry modelを先に拡張する。
application validationだけでL5制約を代替してはならず、DDL制約とdomain validationの両面をRed/Greenにする。
PLAN-L7-417のDB waveでtyped `ColumnDef/TableDef`へNOT NULL、inline/composite FK、UNIQUE、閉じたCHECK AST、
composite PKを追加し、raw SQLを受け取らないDDL生成とSQLite実強制testを実装する。

projection上の導出は次に限定する。source-item `edge_id`はlength-prefixed frame
`[source_ref,item_id]`のSHA-256、各`row_digest`はauthoring rowの全column名+値、`manifest_digest`はprovenance表全体から作る。
source-targetのreasonやcategory ordinalのようにauthoringにない意味fieldは生成しない。source disposition rowとsource-target rowは
`source_id/disposition`をexact比較し、targetはtyped resolver後のcanonical identityで比較する。`plan_alias`はPLAN Asset alias、
`artifact_path`はrepo-relative normalized path、`artifact_family`はtracked member集合、`target_slot`はdocument catalog IDへ解決する。
`artifact_path`のdisposition表示だけはbasenameを許し、git tracked path集合で一意に解決できる場合だけcanonical pathへ写す。
同basename複数は多義として拒否する。display aliasとcanonical refの文字列不一致だけで拒否せず、未解決/多義だけを
`catalog-target-unresolved`で拒否する。source target typeは
`plan_alias|artifact_family|artifact_path|target_slot`であり、item target kind enumとは別型にする。

event/revision/receiptはappend-onlyとし、UPDATE/DELETEで履歴を上書きしない。schema追加は`SCHEMA_VERSION`をbumpし、
旧DBをin-place真実化せず、authoring sourceからtransactional rebuildする。migration前後でPK集合、FK orphan、
UNIQUE違反、reduction digestを比較し、差があればcommitせずrollbackする。

複数PLAN・設計・テスト設計を同時に差し替えるauthoring commandは、成果物ごとの独立callbackを完了判定に使わない。
revision write-set、header、全member（path/content digest/`expected_preimage_json`）、`prepared`を単一`BEGIN IMMEDIATE`で確定する。
`group_id + member_id`をidempotency keyとして渡す。`member_started`を先行appendし、各成功後に`member_published`をdurable appendし、全memberのreceiptが
揃った場合だけ`committed`をappendする。process crash後はjournalを再読し、記録済memberをskipして未記録memberだけを
再送する。外部publish成功とevent appendの間で停止した場合にも同じkeyを再送するため、publisher adapterはexactly-onceを
自称せずidempotent overwrite/CASを実装する。DB projectionから成果物本文を復元・創作してはならない。
Node filesystem adapterは`group_id + NUL + member_id`のSHA-256から安全な決定論token IDを導出し、memberごとに
`expectedPreimage`を必須化する。再起動時にtargetがpostimage digestと一致するだけでは成功にせず、同じtokenから導出したtemporary、rollback、
identity pinだけをdigest検証して削除し、決定論receiptを再構成する。補助pathまたはpreimageが一致しない場合はcleanupせずfail-closeする。

PLAN Asset waveでは`IndexDef`へ任意SQL文字列でなくtyped predicate（`isNull(column)` / `equals(column,value)`のみ）を追加し、
active aliasとactive ordinal leaseのpartial UNIQUEをDDL生成する。`plan_id_reservations`はauthoring/event正本ではなく
`plan_id_reservation_events`のreduction projectionであり、truncate/rebuild可能とする。履歴表
`plan_assets|plan_alias_events|plan_revisions|plan_id_reservation_events|legacy_plan_migration_events|workflow_transition_events|evidence_records|workflow_event_evidence`
は通常commandからUPDATE/DELETEせず、migration/rebuild adapterだけがtransaction内で再materializeする。
`plan_aliases|plan_id_reservations|legacy_plan_migrations`はevent reduction projectionであり、履歴正本ではない。
`workflow_subject_states`もevent reduction projectionである。event append、current projection更新、global command receipt追加は
同一`BEGIN IMMEDIATE` transactionで行う。同一command ID+同一payloadは
`command_payload_digest`（command type+subject+入力DTOのcanonical frameだけから生成）を比較して既存結果を返し、異payloadはconflict。
event ID、時刻、結果をこのdigestへ含めない。`expired` reservation eventは`now >= expires_at`かつ未releaseのactive leaseだけに許可し、
wall clock値をevent digestへ暗黙注入せずcommand inputとして記録する。

append-only history tableと`append_command_receipts`には`BEFORE UPDATE` / `BEFORE DELETE` triggerを生成して通常connectionをfail-closeする。
PLAN Asset/FSMの上表はcanonical `.ut-tdd/ledger/harness-ledger.db`に所有し、検索用`harness.db`へ同identityでprojectionする。
ledger DBのevent/receipt/current reductionは1 transactionで確定し、filesystemとの二相commit/outboxを作らない。
`harness.db` rebuildはauthoring PLAN revisionとledger DBのconsistent read transactionから新temporary tableへmaterializeし、
PK/digest/reduction照合後にtransactional swapする。projection削除はledger DBを削除せず、triggerを無効化してhistoryをtruncateしない。
ledger DB不在・schema不一致・digest破損は空ledgerとして補完せず`plan-ledger-unavailable`でfail-closeする。

`workflow_event_evidence`は`event_id,evidence_id,subject_id,subject_revision,requirement_id`を持つ複合PKとし、
`(event_id,subject_id,subject_revision)`→workflow event、`(evidence_id,subject_id,subject_revision)`→evidenceのcomposite FKで
cross-subject/revision linkをSQLite実制約として拒否する。

### 実行台帳 / GitHub投影テーブル

| テーブル | 主な列 | 制約 / 索引 |
|---|---|---|
| `execution_episodes` | `episode_id`, origin asset/revision/L/state, `escape_type`, `drive_model`, `reentry_target`, `last_sequence`, `last_event_digest`, `status` | PK episode。origin revision FK。drive/escape閉値域。current reductionのみ |
| `execution_episode_events` | `event_id`, `episode_id`, `sequence`, `event_kind(E0..E15)`, `payload_json`, `payload_digest`, `previous_event_digest`, `occurred_at`, `actor` | `(episode_id,sequence)` UNIQUE、digest連鎖、追記専用trigger |
| `github_projection_outbox` | `projection_id`, `episode_id`, `operation`, `idempotency_key`, `payload_digest`, `attempt_count`, `next_attempt_at`, `status`, `remote_ref` | idempotency UNIQUE。secret-safe payload。retry可能 |
| `github_inbound_events` | `delivery_id`, `repository`, `event_type`, `signature_verdict`, `remote_version`, `payload_digest`, `received_at`, `episode_id?`, `status` | delivery UNIQUE。未照合/署名不正を隔離 |
| `github_object_bindings` | `episode_id`, `object_kind`, `repository`, `external_id`, `number`, `url`, `remote_version`, `last_reconciled_head`, `projection_revision` | `(episode_id,object_kind)` UNIQUE。付替えはevent必須 |
| `reentry_certificates` | `certificate_id`, `episode_id`, origin/target binding, drive/intermediate evidence digest, `policy_revision`, `issued_at`, `expires_at?`, `supersedes_id?`, `certificate_digest` | episode+origin revision FK、supersession cycle/fork禁止 |
| `escape_learning_facts` | `episode_id`, origin L, escape type/cause, drive model, recurrence identity, outcome, upstream action, closed_at | E15から再構築可能、手入力status禁止 |

PLAN-L7-452の先行sliceでは、全episode schemaの完成を待たずE2 custodyとE3/E4 outbox境界を
`harness.db` schema version 27へ次の2表で実装する。これは検出器都合の簡略化ではなく、
上表の`execution_episode_events` / `github_projection_outbox`へ後続合流するまでのdurable契約である。

| テーブル | 主な列 | 制約 / 不変条件 |
|---|---|---|
| `forward_escape_validation_certificates` | `certificate_id`, `command_id`, `payload_digest`, `event_digest` | certificate PK、command/event digest UNIQUE。E2 commandとpayloadをopaque certificateへ固定し、改変時はcustody照合false |
| `forward_escape_projection_events` | `command_id`, `sequence`, `event_json`, `previous_event_digest`, `event_digest` | `(command_id,sequence)` PK、certificate command FK、event digest UNIQUE。新規系は`IssueProjectionQueued → Deferred* → IssueProjected`、採用系は`IssueAdoptionQueued → IssueAdopted`。二系統の混在、terminal後event、同commandの別preimageは禁止 |

`event_json`は種類ごとのexact key集合と閉じたfailure reasonを持つcanonical JSONだけを許可する。
読取時はsequence、previous digest、row digest、event schema、command/payload一貫性、repository/body bindingの
FSMを全て再検証する。GitHubの生error、header、transcriptは永続化せず、閉じたsecret-safe reasonへ正規化する。
version 26以前からの`migrate(db)`は既存rowを削除せずregistry DDLで2表を追加し、`PRAGMA user_version=27`へ進める。
同じversionへの再適用はno-opであり、close/reopen後もcertificateとdigest chainを再検証できなければfail-closeする。

`IssueAdoptionQueued.event_json`はrepository、issue number、expected node id、expected remote version、
expected body digestを保持する。`IssueAdopted.binding`は既存Issue preimageに加え、canonical metadata commentの
node id、URL、remote version、body digestを`contract_artifact`として保持する。Issue本文自体は更新しない。

`issue_queue`は互換read modelに降格し、新規episodeの正本にしない。移行時は既存dry-run rowをorigin不明の
episodeへ自動昇格せず、明示manifestがあるものだけimportし、残りは`legacy_unbound` findingとして保持する。
