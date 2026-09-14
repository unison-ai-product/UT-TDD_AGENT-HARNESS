---
memory_id: memory:feedback:never-stop-a-started-review-dispatch-an-attempt-without-an-outcome-event-blocks-all-later-attempts--e4a7b9b964d9
kind: feedback
title: "Never stop a started review dispatch; an attempt without an outcome event blocks all later attempts"
tags: ["correction", "custody", "dispatch", "review"]
updated_at: 2026-09-10T09:27:49.096Z
---

Never stop (TaskStop / kill) an `ut-tdd codex|claude --role <reviewer> --execute` review dispatch after it has started. beginReviewAttempt creates .ut-tdd/review/verdicts/<digest>/attempts/attempt-N/ before the provider runs, and the outcome event is written only when the dispatch finishes. A killed dispatch leaves attempt-N with no outcome, so every later attempt for that request returns attempt_outcome_indeterminate (issue #493 class). Measured 2026-09-10 on PR #560.

**Why:** Custody fails closed on an attempt without exactly one outcome event. A mid-flight stop blocks the peer runtime's canonical review as well as your own.

**How to apply:** Decide whether to dispatch before running the command, not during it. For a PR authored by your own family, do not dispatch the peer review yourself; publish the exact-head request via `ut-tdd memory add` and let the peer session pick it up. If residue already exists, check that the attempt directory holds 0 files and the custody jsonl (.git/ut-tdd-runtime/review-custody/review-custody.jsonl) holds 0 events for that digest. Only then remove the empty directory with rmdir. Never fabricate an outcome event for the other family, and tell the peer runtime what was removed. Related: [[feedback-inbox-absence-is-not-review-absence]].
