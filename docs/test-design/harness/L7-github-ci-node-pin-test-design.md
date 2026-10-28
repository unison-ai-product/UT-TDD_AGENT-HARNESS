---
title: "L7 GitHub CI Node pin test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: confirmed
issue: 1411
parent_doc: docs/design/harness/L5-detailed-design/internal-processing.md
---

# GitHub CI の Node pin テスト設計 (Issue #1411)

## 1. 根拠と範囲

正本は `docs/design/harness/L5-detailed-design/internal-processing.md` の
「Node toolchain authority」節、特に項目 2 と 8 である。項目 2 は source workflow の
`.github/workflows/review-attestation.yml` を含む pin 面を審査済みの Node
`24.22.1` に固定し、実行時 authority ではない Pack policy fixture を Pack
template と同じ pin にするよう定める。項目 8 は #1411 の範囲をこの pin 整合に限定し、
workflow trigger、権限、job 構造、required-check 判定を変更しない。

本書は #1441 で実測した二つの Red oracle を正式 ID に昇格する。昇格は Green や
workflow 修正を意味しない。対応する `it.fails` は候補引用から下記 `U-CIPOL-*`
への書換えだけを行い、Green 実装は別 PR とする。

## 2. Oracle

| ID | 対象・入力 | 期待 |
| --- | --- | --- |
| `U-CIPOL-040` | source profile で load した `attestation_runtime` (`.github/workflows/review-attestation.yml`) の `actions/setup-node@v4` pin を読む | Node pin は審査済みの `24.22.1` と一致する。現在の Red は実 workflow の `24.13.0` で不一致となる |
| `U-CIPOL-041` | Pack policy fixture (`tests/github-ci-policy.test.ts`) と load 済み Pack template (`docs/templates/github/common/pack-harness-check.yml`) の `actions/setup-node@v4` pin を読む | template と fixture の両方が `24.22.1` で一致する。現在の Red は fixture `24.13.0` と template `24.22.1` の不一致となる |

いずれの oracle も pin 値の比較だけを行う。trigger、permissions、job、required-check
の判定規則や workflow の他の内容はこの Issue で変更しない。
