---
plan_id: PLAN-L1-01-business-requirements
title: "PLAN-L1-01: 業務要求 起票工程"
kind: design
layer: L1
sub_doc: business
drive: be
status: confirmed
created: 2026-05-27
updated: 2026-05-28
owner: PM (Opus) / PO (人間)
pair_artifact: docs/test-design/harness/L1-operational-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L3
agent_slots:
  - role: po
    slot_label: "PO — 業務要求の最終判断"
  - role: tl
    slot_label: "TL — 設計レビュー + adversarial check"
generates:
  - artifact_path: docs/design/harness/L1-requirements/business-requirements.md
    artifact_type: design_doc
dependencies:
  parent: null
  requires: []
  blocks:
    - PLAN-L1-02-functional-requirements
    - PLAN-L1-03-screen-requirements
    - PLAN-L1-04-technical-requirements
    - PLAN-L1-05-nfr
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

# PLAN-L1-01: 業務要求 起票工程

> **正本宣言**: 本 PLAN は **中間準備ドシエ** (ヒアリング項目・調査メモ・工程表)。
> **本 PLAN が産出する正本 doc**: `docs/design/harness/L1-requirements/business-requirements.md` (上記 frontmatter generates 参照)。
> **V-model pair**: L1 業務要求 sub-doc ↔ L14 運用テスト設計 1 doc。本 PLAN 完了時に G1 pair freeze の対象。

## §0 本 PLAN の役割

本 PLAN は `業務要求 (business)` sub-doc を V2 source snapshot reference の L1 sub-doc 構造を UT-TDD 正本へ再定義する形で起票する工程を管理する。中間準備 + 工程表 + 実装計画を内蔵し、進捗を追跡可能にする。

旧 PLAN-L1-01 (v1.1 形式、5 sub-doc 全件を単一 PLAN で扱っていた) からの分割移行 (requirements §1.10.G.5 (a))。business 以外の内容は PLAN-L1-02〜05 へ移管済。

## §1 入力 (上流からの baton)

- L0 企画書: `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- 翻案元 reference: V2 source snapshot requirements process doc
- v2 取り込み軌跡: `docs/migration/v2-import-ledger.md` §5 / §6
- 被覆監査結果 (2026-05-28): §3 レジストリに業務要求 (BR-01〜19 + NFR-11〜15 + UX-01〜03) を確定済

## §2 出力 (本 PLAN で確定)

- 正本 doc: `docs/design/harness/L1-requirements/business-requirements.md` (frontmatter generates)
- 量閉じ: 全 BR/NFR/UX 項目が L14 OT に被覆されていること (`docs/test-design/harness/L1-operational-test-design.md` §3)

## §3 ヒアリング項目 (business 専用)

**status 凡例**: ✅ = 正本着地済 / ➡️ = L3/L4 forward / ❓ = PO 判断待ち / 🆕 = draft 着地・G1 待ち

### 3.1 体系 (最優先 = 内容より先に「器」を定義)

| ID | ヒアリング項目 | 着地先 | status |
|----|--------------|--------|--------|
| U-体系-0 | 要求定義の体系: ①要求タイプ (業務/機能/技術/UX) ②構造・置き場 ③V-model L1/L3/L4/L10 対応 ④ID・trace 規約 ⑤methodology spec と project 要求の区別 ⑥product-improvement lens | business §1.4 として着地。V-model L0-L14 + 9-mode + 9 駆動 + PLAN 内蔵物 + 5 sub-doc + 4 artifact + 3 段階 freeze + DDD anti-corruption + IPA × ISO 25010 + Forward フロー + AI ガードの 11 項目宣言 (commit d2facad、2026-05-28) | ✅ |

### 3.2 価値・スコープ・業務要求

| ID | ヒアリング項目 | 着地先 | status |
|----|--------------|--------|--------|
| U-UX-1 | 核となる価値: process / safety / automation の優先順位 | §0 価値 / UX-01 | ✅ |
| U-業-1 | スコープ: 社内チーム / 当面 PO 単独 dogfood / 外部配布 | BR-02 / NFR-02 | ✅ |
| U-業-2 | 対象 repo: 全言語種別か | NFR-04 | ✅ |
| U-業-3 | 優先度 / MVP: P1-P4 のどれを最優先・MVP に | §0 価値 / NFR-07 | ✅ |
| U-業-4 | 成功の定義: 業務的成功状態 + 誰がいつ | §4 成功条件 | ✅ |
| U-業-5 | 利用者 / 役割: PO 単独か役割分離か | BR-02 (詳細→L3/L5) | ✅ |
| U-業-6 | plan 管理: PLAN 単位 + phase-aware で確定か | BR-05 | ✅ |
| U-UX-3 | 価値提案: 採用が進む決め手 | §0 価値 / UX-01 / §4 | ✅ |

### 3.3 GitHub / GHA 運用要件 (PO declared 2026-05-28)

| ID | 内容 | 着地先 | status |
|----|------|--------|--------|
| U-補-6 | 機能カタログ + doc/test/code 3 点セット整合 → GitHub Actions auto-merge (end-state CI 機構) | BR-13〜19 + NFR-11〜14 | ✅ (PO 承認済 2026-05-28。framework 確定: `docs/governance/audit-framework.md`。KPI D-01〜D-09 連動) |

#### 3.3a 9 mode 統一合流 + Add-feature 例外 (PO confirmed 2026-05-28)

| ID | 内容 | 着地先 | status |
|----|------|--------|--------|
| B3 | 9 mode (Forward/Reverse/Scrum/Incident/PoC/Add-feature/Hotfix/Compliance/Spike) を統一合流アーキテクチャで管理 | BR-10 / §3 業務フロー §3.3 | ✅ (PO 承認済 2026-05-28) |
| B3a | Add-feature は plan-freeze をスキップし直接 implement から開始する例外 mode | business-requirements.md §3.3 Add-feature 例外節 | ✅ (PO 承認済 2026-05-28) |

#### 3.3b KPI / 成功指標 (PO confirmed 2026-05-28)

| ID | KPI | 着地先 | status |
|----|-----|--------|--------|
| D-01 | gate pass rate ≥ 95% | business §4 成功条件 | ✅ |
| D-02 | drift 0 件/week | business §4 + NFR (drift) | ✅ |
| D-03 | onboarding ≤ 30 min | business §4 + NFR-16 | ✅ |
| D-04 | agent guard block rate (false positive ≤ 1%) | business §4 | ✅ |
| D-05 | CI auto-merge success rate ≥ 90% | business §4 + BR-16 | ✅ |
| D-06 | handover CURRENT.json stale 0 件 | business §4 + FR-L1-17 | ✅ |
| D-07 | Phase A local persistence p99 latency ≤ 200ms | NFR-15 / L4 carry | ✅ |
| D-08 | L1 sub-doc 5 件全件 G1 ready | 本 PLAN §6 G1 readiness | ✅ |
| D-09 | L14 OT 被覆率 100% (孤児 0) | business §2 量閉じ | ✅ |

#### 3.3c 権限分離 (PO confirmed 2026-05-28)

| ID | 内容 | 着地先 | status |
|----|------|--------|--------|
| S-01 | PO = スコープ・受入・最終承認の所有者 | business §4 ステークホルダー | ✅ |
| S-02 | PM (Opus) = 言語化・タスク分解・委譲指示・出力レビュー | business §4 | ✅ |
| S-03 | TL (Codex) = 設計判断・技術選択・PLAN レビュー | business §4 | ✅ |
| S-04 | agent guard = subagent 許可リスト強制 (fail-close) | BR-21 / `.claude/hooks/agent-guard.ts` | ✅ |
| S-05 | AI 実装 cross-agent review 前置 (self-review MUST) | BR-21 / `.claude/CLAUDE.md` Guard Rules | ✅ |

#### 3.3d BR-21 新設 (PO confirmed 2026-05-28)

| ID | 内容 | 着地先 | status |
|----|------|--------|--------|
| BR-21 | AI 利用ポリシー権限分離: PO/PM/TL/SE の責務境界 + agent guard による subagent 種別制限 + cross-agent self-review 前置 MUST | business-requirements.md §2 BR-21 | ✅ (PO 承認済 2026-05-28) |

### 3.4 ダッシュボード + 工程管理 DB (PO declared 2026-05-28)

| ID | 内容 | 着地先 | status |
|----|------|--------|--------|
| BR-20 carry | 工程管理 DB のローカル永続化 (Phase A) | BR-20 (PO declared) | ✅ (PO 承認済 2026-05-28) |
| NFR-15 carry | server-optional 動作保証 (Phase A) | NFR-15 (PO declared) | ✅ (PO 承認済 2026-05-28) |
| Phase B carry | BR-21 詳細化 + NFR-16 + ADR-002 (Phase B) | ➡️ L3 FR / L4 ADR | ➡️ L3 forward |

### 3.5 PO 承認済 (被覆監査 由来 → 2026-05-28 確定)

| ID | ヒアリング項目 | 着地先 | status |
|----|--------------|--------|--------|
| U-補-1 | エスカレーション機構を業務要求にするか | BR-10 (9 mode 統一合流: Incident/Add-feature 例外として吸収) | ✅ (PO 承認済 2026-05-28) |
| U-補-2 | AI 実装の cross-agent review 強制を業務要求にするか | BR-21 (AI 利用ポリシー権限分離) として新設。self-review 前置は `.claude/CLAUDE.md` Guard Rules で運用担保 | ✅ (PO 承認済 2026-05-28) |
| U-補-3 | rule parity (Claude/Codex 同一判定) を NFR にするか | NFR-09 (rule parity) として着地。L3 で実現方式確定 carry | ✅ (PO 承認済 2026-05-28) |
| U-補-4 | 失敗の GitHub corpus 化を要求にするか | BR-13 (feature カタログ) / BR-16 (7-Gate pipeline) の audit trail として吸収。L3 FR forward | ✅ (PO 承認済 2026-05-28) |
| U-補-5 | ADR-001 を NFR 明示するか (= U-技-5) | NFR-04 (言語非依存) + technical §1 に ADR-001 参照明示。NFR 独立明示は NFR-10 として新設不要 (ADR-001 参照で代替) | ✅ (PO 承認済 2026-05-28) |

### 3.6 PO 確認 architectural 整合課題 (GitHub/GHA framework 統合前)

- (A) `docs/` 構造 migration の timing (即時 / 段階 / 並走)
- (B) feature ID `F-NNN` と既存 BR-NN の関係
- (C) `.ut-tdd/audit/reports/` vs `.ut-tdd/` runtime state のパス名前空間

## §4 工程表 (Step + 進捗)

### Step 1: 既存資料整理
- 担当: tl + pmo-sonnet
- 内容: business-requirements.md の現状を読み直し、構造的不備・❓ 残存項目を洗い出す
- 進捗: ✅ (commit d9992f1、2026-05-28)

### Step 2: Web/TL 調査
- 担当: pmo-tech-docs
- 内容: business 固有の残差調査 (U-体系-0 自己宣言節 / U-補-1〜5 の外部 best practice) — pmo-tech-docs 委譲
- 進捗: ☐

### Step 3: 不明点の PO ヒアリング
- 担当: po
- 内容: §3.5 の ❓ 項目について残差のみ PO へ escalate + 拡張提案併記
- 進捗: ☐

### Step 4: business §1-§10 の起草・改訂
- 担当: tl
- 内容: 特に §10 DDD ドメイン entity 一覧 = L0 §10 用語集から table 生成。体系自己宣言節 (U-体系-0) を §1 に追加
- 進捗: ☐

### Step 5: 運用テスト設計の pair 凍結
- 担当: qa
- 内容: L14 OT に business sub-doc 由来要求 (BR-*/NFR-*/UX-*) が被覆されているか確認、不足あれば OT 追加
- 進捗: ☐

### Step 6: review (self / pmo-sonnet)
- 担当: pmo-sonnet
- 内容: 専門サブエージェント review 必須 (`.claude/CLAUDE.md` Guard Rules)。❓ 残ゼロ・FR 混入無し・§10.1 4 列 table 完備を確認
- 進捗: ✅ (acdc5ccd6f31ae951 通過、2026-05-28)

### Step 7: G1 PO サインオフ準備
- 担当: po
- 内容: 5 sub-doc 全件揃った段階で G1 ゲート PO 確認
- 進捗: 🔄 (本 commit で readiness 整備中、PO 最終確認待ち)

## §5 実装計画 (各記載項目をどう埋めるか)

| 節 | 情報源 | 方法 |
|----|--------|------|
| §1 目的・背景 (WHY/WHAT/WHO) | L0 concept §1.1/§1.3/§1.4 + 本 PLAN §3 確定回答 | 既存 business-requirements.md §1 を精緻化 |
| §2 対象業務一覧 | L0 concept §2 (9-mode ecosystem) + BR-01〜08 確定分 | 業務フロー 3 経路 (Forward/Reverse/Scrum) をリスト化 |
| §3 業務フロー (主線 + 9 mode + cross-cutting) | concept §2.5/§2.6 + v2-import-ledger | 主線 / 分岐 / 横断機構を sub-section で整理 |
| §4 ステークホルダー | concept §序 / CLAUDE.md ロール定義 | PO / PM / TL / SE / PE + AI エージェントスロット |
| §5 現状課題 → あるべき姿 | concept §1.1 P1-P4 + 本 PLAN の着地確認 | P1-P4 を業務課題として再記述、あるべき姿を成功条件に接続 |
| §6 業務スコープ外 | AP-6 (FR 不可) + この PLAN で扱わない sub-doc 列挙 | FR-L1 35 件は functional sub-doc へ。画面・技術・NFR も各 sub-doc へ |
| §7 L14 運用テスト pair 対応表 | L1-operational-test-design.md §3 | BR-* ⇔ OT-* 1:1 表を機械生成 |
| §8 関連 doc | 各 PLAN + governance + migration | path list |
| §9 carry / 上流 baton carry 一覧 | §3.4 Phase B carry / §3.5 ❓ 残差 | carry 先 (L3 PLAN / L4 ADR) を明示 |
| §10 業務 entity 一覧 (DDD) | L0 §10 用語集 + concept §10 | **§10.1**: L0 用語と 1:1 で 4 列 table 生成 (業務 entity / L0 用語 / 業務的意味 / 対応 .ut-tdd state / CLI / file)。**§10.2**: L4 carry 7 項目 (集約境界 / 値オブジェクト / entity ID 規約 / ライフサイクル / 不変条件 / 集約間整合性 / ut-tdd doctor check_business_entity_coverage)。**§10.3**: SSoT 参照 3 項目 (ユビキタス言語 / Bounded Context / 業界標準整合) |

## §6 DoD (Definition of Done)

- [x] §3 レジストリの全項目が ✅ / ➡️ のいずれかに収束 (❓ 残ゼロ) — U-補-1〜5 全件 PO 承認済 2026-05-28
- [ ] business-requirements.md が必須 § 全件含む (§1〜§10 + §1.1/1.2/1.3/3.1/3.2/3.3/10.1/10.2/10.3)
- [ ] frontmatter 必須フィールド完備 (sub_doc / pair_artifact / related_l0 / next_pair_freeze)
- [ ] 冒頭 blockquote 必須要素 (SSoT 参照 / 件数確定 / L3 接続規約) 存在
- [ ] §10.1 業務 entity 一覧 4 列 table 完備 (L0 用語 1:1 anti-corruption layer)
- [ ] §10.2 L4 carry 7 項目 列挙
- [ ] FR-* を含まない (AP-6 違反なし)
- [ ] L14 OT で本 sub-doc 由来要求が被覆 (孤児 0)
- [x] 専門サブエージェント review (Step 6) 通過記録 (2026-05-28 pmo-sonnet 再被覆監査 acdc5ccd6f31ae951 通過、CONDITIONAL PASS)
- [x] G1 readiness: status = ready-for-G1-signoff (PO サインオフ準備完了。§3 全件 ✅/➡️ 確定済)

## §7 carry / 次工程 (L3 / L4) への引き継ぎ

**確定済 (carry から除外)**:
- U-補-1〜5: 全件 PO 承認済 2026-05-28。BR-21 / NFR-09 / BR-13 / BR-16 / NFR-04 に着地。carry 終了
- BR-20 / NFR-15: PO declared 2026-05-28。business-requirements.md §2 に着地済。carry 終了
- KPI D-01〜D-09: PO confirmed 2026-05-28。business §4 成功条件に着地。carry 終了
- 権限分離 S-01〜S-05: PO confirmed 2026-05-28。BR-21 / business §4 に着地。carry 終了

**L3 forward carry (継続)**:
- **BR-21 詳細化 (L3)**: AI 利用ポリシー権限分離の AC (受入条件) 詳細化 → PLAN-L3-01 dependencies.requires に列挙
- **B3 PoC 期間上限 (L3 で再確認)**: PoC mode の最大期間上限値は L3 FR で AC として確定
- **§10.2 L4 carry**: 集約境界 / 値オブジェクト / entity ID 規約 / ライフサイクル / 不変条件 / 集約間整合性 / `ut-tdd doctor check_business_entity_coverage` 新設 → L4 データ設計 sub-doc で確定
- **Phase B**: NFR-16 + ADR-002 (2 層分離) → L3 NFR / L4 ADR forward。Phase B 開始時に ADR-002 を起票して整合解を確定
- **B9 entity 化判断 (L4 carry)**: §10 DDD entity の集約境界・不変条件の詳細設計 → L4 データ設計で確定
- **G1-trace 機械検証 R1 (PO 承認 2026-05-28、DD1=a、2026-06-02 BR-22 fullback 更新)**: 全 BR-01〜08 + UX-01〜03 + BR-21 + BR-22 (13 件) は screen §5.1/5.2 trace マトリクスで最低 1 画面に紐付き済 (孤児 BR/UX 0)。L3 起票時は本 sub-doc 全 BR/UX を継承し画面 trace を維持する
- **L3 PLAN 接続規約**: PLAN-L3-01-functional-requirements は本 sub-doc 全件を `dependencies.requires` に列挙する
