---
plan_id: PLAN-L7-626-pack-publication-admission-binding
title: "PLAN-L7-626: Pack公開 admission observation binding"
kind: add-impl
layer: L7
drive: agent
route_signal: feature_addition
route_mode: add-feature
created: 2026-09-16
updated: 2026-09-16
owner: Luna worker（実装）・Claude Opus（非著者検収）
parent_design: docs/plans/PLAN-L7-565-pack-publication-atomic-ref-cas.md
pair_artifact: docs/test-design/harness/L7-pack-publication-admission-binding-test-design.md
backprop_decision: required
backprop_decision_reason: preparation
  receiptに無かったreview/check/base/freshnessの新しいadmission不変条件を、 Pack staged
  releaseの上位L6契約へ逆向きに束縛する必要がある。
agent_slots:
  - role: se
    slot_label: Luna worker - preparation receiptのread-only再観測とadmission record pure
      validation
  - role: qa
    slot_label: Terra - 15 guardの一軸mutation、indeterminate、remote write 0のRed oracle
  - role: tl
    slot_label: Claude Opus -
generates:
  - artifact_path: docs/plans/PLAN-L7-626-pack-publication-admission-binding.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-565-pack-publication-atomic-ref-cas.md
  requires: []
  references:
    - docs/plans/PLAN-L7-565-pack-publication-atomic-ref-cas.md
    - docs/plans/PLAN-L7-625-pack-publication-preparation.md
    - docs/test-design/harness/L7-pack-publication-preparation-test-design.md
    - docs/test-design/harness/L7-pack-publication-atomic-ref-cas-test-design.md
    - docs/plans/PLAN-REVERSE-626-pack-publication-admission-binding-backfill.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/624
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/626
review_evidence: []
status: draft
github_issue_id: 626
admission_receipt:
  schema_version: v2
  receipt_id: certificate:529eea3e2017a6d17049746ae353398d
  command_id: plan-draft:issue-626:admission-binding:1
  admitted_at: 2026-09-16T10:00:00.000+09:00
  source_digest: sha256:1f0bdcd3fee43dd410c70d6096d792705e29ec43a92f76ea7f6a5cf39437fafc
  decision_digest: sha256:fdaab1bcae764745ddc92ec7604cfa10e446b57c5f4bc51d45a03a92ab7c427e
  receipt_digest: sha256:3ca0543848b549cd4c1f7b3c5c8050754b6fc617da42c4a63b14bcf3517829dc
  binding:
    path: docs/plans/PLAN-L7-626-pack-publication-admission-binding.md
    plan_id: PLAN-L7-626-pack-publication-admission-binding
    asset_id: plan:529eea3e2017a6d17049746ae353398d
    revision: 1
    content_digest: sha256:1f0bdcd3fee43dd410c70d6096d792705e29ec43a92f76ea7f6a5cf39437fafc
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 626
    episode_id: E4-626-pack-publication-admission-binding
    projection_digest: sha256:4e5c8b8b398076d56a72deb696afa871b9c259e667c9bb65f22ef2816ca1d8b4
  origin:
    plan_id: PLAN-L7-565-pack-publication-atomic-ref-cas
    revision: 1
    digest: sha256:efd67cb89dbf6e187fd998c062972332a868e868ee5b70993be4080a9ccb6647
  reentry:
    target_plan_id: PLAN-L7-626-pack-publication-admission-binding
    target_revision: 1
    phase: forward_merge
  escape_reason: "Issue #626 admission observation binding pair-freeze after #625
    preparation receipt; publish and CAS remain out of scope."
---

# PLAN-L7-626: Pack公開 admission observation binding

## 1. 目的と境界

Issue #626 は、#625 が発行する `publication_preparation` receipt を唯一の入力として、
non-author review、required checks、PR base/head、merge-base、staging identity、
operation/idempotency freshness を read-only に再観測し、`publication_admission` record
へ束縛する契約を固定する。admission は全 predicate が同時に成立した場合だけ admitted
intent を返す pure validation であり、remote、Pack checkout、filesystem staging、
branch/PR、main、Release、tag、asset、channel pointer を変更しない。

#625 の preparation receiptは、PR #639 の current-main 再同期で確定した exact head
`2fac4cd96eb4e619f7f663069bf0a4c81813096a`、canonical receipt sequence 272 の
`certificate:d60d960748407167021c4131789e9fd9` を read-only 再観測の対象 identity として
引き継ぐ。PR #639 の CI/review はこの PLAN の admission 成立を代用しない。current main
merge commit は `b94de1c60a9aab106a619c9282f69ad3f0d3855f` であり、観測対象の receipt tail は
`sha256:505fef3b2a6eafab929af49ff41f88eacf6172ca87ec2304a05e5b5c879476cd` である。

## 2. 入力と再観測束縛

### 2.1 preparation receipt

receipt は #625 が seal した次の値を保持し、caller が不足値を補完してはならない。

- `preparationReceiptDigest`、`operationId`、`idempotencyKey`
- sealed staging の `treeDigest`、`manifestDigest`、Pack entry集合（path/mode/size/content digest）
- expected Pack main OID
- deterministic publication branch、PR number、PR head OID、PR base OID、PR tree digest

receipt は準備時の branch/PR mutation の証跡であり、review や admission の approval/nonce
を含めない。#625 の preparation nonce、journal、token を #626 が consume または再利用する
ことは禁止する。

### 2.2 read-only observation

admission は同じ operation の read-only observer から次を一度の検証束へ取り込む。

1. PR observation: receipt の PR number、branch、head OID、base OID、tree digest。
2. Review observation: 同じ PR の reviewed head、結論 `approved`、non-author closing review
   receipt digest。closing receipt digest は `sha256:` + 64 lowercase hex の形状を持つ。
3. Required checks observation: 同じ reviewed head に対する非空の required check集合。
   各 check は `conclusion: success` であり、空配列は成功と解釈しない。
4. Merge-base observation: PR head と expected main の merge-base が sealed expected main OID
   と byte一致する。
5. Freshness observation: operation ID、idempotency key、PR number が別 admission に未使用で、
   receipt の staging digest / expected main OID / PR identity が既存 admissionと交差しない。

観測された値は caller の `reviewedHead`、`baseOid`、`checks`、`closingReceiptDigest` で
上書きできない。観測値全体（単独fieldではない）を admitted record の digest preimageへ
束縛する。review/check/merge-base の read failure、timeout、欠落、schema不正は成功へ丸めず
`indeterminate` として停止する。

## 3. 15 guard の正本

#624 が報告した `src/setup/pack-publication-adapter.ts` の15条件を、各々独立した一軸
deny oracleとして引き継ぐ。15 guardに冗長なものは無い。PR identity、head/base、review
identity、head shape/equality、review conclusion、receipt shape、checks head/non-empty/
conclusion、freshness は異なる入力の異なる誤受入を閉じるためである。

| guard | 契約 predicate | 一軸 mutant | deny reason / write境界 |
| --- | --- | --- | --- |
| G01（旧L1293） | observed PR number が preparation PR number と一致 | PR numberを別値 | `admission_pr_mismatch`; remote write 0 |
| G02（旧L1294） | observed PR head が preparation reviewed head と一致 | review後にPR headを更新 | `admission_head_mismatch`; remote write 0 |
| G03（旧L1295） | observed PR base が preparation base OID と一致 | base OIDを別値（#624 blocking） | `admission_base_mismatch`; remote write 0 |
| G04（旧L1298） | merge-base が expected main OID と一致 | merge-baseを別値 | `admission_merge_base_mismatch`; remote write 0 |
| G05（旧L1299） | closing review の PR number が preparation PR number と一致 | review receiptのPRを別値 | `admission_review_pr_mismatch`; remote write 0 |
| G06（旧L1300） | reviewed head は SHA-1 OID形状（40 lowercase hex） | malformed / SHA-256形状 | `admission_review_head_invalid`; remote write 0 |
| G07（旧L1301） | review head が preparation reviewed head と一致 | 別headへのreview | `admission_review_head_mismatch`; remote write 0 |
| G08（旧L1302） | closing review conclusion が `approved` | `changes_requested` / `commented` | `admission_review_not_approved`; remote write 0 |
| G09（旧L1303） | closing receipt digest が `sha256:` + 64 lowercase hex | digest shapeを短縮/別prefix | `admission_review_receipt_invalid`; remote write 0 |
| G10（旧L1304） | checks observation の head が review head と一致 | 別headのchecks | `admission_checks_head_mismatch`; remote write 0 |
| G11（旧L1305） | required checks は1件以上存在 | `checks: []` | `admission_checks_missing`; remote write 0 |
| G12（旧L1306） | 全required checkの conclusion が `success` | 1件をfailureへ変異 | `admission_check_not_success`; remote write 0 |
| G13（旧L1307） | operation ID が未使用 | 既使用 operation ID | `admission_operation_replay`; remote write 0 |
| G14（旧L1308） | idempotency key が未使用 | 既使用 idempotency key | `admission_idempotency_replay`; remote write 0 |
| G15（旧L1309） | PR number が未使用 | 別admissionで使用済みPR | `admission_pr_replay`; remote write 0 |

G01 と G05 はそれぞれ preparation observation と review receipt の出所を束縛する。
G06 と G07 は malformed OID と別OIDを別理由で拒否する。G11 は G12 の `.some` が空集合
でvacuum successになる穴を閉じる。したがって #624 の blocking 3（G03/G09/G11）は
補助的な重複ではなく、独立した必須 predicate である。

## 4. 判定と no-write 境界

- 全15 guard、staging identity、operation/idempotency freshness、観測束の digest binding
  が成立したときだけ `publication_admission` を `admitted` とする。
- 値の不一致、replay、空 required checks、malformed receipt は typed `deny`。read-only
  observerが unavailable、timeout、応答欠落、schema判定不能の場合は typed `indeterminate`。
- deny/indeterminate のどちらも admitted intent、approval consume、publication mutationへ
  進めず、main/Release/tag/asset/pointer/branch/PR の remote write count は0。#626 の実装は
  remote portを呼び出さず、write-zeroを spy ledgerで検証可能にする。
- 成功した admissionも #627 の publish/CAS を実行しない。admitted recordを返した後の
  publication side effect、main lease、Release visibility、canary pointerは #627/#565へ残す。
- 同一 operation/idempotency/PR と全 identity・観測digestが完全一致する replayだけは同一
  admission record の決定的再構成を許可する。1要素でも変わる replay、preparation receipt
  無し、外部手作りPRは deny とし、観測不能時の再構成は indeterminate とする。

## 5. 後続との分離

#626 は preparation receipt の read-only observation binding と pure admission validation
だけを所有する。#625 の準備生成、#627 の publish deny/main CAS、Release/tag/asset/pointer、
production credential、remote実装、既存adapterの大規模再構成は変更しない。

## 6. 完了条件

15 guardの一軸Red oracle、indeterminate、deny/write-zero、完全一致replayを対応する
test-designへ1対1で固定し、PLAN lint、admission-check、readability/plan-doc対象テストを
同一exact HEADへ束縛する。実装PRで初めて `U-PACKPUB-ADM-*` を共有registryへ昇格し、
non-author closing reviewを取得する。
