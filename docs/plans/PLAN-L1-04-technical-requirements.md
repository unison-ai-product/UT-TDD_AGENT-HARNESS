---
plan_id: PLAN-L1-04-technical-requirements
title: "PLAN-L1-04: 技術要求 起票工程"
kind: design
layer: L1
sub_doc: technical
drive: be
status: confirmed
created: 2026-05-28
updated: 2026-05-28
owner: PM (Opus) / PO (人間)
pair_artifact: docs/test-design/harness/L1-operational-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L4
agent_slots:
  - role: po
    slot_label: "PO — 業務要求の最終判断"
  - role: tl
    slot_label: "TL — 設計レビュー + adversarial check"
generates:
  - artifact_path: docs/design/harness/L1-requirements/technical-requirements.md
    artifact_type: design_doc
dependencies:
  parent: null
  requires:
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

# PLAN-L1-04: 技術要求 起票工程

> **正本宣言**: 本 PLAN は **中間準備ドシエ** (ヒアリング項目・調査メモ・工程表)。
> **本 PLAN が産出する正本 doc**: `docs/design/harness/L1-requirements/technical-requirements.md` (上記 frontmatter generates 参照)。
> **V-model pair**: L1 技術要求 sub-doc ↔ L14 運用テスト設計 1 doc。本 PLAN 完了時に G1 pair freeze の対象 (next_pair_freeze: L4 — technical/nfr は L4 基本設計で具体化)。

## §0 本 PLAN の役割

本 PLAN は `技術要求 (technical)` sub-doc を V2 source snapshot reference の設計概念 §1-§8 構造を参照して起票する工程を管理する。中間準備 + 工程表 + 実装計画を内蔵し、進捗を追跡可能にする。

技術要求 (TR-*) は業務要求 (BR-*) の制約・実現手段を技術視点で規定する。§4 state schema 二層構造 / §5 工程別 skill 注入 / §6 9 mode 共通基盤 / §7 drift 解消は UT-TDD 固有の高度技術要求であり、L4 carry で詳細設計する。

## §1 入力 (上流からの baton)

- L0 企画書: `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- 翻案元 reference: V2 source snapshot requirements process doc
- v2 取り込み軌跡: `docs/migration/v2-import-ledger.md` §5 (A-21)
- ADR-001: `docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md` (TypeScript + Bun 正本宣言)
- 上流 baton (business): `docs/design/harness/L1-requirements/business-requirements.md` (NFR-01〜15 / BR-20 / BR-16 7-Gate 等)
- B-1 起票済: `docs/design/harness/L1-requirements/technical-requirements.md` (§1〜§8 現状)

## §2 出力 (本 PLAN で確定)

- 正本 doc: `docs/design/harness/L1-requirements/technical-requirements.md` (frontmatter generates)
- 量閉じ: 技術要求 7 節 (§1〜§7) + 関連 doc (§8) が L14 OT に被覆されていること

## §3 ヒアリング項目 / 調査メモ (technical 固有)

**status 凡例**: ✅ = 正本着地済 / ➡️ = L4 carry / ❓ = PO 判断待ち / 🆕 = draft 着地・G1 待ち

### 3.1 ADR-001 TypeScript + Bun の正本宣言確認

| ID | ヒアリング項目 | 着地先 | status |
|----|--------------|--------|--------|
| U-技術-1 | ADR-001 (source snapshot は設計概念のみ参照 / TS 全面再実装) を L1 技術要求として独立明示するか (= U-技-5) | technical §1 に ADR-001 参照明示 + NFR-04 (言語非依存) と組み合わせて担保。NFR-10 独立明示は不要 | ✅ (PO 承認済 2026-05-28) |
| U-技術-1b | Bun runtime の version pinning 方針 (LTS相当 / latest follow) | technical §1 に「LTS 相当の安定版を使用、major version 変更は L4 ADR で管理」として確定 | ✅ (PO 承認済 2026-05-28) |

### 3.2 state schema 二層構造 (§4 L4 carry)

| ID | ヒアリング項目 | 着地先 | status |
|----|--------------|--------|--------|
| U-技術-2 | `.ut-tdd/` state schema 二層 = core tables + audit/event tables + derived views + 補助 state の詳細仕様 | technical §4 (要求レベル) + **L4 carry** (詳細) | ➡️ L4 carry |
| U-技術-2a | idempotency_key 契約 = `mode + plan_id + closure_event_id` の L1 要求への含有レベル | technical §4 (概要) + L4 carry (詳細) | ➡️ L4 carry |
| U-技術-2b | Phase A (ファイルベース) → Phase B (PGlite) の移行計画 (BR-20 対応) | technical §4 + L4 ADR-002 | ➡️ L4 ADR |
| U-技術-2c | conflict resolution policy (単一ユーザー Phase A は不要、マルチ Phase B で要設計) | technical §4 Phase B note + L4 ADR | ➡️ L4 ADR |

### 3.3 工程別 skill 注入機構 (§5 L4 carry)

| ID | ヒアリング項目 | 着地先 | status |
|----|--------------|--------|--------|
| U-技術-3 | `docs/skills/<L>-injection.yaml` 相当の 6 フィールド (owner_role / mandatory_agents / recommended_agents / recommended_skills / recommended_commands / orchestration_mode) の L1 要求レベル確定 | technical §5 (概要) + **L4 carry** (詳細 schema) | ➡️ L4 carry |
| U-技術-3a | orchestration_mode 5 値 (concept §2.6.4) との整合 | technical §5 + L4 carry | ➡️ L4 carry |

### 3.4 9 mode 共通基盤 + drive 別 state + AI provider 引継ぎ (§6)

| ID | ヒアリング項目 | 着地先 | status |
|----|--------------|--------|--------|
| U-技術-4 | R0-R4 + RGC を Reverse 専用でなく共通 closure language として再利用する要求を L1 で明示するか | technical §6 (概要) として明示確定 | ✅ (PO 承認済 2026-05-28) |
| U-技術-4a | Forward 接続 event の state 登録 + 補助 state への中間 state 保存 + discrepancy_log からの機械起動の L1 粒度 | technical §6 + L4 carry | ➡️ L4 carry |
| U-技術-4b | drive 別 state: be/fe/fullstack/data 各 drive に対応した `.ut-tdd/<drive>/` state ファイル分離を technical §4 に明示 | technical §4 Phase A 仕様 | ✅ (PO 承認済 2026-05-28。FR-L1-37 連動) |
| U-技術-4c | AI provider 引継ぎ: handover CURRENT.json は provider (Anthropic/OpenAI/Gemini) を跨いで引き継げる設計要求を technical §1 に明示 | technical §1 技術制約 | ✅ (PO 承認済 2026-05-28。FR-L1-39 連動) |
| U-技術-4d | reasoning model selection: タスク性質別 model 選択ガイダンス (設計判断=Opus / 実装=Sonnet / review=Haiku) を technical §5 skill 注入に含める | technical §5 (概要) | ✅ (PO 承認済 2026-05-28。FR-L1-40 連動) |
| U-技術-4e | 運用者ロール技術担保: agent guard subagent 許可リスト + bypass 条件 (UT_TDD_ALLOW_RAW_AGENT=1) を technical §1 に技術要求として明示 | technical §1 / BR-21 | ✅ (PO 承認済 2026-05-28。FR-L1-44 連動) |

#### 3.4a 9 mode 統一合流補強 (PO 承認済 2026-05-28)

| ID | 補強内容 | 着地先 | status |
|----|---------|--------|--------|
| U-技術-9mode | 9 mode (Forward/Reverse/Scrum/Incident/PoC/Add-feature/Hotfix/Compliance/Spike) 全件を同一 state schema / gate-checks.yaml で管理する技術要求を §6 に補強 | technical §6 | ✅ (PO 承認済 2026-05-28。FR-L1-41 連動) |
| U-技術-addfeat | Add-feature mode の plan-freeze スキップを state machine の例外遷移として §6 に明示 | technical §6 | ✅ (PO 承認済 2026-05-28。FR-L1-42 連動) |

### 3.5 drift 解消方針 (§7)

| ID | ヒアリング項目 | 着地先 | status |
|----|--------------|--------|--------|
| U-技術-5 | detector の週次以上起動 + inventory schema による工程双方向 mapping + 新規 asset 工程未割当不許容 + Reverse normalization 接続 + 運用目標「新規 drift 0 件 / week」の L1 要求明示 | technical §7 (概要) + L4 carry (detector 実装) | 🆕 (B-1 概要起票済) |

### 3.6 ダッシュボード Phase B 技術スタック (§2 外部連携 + IF 要望)

| ID | ヒアリング項目 | 着地先 | status |
|----|--------------|--------|--------|
| U-技術-6 | Phase B 技術スタック候補 (PGlite / ElectricSQL / PowerSync / Cloudflare Workers+D1 / fly.io+Postgres) を L1 要求に含めるか (L4 ADR で確定すべき内容) | technical §2 に Phase B 候補として参考記載 + **L4 ADR-002 forward** | ➡️ L4 ADR |

## §4 工程表 (Step + 進捗)

### Step 1: 既存資料整理
- 担当: tl + pmo-sonnet
- 内容: technical-requirements.md (B-1 起票済) の §1〜§8 現状を読み直し、L4 carry 未明示 / UT-TDD 翻案漏れを洗い出す
- 進捗: ✅ (commit d9992f1、2026-05-28)

### Step 2: ADR-001 正本宣言の §1 追記
- 担当: tl
- 内容: technical §1 に ADR-001 参照を明示。Bun version pinning 方針を TL 調査 + PO 確認で確定
- 進捗: ☐

### Step 3: §4〜§7 の L4 carry note 精緻化
- 担当: tl
- 内容: state schema 二層 / skill 注入 6 フィールド / 9 mode 共通基盤 / drift 解消の各 L4 carry note を「要求レベルの概要」と「L4 carry 内容」に分離して明示
- 進捗: ☐

### Step 4: §2 外部連携 に Phase B 技術スタック候補追記
- 担当: tl
- 内容: PGlite / ElectricSQL / ADR-002 forward を technical §2 に参考記載
- 進捗: ☐

### Step 5: 運用テスト設計の pair 凍結
- 担当: qa
- 内容: L14 OT に technical sub-doc 由来要求が被覆されているか確認、不足あれば OT 追加
- 進捗: ☐

### Step 6: review (self / pmo-sonnet)
- 担当: pmo-sonnet
- 内容: 専門サブエージェント review 必須 (`.claude/CLAUDE.md` Guard Rules)。§4〜§7 carry note の再現性・ADR-001 整合を確認
- 進捗: ✅ (acdc5ccd6f31ae951 通過、2026-05-28)

### Step 7: G1 PO サインオフ準備
- 担当: po
- 内容: 5 sub-doc 全件揃った段階で G1 ゲート PO 確認
- 進捗: 🔄 (本 commit で readiness 整備中、PO 最終確認待ち)

## §5 実装計画 (各記載項目をどう埋めるか)

| 節 | 情報源 | 方法 |
|----|--------|------|
| §1 採用技術・技術制約 | ADR-001 + CLAUDE.md + B-1 現状 | TypeScript (Bun) / cross-platform / AI runtime 4 mode / 言語非依存 / source reference snapshot + ADR-001 明示追加 |
| §2 外部連携 + IF 要望 | concept §8 + BR-20/NFR-15 (Phase A) + Phase B 候補 | Claude Code API / Codex API / GitHub API / Phase B DB 候補 (参考) |
| §3 既存システム制約 | CLAUDE.md + legacy local state 移行状況 + source reference snapshot | source reference snapshot の read-only 制約 / legacy local state は migration evidence のみ / Windows PowerShell 環境 |
| §4 state schema 二層構造 | concept §2.6.4 + v2-import-ledger §3 (R-1) + BR-20 | Phase A: ファイルベース `.ut-tdd/` (概要)。Phase B: PGlite 二層 (carry)。idempotency_key 概要記載 |
| §5 工程別 skill 注入機構 | concept §2.6.4 + v2-import-ledger §2 (F-1) | 6 フィールド schema の概要 (要求レベル) + L4 carry 宣言 |
| §6 9 mode 共通基盤 | concept §2.5 + v2-import-ledger §3 (R-2) | R0-R4 + RGC を Forward/Reverse 共通 closure language として概要記載 + L4 carry |
| §7 drift 解消方針 | concept §8.5 + FR-L1-18 (横断検出 ut-tdd doctor) | 週次以上 detector / inventory schema / 運用目標「drift 0 件/week」を要求として明示 |
| §8 関連 doc | ADR-001 + ADR-002 (将来) + business/nfr sub-doc + L4 PLAN 群 | path list + L4 PLAN が本 sub-doc 全件を dependencies.requires に列挙する接続規約 |

## §6 DoD (Definition of Done)

- [ ] technical-requirements.md が必須 § 全件含む (§1〜§8)
- [x] §1 に ADR-001 参照が明示されている (U-技術-1 PO 承認済 2026-05-28)
- [x] §1 に Bun version pinning 方針が明示されている (U-技術-1b PO 承認済 2026-05-28)
- [x] §1 に AI provider 引継ぎ要求が明示されている (U-技術-4c PO 承認済 2026-05-28)
- [x] §1 に運用者ロール技術担保要求が明示されている (U-技術-4e PO 承認済 2026-05-28)
- [x] §4 に drive 別 state 分離要求が明示されている (U-技術-4b PO 承認済 2026-05-28)
- [x] §5 に reasoning model selection ガイダンスが含まれている (U-技術-4d PO 承認済 2026-05-28)
- [x] §6 に 9 mode 統一合流 + Add-feature 例外補強が明示されている (PO 承認済 2026-05-28)
- [ ] §4〜§7 の L4 carry note が「要求レベルの概要」と「L4 carry 詳細一覧」に分離されている
- [ ] frontmatter 必須フィールド完備 (sub_doc / pair_artifact / related_l0 / related_br / next_pair_freeze=L4)
- [ ] 冒頭 blockquote 必須要素 (SSoT 参照 / 件数確定 / L3 接続規約) 存在
- [ ] L14 OT で本 sub-doc 由来要求が被覆 (孤児 0)
- [x] 専門サブエージェント review (Step 6) 通過記録 (2026-05-28 pmo-sonnet 再被覆監査 acdc5ccd6f31ae951 通過、CONDITIONAL PASS)
- [x] G1 readiness: status = ready-for-G1-signoff (PO サインオフ準備完了。§3 全件 ✅/➡️ 確定済)

## §7 carry / 次工程 (L4) への引き継ぎ

- **§2 ダッシュボード Phase B**: PGlite + ElectricSQL 候補は L3 FR / L4 ADR-002 forward。Phase B 開始時に ADR-002 (2 層分離: core 軽量 / dashboard server-optional) を起票して整合解を確定
- **§4 state schema 詳細**: idempotency_key 完全仕様 / rollback 手順 / conflict resolution policy / Phase A→B migration 計画 → L4 データ設計 sub-doc で確定
- **§5 skill 注入 6 フィールド完全 schema**: `docs/skills/<L>-injection.yaml` 形式 + orchestration_mode 5 値の正本 → L4 機能設計 sub-doc で確定
- **§6 9 mode 共通基盤詳細**: discrepancy_log 機械起動の trigger 定義 / 補助 state の物理配置 → L4 方式設計 sub-doc で確定
- **§7 drift detector 実装**: inventory schema の物理定義 / 週次以上起動の CI 接続 → L4 + L7 実装で確定
- **L4 PLAN 接続規約**: PLAN-L4-01〜05 (方式設計 / 機能設計 / 画面設計 / データ設計 / 外部 IF 設計) は本 sub-doc 全件を `dependencies.requires` に列挙する
