---
plan_id: PLAN-L3-03-nfr-grade
title: "PLAN-L3-03: NFR グレード値確定工程 (IPA グレード値 + 受入閾値)"
kind: design
layer: L3
sub_doc: nfr
drive: be
status: confirmed
created: 2026-05-28
updated: 2026-06-02
owner: PM (Opus) / PO (人間)
pair_artifact: docs/test-design/harness/L3-acceptance-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
related_l1_nfr: docs/design/harness/L1-requirements/nfr.md
next_pair_freeze: L12
agent_slots:
  - role: po
    slot_label: "PO — NFR グレード値最終判断"
  - role: tl
    slot_label: "TL — IPA グレード判定レビュー"
  - role: qa
    slot_label: "QA — NFR 受入閾値レビュー"
generates:
  - artifact_path: docs/design/harness/L3-functional/nfr-grade.md
    artifact_type: design_doc
dependencies:
  parent: null
  requires:
    - PLAN-L1-05-nfr
    - PLAN-L1-01-business-requirements
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

# PLAN-L3-03: NFR グレード値確定工程 (IPA グレード値 + 受入閾値)

> **正本宣言**: 本 PLAN は **中間準備ドシエ** (ヒアリング項目・調査メモ・工程表)。
> **本 PLAN が産出する正本 doc**: `docs/design/harness/L3-functional/nfr-grade.md` (上記 frontmatter generates 参照)。
> **V-model pair**: L3 nfr-grade sub-doc ↔ L12 受入テスト設計 1 doc。本 PLAN 完了時に G3 pair freeze の対象。
> **スコープ**: L1 NFR-01〜17 (15 件、NFR-09/10 欠番) の **IPA グレード値 + 受入閾値 + L4 ADR 連携点** 確定のみ。NFR 体系自体の追加は L4 carry。

## §0 本 PLAN の役割

L1 で宣言された NFR-01〜17 (15 件、NFR-09/10 欠番) を L3 で **IPA 非機能要求グレード 2018 のグレード値** (例: 可用性 = Lv1〜5) と **受入閾値** (例: gate 通過率 ≥ 90%) で確定する工程を管理する。

L1 NFR は「何の性質が必要か」を IPA × ISO 25010 二軸で宣言したのに対し、L3 NFR-* は「どの水準を満たせば pass か」を機械検証可能な閾値として確定する。L12 受入テスト設計の入力として、各 NFR-* に閾値 + 測定方法 + pass 条件を付与する。

中間準備 + 工程表 + 実装計画を内蔵し、進捗を追跡可能にする。

## §1 入力 (上流からの baton)

- L0 企画書: `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- L1 NFR (確定済): `docs/design/harness/L1-requirements/nfr.md` (NFR-01〜17 = 15 件、NFR-09/10 連動欠番)
- L1 業務 KPI D-01〜D-09: `docs/design/harness/L1-requirements/business-requirements.md` §6.5 (NFR 受入閾値と整合)
- IPA 非機能要求グレード 2018 (6 大項目 + 各 Lv1〜5 定義)
- ISO 25010:2023 品質特性 (Lv 定義なし、特性 catalog のみ)

## §2 出力 (本 PLAN で確定)

- 正本 doc: `docs/design/harness/L3-functional/nfr-grade.md` (frontmatter generates)
- 各 NFR-* の IPA グレード値 (Lv1〜5) + 受入閾値 + 測定方法 + pass 条件
- L4 ADR 連携点: NFR-02 (更新性) / NFR-15 (server-optional) 等の実現方式 carry 一覧
- 機械検証: `ut-tdd doctor` の NFR 閾値チェックルール設計

## §3 ヒアリング項目 / 調査メモ (NFR grade 固有)

**status 凡例**: ✅ / ➡️ L4 / Phase B carry / ❓ PO 判断待ち / 🆕 TL レビュー AI 推奨採用 (draft 着地、G3 で PO 確認)

> **TL レビュー反映 (2026-05-28、A-43 ledger + A-44 PO 直問 0 化)**: 全 15 項目を TL 視点で再仕分け、A-44 で IPA Lv 集約も AI 採用に格上げ。**PO 判断対象 = 0 件**。AI 採用 11 件 + L4 / Phase B carry 4 件 (U-NFR3-11/12/14/15)。G3 readiness 整備時に他項目と合わせて PO 確認。

### 3.1 IPA グレード Lv 選定

| ID | ヒアリング項目 | 着地先 | status |
|----|--------------|--------|--------|
| U-NFR3-1〜6 (集約) | IPA グレード Lv 全体方針 (可用性 / 性能・拡張性 / 運用・保守性 / 移行性 / セキュリティ / システム環境 の 6 大項目) | nfr-grade §1〜§6 | 🆕 **可用性 Lv2 / 性能・拡張性 Lv2 / 運用・保守性 Lv3 / 移行性 Lv2 / セキュリティ Lv3 / システム環境 Lv3 を採用** (A-44 ledger、PO 指摘「TL/AI で決めれる範囲なら振るな」反映)。理由: IPA 非機能要求グレード 2018 の公式 sample 整合 (社内内製ツール = Lv2-3 default が業界標準値)、過剰投資回避 + 不足回避のバランス。PO が後続で Lv 引き上げ要求した場合は L4 PLAN で個別調整可能 (例: Phase B server-optional 採用時に性能 Lv3 へ昇格) |

> **TL 採用根拠詳細** (各 NFR-* 対応): 可用性 Lv2 = NFR-01/06/16 内製ツール想定で業務時間内継続十分 / 性能 Lv2 = NFR-02/12/15 CLI ツール想定で大規模負荷想定なし / 保守性 Lv3 = NFR-07/08/13/14 社内導入で Lv2 不足 / 移行性 Lv2 = HELIX→UT-TDD は 1 case のみ / セキュリティ Lv3 = NFR-06/11/09 agent guard fail-close 厳守必須 / 環境 Lv3 = NFR-01/04/05 Windows/macOS/Linux + GitHub 正本

### 3.2 受入閾値 (KPI 連動)

| ID | ヒアリング項目 | 着地先 | status (TL 推奨採用) |
|----|--------------|--------|--------|
| U-NFR3-7 | NFR-13 gate 通過率閾値 | nfr-grade §3 | 🆕 **D-02 ≥ 90% 維持**。理由: KPI D-02 既定値、再調整は KPI と doc drift 源 |
| U-NFR3-8 | NFR-14 bypass 許容範囲 | nfr-grade §5 | 🆕 **警告 + audit 記録で許容 (D-06 = 0 件は努力目標)**。理由: S-03 PO override 例外権の制度設計と整合、block 化は災害復旧時 (Incident mode) の致命的硬直化リスク |
| U-NFR3-9 | NFR-08 trace 整合率 | nfr-grade §3 | 🆕 **D-05 ≥ 95% を NFR-08 閾値に紐付け**。理由: KPI integrated、独自閾値設定は doc drift 源 |
| U-NFR3-10 | NFR-16 onboarding 成功率 | nfr-grade §1 | 🆕 **D-09 ≥ 95% 維持 (handover 引継ぎ成功率)**。理由: KPI integrated |

### 3.3 L4 ADR carry 整理

| ID | ヒアリング項目 | 着地先 | status |
|----|--------------|--------|--------|
| U-NFR3-11 | NFR-02 配布形態 (npm / repo template / GitHub Packages) | nfr-grade §7 L4 carry | ➡️ **L4 ADR 専決** (本 PLAN は候補列挙のみ)。L4 PLAN 起票時に PO 確認 |
| U-NFR3-12 | NFR-15 Phase B 拡張先 (Cloudflare Workers / fly.io / docker-compose) | nfr-grade §7 L4 carry | ➡️ **Phase B 着手時 + L4 ADR 専決** (本 PLAN は候補列挙のみ) |
| U-NFR3-13 | NFR-09 rule parity 機械検証要否 | nfr-grade §5 NFR-09 補番回復 | 🆕 **機械検証必須化**。理由: agent-guard fail-close 整合、人間 review のみは drift 源 (Claude/Codex 出力差を毎回人手チェック非現実的) |

### 3.4 Phase B telemetry NFR

| ID | ヒアリング項目 | 着地先 | status |
|----|--------------|--------|--------|
| U-NFR3-14 | Phase B telemetry default | nfr-grade §7 carry | ➡️ **Phase B 着手時専決** (本 PLAN は宣言のみ + 推奨「default off + opt-in 3 レベル」carry note 記載) |
| U-NFR3-15 | PII redaction NFR 化 | nfr-grade §6 carry / NFR 追加判断 | 🆕 **NFR-18 新規候補 = 「telemetry PII redaction」 (Phase B carry)**。理由: GDPR / 社内 PII 方針整合、Phase B telemetry 必須要件。※ A-54 で旧 NFR-17 → NFR-18 にリネーム (NFR-17 = 統合セキュリティと ID 衝突回避) |

## §4 工程表 (Step + 進捗)

### Step 1: L1 NFR baton 整理
- 担当: pmo-sonnet
- 内容: L1 NFR sub-doc 全 14 件を Read し、IPA × ISO 25010 二軸表との整合を確認
- 進捗: 🔄 (本起票時)

### Step 2: IPA グレード Lv 確定 (U-NFR3-1〜6)
- 担当: tl + pmo-tech-docs
- 内容: 6 IPA 大項目それぞれの Lv を確定 (推奨は AI 提示、PO 承認)
- 進捗: ✅ (A-45 commit、§1〜§6 全 6 大項目 Lv2-3 確定 + 各 AT pass 条件)

### Step 3: 受入閾値確定 (U-NFR3-7〜10、KPI 連動)
- 担当: tl + qa
- 内容: 4 閾値項目 (D-02 / D-06 / D-05 / D-09 連動) を確定
- 進捗: ✅ (§3 NFR-13/14 + §1 NFR-16 + §3 NFR-08 で KPI 4 件 integrated)

### Step 4: L4 ADR carry 整理 (U-NFR3-11〜13)
- 担当: tl
- 内容: NFR-02 / NFR-15 / NFR-09 の L4 ADR 候補を列挙
- 進捗: ✅ (§7.1 L4 ADR carry + §7.2 NFR-09 補番回復 carry 完備)

### Step 5: Phase B telemetry carry (U-NFR3-14〜15)
- 担当: tl + po
- 内容: telemetry default + PII redaction の Phase B 設計を carry note 化
- 進捗: ✅ (§7.3 Phase B telemetry carry + NFR-18 PII redaction 新規候補宣言、A-54 で NFR-17→18 リネーム)

### Step 6: 機械検証ルール設計
- 担当: aim + tl
- 内容: `ut-tdd doctor` の NFR 閾値チェックルールを設計 (例: gate 通過率 ≥ 90% の集計クエリ)
- 進捗: 🔄 (§7.4 L4 基本設計 carry + §7.5 L12 受入テスト pair で骨子宣言、本実装は L7 carry)

### Step 7: review (self / pmo-sonnet)
- 担当: pmo-sonnet
- 内容: 専門サブエージェント review 必須。全 NFR-* 閾値 + 測定方法 + pass 条件記載・孤児 NFR 0 を確認
- 進捗: ⬜ (G3 readiness 整備時に L3 3 sub-doc + L12 受入テスト 4 doc 全件まとめて review)

## §5 実装計画

| 節 | 情報源 | 方法 |
|----|--------|------|
| §1 可用性 | NFR-01/06/16 + U-NFR3-1 | IPA 継続性 Lv2 + 受入閾値 |
| §2 性能・拡張性 | NFR-02/12/15 + U-NFR3-2 | IPA 性能効率性 Lv2 |
| §3 運用・保守性 | NFR-07/08/13/14 + U-NFR3-3 + U-NFR3-7/9 | IPA 保守性 Lv3 + KPI 閾値 |
| §4 移行性 | HELIX→UT-TDD + U-NFR3-4 | IPA 移植性 Lv2 |
| §5 セキュリティ | NFR-06/11/(09) + U-NFR3-5 + U-NFR3-8 | IPA セキュリティ Lv3 + bypass 警告 |
| §6 システム環境 | NFR-01/04/05 + U-NFR3-6 | IPA 移植性 Lv3 |
| §7 carry / L4 ADR | U-NFR3-11〜15 | NFR-02/15/09/17 carry list |

## §6 DoD (Definition of Done)

- [ ] nfr-grade.md が必須 § 全件含む (§1〜§7)
- [ ] 全 NFR-01〜17 (15 件、NFR-09/10 欠番、NFR-17 統合セキュリティ A-54 追加) に IPA グレード Lv + 受入閾値 + 測定方法 + pass 条件記載
- [ ] §3 / §5 で KPI D-02/D-05/D-06/D-09 と NFR 閾値の対応が明示
- [ ] §7 で L4 ADR carry (NFR-02 / NFR-15 / NFR-09) + Phase B carry (NFR-18 telemetry PII) 明示
- [ ] frontmatter 必須フィールド完備
- [ ] L12 受入テスト設計で本 sub-doc 由来 NFR が被覆 (孤児 NFR = 0)
- [ ] 専門サブエージェント review (Step 7) 通過記録
- [ ] **PO サインオフ準備完了**

## §7 carry / 次工程 (L4 / Phase B) への引き継ぎ

- **L4 ADR (PLAN-L4-NN)**: NFR-02 (更新性) / NFR-15 (server-optional) / NFR-09 (rule parity) の実現方式を L4 ADR で確定 (U-NFR3-11〜13)
- **L4 基本設計**: NFR 閾値の測定アーキ (state schema / クエリ / 集計バッチ) は L4 基本設計
- **Phase B 拡張**: NFR-18 (telemetry PII redaction、新規候補。A-54 で旧 NFR-17→18 リネーム) は Phase B 着手時に確定 (U-NFR3-14/15)
- **L12 受入テスト**: 各 NFR-* の pass 条件は L12 受入テスト設計で機械検証 (本 PLAN は閾値定義のみ)
- **PLAN-L3-01/02 連携**: PLAN-L3-01 (FR 詳細化) / PLAN-L3-02 (BR-21 詳細化) と独立 (NFR は機能横断、本 PLAN 単独で完結)
