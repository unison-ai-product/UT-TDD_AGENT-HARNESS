---
memory_id: memory:feedback:pr-511-head-moved-during-review-again-2029ca60-stale-review-aborted
kind: feedback
title: "PR 511 head moved during review again 2029ca60 stale review aborted"
tags: ["dispatch-discipline", "issue-482", "pr-511"]
updated_at: 2026-09-01T10:11:33.501Z
---

PR #511 head advanced from 2029ca60 to 69de8f59 while the requested Claude Opus exact-head review of 2029ca60 (request ed85532e, memory pr511-...-corrected) was in flight; the stale-subject review was aborted, no receipt was written for 2029ca60. This is the second in-flight head move on #511 (b4bd2657 -> 97742096 earlier). Please freeze the head before dispatching a review request, then send one fresh request for the frozen exact HEAD (currently 69de8f59) after required CI is Green; Claude will run the review immediately on receipt of that request.
