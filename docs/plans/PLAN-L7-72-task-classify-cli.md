---
plan_id: PLAN-L7-72-task-classify-cli
title: "PLAN-L7-72 (impl): ut-tdd task classify public CLI (FR-L1-39)"
kind: impl
layer: L7
drive: agent
parent_design: docs/design/harness/L6-function-design/function-spec.md
status: confirmed
created: 2026-06-17
updated: 2026-06-17
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: claude-opus-4-8
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-17"
    tests_green_at: "2026-06-17"
    verdict: pass
    scope: "ut-tdd task classify CLI lands over existing FR-L1-39/41 contracts (scoreTaskComplexity/classifyDrive) + inferTaskDifficulty, adding kind inference and escalation-risk flags. PM verified via tsc, Biome, 6 Vitest cases (kind/drive/risk/size/determinism, incl. the 'author' non-risk guard), CLI smoke, and doctor."
    worker_model: claude-opus-4-8
    reviewer_model: claude-opus-4-8
agent_slots:
  - role: tl
    slot_label: "TL - task classify CLI surface over existing contracts"
generates:
  - artifact_path: docs/plans/PLAN-L7-72-task-classify-cli.md
    artifact_type: markdown_doc
  - artifact_path: src/task/classify.ts
    artifact_type: source_module
  - artifact_path: tests/task-classify.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-71-slash-commands.md
  requires:
    - docs/design/harness/L6-function-design/function-spec.md
    - docs/migration/helix-fork-completion-plan.md
  references:
    - src/workflow/contracts.ts
    - src/team/model-policy.ts
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
related_l0_extra: docs/design/harness/L1-requirements/functional-requirements.md
---

# PLAN-L7-72 (impl): ut-tdd task classify public CLI

## 0. Objective

Close the fork plan §6 P0 (task classify) by exposing the public CLI surface
FR-L1-39 extended requires: `ut-tdd task classify` emitting structured
`kind / drive / size / complexity / difficulty / risk` for a task. The
underlying contracts already exist — `scoreTaskComplexity` (FR-L1-39),
`classifyDrive` (FR-L1-41), and `inferTaskDifficulty` — so this is a composing
module + CLI surface, not a new algorithm.

## 1. Problem

`src/workflow/contracts.ts` implements `scoreTaskComplexity` / `classifyDrive`
and `src/team/model-policy.ts` implements `inferTaskDifficulty`, but there is no
public `ut-tdd task` command. The FR-L1-39 extended requirement names
`ut-tdd task classify --text/--plan/--diff` as the public I/O that feeds plan
lint / gate / skill suggest. The fork plan §6 lists it as P0 pending.

## 2. Scope

- New `src/task/classify.ts` with `classifyTask(input)` composing the existing
  contracts + escalation-risk flagging (CLAUDE.md safety boundary) + kind
  inference.
- New `ut-tdd task classify` CLI command (`--text` / `--text-file` / `--plan` /
  `--files` / `--json`).
- Vitest coverage for drive/kind/size/risk determinism.

Out of scope (re-scoped defer per fork plan §8(2)): `ut-tdd task estimate`
enrichment, and the `ut-tdd scrum` / `ut-tdd reverse` runtime mode commands
(large mode state machines; lint already exists). Tracked in the fork plan.

## 3. Acceptance Criteria

- `ut-tdd task classify --text "..."` prints kind/drive/size/complexity/
  difficulty/risk and exits 0; `--json` emits the structured object.
- Escalation-sensitive tasks (auth/payments/PII/migration/schema/production)
  surface a `risk_flags` list and an `escalation-risk` warn finding.
- Classification is deterministic for a given input.
- typecheck / Biome / Vitest / `ut-tdd doctor` stay green; src file traces to
  this PLAN's `generates`.

## 4. Status

Draft. Implemented 2026-06-17.
