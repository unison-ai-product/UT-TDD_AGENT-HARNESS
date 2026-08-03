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
status: draft
created: 2026-08-03
updated: 2026-08-03
owner: Codex / TL
parent_design: docs/plans/PLAN-L7-472-claude-memory-async-wake.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
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
review_evidence: []
---

# PLAN-REVERSE-472: Claude memory async wake設計backfill

## R0-R4

- R0: HELIX参考実装とUT-TDD現行memory/hookを観測し、即時配送欠落を確定する。
- R1: authored memory、runtime inbox、Claude session、D3c信頼根の責務を分離する。
- R2: U-MEMWAKE-001〜005とhook/setup/project-hook回帰を追加する。
- R3: 実通知E2Eとcross-family reviewでdata fence・重複配送・権威混同を検証する。
- R4: `memory.md`とL7 unit-test designへ契約を合流しForwardへ戻す。

## 完了条件

- [ ] L6 memory設計とL7 oracleが同一配送契約を持つ。
- [ ] PLAN-L7-472の実装が上記契約へtraceされる。
