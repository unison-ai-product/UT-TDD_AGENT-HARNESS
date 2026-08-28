---
plan_id: PLAN-REVERSE-519-pack-publication-adapter-backfill
title: "PLAN-REVERSE-519: Pack publication adapter implementation backfill"
kind: reverse
layer: cross
drive: agent
workflow_phase: R1
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
status: draft
created: 2026-08-28
updated: 2026-08-28
owner: Codex / Luna
forward_routing: gap-only
promotion_strategy: reuse-as-is
backprop_decision: not_required
backprop_decision_reason: "PLAN-L7-515の既存remote publication契約を変更せず、後続実装とoracleへの降下だけを逆向き確認するため。"
parent_design: docs/plans/PLAN-L7-519-pack-publication-adapter.md
pair_artifact: docs/test-design/harness/L7-pack-publication-remote-adapter-test-design.md
github_issue_id: 414
agent_slots:
  - role: tl
    slot_label: "Sol - PLAN-L7-515と実装契約の差分を逆向き検証する"
  - role: qa
    slot_label: "Terra - mutation単位nonceとwrite count oracleを独立照合する"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-519-pack-publication-adapter-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-pack-publication-remote-adapter-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-519-pack-publication-adapter.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-515-pack-remote-canary-publication.md
    - docs/plans/PLAN-REVERSE-515-pack-remote-canary-publication-backfill.md
    - docs/plans/PLAN-L7-508-pack-publication-staging-auditor.md
    - docs/test-design/harness/L7-pack-publication-remote-test-design.md
    - docs/test-design/harness/L7-pack-publication-remote-adapter-test-design.md
review_evidence: []
---

# PLAN-REVERSE-519: publication adapter実装契約の逆向き確認

## R0 / R1

旧PR #447は契約、Reverse、test-design、production実装、test codeを同梱し、`PLAN-L7-515`が固定した
mutation単位single-use nonceに反して一個のnonceを複数mutationへ再利用していた。さらに実write後の
`remoteWrites: 0`誤報告と、registry上のoracle欠落が同じPRに残ったため、scope FLAGに従ってcloseした。

本pair-freezeはその実装を継承せず、`PLAN-L7-515`を上位正本として次の降下だけを固定する。

1. remote mutationごとにapproval receiptとsingle-use nonceを一つずつ割り当てる。
2. consume済みnonceの再利用は新規write 0のsame-operation reconciliationだけに限定する。
3. deny/partial/indeterminate resultの`remoteWrites`は実際のport call ledgerから導出する。
4. 上位が所有する`CANDIDATE-PACKPUB-003-A..S2`全23行をID変更なしで実装testへ1対1にし、
   別registryへの再採番や未実装行のGreen主張を行わない。

## Backprop scope

| 層 | 判定 | 根拠 |
| --- | --- | --- |
| requirements | not_impacted | internal canaryとPack独立配布の既存要求を変更しない。 |
| L4/L5 | not_impacted | 新しい外部SDK、永続schema、CLI、共有状態を追加しない。 |
| L6/L7-515 | not_impacted | 正本FSM、authority、CAS、nonce、journal、partial境界をそのまま再利用する。 |
| L7-519 | updated | 実装sliceの所有範囲と旧PRからの是正境界を固定する。 |
| L7 test design | updated | 上位`003-A..S2`全行を再定義せず、実装sliceへの1対1束縛を追加する。 |

## R2〜R4出口

R2以降は別実装PRで、候補oracleのRed→Green、production source、Linux/Windows/aggregate CIを同一
exact HEADへ束縛する。R3はremote write ledger、mutation単位nonce、identity一軸mutationを非著者が
攻撃し、R4は`PLAN-L7-515`へのbackpropが不要であることを確認する。実装・CI・canonical closing
receiptが揃う前にR4やpublication-readyを宣言しない。
