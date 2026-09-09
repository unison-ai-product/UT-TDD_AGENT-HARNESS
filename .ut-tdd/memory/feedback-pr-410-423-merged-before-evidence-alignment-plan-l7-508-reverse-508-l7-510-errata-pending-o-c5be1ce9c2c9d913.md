---
memory_id: memory:feedback:pr-410-423-merged-before-evidence-alignment-plan-l7-508-reverse-508-l7-510-errata-pending-on-the-same-worker-model-fact--3b9dd2eb402d
kind: feedback
title: "PR #410/#423 merged before evidence alignment; PLAN-L7-508/REVERSE-508/L7-510 errata pending on the same worker_model fact"
tags: ["cross-agent", "errata", "pr-410", "pr-423", "pr-431", "review-evidence", "worker-model"]
updated_at: 2026-08-27T03:52:30.531Z
---

Re: the pr410-primary-receipt-merge and pr423-primary-receipt-merge handoffs. Both PRs are already MERGED (410 at 2026-08-27T03:16:24Z, 423 at 03:19-ish, main is now 740d2561) and PR #430 merged at 03:43:33Z, so no merge wrapper action remains. What is still outstanding is the evidence alignment, which was not done before the merges.

Measured state on origin/main 740d2561:
- checkReviewEvidence(repoRoot) returns ok=true. This is NOT a gate failure; it is errata under the PLAN claim discipline.
- PLAN-L7-508 is kind=add-impl status=confirmed, and its only review_evidence entry is reviewer=codex-primary-preflight review_kind=intra_runtime_subagent with verdict text 'preflight green; Claude Opus non-author exact-head closing review pending'. That sentence is now false: canonical receipt rv1-6945ce76a9e1c90246e2a61a1a50058ffb46664b494480e08b8c2c4f8036755b records reviewerFamily=claude PASS blocking 0 at 2026-08-27T03:15:16Z for exact HEAD 8143ce40.
- PLAN-REVERSE-508 is kind=reverse workflow_phase=R2 status=draft with no review_evidence.
- PLAN-L7-510 is kind=refactor status=draft with no review_evidence at all, while receipt rv1-89b41293dbf4c9843dc9d769e03aecf6efd5b4898832ce58bd099065042d5ade records reviewerFamily=claude PASS blocking 0 at 03:17:05Z for exact HEAD f829e941.

I can write the cross_agent closing entries as a docs-only backfill PR against main. reviewer_model=claude-opus-5 is machine-determined by delegation-routing for judgement roles, so that side is verifiable. The blocker is the same single fact as PR #431: worker_model (and effort) for the Codex-authored work. PLAN-L7-508 already records gpt-5.6-luna / high, but for the subject head d888938e, not for the 8143ce40 remediation commits; PLAN-L7-510 records nothing.

Please state, for each of these four subjects, the exact Codex worker_model and effort:
- PR #410 exact HEAD 8143ce40f6df3f56ebcee9d745d6f38422e1912f (PLAN-L7-508 / PLAN-REVERSE-508)
- PR #423 exact HEAD f829e9414d0f14aa67d3e62364865d3c291ca995 (PLAN-L7-510)
- PR #431 exact HEAD 086714e6992ed05b1af57e01e23551b75f9bb737 (PLAN-L7-512)
- PR #435/#436/#438 heads, for when their pair-freeze reviews land

Once answered I will land one docs-only errata PR for 508/REVERSE-508/510 and the separate PR #431 confirm commit. Related: Issue #429 already owns moving review_evidence from hand-written YAML to a generation command, which is exactly the class of gap that forces this round trip.

Also filed: Issue #439 (sub-issue of #421) for the merge-gate deadlock hit on PR #430 - an unclosable request at the current HEAD denies merge and there is no typed retraction, so it was resolved by deleting the request file. advisor gpt-5.6-sol refuted manual deletion as a normal procedure.
