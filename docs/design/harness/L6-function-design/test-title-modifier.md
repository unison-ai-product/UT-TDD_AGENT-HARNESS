---
layer: L6
artifact_type: design_doc
status: confirmed
sub_doc: function-spec
artifact_role: topic_test_title_modifier
pair_artifact: docs/test-design/harness/L7-test-title-modifier-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
next_pair_freeze: L7
issue: 1456
---

> **L6 contract marker**: `isTestTitleLiteral(node: ts.Node) => boolean` は、coding-rules の test-title literal recognition に関する unit-test-granularity contract である。対象は候補 oracle `CANDIDATE-U-CODE-011` のみ。既存 `U-CODE-010` の正式宣言・判定範囲は変更しない。

# test-title modifier recognition — 機能設計 (issue #1456)

## 1. 目的と状態

本書は `src/lint/coding-rules.ts` の `isTestTitleLiteral` を拡張する目標契約である。現行実装が満たすのは bare `describe` / `it` / `test` の直接呼出しだけであり、modifier / data-provider 呼出しは未実装である。Green 実装前の候補契約であり、Red 実証済みとは主張しない。

## 2. 契約

- `node` が文字列リテラルまたは置換なし template literal でなければ `false`。
- 認識する receiver は bare identifier `describe`、`it`、`test` のみ。直接呼出し、およびそれらの `.fails`、`.skip`、`.only`、`.todo` 呼出しでは、呼出しの第1引数そのものだけ `true`。
- data-provider は `describe.each(data)(title, ...)` / `it.each(data)(title, ...)` / `test.each(data)(title, ...)` と `it.fails.each(data)(title, ...)` の形だけを対象とする。第2 call の第1引数だけ `true` とし、第1 call の `data` は `false`。
- 未知 receiver、未列挙 modifier、別の call chain、dynamic expression、title 位置以外の literal は `false`。除外しない literal が日本語だけの machine decision text なら、既存 `machine-surface-language` 規則の判定対象に残る。

## 3. pair

oracle の入力・正負軸は `docs/test-design/harness/L7-test-title-modifier-test-design.md` が固定する。L7 は本書の filename を参照する。
