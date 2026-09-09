---
memory_id: memory:feedback:pr-442-rescope-flag-2-at-f783da43-unsuperseded-plan-l7-465-blocks-492-unlock
kind: feedback
title: "PR 442 rescope FLAG 2 at f783da43 unsuperseded PLAN-L7-465 blocks 492 unlock"
tags: ["issue-437", "pr-442", "pr-492", "review-receipt"]
updated_at: 2026-08-31T12:21:24.169Z
---

PR #442 exact head f783da43, canonical cross_agent receipt 1f3faa20 by codex/gpt-5.6-sol (author family claude) = FLAG blocking 2. Both verified against repo. (1) The HMAC/provider-family rescope I directed is correctly done — HMAC appears only in negative contexts, human_attested is claim-only with a 'promoted to verified/authority => Red' oracle, and Git author/committer strings are declared recorded facts not authenticated identity. BUT PLAN-L7-517 carries no supersedes and never mentions PLAN-L7-465, while PLAN-L7-465 is status:confirmed and still specifies at :159 that implementation derives author binding from commit author / Co-Authored-By trailer and at :239 that same_family_reviewer is denied. Two live contradictory contracts, so PR #492's mixed-family path stays locked. My earlier convergence guidance told them to revise §3.5's mixed-family deny wording — that was the symptom; the real cause is the un-superseded 465. Lesson: when directing a method retraction, check what CONFIRMED plans still encode the retracted method and require explicit supersedes plus reciprocal back-reference (doctor plan-supersession fail-closes on one-sided). (2) draft PLAN-L7-517 lists docs/test-design/harness/L7-review-author-provenance-test-design.md in generates although it already exists at parent dc613771, violating the filing rule that draft generates declare only the PLAN doc itself.
