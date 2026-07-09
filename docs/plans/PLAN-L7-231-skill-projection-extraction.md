---
plan_id: PLAN-L7-231-skill-projection-extraction
title: "PLAN-L7-231 (refactor): Skill projection extraction"
kind: refactor
layer: L7
drive: db
status: confirmed
created: 2026-07-02
updated: 2026-07-02
owner: Codex
route_signal: code_smell
route_mode: refactor
backprop_decision: not_required
backprop_decision_reason: "Behavior-invariant extraction inside the existing harness.db projection boundary. Skill recommendation, invocation metric, and skill evaluation projection core moves behind injected dependencies while projection-writer keeps the existing public rebuild wiring and projectSkillEvaluations signature."
parent_design: docs/design/harness/L6-function-design/harness-db-feedback.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "Codex - skill projection extraction"
  - role: qa
    slot_label: "Codex subagent - skill projection risk review"
generates:
  - artifact_path: docs/plans/PLAN-L7-231-skill-projection-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/skill-projections.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
  - artifact_path: docs/design/harness/L5-detailed-design/module-decomposition.md
    artifact_type: design_doc
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L7-230-runtime-projection-extraction.md
  requires:
    - docs/plans/PLAN-L7-46-projection-writer.md
    - docs/plans/PLAN-L7-53-learning-engine.md
references:
  - src/state-db/projection-writer.ts
  - src/state-db/skill-projections.ts
  - tests/projection-writer.test.ts
  - tests/skill-evaluation.test.ts
review_evidence:
  - reviewer: codex-subagent
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T17:00:00+09:00"
    tests_green_at: "2026-07-02T17:00:00+09:00"
    verdict: approve
    scope: "Skill projection refactor: skillScore, skill telemetry, skill metrics, and skill evaluation core move out of projection-writer while preserving projectSkillEvaluations(db, opts?) and rebuild wiring."
    worker_model: codex
    reviewer_model: codex-subagent
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T17:00:00+09:00"
        evidence_path: src/state-db/skill-projections.ts
        output_digest: "sha256:063af7b0dc3f66f299aa98533a7d61b10d562a1a4d8739cbd29fd5b9b020336e"
        anchor_commit: 023111b0bf62d770ce3e5d6a2caf63cb8d432760
      - kind: unit_test
        command: "bun run vitest run tests\\skill-evaluation.test.ts tests\\projection-writer.test.ts tests\\skill-recommend.test.ts tests\\db-projection-ingestion.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T17:00:00+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:42bee61e425f71256298670c6bc6b0e13519a183927fb67a32edbd73d7f2b523"
        anchor_commit: 023111b0bf62d770ce3e5d6a2caf63cb8d432760
---

# PLAN-L7-231: Skill projection extraction

## 目的

`src/state-db/projection-writer.ts` は harness.db rebuild の中核として必要だが、skill recommendation / invocation metric / evaluation の詳細計算まで抱えると、DB rebuild の主経路と学習系 projection の責務が混ざる。今回の slice では skill 系の計算 core を `src/state-db/skill-projections.ts` に切り出し、`projection-writer.ts` は既存 public export と rebuild 順序を保つ薄い wrapper にする。

## 変更

- `skillScore`、`projectSkillTelemetry`、`projectSkillMetrics`、`projectSkillEvaluations` の core を `skill-projections.ts` に移す。
- `projection-writer.ts` は `projectSkillEvaluations(db, opts?)` の既存 signature と rebuild wiring を維持する。
- runtime session-derived skill invocation projection には、`skillDriveModelForPlan` を閉じ込めた adapter として `skillScore` を注入する。
- `projectAutomationAssets` は skill 専用ではなく asset catalog / search_index / drift finding を扱うため、この slice では含めない。

## デグレ対策

- `tests/skill-evaluation.test.ts` で既存 public wrapper の FR-L1-36 oracle を維持する。
- `tests/projection-writer.test.ts` で抽出先 core helper の依存注入経路を直接検証する。
- `tests/skill-recommend.test.ts` と `tests/db-projection-ingestion.test.ts` で skill recommendation / DB ingestion の周辺回帰を確認する。
- `bun run src\\cli.ts db rebuild --json` と `bun run src\\cli.ts doctor` で projection fixed point と change-set integrity を確認する。
