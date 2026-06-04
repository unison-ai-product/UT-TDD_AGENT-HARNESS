---
layer: L2
sub_doc: ui-element
status: placeholder
pair_artifact: docs/design/harness/L2-screen/wireframe.md  # mock が L2 設計群の③ペア (IMP-039/058)
parent_doc: docs/design/harness/L1-requirements/screen-requirements.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L10
created: 2026-05-28
---

# L2 UI 要素 (ui-element) — placeholder

> **status**: placeholder。L2 着手時に PLAN-L2-04-ui-element で本起票する。
> **必須実施**: drive=be (UI を持つ) のため必須 (L1 §3.7 / A-37 参照)。

## 上流 baton (L1 §1 全画面操作要素 + §3 横断要望)

各画面で確定する主要 UI コンポーネント (placeholder):

| 画面 ID | 必要 UI コンポーネント (主要) |
|---------|---------------------------|
| PM-01 | 4 階層プルダウン (Expandable Section)、ヒートマップ Cell、フィルタ Dropdown |
| PM-02 | 工程テンプレート (L0-L14 共通)、進捗バー、stale バッジ、carry リスト |
| PM-03 | next_action コピーボタン、トラブル一覧テーブル、色分けバッジ (緑/黄/赤) |
| PM-04 | trace グラフ (ノード + エッジ)、V-pair 状態テーブル |
| PM-05 | CURRENT.json 表示 (構造化)、carry 詳細リスト、stale 警告バナー |
| HM-01 | 3 階層プルダウン、FR-L1 行 (implementation_status バッジ) |
| HM-02 | 観点 × 軸 切替セレクタ、Heat map (40 cell) |
| HM-03 | 動的配線図 (SVG)、エラー赤表示、接続線詳細テーブル |
| HM-04 | Table エクスプローラ、整合性チェック結果サマリ |
| HM-05 | invocation_log テーブル、skill 注入タブ |
| HM-06 | recovery_log テーブル、CLI コマンドコピーボタン |
| HM-07 | doctor 結果ツリー、重要度別バッジ |
| HM-08 | KPI ダッシュボード、recipe リスト (L3 carry) |
| GD-01 | 左サイドナビ (7 カテゴリ)、全文検索ボックス、Markdown レンダラ |

## 横断 UI コンポーネント (4 横断原則対応)

| 原則 | UI コンポーネント |
|------|----------------|
| **詳細データテーブル必須** (CC3) | Table コンポーネント (全画面共通、ソート/フィルタ可能) |
| **AI 指示テキスト copy-paste** (CC2) | CopyButton コンポーネント (全画面で AI 指示テキスト生成) |
| **問題箇所視覚化** | StatusBadge (🟢/🟡/🔴)、ErrorHighlight |
| **next_action 明示** (UX-03) | NextActionCard (gate fail / handover / Recovery で目立つ位置) |

## L2 で確定すべき項目 (本起票時)

- 各 UI コンポーネントの props / state / event 仕様
- デザイントークン (色 / 余白 / フォント、ただし dark mode は省略、light のみ)
- アクセシビリティ (WCAG 2.1 AA 意識、Q32)
- responsive (Desktop 専用、S9=a、モバイル除外)

## carry / 次工程

- **L2 PLAN-L2-04 で本起票**: 本 placeholder を本起票で置換
- High-Fi モック (wireframe.md High-Fi 版) は **ケース別判断** (harness 内保持 OR 外部依頼)、外部依頼は許容オプションで必須ではない (詳細は `wireframe.md` 参照)
