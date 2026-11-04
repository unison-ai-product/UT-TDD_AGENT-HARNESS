---
title: "L7 design split family test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/design-split-family.md
status: confirmed
updated: 2026-11-04
issue: 1530
---

# 設計文書の分割家族 テスト設計 (issue #1530)

## 1. 位置付け

`docs/design/harness/L6-function-design/design-split-family.md` の契約を検証する oracle 候補である。凍結後に正式 ID (`U-SPLITFAM-NNN`) へ昇格する。

## 2. fixture

- すべて一時ディレクトリに組む。実 repo は読まない。
- 一時ディレクトリの `docs/design/L2-screen/` に入口、`docs/design/L2-screen/sub/` に子を置く。test-design 側は `docs/test-design/` に置く。
- 入口は `pair_artifact` と `status` を持つ。子は `split_of: docs/design/L2-screen/<入口>.md` の 1 行だけを持つ。
- 例外: 015 は層をまたぐ入力が要るので、`docs/design/L4-x/` と `docs/design/L5-y/` に入口と子を置く。

## 3. oracle 候補

| ID | 対象 | 入力・期待・反例 |
|---|---|---|
| `CANDIDATE-U-SPLITFAM-001` | split-orphan | 入力: 深さ 2 の `.md` が `split_of` を持たない。期待: `analyzePairFreeze` が `split-orphan` を返し `ok: false`。反例: `README.md` / `roadmap.md` は深さ 2 でも違反にならない |
| `CANDIDATE-U-SPLITFAM-002` | split-target-invalid (不在) | 入力: `split_of` が実在しない path。期待: `split-target-invalid`。反例: 実在する入口を指す子は違反 0 件 |
| `CANDIDATE-U-SPLITFAM-003` | split-target-invalid (別層) | 入力: `split_of` が別の層ディレクトリ (L3 など) の入口を指す。期待: `split-target-invalid` |
| `CANDIDATE-U-SPLITFAM-004` | split-target-invalid (入口でない) | 入力: `split_of` が (a) 別の子、(b) 自分自身、(c) 層ディレクトリ外の文書を指す。期待: 3 件とも `split-target-invalid`。鎖 (子が子を指す) も同じ |
| `CANDIDATE-U-SPLITFAM-005` | split-child-doc-type | 入力: 子が `doc_type_id: DOC-L2-SCREEN` を持つ。期待: `split-child-doc-type`。反例: `doc_type_id` を持たない子は違反 0 件 |
| `CANDIDATE-U-SPLITFAM-006` | 子は pair 検査の対象外 | 入力: `split_of` が正しく `pair_artifact` を持たない子。期待: `pair-missing` / `ref-unresolved` / `trace-orphan` を返さない。`isDesignSubDoc` は `false` |
| `CANDIDATE-U-SPLITFAM-007` | 子は層の件数に入らない | 入力: 入口 1 本 (`confirmed`) と、違反の無い子 2 本 (`status: draft` を書いておく)。期待: `analyzeLayerPairGate` の total が 1、confirmed が 1、draft が 0 (`src/gate/static.ts`)。`analyzeVerificationGroups` の L2 を含む群の total / confirmed / draft も同じで、`hasOrphan` は false。件数だけを見る oracle であり、違反の伝播は 014 が見る |
| `CANDIDATE-U-SPLITFAM-008` | L2 画面 ID の抽出 | 入力: `DOC-L2-SCREEN` の入口と子 2 本。入口・子 A・子 B はそれぞれ自分の「第4章 画面一覧」と画面 ID 表を持ち、ID は入口 `SCR-E`、子 A `SCR-A`、子 B `SCR-B`。期待: `l2ScreenIds` が `{SCR-E, SCR-A, SCR-B}` を含む (入口と全子の和集合)。この期待は、入口と子の本文を連結して今の抽出を 1 回だけ当てる誤実装 (最初の節と表しか読まず `SCR-E` だけになる) を落とす。反例: `split_of` を持たない子、`split_of` が無効な子 (002〜004 の形) の表の ID は含まない |
| `CANDIDATE-U-SPLITFAM-009` | L3 本文の束ね | 入力: `functional-requirements.md` (入口) と、要件 ID を書いたその子。期待: `g11L3Texts` / `g12L3HeadingIds` が子の ID を含む |
| `CANDIDATE-U-SPLITFAM-010` | 入口の削除 | 入力: 入口を消し、子が残る。期待: 子が `split-target-invalid`。pair 検査は入口の不在を別に報告する |
| `CANDIDATE-U-SPLITFAM-011` | 子の削除 | 入力: 008 の fixture から子 B を消す。期待: 残る子 A は違反 0 件。`l2ScreenIds` は `{SCR-E, SCR-A}` を含み `SCR-B` を含まない (消した子の ID だけが消え、残った子と入口の ID は残る)。反例: 入口側に子の一覧は無いので、削除は入口の違反にならない |
| `CANDIDATE-U-SPLITFAM-012` | test-design 側の dir 集合参照 | 入力: test-design の `pair_artifact` が `docs/design/L2-screen/` (dir 集合)、入口が test-design を `pair_artifact` で指す。期待: サブフォルダに子があっても入口の trace-bidir は成立する (変更なしの確認) |
| `CANDIDATE-U-SPLITFAM-013` | サブフォルダ 0 本の回帰 | 入力: サブフォルダを持たない fixture (本体と同じ形)。期待: `analyzePairFreeze` / `analyzeLayerPairGate` / `analyzeVerificationGroups` の出力 (orphans・pairs・件数) が、本変更の前後で同一 |
| `CANDIDATE-U-SPLITFAM-014` | 子の違反の伝播 | 入力: `confirmed` の入口 1 本と、違反した子 1 本。違反は (a) `split-orphan`、(b) `split-target-invalid` (不在の path を指す)、(c) `split-child-doc-type` の 3 通りで、それぞれ別の fixture にする。期待: 3 通りとも (1) `analyzePairFreeze` が子の path の孤児を返して `ok: false`、(2) `analyzeLayerPairGate` の L2 が `ok: false` で orphan paths に子の path を含む、(3) `analyzeVerificationGroups` の `L0-L3` / `L0-L6` / `L0-L7` がすべて `hasOrphan: true`、`frozen: false`。`L4-L6` は影響を受けない。この期待は、群の文書 (入口) の path に一致する孤児だけを見る誤実装 (子を件数から外した結果、`frozen: true` になる) を落とす。反例: 同じ fixture で子を正しい形に直すと、(2) の orphan paths と (3) の `hasOrphan` から子が消える |
| `CANDIDATE-U-SPLITFAM-015` | `pairLayerIds` の家族単位の収集 | 入力: `docs/design/L4-x/` の入口と、`split_of` がその入口を指す子 (本文に太字 ID `**BD-101**`)。さらに次の 3 本の子を置き、それぞれ別の太字 ID を書く: (a) 別層: `docs/design/L5-y/sub/` の子で、`split_of` が L5 の入口を指す (`**FD-201**`)、(b) 別家族: `docs/design/L4-x/sub/` に置いた子で、`split_of` が L5 の入口を指す (`**FD-202**`、`split-target-invalid`)、(c) 無効な `split_of`: `docs/design/L4-x/sub/` の子で、`split_of` を持たないもの (`**BD-301**`) と別の子を指すもの (`**BD-302**`)。検査は `pairLayerIds` を使う trace 判定 (`evaluateRightArmStaticGate`) 経由か、`pairLayerIds` を直接呼んで行う。期待: `pairLayers` が `[L4]` のとき `BD-101` を受理し、`FD-201` / `FD-202` / `BD-301` / `BD-302` を受理しない。`pairLayers` が `[L5]` のとき `FD-201` を受理し、`BD-101` と `FD-202` を受理しない。この期待は、`pairLayerIds` を変えない実装 (子の ID を落とす) と、`split_of` だけで家族を引いて層を確かめない実装 (`FD-202` を L5 で受理する) を落とす |

## 4. 範囲外

consumer への配布 (#1531)、`fmValue` の複数行対応は扱わない。
