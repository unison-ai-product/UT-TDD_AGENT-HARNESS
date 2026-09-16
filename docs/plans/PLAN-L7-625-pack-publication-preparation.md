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
    slot_label: Luna worker - sealed stagingから準備receiptとintentを作るbounded実装
  - role: qa
    slot_label: Terra - 準備mutationのtyped failureとno-write oracle
  - role: tl
    slot_label: Claude Opus - 契約境界とremote write 0を非著者検収
generates: []
dependencies:
  parent: docs/plans/PLAN-L7-565-pack-publication-atomic-ref-cas.md
  requires: []
  references:
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
  receipt_id: certificate:7018d3e985a7ebf6e9cd7d90b29e2ba9
  command_id: plan-draft:issue-625:preparation:1
  admitted_at: 2026-09-16T08:10:00.000Z
  source_digest: sha256:fa31903b6d9b1e1c5d691a2dd44980c704d38c33ec29001d0f74b317c88effca
  decision_digest: sha256:4ff903718fb019eef6ac02ab3589b474981bc1a86ee54c0805b31adf8a8e017e
  receipt_digest: sha256:ea6eed5b6093afe79d0c0801c37e4b4cbccd42c0fdbafc79696b2eb93013df1b
  binding:
    path: docs/plans/PLAN-L7-625-pack-publication-preparation.md
    plan_id: PLAN-L7-625-pack-publication-preparation
    asset_id: plan:7018d3e985a7ebf6e9cd7d90b29e2ba9
    revision: 1
    content_digest: sha256:fa31903b6d9b1e1c5d691a2dd44980c704d38c33ec29001d0f74b317c88effca
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
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue #624 の三分割に従い、旧#608の巨大実装から準備receiptとpublication
    intentだけを契約として分離する。admission・publish・remote mutationは後続sliceへ残す。"
---

# PLAN-L7-625: Pack公開準備の契約freeze

## 1. 目的と境界

Issue #625 は、sealed staging identityからpublication preparationを作り、branch commit・PR観測・publication intentを一つの再現可能な準備receiptへ束縛する。ここでremote main、Release、asset、tag、channel pointerは変更しない。既存の#565全体契約を変更せず、準備だけを#626（admission）と#627（publish deny）から分離する。

## 2. 固定契約

* 入力はsealed stagingのtree/manifest digest、expected Pack main OID、deterministic branch name、operation ID、idempotency keyだけとする。current worktreeやPack checkoutから補完しない。
* branch commitとPR createは別々のhuman approval/nonceを消費し、各consume直後に `planned_nonce_consumed` をappendする。nonce、operation、journal、receiptはadmission/publicationと共有しない。
* 各mutationは `mutation_intent` → `read_back_observation` の順で記録し、PR number、exact head/base OID、tree digestをatomic no-clobber preparation receiptへ確定する。
* preparationはmain/Release/asset/tag/pointer writeを0件に保つ。remote失敗、応答欠落、timeout、stale/replay、観測不一致はtyped denyまたはindeterminateとし、後続writeを0件にする。
* 同じoperationの完全一致replayだけをreceipt再構成として許可し、staging digest・expected main OID・PR identityのいずれかが変わればfail-closeする。

## 3. 対象oracle

`CANDIDATE-PACKPUB-PREP-001..008`を、sealed入力、fresh nonce、mutation順序、PR read-back、no-clobber receipt、crash reconciliation、stale/replay、remote write 0の各独立軸へ一対一で昇格する。恒真アサーション、dummy port、旧publication nonceの流用でGreenにしない。

## 4. 後続への引き継ぎ

#626 は preparation receiptをread-onlyで再観測し、review/check/base/headのadmission bindingだけを所有する。#627 は admitted intentからのpublish denyとtyped no-writeだけを所有する。#625でreview gate、main CAS、Release公開、canary pointerを実装しない。

## 5. 完了条件

PLANとpair test-designのcross-review後、準備単体のRed→Green、plan lint、Linux/Windows/aggregate CI、exact-head非著者closing receiptを取得する。production credential、remote mutation、Pack公開は範囲外とする。
