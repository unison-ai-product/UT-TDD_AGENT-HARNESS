---
plan_id: PLAN-REVERSE-454-resource-kernel-native-scaffold-backfill
title: "PLAN-REVERSE-454: Resource Kernel native scaffold起点の設計・検証back-fill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: design
drive: fullstack
status: draft
route_signal: design_gap
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
created: 2026-07-22
updated: 2026-07-22
owner: Codex TL / PO
parent_design: docs/plans/PLAN-L7-454-resource-kernel-native-companion.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - scaffold事実と上流契約の差分判定、Forward再合流gate"
  - role: qa
    slot_label: "QA - L7/L8/L9のRed oracleと実OS証拠の分離"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-454-resource-kernel-native-scaffold-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L4-32-resource-governed-execution-kernel.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L5-25-resource-kernel-physical-protocol.md
    artifact_type: markdown_doc
  - artifact_path: docs/plans/PLAN-L6-92-resource-kernel-function-contracts.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/test-design/harness/L8-integration-test-design.md
    artifact_type: test_design
  - artifact_path: docs/test-design/harness/L9-system-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-454-resource-kernel-native-companion.md
  requires:
    - docs/plans/PLAN-L5-25-resource-kernel-physical-protocol.md
    - docs/plans/PLAN-L6-92-resource-kernel-function-contracts.md
  blocks: []
  references:
    - docs/adr/ADR-009-resource-kernel-native-custody-companion.md
    - native/resource-kernel/resource-kernel-companion/src/lib.rs
    - tests/resource-kernel-native-scaffold.test.ts
    - docs/test-design/harness/L9-system-test-design.md
review_evidence: []
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
| `UnsupportedAdapter` + `process_created=false` + launcher call 0 | reuse | Windows/Linux custody実装 |
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
| L4 `PLAN-L4-32` | process生成前capability拒否、OS custody、bundle、Bun永久BANを維持。unsupported Greenをsystem Greenへ昇格しない |
| L5 `PLAN-L5-25` | strict frame、Node/Rust配置、custodian lifecycle、crash/reconnect、bundle rollbackを追加 |
| L6 `PLAN-L6-92` | wire algebra、closed error union、lifecycle reducer、platform port、responsibility-overlap findingを追加 |
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
6. Bun runtime/test/CI/lockfile/compatibility dependency 0。Node直spawnやsoft fallback 0。
7. Forward側のtrace-freeze、cross-runtime blind review、tested commitとreview/evidence revision一致。

R4再合流はscaffoldをそのまま完成扱いするpromotionではない。再利用対象はR0表のfactだけで、未実装契約は
Forward `PLAN-L7-454`のTDD工程として残す。

## 6. 完了状態

- [x] `PLAN-REVERSE-453`と衝突しないReverse IDを確保。
- [x] R0実装事実と非証明範囲を分離。
- [x] L4/L5/L6/L7/L8/L9のgap-only back-fill先を対応付け。
- [x] Forward `PLAN-L7-454`への再合流先とAND gateを固定。
- [ ] Cargo/Node/実OS evidenceと独立cross-reviewを記録し、R4をconfirm。
