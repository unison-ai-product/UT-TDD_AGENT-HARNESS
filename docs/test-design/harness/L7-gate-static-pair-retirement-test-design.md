---
title: "L7 gate static pair retirement test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
pair_artifact: docs/design/harness/L6-function-design/gate-static-pair-retirement.md
status: confirmed
updated: 2026-11-24
issue: 1073
---

# Gate static の設計対の維持と退役のテスト設計 (Issue #1073)

上位契約は `docs/design/harness/L6-function-design/gate-static-pair-retirement.md`。独立した一時 Git リポジトリで比較元と変更側を commit し、U-RCDEV-037 の比較経路に渡す。正常系で baseline の成立と比較の発火を先に確認する。

| ID | 入力と期待 | 検出する反例 |
| --- | --- | --- |
| `CANDIDATE-U-GSPAIR-001` | 比較元の既存対を維持したまま有効な対を追加する。宣言なしで成功する。 | 固定件数と比較し、正当な追加を拒否する。 |
| `CANDIDATE-U-GSPAIR-002` | 有効な別の対を追加しながら既存の1対を失わせる。総数と孤児数は変わらず、未宣言の旧対の両 path が出る。 | 件数だけを比較し、追加が消失を相殺する。 |
| `CANDIDATE-U-GSPAIR-003` | 複数の設計文書がテスト設計を共有する。うち1対だけを失わせ、今回の Issue の宣言にその旧対だけを記す。正しい組は成功し、宣言から片側の path を変えると失敗する。 | テスト設計の path だけをキーにし、別の設計対を同一視する。 |
| `CANDIDATE-U-GSPAIR-004` | 以前の宣言が既にある状態で同じ対を失わせる。今回の宣言なしでは失敗する。今回の宣言の重複・過剰・不正も個別に拒否する。 | 古い宣言を再利用する。宣言範囲を件数だけで検査する。 |
| `CANDIDATE-U-GSPAIR-005` | PR の head を分岐後に進め、更に base 側も別の対を追加する。共通祖先の確定対は保護し、base にしか追加されていない対を head に要求しない。 | branch の最新状態や作業ツリーを比較元に使う。 |
| `CANDIDATE-U-GSPAIR-006` | 有効な二つの commit を渡した対照は成功する。比較対象を解決できない場合や対象データを読めない場合、PR の照合は失敗する。 | 読み取りエラーを空集合や比較対象外として処理する。 |

候補 oracle の実装と正式 ID への昇格は後続の段で行う。
