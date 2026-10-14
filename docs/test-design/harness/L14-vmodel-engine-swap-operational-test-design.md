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

## 候補 oracle (PLAN-L14-01 から還流、正式 oracle ではない)

| 候補 ID | 観測 | green 条件 |
|---|---|---|
| CANDIDATE-OT-ENGINE-01 | 継続運用の観測窓で、handover と memory、false-green と negative の率、docs / semantic debt の burn-down、保守性を計測する | 観測窓、KPI、baseline と actual の値、feedback と debt の closure が manifest (`.ut-tdd/evidence/g14-operational/engine-swap.json`) に残る |
| CANDIDATE-OT-ENGINE-02 | PO の value outcome (KPI の判定) と残 debt の承認、program の exit decision | operational blocker 0、value KPI の判定が記録済み、残 debt に承認がある、exit decision が記録済み |

失敗の差戻し先: 運用の欠陥は L14 または Incident、価値が届かない場合は L0 / L1、設計の欠陥は Reverse、実装の欠陥は L7。
KPI の具体値は未確定であり、候補を正式 oracle へ昇格する時に決める。
