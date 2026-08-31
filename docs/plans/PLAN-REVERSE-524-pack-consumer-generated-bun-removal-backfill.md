---
plan_id: PLAN-REVERSE-524-pack-consumer-generated-bun-removal-backfill
title: "PLAN-REVERSE-524: S1-b 生成成果物 Bun 撤去の backfill"
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
created: 2026-08-31
updated: 2026-08-31
owner: Codex / Luna
parent_design: docs/plans/PLAN-L7-524-pack-consumer-generated-bun-removal.md
pair_artifact: docs/test-design/harness/L7-pack-consumer-generated-bun-removal-backfill-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - S1-b の実装差分を親契約へ backfill する"
  - role: qa
    slot_label: "QA - 生成 tree と negative control の R3 差分を再検収する"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-524-pack-consumer-generated-bun-removal-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-524-pack-consumer-generated-bun-removal.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-522-pack-consumer-bun-path-removal.md
    - docs/test-design/harness/L7-pack-consumer-generated-bun-removal-backfill-test-design.md
review_evidence: []
---

# PLAN-REVERSE-524: S1-b 生成成果物 Bun 撤去の backfill

## R0: 対象

Forward の `PLAN-L7-524` に対する slice-scoped Reverse 対である。対象は setup が生成する
consumer tree と、その negative control / BAN 検出能力の証跡だけであり、S1-a、S1-c、
Node producer、Pack publication の責務は含めない。

## R1: 観測された差分

生成される wrapper、hook、CI、案内文、package script が Bun 到達経路を持たないことを確認する。
source の build script と検出側 lint は既存契約の所有物として保護する。

## R2: 変異行列

同一の clean generated tree を各 case で作り直し、baseline は空、各 case は期待 finding 集合と
完全一致させる。5つの生成経路（shebang、run-bun launcher、consumer CI、案内文、package script）
を相互に混ぜない。U-PACKBUN-006 は runtime spawn 3形、command 4形、import/global/parity、
Pack CI の既存 deny rule を個別に検証する。

## R3: 検証

exact implementation HEAD で focused Vitest、typecheck、Biome、plan lint、diff check を実行し、
exit code、時刻、digest、anchor commit を review evidence に記録する。

## R4: 合流

新しい要件や設計語彙は追加せず、`forward_routing: gap-only` / `promotion_strategy: reuse-as-is`
で親の S1-b へ合流する。S1-a / S1-c / Slice 2 の契約は変更しない。
