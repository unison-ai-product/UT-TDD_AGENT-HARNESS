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
updated: 2026-08-21
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
        output_digest: "sha256:b93cd4290ebe0880b7e91626f160faf740a247dbdeab8efa1637f6c76bfd508e"
        anchor_commit: c1a3a67a2614b3bc755c8dfe4b30d20a6a613159
      - kind: typecheck
        command: "node node_modules/typescript/bin/tsc --noEmit --pretty false"
        runner: node
        scope: changed-files
        exit_code: 0
        completed_at: "2026-08-20T11:35:01Z"
        evidence_path: src/setup/release-promotion-rollback-gate.ts
        output_digest: "sha256:f3fe31c90401e08fce4a5f4f3a6dab35b9ba7ea087c30a0af8a572d0d4038022"
        anchor_commit: c1a3a67a2614b3bc755c8dfe4b30d20a6a613159
  - reviewer: codex-primary-flag-closure
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-20T12:03:14Z"
    tests_green_at: "2026-08-20T12:02:40Z"
    verdict: "Claude FLAG B1-B5 local closure green; non-author exact-head rereview pending"
    scope: "rollback review gate、source splicing、PF5 real composition、non-attested identity、runtime invalid shapeの是正。"
    worker_model: gpt-5.6-luna
    reviewer_model: gpt-5.6-sol
    plan_revision: 24567f43a854f61dc73368d58c6821fda5ad7a07
    subject_head: 24567f43a854f61dc73368d58c6821fda5ad7a07
    evidence_path: tests/release-promotion-rollback-gate.test.ts
    anchor_commit: 24567f43a854f61dc73368d58c6821fda5ad7a07
    citations:
      - "U-RELMAN-010: rollback D2 absent deny、PF5 ports 0"
      - "U-RELMAN-020: PR/auth/PLAN/family splicingとreason precedence"
      - "U-RELMAN-021/022: runtime invalid/non-attested identity/PF5 indeterminate composition"
    green_commands:
      - kind: unit_test
        command: "node node_modules/vitest/vitest.mjs run tests/release-promotion-rollback-gate.test.ts --reporter=dot --maxWorkers=1 --minWorkers=1 (workspace-fence diagnostic)"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-20T12:01:20Z"
        evidence_path: tests/release-promotion-rollback-gate.test.ts
        output_digest: "sha256:69b42358ebb879990012fa868a9f83b9e86b080e1ac78256a365c357e63b6324"
        anchor_commit: 24567f43a854f61dc73368d58c6821fda5ad7a07
      - kind: typecheck
        command: "node node_modules/typescript/bin/tsc --noEmit --pretty false"
        runner: node
        scope: changed-files
        exit_code: 0
        completed_at: "2026-08-20T12:02:40Z"
        evidence_path: src/setup/release-promotion-rollback-gate.ts
        output_digest: "sha256:225419423d10b4b4f1098a260e7125508c510b397d196caa3ff29617fe6b215d"
        anchor_commit: 24567f43a854f61dc73368d58c6821fda5ad7a07
  - reviewer: codex-primary-flag-closure-2
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-21T01:58:47Z"
    tests_green_at: "2026-08-21T01:58:09Z"
    verdict: "Claude FLAG B1 revision binding corrected; exact CI 3/3 green; non-author rereview pending"
    scope: "request.reviewRevisionとsubject.planRevisionの束縛、coherent splice回帰、Linux/Windows/aggregate exact-head CI。"
    worker_model: gpt-5.6-luna
    reviewer_model: gpt-5.6-sol
    plan_revision: 1620f24d7b1b91cec2057f1c2224cf66db86e0c8
    subject_head: 1620f24d7b1b91cec2057f1c2224cf66db86e0c8
    evidence_path: tests/release-promotion-rollback-gate.test.ts
    anchor_commit: 1620f24d7b1b91cec2057f1c2224cf66db86e0c8
    citations:
      - "src/setup/release-promotion-rollback-gate.ts:482-519 reviewIdentityMatchesのPLAN revision束縛"
      - "tests/release-promotion-rollback-gate.test.ts:597-629 coherent splice回帰"
    green_commands:
      - kind: unit_test
        command: "GitHub Actions run 32437438186: harness-check-linux全回帰 / harness-check-windows scoped回帰・CLI hook実発火 / aggregate"
        runner: ci
        scope: full
        exit_code: 0
        completed_at: "2026-08-21T01:58:09Z"
        evidence_path: tests/release-promotion-rollback-gate.test.ts
        output_digest: "sha256:1ef02ee8aedf7d58315a0f3112b7fa9e9001b1d38b03e3241a2673feaa889406"
        anchor_commit: 1620f24d7b1b91cec2057f1c2224cf66db86e0c8
  - reviewer: codex-primary-flag-closure-3
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-08-21T03:26:01Z"
    tests_green_at: "2026-08-21T03:26:00Z"
    verdict: "Claude FLAG B1 revision-only oracle isolated; source mutant killed; non-author rereview pending"
    scope: "request.reviewRevisionとsubject.planRevision以外を完全整合した独立revision-only splice、source 1行削除mutation、side-effect 0、targeted test/typecheck。"
    worker_model: gpt-5.6-luna
    reviewer_model: gpt-5.6-sol
    plan_revision: 551a64bbcb9569d4e0206eacf5b6a7d856c5f070
    subject_head: 551a64bbcb9569d4e0206eacf5b6a7d856c5f070
    evidence_path: tests/release-promotion-rollback-gate.test.ts
    anchor_commit: 551a64bbcb9569d4e0206eacf5b6a7d856c5f070
    citations:
      - "src/setup/release-promotion-rollback-gate.ts:488 request.reviewRevision === subject.planRevision"
      - "tests/release-promotion-rollback-gate.test.ts:631-661 U-RELMAN-020 revision-only spliceとside-effect 0"
      - "mutation probe: 対象1行削除でrevision-onlyケースがallowへ反転し9/10 Red"
    green_commands:
      - kind: unit_test
        command: "node node_modules/vitest/vitest.mjs run tests/release-promotion-rollback-gate.test.ts --reporter=dot --maxWorkers=1 --minWorkers=1 (direct targeted; snapshot runnerはsingleton/cleanup cutoff)"
        runner: node
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-21T03:25:43Z"
        evidence_path: tests/release-promotion-rollback-gate.test.ts
        output_digest: "sha256:b1dd063e15d5394d297a6f1d50dd109eb0ceaf13358ef9ca6d79e2f41898dea7"
        anchor_commit: 551a64bbcb9569d4e0206eacf5b6a7d856c5f070
      - kind: typecheck
        command: "node node_modules/typescript/bin/tsc --noEmit --pretty false"
        runner: node
        scope: changed-files
        exit_code: 0
        completed_at: "2026-08-21T03:26:00Z"
        evidence_path: src/setup/release-promotion-rollback-gate.ts
        output_digest: "sha256:85eb07f4ebb35da1694a7946a112e9814692d095860558ec9be10491907f3d2a"
        anchor_commit: 551a64bbcb9569d4e0206eacf5b6a7d856c5f070
      - kind: typecheck
        command: "GitHub Actions run 32437438186: harness-check-linux typecheck"
        runner: ci
        scope: changed-files
        exit_code: 0
        completed_at: "2026-08-21T01:46:20Z"
        evidence_path: src/setup/release-promotion-rollback-gate.ts
        output_digest: "sha256:85eb07f4ebb35da1694a7946a112e9814692d095860558ec9be10491907f3d2a"
        anchor_commit: 1620f24d7b1b91cec2057f1c2224cf66db86e0c8
---

# PLAN-L7-494: S3 release promotion / rollback pure gate

## 1. 目的

`PLAN-L6-102`で固定したS3 admissionを、既存のrelease manifest、PF4 attestation、PF5 sealed
plan、canonical CI、QA、D1/D2、claim-blind/spec-blind receiptを合成するpure functionへ降下する。
本sliceは判定とtyped reasonだけを所有し、新しいapply engine、CLI、Pack copy、consumer runtime、
D1/D2/D3変更を導入しない。

## 2. 実装契約

- `ReviewGateEvidence`はcanonical `ReviewRequest`をsource anchorとし、`ReviewDispatchEntry`、
  `MergeGateDecision`、`MergeGateFacts`、`ReviewReceiptSource`を同じrequest identityへ束縛する。
- control exact HEAD / PLAN revisionはCI・D1・D2・claim-blind/spec-blind receiptのsubjectとして
  相互照合する。PF3が分離したartifact revisionとは等値を要求しない。release source identityはmanifest、
  QA、PF4 attestation、PF5 sealed planの間だけで相互照合する。manifestのcurrent pointerは
  `currentRelease`へ束縛する。
- evidence digestはcallerが保持するexpected bindingと照合する。`observedAt`は形式と順序だけに用い、
  経過時間だけでstaleと判定しない。
- review expected bindingはdigest slotを保持するが、PR、memory ID、author familyの正本はcanonical
  `ReviewRequest`とする。D1/D2/facts、authorized entry、claim/spec laneをrequestへ照合し、expected bindingを
  一括共変異したcoherent spliceも拒否する。D1、D2、claim/specの`PASS` / `PASS-WEAK`は各producerで
  独立に有効であり、相互のverdict全等値を要求しない。
- review nested field/arrayとPF5 sealed planのkind/destination/entries/entryは読取前にstrict shape検証する。
  factsはOPEN、D1 reasons/breachesは空、CI evidenceはQAより後刻にならないことを要求する。
- reason precedenceは`invalid_input`、`identity_mismatch`、evidence欠落/No-Go、channel transition、
  attestation unavailable、allowの順とする。
- rollbackも同じD1/D2/facts/claim/spec bindingを通過した場合だけ、直前channelのattested candidateを
  1件だけ選び、同じ入力から同じpointer deltaとdigestを返す。D2欠落・非readyではPF5へ到達しない。
  `artifactAvailable`のfalseまたは欠落は`artifact_unavailable`へfail-closeする。
- attestationはstatus判定より先に存在するidentity fieldを照合する。`mismatch` / `unavailable`でも
  別release subjectなら`identity_mismatch`とし、availability reasonへ丸めない。候補のruntime shapeが
  `null`等ならthrowせず`invalid_input`へfail-closeする。
- rollback applyの実行は既存PF5 portを再利用し、`rollback_failed/applied=indeterminate`を成功や
  `applied=0`へ丸めない。

## 3. TDDとtrace

`CANDIDATE-RELMAN-003/004/005/008/010/019..023`は、
`tests/release-promotion-rollback-gate.test.ts`の同番号`U-RELMAN` 10件へ1:1で昇格する。
test-only compositionはallow decisionから既存`applySealedReleaseAggregate`へ実接続する。allowでPF5
applyからpointer/publish各1へ到達することを対照として確認し、denyではsnapshot/staging/apply/restore/
pointer/publish 0とprior state不変を観測する。`U-RELMAN-022`はrollback allow後にapply/restore faultを
注入し、indeterminate、pointer/publish 0、復元不能stateを実測する。

## 4. 完了条件

1. target test、TypeScript、Biome、PLAN lint、対象doctorがGreen。
2. Linux / Windows / aggregate CIがexact HEADでGreen。
3. `worker_model=gpt-5.6-luna`をexact revisionへ記録する。
4. Claude Opus 5の非著者claim-blind/spec-blind closing reviewがblocking 0。
5. `PLAN-REVERSE-494`をR1からR4へ進め、正規receipt gateでmergeする。

L7実装とR2 preflightはexact implementation revisionへ固定済みである。Claude Opus 5のclosing PASS、
canonical snapshot、Linux / Windows / aggregate CIはmerge前の残存gateとして保持する。
