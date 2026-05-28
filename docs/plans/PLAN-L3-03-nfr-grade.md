---
plan_id: PLAN-L3-03-nfr-grade
title: "PLAN-L3-03: NFR グレード値確定工程 (IPA グレード値 + 受入閾値)"
kind: design
layer: L3
sub_doc: nfr
drive: be
status: draft
created: 2026-05-28
updated: 2026-05-28
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
---

# PLAN-L3-03: NFR グレード値確定工程 (IPA グレード値 + 受入閾値)

> **正本宣言**: 本 PLAN は **中間準備ドシエ** (ヒアリング項目・調査メモ・工程表)。
> **本 PLAN が産出する正本 doc**: `docs/design/harness/L3-functional/nfr-grade.md` (上記 frontmatter generates 参照)。
> **W-model pair**: L3 nfr-grade sub-doc ↔ L12 受入テスト設計 1 doc。本 PLAN 完了時に G3 pair freeze の対象。
> **スコープ**: L1 NFR-01〜16 (14 件、NFR-09/10 欠番) の **IPA グレード値 + 受入閾値 + L4 ADR 連携点** 確定のみ。NFR 体系自体の追加は L4 carry。

## §0 本 PLAN の役割

L1 で宣言された NFR-01〜16 (14 件) を L3 で **IPA 非機能要求グレード 2018 のグレード値** (例: 可用性 = Lv1〜5) と **受入閾値** (例: gate 通過率 ≥ 90%) で確定する工程を管理する。

L1 NFR は「何の性質が必要か」を IPA × ISO 25010 二軸で宣言したのに対し、L3 NFR-* は「どの水準を満たせば pass か」を機械検証可能な閾値として確定する。L12 受入テスト設計の入力として、各 NFR-* に閾値 + 測定方法 + pass 条件を付与する。

中間準備 + 工程表 + 実装計画を内蔵し、進捗を追跡可能にする。

## §1 入力 (上流からの baton)

- L0 企画書: `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- L1 NFR (確定済): `docs/design/harness/L1-requirements/nfr.md` (NFR-01〜16 = 14 件、NFR-09/10 連動欠番)
- L1 業務 KPI D-01〜D-09: `docs/design/harness/L1-requirements/business-requirements.md` §6.5 (NFR 受入閾値と整合)
- IPA 非機能要求グレード 2018 (6 大項目 + 各 Lv1〜5 定義)
- ISO 25010:2023 品質特性 (Lv 定義なし、特性 catalog のみ)

## §2 出力 (本 PLAN で確定)

- 正本 doc: `docs/design/harness/L3-functional/nfr-grade.md` (frontmatter generates)
- 各 NFR-* の IPA グレード値 (Lv1〜5) + 受入閾値 + 測定方法 + pass 条件
- L4 ADR 連携点: NFR-02 (更新性) / NFR-15 (server-optional) 等の実現方式 carry 一覧
- 機械検証: `ut-tdd doctor` の NFR 閾値チェックルール設計

## §3 ヒアリング項目 / 調査メモ (NFR grade 固有)

**status 凡例**: ✅ / ➡️ L4 carry / ❓ PO 判断待ち / 🆕 draft

### 3.1 IPA グレード Lv 選定

| ID | ヒアリング項目 | 着地先 | status |
|----|--------------|--------|--------|
| U-NFR3-1 | **可用性** (NFR-01 cross-platform / NFR-06 fail-close / NFR-16 onboarding 互換性): IPA 継続性 Lv? (例: Lv2 = 業務時間内継続) | nfr-grade §1 可用性 | ❓ PO 判断 (推奨: Lv2、内製ツール想定で Lv4-5 過剰) |
| U-NFR3-2 | **性能・拡張性** (NFR-02 更新性 / NFR-12 machine×AI / NFR-15 server-optional): IPA 性能効率性 Lv? | nfr-grade §2 性能 | ❓ PO 判断 (推奨: Lv2、CLI ツール想定で Lv4-5 過剰、ただし AI 委譲時間率 ≥ 70% は KPI D-07 で別途確保) |
| U-NFR3-3 | **運用・保守性** (NFR-07 MVP なし / NFR-08 implementation_status / NFR-13 dev-local+CI / NFR-14 human-as-residue): IPA 保守性 Lv? | nfr-grade §3 保守性 | ❓ PO 判断 (推奨: Lv3、社内導入想定で Lv2 弱い) |
| U-NFR3-4 | **移行性** (HELIX → UT-TDD 移行計画 / Phase A→B): IPA 移植性 Lv? | nfr-grade §4 移行性 | ❓ PO 判断 (推奨: Lv2、社内 1 case 想定で Lv3 過剰) |
| U-NFR3-5 | **セキュリティ** (NFR-06 fail-close / NFR-11 役割分離 / NFR-09 rule parity (欠番)): IPA セキュリティ Lv? | nfr-grade §5 セキュリティ | ❓ PO 判断 (推奨: Lv3、PII / credential 扱いなしだが agent guard fail-close 厳守で Lv3) |
| U-NFR3-6 | **システム環境** (NFR-01 cross-platform / NFR-04 言語非依存 / NFR-05 GitHub 正本): IPA 移植性 Lv? | nfr-grade §6 システム環境 | ❓ PO 判断 (推奨: Lv3、Windows/macOS/Linux ネイティブ + GitHub 正本で Lv3) |

### 3.2 受入閾値 (KPI 連動)

| ID | ヒアリング項目 | 着地先 | status |
|----|--------------|--------|--------|
| U-NFR3-7 | **NFR-13 gate 通過率 ≥ 90% (KPI D-02)** をそのまま L3 受入閾値とするか、L3 で再調整 (例: ≥ 85%) するか | nfr-grade §3 NFR-13 閾値 | ❓ PO 判断 (推奨: 90% 維持、KPI と integrated) |
| U-NFR3-8 | **NFR-14 agent guard bypass = 0 件目標 (KPI D-06)** を L3 で「絶対 0 件 = block」とするか「警告 + audit 記録で許容」とするか | nfr-grade §5 NFR-14 閾値 | ❓ PO 判断 (推奨: 警告 + audit 記録で許容、PO override 例外権 S-03 と整合) |
| U-NFR3-9 | **D-05 4 artifact trace 整合率 ≥ 95%** を NFR-08 (implementation_status 真実性) の受入閾値とするか | nfr-grade §3 NFR-08 閾値 | ❓ PO 判断 (推奨: 95% を NFR-08 閾値に紐付け、L12 受入テストで確認) |
| U-NFR3-10 | **D-09 handover 引継ぎ成功率 ≥ 95%** を NFR-16 (onboarding 互換性) の受入閾値とするか | nfr-grade §1 NFR-16 閾値 | ❓ PO 判断 (推奨: 95% 維持、KPI integrated) |

### 3.3 L4 ADR carry 整理

| ID | ヒアリング項目 | 着地先 | status |
|----|--------------|--------|--------|
| U-NFR3-11 | **NFR-02 (更新性) の配布形態**: npm 配布 / repo template / 社内 GitHub Packages のうち L4 ADR で確定する候補は? | nfr-grade §7 L4 carry | ➡️ L4 carry (本 PLAN は候補列挙のみ) |
| U-NFR3-12 | **NFR-15 (server-optional) の Phase B 拡張**: Cloudflare Workers / fly.io / docker-compose のうち想定候補は? | nfr-grade §7 L4 carry | ➡️ L4 carry (Phase B 着手時に確定) |
| U-NFR3-13 | **NFR-09 (rule parity) の U-補-3 PO 判断**: Claude/Codex 同一判定を「機械検証必須」か「人間 review 推奨」か | nfr-grade §5 NFR-09 補番回復 | ❓ PO 判断 (推奨: 機械検証必須、agent-guard fail-close 整合) |

### 3.4 Phase B telemetry NFR

| ID | ヒアリング項目 | 着地先 | status |
|----|--------------|--------|--------|
| U-NFR3-14 | **Phase B telemetry**: default off / opt-in 3 レベル (off / local-only / sync) を L3 で確定するか Phase B 開始時 carry か | nfr-grade §7 carry | ➡️ Phase B carry (本 PLAN は宣言のみ) |
| U-NFR3-15 | **PII redaction**: telemetry で prompt 本文除外を NFR-* として新規追加するか NFR-16 拡張で扱うか | nfr-grade §6 carry / NFR 追加判断 | ❓ PO 判断 (推奨: NFR-17 新規追加 = 「telemetry PII redaction」、Phase B carry) |

## §4 工程表 (Step + 進捗)

### Step 1: L1 NFR baton 整理
- 担当: pmo-sonnet
- 内容: L1 NFR sub-doc 全 14 件を Read し、IPA × ISO 25010 二軸表との整合を確認
- 進捗: 🔄 (本起票時)

### Step 2: IPA グレード Lv 確定 (U-NFR3-1〜6)
- 担当: tl + pmo-tech-docs
- 内容: 6 IPA 大項目それぞれの Lv を確定 (推奨は AI 提示、PO 承認)
- 進捗: ⬜

### Step 3: 受入閾値確定 (U-NFR3-7〜10、KPI 連動)
- 担当: tl + qa
- 内容: 4 閾値項目 (D-02 / D-06 / D-05 / D-09 連動) を確定
- 進捗: ⬜

### Step 4: L4 ADR carry 整理 (U-NFR3-11〜13)
- 担当: tl
- 内容: NFR-02 / NFR-15 / NFR-09 の L4 ADR 候補を列挙
- 進捗: ⬜

### Step 5: Phase B telemetry carry (U-NFR3-14〜15)
- 担当: tl + po
- 内容: telemetry default + PII redaction の Phase B 設計を carry note 化
- 進捗: ⬜

### Step 6: 機械検証ルール設計
- 担当: aim + tl
- 内容: `ut-tdd doctor` の NFR 閾値チェックルールを設計 (例: gate 通過率 ≥ 90% の集計クエリ)
- 進捗: ⬜

### Step 7: review (self / pmo-sonnet)
- 担当: pmo-sonnet
- 内容: 専門サブエージェント review 必須。全 NFR-* 閾値 + 測定方法 + pass 条件記載・孤児 NFR 0 を確認
- 進捗: ⬜

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
- [ ] 全 NFR-01〜16 (14 件) に IPA グレード Lv + 受入閾値 + 測定方法 + pass 条件記載
- [ ] §3 / §5 で KPI D-02/D-05/D-06/D-09 と NFR 閾値の対応が明示
- [ ] §7 で L4 ADR carry (NFR-02 / NFR-15 / NFR-09) + Phase B carry (NFR-17 telemetry) 明示
- [ ] frontmatter 必須フィールド完備
- [ ] L12 受入テスト設計で本 sub-doc 由来 NFR が被覆 (孤児 NFR = 0)
- [ ] 専門サブエージェント review (Step 7) 通過記録
- [ ] **PO サインオフ準備完了**

## §7 carry / 次工程 (L4 / Phase B) への引き継ぎ

- **L4 ADR (PLAN-L4-NN)**: NFR-02 (更新性) / NFR-15 (server-optional) / NFR-09 (rule parity) の実現方式を L4 ADR で確定 (U-NFR3-11〜13)
- **L4 基本設計**: NFR 閾値の測定アーキ (state schema / クエリ / 集計バッチ) は L4 基本設計
- **Phase B 拡張**: NFR-17 (telemetry PII redaction、新規候補) は Phase B 着手時に確定 (U-NFR3-14/15)
- **L12 受入テスト**: 各 NFR-* の pass 条件は L12 受入テスト設計で機械検証 (本 PLAN は閾値定義のみ)
- **PLAN-L3-01/02 連携**: PLAN-L3-01 (FR 詳細化) / PLAN-L3-02 (BR-21 詳細化) と独立 (NFR は機能横断、本 PLAN 単独で完結)
