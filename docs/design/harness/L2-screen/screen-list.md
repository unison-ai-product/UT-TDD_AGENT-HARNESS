---
layer: L2
sub_doc: screen-list
status: confirmed  # G2 freeze (PO サインオフ 2026-06-22、gate-design §2 G2=PASS)。本材料化 PLAN-L2-01 (15 画面)。③ pair=wireframe self (L2↔L10)。
pair_artifact: docs/design/harness/L2-screen/wireframe.md  # mock が L2 設計群の③ペア (IMP-039/058)
parent_doc: docs/design/harness/L1-requirements/screen-requirements.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L10
plan: docs/plans/PLAN-L2-01-screen-list.md
implemented_screens: ""  # 実装未確定 (再起票 PLAN-L7-141): L7-102 の src/web prototype は ui-element §2 設計部品 (HierarchyPulldown/HeatmapGrid/LayerTemplate 等) 未適合の table-dumper だったため 2026-06-24 に破棄 (L7-102 archived)。L10 High-Fi/UX → component-derived 実装 まで全 15 画面 not-implemented。premature flip は screen-impl-pair-freeze gate が fail-close。
created: 2026-05-28
updated: 2026-06-24
---

## PLAN-L7-102 Review Back-Fill: 404 Path Safety

404 ページに表示する URL path は通常画面と同じ `escapeHtml` 経路を通す。未知 path はユーザー入力扱いとし、HTML として解釈しない。

# L2 画面一覧 (screen-list)

> **SSoT 参照**: 画面要求 (15 画面 PM/HM/GD) の正本は L1 [screen-requirements.md](../L1-requirements/screen-requirements.md)。本 doc は L1 で確定した画面群に **L2 設計確定項目 (URL 設計 / ID↔URL 1:1 / 認証認可 / ステート保持)** を付与する。用語独自定義は行わない (anti-corruption layer)。
> **V-pair (IMP-039/058)**: 本 doc の ③ ペアは `wireframe.md` (mock、右腕 L10)。`next_pair_freeze: L10`。
> **実装状態 (PLAN-L7-108 訂正)**: 現段階は **L2 設計 freeze 済 + Low-Fi mock (wireframe) 確定** まで。`src/web` は ui-element §2 設計部品 (HierarchyPulldown / HeatmapGrid / LayerTemplate / TraceGraph 等) に**未適合の prototype** であり、**実装完了ではない** (全 15 画面 not-implemented)。V-model 段階順は `L2 設計+mock → L10 High-Fi/UX refinement → src/web 設計適合実装 (Phase B)`。この段階で実装完了を宣言しないことを `screen-impl-pair-freeze` gate が fail-close で担保する (PLAN-L7-102 の「Phase B 実装済」claim は段階順違反で誤り、訂正)。中央 server 同期 (VPS / GitHub webhook) は ADR-005 D2 で direction-only・auth-gated ゆえ別途。
> **配置 (ADR-005 D2)**: 中央・全 project 横断の team 管理 UI。GitHub project repo を data backbone とし、Phase A local dashboard が bootstrap。

## §1 画面一覧 (15 画面 = PM 6 + HM 8 + GD 1)

3 カテゴリ Bounded Context (DDD): **PM** (Project Management、案件遂行・毎日) / **HM** (Harness Management、harness 改善・必要時) / **GD** (Guide & Docs、静的参照)。

| 画面 ID | 画面名 | カテゴリ | URL | L1 参照 |
|---|---|---|---|---|
| PM-01 | プロジェクト俯瞰ダッシュボード | PM | `/projects` | screen §1.PM.01 |
| PM-02 | 工程ビュー | PM | `/project/:case/layer/:L` | screen §1.PM.02 |
| PM-03 | Gate + 詰まり要因ビュー | PM | `/project/:case/gates` | screen §1.PM.03 |
| PM-04 | Trace ビュー | PM | `/project/:case/trace` | screen §1.PM.04 |
| PM-05 | Handover ビュー | PM | `/project/:case/handover` | screen §1.PM.05 |
| PM-06 | 設計書ビューア | PM | `/project/:case/designs` | screen §1.PM.06 |
| HM-01 | 機能一覧ビュー | HM | `/harness/features` | screen §1.HM.01 |
| HM-02 | カバレッジヒートマップビュー | HM | `/harness/coverage` | screen §1.HM.02 |
| HM-03 | 配線図ビュー | HM | `/harness/wiring` | screen §1.HM.03 |
| HM-04 | データベース閲覧ビュー | HM | `/harness/db` | screen §1.HM.04 |
| HM-05 | Audit / 実行ログビュー | HM | `/harness/audit` | screen §1.HM.05 |
| HM-06 | Recovery ビュー | HM | `/harness/recovery` | screen §1.HM.06 |
| HM-07 | Doctor 結果ビュー | HM | `/harness/doctor` | screen §1.HM.07 |
| HM-08 | AI 効果データ + Learning Engine ビュー | HM | `/harness/learning` | screen §1.HM.08 |
| GD-01 | ガイド/ドキュメント統合ビュー | GD | `/guide/:category` (7 カテゴリ左サイドナビ) | screen §1.GD.01 |

## §2 URL 設計規約

- **ID↔URL は 1:1**。逆引き可能 (URL から画面 ID を一意決定、deep-link / handover next_action から直接到達)。
- **path パターン**: PM 系 = `/project/:case/...` (案件スコープ) + 俯瞰のみ `/projects` (全案件横断) / HM 系 = `/harness/...` (harness 全体スコープ、案件非依存) / GD 系 = `/guide/:category`。
- **状態は query string**: filter/階層選択/tab は `?filter=&tier=&tab=` で URL に載せ、共有 (共有用画面の核) と browser back を成立させる。
- **deep-link 起点**: PM-03 の next_action / PM-05 handover の next_action は対象画面の絶対 URL を生成 (画面 ID → URL 規約で機械生成)。

## §3 認証・認可 (ペルソナ × カテゴリ)

| カテゴリ | 閲覧可ペルソナ | 操作可 | 根拠 |
|---|---|---|---|
| PM (6) | PO + 運用者 (HM) | 表示・遷移・CLI テキストコピーのみ (UI 直接実行禁止 S5=b)。PM-06 設計書ビューアも read-only プレビュー (編集なし) | screen CC2 人間主導 + AI 補助 |
| HM (8) | 運用者主 (PO も可) | 同上 (Recovery/interrupt も CLI コマンド文字列コピーのみ、発動は CLI 受付) | screen §1.HM / S5=b |
| GD (1) | 全ペルソナ | 参照のみ (静的) | screen §1.GD |

> **UI 直接実行禁止 (S5=b 整合)**: 全画面は read-only + CLI コマンド文字列のワンクリックコピーに限る。AI は CLI 経由のみ、UI 操作なし (S-01)。認可は閲覧スコープのみで副作用 API を持たない。

## §4 ステート保持要件

| 保持対象 | スコープ | 永続先 |
|---|---|---|
| filter / sort / 階層選択 / tab | 画面単位 | URL query string (共有・back 対応) |
| 表示位置 (scroll) | 遷移内 | session (遷移時保持、screen-flow §戻る挙動と整合) |
| ポーリング間隔 / 最終更新時刻 | 全画面共通 | client local (30 秒 default、S2=b)。共有不要の UX 設定ゆえ URL query でなく client local (PM-01 4 階層プルダウンは query で共有) |
| 選択中の案件 (case) | PM カテゴリ横断 | URL path (`:case`) |

## §5 L1↔L2 trace + 次工程

- 上流: L1 [screen-requirements.md](../L1-requirements/screen-requirements.md) §1 (15 画面) + §2 (遷移) + 4 横断原則 (CC1-CC4) + G1-trace R1-R4 通過済。
- L2 内連携: 本 screen-list (ID/URL/認可/state) → [screen-flow.md](./screen-flow.md) (遷移) → [ui-element.md](./ui-element.md) (UI 部品) → [wireframe.md](./wireframe.md) (レイアウト = ③ pair)。
- 下流: L10 UX refinement (High-Fi 判断) → src/web 実装 (Phase B)。
- pair: `wireframe.md` (mock = ③ test design、L2↔L10 右腕)。
