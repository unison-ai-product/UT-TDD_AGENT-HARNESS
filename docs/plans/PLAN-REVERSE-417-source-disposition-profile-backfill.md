---
plan_id: PLAN-REVERSE-417-source-disposition-profile-backfill
title: "PLAN-REVERSE-417: source disposition/profile実装の設計backfill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: db
status: confirmed
route_signal: drift
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/plans/PLAN-L7-417-source-disposition-profile-projection.md
agent_slots:
  - role: tl
    slot_label: "TL - catalog/profile実装事実をL5/L6へbackfill"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-417-source-disposition-profile-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/physical-data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-417-source-disposition-profile-projection.md
  requires: []
---

# PLAN-REVERSE-417

## §0 目的

PLAN-L7-417で実装したsource disposition、semantic item、profile、DB projectionを観測し、Forward設計との差をR0からR4まで逆向きに検証する。実装上の都合でL4-L6契約を弱めず、設計に不足していた機械境界だけをbackfillする。

## §1 R0-R4観測結果

| phase | 観測・判定 | 結果 |
|---|---|---|
| R0 | domain/adapters/schema/projectionとtracked authoringを観測 | source 109件、category 21件、item 163件、profile 8件、profile decision 26件を正本から読込。件数の恒久定数化なし |
| R1 | Forward設計と実装schemaを差分比較 | typed NOT NULL/PK/FK/UNIQUE/CHECK、version 26 migration、canonical target registry、Git blob/commit receipt、pending finding投影の不足を検出し実装済み |
| R2 | `U-DISP-*`、`U-PROFILE-*`、`U-TARGET-*`、`I-DISP-001`をoracleとして照合 | strict header/row、非推論、target全edge existence、fixed-point、tamper rollbackをGreen化 |
| R3 | checked ZIP由来の数量とintentを照合 | 109/21/163/8/26を再現。163 itemは未検収decisionを`pending_review` findingとして保持し、doneへ補完しない |
| R4 | 実装事実をForwardへ合流 | L4 architecture、L5 physical-data、L6 function-spec、L7 test-designへmodule/table/constraint/oracleをbackfill済み |

## §2 自己証明境界

- provenanceはworking treeの現在値を再hashして正当化せず、tracked blobとanchor commitを照合する。未commit正本変更はfail-closeする。
- source targetは`plan_alias`、`artifact_path`、`artifact_family`、`target_slot`のtyped resolverでのみ解決し、basename aliasは一意な場合だけ許可する。
- DB constraint coverageはregistryとSQLite実DDLのNOT NULL、複合PK、FK action、UNIQUE、CHECKを比較し、application validationで代替しない。
- `I-DISP-001`はdelete/rebuildのidentity fixed-pointと、tamper時のtransaction rollbackを同時に要求する。
- `design-language`は日本語本文を維持しつつ、全cellが単一identifierの機械headerだけを除外する。英語sentence cellは引き続きRedとする（IMP-151）。

## §3 実装・検証証跡

| commit | 内容 |
|---|---|
| `bf5fb5a6` | lossless catalog/profile domain |
| `c1b7ee17` | tracked Git provenance |
| `d2064814` | typed DB constraint registry |
| `a13c392f` | tracked authoring projection |
| `5d01b77d` | target resolverとconstraint verification |
| `d142192f` | object input refactor、schema enum修正、detector自己証明gap closure |
| `4b577868` | tamper false-green解消、U-PROFILE trace整合、profile manifest駆動化 |
| `73ca9cf4` | 正常explicit overlay適用とdigest差のmutation耐性を証明 |
| `296531a5` | IMP-147 lifecycle isolationとIMP-154 doctor surface test分離を完了 |

検証結果はtargeted 15 files **100/100 Green**、`tsc --noEmit` Green、coding-rules 9/9 Green、PLAN工程表739件Greenである。再現commandは次のとおりで、anchorは`73ca9cf4`である。

```powershell
bunx vitest run tests/coding-rules.test.ts tests/design-language.test.ts tests/improvement-backlog.test.ts tests/db-projection-coverage.test.ts tests/harness-db-constraints.test.ts tests/disposition/strict-markdown-table.test.ts tests/disposition/tracked-authoring-loader.test.ts tests/disposition/catalog.test.ts tests/disposition/projection.test.ts tests/disposition/target-resolver.test.ts tests/disposition/tracked-target-registry.test.ts tests/profile/resolver.test.ts tests/profile/tracked-loader.test.ts tests/vmodel-schema.test.ts tests/vmodel-migration.test.ts --reporter=dot
```

confirmed候補状態の最終全suiteは`bunx vitest run --reporter=dot`で **174/174 files、1697/1697 tests Green**（2026-07-10、anchor `296531a5`）。`IMP-147`はvolatile source由来の`feedback_lifecycle`だけをstable count比較から意味的に分離し、product tableの完全一致を維持したままprojection-writer 32/32 Greenで閉じた。`IMP-154`は個別doctor gate surface testを無関係な総合非終端状態から分離し、doctor 59/59 Greenで閉じた。

## §4 R4合流先

- `docs/design/harness/L4-basic-design/architecture.md`: disposition/profile moduleと依存方向。
- `docs/design/harness/L5-detailed-design/physical-data.md`: V-model table、制約、migration、projection ownership。
- `docs/design/harness/L6-function-design/function-spec.md`: strict loader、provenance、target resolver、profile resolver、DB coverage contract。
- `docs/test-design/harness/L7-unit-test-design.md`: `U-DISP-*`、`U-PROFILE-*`、`U-TARGET-*`、`I-DISP-001`。

## §5 収束判定

Forward設計を縮退させる未解消gapはない。163件の`pending_review`はPO検収待ちの業務状態であり、実装欠落としてdone化しない。PLAN-L7-417の実装完了判定は独立review、Reverse確認、`doctor`再実行後に行う。
