---
plan_id: PLAN-L3-02-business-detail
title: "PLAN-L3-02: BR-21 詳細化 + HM-08 連動 + Phase B FR carry 起票工程"
kind: design
layer: L3
sub_doc: business
drive: be
status: confirmed
created: 2026-05-28
updated: 2026-05-28
owner: PM (Opus) / PO (人間)
pair_artifact: docs/test-design/harness/L3-acceptance-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
related_l1_screen: docs/design/harness/L1-requirements/screen-requirements.md
next_pair_freeze: L12
agent_slots:
  - role: po
    slot_label: "PO — BR-21 詳細化最終判断"
  - role: tl
    slot_label: "TL — Phase B 設計レビュー"
generates:
  - artifact_path: docs/design/harness/L3-functional/business-detail.md
    artifact_type: design_doc
dependencies:
  parent: null
  requires:
    - PLAN-L1-01-business-requirements
    - PLAN-L1-02-functional-requirements
    - PLAN-L1-03-screen-requirements
  blocks: []
v2_import: docs/migration/v2-import-ledger.md
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-04"
    tests_green_at: "2026-06-04"
    verdict: approve
    scope: "A-100 L0-L3 refreeze sign-off (pmo-sonnet + PO、claude-only intra_runtime_subagent)"
---

# PLAN-L3-02: BR-21 詳細化 + HM-08 連動 + Phase B FR carry 起票工程

> **正本宣言**: 本 PLAN は **中間準備ドシエ** (ヒアリング項目・調査メモ・工程表)。
> **本 PLAN が産出する正本 doc**: `docs/design/harness/L3-functional/business-detail.md` (上記 frontmatter generates 参照)。
> **V-model pair**: L3 business-detail sub-doc ↔ L12 受入テスト設計 1 doc。本 PLAN 完了時に G3 pair freeze の対象。
> **スコープ**: BR-21 + FR-L1-36/38/43 (Learning Engine 系、P2 Phase B carry) + HM-08 画面連動 の 3 軸詳細化のみ。FR 一般詳細化は PLAN-L3-01 が担当。

## §0 本 PLAN の役割

L1 で宣言された **BR-21「AI 実行成果の継続評価と改善サイクル」** (P2、Phase B 中心) を L3 で詳細化し、対応 FR (FR-L1-36 skill 評価 / FR-L1-38 model 評価 / FR-L1-43 PoC 計測) の Phase B 実装入力を整える。

HM-08 (AI 効果データ + Learning Engine ビュー) との画面連動規約を確定し、Phase B 着手時の機能要件 baton として L4 carry する。

PLAN-L3-01 (FR 一般詳細化) とスコープを分離し、本 PLAN は **Learning Engine 系 + Phase B 寄せの BR-21 経路** のみを扱う (重複を避ける)。

## §1 入力 (上流からの baton)

- L1 業務要求 §11 BR-21 詳細: `docs/design/harness/L1-requirements/business-requirements.md` §11 (BR-21 全文)
- L1 機能要求 FR-L1-36/38/43: `docs/design/harness/L1-requirements/functional-requirements.md` (L3 carry forward 宣言済)
- L1 画面要求 HM-08: `docs/design/harness/L1-requirements/screen-requirements.md` §1.HM.08
- L1 業務 KPI D-07 (AI 委譲時間率 ≥ 70%): business §6.5
- HELIX-workflows Learning Engine 参考: `vendor/helix-source/docs/v2/process/L19-learning-engine.md` 等 (Phase B 想定)

## §2 出力 (本 PLAN で確定)

- 正本 doc: `docs/design/harness/L3-functional/business-detail.md` (frontmatter generates)
- BR-21 詳細仕様: 評価対象 / 評価指標 / 改善サイクル / 計測場所
- FR-L1-36/38/43 詳細化: 各 FR の入出力 / AC / Phase B 実装契約
- HM-08 画面連動規約: 画面表示要素 / データソース / 更新タイミング

## §3 ヒアリング項目 / 調査メモ (BR-21 固有)

**status 凡例**: ✅ / ➡️ Phase B carry / ❓ PO 判断待ち / 🆕 TL レビュー AI 推奨採用 (draft 着地、G3 で PO 確認)

> **TL レビュー反映 (2026-05-28、A-43 ledger + A-44 PO 直問 0 化)**: 全 10 項目を TL 視点で再仕分け、A-44 で U-BR21-9 も AI 採用に格上げ。**PO 判断対象 = 0 件**。全 10 件 AI 推奨採用 🆕 draft 着地、G3 readiness 整備時に他項目と合わせて PO 確認。

### 3.1 BR-21 評価サイクル設計

| ID | ヒアリング項目 | 着地先 | status (TL 推奨採用) |
|----|--------------|--------|--------|
| U-BR21-1 | 評価対象単位 | business-detail §1 | 🆕 **PLAN 単位 default + 補助で skill / model 単位**。理由: PLAN = harness の最小遂行単位、PLAN 評価が KPI D-07 (AI 委譲時間率) と直結、skill/model は補助計測 |
| U-BR21-2 | 評価指標 | business-detail §2 | 🆕 **5 指標全部** (成功率 / token cost / 所要時間 / 再実行回数 / fail-close 発火率)。理由: KPI D-07 + D-02 + D-04 + D-06 と integrated、欠けると改善ループが半端 |
| U-BR21-3 | 改善サイクル頻度 | business-detail §3 | 🆕 **sprint 末 + 任意手動**。理由: 日次は telemetry cost 過大 (NFR-16 軽量原則違反)、週次は agile sprint と非同期、sprint 末が KPI 計測周期と整合 |
| U-BR21-4 | 改善アクション自動化範囲 | business-detail §4 | 🆕 **全件「人間承認必須」**。理由: CC2 人間主導原則 + NFR-14 human-as-residue 整合、自動化は AI 暴走源、PO の S-03 例外権でのみ自動化許可 |

### 3.2 HM-08 画面連動

| ID | ヒアリング項目 | 着地先 | status (TL 推奨採用) |
|----|--------------|--------|--------|
| U-BR21-5 | HM-08 データソース | business-detail §5 / HM-08 連動 | 🆕 **4 ソース全件統合** (invocation_log / detector_runs / gate_runs / plan_registry)。理由: 単一ソースだと評価指標 5 件全件カバー不能、4 ソース統合で必要十分 |
| U-BR21-6 | HM-08 表示頻度 | business-detail §5 | 🆕 **集計済データを 30 秒ポーリング表示**。理由: S2=b (全画面 30 秒ポーリング既決) 整合、生計算は cost 過大、集計バッチ + ポーリングが現実解 |
| U-BR21-7 | AI 指示 copy UI 必須化 | business-detail §5 / HM-08 操作要素 | 🆕 **必須化**。理由: CC2 horizontal 原則 (screen §3.1 横断原則・全 15 画面適用)、HM-08 のみ例外化する根拠なし |

### 3.3 Phase B carry 範囲確定

| ID | ヒアリング項目 | 着地先 | status |
|----|--------------|--------|--------|
| U-BR21-8 | Phase A スコープ | business-detail §6 carry | 🆕 **Phase A = 宣言のみ + HM-08 placeholder、実装は Phase B**。理由: Phase A scope を MVP に絞る既存方針 (NFR-07 MVP なし整合)、評価ロジック本実装は Phase B telemetry 整備後 |
| U-BR21-9 | Phase B 着手条件 | business-detail §6 carry | 🆕 **Phase A G14 通過 + KPI D-07 直近 1 sprint ≥ 50% 達成 を AND 条件で採用** (A-44 ledger、PO 指摘「TL/AI で決めれる範囲なら振るな」反映)。理由: Phase A G14 通過 = workflow 標準完了点 (技術判断) / KPI D-07 ≥ 50% = MVP scope で AI 委譲が機能している証明 (KPI D-07 目標値 ≥ 70% の手前、Phase A 完了時点の妥当値)、両条件 AND で投資判断ではなく工程整合判断。PO が後続で目標値を引き上げたい場合は L4/Phase B 着手 PLAN で再調整可能 |
| U-BR21-10 | telemetry default on/off | business-detail §6 / NFR-16 連動 | 🆕 **PLAN 評価 = default on / model evaluation = opt-in、PII redaction 必須**。理由: PLAN 評価は KPI 計測の必須インフラ (offに すると D-07 計測不能)、model evaluation は実験的要素で opt-in、PII redaction は NFR-09/14 整合 |

## §4 工程表 (Step + 進捗)

### Step 1: L1 BR-21 / HM-08 / FR-L1-36/38/43 baton 整理
- 担当: pmo-sonnet
- 内容: L1 sub-doc 3 件 + functional sub-doc 3 FR を Read し、L3 詳細化対象を一覧化
- 進捗: 🔄 (本起票時)

### Step 2: 評価サイクル設計 (U-BR21-1〜4 確定)
- 担当: tl + pmo-tech-docs
- 内容: 評価対象 / 指標 / 頻度 / アクションを確定し、business-detail §1〜§4 を起草
- 進捗: ✅ (A-45 commit、§1 PLAN単位 + §2 5指標 + §3 sprint末 + §4 半自動人間承認 全件確定)

### Step 3: HM-08 画面連動規約確定 (U-BR21-5〜7)
- 担当: tl + uiux
- 内容: HM-08 のデータソース / 表示頻度 / AI 指示 copy UI を確定、L2-screen ui-element placeholder と整合
- 進捗: ✅ (business-detail §5 4 ソース統合 + 30 秒ポーリング + AI 指示 copy UI 完備)

### Step 4: Phase B carry 範囲確定 (U-BR21-8〜10)
- 担当: tl + po
- 内容: Phase A / Phase B 境界を明示、Phase A での「宣言のみ vs 最小実装」を確定
- 進捗: ✅ (§6 Phase A 宣言のみ + Phase B 着手条件 AND 確定 + telemetry スコープ宣言)

### Step 5: FR-L1-36/38/43 詳細化
- 担当: tl + se
- 内容: 3 FR の入出力 / AC / Phase B 実装契約を business-detail §7 で詳細化 (PLAN-L3-01 の AC 形式と整合)
- 進捗: ✅ (§7 FR-BR21-36/38/43 各 AC 2 件 計 6 AC 起草完了、Phase B carry 明示)

### Step 6: 機械検証 + L12 受入テスト pair 凍結
- 担当: qa
- 内容: BR-21 / FR-L1-36/38/43 全件が L12 受入テストで被覆されているか確認
- 進捗: ✅ (L12 受入テスト設計 §1.2 で AT-BR21-01〜09 + AT-FR-BR21-36/38/43 全 15 件被覆、孤児 0)

### Step 7: review (self / pmo-sonnet)
- 担当: pmo-sonnet
- 内容: 専門サブエージェント review 必須。BR-21 詳細化 / HM-08 連動 / Phase B carry 明示・孤児 BR-21 由来 0 を確認
- 進捗: ⬜ (G3 readiness 整備時に L3 3 sub-doc + L12 受入テスト 4 doc 全件まとめて review)

## §5 実装計画

| 節 | 情報源 | 方法 |
|----|--------|------|
| §1 評価対象 | U-BR21-1 確定 | PLAN 単位 default + 補助単位 |
| §2 評価指標 | U-BR21-2 確定 | 5 指標 + KPI D-07 整合 |
| §3 改善サイクル | U-BR21-3 確定 | sprint 末 + 任意手動 |
| §4 改善アクション | U-BR21-4 確定 | 全件「人間承認必須」 (CC2) |
| §5 HM-08 連動 | U-BR21-5〜7 確定 | データソース 4 件統合 + AI 指示 copy UI |
| §6 Phase B carry | U-BR21-8〜10 確定 | Phase A 範囲 + Phase B 着手条件 |
| §7 FR-L1-36/38/43 詳細化 | L1 functional + AC テンプレ | PLAN-L3-01 の AC 形式と整合 |

## §6 DoD (Definition of Done)

- [ ] business-detail.md が必須 § 全件含む (§1〜§7)
- [ ] BR-21 詳細化 4 軸 (評価対象 / 指標 / サイクル / アクション) 全て確定
- [ ] HM-08 連動規約 3 軸 (データソース / 表示頻度 / AI 指示 copy UI) 全て確定
- [ ] Phase A / Phase B 境界が明示され、Phase B 着手条件が記載
- [ ] FR-L1-36/38/43 が AC-* と pair で詳細化されている (孤児 0)
- [ ] frontmatter 必須フィールド完備
- [ ] L12 受入テスト設計で本 sub-doc 由来要求が被覆
- [ ] 専門サブエージェント review (Step 7) 通過記録
- [ ] **PO サインオフ準備完了**

## §7 carry / 次工程 (L4 / Phase B) への引き継ぎ

- **L4 基本設計**: BR-21 評価指標の集計アーキ (state スキーマ / クエリ / 集計バッチ) は L4 基本設計で確定
- **L4 データ設計**: 評価指標 entity (例: PlanEvaluation / SkillEvaluation / ModelEvaluation) は L4 データ設計で確定
- **Phase B 実装 PLAN**: Phase B 着手時に PLAN-Phase-B-NN として Learning Engine 本実装を起票
- **NFR-16 telemetry 連動**: telemetry default + PII redaction 設計は NFR-16 / PLAN-L3-03 と連携
- **HM-08 L10 UX refinement**: HM-08 画面の最終 UX 確定は L10 UX 磨きへ送り
- **KPI D-07 目標達成**: Phase A 完了時点で KPI D-07 ≥ 50% 達成を Phase B 着手条件とする (U-BR21-9 確定後)
