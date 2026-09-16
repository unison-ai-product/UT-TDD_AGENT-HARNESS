---
memory_id: memory:feedback:po-2026-09-08-run-queued-opus-reviews-in-parallel-one-shot-marker-serialises-them-so-ut-tdd-allow-foreign-edit-1-scoped-to-reviewer-subprocesses-is-the-sanctioned-parallel-path--217db4e863f8
kind: feedback
title: "PO 2026-09-08: run queued Opus reviews in parallel; one-shot marker serialises them, so UT_TDD_ALLOW_FOREIGN_EDIT=1 scoped to reviewer subprocesses is the sanctioned parallel path"
tags: ["parallel", "po-rule", "review", "work-guard"]
updated_at: 2026-09-08T02:25:19.631Z
---

PO asked mid-session (2026-09-08) why queued Opus reviews were not launched in parallel. Cause: verdict file writes are foreign edits and the .ut-tdd/state/foreign-edit-override marker is one-shot and first-come-first-served, so two concurrent Claude reviews steal each other's marker. Why: work-guard treats the env override UT_TDD_ALLOW_FOREIGN_EDIT=1 as human-managed and non-consumed. How to apply: when the PO wants parallel reviews, pass UT_TDD_ALLOW_FOREIGN_EDIT=1 only in the environment of each ut-tdd claude --role blind-reviewer subprocess (never export it into the orchestrator shell), record the PO authorisation in memory, and keep one-at-a-time marker usage as the default when the PO has not asked.
