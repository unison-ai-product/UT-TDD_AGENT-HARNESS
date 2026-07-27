---
plan_id: PLAN-RECOVERY-17-redesign-bundle-reentry
title: "PLAN-RECOVERY-17: Redesign bundle / Forward reentry recovery"
kind: recovery
layer: cross
drive: agent
route_signal: regression_dev
route_mode: recovery
created: 2026-07-27
updated: 2026-07-27
owner: PO / TL
backprop_decision: required
backprop_decision_reason: Redesign supersession の origin correction と
  replacement を同一 command group へ束縛する契約を L6 admission と L7 実装へ戻す必要がある。
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
agent_slots:
  - role: tl
    slot_label: TL - Redesign bundle / Forward reentry 契約
  - role: se
    slot_label: SE - bundle coordinator / publisher integration
  - role: qa
    slot_label: QA - 片肺 fault / admission and supersession oracle
  - role: aim
    slot_label: AIM - asset identity / provenance integrity review
generates:
  - artifact_path: docs/plans/PLAN-RECOVERY-17-redesign-bundle-reentry.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-RECOVERY-16-plan-revision-authoring.md
  requires: []
  references:
    - docs/plans/PLAN-L4-31-snapshot-runner-performance-design.md
    - docs/plans/PLAN-L7-89-plan-errata-supersession-gate.md
review_evidence: []
status: draft
github_issue_id: 102
admission_receipt:
  schema_version: v2
  receipt_id: certificate:3b2874683d6ab48da0bb8a40c28bb283
  command_id: plan-recovery-17-20260727-01
  admitted_at: 2026-07-27T12:24:00+09:00
  source_digest: sha256:3816dee8fbc7d6b5b5a0b336101495ba1d197a75df30268aede84a56ccd34665
  decision_digest: sha256:48da2326c865c5ba5013edc28c142bcd6ecfc46e13062f0086818b3e0108e93b
  receipt_digest: sha256:7525d37ada49e29ec2e43d8c033af4149eb1ebfcf75232950c8c2670da8b496f
  binding:
    path: docs/plans/PLAN-RECOVERY-17-redesign-bundle-reentry.md
    plan_id: PLAN-RECOVERY-17-redesign-bundle-reentry
    asset_id: plan:3b2874683d6ab48da0bb8a40c28bb283
    revision: 1
    content_digest: sha256:3816dee8fbc7d6b5b5a0b336101495ba1d197a75df30268aede84a56ccd34665
  route:
    signal: regression_dev
    mode: recovery
  issue:
    provider: github
    issue_id: 102
    episode_id: E4-102
    projection_digest: sha256:ccf42fa059eaf5950bf84337b180b1541dc68333caa7770ff7570786cf42b110
  origin:
    plan_id: PLAN-RECOVERY-16-plan-revision-authoring
    revision: 3
    digest: sha256:26bd013bec8ac2eafaa99eed4249e5563fd61fd61eab6d15294d6c2e9467132a
  reentry:
    target_plan_id: PLAN-L6-86-drive-plan-admission-contract
    target_revision: 2
    phase: forward_merge
  escape_reason: PLAN-RECOVERY-16 の revision authoring core と未完の redesign bundle /
    Forward reentry を独立資産へ分離する
---

# PLAN-RECOVERY-17: Redesign bundle / Forward reentry recovery

## 1. 背景

PLAN-RECOVERY-16 が復旧した revision authoring core と、未完の Redesign bundle / #98 Forward reentry を別資産として扱う。スコープを削除するための分割ではなく、完了済み core を真正に確定し、未完の設計・実装・検証を独立して追跡するための ownership 移管である。

## 2. 契約

replacement PLAN の `supersedes` と origin revision の back-reference を同一 command group へ束縛し、片肺 publish を許さない。#98 は PLAN-L4-31 revision 2 と後続 PLAN-L6-88 の receipt / projection が揃った場合だけ Forward reentry を Green とする。PLAN-L6-88 は本 PLAN の実装着手前に正規 PLAN asset として起票する。

## 3. TDD工程

| Step | Red oracle | Green target |
|---|---|---|
| 1 | origin correction だけ publish される fault | atomic Redesign bundle |
| 2 | replacement だけ publish される fault | bundle rollback / replay |
| 3 | L4-31 revision 2 または L6-88 receipt 欠落 | fail-close Forward reentry |
| 4 | admission と supersession の片方だけ Green | 同一 evidence による両 gate Green |

## 4. DoD

- [ ] Redesign supersession の origin correction と replacement を片肺にしない。
- [ ] PLAN-L6-88 を正規 asset として起票し、L4-31 revision 2 と対になる設計・検証契約を確定する。
- [ ] #98 の PLAN-L4-31 revision 2 / PLAN-L6-88 で admission と supersession が両方 Green になる。
- [ ] fault injection、replay、Windows/Linux差異を独立 cross-review で検証する。
