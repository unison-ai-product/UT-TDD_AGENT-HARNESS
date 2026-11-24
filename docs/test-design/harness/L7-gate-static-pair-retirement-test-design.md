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
| `U-GSPAIR-001` | 比較元の既存対を維持したまま有効な対を追加する。宣言なしで成功する。 | 固定件数と比較し、正当な追加を拒否する。 |
| `U-GSPAIR-002` | 有効な別の対を追加しながら既存の1対を失わせる。総数と孤児数は変わらず、未宣言の旧対の両 path が出る。 | 件数だけを比較し、追加が消失を相殺する。 |
| `U-GSPAIR-003` | 複数の設計文書がテスト設計を共有する。うち1対だけを失わせ、今回の Issue の宣言にその旧対だけを記す。正しい組は成功し、宣言から片側の path を変えると失敗する。 | テスト設計の path だけをキーにし、別の設計対を同一視する。 |
| `U-GSPAIR-004` | 以前の宣言が既にある状態で同じ対を失わせる。今回の宣言なしでは失敗する。今回の宣言の重複・過剰・不正も個別に拒否する。 | 古い宣言を再利用する。宣言範囲を件数だけで検査する。 |
| `U-GSPAIR-005` | PR の head を分岐後に進め、更に base 側も別の対を追加する。共通祖先の確定対は保護し、base にしか追加されていない対を head に要求しない。 | branch の最新状態や作業ツリーを比較元に使う。 |
| `U-GSPAIR-006` | 有効な二つの commit を渡した対照は成功する。比較対象を解決できない場合や対象データを読めない場合、PR の照合は失敗する。 | 読み取りエラーを空集合や比較対象外として処理する。 |
| `U-GSPAIR-007` | 同じ本番の比較起動口に対して `GITHUB_ACTIONS=true` と起動入力を渡す。`GITHUB_EVENT_NAME=pull_request` と一致する `PAIR_RETIREMENT_EVENT_NAME=pull_request`、解決可能な `PAIR_RETIREMENT_BASE_SHA` / `PAIR_RETIREMENT_HEAD_SHA` で PR 比較が起動する。golden と既存不変条件の陽性対照は成功する。PR event で3入力が欠落した場合、event 入力だけが欠落した場合、base または head SHA が片側・両側欠落、不正、commit 解決不能の場合、および `PAIR_RETIREMENT_EVENT_NAME` が `GITHUB_EVENT_NAME` と矛盾する場合は、golden が成功しても比較全体が失敗する。`push` の正常な非 PR CI は event 名が一致し PR SHA が空なら golden と不変条件を実行して成功し、PR SHA が混入すれば失敗する。 | PR 入力の欠落・矛盾を golden のみへ降格する。非 PR event の PR SHA 混入を無視する。CI event と workflow が渡した event の不一致、または commit 解決失敗を比較対象外として扱う。 |

U-GSPAIR-001〜007 は合流済みの Red と対応する。
