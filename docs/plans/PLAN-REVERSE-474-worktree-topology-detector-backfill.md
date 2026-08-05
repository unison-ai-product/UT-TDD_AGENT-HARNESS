---
plan_id: PLAN-REVERSE-474-worktree-topology-detector-backfill
title: "PLAN-REVERSE-474: worktree topology 検出契約の上流合流判定"
kind: reverse
layer: cross
drive: be
route_signal: drift
route_mode: reverse
confirmed_reverse_type: design
created: 2026-08-05
updated: 2026-08-05
owner: PM / PO
parent_design: docs/plans/PLAN-L7-474-worktree-topology-detector.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: po
    slot_label: "PO - R3 intent照合とR4未完境界を確認する"
  - role: tl
    slot_label: "TL - L4/L6への合流要否と advisory境界を判定する"
  - role: qa
    slot_label: "QA - 実装済みoracleと凍結契約の照合を行う"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-474-worktree-topology-detector-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-474-worktree-topology-detector.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L4-34-repository-runtime-placement-topology.md
    - docs/design/harness/L6-function-design/governance-enforcement.md
    - docs/test-design/harness/L7-unit-test-design.md
workflow_phase: R3
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
status: draft
review_evidence: []
---

# PLAN-REVERSE-474: worktree topology 検出契約の上流合流判定

## R0 観測証跡（pair-freeze時点）

Issue #232 は、登録worktreeが増加しても `git worktree prune` が directory 不在しか扱わず、
link破損と終了済みclean worktreeを判定できないという観測から起票された。
現時点で凍結できる差分は「双方向link健全性、保全優先のliveness、advisory oracle」である。

R0 は実装観測ではない。実装、テスト、実測件数、green verdictは未取得であり、本PLANは
それらを完了済みとして扱わない。

この記述はR0時点の履歴である。後続のR1〜R3実施事実は以下へ追記し、R0の観測を上書きしない。

## 上流合流の問い

1. `.git` / admin 双方向のlink契約を L6 governance-enforcement へ恒久契約として追記すべきか。
2. `dirty` 優先、detached HEADの保持ref到達可能性、finding面のretirable除外を、L4配置移設の
   安全条件へ反映すべきか。
3. stable topology identity集合とdigestを `PLAN-L4-34` の移設前後 acceptance comparator として
   参照させるべきか。

## R1 照合結果

| 問い | 判定 | 根拠 |
|---|---|---|
| 双方向link契約 | `backfill_required` | 純粋analyzerがworktree→admin/admin→worktreeを独立findingとして実装し、L6恒久契約に必要。 |
| retirable安全条件 | `backfill_required` | dirty優先、typed retained ref、観測不能fail-safeは配置移設時の破棄候補判定を制約する。 |
| identity/digest comparator | `backfill_required` | healthy件数だけでは同数置換を検出できず、許可remap後のidentity集合一致が必要。 |

## R2 gap-only backfill

R1の三件を `docs/design/harness/L6-function-design/governance-enforcement.md` の
「worktree topology acceptance」節へ一つの恒久契約として追記した。参照先
`PLAN-L4-34-repository-runtime-placement-topology` は現treeに未着地のため、存在を偽装して編集せず、
将来の配置移設PLANが本L6契約を参照する順序を維持する。

## R3 実装・テスト照合

`src/runtime/worktree-topology.ts` と `tests/worktree-topology.test.ts` により
`U-WTTOPO-001`〜`013`、`016`、`018`を照合済み。collector/doctorを対象とする
`CANDIDATE-WTTOPO-014`、`015`、`017`は未実装であり、R3完了を装って昇格しない。

## Schedule

- R0 [完了]: Issue #232 と pair-freeze から上流差分候補を記録した。
- R1 [完了]: 実装事実とL6既存契約を照合し、三問いを`backfill_required`と判定した。
- R2 [完了]: R1で必要とした三面だけをL6へgap-only追記した。
- R3 [完了（本slice範囲）]: `U-WTTOPO-001`〜`013`、`016`、`018`を同名test citationで照合した。
  collector/doctorの候補三件はchild sliceへ残し、未実装を完了扱いしない。
- R4 [直列]: Forward再合流を判定し、実装PLANの確認条件へ反映する。

## AC

- AC-1: 上記三問いを未判定のまま残さない。
- AC-2: R2は必要な差分だけを上流へ反映し、既存設計を重複させない。
- AC-3: R3は実装テストの結果を根拠にする。pair-freeze時の文書だけをgreen根拠にしない。
