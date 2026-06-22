---
plan_id: PLAN-L1-03-screen-requirements
title: "PLAN-L1-03: 画面要求 起票工程 (v3: 14 画面 PM/HM/GD 全面再編)"
kind: design
layer: L1
sub_doc: screen
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
  - artifact_path: docs/design/harness/L1-requirements/screen-requirements.md
    artifact_type: design_doc
dependencies:
  parent: null
  requires:
    - PLAN-L1-01-business-requirements
    - PLAN-L1-02-functional-requirements
  blocks: []
v2_import: docs/migration/v2-import-ledger.md
review_evidence:
  - reviewer: pmo-sonnet
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-04"
    tests_green_at: "2026-06-04"
    verdict: approve
    scope: "A-100 L0-L3 refreeze sign-off (pmo-sonnet + PO、claude-only intra_runtime_subagent)"
  - reviewer: pmo-sonnet
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-22"
    tests_green_at: "2026-06-22"
    verdict: approve
    scope: "v4 PM-06 設計書ビューア追加 (14→15 画面)。screen-requirements §1.PM.06 + §5 trace (R2 逆 trace PM-06=BR-01/BR-07/FR-L1-01/FR-L1-32) + L14 OT-47 pair back-propagation。pmo-sonnet verdict=approve-with-fixes (孤児 0 / read-only S5=b / BR-FR 実在 / status=placeholder 確認)、指摘の件数残骸 14→15 を全 doc で修正完了。doctor doc-consistency screens=15 green。"
    worker_model: claude-opus-4-8
    reviewer_model: claude-sonnet-4-6
---

# PLAN-L1-03: 画面要求 起票工程 (v3)

> **正本宣言**: 本 PLAN は **中間準備ドシエ** (ヒアリング項目・調査メモ・工程表)。
> **本 PLAN が産出する正本 doc**: `docs/design/harness/L1-requirements/screen-requirements.md` (上記 frontmatter generates 参照、337 行、14 画面 PM/HM/GD 確定)。
> **V-model pair**: L1 画面要求 sub-doc ↔ L14 運用テスト設計 1 doc。本 PLAN 完了時に G1 pair freeze の対象。

## §0 本 PLAN の役割

本 PLAN は `画面要求 (screen)` sub-doc を **3 カテゴリ Bounded Context (PM / HM / GD) 14 画面構成** で起票する工程を管理する。中間準備 + 工程表 + 実装計画を内蔵。

**v3 改訂内容 (2026-05-28、PO 凍結前追加ヒアリング 全件承認)**:
- 旧 SCR-NN 体系廃止 → PM-NN (5 件) / HM-NN (8 件) / GD-NN (1 件) = **14 画面**
- 3 カテゴリ Bounded Context 分離 (PM = 案件遂行 / HM = harness 改善 / GD = 静的ガイド)
- PM 画面群 V-model 駆動再設計 (PM-01 4 階層プルダウン: 俯瞰 / 工程 / 割当 / 詳細)
- §3 表示要望に 4 横断原則追加 (人間主導 + AI 補助 / 詳細データテーブル必須 / AI 指示 copy-paste / 問題箇所視覚化)

**v4 改訂内容 (2026-06-22、PO 指示で PM-06 追加)**:
- 以下 v3 記述中の「14 画面」は v3 (2026-05-28) 時点の history。**現行件数は 15 画面** (SSoT = screen-requirements.md §1)。
- **PM-06 設計書ビューア追加**: プロジェクト単位で L0-L14 設計書 (Markdown/YAML/Mermaid) を見やすくレンダリングしプレビューする read-only 画面 (URL `/project/:case/designs`、カテゴリ PM)。
- trace 反映: §5.5 逆 trace に PM-06=BR-01/BR-07/FR-L1-01/FR-L1-32 / §5.6 R2 / §6 ペルソナ / §7 BC・deep-link を 15 画面へ更新。L1↔L14 pair = OT-47 で back-propagation 量閉じ (孤児 SR=0 維持)。
- pmo-sonnet review approve-with-fixes → 件数残骸 (14→15) 全 doc 修正済 + doctor doc-consistency screens=15 green。

**注意**: L1 画面要求は「業務要求視点の必要画面列挙 + データ表示要望」。UI 具体化 (レイアウト / ワイヤーフレーム / UI 要素) は L2 画面設計 4 sub-doc に委ねる。

**drive=be 注記 (2026-05-28 PO 指摘で修正)**: harness core は be 駆動だが、ut-tdd は **dashboard (14 画面 PM/HM/GD) を持つ「UI を持つ be」** であるため、**L2 画面設計 3 sub-doc (画面一覧 / 遷移 / UI 要素) は必須実施**。wireframe (High-Fi モック) のみ省略可 (Low-Fi で代替、High-Fi は L10 UX refinement)。詳細は concept §3.7 「L2 sub-doc skip ルール」参照。

> **PO 指摘 (2026-05-28)**: 「L2 スキップすんな。モックは作らなくてもせめて画面要求は作れよ」 — 旧版で「drive=be で L2 全 skip 可」と判定していたが撤回。画面要求 3 sub-doc は drive 非依存で必須。

## §1 入力 (上流からの baton)

- L0 企画書: `docs/governance/ut-tdd-agent-harness-concept_v3.1.md`
- v2 HELIX-workflows 設計概念参照: `vendor/helix-source/docs/v2/process/L01-requirements-and-operational-test-design.md`
- 上流 baton (business): `docs/design/harness/L1-requirements/business-requirements.md` (BR-06 ダッシュボード / UX-02 チーム連携 / UX-03 DX 戦術 / **§3.3.2 人間主導 + AI 補助原則 (CC2)** / **§10.3.1 3 カテゴリ Bounded Context (X1=a)**)
- 上流 baton (functional): `docs/design/harness/L1-requirements/functional-requirements.md` (FR-L1-20 観測層 / FR-L1-29 画面設計 WF / FR-L1-30 フロントデザイン UX WF / FR-L1-33 資産棚卸 / FR-L1-34 穴管理 / FR-L1-35 整備状況可視化 / FR-L1-44 onboarding)
- PO 追加ヒアリング承認記録: `docs/handover/G1-readiness-report-2026-05-28.md` v3 (V1-CC3 全件 AI 推奨採用)

## §2 出力 (本 PLAN で確定)

- 正本 doc: `docs/design/harness/L1-requirements/screen-requirements.md` (frontmatter generates、337 行、14 画面)
- 量閉じ: 全 PM/HM/GD-NN (14 画面) が L14 OT で被覆 (OT-15/25/32〜44 で網羅、孤児 0)

## §3 ヒアリング項目 / 調査メモ (screen 固有、v3 全件 ✅ 確定済)

**status 凡例**: ✅ = 正本着地済 / ➡️ = L2 forward / ❓ = PO 判断待ち (本 v3 で全件解消)

### 3.1 14 画面リスト確定 (PO 承認済 2026-05-28、全件 AI 推奨採用)

#### PM (5 画面) — V-model 駆動、案件遂行

| ID | 画面 | 採用根拠 | status |
|---|---|---|---|
| **PM-01** | プロジェクト俯瞰ダッシュボード (4 階層プルダウン: 俯瞰 / 工程 / 割当 / 詳細) | Y1=a + AA3=a + S4=a 採用、V-model 駆動 | ✅ |
| **PM-02** | 工程ビュー (L0-L14 共通テンプレート、進捗・担当・詰まり 3 軸) | Y1=a + Y2=a + AA2=a 採用、機能内容除外 | ✅ |
| **PM-03** | Gate + 詰まり要因ビュー (gate fail + drift + handover stale + 暴走シグナル 横断) | Y1=a 採用、トラブル要因横断 | ✅ |
| **PM-04** | Trace ビュー (4 artifact + V-model pair 統合) | Y1=a + AA4=a 採用、V-pair 独立画面削除 | ✅ |
| **PM-05** | Handover ビュー (セッション継続) | 既存維持 (旧 SCR-06、S6=a auto 表示) | ✅ |

#### HM (8 画面) — 機能可視化 + 改善ループ + 学び

| ID | 画面 | 採用根拠 | status |
|---|---|---|---|
| **HM-01** | 機能一覧ビュー (FR-L1 47 件 × implementation_status) | W1=a + AA1=a 採用、FR-L1-33/34/35 直接実装 | ✅ |
| **HM-02** | カバレッジヒートマップビュー (観点 8 × 軸 5) | Z1=a + Z2=b 採用、弱点診断 | ✅ |
| **HM-03** | 配線図ビュー (動的、エラー赤表示) | **CC1=a 採用 (前回 doc 化判断撤回)**、問題箇所視覚化 | ✅ |
| **HM-04** | データベース閲覧ビュー (整合性チェック付き) | **CC1=a 採用 (前回 CLI 専用判断撤回)**、state 異常検知 | ✅ |
| **HM-05** | Audit / 実行ログビュー (skill 注入タブ統合) | 旧 SCR-04 + S8=b 採用 | ✅ |
| **HM-06** | Recovery ビュー (CLI ロールバックコピー S5=b) | 旧 SCR-05 維持 | ✅ |
| **HM-07** | Doctor 結果ビュー | 旧 SCR-11 維持 | ✅ |
| **HM-08** | AI 効果データ + Learning Engine ビュー (BR-21 連動) | V3=a 採用、L3 carry | ✅ |

#### GD (1 画面) — 静的ガイド

| ID | 画面 | 採用根拠 | status |
|---|---|---|---|
| **GD-01** | ガイド/ドキュメント統合ビュー (左サイドナビ 7 カテゴリ: Troubleshooting / Architecture / Onboarding / Tutorial / CLI / FAQ / Changelog) | BB1=a + BB2=a + BB3=b 採用 (Learning Engine 半自動更新は Phase B carry) | ✅ |

### 3.2 画面遷移 (6 シナリオ確定、PO 承認済 2026-05-28)

| ID | シナリオ | status |
|----|---------|--------|
| シナリオ 1 | Forward 通常進行 (PM-01 → PM-02 → PM-03 → PM-01) | ✅ |
| シナリオ 2 | Gate fail 時 next_action (PM-03 → PM-02 → PM-04 → HM-07) | ✅ |
| シナリオ 3 | Incident (PM-01 → HM-06 Recovery → HM-05 Audit → PM-01) | ✅ |
| シナリオ 4 | セッション再開 Handover (PM-05 auto → PM-02 → PM-03) | ✅ |
| シナリオ 5 | Recovery 収束後 (HM-06 → PM-01 → PM-02 → PM-03) | ✅ |
| シナリオ 6 | Discovery S0→S4 (PM-01 → PM-02 → HM-05 → PM-03 → PM-01) | ✅ |
| **追加** | 3 カテゴリ間 deep-link (例: PM-03 → HM-05 → GD-01 Troubleshooting → AI 指示 copy → 修正) | ✅ (CC2 採用) |

### 3.3 §3 横断原則 4 件追加確定 (CC2/CC3 採用、PO 承認済 2026-05-28)

| 原則 | status |
|------|--------|
| 人間主導 + AI 補助原則 (CC2、business §3.3.2 と整合) | ✅ |
| 詳細データテーブル必須 (CC3、サマリのみ画面禁止) | ✅ |
| AI への指示テキスト copy-paste UI (自動修正ボタン排除) | ✅ |
| 問題箇所視覚化 (HM-03/04 + PM-03 で 🟢/🟡/🔴 色分け) | ✅ |

### 3.4 既存採用済 §3 要望 (前 commit b0d0fbf で確定、維持)

S2=b 30 秒ポーリング / S3=b PLAN ビュー パース構造化 / S5=b Recovery CLI コピー / S6=a Handover auto 表示 / S9=a Desktop 専用 / Q30 light のみ / Q31 日本語固定 / Q32 WCAG 2.1 AA 意識 - 全件 ✅

## §4 工程表 (Step + 進捗)

### Step 1: 既存資料整理
- 担当: tl + pmo-sonnet
- 内容: screen-requirements.md (B-1 起票済 7 画面) の現状確認
- 進捗: ✅ (commit d9992f1、2026-05-28)

### Step 2: 必要画面リスト確定 (v3 で 14 画面化)
- 担当: po + tl
- 内容: PO 追加ヒアリング V1-CC3 全件承認受領 → PM/HM/GD 14 画面確定
- 進捗: ✅ (2026-05-28、subagent 4 並列起案 + PO 承認)

### Step 3: 画面遷移要望の整理
- 担当: tl
- 内容: 6 シナリオ + 3 カテゴリ間 deep-link を screen §2 に反映
- 進捗: ✅ (Step A subagent ac2517e7、2026-05-28)

### Step 4: screen §1-§6 起草・改訂 (v3 全面再編)
- 担当: tl
- 内容: 14 画面詳細化 + 横断原則 4 件 + Bounded Context 宣言 + ペルソナ 3 種
- 進捗: ✅ (Step A subagent、202→337 行、2026-05-28)

### Step 5: 運用テスト設計の pair 凍結
- 担当: qa
- 内容: L14 OT で 14 画面被覆 (OT-15/25/32〜44 で網羅、孤児 0)
- 進捗: ✅ (Step C subagent a008e781、OT-44 件確定、2026-05-28)

### Step 6: review (self / pmo-sonnet)
- 担当: pmo-sonnet
- 内容: 専門サブエージェント review 必須
- 進捗: ✅ (acdc5ccd 通過 + 追加 4 subagent ad3c4989/aba43aef/a39bf4b8/ae9d79db、2026-05-28)

### Step 7: G1 PO サインオフ準備
- 担当: po
- 内容: 14 画面確定 + 4 横断原則確定 + 3 カテゴリ Bounded Context 確定
- 進捗: ✅ (v3 全件 PO 承認 2026-05-28、G1 readiness v3 起票へ)

## §5 実装計画 (各記載項目をどう埋めるか)

| 節 | 情報源 | 確定状態 |
|----|--------|---------|
| §1 画面一覧 (3 カテゴリ別) | §3.1 14 画面リスト | ✅ §1.PM/HM/GD 各サブセクションで詳細化済 |
| §2 画面遷移シナリオ | §3.2 6 シナリオ + 3 カテゴリ間 deep-link | ✅ |
| §3 表示・操作要望 (4 横断原則 + 既存 8 要望) | §3.3 + §3.4 | ✅ §3.1 横断原則 / §3.2 既存維持 |
| §4 L2 carry 規約 | L2 PLAN-L2-01〜04 (14 画面被覆) | ✅ |
| §5 ペルソナ (3 ペルソナ × 3 カテゴリ整合) | PO / harness 運用者 / 新規参画者 | ✅ |
| §6 Bounded Context 宣言 (新規) | DDD 整合、SCR-NN → PM/HM/GD-NN 移行注記 | ✅ |

## §6 DoD (Definition of Done)

- [x] screen-requirements.md が必須 § 全件含む (§1〜§6)
- [x] §1 画面一覧が 14 画面全件 (PM 5 + HM 8 + GD 1) を含む
- [x] frontmatter 必須フィールド完備
- [x] 冒頭 blockquote 必須要素 (SSoT 参照 / 件数確定 14 画面 / L3 接続規約) 存在
- [x] §4 に L2 4 sub-doc bridge 規約 (14 画面ベース)
- [x] §3 4 横断原則が記載 (人間主導 / 詳細データテーブル / AI 指示 copy / 問題箇所視覚化)
- [x] §6 Bounded Context 宣言 (PM/HM/GD)
- [x] L14 OT で 14 画面被覆 (孤児 0、OT-15/25/32〜44)
- [x] 専門サブエージェント review 通過 (acdc5ccd + 4 追加 subagent + Step J/K/L、2026-05-28)
- [x] **G1-trace 機械検証 R1-R4 通過** (DD1=a / DD2=a PO 承認 2026-05-28、2026-06-02 BR-22 fullback 更新): R1 全 BR/UX 13 件画面紐付き ✅ / R2 全 14 画面業務根拠紐付き ✅ / R3 FR-L1 P0 19 件全件画面紐付き ✅ / R4 screen sub-doc requires 整合 ✅。SSoT: §5 trace マトリクス
- [x] **G1 readiness: status = ready-for-G1-signoff** (v5 確定、14 画面 + 4 横断原則 + Bounded Context + G1-trace 全件 PO 承認済 2026-05-28)
- [x] **v4 (2026-06-22)**: PM-06 設計書ビューア追加で **15 画面**、§5.5 逆 trace に PM-06 紐付け (孤児 0)、L14 OT-47 pair back-propagation、doctor doc-consistency screens=15 green

## §7 carry / 次工程 (L2 / L3) への引き継ぎ

**確定済 (carry から除外、本 v3 で解消)**:
- 14 画面構成 (PM 5 / HM 8 / GD 1): 全件 PO 承認済
- 3 カテゴリ Bounded Context (PM/HM/GD): X1=a 採用済
- 4 横断原則 (人間主導 / 詳細データテーブル / AI 指示 copy / 問題箇所視覚化): CC2/CC3 採用済
- PM-01 4 階層プルダウン (俯瞰 / 工程 / 割当 / 詳細): AA3=a 採用済
- PM-02 工程ビュー (進捗・担当・詰まり 3 軸、機能内容除外): AA2=a 採用済
- HM-03 配線図 + HM-04 DB 閲覧 再採用: CC1=a 採用済
- GD-01 統合 1 画面 (左サイドナビ 7 カテゴリ): BB1/BB2=a 採用済
- **L2 必須実施判定 (2026-05-28 PO 指摘)**: 旧「drive=be で L2 全 skip 可」撤回、**画面要求 3 sub-doc は必須**

**L2 forward carry (継続、必須実施、PO 指摘 2026-05-28)**:
- **PLAN-L2-01 画面一覧 (screen-list.md) 必須実施**: 14 画面 (PM/HM/GD) の画面 ID / 役割 / 業務根拠 確定
- **PLAN-L2-02 画面遷移 (screen-flow.md) 必須実施**: 6 シナリオ + 3 カテゴリ間 deep-link の詳細遷移図
- **PLAN-L2-04 UI 要素 (ui-element.md) 必須実施**: 14 画面の主要 UI コンポーネント / 入力 / 表示 / 操作要素
- **PLAN-L2-03 wireframe (wireframe.md) 柔軟方針 (A-39/A-40)**: PO 指示 2026-05-28「L2 のフォルダ作っておいて」+ PO 訂正「必ず外部にはならないからな」を反映。**Low-Fi (ASCII art / 簡易図) は harness 内に保持 (デフォルト)**、**High-Fi モックは ケース別判断**:
  - (a) harness 内保持 (img link / SVG 等)
  - (b) **外部依頼** (PO が Figma / Excalidraw / 外部デザイナ等に依頼) — 許容オプション、必須ではない
  - L2-screen/wireframe.md は status=placeholder で起票済 (L2 着手時に PLAN-L2-03 で本起票)
  - PM-01 4 階層プルダウン / HM-02 heat map / HM-03 動的配線図 / HM-04 DB 閲覧 / GD-01 左サイドナビ等の主要画面は **Low-Fi (ASCII art) を本起票時に追記推奨**
- **外部依頼選択時の back-propagation (PO 指示 2026-05-28)**: 「L2 で本来やる工程をある程度確定した状態で出す」前提。外部成果物が戻ったら L1 screen / business / functional への要件修正が入る可能性あり → **G1-trace 再検証必須** (R1-R4)。修正履歴は handover + carry に記録
- **画面遷移詳細**: 3 カテゴリ間 deep-link の URL 設計 (PM-NN / HM-NN / GD-NN/<category> 規約)
- **PLAN-L2-01〜04 接続規約**: 本 sub-doc 全 14 画面を `dependencies.requires` に列挙

**L3 forward carry**:
- HM-08 AI 効果データビュー (BR-21 連動、FR-L1-36/38/43 の L3 詳細化と連動)
- GD-01 Learning Engine 半自動更新 (BB3=b、Phase B carry)
- 「人間主導 + AI 補助」原則を L3 全機能要件で「人間判断点」明示 (CC2 carry)

**L4 carry**:
- 14 画面の実装方式 (フレームワーク選定、Tauri / Electron / 純 Web 等) は L4 ADR で確定
