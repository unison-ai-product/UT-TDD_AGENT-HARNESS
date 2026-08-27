---
plan_id: PLAN-REVERSE-508-pack-publication-staging-auditor-backfill
title: "PLAN-REVERSE-508: local Pack publication staging/auditor backfill"
kind: reverse
layer: cross
drive: agent
workflow_phase: R2
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
status: draft
created: 2026-08-25
updated: 2026-08-26
owner: Codex / Luna
forward_routing: gap-only
promotion_strategy: reuse-as-is
backprop_decision: not_required
backprop_decision_reason: "local staging/auditorはconfirmed L6境界を変更せず、remote publication候補を未実装のまま保持するため。"
parent_design: docs/plans/PLAN-L7-508-pack-publication-staging-auditor.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
github_issue_id: 403
agent_slots:
  - role: tl
    slot_label: "TL - local/remote境界とtyped failureの逆向き検証"
  - role: qa
    slot_label: "QA - U-PACKPUB-STAGE-001..010の独立oracle検証"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-508-pack-publication-staging-auditor-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-508-pack-publication-staging-auditor.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-REVERSE-505-pack-staged-release-rollback-backfill.md
    - docs/plans/PLAN-L7-499-pack-publication-manifest-v2-pure-domain.md
    - docs/plans/PLAN-L7-500-pack-publication-assets-pure-domain.md
    - docs/test-design/harness/L7-unit-test-design.md
    - src/setup/pack-publication-staging.ts
    - tests/pack-publication-staging.test.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/403
---

# PLAN-REVERSE-508

## R0 / R1: Forward契約の逆向き確認

`PLAN-L6-63`と`PLAN-REVERSE-505`が固定したpublication境界のうち、remote writeを必要としない
`CANDIDATE-PACKPUB-001/002`だけを`PLAN-L7-508`へ降下した。manifest v2とdeterministic assetsの
既存所有権を再実装せず、sealed local staging planとobserved result auditorへ合成する。

## R2: 実装・oracle実測

`U-PACKPUB-STAGE-001..010`は、semantic control snapshot、exact commit/asset inventory、immutable
bytes、snapshot/apply/restore fault、apply exactly once、partial/indeterminate監査を独立に検出する。
Luna worker実装をCodex preflightで検証した。Claude closing FLAGでasset欠落・digest/bytes drift、
control digest driftのreason oracle不足とrelease/channel節境界衝突を実測したため、Red 13/14を経て
domain separatorと要素数prefixを追加した。detached HEAD snapshot 14/14 Green、TypeScript、Biomeを
同じremediation revisionへ束縛し、commit/assets/control digestの各分岐を独立に検出する。

## Backprop scope

| 層 | 判定 | 根拠 |
| --- | --- | --- |
| requirements | not_impacted | Pack独立配布・consumer隔離要求を変更しない。 |
| L4-basic-design | not_impacted | local stagingとremote publicationのcomponent境界を維持する。 |
| L5-detailed-design | not_impacted | 新しい永続schema、CLI、remote adapterを導入しない。 |
| L6-function-design | not_impacted | PLAN-L6-63のfail-close、CAS、rollback契約を縮小・変更しない。 |
| L7-unit-test-design | updated | U-PACKPUB-STAGE-001..010を個別oracleとして登録した。 |

## R3 / R4出口

本PRではlocal sliceだけを検収するためR2に留める。`CANDIDATE-PACKPUB-003/004`が所有するapproval、
remote CAS、Pack commit/tag/Release、channel promotion、supersede-forward rollbackは後続PRで実測する。
そのaggregate検証後にR3へ進み、上位契約へ差分がなければR4 `gap-only / reuse-as-is`で閉じる。
