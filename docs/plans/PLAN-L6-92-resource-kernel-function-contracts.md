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
    - docs/plans/PLAN-L7-466-resource-kernel-native-companion.md
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
  receipt_id: certificate:cfcc7246ded4c136fef34d686b7fa401
  command_id: pr156-contract-closure-l6-rev15-20260727
  admitted_at: 2026-07-27T04:06:47.414Z
  source_digest: sha256:c175f3f2afc27aefc737cc8b76a09600332a650795f9a915e62215519072018c
  decision_digest: sha256:214b323be000be52dc28366d699f9cfe8262123aeced0e40cb0bc250aa2f4279
  receipt_digest: sha256:a363f2c14218949159999e1b85a3c63f67e1357714ef4283156d2fb87e00c0f3
  binding:
    path: docs/plans/PLAN-L6-92-resource-kernel-function-contracts.md
    plan_id: PLAN-L6-92-resource-kernel-function-contracts
    asset_id: plan:legacy:fef79873d9ab53b5ca019fb28a57b358c584fbfbc1fe1f7f1fda4a0461858e3a
    revision: 15
    content_digest: sha256:c175f3f2afc27aefc737cc8b76a09600332a650795f9a915e62215519072018c
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
    revision: 14
    digest: sha256:1532c5204c32fb65c44057fee0f065d02155c8faf22e16e32a350226f8cca01f
  transition:
    direction: design_to_implementation
    implementation_disposition: none
    implementation_target:
      target_plan_id: PLAN-L7-466-resource-kernel-native-companion
      target_revision: 15
  reentry:
    target_plan_id: PLAN-L7-466-resource-kernel-native-companion
    target_revision: 15
    phase: forward_merge
  escape_reason: 上流からrecovery observation認証・exact schema・custody generation契約を閉じる
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
Issue #152へdeferするのはincremental DB、projection snapshot CAS、性能収束、local CI schedulerだけである。
resource authorityのepoch/mode CASとrelease transactionは本D0-Rのactive safety contractであり、L6/L7 gateから除外しない。

## 2. L7 pairと受入条件

L7 pairは`U-RGK-WIRE-*`、`U-RGK-TRUST-*`、`U-RGK-ERROR-*`、`U-RGK-CAP-*`、`U-RGK-LIFE-*`、
`U-RGK-PORT-*`、`U-RGK-BUNDLE-*`を用い、L8は`IT-RGK-PHYS-001..042`を用いる。
各IDのfixtureとoracleは対応するtest-designだけを正本とし、PLAN本文へ再掲しない。

- probeからlauncherへ到達せず、valid admission前のmanaged root生成は0。
- create/spawn/resumeはadmission chain上の別stage tokenを直前durable fact後に発行し、canonical payload/authenticator/
  issuer/operation/nonce/predecessorを検証する。skip/reorder/replayを拒否し、wall deadlineをmonotonicへ一度だけ縮小変換する。
- authority leaseはexecution/cleanup/boot-fenced cleanupのclosed unionとし、custody/executor identity、boot ID、
  deadline、nonce、authenticatorを束縛する。effective deadline後もcleanup権限を失効させない。
- Rust/native observationとTypeScript `recoverAuthority` transactionを分離する。Rustはschema/authenticator/binding+
  native factだけ、TSはjournal/current epoch照合→epoch CAS→cleanup lease+traceだけをatomic commitする。
  observationはsame/cross-boot別のexact field unionとし、Rust native signerとTS bundle-trust verifierの所有者を固定する。
  recovery deadline超過はoverdue/admission遮断でありcleanup拒否理由ではない。reissue eventはterminal receipt digestへ含める。
- deadline/cancel/abort/正常root exit/terminate intentはauthority mode CASとcleanup lease発行を同じtransactionで閉じる。
  cross-boot fenceはemptyを先取りせず、boot-fenced lease発行後のempty/reap proofからreleaseへ進む。
- 正常root exit/terminate intentも同じcleanup遷移を通し、正常終了からreleaseを到達可能にする。
- execution/cleanup/boot-fenced leaseのcanonical field/discriminant/禁止fieldを固定し、
  operation×variant行列をstrictにする。token消費とpending-dispatchを原子的に記録し、
  canonical request digestをpending/indeterminate/reconciled/resultへ継承してexact transport retryだけreconcileする。
- token/lease/recovery observationはwire DTOのauthenticator自身だけをauthentication preimageから除外し、
  それ以外のexact canonical field全体を認証して自己包含を防ぐ。
- releaseはplatform fact後もcleanup authorityをexecutor disarmまで保持し、
  disarm後にauthority revoke+releasedをatomic commitしてrevoke後の回復不能gapを作らない。
- deterministic release_idをplatform release前にcommitし、Rust `ensureAbsent`がrelease直後crashでも
  committed empty/reap factと非再利用custody generationに束縛されたnative absenceを再観測する。
  raw identityの別generation再利用は削除せずquarantineし、存在→不在effectは最大1、呼出しは再試行可能とする。
- request decode前だけ`PreDispatchWireFault`、mutating dispatch後の全response decode/correlation faultは
  `PostDispatchResponseFault→DispatchIndeterminate`としてactual fact確定までterminal sealを禁止する。
- custody releaseはempty/reap fact commit後のplatform release→executor disarm→authority revoke+released atomic commitで閉じ、
  control processのshutdownを別commandにしてcustody stateを変更させない。
- RootNotCreatedはprotocol/bundle/pre-root custody、RootCreatedNotStartedはdeadline/cancelを含め全terminal phaseをlosslessに表す。
- pre-dispatch wire faultはside effect 0、post-dispatch response lossはindeterminateとしてreconcileし、actual phase確定前receipt seal 0。
- custody nonceはtoken seal前に予約するcreation identityとし、prepared/attached-suspendedからterminatingへのcleanup辺を閉じる。
- Windowsはattach-before-resume、Linuxはstart-in-cgroupを満たし、root exitをterminalとしない。
- terminate後のempty/reap proofが欠ける場合はsuccessを返さない。
- bundleはreview済みmanifestのdigest、schema、target、component集合を検証し、PATH探索、download、片側rollbackを拒否する。
- rollbackは現在floorより厳密に大きいsequenceの新manifestを再署名・再検証して行い、過去manifestまたは同sequenceの暗黙再activationを許可しない。
- D0ではtrust、clock、storageを抽象portに留め、rotation、re-anchor、物理log schemaは後続implementation revisionで設計する。

## 3. 実装開始境界

本PLANとL7-454は`status: draft`である。L7 pair、L8 42件、対象OS capability、独立reviewがfreezeされるまで、
実Job/cgroup adapterの実装完了、native custody Green、R4再合流を主張しない。
