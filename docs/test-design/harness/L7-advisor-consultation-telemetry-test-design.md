---
title: "L7 advisor consultation telemetry test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: draft
updated: 2026-10-14
---

# advisor 相談 telemetry と不在検知 テスト設計 (条件付き保留、#958)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/advisor-consultation-telemetry.md` である。同文書は条件付き保留
であり、本書の oracle も着手時まで実装しない。ID は `CANDIDATE-U-ADVTEL-*` のままとし、着手時に Red を置いてから
`U-ADVTEL-*` へ昇格する。候補は実テストの citation として数えない。同文書 §5 の受け入れ条件と 1:1 で対応する。

## 2. oracle

| ID | 入力 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| CANDIDATE-U-ADVTEL-001 | advisor を実行し、projection 後に相談率を実測クエリする | telemetry フィールド (`decision_kind` / `provider` / `model` / `divergence` など) が列に載り、相談率が算出できる。before baseline は 16 発火 / 10 PLAN | 列昇格を落とす |
| CANDIDATE-U-ADVTEL-002 | 設計判断節に 2 案以上を記録した PLAN が advisor 発火ゼロで confirm される fixture | 検出される (発火事実を数える。到達可能性で代用しない) | 到達可能性だけで「相談済み」とみなす |
| CANDIDATE-U-ADVTEL-003 | 不在 warn の surface 先 | 蓄積型 feedback list ではなく、confirm / merge の地点で surface される | 蓄積型 list へ流す |
| CANDIDATE-U-ADVTEL-004 | 計測窓の期限を過ぎた状態で PO 判断が未実施の fixture | 「PO 判断未実施」が検出される (期限が機械可読) | 期限の宣言を落とす |
| CANDIDATE-U-ADVTEL-005 | 本機構を有効にした状態で、advisor 発火ゼロの PLAN を通常 workflow で進める | fail-close しない (warn 止まり) | 既存 workflow を止める |
