---
plan_id: PLAN-L7-206-governance-document-system-map-node
title: "PLAN-L7-206: relation graph node coverage for document-system-map"
kind: troubleshoot
layer: L7
drive: db
status: confirmed
created: 2026-06-30
updated: 2026-06-30
owner: Codex
parent_design: docs/plans/PLAN-L7-142-relation-graph-requirement-nodes.md
backprop_decision: not_required
backprop_decision_reason: "DB feedback exposed a loader projection coverage gap for docs/governance/document-system-map.md. The fix extends the existing governance-doc relation graph node allowlist; no public CLI/API, persisted schema, or workflow semantics changed."
agent_slots:
  - role: se
    slot_label: "SE - governance document relation graph coverage"
  - role: tl
    slot_label: "TL - DB feedback gate verification"
  - role: aim
    slot_label: "AIM - troubleshoot classification and closure"
generates:
  - artifact_path: docs/plans/PLAN-L7-206-governance-document-system-map-node.md
    artifact_type: markdown_doc
  - artifact_path: src/graph/loader.ts
    artifact_type: source_module
  - artifact_path: tests/relation-graph-loader.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-142-relation-graph-requirement-nodes.md
  requires:
    - docs/plans/PLAN-L7-142-relation-graph-requirement-nodes.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-01T16:17:00+09:00"
    tests_green_at: "2026-07-01T16:16:00+09:00"
    verdict: approve
    scope: "Relation graph loader now materializes docs/governance/document-system-map.md as a design-like node so DB feedback missing-projection gates are not silently bypassed."
    worker_model: codex-gpt-5
    reviewer_model: codex-gpt-5
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\relation-graph-loader.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: tests/relation-graph-loader.test.ts
        output_digest: "sha256:e42d9d2be60e6b383cc51c291009e3e8104f2c60db8dca17737be0cfb3eb34d6"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/graph/loader.ts
        output_digest: "sha256:7a231cb642507d46f961e0b38fbbd6807c908a3305831a79f235adcbe3152902"
---

# PLAN-L7-206: governance document system map node

## 背景

`docs/governance/document-system-map.md` は L0-L14 の成果物体系と V-pair を定義する正本であり、relation graph projection から欠けると workflow 定義の影響分析ができない。

## 範囲

relation graph loader が governance document system map を design node として materialize することを確認する。これにより workflow 定義や文書体系の変更が DB feedback で追跡可能になる。

## 受け入れ条件

- `docs/governance/document-system-map.md` の change impact が `missing-projection` にならない。
- relation graph loader test、typecheck、lint、DB rebuild、doctor strict telemetry provenance が通る。
