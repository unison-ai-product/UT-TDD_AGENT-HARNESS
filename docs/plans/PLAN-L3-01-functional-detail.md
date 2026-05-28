---
plan_id: PLAN-L3-01-functional-detail
title: "PLAN-L3-01: 機能要件 (FR + AC) 詳細化工程"
kind: design
layer: L3
sub_doc: functional
drive: be
status: draft
created: 2026-05-28
updated: 2026-05-28
owner: PM (Opus) / PO (人間)
pair_artifact: docs/test-design/harness/L3-acceptance-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
related_l1_functional: docs/design/harness/L1-requirements/functional-requirements.md
related_l1_screen: docs/design/harness/L1-requirements/screen-requirements.md
related_l2_screen: docs/design/harness/L2-screen/
next_pair_freeze: L12
agent_slots:
  - role: po
    slot_label: "PO — FR + AC 最終判断"
  - role: tl
    slot_label: "TL — 設計レビュー + adversarial check"
  - role: aim
    slot_label: "AIM — FR 詳細化実装支援"
generates:
  - artifact_path: docs/design/harness/L3-functional/functional-requirements.md
    artifact_type: design_doc
dependencies:
  parent: null
  requires:
    - PLAN-L1-02-functional-requirements
    - PLAN-L1-03-screen-requirements
  blocks: []
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-L3-01: 機能要件 (FR + AC) 詳細化工程

> **正本宣言**: 本 PLAN は **中間準備ドシエ** (ヒアリング項目・調査メモ・工程表)。
> **本 PLAN が産出する正本 doc**: `docs/design/harness/L3-functional/functional-requirements.md` (上記 frontmatter generates 参照)。
> **W-model pair**: L3 機能要件 sub-doc ↔ L12 受入テスト設計 1 doc。本 PLAN 完了時に G3 pair freeze の対象 (next_pair_freeze: L12)。

## §0 本 PLAN の役割

本 PLAN は L1 機能要求 (FR-L1-01〜44 = 41 件 P0:18 / P1:18 / P2:5) を L3 機能要件 (FR-* + AC-*) として詳細化する工程を管理する。

L1 FR-L1-* は「業務的に何が必要か」を宣言レベルで列挙したのに対し、L3 FR-* は「機能の入出力 / 振る舞い / 受入条件 (AC)」を確定し、L7 実装スプリント (TDD Red) の入力として機械検証可能な粒度に整える。

中間準備 + 工程表 + 実装計画を内蔵し、進捗を追跡可能にする。

## §1 入力 (上流からの baton)

- L0 企画書: `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- L1 機能要求 (確定済): `docs/design/harness/L1-requirements/functional-requirements.md` (FR-L1-01〜44 = 41 件)
- L1 画面要求 (確定済): `docs/design/harness/L1-requirements/screen-requirements.md` (14 画面 PM/HM/GD + §5 G1-trace マトリクス)
- L1 業務要求: `docs/design/harness/L1-requirements/business-requirements.md` (BR-01〜08 + UX-01〜03 + BR-21 + §3.3.2 人間主導原則)
- L2 画面設計 placeholder: `docs/design/harness/L2-screen/` (PM/HM/GD 14 画面の L2 接続点)
- v2 取り込み軌跡: `docs/migration/v2-import-ledger.md` §5 (A-25〜A-41)
- HELIX-workflows L3 process: `vendor/helix-source/docs/v2/process/L03-functional-requirements.md` (参考)

## §2 出力 (本 PLAN で確定)

- 正本 doc: `docs/design/harness/L3-functional/functional-requirements.md` (frontmatter generates)
- 量閉じ: L1 FR-L1-* 41 件全件が L3 FR-* + AC-* で詳細化されていること (孤児 L1 FR = 0)
- 機械検証: `ut-tdd plan lint --gate G3` (G3 = L3 pair freeze ゲート) で R-trace 整合 PASS

## §3 ヒアリング項目 / 調査メモ (functional 固有)

**status 凡例**: ✅ = 正本着地済 / ➡️ = L4/L5 carry / ❓ = PO 判断待ち / 🆕 = draft 着地・G3 待ち

### 3.1 FR 詳細化スコープ判断

| ID | ヒアリング項目 | 着地先 | status |
|----|--------------|--------|--------|
| U-L3-1 | **P0 18 件は L3 で全件 FR-* + AC-* 詳細化必須** か、または P0 でも一部 L4 carry 可能か (G3 凍結条件) | functional sub-doc §1 / §2 | ❓ PO 判断 (推奨: P0 全件 G3 必須) |
| U-L3-2 | **P1 18 件は L3 で詳細化 / L4 carry / Phase B carry のどの粒度か** (FR-L1-19 Learning Engine 等は Phase B 寄り) | functional sub-doc §3 carry 宣言 | ❓ PO 判断 (推奨: L4 carry default、Phase B 連動のみ Phase B carry) |
| U-L3-3 | **P2 5 件 (FR-L1-36/38/43 + 他)** は L3 で詳細化するか BR-21 経由で PLAN-L3-02 に委ねるか | PLAN-L3-02 連携 | ❓ PO 判断 (推奨: PLAN-L3-02 に委譲、本 PLAN で除外) |

### 3.2 AC (Acceptance Criteria) 構造

| ID | ヒアリング項目 | 着地先 | status |
|----|--------------|--------|--------|
| U-L3-4 | **AC の粒度**: Given-When-Then 形式 / チェックリスト形式 / 機能シナリオ形式のいずれを正本とするか | functional sub-doc §2 各 FR-* | ❓ PO 判断 (推奨: Given-When-Then default、L12 受入テスト変換が機械化しやすい) |
| U-L3-5 | **AC 数の下限**: 各 FR-* に最低何件 AC を要求するか (1 件で十分 / 正常系 + 異常系 + 境界の 3 件最低 等) | functional sub-doc §2 / G3 lint | ❓ PO 判断 (推奨: 正常系 1 + 異常系 1 + 境界 1 = 最低 3 件) |
| U-L3-6 | **AC ID 形式**: AC-{FR-ID}-{NN} (例: AC-FR-L1-01-01) か独立採番 (AC-001〜) か | functional sub-doc §2 + §6 DoD | ❓ PO 判断 (推奨: AC-{FR-ID}-{NN} 形式、trace 接続を ID で機械化) |

### 3.3 画面紐付き (L2 deep-link) 確定

| ID | ヒアリング項目 | 着地先 | status |
|----|--------------|--------|--------|
| U-L3-7 | **L3 FR-* と 14 画面 (PM/HM/GD) の紐付け** を L2-screen sub-doc 確定後に確定するか、L3 着手時に screen 章先行で確定するか | functional sub-doc §4 画面 trace + L2 接続規約 | ❓ PO 判断 (推奨: screen sub-doc §5 G1-trace マトリクスを継承、L3 で AC レベルに展開) |
| U-L3-8 | **PM/HM/GD カテゴリ別 FR-* 分類** を §2 で章分けするか、§2 統合表に カテゴリ列追加するか | functional sub-doc §2 構造 | ❓ PO 判断 (推奨: 統合表にカテゴリ列、章分けは可読性低下リスク) |

### 3.4 9 mode × FR 整合

| ID | ヒアリング項目 | 着地先 | status |
|----|--------------|--------|--------|
| U-L3-9 | **9 mode 統一合流原則 (business §3.3.1)** を L3 で「各 FR が対応 mode を宣言」する形で機械強制するか | functional sub-doc §2 各 FR-* に対応 mode 列 | ❓ PO 判断 (推奨: 対応 mode 列を追加、9 mode × FR の被覆を G3 lint で確認) |
| U-L3-10 | **drive 別挙動** (FR-L1-40 drive 別 state) を L3 で全 FR-* に drive タグ付けするか | functional sub-doc §2 各 FR-* に対応 drive 列 | ❓ PO 判断 (推奨: drive タグ default = all、固有 drive のみ明示) |

### 3.5 横断原則継承

| ID | ヒアリング項目 | 着地先 | status |
|----|--------------|--------|--------|
| U-L3-11 | **人間主導 + AI 補助原則 (CC2)** を L3 各 FR-* で「人間判断点」明示するか (screen §4.1 で carry 宣言済) | functional sub-doc §2 各 FR-* に「人間判断点」列 | ❓ PO 判断 (推奨: 必須化、CC2 carry 充足) |

## §4 工程表 (Step + 進捗)

### Step 1: L1 baton 整理
- 担当: pmo-sonnet (Sonnet)
- 内容: L1 functional / screen / business 3 sub-doc の現状を Read し、L3 で詳細化する FR-L1 41 件 + AC 候補を一覧化。L2-screen placeholder 状態の確認
- 進捗: 🔄 (本 commit で起票、本起票時に実施)

### Step 2: AC 構造設計 (U-L3-4〜6 確定)
- 担当: tl + pmo-tech-docs
- 内容: AC 形式 (Given-When-Then) / 下限 / ID 形式を確定し、テンプレート化
- 進捗: 🔄 (PO 判断待ち、本起票時)

### Step 3: P0 18 件 FR-* + AC-* 詳細化
- 担当: tl + se (Codex SE)
- 内容: P0 18 件 (FR-L1-01〜18 から HELIX 由来) を L3 FR-* + AC-* に詳細化。各 FR-* に対応画面・対応 mode・対応 drive・人間判断点を付与
- 進捗: ⬜ (本 PLAN 本起票 + Step 2 確定後)

### Step 4: P1 18 件 L3 vs L4 carry 判定
- 担当: tl
- 内容: P1 18 件 (FR-L1-19〜44 拡張機能等) を L3 詳細化 vs L4 carry vs Phase B carry に分類。U-L3-2 確定後
- 進捗: ⬜

### Step 5: 画面紐付き (L2 deep-link) 整合確認
- 担当: pmo-sonnet
- 内容: screen §5 G1-trace マトリクスと L3 FR-* の整合確認、L2-screen placeholder との接続点リスト化
- 進捗: ⬜

### Step 6: 機械検証 (G3 lint) 整備
- 担当: tl + aim
- 内容: `ut-tdd plan lint --gate G3` の R-trace ルール (FR-L1 → FR-L3 / FR-L3 → AC / AC → 受入テスト) を設計、機械検証可能化
- 進捗: ⬜ (L7 実装は Phase B、本 PLAN では設計のみ)

### Step 7: review (self / pmo-sonnet)
- 担当: pmo-sonnet
- 内容: 専門サブエージェント review 必須 (`.claude/CLAUDE.md` Guard Rules)。FR-L3 全件 AC 完備・対応画面 trace 整合・孤児 L1 FR 0 を確認
- 進捗: ⬜

## §5 実装計画

| 節 | 情報源 | 方法 |
|----|--------|------|
| §1 目的・背景 | L1 functional §1 + screen §1 | L1 baton を継承し L3 詳細化目的を宣言 |
| §2 FR-* + AC-* 一覧 (本体) | L1 FR-L1 41 件 + screen §5 trace | P0 18 件先行、P1 18 件は U-L3-2 に従い分類 |
| §3 carry 宣言 | P1/P2 の L4/Phase B carry | U-L3-2 / U-L3-3 確定に従う |
| §4 画面 trace (L2 deep-link) | screen §5 G1-trace + L2-screen | L1 から継承、L3 AC レベルに展開 |
| §5 9 mode × FR 整合 | business §3.3.1 + 各 FR | mode 統一合流原則を L3 で機械強制化 |
| §6 関連 doc | L1 5 sub-doc + L2-screen + L12 | reference 接続 |
| §7 carry / 次工程 (L4) | L4 基本設計 carry | L4 基本設計 PLAN への引き継ぎ |

## §6 DoD (Definition of Done)

- [ ] functional-requirements.md (L3) が必須 § 全件含む (§1〜§7)
- [ ] §2 FR-* + AC-* が L1 FR-L1 P0 18 件全件を被覆 (孤児 L1 FR = 0)
- [ ] 各 FR-* に対応画面 (PM/HM/GD-NN) / 対応 mode / 対応 drive / 人間判断点が記載
- [ ] 各 FR-* に AC-* が最低 3 件 (正常 / 異常 / 境界、U-L3-5 確定後)
- [ ] AC-* が Given-When-Then 形式 (U-L3-4 確定後)
- [ ] frontmatter 必須フィールド完備 (sub_doc / pair_artifact / related_l0 / related_br / related_l1_functional / related_l1_screen / next_pair_freeze=L12)
- [ ] G3-trace 機械検証通過 (FR-L1 → FR-L3 / FR-L3 → AC / AC → 受入テスト の R-trace 整合)
- [ ] L12 受入テスト設計で本 sub-doc 由来 AC が被覆 (孤児 AC = 0)
- [ ] 専門サブエージェント review (Step 7) 通過記録
- [ ] **PO サインオフ準備完了** (G3 readiness ready-for-G3-signoff)

## §7 carry / 次工程 (L4) への引き継ぎ

- **L4 基本設計 (PLAN-L4-01)**: L3 FR-* の実現方式・アーキテクチャ詳細は L4 ADR / L4 基本設計で確定。本 PLAN は機能要件レベルのみ
- **L4 データ設計 (PLAN-L4-04)**: business §10.2 L4 carry 表 7 行 (集約境界 / 値オブジェクト等) は L4 データ設計 sub-doc で確定 (PLAN-L3-01 出力の AC を入力)
- **PLAN-L3-02 連携**: BR-21 詳細化 + HM-08 連動 + FR-L1-36/38/43 (Phase B carry) は PLAN-L3-02 に委譲、本 PLAN ではスコープ外
- **PLAN-L3-03 連携**: NFR グレード値確定は PLAN-L3-03 に委譲、本 PLAN では FR 中心
- **L7 実装スプリント (PLAN-L7-NN)**: 本 PLAN 確定 AC は L7 TDD Red の入力。AC を Red テスト → Green 実装の機械契約に変換
- **G3 lint 実装**: `ut-tdd plan lint --gate G3` の R-trace ルールは L7 実装で確定 (本 PLAN は設計のみ)
