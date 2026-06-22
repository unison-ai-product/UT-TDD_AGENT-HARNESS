---
layer: L2
sub_doc: ui-element
status: confirmed  # G2 freeze (PO サインオフ 2026-06-22、gate-design §2 G2=PASS)。本材料化 PLAN-L2-03。③ pair=wireframe self (L2↔L10)。
pair_artifact: docs/design/harness/L2-screen/wireframe.md  # mock が L2 設計群の③ペア (IMP-039/058)
parent_doc: docs/design/harness/L1-requirements/screen-requirements.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L10
plan: docs/plans/PLAN-L2-03-ui-element.md
created: 2026-05-28
updated: 2026-06-22
---

# L2 UI 要素 (ui-element)

> **SSoT 参照**: 各画面の情報要素・操作要素の正本は L1 [screen-requirements.md §1](../L1-requirements/screen-requirements.md) (15 画面詳細) + §3 横断原則 (CC2/CC3)。画面 ID/URL は [screen-list.md](./screen-list.md)、遷移は [screen-flow.md](./screen-flow.md) が正本。本 doc は L1 の操作/情報要素を **再利用可能な UI コンポーネント** に分解し、props / state / event 契約を L2 設計として確定する。用語独自定義は行わない (anti-corruption layer)。
> **V-pair (IMP-039/058)**: ③ ペアは `wireframe.md` (mock、右腕 L10)。`next_pair_freeze: L10`。
> **実装状態**: 全コンポーネントは not-implemented (NFR-08、src/web は Phase B)。
> **スコープ制約**: light モードのみ (Q30)、日本語固定 (Q31)、Desktop 専用 (S9=a)、30 秒ポーリング (S2=b、WebSocket 不使用)、UI 直接実行禁止 = CLI コマンド文字列コピーのみ (S5=b / CC2)。

## §1 共通 UI コンポーネント catalog (全画面横断)

L1 §3.1 横断原則 (CC2/CC3) を満たす再利用部品。全画面がこの catalog から組み立てる。

| コンポーネント | 役割 | 主要 props | state | event | 根拠 |
|---|---|---|---|---|---|
| **DataTable** | raw data 粒度の詳細テーブル (サマリのみ禁止) | `columns[]` / `rows[]` / `sortable` / `filterable` | sort 列・方向 / filter 条件 (URL query 同期) | `onRowClick(rowId)` → 遷移 / `onSort` / `onFilter` | CC3 詳細データテーブル必須 |
| **StatusBadge** | 正常/警告/失敗の即視認 | `level: 'ok'\|'warn'\|'error'\|'empty'\|'loading'` / `label` | — (純表示) | — | CC3 問題箇所視覚化 (緑/黄/赤) |
| **CopyButton** | AI 指示テキスト / CLI コマンド文字列のワンクリックコピー | `text` (生成済文字列) / `label` | copied (一時 feedback) | `onCopy()` → clipboard 書込のみ (副作用 API なし) | CC2 / S5=b (UI 直接実行禁止) |
| **NextActionCard** | gate fail / handover / Recovery で「次にすること」を 1 アクション強調 | `action` / `targetUrl` / `emphasis` | — | `onNavigate(targetUrl)` (read-only 遷移) | UX-03 next_action 明示 |
| **FilterBar** | mode/phase/status/drive 絞り込み (URL query 同期) | `facets[]` / `value` | filter 値 (URL query) | `onChange(filter)` | BR-06 / screen §3.2 フィルタリング |
| **Breadcrumb** | カテゴリ内 (PM 内/HM 内) 戻り経路 | `trail[]` | — | `onNavigate` | screen-flow §4 戻る挙動 |
| **PollingIndicator** | 最終更新時刻 + 30 秒ポーリング状態 | `intervalSec` (30 default) / `lastUpdated` | tick / lastUpdated (client local) | `onManualRefresh()` | S2=b / B8 ≤5 分 |
| **MarkdownRenderer** | 静的 doc / 設計書本文 / CLI 出力一貫文言の描画 (見出し/表/リスト/コード) | `source` | — | 内部/外部リンク `onLinkClick` | GD-01 / PM-06 / UX-03 CLI 一貫 |
| **MermaidRenderer** | Mermaid code-fence をダイアグラム描画 (ER 図/フロー等) | `code` | render error fallback | — | PM-06 (設計書 Mermaid) |
| **YamlFrontmatterView** | YAML frontmatter を構造化キー値表示 | `frontmatter` | 折りたたみ | `onKeyClick` (該当箇所) | PM-06 (設計書 frontmatter) |

> **共通契約 (S5=b / CC2)**: 全コンポーネントは **read-only**。`CopyButton` の clipboard 書込以外に副作用を持たない。AI への作用は生成テキストを人間が CLI に貼る経路のみ (S-01 = AI は CLI 経由、UI 操作なし)。
> **状態種別の標準 5 値**: `ok(緑) / warn(黄) / error(赤) / empty(灰) / loading`。L1 各画面「状態種別」を `StatusBadge.level` に正規化 (screen §1 各画面表と整合)。

## §2 画面別 主要コンポーネント (L1 §1 情報要素/操作要素から分解)

各画面で確定する固有 (非共通) コンポーネント。共通 catalog (§1) は全画面で暗黙利用。

### §2.PM PM 画面群

| 画面 | 固有コンポーネント | props / 振る舞い | L1 参照 |
|---|---|---|---|
| **PM-01** | `HierarchyPulldown` (4 階層: 俯瞰/工程/割当/詳細) + `HeatmapGrid` (案件×L0-L14、cell クリックで PM-02) | tier (URL query 同期) / cells[]・`onCellClick(:case,:L)` / gate fail cell 赤ハイライト | §1.PM.01 |
| **PM-02** | `LayerTemplate` (L0-L14 共通工程テンプレ) + `ProgressBar` + `StaleBadge` + `CarryList` + `ScrumStateRow` (drive=scrum S0-S4) | sub-doc 一覧 / stale PLAN / carry 件数展開 / S-phase 1 行表示 (L3 carry) | §1.PM.02 |
| **PM-03** | `GateResultPanel` (pass/fail/bypass 色分け) + `TroubleTable` (種別/検出時刻/影響範囲/next_action 横断) + `InterruptCopyButton` (`ut-tdd interrupt`/`resume` 文字列コピー) | gate ID/証跡リンク/サインオフ者 / `CopyButton`(next_action・AI 指示) / interrupt は CLI 受付 (S5=b) | §1.PM.03 |
| **PM-04** | `TraceGraph` (上流→下流ノード+エッジ、デグレ赤ハイライト) + `VPairStatusTable` (L1↔L14…L6↔L7 freeze 状態) | ノードクリック→対象 doc / trace 切れ・未 freeze 行を DataTable | §1.PM.04 |
| **PM-05** | `HandoverPanel` (CURRENT.json 構造化表示) + `StaleWarningBanner` (30 日超) + `CarryDetailList` | next_action 強調 / 起動時 auto 表示 (S6=a) / archive 期限表示 | §1.PM.05 |
| **PM-06** | `DesignDocTree` (L0-L14 layer×sub-doc、status/pair-freeze バッジ) + `DocPreview` (`MarkdownRenderer` 本文 + `YamlFrontmatterView` + `MermaidRenderer` + ASCII 図) + `DocToc` (目次) | ツリーノードクリック→プレビュー / layer・status・drive フィルタ / 目次ジャンプ / 内部リンクナビ / PM-04 trace deep-link / `CopyButton`(doc パス) / read-only (S5=b、編集なし) | §1.PM.06 |

### §2.HM HM 画面群

| 画面 | 固有コンポーネント | props / 振る舞い | L1 参照 |
|---|---|---|---|
| **HM-01** | `HierarchyPulldown` (3 階層: 整備率/カテゴリ/FR 個別) + `FrStatusTable` (FR-L1 47 件 × implementation_status バッジ + **対応画面列** screen §5 trace) | installed/partial/not-implemented バッジ + 担当 PLAN + 対応画面 / FR 行 → 担当 PLAN 参照 / **FR 行 → PM-06 設計書ビューア deep-link (対応画面要求プレビュー、機能一覧から画面要求を辿る、PO 2026-06-22)** / 未実装エクスポート | §1.HM.01 |
| **HM-02** | `CoverageHeatmap` (観点 8 × 軸 5 = 40 cell、色密度) + `AxisSelector` (観点/軸切替) | cell クリック→不足項目一覧 + 起票候補テキスト生成 (`CopyButton`) | §1.HM.02 |
| **HM-03** | `WiringDiagram` (SVG 静的アーキ + 動的エラー赤) + `ConnectionDetailTable` (起点/終点/状態/最終チェック) + `ModeTransitionArrows` (detection-routing 4 象限→mode、L3 carry) | hook/provider/9 drive 区画状態 / active 遷移強調 / 接続線クリック→詳細 | §1.HM.03 |
| **HM-04** | `TableExplorer` (.ut-tdd state 全 table 切替) + `IntegrityCheckSummary` (orphan/drift/不正値) | table 切替 / 行フィルタ / 整合性再実行トリガー / 問題行 `CopyButton` | §1.HM.04 |
| **HM-05** | `InvocationLogTable` (date/model/role/task/result/token/cost) + `SkillInjectionTab` (S8=b) + `HookFireLogTab` (5 hook 発火成否、L3 carry) + `GuardDecisionList` (allow/block/bypass) | フィルタ(日付/agent/result) / タブ切替 / bypass 詳細展開 | §1.HM.05 |
| **HM-06** | `RecoveryLogTable` + `ResumePointList` (最終正常 gate 候補) + `RollbackCopyButton` (CLI ロールバック文字列、S5=b) | 暴走ログ/認識訂正履歴 / CLI コピーのみ (UI 直接実行なし) | §1.HM.06 |
| **HM-07** | `DoctorResultTree` (V-model 順序/entity/hook/phase/carry) + `SeverityBadge` (error/warn/info) + `DetectionCountSummary` | 重要度別全行 / 詳細展開 / doctor 再実行トリガー / 問題行 `CopyButton` (D-03 = 0 件違反 赤) | §1.HM.07 |
| **HM-08** | `KpiDashboard` (skill/model 評価・task 成功率・コスト効率) + `RecipeList` (L3 carry) | skill/model フィルタ / recipe 詳細展開 / 詳細テーブル仕様は L3 確定 | §1.HM.08 |

### §2.GD GD 画面群

| 画面 | 固有コンポーネント | props / 振る舞い | L1 参照 |
|---|---|---|---|
| **GD-01** | `SideNav` (7 カテゴリ: Troubleshooting/Architecture/Onboarding/Tutorial/CLI Reference/FAQ/Changelog) + `MarkdownRenderer` (§1 共通) + `SearchBox` (Phase B) | `:category` 切替 (URL path) / 内部・外部リンク / 404 表示 / 検索は Phase B | §1.GD.01 |

## §3 デザイントークン (light モードのみ、Q30)

> dark mode は MVP scope 外 (Q30、Phase B 持ち越し)。本節は light のみ定義。具体値 (hex/px) の High-Fi 確定は L10 UX refinement へ委譲。

| トークン群 | 用途 | L2 確定方針 |
|---|---|---|
| **状態色** (緑/黄/赤/灰) | StatusBadge / cell ハイライト / gate 色分け (CC3) | ok=緑 / warn=黄 / error=赤 / empty=灰。WCAG AA コントラスト比を満たす値域を L10 で確定 |
| **余白・グリッド** | DataTable 行高・カラム padding / レイアウト gutter | Desktop 基準 (S9=a)。密度高 = raw data 表示 (CC3) を優先 |
| **タイポグラフィ** | 日本語固定 (Q31)。等幅は CLI 出力・コード・ASCII 図 | 本文 = 可読日本語フォント / コード/CLI = 等幅 (UX-03 CLI 一貫) |
| **強調** | NextActionCard / gate fail / active 遷移 | 色 + ウェイトで強調 (色のみに依存しない、a11y §4) |

## §4 アクセシビリティ (WCAG 2.1 AA 意識、Q32)

> 強制ではないが設計時に意識 (Q32)。critical 操作の keyboard 対応を最低限とする。

- **色のみに依存しない**: StatusBadge は色 + アイコン/ラベル併記 (緑🟢/黄🟡/赤🔴 + text)。色覚特性に配慮 (CC3 視覚化を色のみで成立させない)。
- **キーボード操作**: critical 操作 (`CopyButton` / 遷移 / FilterBar / HeatmapGrid cell) は Tab フォーカス + Enter/Space 実行可能 (最低限要件)。
- **コントラスト**: 状態色・本文は AA コントラスト比目標 (具体値は L10)。
- **フォーカス可視**: フォーカスリングを維持 (Desktop keyboard 利用者向け)。

## §5 responsive (Desktop 専用、S9=a)

- **対象**: Desktop ブラウザ専用 (Windows/macOS/Linux ネイティブ、NFR-01)。モバイル/タブレット最適化は scope 外 (S9=a、PO 承認 2026-05-28)。
- **方針**: 固定 min-width を前提とした Desktop レイアウト。`HeatmapGrid` / `WiringDiagram` / `TraceGraph` 等の高密度コンポーネントは横スクロール許容で raw data 粒度 (CC3) を優先。

## §6 L1↔L2 trace + 次工程

- 上流: L1 [screen-requirements.md §1](../L1-requirements/screen-requirements.md) (各画面 情報要素/操作要素) + §3.1 横断原則 (CC2/CC3) + §3.2 採用済み要望。
- L2 内: [screen-list.md](./screen-list.md) (ID/URL) → [screen-flow.md](./screen-flow.md) (遷移) → 本 ui-element (部品) → [wireframe.md](./wireframe.md) (レイアウト = ③ pair)。
- 下流: L10 UX refinement (デザイントークン High-Fi 確定 / a11y AA 実値 / High-Fi モック) → src/web 実装 (Phase B)。
- pair: `wireframe.md` (mock = ③ test design、L2↔L10 右腕)。
