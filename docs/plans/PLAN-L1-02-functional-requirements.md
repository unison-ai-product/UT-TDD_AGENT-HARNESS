---
plan_id: PLAN-L1-02-functional-requirements
title: "PLAN-L1-02: 機能要求 起票工程"
kind: design
layer: L1
sub_doc: functional
drive: be
status: confirmed
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
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-04"
    tests_green_at: "2026-06-04"
    verdict: approve
    scope: "A-100 L0-L3 refreeze sign-off (pmo-sonnet + PO、claude-only intra_runtime_subagent)"
---

# PLAN-L1-02: 機能要求 起票工程

> **正本宣言**: 本 PLAN は **中間準備ドシエ** (ヒアリング項目・調査メモ・工程表)。
> **本 PLAN が産出する正本 doc**: `docs/design/harness/L1-requirements/functional-requirements.md` (上記 frontmatter generates 参照)。
> **V-model pair**: L1 機能要求 sub-doc ↔ L14 運用テスト設計 1 doc。本 PLAN 完了時に G1 pair freeze の対象。

## §0 本 PLAN の役割

本 PLAN は `機能要求 (functional)` sub-doc を v2 HELIX-workflows 設計概念 §1-§6 構造を参照して起票する工程を管理する。中間準備 + 工程表 + 実装計画を内蔵し、進捗を追跡可能にする。

**注意**: L1 機能要求 (FR-L1-*) は「ユーザー視点で何の機能を望むか」= 要求。L3 機能要件 (FR-*) は「システムが満たすべき仕様 + AC」= 要件。本 PLAN が扱うのは前者のみ (AP-6 準拠)。

FR-L1-01〜35 全件は `docs/migration/v2-import-ledger.md §6` で確定済 (P0: 18 件 / P1: 12 件 / P2: 5 件)。その後の追加・back-propagation により FR-L1-37/39/40/41/42/44/45/46/47/48/49 を含む **FR-L1 計 46 件確定 (P0:19 / P1:22 / P2:5)**。本 PLAN の役割は転写確認・UT-TDD 文脈翻案・L3 接続規約の整備。

## §1 入力 (上流からの baton)

- L0 企画書: `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- v2 HELIX-workflows 設計概念参照: `vendor/helix-source/docs/v2/process/L01-requirements-and-operational-test-design.md`
- FR-L1 確定リスト: `docs/migration/v2-import-ledger.md §6` (FR-L1-01〜35、全 35 件)
- 上流 baton (business): `docs/design/harness/L1-requirements/business-requirements.md` (BR-01〜19 + NFR-11〜15)

## §2 出力 (本 PLAN で確定)

- 正本 doc: `docs/design/harness/L1-requirements/functional-requirements.md` (frontmatter generates)
- 量閉じ: FR-L1 現行 47 件が L14 OT に被覆されていること (追加・back-propagation 分を含む = 47 件確定)

## §3 ヒアリング項目 / 調査メモ (functional 固有)

**status 凡例**: ✅ = 正本着地済 / ➡️ = L3 forward / ❓ = PO 判断待ち / 🆕 = draft 着地・G1 待ち

### 3.1 FR-L1 現行 47 件の UT-TDD 文脈翻案 (P0 19 件優先)

| ID | 確認項目 | 翻案内容 | status |
|----|---------|---------|--------|
| FR-L1-01〜18 | P0 18 件の HELIX 固有実装名 → UT-TDD 置換 | `helix.db` → `.ut-tdd/db/`、`helix` コマンド → `ut-tdd` コマンド、`helix-process/` → `docs/` / `src/` 等 | ✅ (PO 承認済 2026-05-28。翻案方針確定) |
| FR-L1-01 | V字モデル全工程 PLAN 起票・進捗管理 | UT-TDD では `ut-tdd plan draft/status/lint` で実装 | ✅ |
| FR-L1-05 | 決定論的 static ゲート (fail-close) | `gate-checks.yaml` → `.ut-tdd/gate-checks.yaml`、証跡 → `.ut-tdd/phase.yaml` | ✅ |
| FR-L1-06 | V モデル本線 state 一元管理 | `plan_registry` 等 6 種 → `.ut-tdd/` state ファイルベース (Phase A)、DB (Phase B) | ✅ |
| FR-L1-07 | state 自動登録 (5 イベント hook) | `.claude/hooks/` → `.ut-tdd/` state 自動更新 | ✅ |
| FR-L1-09 | AI エージェントガード | `agent-guard.ts` (実装済) + `ut-tdd doctor` で agent 監査 | ✅ (guard 実装済、doctor は L3 FR) |
| FR-L1-18 | 横断検出を ut-tdd doctor で一括集約 | `ut-tdd doctor` サブコマンド群 → `.ut-tdd/` 状態照合 | ✅ |

#### 3.1a 新規 FR-L1-37/39/40/41/42/44 (PO 承認済 2026-05-28)

| ID | 内容 | 着地先 | status |
|----|------|--------|--------|
| FR-L1-37 | drive 別 state 管理: be/fe/fullstack/data 各 drive で state ファイルを分離管理する | functional §1 | ✅ (PO 承認済 2026-05-28) |
| FR-L1-39 | AI provider 引継ぎ: Anthropic / OpenAI / Gemini 等の provider 変更時に handover CURRENT.json を継続して引き継げる | functional §1 | ✅ (PO 承認済 2026-05-28) |
| FR-L1-40 | reasoning model selection: タスク性質 (設計判断 / 実装 / review) に応じた model 選択ガイダンスを提供する | functional §1 | ✅ (PO 承認済 2026-05-28) |
| FR-L1-41 | 9 mode 統一合流: 全 9 mode (Forward/Reverse/Scrum/Incident/PoC/Add-feature/Hotfix/Compliance/Spike) を同一 PLAN/gate 機構で管理する | functional §1 / BR-10 | ✅ (PO 承認済 2026-05-28) |
| FR-L1-42 | Add-feature 例外: Add-feature mode は plan-freeze をスキップし implement phase から開始できる | functional §1 / BR-10 | ✅ (PO 承認済 2026-05-28) |
| FR-L1-44 | 運用者ロール管理: PO/PM/TL/SE/PE の責務境界を runtime が validate する (BR-21 対応) | functional §1 / BR-21 | ✅ (PO 承認済 2026-05-28) |

#### 3.1b 既存 FR-L1 拡張 7 件 (PO 承認済 2026-05-28)

| ID | 拡張内容 | status |
|----|---------|--------|
| FR-L1-06 拡張 | drive 別 state ファイル分離を Phase A 仕様に明示 (FR-L1-37 連動) | ✅ |
| FR-L1-08 拡張 | Add-feature 例外 mode を mode 一覧に追加 (FR-L1-42 連動) | ✅ |
| FR-L1-09 拡張 | agent guard bypass 条件 (UT_TDD_ALLOW_RAW_AGENT=1) の明示 | ✅ |
| FR-L1-13 拡張 | AI provider 引継ぎシナリオを Forward workflow に追加 (FR-L1-39 連動) | ✅ |
| FR-L1-16 拡張 | reasoning model selection ガイダンスを Scrum workflow に追加 (FR-L1-40 連動) | ✅ |
| FR-L1-17 拡張 | handover CURRENT.json が provider 変更時も引継ぎ可能なことを明示 | ✅ |
| FR-L1-20 拡張 | 運用者ロール表示を dashboard SCR-01 の表示要件に追加 (FR-L1-44 / BR-21 連動) | ✅ |

### 3.2 §5 上流 baton 反映の整備

| ID | 確認項目 | status |
|----|---------|--------|
| A-19 (ledger) | L0 企画書バトン項目と FR-L1-* の対応表 + carry 先 | ✅ (PO 承認済 2026-05-28。方針確定: functional §5 で FR-L1-37/39/40/41/42/44/45/46/47/48/49 を含む 46 件対応表として整備) |

#### 3.2a §2 利用シナリオ 6-8 追加 (PO 承認済 2026-05-28)

| ID | シナリオ | 着地先 | status |
|----|---------|--------|--------|
| シナリオ-6 | Add-feature mode: plan-freeze スキップ → implement → review (FR-L1-41/42) | functional §2 | ✅ (PO 承認済 2026-05-28) |
| シナリオ-7 | AI provider 切替: handover 引継ぎ → provider 変更 → 継続実行 (FR-L1-39) | functional §2 | ✅ (PO 承認済 2026-05-28) |
| シナリオ-8 | 運用者ロール変更: PO が PM → TL 委譲 → agent guard が validate (FR-L1-44 / BR-21) | functional §2 | ✅ (PO 承認済 2026-05-28) |

### 3.3 L3 接続規約の明示

| ID | 確認項目 | status |
|----|---------|--------|
| P0 18 件の L3 FR-* mapping | FR-L1-01〜18 各々が L3 でどの FR-* に詳細化されるかの mapping 表 | ✅ (PO 承認済 2026-05-28。L3 PLAN 起票時に PLAN-L3-01 dependencies.requires で現行 47 件を列挙する接続規約確定) |

## §4 工程表 (Step + 進捗)

### Step 1: 既存資料整理
- 担当: tl + pmo-sonnet
- 内容: functional-requirements.md (B-1 起票済) の現状を読み直し、翻案漏れ・HELIX 固有名残存を洗い出す
- 進捗: ✅ (commit d9992f1、2026-05-28)

### Step 2: UT-TDD 文脈翻案
- 担当: tl
- 内容: FR-L1-01〜35 の HELIX 固有実装名 → UT-TDD (.ut-tdd/ / ut-tdd コマンド / docs/ 等) に一括置換確認
- 進捗: ☐

### Step 3: §5 上流 baton 反映 整備
- 担当: tl
- 内容: L0 企画書バトン項目 × FR-L1-* 対応表を functional §5 に追加
- 進捗: ☐

### Step 4: L3 接続規約 明示
- 担当: tl
- 内容: FR-L1-01〜35 → L3 FR-* へのブリッジ方針を functional §6 に追記
- 進捗: ☐

### Step 5: 運用テスト設計の pair 凍結
- 担当: qa
- 内容: L14 OT に FR-L1-01〜35 全件が被覆されているか確認、不足あれば OT 追加
- 進捗: ☐

### Step 6: review (self / pmo-sonnet)
- 担当: pmo-sonnet
- 内容: 専門サブエージェント review 必須 (`.claude/CLAUDE.md` Guard Rules)。翻案完了・L3 接続規約整備・FR-* 混入無しを確認
- 進捗: ✅ (acdc5ccd6f31ae951 通過、2026-05-28)

### Step 7: G1 PO サインオフ準備
- 担当: po
- 内容: 5 sub-doc 全件揃った段階で G1 ゲート PO 確認
- 進捗: 🔄 (本 commit で readiness 整備中、PO 最終確認待ち)

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
- [x] §1 機能一覧が FR-L1 現行 47 件を含む (追加・back-propagation 分を含む。FR-L1-50 は PO directed 2026-06-09)
- [x] P0 18 件の UT-TDD 文脈翻案完了 (HELIX 固有名残存ゼロ。PO 承認済 2026-05-28)
- [ ] §5 上流 baton 反映 (L0 バトン項目 × FR-L1-* 対応表、46 件版) 存在
- [ ] frontmatter 必須フィールド完備 (sub_doc / pair_artifact / related_l0 / related_br / next_pair_freeze)
- [ ] 冒頭 blockquote 必須要素 (SSoT 参照 / 件数確定 46 件 / L3 接続規約) 存在
- [ ] L14 OT で本 sub-doc 由来要求が被覆 (孤児 0)
- [ ] FR-* (L3 要件) を含まない (AP-6 違反なし)
- [x] 専門サブエージェント review (Step 6) 通過記録 (2026-05-28 pmo-sonnet 再被覆監査 acdc5ccd6f31ae951 通過、CONDITIONAL PASS)
- [x] G1 readiness: status = ready-for-G1-signoff (PO サインオフ準備完了。§3 全件 ✅/➡️ 確定済、FR-L1 47 件確定)

## §7 carry / 次工程 (L3) への引き継ぎ

**確定済 (carry から除外)**:
- FR-L1-01〜18 UT-TDD 翻案方針: PO 承認済 2026-05-28。carry 終了
- FR-L1-37/39/40/41/42/44 新規 6 件: PO 承認済 2026-05-28。carry 終了
- 既存拡張 7 件: PO 承認済 2026-05-28。carry 終了
- §2 シナリオ 6-8: PO 承認済 2026-05-28。carry 終了
- A-19 baton 対応表方針: PO 承認済 2026-05-28。carry 終了
- L3 接続規約方針: PO 承認済 2026-05-28。carry 終了

**L3 forward carry (継続)**:
- **FR-L1-36 L3 carry**: FR-L1-36 の AC 詳細化 → PLAN-L3-01 で確定
- **FR-L1-38 L3 carry**: FR-L1-38 の AC 詳細化 → PLAN-L3-01 で確定
- **FR-L1-43 L3 carry**: FR-L1-43 の AC 詳細化 → PLAN-L3-01 で確定
- **既存拡張 AC 詳細化 (L3)**: FR-L1-06/08/09/13/16/17/20 拡張分の受入条件は L3 FR-* 起票時に詳細化
- **FR-L1 → L3 FR-* 詳細化**: FR-L1 現行 47 件 (L1 要求) → L3 FR-*/AC-* (L3 要件 + 受入条件) への詳細化。PLAN-L3-01 が現行 47 件を `dependencies.requires` に列挙する
- **P0 19 件の優先実装順**: L3 FR-* 起票時に P0 → P1 → P2 の順で詳細化。FR-L1-01 / FR-L1-05 / FR-L1-09 を先行。内訳は HELIX 由来 FR-L1-01〜18 + L3 back-propagation 由来 FR-L1-45
- **上流 baton carry**: §5 整備の L0 baton 項目対応表 (46 件版) → L3 PLAN §1 入力として引き継ぎ
- **G1-trace 機械検証 R3 (PO 承認 2026-05-28、DD2=a、2026-06-02 BR-22 fullback 更新、2026-06-09 FR-L1-50 追加)**: FR-L1 P0 19 件は §1 表「対応画面」列で screen 15 画面に紐付き済 (孤児 P0 0)。P1 23 件 / P2 5 件は warn 程度で紐付け推奨 (孤児許容)。L3 起票時は現行 47 件の画面 trace を継承し維持する
