---
plan_id: PLAN-REVERSE-454-resource-kernel-native-scaffold-backfill
title: "PLAN-REVERSE-454: Resource Kernel native scaffold起点の設計・検証back-fill"
kind: reverse
layer: cross
confirmed_reverse_type: design
drive: fullstack
route_signal: design_gap
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-with-hardening
created: 2026-07-22
updated: 2026-07-22
owner: Codex TL / PO
parent_design: docs/plans/PLAN-L7-454-resource-kernel-native-companion.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: TL - scaffold事実と上流契約の差分判定、Forward再合流gate
  - role: qa
    slot_label: QA - L7/L8/L9のRed oracleと実OS証拠の分離
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-454-resource-kernel-native-scaffold-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-454-resource-kernel-native-companion.md
  requires: []
  blocks: []
  references:
    - docs/adr/ADR-009-resource-kernel-native-custody-companion.md
    - docs/plans/PLAN-L5-25-resource-kernel-physical-protocol.md
    - docs/plans/PLAN-L6-92-resource-kernel-function-contracts.md
    - native/resource-kernel/resource-kernel-companion/src/lib.rs
    - tests/resource-kernel-native-scaffold.test.ts
    - docs/test-design/harness/L9-system-test-design.md
review_evidence: []
workflow_phase: R0
status: draft
github_issue_id: 152
admission_receipt:
  schema_version: v2
  receipt_id: certificate:5a9c363f35df7476c561a1f1a5893ecf
  command_id: pr156-redesign-convergence-reverse-rev3-20260724
  admitted_at: 2026-07-24T13:24:00.000Z
  source_digest: sha256:6c0afe546db55bf985500bae9c4209f2fb36c2a9d03d5a6949a79c12d6397eeb
  decision_digest: sha256:cc42c3857c4940477d067e7be1ce9cf21b4adcd7b6aedfdf32d54e7d166086c8
  receipt_digest: sha256:7a01e0d4fb9745ac7681a704a188ca236c22ddab739cf1105b5e9d6386951a77
  binding:
    path: docs/plans/PLAN-REVERSE-454-resource-kernel-native-scaffold-backfill.md
    plan_id: PLAN-REVERSE-454-resource-kernel-native-scaffold-backfill
    asset_id: plan:legacy:d66396b73c7db2b8d007824dcb6cada0ec811ff802f42189d5687d3d9b6853af
    revision: 3
    content_digest: sha256:6c0afe546db55bf985500bae9c4209f2fb36c2a9d03d5a6949a79c12d6397eeb
  route:
    signal: design_gap
    mode: reverse
  issue:
    provider: github
    issue_id: 152
    episode_id: E4-152-resource-kernel-d0r
    projection_digest: sha256:fbf4a02220f7f6f05a34e18480f77bbff707c740f931b961a7e4d51578f0b708
  origin:
    plan_id: PLAN-L7-454-resource-kernel-native-companion
    revision: 3
    digest: sha256:9cd2f45bce025a7200d86dca11d1d02dccd08cdc8796d4465c7adf713ef15db6
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L7-454-resource-kernel-native-companion
    target_revision: 3
    phase: forward_merge
  escape_reason: Resource Kernel scaffoldのR0事実を設計へ戻しForward rev3へ再合流する
---

# PLAN-REVERSE-454: Resource Kernel native scaffold起点の設計・検証back-fill

## 0. Reverse判定

起点は`PLAN-L7-454`で先に作られたRust scaffoldである。scaffoldはversioned JSON handshake、
`deny_unknown_fields`、closed capability enum、`OsAdapter` / `ProcessLauncher` port、unsupported adapterの
launch call 0を実装している。一方、実Job Object/cgroup、framed transport、Node client、closed terminal error、
custodian lifecycle、bundle検証を実装していない。

既存scaffoldを捨てず、そこで観測した最小portとfail-close factを上流設計・右腕検証へgap-onlyで戻すため、
本経路は**Reverse**である。PoCを破棄して設計から作り直すRedesignではない。scaffoldを完成実装と誤認せず、
上流契約が要求する未実装部分を縮小・削除しない。

## 1. R0 — 実装事実の固定

| R0 candidate fact（evidence取得待ち） | 再利用候補 | Greenと主張しないもの |
|---|---|---|
| `PROTOCOL_VERSION = 1`とserde JSON DTO | reuse | length framing、bounded I/O、schema digest |
| request/responseのunknown field拒否 | reuse | duplicate key、oversize、partial/trailing byte全拒否 |
| closed `Capability` enumとrequired集合差分 | reuse | OS probe、bundle capability証明 |
| launch時のhard custody capability強制追加 | reuse after L6 trace | 実際のattach-before-user-code |
| `UnsupportedAdapter` + launcher call 0 | reuse-with-hardening | binary command分離、control/workload process identity、Windows/Linux custody実装 |
| `OsAdapter` / `ProcessLauncher`分離 | reuse then refine | lifecycle、terminate、empty/reap port |

表は現時点の調査仮説であり、R0証拠ではない。source revisionとCargo/Node test receiptへ固定し、
独立確認が完了した行だけをobserved factへ昇格する。静的substring testだけ、Cargo未実走、
unsupported adapterだけではnative custody Greenにならない。

## 2. R1 — 構造抽出

scaffoldから抽出する構造は`request → protocol/capability preflight → adapter selection → launcher call`である。
副作用barrierはlauncher call直前で、failure時call count 0を要求する。Rustが返すのはcapability/native factであり、
domain verdict、policy、journal、terminal receiptを返さない。この抽出結果をNode/Rust責務非重複の境界として扱う。

## 3. R2 — 上流契約との差分

| layer | gap-only back-fill / 維持条件 |
|---|---|
| L4 `PLAN-L4-32` | control/workload process identity分離、managed workload生成前capability拒否、OS custody、signed bundle trustを維持。global Bun cutoverはD0-Nを参照 |
| L5 `PLAN-L5-25` | strict frame、Node/Rust配置、probe→admission barrier、custody authority/atomic handoff、crash/reconnect、bundle rollbackを追加 |
| L6 `PLAN-L6-92` | command分離、control/workload process identity、closed error union、lifecycle reducer、platform port、responsibility-overlap findingを追加 |
| L7 test design | scaffoldの`U-RGK-NATIVE-*`と、wire/error/cap/lifecycle/port/bundleのpure Red oracleを分離 |
| L8 test design | mock boundaryと実Windows/Linux custody laneを分離し、`IT-RGK-PHYS-001..026`のfault-injection oracleを固定 |
| L9 test design | active `ST-RGK-01..06/11/12/14/15`をD0-R acceptanceとし、deferred `07..10/13`をIssue #152 later wave以外で偽Greenにしない |

## 4. R3 — back-fill適用（未開始）

現在のworkflow phaseは`R0`であり、R3適用済みとは扱わない。R0 source revision、Cargo/Node実走receipt、
scaffoldの再利用可能factと非証明範囲を独立evidenceへ固定した後にR1/R2を順に通過する。
L5-25/L6-92、L6↔L7 pair、L5↔L8 `IT-RGK-PHYS-001..026`はR3の候補入力であり、
review済み適用結果や完了証拠ではない。DB/CAS/performance oracleはIssue #152 later waveへdeferする。

## 5. R4 — Forward `PLAN-L7-454`再合流

再合流先は`PLAN-L7-454-resource-kernel-native-companion`である。R4は次のAND条件を満たすまでconfirmedにしない。

1. L5-25↔L8とL6-92↔L7を独立reviewし、未反駁attack 0。
2. scaffold sourceがL6-92のwire/error/port contractへtraceされ、契約外の独自policy/state machine 0。
3. pinned Rust toolchain、review済み`Cargo.lock`、Node/Cargo testが同一commitでGreen。
4. Windows/Linux実adapterをRed→Greenで実装し、L8の開始前attach、crash、empty/reap oracleを通過。
5. D0-R custody対象のL9 oracleとaggregate gateが実runner evidenceでGreen。
6. native companion/bundle/Cargo差分のBun dependency増分0。Node直spawnやsoft fallback 0。
7. Forward側のtrace-freeze、cross-runtime blind review、tested commitとreview/evidence revision一致。

R4再合流はscaffoldをそのまま完成扱いするpromotionではない。`reuse-with-hardening`として再利用するのはR0表の
反証済みfactだけで、未実装契約と既存entrypointのadmission迂回はForward `PLAN-L7-454`のTDD工程で修正する。

## 6. 完了状態

- [ ] R0 source revisionとCargo/Node実走receiptを取得。
- [ ] R0実装事実と非証明範囲を独立evidenceで分離。
- [ ] R1/R2でL4/L5/L6/L7/L8/L9のgap-only back-fill先をreview。
- [ ] R3で`IT-RGK-PHYS-001..026`とL7 unit familyを適用し、未反駁attack 0を記録。
- [ ] Forward `PLAN-L7-454`へのR4再合流条件を満たす。
- [ ] Cargo/Node/実OS evidenceと独立cross-reviewを記録し、R4をconfirm。
