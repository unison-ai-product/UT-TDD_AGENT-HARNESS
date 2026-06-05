---
plan_id: PLAN-L1-05-nfr
title: "PLAN-L1-05: 非機能要求 起票工程"
kind: design
layer: L1
sub_doc: nfr
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
  - artifact_path: docs/design/harness/L1-requirements/nfr.md
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

# PLAN-L1-05: 非機能要求 起票工程

> **正本宣言**: 本 PLAN は **中間準備ドシエ** (ヒアリング項目・調査メモ・工程表)。
> **本 PLAN が産出する正本 doc**: `docs/design/harness/L1-requirements/nfr.md` (上記 frontmatter generates 参照)。
> **V-model pair**: L1 非機能要求 sub-doc ↔ L14 運用テスト設計 1 doc。本 PLAN 完了時に G1 pair freeze の対象 (next_pair_freeze: L4 — NFR は L4 基本設計で実現方式確定)。

## §0 本 PLAN の役割

本 PLAN は `非機能要求 (nfr)` sub-doc を v2 HELIX-workflows 設計概念 §1-§8 構造を参照して起票する工程を管理する。中間準備 + 工程表 + 実装計画を内蔵し、進捗を追跡可能にする。

NFR は IPA 非機能要求グレード 2018 6 大項目 (可用性 / 性能・拡張性 / 運用・保守性 / 移行性 / セキュリティ / システム環境) に準拠し、§7 で IPA × ISO 25010 二軸タグ表として整理する。

B-1 で NFR-01〜08 を起票済。PO declared 2026-05-28 で NFR-11〜15 (GHA audit framework / server-optional) が追加。§7 IPA × ISO 25010 二軸表の精緻化と Phase B telemetry NFR (NFR-16 候補) 整理が本 PLAN の主作業。

## §1 入力 (上流からの baton)

- L0 企画書: `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- v2 HELIX-workflows 設計概念参照: `vendor/helix-source/docs/v2/process/L01-requirements-and-operational-test-design.md`
- v2 取り込み軌跡: `docs/migration/v2-import-ledger.md` §5 (A-20)
- 上流 baton (business): `docs/design/harness/L1-requirements/business-requirements.md` (NFR-11〜15 = GHA audit framework + server-optional の正本)
- B-1 起票済: `docs/design/harness/L1-requirements/nfr.md` (NFR-01〜08 現状)
- IPA 非機能要求グレード 2018 (6 大項目)
- ISO 25010:2023 品質特性

## §2 出力 (本 PLAN で確定)

- 正本 doc: `docs/design/harness/L1-requirements/nfr.md` (frontmatter generates)
- 量閉じ: NFR-01〜15 全件 (+ NFR-16 判断結果) が L14 OT に被覆されていること

## §3 ヒアリング項目 / 調査メモ (nfr 固有)

**status 凡例**: ✅ = 正本着地済 / ➡️ = L4 carry / ❓ = PO 判断待ち / 🆕 = draft 着地・G1 待ち

### 3.1 IPA × ISO 25010 二軸表の対象外特性除外理由確定

| ID | ヒアリング項目 | 着地先 | status |
|----|--------------|--------|--------|
| U-NFR-1 | ISO 25010 対象外特性: **機能適合性 (Functional Suitability)** の除外理由 — UT-TDD では機能要求は FR-L1-* / BR-* で扱い、NFR で再定義しない (二重記述回避) | §7 除外行に `除外理由: 機能要求 (FR-L1-*/BR-*) で扱うため NFR 重複禁止 (AP-6 類似)` | ✅ (PO 承認済み 2026-05-28、nfr §7 対象外特性表に明記) |
| U-NFR-2 | ISO 25010 対象外特性: **使用性 (Usability / Interaction Capability)** の除外理由 — UX-* で扱い、NFR での再定義は不要か | §7 除外行に除外理由を明示。UX-* が存在する場合は「UX-* sub-doc で扱うため」 | ✅ (PO 承認済み 2026-05-28、UX-* sub-doc で扱うため除外、nfr §7 注記済) |
| U-NFR-3 | IPA × ISO 25010 の全 NFR-ID タグ付け: NFR-01〜17 を IPA 大項目 + ISO 25010 特性の 2 軸にタグ付けする作業 | §7 二軸タグ表 | ✅ (PO 承認済み 2026-05-28、nfr §7 15 件完備 + NFR-17 追加) |

### 3.2 Phase B telemetry NFR carry

| ID | ヒアリング項目 | 着地先 | status |
|----|--------------|--------|--------|
| U-NFR-4 | **Phase B telemetry: default off (opt-in 3 レベル: off / local-only / sync)** — Phase B 開始時に確定 | nfr §6 carry note 記載済、L3 NFR forward | ➡️ L3 NFR forward (Phase B 開始時) |
| U-NFR-5 | **PII redaction** — telemetry で prompt 本文を除外する要求。OTel GenAI semconv `invoke_agent` span 除外 | nfr §6 carry note 記載済、L3/L4 carry | ➡️ L3/L4 NFR forward |
| U-NFR-6 | **telemetry 同意 default** (Anthropic opt-in / Copilot opt-out の選択) — privacy 方針 (D-1) | Phase B PO 残差。L1 blocking しない | ➡️ Phase B PO 確認 |

### 3.3 NFR-02 (更新性) の L4 ADR 連携

| ID | ヒアリング項目 | 着地先 | status |
|----|--------------|--------|--------|
| U-NFR-7 | NFR-02 更新性 (npm 配布 / repo template / 社内共有) の実現方式は L4 ADR で確定する旨を §3 carry 宣言に明示 | nfr §3 carry 宣言追記 | ✅ (PO 承認済み 2026-05-28、nfr §3 carry 宣言に明記済) |

### 3.4 既存 + 新規 NFR の確認・精緻化

| ID | 確認項目 | status |
|----|---------|--------|
| NFR-01〜06 | B-1 起票済。IPA 大項目への分類 + ISO 25010 タグ付け済 | ✅ (nfr §1〜§6 配置完了 + §7 タグ完備) |
| NFR-07〜08 | B-1 起票済 (NFR-07 MVP なし / NFR-08 implementation_status 必須) | ✅ (nfr §2/§3 配置完了 + §7 タグ完備) |
| NFR-09 | rule parity (U-補-3) — Claude/Codex 同一判定。U-補-3 PO 判断連動 | ➡️ (U-補-3 PO 判断連動、欠番のまま L3 carry) |
| NFR-11〜14 | PO declared 2026-05-28 (GHA audit framework + dev-local+CI + human-as-residue)。IPA 分類完了 | ✅ (nfr §3/§5 配置完了 + §7 タグ完備) |
| NFR-15 | PO declared 2026-05-28 (server-optional)。IPA 性能・拡張性配置完了 | ✅ (nfr §2 配置完了 + §7 タグ完備) |
| **NFR-16** | **新規 (2026-05-28、F1=b 採用)**: onboarding 互換性 (FR-L1-44 連動)、既存プロジェクトへの段階導入時 block 回避 | ✅ (nfr §1 可用性配置 + §6/§7 タグ完備、NFR-14 件確定) |
| NFR-13 注記強化 | **gate 通過率 ≥90% (KPI D-02、B5=b)** を運用目標、`.ut-tdd/gate_runs` で計測 | ✅ (nfr §3 NFR-13 注記追記済) |
| NFR-14 注記強化 | **gate fail-close 例外権 = PO のみ + audit 記録 (S-03/B6=b)**、bypass 件数 0 を KPI D-06 で計測 | ✅ (nfr §3 NFR-14 注記追記済) |
| NFR-15 注記強化 | **Claude ↔ Codex provider 間 handover (FR-L1-42、F5=a)** で多 provider 拡張は将来対応 (現状 Claude+Codex のみ) | ✅ (nfr §2 NFR-15 注記追記済) |
| agent guard bypass | **`UT_TDD_ALLOW_RAW_AGENT=1`: PO 明示承認 + audit ログ記録必須 (B6=b、F6=a)** | ✅ (nfr §5 セキュリティ表に追加済) |

## §4 工程表 (Step + 進捗)

> **Step 数差異の注記 (G1 readiness v8 / Minor 2 整理 2026-05-28)**: 本 PLAN は Step 1〜8 = 8 step 構成。他 4 PLAN (PLAN-L1-01〜04) は Step 7 完了で readiness 整備に集約合流するのに対し、本 PLAN は §0 で「§7 IPA × ISO 25010 二軸表の精緻化と Phase B telemetry NFR (NFR-16 候補) 整理」を主作業として宣言しているため、Step 8 = G1 PO サインオフ準備を明示 step として保持する (集約 commit で他 PLAN と合流するが、本 PLAN 単体での readiness 確定責務を残す)。業務影響なし。

### Step 1: 既存資料整理
- 担当: tl + pmo-sonnet
- 内容: nfr.md (B-1 起票済) の §1〜§8 現状を読み直し、NFR-11〜15 の IPA 配置・§7 タグ表の空欄を確認
- 進捗: ✅ (commit d9992f1、2026-05-28)

### Step 2: IPA × ISO 25010 二軸タグ付け
- 担当: tl + pmo-tech-docs
- 内容: NFR-01〜17 全件を IPA 6 大項目 + ISO 25010 特性の 2 軸でタグ付け。対象外特性の除外理由を明示 (U-NFR-1/2)
- 進捗: ✅ (nfr §7 14 行完備、commit cdd6598 / Step 1-D 2026-05-28)

### Step 3: NFR-11〜16 の IPA 節配置確定
- 担当: tl
- 内容: NFR-11 (役割分離) → §5 セキュリティ / NFR-12 (machine×AI) → §2 性能 / NFR-13 (dev-local+CI) → §3 保守性 / NFR-14 (human-as-residue) → §3 保守性 / NFR-15 (server-optional) → §2 拡張性 / NFR-16 (onboarding 互換性) → §1 可用性 等の配置を確定し nfr §1〜§6 に追記
- 進捗: ✅ (Step 1-D 2026-05-28、NFR-16 追加 + NFR-13/14/15 注記強化)

### Step 4: §7 IPA × ISO 25010 二軸タグ表 整備
- 担当: tl
- 内容: Step 2/3 の結果を §7 に 3 列 table (NFR-ID / IPA 大項目 / ISO 25010 特性) として整理。除外特性行も含む
- 進捗: ✅ (NFR-14 件確定、NFR-16 = 可用性 / Compatibility + Portability)

### Step 5: carry 宣言・Phase B NFR 整備
- 担当: tl
- 内容: §3 carry 宣言 (NFR-02 L4 ADR 連携 / Phase B telemetry carry) を §6 carry 節に明記
- 進捗: ✅ (nfr §3 carry 宣言 + §6 carry note 完備)

### Step 6: 運用テスト設計の pair 凍結
- 担当: qa
- 内容: L14 OT に NFR-01〜17 全件が被覆されているか確認、不足あれば OT 追加
- 進捗: ✅ (OT-29/30/31 で NFR-16/13/14 被覆、L14 OT 31 件確定、Step 2-D 2026-05-28)

### Step 7: review (self / pmo-sonnet)
- 担当: pmo-sonnet
- 内容: 専門サブエージェント review 必須 (`.claude/CLAUDE.md` Guard Rules)。§7 タグ表完備・Phase B carry 明示・孤児 NFR 0 を確認
- 進捗: ✅ (acdc5ccd6f31ae951 通過、2026-05-28)

### Step 8: G1 PO サインオフ準備
- 担当: po
- 内容: 5 sub-doc 全件揃った段階で G1 ゲート PO 確認
- 進捗: 🔄 (本 commit で readiness 整備中、PO 最終確認待ち)

## §5 実装計画 (各記載項目をどう埋めるか)

| 節 | IPA 大項目 | 情報源 | 方法 |
|----|-----------|--------|------|
| §1 可用性 | IPA: 継続性 / 耐障害性 | NFR-01 cross-platform / NFR-06 fail-close | B-1 現状確認 + NFR-11〜15 の配置整理後 |
| §2 性能・拡張性 | IPA: 性能効率性 / 移植性 | NFR-02 更新性 / NFR-15 server-optional / NFR-12 machine×AI | NFR-15 (server-optional) + NFR-12 (2 層) を §2 に追記 |
| §3 運用・保守性 | IPA: 保守性 / 信頼性 | NFR-07 MVP なし / NFR-08 implementation_status / NFR-13 dev-local+CI / NFR-14 human-as-residue | **carry 宣言**: 排泄系契約 (doc-reviewer 必須 / 4 artifact trace / NFR-08) は L3 以降 doc 規約 forward。NFR-13/14 を §3 に追記 |
| §4 移行性 | IPA: 移植性 | HELIX → UT-TDD 移行計画 / Phase A→B | 移行戦略 (`docs/migration/helix-to-ut-tdd-cutover-strategy.md`) 参照 + Phase B 拡張計画 carry |
| §5 セキュリティ | IPA: セキュリティ | NFR-06 fail-close (ガード側) / NFR-11 役割分離 / NFR-09 rule parity | NFR-11 (GHA 役割分離) を §5 に追記 |
| §6 システム環境 | IPA: 移植性 | NFR-01 cross-platform (Windows/macOS/Linux) / NFR-04 言語非依存 / NFR-05 GitHub 正本 | B-1 現状を IPA 観点で整理 |
| §7 IPA × ISO 25010 二軸タグ表 | — | Step 2/3 結果 | NFR-ID × IPA 大項目 × ISO 25010 特性 の 3 列 table (15 行 + 除外特性説明) |
| §8 関連 doc + carry | — | L4 PLAN 群 / audit-framework.md / Phase B carry | L4 PLAN が本 sub-doc 全件を `dependencies.requires` に列挙する接続規約 + NFR-02 L4 ADR carry + NFR-16 Phase B carry |

## §6 DoD (Definition of Done)

- [x] nfr.md が必須 § 全件含む (§1〜§8)
- [x] §7 IPA × ISO 25010 二軸タグ表が NFR-01〜17 全件を含む (3 列 table 15 件完備)
- [x] §7 に対象外特性 (機能適合性 / 使用性) の除外理由が明示されている
- [x] NFR-11〜16 (PO declared + 新規) が §1〜§6 の適切な IPA 節に配置されている
- [x] §3 carry 宣言に NFR-02 L4 ADR 連携 + 排泄系契約 L3 forward が明記されている
- [x] frontmatter 必須フィールド完備 (sub_doc / pair_artifact / related_l0 / related_br / next_pair_freeze=L4)
- [x] 冒頭 blockquote 必須要素 (SSoT 参照 / 件数確定 NFR-14 件 / L4 接続規約) 存在
- [x] L14 OT で本 sub-doc 由来要求が被覆 (孤児 0、OT-29/30/31 で NFR-16/13/14 被覆)
- [x] 専門サブエージェント review (Step 7) 通過記録 (2026-05-28 pmo-sonnet 再被覆監査 acdc5ccd6f31ae951 通過、CONDITIONAL → PASS)
- [x] **PO サインオフ準備完了** (G1 readiness ready-for-G1-signoff、2026-05-28 全 NFR PO 承認済み)

## §7 carry / 次工程 (L4) への引き継ぎ

- **NFR-02 (更新性) の L4 ADR 実現方式確定**: npm 配布 / repo template / 社内共有の配布形態を L4 ADR で設計。Phase B deployment (Cloudflare Workers / fly.io / docker-compose) と連動
- **NFR-16 Phase B telemetry**: telemetry default off (opt-in 3 レベル) + PII redaction + 同意 default (D-1) → Phase B 開始時に L3 NFR として確定。OTel GenAI semconv `invoke_agent` span 設計は L4/L5 carry
- **NFR-09 rule parity**: U-補-3 (Claude/Codex 同一判定) PO 判断結果に応じて NFR-09 確定 → L4 方式設計で実現方式確定
- **§3 carry: 排泄系契約**: doc-reviewer 必須召喚 / 4 artifact trace / NFR-08 implementation_status 列の全設計 doc 適用は L3 以降の doc 規約 forward carry (BR-08/A-2/F-5 下流)
- **L4 PLAN 接続規約**: PLAN-L4-01〜05 (方式設計 / 機能設計 / 画面設計 / データ設計 / 外部 IF 設計) は本 sub-doc 全件を `dependencies.requires` に列挙する
- **L3 NFR sub-doc 接続規約**: PLAN-L3-xx-nfr-grade (L3 非機能要件、IPA グレード値確定) は本 sub-doc 全件を `dependencies.requires` に列挙する
