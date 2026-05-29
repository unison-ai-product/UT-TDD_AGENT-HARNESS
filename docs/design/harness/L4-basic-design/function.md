---
layer: L4
sub_doc: function
status: draft
pair_artifact: docs/test-design/harness/L9-system-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L9
plan: docs/plans/PLAN-L4-03-function.md
v2_import: docs/migration/v2-import-ledger.md
---

> **SSoT 参照**: 構造 (集約) = [data.md](./data.md) / 方式 (module・依存) = [architecture.md](./architecture.md) / 上流 FR = [L3 functional-requirements](../../../design/harness/L3-functional/functional-requirements.md) / 様式 = arc42 §5 (functional building block) + IEEE 1016 §5 ([document-system-map](../../../governance/document-system-map.md) §2)。本 doc は L3 FR を**どの機能単位で実現するか**を担い、構造/方式は data/architecture に委ねる。
>
> **用語更新 (G.9) / 機能要求更新 (G.10) の所在**: per-工程 delta は生成元 [PLAN-L4-03](../../../plans/PLAN-L4-03-function.md) の §6/§7 に記録 (data.md/architecture.md と同規約)。
> **V-pair**: `pair_artifact = L9-system-test-design.md` は L4 sub-doc 群の集合 pair (PLAN-L4-00-master 経由)。

# UT-TDD Agent Harness — L4 基本設計: 機能設計 (Function)

L3 functional の FR 26 件 + P1 carry 9 件を **機能 building block** (arc42 §5) に分解する (PLAN-L4-03-function)。各機能は architecture.md の module に配置され、data.md の集約を操作する。

## §1 機能カテゴリ分類

L3 FR 26 件 (FR-01〜18 + FR-45 + FR-23〜27 / FR-29 / FR-30) を 11 カテゴリに grouping。**FR-28 は L3 に存在しない** (workflow core = FR-23/24/25/26/27/29/30 の 7 件、L3 §1 注記)。

| カテゴリ | 含む FR | 操作する集約 (data.md) | 主担当 module (architecture.md) |
|---|---|---|---|
| **C1 PLAN 管理** | FR-01 / FR-04 / FR-24 | Plan | cli + plan + schema |
| **C2 TDD・gate・trace** | FR-02 / FR-03 / FR-05 / FR-13 | Artifact / Workflow | cli + vmodel + doctor |
| **C3 state・hook** | FR-06 / FR-07 | Plan / Artifact / Workflow (state hook 横断、data.md §8) | runtime + (将来 hook) |
| **C4 mode routing** | FR-08 | Workflow | runtime(detect) + doctor |
| **C5 workflow エンジン** | FR-13〜16 / FR-23〜27 / FR-29 / FR-30 | Plan / Workflow | (将来 workflow module) |
| **C6 AI ガード** | FR-09 | (操作なし、検証) | runtime(agent-guard、既存) |
| **C7 検出 doctor** | FR-18 / FR-11 | 全集約 (横断) | doctor + lint |
| **C8 CI 連携** | FR-17 | Workflow / Artifact | (将来 CI 配線) |
| **C9 doc-review** | FR-45 | Artifact | (将来 review module) |
| **C10 文脈注入** | FR-12 | Plan | (将来 skill module) |
| **C11 Recovery** | FR-10 | Workflow / Handover | (将来 cutover) |

> 11 カテゴリ (PLAN §3 Step 1 初期 9 から C10 文脈注入 / C11 Recovery を分離して 11 に確定)。**現状実装済**は C2(vmodel/doctor lint 群) + C6(agent-guard) + C4 一部(detect)。残は L7 carry。**26 件マップ漏れ 0** (FR-01〜18 + FR-23〜27 + FR-29 + FR-30 + FR-45、FR-13 は C2/C5 両属で重複可)。

## §2 CLI コマンド面の機能 building block

FR → `ut-tdd` サブコマンドの対応 (architecture.md cli module に集約、副作用端点)。

| コマンド (将来形) | 実現 FR | 現状 | 操作 |
|---|---|---|---|
| `ut-tdd status` | FR-13 | **実装済** (scaffold) | mode 検出表示 |
| `ut-tdd plan draft/lint/delete` | FR-01 / FR-04 / FR-24 | lint stub | PLAN 起票・検証 |
| `ut-tdd sprint start/check` | FR-02 | 未 | TDD 強制 (Red→Green→refactor 順序、本体実装前 Red 必須 fail-close) |
| `ut-tdd gate <G-ID>` | FR-05 / FR-13 | 未 | 決定論 gate 判定 + 証跡 |
| `ut-tdd trace check` | FR-03 | (vmodel lint で部分) | 4 artifact 双方向 trace |
| `ut-tdd doctor` | FR-18 / FR-08 / FR-11 | **実装済** (scaffold) | 横断検出集約 + routing |
| `ut-tdd reverse --type` | FR-14 / FR-23 | 未 | Reverse / fullback R0-R4 |
| `ut-tdd incident open` | FR-16 | 未 | 緊急 hotfix 経路 |
| `ut-tdd interrupt / resume` | FR-11 | 未 | 割り込み制御 |
| `ut-tdd review --uncommitted` | FR-45 | 未 | doc-reviewer 召喚 |
| `ut-tdd skill suggest` | FR-12 | 未 | L 別 skill 推挙 |
| `ut-tdd route --mode` | FR-08 | 未 | 手動 mode 切替 (S-03) |
| `ut-tdd cutover --to` | FR-10 / FR-26 | 未 | ロールバック (CLI のみ、S5=b) |

> コマンドの Precondition/Postcondition (DbC 契約) は L5 D-API で確定 (§8 carry)。

## §3 workflow エンジン機能 (11 mode + 工程専門 2)

FR-13〜16 / FR-23〜30 の workflow を機能単位で定義 (L3 §5.1 全 11 mode 直接被覆を機能化)。

| workflow | 実現 FR | 機能フェーズ | 合流 / 出口 |
|---|---|---|---|
| Forward | FR-13 | L0→L14 順行 + gate | 主線 |
| Reverse | FR-14 | R0(evidence)→R4(routing) + RGC | R4 で Forward 合流 (L1/L3/L4/L5/gap-only) |
| Discovery | FR-15 | S0→S4 + decision_outcome | confirmed→Forward L3 |
| Incident | FR-16 | hotfix→収束→fullback | Reverse fullback で V 昇華 |
| Recovery | FR-10 | 再開ポイント提示→cutover | Forward 復帰 |
| Refactor | FR-25 | axis-11 regression 不変ガード | G7 後 Forward 復帰 |
| Retrofit | FR-26 | retrofit-matrix→段階 config | L4-L7 段階移行 |
| Add-feature | FR-24 | parent requires→差分追補 | parent PLAN に接続 |
| Scrum | FR-23 | S0-S4→fullback→F0-F4 | Forward L1/L3/L4-L6/L8-L9 |
| Research | FR-27 | research-memo→ADR | L4 基本設計合流 |
| screen-design (L2 専門) | FR-29 | IA→画面一覧→遷移→wireframe | G2 凍結 → L10 |
| frontend-design (L10 専門) | FR-30 | visual→token SSOT→a11y→regression | L11 引き渡し |

> workflow エンジンは architecture.md の **将来 workflow module** (未実装、L7 carry)。状態遷移ロジックは data.md Workflow 集約 (phase/gate) + L6 機能設計 (pseudocode、IMP-019) で詳細化。

## §4 detector / hook 機能

| 機能 | 実現 FR | building block | 出力 |
|---|---|---|---|
| **5 イベント hook** | FR-07 | (将来 hook、`.ut-tdd/hooks/` TS) | PLAN 起票 / コード変更 / Codex 実行 / gate 通過 / 停止 → state 自動更新 |
| **doctor 集約 detector** | FR-18 | doctor module + lint 群 | 依存漏れ / 契約漏れ / 接続欠損 / デグレ を集約 |
| **mode routing** | FR-08 | runtime(detect) + `mode-routing.yaml` | drift/劣化/暴走/障害 → mode 自動 routing (優先度 Incident>Recovery>Reverse>Refactor) |
| **横断 4 機構** | FR-11 | (将来 cross-cutting) | interrupt / debt / drift-check / readiness (現工程を block しない並列 PLAN) |

> **agent-guard hook (FR-09) は既存実装済** (`.claude/hooks/agent-guard.ts`、architecture.md §6)。他 hook は UT-TDD CLI 整備後に有効化 (architecture.md §6 と整合)。

## §5 AI ガード / 観測機能 (IMP-013)

| 機能 | 実現 FR | 状態 | business-detail (BR-21) 接続 |
|---|---|---|---|
| **agent-guard** | FR-09 (AC-FR-09-01〜04) | **実装済** | — (ガードは Learning Engine 非依存) |
| **観測層 (invocation_log)** | FR-L1-20 (P1、L4 carry) | 未 (Phase A 設計) | **business-detail §2 (BR-21 計測対象) / §5 (集計 → Learning Engine 入力) に接続** |
| accuracy_score / detector_result / gate_evidence / kpi | FR-L1-20 (observability) | 未 (data.md §9 候補) | business-detail §2/§5 の KPI 集計経路 |

> **IMP-013 接続明示**: FR-L1-20 の観測値 (invocation_log = AI 呼び出し記録 / accuracy_score = 判定精度 / gate_evidence = ゲート証跡) は、**Phase A で `.ut-tdd/audit/*.jsonl` に append-only 記録** (data.md §8 Evaluation 集約) され、**business-detail §2 (BR-21 計測対象定義) の入力 + §5 (Learning Engine 集計) の経路**となる。AC-FR-BR21-02 (business-detail) の Phase A 前提 = 「観測層が記録のみ稼働、学習エンジン本実装は Phase B」と整合。観測 (Phase A) と学習 (Phase B、FR-L1-19) を分離。

## §6 P1 carry 9 件の機能 building block 着地先

L3 §3.1 の P1 carry を L4 sub-PLAN として機能境界を割り当て (§3.1 表と 1:1)。

| FR-L1 | 機能 building block | L4 sub-PLAN (着地先) | 配置 module |
|---|---|---|---|
| FR-L1-21 (テスト観点 W 字ゲート) | 設計→テスト観点抜け + レベル間重複検出 (static) | PLAN-L4-NN-test-perspective-gate | lint/vmodel |
| FR-L1-22 (FE detector 5 軸) | mock-promotion / token-drift / a11y / visual / state-drift | PLAN-L4-NN-fe-detector | (将来 fe detector) |
| FR-L1-28 (W 2 段設計) | Phase1 一般 + Phase2 agent 昇華 (drive=agent) | PLAN-L4-NN-w2-stage | (将来 workflow) |
| FR-L1-37 (model 推挙) | task×drive×L 別 model + reasoning effort 選定 | PLAN-L4-NN-model-suggestion | (将来 skill/orchestration) |
| FR-L1-39 (タスク難易度) | 規模/依存/不確実性×drive スコアリング | PLAN-L4-NN-task-complexity | (将来 orchestration) |
| FR-L1-40 (drive 別 state 分離) | `.ut-tdd/drive/<drive>/` 区画 + skip_sub_doc 強制 | PLAN-L4-NN-drive-state-isolation | runtime/state |
| FR-L1-41 (drive 自動判定) | PLAN/コード/拡張子 → drive 分類 → routing | PLAN-L4-NN-drive-auto-classify | runtime(detect) |
| FR-L1-42 (provider 引継ぎ) | Claude↔Codex context+PLAN+budget 連携 | PLAN-L4-NN-provider-handover | runtime(adapter) |
| FR-L1-44 (onboarding) | 既存 repo へ harness baseline 確立 | PLAN-L4-NN-onboarding | cli(setup) |

> P2 (FR-L1-31〜35) は PLAN-L4-NN-infra-readiness、Phase B (FR-L1-19/20) は telemetry carry (data.md §9)。sub-PLAN の `NN` 採番は各起票時に確定。

## §7 機能間依存 / 呼び出し関係

architecture.md §3 の依存方向 (schema 一方向・循環禁止) と整合する機能呼び出し。

| 呼び出し元 → 先 | 種別 | 内容 |
|---|---|---|
| plan draft → state hook → registry | event | PLAN 起票 (FR-01) が hook (FR-07) を発火し registry 更新 |
| gate → trace check → detector | sequential | gate (FR-05) が trace (FR-03) を呼び doctor detector (FR-18) で証拠集約 |
| doctor → mode routing → plan draft | conditional | doctor (FR-18) 検出 → routing (FR-08) → 対応 kind PLAN 自動起票 (FR-01) |
| workflow → gate (各 phase) | sequential | workflow (FR-13〜30) の phase 遷移は gate pass が前提 (data.md §7 phase↔gate) |
| 全コマンド → schema validate | dependency | 全機能が schema (zod) で frontmatter/state を検証 (architecture §3 一方向) |

## §8 carry → L5 詳細設計 / L6 機能設計

- 各 CLI コマンドの **Precondition/Postcondition** (DbC) = L5 D-API / internal-processing (IMP-014、edge 5-8 docstring)
- workflow エンジン状態遷移ロジック / detector アルゴリズム = L6 機能設計 (IEEE 1016 §5.7 pseudocode、IMP-019)
- P1 sub-PLAN 9 件 = L4 詳細 PLAN として個別起票 (本 doc では機能境界のみ、§6)
- 観測層 (FR-L1-20) の値オブジェクト/state schema = L5 physical-data (data.md §9 carry)
- mode-routing.yaml / gate-checks.yaml の DSL schema = L5 D-CONTRACT
