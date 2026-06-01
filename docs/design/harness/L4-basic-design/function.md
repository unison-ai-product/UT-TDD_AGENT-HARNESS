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
| **C12 内部資産 (roster/skill/command)** | FR-L1-46 / FR-L1-47 / FR-L1-48 | Plan (agent_slot) のみ — roster/skill は**集約なし** (in-memory scan-on-demand、fs 正本、data.md §1/§8) | (将来 roster module) + (将来 skills module) + runtime(agent-guard 既存) + cli |

> 11 → **12 カテゴリ** (C12 = 内部資産 roster/skill/command を A-85 で追加、Recovery PLAN-RECOVERY-01 / FR-L1-46/47/48 / BR-22。**skill (FR-L1-47) の building block は architecture §3.1 skills 行 (PLAN-L4-12)**、roster/command (FR-L1-46/48) は本 doc §1.1 が正本)。**現状実装済**は C2(vmodel/doctor lint 群) + C6(agent-guard) + C4 一部(detect)。残は L7 carry。**26 件マップ漏れ 0** (FR-01〜18 + FR-23〜27 + FR-29 + FR-30 + FR-45)。C12 は L1 FR-L1 由来 (L3 では §3 carry 宣言、内部資産設計増分)。

### §1.1 C12 内部資産 roster の機能 building block (FR-L1-46/48、ADR-004 準拠)

ADR-004 の **層1 markdown 正本 / 層2 TS 統制**境界に従う。TS は markdown を**生成でなく検証/注入/統制**する。本 §1.1 は C12 のうち roster/command (FR-L1-46/48、function 面)。**skill pack (FR-L1-47)** の building block は architecture §3.1 skills 行 (PLAN-L4-12) に分離。

| 機能 | 層 | building block | 内容 |
|---|---|---|---|
| **roster registry** | 層2 (TS) | (将来 roster module、runtime 近接) | `.claude/agents/*.md` (層1 正本) の frontmatter (model family / capability) を読み、roster metadata を構築。subagent の存在・属性の SSoT |
| **capability class 解決** | 層2 (TS) | roster module | **FR-L1-46 の機能**: subagent を capability class (PMO/PdM/review/...) に分類。FR-L1-37 (model 推挙) へ入力を提供する**連携先**だが、FR-L1-37 自体は C12 実装対象外 (別境界 = PLAN-L4-NN-model-suggestion、§6 P1 carry) |
| **guard allowlist 統合** | 層2 (TS) | runtime (agent-guard 既存) が roster を読む (`runtime → roster` 一方向、循環なし) | roster が allowlist の **SSoT** (受動提供)、agent-guard が **enforcement** (能動参照、実装済 15 種 allowlist + model family 一致 fail-close)。roster と guard の二重定義を排除 |
| **subagent 本文** | 層1 (markdown) | `.claude/agents/*.md` | prompt 本文は markdown 正本のまま (TS literal 化しない)。HELIX 前提 (絶対パス / `helix codex` 直叩き) 除去は drift lint (FR-L1-49) の fail-close 対象 |
| **command** | 層2 (TS) | cli (§2 内部資産 command) | 内部資産操作の CLI subcommand (roster 一覧 / 整合確認 / asset カタログ)。各 subcommand の関数粒度は L6 で確定 (back-fill) |

> **roster ↔ guard の関係 (依存方向、Critical-1 是正)**: agent-guard.ts は既存実装 (subagent_type allowlist 15 + model family 一致、fail-close)。roster registry はその allowlist の **設計上の SSoT** を `.claude/agents/*.md` 群から構築する層 (依存先 = schema/fs のみ、guard に依存しない)。統合は **agent-guard (runtime) が roster を読む = `runtime → roster` の一方向**で実現 (循環なし、architecture §3.1)。
> **roster 未実装期間の移行段階 (Critical-2 是正、placeholder_deps)**: 現状 agent-guard は allowlist をハードコード相当で保持 (実装済・現行 hook、fail-close 動作中)。roster module 実装完了 (L7) まではこのハードコード allowlist を維持し、roster 実装時に agent-guard を roster 参照へ切替える。**移行期間中は drift lint の「roster↔guard 整合」検査を `placeholder_deps: {waiting_layer: L7, waiting_spec: roster module 実装 + guard の roster 参照切替}` (実装状態解消型、physical-data §7) として残し、roster 実装まで当該検査を未充足 (back-fill 対象) として doctor が記録**する (PLAN-L4-10 §0.1、現行 guard 動作は阻害しない)。整合の最終検知は roster 実装後に drift lint (FR-L1-49) が担う。
> **粒度 (L4=L9 総合テスト)**: 本 §1.1 は「内部資産 roster が system として動く」を L9 総合テスト粒度で束ねる。各 subcommand signature / capability resolver アルゴリズム / model family 解決の関数粒度は **L5 (module 結合) → L6 (関数仕様=単体テスト設計) で段階分解** (PLAN-L4-11 §3、L5 を挟む)。L4 で書けない関数仕様は placeholder + 依存 (`waiting_layer: L6`) として残し back-fill (PLAN-L4-10 §0.1)。

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
| `ut-tdd roster list/check` | FR-L1-46 | 未 (roster module 実装前は guard ハードコード allowlist で動作継続、移行段階 = §1.1 note / ST-ASSET-07) | 内部資産 subagent roster 一覧 / .md↔guard allowlist 整合確認 |
| `ut-tdd asset` | FR-L1-48 | 未 | 内部資産 (skill pack / command) カタログ (porting-map W12/W16) |

> コマンドの Precondition/Postcondition (DbC 契約) は L5 D-API で確定 (§8 carry)。各 subcommand の関数粒度 signature は L6 機能設計 (=仕様設計) で単体テスト設計粒度に分解 (back-fill、PLAN-L4-11)。

## §3 workflow エンジン機能 (workflow mode = 下表 10 行 + 工程専門 2)

FR-13〜16 / FR-23〜30 の workflow を機能単位で定義。**mode 数の正本 = 下表 (Forward〜Research の 10 workflow mode) + 工程専門 2 (screen/frontend)**。L9 ST-FUNC-01 ペアも同 10+2。
> **mode taxonomy drift (m-2、reconcile carry)**: 旧記述「11 mode」/ L0 §2.5「9-mode」/ 本表 10 行で**数表記が不一致** (Discovery/Scrum/Research の括り方の差)。これは内部資産と無関係の既存 taxonomy 揺れ。**正本は本 §3 表 (10 mode)**。L0 §2.5「9-mode」と gate-design §1.1 の表記差は別途 reconcile (improvement-backlog 候補、勝手に数を確定しない)。

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
