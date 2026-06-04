---
layer: L3
sub_doc: business
status: confirmed
pair_artifact: docs/test-design/harness/L3-acceptance-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
related_l1_screen: docs/design/harness/L1-requirements/screen-requirements.md
next_pair_freeze: L12
v2_import: docs/migration/v2-import-ledger.md
created: 2026-05-28
updated: 2026-05-28
---

> **SSoT 参照**: BR-21 全文 = business-requirements.md §11 / HM-08 = screen-requirements.md §1.HM.08 / FR-L1-36/38/43 = functional-requirements.md §1 (P2、L3 forward carry)。
> **scope**: BR-21 (AI 実行成果評価) + HM-08 画面連動 + FR-L1-36/38/43 (Learning Engine 系、P2) のみ。FR 一般詳細化は functional-requirements.md (PLAN-L3-01) 担当 (重複回避)。
> **L12 接続**: 全 AC を AT-* で被覆 (孤児 0)。

# UT-TDD Agent Harness — L3 業務要件詳細 (business-detail) — BR-21 + HM-08 + Phase B carry

## §1 評価対象 (U-BR21-1 採用、PLAN 単位 default + 補助単位)

L1 BR-21 で宣言した「AI 実行成果評価」の評価単位を以下で確定する:

| 評価単位 | 役割 | 計測時点 | 主担当指標 |
|---------|------|---------|----------|
| **PLAN 単位** (default) | harness 最小遂行単位、KPI D-07 と直結 | PLAN status=completed 時 | 成功率 / token cost / 所要時間 / 再実行回数 |
| **skill 単位** (補助) | skill 推奨精度評価 | skill 注入 → 利用 → PLAN 完了 サイクル末 | skill 採用率 / 採用後成功率 |
| **model 単位** (補助、opt-in) | model 選択基準改善 | task 委譲完了時 | model 別成功率 / cost 効率 |

> **TL 採用根拠**: PLAN 単位 = harness の業務単位、skill / model は補助メトリクス (drift 計測用)。3 単位を超える単位 (sprint 全体 / FR 単位) は集計コスト過大で skip。

## §2 評価指標 (U-BR21-2 採用、5 指標、KPI D-07 integrated)

| 指標 | 計算式 | 目標 | 計測場所 |
|------|-------|------|---------|
| **成功率** | (PLAN status=completed) / (全 PLAN 起票数) × 100 | ≥ 80% | `.ut-tdd/plan_registry/` 集計 |
| **token cost** | sum(invocation_log.input_tokens + output_tokens) per PLAN | (LCM 目標は L4 で確定、P0 では計測のみ) | `.ut-tdd/audit/invocation_log/` |
| **所要時間** | (PLAN updated - created) per PLAN | (中央値 ≤ 1 sprint 推奨) | plan_registry timestamp 差分 |
| **再実行回数** | sum(invocation count) per PLAN | < 3 回 (1 回 retry 許容) | invocation_log 集計 |
| **fail-close 発火率** | (agent guard block 件数) / (Agent 呼び出し総数) × 100 | < 5% | agent-guard audit log |

> **KPI 整合**: 成功率 → D-04 (回帰検出率) / token cost → D-06 (bypass 件数の cost 側面) / 所要時間 → D-09 (handover 引継ぎ成功率) / 再実行回数 → D-04 / fail-close 発火率 → D-06。

#### AC-FR-BR21-01 (正常系: 5 指標全件記録)
- **Given**: PLAN-005 が status=completed (Forward 経路で 7 日掛け)
- **When**: `ut-tdd plan close PLAN-005`
- **Then**: 5 指標全件が `.ut-tdd/evaluation/PLAN-005.json` に記録 / KPI D-04/06/09 集計に反映

#### AC-FR-BR21-02 (異常系: 指標欠落)
- **Given**: invocation_log 未整備 (Phase A 初期、FR-L1-20 未実装)
- **When**: `ut-tdd plan close`
- **Then**: warn `Warning: invocation_log 不在、token cost 計測不可 (Phase A scope)` / 他 4 指標は記録 / 終了コード 0

#### AC-FR-BR21-03 (境界系: model 単位 opt-in 未設定)
- **Given**: `.ut-tdd/evaluation/model-opt-in.yaml` で `enabled: false`
- **When**: PLAN close
- **Then**: model 単位指標 skip / PLAN 単位 + skill 単位のみ記録 / audit に opt-in 状態記録

## §3 改善サイクル頻度 (U-BR21-3 採用、sprint 末 + 任意手動)

- **default**: sprint 末 (Forward では G7 通過時 / Scrum では sprint review 末)
- **手動 trigger**: `ut-tdd evaluation run --since <date>` で任意期間集計
- **頻度上限**: 1 日 1 回 (telemetry コスト保護、NFR-13 dev-local+CI 整合)

> **TL 採用根拠**: 日次は telemetry cost 過大 (NFR-16 軽量原則違反)、週次は agile sprint と非同期、sprint 末が KPI 計測周期と整合。手動 trigger で柔軟性確保。

#### AC-FR-BR21-04 (正常系: sprint 末自動起動)
- **Given**: G7 通過直後 (sprint completed)
- **When**: G7 通過 hook 発火
- **Then**: `ut-tdd evaluation run --auto` 自動実行 / sprint 内 PLAN 全件集計 / HM-08 ビュー更新

#### AC-FR-BR21-05 (異常系: 頻度上限超過)
- **Given**: 同日内に既に 1 回自動実行済、PO が手動再実行試行
- **When**: `ut-tdd evaluation run --force`
- **Then**: warn `Warning: 本日 2 回目の実行 (telemetry cost 配慮、--force 指定で続行)` / 続行 / audit 記録

## §4 改善アクション (U-BR21-4 採用、全件「人間承認必須」、CC2 整合)

| アクション種別 | 自動化レベル | 人間判断点 |
|-------------|------------|----------|
| skill 推奨アルゴリズム更新 | **半自動** (提案のみ自動、適用は PO 承認) | PO (S-03) |
| model 選択基準更新 | **半自動** (提案のみ自動、適用は TL 承認) | TL |
| detector ルール更新 | **半自動** (提案のみ自動、適用は TL 承認) | TL |
| PLAN テンプレート更新 | **半自動** (提案のみ自動、適用は PO 承認) | PO |
| skill 廃止 (rating 閾値以下) | **半自動** (フラグのみ、削除は人間専属、F6=a + CLAUDE.md destructive 禁止) | PO |

> **TL 採用根拠**: CC2 人間主導原則 + NFR-14 human-as-residue 整合、自動適用は AI 暴走源、半自動 = 提案 + 人間承認のサイクルで「学習する基盤」を実現。

#### AC-FR-BR21-06 (正常系: skill 廃止提案)
- **Given**: skill-X の rating が 30 日間 < 0.5 (採用率閾値以下)
- **When**: evaluation run 完了
- **Then**: HM-08 に skill-X 廃止候補表示 + 提案テキスト生成 (AI 指示 copy-paste UI 提供) / PO 承認待ち status / skill 自体は削除されない

#### AC-FR-BR21-07 (異常系: 自動適用試行 block)
- **Given**: 何らかの実装ミスで skill 自動削除が試行される
- **When**: `ut-tdd skill delete skill-X` が PO 承認なしで実行
- **Then**: fail-close `Error: skill 削除は PO 専属 + audit 記録必須 (CC2 / NFR-14)` / 削除されない / 終了コード 2

## §5 HM-08 画面連動 (U-BR21-5/6/7 採用)

### §5.1 データソース (4 件統合)

| ソース | 用途 |
|--------|------|
| `invocation_log` (FR-L1-20) | token cost / 再実行回数 / model 別成功率 |
| `detector_runs` (FR-L1-18) | fail-close 発火率 / detector 検出率 |
| `gate_runs` (FR-L1-05) | gate 通過率 (KPI D-02) / sprint 末 trigger |
| `plan_registry` (FR-L1-04) | PLAN 件数 / 成功率 / 所要時間 |

集計バッチ (`.ut-tdd/evaluation/`) で 4 ソースを join → HM-08 表示用 derived view を生成。

### §5.2 表示頻度

- **集計バッチ**: sprint 末 + 手動 trigger (§3 整合)
- **HM-08 ポーリング**: 30 秒 (S2=b 全画面共通整合)、集計済 derived view を表示

### §5.3 AI 指示 copy UI (CC2 整合、必須)

HM-08 で改善提案 (例: skill 廃止 / PLAN テンプレ更新) が出た際、人間が AI (Claude/Codex) に貼り付けて「改善 PLAN を起票」を指示する **copy-paste テキスト** を生成する。

```
提案例 (copy-paste 用):
「以下の改善提案に基づき PLAN を起票してください:
- skill-X (採用率 0.42、30 日間トレンド低下) を廃止候補に追加
- PLAN テンプレ frontmatter に skill_review_required: true を追加
担当 agent_slots: tl / pmo-sonnet
priority: P1」
```

#### AC-FR-BR21-08 (正常系: HM-08 表示)
- **Given**: 集計バッチ完了 (sprint 末 trigger)
- **When**: HM-08 アクセス
- **Then**: 4 ソース統合 view 表示 / 5 指標サマリ + skill/model 別 詳細テーブル / 30 秒ポーリングで自動更新

#### AC-FR-BR21-09 (異常系: 集計バッチ失敗)
- **Given**: invocation_log が破損 (JSON parse error)
- **When**: 集計バッチ実行
- **Then**: 該当データソース skip + warn `Warning: invocation_log 破損、token cost 指標欠落` / 他 3 ソースは正常集計 / HM-08 に warn バナー表示

## §6 Phase A / Phase B 境界 (U-BR21-8 採用、Phase A = 宣言のみ + HM-08 placeholder)

### §6.1 Phase A スコープ (本 sub-doc 確定範囲)

- **実装範囲**: §1 評価対象 / §2 評価指標 / §3 サイクル / §4 アクション の **宣言のみ**
- **画面**: HM-08 placeholder (UI レイアウト + データソース 4 件統合の derived view 設計、実データ無し or サンプルデータ)
- **計測**: §2 5 指標のうち PLAN 単位 4 指標 (成功率 / 所要時間 / 再実行回数 / fail-close 発火率) のみ自動記録、token cost は Phase B (invocation_log 整備依存)
- **改善サイクル**: §3 sprint 末 + §4 提案表示まで、実適用は Phase B

### §6.2 Phase B 着手条件 (U-BR21-9 採用、A-44 ledger)

以下の **AND 条件**を全て満たした時点で Phase B 着手:

1. **Phase A G14 通過** (workflow 標準完了点、技術判断)
2. **KPI D-07 (AI 委譲時間率) 直近 1 sprint ≥ 50% 達成** (MVP scope で AI 委譲が機能している証明、目標値 ≥ 70% の手前)

> **後続調整可能**: PO が目標値を引き上げたい場合は L4/Phase B 着手 PLAN で再調整。

### §6.3 Phase B 実装範囲 (L3 ↔ Phase B carry)

- §2 model 単位指標の本格集計 (opt-in)
- §4 改善アクションの半自動適用パイプライン (提案 + 承認 + 適用 + 評価のループ)
- HM-08 リアルタイム表示 (集計バッチ → イベントストリーム移行)
- §6.4 telemetry (PII redaction + 同意 default)

### §6.4 telemetry (U-BR21-10 採用)

- **PLAN 評価**: default on (KPI D-07 計測の必須インフラ)
- **model evaluation**: opt-in (`.ut-tdd/evaluation/model-opt-in.yaml`)
- **PII redaction**: 必須 (prompt 本文除外、NFR-09/14 整合)
- **詳細設計**: Phase B 着手時 PLAN で確定 (本 sub-doc は宣言のみ)

## §7 FR-L1-36/38/43 詳細化 (Phase B 実装契約)

### FR-BR21-36: スキル評価システム (Phase B)

- **L1 上流**: FR-L1-36
- **入力**: skill 採用ログ (skill 注入 → 利用 → PLAN 完了) / PLAN 成功率
- **出力**: skill_rating (0.0〜1.0) / 採用率 / 削除候補フラグ
- **振る舞い**: sprint 末バッチで skill 別 (採用 PLAN の成功率 + 採用率) を集計 → skill_rating 更新

#### AC-FR-BR21-36-01 (正常系)
- **Given**: skill-X が直近 sprint で 5 PLAN に採用、5 件全て成功
- **When**: sprint 末バッチ実行
- **Then**: skill_rating = 1.0 / 廃止候補フラグ false / HM-08 に維持ステータス表示

#### AC-FR-BR21-36-02 (境界系)
- **Given**: skill-X が直近 30 日採用 0 件 (使われていない)
- **When**: バッチ実行
- **Then**: warn `skill-X 30 日採用 0 件 (未使用 skill)` / 廃止候補フラグ true / 削除は人間専属 (AC-FR-BR21-06)

### FR-BR21-38: model 評価システム (Phase B、opt-in)

- **L1 上流**: FR-L1-38
- **入力**: model 別 invocation_log (token / cost / 成功率)
- **出力**: model_recommendation (task 種別 × drive × layer → model 推奨)
- **振る舞い**: model 別成功率 / cost 効率を集計 → FR-L1-37 (model 推挙) のフィードバック

#### AC-FR-BR21-38-01 (正常系)
- **Given**: model-opt-in.yaml で `enabled: true`、model-A / model-B 両方使用履歴あり
- **When**: バッチ実行
- **Then**: model 別 成功率 / cost 効率比較表 を HM-08 に表示 / 推奨 model 提案

#### AC-FR-BR21-38-02 (境界系)
- **Given**: opt-in `enabled: false`
- **When**: バッチ実行
- **Then**: model 評価 skip / PLAN/skill 評価のみ実行 / audit に opt-in 状態記録

### FR-BR21-43: PoC サクセス計測 (Phase B)

- **L1 上流**: FR-L1-43
- **入力**: Discovery (S0-S4) 完了 PLAN / decision_outcome
- **出力**: PoC 成功率 (confirmed / (confirmed + rejected + pivot)) / 打ち切り判定精度
- **振る舞い**: S4 decide 完了時に集計 → PoC 設計フィードバック (PLAN テンプレート更新提案)

#### AC-FR-BR21-43-01 (正常系)
- **Given**: 直近 10 件 PoC のうち confirmed 6 件 / rejected 3 件 / pivot 1 件
- **When**: バッチ実行
- **Then**: PoC 成功率 60% を HM-08 に表示 / pivot 1 件の原因分析提案

#### AC-FR-BR21-43-02 (異常系)
- **Given**: PoC PLAN が 1 件も無し
- **When**: バッチ実行
- **Then**: info `info: PoC PLAN 0 件、計測対象なし` / HM-08 に「データ蓄積中」表示 / KPI ゼロ起算

## §8 関連 doc

- L1 業務要求 §11 BR-21: `docs/design/harness/L1-requirements/business-requirements.md` §11
- L1 機能要求 FR-L1-36/38/43: `docs/design/harness/L1-requirements/functional-requirements.md` §1
- L1 画面要求 HM-08: `docs/design/harness/L1-requirements/screen-requirements.md` §1.HM.08
- L3 functional (P0 FR-01〜18): `docs/design/harness/L3-functional/functional-requirements.md`
- L3 nfr-grade (NFR 閾値): `docs/design/harness/L3-functional/nfr-grade.md`
- L12 受入テスト: `docs/test-design/harness/L3-acceptance-test-design.md`
- PLAN: `docs/plans/PLAN-L3-02-business-detail.md`

## §9 carry / 次工程 (L4 / Phase B) への引き継ぎ

- **L4 基本設計**: BR-21 評価指標の集計アーキ (state schema / クエリ / 集計バッチ) は L4 基本設計で確定
- **L4 データ設計**: 評価指標 entity (PlanEvaluation / SkillEvaluation / ModelEvaluation / PocEvaluation) は L4 データ設計で確定
- **Phase B 実装 PLAN**: Phase B 着手時 (§6.2 AND 条件達成時) に PLAN-Phase-B-NN として Learning Engine 本実装を起票
- **NFR-18 (telemetry PII redaction)**: nfr-grade.md §7.3 carry と整合、Phase B 着手時に確定 (旧 NFR-17 を A-54 で NFR-18 にリネーム、NFR-17 = 統合セキュリティとの ID 衝突解消)
- **L10 UX refinement**: HM-08 画面の最終 UX 確定は L10 UX 磨きへ送り
- **CC2 carry 強化**: 全 §4 改善アクションは半自動 (提案 + 人間承認) の二段階を厳守、L4 / L5 で詳細実装

### §9.1 PdM / tech-docs / fork 提案 carry (A-46、functional §7.1-§7.3 にも集約)

- **§2 評価指標拡張候補** (PdM tech-innovation): D-14 reviewer cognitive load (SPACE Satisfaction、CC2 measurable proxy) / D-15 handover record 完全性 / D-16 gate block time / D-17 PLAN diff LOC を §2 5 指標に追加検討
- **NSM 提案** (PdM marketing-innovation): NSM = Verified AI delivery rate (D-10 候補、process × safety × automation 統合) を BR-NSM-01 として L1 BR add-design 候補に追記済 (business §9 carry)
- **HM-08 viral loop** (PdM PLG): handover JSON 共有リンク化 (cross-team adoption viral loop)、Phase B carry
- **Phase B Learning Engine 入力強化** (PdM tech-innovation): LinearB LT 分解 (5 phase buckets) + Pluralsight churn (14 日同一 file 再編集率) を Learning Engine 主入力に追加、HM-08 BR-21 cold start 回避
