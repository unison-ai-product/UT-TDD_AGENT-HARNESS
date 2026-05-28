---
layer: L2
sub_doc: wireframe
status: skip-with-external-absorption
skip_reason: "High-Fi モックは PO 外部吸収 (Figma / Excalidraw 等で別途用意)、harness 内では Low-Fi ASCII art のみ"
pair_artifact: (TBD)
parent_doc: docs/design/harness/L1-requirements/screen-requirements.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L10
created: 2026-05-28
---

# L2 ワイヤーフレーム (wireframe) — PO 外部吸収方針

> **status**: skip-with-external-absorption (省略 + 外部吸収)
> **skip 根拠**: 2026-05-28 PO 指示「L2 のフォルダ作っておいてこっちでモック吸収する」
> **concept §3.7 整合**: drive=be (UI を持つ) では wireframe (High-Fi モック) のみ省略可

## モック吸収方針 (PO 確定 2026-05-28)

ut-tdd harness では本 sub-doc は **High-Fi モックを保持しない**。

| モック種別 | 担当 | 保管場所 |
|----------|------|---------|
| **Low-Fi (ASCII art / 簡易図)** | harness 側 (本 sub-doc に必要に応じ追記) | 本ファイル |
| **High-Fi モック (デザイン)** | **PO 外部吸収** | PO 管理 (Figma / Excalidraw / 紙資料等) |

理由:
1. モック制作は専門ツールを使う方が効率的
2. harness 内部の markdown ベース管理では High-Fi モック表現に限界
3. PO 側で design review プロセスを別途持つ前提

## 必要時の Low-Fi 例 (本起票時に追記、参考)

例: PM-01 4 階層プルダウン (Low-Fi ASCII art)

```
┌─ PM-01 ─────────────────────────────┐
│ ▼ 俯瞰: 案件×L0-L14 heat map        │
│   PLAN-001 ✅✅✅🔄❌⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ │
│   PLAN-002 ✅✅🔄⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ │
│ ▼ 工程: L3 (選択中)                  │
│ ▼ 割当: 担当負荷 / AI スロット使用    │
│ ▼ 詳細: PLAN-001 × L3 詳細            │
└────────────────────────────────────┘
```

L2 PLAN-L2-03 本起票時、必要に応じて主要画面 (PM-01 / HM-02 / HM-03 / HM-04 / GD-01) の Low-Fi を本ファイルに追記する。それ以上の詳細 (High-Fi) は PO 外部吸収。

## L10 UX refinement との関係

High-Fi モック確定が必要な場合 (例: L10 UX refinement 工程)、**PO 提供の外部成果物を参照**する形で進める。本 sub-doc に High-Fi モックを保存しない。

## carry / 次工程

- **L2 PLAN-L2-03 起票**: status を `skip-with-external-absorption` で本起票 (placeholder 状態維持、L2 必須 sub-doc 3 件のみ本起票)
- **PO 外部モック参照リンク**: PLAN-L10 (UX refinement) 起票時に PO 提供の外部 URL を参照欄に記載
