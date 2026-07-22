---
plan_id: PLAN-L5-26-node-platform-packaging-deployment
title: "PLAN-L5-26 (add-design/internal-processing): Node platform packaging and deployment"
kind: add-design
layer: L5
sub_doc: internal-processing
drive: fullstack
status: draft
route_signal: redesign
route_mode: redesign
created: 2026-07-22
updated: 2026-07-22
owner: PO / Codex
github_issue_id: 134
parent_design: docs/plans/PLAN-L4-33-node-control-plane-cutover.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L8-integration-test-design.md
next_pair_freeze: L8
agent_slots:
  - role: se
    slot_label: "SE - Node package、bundle、SQLite、hook process port"
  - role: qa
    slot_label: "QA - clean host、改竄、atomic activation、rollback oracle"
generates:
  - artifact_path: docs/plans/PLAN-L5-26-node-platform-packaging-deployment.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L4-33-node-control-plane-cutover.md
  requires: []
  blocks: []
  references:
    - docs/design/harness/L5-detailed-design/internal-processing.md
    - docs/test-design/harness/L8-integration-test-design.md
    - docs/adr/ADR-009-resource-kernel-native-custody-companion.md
review_evidence: []
---

# PLAN-L5-26: Node platform packaging and deployment

## 1. 物理単位

配布bundleは`manifest + compiled Node ESM + production node_modules + Rust companion + SBOM + signature`を不可分とする。manifestはNode version policy、target OS/arch、entrypoint、全file digest、Rust protocol、schema/policy revisionを固定する。system Nodeを使う場合もversion/capability照合後にだけ起動し、download、PATH fallback、Bun fallbackを行わない。

## 2. Port契約

| port | 入力 | 出力 / fail-close |
|---|---|---|
| `RuntimeBundleVerifier` | manifest、signature trust、target、file tree | verified bundle handle。不一致ならprocess生成0 |
| `NodeEntrypointResolver` | verified handle、command | absolute Node executableとESM argv。PATH文字列を返さない |
| `SqliteRuntimePort` | canonical DB operation、transaction policy | typed result/receipt。driver固有値をdomainへ漏らさない |
| `HookProcessPort` | bounded event frame、deadline、classification | bounded response/exit meaning。visible shellを生成しない |
| `BanInventoryPort` | tracked tree、bundle tree、runtime receipt | detector別findingとcoverage receipt。parse不能を欠測としてRed |
| `AtomicBundleActivator` | verified new/old bundle、lease state | all-or-nothing activation/rollback。Node/Rust片側更新を禁止 |

## 3. 統合test pair

L8は`IT-NODE-CUTOVER-001..012`を所有する。manifest改竄、wrong target、Node version drift、SQLite lock、hook timeout、unknown executable、generated artifact混入、Pack install、atomic activation、rollback、runtime process audit、Bun未導入clean hostをそれぞれ独立fixtureにする。各testは対象revision/bundle/inventory digestを保存し、別attemptのRust/Node結果を寄せ集めてGreenにしない。

## 4. 完了条件

- L8 integration oracleがWindows/Linuxで同一bundleを検証する。
- package-lock、SBOM、signature、manifestがreview対象として固定される。
- CLI、hook、SQLite、test runner、Packの全entrypointがverified Node handleへ収束する。
- Bun executable、dependency、download、fallback、compatibility shimがbundleにもhost準備にも存在しない。

詳細なfunction分割と実装PLANはL6/L7へ降下し、本PLAN単独ではcutover完了を宣言しない。
