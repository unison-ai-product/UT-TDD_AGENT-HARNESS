---
title: "test-title modifier recognition — L7 テスト設計"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: confirmed
pair_artifact: docs/design/harness/L6-function-design/test-title-modifier.md
issue: 1456
---

# test-title modifier recognition — テスト設計 (issue #1456)

## 1. 位置付け

対になるL6契約は `docs/design/harness/L6-function-design/test-title-modifier.md`。本書の候補 oracle は1件だけであり、Red証跡はまだ無い。現行の `isTestTitleLiteral` の実装・実テストを変更または実行した証拠として扱わない。

## 2. 候補 oracle

| ID | 対象 | 独立した入力軸と期待 | 殺す退行 |
|---|---|---|---|
| `CANDIDATE-U-CODE-011` | `isTestTitleLiteral(node: ts.Node) => boolean` | **正**: (1) bare `describe` / `it` / `test` の直接 call の第1引数にある文字列・置換なし template literal、(2) 各 receiver の `.fails` / `.skip` / `.only` / `.todo` call の第1引数の同2 literal、(3) `describe.each(data)` / `it.each(data)` / `test.each(data)` と (4) `it.fails.each(data)` の返された第2 call の第1引数にある文字列・置換なし template literal。全て `true`。**負**: (5) 2形の `.each(data)` 第1 call の `data`、(6) unknown receiver / 未列挙 modifier / 別の chain の literal、(7) dynamic title expression、(8) title位置でない文字列または置換なし template literal、(9) template expression。全て `false`。 | modifier を見落とす、任意の chain を許す、data を title と誤認する、dynamic / title外 literal を除外する、literal種別を広げる。 |

各軸は独立に assertion する。正の title literal が除外され、負の literal / expression が除外されないことを個別に確かめる。`U-CODE-010` の既存 oracle と実装範囲は保持する。
