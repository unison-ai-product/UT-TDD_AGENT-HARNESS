---
layer: L2
sub_doc: screen-list
status: placeholder
pair_artifact: docs/design/harness/L2-screen/wireframe.md  # mock が L2 設計群の③ペア (IMP-039/058)
parent_doc: docs/design/harness/L1-requirements/screen-requirements.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L10
created: 2026-05-28
---

# L2 画面一覧 (screen-list) — placeholder

> **status**: placeholder。L2 着手時に PLAN-L2-01-screen-list で本起票する。
> **必須実施**: drive=be (UI を持つ) のため画面要求 3 sub-doc は必須 (L1 §3.7 / A-37 参照)。

## 上流 baton (L1 画面要求から)

L1 で確定した 14 画面 (PM 5 + HM 8 + GD 1) を L2 で詳細化:

| 画面 ID | 画面名 | 主要目的 | L1 参照 |
|---------|--------|---------|---------|
| PM-01 | プロジェクト俯瞰ダッシュボード | 4 階層プルダウン (俯瞰/工程/割当/詳細) | screen §1.PM.01 |
| PM-02 | 工程ビュー (L0-L14 共通テンプレート) | 進捗・担当・詰まり 3 軸 | screen §1.PM.02 |
| PM-03 | Gate + 詰まり要因ビュー | gate + トラブル横断 | screen §1.PM.03 |
| PM-04 | Trace ビュー (4 artifact + V-pair 統合) | 整合性 | screen §1.PM.04 |
| PM-05 | Handover ビュー | セッション継続 (起動時 auto) | screen §1.PM.05 |
| HM-01 | 機能一覧ビュー | FR-L1 現行 46 件 × implementation_status | screen §1.HM.01 |
| HM-02 | カバレッジヒートマップビュー | 観点 8 × 軸 5 = 40 通り | screen §1.HM.02 |
| HM-03 | 配線図ビュー (動的) | エラー赤表示 | screen §1.HM.03 |
| HM-04 | データベース閲覧ビュー (整合性チェック) | state 検査 | screen §1.HM.04 |
| HM-05 | Audit / 実行ログビュー | AI ログ + skill 注入タブ | screen §1.HM.05 |
| HM-06 | Recovery ビュー | CLI ロールバックコピー | screen §1.HM.06 |
| HM-07 | Doctor 結果ビュー | doctor 全量検出 | screen §1.HM.07 |
| HM-08 | AI 効果データ + Learning Engine ビュー | BR-21 連動 (L3 carry) | screen §1.HM.08 |
| GD-01 | ガイド/ドキュメント統合ビュー | 7 カテゴリ左サイドナビ | screen §1.GD.01 |

## L2 で確定すべき項目 (本起票時)

- 各画面の URL 設計 (PM-NN: `/project/<案件>/...` / HM-NN: `/harness/...` / GD-NN: `/guide/<category>`)
- 画面 ID と URL の 1:1 対応
- 認証・認可 (PM 全画面: PO + 運用者 / HM 全画面: 運用者主 / GD: 全ペルソナ)
- ステート保持要件 (各画面の filter / sort / 表示位置の永続化)

## carry / 次工程

- **L2 PLAN-L2-01 で本起票**: 本 placeholder を本起票で置換
- pair: L9 結合テスト or L10 UX refinement (本起票時に確定)
