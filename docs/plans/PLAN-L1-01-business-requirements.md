---
plan_id: PLAN-L1-01-business-requirements
title: "PLAN-L1-01: 業務要求 起票工程"
kind: design
layer: L1
sub_doc: business
drive: be
status: draft
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
---

# PLAN-L1-01: 業務要求 起票工程

> **正本宣言**: 本 PLAN は **中間準備ドシエ** (ヒアリング項目・調査メモ・工程表)。
> **本 PLAN が産出する正本 doc**: `docs/design/harness/L1-requirements/business-requirements.md` (上記 frontmatter generates 参照)。
> **W-model pair**: L1 業務要求 sub-doc ↔ L14 運用テスト設計 1 doc。本 PLAN 完了時に G1 pair freeze の対象。

## §0 本 PLAN の役割

本 PLAN は `業務要求 (business)` sub-doc を v2 HELIX-workflows 正本 §1-§10 構造で起票する工程を管理する。中間準備 + 工程表 + 実装計画を内蔵し、進捗を追跡可能にする。

旧 PLAN-L1-01 (v1.1 形式、5 sub-doc 全件を単一 PLAN で扱っていた) からの分割移行 (requirements §1.10.G.5 (a))。business 以外の内容は PLAN-L1-02〜05 へ移管済。

## §1 入力 (上流からの baton)

- L0 企画書: `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- v2 HELIX-workflows 正本: `vendor/helix-source/docs/v2/process/L01-requirements-and-operational-test-design.md`
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
| U-体系-0 | 要求定義の体系: ①要求タイプ (業務/機能/技術/UX) ②構造・置き場 ③W-model L1/L3/L4/L10 対応 ④ID・trace 規約 ⑤methodology spec と project 要求の区別 ⑥product-improvement lens | business §1 内に**自己宣言節**として追加 | ❓ (GAP G-01、未着地) |

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
| U-補-6 | 機能カタログ + doc/test/code 3 点セット整合 → GitHub Actions auto-merge (end-state CI 機構) | BR-13〜19 + NFR-11〜14 | 🆕 framework 確定 (`docs/governance/audit-framework.md`) |

### 3.4 ダッシュボード + 工程管理 DB (PO declared 2026-05-28)

| ID | 内容 | 着地先 | status |
|----|------|--------|--------|
| BR-20 carry | 工程管理 DB のローカル永続化 (Phase A) | BR-20 (🆕 PO declared) | 🆕 G1 待ち |
| NFR-15 carry | server-optional 動作保証 (Phase A) | NFR-15 (🆕 PO declared) | 🆕 G1 待ち |
| Phase B carry | BR-21/22 + NFR-16 + ADR-002 (Phase B) | ➡️ L3 FR / L4 ADR | ➡️ |

### 3.5 PO 判断待ち (被覆監査 由来)

| ID | ヒアリング項目 | 着地先候補 | status |
|----|--------------|-----------|--------|
| U-補-1 | エスカレーション機構を業務要求にするか | BR or L3 forward | ❓ |
| U-補-2 | AI 実装の cross-agent review 強制を業務要求にするか | BR or L3 forward | ❓ |
| U-補-3 | rule parity (Claude/Codex 同一判定) を NFR にするか | NFR or L3 forward | ❓ |
| U-補-4 | 失敗の GitHub corpus 化を要求にするか | BR/NFR or L3 forward | ❓ |
| U-補-5 | ADR-001 を NFR 明示するか (= U-技-5) | NFR (ほぼ確定) | ❓ |

### 3.6 PO 確認 architectural 整合課題 (GitHub/GHA framework 統合前)

- (A) `docs/` 構造 migration の timing (即時 / 段階 / 並走)
- (B) feature ID `F-NNN` と既存 BR-NN の関係
- (C) `.helix/reports/` vs `.ut-tdd/` のパス名前空間

## §4 工程表 (Step + 進捗)

| Step | 内容 | 担当 | 進捗 |
|------|------|------|------|
| Step 1: 既存資料整理 | business-requirements.md の現状を読み直し、構造的不備・❓ 残存項目を洗い出す | tl + pmo-sonnet | ✅ |
| Step 2: Web/TL 調査 | business 固有の残差調査 (U-体系-0 自己宣言節 / U-補-1〜5 の外部 best practice) — pmo-tech-docs 委譲 | pmo-tech-docs | ☐ |
| Step 3: 不明点の PO ヒアリング | §3.5 の ❓ 項目について残差のみ PO へ escalate + 拡張提案併記 | po | ☐ |
| Step 4: business §1-§10 の起草・改訂 | 特に §10 DDD ドメイン entity 一覧 = L0 §10 用語集から table 生成。体系自己宣言節 (U-体系-0) を §1 に追加 | tl | ☐ |
| Step 5: 運用テスト設計の pair 凍結 | L14 OT に business sub-doc 由来要求 (BR-*/NFR-*/UX-*) が被覆されているか確認、不足あれば OT 追加 | qa | ☐ |
| Step 6: **review (self / pmo-sonnet)** | 専門サブエージェント review 必須 (`.claude/CLAUDE.md` Guard Rules)。❓ 残ゼロ・FR 混入無し・§10.1 4 列 table 完備を確認 | pmo-sonnet | ☐ |
| Step 7: G1 PO サインオフ準備 | 5 sub-doc 全件揃った段階で G1 ゲート PO 確認 | po | ☐ |

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

- [ ] §3 レジストリの全項目が ✅ / ➡️ のいずれかに収束 (❓ 残ゼロ)
- [ ] business-requirements.md が必須 § 全件含む (§1〜§10 + §1.1/1.2/1.3/3.1/3.2/3.3/10.1/10.2/10.3)
- [ ] frontmatter 必須フィールド完備 (sub_doc / pair_artifact / related_l0 / next_pair_freeze)
- [ ] 冒頭 blockquote 必須要素 (SSoT 参照 / 件数確定 / L3 接続規約) 存在
- [ ] §10.1 業務 entity 一覧 4 列 table 完備 (L0 用語 1:1 anti-corruption layer)
- [ ] §10.2 L4 carry 7 項目 列挙
- [ ] FR-* を含まない (AP-6 違反なし)
- [ ] L14 OT で本 sub-doc 由来要求が被覆 (孤児 0)
- [ ] 専門サブエージェント review (Step 6) 通過記録

## §7 carry / 次工程 (L3 / L4) への引き継ぎ

- **§10.2 L4 carry**: 集約境界 / 値オブジェクト / entity ID 規約 / ライフサイクル / 不変条件 / 集約間整合性 / `ut-tdd doctor check_business_entity_coverage` 新設 — L4 データ設計 sub-doc で確定
- **U-補-1〜5 残差**: Step 3 PO ヒアリング結果に応じて BR/NFR or L3 FR forward — L3 PLAN 起票時に dependencies.requires に列挙
- **Phase B**: BR-21/22 候補 + NFR-16 + ADR-002 (2 層分離) — L3 FR / L4 ADR forward。Phase B 開始時に ADR-002 を起票して整合解を確定
- **GitHub/GHA architectural 整合課題 (A)(B)(C)**: L1 統合前に PO 確認。(A) docs/ 構造 migration timing / (B) F-NNN と BR-NN の関係 / (C) .helix/reports/ vs .ut-tdd/ パス名前空間
- **L3 PLAN 接続規約**: PLAN-L3-01-functional-requirements は本 sub-doc 全件を `dependencies.requires` に列挙する
