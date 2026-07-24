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
  receipt_id: certificate:6af9e07741a6eb96938f69faa7f0755e
  command_id: pr156-formal-admission-reverse-20260724
  admitted_at: 2026-07-24T12:44:00.000Z
  source_digest: sha256:ef2cb65b4c794e9ced9e70ec7c041487737f43e78bb9ad4c75ffcc88837d1a7c
  decision_digest: sha256:8f99eae2ad154f775b87e5d02046d125fefaaf73c93a9e6f34297ee8700c611e
  receipt_digest: sha256:90740039911b8498a52066b3fdc8f5318ea6d6bc50ee3c6e927b455cadaf7257
  binding:
    path: docs/plans/PLAN-REVERSE-454-resource-kernel-native-scaffold-backfill.md
    plan_id: PLAN-REVERSE-454-resource-kernel-native-scaffold-backfill
    asset_id: plan:legacy:d66396b73c7db2b8d007824dcb6cada0ec811ff802f42189d5687d3d9b6853af
    revision: 2
    content_digest: sha256:ef2cb65b4c794e9ced9e70ec7c041487737f43e78bb9ad4c75ffcc88837d1a7c
  route:
    signal: design_gap
    mode: reverse
  issue:
    provider: github
    issue_id: 152
    episode_id: E4-152-node-control-plane-d0n
    projection_digest: sha256:bc3454a066b640893922b0ad77dd27ad8baa0091586d82d152df0fc6e8d06f0e
  origin:
    plan_id: PLAN-L7-454-resource-kernel-native-companion
    revision: 2
    digest: sha256:886ee033e089f9b46f5ad68cd8d3efdd45b0b0204cd05844597ea272787d06d5
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L7-454-resource-kernel-native-companion
    target_revision: 2
    phase: forward_merge
  escape_reason: 先行Rust scaffoldの実装事実を設計へ戻し、Resource Kernel Forward実装へ再合流する
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

| observed fact | 再利用判定 | Greenと主張しないもの |
|---|---|---|
| `PROTOCOL_VERSION = 1`とserde JSON DTO | reuse | length framing、bounded I/O、schema digest |
| request/responseのunknown field拒否 | reuse | duplicate key、oversize、partial/trailing byte全拒否 |
| closed `Capability` enumとrequired集合差分 | reuse | OS probe、bundle capability証明 |
| launch時のhard custody capability強制追加 | reuse after L6 trace | 実際のattach-before-user-code |
| `UnsupportedAdapter` + launcher call 0 | reuse-with-hardening | binary command分離、control/workload process identity、Windows/Linux custody実装 |
| `OsAdapter` / `ProcessLauncher`分離 | reuse then refine | lifecycle、terminate、empty/reap port |

R0証拠はsource revisionとCargo/Node test receiptへ固定する。静的substring testだけ、Cargo未実走、unsupported adapterだけでは
native custody Greenにならない。

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
| L8 test design | mock boundaryと実Windows/Linux custody laneを分離し、14件のfault-injection oracleを固定 |
| L9 test design | `ST-RGK-01..15`のsystem証拠を唯一のacceptanceとし、scaffold evidenceを代用しない |

## 4. R3 — back-fill適用

R3ではL5-25/L6-92を新規起票し、L5↔L8、L6↔L7のpairをgap-freeで記録した。L4/L9の
`AC-RGK-* ↔ ST-RGK-*`を変更せず、検出器に通すためのallowlistやplatform skipを追加していない。
`PLAN-L5-24`と`PLAN-L6-89`は別branchの正規PLANと衝突するため再利用せず、全branch採番監査後の
L5-25/L6-92へ降下した。

## 5. R4 — Forward `PLAN-L7-454`再合流

再合流先は`PLAN-L7-454-resource-kernel-native-companion`である。R4は次のAND条件を満たすまでconfirmedにしない。

1. L5-25↔L8とL6-92↔L7を独立reviewし、未反駁attack 0。
2. scaffold sourceがL6-92のwire/error/port contractへtraceされ、契約外の独自policy/state machine 0。
3. pinned Rust toolchain、review済み`Cargo.lock`、Node/Cargo testが同一commitでGreen。
4. Windows/Linux実adapterをRed→Greenで実装し、L8の開始前attach、crash、empty/reap oracleを通過。
5. L9 `ST-RGK-01..15`とaggregate gateが実runner evidenceでGreen。
6. native companion/bundle/Cargo差分のBun dependency増分0。Node直spawnやsoft fallback 0。
7. Forward側のtrace-freeze、cross-runtime blind review、tested commitとreview/evidence revision一致。

R4再合流はscaffoldをそのまま完成扱いするpromotionではない。`reuse-with-hardening`として再利用するのはR0表の
反証済みfactだけで、未実装契約と既存entrypointのadmission迂回はForward `PLAN-L7-454`のTDD工程で修正する。

## 6. 完了状態

- [x] `PLAN-REVERSE-453`と衝突しないReverse IDを確保。
- [x] R0実装事実と非証明範囲を分離。
- [x] L4/L5/L6/L7/L8/L9のgap-only back-fill先を対応付け。
- [x] Forward `PLAN-L7-454`への再合流先とAND gateを固定。
- [ ] Cargo/Node/実OS evidenceと独立cross-reviewを記録し、R4をconfirm。
