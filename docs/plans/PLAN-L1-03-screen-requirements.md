---
plan_id: PLAN-L1-03-screen-requirements
title: "PLAN-L1-03: 画面要求 起票工程"
kind: design
layer: L1
sub_doc: screen
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
  - artifact_path: docs/design/harness/L1-requirements/screen-requirements.md
    artifact_type: design_doc
dependencies:
  parent: null
  requires:
    - PLAN-L1-01-business-requirements
    - PLAN-L1-02-functional-requirements
  blocks: []
v2_import: docs/migration/v2-import-ledger.md
---

# PLAN-L1-03: 画面要求 起票工程

> **正本宣言**: 本 PLAN は **中間準備ドシエ** (ヒアリング項目・調査メモ・工程表)。
> **本 PLAN が産出する正本 doc**: `docs/design/harness/L1-requirements/screen-requirements.md` (上記 frontmatter generates 参照)。
> **W-model pair**: L1 画面要求 sub-doc ↔ L14 運用テスト設計 1 doc。本 PLAN 完了時に G1 pair freeze の対象。

## §0 本 PLAN の役割

本 PLAN は `画面要求 (screen)` sub-doc を v2 HELIX-workflows 正本 §1-§4 構造で起票する工程を管理する。中間準備 + 工程表 + 実装計画を内蔵し、進捗を追跡可能にする。

**注意**: L1 画面要求は「業務要求視点の必要画面列挙」のみ。UI の具体化 (レイアウト / ワイヤーフレーム / UI 要素) は L2 画面設計 4 sub-doc (画面一覧 / 画面遷移 / ワイヤーフレーム / UI 要素) に委ねる。

**drive=be 注記**: harness core は be 駆動。L2 画面設計 sub-doc は drive=be では skip 可 (frontmatter `skip_sub_doc` で理由明示)。ただし L1 画面要求は「どの画面が業務上必要か」の業務要求であり、skip 対象ではない。ダッシュボード (SCR-01) は BR-06 の実現手段として業務要求に含まれる。

## §1 入力 (上流からの baton)

- L0 企画書: `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- v2 HELIX-workflows 正本: `vendor/helix-source/docs/v2/process/L01-requirements-and-operational-test-design.md`
- 上流 baton (business): `docs/design/harness/L1-requirements/business-requirements.md` (BR-06 ダッシュボード / UX-02 チーム連携 / UX-03 DX 戦術)
- 上流 baton (functional): `docs/design/harness/L1-requirements/functional-requirements.md` (FR-L1-20 観測・計測層 / FR-L1-29 画面設計 WF / FR-L1-30 フロントデザイン UX WF)
- 画面候補 (B-1 起票済): `docs/design/harness/L1-requirements/screen-requirements.md` (SCR-01〜07 現状)

## §2 出力 (本 PLAN で確定)

- 正本 doc: `docs/design/harness/L1-requirements/screen-requirements.md` (frontmatter generates)
- 量閉じ: 全 SCR-* が L14 OT に被覆されていること

## §3 ヒアリング項目 / 調査メモ (screen 固有)

**status 凡例**: ✅ = 正本着地済 / ➡️ = L2 forward / ❓ = PO 判断待ち / 🆕 = draft 着地・G1 待ち

### 3.1 必要画面リスト確定

| ID | ヒアリング項目 | 着地先 | status |
|----|--------------|--------|--------|
| U-画-1 | ダッシュボード (SCR-01): 工程表・進捗・詰まり・フェーズを横断可視化。BR-06 / UX-02 / FR-L1-20 / BR-20 (工程管理 DB Phase A 基盤) | §1 画面一覧 SCR-01 | ✅ (B-1 起票済) |
| U-画-2 | PLAN ビュー (SCR-02): 単一 PLAN 詳細 (工程表 / 実装計画 / generates / requires / status) | §1 SCR-02 | ✅ |
| U-画-3 | Gate 判定ビュー (SCR-03): ゲート通過状況・fail 理由 + next_action 表示。UX-03 DX 戦術の核心 | §1 SCR-03 | ✅ |
| U-画-4 | Audit ビュー (SCR-04): AI 実行ログ・逸脱警告・budget 使用状況・agent guard 判定履歴。FR-L1-09/20 | §1 SCR-04 | ✅ |
| U-画-5 | Recovery ビュー (SCR-05): 暴走状態ログ・再開ポイント・認識訂正履歴・cutover ロールバック。FR-L1-10 | §1 SCR-05 | ✅ |
| U-画-6 | handover ビュー (SCR-06): CURRENT.json の可視化・引き継ぎ状態確認 | §1 SCR-06 | ✅ |
| U-画-7 | Mode 遷移ビュー (SCR-07): 9-mode 遷移・現在 mode・mode 切替トリガー一覧。FR-L1-08 | §1 SCR-07 | ✅ |
| U-画-8 | Feature 管理ビュー: `docs/features/F-NNN.md` 一覧・3 点セット整合状態 (BR-13 / BR-16 7-Gate pipeline 結果)。PO declared 2026-05-28 | §1 SCR-08 (SCR-01 ダッシュボードと統合) | ✅ (PO 承認済 2026-05-28。SCR-08 = ダッシュボード統合 tab として確定。独立ビューは L3 forward) |
| U-画-9 | DR/NFR ビュー: NFR 充足状況・SLO 達成率・IPA グレード一覧。NFR-01〜15 | §1 SCR-01 tab (ダッシュボード統合) | ✅ (PO 承認済 2026-05-28。SCR-09 は設置せず SCR-01 の NFR tab として扱う。独立 SCR は drive=be では不要) |
| U-画-11 | 運用者ロール管理ビュー: PO/PM/TL/SE/PE 責務境界表示 + agent guard 判定履歴 (BR-21 / FR-L1-44 対応) | §1 SCR-11 新規 | ✅ (PO 承認済 2026-05-28) |

### 3.2 画面遷移・操作要望 (L1 粒度)

| ID | ヒアリング項目 | status |
|----|--------------|--------|
| U-画-遷移-1 | SCR-01 ダッシュボードが起点。PLAN クリック → SCR-02、Gate クリック → SCR-03、Audit クリック → SCR-04 遷移 | ✅ (PO 承認済 2026-05-28。L1 粒度遷移確定。遷移図詳細は L2 forward) |
| U-画-遷移-2 | CLI (`ut-tdd status`) との二重運用: CLI 出力と画面の情報 parity | ✅ (PO 承認済 2026-05-28。NFR-01 cross-platform + FR-L1-20 observability で担保) |
| U-画-遷移-3 | SCR-04 Audit ビュー → SCR-11 運用者ロール管理ビューへの遷移 (agent guard 判定詳細閲覧) | ✅ (PO 承認済 2026-05-28) |
| U-画-遷移-4 | SCR-01 ダッシュボード → SCR-06 handover ビューへの遷移 (CURRENT.json 確認) | ✅ (PO 承認済 2026-05-28) |
| U-画-遷移-5 | SCR-01 → SCR-07 Mode 遷移ビュー → 9 mode 切替 → SCR-01 に戻る | ✅ (PO 承認済 2026-05-28) |
| U-画-遷移-6 | SCR-02 PLAN ビュー → SCR-05 Recovery ビュー (PLAN fail 時) | ✅ (PO 承認済 2026-05-28) |

#### 3.2a SCR 詳細化 (PO 承認済 2026-05-28)

| SCR-ID | 詳細追加 | status |
|--------|---------|--------|
| SCR-01 | ダッシュボード: KPI D-01〜D-09 表示エリア + NFR tab + Feature 整合 tab (SCR-08 統合) | ✅ |
| SCR-04 | Audit ビュー: agent guard bypass 記録 (UT_TDD_ALLOW_RAW_AGENT=1 使用履歴) を表示 | ✅ |
| SCR-07 | Mode 遷移ビュー: Add-feature 例外 mode の plan-freeze スキップ表示 (FR-L1-42) | ✅ |
| SCR-11 | 運用者ロール管理ビュー (新規): PO/PM/TL/SE/PE 責務境界 + agent guard 許可リスト状態 + bypass 履歴 (BR-21 / FR-L1-44 対応) | ✅ |

### 3.3 PO 承認済 (旧 PO 判断待ち → 2026-05-28 確定)

| ID | ヒアリング項目 | 確定内容 | status |
|----|--------------|---------|--------|
| U-画-PO-1 | SCR-08 (Feature 管理ビュー) を L1 scope に含めるか | SCR-08 = SCR-01 ダッシュボード統合 tab として L1 scope に含める。独立ビュー化は L3 forward | ✅ (PO 承認済 2026-05-28) |
| U-画-PO-2 | drive=be で L2 画面設計 skip 理由の明示方針 | ダッシュボードは be の付属 UI として扱う。L2 sub-doc は `skip_sub_doc: true` + 理由明示。drive は be のまま維持 | ✅ (PO 承認済 2026-05-28) |

## §4 工程表 (Step + 進捗)

### Step 1: 既存資料整理
- 担当: tl + pmo-sonnet
- 内容: screen-requirements.md (B-1 起票済、SCR-01〜07) の現状を読み直し、SCR-08/09 候補・遷移要望の抜けを洗い出す
- 進捗: ✅ (commit d9992f1、2026-05-28)

### Step 2: 必要画面リスト確定
- 担当: po + tl
- 内容: §3.1 の ❓ 項目 (SCR-08 / SCR-09 / drive 判断) を PO + TL で確定。ダッシュボード Phase A 基盤 (BR-20) との整合確認
- 進捗: ☐

### Step 3: 画面遷移要望の整理
- 担当: tl
- 内容: §3.2 遷移要望を §2 画面遷移の要望 (L1 粒度) に落とす。L2 への bridge 素材として整理
- 進捗: ☐

### Step 4: screen §1-§4 の起草・改訂
- 担当: tl
- 内容: 画面一覧 (SCR-01〜NN) + 遷移要望 + 操作要望 を L1 粒度で確定。§4 関連 doc に L2 bridge 規約追記
- 進捗: ☐

### Step 5: 運用テスト設計の pair 凍結
- 担当: qa
- 内容: L14 OT に SCR-* 全件が被覆されているか確認、不足あれば OT 追加
- 進捗: ☐

### Step 6: review (self / pmo-sonnet)
- 担当: pmo-sonnet
- 内容: 専門サブエージェント review 必須 (`.claude/CLAUDE.md` Guard Rules)。L2 bridge 素材としての十分性・❓ 残ゼロを確認
- 進捗: ✅ (acdc5ccd6f31ae951 通過、2026-05-28)

### Step 7: G1 PO サインオフ準備
- 担当: po
- 内容: 5 sub-doc 全件揃った段階で G1 ゲート PO 確認
- 進捗: 🔄 (本 commit で readiness 整備中、PO 最終確認待ち)

## §5 実装計画 (各記載項目をどう埋めるか)

| 節 | 情報源 | 方法 |
|----|--------|------|
| §1 画面一覧 | B-1 起票済 SCR-01〜07 + §3.1 確定分 | SCR-NN 表 (画面 ID / 画面名 / 主要目的 / 対応 BR/FR) に SCR-08/09 を追加または除外 |
| §2 画面遷移の要望 | §3.2 遷移要望 + concept §2.5 9-mode 遷移 | SCR-01 起点の遷移パターン (L1 粒度)。具体的な遷移図は L2 に委ねる旨を明記 |
| §3 表示・操作への要望 | UX-03 DX 戦術 + UX-02 チーム連携 + FR-L1-20 observability | 各画面の「業務要求としての表示粒度・操作要望」を L1 レベルで列挙 |
| §4 関連 doc | L2 4 sub-doc へのブリッジ規約 | L2 PLAN-L2-01〜04 が本 sub-doc を入力とする接続規約。drive=be の L2 skip 方針も明記 |

## §6 DoD (Definition of Done)

- [ ] screen-requirements.md が必須 § 全件含む (§1〜§4)
- [x] §1 画面一覧が SCR-NN 全件を含む (7 画面確定: SCR-01〜07 + SCR-08 統合 + SCR-11 新規。PO 承認済 2026-05-28)
- [ ] frontmatter 必須フィールド完備 (sub_doc / pair_artifact / related_l0 / related_br / next_pair_freeze)
- [ ] 冒頭 blockquote 必須要素 (SSoT 参照 / 件数確定 7 画面 / L3 接続規約) 存在
- [ ] §4 に L2 4 sub-doc (画面一覧 / 画面遷移 / ワイヤーフレーム / UI 要素) への bridge 規約が記載
- [x] drive=be における L2 sub-doc skip 方針が明示 (skip_sub_doc: true + 理由「ダッシュボードは be 付属 UI」確定。PO 承認済 2026-05-28)
- [ ] L14 OT で本 sub-doc 由来要求が被覆 (孤児 0)
- [x] 専門サブエージェント review (Step 6) 通過記録 (2026-05-28 pmo-sonnet 再被覆監査 acdc5ccd6f31ae951 通過、CONDITIONAL PASS)
- [x] G1 readiness: status = ready-for-G1-signoff (PO サインオフ準備完了。§3 全件 ✅/➡️ 確定済、7 画面 + 6 遷移確定)

## §7 carry / 次工程 (L2 / L3) への引き継ぎ

**確定済 (carry から除外)**:
- SCR-08 scope 判断: SCR-01 ダッシュボード統合 tab として確定。carry 終了
- SCR-09 判断: SCR-01 NFR tab として統合確定。carry 終了
- drive=be L2 skip 方針: skip_sub_doc: true + 理由明示で確定。carry 終了
- 画面遷移 6 件 (U-画-遷移-1〜6): L1 粒度確定。carry 終了
- SCR-11 新規: PO 承認済 2026-05-28。carry 終了

**L2 forward carry (継続)**:
- **各 SCR の wireframe lift (L2)**: SCR-01〜07 + SCR-11 の wireframe は L2 画面設計 sub-doc で詳細化。PLAN-L2-01〜04 が本 sub-doc を `dependencies.requires` に列挙
- **SCR-08 独立ビュー化判断 (L3)**: dashboard tab では不足の場合 L3 screen forward で独立 SCR 化を検討
- **Phase B ダッシュボード拡張**: ADR-002 (2 層分離) 確定後、SCR-01 仕様拡張として L3/L4 forward
- **L3 PLAN 接続規約**: PLAN-L3-xx-screen-requirement (起票される場合) は本 sub-doc 全件を `dependencies.requires` に列挙する
