---
layer: L10
status: draft
parent_doc: docs/design/harness/L2-screen/ui-element.md
pair_artifact: docs/design/harness/L2-screen/wireframe.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
plan: docs/plans/PLAN-L7-141-web-dashboard-component-derived.md
token_ssot: docs/design/harness/L10-ux/tokens.yaml
created: 2026-06-24
updated: 2026-06-24
---

# L10 UX refinement — 中央 UI High-Fi 設計 (component-derived)

> **SSoT 参照**: 画面 15 件と情報/操作要素の正本は L1 [screen-requirements.md](../L1-requirements/screen-requirements.md)、
> 画面 ID/URL は L2 [screen-list.md](../L2-screen/screen-list.md)、UI 部品契約 (props/state/event) は
> L2 [ui-element.md](../L2-screen/ui-element.md)、Low-Fi レイアウトは L2 [wireframe.md](../L2-screen/wireframe.md)、
> デザイントークン具体値は [tokens.yaml](./tokens.yaml) が正本。本 doc は L2 で確定済の部品契約を
> **High-Fi (具体トークン + a11y 実値 + 状態網羅 + 操作仕様)** に昇格させるのみで、新規部品・新規画面・
> 用語独自定義は行わない (anti-corruption layer)。
>
> **V-pair (IMP-039/058)**: L2↔L10 の③ pair は wireframe (self-pair)。本 doc は test-design ではなく
> **L10 forward 成果物 (FR-30: visual design / token SSOT / a11y / visual regression)**。L10 は L1-L6 外の
> ため `vmodel-pair-freeze` (L1-L6 scope) の検査対象外。`docs/test-design/` に独立 doc は作らない。
>
> **status = draft の意味**: 本 doc は authored + cross-review 済の「設計降下完遂」状態。`confirmed` 昇格は
> **G10 (UX 磨き完了) の PO サインオフ**で行う (L2 が G2 で confirmed になったのと同じ gate 規律)。
> G10 の機械検証は本版では概念定義 (requirements §6.8 line 833、L8-L14 は将来 PLAN)。
>
> **スコープ制約 (L2 から継承)**: light のみ (Q30) / 日本語固定 (Q31) / Desktop 専用 (S9=a) /
> 30 秒ポーリング (S2=b、WebSocket 不使用) / 全画面 read-only + CLI コマンド文字列コピーのみ (S5=b / CC2 / S-01)。

## §1 L10 の役割 (FR-30) と入出力

L10 = **UX 磨き** (requirements §1.4)。L2 の Low-Fi mock + 部品契約を、実装が一意に解釈できる High-Fi
設計へ昇格させる。L7-102 prototype は L2 部品から降ろさず harness.db を汎用 `SELECT` 描画する
table-dumper だったため破棄された ([[feedback_central_ui_kouteihyou_mission_not_coverage]])。本 doc は
**全画面を L2 ui-element §2 部品の合成として確定** し、table-dumper への逆戻りを設計レベルで塞ぐ。

| FR-30 項目 | 入力 | 本 doc / tokens.yaml での確定 |
|---|---|---|
| visual design | L2 wireframe + ui-element 部品 | §3 (トークン適用) + §4 (部品 High-Fi) + §5 (画面合成) |
| デザイントークン SSOT | トークン候補 (L2 §3 方針) | [tokens.yaml](./tokens.yaml) (具体 hex/px) |
| a11y チェック | WCAG 2.2 AA (IMP-020) | §3.4 (a11y 実値 + 受入基準) |
| ビジュアル回帰 | — | §6 (component-level snapshot 方針) |

> **段階順 (V-model)**: `L2 設計+Low-Fi mock → 本 L10 (High-Fi/UX) → src/web 実装 (PLAN-L7-141 Step 2-4)`。
> 本 doc 確定が L7-141 Step 1 (L10 到達) を満たす。実装は本 doc を出典に component-derived で行う。

## §2 設計原則 (High-Fi 昇格の不変条件)

1. **トークン唯一出典**: 色/寸法/タイポは [tokens.yaml](./tokens.yaml) のみを参照。画面/部品にハードコード値を置かない。
2. **状態網羅**: 全データ表示部品は標準 5 状態 (`ok/warn/error/empty/loading`、L2 ui-element §1) を必ず描く。
   `empty` (0 件) と `loading` を省略しない (table-dumper は empty を空表で誤魔化した)。
3. **色のみ非依存 (§3.4)**: 状態は「色 + アイコン + ラベル」の 3 重符号化。色覚特性で意味が落ちない。
4. **read-only + CLI コピー (S5=b)**: 副作用 UI を持たない。操作は遷移 (read-only) と `CopyButton` の
   clipboard 書込のみ。Recovery/interrupt/rollback も CLI 文字列コピーに限定。
5. **raw data 粒度 (CC3)**: サマリのみ禁止。`DataTable` は明細行を出す。高密度 (`size.table.rowHeight=28`)。
6. **mission で測る**: 完遂は工程管理表 (mission) で測る。描画数/implemented flip の coverage で名乗らない
   ([[feedback_coverage_not_substance]])。

## §3 トークン High-Fi 確定 (L2 ui-element §3-§4 の deferred を解決)

L2 ui-element §3 は「具体値 (hex/px) の High-Fi 確定は L10 へ委譲」、§4 は「コントラスト具体値は L10」と
明記した。本節がそれを [tokens.yaml](./tokens.yaml) で確定し、適用規約を定める。

### §3.1 状態色 (CC3 視覚化)

| 状態 | token (fg / bg) | アイコン (色のみ非依存) | 用途 |
|---|---|---|---|
| ok | `color.status.ok.fg #1A7F37` / `.bg #DAFBE1` | check-circle (🟢/✓) | 正常 gate / pass / installed |
| warn | `color.status.warn.fg #9A6700` / `.bg #FFF8C5` | alert (🟡/△) | DEFER / partial / stale / a11y warn |
| error | `color.status.error.fg #CF222E` / `.bg #FFEBE9` | x-circle (🔴/✕) | gate fail / orphan / 不正値 / デグレ |
| empty | `color.status.empty.fg #57606A` / `.bg #EFF2F5` | dash (⬜/—) | 0 件 / 未作成 / not-implemented |
| loading | `color.status.loading.fg #57606A` + spinner | sync (🔄) | ポーリング取得中 |

### §3.2 余白・グリッド (Desktop 高密度)

- 最小幅 `size.layout.minWidth 1024`、gutter `size.layout.gutter 16`。
- `DataTable` 行高 `size.table.rowHeight 28` / cell padding `8x / 6y`。raw data 多数行を 1 画面に詰める (CC3)。
- 高密度コンポーネント (`HeatmapGrid` / `CoverageHeatmap` / `WiringDiagram` / `TraceGraph`) は
  `contentMaxWidth none` + 横スクロール許容 (L2 ui-element §5、raw data 粒度優先)。

### §3.3 タイポグラフィ

- 本文 = `type.font.body` (日本語フォントスタック)、`fontSize.body 14`、`lineHeight.body 1.5`。
- CLI 出力 / コード / frontmatter / ASCII 図 = `type.font.mono`、`fontSize.code 13` (UX-03 CLI 一貫)。
- 強調 = `weight.bold 600` + accent 色 (色のみ非依存)。

### §3.4 アクセシビリティ実値 (WCAG 2.2 AA、IMP-020)

L2 ui-element §4 (WCAG 2.1 AA 意識) を **WCAG 2.2 AA** へ更新 (IMP-020 = L10 で WCAG 2.2 / ISO 9241-110
reference 追記)。**oracle 注 (I-3)**: FR-30 AC-FR-30-03 の Given は現状 WCAG 2.1 AA。本 §3.4 の 2.2 適用に合わせ、
G10 a11y script 実装時に AC-FR-30-03 を **WCAG 2.2 AA へ更新**する (新 SC 2.4.11 Focus Appearance / 2.5.8
Target Size を含む)。この oracle 更新は §7 governance carry に列挙 (確定は後継 PLAN の AC)。

| 観点 | 実値 / 規約 | WCAG 2.2 SC |
|---|---|---|
| コントラスト (通常テキスト) | `fg.default`/`fg.muted`/状態 `fg` は背景に対し `contrast_target >= 4.5:1` | 1.4.3 |
| コントラスト (UI/ボーダー) | `border.default`/`control` の境界は `>= 3:1` | 1.4.11 |
| 色のみ非依存 | 状態 = 色 + アイコン + ラベル (§3.1) | 1.4.1 |
| キーボード操作 | critical 操作 (`CopyButton` / 遷移リンク / `FilterBar` / `HeatmapGrid` cell / プルダウン) は Tab フォーカス + Enter/Space 実行可 | 2.1.1 |
| フォーカス可視 | `focus.ring` (2px solid accent, offset 2) を全 focusable に維持 | 2.4.7 / 2.4.11 |
| ターゲットサイズ | 操作要素 `size.control.minTarget >= 24x24` CSS px | 2.5.8 |

> **受入基準 (AC-FR-30-03 整合)**: a11y チェックは **warn を block しない**。warn は集約レポート化し、
> next_action = 「critical 操作の keyboard 対応優先」。コントラスト実比の検証は FR-30 の a11y script が
> 実装時 (Phase B) に実レンダリングで行う (本節の `contrast_target` は設計目標、宣言でなく機械実測で確認)。

## §4 部品 High-Fi 仕様 (L2 ui-element §1/§2 を component-derived で昇格)

各部品は L2 で確定した props/state/event 契約を変えず、見た目 (トークン適用) と状態網羅・操作仕様のみを
High-Fi 化する。

### §4.1 共通 10 部品 (L2 ui-element §1 catalog)

| 部品 | High-Fi 仕様 (トークン適用 + 状態 + 操作) |
|---|---|
| **DataTable** | 行高 `size.table.rowHeight`、zebra = `canvas.subtle`、罫線 `border.default`。状態列は §4.2 `StatusBadge`。sort 列ヘッダに方向アイコン + `aria-sort`。filter は URL query 同期。状態網羅: rows>0 / empty (「該当 0 件」+ dash) / loading (skeleton 行 + spinner) / error (取得失敗バナー)。行クリック→遷移は keyboard Enter 同等。 |
| **StatusBadge** | `level` → §3.1 の fg/bg/icon の 3 重符号化。純表示 (event 無し)。`aria-label` に状態語。 |
| **CopyButton** | `accent` 枠 + コピーアイコン。click/Enter で clipboard 書込のみ (副作用 API 無し、S5=b)。copied 時 1.5s `ok` チェック feedback + `aria-live=polite`「コピーしました」。`minTarget 24`。 |
| **NextActionCard** | `accent.subtle` 面 + `accent.fg` 左ボーダー (4px) + bold 見出し「次にすること」。1 アクション強調。`onNavigate` は read-only 遷移。emphasis=high で gate fail 文脈は `danger.emphasis` ボーダーに切替。 |
| **FilterBar** | facet プルダウン群 (`control.height 28`)。値は URL query 同期。各 facet は keyboard 操作可、選択中は `accent.subtle`。 |
| **Breadcrumb** | `fg.muted` trail + `>` 区切り。最終要素は `fg.default` (現在地、非リンク)。カテゴリ内 (PM 内/HM 内) 戻り。 |
| **PollingIndicator** | `motion.pollIntervalSec 30` 周期 + 最終更新時刻 (`fg.muted`、相対表記)。tick 中は loading アイコン。`onManualRefresh` ボタン。`prefers-reduced-motion` で spinner→静的。 |
| **MarkdownRenderer** | 見出し/表/リスト/コード (`type.font.mono`/`canvas.inset`) を本文トークンで描画。内部/外部リンク区別 (外部は icon)。`onLinkClick` は read-only 遷移。 |
| **MermaidRenderer** | code-fence をダイアグラム描画。render error 時は `error` バナー + 元コードを `mono` で fallback 表示 (描画失敗を握り潰さない)。 |
| **YamlFrontmatterView** | frontmatter を構造化キー値表示。折りたたみ可。`onKeyClick` で該当 §へジャンプ。 |

### §4.2 画面固有部品 (L2 ui-element §2 を High-Fi 化)

各固有部品は L2 ui-element §2 の props/振る舞いを継承。以下は High-Fi の核 (トークン + 状態 + 操作)。

- **`HierarchyPulldown`** (PM-01 4 階層 / HM-01 3 階層): タブ状プルダウン。選択 tier は `accent.subtle` + bold、
  URL query 同期。keyboard ←/→ で tier 移動。
- **`HeatmapGrid`** (PM-01 案件×L0-L14): cell = §3.1 状態色 + glyph (🟢🟡🔴🔄⬜)。gate fail cell は
  `error` + 行ハイライト。cell クリック/Enter → PM-02 (`:case,:L`)。横スクロール許容。空案件は empty 行。
- **`LayerTemplate`** (PM-02 L0-L14 共通工程テンプレ) + `ProgressBar`/`StaleBadge`/`CarryList`/`ScrumStateRow`:
  工程テンプレを縦に。`ProgressBar` は `ok/accent` 進捗。`StaleBadge` は `warn` (30 日超は error)。carry 件数は
  展開可。S-phase 行は drive=scrum 時のみ。
- **`GateResultPanel`** (PM-03): gate ごとに pass=`ok`/fail=`error`/bypass=`warn` の色 + アイコン + サインオフ者 +
  証跡リンク。`TroubleTable` は種別/検出時刻/影響範囲/next_action を `DataTable` で横断表示、行に
  next_action `CopyButton`。`InterruptCopyButton` は `ut-tdd interrupt`/`resume` 文字列コピー (S5=b、UI 実行なし)。
- **`TraceGraph`** (PM-04): 上流→下流ノード + エッジ。デグレ/trace 切れエッジは `error` 赤強調。ノードクリック→
  対象 doc。`VPairStatusTable` は 6 pair (L1↔L14…L6↔L7) の freeze 状態を `DataTable` + `StatusBadge`。
- **`HandoverPanel`** (PM-05): CURRENT.json を構造化表示。`StaleWarningBanner` は 30 日超で `warn`。next_action 強調
  (`NextActionCard`)。起動時 auto 表示 (S6=a)。
- **`DesignDocTree`** + `DocPreview` (PM-06): L0-L14 layer×sub-doc ツリー、各ノードに status/pair-freeze
  `StatusBadge`。プレビューは `MarkdownRenderer` + `YamlFrontmatterView` + `MermaidRenderer` + ASCII。
  ツリー keyboard ↑/↓/→展開。doc パス `CopyButton`。PM-04 trace deep-link。read-only (編集なし、S5=b)。
- **`FrStatusTable`** (HM-01): FR-L1 47 件 × `StatusBadge` (installed=ok/partial=warn/not-implemented=empty) +
  担当 PLAN + 対応画面列。FR 行 → 担当 PLAN 参照 / FR 行 → PM-06 設計書ビューア deep-link。
- **`CoverageHeatmap`** + `AxisSelector` (HM-02): 観点 8 × 軸 5 = 40 cell、色密度 (`ok→error` の連続)。
  cell クリック → 不足項目一覧 + 起票候補テキスト `CopyButton`。横スクロール許容。
- **`WiringDiagram`** + `ConnectionDetailTable` + `ModeTransitionArrows` (HM-03): SVG 静的アーキ + 動的エラー
  エッジ `error` 赤。接続線クリック → 詳細テーブル。active 遷移は `accent` 強調 (色 + ウェイト)。
- **`TableExplorer`** + `IntegrityCheckSummary` (HM-04): .ut-tdd state 全 table 切替 + raw 行。orphan=`warn`/
  不正値=`error`。問題行 `CopyButton` (AI 指示文字列)。**整合性再実行は S5=b により UI 直接実行せず
  `ut-tdd doctor` / `ut-tdd review` 文字列の `CopyButton`** (L2 §2「整合性再実行トリガー」の High-Fi 確定
  = CLI コピー変換、副作用 API を持たない)。
- **`InvocationLogTable`** + tab 群 (HM-05): date/model/role/task/result/token/cost を `DataTable`。
  `SkillInjectionTab`/`HookFireLogTab`/`GuardDecisionList` をタブ切替。result/bypass を `StatusBadge`。
- **`RecoveryLogTable`** + `ResumePointList` + `RollbackCopyButton` (HM-06): 暴走/認識訂正ログ。CLI ロールバック
  文字列 `CopyButton` のみ (UI 直接実行なし、S5=b)。
- **`DoctorResultTree`** + `SeverityBadge` + `DetectionCountSummary` (HM-07): V-model 順/entity/hook/phase/carry を
  ツリー化。`SeverityBadge` = `StatusBadge` の **alias** (severity `error→error` / `warn→warn` / `info→中立`
  (`fg.muted` + info アイコン)、追加 props 不要、§3.1 の 3 重符号化を共有)。D-03 = 0 件違反は `error`。問題行
  `CopyButton`。**doctor 再実行は S5=b により UI 直接実行せず `ut-tdd doctor` 文字列の `CopyButton`**
  (L2 §2「doctor 再実行トリガー」の High-Fi 確定 = CLI コピー変換)。
- **`KpiDashboard`** + `RecipeList` (HM-08): skill/model 評価・task 成功率・コスト効率。指標の `ok/warn/error`
  表示は `StatusBadge` (詳細テーブル仕様の一部は L3 carry、確定時に追記)。`DataTable` + フィルタ。
- **`SideNav`** + `SearchBox` (GD-01): 7 カテゴリ左ナビ (`:category` URL path 切替)。`MarkdownRenderer` 本文。
  404 は `empty`。検索は Phase B。

## §5 15 画面の component-derived 構成 (table-dumper 不在の確認)

各画面 = §4.1 共通部品 + §4.2 固有部品の合成。汎用 table dumper は存在しない (L7-141 AC「15 画面が
ui-element §2 部品から構成され、table-dumper 描画が無い」を設計で担保)。共通骨格は L2 wireframe §1
(トップナビ + Breadcrumb + FilterBar + 主コンテンツ + NextActionCard/CopyButton)。

| 画面 | 固有部品 (§4.2) | 共通部品 (§4.1) |
|---|---|---|
| PM-01 | HierarchyPulldown + HeatmapGrid | FilterBar, StatusBadge, PollingIndicator |
| PM-02 | LayerTemplate + ProgressBar + StaleBadge + CarryList + ScrumStateRow | DataTable, Breadcrumb |
| PM-03 | GateResultPanel + TroubleTable + InterruptCopyButton | DataTable, CopyButton, NextActionCard, StatusBadge |
| PM-04 | TraceGraph + VPairStatusTable | DataTable, StatusBadge |
| PM-05 | HandoverPanel + StaleWarningBanner + CarryDetailList | NextActionCard, CopyButton |
| PM-06 | DesignDocTree + DocPreview + DocToc | MarkdownRenderer, YamlFrontmatterView, MermaidRenderer, CopyButton |
| HM-01 | HierarchyPulldown + FrStatusTable | DataTable, StatusBadge, FilterBar |
| HM-02 | CoverageHeatmap + AxisSelector | StatusBadge, CopyButton |
| HM-03 | WiringDiagram + ConnectionDetailTable + ModeTransitionArrows | DataTable, StatusBadge |
| HM-04 | TableExplorer + IntegrityCheckSummary | DataTable, CopyButton, StatusBadge |
| HM-05 | InvocationLogTable + SkillInjectionTab + HookFireLogTab + GuardDecisionList | DataTable, FilterBar, StatusBadge |
| HM-06 | RecoveryLogTable + ResumePointList + RollbackCopyButton | DataTable, CopyButton |
| HM-07 | DoctorResultTree + SeverityBadge + DetectionCountSummary | StatusBadge, CopyButton |
| HM-08 | KpiDashboard + RecipeList | DataTable, FilterBar, StatusBadge |
| GD-01 | SideNav + SearchBox | MarkdownRenderer |

> 全 15 画面が L2 ui-element §2 の固有部品を必ず 1 つ以上持つ = 汎用テーブル 1 枚で画面を代替できない構造。
> これが table-dumper への逆戻り (L7-102 の失敗) を設計で塞ぐ ([[feedback_central_ui_kouteihyou_mission_not_coverage]])。

## §6 ビジュアル回帰 方針 (FR-30 出力)

- 単位 = **部品** (§4)。画面全体 snapshot でなく部品 × 状態 (5 値) の matrix snapshot を基本にする
  (table-dumper 化を防ぎ、状態網羅を回帰で担保)。
- **最小 matrix (M-4)**: §4.1 共通 10 部品 × 5 状態 (`ok/warn/error/empty/loading`)。§4.2 固有部品のうち状態
  ベクトルを持つもの — `HeatmapGrid` cell / `CoverageHeatmap` cell / `WiringDiagram` エッジ / `TraceGraph` エッジ /
  `DoctorResultTree` severity / `GateResultPanel` gate — × 関連状態を追加対象とする (Phase B 実装前の粒度)。
- 環境 = Desktop 固定幅 (`size.layout.minWidth`)・light 固定 (Q30)・日本語固定 (Q31)。
- 実装 = Phase B (PLAN-L7-141 Step 3 の tests)。本 doc は回帰の **対象と粒度** を定める設計まで
  (実装は段階順に従い L10 確定後)。

## §7 trace + 次工程

- **上流**: L1 [screen-requirements.md](../L1-requirements/screen-requirements.md) (15 画面) +
  L2 [screen-list](../L2-screen/screen-list.md)/[screen-flow](../L2-screen/screen-flow.md)/[ui-element](../L2-screen/ui-element.md)/[wireframe](../L2-screen/wireframe.md) (G2 freeze 済) + FR-30 (FR-L1-30)。
- **pair**: wireframe (L2↔L10 self-pair、IMP-039/058)。本 doc は forward L10 成果物 (test-design ではない)。
- **下流**: src/web 実装 (PLAN-L7-141 Step 2-4) が本 doc + [tokens.yaml](./tokens.yaml) を唯一出典に
  component-derived で実装。`screen-impl-pair-freeze` gate が premature な implemented flip を fail-close。
- **次 gate**: G10 (UX 磨き完了) の PO サインオフ → 本 doc `confirmed` 昇格 → 実装着手。
- **governance carry (PO 可視化)**:
  1. L8-L14 の PLAN-layer 機械 governance (kind×layer、roadmap band の個別登録) は本版で未整備
     (requirements §6.8 line 833、`kind=design` は L1-L6 限定)。本 L10 設計降下は既存の central-UI PLAN
     ([PLAN-L7-141](../../../plans/PLAN-L7-141-web-dashboard-component-derived.md)) 配下に記録した。L10 を
     第一級 PLAN layer にするかは別途 harness 拡張 (PO 判断)。
  2. **AC-FR-30-03 の WCAG 版更新 (§3.4 I-3)**: 本 §3.4 が WCAG 2.2 AA を採るのに対し FR-30 AC-FR-30-03 の
     Given は 2.1 AA。G10 a11y script 実装時に AC を 2.2 AA へ更新する (後継 PLAN の AC、Reverse back-prop)。
