---
plan_id: PLAN-L7-209-governance-relation-graph-projection
title: "PLAN-L7-209: Governance docs relation graph projection"
kind: impl
layer: L7
drive: agent
status: confirmed
created: 2026-06-30
updated: 2026-06-30
owner: Codex
parent_design: docs/plans/PLAN-L7-32-cross-artifact-relation-graph.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
backprop_decision: not_required
backprop_decision_reason: "This closes a relation-graph projection gap for already tracked governance docs; it does not change product requirements."
agent_slots:
  - role: qa
    slot_label: "QA - governance missing-projection regression"
  - role: tl
    slot_label: "TL - relation graph projection review"
generates:
  - artifact_path: docs/plans/PLAN-L7-209-governance-relation-graph-projection.md
    artifact_type: markdown_doc
  - artifact_path: .ut-tdd/audit/A-149-governance-relation-graph-feedback.md
    artifact_type: markdown_doc
  - artifact_path: src/graph/loader.ts
    artifact_type: source_module
  - artifact_path: tests/relation-graph-loader.test.ts
    artifact_type: test_code
dependencies:
  requires:
    - docs/plans/PLAN-L7-32-cross-artifact-relation-graph.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-30T18:17:00+09:00"
    tests_green_at: "2026-06-30T18:17:00+09:00"
    verdict: approve
    scope: "Materialize governance docs and root runtime policy docs as relation graph design nodes so policy/doc changes do not emit missing-projection feedback."
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\relation-graph-loader.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T18:17:00+09:00"
        evidence_path: tests/relation-graph-loader.test.ts
        output_digest: "sha256:a908543ff9311bf2418ba5df9d4eca41522aae4ac24a67e5bf935ffbd4dab907"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-30T18:17:00+09:00"
        evidence_path: src/graph/loader.ts
        output_digest: "sha256:6fe7f7a2cb52a2aa7445d9877d93e45763884736cfcec82661641e0de3afc939"
---

# PLAN-L7-209: governance relation graph projection

## 背景

`harness.db` feedback が `docs/governance/*.md` の変更に対して `missing-projection` を出した。governance docs は設計/運用の正本であり、relation graph node として扱う必要がある。

## 範囲

`src/graph/loader.ts` で `docs/governance/**/*.md` を design node として materialize し、`tests/relation-graph-loader.test.ts` の fixture と real-repo regression fence で確認する。

## 受け入れ条件

- governance doc の変更が `missing-projection` にならない。
- relation graph loader test が通る。
- DB rebuild と feedback emit で gate error が残らない。
