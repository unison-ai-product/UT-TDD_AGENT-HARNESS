---
plan_id: PLAN-L7-80-session-digest-event-watermark
title: "PLAN-L7-80 (troubleshoot): plan digest counts incremental events via a per-session high-watermark so a re-summarized session is not under-counted"
kind: troubleshoot
layer: L7
drive: agent
status: confirmed
created: 2026-06-19
updated: 2026-06-19
backprop_decision: not_required
backprop_decision_reason: "Internal harness self-application tooling (lint gate / runtime dispatch / guard / governance mechanism); hardens the harness's own enforcement and does not change the product's external requirement / design / test-design contract, so there is no upstream backprop target."
owner: Claude TL
review_evidence:
  - reviewer: codex-gpt-5
    review_kind: cross_agent
    reviewed_at: "2026-06-19"
    tests_green_at: "2026-06-19"
    verdict: pass
    scope: "compressPlanDigest replaced whole-session folding (which dropped every event of a session already in base.sessions) with a per-session count high-watermark (session_watermarks[sid]). A session summarized more than once (multiple Stop hooks growing the append-only per-session log) now counts only events beyond its watermark instead of dropping them all. A migration path seeds watermarks from updated_at for pre-L7-80 digests (events with ts <= updated_at for already-folded sessions are treated as already counted). Codex cross-review (claude-opus-4-8 worker, codex-gpt-5 reviewer) verdict pass: single-call and same-batch re-application stay idempotent, migration does not double-count, genuinely-new events are counted. Documented risks: the fix relies on the caller passing the complete per-session log in append-only file order (onSessionEnd reads the whole session jsonl, so this holds) and on chronological append order matching file order. Oracle U-SLOG-008 covers multi-stop increment, idempotent re-apply, and migration."
    worker_model: claude-opus-4-8
    reviewer_model: codex-gpt-5
agent_slots:
  - role: tl
    slot_label: "TL - session digest event-level high-watermark fix"
generates:
  - artifact_path: docs/plans/PLAN-L7-80-session-digest-event-watermark.md
    artifact_type: markdown_doc
  - artifact_path: src/runtime/session-log.ts
    artifact_type: source_module
  - artifact_path: tests/session-log.test.ts
    artifact_type: test_code
  - artifact_path: docs/test-design/harness/L7-unit-test-design.md
    artifact_type: test_design
  - artifact_path: docs/design/harness/L6-function-design/session-log.md
    artifact_type: design_doc
dependencies:
  parent: docs/plans/PLAN-L7-44-harness-db-master.md
  requires:
    - docs/plans/PLAN-L7-01-session-log.md
    - docs/plans/PLAN-L7-04-handover-mechanism.md
    - docs/governance/ut-tdd-agent-harness-requirements_v1.2.md
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
related_l0: docs/governance/ut-tdd-agent-harness-concept_v3.1.md
---

# PLAN-L7-80 (troubleshoot): session digest event-level high-watermark

## 0. Objective

`compressPlanDigest` folded a whole session: once a `session_id` was in
`base.sessions` (from a prior digest), the loop `if (folded.has(ev.session_id))
continue` skipped every event of that session. Because the Stop hook
(`onSessionEnd`) re-reads the full per-session log and re-runs the digest, a
session that hits Stop more than once dropped all the events appended between the
first and later Stops — an under-count of the PLAN digest (event_counts,
files_touched, commits, failures).

## 1. Scope

In scope:

- Add `session_watermarks?: Record<string, number>` to `PlanDigest`: per-session
  count of matching events already folded into the digest.
- `compressPlanDigest` counts an event only when its in-session index is at or
  beyond the session watermark, then advances the watermark. Events are read in
  append-only file order (= chronological = count order), so the index is stable.
- Migration: a pre-L7-80 digest has no `session_watermarks`. Seed them from
  `updated_at` (events with `ts <= updated_at` for already-folded sessions are the
  contiguous leading already-counted events) so they are not re-counted.

Out of scope:

- Changing the digest consumer (handover scaffold) or DB projection schema.
- Cross-session ordering (each session's events live only in its own log).

## 2. Acceptance Criteria

- A session summarized twice (log grew between Stops) counts the incremental
  events (not 0); `session_watermarks` advances to the new count.
- Single-call and same-batch re-application stay idempotent (no double count).
- A pre-L7-80 digest (no `session_watermarks`) migrates without re-counting the
  events already reflected in it, while counting genuinely-new events.
- Existing U-SLOG-003 stays green; typecheck, lint, full Vitest, and
  `ut-tdd doctor` stay green.

## 3. Test Design Pairing

Unit test design entry: `docs/test-design/harness/L7-unit-test-design.md`
(U-SLOG-008). Red->Green: pre-fix the second summarize of a session drops the
incremental events (under-count); post-fix the high-watermark counts the
increment and the migration path avoids double-counting.

## 4. Status

Confirmed. Implemented and cross-reviewed 2026-06-19. Disposition (D#3) was
TL-approved before implementation; the concrete diff was Codex cross-reviewed
(verdict pass) with the caller-invariant (complete per-session log, append-only
file order) documented.
