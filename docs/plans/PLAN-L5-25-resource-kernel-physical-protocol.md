---
plan_id: PLAN-L5-25-resource-kernel-physical-protocol
title: "PLAN-L5-25 (add-design/internal-processing): Resource Kernel wire・custodian・bundle物理設計"
kind: add-design
layer: L5
sub_doc: internal-processing
drive: fullstack
status: draft
route_signal: redesign
route_mode: redesign
created: 2026-07-22
updated: 2026-07-22
owner: PO / Codex
github_issue_id: 152
parent_design: docs/plans/PLAN-L4-32-resource-governed-execution-kernel.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
agent_slots:
  - role: se
    slot_label: "SE - Node/Rust wire境界、platform port、custodian lifecycle、bundle配置"
  - role: qa
    slot_label: "QA - framing故障、custodian crash、開始前attach、bundle mutationのL8 oracle"
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
trust rootはbundle外のinstaller組込authority registryから`TrustStorePort`で取得する。registry、revocation state、
trusted clock、durable sequence floorを別物理storeとして扱い、bundleによる自己更新を禁止する。rotationは旧新keyの
overlapとsigned statementを必要とし、activationとmonotonic floor更新を同一durability barrierでcommitする。

## 7. L8 pair-freeze条件

`IT-RGK-PHYS-001..018`は、framing mutation、request correlation、probe/admission分離、control/workload process identity、double-spawn拒否、Windows attach barrier、
Linux start-in-cgroup、client/custodian/broker crash、reconnect、empty/reap、bundle mutation、rollback、Bun不在を境界故障として
固定する。mockだけでOS custody Greenを宣言せず、mock/contract integrationと実OS integrationのlaneを明示分離する。
L8で正負oracle、fixture、観測点、control/workload別created countをfreezeするまで本PLANはconfirmedにしない。
