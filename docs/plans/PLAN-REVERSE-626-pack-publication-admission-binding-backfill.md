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
updated: 2026-09-17
owner: Claude control lane（文書是正、PO 判断 2026-09-16）・Codex Sol（非著者検収）
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
  receipt_id: certificate:711099c53ce63c6cc1bc1852f09441da
  command_id: plan-revise:issue-626:pr636-reverse:r2:c36c6a9d502e
  admitted_at: 2026-09-17T01:03:03.820Z
  source_digest: sha256:68cf99d8bb9a8baf85c2d4c435e0a8a2b6a5644a2fc87bb1518620d0a8665fa5
  decision_digest: sha256:7a67e57693ed4b28433478fde75133bfca0432b0ca1c6e39453b57e61b1df10e
  receipt_digest: sha256:c24c0dc718341507be22d0e8d658be6832cd1723b114ed8b2d8af17b7c0fac81
  binding:
    path: docs/plans/PLAN-REVERSE-626-pack-publication-admission-binding-backfill.md
    plan_id: PLAN-REVERSE-626-pack-publication-admission-binding-backfill
    asset_id: plan:a00a5eddd4929e67b7e26820aac193f6
    revision: 2
    content_digest: sha256:68cf99d8bb9a8baf85c2d4c435e0a8a2b6a5644a2fc87bb1518620d0a8665fa5
  route:
    signal: reverse
    mode: reverse
  issue:
    provider: github
    issue_id: 626
    episode_id: E4-626-pack-publication-admission-binding
    projection_digest: sha256:4e5c8b8b398076d56a72deb696afa871b9c259e667c9bb65f22ef2816ca1d8b4
  origin:
    plan_id: PLAN-L7-626-pack-publication-admission-binding
    revision: 2
    digest: sha256:d20b4fddf2ff1bdca422339da849ce9f12b885b47d7177e5fc2f05cf112558e0
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-REVERSE-626-pack-publication-admission-binding-backfill
    target_revision: 2
    phase: forward_merge
  escape_reason: "Issue #626 PR #636 rev 2: PLAN-L7-626 rev 2 (28 guard、sealing
    所有、receipt digest 形状の L7 新設) に R0/R1/R3-R4 を同期。"
---

# PLAN-REVERSE-626: Pack公開 admission binding の上位契約backfill

## R0: gap

#625 は sealed staging identity と PR preparation receipt を固定したが、review 後に同じ
PR/base/head/branch/tree が維持され、non-author review と ruleset が要求する required check が
同じ head へ結び付くこと、merge-base が expected main と一致すること、operation/idempotency/PR/
staging digest/expected main OID を再利用していないこと、repository / target ref / ruleset /
installation の identity が sealed 値と一致することを上位契約へ戻していない。closing review
receipt digest の形状 (`sha256:` + 64 lowercase hex) も上位に無い。これらが無いと #627 が
publication/CAS intent を安全に受け取れない。

## R1: 上位不変条件

- preparation receipt の staging tree/manifest digest、expected main OID、branch 名、PR number/
  head/base/tree、operation ID、idempotency key は immutable であり、caller 補完を許可しない。
  receipt digest は receipt bytes から導出し、field としては持たない (#625 §2 と同じ field 集合)。
- admission は repository/authority、PR、review、check、merge-base、staging、freshness を同一
  観測 digest へ束縛し、28 guard 全件を 1 軸ずつ fail-close する。review receipt digest 形状、
  非空 required context 集合、required context の被覆、reviewer 非著者は独立必須条件である。
- closing review receipt digest の形状契約 (`/^sha256:[0-9a-f]{64}$/`) は PLAN-L7-626 §2.2 が L7
  で新設したものであり、R4 で PLAN-L7-565 §1.1 の admission 記述へ backfill する。
- PLAN-L7-565 §1.1/§3 が admission に割り当てる sealing 項目 (repository ID/name、installation
  ID、ruleset ID、target ref、expected main OID、preparation receipt、reviewed PR/head、required
  review/check 結論、merge-base、publication intent、mutation approval binding) は #626 の
  admitted record が所有し、#627 は record を再観測・再 seal せず approval consume と CAS token
  mint だけを行う。
- read-only 観測不能は indeterminate、identity 不一致・replay・malformed・caller 上書き・reviewer
  同一は deny とし、いずれも admitted record、approval consume、remote write 0 で終端する。
- admission 成功は #627 publish/CAS の権限や remote mutation を意味せず、後段は admitted record
  の fresh identity だけを入力とする。#625 の nonce/journal/token を phase 間で再利用しない。

## R2: 逆向き証明

`PLAN-L6-63` の before-state / read-back / indeterminate 保持に対し、L7 admission の repository/
authority identity、expected main、PR base/branch/tree、review/check、merge-base、staging 再観測、
freshness が同じ sealed operation の precondition であることを確認する。全 28 guard の deny と
observer unavailable の indeterminate は、上位 L6 が要求する副作用前の write-zero へ写像される。
完全一致 replay だけは同一 digest の record を再構成し、1 軸 drift は再利用ではなく新規 deny
となる。

## R3-R4: 再合流

R3 で実装 PR の 36 candidate、対象テスト、exact-head CI、非著者 review を照合する。R4 で
repository/authority、review/check/base/freshness の不変条件、receipt digest 形状、sealing 項目の
所有と typed failure を上位 staged-release contract (PLAN-L7-565 §1.1/§3、PLAN-L6-63) へ backfill
し、#627 の publish/CAS admission 入力へ戻す。remote 実装、Release/tag/pointer、existing adapter
の再構成はこの Reverse の責務外とする。

## 改訂記録

- rev 2 (2026-09-17、Claude control lane): PR #636 の非著者 Claude Opus review (receipt
  `71c7b9bd…`) に合わせ、R0/R1 を PLAN-L7-626 rev 2 (28 guard、sealing 項目の所有、receipt
  digest 形状の L7 新設、合成 fixture) と同期し、admission record を canonical `plan revise` で
  再発行。
