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
単一`process_created`へ縮退しない。`probe` commandはworkload launcherへ到達不能、`execute` commandはsealed
admission tokenと空でないrequired capabilityを必須とする。Node直spawn、移行中Bun直spawn、soft limitへの暗黙fallbackは禁止する。

### D3. platform bundleをrelease artifactとして配布する

engine releaseはTypeScript/Node control planeと、support対象tripleごとのnative companionを一つのversioned platform bundleとして扱う。
署名対象`BundleManifestSignedPayload`は`schema_version`、`bundle_digest`、`bundle_sequence`、
`prior_bundle_sequence`、`authority_id`、`key_id`、`algorithm`、`registry_revision`、`issued_at`、`expires_at`、
core revision、protocol schema digest、companion digest、target triple、required OS capability、SBOM digestを必須fieldとする。
field名、順序、型、length framingを固定したcanonical encoding全体のdigestへ署名し、sequence、authority、key、
algorithm、registry revision、issued/expiryを含む一fieldの差替えでも署名不一致として拒否する。署名identityを
payload外の自己申告metadataで補完しない。Pack/tag-pinはmanifestで完全なbundle revisionへpinし、実行時downloadや
未検証PATH探索を行わない。

release gateは各binaryの再現可能build evidence、署名、SBOM、脆弱性/license scan、対象OS実機のL9 custody oracleを
必須とする。署名鍵や秘密情報はrepo/manifest/SBOMへ格納しない。

trust rootはbundle同梱物やambient filesystemから取得せず、installer組込の製品authority registryを
`TrustStorePort`から読む。registryはauthority ID、key ID、public-key digest、許可algorithm、
`not_before`/`not_after`、revocation epoch、最小bundle sequenceを結ぶ。unknown/失効/期限外key、
authority-key binding不一致、algorithm downgradeをfail-closeする。

期限判定はambient `Date.now()`を直接使わず、`TrustedClockPort`が返すplatform secure timeまたはinstaller-configured
authority registryに束縛されたsigned time evidenceだけを受理する。evidenceは`authority_id`、`evidence_digest`、
`issued_at`、`expires_at`、boot identity、monotonic counterを含む。`ClockAnchor`はlast accepted evidence/time/counterを
TS-owned durable stateへ保存し、missing、corrupt、wall-clock/boot-counter rollbackをfail-closeする。復旧はregistryが
許可したauthorityによる明示signed re-anchorだけで行い、ambient clockへのfallbackやanchorの暗黙初期化を禁止する。

### D4. rollbackもfail-close capabilityとして扱う

rollbackは旧coreだけ、または旧companionだけへの片側差し替えを禁止する。既知良好なbundle tagへmanifest単位で戻し、
protocol互換、署名、SBOM、対象platformのGreen evidenceを再検証する。安全性を満たさないplatformは旧direct-spawnへ
戻さず利用停止する。rollback revisionと理由はpolicy revisionおよびExecutionReceiptへ残す。
monotonic floorより小さいbundle sequenceへのrollbackは署名が正しくても拒否する。activationとfloorを別storeへ
擬似atomicに書かない。TS-owned SQLiteの単一append-only `BundleActivationLog`へ、bundle digest、sequence、
prior sequence、authorization digest、registry revision、clock evidence digestを一つのtransaction recordとしてcommitする。
current bundleとfloorは最後のcommitted recordだけから投影し、crash recoveryは未commit intentを無視する。
`authorization_digest`はmanifest digest、trust decision、registry revision、clock evidence digestをcanonicalに束縛する。
key rotationは
旧新keyの重複有効期間とauthority署名済みrotation statementを必須とし、revocation後の旧key復活、clock rollback、
receipt replayによるsequence floor低下を認めない。

## ADR-001との関係

ADR-001の「harness coreはTypeScript」「domain/schema/ruleの単一正本」「bash/Python runtimeをcoreへ持ち込まない」は維持する。
本ADRはOSが提供するprivileged custody APIを呼ぶための限定例外であり、Rustをproduct domain実装言語へ昇格させない。
配布単位は単一ファイルからplatform bundleへ更新するが、利用者の入口は引き続き一つの`ut-tdd` CLIである。

### Node cutoverとの責任境界

global Bun ban、既存Bun migration debt、Node parity、cutover完了条件はPR #154のD0-Nをprerequisite正本とする。
D0-Rはその完了を代行せず、native companion、bundle、Cargo/build/test経路が新しいBun binary・API・lock・
runtime dependencyを追加しない局所不変条件だけを所有する。相互の未達を他方の要件免除に使わない。

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
- (+) 署名manifest、SBOM、実機evidenceをbundle identityへ固定できる。
- (-) Rust toolchain、対象triple別build、署名、SBOM、release/rollback運用が追加される。
- (-) 「単一バイナリ1ファイル」配布は「単一CLI入口の署名済platform bundle」へ更新される。

## 検証対応

L4設計のpairは`docs/test-design/harness/L9-system-test-design.md` §9である。L9はWindows/Linux実機について、
bundle署名・protocol不一致・binary欠落・権限不足の開始前fail-closeと、custodian/broker crash、timeout、budget超過、
rollback後を含むcustody empty / orphan zeroを証明する。L5/L8はprotocol・service/broker・packaging故障注入、
L6/L7はmanifest/capability negotiation/state reductionのpure contractを受け持つ。
