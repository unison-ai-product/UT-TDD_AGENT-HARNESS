---
plan_id: PLAN-L7-855-codex-worker-sandbox-contract
title: "PLAN-L7-855-codex-worker-sandbox-contract: Codex worker の限定書込み権限"
kind: troubleshoot
layer: L7
drive: agent
created: 2026-10-06
updated: 2026-10-06
backprop_decision: required
backprop_decision_reason: 新しいworkspace-write能力を既存provider function designへReverse pairで戻す。
owner: Codex TL
review_evidence:
  - reviewer: claude-opus-5
    review_kind: cross_agent
    reviewed_at: 2026-10-06T09:42:18.738Z
    verdict: PASS-WEAK
    scope: "PR #859 bounded Issue #676 Codex worker workspace-write argv grant;
      exact reviewed implementation HEAD
      de956d80252d4c62dad5094783174df9334597dd; six writer-role single-flag
      behavior, representative nonwriter preservation, Claude
      argv/environment/stdin invariance, existing delegation/release-consumer
      regressions; no OS/provider sandbox effectiveness claim."
    tests_green_at: 2026-10-06T08:46:45Z
    green_commands:
      - kind: typecheck
        command: npm run typecheck (CI harness-check-linux)
        runner: ci
        scope: full
        exit_code: 0
        completed_at: 2026-10-06T08:27:53Z
        evidence_path: src/runtime/adapter.ts
        output_digest: sha256:4fb45dd08252a844f6c422cca1f356cba79dda37d94e2f7d22aee1a00e8555c7
        anchor_commit: de956d80252d4c62dad5094783174df9334597dd
      - kind: typecheck
        command: npm run typecheck (CI harness-check-windows)
        runner: ci
        scope: full
        exit_code: 0
        completed_at: 2026-10-06T08:28:03Z
        evidence_path: src/runtime/adapter.ts
        output_digest: sha256:4fb45dd08252a844f6c422cca1f356cba79dda37d94e2f7d22aee1a00e8555c7
        anchor_commit: de956d80252d4c62dad5094783174df9334597dd
      - kind: unit_test
        command: npm run test (CI harness-check-linux; full Vitest regression)
        runner: ci
        scope: full
        exit_code: 0
        completed_at: 2026-10-06T08:41:54Z
        evidence_path: tests/runtime-adapter.test.ts
        output_digest: sha256:1a1ada543298bc543c48e18d0c67a8818d78bbdc6919ea88aad551ef5c2722c5
        anchor_commit: de956d80252d4c62dad5094783174df9334597dd
      - kind: unit_test
        command: npm run test:windows (CI harness-check-windows; full Vitest regression)
        runner: ci
        scope: full
        exit_code: 0
        completed_at: 2026-10-06T08:46:15Z
        evidence_path: tests/release-consumer-skills.test.ts
        output_digest: sha256:3ed36a4b8fab8c302a6d1d82fd59b29e90e49984becb778ad022d6b2b1cea639
        anchor_commit: de956d80252d4c62dad5094783174df9334597dd
      - kind: lint
        command: npm run lint (CI harness-check-linux; Biome)
        runner: ci
        scope: full
        exit_code: 0
        completed_at: 2026-10-06T08:41:56Z
        evidence_path: src/runtime/adapter.ts
        output_digest: sha256:4fb45dd08252a844f6c422cca1f356cba79dda37d94e2f7d22aee1a00e8555c7
        anchor_commit: de956d80252d4c62dad5094783174df9334597dd
      - kind: doctor
        command: node src/cli.ts doctor --strict-green-command-digest --result-file
          $UT_TDD_DOCTOR_RESULT_FILE (CI harness-check-linux)
        runner: ci
        scope: full
        exit_code: 0
        completed_at: 2026-10-06T08:30:39Z
        evidence_path: .github/workflows/harness-check.yml
        output_digest: sha256:f079c200785985cc0b7a4b42522f202c15d3356c5e1a5890aa8708a185bedab7
        anchor_commit: de956d80252d4c62dad5094783174df9334597dd
      - kind: doctor
        command: node src/cli.ts doctor --scope toolchain (CI harness-check-windows)
        runner: ci
        scope: full
        exit_code: 0
        completed_at: 2026-10-06T08:46:21Z
        evidence_path: .github/workflows/harness-check.yml
        output_digest: sha256:f079c200785985cc0b7a4b42522f202c15d3356c5e1a5890aa8708a185bedab7
        anchor_commit: de956d80252d4c62dad5094783174df9334597dd
    worker_model: gpt-6-luna
    reviewer_model: claude-opus-5
    plan_revision: rev2
    subject_head: de956d80252d4c62dad5094783174df9334597dd
    attack_trials: 4
    citations:
      - "PR #859 canonical receipt
        0cc9f82bf303b3639648ae2804c31dd8dc849eff02fd4746e8bb4816c2e57207
        (PASS-WEAK, no blocking findings)"
      - "canonical review-custody audit attempt_completed request
        0cc9f82bf303b3639648ae2804c31dd8dc849eff02fd4746e8bb4816c2e57207: exact
        HEAD de956, claude-opus-5, receipt digest
        cba5c094cdcde6063a0596f64c6893a9ba75054ec507a5e5a811337a5bf31d5c,
        verdict digest
        8d8dfd22418464d316512f36b62096ff8890ad555dd20a43da9d8eb9152eac6c"
      - CI run 37436213686 (5/5 success, exact HEAD de956; aggregate
        2026-10-06T08:46:45Z)
      - "mutation e74657b2ce0fa8b7741e0b48b91202db46d83b09: missing writer grant
        → U-ADAPTER-SANDBOX-001 fails as expected"
      - "mutation f61a2caf12c6c31db65e8fbd52c83cde56f7d5f4: duplicate
        workspace-write flag → U-ADAPTER-SANDBOX-001 fails as expected"
      - "mutation 5f3d1b9968339a213c67b9f39bb50b28de76ee5e: advisor/nonwriter
        grant → U-ADAPTER-SANDBOX-002 fails as expected"
      - "mutation 92db5f19396c4d84de3de84916a08df252326856: Claude argv mutation
        → U-ADAPTER-SANDBOX-003 fails as expected"
      - "U-ADAPTER-SANDBOX-004 maps to tests/delegation-routing.test.ts:
        U-DELEG-001, U-DELEG-002, U-DELEG-008, plus
        tests/release-consumer-skills.test.ts: CANDIDATE-U-RCDEV-008 (`injection
        paths are resolved filesystem paths`; added pre-grant argv assertions);
        no standalone new production oracle is claimed"
agent_slots:
  - role: tl
    slot_label: bounded worker capability contract
  - role: aim
    slot_label: scope/non-goal境界
generates:
  - artifact_path: docs/plans/PLAN-L7-855-codex-worker-sandbox-contract.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-68-provider-dispatch-portability.md
  requires:
    - docs/plans/PLAN-L7-68-provider-dispatch-portability.md
  references:
    - docs/plans/PLAN-REVERSE-855-codex-worker-sandbox-backfill.md
    - docs/test-design/harness/L7-codex-worker-sandbox-test-design.md
    - docs/design/harness/L4-basic-design/function.md
pair_artifact: docs/test-design/harness/L7-codex-worker-sandbox-test-design.md
route_signal: incident
route_mode: incident
status: confirmed
github_issue_id: 676
admission_receipt:
  schema_version: v2
  receipt_id: certificate:66f10a3bc977023ab088feb7d6b2889f
  command_id: plan-revise:issue676:pr859-post-pass-confirmation:20261006
  admitted_at: 2026-10-06T10:08:16.918Z
  source_digest: sha256:f79874c7ed5065844550a9f19cde7a6603319723c4cb9adb6574e2d6c67a37ba
  decision_digest: sha256:458b7e929338168e7c1fad1fc597a120b358c8a7a39ed7c2ed3b49f66c2c9ab2
  receipt_digest: sha256:e75e2ae0168d4584a041be28aec5703b13ee6903e443ca1a6d8e9809352386e4
  binding:
    path: docs/plans/PLAN-L7-855-codex-worker-sandbox-contract.md
    plan_id: PLAN-L7-855-codex-worker-sandbox-contract
    asset_id: plan:63b8377746b1e03160a41a993436c898
    revision: 3
    content_digest: sha256:f79874c7ed5065844550a9f19cde7a6603319723c4cb9adb6574e2d6c67a37ba
  route:
    signal: incident
    mode: incident
  issue:
    provider: github
    issue_id: 676
    episode_id: incident-676-codex-worker-sandbox-contract-855-20261006
    projection_state: unprojected
  origin:
    plan_id: PLAN-L7-676-release-consumer-dev-start
    revision: 24
    digest: sha256:aad8875239a4b5ea94d844a89553421ca77be2b5fe04bf6d0d933f299fbf1734
  reentry:
    target_plan_id: PLAN-L7-676-release-consumer-dev-start
    target_revision: 24
    phase: forward_merge
  escape_reason: Opus FLAG3とcontrol6011015340に従いdirect
    adapterの新規spawn拒否を撤回し、writer6roleの限定grantだけを規定する。既存delegation/caller/Claudeは維持する。
---
# PLAN-L7-855-codex-worker-sandbox-contract: Codex worker sandbox contract

## 0. 目的

Issue #676 の承認に基づき、Codex 成果物 worker 6 role に限定して `workspace-write` を付与する契約を追加する。既存 provider dispatch と既存の通常 delegation allowlist refusal は維持する。

## 1. 対象範囲

- `se`、`docs`、`be-api`、`be-logic`、`db-schema`、`devops-deploy` の6 roleだけに `--sandbox workspace-write` を1組付与する。
- advisor、判断 gate、管理・調査 role、`aim`、その他の既知 role、および unknown role は対象外であり、既存の invocation を維持して新たな workspace-write を付与しない。unknown role を理由とする直接 adapter invocation の新規拒否は加えない。
- 正規 delegation の既存 allowlist refusal は変更しない。これは direct adapter の新規拒否契約ではない。
- 既存 runtime 層に write-role allowlist の単一 export constant を置き、adapter が利用する。runtime から team routing への import、team routing の変更、新 source module、第二の role registry は導入しない。
- Claude argv/environment、model・effort routing、stdin、reviewer custody、既存 gate-role policy は不変とする。flag の不在から OS-level sandbox 実効性を主張しない。

## 2. 受入条件（confirmed）

専用pair CANDIDATE-U-ADAPTER-SANDBOX-001..004 を `U-ADAPTER-SANDBOX-001..004` へ昇格し、実装HEAD de956d80252d4c62dad5094783174df9334597dd に束縛したテストとして確認した。6 writer roleには `--sandbox workspace-write` を各1回付与し、代表non-writerのargvは維持、Claude invocationは不変、既存delegation refusalとrelease-consumer回帰も維持した。4軸mutationで対応oracleの期待失敗を確認した。U-ADAPTER-SANDBOX-004は既存delegation/routingおよび `tests/release-consumer-skills.test.ts` のconsumer regressionを対応付け、新たな独立production oracleとは主張しない。OS/providerの実sandbox状態は受入主張に含めない。

## 3. Reverse / 上位差分

専用L7 pairの4 oracleをreviewし、bounded adapter変更との対応を確認した。PLAN-REVERSE-855 のR0はdraftのまま保持し、R4やReverse完了を主張しない。新しいL6 documentは作らない。

## 4. 検証

PR #859 の実装HEAD de956d80252d4c62dad5094783174df9334597dd に対するCI run 37436213686 は5/5 green。aggregate完了は2026-10-06T08:46:45Z、Opus reviewは2026-10-06T09:42:18.738Zであり、reviewはgreen後である。4 mutation probeはそれぞれ期待oracle失敗で終了した。これらはde956の歴史的証拠であり、rebase後のHEAD a5be07512cfd1cd0f86108382d8005ecda9d7384 に対する新CI結果とは主張しない。argv契約はOS/provider sandbox実効性を証明しない。

## 5. Schedule

- serial: bounded実装と4 oracleの実測はPR #859のde956 HEADで完了・review済み。通常ledger writerによる確認証跡の簿記deltaを待つ。PLAN-REVERSE-855はR0 draftを維持し、R4完了を主張しない。
