---
plan_id: PLAN-L7-43-implementation-verification-group
title: "PLAN-L7-43 (add-impl): 実装検証サイクルゲート L0-L7 verification group"
kind: add-impl
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-11
updated: 2026-06-11
owner: Codex TL
review_evidence:
  - reviewer: codex-intra-runtime-review
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-11"
    tests_green_at: "2026-06-11"
    verdict: pass
    scope: "VERIFICATION_GROUPS now includes L0-L7 / 実装検証サイクルゲート and doctor surfaces it after L7 freeze. Critical 0 / Important 0."
    worker_model: codex-gpt-5
    reviewer_model: codex-gpt-5-intra-runtime-review
agent_slots:
  - role: tl
    slot_label: "TL - implementation verification group close"
generates:
  - artifact_path: src/vmodel/lint.ts
    artifact_type: source_module
  - artifact_path: tests/vmodel-pair.test.ts
    artifact_type: test_code
  - artifact_path: docs/design/harness/L3-functional/roadmap.md
    artifact_type: design_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
    artifact_type: markdown_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-DISCOVERY-05-roadmap-registration.md
  requires:
    - docs/plans/PLAN-REVERSE-36-verification-cycle-gate-naming.md
    - docs/plans/PLAN-REVERSE-42-regression-dependency-drift.md
  references:
    - docs/design/harness/L3-functional/roadmap.md
    - docs/design/harness/L6-function-design/vmodel-pair-freeze.md
---

# PLAN-L7-43 (add-impl): 実装検証サイクルゲート L0-L7 verification group

## §0 Position

L7 roadmap の **G-L7.D → G-L7.E** span。PLAN-REVERSE-36 で命名済みだった
**実装検証サイクルゲート (L0-L7)** を `src/vmodel/lint.ts` の `VERIFICATION_GROUPS` に追加し、L7 freeze 後に doctor が機械発火可能として surface する。

## §1 Scope

- `VERIFICATION_GROUPS` に `id: "L0-L7"`, `gate: "実装検証サイクルゲート"` を追加。
- `tests/vmodel-pair.test.ts` の実 repo guard が L0-L7 surface / frozen を assert。
- `docs/design/harness/L3-functional/roadmap.md` と concept glossary の「未追加」表現を実装済みに更新。

Out of scope: 実装検証サイクルそのものの実施 PLAN 起票。ここでは発火条件の機械 surface まで。

## §8 DoD

- [x] U-VTRIG-005 が `実装検証サイクルゲート` と `L0-L7` frozen を assert。
- [x] `doctor` が L0-L7 実装検証サイクルゲートを surface。
- [x] `PLAN-DISCOVERY-05` roadmap の G-L7.E span orphan を解消する正本 PLAN として confirmed。
