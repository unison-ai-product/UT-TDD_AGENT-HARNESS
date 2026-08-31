---
plan_id: PLAN-REVERSE-522-pack-consumer-bun-path-removal-backfill
title: "PLAN-REVERSE-522: Pack/consumer Bun 到達経路撤去の backfill"
kind: reverse
layer: cross
workflow_phase: R0
confirmed_reverse_type: design
drive: agent
route_signal: design_gap
route_mode: reverse
forward_routing: gap-only
promotion_strategy: reuse-as-is
status: draft
created: 2026-08-28
updated: 2026-08-28
owner: PM / PO / Claude
parent_design: docs/plans/PLAN-L7-522-pack-consumer-bun-path-removal.md
pair_artifact: docs/test-design/harness/L7-pack-consumer-bun-path-removal-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - consumer 実行面の toolchain 前提差分を L6-101 へ backfill する"
  - role: qa
    slot_label: "QA - 到達経路 0 と negative control の R3 差分を再検収する"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-522-pack-consumer-bun-path-removal-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-pack-consumer-bun-path-removal-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-522-pack-consumer-bun-path-removal.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-101-pack-independent-multi-consumer-acceptance.md
    - docs/plans/PLAN-L6-93-node-bootstrap-contract.md
    - docs/plans/PLAN-L7-458-node-self-hosted-bun-ban-foundation.md
    - docs/plans/PLAN-L7-516-pack-self-contained-consumer-runtime.md
    - docs/plans/PLAN-L7-522-pack-consumer-bun-path-removal.md
    - docs/test-design/harness/L7-pack-consumer-bun-path-removal-test-design.md
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/134
    - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/issues/450
review_evidence: []
---

# PLAN-REVERSE-522: Pack/consumer Bun 到達経路撤去の backfill

## R0. 対象と現在位置

Forward の `PLAN-L7-522` (`kind: add-impl`) に対する Reverse 対である。
現在 R0 (対の宣言のみ) であり、R1 以降は Forward の pair-freeze 確定後に進める。

backfill 対象は `PLAN-L6-101-pack-independent-multi-consumer-acceptance` である。
Forward が確定させる「consumer 実行面の toolchain 前提から Bun を外す」という差分が、
L6 の independent multi-consumer acceptance 契約へ反映されていないためである。

## R1. 設計 gap の仮説 (Forward pair-freeze 後に確定)

`PLAN-L6-101` は Pack consumer が独立に受入可能であることを要求するが、
**consumer が満たすべき toolchain 前提を列挙していない**。
その結果、`src/setup/distribution.ts` の readiness が Bun ≥1.3 を要求していても
L6 契約には抵触せず、Issue #418 の HARD 条件 (Bun executable なし) と衝突したまま
検出されない状態が成立していた。

gap は「L6 が consumer toolchain 前提を所有していない」ことであり、
Forward の実装ではなく設計側の欠落である。

## R2. 差分抽出 (未着手)

Forward の S1-a / S1-b / S1-c が確定させる不変条件のうち、
L6-101 へ昇格すべきものを抽出する。現時点の候補は `PLAN-L7-522` §6 の不変条件 1 と 2 である。

不変条件 3 (`build` script 不変) と 4 (BAN 検出側 lint 不変) は `PLAN-L6-93` §5 が既に所有しており、
本 Reverse では扱わない (所有の二重化を避ける)。

## R3. 検証 (未着手)

Forward の未実装候補 `CANDIDATE-U-PACKBUN-001` / `002` / `005` と、本sliceで昇格した
`U-PACKBUN-003` / `004` / `006` のうち、
L6 層で再検収すべき軸を選定する。特に **negative control の有効性** (既存 template を復活させると
必ず Red になること) は、恒真 oracle による偽の充足を防ぐ要であり R3 の主対象とする。

## R4. Forward 合流 (未着手)

`forward_routing: gap-only`、`promotion_strategy: reuse-as-is`。
L6-101 への backfill が確定した時点で Forward へ合流する。

## 非証明事項

本 Reverse の R0 宣言は、R1〜R4 の完了、`PLAN-L6-101` の改訂、
Forward の実装完了のいずれも意味しない。
