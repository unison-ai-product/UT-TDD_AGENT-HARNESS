---
layer: L2
doc_type: index
status: placeholder
parent_doc: docs/design/harness/L1-requirements/screen-requirements.md
created: 2026-05-28
---

# L2 画面設計 sub-doc (harness)

L1 画面要求 (14 画面 PM/HM/GD) を L2 画面設計に詳細化する sub-doc 群。

## 構成 (4 sub-doc)

| sub-doc | 役割 | status | 必須/省略可 |
|---------|------|--------|-------------|
| `screen-list.md` | 画面 ID 一覧 (PM-01〜PM-05 / HM-01〜HM-08 / GD-01 = 14 件) | placeholder | **必須** (L2 着手時に PLAN-L2-01 で本起票) |
| `screen-flow.md` | 画面遷移詳細 (6 シナリオ + 3 カテゴリ間 deep-link) | placeholder | **必須** (PLAN-L2-02 で本起票) |
| `ui-element.md` | 主要 UI コンポーネント (PM-01 4 階層プルダウン / HM-02 heat map / HM-03 動的配線 / HM-04 DB 整合性 / GD-01 サイドナビ等) | placeholder | **必須** (PLAN-L2-04 で本起票) |
| `wireframe.md` | レイアウト・情報配置 (Low-Fi ASCII art で構造表示) | placeholder | **省略可** (PO 外部吸収方針、High-Fi モックは PO 側で別途用意) |

## モック吸収方針 (2026-05-28 PO 指示確定)

> **wireframe (High-Fi モック) は PO 外部吸収**: ut-tdd harness では wireframe.md は **Low-Fi (ASCII art / 簡易図) のみ**保持し、**High-Fi モックは PO が外部ツール (Figma / Excalidraw / 紙資料等) で別途用意**する。harness 内部での High-Fi モック保存・管理は責務範囲外。
>
> 理由:
> - モック制作は専門ツールを使う方が効率的
> - harness 内部の markdown ベース管理では High-Fi モック表現に限界
> - PO 側で deisgn review プロセスを別途持つ前提
>
> L10 UX refinement 工程で High-Fi モック確定が必要な場合も、PO 提供の外部成果物を参照する形で進める。

## L1 ↔ L2 接続

- 上流: L1 画面要求 sub-doc (`docs/design/harness/L1-requirements/screen-requirements.md` 14 画面 + 4 横断原則 + 3 カテゴリ Bounded Context)
- 下流: PLAN-L2-01〜04 で本起票 (L1 G1 凍結後、L3 機能要件 sub-doc 起票と並行 or 後続で実施)

## G1-trace との関係

L1 段階で G1-trace 機械検証 R1-R4 通過済 (business ⇔ 画面要求 ⇔ 機能要求 双方向 trace 整合確認)。L2 起票時は L1 sub-doc の trace を継承維持する。

## 採番規約

- 旧 SCR-NN 体系廃止
- 新採番: **PM-NN** (Project Management、5 件) / **HM-NN** (Harness Management、8 件) / **GD-NN** (Guide & Docs、1 件)
- 計 14 画面 (PO 承認済 2026-05-28、A-33〜A-37)
