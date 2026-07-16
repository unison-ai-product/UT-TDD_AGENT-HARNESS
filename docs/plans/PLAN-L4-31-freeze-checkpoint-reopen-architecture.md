---
plan_id: PLAN-L4-31-freeze-checkpoint-reopen-architecture
title: "PLAN-L4-31 (add-design/function): 工程Freeze Checkpointと再開放判定アーキテクチャ"
kind: add-design
layer: L4
sub_doc: function
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-16
updated: 2026-07-16
owner: PO / Codex
parent_design: docs/design/harness/L4-basic-design/function.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L9-system-test-design.md
next_pair_freeze: L9
agent_slots:
  - role: tl
    slot_label: "TL - checkpoint境界と再開放の上流判定"
  - role: se
    slot_label: "SE - Ledger receipt/outbox/tag reconcile設計"
  - role: qa
    slot_label: "QA - 影響閉包・再検証・不変tagのoracle"
generates:
  - artifact_path: docs/plans/PLAN-L4-31-freeze-checkpoint-reopen-architecture.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L9-system-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires:
    - docs/plans/PLAN-L4-23-forward-fsm-plan-asset-v2.md
    - docs/plans/PLAN-L6-50-execution-assignment-ledger.md
  blocks:
    - docs/plans/PLAN-L5-24-freeze-checkpoint-reopen-physical-data.md
    - docs/plans/PLAN-L6-87-freeze-checkpoint-reopen-contract.md
    - docs/plans/PLAN-L7-442-freeze-checkpoint-ledger-tag-projection.md
    - docs/plans/PLAN-L7-443-reopen-impact-reverification-gate.md
  references:
    - docs/plans/PLAN-L4-30-execution-ledger-github-architecture.md
    - docs/plans/PLAN-L6-48-vmodel-l2-freeze-l5-verification-design.md
    - docs/plans/PLAN-L7-393-vmodel-l2-freeze-l5-verification-gate.md
    - docs/plans/PLAN-L6-83-forward-escape-issue-contract.md
    - docs/plans/PLAN-L6-84-drive-model-reentry-verification-contract.md
review_evidence: []
---

# PLAN-L4-31: 工程Freeze Checkpointと再開放判定アーキテクチャ

## 0. 目的

工程完了時の凍結を、過去の確定基準点と今回の変更が再開放すべき最上流工程を示す durable な証跡にする。Git tag は不変の外部アンカーであり、正本は Execution Ledger の `FreezeCheckpoint` / `ReopenAssessment` event と receipt である。pair/trace の局所 `pending → frozen` を置換せず、工程全体を束ねる checkpoint を追加する。

## 1. checkpoint契約

tag は `freeze/<gate>/<scope>/<ordinal>` の annotated / protected tag とし、Release や `vX.Y.Z` version tag と混同しない。tag の削除・移動は再開放表現として禁止する。`FreezeReceipt` は freeze ID、tag name/object OID、target commit/tree、gate/scope、policy revision、親freeze、PLAN revision/design/test/code/evidence manifest digest、trace graph digest、oracle/evidence/approval/branch-protection snapshot digestを不可分に束縛する。

`FreezeRequested` をappendしてoutboxへ登録し、外部tagをreconcileした時だけ `FreezeAnchored` をappendする。GitHub停止・tag API timeout時もLedger上の意図は保持するが、anchor済みと推測しない。

## 2. 再開放

`evaluateReopen(baselineFreeze, candidateCommit)` は manifest diff と typed trace/relation graph の推移閉包から `reopen_from`（影響を受ける最上流gate）と、下流の `invalidated_pending_reverify` checkpointを導出する。manifest外かつ閉包0だけを no-impact とする。旧tagは残し、assessmentと再検証証跡をappend-onlyで残す。次checkpointはbaseline、reopen closure、無効化tag、再検証evidenceを参照する。

## 3. Execution Episodeとの接続

通常ForwardはIssue不要である。off-Forward Issueだけに origin freeze/tag、reopen_from、invalidated checkpoint、drive model、reentry target、required re-freeze gateをprojectionする。E9 certificateはbaseline/reopen assessment/reverify evidenceを束縛し、invalidated checkpointが未検証ならE10/E12/E14をhard rejectする。E15はmain検証とrequired re-freeze anchorを確認して閉じる。

## 4. 受入条件

- [ ] checkpoint/tag/receiptが不変で、Git tag単独を正本にしない。
- [ ] 変更から最上流再開放点と下流無効化範囲を決定論的に導出する。
- [ ] no-impact、tag移動、receipt不一致、未再検証の再合流/PR/mergeを負系で拒否する。
- [ ] `U-FREEZE-001..006`、`U-REOPEN-001..007`、`IT-FREEZE-01..04`、`ST-FREEZE-01..03` をV-pairへ配置する。

## 5. 工程表

| 順序 | 作業 | 完了証跡 |
|---|---|---|
| 1 | L4 checkpoint/reopen境界をfunctionへ追記 | L9 oracle設計 |
| 2 | L5 receipt/assessment projectionを設計 | migration/rebuild設計 |
| 3 | L6 command/policyをfreeze | L7 Red oracle |
| 4 | Ledger/tag/reopen gateを実装 | unit/integration/system evidence |
