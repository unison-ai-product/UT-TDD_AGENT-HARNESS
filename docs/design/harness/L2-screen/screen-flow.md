---
layer: L2
sub_doc: screen-flow
status: confirmed  # G2 freeze (PO サインオフ 2026-06-22、gate-design §2 G2=PASS)。本材料化 PLAN-L2-02。③ pair=wireframe self (L2↔L10)。
pair_artifact: docs/design/harness/L2-screen/wireframe.md  # mock が L2 設計群の③ペア (IMP-039/058)
parent_doc: docs/design/harness/L1-requirements/screen-requirements.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L10
plan: docs/plans/PLAN-L2-02-screen-flow.md
created: 2026-05-28
updated: 2026-06-22
---

# L2 画面遷移 (screen-flow)

> **SSoT 参照**: 遷移シナリオの正本は L1 [screen-requirements.md §2](../L1-requirements/screen-requirements.md) (6 パターン)。本 doc は各遷移に **trigger / 条件 / ステート保持 / auto 表示 / 戻る挙動** を L2 設計として付与する。画面 ID/URL は [screen-list.md](./screen-list.md) が正本。
> **drift 訂正 (2026-06-22)**: 旧 placeholder の遷移表は L1 §2 と乖離 (例: シナリオ 2/5/6) していた。本材料化は L1 §2 を正本に再構築。
> **V-pair (IMP-039/058)**: ③ ペアは `wireframe.md` (mock、右腕 L10)。

## §1 遷移シナリオ (L1 §2 正本、6 パターン)

```
S1 Forward 通常 (PM内):      PM-01 → PM-02 → PM-03 → PM-01
S2 Gate fail next_action:     PM-03 → HM-05 → GD-01 → PM-03   (PM↔HM↔GD 横断)
S3 Incident:                  PM-01 → HM-06 → HM-05 → PM-01   (PM↔HM 横断)
S4 セッション再開:            PM-05(auto) → PM-02 → PM-03 → PM-01
S5 弱点診断→改善起票:         HM-02 → HM-01 → GD-01          (HM↔GD 横断)
S6 Doctor 検出→Trace 修正:    HM-07 → PM-04 → PM-02 → HM-07   (HM↔PM 横断)
```

## §2 遷移エッジ詳細 (trigger / 条件 / ステート保持 / 戻る)

| from → to | trigger | 遷移条件 | 渡すステート | 戻る挙動 |
|---|---|---|---|---|
| PM-01 → PM-02 | 案件 × L フェーズ cell クリック | — | `:case` + `:L` (URL path) | browser back → PM-01 (filter 復元) |
| PM-02 → PM-03 | PLAN 行クリック (gate 結果詳細へ) | — | `:case` + 選択 PLAN (query) | breadcrumb PM-02 |
| PM-03 → PM-01 | pass → 工程表更新確認ボタン | gate pass | filter 引き継ぎ | — (S1 終端) |
| PM-03 → HM-05 | next_action「AI ログ/bypass 確認」リンク | gate fail | 対象 PLAN/gate id (query) | breadcrumb PM-03 |
| HM-05 → GD-01 | 「解決手順参照」リンク | — | troubleshooting category (`:category`) | browser back → HM-05 |
| GD-01 → PM-03 | 修正後「再判定」(deep-link) | — | 対象 gate id | — (S2 ループ) |
| PM-01 → HM-06 | 障害シグナル赤アラートクリック | incident signal 受信 | 対象 incident id | browser back → PM-01 |
| HM-06 → HM-05 | 「audit ログ確認」リンク | — | recovery 文脈 (query) | breadcrumb HM-06 |
| HM-05 → PM-01 | 「収束確認・mode 正常化」 | recovery 収束 | — | — (S3 終端) |
| PM-05 → PM-02 | next_action に従い工程確認 | handover に next_action あり | next_action target (`:case`/`:L`) | breadcrumb PM-05 |
| HM-02 → HM-01 | 弱点 cell → 該当 FR status 確認 | — | 対象 FR-L1 id (query filter) | browser back → HM-02 (cell 選択復元) |
| HM-01 → GD-01 | 「アーキ確認 / 起票候補」リンク | — | architecture category | browser back → HM-01 |
| HM-07 → PM-04 | エラー行 → trace 切れ確認 | doctor 検出あり | 対象 trace key (query) | breadcrumb HM-07 |
| PM-04 → PM-02 | trace ノード → 対象 sub-doc | — | `:case` + `:L` | breadcrumb PM-04 |
| PM-02 → HM-07 | 「doctor 再実行で収束確認」 | 修正後 | — | — (S6 ループ) |
| PM-02 → PM-06 | 「設計書プレビュー」リンク (sub-doc 行) | — | `:case` + layer/sub-doc (query) | breadcrumb PM-02 |
| PM-04 → PM-06 | trace ノード → 対象 doc 本文プレビュー | — | `:case` + 対象 doc path (query) | breadcrumb PM-04 |
| PM-06 → PM-04 | doc の「trace 確認」deep-link | — | 対象 trace key | breadcrumb PM-06 |

> **PM-06 supporting navigation**: PM-02/PM-04 ↔ PM-06 設計書ビューアは **PM 内 supporting deep-link** (L1 §7.2、設計書本文プレビュー目的)。L1 §2 の 6 コアシナリオには含めない (本質は別画面の補助参照)。PM-06 も read-only (S5=b、編集なし)。
> **trigger 種別**: 全 trigger は **クリック / リンク (read-only ナビゲーション)** または **auto 表示** に限る。副作用は持たない (S5=b: 実処理は CLI コマンド文字列コピー経由、UI 直接実行なし)。
> **S4 共有エッジ (L1 §2 シナリオ 4 の末尾)**: S4 は `PM-05→PM-02` の後、`PM-02→PM-03` (遷移条件: **前回中断 gate の状態確認**) → `PM-03→PM-01` (目的: **4 階層プルダウンで現在 phase 確認**) を S1 と同一エッジで辿る (上表の S1 行を再利用、遷移条件のみ S4 文脈で異なる)。

## §3 auto 表示要素

| 画面 | auto 表示 | 根拠 |
|---|---|---|
| PM-05 Handover | セッション起動時に auto 表示 (next_action を強調) | S6=a (L1 §3.2 の Handover auto 表示 option-key、= 採用。trigger = L1 §2 シナリオ 4。※ "S6" option-key は §2 シナリオ 6 とは別物) |
| PM-01 ダッシュボード | gate fail 案件を赤ハイライトで即時反映 | B8 ≤ 5 分 (screen §1.PM.01) |
| PM-03 Gate ビュー | fail 時に next_action を強調表示 | screen §1.PM.03 色分け必須 |

## §4 ステート保持・戻る挙動 (共通規約)

- **filter / sort / 階層選択** は URL query で保持 → browser back / breadcrumb で復元 ([screen-list.md §4](./screen-list.md) と整合)。
- **breadcrumb** = カテゴリ内遷移 (PM 内 / HM 内) の戻り経路。**browser back** = カテゴリ横断 deep-link の戻り経路。
- 横断 deep-link (PM↔HM↔GD) は元画面の filter 状態を保持し、戻ると元の表示に復帰する。

## §5 カテゴリ間 deep-link (PM ↔ HM ↔ GD)

L1 §2 の横断シナリオ (S2/S3/S5/S6) を deep-link として一般化:
- **PM → HM**: 案件文脈 (gate fail / incident / doctor 検出) から harness 全体ビューへ (`:case` を query で携行)。
- **HM → GD**: 診断結果から静的ガイド (troubleshooting / architecture) へ (`:category`)。
- **GD / HM → PM**: 修正後の再判定・収束確認で案件文脈へ復帰。
- **HM → PM (機能 ↔ 画面要求、PO 2026-06-22)**: **HM-01 機能一覧** の FR-L1 行から **PM-06 設計書ビューア** へ deep-link し、その FR の **対応画面要求** (screen §5 trace) と screen-requirements 本文をプレビュー。「画面要求を機能一覧からも辿れる」導線 (対象 FR-L1 id + screen doc path を query 携行、browser back で HM-01 復帰)。

## §6 L1↔L2 trace + 次工程

- 上流: L1 [screen-requirements.md §2](../L1-requirements/screen-requirements.md) 6 遷移シナリオ。
- L2 内: [screen-list.md](./screen-list.md) (ID/URL) → 本 screen-flow (遷移) → [ui-element.md](./ui-element.md) (部品) → [wireframe.md](./wireframe.md) (レイアウト = ③ pair)。
- 下流: L10 UX refinement → src/web 実装 (Phase B)。
