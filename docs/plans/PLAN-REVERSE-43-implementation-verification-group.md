---
plan_id: PLAN-REVERSE-43-implementation-verification-group
title: "PLAN-REVERSE-43 (reverse): 実装検証サイクルゲート L0-L7 を設計・用語へ back-fill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: normalization
drive: fullstack
status: confirmed
created: 2026-06-11
updated: 2026-06-11
owner: Codex TL
forward_routing: L5
promotion_strategy: reuse-with-hardening
review_evidence:
  - reviewer: codex-intra-runtime-review
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-11"
    tests_green_at: "2026-06-11"
    verdict: pass
    scope: "Back-fill for PLAN-L7-43. L3 roadmap, L6 vmodel-pair-freeze design, concept glossary, and L7 test-design now reflect L0-L7 implementation verification group. Critical 0 / Important 0."
    worker_model: codex-gpt-5
    reviewer_model: codex-gpt-5-intra-runtime-review
agent_slots:
  - role: tl
    slot_label: "TL - implementation verification group reverse merge"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-43-implementation-verification-group.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L3-functional/roadmap.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/vmodel-pair-freeze.md
    artifact_type: design_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: null
  requires:
    - docs/plans/PLAN-L7-43-implementation-verification-group.md
  references:
    - docs/plans/PLAN-REVERSE-36-verification-cycle-gate-naming.md
    - docs/design/harness/L3-functional/roadmap.md
---

# PLAN-REVERSE-43 (reverse): 実装検証サイクルゲート L0-L7 back-fill

## §0 Position

PLAN-L7-43 の add-impl で追加した `VERIFICATION_GROUPS` L0-L7 を、上位設計・用語・テスト設計へ合流する Reverse PLAN。backfill-pairing (IMP-051) の required pairing を満たす。

## §1 R0-R4

- **R0**: L0-L7 実装検証サイクルゲートは PLAN-REVERSE-36 で命名済みだが、`VERIFICATION_GROUPS` には未追加の carry だった。
- **R1**: L0-L7 group = L1-L6 design freeze + L7 implementation band の機械 surface。
- **R2**: `src/vmodel/lint.ts` の単一正本に group を追加し、doctor surface を更新。
- **R3**: `tests/vmodel-pair.test.ts` の実 repo guard で L0-L7 frozen を固定。
- **R4**: L3 roadmap、L6 function design、concept §10、L7 test-design へ back-fill 済み。

## §8 DoD

- [x] PLAN-L7-43 を `dependencies.requires` し、Reverse 孤児を解消。
- [x] L0-L7 / 実装検証サイクルゲートの設計・用語・テスト設計 back-fill 完了。
- [x] doctor が `実装検証サイクルゲート [L0-L7]` と G-L7.E reached を surface。
