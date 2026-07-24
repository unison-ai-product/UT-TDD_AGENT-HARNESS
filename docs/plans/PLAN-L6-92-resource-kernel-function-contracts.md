---
plan_id: PLAN-L6-92-resource-kernel-function-contracts
title: "PLAN-L6-92 (add-design/function-spec): Resource Kernel protocol・error・platform port機能契約"
kind: add-design
layer: L6
sub_doc: function-spec
drive: fullstack
status: draft
route_signal: redesign
route_mode: redesign
created: 2026-07-22
updated: 2026-07-22
owner: PO / Codex
github_issue_id: 152
parent_design: docs/plans/PLAN-L5-25-resource-kernel-physical-protocol.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: se
    slot_label: "SE - strict wire DTO、closed error union、platform port、lifecycle reducer"
  - role: qa
    slot_label: "QA - property/mutation oracle、illegal transition、launch 0、責務重複0"
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
---

# PLAN-L6-92: Resource Kernel protocol・error・platform port機能契約

## 0. 起票理由と採番

PLAN-L4-32が予定した`PLAN-L6-89`は、別ブランチでL別設計検証契約として既に確保済みである。
衝突を避け、L6-90/L6-91も別作業が使用しているため`PLAN-L6-92`へ正規採番する。本PLANはL5-25の物理境界を
pure function/port contractへ降下し、L7実装がwire、error、lifecycle、Node/Rust責務を勝手に変更できないようにする。

## 1. closed wire algebra

```text
NativeCommand = Probe(ProbeRequest) | Execute(ExecuteRequest) | Custody(CustodyCommand)
CustodyCommand = CreateCustody | SpawnAttached | Resume | Observe
               | TerminateTree | ProveEmpty | Shutdown
NativeResponse<T> = Ok<NativeFact<T>> | Err<NativeError>
ControlPhase = ControlNotCreated | ControlStarted | ProbeRecorded | ControlStopped
WorkloadPhase = RootNotCreated | RootCreatedNotStarted | RootStarted | EmptyProven | Released
```

全requestは`protocolVersion, requestId, command, payload, deadlineUnixMs, expectedBundleDigest`を必須とする。
decoderはexact objectを要求し、unknown/missing/duplicate field、unknown enum、oversize、partial frame、invalid UTF-8、
trailing bytesをfail-closeする。encoderはcanonical UTF-8 JSONと4-byte length prefixを決定論的に生成する。
全responseは`control_process_created`と`managed_root_created`を別々のbooleanとして持ち、各identity/phaseと矛盾する
組合せをconstructorで拒否する。`ProbeRequest`はlauncher/admission tokenを型として持たず、`ExecuteRequest`は
空でないrequired capabilityとsealed `AdmissionToken`を必須とする。

## 2. closed error union

| error kind | workload phase制約 | managed root生成 | 必須detail |
|---|---|---:|---|
| `protocol_failure` | `RootNotCreated` | 0 | version/schema/framing reason、control process identityまたはN/A、bounded diagnostic |
| `bundle_failure` | `RootNotCreated` | 0 | expected/observed digest、target/signature/SBOM failure kind |
| `capability_failure` | `RootNotCreated` | 0 | required/observed/missing capability、probe identity |
| `validation_failure` | `RootNotCreated` | 0 | field path、closed reason code |
| `launch_failure` | `RootNotCreated | RootCreatedNotStarted` | 0または1 | OS error、root identity N/A区別、cleanup proof |
| `custody_failure` | `RootCreatedNotStarted | RootStarted` | 0または1 | custody identity、authority epoch/nonce、last durable state、termination/reap proof |
| `deadline` / resource budget kinds | `RootStarted` | 1 | requested/applied/observed value、termination/reap proof |
| `cancelled` / `process_failure` | `RootStarted` | 1 | native exit、termination source、reap proof |
| `orphan_detected` | `RootStarted` | 1 | custody identity、unknown descendant fact、success禁止 |

unknown native codeを`process_failure`へ丸めない。未知値は`protocol_failure`としてprocess開始前、開始後なら
`custody_failure`としてfail-closeし、raw secret/pathをdetailへ漏らさない。`started_at`、PID、custody identity、native exitは
phaseに応じたdiscriminated unionでN/Aと欠測を区別する。

## 3. public function contracts

| function / port | precondition | postcondition / failure invariant | L7 oracle |
|---|---|---|---|
| `decodeFrame(bytes, limits)` | bounded byte sequence | exactly one strict requestまたは`protocol_failure`; side effect 0 | `U-RGK-WIRE-001..006` |
| `encodeFrame(message, limits)` | schema-valid DTO | canonical bytes;同一valueは同一digest | `U-RGK-WIRE-007..009` |
| `verifyBundle(manifest, files, trust)` | trusted key identityとtarget明示 | 全digest/signature/schema/target一致時だけverified handle | `U-RGK-BUNDLE-001..006` |
| `negotiateCapabilities(required, probe)` | verified bundle probe | subsetでなく完全包含時だけselection; missingを保存 | `U-RGK-CAP-001..004` |
| `recordProbe(control, probe)` | verified control identity、strict probe | journalへprobe digestをappendし`ProbeRecorded`を返す。workload side effect 0 | `U-RGK-CAP-005..006` |
| `sealAdmission(spec, recordedProbe)` | required capability完全包含、deadline内 | attempt/nonce/bundle/probe/deadlineを結ぶtoken。空required禁止 | `U-RGK-CAP-007..009` |
| `dispatchCommand(command)` | closed command union | Probeからlauncher到達0、Executeはvalid token無しでmanaged root 0 | `U-RGK-PORT-011..013` |
| `reduceCustody(state, fact)` | 同一attempt/custody nonce、連続sequence | legal transitionだけ新state; illegal/duplicate/conflict拒否 | `U-RGK-LIFE-001..008` |
| `launchAttached(spec, port)` | verified bundle、prepared custody、deadline未超過 | attach-before-user-code;失敗時resume 0・cleanup proof | `U-RGK-PORT-001..005` |
| `terminateAndProveEmpty(id, reason, port)` | created custody | terminate→empty→reap順; proof不能ならsuccess 0 | `U-RGK-PORT-006..010` |
| `normalizeNativeError(error, phase)` | strict native error | closed domain errorへ全単射的変換; phase contradiction拒否 | `U-RGK-ERROR-001..007` |

## 4. lifecycle reducer contract

合法遷移は`Absent→Prepared→AttachedSuspended→Running→Terminating→EmptyProven→Released`だけとする。
abortは`Prepared|AttachedSuspended`から`Terminating`へ入る。`Running`は`started` factを一度だけ受理し、root exitだけでは
`EmptyProven`へ進まない。sequence gap、attempt/custody nonce不一致、terminal後event、resume-before-attach、release-before-empty、
同sequence別payloadを拒否する。reducerはpureで、OS操作・journal write・policy判断を行わない。

## 5. platform port contract

```text
PlatformPort = probe + createCustody + spawnAttached + resume + observe
             + terminateTree + proveEmpty + release
```

portはOS factのみを返す。Windows portは`CREATE_SUSPENDED`、Job assign、non-inherit handle、custodian identityを必須にし、
assign成功前のresumeを型とstateで禁止する。Linux portはstart-in-cgroup、broker/subreaper identity、`populated=0`、reapを必須にし、
事後attachをhard capabilityとしてadvertiseしない。unsupported portはcapability空集合とlaunch call count 0を保証する。

Node `CustodyClient`はtransportとdeadlineを所有するがdomain policy/journalを所有しない。Rust portはOS custodyを所有するが
admission/receipt sealを所有しない。同名policy enumやjournal reducerをRust側に追加した場合はresponsibility-overlap findingでRedとする。

`CustodyAuthorityPort = prepareAuthority + commitHandoff + recoverAuthority + enforceDeadline + revokeAuthority`を別portとする。
`commitHandoff`はauthority epoch/attempt/nonce/deadline/policy digestとOS custody identityをatomicに結び、commit前のresumeを
拒否する。recoveryはepoch/nonce一致時だけ継続し、stale commandと別attemptを拒否する。authorityとsupervisorのdual crashで
独立proofが欠けた場合は`custody_failure`へ収束し、success reducerへ入力しない。

## 6. timeout・cancel・I/O contract

absolute deadlineはNode送信前、Rust decode後、各blocking OS call前後に再評価する。期限超過後のlaunchは0。
stdin/stdout/stderrはbyte budgetを持ち、protocol stdoutへの任意log混入、unbounded read、EOF待ちを禁止する。
cancelとdeadlineが競合した場合も、最初のdurable termination requestをcauseとし、empty/reap proof完了までreturnしない。

## 7. L7 pair-freezeと実装開始条件

`U-RGK-WIRE-*`、`U-RGK-ERROR-*`、`U-RGK-CAP-*`、`U-RGK-LIFE-*`、`U-RGK-PORT-*`、
`U-RGK-BUNDLE-*`の正負caseをL7へfreezeする。property testはcanonical round-trip、closed union exhaustiveness、
illegal transition全辺、error/phase整合を生成する。mutation gateはunknown field受理、deadline check削除、attach前resume、
probeからlauncher到達、control/workload process identity統合、authority handoff省略、dual-crash success補完、empty proof省略、
direct spawn fallback、Rust domain policy追加をkillする。本pairがfreezeするまでPLAN-L7-454の実adapter実装を開始しない。
