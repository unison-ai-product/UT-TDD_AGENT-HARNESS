---
plan_id: PLAN-L7-170-external-review-remediation
title: "PLAN-L7-170 (troubleshoot): external review remediation and digest rebinding"
kind: troubleshoot
layer: L7
drive: be
status: confirmed
created: 2026-06-26
updated: 2026-06-26
owner: Codex / PO
backprop_decision: not_required
backprop_decision_reason: "Internal harness tooling remediation; no external requirement, design, or test-design contract change."
agent_slots:
  - role: aim
    slot_label: "AIM - external review finding reproduction and remediation plan"
  - role: se
    slot_label: "SE - remediation implementation, regression tests, and digest rebinding"
  - role: tl
    slot_label: "TL - cross-runtime desk review"
generates:
  - artifact_path: docs/plans/PLAN-L7-170-external-review-remediation.md
    artifact_type: markdown_doc
  - artifact_path: src/setup/index.ts
    artifact_type: source_module
  - artifact_path: src/cli.ts
    artifact_type: source_module
  - artifact_path: src/lint/runtime-portability.ts
    artifact_type: source_module
  - artifact_path: .claude/hooks/work-guard.ts
    artifact_type: hook
  - artifact_path: tests/setup.test.ts
    artifact_type: test_code
  - artifact_path: tests/cli-surface.test.ts
    artifact_type: test_code
  - artifact_path: tests/runtime-portability.test.ts
    artifact_type: test_code
  - artifact_path: tests/work-guard.test.ts
    artifact_type: test_code
dependencies:
  parent: null
  requires: []
  blocks: []
  references:
    - docs/plans/PLAN-L7-114-work-guard.md
    - docs/plans/PLAN-L7-131-plan-complete-handover.md
    - docs/plans/PLAN-L7-138-quality-branch-audit.md
    - docs/plans/PLAN-L7-139-codex-hook-adapter.md
    - docs/plans/PLAN-L7-158-refactor-detector-precision-and-policy-extraction.md
    - docs/plans/PLAN-L7-166-setup-template-catalog-split.md
    - docs/plans/PLAN-REVERSE-131-plan-complete-handover.md
review_evidence:
  - reviewer: codex
    review_kind: cross_agent
    reviewed_at: "2026-07-01T16:17:00+09:00"
    tests_green_at: "2026-07-01T16:16:00+09:00"
    verdict: approve
    scope: "External review remediation for setup dry-run, execute-json contract, runtime portability fallback, work-guard marker one-shot, and coordinated digest rebinding."
    worker_model: claude-opus-4-8
    reviewer_model: gpt-5.5
    green_commands:
      - kind: unit_test
        command: "bun run vitest run tests/setup.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: tests/setup.test.ts
        output_digest: "sha256:78f08efa7a96688f5cf7dcf28c71d5876fe2e18d905a81c8ecab7484dc2e7cb4"
      - kind: unit_test
        command: "bun run vitest run tests/cli-surface.test.ts tests/distribution-acceptance.test.ts --reporter=dot"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-30T22:01:00+09:00"
        evidence_path: tests/cli-surface.test.ts
        output_digest: "sha256:40b2d026600e6bb6a989088a24b5594326f3a0decc9b01d9266b48ffe5ac4f3e"
      - kind: unit_test
        command: "bun run vitest run tests/runtime-portability.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-26T11:42:00+09:00"
        evidence_path: tests/runtime-portability.test.ts
        output_digest: "sha256:5792d29d443c60c5eb2fe686ed411d3c988bcda25e7d898cf93a0a065b70c632"
      - kind: unit_test
        command: "bun run vitest run tests/work-guard.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-26T11:43:00+09:00"
        evidence_path: tests/work-guard.test.ts
        output_digest: "sha256:5ff89dd03a0e6ec91733514d7c94ee10a7bf2dbe8b148a24c73d779a0681c35b"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/cli.ts
        output_digest: "sha256:eccbd8a33367495b48d5c6af7651194e11bd9579a3528a888c1dab912c6981b0"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/setup/index.ts
        output_digest: "sha256:da93c1807f89d1f411ba3de8c4b976282064d289b03eb36c20b7cebb596dd34f"
      - kind: typecheck
        command: "bun run typecheck"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-06-26T11:44:20+09:00"
        evidence_path: src/lint/runtime-portability.ts
        output_digest: "sha256:6bfff017db581847b6553b6edf208fd7a0285a420bac96322d7798b4cd12cfe6"
      - kind: unit_test
        command: "bun run vitest run tests/work-guard.test.ts"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-06-26T11:43:30+09:00"
        evidence_path: .claude/hooks/work-guard.ts
        output_digest: "sha256:5cd75baface268cb4cb817ee1b205a792714447361241a2ae5e6825866fe0b91"
      - kind: lint
        command: "bun run lint"
        runner: bun
        scope: full
        exit_code: 0
        completed_at: "2026-07-01T16:15:21+09:00"
        evidence_path: src/setup/index.ts
        output_digest: "sha256:da93c1807f89d1f411ba3de8c4b976282064d289b03eb36c20b7cebb596dd34f"
---

# PLAN-L7-170: external review remediation

## 目的

外部 review が指摘した 4 件の remediation と green-command digest 整合を、実 repo の検証 evidence に束ねる。

## 対象所見

- relation graph / review evidence の projection gap。
- clean distribution と setup 導線の不足。
- green command digest の stale restamp 化リスク。
- coding/document substance と coverage の取り違え。

## 方針

hash 一致だけを completion evidence とせず、対象テスト、lint、typecheck、doctor の実行と PLAN evidence を同じ検証サイクルに束ねる。

## Definition of Done

- 指摘対象の regression test が通る。
- `green-command-digest` が mismatch 0 である。
- review evidence の時刻順が `tests_green_at <= reviewed_at` を満たす。
