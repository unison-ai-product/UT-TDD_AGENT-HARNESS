---
plan_id: PLAN-L4-32-resource-governed-execution-kernel
title: "PLAN-L4-32 (add-design/architecture): Resource-governed Execution Kernel"
kind: add-design
layer: L4
sub_doc: architecture
drive: fullstack
status: draft
route_signal: redesign
route_mode: redesign
created: 2026-07-22
updated: 2026-07-22
owner: PO / Codex
github_issue_id: 149
parent_design: docs/design/harness/L4-basic-design/architecture.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L9-system-test-design.md
next_pair_freeze: L9
agent_slots:
  - role: tl
    slot_label: "TL - resource budget、停止意味論、段階導入とfail-close境界"
  - role: se
    slot_label: "SE - ExecutionSpec/Receipt、process tree custody、DB増分/CAS port設計"
  - role: qa
    slot_label: "QA - deadline、budget超過、親異常終了、孤児ゼロ、再利用のsystem oracle"
generates:
  - artifact_path: docs/plans/PLAN-L4-32-resource-governed-execution-kernel.md
    artifact_type: markdown_doc
  - artifact_path: docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
    artifact_type: markdown_doc
  - artifact_path: docs/adr/ADR-009-resource-kernel-native-custody-companion.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
  - artifact_path: docs/governance/repository-structure.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L9-system-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires:
    - docs/plans/PLAN-L7-365-harness-db-currency-hook.md
  blocks:
    - docs/plans/PLAN-L5-25-resource-kernel-physical-protocol.md
  references:
    - docs/adr/ADR-009-resource-kernel-native-custody-companion.md
    - docs/plans/PLAN-L4-26-engine-swap-object-method-design.md
    - docs/plans/PLAN-L6-77-detector-compiler-meta-verifier-contracts.md
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/design/harness/L5-detailed-design/internal-processing.md
    - docs/test-design/harness/L9-system-test-design.md
    - docs/plans/PLAN-L5-25-resource-kernel-physical-protocol.md
    - docs/plans/PLAN-L6-92-resource-kernel-function-contracts.md
    - docs/plans/PLAN-L7-454-resource-kernel-native-companion.md
review_evidence: []
---

# PLAN-L4-32: Resource-governed Execution Kernel

## 0. 起票理由と目的

Issue #124で観測した `session db-refresh` の孤児化、複数GiB級のメモリ保持、snapshot検証の長時間占有は、
個別commandのtimeout不足ではなく、HARNESSが起動した**プロセス木全体のcustodyを所有していない**という
アーキテクチャ負債である。起動元が終了しても子孫が残り、別hook・doctor・snapshotが同じ重い準備を重複し、
PC操作を妨げても統一された停止receiptが残らない。個別の`kill`、timeout追加、再試行抑止だけでは閉じない。

本PLANは、HARNESSから開始する外部実行をすべて `Resource-governed Execution Kernel`（以下Kernel）へ集約する。
Kernelは実行前に宣言された資源予算と期限を受理し、OS単位のプロセス木custody、増分DB更新、content-addressed
snapshot再利用、終了証跡を一つの契約として提供する。設計を先に固定し、既存runner、hook、doctor、CI、検出器を
この契約へ合わせる。Bun固有の回避策にはせず、Bun/Node/Git/PowerShellその他の子プロセスを同じ境界で扱う。

## 1. 境界と不変条件

### 1.1 Kernelが所有するもの

- HARNESSが直接・間接に起動する全process treeの開始、監視、cancel、reap。
- wall-clock deadline、CPU、memory、process count、stdout/stderr bytes、任意のI/O予算。
- 実行identity、入力revision、予算、終了理由、出力digestを結ぶimmutable receipt。
- 同じ入力から導出できるDB projectionの増分更新と、snapshot artifactのCAS lookup/publish。
- hook、CLI、doctor、snapshot runner、CIが共有するadmission controlと同時実行policy。

Kernelは業務commandの意味、testの合否、GitHub workflowの状態を所有しない。それらは呼出側domainが判定し、
Kernelは「何を、どの入力・予算・custodyで実行し、どう終了したか」を改変不能な事実として返す。

### 1.2 fail-close不変条件

1. `ExecutionSpec`が欠落・不正・実行環境で強制不能なら開始しない。
2. accepted executionは必ず一つのOS custody containerに所属し、未所属期間を作らない。
3. success、failure、timeout、budget exceeded、cancel、launcher crashの全経路で子孫processをreapする。
4. Kernelが終了を返した時点のmanaged orphan数は0である。0を証明できなければsuccessを返さない。
5. receiptは実際に適用した制約と観測値を記録し、要求値を適用済みと自己申告しない。
6. DB/CASの再利用はinput identity完全一致時だけ許可し、current working treeへの暗黙追従を禁止する。
7. 実行開始前にplatform capabilityをnegotiationし、要求したcustody/budgetを完全強制できない組合せは開始しない。
8. lifecycleの観測事実はappend-only event、終端判定はそれらから導出したimmutable receiptとし、同じrecordを更新して兼用しない。

## 2. Object / port設計

### 2.1 `ExecutionSpec` value object

`ExecutionSpec`は開始前に完全生成するimmutable value objectとし、最低限次を持つ。

| field | 契約 |
|---|---|
| `execution_id` | 一つの論理実行要求を表す安定ID。異なるcanonical spec digestでの再利用を拒否 |
| `attempt_id` | admissionごとに新規発行する一意ID。同じ`execution_id`のretry/coalesce/recoveryを混同しない |
| `work_key` | operation/classification、input revision、policy revision、program/argv/cwd/env、resource budget、deadline class、termination policy、required capabilities、cache/output policyから導出するcanonical digest。single-flightはcaller IDでなく本keyを使う |
| `program` / `argv` | shell文字列でなく実行可能ファイルとargv。shell利用時は明示adapter種別を要求 |
| `cwd` / `environment` | canonical cwdとallowlisted env delta。secret値をreceiptへ保存しない |
| `input_revision` | commit SHA、working delta digest、fixture/CAS digest等のimmutable入力identity |
| `resource_budget` | wall time、CPU time、peak memory、process count、output bytes、必要時I/O上限 |
| `deadline` | absolute deadline。各child timeoutの寄せ集めではなくtree全体に適用 |
| `concurrency_key` | doctor、db-refresh、snapshot等のsingleton/coalescing/admission policy key |
| `cache_policy` | `deny | read | read_write` とCAS namespace/version |
| `termination_policy` | graceful猶予、強制終了、descendant reap、lease release、journal flush、terminal receipt sealの順序 |
| `classification` | hook/doctor/test/snapshot/CI等。分類ごとの既定budgetはpolicy revisionで固定 |
| `required_capabilities` | tree custody、hard memory/CPU/process limit、crash recovery等、実行に必須なcapability集合 |

任意fieldの暗黙既定はpolicy catalogでversion管理する。呼出側が無制限を指定することは禁止し、上限緩和は
理由付きoverride evidenceを必要とする。

### 2.2 `ExecutionEvent` journalと`ExecutionReceipt`

`ExecutionEvent`は`attempt_id + sequence`をidentityとするappend-onlyの事実である。`admission_requested`、
`control_started`、`probe_recorded`、`capability_negotiated`、`admission_sealed`、`authority_prepared`、
`custody_created`、`handoff_committed`、`process_attached`、`started`、`limit_observed`、
`termination_requested`、`process_reaped`、`custody_empty`、`lease_released`、`finished`を、monotonic sequenceと
durable timestampで記録する。event payloadは過去eventを上書きせず、retryは新しい`attempt_id`へ分岐する。

`ExecutionReceipt`は一つのattemptがterminalへ到達した時だけevent列から導出・封印するimmutable証跡であり、
`execution_id + attempt_id`をidentityとする。途中経過recordや可変status rowをreceiptと呼ばない。全outcome共通fieldは
canonical spec digest、policy/input revision、accepted/finished時刻、exit kind、event range/digestである。control processと
managed workloadは別discriminantを持ち、native workload exitは`RootCreatedNotStarted|RootStarted`だけ必須、
`RootNotCreated`は`not_applicable: managed_root_not_created`とする。outcome-discriminated unionとして次を持つ。

- `RootNotCreated` terminal (`validation_failure|capability_failure|launch_failure`): phase/reason、不足capability。root PID/custodyは
  `not_applicable: managed_root_not_created`であり、control process identity/cleanupは独立fieldに保存する。
- `RootCreatedNotStarted` terminal (`launch_failure|custody_failure`): suspended root PID、create/attach error、
  termination/reap、custody identity（作成済み時）、independent process-absent proofを必須にし、`started_at`は存在させない。
- `RootStarted` outcome: started/termination-requested/reaped/finishedのmonotonic timestamp、platform custody identity、root PID、
  descendant観測（PID再利用に依存しないOS handle/cgroup identityを優先）。
- exit kind (`success | process_failure | deadline | cpu_budget | memory_budget | process_budget |
  output_budget | cancelled | validation_failure | capability_failure | launch_failure | custody_failure | orphan_detected`) とnative exit情報。
- wall/CPU/peak-memory/outputの観測値、stdout/stderrまたはartifactのbounded digest参照。
- managed root created/started outcomeはmanaged orphan count/reap結果を必須とし、DB/CASを実行したphaseだけ対応receiptを必須にする。未実行phaseは
  `not_applicable`理由を列挙し、欠測と区別する。

`ExecutionReceipt`がsuccessでもdomain testがpassとは限らない。呼出側はreceiptのexit kind、subject revision、
domain outputを併せて判定する。custody empty/reapまでのeventを先にdurable化し、`lease_released`、`finished` terminal event、sealed receiptを
一つのatomic terminal transactionまたは同じcommit positionのrecoverable outboxでdurably commitする。
terminal eventだけ／receiptだけの片肺を許さない。

single-flightではcaller要求ごとに`RequestReceipt(execution_id, request_attempt_id)`をexactly-once封印し、一つの
`ProducerReceipt(producer_execution_id, producer_attempt_id, work_key)`へ`coalesced_to`で結ぶ。producer receiptをcaller identityへ
複製しない。waiterのcancel/deadline/admission rejectionは各RequestReceiptのterminal outcomeとして記録し、producer継続可否とは
分離する。producer完了を利用したwaiterだけがproducer digestを参照し、各requestの受付・待機・離脱証跡を失わない。

### 2.3 capability negotiation

`PlatformCapabilities`はOS名ではなく、実際に強制可能なcapabilityと制約を表す。少なくとも
`atomic_attach_before_user_code`、`tree_kill`、`tree_empty_proof`、`hard_memory_limit`、`hard_cpu_limit`、
`hard_process_limit`、`crash_surviving_custodian`、`non_inheritable_custody_handle`、`hermetic_filesystem`、
`network_deny`、`environment_allowlist`、`tool_identity`、`access_trace_complete`をversion付きで公開する。
`CapabilityNegotiator`は`ExecutionSpec.required_capabilities`とadapterのcapabilityを照合し、完全一致したadapterと
適用policyをjournalへ記録する。不足をwarning、PID polling、soft limitへ暗黙縮退させない。platform matrixはL9の
正負oracleの入力正本とする。

`cache_policy=read|read_write`はhermetic/access capabilityをvalidation時に自動でrequiredへ追加する。callerが省略しても
要求を弱めず、platform adapterが一つでも強制不能ならcache hit前に`capability_failure`とする。

### 2.4 portと短いobject責務

| object / port | 責務 |
|---|---|
| `ExecutionKernel` | validate→admit→attach custody→run→terminate/reap→receiptのlifecycleを調停 |
| `ResourcePolicy` | classification別budgetとoverride可否を純粋判定 |
| `ProcessCustody` | process treeのattach、usage観測、tree-wide signal、reap証明 |
| `ExecutionJournal` | event append、terminal receipt封印、冪等attempt、crash後reconcile |
| `CapabilityNegotiator` | required capabilityとplatform adapterの適合を開始前にfail-close判定 |
| `IncrementalDbProjector` | source fingerprint差分から影響projectionだけをtransaction更新 |
| `SnapshotCas` | canonical input keyでlookup、原子的publish、lease、GC対象列挙 |
| `AdmissionController` | concurrency key、全体memory headroom、queue deadlineによる開始可否判定 |

各objectはinterface越しに依存し、`ExecutionKernel`を巨大runnerへしない。OS adapter、SQLite adapter、CAS filesystem
adapterはdomainから分離する。public methodのpre/post/invariantはL6へ降ろし、1method 1責務で実装する。

## 3. OS process-tree custody

OS custody adapterは[ADR-009](../adr/ADR-009-resource-kernel-native-custody-companion.md)に従うRust native companionで実装する。
TypeScript/Node control planeは`ExecutionSpec`、resource/admission policy、journal/outbox、receipt封印の正本を維持し、companionには
versioned protocol越しにOS操作だけを委譲する。native側へdomain rule、GitHub判断、DB/CAS再利用判断を移さない。
companion binary、protocol、target、capability probe、署名、SBOMを結ぶplatform bundleを検証できない場合、
direct spawnへfallbackせずmanaged workload生成前に`capability_failure`とする。

ここでprocess identityを二つに分離する。`control_process_created`は署名・digest検証済みcompanionまたは常駐
custodian/broker control processの生成事実、`managed_root_created`は利用者commandのroot生成事実である。
bundleの静的検証後に限りcontrol processを起動して`probe`できるが、probe factをjournalへdurable appendし、
required capabilityとの完全一致をadmissionが確定するまでは`managed_root_created=false`を維持する。
`process_created`という単一booleanで両者を兼用してはならない。control processの起動自体を「workload未生成」の
証拠に数えず、各identityのPID/nonce/bundle digest/生成時刻を別々に記録する。

binary protocolは`probe`と`execute`をcommand-discriminated unionとして分離する。`probe`はOS事実を返すだけで
workload launcherへ到達できず、`execute`はcontrol planeが封印したadmission token（attempt、custody nonce、
bundle/probe digest、required capability、absolute deadlineを結合）を必須とする。空のrequired capabilityや
handshake成功だけではexecution admissionにならない。

### 3.1 Windows

Windows adapterはJob Objectを作成し、root processを`CREATE_SUSPENDED`で生成し、Jobへの`AssignProcessToJobObject`が
成功してから`ResumeThread`する。この順序によりuser codeがcustody外で動く窓を作らない。少なくとも
`JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`、active process limit、job memory limit、必要なCPU rate/deadline監視を
組み合わせる。Job handleはchildへ継承させない。標準入出力を継承する場合は`STARTUPINFOEX`の
`PROC_THREAD_ATTRIBUTE_HANDLE_LIST`へ必要handleだけを列挙し、API要件どおり継承を有効にした上でJob/custodian handleを
listから除外する。標準入出力不要時はhandle継承自体を無効にする。launcher自身の異常終了でもcustodyが失われないよう、実行workerはJob handleを所有せず、常駐custodianと
別監督境界のsupervisorだけが非継承handleを所有する。custodian heartbeat喪失時はsupervisorがJob全体のterminateを要求し、
active process 0を確認して最後のhandleを閉じる。Job identityはattemptに結ぶ予測不能な名前と最小ACLで作成し、journalへは
再利用可能なraw handle値でなくattempt/custody identityを保存する。最後のhandle close後にJobを再openできるとは仮定せず、
recoveryは「旧Jobを再所有」ではなく、supervisor観測と独立process probeで旧attemptをterminalへ収束させる。

supervisor/custodianはWindows Service Control Manager管理の別service境界で起動し、workerと同時failure domainに置かない。
supervisor単独crashはSCM restart後にjournalと保持中Jobを照合する。custodianとの同時喪失では全Job handle closeによる
`KILL_ON_JOB_CLOSE`を安全側terminalとし、再起動supervisorはprocess creation sentinelと独立probeでactive process 0を確認する。
未知生存processまたは観測欠測があればsuccessへせず`custody_failure`を保持する。

Jobはattempt GUIDを含むnamed objectとして最小ACLで作成し、custodianがdurable primary handleを保持する。supervisor再起動時は
custodian生存中に限り`OpenJobObject`で同じnamed Jobを開き、attempt GUIDとjournal nonceを照合してsecondary handleを再取得する。
custodianはSCM-authenticated supervisor以外へ`DuplicateHandle`せず、双方喪失でobjectが消滅した後のreopenは禁止する。

親processが既存Job内にいる場合はnested Jobのcapabilityを実測negotiationする。必要limitの入れ子が成立する環境だけを
受理し、breakaway、Job limit競合、custodian自身を対象Jobへ閉じ込める構成では開始しない。nested Jobまたは常駐custodianを
確立できない環境は、黙ってPID監視へ縮退せず`custody_failure`で開始を拒否する。custodianの異常終了は別の監督境界から
検知・再起動し、journalに残るattempt/custody identityとsupervisor evidenceからterminalへreconcileする。

window表示抑止は別契約だが、Windows adapterはnative executable + argv、`CREATE_NO_WINDOW`相当、
`windowsHide`を使用し、`cmd.exe`/PowerShellを暗黙挿入しない。必要なshellは`ExecutionSpec`に明示する。

### 3.2 POSIX

Linux adapterは常駐brokerをsubreaper (`PR_SET_CHILD_SUBREAPER`) とし、executionごとのcgroup v2へrootをuser code開始前に
配置する。hard custody classificationは`clone3(CLONE_INTO_CGROUP)`を必須経路とし、非対応kernelでは開始しない。
停止childを事後attachするhandshakeは未所属intervalを作るためhard custodyへ使用せず、低capability開発classに限定する。
delegated subtreeのownership/permissionをbrokerに限定し、payload uid/user namespaceから`cgroup.procs`移動、子cgroup作成、
delegation変更を許さない。admissionはpayloadを非特権uidへ落とし、ambient/inheritable capabilityを空にし、`CAP_SYS_ADMIN`、
任意user namespace、cgroup mount/write権限を拒否する。このdropを強制できない特権payloadはhard custody分類で開始しない。
memory/CPU/process limitと`cgroup.kill`、`cgroup.events`の`populated=0`をcustody/reap証明の正本とし、脱出した
再親子はsubreaperが`waitid/waitpid`で回収する。cgroup delegation、subreaper、常駐brokerのいずれかが不足する場合、
`orphan zero`を要求するproduction classificationは開始しない。process group/sessionだけのadapterはcapabilityが明示的に
低い開発用classに限定し、hard custody要求へ選択しない。

macOSはcgroup/subreaper同等のhard custodyを標準提供しないため、専用常駐brokerによるsession/process-group監視で
証明できるcapabilityだけを公開する。`tree_kill`や`tree_empty_proof`を要求する分類で完全証明できない場合は
`capability_failure`でfail-closeし、「POSIX」としてLinux同等を自己申告しない。daemonize/double-forkを許す外部serviceは
Kernel管理外serviceとして別境界を宣言し、本Kernelのsuccess証拠へ含めない。

### 3.3 crash recoveryとorphan zero

Kernelは開始前にjournalへintentをdurable appendし、常駐custodian/brokerがcustody identityを所有した後にstartedを記録する。
一時的なCLI/workerの寿命にcustodyを結び付けない。再起動時は未完了attemptを
列挙し、OS custodyが生存していれば終了/reap、消滅済みなら観測可能な証拠とともに`launch_failure`または
`custody_failure`へ収束する。PIDだけで所有権を推定して無関係processを終了しない。正常終了の定義は、root終了ではなく
custody container空、lease解放、journal flush、terminal event + receipt seal/publishまでである。

## 4. DB incremental rebuild

現行のhook/doctor/snapshotごとの全DB rebuildを廃止し、authoring sourceのfingerprint graphからdirty setを導出する。

1. source path、length-framed content digest、file mode/symlink target、schema/projector version、dependency edgeをmanifest化する。
2. 前回receiptと比較し、変更sourceとtransitive dependent projectionだけをdirtyにする。
3. 一つのtransactionでdirty projectionを置換し、成功後だけmanifest revisionを進める。
4. 同じ`work_key`の同時要求だけをsingle-flightでcoalesceする。waiterごとに残deadline、budget、termination、required capabilityの
   互換性を再判定し、producerが同等以上の保証を満たさない場合は合流させない。callerの`execution_id`差だけでは分裂させない。
5. schema/projector version変更、manifest欠落、integrity failure時だけfull rebuildへ昇格する。
6. full rebuildもKernel budget/custody内で実行し、旧DBはtransaction成功までreadableに保つ。

DBのcanonical digestは、schema version、table/column/index/trigger/viewの正規化DDL identity、primary-key順のrow、型tag、
NULL、signed 64-bit integer、IEEE-754 real bit pattern、UTF-8 text、blobのbyte表現をlength-framed encodingへ正規化して算出する。
PKを持たないtableは全columnの型付きcanonical bytesで安定sortし、重複rowもcountを失わない。NaN/Infinity/-0、text encoding、
collationはschema policyで許否と表現を固定する。SQLiteのrow返却順、locale、JSON key順、timestamp生成時刻をdigestへ混入させない。
digest readは一つの明示read transaction/snapshot revision内で完結し、同時writerの前後revisionを混在させない。projectionに
非決定値が必要なら比較対象外fieldをschemaで明示し、暗黙除外しない。

増分結果はfull rebuildと同値でなければならない。L8/L9で選択的変更corpusに対し両結果のcanonical table digestを比較し、
差異があればincrementalを無効化してfindingを出す。高速化を理由にstale projectionをGreenとして返さない。

## 5. Snapshot CAS

snapshot準備の固定費を、入力単位のcontent-addressed artifactへ変換する。CAS identityは少なくとも
`repository tree digest + explicit staged/unstaged/untracked delta digest + submodule/LFS identity + dependency lock digest +
runtime executable digest/version + OS/architecture/filesystem capability + relevant env allowlist digest + preparation executable digest +
snapshot schema version + preparation policy revision`をfield名・型・長さ付きcanonical bytesから算出する。秘密値そのものは
含めず、結果に影響するsecret-backed inputはnon-cacheableまたは安全なversion tokenを要求する。欠落field、未知version、
case-fold/EOL/file-mode/symlink semanticsを正規化できない入力はhitさせない。

`explicit staged/unstaged/untracked delta`はrepository全量探索を意味しない。version管理されたsource-selection manifestが
authoritative tracked path、必要なuntracked fixture root、除外する生成物/cacheを宣言し、そのmanifest自体のdigestをidentityへ
含める。manifest外のuntracked fileを黙って入力扱いせず、必要入力がmanifest外に現れた場合はcache miss + findingとして設計へ戻す。

component digestの単純連結をkey正本にしない。tracked treeへindex、worktree、authoritative untracked fixtureを順序付きoverlay reducerで
適用し、delete/rename/type-change、untracked→tracked衝突、case-fold衝突を解決またはfail-closeしたcanonical final-tree manifest
（normalized path、entry type、mode、content/symlink digest）を生成する。同じfinal treeは同じkey、異なるfinal treeは別keyになる。

CAS利用executionはmaterialize rootと宣言input以外を閉じるhermetic sandboxで実行する。filesystem root外、未宣言env、network、
ambient PATH/tool lookupはdeny-by-defaultとする。hit前に得られる宣言access policy（filesystem/env/network/tool allowlist）と
許可tool executable digestをCAS keyへ含め、実行後の観測access trace digestはreceiptへ別に結ぶ。観測traceが宣言集合のsubsetで
なければartifactを無効化し、宣言policy変更は別keyにする。実行後traceそのものを事前keyへ循環依存させない。sandbox/traceを
強制できないclassificationはcache hitを許可しない。undeclared accessはhit取消 + findingであり、既存artifactをGreen利用しない。
cache hitでもconsumer/test executionは同じhermetic sandboxとaccess collector内で動かし、宣言外accessをdenyする。hit artifactを
process実行なしで返すpure materialization classificationは、外部入力を読まない型/adapter契約とartifact digest検証を必須にする。

- hit時はimmutable snapshotをread-only materializeし、準備scriptを再実行しない。
- miss時はleaseを取得し、一つのproducerだけが一時領域へ生成・検証後にatomic publishする。
- producer失敗、deadline、cancel時は不完全objectを公開せず、leaseと一時領域をKernelが回収する。
- consumer mutationはcopy-on-write作業域に限定し、CAS objectを変更しない。
- receiptはCAS key、hit/miss、producer execution、materialized digestを結ぶ。
- GCは参照lease、保存期間、容量budgetに従い、実行中objectを削除しない。

## 6. L-pairと依存降下

本L4は「どの安全性・identity・OS capabilityをsystemとして保証するか」とadapter/port境界を所有する。L5はjournal schema、
custodian/broker/Job/cgroup/SQLite/CASの配置・transaction・通信・失敗隔離を所有する。L6は各public operationの型、pre/post、
state reduction、canonical encoding、error taxonomyを所有する。L4に関数アルゴリズムを先取りせず、L5/L6はL4の保証を
縮退・再定義しない。

| 左側設計 | 右側検証 | freeze条件 |
|---|---|---|
| L4 本architecture | L9 system test design | Windows/Linux custodyとmacOS fail-close、deadline、budget、crash、orphan zeroをsystem surfaceで証明 |
| L5 physical/internal design | L8 integration test design | Windows Job/custodian、Linux cgroup/subreaper/broker、macOS fail-close、journal、SQLite/CASの境界故障を注入可能 |
| L6 function contracts | L7 unit test design | spec validation、policy、state reduction、CAS key、dirty-set計算をpure oracleで固定 |
| L7 implementation | L6 contract trace-freeze | public method、test ID、receipt field、failure kindがexactly-onceで対応 |

降下順序は `L4/L9 pair-freeze → L5/L8 pair-freeze → L6/L7 pair-freeze → L7実装 → L8統合 → L9 system` とする。
下位実装で都合のよい制約へ設計を縮めない。OSで強制不能な要求を発見した場合は本L4またはADRへ戻し、検出器の
allowlistで覆い隠さない。

## 7. 段階導入

既存Bun runtime/test/CIは`DEBT-RGK-BUN-001`として台帳化する。2026-07-22から新規Bun依存を禁止し、
最初のproduction Resource Kernel bundle切替時をcompatibility期限とする。Node parity oracleが
Greenになる前に既存jobを削除して通過を装わず、production→runtime adapter→test/CI→lockfile/toolingの順に撤去する。

1. **観測段階**: read-only observer/sidecarが既存runnerのusage/process treeをshadow観測する。実行を所有せず、Kernel admission・
   custody・ExecutionReceiptを名乗らない。出力は`ObservationReport`として隔離し、Green/accepted execution証拠へ使わない。
2. **custody段階**: `db-refresh`、snapshot runner、doctorをWindows Job/custodianまたはLinux cgroup v2/subreaper/brokerへ移し、macOS不足classをfail-closeしてdeadlineとorphan zeroを強制。
3. **資源段階**: classification別memory/CPU/process/output budgetと全体admission controlをfail-close化。
4. **増分段階**: DB single-flight/incrementalを導入し、full rebuild equivalence oracle通過後に既定化。
5. **CAS段階**: snapshot CASをread-onlyから開始し、atomic publish/lease/GC検証後にread-write化。
6. **全面移行**: hook/CLI/test/CIの直接spawnを禁止するlintを有効化し、legacy runnerを削除する。

各段階はfeature flagで旧経路へ黙ってfallbackしない。rollbackは明示policy revisionとreceiptを伴い、前段の安全性を
維持する。段階4/5の性能改善は段階2/3の安全統制を迂回してはならない。

native companionの導入はtarget triple別の署名済platform bundleとして行う。各bundleはTS core revision、protocol schema
digest、companion digest、SBOM、実機L9 evidenceをmanifestで固定する。rollbackは既知良好なbundle tag全体へ行い、coreまたは
companionだけを差し替えない。旧direct-spawn経路へのrollbackは禁止し、必要capabilityを満たせないplatformは利用停止する。

## 8. 受入条件（AC）

- **AC-RGK-01**: 不正または無制限の`ExecutionSpec`を実行前に拒否し、`managed_root_created=false`を維持する。control processを起動した場合もidentityと終了証拠を別記する。
- **AC-RGK-02**: Windowsで`CREATE_SUSPENDED→Assign→Resume`、non-inherit handle、常駐custodian、nested Job negotiationを通してroot/child/grandchildをJob Objectへ収容し、正常・timeout・cancel・launcher crashの全経路でmanaged orphan 0を証明する。
- **AC-RGK-03**: Linuxでcgroup v2 + subreaper + 常駐brokerにより同じtreeを収容し、強制終了・`populated=0`・reapでmanaged orphan 0を証明する。macOSはcapability不足をLinux同等として受理せずfail-closeする。
- **AC-RGK-04**: wall/CPU/memory/process/output各budget超過を固有exit kindで停止し、観測値と適用policy revisionをreceiptに残す。
- **AC-RGK-05**: root PID終了だけでは完了せず、custody container空・reap後に`lease_released + finished + sealed receipt`のatomic terminal commitがdurableになった後だけ完了を返す。
- **AC-RGK-06**: launcher/Kernel再起動後、未完了attemptを誤PID killせずreconcileし、二重実行または未記録の生存子を残さない。
- **AC-RGK-07**: DB増分更新が変更影響範囲だけを処理し、選択corpusの全ケースでfull rebuildのtable digestと一致する。
- **AC-RGK-08**: 同一canonical `work_key`かつ保証互換なDB/snapshot同時要求だけをsingle-flight化し、一つのproducer receiptへ収束する。input revisionだけが同じ非互換要求は合流させない。
- **AC-RGK-09**: snapshot CASのhitで準備固定費を再実行せず、miss/producer失敗/cancel/競合でも不完全object・lease・一時processを残さない。
- **AC-RGK-10**: hook、doctor、snapshot、ローカルCIを横断するsystem testで、資源飢餓時はadmission拒否し、PC操作を妨げるvisible shellと管理外processを0にする。
- **AC-RGK-11**: lifecycle eventがappend-onlyかつsequence完全で、各attemptのterminal receiptがexactly-onceに封印され、retry/recovery間で`execution_id`と`attempt_id`を混同しない。
- **AC-RGK-12**: required capabilityとplatform matrixの不一致をmanaged workload生成前に拒否し、`control_process_created`と`managed_root_created`を混同せず、soft fallbackを成功として記録しない。
- **AC-RGK-13**: DB canonical digestとCAS完全identityが順序・locale・EOL・file mode・symlink・toolchain/environment差を意図どおり区別し、identityの一部欠落時は再利用しない。
- **AC-RGK-14**: platform bundleのbinary/protocol/target/署名/SBOM/evidence不一致をcontrol process起動前に拒否し、実probe不一致はmanaged workload生成前に拒否する。既知良好bundleへのrollback後も対象OSのcustody oracleを再通過し、TypeScript domain/policy/journalとRust custody companionの責務重複を0にする。
- **AC-RGK-15**: Bun新規依存を0に保ち、既存Bun migration debtをNode parity oracleのGreen後に段階撤去する。互換期限までにBun不在のclean install、doctor、Windows/Linux L7-L9、aggregate CI、Pack acceptanceをGreenにし、tracked Bun実行依存・compatibility code・検出例外を0にする。

## 9. 完了条件と非完了条件

本PLANのconfirmed条件は、L9側にAC-RGK-01..15の正負oracle、platform capability matrix、evidence schemaをRed freezeし、
L5/L6降下PLANを起票して依存edgeを機械検証できることである。Issue #124のclose gateはL9 §9.5を唯一の正本とし、
AC-RGK-01..15、Windows/Linux実runner、macOS capability fail-close、DB/CAS全corpus、Issue固有performance envelopeを
すべてGreen証明するまでcloseしない。

単一PIDの手動停止、`windowsHide`だけの追加、timeout値の延長、重い検証のGitHub CI移送、DB rebuild頻度の単純削減、
snapshot一時directoryの掃除だけでは本負債の完了証拠にならない。

### 9.1 観測済みincident evidence（受入baselineではない）

以下はKernel不在を示す観測報告であり、raw telemetryを欠くため性能閾値やorphan-zeroの再現baselineには使わない。
欠測値を0で補完してはならず、Red oracle実行時はL9のevidence schemaを満たす新規receiptを採取する。

| evidence ID | source / subject | revision / process | timing / resource | outcome / coverage limit |
|---|---|---|---|---|
| `RGK-EV-LOCAL-01` | Issue #124 / `session db-refresh` | revision未記録、PID 8312 | 2026-07-22、CPU約293秒、working set約3.07GiB、wall不明 | parent喪失後も残留し手動停止。raw receipt不在 |
| `RGK-EV-LOCAL-02` | Issue #124 comment / snapshot runner | PR #125 `d0cabedc`以降、正確なHEAD未固定、PID 19180 | 2026-07-22、300秒超、peak未計測 | shell応答不能後に子孫回収、最終orphan 0。開始終了時刻とPID tree telemetry不在 |
| `RGK-EV-CI-01` | Actions run `29891794487` / Windows job `88833527906` | `0ccf10c0985348302402f37ca420aee9379b4224` | 04:43:07Z–04:47:37Z、DB 20秒、tests 190秒 | cancel。PID/peak/orphan未計測 |
| `RGK-EV-CI-02` | 同run / Linux job `88833527923` | 同commit | 04:43:06Z–04:47:32Z、DB 13秒、tests 236秒 | failure。PID/peak/orphan未計測 |
| `RGK-EV-CI-03` | Actions run `29892125300` / Windows job `88834471971` | `72604cd13798a29828c84fbe927cb5cce166551b` | 04:50:44Z–04:55:04Z、DB 19秒、tests 200秒 | failure。PID/peak/orphan未計測 |
| `RGK-EV-CI-04` | 同run / Linux job `88834471970` | 同commit | 04:50:44Z–04:55:23Z、DB 14秒、tests 249秒 | failure。PID/peak/orphan未計測 |

downstreamは `PLAN-L5-25`、`PLAN-L6-92`、`PLAN-L7-454` とする。当初予定した`PLAN-L5-24`と`PLAN-L6-89`は
別branchの正規PLANと衝突したため再利用しない。各draftの実在後も、layer-monotonicity、参照実在性、L5↔L8・L6↔L7の
pair freezeを検出器で確認してからconfirmedへ昇格する。

## 10. Node control-plane cutover / Bun永久禁止

PO判断（2026-07-22）によりBunは恒久禁止とする。TypeScript domainはNode control planeで実行し、Rustはprivileged OS custodyだけを所有する。移行は次の一方向state machineで行う。

| state | exit条件 | 禁止事項 |
|---|---|---|
| `inventory_frozen` | source/test/config/hook/CI/Pack/runtimeのBun inventoryとNode代替ownerを固定 | 未登録Bun参照、新規Bun追加 |
| `node_shadow` | 同一fixtureのcanonical receipt parity | Bun結果を正本化、差分黙殺 |
| `node_primary` | NodeだけでCLI/hook/detector/SQLite/test/Packを実行 | Node失敗時のBun fallback |
| `bun_removed` | lockfile、imports、commands、setup、compatibility codeを物理削除 | 期限なしallowlist、parked shim |
| `sealed` | 同一HEAD/bundleでNode/Rust/zero/Pack aggregate Green | 欠測、skip、別attempt集約 |

各surfaceは`Node replacement Green → entrypoint切替 → 旧経路negative化 → 削除`の順で処理する。Node代替前に検出器を削除して検出能力を落とすこと、Node primary後にBunを検出器runtimeとして残すことを禁止する。

Bun ban detectorはmanifest/lockfile、静的import、dynamic import、spawn argv、workflow/hook/setup、generated Pack、runtime process imageを別scannerとして検査し、coverage receiptとOR集約する。コメント・negative fixtureの例外はdetector ID、owner、理由、expiryを必須とし、production pathのallowlistを認めない。parse不能、scanner欠測、observer gapはfinding 0ではなくRedである。

受入はL9 `ST-NODE-CUTOVER-01..12`とAC-RGK-15の積集合とする。Bun未導入clean Windows/Linux、Node detector self-host、SQLite/hook parity、atomic Node+Rust bundle rollback、runtime Bun process 0、tracked Bun production reference 0が同一revisionで揃うまで本PLANをconfirmしない。
