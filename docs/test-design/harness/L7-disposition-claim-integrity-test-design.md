---
title: "L7 disposition claim integrity test design"
layer: L7
executed_at_layer: L7
artifact_type: test_design
status: draft
updated: 2026-10-14
---

# disposition claim 実体整合 gate テスト設計 (issue #119 / #958)

## 1. 位置付け

対になる設計文書は `docs/design/harness/L6-function-design/disposition-claim-integrity.md` である。本書は同文書 §2 の
検査契約を mutation で固定する oracle を定義する。検出器は未実装のため、ID は `CANDIDATE-U-DISPCLAIM-*` のままとし、
実装 PR で Red を置いてから `U-DISPCLAIM-*` へ昇格する。候補は実テストの citation として数えない。

## 2. oracle

| ID | 入力 | 期待 | 殺す mutation |
| --- | --- | --- | --- |
| CANDIDATE-U-DISPCLAIM-001 | merge claim の anchor が統合先に実在しない fixture (quota 型回帰) | fail-close | anchor の実在確認を外す |
| CANDIDATE-U-DISPCLAIM-002 | profile 採用条件に対応する決定行が無い fixture (billing 型回帰) | fail-close | 決定行 join を外す |
| CANDIDATE-U-DISPCLAIM-003 | 未定義 axis または未登録 profile を参照する fixture (regulated 型回帰) | fail-close | axis / profile の登録確認を外す |
| CANDIDATE-U-DISPCLAIM-004 | prose reason だけで型付き採用条件が無い `reference` 行 | fail-close | prose reason を採用条件の代用として受理する |
| CANDIDATE-U-DISPCLAIM-005 | reason 付き `not_applicable` 行と、reason 無しの `not_applicable` 行 | 前者は green、後者は fail-close | reason の有無を見ない |
| CANDIDATE-U-DISPCLAIM-006 | `api_gov` / `api_portal` / `api_webhook` の typed doc_type、または `adopt` / `not_applicable` 決定行を 1 箇所ずつ欠落させた fixture | いずれも fail-close | 3 item のうち 1 つを検査対象から外す |
| CANDIDATE-U-DISPCLAIM-007 | mobile / desktop 12 item の `source_id` / `item_id` coverage を `DOC-L4-UI-STANDARD` 1 行へ集約した fixture と、全 item が個別に join する fixture | 前者は fail-close、後者だけ green | doc_type 1 行への丸めを許す |
| CANDIDATE-U-DISPCLAIM-008 | 実 repo (anchor 実在 + 決定行 join + api-service 決定 + item coverage が成立) | green | 正常系を誤検知する |

## 3. 範囲外

- 参照整合 projection (PLAN-L7-417) の再実装。path 実在・ID 解決・件数整合は既存 gate が持つ。
- authoring source の内容そのものの是正。検出器導入時点の既知乖離の収束は L7 実装 PR の作業である。
