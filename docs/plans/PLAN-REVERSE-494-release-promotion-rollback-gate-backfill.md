---
plan_id: PLAN-REVERSE-494-release-promotion-rollback-gate-backfill
title: "PLAN-REVERSE-494: S3 promotion / rollback gateの上流合流"
kind: reverse
layer: cross
drive: agent
workflow_phase: R2
confirmed_reverse_type: design
route_signal: reverse
route_mode: reverse
status: draft
created: 2026-08-20
updated: 2026-08-20
owner: PM / Codex
parent_design: docs/plans/PLAN-L7-494-release-promotion-rollback-gate.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - S3実装差分のL6へのbackfill判定"
  - role: qa
    slot_label: "QA - exact identity、precedence、PF5 fault oracleの再検収"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-494-release-promotion-rollback-gate-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-494-release-promotion-rollback-gate.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-102-release-promotion-rollback-gate.md
    - docs/plans/PLAN-L7-494-release-promotion-rollback-gate.md
    - docs/test-design/harness/L7-unit-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/363
review_evidence:
  - reviewer: codex-primary-preflight
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-20T11:38:59Z"
    tests_green_at: "2026-08-20T11:37:24Z"
    verdict: "R1/R2 preflight green; R3 non-author review pending"
    scope: "exact implementation revisionのsource/test traceと10 oracleを再検収。"
    worker_model: gpt-5.6-luna
    reviewer_model: gpt-5.6-sol
    plan_revision: c1a3a67a2614b3bc755c8dfe4b30d20a6a613159
    subject_head: c1a3a67a2614b3bc755c8dfe4b30d20a6a613159
    evidence_path: tests/release-promotion-rollback-gate.test.ts
    anchor_commit: c1a3a67a2614b3bc755c8dfe4b30d20a6a613159
    citations:
      - "U-RELMAN-003/004/005/008/010/019..023: 10 passed"
      - "PF5 injected apply/restore fault: rollback_failed/applied=indeterminate"
  - reviewer: codex-primary-flag-closure
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-20T12:03:14Z"
    tests_green_at: "2026-08-20T12:01:20Z"
    verdict: "R2 B1-B5 delta green; R3 non-author rereview pending"
    scope: "exact implementation revisionでreview bindingとPF5 compositionのFLAG closureを再検収。"
    worker_model: gpt-5.6-luna
    reviewer_model: gpt-5.6-sol
    plan_revision: ae28531757e60db279f53dc72987e62fb9ca80ca
    subject_head: ae28531757e60db279f53dc72987e62fb9ca80ca
    evidence_path: tests/release-promotion-rollback-gate.test.ts
    anchor_commit: ae28531757e60db279f53dc72987e62fb9ca80ca
    citations:
      - "B1/B2: rollback D2 gateとreview source splicing拒否"
      - "B3/B4/B5: PF5実composition、non-attested identity、runtime shape fail-close"
---

# PLAN-REVERSE-494: S3 promotion / rollback gateの上流合流

## 1. R1/R2実測

FLAG是正後のexact implementation HEAD `ae28531757e60db279f53dc72987e62fb9ca80ca`でsource/test/traceを固定した。
R2ではU-RELMAN 10件を各1 testとして実行し、10/10 Green、TypeScript、Biome、PLAN lintを確認した。
canonical detached snapshot、Linux / Windows / aggregate CI、非著者reviewは未完であり、R3完了とはしない。

## 2. backfill対象

- control exact HEAD / PLAN revisionをCI・D1・D2・claim/spec receipt間で束縛し、PF3 artifact revisionとは
  分離する二軸identity。
- manifest current pointerと`currentRelease`の照合、およびevidence digest expected binding。
- D1=`ReviewDispatchEntry`、D2=`MergeGateDecision`、評価facts=`MergeGateFacts`という1:1 source mapping。
- PR、memory ID、PLAN ID、author/reviewer family、authorized entryをexpected review subjectへ束縛し、
  promotion/rollback双方でreceipt splicingを拒否すること。
- `invalid_input`からallowまでのpromotion reason precedence。
- rollback candidateのdeterministic pointer delta/digestと、availability欠落のfail-close。
- non-attested evidenceの存在identityをstatusより先に照合し、runtime invalid candidateをthrowさせないこと。
- PF5 restore失敗を`rollback_failed/applied=indeterminate`として保持するclassification。

## 3. R1からR4

- R1: source/test/trace差分を上記exact HEADへ固定済み。
- R2: 10 oracleの独立mutation、composition spy、prior state不変を再実行済み。
- R3: Claude Opus 5が非著者でidentityとfault境界を攻撃し、未反証blockingを0にする。
- R4: 実測で必要と判明した差分だけを`PLAN-L6-102`とL7 test-designへ戻す。

新apply engine、CLI、Pack copy、consumer runtime、D1/D2/D3の変更は本Reverseの対象外である。
