---
plan_id: PLAN-L7-454-resource-kernel-native-companion
title: "PLAN-L7-454 (add-impl): Resource Kernel native custody companion / Node protocol client"
kind: add-impl
layer: L7
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-22
updated: 2026-07-22
owner: PO / Codex
parent_design: docs/plans/PLAN-L4-32-resource-governed-execution-kernel.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
github_issue_id: 134
agent_slots:
  - role: se
    slot_label: "SE - Rust custody companion、versioned protocol、Node client実装"
  - role: qa
    slot_label: "QA - 開始前fail-close、protocol mutation、実OS custodyのRed oracle"
generates:
  - artifact_path: docs/plans/PLAN-L7-454-resource-kernel-native-companion.md
    artifact_type: markdown_doc
  - artifact_path: native/resource-kernel/Cargo.toml
    artifact_type: source_module
  - artifact_path: native/resource-kernel/resource-kernel-companion/Cargo.toml
    artifact_type: source_module
  - artifact_path: native/resource-kernel/resource-kernel-companion/src/lib.rs
    artifact_type: source_module
  - artifact_path: native/resource-kernel/resource-kernel-companion/src/main.rs
    artifact_type: source_module
  - artifact_path: src/runtime/resource-kernel-protocol.ts
    artifact_type: source_module
  - artifact_path: tests/resource-kernel-native-scaffold.test.ts
    artifact_type: test_code
  - artifact_path: tests/resource-kernel-protocol.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L4-32-resource-governed-execution-kernel.md
  requires: []
  blocks: []
  references:
    - docs/adr/ADR-009-resource-kernel-native-custody-companion.md
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/test-design/harness/L9-system-test-design.md
review_evidence: []
---

# PLAN-L7-454: Resource Kernel native custody companion / Node protocol client

## 1. 位置づけ

`PLAN-L4-32` のResource-governed Execution Kernelを、ADR-009が固定した責務境界のままL7へ降下する
`add-impl` PLANである。TypeScript/Node control planeがdomain、policy、journal、terminal receiptを所有し、
Rust companionはprivileged OS custodyの事実だけを返す。Rust側へPLAN分類、admission policy、GitHub状態、
DB/CAS再利用判断を複製しない。

本PLANは、既に置かれたRust workspace、versioned JSON handshake、unsupported adapter、静的scaffold testを
正規に所有する。ただし、これらは**実native custodyのGreen証拠ではない**。現時点のadapterはcapabilityを一つも
advertiseせず、process生成前に拒否するためのRed/契約土台に限る。`PLAN-L4-32`の
`rgk_section_status: red`およびL9 §9のRed system oracleをGreenへ読み替えない。

## 2. 設計正本と実装境界

- 上流architectureとACの正本: `PLAN-L4-32` のAC-RGK-01..15。
- native採用・配布・rollback・Bun永久BANの正本: ADR-009。
- system受入oracle: `L9-system-test-design.md` §9の`ST-RGK-01..15`。
- L7 unit pair: `L7-unit-test-design.md`へ本PLAN固有の`U-RGK-NATIVE-*` / `U-RGK-PROTO-*`をRed freezeする。
- L5 physical / L6 function契約: `PLAN-L5-24` / `PLAN-L6-89`を起票・freezeしてから、platform APIと
  Node clientの実装契約を確定する。未起票の参照を依存edgeとして偽装しないため、現時点では
  `references`だけに置き、実在・confirmed後に`requires`へ昇格する。

### 2.1 Rust companionが所有するもの

- versioned wire DTOのstrict decode/encodeとprotocol mismatchの開始前拒否。
- Windowsのsuspended create→Job attach→resume、非継承handle、custodian/supervisor、tree empty proof。
- Linuxのcgroup v2 / clone3 attach、broker/subreaper、budget適用、`populated=0`とreap proof。
- 実probeで観測したcapability、適用limit、custody identity、native observationの構造化応答。
- unsupported platform、権限不足、capability不足でlauncherを一度も呼ばないfail-close。

### 2.2 Node protocol clientが所有するもの

予定artifact `src/runtime/resource-kernel-protocol.ts` は、署名済bundle manifestで固定されたcompanionだけを
argv配列・bounded stdin/stdout・absolute deadline付きで起動する。protocol schema、binary digest、target triple、
probe結果とrequired capabilityを照合し、不一致時はdirect spawnへfallbackせず`capability_failure`へ正規化する。
domain policyやreceipt sealは既存TypeScript側portへ返し、このclient内部で第二の状態機械を作らない。

### 2.3 明示的に所有しないもの

- Bun runtime・Bun専用API・Bun test pathの新設。新規Bun依存は永久BANであり、本PLANのrunnerはNode/Cargoのみ。
- 未検証PATH探索、runtime download、片側rollback、soft limitまたはPID pollingへのsilent fallback。
- GitHub、PLAN workflow、resource policy、journal transaction、DB/CAS canonical identityの再実装。

## 3. TDD工程表

| Step | Red oracle / 実装 | 完了判定 |
|---|---|---|
| 1 | `U-RGK-NATIVE-001..`でworkspace、protocol version、strict decode、unsupported adapterのlaunch 0を固定 | Node test runnerとCargo testの双方で対象Red/Green履歴を保存 |
| 2 | `PLAN-L5-24` / `PLAN-L6-89`を起票し、wire schema、error union、platform port、custodian lifecycleをfreeze | L4→L5→L6→L7依存edgeとL7 pairに孤児0 |
| 3 | Windows adapterを短いobject/portへ分割して実装 | suspended PIDがattach失敗時にresume 0、全開始caseでJob empty/orphan 0 |
| 4 | Linux adapterを同じprotocol portへ実装 | attach前user code 0、終了後`populated=0`とzombie 0 |
| 5 | Node protocol clientとbundle verifierを実装 | mismatch/欠落/権限不足の全mutationでprocess生成前fail-close、direct spawn 0 |
| 6 | signed bundle、SBOM、rollback、対象OS実runnerを接続 | ST-RGK-02/03/12/14およびaggregate gateが同一revisionでGreen |
| 7 | Bun migration debtをNode parity後に撤去 | ST-RGK-15のAND条件を満たし`DEBT-RGK-BUN-001`を同change setでclose |
| 8 | authorと別runtime/model familyのblind review、Reverse gap-only backfill | 未反駁attack 0、review receiptとtested commit一致 |

## 4. 受入条件

- [ ] Rust workspaceはpinned toolchainと`Cargo.lock`を持ち、format、clippy、test、dependency/license auditがGreen。
- [ ] versioned request/responseはunknown field、unknown enum、protocol drift、oversized/partial I/Oをfail-closeする。
- [ ] Windows/Linux adapterは開始前attachとcrash-surviving custodyを実OS testで証明し、managed orphan 0を
      PID pollingではなくJob/cgroup identityで証明する。
- [ ] Node clientは署名manifest、digest、target、protocol、probeを照合し、companion以外のdirect spawnを行わない。
- [ ] RustとTypeScriptの責務重複が0で、domain/policy/journal/receiptの正本がTypeScript側に一つだけある。
- [ ] `U-RGK-NATIVE-*` / `U-RGK-PROTO-*`、対象L8、L9 `ST-RGK-*`がtested commitとevidence manifestを固定する。
- [ ] Node/Cargoだけでclean install、targeted/full test、doctor、Windows/Linux aggregate CI、Pack acceptanceがGreen。
- [ ] Bun tracked runtime/test/CI/lockfile/compatibility codeと検出器例外が0で、Issue #134のexit criteriaを満たす。
- [ ] Reverse backfillと独立blind reviewを完了するまで`status: confirmed`へ昇格しない。

## 5. 現在の証拠と未完了

現存scaffoldは、versioned JSON handshake、strict request decode、必須custody capabilityの強制追加、
unsupported adapterで`process_created=false`かつlauncher call 0を表現する。`tests/resource-kernel-native-scaffold.test.ts`
はその構造を静的に検査するが、Rust toolchain不在環境のCargo実走、Node protocol client、実Job Object/cgroup、
署名bundle、SBOM、rollback、L9 system evidenceを証明しない。したがって本PLANは`draft`のままとする。

## 6. 用語と上流への戻し方

`native custody companion`、`platform bundle`、`Node control plane`、`Bun migration debt`はADR-009と
PLAN-L4-32の用語を実体化するもので、新しい上流意味を追加しない。実装中にplatform制約やprotocol語彙のgapを
発見した場合だけReverseでL5/L6/L7 test-designへ戻し、実装都合に合わせてL4/L9を縮小しない。
