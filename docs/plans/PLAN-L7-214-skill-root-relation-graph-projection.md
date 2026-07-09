---
plan_id: PLAN-L7-214-skill-root-relation-graph-projection
title: "PLAN-L7-214: skill root relation graph projection"
kind: impl
layer: L7
drive: fullstack
status: confirmed
created: 2026-07-01
updated: 2026-07-01
owner: Codex
route_signal: feature_addition
route_mode: add-feature
parent_design: docs/design/harness/L6-function-design/skill-index.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
backprop_decision: not_required
backprop_decision_reason: "skill catalog の root 配置を relation graph projection に反映する既存境界の materialization であり、新しい要求や persisted schema は追加しない。"
agent_slots:
  - role: qa
    slot_label: "QA - skill root relation graph projection"
  - role: tl
    slot_label: "TL - relation graph projection review"
generates:
  - artifact_path: docs/plans/PLAN-L7-214-skill-root-relation-graph-projection.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/skill-index.md
    artifact_type: design_doc
  - artifact_path: src/graph/loader.ts
    artifact_type: source_module
  - artifact_path: tests/relation-graph-loader.test.ts
    artifact_type: test_code
dependencies:
  requires:
    - docs/plans/PLAN-L7-32-cross-artifact-relation-graph.md
    - docs/plans/PLAN-L7-213-project-local-setup-wrapper.md
review_evidence:
  - reviewer: codex-intra-runtime
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-07-01T16:17:00+09:00"
    tests_green_at: "2026-07-01T16:16:00+09:00"
    verdict: approve
    scope: "root skills 配置を relation graph の design-like node として投影し、skills/SKILL_MAP.md の変更が missing-projection にならないことを確認する。"
    worker_model: codex
    reviewer_model: codex-intra-runtime
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests\\relation-graph-loader.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T14:59:37+09:00"
        evidence_path: tests/relation-graph-loader.test.ts
        output_digest: "sha256:e42d9d2be60e6b383cc51c291009e3e8104f2c60db8dca17737be0cfb3eb34d6"
        anchor_commit: fe54ac5e76e5785f8dd74de02528c1bff367c880
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T15:00:00+09:00"
        evidence_path: src/graph/loader.ts
        output_digest: "sha256:7a231cb642507d46f961e0b38fbbd6807c908a3305831a79f235adcbe3152902"
        anchor_commit: fe54ac5e76e5785f8dd74de02528c1bff367c880
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: docs/design/harness/L6-function-design/skill-index.md
        output_digest: "sha256:99f20045a262862f3f9756694cbe755819af9334668a6afe0cf2e9b43d10e18f"
        anchor_commit: e468ece632d7fd29c4dd3dbef301c2b38e847082
---

# PLAN-L7-214: skill root relation graph projection

## 背景

配布物の見え方を整理するため、skill catalog の正規配置は `docs/skills/` ではなく root `skills/` になった。`skills/` は agent が読む runtime asset であり、変更時に relation graph の影響分析から抜けると、Pack と consumer project の配布境界を検証できない。

## 範囲

`src/graph/loader.ts` は `skills/**/*.md` を design-like node として materialize する。`tests/relation-graph-loader.test.ts` は fixture と real-repo fence の両方で `skills/SKILL_MAP.md` が `design:skills/SKILL_MAP.md` になることを確認する。

## 非範囲

- relation graph schema は変更しない。
- `ut-tdd graph` CLI surface は変更しない。
- DB persisted schema は変更しない。
- `docs/skills/` を再び正規 root に戻さない。

## 受け入れ条件

- `skills/SKILL_MAP.md` の変更が `missing-projection` にならない。
- relation graph loader test が通る。
- typecheck、lint、doctor が通る。
