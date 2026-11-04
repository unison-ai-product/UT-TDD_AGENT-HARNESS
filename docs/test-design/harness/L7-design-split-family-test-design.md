---
title: "L7 design split family test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/design-split-family.md
status: draft
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

## 3. oracle 候補

| ID | 対象 | 入力・期待・反例 |
|---|---|---|
| `CANDIDATE-U-SPLITFAM-001` | split-orphan | 入力: 深さ 2 の `.md` が `split_of` を持たない。期待: `analyzePairFreeze` が `split-orphan` を返し `ok: false`。反例: `README.md` / `roadmap.md` は深さ 2 でも違反にならない |
| `CANDIDATE-U-SPLITFAM-002` | split-target-invalid (不在) | 入力: `split_of` が実在しない path。期待: `split-target-invalid`。反例: 実在する入口を指す子は違反 0 件 |
| `CANDIDATE-U-SPLITFAM-003` | split-target-invalid (別層) | 入力: `split_of` が別の層ディレクトリ (L3 など) の入口を指す。期待: `split-target-invalid` |
| `CANDIDATE-U-SPLITFAM-004` | split-target-invalid (入口でない) | 入力: `split_of` が (a) 別の子、(b) 自分自身、(c) 層ディレクトリ外の文書を指す。期待: 3 件とも `split-target-invalid`。鎖 (子が子を指す) も同じ |
| `CANDIDATE-U-SPLITFAM-005` | split-child-doc-type | 入力: 子が `doc_type_id: DOC-L2-SCREEN` を持つ。期待: `split-child-doc-type`。反例: `doc_type_id` を持たない子は違反 0 件 |
| `CANDIDATE-U-SPLITFAM-006` | 子は pair 検査の対象外 | 入力: `split_of` が正しく `pair_artifact` を持たない子。期待: `pair-missing` / `ref-unresolved` / `trace-orphan` を返さない。`isDesignSubDoc` は `false` |
| `CANDIDATE-U-SPLITFAM-007` | 子は層の件数に入らない | 入力: 入口 1 本 (`confirmed`) と子 2 本 (`draft`)。期待: `analyzeLayerPairGate` の confirmed が 1、draft が 0 (`src/gate/static.ts`)。`analyzeVerificationGroups` の件数も同じ |
| `CANDIDATE-U-SPLITFAM-008` | L2 画面 ID の抽出 | 入力: `DOC-L2-SCREEN` の入口と、「第4章 画面一覧」に画面 ID `SCR-X` を書いた子。期待: `l2ScreenIds` が `SCR-X` を含む。反例: `split_of` を持たない子の ID は含まない |
| `CANDIDATE-U-SPLITFAM-009` | L3 本文の束ね | 入力: `functional-requirements.md` (入口) と、要件 ID を書いたその子。期待: `g11L3Texts` / `g12L3HeadingIds` が子の ID を含む |
| `CANDIDATE-U-SPLITFAM-010` | 入口の削除 | 入力: 入口を消し、子が残る。期待: 子が `split-target-invalid`。pair 検査は入口の不在を別に報告する |
| `CANDIDATE-U-SPLITFAM-011` | 子の削除 | 入力: 子 2 本のうち 1 本を消す。期待: 残る子は違反 0 件。消した子の ID は抽出集合から消える。反例: 入口側に子の一覧は無いので、削除は入口の違反にならない |
| `CANDIDATE-U-SPLITFAM-012` | test-design 側の dir 集合参照 | 入力: test-design の `pair_artifact` が `docs/design/L2-screen/` (dir 集合)、入口が test-design を `pair_artifact` で指す。期待: サブフォルダに子があっても入口の trace-bidir は成立する (変更なしの確認) |
| `CANDIDATE-U-SPLITFAM-013` | サブフォルダ 0 本の回帰 | 入力: サブフォルダを持たない fixture (本体と同じ形)。期待: `analyzePairFreeze` / `analyzeLayerPairGate` / `analyzeVerificationGroups` の出力 (orphans・pairs・件数) が、本変更の前後で同一 |

## 4. 範囲外

consumer への配布 (#1531)、`fmValue` の複数行対応は扱わない。
