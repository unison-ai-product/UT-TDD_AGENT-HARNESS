---
doc_type_id: DOC-L0-CHARTER
layer: L0
status: draft
plan: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
related_concept: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# L0 企画書 (UT-TDD Agent Harness)

テンプレート `docs/templates/vmodel/L0-charter.md` の章立てに沿った、ハーネス自身の企画書である。
中身の正本は `docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md` (バージョンアップ企画) と
`docs/governance/ut-tdd-agent-harness-concept_v3.1.md` (目的・柱)。ここでは要約だけを置く。
社内システム / 開発基盤のため、ROI・KPI の定量化は企画書で強制しない (concept v3.1: 定量指標は L1 / L3 で定義)。

## 第1章 事業概要

### 1.1 背景・市場

社内プロダクト開発で AI 実装エージェントを使う機会が増えたが、エージェントの出力は、
検証・状態管理・工程の規律が無いと安全に積み上がらない。市場向けの製品ではなく、社内の開発基盤である。
現行ハーネスは TypeScript/Node core、追記専用の evidence、`.ut-tdd/harness.db` の投影、Git 履歴を
土台として成立済みで、そこへ clean V モデル設計 (checked ZIP) を上流素材として全面的に取り込む企画が
PLAN-L0-01 である。

### 1.2 目的・ビジョン

- AI 実装エージェントを社内プロダクト開発で安全に使うための、検証・開発の土台になる。ハーネス自体は最終製品ではない。
- 柱 6 つ: 土台優先 / 文書先行 + 機械強制 / 状態とフィードバックの自動化 / 文脈・スキルの動的注入 /
  実用的なオーケストレーション / 厳格な検証 (テストか明示的な証拠の無い完了宣言をしない)。
- バージョンアップでは、Forward 工程・PLAN の同一性と改訂・文書体系・G8-G14 検証を、上流設計から入れ替える。

### 1.3 提供価値 (バリュープロポジション)

下流のプロダクト開発者に、(1) 工程の現在地と欠落が機械で見える、(2) 規則が schema / lint / doctor / hook /
テストで強制される、(3) 完了の主張に証拠が付く、という状態を提供する。

## 第2章 ターゲットと課題

### 2.1 ターゲット

該当なし (社内基盤のため市場セグメントは持たない)。利用者は次の 2 種である: 下流プロダクトを開発する
社内の開発者と AI エージェント (Claude / Codex)、ハーネスを運用する PO / TL / QA / AIM。

### 2.2 課題→施策

| No | 課題 | 要求への展開 |
|---|---|---|
| 1 | 工程の現在地・V 字対・進捗が局所的で、駆動モデル選択と結び付かない | 工程管理表を PLAN / DB / doctor / status の共通入力にする (U2) |
| 2 | 設計 ID の宣言が統一されず、検出が散在する | 宣言型 design IR と DB 投影、閉包検出 (U3、U4) |
| 3 | 検証 (右肺) が品質改善へ戻らない | L8-L14 の検証 PLAN を DB / 欠陥ルーティングへ接続 (U7) |
| 4 | Forward と PLAN の同一性・改訂・証跡が弱い | Forward を状態遷移台帳付き FSM に、PLAN を資産 v2 に (U6) |
| 5 | 既存文書に古い前提が混在する | 109 件の source 文書すべてに処置 (採用・統合・参照・延期・非適用) と更新先を付ける (U1) |

## 第3章 プロダクト方針 (MVP)

### 3.1 基本方針

- 土台 (chassis) を継承しつつ、engine / handling / safety を全面更新する。変更量を小さくすることは受入条件ではない。
- 設計契約から detector / doctor を導出し、既存 detector の都合に設計を合わせない。
- DB は正本ではなく投影・検出・照会の面とする。正本は設計・PLAN・テスト設計。

### 3.2 プロダクトコンセプト

V モデル (L0-L14 + 逆アーキ R0-R4 + Scrum / PoC S0-S4) を、文書と機械強制の両面で運用するハーネス。
詳細は concept v3.1。

## 第4章 ビジネスモデル・KPI

### 4.1 ビジネスモデル

該当なし (社内基盤。課金・プランは無い)。

### 4.2 主要 KPI

該当なし (定量指標は L1 / L3 で定義する方針)。進捗は工程管理表の RAG と transition ledger で見る。

## 第5章 スコープ

### 5.1 MVP 対象

PLAN-L0-01 §3 の 6 項目: 文書体系の台帳化 (109 / 163 / 21)、Forward FSM、PLAN 資産 v2、宣言型 V モデル契約と
G8-G14 の導出、L8-L14 検証 PLAN の全層起票、既存文書の全件再評価。

### 5.2 対象外 (次フェーズ)

- clean ZIP の Python tooling の product runtime への移植 (ADR-001 により TypeScript へ翻案)。
- TeamFlow sample の正本・runtime・検出結果としての直接採用 (比較素材のみ)。

## 第6章 ロードマップ

| No | フェーズ | 主要成果 |
|---|---|---|
| 1 | U0 上流再企画 | 企画 PLAN、ZIP の出自、109 → 163 → 対象の処置 |
| 2 | U1 要求・要件の再凍結 | L1 / L3 の改訂 |
| 3 | U2-U4 工程表・design IR・検出系 DB 化 | 工程表の厳格化、`spec.defines` 相当、query 可能な検出 |
| 4 | U5-U6 DDD/OOP 強化・workflow/PLAN 改修 | L4-L6 設計規約、Forward FSM、PLAN 資産 v2 |
| 5 | U7 右肺閉ループ | G8-G14 と verify PLAN / evidence の全層実装 |

時期は PLAN に記載が無いため置かない。

## 第7章 収支計画・投資対効果

該当なし (社内基盤。コストと採算は企画書で扱わない方針)。

## 第8章 推進体制

| 役割 | 責務 |
|---|---|
| PO | 目的・非破壊境界・全面見直し範囲の承認 |
| TL | 現行と checked ZIP の差分評価、Forward / PLAN の engine-swap 境界の確定 |
| QA | 右肺・検証・工程管理表・閉包 gate の受入条件 |
| AIM | DB 投影・検出・起票・レビュー workflow への接続設計 |

## 第9章 リスク

| No | リスク | 対策 |
|---|---|---|
| 1 | 全面見直しの途中で意味ドリフトが起きる | wave 分割で上流から再凍結し、各 wave を review する |
| 2 | 文書の黙った脱落 | source 全件に処置を付け、silent omission を禁止する |
| 3 | 概念だけの false-green | 恒久 park と概念のみの検証を撤去する |
| 4 | 既存 detector への設計の引きずり | 設計契約から detector を導出する |
| 5 | ZIP 素材の直接採用による正本の混濁 | ZIP は素材に限り、hash と inventory を出自として固定する |

## 第10章 代替案の比較

該当なし (PLAN-L0-01 は「既存 chassis を活かしつつ全面更新する」案を PO が承認済みで、
代替案の比較表は PLAN に無い)。

## 未達事項

PLAN-L0-01 のうち、この文書の時点で未達または carry のもの。

- DoD (§5) 未チェック 7 項目: 受け皿と ZIP 中核の対応説明 / 旧 ZIP を対象外にする明記 /
  source 109 件すべての処置と 163 item・target slot への join / U1→U7 順での再凍結 /
  既存 docs 全部の inventory と差分更新 / DB を投影に限る原則 / 工程管理表と DB 投影の接続。
- 未達事項を閉じる条件 (PLAN-L0-01 の DoD、省略不可):
  - 既存 docs 全部を inventory し、activation / profile / trace closure に基づく差分更新、または理由付きの非適用として閉じる (155 行)。差分更新、DB 接続、統合だけでは閉じない。
  - 工程管理表は人間向けの進行台帳であり、AI の PLAN オーケストレーションと分離したうえで、DB projection で接続する (157 行)。
  - checked ZIP の 109 source docs / 163 item は、disposition catalog で全件を exactly once 扱いにし、silent omission を許さない (167 行)。
- 未決事項 (§6) 5 件: `spec.defines` の置き場 (frontmatter か本文 `spec:`) / 工程管理表を `roadmap:` 拡張か新 schedule 投影か /
  activation・profile と PLAN status の分離 / DDD/OOP 強化を L4 data 主導か L5/L6 主導か /
  109 source docs の target slot への統合。
- 後続 PLAN 化するテーマ (§4) は 8 件ある: `requirements`、`roadmap-drive-selection`、`declarative-spec-ir`、`spec-trace-closure`、`activation-profile-scope`、`ddd-oop-design`、`plan-asset-format`、`right-lung-quality-loop-db`。
- frontmatter `status=confirmed` は方針承認であり、program 完遂ではない (§5 冒頭)。
