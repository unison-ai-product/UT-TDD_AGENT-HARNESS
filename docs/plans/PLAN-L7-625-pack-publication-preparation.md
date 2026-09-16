---
plan_id: PLAN-L7-625-pack-publication-preparation
title: "PLAN-L7-625: Pack公開準備の契約freeze"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-09-16
updated: 2026-09-16
owner: Luna worker（実装）・Claude Opus（非著者検収）
parent_design: docs/plans/PLAN-L7-565-pack-publication-atomic-ref-cas.md
pair_artifact: docs/test-design/harness/L7-pack-publication-preparation-test-design.md
agent_slots:
  - role: se
    slot_label: Luna worker - sealed
      stagingから準備receiptを作り、admission向け入力を確定するbounded実装（publication intentは作らない）
  - role: qa
    slot_label: Terra - 準備mutationのtyped failureとno-write oracle
  - role: tl
    slot_label: Claude Opus - 契約境界とremote write 0を非著者検収
generates: []
dependencies:
  parent: docs/plans/PLAN-L7-565-pack-publication-atomic-ref-cas.md
  requires: []
  references:
    - docs/plans/PLAN-REVERSE-625-pack-publication-preparation.md
    - docs/plans/PLAN-L7-515-pack-remote-canary-publication.md
    - docs/plans/PLAN-L7-532-pack-publication-driver.md
    - docs/test-design/harness/L7-pack-publication-atomic-ref-cas-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/625
  blocks:
    - PLAN-L7-626-pack-publication-admission-binding
status: draft
github_issue_id: 625
admission_receipt:
  schema_version: v2
  receipt_id: certificate:d60d960748407167021c4131789e9fd9
  command_id: plan-revise:issue-625:forward:4
  admitted_at: 2026-09-16T09:57:27.846Z
  source_digest: sha256:eef733b6821c789544cf1934449f76943d4e974dbde2b9708000fa23da1128f1
  decision_digest: sha256:9dbf49b615411b20e0bd1031c3ab3deb4152d7596ef93b8114dea9f066ada655
  receipt_digest: sha256:039c5d639931c1e4c81fe9c8c8f2ce9d8f97901c4e4910efae1bc3313c3aef7c
  binding:
    path: docs/plans/PLAN-L7-625-pack-publication-preparation.md
    plan_id: PLAN-L7-625-pack-publication-preparation
    asset_id: plan:7018d3e985a7ebf6e9cd7d90b29e2ba9
    revision: 4
    content_digest: sha256:eef733b6821c789544cf1934449f76943d4e974dbde2b9708000fa23da1128f1
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 625
    episode_id: E4-625-pack-publication-preparation
    projection_digest: sha256:352492d0ba7b458d19ae625367e1cf23d3d3379b3ef05e28f87aa10f475b721f
  origin:
    plan_id: PLAN-L7-565-pack-publication-atomic-ref-cas
    revision: 1
    digest: sha256:656cfc06ba39837ff70bb729ed6d5f6f90c4df7765e83aa4d0629b0d4cfa285c
  reentry:
    target_plan_id: PLAN-L7-625-pack-publication-preparation
    target_revision: 3
    phase: forward_merge
  escape_reason: "Issue #625 の必須 Reverse pairing を draft references として維持し、Forward
    requires から切り離す。"
---

# PLAN-L7-625: Pack公開準備の契約freeze

## 1. 目的と境界

Issue #625 は、sealed staging identityからpublication preparationを作り、branch commit・PR観測を一つの再現可能な準備receiptへ束縛する。publication intentはこのphaseでは生成せず、#626のread-only再観測とnon-author review/checkが成立したpublication admissionで初めてsealする。ここでremote main、Release、asset、tag、channel pointerは変更しない。既存の#565全体契約を変更せず、準備だけを#626（admission）と#627（publish deny）から分離する。

## 2. 固定契約

* 入力はsealed stagingのtree/manifest digest、expected Pack main OID、deterministic branch name、operation ID、idempotency keyだけとする。current worktreeやPack checkoutから補完しない。
* branch commitとPR createは別々のhuman approval/nonceを消費し、各consume直後に `planned_nonce_consumed` をappendする。nonce、operation、journal、receiptはadmission/publicationと共有しない。preparation receiptは#626のread-only admission入力であり、publication intentやmutation approvalを含めない。
* 各mutationは `mutation_intent` → `read_back_observation` の順で記録し、PR number、exact head/base OID、tree digestをatomic no-clobber preparation receiptへ確定する。
* preparationはmain/Release/asset/tag/pointer writeを0件に保つ。remote失敗、応答欠落、timeout、stale/replay、観測不一致はtyped denyまたはindeterminateとし、後続writeを0件にする。
* 同じoperationの完全一致replayだけをreceipt再構成として許可し、staging digest・expected main OID・PR identityのいずれかが変わればfail-closeする。

## 3. 対象oracle

`CANDIDATE-PACKPUB-PREP-001..010`を、sealed入力、approval欠落、nonce再利用、mutation順序、PR read-back、no-clobber receipt、crash reconciliation、stale/replay、remote write 0、成功receiptのPR identity束縛という各独立軸へ一対一で昇格する。恒真アサーション、dummy port、旧publication nonceの流用でGreenにしない。

## 4. 後続への引き継ぎ

#626 は preparation receiptをread-onlyで再観測し、review/check/base/headのadmission bindingだけを所有する。#627 は admitted intentからのpublish denyとtyped no-writeだけを所有する。#625でreview gate、main CAS、Release公開、canary pointerを実装しない。

## 5. 完了条件

PLANとpair test-designのcross-review後、準備単体のRed→Green、plan lint、Linux/Windows/aggregate CI、exact-head非著者closing receiptを取得する。production credential、remote mutation、Pack公開は範囲外とする。
