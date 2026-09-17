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
    slot_label: Codex Sol - L6 staging/admission 境界と L7 read-only binding の同値性を非著者検証
  - role: qa
    slot_label: Terra - 45 guard、indeterminate、write-zero、replay、intent / approval
      binding の逆向き検証
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
  receipt_id: certificate:407aaae30cde320fbd677c15e9e7221a
  command_id: plan-revise:issue-626:pr645-reverse:r10:3eed4f9b6e53
  admitted_at: 2026-09-17T03:33:30.749Z
  source_digest: sha256:f2bb55cbbd0326ec91afb70a262557cbff0ffef3f8ab9320c7b41173ad714442
  decision_digest: sha256:db2cca973da894dc404f4424536e8a0fb5c657d9bb30fc3b97269644cb111966
  receipt_digest: sha256:952fa086f0aed2ca0df6a2120aeb2b9c53aedbeea6aa51cb442cbde1af34b0a5
  binding:
    path: docs/plans/PLAN-REVERSE-626-pack-publication-admission-binding-backfill.md
    plan_id: PLAN-REVERSE-626-pack-publication-admission-binding-backfill
    asset_id: plan:a00a5eddd4929e67b7e26820aac193f6
    revision: 10
    content_digest: sha256:f2bb55cbbd0326ec91afb70a262557cbff0ffef3f8ab9320c7b41173ad714442
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
    revision: 10
    digest: sha256:9e0d38448ef674516dc29950f42ae31e5d680cec013a06e8bffa279d9b766300
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-REVERSE-626-pack-publication-admission-binding-backfill
    target_revision: 10
    phase: forward_merge
  escape_reason: "Issue #626 PR #647 rev 10: PLAN-L7-626 rev 10 (approval 束縛の組)
    と同期。旧 rev 9: PLAN-L7-626 rev 9 (45 guard、candidate 70) と同期。旧 rev 8: R1 の
    backfill 対象に reviewed head 形状契約を追加し PLAN-L7-626 rev 8 と同期。旧 rev 7:
    PLAN-L7-626 rev 7 (43 guard、§2.1 の #625 整合、candidate 68) に R1 と slot を同期。旧
    rev 6: PLAN-L7-626 rev 6 (42 guard、§8 対応表、candidate 65) に R1/R2/R3 と slot
    を同期。"
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

- preparation receipt は #625 §2 のとおり PR number / head / base / tree digest の 4 field を確定し、
  発行元 operation の sealed staging identity (staging tree/manifest digest、expected main OID、branch
  名、operation ID、idempotency key) へ束縛される (#625 test-design PREP-010)。sealed staging identity
  は sealed staging record の read-only 観測からのみ取り、receipt / caller から補完しない。receipt
  digest は receipt bytes から導出し、field としては持たない。
- admission は repository/authority、PR、review、check、merge-base、staging、freshness、approval
  を同一観測 digest へ束縛し、45 guard 全件を 1 軸ずつ fail-close する。review receipt digest
  形状、非空 required context 集合、期待 required context 集合との集合一致、required context の
  被覆、reviewer 非著者、receipt 存在 / schema、preparation journal 由来の PR、approval の束縛先
  、集合帰属、未消費、非空は独立必須条件である。
- freshness は PLAN-L7-565 §1.1 のとおり「operation ID / idempotency key が未使用で、同一 PR が
  別 operation・別 staging digest・別 expected main OID の admission に使用されていない」ことで
  あり、expected main OID や staging digest を globally single-use にしない。完全一致 replay
  (同一識別子かつ同一観測束 digest) だけが同一 record の再構成として freshness の例外になる。
- publication intent identity は admission が導出する canonical digest であり、mutation approval
  binding は approval nonce をその identity へ束縛した digest である。admission は approval を
  消費せず、consume と CAS token mint は #627 に残る。
- reviewed head OID の形状契約 (`/^[0-9a-f]{40}$/`、Git SHA-1 object 形式) と
  closing review receipt digest の形状契約 (`/^sha256:[0-9a-f]{64}$/`) は PLAN-L7-626 §2.2 が L7
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
freshness が同じ sealed operation の precondition であることを確認する。全 45 guard の deny と
observer unavailable の indeterminate は、上位 L6 が要求する副作用前の write-zero へ写像される。
完全一致 replay だけは同一 digest の record を再構成し、1 軸 drift は再利用ではなく新規 deny
となる。

## R3-R4: 再合流

R3 で実装 PR の 70 candidate、対象テスト、exact-head CI、非著者 review を照合する。R4 で
repository/authority、review/check/base/freshness の不変条件、receipt digest 形状、sealing 項目の
所有と typed failure を上位 staged-release contract (PLAN-L7-565 §1.1/§3、PLAN-L6-63) へ backfill
し、#627 の publish/CAS admission 入力へ戻す。remote 実装、Release/tag/pointer、existing adapter
の再構成はこの Reverse の責務外とする。

## 改訂記録

- rev 2 (2026-09-17、Claude control lane): PR #636 の非著者 Claude Opus review (receipt
  `71c7b9bd…`) に合わせ、R0/R1 を PLAN-L7-626 rev 2 (28 guard、sealing 項目の所有、receipt
  digest 形状の L7 新設、合成 fixture) と同期し、admission record を canonical `plan revise` で
  再発行。
- rev 3 (2026-09-17、Claude control lane): PR #645 の非著者 Codex Sol review (receipt `d5e923c4…`、
  FLAG 5) に合わせ、R0/R1 を PLAN-L7-626 rev 3 (38 guard、freshness の #565 §1.1 準拠、intent
  identity / approval binding、49 candidate) と同期。
- rev 4 / rev 5 (2026-09-17、Claude control lane): PR #645 の Codex Sol review r2 (receipt `1b240cb7…`) /
  r3 (receipt `b921a632…`) に合わせ、R1/R2/R3 と slot を PLAN-L7-626 rev 4 (39 guard) / rev 5
  (40 guard、G40 approval 非空) と同期。
- rev 6 (2026-09-17、Claude control lane): Codex Sol review r4 (receipt `19e8d523…`) に合わせ、
  PLAN-L7-626 rev 6 (42 guard、G41/G42 caller 供給拒否、§8 predicate→candidate 対応表、candidate 65)
  と同期。
- rev 7 (2026-09-17、Claude control lane): Codex Sol review r5 (receipt `8c85f286…`、upstream conflict) を
  受けた再出。R1 の receipt 記述を #625 §2 / PREP-010 (4 field + sealed staging identity への束縛) に
  合わせ、PLAN-L7-626 rev 7 (43 guard、G43、candidate 68) と同期。
- rev 8 (2026-09-17、Claude control lane): Codex Sol review r1 (PR #647、receipt `17281c87…`) に合わせ、R1 の
  backfill 対象に reviewed head OID の形状契約を追加し、PLAN-L7-626 rev 8 (G16 strict schema) と同期。
- rev 9 (2026-09-17、Claude control lane): Codex Sol review r2 (PR #647、receipt `ee2993ef…`) に合わせ、
  PLAN-L7-626 rev 9 (receipt strict schema 3 群、G44/G45 record-binding 束縛、45 guard、candidate 70) と同期。
- rev 10 (2026-09-17、Claude control lane): Codex Sol review r3 (PR #647) に合わせ、approval 参照の束縛を
  (operation ID, idempotency key) の組とする PLAN-L7-626 rev 10 と同期。
