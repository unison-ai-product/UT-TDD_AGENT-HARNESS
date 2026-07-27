---
plan_id: PLAN-L6-92-resource-kernel-function-contracts
title: "PLAN-L6-92 (add-design/function-spec): Resource Kernel
  protocol・error・platform port機能契約"
kind: add-design
layer: L6
drive: fullstack
route_signal: redesign
route_mode: redesign
created: 2026-07-22
updated: 2026-07-22
owner: PO / Codex
parent_design: docs/plans/PLAN-L5-25-resource-kernel-physical-protocol.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: se
    slot_label: SE - strict wire DTO、closed error union、platform port、lifecycle reducer
  - role: qa
    slot_label: QA - property/mutation oracle、illegal transition、launch 0、責務重複0
generates:
  - artifact_path: docs/plans/PLAN-L6-92-resource-kernel-function-contracts.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L5-25-resource-kernel-physical-protocol.md
  requires: []
  blocks:
    - docs/plans/PLAN-L7-454-resource-kernel-native-companion.md
  references:
    - docs/adr/ADR-009-resource-kernel-native-custody-companion.md
    - docs/plans/PLAN-L4-32-resource-governed-execution-kernel.md
    - docs/test-design/harness/L9-system-test-design.md
review_evidence: []
status: draft
sub_doc: function-spec
github_issue_id: 152
supersedes:
  - PLAN-L6-92-resource-kernel-function-contracts
admission_receipt:
  schema_version: v2
  receipt_id: certificate:59c3fa7c2430f47a5fd7563979a7a6ad
  command_id: pr156-contract-closure-3-rev5c-20260727
  admitted_at: 2026-07-27T01:00:02.000Z
  source_digest: sha256:246eedf26afa9e161239d3cda0df3e785ccaa4657b29e9478befd486e39e9536
  decision_digest: sha256:8102740332f74cfed2c3d24cb08c70eee713fd17a47cebff2222139e85161b1a
  receipt_digest: sha256:5b95f98f863737d8c1c52af22029c78dc3397772708049d17838f688b6a28f9f
  binding:
    path: docs/plans/PLAN-L6-92-resource-kernel-function-contracts.md
    plan_id: PLAN-L6-92-resource-kernel-function-contracts
    asset_id: plan:legacy:fef79873d9ab53b5ca019fb28a57b358c584fbfbc1fe1f7f1fda4a0461858e3a
    revision: 5
    content_digest: sha256:246eedf26afa9e161239d3cda0df3e785ccaa4657b29e9478befd486e39e9536
  route:
    signal: redesign
    mode: redesign
  issue:
    provider: github
    issue_id: 152
    episode_id: E4-152-resource-kernel-d0r
    projection_digest: sha256:fbf4a02220f7f6f05a34e18480f77bbff707c740f931b961a7e4d51578f0b708
  origin:
    plan_id: PLAN-L6-92-resource-kernel-function-contracts
    revision: 4
    digest: sha256:1532c5204c32fb65c44057fee0f065d02155c8faf22e16e32a350226f8cca01f
  transition:
    direction: design_to_implementation
    implementation_disposition: none
    implementation_target:
      target_plan_id: PLAN-L7-454-resource-kernel-native-companion
      target_revision: 5
  reentry:
    target_plan_id: PLAN-L7-454-resource-kernel-native-companion
    target_revision: 5
    phase: forward_merge
  escape_reason: Resource Kernelのwire・admission・anti-rollback契約を上流から閉じてForward実装へ再降下する
  supersedes:
    - PLAN-L6-92-resource-kernel-function-contracts
---

# PLAN-L6-92: Resource Kernel function contract route

## 1. 所有境界

本PLANはL5-25からL7-454へのroute、責務、pair、受入条件だけを所有する。wire algebra、closed error、
capability、custody lifecycle、platform port、bundle verificationの詳細契約は
`docs/design/harness/L6-function-design/function-spec.md`の
「PLAN-L6-92 Resource Kernelプロトコル・エラー・プラットフォームポート契約」を唯一の正本とする。
本PLANへ同じfunction表・状態遷移・field schemaを複製しない。

TypeScript/Nodeはpolicy、journal、admission、receiptを所有し、Rustはstrict wireとOS custody factだけを所有する。
DB/CAS、snapshot性能、local CI schedulerはIssue #152のlater waveであり、D0-RのL6/L7 gateに含めない。

## 2. L7 pairと受入条件

L7 pairは`U-RGK-WIRE-*`、`U-RGK-TRUST-*`、`U-RGK-ERROR-*`、`U-RGK-CAP-*`、`U-RGK-LIFE-*`、
`U-RGK-PORT-*`、`U-RGK-BUNDLE-*`を用い、L8は`IT-RGK-PHYS-001..026`を用いる。
各IDのfixtureとoracleは対応するtest-designだけを正本とし、PLAN本文へ再掲しない。

- probeからlauncherへ到達せず、valid admission前のmanaged root生成は0。
- Windowsはattach-before-resume、Linuxはstart-in-cgroupを満たし、root exitをterminalとしない。
- terminate後のempty/reap proofが欠ける場合はsuccessを返さない。
- bundleはreview済みmanifestのdigest、schema、target、component集合を検証し、PATH探索、download、片側rollbackを拒否する。
- rollbackは現在floorより厳密に大きいsequenceの新manifestを再署名・再検証して行い、過去manifestまたは同sequenceの暗黙再activationを許可しない。
- D0ではtrust、clock、storageを抽象portに留め、rotation、re-anchor、物理log schemaは後続implementation revisionで設計する。

## 3. 実装開始境界

本PLANとL7-454は`status: draft`である。L7 pair、L8 26件、対象OS capability、独立reviewがfreezeされるまで、
実Job/cgroup adapterの実装完了、native custody Green、R4再合流を主張しない。
