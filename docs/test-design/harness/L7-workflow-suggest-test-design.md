---
title: "L7 workflow suggest test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: draft
updated: 2026-10-14
---

# workflow suggest 合成器 テスト設計 (issue #304 S1 / #958)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/workflow-suggest.md` である。本書は同文書 §1〜§4 の設計判断を
falsifiable な candidate として固定する。合成器は未実装のため、ID は `CANDIDATE-WFSUG-*` のままとし、実装 PR で Red を
置いてから `U-WFSUG-*` へ 1:1 で昇格する。候補は実テストの citation として数えない。`CANDIDATE-WFSUG-001`
(生成 team YAML の schema 適合) は実装側 `PLAN-L7-485` の範囲であり、同 PLAN の還流で追加する。

## 2. oracle

| ID | 入力 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| CANDIDATE-WFSUG-002 | `--text` と `--issue` の同時指定 | usage error: exit 2 + stderr。advisory 出力を出さない | 排他違反を exit 0 に丸める |
| CANDIDATE-WFSUG-003 | `--issue` で `gh` fetch が失敗 (到達不能) | exit 1 + stderr。exit 0 や空提案へ丸めない | operational failure を advisory に倒す |
| CANDIDATE-WFSUG-004 | (code, 実行系 `add-feature`) と (code, 文書系 `design`) の 2 入力 | checklist が 7 項目 対 4 項目 (設計文書 §2 の matrix と要素一致) | matrix を無視して差分が出ない |
| CANDIDATE-WFSUG-005 | family-map に一致する keyword、および全不一致のテキスト | 一致は表の先勝ち family 候補、不一致は候補なし (空) | 推測で候補を埋める |
| CANDIDATE-WFSUG-006 | 4 部品 (`classifyTask` / `routeFiling` / `classifyProposalDocumentCoverage` / skill recommend) の出力 stub を差し替える | 合成器の出力が部品出力へ追随する。import の実測で、部品 module 以外の分類・route・scoring 実装が合成器に無い | 部品を再実装して追随しない |
| CANDIDATE-WFSUG-007 | 正常な `--text` 入力 (提案 0 件のケースを含む) | exit 0 + stdout に advisory (0 件でも exit 0) | 提案 0 件を失敗にする |
| CANDIDATE-WFSUG-008 | 未知の drive / kind の分類結果 | checklist は全 7 項目 (落とす方向へ倒れない fail-safe) | 未知入力を subset へ落とす |
