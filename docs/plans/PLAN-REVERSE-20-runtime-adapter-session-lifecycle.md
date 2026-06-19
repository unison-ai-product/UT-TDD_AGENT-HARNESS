---
plan_id: PLAN-REVERSE-20-runtime-adapter-session-lifecycle
title: "PLAN-REVERSE-20 (reverse): runtime adapter session lifecycle back-fill"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: fullback
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
review_evidence:
  - reviewer: claude-pmo-sonnet
    review_kind: cross_agent
    reviewed_at: "2026-06-09T10:57:49+09:00"
    tests_green_at: "2026-06-09T10:55:36+09:00"
    verdict: approve
    worker_model: codex-gpt-5
    reviewer_model: claude-pmo-sonnet
    scope: "PLAN-L6-20/L7-21/REVERSE-20 runtime adapter lifecycle; Critical/High/Important 0 after follow-up review."
forward_routing: L4
promotion_strategy: reuse-as-is
agent_slots:
  - role: tl
    slot_label: "TL - adapter surface back-fill review"
generates:
  - artifact_path: docs/design/harness/L4-basic-design/function.md
    artifact_type: design_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-L7-21-runtime-adapter-session-lifecycle.md
  requires:
    - docs/plans/PLAN-L7-21-runtime-adapter-session-lifecycle.md
---

# PLAN-REVERSE-20 (reverse): runtime adapter session lifecycle back-fill

## §0 位置づけ

`PLAN-L7-21` の implementation fact を上位設計へ戻す reverse/fullback。provider delegation surface は L4 function design の runtime building block に属するため、`forward_routing=L4` とする。requirements 側は既存 §6.8 / §6.9 の運用観測・CI dogfood の詳細化に留め、新規 FR は起こさない。

## §1 R0-R4

| phase | work | result |
|---|---|---|
| R0 evidence | `src/cli.ts`, `src/runtime/adapter.ts`, `src/runtime/session-log.ts`, `.claude/settings.json`, `tests/runtime-hook-entrypoints.test.ts`, `tests/runtime-adapter.test.ts` | shared CLI hook and adapter wrapper are implemented |
| R1 observed contract | Initial observed contract: Codex provider args = `exec <task>`; Claude provider args = `--print -p <task>`; `--plan` is harness metadata only. Current contract after PLAN-L7-77 / PLAN-L7-78: Codex=`exec -`, Claude=`--print --input-format text`, prompt body in `AdapterPlan.stdin`. | provider boundary is explicit |
| R2 as-is | L4 function doc did not fully describe `--task-file`, print-mode Claude, or plan metadata separation | design drift identified |
| R3 intent | This is an adapter surface correction, not a new top-level requirement. Existing FR-L1-42 / §6.8 / §6.9 absorb the change. | no new FR |
| R4 routing | Back-fill to L4 function doc and L7 unit test design; requirements note remains within existing progress / CI governance | reuse-as-is |

## §2 工程表

### Step 1: [並列] R0 evidence collection

Implementation and tests are listed as evidence.

### Step 2: [直列] L4 function design back-fill

直列理由: downstream_dependency。R0 observed contract must be known before documenting provider surface.

### Step 3: [直列] test design back-fill

直列理由: downstream_dependency。U-SLOG / U-ADAPTER oracle must reflect the documented provider surface.

### Step 4: [直列] review

直列理由: downstream_dependency。Back-fill is reviewed after tests and doctor are green.

## §6 用語更新

- adapter lifecycle wrapper: provider invocation wrapped by session-log lifecycle events.
- plan metadata separation: harness plan id is not forwarded to provider CLIs.

## §8 DoD

- [x] L4 function design documents provider args, `--task-file`, and plan metadata separation.
- [x] L7 unit test design contains U-SLOG-007 and U-ADAPTER-001 oracle.
- [x] L0 §10 glossary contains shared hook entrypoint / adapter lifecycle wrapper / plan metadata separation.
- [x] Reverse requires `PLAN-L7-21`, so add-impl is not orphaned.
- [x] typecheck / full vitest / doctor / review are green.
