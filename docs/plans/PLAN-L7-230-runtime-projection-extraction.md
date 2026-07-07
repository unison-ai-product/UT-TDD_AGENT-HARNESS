---
plan_id: PLAN-L7-230-runtime-projection-extraction
title: "PLAN-L7-230 (refactor): Runtime projection extraction"
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
backprop_decision_reason: "Behavior-invariant extraction inside the existing harness.db projection boundary. Runtime session-derived test run, guardrail decision, and skill invocation projections keep the same public projection-writer exports and persisted schema; no product requirement, L4/L6 design contract, or GitHub operation semantics changed."
parent_design: docs/design/harness/L6-function-design/harness-db-feedback.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
agent_slots:
  - role: se
    slot_label: "Codex - runtime projection extraction"
  - role: qa
    slot_label: "Codex - projection-writer regression fence"
generates:
  - artifact_path: docs/plans/PLAN-L7-230-runtime-projection-extraction.md
    artifact_type: markdown_doc
  - artifact_path: src/state-db/runtime-projections.ts
    artifact_type: source_module
  - artifact_path: src/state-db/projection-writer.ts
    artifact_type: source_module
  - artifact_path: tests/projection-writer.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-229-cli-feedback-registrar-extraction.md
  requires:
    - docs/plans/PLAN-L7-46-projection-writer.md
    - docs/plans/PLAN-L7-152-artifact-progress-decision-extraction.md
references:
  - src/state-db/projection-writer.ts
  - src/state-db/runtime-projections.ts
  - tests/projection-writer.test.ts
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-02T16:05:00+09:00"
    tests_green_at: "2026-07-02T16:05:00+09:00"
    verdict: approve
    scope: "Runtime session-derived projection refactor: test_run, guardrail_decision, and skill_invocation projection logic moves out of src/state-db/projection-writer.ts while preserving exported wrapper functions and rebuild wiring."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T16:05:00+09:00"
        evidence_path: src/state-db/runtime-projections.ts
        output_digest: "sha256:90653c9bbd01deebd3f9fdf7349137b8d92776be4ed2ed4af2871c62a085d22f"
      - kind: unit_test
        command: "bun run vitest run tests\\projection-writer.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-02T16:05:00+09:00"
        evidence_path: tests/projection-writer.test.ts
        output_digest: "sha256:5a097504a714d98a94ada4eedf016cac3e2417c180a9c6904c987e46f1bf0c4b"
---

# PLAN-L7-230: Runtime projection extraction

## 目的

`src/state-db/projection-writer.ts` は harness.db rebuild の集約点として、PLAN 投影、hook/session log 投影、review evidence、roadmap、artifact progress、automation asset などを単一ファイルに抱えている。runtime session log 由来の `test_runs` / `guardrail_decisions` / `skill_invocations` は独立した関心であり、projection writer 本体に残すと DB rebuild の主経路が読みづらくなる。

この slice では runtime session-derived projection を `src/state-db/runtime-projections.ts` に移し、`projection-writer.ts` は既存 export と rebuild wiring を保持する薄い wrapper に寄せる。

## 変更

- runtime session event から `test_runs` を作る処理を `runtime-projections.ts` へ移す。
- forced-stop session event から `guardrail_decisions` を作る処理を `runtime-projections.ts` へ移す。
- skill suggest session event から `skill_invocations` を作る処理を `runtime-projections.ts` へ移す。
- `projection-writer.ts` からの既存 public export は維持し、既存テストと Pack 側の import 経路を壊さない。

## デグレ対策

- `tests/projection-writer.test.ts` の runtime projection 既存ケースで、wrapper 経由の `test_runs` / `guardrail_decisions` / `skill_invocations` を検証する。
- `bun run src\\cli.ts db rebuild --json` で full rebuild の projection fixed point を確認する。
- `bun run src\\cli.ts doctor` と Pack `setup --solo` / `doctor --setup-smoke` で clean distribution でも同じ projection surface が壊れていないことを確認する。
