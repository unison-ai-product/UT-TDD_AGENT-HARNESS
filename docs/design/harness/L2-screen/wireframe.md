---
layer: L2
sub_doc: wireframe
status: confirmed  # G2 freeze (PO サインオフ 2026-06-22、gate-design §2 G2=PASS)。Low-Fi 材料化 PLAN-L2-04。③ pair=self (L2↔L10)。
default_policy: low-fi-in-harness
high_fi_policy: case-by-case (harness 内保持 OR 外部依頼のいずれか、ケース別判断)
pair_artifact: self  # wireframe mock 自体が L2⇔L10 の③ペア (L10 独立 doc 不要、IMP-039/058)。vmodel-lint は self を孤児扱いしない
parent_doc: docs/design/harness/L1-requirements/screen-requirements.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L10
plan: docs/plans/PLAN-L2-04-wireframe.md
created: 2026-05-28
updated: 2026-06-22
---

# L2 ワイヤーフレーム (wireframe)

> **SSoT 参照**: 画面 ID/URL は [screen-list.md](./screen-list.md)、UI 部品は [ui-element.md](./ui-element.md)、遷移は [screen-flow.md](./screen-flow.md) が正本。本 doc は Low-Fi ASCII でレイアウト・情報配置を示す (③ pair = self、L2↔L10)。
> **V-pair (IMP-039/058)**: 本 mock 自体が L10 の③ペア。`docs/test-design/` に独立 doc は作らない。
> **方針 (PO 確定 2026-05-28)**: Low-Fi は harness 内保持 (本ファイル)、High-Fi は **ケース別判断** (harness 内保持 OR 外部依頼、外部は許容オプションで強制ではない —「必ず外部にはならない」PO 訂正)。
> **スコープ**: 15 画面 (PM 6 + HM 8 + GD 1)、Desktop 専用 (S9=a)、light のみ (Q30)、日本語固定 (Q31)。全画面 read-only + CLI コピー (S5=b)。

## §1 共通レイアウト骨格 (全画面)

```
┌──────────────────────────────────────────────────────────────┐
│ [PM ▼] [HM ▼] [GD ▼]                      [Settings]  ⟳ 30s   │  ← トップナビ (X2=b) + PollingIndicator
├──────────────────────────────────────────────────────────────┤
│ Breadcrumb: PM > 案件 > 画面                                   │
├──────────────────────────────────────────────────────────────┤
│ [FilterBar: mode▼ phase▼ status▼ drive▼]                      │
│ ┌── DataTable / 主コンテンツ (CC3 raw data 粒度) ───────────┐ │
│ │ 🟢/🟡/🔴 StatusBadge 列 + 詳細行                          │ │
│ └──────────────────────────────────────────────────────────┘ │
│ [NextActionCard: 次にすること → (該当時)]   [📋 CLI コピー]     │
└──────────────────────────────────────────────────────────────┘
```

## §2 主要画面 Low-Fi

### PM-01 プロジェクト俯瞰ダッシュボード (`/projects`)

```
┌─ PM-01 プロジェクト俯瞰 ───────────────────────────────────┐
│ [▼俯瞰] [工程] [割当] [詳細]   filter: mode▼ phase▼ status▼ │
│ 案件               L0 L1 L2 L3 L4 L5 L6 L7 ...L14            │
│ PLAN-DISCOVERY-01  🟢 🟢 🟡 🔄 ⬜ ⬜ ⬜ ⬜ ... ⬜  → cell click=PM-02
│ PLAN-RECOVERY-01   🟢 🟢 🔄 ⬜ ⬜ ⬜ ⬜ ⬜ ... ⬜            │
│ (🔴 gate fail 案件は行ハイライト + 即時反映 B8≤5分)         │
└────────────────────────────────────────────────────────────┘
```

### PM-03 Gate + 詰まり要因 (`/project/:case/gates`)

```
┌─ PM-03 Gate + 詰まり要因 ──────────────────────────────────┐
│ Gate 一覧            判定   サインオフ  証跡               │
│ G1-trace            🟢 pass  PO        [artifact]          │
│ G2-screen           🟡 DEFER  —        [—]                 │
│ ─ 発生中トラブル横断 (種別/検出時刻/影響/next_action) ─    │
│ 🔴 gate fail | 12:03 | PLAN-X | → [📋 next_action コピー]   │
│ [📋 interrupt CLI] [📋 resume CLI]  (S5=b CLI 受付)        │
└────────────────────────────────────────────────────────────┘
```

### PM-06 設計書ビューア (`/project/:case/designs`) — 新規 (2026-06-22)

```
┌─ PM-06 設計書ビューア ─────────────────────────────────────────────┐
│ filter: layer▼ status▼ drive▼      [ツリー]        │ [プレビュー]   │
│ ┌─ L0-L14 設計書ツリー ──────────────┐ │ ┌─ screen-list.md ──────────┐│
│ │ L0 concept ............... 🟢confirmed│ │ ▸ frontmatter (YAML 構造化)││
│ │ L1 requirements                      │ │   layer: L2  status: ...   ││
│ │   ├ business ............. 🟢         │ │ ─────────────────────────  ││
│ │   ├ functional ........... 🟢         │ │ # L2 画面一覧              ││
│ │   └ screen ............... 🟢         │ │ | 画面ID | 名 | URL |...   ││  ← Markdown 表
│ │ L2 screen                            │ │ ```mermaid                 ││
│ │   ├ screen-list .......... 🟡placehold│ │   erDiagram ... (図描画)   ││  ← MermaidRenderer
│ │   ├ screen-flow .......... 🟡         │ │ ```                        ││
│ │   ├ ui-element ........... 🟡         │ │ [目次: §1 §2 §3 ...]       ││
│ │   └ wireframe ............ 🟡 (選択中)│ │ [📋 doc パス] [→ PM-04 trace]││
│ │ L4 basic-design ...                  │ │                            ││
│ └──────────────────────────────────────┘ │ └────────────────────────────┘│
│ status: 🟢confirmed 🟡placeholder 🔵frozen ⬜未作成   (read-only S5=b)     │
└────────────────────────────────────────────────────────────────────────┘
```

### HM-02 カバレッジヒートマップ (`/harness/coverage`)

```
┌─ HM-02 カバレッジ heat map (観点8 × 軸5 = 40) ──────────────┐
│ 軸: [L] drive mode phase BR-FR     観点↓                   │
│           L    drive  mode  phase  BR-FR                   │
│ skill    🟩    🟨     🟥    🟩     🟨   ← cell click=不足一覧+起票候補
│ command  🟩    🟩     🟨    🟩     🟩                       │
│ detector 🟥    🟨     🟥    🟨     🟥                       │
│ ...                                                        │
└────────────────────────────────────────────────────────────┘
```

### HM-03 配線図 (`/harness/wiring`) / HM-04 DB 閲覧 (`/harness/db`)

```
┌─ HM-03 配線図 (SVG, 動的エラー赤) ──┐  ┌─ HM-04 DB 閲覧 ───────────┐
│  [cli]──🟢──[doctor]──🟢──[db]      │  │ table▼: model_runs        │
│    │🔴 hook 発火失敗                 │  │ 行 | col... (raw data)    │
│  [hook]┄┄✕┄┄[projection]           │  │ 🟡 orphan 1 件 / 🔴 不正値 │
│  接続線 click → 詳細テーブル         │  │ [📋 問題行 AI 指示コピー]  │
└─────────────────────────────────────┘  └───────────────────────────┘
```

### GD-01 ガイド/ドキュメント (`/guide/:category`)

```
┌─ GD-01 ─────────────────────────────────────────────┐
│ ┌ SideNav ──────┐ ┌ コンテンツ (Markdown) ─────────┐ │
│ │ Troubleshoot  │ │ # Troubleshooting              │ │
│ │ Architecture  │ │ ... MarkdownRenderer 描画 ...   │ │
│ │ Onboarding    │ │                                │ │
│ │ Tutorial      │ │ [🔍 検索: Phase B]             │ │
│ │ CLI Reference │ │                                │ │
│ │ FAQ           │ │                                │ │
│ │ Changelog     │ │                                │ │
│ └───────────────┘ └────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

> **その他画面 (PM-02/04/05, HM-01/05/06/07/08)**: いずれも §1 共通骨格 (FilterBar + DataTable + StatusBadge + NextActionCard/CopyButton) の組み合わせで構成。固有部品は [ui-element.md §2](./ui-element.md) 参照。High-Fi が必要な画面のみ §3 方針で個別判断。

## §3 High-Fi モック方針 (PO 確定 2026-05-28、訂正 2 回反映)

| モック種別 | デフォルト | 別途オプション |
|----------|----------|--------------|
| **Low-Fi (ASCII art)** | **harness 内保持** (本 §1-§2) | — |
| **High-Fi (デザイン)** | 案件別判断 | (a) harness 内保持 (img/SVG 埋め込み) / (b) **外部依頼** (Figma/Excalidraw 等、許容オプション・強制でない) |

選択基準: 画面複雑度 / 設計レビュー深度 / PO の design tool 採用 / L10 で必要な詳細度。

### §3.1 外部依頼時の運用フロー (back-propagation 通常運用)

```
[L2 確定 input: screen-list/flow/ui-element + L1 15 画面要求]
  ↓ 確定状態で外部へ (input ブレ防止、PO 指示)
[外部 (Figma/Excalidraw/デザイナ)] → High-Fi モック
  ↓ 成果物が戻る
[harness 照合: screen-requirements.md §1 (15 画面) と突合]
  ↓ 不整合 → L1 screen/business/functional 修正 + G1-trace 再検証 (R1-R4)
[L10 UX refinement: 外部成果物 URL を参照欄に記載、最終 UX 確定]
```

> 「L2 で本来やる工程をある程度確定した状態で出す」(PO) が原則。確定なし外部依頼は手戻りを招く。

## §4 carry / 次工程

- 本 Low-Fi (§1-§2) が L2↔L10 の③ pair (self)。confirmed 昇格は G2 freeze (PLAN-L2-00 Step 4)。
- **High-Fi 所在**: ケース別 (harness 内 OR 外部依頼)。外部選択時は back-propagation を通常運用として想定 (G1-trace 再検証必須)。
- 下流: L10 UX refinement (High-Fi 判断 / デザイントークン実値 / a11y AA 実測) → src/web 実装 (Phase B)。
