---
layer: L2
sub_doc: wireframe
status: placeholder
default_policy: low-fi-in-harness
high_fi_policy: case-by-case (harness 内保持 OR 外部依頼のいずれか、ケース別判断)
pair_artifact: self  # wireframe mock 自体が L2⇔L10 の③ペア (L10 独立 doc 不要、IMP-039/058)。vmodel-lint は self を孤児扱いしない
parent_doc: docs/design/harness/L1-requirements/screen-requirements.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L10
created: 2026-05-28
---

# L2 ワイヤーフレーム (wireframe) — placeholder

> **status**: placeholder。L2 着手時に PLAN-L2-03-wireframe で本起票する。
> **PO 訂正 2026-05-28**: 「必ず外部にはならないからな」— High-Fi モックの所在は **ケース別判断**、外部依頼は許容オプションであり強制ではない
> **concept §3.7 整合**: drive=be (UI を持つ) では wireframe Low-Fi デフォルト、High-Fi は柔軟運用

## モック方針 (PO 確定 2026-05-28、PO 訂正反映 2 回)

ut-tdd harness の wireframe 運用は以下の柔軟方針:

| モック種別 | デフォルト | 別途オプション |
|----------|----------|--------------|
| **Low-Fi (ASCII art / 簡易図)** | **harness 内に保持** (本ファイル) | — |
| **High-Fi モック (デザイン)** | 案件別判断 | (a) harness 内保持 (本ファイルに img link / SVG 埋め込み等) / (b) **外部依頼** (PO が Figma / Excalidraw 等の外部デザイナ / ツールに依頼) |

選択基準 (PLAN-L2-03 本起票時に決定):
- 画面の複雑度 / 設計レビュー深度
- PO の design tool 採用状況
- L10 UX refinement で必要な詳細度

> **外部依頼は許容するが必須ではない**。harness 内に High-Fi を保持する選択も可。「**必ず外部にはならない**」(PO 訂正 2026-05-28)。

## 外部依頼時の運用フロー (PO 追加指示 2026-05-28)

外部依頼を選択する場合の運用:

```
[L2 確定 input]
  画面要求 (screen-list / screen-flow / ui-element) + L1 14 画面要求
  ↓ 外部依頼の input として固定 (確定状態で出す)
[外部 (PO 依頼)]
  Figma / Excalidraw / 外部デザイナ等で High-Fi モック作成
  ↓ 成果物が戻る
[harness 側レビュー]
  戻ってきたモックを screen-requirements.md §1 (14 画面) と照合
  ↓
[要件修正 back-propagation 判定]
  ・モックと L1 画面要求に不整合 → L1 screen-requirements.md / business / functional 修正
  ・要件側の追加・変更 → G1-trace 再検証 (R1-R4)
  ・凍結後の修正は handover + carry 経由で記録
  ↓
[L10 UX refinement へ]
  外部成果物 URL を参照欄に記載、最終 UX 確定
```

> **重要**: 「L2 で本来やる工程をある程度確定した状態で出す」(PO 指示) のが原則。確定なしの外部依頼は input ブレで成果物の手戻りを招く。外部成果物が戻った後の **要件修正 back-propagation は通常運用** として想定する。

## L10 UX refinement との関係

High-Fi モック確定が必要な場合 (例: L10 UX refinement 工程)、案件別に以下のいずれかで進める:
- **harness 内保持**: 本 sub-doc に img link / SVG / 添付参照で High-Fi 保存
- **外部依頼**: PO 提供の外部成果物 (Figma URL / Excalidraw 等) を参照欄に記載 + **要件 back-propagation 工程を経由**

どちらを採るかは PLAN-L2-03 本起票時 or L10 着手時に PO + TL で判断。

## carry / 次工程

- **L2 PLAN-L2-03 で本起票**: status を `placeholder` から本起票 status (e.g. `low-fi-only` / `low-fi-plus-high-fi-internal` / `low-fi-plus-high-fi-external`) に確定
- **High-Fi モック所在**: ケース別。外部依頼は許容オプション (必須ではない)
- **外部依頼選択時の back-propagation**: L1 screen / business / functional への要件修正が入る可能性。G1-trace 再検証必須

## 必要時の Low-Fi 例 (本起票時に追記、参考)

例: PM-01 4 階層プルダウン (Low-Fi ASCII art)

```
┌─ PM-01 ─────────────────────────────┐
│ ▼ 俯瞰: 案件×L0-L14 heat map        │
│  PLAN-DISCOVERY-01 ✅✅✅🔄❌⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ │
│  PLAN-RECOVERY-01 ✅✅🔄⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ │
│ ▼ 工程: L3 (選択中)                  │
│ ▼ 割当: 担当負荷 / AI スロット使用    │
│ ▼ 詳細: PLAN-DISCOVERY-01 × L3 詳細           │
└────────────────────────────────────┘
```

L2 PLAN-L2-03 本起票時、必要に応じて主要画面 (PM-01 / HM-02 / HM-03 / HM-04 / GD-01) の Low-Fi を本ファイルに追記する。それ以上の詳細 (High-Fi) は外部依頼または harness 内保持を案件別に選択する (上節「L10 UX refinement との関係」参照)。
