---
plan_id: PLAN-L7-454-resource-kernel-native-companion
title: "PLAN-L7-454 (add-impl): Resource Kernel native custody companion / Node
  protocol client"
kind: add-impl
layer: L7
drive: fullstack
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-22
updated: 2026-07-22
owner: PO / Codex
parent_design: docs/plans/PLAN-L6-92-resource-kernel-function-contracts.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
next_pair_freeze: L7
agent_slots:
  - role: se
    slot_label: SE - Rust custody companion、versioned protocol、Node client実装
  - role: qa
    slot_label: QA - 開始前fail-close、protocol mutation、実OS custodyのRed oracle
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
  - artifact_path: rust-toolchain.toml
    artifact_type: config
  - artifact_path: native/resource-kernel/Cargo.lock
    artifact_type: config
  - artifact_path: src/runtime/resource-kernel-protocol.ts
    artifact_type: source_module
  - artifact_path: tests/resource-kernel-native-scaffold.test.ts
    artifact_type: test_code
  - artifact_path: tests/resource-kernel-protocol.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L6-92-resource-kernel-function-contracts.md
  requires: []
  blocks: []
  references:
    - docs/adr/ADR-009-resource-kernel-native-custody-companion.md
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/test-design/harness/L9-system-test-design.md
    - docs/plans/PLAN-L5-25-resource-kernel-physical-protocol.md
    - docs/plans/PLAN-L6-92-resource-kernel-function-contracts.md
    - docs/plans/PLAN-REVERSE-454-resource-kernel-native-scaffold-backfill.md
review_evidence: []
status: draft
github_issue_id: 152
admission_receipt:
  schema_version: v2
  receipt_id: certificate:f091788daf534b04775b395487ea1a6f
  command_id: pr156-formal-admission-l7-20260724
  admitted_at: 2026-07-24T12:43:00.000Z
  source_digest: sha256:886ee033e089f9b46f5ad68cd8d3efdd45b0b0204cd05844597ea272787d06d5
  decision_digest: sha256:cb777d205fa97be2ac90e945142add13eef4073802b40b98b93644bcc80f639b
  receipt_digest: sha256:e14e88266d46044ae7881b84cd337480fb187121127c6b2de38919dfbb0733ea
  binding:
    path: docs/plans/PLAN-L7-454-resource-kernel-native-companion.md
    plan_id: PLAN-L7-454-resource-kernel-native-companion
    asset_id: plan:legacy:ceb7816615f764c48e55b48871752c35a2cfd6058c2fe898ebe4495f0e88ed50
    revision: 2
    content_digest: sha256:886ee033e089f9b46f5ad68cd8d3efdd45b0b0204cd05844597ea272787d06d5
  route:
    signal: feature_addition
    mode: add-feature
  issue:
    provider: github
    issue_id: 152
    episode_id: E4-152-node-control-plane-d0n
    projection_digest: sha256:bc3454a066b640893922b0ad77dd27ad8baa0091586d82d152df0fc6e8d06f0e
  origin:
    plan_id: PLAN-L6-92-resource-kernel-function-contracts
    revision: 2
    digest: sha256:3f072ad4a6c637781bb1ec293c36f358c095ba5b98d15de772d7f250d49fd372
  transition:
    direction: design_to_implementation
    implementation_disposition: none
    implementation_target:
      target_plan_id: PLAN-L7-454-resource-kernel-native-companion
      target_revision: 2
  reentry:
    target_plan_id: PLAN-L7-454-resource-kernel-native-companion
    target_revision: 2
    phase: forward_merge
  escape_reason: Resource Kernel設計freezeからnative companion実装へ降下する
---

# PLAN-L7-454: Resource Kernel native custody companion / Node protocol client

## 1. 位置づけ

`PLAN-L4-32` のResource-governed Execution Kernelを、ADR-009が固定した責務境界のままL7へ降下する
`add-impl` PLANである。TypeScript/Node control planeがdomain、policy、journal、terminal receiptを所有し、
Rust companionはprivileged OS custodyの事実だけを返す。Rust側へPLAN分類、admission policy、GitHub状態、
DB/CAS再利用判断を複製しない。

本PLANは、既に置かれたRust workspace、versioned JSON handshake、unsupported adapter、静的scaffold testを
正規に所有する。ただし、これらは**実native custodyのGreen証拠ではない**。現時点のadapterはcapabilityを一つも
advertiseしないが、binary `main`がhandshakeだけを呼ぶ経路は空required capabilityを拒否できず、execution admissionの
安全性を証明しない。これはRed/契約土台であり、`ProbeRequest | ExecuteRequest`分離とminimum capability強制を
最初のTDD修正とする。`PLAN-L4-32`の
`status: draft`およびL9 §9のRed system oracleをGreenへ読み替えない。

先行scaffoldから判明した物理・機能設計gapは`PLAN-REVERSE-454-resource-kernel-native-scaffold-backfill`がR4で
L5/L6と対になるL7/L8へ引き戻す。本PLANはそのback-fillを受けてForwardへ再合流する。

## 2. 設計正本と実装境界

- 上流architectureとACの正本: `PLAN-L4-32` のAC-RGK-01..15。
- native採用・配布・rollbackの正本: ADR-009。global Bun cutoverはPR #154 D0-Nをprerequisite参照する。
- system受入oracle: `L9-system-test-design.md` §9の`ST-RGK-01..15`。
- L7 unit pair: `L7-unit-test-design.md`へ本PLAN固有の`U-RGK-NATIVE-*`とL6契約の`U-RGK-WIRE-*`をRed freezeする。
- L5 physical / L6 function契約: 採番衝突を避けた`PLAN-L5-25` / `PLAN-L6-92`を起票し、wire schema、
  error union、platform port、custodian lifecycleをfreezeしてからplatform APIとNode clientを実装する。

### 2.1 Rust companionが所有するもの

- versioned wire DTOのstrict decode/encodeとprotocol mismatchの開始前拒否。
- probe commandからworkload launcherへの到達不能性、execute commandのsealed admission token/minimum capability強制。
- `control_process_created`と`managed_root_created`の別identity・別phase応答。
- Windowsのsuspended create→Job attach→resume、非継承handle、custodian/supervisor、tree empty proof。
- Linuxのcgroup v2 / clone3 attach、broker/subreaper、budget適用、`populated=0`とreap proof。
- 実probeで観測したcapability、適用limit、custody identity、native observationの構造化応答。
- unsupported platform、権限不足、capability不足でlauncherを一度も呼ばないfail-close。
- custody authorityへのatomic handoff、authority deadline enforcement、epoch/nonce recovery、dual-crash時fail-close。

### 2.2 Node protocol clientが所有するもの

予定artifact `src/runtime/resource-kernel-protocol.ts` は、署名済bundle manifestで固定されたcompanionだけを
argv配列・bounded stdin/stdout・absolute deadline付きで起動する。protocol schema、binary digest、target triple、
probe結果とrequired capabilityを照合し、不一致時はdirect spawnへfallbackせず`capability_failure`へ正規化する。
静的bundle検証後のcontrol process起動と、probe journal→admission token→managed workload起動を別barrierにし、
handshake成功や空required capabilityからexecuteへ進めない。
domain policyやreceipt sealは既存TypeScript側portへ返し、このclient内部で第二の状態機械を作らない。

### 2.3 明示的に所有しないもの

- native companion/bundle/Cargo/build/test経路へのBun runtime・API・lock・依存追加。本PLANのrunnerはNode/Cargoのみ。
- 未検証PATH探索、runtime download、片側rollback、soft limitまたはPID pollingへのsilent fallback。
- GitHub、PLAN workflow、resource policy、journal transaction、DB/CAS canonical identityの再実装。

## 3. TDD工程表

| Step | Red oracle / 実装 | 完了判定 |
|---|---|---|
| 1 | `U-RGK-NATIVE-001..004`でworkspace、protocol version、strict decode、binary command分離、unsupported adapterのmanaged launch 0を固定 | Node test runnerとCargo testの双方で対象Red/Green履歴を保存 |
| 2 | `PLAN-L5-25` / `PLAN-L6-92`を起票し、wire schema、error union、platform port、custodian lifecycleをfreeze | L4→L5→L6→L7依存edgeとL5↔L8/L6↔L7 pairに孤児0 |
| 3 | Windows adapterとcustody authorityを短いobject/portへ分割して実装 | atomic handoff前resume 0、deadline owner固定、dual crash後Job empty/orphan 0 |
| 4 | Linux adapterとbroker authorityを同じprotocol portへ実装 | handoff前user code 0、epoch/nonce recovery、dual crash後`populated=0`とzombie 0 |
| 5 | Node protocol clientとbundle verifierを実装 | probe→journal→admission barrier、control/workload identity分離、mismatch/欠落/権限不足でmanaged root 0 |
| 6 | signed bundle、SBOM、rollback、対象OS実runnerを接続 | ST-RGK-02/03/12/14およびaggregate gateが同一revisionでGreen |
| 7 | D0-N prerequisiteと局所Bun不増を検証 | PR #154のcutover receiptを参照し、native差分のBun dependency増分0 |
| 8 | authorと別runtime/model familyのblind review、Reverse gap-only backfill | 未反駁attack 0、review receiptとtested commit一致 |

## 4. 受入条件

- [ ] Rust workspaceはpinned toolchainと`Cargo.lock`を持ち、format、clippy、test、dependency/license auditがGreen。
- [ ] versioned request/responseはunknown field、unknown enum、protocol drift、oversized/partial I/Oをfail-closeする。
- [ ] probe/executeはclosed commandとして分離され、binary entryを含む全経路でprobeからlauncher call 0、token無しexecuteで`managed_root_created=false`となる。
- [ ] Windows/Linux adapterは開始前attachとcrash-surviving custodyを実OS testで証明し、managed orphan 0を
      PID pollingではなくJob/cgroup identityで証明する。
- [ ] Node clientは署名manifest、digest、target、protocol、probeを照合し、companion以外のdirect spawnを行わない。
- [ ] custody authorityはatomic handoff、durable deadline、epoch/nonce recovery、authority+supervisor dual-crashのfail-close evidenceを持つ。
- [ ] RustとTypeScriptの責務重複が0で、domain/policy/journal/receiptの正本がTypeScript側に一つだけある。
- [ ] `U-RGK-NATIVE-*` / `U-RGK-WIRE-*`、対象L8、L9 `ST-RGK-*`がtested commitとevidence manifestを固定する。
- [ ] Node/Cargoだけでclean install、targeted/full test、doctor、Windows/Linux aggregate CI、Pack acceptanceがGreen。
- [ ] PR #154 D0-Nのcutover receiptを参照し、native companion/bundle差分のBun依存増分が0。
- [ ] Reverse backfillと独立blind reviewを完了するまで`status: confirmed`へ昇格しない。

## 5. 現在の証拠と未完了

現存scaffoldは、versioned JSON handshake、strict request decode、library `launch()`での必須custody capability追加、
unsupported adapterでlauncher call 0を表現する。一方binary `main`は`handshake()`だけを使用し、空required capabilityを
execution admissionとして拒否する契約をまだ持たない。`tests/resource-kernel-native-scaffold.test.ts`
はその構造を静的に検査するが、Rust toolchain不在環境のCargo実走、Node protocol client、実Job Object/cgroup、
署名bundle、SBOM、rollback、L9 system evidenceを証明しない。したがって本PLANは`draft`のままとする。

`rust-toolchain.toml`はRust `1.97.1`と`rustfmt`/`clippy`を固定し、source workflowはLinux/Windowsの
独立Cargo jobを最終`harness-check`へ束縛する。両jobはreview済み`Cargo.lock`を開始条件とするため、
toolchain不在のauthor環境でlockfileを捏造せず、正規生成・reviewされるまでは意図的にRedとなる。
このRedはnative target gateの未成立証拠であり、既存Bun compatibility jobで代替しない。
Cargo jobの`working-directory`は`native/resource-kernel`だが、rustupは現在ディレクトリから親方向へ
toolchain overrideを探索するため、repository rootの`rust-toolchain.toml`を選択する。CIは
`rustup show active-toolchain`でその選択を先に可視化する。lockfileはRust導入済み環境で
`rustup run 1.97.1 cargo generate-lockfile --manifest-path native/resource-kernel/Cargo.toml`を実行し、
依存差分をreviewして本変更と同じcommitへ含める。CI内の都度生成や未review lockfileは認めない。

`.github/workflows/harness-check.yml`と`src/lint/github-ci-policy.ts`は既存GitHub CI PLAN群が所有する
共有資産であり、本PLANの`generates`へ重複登録しない。本PLANはnative gate要求を追加し、既存所有PLANの
detectorを設計に追従させる変更としてtraceする。

## 6. 用語と上流への戻し方

`native custody companion`、`platform bundle`はADR-009、Node/Bun cutoverはPR #154 D0-Nと
PLAN-L4-32の用語を実体化するもので、新しい上流意味を追加しない。実装中にplatform制約やprotocol語彙のgapを
発見した場合だけReverseでL5/L6/L7 test-designへ戻し、実装都合に合わせてL4/L9を縮小しない。
