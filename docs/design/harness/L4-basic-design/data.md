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

### §1.1 Vモデル宣言型 spec IR (PLAN-L4-19)

Vモデル改善に伴う「宣言型によるデータベース引き込み」は、設計正本を DB へ移すものではない。docs / PLAN / test-design / 工程管理表を authoring source とし、`.ut-tdd/harness.db` には検出・起票補助用の IR projection を作る。これにより検出系は、文字列探索だけでなく仕様定義・仕様間関係・工程現在地・活性化 profile を query できる。

工程管理表の専用 authoring source は `docs/governance/vmodel-upgrade-schedule.md` である。`ScheduleEntry`
projection はこの表に掲載された `plan_id` を PLAN frontmatter 由来の fallback row より優先する。未掲載 PLAN
は後方互換のため PLAN frontmatter から fallback 生成するが、これは工程表正本を補完する暫定 projection であり、
工程表に載った行を上書きしてはならない。

| IR entity / view | L4 分類 | 所属集約 | 正本 | DB projection での役割 |
|---|---|---|---|---|
| **SpecDef** | entity (子) | Artifact | 所有 artifact 本文の `spec.defines` / `docs/governance/vmodel-typed-spec-definitions.md` bootstrap / docs / PLAN / test-design の frontmatter と章 anchor | `defines` された要件・設計要素・テスト設計要素を安定 ID / owner artifact / section anchor / lifecycle で検索可能にする。typed spec 宣言がある場合は見出し推測より優先する |
| **SpecRelation** | entity (子) | Artifact | `spec.defines[].traces_from` / `traces_to` / `tests` / pair 宣言 / design-to-test 参照 | `requires` / `verifies` / `pairs` / `derives` / `supersedes` / `traces_from` / `traces_to` / `tests` を edge として保持し、未定義・未参照・双方向不一致・test backlink 欠落・missing-test・ledger mismatch を検出する |
| **ScheduleEntry** | entity (子) | Workflow | 工程管理表 / Forward spine | current_location / V-pair / predecessor / RAG / adoption / blocked reason を保持し、現在地と次工程を明示する |
| **ActivationEntry** | entity (子) | Workflow | activation profile / version target / 適用除外宣言 | profile ごとの in-scope / out-of-scope / defer reason / target version を保持し、駆動モデル選択を厳格化する |
| **ActivationScheduleReview** | derived_view | (CQRS 読みモデル) | ScheduleEntry × ActivationEntry | version-up wave の対象/除外/延期理由と現在地を join し、検索と検出が profile と工程表を同時に読めるようにする |
| **AgentContract** | entity (子) | Artifact | `docs/governance/vmodel-agent-contracts.md` の `agent_contracts` 宣言 | ZIP の doc-local `agent.read_first` / `agent.done_when` を HARNESS の authoring source 契約として保持し、編集前に読む artifact と完了 gate を検索可能にする |
| **DetectorFinding** | derived_view | (CQRS 読みモデル) | detector / doctor / review の実行結果 | artifact / relation / schedule / quality signal を route candidate 化する。FilingTarget は function §3.2.1 から導出し、検出系は layer/sub_doc/pairing を創作しない |

不変条件:

- `SpecDef` / `SpecRelation` は Artifact 集約内で完結し、Plan / Workflow を直接変更しない。
- `spec.defines` は型付き宣言正本であり、検出系は ID / kind / trace を推測で創作しない。
- typed spec の `traces_to` と相手側 `traces_from`、および `tests` と test spec 側 `traces_from` は閉包として突合する。片方向だけの宣言は検出器が補完せず finding にする。
- typed spec の本文実体、台帳行、V-model phase は宣言と同じ authoring source から読む。本文実体欠落、台帳行欠落、未知台帳ID、重複台帳ID、phase 逆流は検出器が補完せず finding にする。
- typed spec の宣言元は所有 artifact に分散する。`spec_defs.source_path` は台帳の `ledger_sources` に含まれる必要があり、中央 bootstrap doc が所有外 ID を握り続ける状態は finding にする。
- typed spec の `v_phase` は宣言元 artifact の V-model 層宣言と一致する。通常 doc は `layer` / path 由来層、test-design は `executed_at_layer`、governance doc は `typed_spec_phase_owner` を owner phase として持つ。
- `AgentContract` は doc-local agent 契約の authoring source であり、`read_first` / `done_when` を DB 側で補完しない。ZIP の `detect green` は `doctor:<gate-id>` へ翻訳された構造契約として読む。
- `ScheduleEntry` / `ActivationEntry` は Workflow 集約の projection input であり、PLAN frontmatter を暗黙更新しない。
- `ScheduleEntry` の優先順位は、専用工程管理表 → PLAN frontmatter fallback の順とする。
- `ActivationScheduleReview` は読みモデルであり、profile / 工程表 / PLAN を暗黙更新しない。
- `DetectorFinding` と DB table は読みモデルであり、authoring source ではない。
- docs/YAML/JSON 正本と projection の齟齬は doctor finding として fail-close し、projection 側で silent repair しない。
- FilingTarget の `allowed_kinds` / `layer_band` / `sub_doc_hint` / `pairing_obligation` は function §3.2.1 の SSoT から導出し、detector 固有 heuristic に閉じ込めない。

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

## §3 値オブジェクト (Value Object) — 13 種 (`src/schema/index.ts` と 1:1、SubDoc は IMP-026 で zod 化済み)

| 値オブジェクト | 値域 | src/schema |
|---|---|---|
| Kind（種別） | charter/impl/design/poc/reverse/add-design/add-impl/refactor/retrofit/recovery/troubleshoot/research/verify の 13 種 | `VALID_KINDS` |
| Layer | L0-L14 + cross (16) | `VALID_LAYERS` |
| Drive | be/fe/fullstack/db/agent (5、専門職のみ) | `VALID_DRIVES` |
| WorkflowPhase（工程） | S0-S4 (kind=poc) / R0-R4 (kind=reverse) の 10 種 | `VALID_WORKFLOW_PHASES` |
| ArtifactType | 19 種 (source_module 含む) | `VALID_ARTIFACT_TYPES` |
| DecisionOutcome（判断結果） | confirmed/rejected/pivot の 3 種 | `VALID_DECISION_OUTCOMES` |
| PromotionStrategy（昇格方針） | reuse-as-is/reuse-with-hardening/redesign/discard の 4 種 | `VALID_PROMOTION_STRATEGIES` |
| ForwardRouting | L1/L3/L4/L5/gap-only (5) | `VALID_FORWARD_ROUTING` |
| Role（役割） | po/tl/qa/aim/uiux/se/docs の 7 種 | `VALID_ROLES` |
| OrchestrationMode（編成モード） | pm_lead/claude_judge/claude_judge_codex_impl/codex_impl_qa_verify/claude_design_impl の 5 種 | `VALID_ORCHESTRATION_MODES` |
| ReverseType（逆流種別） | code/design/upgrade/normalization/fullback の 5 種 | `VALID_REVERSE_TYPES` |
| SubDoc | 層別 (L1-L6) | `VALID_SUB_DOCS` / `subDocSchema` / `frontmatterSchema` layer×sub_doc superRefine |

> mode / drive は単独の identity を持たず属性として埋め込むため **値オブジェクト** (entity ではない)。
> **Drive 値域整合 (PLAN-L4-06、drift 是正)**: `VALID_DRIVES` は **専門職 5 種のみ** (be/fe/fullstack/db/agent)。旧記載の mode 値 (scrum/reverse/poc/troubleshoot) は **drive ではなく entry mode** であり、`PLAN-DISCOVERY-04 V7 / PLAN-REVERSE-01 R3` で drive enum から除去済 ([[feedback_drive_is_specialist_not_mode]])。drive=専門職 / mode=駆動モデル を混同しない (mode は function §3.1)。
> **SubDoc 注記**: 値域は requirements §1.10.G.1 VALID_SUB_DOCS (text spec) を `src/schema/index.ts` の `VALID_SUB_DOCS` / `subDocSchema` に定数化済み。`frontmatterSchema` は kind=design + L1-L6 の `sub_doc` 必須と layer 別値域を fail-close で検査する。

### §3.1 値オブジェクト実装方針 (PLAN-L4-21、ZIP 94 相当)

値オブジェクトは enum の別名ではなく、不正状態を作らせない境界である。後続 L6/L7 実装は次の方針を
薄めてはならない。

| 契約 | 内容 | 適用境界 |
|---|---|---|
| 完全コンストラクタ | 必須属性は生成時にすべて受け取り、生成後に追加必須値を埋める two-step 初期化を禁止する。 | 新規 domain/value object、既存 `src/schema` 由来 VO wrapper を追加する場合 |
| 不変性 | VO は値等価で扱い、外部から mutation できる public mutable field / setter を持たない。配列・object を保持する場合は defensive copy または readonly view とする。 | `Kind` / `Layer` / `Drive` / `SubDoc` / `GateId` / `PlanId` など |
| 生成/再構築分離 | user input から作る `create` と、trusted projection / persisted state から戻す `reconstruct` を同じ関数に混ぜない。`reconstruct` は validation bypass ではなく、保存済み schema version と整合することを確認する。 | DB projection、frontmatter parse、`.ut-tdd/*` state 読込 |
| 不変条件の同居 | VO の値域・正規化・比較条件は呼び出し側に分散させず、VO か schema SSoT に置く。 | `src/schema/index.ts`、将来の VO module |
| 失敗表現 | 無効値は boolean/null で潰さず、typed finding / zod issue / explicit error state として返す。 | authoring source parse、lint、doctor、CLI input |

既存 harness は現時点で zod enum と string ID が中心で、domain class 量は薄い。したがって本設計は既存全 string
ID の即時 wrapper 化を要求しない。ただし新規 domain object / VO を追加する PLAN は、本節に従い
`parent_design` または design impact で VO 契約を明示する。

### §3.2 クラス・メソッド構造規約 (PLAN-L4-21、ZIP 95 相当)

AI が生成する TypeScript core は、後でリファクタする前提ではなく、設計時点で保守可能な形へ制約する。
`docs/governance/coding-rules.md` は実装形状の SSoT として次の構造規約を持つ。

| rule id | 設計閾値 | hard 化の考え方 |
|---|---|---|
| `max-nesting-depth` | source function 内の制御ネストは原則 3 以下。4 以上は early return / guard clause / 関数分割を検討する。 | L7 実装 PLAN で AST lint を追加し、既存 debt は件数を実測して grandfather 期限を切る。 |
| `max-function-lines` | source function / method は概ね 80 nonblank lines 以下。超過は domain step、policy table、projection helper へ分割する。 | test helper は対象外。source 既存 debt は baseline ではなく refactor candidate へ送る。 |
| `max-cyclomatic-complexity` | source function の分岐点は概ね 12 以下。分岐表が増える場合は declarative registry / policy module へ外部化する。 | `externalize-policy` refactor candidate と接続する。 |
| `command-query-separation` | state/file/DB を変更する command は値を query result として返さない。query は mutation しない。 | CLI command handler など副作用境界は例外ではなく、command result DTO として明示する。 |
| `prefer-guard-clause` | `else` 連鎖で正常経路を深くしない。失敗条件は先に返し、main path を浅く保つ。 | 自動検出は false-positive を避けるため L7 で限定 pattern から始める。 |

これらは本 L4 で設計契約を固定し、機械実装は L6 function contract / L7 add-impl で段階導入する。
閾値を既存 detector の都合で緩める場合は、実測 debt と期限付き例外を PLAN に記録する。

## §4 entity ID 規約 (集約横断、既存 lint regex と一致)

| ID 型 | 形式 | 検証 lint |
|---|---|---|
| PlanId | `PLAN-L<N>-<NN>-<slug>` (層別) / `PLAN-<NNN>-<slug>` (cross) | (plan-id-schema、IMP-004 第2弾) |
| FrL1Id | `FR-L1-<NN>` | fr-registry / g3-trace |
| FrId (L3) | `FR-<NN>` | g3-trace |
| AcId | `AC-FR-<NN>-<NN>` / `AC-NFR-*` / `AC-UX-*` | g3-trace |
| AtId | `AT-*` | g3-trace |
| NfrId | `NFR-<NN>` (NFR-09/10 欠番) | g3-trace / doc-consistency |
| GateId | `G<N>` (G0.5-G14) | `gate-id-format` (PLAN-L7-395 / IMP-072)。gate **状態遷移** は `gate-confirm`、ID **形式**は `gate-id-format` が検証 |
| ImpId | `IMP-<NNN>` | improvement-backlog |

> ID は値オブジェクト (不変・等価性は値で判定)。採番は集約ルート起票時に確定。

## §5 ライフサイクル (集約ルートの状態遷移)

- **plan.status**: `draft → (TL approve) → active → done → archived` (failは archived + carry note)
- **gate**: `pending → pass | fail` (fail → 該当 mode へ routing、FR-L1-08)
- **freeze（凍結）** (pair/trace): `pending → frozen` (G1/G3/G4/G5/G6 pair、G7 trace)
- **decision_outcome** (poc): `null → confirmed | rejected | pivot` (S4 でのみ確定)
- **handover**: `current → consumed | stale` (CURRENT.json は最新 1 件)

## §6 不変条件 (Invariant = DbC) — 集約ごと

| 集約 | 不変条件 (常に真) | 機械検証 |
|---|---|---|
| Artifact | **逆ピラミッド禁止**: design + impl が存在すれば test_design + test_code も存在 | G6/G7 fail-close |
| Artifact | pair は V-model 6 組のいずれか (L1↔L14/L2↔L10/L3↔L12/L4↔L9/L5↔L8/L6↔L7) | `V_MODEL_PAIRS` |
| Artifact | FR-L1 registry: 参照される FR-L1 ⊆ 登録済 (§1 機能一覧) | fr-registry-audit 型1 |
| Plan | kind=poc → workflow_phase ∈ {S0-S4} ∧ layer=cross | frontmatter superRefine で検証 |
| Plan | kind=reverse ∧ R4 → forward_routing ∧ promotion_strategy 必須 | frontmatter superRefine |
| Plan | kind=design ∧ layer∈[L1-L6] → sub_doc 必須 ∧ ∈ VALID_SUB_DOCS[layer] | G.1/G.3 |
| Plan | kind=verify → layer∈[L8-L14] ∧ workflow_phase 禁止 ∧ `PLAN-L<N>-...` の L token は layer と一致 | frontmatter superRefine / plan governance |
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
| Artifact / trace（成果物と trace） | `artifact/` + `artifact/trace/` | JSON (edge list) |
| Workflow (phase/gate)（工程と gate） | `phase.yaml` + `gate_runs` | YAML / JSON-lines |
| mode | `mode.yaml` | YAML |
| Handover | `handover/CURRENT.json` | JSON (最新 1 件) |
| Evaluation (Phase B)（評価） | `audit/` (invocation_log / accuracy_score / kpi) | JSON-lines |
| 監査 | `audit/failure_log.jsonl` (local) / チーム共有 audit (別経路) | JSON-lines |
| 内部資産 roster / skill catalog | **永続化なし** (`.claude/agents/*.md` / `docs/skills/**/*.md` が唯一正本、TS が scan-on-demand で in-memory 構築) | markdown (fs 正本、ADR-004 層1) |

**src/schema 突合**: 上記値オブジェクト (§3) は `src/schema/index.ts` の zod enum を SSoT とし、state の JSON/YAML は読込時に zod でバリデート。齟齬検出は `ut-tdd doctor check_business_entity_coverage` (L1 §10.2 carry) で機械化。**§3 値オブジェクト 12 種は src/schema enum と 1:1 一致 (齟齬 0)。SubDoc は requirements §1.10.G.1 spec から `VALID_SUB_DOCS` / `subDocSchema` / layer×sub_doc superRefine へ着地済み (IMP-026)**。

### §8.1 SQLite projection DB（投影DB） (`.ut-tdd/harness.db`)

`.ut-tdd/harness.db` は YAML/JSON state と docs を読み込んで正規化する projection DB であり、legacy DB schema は再利用しない。役割は V-model の製本化、別駆動 model の実行結果保存、trace/coverage/finding の横断照合、doctor/vmodel lint の fail-close 入力である。

| table | 役割 |
|---|---|
| `plan_registry` | PLAN frontmatter / status / layer / sub_doc / drive / dependencies の正規化 |
| `artifact_registry` | 設計・実装・テスト設計・テストコード artifact の catalog |
| `model_runs` | Codex / Claude / worker / reviewer など別駆動 model の実行単位と evidence |
| `trace_edges` | V-model 4 artifact + directed edge の照合 |
| `coverage` | trace coverage / test coverage / plan coverage の集計 |
| `findings` | drift / connection deficiency / regression / review finding の保存 |
| `spec_defs` | `SpecDef` projection。仕様 ID、kind、owner artifact、section anchor、lifecycle を検索可能にする |
| `spec_relations` | `SpecRelation` projection。defines / requires / verifies / pairs / derives / supersedes edge を保持する |
| `schedule_entries` | `ScheduleEntry` projection。工程管理表の現在地、V-pair、predecessor、RAG、blocked reason を保持する |
| `activation_entries` | `ActivationEntry` projection。profile ごとの in-scope / out-of-scope / defer reason / target version を保持する |
| `activation_schedule_reviews` | `ActivationScheduleReview` projection。activation profile と工程表を join し、version-up wave の現在地、対象/除外/延期理由を検索可能にする |
| `document_catalog_entries` | `DocumentCatalogEntry` projection。Vモデル文書種別 catalog の layer/sub_doc/category/default status/profile control を保持する |
| `document_scale_profile_entries` | `DocumentScaleProfileEntry` projection。PoC/Standard/Enterprise ごとの文書採用・skip・粒度・理由を保持する |
| `document_scale_profile_reviews` | `DocumentScaleProfileReview` projection。文書 catalog と規模 profile を join し、product-select 文書の採用理由・skip理由・必要PLANを検索可能にする |
| `detector_route_candidates` | `DetectorFinding` projection。検出結果を FilingTarget SSoT に渡す候補として保持し、起票先を DB 独自に決定しない |
| `gate_runs` | gate 判定証跡と doctor/vmodel lint 結果 |

不変条件: projection DB は生成 state だが、検出器の機械 SSoT として扱う。入力となる docs/YAML/JSON と projection の齟齬は doctor が finding として出し、silent repair しない。

### §8.2 Projection rebuild 境界 (engine-swap)

投影再構築は既存集約に永続entityを足す操作ではなく、authoring sourceからread modelを再生成するapplication serviceである。source収集→pure projector→単一write sessionの順だけを許可し、row/findingのいずれか、またはsecret guardが失敗した場合は全rollbackする。projection eventとfinding payloadには共通guardを適用し、raw secretをDB/auditへ保存しない。projectorはDB/FS/clock/CLIを直接importせず、I/Oはsource adapter、transaction adapter、CLI/doctor composition rootへ隔離する。detector/doctorは結果を観測するだけで、PLAN・docs・state正本を創作またはsilent repairしない。具体的port signatureと移行完了条件はL5/L6で定義する。

## §9 carry → L5 詳細設計

- 各集約の **物理 schema 詳細** (JSON フィールド型・必須/任意・default) は L5 physical-data (D-DB) で確定
- **集約ルートの操作 (API)** = Precondition/Postcondition は L5 D-API / internal-processing で DbC 記述 (IMP-014、edge 5-8 docstring)
- evaluation_batch (Phase B) の集計アーキは L4 architecture + Phase B telemetry carry
- **observability 系値オブジェクト候補** (business §10.4、Phase A): `invocation_log` / `detector_result` / `gate_evidence` / `code_catalog` / `command_catalog` の値オブジェクト/state schema を L5 physical-data で確定 (本 doc では entity 追加なし、候補として carry)
- **SubDoc enum 実装** (IMP-026): requirements §1.10.G.1 の VALID_SUB_DOCS は `src/schema` の zod enum と frontmatter superRefine へ実装済み
- **内部資産 (roster/skill) の back-fill 解消** (A-90、L9 ST-ASSET-04 対応): roster/skill は in-memory scan-on-demand で**永続 state なし** (§8、ADR-004) のため data 集約・物理 state schema に**追加なし**と確定。各 subcommand / capability resolver / recommender / drift 判定の**関数仕様**は L6 機能設計で確定済み (`function-spec.md` / `fr-unit-coverage.md` の FR-L1-12, FR-L1-33, FR-L1-34, FR-L1-46〜49)。L5 physical-data で roster/skill の物理 state 追加は不要 (fs 正本)
