# ADR-009: Resource Kernel の native custody companion

- **Status**: accepted
- **Date**: 2026-07-22
- **Deciders**: PO（ユーザー）+ Codex TL
- **関連**: [ADR-001](./ADR-001-ut-tdd-harness-redesign-and-language.md) / [ADR-005](./ADR-005-distribution-model-and-central-ui.md) / `docs/plans/PLAN-L4-32-resource-governed-execution-kernel.md` / Issue #124

## 背景

Resource-governed Execution Kernel は、親launcherが異常終了してもHARNESSが開始したprocess treeを
OS custody内へ保持し、deadline・資源上限・停止・子孫0を証明する必要がある。TypeScript runtime単独の
`child_process`だけでは、Windowsの`CREATE_SUSPENDED`、Job Objectへの開始前attach、非継承handle、
launcherとは別failure domainのcustodian、Linuxの`clone3(CLONE_INTO_CGROUP)`、subreaper、cgroup v2
brokerをhard contractとして実装できない。PID polling、`windowsHide`、process group、終了時killは表示抑止や
best-effort cleanupには有効だが、crash-surviving custodyとorphan zeroの証明にはならない。

一方、ADR-001が定めるTypeScript domain/policy/journalの単一正本を別言語へ分岐させると、
ルール同一性と保守性を損なう。必要なのは全面的な言語置換ではなく、OS privilege境界だけを担う狭いnative componentである。

## 決定

### D1. Rust companionの責務をprivileged OS custodyに限定する

`ut-tdd-custodian`（仮称）をRustで実装する。許可する責務は次に限定する。

- Windows Job Object / SCM supervisor・custodian、suspended create→attach→resume、handle custody、tree terminate・empty proof。
- Linux cgroup v2 / `clone3(CLONE_INTO_CGROUP)` / subreaper broker、budget適用、`cgroup.kill`、`populated=0`とreap証明。
- OS capability probe、適用したlimitとnative観測値の構造化応答、journalへ渡すcustody eventの生成。

companionはPLAN分類、resource policy、admission判断、domain test合否、GitHub状態、DB/CAS再利用判断、
terminal receipt封印を所有しない。これらの正本は引き続きTypeScript control planeであり、SQLite journal/outboxも
TS側が所有する。native側はversioned protocolでcommandを受け、OS事実を返すport adapterであって、
独自policyや第二の状態機械を持たない。

### D2. capabilityはbundle実体から検証し、fail-closeする

TS側`CapabilityNegotiator`はOS名から能力を推測しない。companionの署名済manifest、protocol version、
binary digest、build target、OS probe結果を照合し、要求capabilityを完全に満たすbundleだけを選択する。
binary欠落、署名・digest不一致、protocol非互換はcontrol process起動前に拒否する。静的検証済みcompanionを
`probe`目的で起動した後のprobe欠測、権限不足、unsupported platformはmanaged workload root生成前に
`capability_failure`とする。`control_process_created`と`managed_root_created`を別identity/phaseで記録し、
単一`process_created`へ縮退しない。top-level commandは`Probe | Execute | RecoveryCustody`のclosed unionとする。
`Probe`はworkload launcherへ到達不能、`Execute`だけが`create_custody | spawn_attached | resume`を所有し、暗号学的に認証された
sealed admission tokenと空でないrequired capabilityを必須とする。`create_custody`が返す`AuthorityLease`は
`spawn_attached | resume`でもtokenと同時に検証し、missing/stale/別attempt leaseではside effect 0とする。`RecoveryCustody`は
`recover_authority | observe | terminate_tree | prove_empty | shutdown`だけを所有する。`recover_authority`はexecutor認証済みproof、
後4操作は完全なauthority leaseを必須とし、launcher、managed-root生成、resumeの型参照を持たない。
Node直spawn、移行中Bun直spawn、soft limitへの暗黙fallbackは禁止する。

`AdmissionTokenAuthenticatorPort`はversioned canonical preimage、issuer key ID、policy revision、operation、token nonceを
署名/MACし、companion側verifierがside effect前に真正性とbindingを検証する。具体的な鍵配布・rotationは後続revisionへ委譲するが、
自己申告JSON、unknown key/version、偽造、別operation replayを受理できる実装はD0から禁止する。
同じ原則を`AuthorityLeaseAuthenticatorPort`へ適用し、custody/executor identity、boot ID、effective monotonic deadline、
lease nonce、execution/spec identity、termination/recovery policyをcanonical payloadへ束縛する。3-fieldの自己申告leaseを
authority証拠として受理しない。token/lease/recovery proofはbundle digestもcanonical payloadへ束縛する。
authority再起動時はexecutor認証済みrecovery proofとdurable journalの一致からのみepochをCAS更新し、
deadline/policyを変えない新leaseを発行する。recovery経路にworkload生成/resume能力を与えない。

### D3. companion bundleをrelease artifactとして配布する

D0-Rの配布単位はsupport対象tripleごとの**companion bundle**であり、Node runtime、Node core、Node generation、
またはそのactivation stateを再所有しない。bundleはcompanion binary、versioned protocol descriptor、SBOM、
manifest署名、および互換性を確認したD0-N generation receiptへのdigest参照だけを結ぶ。
署名対象manifestは少なくとも`schema_version`、`bundle_sequence`、`companion_digest`、
`protocol_descriptor_digest`、`sbom_digest`、`target_triple`、`required_os_capabilities`、
`d0n_generation_receipt_digest`をfield名・型・長さ付きcanonical encodingへ固定する。一fieldでも欠落・差替えがあれば拒否し、
署名identityやD0-N receiptをpayload外の自己申告metadataで補完しない。実行時downloadと未検証PATH探索は禁止する。

release gateはcompanion binaryの再現可能build evidence、manifest署名、SBOM、脆弱性/license scan、
参照したD0-N generationとのprotocol互換性、および対象OS実機のL9 custody oracleを必須とする。
署名鍵や秘密情報はrepo/manifest/SBOMへ格納しない。

D0では具体PKI、鍵rotation/revocation方式、期限判定、secure clock、re-anchor、installer registryの物理schemaを固定しない。
versioned `TrustDecisionPort`がbundle外のinstaller/release trust policyを使ってmanifestと署名を検証し、
`accepted | rejected`、decision digest、policy versionを返すことだけを固定する。port欠測、unknown policy version、
署名不一致、D0-N receipt不一致はfail-closeする。具体方式はinstaller/releaseの後続設計で定める。

### D4. rollbackは新sequenceでの再発行に限定する

過去のcompanion componentを再利用する場合も、旧manifestまたは旧sequenceへ直接戻してはならない。
対象binary、protocol descriptor、SBOM、現在互換なD0-N generation receiptを再reviewし、現在のaccepted sequenceより
大きい新sequenceのmanifestとして再署名・再発行する。この形式だけをrollbackと呼ぶ。
新manifestは通常の署名、互換性、対象OS custody oracleを全て再通過し、理由と旧component digestをExecutionReceiptへ残す。

TS control planeは`bundle_sequence`、manifest digest、trust decision digest、D0-N generation receipt digestを結ぶ
monotonic accepted-sequence factをdurableにcompare-and-advanceする。floor未満・同sequence別payload・旧manifest replayは、
署名が正しくても拒否する。D0はこの単調性とcrash後のfail-closeだけを契約とし、SQLite table、clock anchor、
registry revisionなどの物理実装を先取りしない。安全性を満たせなければ旧direct-spawnへ戻さず利用停止する。

## ADR-001との関係

ADR-001の「harness coreはTypeScript」「domain/schema/ruleの単一正本」「bash/Python runtimeをcoreへ持ち込まない」は維持する。
本ADRはOSが提供するprivileged custody APIを呼ぶための限定例外であり、Rustをproduct domain実装言語へ昇格させない。
配布単位は単一ファイルからcompanion bundleへ更新するが、Node generationの正本と利用者の入口である
単一`ut-tdd` CLIはD0-N側に維持する。

### Node cutoverとの責任境界

global Bun ban、既存Bun migration debt、Node parity、cutover完了条件はPR #154のD0-Nをprerequisite正本とする。
D0-Rはその完了を代行せず、native companion、bundle、Cargo/build/test経路が新しいBun binary・API・lock・
runtime dependencyを追加しない局所不変条件だけを所有する。相互の未達を他方の要件免除に使わない。
L4で構想したDB incremental、snapshot CAS、performance convergenceの実装責務もD0-Rへ同梱せず、
Issue #152の後続sliceへ残す。D0-Rはnative custodyとそのcompanion bundle境界だけを閉じる。

## 検討した代替案

| 案 | 判定 | 理由 |
|---|---|---|
| TypeScript runtimeのみ | 却下 | Job/cgroupの開始前attach、crash-surviving handle/broker、子孫0をhard contractとして証明できない |
| C/C++ helper | 不採用 | OS API到達性は同等だが、メモリ安全性とcross-platform保守負担でRustに劣る |
| process group / PID tree kill | 却下 | Windows custody、PID再利用、launcher crash、lineage離脱に対してfail-openになる |
| RustでKernel全体を再実装 | 却下 | TypeScriptのdomain/policy/journal正本を二重化し、ADR-001とルール同一性を破る |

## 結果

- (+) OS custodyをnative APIで強制し、設計を現行Bun検出能力へ縮めずにIssue #124のsystem oracleへ到達できる。
- (+) unsafe/privileged surfaceを小さいcompanionへ閉じ、TS domainと独立にadversarial testできる。
- (+) 署名manifest、SBOM、D0-N generation receipt、実機evidenceをcompanion bundle identityへ固定できる。
- (-) Rust toolchain、対象triple別build、署名、SBOM、release/rollback運用が追加される。
- (-) companionは対象triple別bundleになるが、Node runtime/core/activationはD0-Nの単一正本を維持する。

## 検証対応

L4設計のpairは`docs/test-design/harness/L9-system-test-design.md` §9である。L9はWindows/Linux実機について、
bundle署名・protocol不一致・binary欠落・権限不足の開始前fail-closeと、custodian/broker crash、timeout、budget超過、
rollback後を含むcustody empty / orphan zeroを証明する。L5/L8はprotocol・service/broker・packaging故障注入、
L6/L7はmanifest/capability negotiation/state reductionのpure contractを受け持つ。
