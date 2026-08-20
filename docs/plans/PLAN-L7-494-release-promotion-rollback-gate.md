---
plan_id: PLAN-L7-494-release-promotion-rollback-gate
title: "PLAN-L7-494 (impl): S3 release promotion / rollback pure gate"
kind: impl
layer: L7
drive: agent
route_signal: forward
route_mode: forward
status: draft
created: 2026-08-20
updated: 2026-08-20
owner: PM / Codex
parent_design: docs/plans/PLAN-L6-102-release-promotion-rollback-gate.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: se
    slot_label: "SE - 既存PF4/PF5/review sourceを束縛するpure gate実装"
  - role: qa
    slot_label: "QA - U-RELMAN-003/004/005/008/010/019..023の独立mutationとside-effect oracle"
  - role: tl
    slot_label: "TL - identity、reason precedence、rollback fail-closeの非著者検収"
generates:
  - artifact_path: docs/plans/PLAN-L7-494-release-promotion-rollback-gate.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L6-102-release-promotion-rollback-gate.md
  requires:
    - PLAN-L7-489-pf4-sync-pack-channel-adapter-pair-freeze
    - PLAN-L7-492-pf5-release-aggregate-admission-pair-freeze
  blocks: []
  references:
    - docs/plans/PLAN-L6-102-release-promotion-rollback-gate.md
    - docs/plans/PLAN-REVERSE-494-release-promotion-rollback-gate-backfill.md
    - docs/test-design/harness/L7-unit-test-design.md
    - src/feedback/review-dispatch.ts
    - src/feedback/review-merge-gate.ts
    - src/kernel/github-closure-receipt.ts
    - src/setup/release-channel-adapter.ts
    - src/setup/release-aggregate-admission.ts
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/363
github_issue_id: 363
backprop_decision: required
review_evidence: []
---

# PLAN-L7-494: S3 release promotion / rollback pure gate

## 1. 目的

`PLAN-L6-102`で固定したS3 admissionを、既存のrelease manifest、PF4 attestation、PF5 sealed
plan、canonical CI、QA、D1/D2、claim-blind/spec-blind receiptを合成するpure functionへ降下する。
本sliceは判定とtyped reasonだけを所有し、新しいapply engine、CLI、Pack copy、consumer runtime、
D1/D2/D3変更を導入しない。

## 2. 実装契約

- `ReviewGateEvidence`は派生した独自shapeを作らず、`ReviewDispatchEntry`、`MergeGateDecision`、
  `MergeGateFacts`、`ReviewReceiptSource`をそのまま束縛する。
- exact HEADはpromotion対象の`artifactSourceCommit`と一致させる。manifestのcurrent pointerも
  `currentRelease`へ束縛し、HEADやpointerを全証拠と一緒に差し替えても別subjectを受理しない。
- evidence digestはcallerが保持するexpected bindingと照合する。`observedAt`は形式と順序だけに用い、
  経過時間だけでstaleと判定しない。
- reason precedenceは`invalid_input`、`identity_mismatch`、evidence欠落/No-Go、channel transition、
  attestation unavailable、allowの順とする。
- rollbackは直前channelのattested candidateを1件だけ選び、同じ入力から同じpointer deltaとdigestを返す。
  `artifactAvailable`のfalseまたは欠落は`artifact_unavailable`へfail-closeする。
- rollback applyの実行は既存PF5 portを再利用し、`rollback_failed/applied=indeterminate`を成功や
  `applied=0`へ丸めない。

## 3. TDDとtrace

`CANDIDATE-RELMAN-003/004/005/008/010/019..023`は、
`tests/release-promotion-rollback-gate.test.ts`の同番号`U-RELMAN` 10件へ1:1で昇格する。
deny系はcomposition harnessのwrite/publish/apply spy 0とprior state不変を観測する。`U-RELMAN-022`
だけは既存`applySealedReleaseAggregate`へfaultを注入し、apply/restore境界とindeterminateを実測する。

## 4. 完了条件

1. target test、TypeScript、Biome、PLAN lint、対象doctorがGreen。
2. Linux / Windows / aggregate CIがexact HEADでGreen。
3. `worker_model=gpt-5.6-luna`をexact revisionへ記録する。
4. Claude Opus 5の非著者claim-blind/spec-blind closing reviewがblocking 0。
5. `PLAN-REVERSE-494`をR1からR4へ進め、正規receipt gateでmergeする。

実装とclosing reviewが未完の間、本PLANはdraftを維持する。closing PASS時に`generates`へsource、test、
test-designを追加し、confirmedへ更新する。
