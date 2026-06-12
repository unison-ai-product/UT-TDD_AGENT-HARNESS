---
plan_id: PLAN-L7-34-tool-adapter-probes
title: "PLAN-L7-34 (add-impl): graph and diagram tool adapter probes"
kind: add-impl
layer: L7
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-11
owner: Codex TL / PO
review_evidence:
  - reviewer: code-reviewer
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-11"
    tests_green_at: "2026-06-11"
    verdict: pass
    scope: "U-TOOLADAPTER-001..010 promoted to green tests. Tool adapter catalog/probe/normalization/diagram refresh are implemented as pure functions. Critical 0 / Important 0. Missing packages/executables remain findings; no package install, external command execution, destructive auto-fix, or raw adapter output gate truth is introduced."
    worker_model: codex-gpt-5
    reviewer_model: codex-gpt-5-intra-runtime-review
agent_slots:
  - role: tl
    slot_label: "TL - tool adapter probe implementation"
  - role: qa
    slot_label: "QA - U-TOOLADAPTER oracle"
generates:
  - artifact_path: src/lint/tool-adapter.ts
    artifact_type: source_module
  - artifact_path: tests/tool-adapter.test.ts
    artifact_type: test_code
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
dependencies:
  parent: docs/plans/PLAN-L6-33-tool-adapter-probes.md
  requires:
    - docs/plans/PLAN-L6-33-tool-adapter-probes.md
    - docs/plans/PLAN-REVERSE-34-tool-adapter-probes.md
---

# PLAN-L7-34 (add-impl): graph and diagram tool adapter probes

## §0 Position

This is the future L7 implementation entry for optional graph/diagram tool adapter probes.

> **スコープ改訂 (2026-06-10 PO 決定、IMP-131)**: 実装対象を「adapter probe profile」から **`ut-tdd setup graph-tools [--with ...]` セットアップコマンド + layer-context アナウンス**へ変更 (理由・境界は PLAN-L6-33 §0 / IMP-131 / A-124 境界注記)。adapter は insight 系 (gate truth でない) のため profile 化せず、setup で opt-in した project にのみ薄い正規化を配線する。MCP/verification profile (マストツール系) はこの降格対象外。`first slice = dependency-cruiser + Knip + Mermaid`、`Madge / Graphviz DOT / D2 は --with で conditional`。

## §1 Entry Conditions

- PLAN-L6-33 has confirmed function contracts and U-TOOLADAPTER oracles.
- `tests/tool-adapter.test.ts` receives a TDD Red case before source changes.
- Optional adapters remain disabled until package/executable readiness is proven.

## §2 Scope

Allowed after entry conditions:

- pure adapter catalog and probe functions;
- normalization of bounded evidence into `tool_runs`, `dependency_edges`, `diagram_artifacts`, and findings;
- no implicit package install or destructive auto-fix.

## §8 DoD

- [x] Red test exists before source implementation.
- [x] U-TOOLADAPTER-001..010 pass.
- [x] typecheck, lint, and targeted tests pass before review.
- [x] Reverse fullback closes any lower-layer discoveries.
