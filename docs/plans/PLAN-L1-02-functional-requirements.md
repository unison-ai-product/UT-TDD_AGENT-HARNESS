---
plan_id: PLAN-L1-02-functional-requirements
title: "PLAN-L1-02: 機能要求 起票工程"
kind: design
layer: L1
sub_doc: functional
drive: be
status: draft
created: 2026-05-28
updated: 2026-05-28
owner: PM (Opus) / PO (人間)
pair_artifact: docs/test-design/harness/L1-operational-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L3
agent_slots:
  - role: po
    slot_label: "PO — 業務要求の最終判断"
  - role: tl
    slot_label: "TL — 設計レビュー + adversarial check"
generates:
  - artifact_path: docs/design/harness/L1-requirements/functional-requirements.md
    artifact_type: design_doc
dependencies:
  parent: null
  requires:
    - PLAN-L1-01-business-requirements
  blocks:
    - PLAN-L3-01-functional-requirements
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-L1-02: 機能要求 起票工程

> **正本宣言**: 本 PLAN は **中間準備ドシエ** (ヒアリング項目・調査メモ・工程表)。
> **本 PLAN が産出する正本 doc**: `docs/design/harness/L1-requirements/functional-requirements.md` (上記 frontmatter generates 参照)。
> **W-model pair**: L1 機能要求 sub-doc ↔ L14 運用テスト設計 1 doc。本 PLAN 完了時に G1 pair freeze の対象。

## §0 本 PLAN の役割

本 PLAN は `機能要求 (functional)` sub-doc を v2 HELIX-workflows 正本 §1-§6 構造で起票する工程を管理する。中間準備 + 工程表 + 実装計画を内蔵し、進捗を追跡可能にする。

**注意**: L1 機能要求 (FR-L1-*) は「ユーザー視点で何の機能を望むか」= 要求。L3 機能要件 (FR-*) は「システムが満たすべき仕様 + AC」= 要件。本 PLAN が扱うのは前者のみ (AP-6 準拠)。

FR-L1-01〜35 全件は `docs/migration/v2-import-ledger.md §6` で確定済 (P0: 18 件 / P1: 12 件 / P2: 5 件)。本 PLAN の役割は転写確認・UT-TDD 文脈翻案・L3 接続規約の整備。

## §1 入力 (上流からの baton)

- L0 企画書: `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- v2 HELIX-workflows 正本: `vendor/helix-source/docs/v2/process/L01-requirements-and-operational-test-design.md`
- FR-L1 確定リスト: `docs/migration/v2-import-ledger.md §6` (FR-L1-01〜35、全 35 件)
- 上流 baton (business): `docs/design/harness/L1-requirements/business-requirements.md` (BR-01〜19 + NFR-11〜15)

## §2 出力 (本 PLAN で確定)

- 正本 doc: `docs/design/harness/L1-requirements/functional-requirements.md` (frontmatter generates)
- 量閉じ: FR-L1-01〜35 全件が L14 OT に被覆されていること

## §3 ヒアリング項目 / 調査メモ (functional 固有)

**status 凡例**: ✅ = 正本着地済 / ➡️ = L3 forward / ❓ = PO 判断待ち / 🆕 = draft 着地・G1 待ち

### 3.1 FR-L1 35 件の UT-TDD 文脈翻案 (P0 18 件優先)

| ID | 確認項目 | 翻案内容 | status |
|----|---------|---------|--------|
| FR-L1-01〜18 | P0 18 件の HELIX 固有実装名 → UT-TDD 置換 | `helix.db` → `.ut-tdd/db/`、`helix` コマンド → `ut-tdd` コマンド、`helix-process/` → `docs/` / `src/` 等 | ❓ (翻案要確認) |
| FR-L1-01 | V字モデル全工程 PLAN 起票・進捗管理 | UT-TDD では `ut-tdd plan draft/status/lint` で実装 | 🆕 |
| FR-L1-05 | 決定論的 static ゲート (fail-close) | `gate-checks.yaml` → `.ut-tdd/gate-checks.yaml`、証跡 → `.ut-tdd/phase.yaml` | 🆕 |
| FR-L1-06 | V モデル本線 state 一元管理 | `plan_registry` 等 6 種 → `.ut-tdd/` state ファイルベース (Phase A)、DB (Phase B) | 🆕 |
| FR-L1-07 | state 自動登録 (5 イベント hook) | `.claude/hooks/` → `.ut-tdd/` state 自動更新 | 🆕 |
| FR-L1-09 | AI エージェントガード | `agent-guard.ts` (実装済) + `ut-tdd doctor` で agent 監査 | ✅ (guard 実装済、doctor は L3 FR) |
| FR-L1-18 | 横断検出を ut-tdd doctor で一括集約 | `ut-tdd doctor` サブコマンド群 → `.ut-tdd/` 状態照合 | 🆕 |

### 3.2 §5 上流 baton 反映の整備

| ID | 確認項目 | status |
|----|---------|--------|
| A-19 (ledger) | L0 企画書バトン項目と FR-L1-* の対応表 + carry 先 | ❓ (functional §5 で整備要) |

### 3.3 L3 接続規約の明示

| ID | 確認項目 | status |
|----|---------|--------|
| P0 18 件の L3 FR-* mapping | FR-L1-01〜18 各々が L3 でどの FR-* に詳細化されるかの mapping 表 | ❓ (L3 PLAN 起票時に確定) |

## §4 工程表 (Step + 進捗)

| Step | 内容 | 担当 | 進捗 |
|------|------|------|------|
| Step 1: 既存資料整理 | functional-requirements.md (B-1 起票済) の現状を読み直し、翻案漏れ・HELIX 固有名残存を洗い出す | tl + pmo-sonnet | ✅ (B-1 転写完了、翻案確認は Step 2) |
| Step 2: UT-TDD 文脈翻案 | FR-L1-01〜35 の HELIX 固有実装名 → UT-TDD (.ut-tdd/ / ut-tdd コマンド / docs/ 等) に一括置換確認 | tl | ☐ |
| Step 3: §5 上流 baton 反映 整備 | L0 企画書バトン項目 × FR-L1-* 対応表を functional §5 に追加 | tl | ☐ |
| Step 4: L3 接続規約 明示 | FR-L1-01〜35 → L3 FR-* へのブリッジ方針を functional §6 に追記 | tl | ☐ |
| Step 5: 運用テスト設計の pair 凍結 | L14 OT に FR-L1-01〜35 全件が被覆されているか確認、不足あれば OT 追加 | qa | ☐ |
| Step 6: **review (self / pmo-sonnet)** | 専門サブエージェント review 必須 (`.claude/CLAUDE.md` Guard Rules)。翻案完了・L3 接続規約整備・FR-* 混入無しを確認 | pmo-sonnet | ☐ |
| Step 7: G1 PO サインオフ準備 | 5 sub-doc 全件揃った段階で G1 ゲート PO 確認 | po | ☐ |

## §5 実装計画 (各記載項目をどう埋めるか)

| 節 | 情報源 | 方法 |
|----|--------|------|
| §1 機能一覧 (FR-L1-01〜35) | `docs/migration/v2-import-ledger.md §6` | B-1 で転写済 (✅)。Step 2 で UT-TDD 翻案を上書き |
| §2 利用シナリオ | concept §2.5 9-mode + FR-L1-13〜16 (各 workflow) | 各 mode (Forward / Reverse / Scrum / Incident 等) を 1 シナリオとして整理 |
| §3 操作とデータの流れ | FR-L1-07 (state 自動登録) + FR-L1-06 (state 一元管理) | イベント → hook → state 更新の flow 図 (テキスト版) |
| §4 入出力 | FR-L1-01〜18 の input/output 列 | v2-import-ledger §6 の input/output 列を UT-TDD 翻案後に転写 |
| §5 上流 baton 反映 | concept §3.1.2.1 functional §5 規定 + L0 baton 項目リスト | バトン項目 × FR-L1-NN の対応表 (A-19 解消) |
| §6 関連 doc | 各 PLAN / governance / migration | PLAN-L3-01 接続規約 + v2-import-ledger + business-requirements の path list |

## §6 DoD (Definition of Done)

- [ ] functional-requirements.md が必須 § 全件含む (§1〜§6)
- [ ] §1 機能一覧が FR-L1-01〜35 全件を含む (35 件完備)
- [ ] P0 18 件の UT-TDD 文脈翻案完了 (HELIX 固有名残存ゼロ)
- [ ] §5 上流 baton 反映 (L0 バトン項目 × FR-L1-* 対応表) 存在
- [ ] frontmatter 必須フィールド完備 (sub_doc / pair_artifact / related_l0 / related_br / next_pair_freeze)
- [ ] 冒頭 blockquote 必須要素 (SSoT 参照 / 件数確定 / L3 接続規約) 存在
- [ ] L14 OT で本 sub-doc 由来要求が被覆 (孤児 0)
- [ ] FR-* (L3 要件) を含まない (AP-6 違反なし)
- [ ] 専門サブエージェント review (Step 6) 通過記録

## §7 carry / 次工程 (L3) への引き継ぎ

- **FR-L1 → L3 FR-* 詳細化**: FR-L1-01〜35 (L1 要求) → L3 FR-*/AC-* (L3 要件 + 受入条件) への詳細化。L3 PLAN (PLAN-L3-01-functional-requirements) が本 sub-doc 全件を `dependencies.requires` に列挙する接続規約
- **P0 18 件の優先実装順**: L3 FR-* 起票時に P0 → P1 → P2 の順で詳細化。FR-L1-01 (PLAN 管理) / FR-L1-05 (static ゲート) / FR-L1-09 (agent ガード、実装済) を先行
- **FR-L1-19〜35 (P1/P2)**: L3 で扱う優先度・順序は L3 PLAN 起票時に確定。現時点では carry として記録
- **上流 baton carry**: §5 整備の L0 baton 項目対応表 → L3 PLAN の §1 入力 (baton) として引き継ぎ
