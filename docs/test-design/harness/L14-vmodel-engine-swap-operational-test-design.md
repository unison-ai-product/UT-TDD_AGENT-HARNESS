---
layer: L1
executed_at_layer: L14
artifact_type: test_design
status: confirmed
revision_track: additive
revision_base_artifact: docs/test-design/harness/L14-operational-test-design.md
pair_artifact: docs/design/harness/L1-requirements/vmodel-engine-swap-requirements-delta.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
next_pair_freeze: L1
plan: docs/plans/PLAN-L1-07-vmodel-engine-swap-requirements-delta.md
created: 2026-07-10
updated: 2026-07-10
---

# Vモデルengine-swap 要件delta 運用テスト設計

本書は既存`L14-operational-test-design.md`のconfirmed OT-01〜47を変更せず、`PLAN-L1-07`のadditive L1 deltaだけと対になる。
confirmed化はOT設計のpair-freeze承認を表し、OT実行完了やengine-swap program完遂を表さない。

| 要求 | 運用oracle | green条件 |
|---|---|---|
| VUP-REQ-08A | OT-VUP-008A | 109 source / 21 category / 163 item / 8 profileを全削除再構築してorphan 0、gapはdebtへrouteされる |
| VUP-REQ-09 | OT-VUP-009 | illegal Forward transition、stale evidence、wrong revisionでacceptを拒否する |
| VUP-REQ-10 | OT-VUP-010 | contract由来detectorの全ruleが独立mutationで発火し、survivor 0のreceiptを残す |

## G14-WORKFLOW

test_strategy: active engine-swap revisionだけを既存L1/L14 freezeと分離してrisk-basedに検証する。
test_plan: U18a〜gおよびL8〜L14 verify PLANのevidence manifestをOT-VUP IDへ結合する。
test_conditions: source/item/profile/FSM/PLAN revision/contract/detector mutationの正負入力を用意する。
coverage_items: VUP-REQ-08A/09/10、U18a〜g、L8〜L14、全docs/163 item/self-proof。
test_procedures: db rebuild、doctor、CLI/process exit、mutation、CI、PO/TL signoffを実行する。
execution_evidence: OT ID、asset revision、commit、command、exit、finding code、receipt、signoffを記録する。
exit_criteria: 必須OTがpassし、pending/gap/debt/mutation survivorが未記録のままacceptされない。
defect_routing: owning left layer、Reverse、Recovery、debt PLAN、次サイクルL0 feedbackへrouteする。
verification_design: 実行環境、独立oracle、mutation operator、証拠freshnessをOTごとに固定する。
