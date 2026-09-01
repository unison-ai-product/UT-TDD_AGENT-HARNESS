---
plan_id: PLAN-REVERSE-458-node-self-hosted-bun-ban-backfill
title: "PLAN-REVERSE-458: Node self-hosted Bun permanent-ban implementation backfill"
kind: reverse
layer: cross
drive: fullstack
route_signal: drift
route_mode: reverse
confirmed_reverse_type: design
created: 2026-07-23
updated: 2026-07-23
owner: PO / Codex
parent_design: docs/plans/PLAN-L7-458-node-self-hosted-bun-ban-foundation.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: TL - Node self-host実装からL4-L6契約へのgap-only backfillとForward再合流判定
  - role: qa
    slot_label: QA - Bun process zero、Node bootstrap receipt、Linux/Windows証拠の照合
review_evidence: []
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-458-node-self-hosted-bun-ban-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/bun-migration-debt.yaml
    artifact_type: config
  - artifact_path: src/lint/bun-permanent-ban.ts
    artifact_type: source_module
  - artifact_path: src/schema/cutover-transition.ts
    artifact_type: source_module
  - artifact_path: src/runtime/cutover-transition.ts
    artifact_type: source_module
  - artifact_path: src/runtime/runtime-image-observer.ts
    artifact_type: source_module
  - artifact_path: tests/bun-permanent-ban.test.ts
    artifact_type: test_code
  - artifact_path: tests/cutover-transition.test.ts
    artifact_type: test_code
  - artifact_path: tests/runtime-image-observer.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-458-node-self-hosted-bun-ban-foundation.md
  requires: []
  references:
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
    - docs/design/harness/L4-basic-design/architecture.md
    - docs/design/harness/L5-detailed-design/internal-processing.md
    - docs/design/harness/L6-function-design/function-spec.md
  blocks: []
workflow_phase: R0
status: draft
github_issue_id: 152
admission_receipt:
  schema_version: v2
  receipt_id: certificate:4679b92fb51c1ce6d9b6f87714f1393d
  command_id: pr154-formal-admission-reverse-20260724
  admitted_at: 2026-07-24T07:00:00.000Z
  source_digest: sha256:42302186a0033ae6bb2f8515daa483422222be98bcd3a269d66fbfbdd7527e2e
  decision_digest: sha256:783d8bde2b3e540d9ff4d276d2298d841be54bef626290ac550de08a13cdc4c6
  receipt_digest: sha256:6c820ae26b0a3484181296a35baa63642ed2e11e6d9156c0e3925409d850bba8
  binding:
    path: docs/plans/PLAN-REVERSE-458-node-self-hosted-bun-ban-backfill.md
    plan_id: PLAN-REVERSE-458-node-self-hosted-bun-ban-backfill
    asset_id: plan:legacy:0c0e5d2dfcdd5f050ad3588b7ac1248e908e6c8c6b16d43cec3635c0723188d0
    revision: 2
    content_digest: sha256:42302186a0033ae6bb2f8515daa483422222be98bcd3a269d66fbfbdd7527e2e
  route:
    signal: drift
    mode: reverse
  issue:
    provider: github
    issue_id: 152
    episode_id: E4-152-node-control-plane-d0n
    projection_digest: sha256:bc3454a066b640893922b0ad77dd27ad8baa0091586d82d152df0fc6e8d06f0e
  origin:
    plan_id: PLAN-L7-458-node-self-hosted-bun-ban-foundation
    revision: 2
    digest: sha256:b65cffec21905c2373ee52ab60a5fd3be61adcab5fbcb84ffef7f82b05318755
  transition:
    direction: implementation_to_design
    implementation_disposition: preserved
  reentry:
    target_plan_id: PLAN-L4-33-node-control-plane-redesign
    target_revision: 2
    phase: forward_merge
  escape_reason: Node self-hosted implementation facts require design backfill
    before Forward merge
---

# PLAN-REVERSE-458: Node self-hosted Bun permanent-ban implementation backfill

## B4 ownership backfill

`PLAN-L7-458` の confirmed 化に伴う `fd7d154e` で `generates` から外れた8件について、
別の confirmed/completed PLAN に exact path の owner が存在しないことを pair-freeze で確認した。
本 Reverse は、この8件を未所有のまま残さないための明示的な backfill owner である。実装内容の追加、
F0c/Q0 の実行、consumer placement、Bun の物理削除はこの ownership 修正の対象外とする。

| artifact family | backfill ownership |
|---|---|
| `docs/governance/bun-migration-debt.yaml` / `src/lint/bun-permanent-ban.ts` / `tests/bun-permanent-ban.test.ts` | 本PLANが Bun debt baseline と Node-only ban detector/test の backfill artifact owner |
| `src/schema/cutover-transition.ts` / `src/runtime/cutover-transition.ts` / `tests/cutover-transition.test.ts` | 本PLANが CutoverTransition schema/runtime/pair-test の backfill artifact owner |
| `src/runtime/runtime-image-observer.ts` / `tests/runtime-image-observer.test.ts` | 本PLANが runtime-image observer と pair-test の backfill artifact owner |

`generates` と本節の対象集合は一致し、各 path は本PLANだけが所有する。`PLAN-L7-458` はこれらを
契約参照として保持するが、生成 owner や実装済み artifact としては扱わない。

## 1. 目的

Issue #152のD0-Nで確定したNode control plane設計をForwardへ合流した後、`PLAN-L7-458`の`add-impl`で得た実装事実をR0-R4で上位設計へ戻す。実装を設計承認の根拠にはせず、設計との差分だけをgapとして扱う。Issue #153のbootstrap envelopeはreceipt、review、Node matrixを免除しない。

## 2. R0-R4

- R0: Node executable identity、compiled ESM、package-lock、SQLite adapter、Bun finding、runtime process観測を収集する。
- R1: 実装が公開するbootstrap / detector / receipt契約を観測する。
- R2: ADR-001とL4-L6のNode control-plane節へ照合し、設計済み契約と実装固有詳細を分離する。
- R3: 設計差分、未観測境界、Bun残存負債をPO検証へ出す。
- R4: gapの設計反映、L7 test trace、Linux/Windows/aggregate evidenceを揃え、Forward reviewへ再合流する。

## 3. 不変条件

- PoC実装を捨てて設計から再降下した経路はRedesign、採用実装から設計を追従させる本工程はReverseとして混同しない。
- Bun依存をallowlistでGreen化しない。既存負債は`NonCompliant`、観測不能は`Indeterminate`として保持する。
- 実装結果でL4-L6を自動改訂せず、差分採択後にのみ設計を更新する。

## 4. F0a legacy custody backfill

最初のF0b candidateに限るbackfillは、L5 `NODE-SLICE-LEGACY-BACKFILL-REGISTRY-v1`の
`legacy.d0-admission`と`legacy.f0a-custody`を唯一の正本とする。D0/F0a二receiptの片側mint、
row固定tuple、D0 4-rowまたはF0a 8-row Git closureの一要素mutation、wrong command authority/receipt producer、
reviewerFamily/model/PASS注入、double mint、削除後remintをRedにし、二rowを#484だけがatomicかつexactly once
mintした場合だけGreenとする。両rowは`family_status=unverified_family`、`review_authority=none`であり、過去の
review/custody admittedを証明せず、通常D0/F0a admissionへlegacy rowを一般化しない。欠落・不一致は
`legacy_evidence_unavailable`とする。
