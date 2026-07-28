---
plan_id: PLAN-REVERSE-465-cross-review-author-binding-backfill
title: "PLAN-REVERSE-465: cross-review author binding 実装事実の上流合流 (L6 契約への gap-only backfill)"
kind: reverse
layer: cross
drive: be
route_signal: drift
route_mode: reverse
confirmed_reverse_type: design
created: 2026-07-28
updated: 2026-07-28
owner: PM / PO
parent_design: docs/plans/PLAN-L7-465-cross-review-author-binding.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
agent_slots:
  - role: tl
    slot_label: "TL - 実装で確定した照合規則と unverified 判定式の L6 契約への合流判定"
  - role: qa
    slot_label: "QA - 上流記述と実装挙動 (provider 族導出・回避条項) の照合"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-465-cross-review-author-binding-backfill.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-465-cross-review-author-binding.md
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L6-94-cross-review-session-attestation.md
    - docs/plans/PLAN-L6-13-cross-review-enforcement.md
    - src/lint/review-evidence.ts
workflow_phase: R0
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
status: draft
review_evidence: []
---

# PLAN-REVERSE-465: cross-review author binding の上流合流

PLAN-L7-465 は PLAN-L6-94 契約の L7 実装であり、既存 cross-review 契約 (PLAN-L6-13 / IMP-076) に
**新しい判定面** を足す:
申告 `worker_model` と実 author の provider 族の照合、`unverified` の扱い、利用上限に
よる回避条項。これらは実装だけが知る条件になってはならないため、gap-only で L6 契約へ
合流させる。

## スコープ (gap-only)

1. provider 族と author の導出規則 (commit trailer + wrapper session log) を L6 契約へ記述
   (L6-94 §2 の provider-direction-coherence が要求する「著者が誰か」の導出元)。
2. `unverified` (照合不能) を green に混ぜないという判定規則を契約化。
3. 利用上限による `intra_runtime_subagent` 格下げ条項を契約へ明記
   (marker + 理由 + one-shot + audit)。

## Schedule

- R0 (serial): L7-465 実装の観測 (確定した導出規則・判定式・回避条項の採取)
- R1 (serial): L6-13 との gap 判定 (影響なし面は「影響なし」と明記して閉じる)
- R2 (serial): 上流への gap-only 追記
- R3 (serial): pair_artifact と実装の照合 (QA slot)
- R4 (serial): Forward 再合流判定 → confirm

## AC

- AC-1: L6-94 / L6-13 に provider 族と author の導出規則と `unverified` の扱いが記載され、実装挙動と
  一致することを照合済み。
- AC-2: 利用上限による回避条項が契約に明記され、`cross_agent` 僭称が契約上も禁じられて
  いること。
- AC-3: L4 / L5 への影響有無が明示的に判定され、未判定の面が残っていない。
