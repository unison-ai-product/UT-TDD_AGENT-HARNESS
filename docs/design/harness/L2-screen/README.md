---
layer: L2
doc_type: index
status: placeholder
parent_doc: docs/design/harness/L1-requirements/screen-requirements.md
created: 2026-05-28
updated: 2026-06-22
---

# L2 画面設計 sub-doc (harness)

L1 画面要求 (15 画面 PM/HM/GD) を L2 画面設計に詳細化する sub-doc 群。

> **materialization 状況 (2026-06-22)**: 4 sub-doc は PLAN-L2-00 master + PLAN-L2-01〜04 で content 本材料化済 (PM-06 設計書ビューア追加で 15 画面)。`status` は placeholder 維持 — confirmed 昇格は G2 freeze (PO サインオフ、gate-confirm IMP-079 遵守)。

> **Forward handling**: 本ディレクトリは L0→L3 時点では意図的な placeholder / carry。L3 は L1 screen §5 の trace を参照して AC / AT を確定し、L2 画面設計そのものは PLAN-L2-01〜04 起票時に本確定する。したがって L3 G3 判定では「L2 が存在しない漏れ」ではなく「L2 起票待ちの明示 carry」として扱う。

> **③ ペアの所在 (IMP-039)**: L2 の V-pair (右腕 L10) は **ワイヤーモック自体が ③ テスト設計を兼ねる** (requirements §1.4「L2: ワイヤーモック (mock がペア →L10)」)。したがって `docs/test-design/` に L10 用の独立 test-design doc は作成しない。L2⇔L10 の右腕 doc 不在は「欠落」ではなく設計意図であり、本 placeholder 確定後も mock が pair を担う。

## 構成 (4 sub-doc)

| sub-doc | 役割 | status | 必須/省略可 |
|---------|------|--------|-------------|
| `screen-list.md` | 画面 ID 一覧 (PM-01〜PM-06 / HM-01〜HM-08 / GD-01 = 15 件) | placeholder | **必須** (PLAN-L2-01 で本材料化済) |
| `screen-flow.md` | 画面遷移詳細 (6 シナリオ + 3 カテゴリ間 deep-link) | placeholder | **必須** (PLAN-L2-02 で本材料化済) |
| `ui-element.md` | 主要 UI コンポーネント (PM-01 4 階層プルダウン / HM-02 heat map / HM-03 動的配線 / HM-04 DB 整合性 / GD-01 サイドナビ / PM-06 設計書ツリー+プレビュー等) | placeholder | **必須** (PLAN-L2-03 で本材料化済) |
| `wireframe.md` | レイアウト・情報配置 (Low-Fi ASCII art デフォルト) | placeholder | **省略可** (Low-Fi デフォルト、High-Fi モックは **ケース別判断**: harness 内保持 OR 外部依頼のいずれか、PO 外部は許容オプションで必須ではない) |

## モック方針 (2026-05-28 PO 確定、PO 訂正反映 2 回)

ut-tdd harness の wireframe 運用は **柔軟方針 (ケース別判断)**:

| モック種別 | デフォルト | 別オプション |
|----------|----------|------------|
| **Low-Fi (ASCII art / 簡易図)** | harness 内に保持 (wireframe.md) | — |
| **High-Fi モック (デザイン)** | ケース別判断 | (a) harness 内保持 (img link / SVG 等) / (b) **外部依頼** (PO が Figma / Excalidraw / 外部デザイナ等に依頼) |

選択基準 (PLAN-L2-04 本起票時 or L10 着手時に決定):
- 画面の複雑度 / 設計レビュー深度
- PO の design tool 採用状況
- L10 UX refinement で必要な詳細度

> **外部依頼は許容するが必須ではない**。harness 内に High-Fi を保持する選択も可。「**必ず外部にはならない**」(PO 訂正 2026-05-28)。

### 外部依頼時の運用 (PO 追加指示 2026-05-28)

外部依頼を選択する場合:
1. **L2 確定が前提**: 画面要求 + UI 要素を確定した状態で外部に input を渡す (「L2 で本来やる工程をある程度確定した状態で出す」PO 指示)
2. **外部成果物を harness 側でレビュー**: L1 画面要求と照合
3. **要件修正 back-propagation の可能性**: モックと要件に不整合あれば L1 screen / business / functional 修正 → G1-trace 再検証
4. **L10 UX refinement で参照**: 外部成果物 URL を参照欄に記載

詳細は `wireframe.md` 参照。

## L1 ↔ L2 接続

- 上流: L1 画面要求 sub-doc (`docs/design/harness/L1-requirements/screen-requirements.md` 15 画面 + 4 横断原則 + 3 カテゴリ Bounded Context)
- 下流: PLAN-L2-01〜04 で本起票 (L1 G1 凍結後、L3 機能要件 sub-doc 起票と並行 or 後続で実施)

## G1-trace との関係

L1 段階で G1-trace 機械検証 R1-R4 通過済 (business ⇔ 画面要求 ⇔ 機能要求 双方向 trace 整合確認)。L2 起票時は L1 sub-doc の trace を継承維持する。

## 採番規約

- 旧 SCR-NN 体系廃止
- 新採番: **PM-NN** (Project Management、6 件) / **HM-NN** (Harness Management、8 件) / **GD-NN** (Guide & Docs、1 件)
- 計 15 画面 (PO 承認 2026-05-28 (14 件) + 2026-06-22 PM-06 設計書ビューア追加)
