---
layer: L5
sub_doc: internal-processing
artifact_role: topic_resource-kernel-wire-custody
status: confirmed
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_br: docs/design/harness/L1-requirements/business-requirements.md
next_pair_freeze: L8
plan: docs/plans/PLAN-L5-25-resource-kernel-physical-protocol.md
---
# Resource Kernel ワイヤ・カストディ設計と対応契約

> **V-pair**: 本書のL5物理契約・58行の写像表は[L8 integration test design](../../../test-design/harness/L8-integration-test-design.md)のfreeze表と対を成す。PLAN非依存の対応検査候補は[L7 test design](../../../test-design/harness/L7-resource-kernel-planless-mapping-test-design.md)で定義する。旧PLANは履歴・locatorの由来であり、検査入力やfallbackではない。

### D.5 L5物理契約からL8 oracleへの全数写像

以下の58行は、既存のResource Kernel契約ID・説明・oracle対応を内容不変で保持する索引である。契約集合は
`C-RGK-01..58`、oracle集合は`IT-RGK-PHYS-001..042`で、契約側・oracle側とも孤児0を要求する。
この表は番号の保持と対応の検査対象を示すものであり、それだけで各契約の設計本文が本書に全て存在すると
主張しない。

**出典 locator の解決**: 表の「出典」列 `§1`〜`§6` は旧source section locatorであり、対応する詳細本文を
本書付録D.6の同番号見出しへ移設した。付録D.1〜D.4は概観で、D.6が各locatorの詳細な規範本文である。
`resource-kernel-fixture-manifest.yaml` の42件の `contract_ref` も同locatorを保持し、D.6の詳細本文を参照する。
参照の件数は `§1` 5件、`§2` 4件、`§3` 9件、`§4` 6件、`§4.1` 6件、`§5` 2件、`§6` 10件である。
実装・検証が両検査のcanonical inputとして読むのは本書のD.5/D.6とL8、およびfixture manifestであり、
`docs/plans/`内の文書を入力またはfallbackとして読んではならない。
PLAN非依存の対応検査候補oracleは、[L7-resource-kernel-planless-mapping-test-design.md](../../../test-design/harness/L7-resource-kernel-planless-mapping-test-design.md) に置く。
これは本書D.5/D.6に対する追加のL5↔L7 test-design pairであり、既存のL5↔L8 integration pairを置換しない。

#### 対応検査の凍結受入条件

既存の対応検査が fail-close する条件を列挙する。ここで記載する条件は、既存の契約を本書へ移設するものであり、実装済み・Green済みを主張しない。

1. **契約側 exact 集合**: `C-RGK-01..58` の欠番・未知 ID・重複・出典 (§1〜§6) 逸脱を検出する。
2. **oracle 側 exact 集合**: `IT-RGK-PHYS-001..042` の欠番・未知 ID・重複を検出する。freeze 行を集合化する前の生行列を検査し、重複を吸収しない。
3. **lane 分布 (宣言 ↔ 表)**: L8 §freeze 属性節の `mock` / `real-OS` / `mock+real-OS` 件数と ID 列を表の `lane` 列と集合として突合する。片側だけの変更、宣言削除、同一 lane の宣言重複を違反とする。
4. **lane 固定件数**: `mock=27` / `real-OS=6` / `mock+real-OS=9` の各件数と実数を一致させる。宣言と表を同時に再分配しても固定件数で検出する。lane 設計を正当に変更する場合は code (`EXPECTED_LANE_COUNTS`) / 本書 / L8 の3箇所を同時更新する。
5. **実 runner lane の非空性**: `real-OS` と `mock+real-OS` の合計が宣言値と一致し、かつ0件でないことを要求する。現在の合計は15件で、§7.2 (B) の confirmed 昇格を律速する。
6. **属性の実在性**: 空セルに加え、`&nbsp;` / `&#160;` / `&#xa0;` / NBSP / zero-width / BOM / `<br>` / 空 HTML 要素 (`<span></span>`、`<span title=">"></span>` 等) を充填済みとして扱わない。
7. **rendered contract 限定の解析**: fenced code block / HTML comment / HTML block の中身を正本表・見出しの解析対象から除外し、宣言を fence/comment 等に隠した場合は欠番として fail-close する。

**17個の production `ok` 条件**は、上記7系統を次の個別判定として固定する: `oracleIdsMissing` / `oracleIdsUnknown` / `oracleIdsDuplicated`; `laneDeclarationsMissing` / `laneDeclarationsDuplicated`; `laneCountMismatch`; `laneDeclarationMismatch`; `realRunnerTotalMismatch`; `oraclesMissingFromMapping` / `oraclesMissingFromFreeze`; `rowsWithEmptyAttribute` / `rowsWithUnknownLane`; `contractsWithoutOracle`; `contractIdsUnknown` / `contractIdsMissing` / `contractIdsDuplicated`; `contractsWithInvalidSource`. doctor 配線経路 (`checkResourceKernelPairMapping`) と実 repo 回帰の双方で判定する。

これとは別に、2026-07-30、artifact 固定 commit `2c862cdc` に対する independent attack 17本の実測記録がある。対象は見えない placeholder 6形式 / fence 隠蔽 / HTML comment 隠蔽 / 重複 oracle 行 / 未知 ID `043` / 27-15-0 再分配 / 全 mock 化 / lane 宣言削除 / lane 宣言重複 / 契約行削除 / 出典範囲外 / doc 空である。これは17個の `ok` 条件とは別の実測数である。

**既知の fail-open 1件**: 属性セルを `&#34;&#8203;` のように記号1文字だけにすると充填済みとして通過する。entity decode 後に `"` が残るため非空判定され、visible に英数字・仮名・漢字が1文字も無ければ空扱いする substance 検査が未実装であることが原因である。これは issue #199 の follow-up とし、他16攻撃は fail-close 実測済みと記録されている。したがって freeze の機械強制範囲は exact 集合・lane 分布・rendered contract 限定解析であり、記号1文字セルの substance は未強制である。

| 契約 ID | 出典 | L5 物理契約 | L8 oracle |
|---|---|---|---|
| `C-RGK-01` | §1 | TS control planeの所有禁止 (Job/cgroup事実捏造、direct spawn fallback、Rustへdomain判断委譲) | `003`, `011`, `023` |
| `C-RGK-02` | §1 | `CustodyClient`責務 (shell無しargv起動、bounded framed I/O、correlation、transport deadline、probe factのjournal化、admission token送信、protocol error正規化) | `001`, `002`, `015` |
| `C-RGK-03` | §1 | `CustodyClient`所有禁止 (policy決定、receipt seal、PATH探索、Bun API、handshakeだけでworkload開始) | `014`, `016`, `023` |
| `C-RGK-04` | §1 | Rust companion責務 (strict decode/encode、OS probe、admission token照合、開始前custody作成・attach・resume、limit適用、terminate・empty/reap proof) | `002`, `016`, `027` |
| `C-RGK-05` | §1 | Rust companion所有禁止 (PLAN/GitHub/DB/CAS判断、admission policy、terminal success判定、SQLite journal、空required capabilityでのexecute受理) | `011`, `018`, `040` |
| `C-RGK-06` | §1 | Windows custodian/supervisor (non-inherit Job handleを別failure domainで保持、SCM reconcile、tree emptyをOS identityで証明、PID pollingをproofとしない、attach前resume禁止) | `005`, `006` |
| `C-RGK-07` | §1 | Linux broker/subreaper (cgroup v2 identity、`clone3(CLONE_INTO_CGROUP)`、subreaper、`cgroup.kill`、`populated=0`+reap、事後attachをhard custodyとしない) | `007`, `008` |
| `C-RGK-08` | §1 | Bun binary / Bun API / Bun test runnerを新経路へ一切導入しない | `014` |
| `C-RGK-09` | §2 | length-prefixed UTF-8 JSON frame (4byte BE length、改行区切り・EOF推測・複数JSON連結を受理しない) | `001`, `002` |
| `C-RGK-10` | §2 | request必須field集合と、unknown field/enum・duplicate key・非canonical number・末尾byteの拒否 | `002` |
| `C-RGK-11` | §2 | response排他union、`PreDispatchWireFault`→境界で`protocol_failure`へexactly once正規化、side effect 0 | `002`, `010` |
| `C-RGK-12` | §2 | `PostDispatchResponseFault`→`DispatchIndeterminate`(6要素)遷移。side effect 0やterminal`protocol_failure`へ推測しない | `003`, `010`, `041` |
| `C-RGK-13` | §2 | schema正本はTS versioned schema、canonical schema digest、digest不一致bundleは起動前拒否 | `012`, `020` |
| `C-RGK-14` | §2 | stdoutはprotocol専用、診断はbounded stderr、secret/raw env/署名鍵/payload本文をlog・receiptへ複製しない | `002` |
| `C-RGK-15` | §3 | protocol envelopeは5 variant closed union、`ProbeRequest`はworkload launcher参照を型として持たない | `011`, `038` |
| `C-RGK-16` | §3 | `AdmissionStageTokenV1`のexact field集合と、`authenticator`自身だけを除くcanonical preimage | `016` |
| `C-RGK-17` | §3 | token無し・空required capability・期限切れ・別probe・別attemptではcustody作成/spawn/resumeをすべて0、`managed_root_created=false` | `011`, `016` |
| `C-RGK-18` | §3 | handshake成功をexecute許可へ暗黙昇格しない | `015` |
| `C-RGK-19` | §3 | `custody_nonce`はOS identityでなくcreation nonce。未予約・再利用・別execution/specへの移送をside effect前に拒否 | `017` |
| `C-RGK-20` | §3 | 1 operation = 1 token (`sequence` 1/2/3)、各token nonce相異、直前phaseとcurrent leaseのjournal確認後だけ次token発行、3 token消費を同一attemptへdurable化 | `016`, `027` |
| `C-RGK-21` | §3 | `AuthorityLeaseV1`共通必須field + variant固有schema + 表から導出する固定`allowed_operations`、表外fieldは全拒否 | `038` |
| `C-RGK-22` | §3 | `BootFencedCleanupLeaseV1`は旧boot monotonic fieldを持たず、`cleanup_deadline_monotonic_ms`を現bootで非延長再導出 | `032`, `033` |
| `C-RGK-23` | §3 | `RecoveryObservationCommand`はnative observation factを返すが、authority state/epoch/lease/journal deltaは常に0 | `018`, `040` |
| `C-RGK-24` | §3 | `RecoveryCustodyCommand`の4 operationとvariant必須対応。control process終了は`ControlCommand.shutdown_companion`へ分離 | `035`, `038` |
| `C-RGK-25` | §3 | same-boot / cross-boot observationのexact field集合と禁止field (旧boot monotonic deadline、authority mode、lease、launcher/resume field) | `039` |
| `C-RGK-26` | §3 | `NativeObservationSignerPort.seal` と、`BundleTrustPort`検証済 signer/policy revisionだけをtrust inputとする`RecoveryObservationAuthenticatorPort.verify` | `019`, `039` |
| `C-RGK-27` | §3 | observationとdurable journal/current epochの全一致後にCASでepoch+1し、same-bootは`CleanupAuthorityLeaseV1`、cross-bootは`BootFencedCleanupLeaseV1`だけを返す | `018`, `031`, `032` |
| `C-RGK-28` | §3 | `release_custody`は`empty_proven`+reap proofを事前条件とし、running/terminatingでは拒否してexecutor/authorityを維持 | `037`, `042` |
| `C-RGK-29` | §3 | `shutdown_companion`の4前提条件 (active custody 0、pending response 0、未解決dispatch 0、terminal outbox flush済) とcustody state不変 | `035` |
| `C-RGK-30` | §3 | 各responseは`control_process_created`と`managed_root_created`を別fieldで返す | `011`, `015` |
| `C-RGK-31` | §3 | `spawn_attached`のplatform意味論 (WindowsはJob assign後だけresume可、Linuxは最初のuser instruction前にtarget cgroup所属) | `005`, `007`, `027` |
| `C-RGK-32` | §3 | native factはcustody identity・root identity・適用limit・monotonic observation・OS error identityを返し、`success`やdomain verdictを返さない | `009`, `027` |
| `C-RGK-33` | §3 | stage dispatch recordの状態機械と、`request_digest`をpending/indeterminate/reconciled/result全stateへ継承 | `028` |
| `C-RGK-34` | §3 | idempotency identityの定義と、新request ID・別payload・record不在の再送をlogical replayとして拒否 (token再消費なし) | `004`, `028` |
| `C-RGK-35` | §4 | custody lifecycle 7 stateと各不変条件 (root exit単独をterminalにしない、attach失敗/deadline/cancel時resume 0 ほか) | `009`, `017`, `037` |
| `C-RGK-36` | §4 | authority modeを`live → cleanup_only → revoked`で管理し`live`へ戻る辺を持たない。CAS敗者はlease 0 | `029`, `036` |
| `C-RGK-37` | §4 | probe/execution間のdurability barrier (control process起動事実・probe digest・capability集合のjournal append → token seal → `prepared`) | `015` |
| `C-RGK-38` | §4 | client切断/launcher crash後もcustodian/brokerがdeadlineとtermination policyを保持し、reconnectはbundle identity・attempt・custody nonceを照合 | `006`, `008` |
| `C-RGK-39` | §4 | release順序 (journal `custody_empty` → `release_custody` → platform release fact → executor disarm → authority revoke+released atomic → finished → sealed receipt) を再開可能なterminal transactionで閉じる | `034` |
| `C-RGK-40` | §4 | `release_id`とRust `CustodyReleasePort.ensureAbsent`の冪等absence (因果を主張しない、effect遷移は最大1、Rust側durable DB/marker追加禁止) | `042` |
| `C-RGK-41` | §4 | custody identityは非再利用`custody_generation`を含み、別generationでの再利用は削除せず`custody_identity_reused`でquarantine | `042` |
| `C-RGK-42` | §4.1 | `CustodyAuthority` / `RecoverySupervisor` / `DurableDeadlineExecutor`のidentity分離と、executorを他2processと同一failure domainへ置かない | `029`, `030`, `034` |
| `C-RGK-43` | §4.1 | companionはleaseを照合してからatomic attachし、`handoff_committed`をauthorityとjournalが同じnonceで観測するまでresume/execしない | `017`, `027` |
| `C-RGK-44` | §4.1 | token verifierの`wall_now`/`monotonic_now`同一観測点sealing、skew超過・wall rollback/forward不整合の開始前拒否、開始後の再計算禁止 | `029` |
| `C-RGK-45` | §4.1 | `recovery_grace_ms`制約と、recovery deadlineがcleanup権限の失効時刻でないこと (超過時はoverdue fact + 新規admission遮断、terminate/prove/releaseは拒否しない) | `030` |
| `C-RGK-46` | §4.1 | same-boot / cross-bootのobservation分離と、旧epoch・旧bootの通常command拒否 | `031`, `032`, `040` |
| `C-RGK-47` | §4.1 | executor/system manager/kernelの同時喪失ではworkload再開を禁止し、proof不能時はquarantineを維持 (process dual-crash Greenと混同しない) | `033` |
| `C-RGK-48` | §5 | Rust内部の9 port分割と、custody release / authority revoke / control shutdownを同一operationへ畳み込まない | `024`, `034`, `035` |
| `C-RGK-49` | §5 | capability差を共通最小集合へ丸めず、unsupported/権限不足はcapability 0を事実として返しlauncher call 0で閉じる | `011` |
| `C-RGK-50` | §5 | failure domainの個別注入可能性 (companion/Node/SCM/broker crash、pipe切断、journal commit失敗)、native componentのjournal直書き禁止、確定不能時は`orphan_detected`/`custody_failure`へ収束 | `010`, `040` |
| `C-RGK-51` | §6 | bundle構成 (target別companion binary、versioned protocol descriptor、SBOM、canonical manifest署名、D0-N generation receipt digest) を同一revisionへ結ぶ | `012`, `025` |
| `C-RGK-52` | §6 | 実行時download、PATH探索、未検証companionへの差替えを禁止 | `012`, `023` |
| `C-RGK-53` | §6 | `TrustDecisionPort`の`accepted \| rejected` + decision digest + policy version、port欠測・unknown version・各digest不一致はcontrol process起動前fail-close | `019`, `020`, `023` |
| `C-RGK-54` | §6 | `bundle_sequence + manifest_digest + trust_decision_digest + d0n_generation_receipt_digest`のmonotonic accepted-sequence compare-and-advance (floor未満・同sequence別payload・partial/corrupt拒否) | `021`, `022` |
| `C-RGK-55` | §6 | rollbackはfloor超の新sequenceへ再review・再署名し互換性とL8/L9 oracleを再検証する形式だけを許し、旧manifest/旧sequenceへの直接復帰を拒否。受理不能時はdirect-spawnへfallbackせず利用停止 | `013`, `022`, `025` |
| `C-RGK-56` | §6 | D0が固定しない範囲 (鍵rotation/revocation epoch、secure clock、re-anchor、installer registry、SQLite schema) を後続へ委譲しつつ、D0 adapterへ持ち込ませない | `026` |
| `C-RGK-57` | §6 | activationのpartial publish 0 (旧verified bundle又は利用停止だけを観測) | `024` |
| `C-RGK-58` | §6 | DB incremental / snapshot CAS / performance convergenceは本L5責務外 (Issue #152へdefer) であり、D0-Rはcustody protocolとcompanion bundle境界だけをfreezeする | `026` |

### D.6 D5 source locatorの詳細契約本文 (旧 source §1〜§6)

D.5の「出典」列と `resource-kernel-fixture-manifest.yaml` の42件の `contract_ref` は、下記の旧 source locator `§1`〜`§6` を示す。locator値と契約本文は内容不変で保持し、対応する詳細本文を本節内に移設する。D.1〜D.4は概観であり、本節の詳細本文を置き換えない。gate/testが読む契約正本は本書とL8であり、旧PLANは入力にもfallbackにも使わない。

#### source §1 — 責務配置と非重複境界

| 構成要素 | 所有する物理責務 | 所有禁止 |
|---|---|---|
| TypeScript/Node control plane | spec/policy/capability要求の正本、journal/outbox transaction、terminal receipt seal、bundle検証、deadline/admission | Job/cgroupの事実捏造、direct spawn fallback、Rustへdomain判断を委譲 |
| Node `CustodyClient` | 検証済binaryをshell無しargvで起動、bounded framed I/O、request/response correlation、transport deadline、probe factのjournal化、admission token送信、protocol error正規化 | resource policy決定、receipt seal、PATH探索、Bun API、handshakeだけでworkload開始 |
| Rust companion | strict wire decode/encode、OS probe、admission token照合、開始前custody作成・attach・resume、limit適用、terminate・empty/reap proof | PLAN/GitHub/DB/CAS判断、admission policy、terminal success判定、SQLite journal、空required capabilityでexecute受理 |
| Windows custodian/supervisor | non-inherit Job handleをlauncherと別failure domainで保持し、SCM再concile、tree emptyをOS identityで証明 | PID pollingをcustody proofとすること、attach前resume |
| Linux broker/subreaper | cgroup v2 identity、`clone3(CLONE_INTO_CGROUP)`、subreaper、`cgroup.kill`、`populated=0`+reap | 事後attachをhard custodyとして受理、process groupだけで成功 |

RustはOS factを返すport adapterであり、Nodeと重複するdomain state machineを持たない。Bun binary、Bun API、Bun test runnerを新しい経路へ一切導入しない。

#### source §2 — wire framingとschema配置

- transportはstdin/stdout上の**length-prefixed UTF-8 JSON frame**とする。先頭4 byte unsigned big-endian length、最大frame sizeはbundle manifestのprotocol policyで固定する。改行区切り、EOF推測、複数JSON連結は受理しない。
- requestは`protocol_version`、`request_id`、`command`、`payload`、`deadline_unix_ms`、`expected_bundle_digest`を必須とし、unknown field/enum、duplicate key、非canonical number、末尾byteを拒否する。
- responseは同じ`request_id`、`protocol_version`と、`ok:{fact}`または`error:{NativeError}`の排他的unionを持つ。request decode完了前のEOF、oversize、partial frame、UTF-8/JSON/schema不正はworkload domainの`NativeError`へ丸めず、`PreDispatchWireFault`として返し、Kernel境界でclosed `protocol_failure`へexactly once正規化する。この経路はrequest未生成でlauncher/custody side effect 0である。mutating request送信後のresponse decodeは別contextとし、EOF/pipe切断だけでなくoversize/partial/invalid UTF-8/JSON/schema/trailing byte/request ID・version・bundle mismatchを`PostDispatchResponseFault`へ閉じて`DispatchIndeterminate(execution_id, execution_spec_digest, attempt_id, custody_nonce, operation, request_digest)`へ遷移させ、side effect 0やterminal `protocol_failure`へ推測しない。同じidempotency identityでauthority/journal/native factをreconcileし、actual root/custody discriminatorを確定するまでterminal receiptを封印しない。
- schema sourceはTypeScript側のversioned protocol schemaを正本とし、release時にcanonical schema digestを生成する。Rust DTOは生成物または適合実装であり、独立に語彙追加しない。digest不一致bundleは起動前拒否する。
- stdoutはprotocol専用、診断はbounded stderrへ分離する。secret、raw env、署名鍵、payload本文をlog/receiptへ複製しない。

#### source §3 — commandとfactの物理系列

protocol envelopeは`ProbeRequest | ExecuteRequest | RecoveryObservationCommand | RecoveryCustodyCommand | ControlCommand`の5 variant closed unionとする。`ProbeRequest`はbundle/protocol identityだけを入力にOS factを返し、workload launcherへの参照を型として持たない。`ExecuteRequest.operation`だけが`create_custody | spawn_attached | resume`を所有し、control planeが封印した`AdmissionStageTokenV1(execution_id, execution_spec_digest, attempt_id, admission_chain_id, custody_nonce, bundle_digest, probe_digest, required_capabilities, operation, operation_sequence, predecessor_fact_digest, custody_binding, termination_policy_digest, issued_unix_ms, budget_ms, deadline_unix_ms, token_nonce, issuer_key_id, policy_revision, authenticator)`を必須fieldとしてwire DTOでは`authenticator`を必須とするが、authenticated preimageは`authenticator`自身だけを除く全fieldをschema順でcanonical化したbytesとする。これにより自己包含を避けつつcommandのattempt/custody/bundle/probe/operation bindingを照合する。

`AdmissionTokenAuthenticatorPort.seal/verify`以外の自己申告tokenを認証済みに昇格せず、unknown key/version、authenticator不一致、同nonce別payload、別operation replayを拒否する。token無し、空required capability、期限切れ、別probe、別attemptではcustody作成、spawn、resumeをすべて0にし、`managed_root_created=false`のまま拒否する。handshake成功をexecute許可へ暗黙昇格しない。

`custody_nonce`はOS custody identityではなく、`issueCreateCustodyToken`前にcontrol planeが一意に予約するcreation nonceである。`create_custody`はこのnonceを入力に一度だけcustody identityを生成し、返却leaseへ同じnonceとidentityを束縛する。nonce未予約、再利用、別execution/specへの予約移送をside effect前に拒否する。

tokenは一枚を3操作へ流用せず、同じ予約済み`custody_nonce`に対して`create_custody(sequence=1, custody_binding=reserved)`、`spawn_attached(sequence=2, custody_binding=custody_identity+executor_id+authority_epoch+lease_nonce)`、`resume(sequence=3, custody_binding=同じlease)`を一枚ずつ封印する。各token nonceは異なり、直前phaseとcurrent leaseをjournalで確認した後だけ次tokenを発行する。operation順序のskip/reorder、消費済みtoken replay、同operation別payloadをside effect前に拒否し、3 tokenの消費を同一attemptへdurable化する。

`create_custody`はarm済みdeadline executorへ束縛したclosed union `AuthorityLeaseV1 = ExecutionAuthorityLeaseV1 | CleanupAuthorityLeaseV1 | BootFencedCleanupLeaseV1`のうち、全variantの共通必須fieldは`authority_epoch, execution_id, execution_spec_digest, attempt_id, custody_nonce, bundle_digest, custody_identity, executor_id, deadline_unix_ms, termination_policy_digest, recovery_grace_ms, recovery_deadline_unix_ms, lease_nonce, issuer_key_id, authenticator`だけとする。variant固有schemaは次で閉じる。

| 形式種別 | 識別値と追加必須field | 許可operation | 明示禁止field |
|---|---|---|---|
| `ExecutionAuthorityLeaseV1` | `schema_version=execution-authority/v1`, `authority_mode=live`, `boot_id`, `effective_deadline_monotonic_ms`, `recovery_deadline_monotonic_ms` | `spawn_attached, resume` | 前任のleaseへの参照／遷移情報、以前／現在のboot情報、platformのboot事実、cleanup期限 |
| `CleanupAuthorityLeaseV1` | `schema_version=cleanup-authority/v1`, `authority_mode=cleanup_only`, `boot_id`, `effective_deadline_monotonic_ms`, `recovery_deadline_monotonic_ms`, `predecessor_lease_digest`, `cleanup_transition_fact_digest` | `observe, terminate_tree, prove_empty, release_custody` | 以前／現在のboot情報、platformのboot事実、cleanup期限、作成／生成／再開（create/spawn/resume） |
| `BootFencedCleanupLeaseV1` | `schema_version=boot-fenced-cleanup/v1`, `authority_mode=boot_fenced`, `previous_boot_id`, `current_boot_id`, `platform_boot_fact_digest`, `cleanup_deadline_monotonic_ms` | `observe, prove_empty, release_custody` | `boot_id`,旧bootのeffective/recovery monotonic deadline、predecessor/transition、terminate_tree、old PID、create/spawn/resume |

`BootFencedCleanupLeaseV1`は元のwall `deadline_unix_ms/recovery_deadline_unix_ms`を共通fieldとして保持するが、旧bootのmonotonic fieldは持たない。`cleanup_deadline_monotonic_ms`は`current_boot_id` domainで非延長再導出する。各variantの`allowed_operations`は上表から導出する固定literal配列としてcanonical preimageへ含める。表にないfieldはすべてunknownとして拒否し、missing/stale epoch、別attempt/nonce/executor binding、operation×variant不一致をside effect前に拒否する。`AuthorityLeaseAuthenticatorPort.issue/verify`はwire DTOの`authenticator`自身だけを除く上表のexact field集合と固定`allowed_operations`をcanonical authentication payloadとして認証し、unknown version/key、authenticator不一致、同lease nonce別payloadをside effect前に拒否する。

`RecoveryObservationCommand.operation`は`observe_recovery_fact | prove_boot_fence`だけを所有し、Rust/executorが認証したsame-boot又はcross-bootのnative observation factを返すが、authority state/epoch/lease/journal deltaは常に0とする。`RecoveryCustodyCommand.operation`は`observe | terminate_tree | prove_empty | release_custody`だけを所有し、control process自体の終了は別unionの`ControlCommand.shutdown_companion`へ分離する。`observe | prove_empty | release_custody`は両cleanup variant、`terminate_tree`は`CleanupAuthorityLeaseV1`だけを必須とする。

TypeScript内部の`recoverAuthority`だけが`AuthorityRecoveryObservationV1 = SameBootExecutorRecoveryObservationV1 | CrossBootFenceObservationV1`を入力とする。same-boot variantは`SameBootExecutorRecoveryObservationV1(schema_version="same-boot-executor-recovery-observation/v1", executor_id, execution_id, execution_spec_digest, attempt_id, custody_nonce, bundle_digest, custody_identity, previous_authority_epoch, boot_id, effective_deadline_monotonic_ms, termination_policy_digest, recovery_grace_ms, recovery_deadline_monotonic_ms, last_transition_digest, recovery_nonce, issuer_key_id, authenticator)`を必須とする。cross-boot variantは`CrossBootFenceObservationV1(schema_version="cross-boot-fence-observation/v1", executor_id, execution_id, execution_spec_digest, attempt_id, custody_nonce, bundle_digest, custody_identity, previous_authority_epoch, previous_boot_id, current_boot_id, platform_boot_fact_digest, deadline_unix_ms, recovery_deadline_unix_ms, observed_wall_unix_ms, observed_monotonic_ms, termination_policy_digest, recovery_grace_ms, last_transition_digest, recovery_nonce, issuer_key_id, authenticator)`だけを必須fieldとし、旧boot monotonic deadline、authority mode、lease、launcher/resume fieldとunknown fieldを禁止する。

Rust `NativeObservationSignerPort.seal`はpinned companion bundleのnative signer identityでfactを封印し、TypeScript `RecoveryObservationAuthenticatorPort.verify`は`BundleTrustPort`が検証済みのbundle signer/policy revisionだけをtrust inputに用いる。unknown signer/version、別bundle key、canonical field変異をCAS前に拒否する。observationとdurable journal/current epochの全一致後、TypeScript `CustodyAuthorityPort`がCASでepochを一つ進め、same-bootは`CleanupAuthorityLeaseV1`、cross-bootは`BootFencedCleanupLeaseV1`だけを返す。launcher、managed-root生成、attach、resumeのfield/variantをschemaとして持たず、admission token期限後も既存custodyの安全なterminate/reapを妨げない。stale epoch、別execution/attempt/nonceはstate delta 0で拒否する。`release_custody`は`empty_proven`とreap proofを事前条件とし、running/terminatingで拒否してdeadline executorとauthorityを維持する。`shutdown_companion`はactive custody 0、pending response 0、未解決`consumed_pending_dispatch | dispatch_indeterminate | dispatch_reconciled_without_result` 0、terminal outbox flush済みの場合だけ許可し、custody stateを変更しない。token/lease/recovery observationはいずれもwire DTOのauthenticator自身をauthenticated preimageから除外し、それ以外のexact field全体を認証する。

各responseは`control_process_created`と`managed_root_created`を別fieldで返す。`spawn_attached`はWindowsではsuspended rootをJobへassignした後だけresume可能、Linuxでは最初のuser instructionより前にtarget cgroup所属を保証する。commandごとのnative factはcustody identity、root identity、適用limit、monotonic observation、OS error identityを返すが、`success`やdomain verdictを返さない。

stage dispatch recordは`issued → consumed_pending_dispatch → result_committed`又は`consumed_pending_dispatch → dispatch_indeterminate → dispatch_reconciled → result_committed`で閉じる。token消費と`consumed_pending_dispatch(request_id, token_digest, idempotency_identity, request_digest)`のappendを同じtransactionで行う。`request_digest`はauthenticatorを含むcanonical full request bytesのdigestで、pending/indeterminate/reconciled/result全stateへ継承する。同じ`request_id + admission_stage_token_digest + idempotency identity + request_digest`のtransport retryは新しいtoken消費ではなく、`result_committed`なら同一result factを返し、`consumed_pending_dispatch | dispatch_indeterminate`ならauthority/native factをreconcileする。side effect 0を独立証明できた場合だけ同じlogical commandを同じidempotency identityで継続し、不明ならactual phase確定まで再dispatchしない。`dispatch_reconciled`がdurableでresult未commitなら、4 digestと`actual_phase/fact_digest`のexact一致を確認し、native side effectを再実行せず`result_committed`をappendして同一resultを返す。managed root生成を伴うcommandは`execution_id + execution_spec_digest + attempt_id + custody_nonce + operation + operation_sequence`をidempotency identityとする。同じtokenでも新request ID、別payload、別identity、又は一致するpending/result recordがない再送はlogical replayとして拒否する。dispatch後response lossは`dispatch_indeterminate`からactual phaseをcommitして同一retryへ応答する。tokenを再消費しない。

#### source §4 — custodian lifecycleとdurability barrier

| custody状態 | 許可event | 不変条件 |
|---|---|---|
| `absent` | probe / create | process 0、custody identity未発行 |
| `prepared` | spawn-attached / abort→terminating | custody containerは存在、user code未開始。root未生成failure/deadline/cancelでもcleanup可能 |
| `attached_suspended` | resume / abort→terminating | rootはcustody所属、Windowsはsuspended、attach失敗・deadline・cancel時resume 0 |
| `running` | observe / terminate / normal-root-exit→terminating | root/descendantは同一custody identityで追跡し、root exit単独をterminalにしない |
| `terminating` | terminate→reap | 新規childをcontainし続け、root exitをterminalとしない |
| `empty_proven` | empty + reap proof | Job emptyまたは`populated=0`、zombie/managed orphan 0 |
| `released` | release-custody transaction | empty/reap proof後、platform release→release fact commit→deadline executor disarm→authority revoke+released atomic commitを完了し、再利用PIDだけで所有判定しない |

custody lifecycleとは別にauthority modeを`live → cleanup_only → revoked`で管理する。deadline/cancel/abortに加え、正常root exit又は明示terminate intentも`live → cleanup_only`をCASし、同じtransactionで新しいlease nonce/authenticatorを持つ`CleanupAuthorityLeaseV1`を発行してexecution capabilityを不可逆に除去する。CAS敗者はlease 0でcurrent modeを再読込する。boot変更時は`live | cleanup_only → boot_fenced → revoked`とし、cross-boot proofから`BootFencedCleanupLeaseV1`以外を発行しない。`cleanup_only | boot_fenced`から`live`へ戻る辺は存在しない。

probeとexecutionの間にはdurability barrierを置く。verified bundleからcontrol processを起動した事実、probe digest、capability集合をjournalへappendし、そのdigestを含むadmission tokenをcontrol planeが封印した後だけ`prepared`へ遷移する。token検証前、probe欠測、control processだけ生成済みの状態では`managed_root_created=false`である。

Node client切断またはlauncher crash後もcustodian/brokerはdeadlineとtermination policyを保持し、未管理processへ降格させない。reconnectはbundle identity、attempt、custody nonceを照合し、別attemptを誤killしない。Node側journalが`custody_empty`をdurable化してから`release_custody`を呼び、platform release fact、deadline executor disarm、authority revoke+released atomic commit、finished、sealed receiptを再開可能なterminal transaction/outboxで順に閉じる。

`release_id = digest(execution_id, execution_spec_digest, attempt_id, custody_identity, authority_epoch, empty_fact_digest, reap_fact_digest)`をjournalへ先にcommitし、Rust `CustodyReleasePort.ensureAbsent(release_id)`は同じcustody identityを「存在しない」終状態へ収束させる冪等operationとする。custody identityはraw OS identityに加え、create factで固定した非再利用`custody_generation`を含む。OS release成功直後にresponse/factを失っても、再試行はcommitted empty/reap factに束縛された同一identityのnative absenceを再観測し、`CustodyAbsentFact(release_id, custody_identity, empty_fact_digest, reap_fact_digest)`を返す。factは「この呼出しが削除した」という因果を主張せず、終状態のabsenceだけを証明する。release effectの存在→不在遷移は最大1、`ensureAbsent` invocationは再試行可能であり、Rust側durable DB/markerを追加しない。同じraw OS identityが別generationで再利用されていた場合は削除せず`custody_identity_reused` factでquarantineし、古いreleaseを新custodyへ適用しない。custodyはempty/reap済みなのでrelease後もdeadline executorの再killはno-target factとなり、fact commit後にだけdisarmする。disarm前はcleanup authorityを保持するためcrash retry可能で、revoke後に未完のexecutor操作を残さない。各barrier後のcrash/retryはjournal済み段階から再開し、二重releaseや早期terminal sealを許さない。post-dispatch response lossは`dispatch_indeterminate`と`dispatch_reconciled(actual_phase, fact_digest)`をappendし、reconcile後の実phaseに対応するreceipt variantへ`protocol_failure`原因を保存する。

##### source §4.1 — Custody authorityとatomic handoff

custodyのdurable authorityは一時的なNode client/companionではない。`CustodyAuthority`（command/lease照合）、`RecoverySupervisor`（再接続/reap）、`DurableDeadlineExecutor`（期限kill）を別identityとして分離する。WindowsではSCM/Job、Linuxではbroker外system-manager scope/timer又は同等のkernel-backed executorを使い、executorを他2processと同一failure domainへ置かない。`create_custody`はauthorityが`authority_epoch + attempt_id + custody_nonce + effective_deadline_monotonic_ms + boot_id + termination_policy_digest + recovery_grace_ms + recovery_deadline_monotonic_ms`をdurable化し、OS handle/cgroup identityをprimary ownershipへ結んだ`ExecutionAuthorityLeaseV1`を返す。companionはこのleaseを照合してからsuspended root/cgroup childをatomic attachし、`handoff_committed` factをauthorityとjournalの双方が同じnonceで観測するまでresume/execしない。

token verifierは受理時の`wall_now`と`monotonic_now`を同じ観測点で取得し、`remaining_ms = min(budget_ms, max(0, deadline_unix_ms - wall_now))`、`effective_deadline_monotonic_ms = monotonic_now + remaining_ms`として一度だけsealする。`deadline_unix_ms - issued_unix_ms != budget_ms`、許容skew超過、wall rollback/forward不整合は開始前拒否する。開始後のwall clock jumpでdeadlineを再計算せず、process restartはdurable remaining factとwall deadlineの早い方を採用し、boot ID不一致・clock不確実時は期限切れとしてkillする。secure clock/key rotationの具体方式は後続でも、延長fail-openはD0で禁止する。

`recovery_grace_ms`は正整数かつpolicy revisionの`max_recovery_grace_ms`以下、`recovery_deadline_unix_ms = deadline_unix_ms + recovery_grace_ms`と`recovery_deadline_monotonic_ms = effective_deadline_monotonic_ms + recovery_grace_ms`を同じ観測点で封印する。effective deadlineはcreate/spawn/resumeの許可上限であり、既存custodyを減少方向へ収束させる`observe | terminate_tree | prove_empty | release_custody`の権限失効時刻ではない。recovery deadlineはcleanup完了SLA/escalation境界であってcleanup権限の失効時刻ではない。超過時はoverdue factと新規admission遮断を必須化するが、terminate/prove/releaseを拒否しない。deadlineの実行責任は`DurableDeadlineExecutor`にあり、Node/companion/pipe喪失後も期限内kill→recovery deadline内empty/reapを遂行する。

同一bootの再起動は`SameBootExecutorRecoveryObservationV1`、host boot変更は`CrossBootFenceObservationV1`で分離し、execution/spec、authority epoch、attempt、nonce、bundle digest、policy、last durable transitionを照合する。旧epoch/旧bootの通常commandを拒否し、CAS成功後もsame-bootはcleanup lease、cross-bootはboot-fenced cleanup leaseだけを発行する。cross-boot fence proofは旧boot workloadが現bootで実行不能であることだけを証明し、empty proofを先取りしない。発行されたboot-fenced cleanup leaseでcross-boot empty/reapを証明してからreleaseへ進む。旧monotonic値を比較せず、元のwall recovery deadlineと新bootのwall/monotonic同時観測から非延長cleanup上限を導出する。deadline/policy変更、workload生成、attach、resumeは型として不可能にする。

authority APIとrecovery supervisorが同時に失われても、別failure domainのexecutorがWindowsではJob kill、Linuxでは期限内`cgroup.kill`を発行し、再起動broker/subreaperがrecovery deadlineまでに`populated=0`、zombie 0、managed orphan 0を証明する。owner又はboundを開始前に強制不能ならmanaged rootを作らず拒否する。executor/system manager/kernel自体を同時に失うhost failureではworkload再開を禁止し、boot後はcross-boot fence→empty proof→release transactionで収束し、kill/empty/releaseを証明するまで新規admissionを遮断する。proof不能時はquarantineを維持する。これをprocess dual-crash Greenへ混同しない。独立proof欠測時の`custody_failure`と新規admission遮断は追加措置であり、既存payloadのkill/reapを代替しない。

#### source §5 — platform portとfailure isolation

Rust内部は`PlatformProbe`、`CustodyFactory`、`AttachedLauncher`、`LimitApplier`、`TreeTerminator`、`EmptyProof`、`CustodyReleasePort`、`BootFenceProofPort`、`ControlShutdownPort`の小さいportに分割する。custody release、authority revoke、control shutdownを同じoperationへ畳み込まない。Windows/Linux adapterは同じportを実装するが、capability差を共通最小集合へ丸めない。unsupported/権限不足はcapability 0を事実として返し、launcher call 0で閉じる。

companion crash、Node crash、SCM/broker crash、pipe切断、journal commit失敗を別failure domainとして注入可能にする。native componentはjournalへ直接書かず、再接続可能なcustody identityとOS factを返す。事実を確定できない場合は`orphan_detected`または`custody_failure`へ収束させ、successへ補完しない。

#### source §6 — companion bundle配置と供給網境界

D0-R bundleはtarget別companion binary、versioned protocol descriptor、SBOM、canonical manifest署名、互換性を確認したD0-N generation receipt digestだけを同一revisionへ結ぶ。Node runtime、Node core、generation artifact、activation markerは含めず、D0-N正本を参照する。実行時download、PATH探索、未検証companionへの差替えを禁止する。

`TrustDecisionPort`はbundle外のversioned installer/release policyを入力に、manifestと署名を検証して`accepted | rejected`、decision digest、policy versionを返す。port欠測、unknown version、署名不一致、companion/protocol/SBOM/target/D0-N receipt digest不一致はcontrol process起動前にfail-closeする。D0は鍵rotation/revocation epoch、secure clock、re-anchor、installer registry、SQLite schemaを固定せず、具体PKI/time/storageを後続installer/release PLANへ委譲する。

TS側は`bundle_sequence + manifest_digest + trust_decision_digest + d0n_generation_receipt_digest`を結ぶmonotonic accepted-sequence factをdurableにcompare-and-advanceする。floor未満、同sequence別payload、partial/corrupt factは拒否する。過去componentを使うrollbackは、現在floorより大きい新sequenceのmanifestへ再review・再署名し、現在のD0-N receiptとの互換性とL8/L9 oracleを再検証する形式だけを許す。旧manifest/旧sequenceへの直接復帰は拒否し、受理不能時は旧direct-spawnへfallbackせず利用停止する。

DB incremental、snapshot CAS、performance convergenceの実装は本L5 companion protocolの責務に含めず、Issue #152の後続sliceへdeferする。D0-Rはcustody protocolとcompanion bundle境界だけをfreezeする。
