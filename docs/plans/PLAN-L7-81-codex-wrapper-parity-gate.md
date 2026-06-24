---
plan_id: PLAN-L7-81-codex-wrapper-parity-gate
title: "PLAN-L7-81 (troubleshoot): doctor hard gate proves Claude-hook / Codex-wrapper parity so the stdin dispatch contract cannot silently regress"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-19
updated: 2026-06-19
backprop_decision: not_required
backprop_decision_reason: "Internal harness self-application tooling (lint gate / runtime dispatch / guard / governance mechanism); hardens the harness's own enforcement and does not change the product's external requirement / design / test-design contract, so there is no upstream backprop target."
owner: Codex TL
review_evidence:
  - reviewer: claude-opus-4-8
    review_kind: cross_agent
    reviewed_at: "2026-06-19"
    tests_green_at: "2026-06-19"
    verdict: pass
    scope: "Codex (worker) added checkCodexWrapperParity to src/doctor/index.ts: a doctor hard gate that verifies the two provider integration paths stay in parity — Claude runs via project .claude/settings.json hooks (the 3 session/hook commands present), and Codex parity is provided by the ut-tdd wrapper lifecycle tests + stdin adapter oracles (codex --execute/--task-file/--plan lifecycle test names present, adapter uses `exec -` stdin sentinel + stdin:intent.task + plan_id:intent.planId, U-ADAPTER-007/008 cited, U-ADAPTER-009 documented). Claude (reviewer) cross-review verdict pass: the gate is wired into runDoctor.ok (hard fail-close, src/doctor/index.ts:1428) and its messages surfaced; U-ADAPTER-009 is cited by tests/doctor.test.ts (OK + fail-closed-when-missing + missing-root cases); function-spec and L7-unit-test-design back-fill present; typecheck + biome + full Vitest 727/727 + doctor green. Gap closed by reviewer: Codex shipped impl/test/design/test-design but not this PLAN file (the test-design already referenced \"PLAN-L7-81\"), so the gate was an orphan-impl against the harness's own impl-plan-trace discipline; this PLAN restores the trace."
    worker_model: codex-gpt-5
    reviewer_model: claude-opus-4-8
agent_slots:
  - role: tl
    slot_label: "TL - codex/claude wrapper parity doctor gate"
generates:
  - artifact_path: docs/plans/PLAN-L7-81-codex-wrapper-parity-gate.md
    artifact_type: markdown_doc
  - artifact_path: src/doctor/index.ts
    artifact_type: source_module
  - artifact_path: tests/doctor.test.ts
    artifact_type: test_code
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/design/harness/L6-function-design/function-spec.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L7-44-harness-db-master.md
  requires:
    - docs/plans/PLAN-L7-77-codex-stdin-prompt-dispatch.md
    - docs/plans/PLAN-L7-78-claude-stdin-prompt-dispatch.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-81 (troubleshoot): codex/claude wrapper parity doctor gate

## 0. Objective

PLAN-L7-77 / PLAN-L7-78 moved both provider prompts onto stdin and PLAN-L7-21
made Claude run through project `.claude/settings.json` hooks while Codex runs
through the `ut-tdd codex --execute` wrapper. Nothing machine-verified that these
two integration paths stay in parity: a future edit could drop a Claude hook
command, revert the adapter to argv prompts, or delete a Codex wrapper lifecycle
test, and every existing gate would stay green. That is the false-confidence
class this harness is built to remove, applied to its own provider boundary.

## 1. Scope

In scope:

- `checkCodexWrapperParity(deps)` in `src/doctor/index.ts`, wired into
  `runDoctor.ok` as a hard gate and surfaced in doctor messages.
- It fail-closes when any parity evidence is missing or unreadable:
  - `.claude/settings.json` is valid JSON and contains the 3 Claude hook commands
    (`session start` / `hook post-tool-use` / `session summary`).
  - `src/runtime/adapter.ts` keeps the stdin contract (`exec -` sentinel,
    `stdin: intent.task`, `plan_id: intent.planId`).
  - `tests/runtime-hook-entrypoints.test.ts` keeps the 3 Codex wrapper lifecycle
    tests; `tests/runtime-adapter.test.ts` cites U-ADAPTER-007/008.
  - `docs/test-design/harness/L7-unit-test-design.md` documents U-ADAPTER-009.
- Oracle U-ADAPTER-009 + function-spec row for the new check.

Out of scope:

- Changing the stdin dispatch behaviour itself (owned by PLAN-L7-77/78).
- Live provider execution.

## 2. Acceptance Criteria

- `doctor` surfaces `codex-wrapper-parity - OK` when parity holds and fail-closes
  (runDoctor.ok=false) when any side is missing.
- U-ADAPTER-009 is cited by a real test (OK case + missing-evidence fail-close).
- typecheck, lint, full Vitest, and doctor stay green.

## 3. Test Design Pairing

Unit test design entry: `docs/test-design/harness/L7-unit-test-design.md`
(U-ADAPTER-009). Red->Green: pre-gate a dropped hook / reverted adapter / deleted
wrapper test passes doctor; post-gate it fail-closes.

## 4. Status

Confirmed. Implemented by Codex and cross-reviewed by Claude 2026-06-19 (codex→
claude). The gate is a hard doctor check wired into runDoctor.ok. This PLAN file
was authored by the reviewer to close the orphan-impl gap (Codex had shipped the
impl/test/design without the PLAN the test-design already referenced).
