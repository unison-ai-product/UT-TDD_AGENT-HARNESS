---
title: "Vモデル upgrade schedule authoring source"
status: confirmed
owner: PO / TL
updated: 2026-07-08
---

# Vモデル upgrade schedule authoring source

## 0. 役割

本書は `Vモデル設計ドキュメント_clean.zip` から始まった HARNESS バージョンアップの工程管理表である。
目的は、上流からの全面見直しを「現在地」「V-pair」「前提」「RAG」「駆動モデルの入口」に分解し、
`.ut-tdd/harness.db` の `schedule_entries` projection へ宣言的に引き込むことである。

DB は正本ではない。本書、PLAN、設計 doc、test-design が authoring source であり、検出系は本書の現在地と
`routeFiling` / 駆動モデル設計に従う。検出系の都合で layer、sub_doc、pairing、起票先を創作してはいけない。

## 1. 工程管理表

| `plan_id` | `layer` | `sub_doc` | `v_pair` | `predecessor_plan_ids` | `current_location` | `rag` | `status` | `blocked_reason` |
|---|---|---|---|---|---|---|---|---|
| PLAN-L0-01-vmodel-harness-upgrade-charter | L0 | charter |  |  | U0: charter confirmed; ZIP前提をVモデル全面更新として固定 | green | confirmed |  |
| PLAN-L3-04-upstream-schedule-reconciliation | L3 | functional | L12 | PLAN-L0-01-vmodel-harness-upgrade-charter | U1: requirements slice confirmed; 上流要求と受入条件を固定 | green | confirmed |  |
| PLAN-L4-18-roadmap-drive-selection-hardening | L4 | function | L9 | PLAN-L3-04-upstream-schedule-reconciliation | U2a: routeFiling / 駆動モデル選択の外部設計を固定 | green | confirmed |  |
| PLAN-L4-19-vmodel-spec-ir-data | L4 | data | L9 | PLAN-L4-18-roadmap-drive-selection-hardening | U2b: spec IR / 工程 / activation の集約境界を固定 | green | confirmed |  |
| PLAN-L5-13-vmodel-spec-ir-physical-data | L5 | physical-data | L8 | PLAN-L4-19-vmodel-spec-ir-data | U2c: physical schema と projection table を固定 | green | confirmed |  |
| PLAN-L6-39-vmodel-spec-ir-function-contracts | L6 | function-spec | L7 | PLAN-L5-13-vmodel-spec-ir-physical-data | U2d: loader/parser/projector/detector handoff 契約を固定 | green | confirmed |  |
| PLAN-L7-381-vmodel-spec-ir-projection | L7 |  | L6 | PLAN-L6-39-vmodel-spec-ir-function-contracts | U3: spec_defs / relations / schedule / activation / candidates をDB投影済 | green | confirmed |  |
| PLAN-L7-382-detector-route-candidate-feedback | L7 |  | L6 | PLAN-L7-381-vmodel-spec-ir-projection | U4: detector候補をfeedback / dry-run issue queueへ接続済 | green | confirmed |  |
| PLAN-L7-383-vmodel-schedule-authoring-source | L7 |  | L6 | PLAN-L7-382-detector-route-candidate-feedback | U5: 工程管理表を専用 authoring source としてDB投影へ接続済 | green | confirmed |  |
| PLAN-L6-40-route-filing-review-surface | L6 | function-spec | L7 | PLAN-L7-383-vmodel-schedule-authoring-source | U6a: routeFiling SSoT 評価結果のreview DTO契約を固定 | green | confirmed |  |
| PLAN-L7-384-route-filing-review-surface | L7 |  | L6 | PLAN-L6-40-route-filing-review-surface | U6b: detector candidate review surfaceへFilingTarget評価結果を表示済 | green | confirmed |  |
| PLAN-L6-41-vmodel-activation-profile-join | L6 | function-spec | L7 | PLAN-L7-384-route-filing-review-surface | U7a: activation profile と工程表 join の関数契約を固定 | green | confirmed |  |
| PLAN-L7-385-vmodel-activation-profile-join | L7 |  | L6 | PLAN-L6-41-vmodel-activation-profile-join | U7b: activation profile と工程表をjoinしてversion-up対象/除外/延期理由を検索可能化済 | green | confirmed |  |
| PLAN-L6-42-typed-spec-declaration-source | L6 | function-spec | L7 | PLAN-L7-385-vmodel-activation-profile-join | U8a: ZIP 99の spec.defines 型宣言をHARNESS正本へ落とす契約 | yellow | planned | U7のprofile join green 後に起票 |
| PLAN-L7-386-typed-spec-declaration-projection | L7 |  | L6 | PLAN-L6-42-typed-spec-declaration-source | U8b: typed spec declaration をDB projectionへ接続 | yellow | planned | L6-42確定後に起票 |

## 2. 解釈規則

- `current_location` は人間向けの現在地であり、検出器の推測結果ではない。
- `rag=green` は当該工程の設計・実装・検証証跡が揃っている状態を示す。
- `rag=yellow` は工程が正規に進行中、または後続工程が前提待ちであることを示す。
- `blocked_reason` が空でない行は、検出系が `detector_route_candidates` または feedback surface へ上げる候補になり得る。
- 本表に載っていないPLANは、後方互換のため PLAN frontmatter から `schedule_entries` fallback を作る。ただし本表に載ったPLANは本表を優先する。

## 3. 不変条件

- 工程管理表は Workflow 集約の authoring source であり、PLAN frontmatter を暗黙更新しない。
- 駆動モデル選択は `routeFiling` / route mode SSoT に従い、本表は現在地と前提を渡すだけに留める。
- `status=planned` の行は実装完了を意味しない。起票前の位置づけを明示するための計画行である。
- 本表と projection の齟齬は doctor / detector の finding として扱い、projection 側で silent repair しない。
