---
plan_id: PLAN-L7-494-release-promotion-rollback-gate
title: "PLAN-L7-494 (impl): S3 release promotion / rollback pure gate"
kind: impl
layer: L7
drive: agent
route_signal: forward
route_mode: forward
status: confirmed
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
  - artifact_path: src/setup/release-promotion-rollback-gate.ts
    artifact_type: source_module
  - artifact_path: tests/release-promotion-rollback-gate.test.ts
    artifact_type: test_code
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
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
review_evidence:
  - reviewer: codex-primary-preflight
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-20T11:38:59Z"
    tests_green_at: "2026-08-20T11:37:24Z"
    verdict: "preflight green; Claude Opus 5 non-author closing review pending"
    scope: "Issue #363 pure promotion/rollback gate、10件の1:1 oracle、PF5 fault compositionのpreflight。"
    worker_model: gpt-5.6-luna
    reviewer_model: gpt-5.6-sol
    plan_revision: c1a3a67a2614b3bc755c8dfe4b30d20a6a613159
    subject_head: c1a3a67a2614b3bc755c8dfe4b30d20a6a613159
    evidence_path: tests/release-promotion-rollback-gate.test.ts
    anchor_commit: c1a3a67a2614b3bc755c8dfe4b30d20a6a613159
    citations:
      - "tests/release-promotion-rollback-gate.test.ts: U-RELMAN-003/004/005/008/010/019..023"
      - "src/setup/release-promotion-rollback-gate.ts: evaluatePromotionGate/selectRollbackCandidate/classifyRollbackApply"
    green_commands:
      - kind: unit_test
        command: "node node_modules/vitest/vitest.mjs run tests/release-promotion-rollback-gate.test.ts --reporter=verbose --maxWorkers=1 --minWorkers=1 (workspace-fence diagnostic)"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-20T11:37:24Z"
        evidence_path: tests/release-promotion-rollback-gate.test.ts
        output_digest: "sha256:17d515f6c09a182084926fe29cf2be7f80a0de1d0c723f5117ad8f07e7fc5bf5"
        anchor_commit: c1a3a67a2614b3bc755c8dfe4b30d20a6a613159
      - kind: typecheck
        command: "node node_modules/typescript/bin/tsc --noEmit --pretty false"
        runner: node
        scope: changed-files
        exit_code: 0
        completed_at: "2026-08-20T11:35:01Z"
        evidence_path: src/setup/release-promotion-rollback-gate.ts
        output_digest: "sha256:4bd37d3408b3783a04211a6f2918b9b7729bbf6e94407f94e72ec00ea8bd10d7"
        anchor_commit: c1a3a67a2614b3bc755c8dfe4b30d20a6a613159
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
- control exact HEAD / PLAN revisionはCI・D1・D2・claim-blind/spec-blind receiptのsubjectとして
  相互照合する。PF3が分離したartifact revisionとは等値を要求しない。release source identityはmanifest、
  QA、PF4 attestation、PF5 sealed planの間だけで相互照合する。manifestのcurrent pointerは
  `currentRelease`へ束縛する。
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

L7実装とR2 preflightはexact implementation revisionへ固定済みである。Claude Opus 5のclosing PASS、
canonical snapshot、Linux / Windows / aggregate CIはmerge前の残存gateとして保持する。
