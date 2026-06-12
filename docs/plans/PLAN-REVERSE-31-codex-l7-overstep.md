---
plan_id: PLAN-REVERSE-31-codex-l7-overstep
title: "PLAN-REVERSE-31 (reverse): Codex L7 overstep recovery fullback"
kind: reverse
layer: cross
workflow_phase: R4
confirmed_reverse_type: fullback
drive: fullstack
status: confirmed
created: 2026-06-09
updated: 2026-06-09
owner: Codex TL / PO
forward_routing: L5
promotion_strategy: reuse-as-is
agent_slots:
  - role: tl
    slot_label: "TL - Recovery fullback"
generates:
  - artifact_path: docs/plans/PLAN-REVERSE-31-codex-l7-overstep.md
    artifact_type: markdown_doc
  - artifact_path: docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    artifact_type: markdown_doc
  - artifact_path: docs/improvement-backlog.md
    artifact_type: markdown_doc
  - artifact_path: docs/process/modes/recovery.md
    artifact_type: markdown_doc
dependencies:
  parent: docs/plans/PLAN-RECOVERY-03-codex-l7-overstep.md
  requires:
    - docs/plans/PLAN-RECOVERY-03-codex-l7-overstep.md
    - .ut-tdd/audit/A-124-cross-artifact-graph-tooling.md
    - .ut-tdd/audit/A-125-mcp-external-verification-profile-scope.md
review_evidence:
  - reviewer: PO/directive
    review_kind: human
    tests_green_at: "2026-06-09T00:00:00+09:00"
    reviewed_at: "2026-06-09T00:00:00+09:00"
    verdict: approve
    scope: "User directed Recovery and Reverse fullback for the Codex L7 overstep; this PLAN records the back-propagation route."
---

# PLAN-REVERSE-31 (reverse): Codex L7 overstep recovery fullback

## §0 Position

This is the Reverse fullback for PLAN-RECOVERY-03. The observed fact is not a product feature: Codex started a source implementation for relation graph scope without L6/L7 entry. The source file was removed. The remaining work is to return the process gap to the upper governance layer.

## §1 R0 Evidence

| evidence | content |
|---|---|
| User correction | "Recovery 起票" and "リバースでちゃんと戻して" directed the route back to the official workflow. |
| Overstep artifact | `src/lint/relation-graph.ts` was added without L6/L7 entry, then removed. |
| Existing intended scope | A-124 / IMP-118..120 already classify relation graph and diagram tooling as future L6/L7 scope. |

## §2 R1 Observed Gap

- Existing §6.8.8 requires lower-layer discoveries to back-propagate, but did not explicitly name **unapproved L7 source work** as a Recovery + Reverse case.
- This allowed the agent to treat an active goal as permission to cross into L7 implementation.

## §3 R2 Alignment

The correct design alignment is:

- Recovery handles the agent overstep and reopen point.
- Reverse fullback records the process rule in requirements / backlog / recovery workflow.
- A-124 relation graph remains future L6/L7 work; no source implementation is authorized by this Reverse.

## §4 R3 Intent

Intent holds: the user is not asking for a narrower status note. The user is requiring the process gap to be returned through the official route. Therefore this Reverse records the rule and prevents the Recovery from remaining a local note.

## §5 R4 Routing

| target | action |
|---|---|
| `docs/governance/ut-tdd-agent-harness-requirements_v1.2.md` §6.8.8 | Add unapproved L7 source-work handling as Recovery + Reverse fullback. |
| `docs/improvement-backlog.md` | Register IMP-125 for future doctor / plan-lint guard. |
| `docs/process/modes/recovery.md` | Register PLAN-RECOVERY-03 as confirmed Recovery in the application log. |

## §8 DoD

- [x] Recovery record exists and is confirmed for correction routing.
- [x] Requirements contain the unapproved L7 handling rule.
- [x] Backlog contains a guard implementation item.
- [x] Recovery mode application log references PLAN-RECOVERY-03.
- [x] No source implementation is introduced by this Reverse.
