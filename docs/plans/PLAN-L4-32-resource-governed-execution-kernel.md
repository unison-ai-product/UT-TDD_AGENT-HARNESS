---
plan_id: PLAN-L4-32-resource-governed-execution-kernel
title: "PLAN-L4-32 (add-design/architecture): Resource-governed Execution Kernel"
kind: add-design
layer: L4
drive: fullstack
route_signal: redesign
route_mode: redesign
created: 2026-07-22
updated: 2026-07-22
owner: PO / Codex
parent_design: docs/design/harness/L4-basic-design/architecture.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L9-system-test-design.md
next_pair_freeze: L9
agent_slots:
  - role: tl
    slot_label: TL - resource budget、停止意味論、段階導入とfail-close境界
  - role: se
    slot_label: SE - ExecutionSpec/Receipt、process tree custody、capability・signed
      companion境界
  - role: qa
    slot_label: QA - deadline、budget超過、親異常終了、孤児ゼロ、再利用のsystem oracle
generates:
  - artifact_path: docs/plans/PLAN-L4-32-resource-governed-execution-kernel.md
    artifact_type: markdown_doc
  - artifact_path: docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
    artifact_type: markdown_doc
  - artifact_path: docs/adr/ADR-009-resource-kernel-native-custody-companion.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L4-basic-design/security.md
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
    - docs/plans/PLAN-L7-466-resource-kernel-native-companion.md
review_evidence:
  - reviewer: claude-opus-5
    review_kind: cross_agent
    reviewed_at: "2026-07-29T14:50:00+09:00"
    tests_green_at: "2026-07-29T14:45:00+09:00"
    verdict: pass
    worker_model: codex
    reviewer_model: claude-opus-5
    green_commands:
      - kind: lint
        command: "bun src/cli.ts plan lint (848 PLAN、plan-schedule OK)"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-29T14:40:00+09:00"
        evidence_path: tests/plan-lint.test.ts
        output_digest: "sha256:368462623766175e76783b927571c6db812830af063e413cd5776e7280dc2ebf"
        anchor_commit: 08fd2b48931f5660f25bdf02d16472a4641f8cdf
      - kind: unit_test
        command: "bun run test:vitest-snapshot tests/plan-lint.test.ts tests/review-evidence.test.ts tests/readability.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-29T14:45:00+09:00"
        evidence_path: tests/review-evidence.test.ts
        output_digest: "sha256:5fef87a0e2879c4b9bd7608c92e01a1ad0aa45cdd0578fba065f2307b81354c4"
    scope: "D0-R 設計 freeze の cross-family review (Codex/PO 著作 → Claude 検証、hybrid 非 author family)。実測した範囲: (a) 本 PLAN が宣言する oracle ID 15 件が pair 先 L9 に文字列一致で全件実在 (欠落 0)、(b) §1.2 の fail-close 不変条件 7 件について §1.3 の写像表を本 review で作成し、各不変条件に対応する L9 §9.1 の実在 ID と根拠記述を明示 (ST-RGK-07..10/13 は §9.1 で DEFERRED 明示のため merge 判定に不算入)、(c) pair 双方 (architecture.md / L9-system-test-design.md) が status=confirmed かつ pair_artifact / next_pair_freeze 相互整合、(d) generates / references の宣言ファイルが全件実在 (ADR-009 / security.md / repository-structure.md ほか)、(e) oracle-test-trace orphans=0、(f) ut-tdd plan lint 848 PLAN OK。未検証 (この evidence は主張しない): 設計方式そのものの妥当性 (custody 意味論で orphan 0 が実際に達成可能か等) と実行時挙動 — 実装が存在しないため add-design freeze の対象外であり、L7/L8 降下時に検証する。指摘 (Minor、freeze を止めない): L9 §9.6 の Issue #124 性能収束 oracle は DEFERRED で owner (#152 later wave) は明示だが exit 条件が日付・gate として固定されていない (open issue #136 と同型)。この deferral を #124 の closure と読み替えないこと。"
status: confirmed
sub_doc: architecture
github_issue_id: 152
supersedes:
  - PLAN-L4-32-resource-governed-execution-kernel
admission_receipt:
  schema_version: v2
  receipt_id: certificate:9f6f36c65b38fdf8354780bce6fa9971
  command_id: pr156-contract-closure-l4-rev12-20260727
  admitted_at: 2026-07-27T04:06:37.354Z
  source_digest: sha256:b0d5b5b4fd99deab736cf7ceee6dea050ff52e92e5bcc63517e56e0dc540c0d2
  decision_digest: sha256:85ae3f2709570e89b8a41684bacec1b83f812dd4048159ae88977569f1d55427
  receipt_digest: sha256:70479beaf61d956e72c565f7a71db1babc28f382def52ba92a97c77de0299103
  binding:
    path: docs/plans/PLAN-L4-32-resource-governed-execution-kernel.md
    plan_id: PLAN-L4-32-resource-governed-execution-kernel
    asset_id: plan:legacy:fd8e0f539c6088b10f953665a7f2103000564ee42d29b7784b3a41cb19f493ff
    revision: 12
    content_digest: sha256:b0d5b5b4fd99deab736cf7ceee6dea050ff52e92e5bcc63517e56e0dc540c0d2
  route:
    signal: redesign
    mode: redesign
  issue:
    provider: github
    issue_id: 152
    episode_id: E4-152-resource-kernel-d0r
    projection_digest: sha256:fbf4a02220f7f6f05a34e18480f77bbff707c740f931b961a7e4d51578f0b708
  origin:
    plan_id: PLAN-L4-32-resource-governed-execution-kernel
    revision: 11
    digest: sha256:51f08c0ac791ff3b1db0eeb1e74c1e3fd15362b38a2abf28511b3b6306da0f08
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
    - PLAN-L4-32-resource-governed-execution-kernel
---

# PLAN-L4-32: Resource-governed Execution Kernel

## 0. 起票理由と目的

Issue #124で観測した `session db-refresh` の孤児化、複数GiB級のメモリ保持、snapshot検証の長時間占有は、
個別commandのtimeout不足ではなく、HARNESSが起動した**プロセス木全体のcustodyを所有していない**という
アーキテクチャ負債である。起動元が終了しても子孫が残り、別hook・doctor・snapshotが同じ重い準備を重複し、
PC操作を妨げても統一された停止receiptが残らない。個別の`kill`、timeout追加、再試行抑止だけでは閉じない。

本PLANのD0-R merge scopeは、HARNESSが起動する外部実行のうち、実行前resource budget、OS単位の
process-tree custody、capability negotiation、immutable terminal receipt、署名済native companion bundle境界に限定する。
設計を先に固定し、対象runnerをこの契約へ合わせる。Bun固有の回避策にはせず、Node/Git/PowerShellその他の
子プロセスを同じ境界で扱う。DB incremental rebuild、single-flight、snapshot CAS、hook/doctor/local CI横断の
全体admission・performance convergenceは要件を破棄せず、Issue #152のlater performance/control-plane waveへ明示deferする。

## 1. 境界と不変条件

### 1.1 Kernelが所有するもの

- HARNESSが直接・間接に起動する全process treeの開始、監視、cancel、reap。
- wall-clock deadline、CPU、memory、process count、stdout/stderr bytes、任意のI/O予算。
- 実行identity、入力revision、予算、終了理由、出力digestを結ぶimmutable receipt。
- 署名済companion bundleの検証、probe、sealed admission token、managed root生成前のcapability fail-close。

Kernelは業務commandの意味、testの合否、GitHub workflowの状態を所有しない。それらは呼出側domainが判定し、
Kernelは「何を、どの入力・予算・custodyで実行し、どう終了したか」を改変不能な事実として返す。
DB/CAS再利用、single-flight、local CI全体のqueue/headroom policyは本D0-R merge scopeでは所有しない。

### 1.2 fail-close不変条件

1. `ExecutionSpec`が欠落・不正・実行環境で強制不能なら開始しない。
2. accepted executionは必ず一つのOS custody containerに所属し、未所属期間を作らない。
3. success、failure、timeout、budget exceeded、cancel、launcher crashの全経路で子孫processをreapする。
4. Kernelが終了を返した時点のmanaged orphan数は0である。0を証明できなければsuccessを返さない。
5. receiptは実際に適用した制約と観測値を記録し、要求値を適用済みと自己申告しない。
6. 実行開始前にplatform capabilityをnegotiationし、要求したcustody/budgetを完全強制できない組合せは開始しない。
7. lifecycleの観測事実はappend-only event、終端判定はそれらから導出したimmutable receiptとし、同じrecordを更新して兼用しない。

### 1.3 不変条件 → L9 oracle 写像 (2026-07-29 D0-R freeze review で追加)

freeze 時点で「不変条件が oracle に覆われている」を prose ではなく ID 写像で示す。各行は
`docs/test-design/harness/L9-system-test-design.md` §9.1 の実在 ID を指す (照合は ID 文字列一致で機械化可能)。

| §1.2 不変条件 | 対応 L9 oracle | 対応の根拠 (L9 §9.1 の記述) |
|---|---|---|
| 1. `ExecutionSpec` 欠落・不正・強制不能なら開始しない | `ST-RGK-01`、`ST-RGK-12` | budget 欠落/負値/無制限値/不正 cwd/shell 文字列/強制不能 policy の投入、required capability・platform mismatch |
| 2. accepted execution は必ず一つの OS custody container に所属し未所属期間を作らない | `ST-RGK-02`、`ST-RGK-03` | Windows の Assign/handoff 失敗注入、Linux の事後 attach fallback を hard custody として受理しない負 oracle |
| 3. 全終了経路 (success/failure/timeout/budget exceeded/cancel/launcher crash) で子孫を reap | `ST-RGK-02`、`ST-RGK-03`、`ST-RGK-04`、`ST-RGK-05` | crash matrix の個別注入、各資源上限の独立超過、lifecycle 各段の crash 注入 |
| 4. 終了時 managed orphan 0、証明できなければ success を返さない | `ST-RGK-04`、`ST-RGK-05`、§9.1 末尾の経路別 AND matrix | 「managed orphan 0」明記、`ensureAbsent` の冪等 absence 収束、worker exit・custody empty・lease release・terminal receipt・orphan 0 の五条件を同一 `attempt_id` で証明 |
| 5. receipt は適用した制約と観測値を記録し、要求値を適用済みと自己申告しない | `ST-RGK-04` | 要求値・適用値・観測 peak・policy revision の保存を Green 条件とし、全超過を `timeout` へ丸める挙動を負 oracle に置く |
| 6. 実行開始前に platform capability を negotiation し、完全強制できない組合せは開始しない | `ST-RGK-12`、`ST-RGK-03` | probe/journal/token barrier 除去と cross-dispatch の注入、deadline owner を arm 不能なら root 生成前に拒否 |
| 7. append-only event と immutable receipt を分離し同一 record を兼用しない | `ST-RGK-11` | event sequence の append-only・欠番/上書きなし、`attempt_id` ごとの terminal receipt exactly-once、mutable status row の兼用を負 oracle に置く |

`ST-RGK-07..10` / `ST-RGK-13` は §9.1 で **DEFERRED** (Issue #152 later performance/control-plane wave) と
明示されており、本 D0-R の merge 判定には算入しない (偽 Green 化を負 oracle が禁じている)。

## 2. Object / port設計

### 2.1 `ExecutionSpec` value object

`ExecutionSpec`は開始前に完全生成するimmutable value objectとし、最低限次を持つ。

| field | 契約 |
|---|---|
| `execution_id` | 一つの論理実行要求を表す安定ID。異なるcanonical spec digestでの再利用を拒否 |
| `attempt_id` | admissionごとに新規発行する一意ID。同じ`execution_id`のretry/coalesce/recoveryを混同しない |
| `work_key` | operation/classification、input revision、policy revision、program/argv/cwd/env、resource budget、deadline、termination policy、required capabilitiesから導出するcanonical spec digest。本D0-Rではcoalescing identityに使用しない |
| `program` / `argv` | shell文字列でなく実行可能ファイルとargv。shell利用時は明示adapter種別を要求 |
| `cwd` / `environment` | canonical cwdとallowlisted env delta。secret値をreceiptへ保存しない |
| `input_revision` | commit SHA、working delta digest、fixture digest等のimmutable入力identity |
| `resource_budget` | wall time、CPU time、peak memory、process count、output bytes、必要時I/O上限 |
| `deadline` | `issued_unix_ms + budget_ms + deadline_unix_ms`のwall sealを入力とし、admission時に`effective_deadline_monotonic_ms`へ一度だけ縮小変換してtree全体に適用。開始後wall clockで延長しない |
| `termination_policy` | graceful猶予、強制終了、descendant reap、lease release、journal flush、terminal receipt sealの順序。`recovery_grace_ms`は正整数でpolicy revisionの`max_recovery_grace_ms`以下とし、同じboot/monotonic domainの`recovery_deadline_monotonic_ms = effective_deadline_monotonic_ms + recovery_grace_ms`を型付きで導出する |
| `classification` | 実行種別。分類ごとの既定budgetはpolicy revisionで固定し、全体queue/headroom policyとは分離 |
| `required_capabilities` | tree custody、hard memory/CPU/process limit、crash recovery等、実行に必須なcapability集合 |

任意fieldの暗黙既定はpolicy catalogでversion管理する。呼出側が無制限を指定することは禁止し、上限緩和は
理由付きoverride evidenceを必要とする。

### 2.2 `ExecutionEvent` journalと`ExecutionReceipt`

`ExecutionEvent`は`attempt_id + sequence`をidentityとするappend-onlyの事実である。`admission_requested`、
`control_started`、`probe_recorded`、`capability_negotiated`、`admission_sealed`、`authority_prepared`、
`custody_created`、`handoff_committed`、`process_attached`、`started`、`limit_observed`、
`authority_recovery_requested`、`recovery_observation_verified`、`lease_reissued`、`termination_requested`、
`dispatch_indeterminate`、`dispatch_reconciled`、`process_reaped`、`custody_empty`、`lease_released`、`finished`を、monotonic sequenceと
durable timestampで記録する。event payloadは過去eventを上書きせず、retryは新しい`attempt_id`へ分岐する。
recovery CAS loserはevent/state delta 0、winnerだけがold/new epoch、native observation digest、executor/bundle/policy bindingを
`lease_reissued`へ保存し、terminal receiptのevent range/digestへ必ず含める。

`ExecutionReceipt`は一つのattemptがterminalへ到達した時だけevent列から導出・封印するimmutable証跡であり、
`execution_id + attempt_id`をidentityとする。途中経過recordや可変status rowをreceiptと呼ばない。全outcome共通fieldは
canonical spec digest、policy/input revision、accepted/finished時刻、exit kind、event range/digestである。native bundle使用時は
bundle sequence/manifest/component digestを必須とし、rollback再発行ならrollback reason、旧component digest、新manifest digestを
同じprovenanceへ保存する。control processと
managed workloadは別discriminantを持ち、native workload exitは`RootCreatedNotStarted|RootStarted`だけ必須、
`RootNotCreated`は`not_applicable: managed_root_not_created`とする。outcome-discriminated unionとして次を持つ。

- `RootNotCreated` terminal (`protocol_failure|bundle_failure|validation_failure|capability_failure|launch_failure|custody_failure`):
  phase/reason、不足capabilityと`custody_disposition: absent | prepared_then_empty`を持つ。`absent`ではroot PID/custodyを
  `not_applicable: managed_root_not_created`とし、`prepared_then_empty`ではcustody identity、terminate/empty/reap/lease-release proofと
  independent root-absent proofを必須にする。control process identity/cleanupは独立fieldに保存する。
- `RootCreatedNotStarted` terminal (`protocol_failure|launch_failure|custody_failure|deadline|cancelled`): suspended root PID、create/attach error、
  termination/reap、custody identity（作成済み時）、independent process-absent proofを必須にし、`started_at`は存在させない。
- `RootStarted` outcome: started/termination-requested/reaped/finishedのmonotonic timestamp、platform custody identity、root PID、
  descendant観測（PID再利用に依存しないOS handle/cgroup identityを優先）。
- exit kind (`success | protocol_failure | bundle_failure | process_failure | deadline | cpu_budget | memory_budget | process_budget |
  output_budget | cancelled | validation_failure | capability_failure | launch_failure | custody_failure | orphan_detected`) とnative exit情報。
- wall/CPU/peak-memory/outputの観測値、stdout/stderrまたはartifactのbounded digest参照。
- managed root created/started outcomeはmanaged orphan count/reap結果を必須とする。

`ExecutionReceipt`がsuccessでもdomain testがpassとは限らない。呼出側はreceiptのexit kind、subject revision、
domain outputを併せて判定する。custody empty/reapまでのeventを先にdurable化し、`lease_released`、`finished` terminal event、sealed receiptを
一つのatomic terminal transactionまたは同じcommit positionのrecoverable outboxでdurably commitする。
terminal eventだけ／receiptだけの片肺を許さない。

single-flightの`RequestReceipt` / `ProducerReceipt`分離はAC-RGK-08として保持するが、Issue #152 later
performance/control-plane waveへdeferし、本D0-Rのterminal receipt merge gateへ混在させない。

### 2.3 capability negotiation

`PlatformCapabilities`はOS名ではなく、実際に強制可能なcapabilityと制約を表す。少なくとも
`atomic_attach_before_user_code`、`tree_kill`、`tree_empty_proof`、`hard_memory_limit`、`hard_cpu_limit`、
`hard_process_limit`、`crash_surviving_custodian`、`broker_external_deadline_owner`、
`non_inheritable_custody_handle`をversion付きで公開する。
`CapabilityNegotiator`は`ExecutionSpec.required_capabilities`とadapterのcapabilityを照合し、完全一致したadapterと
適用policyをjournalへ記録する。不足をwarning、PID polling、soft limitへ暗黙縮退させない。platform matrixはL9の
正負oracleの入力正本とする。

### 2.4 portと短いobject責務

| object / port | 責務 |
|---|---|
| `ExecutionKernel` | validate→admit→attach custody→run→terminate/reap→receiptのlifecycleを調停 |
| `ResourcePolicy` | classification別budgetとoverride可否を純粋判定 |
| `ProcessCustody` | process treeのattach、usage観測、tree-wide signal、reap証明 |
| `ExecutionJournal` | event append、terminal receipt封印、冪等attempt、crash後reconcile |
| `CapabilityNegotiator` | required capabilityとplatform adapterの適合を開始前にfail-close判定 |

各objectはinterface越しに依存し、`ExecutionKernel`を巨大runnerへしない。OS adapterとjournal adapterはdomainから
分離する。public methodのpre/post/invariantはL6へ降ろし、1method 1責務で実装する。

## 3. OS process-tree custody

OS custody adapterは[ADR-009](../adr/ADR-009-resource-kernel-native-custody-companion.md)に従うRust native companionで実装する。
TypeScript/Node control planeは`ExecutionSpec`、resource/admission policy、journal/outbox、receipt封印の正本を維持し、companionには
versioned protocol越しにOS操作だけを委譲する。native側へdomain rule、GitHub判断、DB/CAS再利用判断を移さない。
companion binary、protocol、target、capability probe、署名、SBOM、D0-N generation receiptを結ぶcompanion bundleを検証できない場合、
direct spawnへfallbackせずmanaged workload生成前に`capability_failure`とする。

ここでprocess identityを二つに分離する。`control_process_created`は署名・digest検証済みcompanionまたは常駐
custodian/broker control processの生成事実、`managed_root_created`は利用者commandのroot生成事実である。
bundleの静的検証後に限りcontrol processを起動して`probe`できるが、probe factをjournalへdurable appendし、
required capabilityとの完全一致をadmissionが確定するまでは`managed_root_created=false`を維持する。
`process_created`という単一booleanで両者を兼用してはならない。control processの起動自体を「workload未生成」の
証拠に数えず、各identityのPID/nonce/bundle digest/生成時刻を別々に記録する。

binary protocolは`Probe | Execute | RecoveryObservation | RecoveryCustody | ControlCommand`の5 variant closed unionとする。`Probe`はOS事実を返すだけで
workload launcherへ到達できない。`Execute`だけが`create_custody | spawn_attached | resume`を所有し、control planeが封印した
admission token（attempt、custody nonce、bundle/probe digest、required capability、absolute deadlineを結合）を必須とする。
`RecoveryObservation`はsame/cross-bootの認証済みnative factだけを返しauthority delta 0、
TypeScript `recoverAuthority`だけがjournal/current epoch照合とCAS/lease/trace transactionを所有する。
`RecoveryCustody`は`observe | terminate_tree | prove_empty | release_custody`だけ、`ControlCommand`は
active custody/pending response/未flush outbox 0後の`shutdown_companion`だけを所有する。いずれもlauncher、
managed-root生成、resumeの参照を型として持たない。`create_custody`が返すleaseは`spawn_attached | resume`でもtokenと同時に必須とする。
admission tokenはversioned canonical payloadをissuer/verifier portで認証し、operation/nonce replayをfail-closeする。
wall deadlineはadmission時に一度だけmonotonic deadlineへ縮小変換し、clock jumpや再起動で延長しない。
token/lease/recovery observationは`execution_id + canonical execution_spec_digest + attempt_id + custody_nonce`を共通bindingとし、
別execution receiptへのnative fact誤帰属をfail-closeする。
空のrequired capabilityやhandshake成功だけではexecution admissionにならない。

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

Linuxのwall deadlineはbroker process自身に所有させない。managed rootをresume/execする前に、broker外のdurable
deadline owner（system managerのtransient scope/timerまたは同等のkernel-backed supervisor）へ
`attempt_id + custody_nonce + cgroup identity + absolute deadline`をcommitし、ownerがarmedであることをjournalへ記録する。
brokerと通常のuser-space recovery supervisorが同時に失われても、この独立ownerが期限内に`cgroup.kill`を発行し、型付き
`termination_policy.recovery_grace_ms`から導出した`recovery_deadline`までに
再起動broker/subreaperが`populated=0`、zombie 0、managed orphan 0まで収束させる。deadline owner、kill、reapの
いずれかを強制・検証できないplatformはmanaged root生成前に拒否する。証拠欠測を`custody_failure`へ分類するだけで
生存processを放置してよい契約にはしない。

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

## 4. Issue #152 later performance/control-plane waveへのdefer

次の要件は削除・免除せずIDを予約したまま後続waveへ移す。本D0-Rはその設計・実装・Green evidenceを
merge条件にせず、native custodyを既存Node D0-Nのactivation/cutover正本へ逆流させない。

| deferred AC | 保存する全体要件 | 後続waveの閉鎖条件 |
|---|---|---|
| `AC-RGK-07` | source fingerprint dirty-setによるDB incremental rebuildとfull rebuild canonical digest同値性 | schema/projector変更、reader/writer競合、failure rollbackを含む選択corpus Green |
| `AC-RGK-08` | 保証互換`work_key`だけのsingle-flight、Request/Producer receipt分離、waiter独立terminal | 非互換budget/deadline/capability混入、cancel、producer crashの負oracle Green |
| `AC-RGK-09` | 完全input identityのsnapshot CAS、hermetic materialize、atomic publish/lease/GC | hit/miss、overlay、undeclared access、disk/rename/GC fault corpus Green |
| `AC-RGK-10` | hook/doctor/snapshot/local CI横断のqueue/headroom admission、visible shell 0、managed外process 0 | 全surface同時負荷とqueue deadlineのsystem evidence Green |
| `AC-RGK-13` | DB canonical digestとCAS identityの型・順序・locale・EOL・mode・symlink・toolchain/env識別 | identity一要素mutationとsemantic equivalence corpus Green |

後続waveでも全producer processは本D0-Rのbudget/custody/capability/terminal receipt境界を利用する。ただし、
本D0-RがDB/CAS/local CI policyを所有した、またはそのperformanceをGreen証明したとは扱わない。

## 6. L-pairと依存降下

本L4は「どの安全性・identity・OS capabilityをsystemとして保証するか」とadapter/port境界を所有する。L5はjournal schema、
custodian/broker/Job/cgroupの配置・transaction・通信・失敗隔離を所有する。L6は各public operationの型、pre/post、
state reduction、canonical encoding、error taxonomyを所有する。DB/CAS/control-plane性能の詳細は§4のdefer台帳を正本とする。
L4に関数アルゴリズムを先取りせず、L5/L6はL4の保証を縮退・再定義しない。

| 左側設計 | 右側検証 | freeze条件 |
|---|---|---|
| L4 本architecture | L9 system test design | Windows/Linux custodyとmacOS fail-close、deadline、budget、crash、orphan zeroをsystem surfaceで証明 |
| L5 physical/internal design | L8 integration test design | Windows Job/custodian、Linux cgroup/subreaper/broker/deadline owner、macOS fail-close、journal、signed bundleの境界故障を注入可能 |
| L6 function contracts | L7 unit test design | spec validation、resource policy、state reduction、capability、receipt、bundle trustをpure oracleで固定 |
| L7 implementation | L6 contract trace-freeze | public method、test ID、receipt field、failure kindがexactly-onceで対応 |

降下順序は `L4/L9 pair-freeze → L5/L8 pair-freeze → L6/L7 pair-freeze → L7実装 → L8統合 → L9 system` とする。
下位実装で都合のよい制約へ設計を縮めない。OSで強制不能な要求を発見した場合は本L4またはADRへ戻し、検出器の
allowlistで覆い隠さない。

## 7. 段階導入

global Bun banとcutover完了はPR #154 D0-Nをprerequisite正本とする。本PLANはnative companion、
bundle、Cargo/build/test経路へ新規Bun依存を追加しない局所不変条件だけを所有する。

1. **観測段階**: read-only observer/sidecarが既存runnerのusage/process treeをshadow観測する。実行を所有せず、Kernel admission・
   custody・ExecutionReceiptを名乗らない。出力は`ObservationReport`として隔離し、Green/accepted execution証拠へ使わない。
2. **custody段階**: 代表fixtureをWindows Job/custodianまたはLinux cgroup v2/subreaper/broker外deadline ownerへ移し、macOS不足classをfail-closeしてdeadlineとorphan zeroを強制。
3. **資源段階**: classification別memory/CPU/process/output budgetをfail-close化し、適用値と観測値をreceiptへ保存する。
4. **native activation**: D0-Nのverified Node入口からのみKernel portを呼び、companion経路のdirect spawnを禁止する。Node generation/activationは再所有しない。

各段階はfeature flagで旧経路へ黙ってfallbackしない。rollbackは明示policy revisionとreceiptを伴い、前段の安全性を
維持する。§4のlater performance/control-plane waveは本段階列とは別PLANで降下し、custody/budgetを迂回してはならない。

native companionの導入はtarget triple別の署名済companion bundleとして行う。bundleはcompanion digest、
versioned protocol descriptor、SBOM、target、sequence、D0-N generation receipt digestをcanonical manifestへ固定し、
Node runtime/core/generation/activationを再所有しない。trust判定はbundle外のversioned `TrustDecisionPort`、
anti-rollbackはTS側のmonotonic accepted factへ集約する。旧componentへ戻す場合も旧manifestを再利用せず、
現在floorより大きい新sequenceで再review・再署名し、通常のtrust/target/capability oracleを再通過させる。
PKI rotation、secure clock、re-anchor、物理storeは後続installer/release revisionの所有とし、D0-Rは抽象port欠測、
floor未満、同sequence別payloadをfail-closeする。旧direct-spawn経路へのrollbackは禁止し、必要capabilityを満たせないplatformは利用停止する。

## 8. 受入条件（AC）

- **AC-RGK-01**: 不正または無制限の`ExecutionSpec`を実行前に拒否し、`managed_root_created=false`を維持する。control processを起動した場合もidentityと終了証拠を別記する。
- **AC-RGK-02**: Windowsで`CREATE_SUSPENDED→Assign→Resume`、non-inherit handle、常駐custodian、nested Job negotiationを通してroot/child/grandchildをJob Objectへ収容し、正常・timeout・cancel・launcher crashの全経路でmanaged orphan 0を証明する。
- **AC-RGK-03**: Linuxでcgroup v2 + subreaper + 常駐brokerにより同じtreeを収容する。managed root開始前にbroker外のdurable deadline ownerへattempt/cgroup/deadlineをcommitし、broker+通常recovery supervisorのdual-crashでも期限内`cgroup.kill`、bounded recovery、`populated=0`、zombie 0、managed orphan 0まで実行する。これを強制不能なら開始前拒否し、欠測fail-closeだけを代替にしない。macOSはcapability不足をLinux同等として受理しない。
- **AC-RGK-04**: wall/CPU/memory/process/output各budget超過を固有exit kindで停止し、観測値と適用policy revisionをreceiptに残す。
- **AC-RGK-05**: root PID終了だけでは完了せず、custody container空・reap後に`lease_released + finished + sealed receipt`のatomic terminal commitがdurableになった後だけ完了を返す。
- **AC-RGK-06**: launcher/Kernel再起動後、未完了attemptを誤PID killせずreconcileし、二重実行または未記録の生存子を残さない。
- **AC-RGK-07 [DEFERRED — #152 later performance/control-plane wave]**: DB増分更新が変更影響範囲だけを処理し、選択corpusの全ケースでfull rebuildのtable digestと一致する。本D0-R merge gateには含めない。
- **AC-RGK-08 [DEFERRED — #152 later performance/control-plane wave]**: 同一canonical `work_key`かつ保証互換なDB/snapshot同時要求だけをsingle-flight化し、一つのproducer receiptへ収束する。本D0-R merge gateには含めない。
- **AC-RGK-09 [DEFERRED — #152 later performance/control-plane wave]**: snapshot CASのhitで準備固定費を再実行せず、失敗時も不完全object・lease・一時processを残さない。本D0-R merge gateには含めない。
- **AC-RGK-10 [DEFERRED — #152 later performance/control-plane wave]**: hook、doctor、snapshot、local CI横断のqueue/headroom admissionでvisible shellと管理外processを0にする。本D0-R merge gateには含めない。
- **AC-RGK-11**: lifecycle eventがappend-onlyかつsequence完全で、各attemptのterminal receiptがexactly-onceに封印され、retry/recovery間で`execution_id`と`attempt_id`を混同しない。
- **AC-RGK-12**: required capabilityとplatform matrixの不一致をmanaged workload生成前に拒否し、`control_process_created`と`managed_root_created`を混同せず、soft fallbackを成功として記録しない。
- **AC-RGK-13 [DEFERRED — #152 later performance/control-plane wave]**: DB canonical digestとCAS完全identityが順序・locale・EOL・file mode・symlink・toolchain/environment差を意図どおり区別する。本D0-R merge gateには含めない。
- **AC-RGK-14**: companion bundleのbinary/protocol/target/署名/SBOM/D0-N generation receipt不一致をcontrol process起動前に拒否する。bundle外のversioned trust decisionとTS側monotonic accepted factを照合し、floor未満、同sequence別payload、port欠測を拒否する。rollbackは旧componentを現在floorより大きい新sequence manifestへ再review・再署名し、通常oracleを再通過させる一形式だけを許可する。
- **AC-RGK-15**: PR #154 D0-Nのcutover gateをprerequisiteとして参照し、native companion/bundle/Cargo/build/test差分が新規Bun binary・API・lock・runtime dependencyを増加させない。

## 9. 完了条件と非完了条件

本D0-R merge gateは、L9側にactive ID `AC-RGK-01..06/11/12/14/15`の正負oracle、platform capability matrix、
最小versioned evidence coreをRed freezeし、L5/L6降下PLANの依存edgeを検証できることとする。
deferred ID `AC-RGK-07..10/13`は明示deferのままID/要件を保持し、D0-Rをblockしない。
Issue #124全体のclose gateはL9 §9.5を正本とし、後続#152 later performance/control-plane waveでdeferred IDと
performance envelopeをGreen証明するまでcloseしない。

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

downstreamは `PLAN-L5-25`、`PLAN-L6-92`、`PLAN-L7-466` とする。当初予定した`PLAN-L5-24`と`PLAN-L6-89`は
別branchの正規PLANと衝突したため再利用しない。各draftの実在後も、layer-monotonicity、参照実在性、L5↔L8・L6↔L7の
pair freezeを検出器で確認してからconfirmedへ昇格する。
