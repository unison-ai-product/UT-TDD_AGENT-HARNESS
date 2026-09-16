---
plan_id: PLAN-L6-627-pack-publication-admitted-publish
title: "PLAN-L6-627: admitted Pack公開のdeny境界契約"
kind: add-design
layer: L6
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-09-16
updated: 2026-09-16
owner: Luna worker（実装）・Claude Opus（非著者検収）
parent_design: docs/plans/PLAN-L7-565-pack-publication-atomic-ref-cas.md
pair_artifact: docs/test-design/harness/L7-pack-publication-admitted-publish-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: se
    slot_label: Luna worker - admitted preparation receiptからpublish deny境界を結線するbounded実装
  - role: qa
    slot_label: Terra - admission不在・不正入力のremote write 0 oracleを検証する
  - role: tl
    slot_label: Claude Opus - admission identity、typed deny、上位CAS契約を非著者検収する
generates:
  - artifact_path: docs/plans/PLAN-L6-627-pack-publication-admitted-publish.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-565-pack-publication-atomic-ref-cas.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-565-pack-publication-atomic-ref-cas.md
    - docs/plans/PLAN-L7-625-pack-publication-preparation.md
    - docs/plans/PLAN-L6-626-pack-publication-admission-binding.md
    - docs/test-design/harness/L7-pack-publication-admitted-publish-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/627
review_evidence: []
status: draft
github_issue_id: 627
admission_receipt:
  schema_version: v2
  receipt_id: certificate:bbea476248b5c85bce3521539dbd2948
  command_id: plan-revise:issue-627:admitted-publish:2
  admitted_at: 2026-09-16T17:05:00+09:00
  source_digest: sha256:64e4b622e6c4748a649916775274d67e4e0cf86bc04e514e684df925f163dee6
  decision_digest: sha256:5eedbddaa22fd28817f68005804b75dd3b0b2b56f35b299619e97415d68b50e7
  receipt_digest: sha256:982a102dcfa0ed475d8f187285e1c5bf4dc0c9c6e63d01ba192d904eda9836a9
  binding:
    path: docs/plans/PLAN-L6-627-pack-publication-admitted-publish.md
    plan_id: PLAN-L6-627-pack-publication-admitted-publish
    asset_id: plan:302ed04103668f826b436e909f012d75
    revision: 2
    content_digest: sha256:64e4b622e6c4748a649916775274d67e4e0cf86bc04e514e684df925f163dee6
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 627
    episode_id: E4-627-pack-publication-admitted-publish
    projection_digest: sha256:0000000000000000000000000000000000000000000000000000000000000000
  origin:
    plan_id: PLAN-L7-565-pack-publication-atomic-ref-cas
    revision: 1
    digest: sha256:efd67cb89dbf6e187fd998c062972332a868e868ee5b70993be4080a9ccb6647
  transition:
    direction: design_to_implementation
    implementation_disposition: none
  reentry:
    target_plan_id: PLAN-L6-627-pack-publication-admitted-publish
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue #627
    の第三sliceとして、admission済み入力だけをpublishへ渡すdeny境界を#625/#626から分離する契約freeze。実remote
    mutationは後続実装・運用ゲートへ残す。"
---

# PLAN-L6-627: admitted Pack公開のdeny境界契約

## 1. 目的と境界

Issue #627 は、#625 の preparation receipt と #626 の admission observation が成立した入力だけを
publication port へ渡す境界を定義する。admission が無い、期限切れ、別 operation、別 staging identity、
review/check/base の不一致、または receipt が破損している場合は typed `admission_required` / `admission_mismatch`
として拒否し、remote write を 0 件にする。

## 2. 固定契約

* publish 入口は admitted preparation receipt、再観測済み exact PR head/base、closing review、required checks、
  sealed staging identity の全一致を要求する。receipt や review の basename・本文・自己申告だけで補完しない。
* admission から publish への入力は immutable に束縛し、operation、idempotency key、expected main OID、PR number、
  head OID、tree/manifest digest、release identity を単独変異させても拒否する。
* deny、indeterminate、replay、read-back mismatch、例外、応答欠落のいずれも `publish` port、tag、Release、
  channel pointer を呼ばず、journal の後続 mutation を 0 件にする。
* 完全一致した同一 operation の再観測だけを read-only replay として許可する。新しい operation や差分入力は
  新しい admission が無い限り再利用しない。

## 3. 対象 oracle

`CANDIDATE-PACKPUB-ADMIT-001..008`を、admission 欠落、receipt digest、operation/idempotency、PR head/base、
review/check、staging identity、expected main OID、remote write 0 の独立軸へ昇格する。各テストは対象 guard を
一つだけ変異させ、恒真・dummy port・旧 receipt の流用で Green にしない。

## 4. 後続への引き継ぎ

#625 は preparation mutation と no-clobber receipt、#626 は read-only admission binding のみを所有する。
#627 は admitted input の typed deny と既存 publication port への最小結線だけを所有し、CAS primitive、Release
asset生成、canary acceptance (#418)、stable昇格、rollback自動化を実装しない。

## 5. 完了条件

本契約と専用 test-design の cross-review、implementation 前の pair-freeze、Red→Green の独立 deny oracle、
plan lint、Linux/Windows/aggregate CI、exact-head 非著者 closing receipt を取得する。production credential や
実 remote publication は別運用ゲートの対象とする。

