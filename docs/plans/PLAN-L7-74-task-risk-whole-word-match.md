---
plan_id: PLAN-L7-74-task-risk-whole-word-match
title: "PLAN-L7-74 (troubleshoot): whole-word escalation-risk matching in task classify"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-17
updated: 2026-06-17
backprop_decision: not_required
backprop_decision_reason: "Internal harness self-application tooling (lint gate / runtime dispatch / guard / governance mechanism); hardens the harness's own enforcement and does not change the product's external requirement / design / test-design contract, so there is no upstream backprop target."
owner: PM (Opus) / PO (人間)
review_evidence:
  - reviewer: claude-opus-4-8
    review_kind: intra_runtime_subagent
    reviewed_at: "2026-06-17"
    tests_green_at: "2026-06-17"
    verdict: pass
    scope: "Fix false-positive escalation-risk flags in classifyTask: substring matching flagged 'production' inside 'reproduction', 'schema' inside 'schematic', and 'secret' inside 'secretary'. Replaced with whole-word + optional-plural regex so the safety signal keeps plurals (credentials/payments/schemas) but stops over-flagging innocent words. PM verified via tsc, Biome, 2 new Vitest cases (false-positive guard + plural coverage), full regression, and doctor. Warn-only safety surface; no public signature change, no Reverse pairing required."
    worker_model: claude-opus-4-8
    reviewer_model: claude-opus-4-8
agent_slots:
  - role: tl
    slot_label: "TL - task risk whole-word matching"
generates:
  - artifact_path: docs/plans/PLAN-L7-74-task-risk-whole-word-match.md
    artifact_type: markdown_doc
  - artifact_path: src/task/classify.ts
    artifact_type: source_module
  - artifact_path: tests/task-classify.test.ts
    artifact_type: test_code
dependencies:
  parent: docs/plans/PLAN-L7-72-task-classify-cli.md
  requires:
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
    - docs/adr/ADR-001-ut-tdd-harness-redesign-and-language.md
  references:
    - docs/design/harness/L6-function-design/function-spec.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
---

# PLAN-L7-74: whole-word escalation-risk matching in task classify

## 0. Objective

Stop `ut-tdd task classify` from raising spurious `escalation-risk` warnings on
task text that merely contains a risk term as a substring, so the safety signal
stays trustworthy (over-flagging causes alert fatigue and erodes the escalation
boundary).

## 1. Problem

`riskFlags` matched each `RISK_TERMS` entry with `lower.includes(term)`. Because
some canonical risk terms are substrings of innocent words, this produced false
positives:

- `production` matched inside `reproduction`;
- `schema` matched inside `schematic`;
- `secret` matched inside `secretary`.

This is the same false-positive class the bare-`auth`/`author` exclusion already
guards against, but it cannot be fixed by lengthening the terms — `production` /
`schema` / `secret` are the words we want to match.

## 2. Scope

Allowed changes:

- replace substring matching in `src/task/classify.ts` `riskFlags` with
  precompiled whole-word regexes (`\b<term>s?\b`, case-insensitive);
- keep an optional trailing plural so safety-relevant plurals (credentials,
  payments, schemas, migrations) stay flagged — a safety signal must not regress
  into false negatives;
- Vitest coverage for the false-positive guard and the plural coverage.

Out of scope:

- the `inferKind` / drive / size heuristics;
- the public `classifyTask` signature or CLI I/O;
- adding or removing risk terms.

## 3. Acceptance Criteria

- `reproduction` / `schematic` / `secretary` text raises no `risk_flags` and no
  `escalation-risk` finding.
- `authentication` / `payment` / `schema` (and their plurals `credentials` /
  `payments` / `schemas`) still flag.
- Classification stays deterministic.
- typecheck / Biome / Vitest / `ut-tdd doctor` stay green; the src file traces to
  this PLAN's `generates`.

## 4. Verification

- `bunx vitest run tests/task-classify.test.ts`
- `bun run typecheck`
- `bun run lint`
- `bun run test`
- `bun run src\\cli.ts doctor`

## 5. Status

Draft. Implemented and verified 2026-06-17. Warn-only safety surface, no contract
change, so no Reverse back-fill is required.
