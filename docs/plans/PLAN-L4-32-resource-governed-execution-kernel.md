---
plan_id: PLAN-L4-32-resource-governed-execution-kernel
title: "PLAN-L4-32 (add-design/architecture): Resource-governed Execution Kernel"
kind: add-design
layer: L4
sub_doc: architecture
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-22
updated: 2026-07-22
owner: PO / Codex
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
  - artifact_path: docs/design/harness/L4-basic-design/architecture.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/internal-processing.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L9-system-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires:
    - docs/plans/PLAN-L4-26-engine-swap-object-method-design.md
    - docs/plans/PLAN-L6-77-detector-compiler-meta-verifier-contracts.md
    - docs/plans/PLAN-L7-365-harness-db-currency-hook.md
  blocks:
    - docs/plans/PLAN-L5-24-resource-execution-physical-data.md
    - docs/plans/PLAN-L6-89-resource-execution-kernel-contracts.md
    - docs/plans/PLAN-L7-453-resource-execution-kernel.md
  references:
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/design/harness/L5-detailed-design/internal-processing.md
    - docs/test-design/harness/L9-system-test-design.md
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

## 2. Object / port設計

### 2.1 `ExecutionSpec` value object

`ExecutionSpec`は開始前に完全生成するimmutable value objectとし、最低限次を持つ。

| field | 契約 |
|---|---|
| `execution_id` | 冪等な安定ID。異なるspecでの再利用を拒否 |
| `program` / `argv` | shell文字列でなく実行可能ファイルとargv。shell利用時は明示adapter種別を要求 |
| `cwd` / `environment` | canonical cwdとallowlisted env delta。secret値をreceiptへ保存しない |
| `input_revision` | commit SHA、working delta digest、fixture/CAS digest等のimmutable入力identity |
| `resource_budget` | wall time、CPU time、peak memory、process count、output bytes、必要時I/O上限 |
| `deadline` | absolute deadline。各child timeoutの寄せ集めではなくtree全体に適用 |
| `concurrency_key` | doctor、db-refresh、snapshot等のsingleton/coalescing/admission policy key |
| `cache_policy` | `deny | read | read_write` とCAS namespace/version |
| `termination_policy` | graceful猶予、強制終了、descendant reap、receipt flushの順序 |
| `classification` | hook/doctor/test/snapshot/CI等。分類ごとの既定budgetはpolicy revisionで固定 |

任意fieldの暗黙既定はpolicy catalogでversion管理する。呼出側が無制限を指定することは禁止し、上限緩和は
理由付きoverride evidenceを必要とする。

### 2.2 `ExecutionReceipt` entity

`ExecutionReceipt`は`execution_id + attempt`をidentityとし、append-onlyで次を保持する。

- canonical spec digest、policy revision、input revision、cache hit/miss。
- accepted/started/termination-requested/reaped/finishedのmonotonic timestamp。
- platform custody identity、root PID、観測したdescendant数（PID再利用に依存しないOS handle/cgroup identityを優先）。
- exit kind (`success | process_failure | deadline | cpu_budget | memory_budget | process_budget |
  output_budget | cancelled | launch_failure | custody_failure | orphan_detected`) とnative exit情報。
- wall/CPU/peak-memory/outputの観測値、stdout/stderrまたはartifactのbounded digest参照。
- managed orphan count、reap結果、DB incremental receipt、CAS read/publish receipt。

`ExecutionReceipt`がsuccessでもdomain testがpassとは限らない。呼出側はreceiptのexit kind、subject revision、
domain outputを併せて判定する。途中状態だけをsuccess receiptへ上書きせず、attempt履歴を残す。

### 2.3 portと短いobject責務

| object / port | 責務 |
|---|---|
| `ExecutionKernel` | validate→admit→attach custody→run→terminate/reap→receiptのlifecycleを調停 |
| `ResourcePolicy` | classification別budgetとoverride可否を純粋判定 |
| `ProcessCustody` | process treeのattach、usage観測、tree-wide signal、reap証明 |
| `ExecutionJournal` | receipt/eventのappend、冪等attempt、crash後reconcile |
| `IncrementalDbProjector` | source fingerprint差分から影響projectionだけをtransaction更新 |
| `SnapshotCas` | canonical input keyでlookup、原子的publish、lease、GC対象列挙 |
| `AdmissionController` | concurrency key、全体memory headroom、queue deadlineによる開始可否判定 |

各objectはinterface越しに依存し、`ExecutionKernel`を巨大runnerへしない。OS adapter、SQLite adapter、CAS filesystem
adapterはdomainから分離する。public methodのpre/post/invariantはL6へ降ろし、1method 1責務で実装する。

## 3. OS process-tree custody

### 3.1 Windows

Windows adapterはJob Objectを作成し、root processを**処理開始前に**所属させる。少なくとも
`JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`、active process limit、job memory limit、必要なCPU rate/deadline監視を
組み合わせる。launcher自身の異常終了・handle closeでもjob配下を終了させる。既に別job配下でnesting制約により
完全custodyを確立できない環境は、黙ってPID監視へ縮退せず`custody_failure`で開始を拒否する。

window表示抑止は別契約だが、Windows adapterはnative executable + argv、`CREATE_NO_WINDOW`相当、
`windowsHide`を使用し、`cmd.exe`/PowerShellを暗黙挿入しない。必要なshellは`ExecutionSpec`に明示する。

### 3.2 POSIX

POSIX adapterは専用process group/sessionを作り、group単位でSIGTERM→猶予→SIGKILLを適用し、`waitpid`でreapする。
Linuxでcgroup v2が利用可能な場合はmemory/CPU/process limitと`cgroup.kill`を使用する。利用不能環境でもprocess group、
deadline、子孫reapを最低保証とし、要求budgetを強制できない場合は開始を拒否する。daemonize/double-forkでgroupを
離脱する子を許可せず、必要な外部serviceはKernel管理外serviceとして別境界を宣言する。

### 3.3 crash recoveryとorphan zero

Kernelは開始前にjournalへintentをdurable appendし、custody identity確立後にstartedを記録する。再起動時は未完了attemptを
列挙し、OS custodyが生存していれば終了/reap、消滅済みなら観測可能な証拠とともに`launch_failure`または
`custody_failure`へ収束する。PIDだけで所有権を推定して無関係processを終了しない。正常終了の定義は、root終了ではなく
custody container空、receipt flush、lease解放までである。

## 4. DB incremental rebuild

現行のhook/doctor/snapshotごとの全DB rebuildを廃止し、authoring sourceのfingerprint graphからdirty setを導出する。

1. source path、content digest、schema/projector version、dependency edgeをmanifest化する。
2. 前回receiptと比較し、変更sourceとtransitive dependent projectionだけをdirtyにする。
3. 一つのtransactionでdirty projectionを置換し、成功後だけmanifest revisionを進める。
4. 同じinput revisionの同時要求はsingle-flightでcoalesceし、待機側は同じreceiptを参照する。
5. schema/projector version変更、manifest欠落、integrity failure時だけfull rebuildへ昇格する。
6. full rebuildもKernel budget/custody内で実行し、旧DBはtransaction成功までreadableに保つ。

増分結果はfull rebuildと同値でなければならない。L8/L9で選択的変更corpusに対し両結果のtable digestを比較し、
差異があればincrementalを無効化してfindingを出す。高速化を理由にstale projectionをGreenとして返さない。

## 5. Snapshot CAS

snapshot準備の固定費を、入力単位のcontent-addressed artifactへ変換する。CAS keyは少なくとも
`repository tree digest + explicit working delta digest + dependency lock digest + runtime/toolchain fingerprint +
snapshot schema version + preparation policy revision`をlength-framed canonical bytesから算出する。

- hit時はimmutable snapshotをread-only materializeし、準備scriptを再実行しない。
- miss時はleaseを取得し、一つのproducerだけが一時領域へ生成・検証後にatomic publishする。
- producer失敗、deadline、cancel時は不完全objectを公開せず、leaseと一時領域をKernelが回収する。
- consumer mutationはcopy-on-write作業域に限定し、CAS objectを変更しない。
- receiptはCAS key、hit/miss、producer execution、materialized digestを結ぶ。
- GCは参照lease、保存期間、容量budgetに従い、実行中objectを削除しない。

## 6. L-pairと依存降下

| 左側設計 | 右側検証 | freeze条件 |
|---|---|---|
| L4 本architecture | L9 system test design | Windows/POSIX tree custody、deadline、budget、crash、orphan zeroをsystem surfaceで証明 |
| L5 physical/internal design | L8 integration test design | Job/process-group adapter、journal、SQLite incremental、CASの境界故障を注入可能 |
| L6 function contracts | L7 unit test design | spec validation、policy、state reduction、CAS key、dirty-set計算をpure oracleで固定 |
| L7 implementation | L6 contract trace-freeze | public method、test ID、receipt field、failure kindがexactly-onceで対応 |

降下順序は `L4/L9 pair-freeze → L5/L8 pair-freeze → L6/L7 pair-freeze → L7実装 → L8統合 → L9 system` とする。
下位実装で都合のよい制約へ設計を縮めない。OSで強制不能な要求を発見した場合は本L4またはADRへ戻し、検出器の
allowlistで覆い隠さない。

## 7. 段階導入

1. **観測段階**: 既存runnerをKernel facade経由にし、receipt/usage/process treeをshadow記録する。既存実行と結果比較。
2. **custody段階**: `db-refresh`、snapshot runner、doctorをJob Object/process group配下へ移し、deadlineとorphan zeroを強制。
3. **資源段階**: classification別memory/CPU/process/output budgetと全体admission controlをfail-close化。
4. **増分段階**: DB single-flight/incrementalを導入し、full rebuild equivalence oracle通過後に既定化。
5. **CAS段階**: snapshot CASをread-onlyから開始し、atomic publish/lease/GC検証後にread-write化。
6. **全面移行**: hook/CLI/test/CIの直接spawnを禁止するlintを有効化し、legacy runnerを削除する。

各段階はfeature flagで旧経路へ黙ってfallbackしない。rollbackは明示policy revisionとreceiptを伴い、前段の安全性を
維持する。段階4/5の性能改善は段階2/3の安全統制を迂回してはならない。

## 8. 受入条件（AC）

- **AC-RGK-01**: 不正または無制限の`ExecutionSpec`を実行前に拒否し、processを一つも生成しない。
- **AC-RGK-02**: Windowsでroot/child/grandchildをJob Objectへ収容し、正常・timeout・cancel・launcher crashの全経路でmanaged orphan 0を証明する。
- **AC-RGK-03**: POSIXで同じtreeをprocess group（利用可能時cgroup v2）へ収容し、SIGTERM猶予後の強制終了とreapでmanaged orphan 0を証明する。
- **AC-RGK-04**: wall/CPU/memory/process/output各budget超過を固有exit kindで停止し、観測値と適用policy revisionをreceiptに残す。
- **AC-RGK-05**: root PID終了だけでは完了せず、custody container空・journal flush・lease解放後だけfinishedを返す。
- **AC-RGK-06**: launcher/Kernel再起動後、未完了attemptを誤PID killせずreconcileし、二重実行または未記録の生存子を残さない。
- **AC-RGK-07**: DB増分更新が変更影響範囲だけを処理し、選択corpusの全ケースでfull rebuildのtable digestと一致する。
- **AC-RGK-08**: 同一input revisionのDB/snapshot同時要求をsingle-flight化し、一つのproducer receiptへ収束する。
- **AC-RGK-09**: snapshot CASのhitで準備固定費を再実行せず、miss/producer失敗/cancel/競合でも不完全object・lease・一時processを残さない。
- **AC-RGK-10**: hook、doctor、snapshot、ローカルCIを横断するsystem testで、資源飢餓時はadmission拒否し、PC操作を妨げるvisible shellと管理外processを0にする。

## 9. 完了条件と非完了条件

本PLANのconfirmed条件は、L9側にAC-RGK-01..10の正負oracle、platform matrix、evidence schemaをRed freezeし、
L5/L6降下PLANを起票して依存edgeを機械検証できることである。Issue #124をcloseできるのは、少なくとも段階2を
Windows/POSIXで実装し、実機または同等runnerで`orphan=0`とdeadline/budget receiptをGreen証明した後である。

単一PIDの手動停止、`windowsHide`だけの追加、timeout値の延長、重い検証のGitHub CI移送、DB rebuild頻度の単純削減、
snapshot一時directoryの掃除だけでは本負債の完了証拠にならない。
