---
plan_id: PLAN-L5-25-resource-kernel-physical-protocol
title: "PLAN-L5-25 (add-design/internal-processing): Resource Kernel
  wire・custodian・bundle物理設計"
kind: add-design
layer: L5
drive: fullstack
route_signal: redesign
route_mode: redesign
created: 2026-07-22
updated: 2026-07-22
owner: PO / Codex
parent_design: docs/plans/PLAN-L4-32-resource-governed-execution-kernel.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
agent_slots:
  - role: se
    slot_label: SE - Node/Rust wire境界、platform port、custodian lifecycle、bundle配置
  - role: qa
    slot_label: QA - framing故障、custodian crash、開始前attach、bundle mutationのL8 oracle
generates:
  - artifact_path: docs/plans/PLAN-L5-25-resource-kernel-physical-protocol.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L5-detailed-design/internal-processing.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L8-integration-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L4-32-resource-governed-execution-kernel.md
  requires: []
  blocks:
    - docs/plans/PLAN-L6-92-resource-kernel-function-contracts.md
  references:
    - docs/adr/ADR-009-resource-kernel-native-custody-companion.md
    - docs/test-design/harness/L9-system-test-design.md
    - docs/plans/PLAN-L7-454-resource-kernel-native-companion.md
review_evidence: []
status: draft
sub_doc: internal-processing
github_issue_id: 152
supersedes:
  - PLAN-L5-25-resource-kernel-physical-protocol
admission_receipt:
  schema_version: v2
  receipt_id: certificate:ccd15e5634631054a4ab97f130a31620
  command_id: pr156-formal-admission-l5-20260724
  admitted_at: 2026-07-24T12:41:00.000Z
  source_digest: sha256:3466c5fc588adbcfd0e8d61ecf53a75eebcda0b65d90393c8442c92cb9390d23
  decision_digest: sha256:a31a3abf8b5e91de7f66bc03846903381348e50df6f02ec8a9a7939817608271
  receipt_digest: sha256:6e16862f748249c8ce67d80a67df2828db79c636c4d48d39ba7c19c82e665f56
  binding:
    path: docs/plans/PLAN-L5-25-resource-kernel-physical-protocol.md
    plan_id: PLAN-L5-25-resource-kernel-physical-protocol
    asset_id: plan:legacy:2e0a2fa85c045fe01366ac802508ee775743d16e87ad42472550a25995146455
    revision: 2
    content_digest: sha256:3466c5fc588adbcfd0e8d61ecf53a75eebcda0b65d90393c8442c92cb9390d23
  route:
    signal: redesign
    mode: redesign
  issue:
    provider: github
    issue_id: 152
    episode_id: E4-152-node-control-plane-d0n
    projection_digest: sha256:bc3454a066b640893922b0ad77dd27ad8baa0091586d82d152df0fc6e8d06f0e
  origin:
    plan_id: PLAN-L5-25-resource-kernel-physical-protocol
    revision: 1
    digest: sha256:bf49528680f8b549395323c8c6bfbcee3be39be7d03e7754c9de350d73a787d5
  transition:
    direction: design_to_implementation
    implementation_disposition: none
    implementation_target:
      target_plan_id: PLAN-L7-454-resource-kernel-native-companion
      target_revision: 2
  reentry:
    target_plan_id: PLAN-L5-25-resource-kernel-physical-protocol
    target_revision: 2
    phase: forward_merge
  escape_reason: Resource Kernel設計をForward実装へ再降下する
  supersedes:
    - PLAN-L5-25-resource-kernel-physical-protocol
---

# PLAN-L5-25: Resource Kernel wire・custodian・bundle物理設計

## 0. 起票理由と採番

PLAN-L4-32が予定した`PLAN-L5-24`は、別ブランチでFreeze checkpoint物理設計として既に確保済みである。
PLAN IDを再利用せず、全branch採番監査で空いている`PLAN-L5-25`へ本設計を収容する。L4のsystem保証を、
実装都合で縮小せず、Node control planeとRust native companionの通信・配置・failure domainへ降下する。

## 1. 責務配置と非重複境界

| component | 所有する物理責務 | 所有禁止 |
|---|---|---|
| TypeScript/Node control plane | spec/policy/capability要求の正本、journal/outbox transaction、terminal receipt seal、bundle検証、deadline/admission | Job/cgroupの事実捏造、direct spawn fallback、Rustへdomain判断を委譲 |
| Node `CustodyClient` | 検証済binaryをshell無しargvで起動、bounded framed I/O、request/response correlation、transport deadline、probe factのjournal化、admission token送信、protocol error正規化 | resource policy決定、receipt seal、PATH探索、Bun API、handshakeだけでworkload開始 |
| Rust companion | strict wire decode/encode、OS probe、admission token照合、開始前custody作成・attach・resume、limit適用、terminate・empty/reap proof | PLAN/GitHub/DB/CAS判断、admission policy、terminal success判定、SQLite journal、空required capabilityでexecute受理 |
| Windows custodian/supervisor | non-inherit Job handleをlauncherと別failure domainで保持し、SCM再concile、tree emptyをOS identityで証明 | PID pollingをcustody proofとすること、attach前resume |
| Linux broker/subreaper | cgroup v2 identity、`clone3(CLONE_INTO_CGROUP)`、subreaper、`cgroup.kill`、`populated=0`+reap | 事後attachをhard custodyとして受理、process groupだけで成功 |

RustはOS factを返すport adapterであり、Nodeと重複するdomain state machineを持たない。Bun binary、Bun API、
Bun test runnerを新しい経路へ一切導入しない。

## 2. wire framingとschema配置

- transportはstdin/stdout上の**length-prefixed UTF-8 JSON frame**とする。先頭4 byte unsigned big-endian length、
  最大frame sizeはbundle manifestのprotocol policyで固定する。改行区切り、EOF推測、複数JSON連結は受理しない。
- requestは`protocol_version`、`request_id`、`command`、`payload`、`deadline_unix_ms`、
  `expected_bundle_digest`を必須とし、unknown field/enum、duplicate key、非canonical number、末尾byteを拒否する。
- responseは同じ`request_id`、`protocol_version`と、`ok:{fact}`または`error:{NativeError}`の排他的unionを持つ。
  transport EOF、oversize、partial frame、UTF-8/JSON/schema不正をdomain errorへ丸めない。
- schema sourceはTypeScript側のversioned protocol schemaを正本とし、release時にcanonical schema digestを生成する。
  Rust DTOは生成物または適合実装であり、独立に語彙追加しない。digest不一致bundleは起動前拒否する。
- stdoutはprotocol専用、診断はbounded stderrへ分離する。secret、raw env、署名鍵、payload本文をlog/receiptへ複製しない。

## 3. commandとfactの物理系列

protocol envelopeは`ProbeRequest | ExecuteRequest | CustodyCommand`のclosed unionとする。`ProbeRequest`はbundle/protocol
identityだけを入力にOS factを返し、workload launcherへの参照を型として持たない。`ExecuteRequest`はcontrol planeが
封印した`AdmissionToken(attempt_id, custody_nonce, bundle_digest, probe_digest, required_capabilities, deadline_unix_ms)`を
必須とし、空集合、期限切れ、別probe、別attemptでは`managed_root_created=false`のまま拒否する。handshake成功を
execute許可へ暗黙昇格しない。

`probe`、`create_custody`、`spawn_attached`、`resume`、`observe`、`terminate_tree`、`prove_empty`、`shutdown`
をversioned commandとする。各responseは`control_process_created`と`managed_root_created`を別fieldで返す。
`spawn_attached`はWindowsではsuspended rootをJobへassignした後だけresume可能、Linuxでは
最初のuser instructionより前にtarget cgroup所属を保証する。commandごとのnative factはcustody identity、root identity、
適用limit、monotonic observation、OS error identityを返すが、`success`やdomain verdictを返さない。

同じ`request_id`の再送はread-only commandだけ冪等に再応答できる。managed root生成を伴うcommandは
`attempt_id + custody_nonce`をidempotency identityとし、既存custodyを照会して二重生成を拒否する。

## 4. custodian lifecycleとdurability barrier

| state | 許可event | 不変条件 |
|---|---|---|
| `absent` | probe / create | process 0、custody identity未発行 |
| `prepared` | create→spawn-attached | custody containerは存在、user code未開始 |
| `attached_suspended` | attach→resume / abort | rootはcustody所属、Windowsはsuspended、attach失敗時resume 0 |
| `running` | observe / terminate | root/descendantは同一custody identityで追跡 |
| `terminating` | terminate→reap | 新規childをcontainし続け、root exitをterminalとしない |
| `empty_proven` | empty + reap proof | Job emptyまたは`populated=0`、zombie/managed orphan 0 |
| `released` | handle/lease release | empty proofが先行し、再利用PIDだけで所有判定しない |

probeとexecutionの間にはdurability barrierを置く。verified bundleからcontrol processを起動した事実、probe digest、
capability集合をjournalへappendし、そのdigestを含むadmission tokenをcontrol planeが封印した後だけ`prepared`へ遷移する。
token検証前、probe欠測、control processだけ生成済みの状態では`managed_root_created=false`である。

Node client切断またはlauncher crash後もcustodian/brokerはdeadlineとtermination policyを保持し、未管理processへ降格させない。
reconnectはbundle identity、attempt、custody nonceを照合し、別attemptを誤killしない。Node側journalが
`custody_empty`をdurable化してからlease release・finished・sealed receiptを一つのterminal transaction/outboxで閉じる。

### 4.1 Custody authorityとatomic handoff

custodyのdurable authorityは一時的なNode client/companionではなく、WindowsではSCM管理custodian、Linuxでは
service manager管理brokerが所有する。`create_custody`はauthorityが`authority_epoch + attempt_id + custody_nonce +
absolute_deadline + termination_policy_digest`をdurable化し、OS handle/cgroup identityをprimary ownershipへ結んだ
`AuthorityLease`を返す。companionはこのleaseを照合してからsuspended root/cgroup childをatomic attachし、
`handoff_committed` factをauthorityとjournalの双方が同じnonceで観測するまでresume/execしない。

deadlineの実行責任はauthority側にあり、Node/companion/pipe喪失後もmonotonic timerでterminate→empty/reapを遂行する。
再起動時はauthority epoch、attempt、nonce、bundle digest、last durable transitionを照合し、旧epochのcommandを拒否する。
authorityとそのsupervisor/service managerが同時に失われた場合は、Windowsではlast-handle-close kill、Linuxでは
service-manager recovery + persisted cgroup identity/`cgroup.kill`を安全側経路とする。いずれも独立probeの連続性が
欠ければsuccessへ復元せず`custody_failure`とし、新規attempt admissionを遮断する。

## 5. platform portとfailure isolation

Rust内部は`PlatformProbe`、`CustodyFactory`、`AttachedLauncher`、`LimitApplier`、`TreeTerminator`、
`EmptyProof`の小さいportに分割する。Windows/Linux adapterは同じportを実装するが、capability差を共通最小集合へ
丸めない。unsupported/権限不足はcapability 0を事実として返し、launcher call 0で閉じる。

companion crash、Node crash、SCM/broker crash、pipe切断、journal commit失敗を別failure domainとして注入可能にする。
native componentはjournalへ直接書かず、再接続可能なcustody identityとOS factを返す。事実を確定できない場合は
`orphan_detected`または`custody_failure`へ収束させ、successへ補完しない。

## 6. bundle配置と供給網境界

platform bundleはtarget別Node runtime image、Node core、target別companion、protocol schema、manifest、SBOM、署名、対象OS evidenceを同一revisionで結ぶ。
実行時download、PATH探索、片側差替えを禁止する。install時と各execution admission時にmanifest署名、core/companion/schema
digest、target triple、probe capabilityを照合する。rollbackもmanifest単位で既知良好bundleへ行い、同じL8/L9 oracleを再通過する。
trust rootはbundle外のinstaller組込authority registryから`TrustStorePort`で取得する。bundleによるregistry・revocation
stateの自己更新は禁止する。`BundleManifestSignedPayload`はbundle/sequence/prior sequence/authority/key/algorithm/
registry revision/issued/expiryと全component digestをcanonical encodingへ束縛し、一field mutationも署名検証で拒否する。

activationとanti-rollback floorを別物理storeへ分けない。TS-owned SQLiteのappend-only
`bundle_activation_log(record_id, bundle_digest, bundle_sequence, prior_bundle_sequence, authorization_digest,
registry_revision, clock_evidence_digest, record_digest)`を正本とし、`BEGIN IMMEDIATE`から単一row insert/commitまでを一つの
transactionとする。current bundleとminimum sequenceは同logの最後のvalid committed recordからだけ投影する。
intent/temp row、commit前journal、途中生成fileは正本でなく、crash recoveryはそれらを破棄して直前committed recordへ戻る。

`TrustedClockPort`はplatform secure timeまたはinstaller-configured authority registryに束縛されたsigned time evidenceを返す。
`clock_anchor_log`はauthority/evidence digest/issued/expiry/boot identity/monotonic counter/last accepted timeをappend-onlyで
永続化する。missing/corrupt/rollbackはactivation 0、復旧は許可authorityのsigned re-anchor recordだけを受理する。
ambient `Date.now()`、filesystem timestamp、未署名NTPを期限判定へ使わない。rotationは旧新keyのoverlapとsigned statementを必要とする。

## 7. L8 pair-freeze条件

`IT-RGK-PHYS-001..026`は、framing mutation、request correlation、probe/admission分離、control/workload process identity、double-spawn拒否、Windows attach barrier、
Linux start-in-cgroup、client/custodian/broker crash、reconnect、empty/reap、bundle mutation、rollback、Bun不在を境界故障として
固定する。mockだけでOS custody Greenを宣言せず、mock/contract integrationと実OS integrationのlaneを明示分離する。
L8で正負oracle、fixture、観測点、control/workload別created countをfreezeするまで本PLANはconfirmedにしない。
