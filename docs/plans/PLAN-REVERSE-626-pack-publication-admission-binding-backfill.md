---
plan_id: PLAN-REVERSE-626-pack-publication-admission-binding-backfill
title: "PLAN-REVERSE-626: Pack公開 admission binding の上位契約backfill"
kind: reverse
layer: cross
drive: agent
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
created: 2026-09-16
updated: 2026-09-16
owner: Codex / Luna worker・Claude Opus（非著者検収）
forward_routing: gap-only
promotion_strategy: reuse-as-is
backprop_decision: required
backprop_decision_reason: "#625 preparation
  receiptに無かったreview/check/base/freshnessのadmission不変条件を、 staged releaseの上位L6
  before-state契約へ逆向きに戻し、publish/CASの入力を保証する。"
parent_design: docs/plans/PLAN-L7-626-pack-publication-admission-binding.md
pair_artifact: docs/test-design/harness/L7-pack-publication-admission-binding-test-design.md
agent_slots:
  - role: tl
    slot_label: Claude Opus - L6 staging/admission境界とL7 read-only bindingの同値性を検証
  - role: qa
    slot_label: Terra - 15 guard、indeterminate、write-zero、replayの逆向き検証
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-626-pack-publication-admission-binding-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-626-pack-publication-admission-binding.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-63-pack-staged-release-rollback.md
    - docs/plans/PLAN-L7-565-pack-publication-atomic-ref-cas.md
    - docs/plans/PLAN-L7-625-pack-publication-preparation.md
    - docs/test-design/harness/L7-pack-publication-admission-binding-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/626
review_evidence: []
workflow_phase: R0
status: draft
github_issue_id: 626
admission_receipt:
  schema_version: v2
  receipt_id: certificate:a00a5eddd4929e67b7e26820aac193f6
  command_id: plan-draft:issue-626:admission-binding:reverse:1
  admitted_at: 2026-09-16T10:01:00.000+09:00
  source_digest: sha256:2000a762db8e83539130efe79d4fe4003aec6288d6c7c4f09d531058d74acd2a
  decision_digest: sha256:9e1546d9bb7793ac951f47eb4896222a87d5c510f3cd1cf42312a990502b2c5e
  receipt_digest: sha256:c012805726e21b06d2efda371a0b5c662db78fc5b38b946d3323549af078c954
  binding:
    path: docs/plans/PLAN-REVERSE-626-pack-publication-admission-binding-backfill.md
    plan_id: PLAN-REVERSE-626-pack-publication-admission-binding-backfill
    asset_id: plan:a00a5eddd4929e67b7e26820aac193f6
    revision: 1
    content_digest: sha256:2000a762db8e83539130efe79d4fe4003aec6288d6c7c4f09d531058d74acd2a
  route:
    signal: reverse
    mode: reverse
  issue:
    provider: github
    issue_id: 626
    episode_id: E4-626-pack-publication-admission-binding
    projection_digest: sha256:4e5c8b8b398076d56a72deb696afa871b9c259e667c9bb65f22ef2816ca1d8b
  origin:
    plan_id: PLAN-L7-626-pack-publication-admission-binding
    revision: 1
    digest: sha256:c2657640d2217afe383fd42ee8bdf8b489112884cb0a90e996e3fe885c461a9e
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L7-626-pack-publication-admission-binding
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue #626 Reverse R0 backfill: bind admission
    review/check/base/freshness invariants to the upper staged-release
    contract."
---

# PLAN-REVERSE-626: Pack公開 admission binding の上位契約backfill

## R0: gap

#625 は sealed staging identity と PR preparation receipt を固定したが、review後に同じ
PR/base/headが維持され、non-author reviewとrequired checksが同じheadへ結び付くこと、
merge-baseがexpected mainと一致すること、operation/idempotency/PRを再利用していないことを
上位契約へ戻していない。これらが無いと #627 が publication/CAS intentを安全に受け取れない。

## R1: 上位不変条件

- preparation receiptのstaging tree/manifest digest、expected main OID、PR number/head/base/tree、
  operation ID、idempotency keyはimmutableであり、caller補完を許可しない。
- admissionはPR/review/check/merge-base/freshnessを同一観測digestへ束縛し、15 guard全件を
  1軸ずつfail-closeする。review receipt digest形状と非空 required checksは独立必須条件である。
- read-only観測不能は indeterminate、identity不一致・replay・malformedは deny とし、いずれも
  admitted intent、approval consume、remote write 0で終端する。
- admission成功は #627 publish/CASの権限やremote mutationを意味せず、後段はadmitted recordの
  fresh identityだけを入力とする。#625のnonce/journal/tokenをphase間で再利用しない。

## R2: 逆向き証明

`PLAN-L6-63` の before-state / read-back / indeterminate保持に対し、L7 admissionの
expected main・PR base・review/check・merge-base・freshnessが同じsealed operationの
preconditionであることを確認する。全15 guardのdenyとobserver unavailableのindeterminateは、
上位L6が要求する副作用前のwrite-zeroへ写像される。完全一致replayだけは同一digestのrecordを
再構成し、1軸driftは再利用ではなく新規denyとなる。

## R3-R4: 再合流

R3で実装PRの18 candidate、対象テスト、exact-head CI、非著者 reviewを照合する。R4で
review/check/base/freshnessの不変条件とtyped failureを上位 staged-release contractへ
backfillし、#627 の publish/CAS admission入力へ戻す。remote実装、Release/tag/pointer、
existing adapterの再構成はこのReverseの責務外とする。
