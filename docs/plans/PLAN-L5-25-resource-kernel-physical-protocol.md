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
  receipt_id: certificate:b6202c50d5041c0c3d341986aa4f3941
  command_id: pr156-closed-authority-l5-rev13-20260727
  admitted_at: 2026-07-27T03:30:00.000Z
  source_digest: sha256:35e452cd3a82cb76428654c00468175e68a6b05c2dd86026c052c1ec243da989
  decision_digest: sha256:1c6b951f10e636da0703358bd239ea296e280f453feac4709bd60b6884d0183d
  receipt_digest: sha256:6a79a0f5ff4bf1d21f06ecf560ae126d297df5335ad7aa32157ec643de150f67
  binding:
    path: docs/plans/PLAN-L5-25-resource-kernel-physical-protocol.md
    plan_id: PLAN-L5-25-resource-kernel-physical-protocol
    asset_id: plan:legacy:2e0a2fa85c045fe01366ac802508ee775743d16e87ad42472550a25995146455
    revision: 13
    content_digest: sha256:35e452cd3a82cb76428654c00468175e68a6b05c2dd86026c052c1ec243da989
  route:
    signal: redesign
    mode: redesign
  issue:
    provider: github
    issue_id: 152
    episode_id: E4-152-resource-kernel-d0r
    projection_digest: sha256:fbf4a02220f7f6f05a34e18480f77bbff707c740f931b961a7e4d51578f0b708
  origin:
    plan_id: PLAN-L5-25-resource-kernel-physical-protocol
    revision: 12
    digest: sha256:5d7da7bece7de30bd75eada98b0cf25e2c5046dc128d7be3e9b5f841222b138e
  transition:
    direction: design_to_implementation
    implementation_disposition: none
    implementation_target:
      target_plan_id: PLAN-L7-454-resource-kernel-native-companion
      target_revision: 13
  reentry:
    target_plan_id: PLAN-L7-454-resource-kernel-native-companion
    target_revision: 13
    phase: forward_merge
  escape_reason: Resource Kernelのauthority/token/recovery/release契約を閉じてForward実装へ再降下する
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
  request decode完了前のEOF、oversize、partial frame、UTF-8/JSON/schema不正はworkload domainの`NativeError`へ丸めず、
  `PreDispatchWireFault`として返し、Kernel境界でclosed `protocol_failure`へexactly once正規化する。この経路は
  request未生成でlauncher/custody side effect 0である。mutating request送信後からresponse確定前のEOF/pipe切断は
  `DispatchIndeterminate(execution_id, execution_spec_digest, attempt_id, custody_nonce, operation, request_digest)`とし、
  side effect 0やterminal `protocol_failure`へ推測しない。同じidempotency identityでauthority/journal/native factをreconcileし、
  actual root/custody discriminatorを確定するまでterminal receiptを封印しない。
- schema sourceはTypeScript側のversioned protocol schemaを正本とし、release時にcanonical schema digestを生成する。
  Rust DTOは生成物または適合実装であり、独立に語彙追加しない。digest不一致bundleは起動前拒否する。
- stdoutはprotocol専用、診断はbounded stderrへ分離する。secret、raw env、署名鍵、payload本文をlog/receiptへ複製しない。

## 3. commandとfactの物理系列

protocol envelopeは`ProbeRequest | ExecuteRequest | RecoveryCustodyCommand | ControlCommand`のclosed unionとする。`ProbeRequest`はbundle/protocol
identityだけを入力にOS factを返し、workload launcherへの参照を型として持たない。`ExecuteRequest.operation`だけが
`create_custody | spawn_attached | resume`を所有し、control planeが封印した
`AdmissionStageTokenV1(execution_id, execution_spec_digest, attempt_id, admission_chain_id, custody_nonce,
bundle_digest, probe_digest, required_capabilities, operation, operation_sequence, predecessor_fact_digest,
custody_binding, termination_policy_digest,
issued_unix_ms, budget_ms, deadline_unix_ms, token_nonce, issuer_key_id, policy_revision, authenticator)`を必須fieldとして
wire DTOでは`authenticator`を必須とするが、authenticated preimageは`authenticator`自身だけを除く全fieldを
schema順でcanonical化したbytesとする。これにより自己包含を避けつつcommandのattempt/custody/bundle/probe/operation bindingを照合する。
`AdmissionTokenAuthenticatorPort.seal/verify`以外の自己申告tokenを認証済みに昇格せず、unknown key/version、authenticator不一致、
同nonce別payload、別operation replayを拒否する。token無し、空required capability、期限切れ、別probe、別attemptでは
custody作成、spawn、resumeをすべて0にし、`managed_root_created=false`のまま拒否する。handshake成功をexecute許可へ暗黙昇格しない。
`custody_nonce`はOS custody identityではなく、`issueCreateCustodyToken`前にcontrol planeが一意に予約するcreation nonceである。
`create_custody`はこのnonceを入力に一度だけcustody identityを生成し、返却leaseへ同じnonceとidentityを束縛する。
nonce未予約、再利用、別execution/specへの予約移送をside effect前に拒否する。
tokenは一枚を3操作へ流用せず、同じ予約済み`custody_nonce`に対して
`create_custody(sequence=1, custody_binding=reserved)`、
`spawn_attached(sequence=2, custody_binding=custody_identity+executor_id+authority_epoch+lease_nonce)`、
`resume(sequence=3, custody_binding=同じlease)`を一枚ずつ封印する。各token nonceは異なり、
直前phaseとcurrent leaseをjournalで確認した後だけ次tokenを発行する。operation順序のskip/reorder、
消費済みtoken replay、同operation別payloadをside effect前に拒否し、3 tokenの消費を同一attemptへdurable化する。
`create_custody`はarm済みdeadline executorへ束縛したclosed union
`AuthorityLeaseV1 = ExecutionAuthorityLeaseV1 | CleanupAuthorityLeaseV1 | BootFencedCleanupLeaseV1`のうち、
全variantの共通必須fieldは
`authority_epoch, execution_id, execution_spec_digest, attempt_id, custody_nonce, bundle_digest, custody_identity,
executor_id, deadline_unix_ms, termination_policy_digest, recovery_grace_ms, recovery_deadline_unix_ms,
lease_nonce, issuer_key_id, authenticator`だけとする。variant固有schemaは次で閉じる。

| variant | literal/discriminantと追加必須field | 許可operation | 明示禁止field |
|---|---|---|---|
| `ExecutionAuthorityLeaseV1` | `schema_version=execution-authority/v1`, `authority_mode=live`, `boot_id`, `effective_deadline_monotonic_ms`, `recovery_deadline_monotonic_ms` | `spawn_attached, resume` | predecessor/transition、previous/current boot、platform boot fact、cleanup deadline |
| `CleanupAuthorityLeaseV1` | `schema_version=cleanup-authority/v1`, `authority_mode=cleanup_only`, `boot_id`, `effective_deadline_monotonic_ms`, `recovery_deadline_monotonic_ms`, `predecessor_lease_digest`, `cleanup_transition_fact_digest` | `observe, terminate_tree, prove_empty, release_custody` | previous/current boot、platform boot fact、cleanup deadline、create/spawn/resume |
| `BootFencedCleanupLeaseV1` | `schema_version=boot-fenced-cleanup/v1`, `authority_mode=boot_fenced`, `previous_boot_id`, `current_boot_id`, `platform_boot_fact_digest`, `cleanup_deadline_monotonic_ms` | `observe, prove_empty, release_custody` | `boot_id`,旧bootのeffective/recovery monotonic deadline、predecessor/transition、terminate_tree、old PID、create/spawn/resume |

`BootFencedCleanupLeaseV1`は元のwall `deadline_unix_ms/recovery_deadline_unix_ms`を共通fieldとして保持するが、
旧bootのmonotonic fieldは持たない。`cleanup_deadline_monotonic_ms`は`current_boot_id` domainで非延長再導出する。
各variantの`allowed_operations`は上表から導出する固定literal配列としてcanonical preimageへ含める。
表にないfieldはすべてunknownとして拒否し、missing/stale epoch、別attempt/nonce/executor binding、
operation×variant不一致をside effect前に拒否する。
`AuthorityLeaseAuthenticatorPort.issue/verify`はwire DTOの`authenticator`自身だけを除く上表のexact field集合と
固定`allowed_operations`をcanonical authentication payloadとして認証し、unknown version/key、authenticator不一致、
同lease nonce別payloadをside effect前に拒否する。

`RecoveryCustodyCommand.operation`は`recover_authority | observe | terminate_tree | prove_empty | release_custody`だけを所有し、
control process自体の終了は別unionの`ControlCommand.shutdown_companion`へ分離する。
`observe | prove_empty | release_custody`は両cleanup variant、`terminate_tree`は`CleanupAuthorityLeaseV1`だけを必須とする。
`recover_authority`だけは
`AuthorityRecoveryProofV1 = SameBootExecutorRecoveryProofV1 | CrossBootFenceProofV1`を入力とする。same-boot variantは
`SameBootExecutorRecoveryProofV1(executor_id, execution_id, execution_spec_digest, attempt_id, custody_nonce, bundle_digest, custody_identity,
previous_authority_epoch, boot_id, effective_deadline_monotonic_ms, termination_policy_digest, recovery_grace_ms,
recovery_deadline_monotonic_ms, last_transition_digest, recovery_nonce, issuer_key_id, authenticator)`を必須とする。
cross-boot variantはprevious/current boot、platform boot fence fact、同じexecution/spec/attempt/custody/bundle/
epoch/transition/recovery nonce/authenticatorを束縛する。proofとdurable journal/native factの全一致後、CASでepochを一つ進め、
same-bootは`CleanupAuthorityLeaseV1`、cross-bootは`BootFencedCleanupLeaseV1`だけを返す。launcher、managed-root生成、
attach、resumeのfield/variantをschemaとして持たず、
admission token期限後も既存custodyの安全なterminate/reapを妨げない。stale epoch、別execution/attempt/nonceは
state delta 0で拒否する。`release_custody`は`empty_proven`とreap proofを事前条件とし、
running/terminatingで拒否してdeadline executorとauthorityを維持する。`shutdown_companion`はactive custody 0、
pending response 0、未解決`consumed_pending_dispatch | dispatch_indeterminate | dispatch_reconciled_without_result` 0、
terminal outbox flush済みの場合だけ許可し、
custody stateを変更しない。token/lease/recovery proofはいずれもwire DTOのauthenticator自身を
authenticated preimageから除外し、それ以外のexact field全体を認証する。
各responseは`control_process_created`と`managed_root_created`を別fieldで返す。
`spawn_attached`はWindowsではsuspended rootをJobへassignした後だけresume可能、Linuxでは
最初のuser instructionより前にtarget cgroup所属を保証する。commandごとのnative factはcustody identity、root identity、
適用limit、monotonic observation、OS error identityを返すが、`success`やdomain verdictを返さない。

stage dispatch recordは
`issued → consumed_pending_dispatch → result_committed`又は
`consumed_pending_dispatch → dispatch_indeterminate → dispatch_reconciled → result_committed`で閉じる。
token消費と`consumed_pending_dispatch(request_id, token_digest, idempotency_identity, request_digest)`のappendを同じtransactionで行う。
`request_digest`はauthenticatorを含むcanonical full request bytesのdigestで、pending/indeterminate/reconciled/result全stateへ継承する。
同じ`request_id + admission_stage_token_digest + idempotency identity + request_digest`のtransport retryは新しいtoken消費ではなく、
`result_committed`なら同一result factを返し、`consumed_pending_dispatch | dispatch_indeterminate`ならauthority/native factを
reconcileする。side effect 0を独立証明できた場合だけ同じlogical commandを同じidempotency identityで継続し、
不明ならactual phase確定まで再dispatchしない。`dispatch_reconciled`がdurableでresult未commitなら、
4 digestと`actual_phase/fact_digest`のexact一致を確認し、native side effectを再実行せず`result_committed`をappendして
同一resultを返す。managed root生成を伴うcommandは
`execution_id + execution_spec_digest + attempt_id + custody_nonce + operation + operation_sequence`をidempotency identityとする。
同じtokenでも新request ID、別payload、別identity、又は一致するpending/result recordがない再送はlogical replayとして拒否する。
dispatch後response lossは`dispatch_indeterminate`からactual phaseをcommitして同一retryへ応答する。tokenを再消費しない。

## 4. custodian lifecycleとdurability barrier

| state | 許可event | 不変条件 |
|---|---|---|
| `absent` | probe / create | process 0、custody identity未発行 |
| `prepared` | spawn-attached / abort→terminating | custody containerは存在、user code未開始。root未生成failure/deadline/cancelでもcleanup可能 |
| `attached_suspended` | resume / abort→terminating | rootはcustody所属、Windowsはsuspended、attach失敗・deadline・cancel時resume 0 |
| `running` | observe / terminate / normal-root-exit→terminating | root/descendantは同一custody identityで追跡し、root exit単独をterminalにしない |
| `terminating` | terminate→reap | 新規childをcontainし続け、root exitをterminalとしない |
| `empty_proven` | empty + reap proof | Job emptyまたは`populated=0`、zombie/managed orphan 0 |
| `released` | release-custody transaction | empty/reap proof後、platform release→release fact commit→deadline executor disarm→authority revoke+released atomic commitを完了し、再利用PIDだけで所有判定しない |

custody lifecycleとは別にauthority modeを`live → cleanup_only → revoked`で管理する。
deadline/cancel/abortに加え、正常root exit又は明示terminate intentも`live → cleanup_only`をCASし、同じtransactionで新しいlease nonce/authenticatorを持つ
`CleanupAuthorityLeaseV1`を発行してexecution capabilityを不可逆に除去する。CAS敗者はlease 0でcurrent modeを再読込する。
boot変更時は`live | cleanup_only → boot_fenced → revoked`とし、cross-boot proofから
`BootFencedCleanupLeaseV1`以外を発行しない。`cleanup_only | boot_fenced`から`live`へ戻る辺は存在しない。

probeとexecutionの間にはdurability barrierを置く。verified bundleからcontrol processを起動した事実、probe digest、
capability集合をjournalへappendし、そのdigestを含むadmission tokenをcontrol planeが封印した後だけ`prepared`へ遷移する。
token検証前、probe欠測、control processだけ生成済みの状態では`managed_root_created=false`である。

Node client切断またはlauncher crash後もcustodian/brokerはdeadlineとtermination policyを保持し、未管理processへ降格させない。
reconnectはbundle identity、attempt、custody nonceを照合し、別attemptを誤killしない。Node側journalが
`custody_empty`をdurable化してから`release_custody`を呼び、platform release fact、deadline executor disarm、
authority revoke+released atomic commit、finished、sealed receiptを再開可能なterminal transaction/outboxで順に閉じる。
disarm前はcleanup authorityを保持するためcrash retry可能で、revoke後に未完のexecutor操作を残さない。
各barrier後のcrash/retryはjournal済み段階から再開し、二重releaseや早期terminal sealを許さない。
post-dispatch response lossは`dispatch_indeterminate`と`dispatch_reconciled(actual_phase, fact_digest)`をappendし、
reconcile後の実phaseに対応するreceipt variantへ`protocol_failure`原因を保存する。

### 4.1 Custody authorityとatomic handoff

custodyのdurable authorityは一時的なNode client/companionではない。`CustodyAuthority`（command/lease照合）、
`RecoverySupervisor`（再接続/reap）、`DurableDeadlineExecutor`（期限kill）を別identityとして分離する。WindowsではSCM/Job、
Linuxではbroker外system-manager scope/timer又は同等のkernel-backed executorを使い、executorを他2processと同一failure domainへ置かない。
`create_custody`はauthorityが`authority_epoch + attempt_id + custody_nonce + effective_deadline_monotonic_ms + boot_id +
termination_policy_digest + recovery_grace_ms + recovery_deadline_monotonic_ms`をdurable化し、OS handle/cgroup identityをprimary ownershipへ結んだ
`ExecutionAuthorityLeaseV1`を返す。companionはこのleaseを照合してからsuspended root/cgroup childをatomic attachし、
`handoff_committed` factをauthorityとjournalの双方が同じnonceで観測するまでresume/execしない。

token verifierは受理時の`wall_now`と`monotonic_now`を同じ観測点で取得し、
`remaining_ms = min(budget_ms, max(0, deadline_unix_ms - wall_now))`、
`effective_deadline_monotonic_ms = monotonic_now + remaining_ms`として一度だけsealする。
`deadline_unix_ms - issued_unix_ms != budget_ms`、許容skew超過、wall rollback/forward不整合は開始前拒否する。
開始後のwall clock jumpでdeadlineを再計算せず、process restartはdurable remaining factとwall deadlineの早い方を採用し、
boot ID不一致・clock不確実時は期限切れとしてkillする。secure clock/key rotationの具体方式は後続でも、延長fail-openはD0で禁止する。

`recovery_grace_ms`は正整数かつpolicy revisionの`max_recovery_grace_ms`以下、
`recovery_deadline_unix_ms = deadline_unix_ms + recovery_grace_ms`と
`recovery_deadline_monotonic_ms = effective_deadline_monotonic_ms + recovery_grace_ms`を同じ観測点で封印する。
effective deadlineはcreate/spawn/resumeの許可上限であり、既存custodyを減少方向へ収束させる
`observe | terminate_tree | prove_empty | release_custody`の権限失効時刻ではない。
recovery deadlineはcleanup完了SLA/escalation境界であってcleanup権限の失効時刻ではない。超過時は
overdue factと新規admission遮断を必須化するが、terminate/prove/releaseを拒否しない。
deadlineの実行責任は`DurableDeadlineExecutor`にあり、
Node/companion/pipe喪失後も期限内kill→recovery deadline内empty/reapを遂行する。
同一bootの再起動は`SameBootExecutorRecoveryProofV1`、host boot変更は`CrossBootFenceProofV1`で分離し、
execution/spec、authority epoch、attempt、nonce、bundle digest、policy、last durable transitionを照合する。
旧epoch/旧bootの通常commandを拒否し、CAS成功後もsame-bootはcleanup lease、cross-bootはboot-fenced cleanup leaseだけを発行する。
cross-boot fence proofは旧boot workloadが現bootで実行不能であることだけを証明し、empty proofを先取りしない。
発行されたboot-fenced cleanup leaseでcross-boot empty/reapを証明してからreleaseへ進む。
旧monotonic値を比較せず、元のwall recovery deadlineと新bootのwall/monotonic同時観測から非延長cleanup上限を導出する。
deadline/policy変更、workload生成、attach、resumeは型として不可能にする。
authority APIとrecovery supervisorが同時に失われても、別failure domainのexecutorがWindowsではJob kill、
Linuxでは期限内`cgroup.kill`を発行し、再起動broker/subreaperがrecovery deadlineまでに
`populated=0`、zombie 0、managed orphan 0を証明する。owner又はboundを開始前に強制不能ならmanaged rootを作らず拒否する。
executor/system manager/kernel自体を同時に失うhost failureではworkload再開を禁止し、boot後は
cross-boot fence→empty proof→release transactionで収束し、kill/empty/releaseを証明するまで新規admissionを遮断する。
proof不能時はquarantineを維持する。これをprocess dual-crash Greenへ混同しない。
独立proof欠測時の`custody_failure`と新規admission遮断は追加措置であり、既存payloadのkill/reapを代替しない。

## 5. platform portとfailure isolation

Rust内部は`PlatformProbe`、`CustodyFactory`、`AttachedLauncher`、`LimitApplier`、`TreeTerminator`、
`EmptyProof`、`CustodyReleasePort`、`BootFenceProofPort`、`ControlShutdownPort`の小さいportに分割する。
custody release、authority revoke、control shutdownを同じoperationへ畳み込まない。
Windows/Linux adapterは同じportを実装するが、capability差を共通最小集合へ
丸めない。unsupported/権限不足はcapability 0を事実として返し、launcher call 0で閉じる。

companion crash、Node crash、SCM/broker crash、pipe切断、journal commit失敗を別failure domainとして注入可能にする。
native componentはjournalへ直接書かず、再接続可能なcustody identityとOS factを返す。事実を確定できない場合は
`orphan_detected`または`custody_failure`へ収束させ、successへ補完しない。

## 6. companion bundle配置と供給網境界

D0-R bundleはtarget別companion binary、versioned protocol descriptor、SBOM、canonical manifest署名、
互換性を確認したD0-N generation receipt digestだけを同一revisionへ結ぶ。Node runtime、Node core、
generation artifact、activation markerは含めず、D0-N正本を参照する。実行時download、PATH探索、
未検証companionへの差替えを禁止する。

`TrustDecisionPort`はbundle外のversioned installer/release policyを入力に、manifestと署名を検証して
`accepted | rejected`、decision digest、policy versionを返す。port欠測、unknown version、署名不一致、
companion/protocol/SBOM/target/D0-N receipt digest不一致はcontrol process起動前にfail-closeする。
D0は鍵rotation/revocation epoch、secure clock、re-anchor、installer registry、SQLite schemaを固定せず、
具体PKI/time/storageを後続installer/release PLANへ委譲する。

TS側は`bundle_sequence + manifest_digest + trust_decision_digest + d0n_generation_receipt_digest`を結ぶ
monotonic accepted-sequence factをdurableにcompare-and-advanceする。floor未満、同sequence別payload、
partial/corrupt factは拒否する。過去componentを使うrollbackは、現在floorより大きい新sequenceのmanifestへ
再review・再署名し、現在のD0-N receiptとの互換性とL8/L9 oracleを再検証する形式だけを許す。
旧manifest/旧sequenceへの直接復帰は拒否し、受理不能時は旧direct-spawnへfallbackせず利用停止する。

DB incremental、snapshot CAS、performance convergenceの実装は本L5 companion protocolの責務に含めず、
Issue #152の後続sliceへdeferする。D0-Rはcustody protocolとcompanion bundle境界だけをfreezeする。

## 7. L8 pair-freeze条件

`IT-RGK-PHYS-001..039`は、framing mutation、request correlation、probe/admission分離、control/workload process identity、
stage token chain、Windows attach barrier、Linux start-in-cgroup、client/custodian/broker crash、same/cross-boot recovery、
deadline後cleanup、custody release/control shutdown barrier、empty/reap、bundle mutation、rollback、Bun不在を境界故障として
固定する。mockだけでOS custody Greenを宣言せず、mock/contract integrationと実OS integrationのlaneを明示分離する。
L8で正負oracle、fixture、観測点、control/workload別created countをfreezeするまで本PLANはconfirmedにしない。
