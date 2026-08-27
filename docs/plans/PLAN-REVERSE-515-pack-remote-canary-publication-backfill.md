---
plan_id: PLAN-REVERSE-515-pack-remote-canary-publication-backfill
title: "PLAN-REVERSE-515: human-approved Pack remote canary publication backfill"
kind: reverse
layer: cross
drive: agent
workflow_phase: R1
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
status: draft
created: 2026-08-27
updated: 2026-08-27
owner: Codex / Luna
forward_routing: gap-only
promotion_strategy: reuse-as-is
backprop_decision: not_required
backprop_decision_reason: "既存のPack配布要求とL6-63の段階公開・fail-close契約を変更せず、remote publication adapterの操作証跡をL7へ具体化するため。"
parent_design: docs/plans/PLAN-L7-515-pack-remote-canary-publication.md
pair_artifact: docs/test-design/harness/L7-pack-publication-remote-test-design.md
github_issue_id: 414
agent_slots:
  - role: tl
    slot_label: "Sol - L6 remote publication契約とL7 adapterの境界を逆向き検証する"
  - role: qa
    slot_label: "Terra - approval/CAS/nonce/partialの候補oracleを独立照合する"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-515-pack-remote-canary-publication-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-pack-publication-remote-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-515-pack-remote-canary-publication.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
    - docs/plans/PLAN-REVERSE-505-pack-staged-release-rollback-backfill.md
    - docs/plans/PLAN-L7-508-pack-publication-staging-auditor.md
    - docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
    - docs/test-design/harness/L7-pack-publication-remote-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/414
review_evidence: []
---

# PLAN-REVERSE-515: Pack remote canary publication の逆向き確認

## R0 / R1: Forward 契約の逆向き分解

Issue #414 の remote publication を、`PLAN-L7-508` の sealed local staging と
`PLAN-L6-63` の段階公開契約の接合面として確認する。L6 が所有する immutable release
identity、human approval、Pack main/pointer CAS、append-only receipt、typed
`partial_publication`/`indeterminate`、supersede-forward recovery を別の仕様として再定義
しない。L7 はこれらを注入 port の呼出順と独立 mutation oracleへ降下するだけである。

## Backprop scope

| 層 | 判定 | 根拠 |
| --- | --- | --- |
| requirements | not_impacted | Pack独立配布とhuman-approved internal canaryの既存要求を変更しない。 |
| L4-basic-design | not_impacted | source、Pack、consumerの責務境界と開発元非依存を変更しない。 |
| L5-detailed-design | not_impacted | 新規DB/schemaや共有状態を追加せず、注入remote portだけを後続実装へ渡す。 |
| L6-function-design | not_impacted | 段階公開、CAS、receipt、fail-close、supersede-forwardの正本はPLAN-L6-63に保持する。 |
| L7-unit-test-design | updated | CANDIDATE-PACKPUB-003をapproval/operation/CAS/nonce/partial oracleへ1:1に具体化する。 |

## Candidate crosswalk

| candidate | 対応境界 | 独立 oracle |
| --- | --- | --- |
| `CANDIDATE-PACKPUB-003` | approvalとremote mutation | approval absent/stale/wrong、expected main/pointer drift、nonce replay、PR/merge/tag/Release/asset/pointerの順序・応答不明・identity mismatch、auditor前 pointer write 0 |
| `CANDIDATE-PACKPUB-004` | rollback | 本PLANでは再所有しない。既存L6-63のsupersede-forwardと後続aggregateへ参照だけを渡す。 |

## R2〜R4 出口

後続実装では、`CANDIDATE-PACKPUB-003`を同名系統の `U-PACKPUB-REMOTE-*` として昇格し、
各 deny と各 fault boundary を注入 portのspy/count、identity digest、before/after
observationで独立に測る。実Pack/GitHub remoteのcredentialや外部書込みを単体・統合テストへ
持ち込まず、Linux/Windows/aggregate の CI 証跡を同じ exact HEAD へ束縛する。

R4 は、上位L6契約に新しい要求や変更が無いこと、local stagingとの重複実装が無いこと、
consumer E2Eとstable promotionを未完のまま保持していることを確認した後にだけ、
`gap-only / reuse-as-is` として閉じる。publication receipt、CI、Claude non-author closing
receiptが揃う前にR4完了を主張しない。
