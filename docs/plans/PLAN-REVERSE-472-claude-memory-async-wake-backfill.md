---
plan_id: PLAN-REVERSE-472-claude-memory-async-wake-backfill
title: "PLAN-REVERSE-472: Claude memory async wake設計backfill"
kind: reverse
layer: cross
drive: agent
workflow_phase: R4
confirmed_reverse_type: fullback
forward_routing: L5
promotion_strategy: reuse-with-hardening
route_signal: reverse
route_mode: reverse
status: confirmed
created: 2026-08-03
updated: 2026-08-03
owner: Codex / TL
parent_design: docs/plans/PLAN-L7-472-claude-memory-async-wake.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
backprop_scope:
  - layer: requirements
    decision: not_impacted
    reason: "既存の共有メモリ要件を変更せず、稼働中Claude sessionへの配送方式だけを補完する。"
  - layer: L4-basic-design
    decision: not_impacted
    reason: "外部機能境界とcomponent責務は変更せず、memory内部の詳細配送契約に閉じる。"
  - layer: L5-detailed-design
    decision: updated
    evidence_path: docs/design/harness/L6-function-design/memory.md
    reason: "Git共通dir inbox、VS Code identity、workspace束縛、asyncRewakeの詳細契約を追加した。"
agent_slots:
  - role: se
    slot_label: "SE - 実装からL6 memory契約へ差分をbackfill"
  - role: qa
    slot_label: "QA - L6/L7対と通知・権威分離を検証"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-472-claude-memory-async-wake-backfill.md
    artifact_type: markdown_doc
  - artifact_path: docs/design/harness/L6-function-design/memory.md
    artifact_type: design_doc
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
dependencies:
  parent: docs/plans/PLAN-L7-472-claude-memory-async-wake.md
  requires: []
  blocks: []
  references:
    - docs/design/harness/L6-function-design/memory.md
    - docs/test-design/harness/L7-unit-test-design.md
review_evidence:
  - reviewer: claude-opus-5-blind-reviewer
    review_kind: cross_agent
    reviewed_at: "2026-08-03T11:19:43Z"
    tests_green_at: "2026-08-03T11:19:00Z"
    verdict: pass
    worker_model: gpt-5.6-luna
    reviewer_model: claude-opus-5
    lane: claim-blind
    subject_head: f8bcfb3a004978516f9294fb341b7b4d260c364a
    scope: "PR #220 exact HEAD f8bcfb3a。L6 memory契約、U-MEMWAKE-001〜007、Forward PLANの対応とRuntime E2E 3本をClaude Opus 5がdelta再判定しPASS。"
    citations:
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/220#issuecomment-5165446977
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/220#issuecomment-5165586153
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/220#issuecomment-5165635509
      - https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/220#issuecomment-5165655786
    green_commands:
      - kind: integration_test
        command: "bunx vitest run tests/claude-memory-wake.test.ts tests/runtime-hook-entrypoints.test.ts tests/cli-delegation.test.ts（Claude reviewerが実VS Code session環境で22/22 passを実走）"
        runner: bun
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-03T11:19:00Z"
        evidence_path: tests/runtime-hook-entrypoints.test.ts
        output_digest: "sha256:d3554d7686ffc50454c91bade40427786c2b1cfe9466f2564e4fcb889a51f3dc"
        anchor_commit: f8bcfb3a004978516f9294fb341b7b4d260c364a
      - kind: smoke
        command: "PR worktree publish -> main workspace hook exit 0 -> target workspace hook exit 2（WORKSPACE_ISOLATION_E2E）"
        runner: powershell
        scope: targeted
        exit_code: 0
        completed_at: "2026-08-03T11:17:26Z"
        evidence_path: docs/design/harness/L6-function-design/memory.md
        output_digest: "sha256:04e5a8259f4aff2f24ebc2d8e27728160db6e4ae5c384e926344ed2dc66e6c2b"
        anchor_commit: f8bcfb3a004978516f9294fb341b7b4d260c364a
---

# PLAN-REVERSE-472: Claude memory async wake設計backfill

## R0-R4

- R0: HELIX参考実装とUT-TDD現行memory/hookを観測し、即時配送欠落を確定する。
- R1: authored memory、runtime inbox、Claude session、D3c信頼根の責務を分離する。
- R2: U-MEMWAKE-001〜007とhook/setup/project-hook回帰を追加する。
- R3: 実通知E2Eとcross-family reviewでdata fence・重複配送・権威混同を検証する。
- R4: `memory.md`とL7 unit-test designへ契約を合流しForwardへ戻す。

## 完了条件

- [x] L6 memory設計とL7 oracleが同一配送契約を持つ。
- [x] PLAN-L7-472の実装が上記契約へtraceされる。
