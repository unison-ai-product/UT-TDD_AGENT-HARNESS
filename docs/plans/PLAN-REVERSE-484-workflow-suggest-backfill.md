---
plan_id: PLAN-REVERSE-484-workflow-suggest-backfill
title: "PLAN-REVERSE-484: workflow suggest 生成器 設計backfill"
kind: reverse
layer: cross
drive: agent
workflow_phase: R0
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
status: draft
created: 2026-08-13
updated: 2026-08-13
owner: PM / TL
parent_design: docs/plans/PLAN-L7-484-workflow-suggest-composition.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - 既存 classify/route/skill 部品と composer の責務境界を backfill"
  - role: qa
    slot_label: "QA - 合成のみ (二重実装なし) と advisory only を検証"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-484-workflow-suggest-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-484-workflow-suggest-composition.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-484-workflow-suggest-composition.md
    - docs/plans/PLAN-L7-72-task-classify-cli.md
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/design/harness/L6-function-design/skill-index.md
    - src/task/classify.ts
    - src/schema/route-filing.ts
    - src/skill-engine/recommend.ts
    - src/schema/team.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/304
review_evidence: []
---

# PLAN-REVERSE-484: workflow suggest 生成器 設計backfill

本 PLAN は `PLAN-L7-484-workflow-suggest-composition` (add-impl) の Reverse 対である
(`kind=add-impl` は Reverse 対必須)。Forward 側は L1-L6 に降下元 doc を持たない local-impl-only
合成であり、本 Reverse 対が「既存部品の契約と composer の責務境界を観測し、設計 back-fill の
要否を確定する」責務を負う。実装を R1 完了証拠の代替にしない。

## R0-R4 と状態遷移

- R0 (現在): 既存 4 部品 (`classifyTask` / `routeFiling` /
  `classifyProposalDocumentCoverage` / `recommendSkillsForText`+`buildSkillInjectionSet`) が既に
  持つ入出力契約を観測し、composer が新規に持つ責務 (出力変換・束ね・drive×kind 選択) との
  境界を確定する。`src/schema/team.ts` の team YAML 契約と
  `skills/review-checklist.yaml` (`review-checklist.v1`) の項目構造も観測対象とし、
  派生 schema `workflow-checklist.v1` が既存 schema を壊さずに拡張できるかを実測する。
- R1: composer の責務、所有 oracle (`U-WFSUG-*`)、advisory only 境界 (fail-close gate を作らない)、
  および「二重実装禁止」の判定基準 (composer が 4 部品の内部ロジックを再実装していないこと) を
  pair-freeze として定義する。R1 は本 docs-only 訂正が cross-review PASS かつ main へ merge された
  時点で完了する。
- R2: `U-WFSUG-*` を Red から Green 化する。Forward の工程表 Step 2-4 と 1:1 で対応させ、
  候補 oracle は所有 slice 以外で昇格しない。
- R3: 非 author family の cross-review で、合成のみ (再実装なし) / 出力 2 面の schema 適合 /
  drive×kind の差分実在 / advisory only を再導出する。単体 Green の合算を PASS の代替にしない。
- R4: R3 PASS 後に設計 back-fill の要否を確定する。back-fill が必要と判定した場合のみ
  `docs/design/harness/L6-function-design/` へ composer 契約を合流し、`forward_routing` /
  `promotion_strategy` を確定して Forward へ戻す。不要と判定した場合は Forward 側の
  `backprop_decision: not_required` を実測付きで確定する。

| from | transition guard | to | FLAG / failure |
| --- | --- | --- | --- |
| R0 | 既存 4 部品と team/checklist schema の契約観測が Forward §1 と矛盾なく記録される | R1 | R0 に留まり実装禁止 |
| R1 | 本 docs-only 訂正が cross-review PASS で main へ merge | R2 | R1 へ戻し、oracle は RED 維持 |
| R2 | `U-WFSUG-*` が Green、実 issue 3 件の試走で team YAML が schema validation を通る | R3 | R2 へ戻る |
| R3 | 非 author family の cross-review PASS + back-fill 先の確定 | R4 | finding 所有 slice へ戻る |
| R4 | 設計 back-fill 要否の確定 (要なら L6 合流) と closing gate PASS | Forward merge | R4 未完了のまま保持 |

## backprop_scope (仮、R4 で確定)

設計降下前のため本節は仮置きとする。現時点で予想される影響範囲:

- requirements: 既存要件を変更しない見込み (advisory 出力の追加に閉じる)。
- L4-basic-design: 外部機能境界・component 責務は変更しない見込み。
- L5/L6: composer の合成契約を新規追加する可能性がある
  (`docs/design/harness/L6-function-design/` 配下、対象ファイルは R3 で確定)。

上記は R0 時点の見立てであり、R4 で実測に基づき確定する (仮置きを完了条件の代替にしない)。

## 完了条件 (R0-R1)

- [ ] R0: 既存 4 部品 / team schema / review-checklist schema の契約と composer の責務境界が
      Forward §1 と矛盾なく記録される。
- [ ] R1: composer 責務、所有 oracle、advisory only 境界、二重実装禁止の判定基準が定義される。
- [ ] R1 closing: 本 docs-only 訂正が cross-review PASS かつ main へ merge される。
- [ ] R2-R4: 上表の guard を順に満たすまで未着手。後続 phase の実装を先行しない。
