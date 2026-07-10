---
plan_id: PLAN-L4-26-engine-swap-object-method-design
title: "PLAN-L4-26 (add-design): engine-swap aggregate / class / method設計の実体化"
kind: add-design
layer: L4
sub_doc: data
drive: fullstack
status: draft
route_signal: feature_addition
route_mode: add-feature
created: 2026-07-10
updated: 2026-07-10
owner: PO / Codex
parent_design: docs/design/harness/L4-basic-design/data.md
related_l0: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
pair_artifact: docs/test-design/harness/L9-system-test-design.md
next_pair_freeze: L5
agent_slots:
  - role: tl
    slot_label: "TL - aggregate責務、class採用境界、pure function境界"
  - role: se
    slot_label: "SE - constructor/invariant/method/CQS/port設計と短いmodule分割"
  - role: qa
    slot_label: "QA - invalid state、肥大class/method、循環依存、migration回帰"
generates:
  - artifact_path: docs/design/harness/L4-basic-design/data.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L5-detailed-design/module-decomposition.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
  - artifact_path: docs/governance/coding-rules.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L0-01-vmodel-harness-upgrade-charter.md
  requires:
    - docs/plans/PLAN-L4-21-domain-vo-coding-constraints.md
  blocks: []
  references:
    - docs/plans/PLAN-L4-22-vmodel-source-disposition-profile-ssot.md
    - docs/plans/PLAN-L4-23-forward-fsm-plan-asset-v2.md
    - docs/plans/PLAN-L4-24-declarative-vmodel-contract-right-arm.md
    - docs/adr/ADR-008-forward-fsm-plan-asset-v2.md
---

# PLAN-L4-26: engine-swap aggregate / class / method設計の実体化

## 1. 発見した負債

現行L4は「domain class量が薄い」、L6は「class-design縮退」を明記し、値object/構造規約をガイドライン化している。
今回のengine-swapではidentity、revision、state transition、evidence、disposition、profile overlayという状態と不変条件を
持つdomainが増えるため、縮退前提のままではdata clumpと巨大pure functionへ責務が流出する。

## 2. object model候補

| aggregate / service | 所有する責務 | class採用判断 |
|---|---|---|
| `PlanAsset` | immutable identity、alias、latest revision、dependency | identity/revision invariantを持つaggregate class |
| `PlanRevision` | revision number、scope、artifact/evidence policy | immutable value object |
| `ForwardWorkflow` | state reduction、許可transition、guard verdict | stateful aggregate。event append以外のmutationを禁止 |
| `WorkflowTransition` | from/to、actor、reason、evidence、commit | immutable entity/event |
| `EvidenceRecord` | subject revision、digest、time/expiry、producer | immutable value object |
| `VModelContract` | L0-L14/G0.5-G14 exactly-once、pair/exit/routing | validated aggregate |
| `DocumentDispositionCatalog` | source/item/target edgeとorphan invariant | validated aggregate |
| `ProfileOverlayResolver` | size baseline + product overlay +強度merge | stateless domain service |
| `PlanIdReservation` | namespace/ordinal予約と競合拒否 | concurrency invariantを持つaggregate |

## 3. 設計原則

- classは状態、不変条件、lifecycleを所有する場合に使い、単なるnamespaceやDTO wrapperには使わない。
- constructorは完全constructorまたは検証済factoryとし、二段階初期化とpublic mutable fieldを禁止する。
- command methodとquery methodを分離し、commandはevent/resultを返し、queryは状態を変更しない。
- parser、serializer、DB adapter、filesystem loaderはport/adapterへ隔離し、domain objectがI/Oを直接行わない。
- methodは1責務、浅い分岐、概ね80 nonblank lines以下とし、policy table/VO/domain serviceへ分割する。
- inheritanceよりcomposition、discriminated union、small interfaceを優先し、循環依存を作らない。
- 途中で検出した責務漏れ、god object、data clump、重複parserは負債台帳とPLANへ起票し、黙ってcarryしない。

## 4. 受入条件

- 上表の各候補についてclass/VO/service/pure function/portの最終判断と理由をL4へ固定する。
- public constructor/factory/method/query/event signatureをL6へ記載し、pre/post/invariantとtest IDを結ぶ。
- L5 module decompositionで1moduleの責務、依存方向、I/O端点、循環0を固定する。
- PLAN Asset/FSM/contract/disposition/profileの実装に巨大汎用manager classを導入しない。
- source method/functionの長さ、nesting、complexity、CQS違反を新規差分で0にし、既存違反は負債PLANへ送る。
- unit/property/integration testでinvalid state生成、illegal transition、overlay競合、reservation競合を検証する。

## 5. 降下先

L5 object persistence/module設計、L6 method contract、L7 small module実装へ分割し、PLAN-L4-23/24の実装waveと
同じaccept gateで検収する。
