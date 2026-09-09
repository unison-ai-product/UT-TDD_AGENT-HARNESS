---
memory_id: memory:feedback:pr-435-delta-pass-and-pr-436-delta-pass-weak-receipts-issued-436-weak-cause-closed-by-measurement--4b72d0aa36e3
kind: feedback
title: "PR 435 delta PASS and PR 436 delta PASS-WEAK receipts issued; 436 weak cause closed by measurement"
tags: ["delta-review", "issue-386", "pr-435", "pr-436", "receipt", "reviewer-permission"]
updated_at: 2026-08-27T05:54:14.591Z
---

Both delta envelopes are consumed and canonical receipts exist.

PR #435 exact HEAD 7bfb295ec89c168e6b4a6827f0a32a0e98425c0c: receipt rv1-d9c1f304b01a8d710aec51b5f49506083ebe40ddb7cd25afd46014689328d6a1, reviewerFamily claude, verdict PASS, blocking 0, at 05:39:01Z. The prior PASS-WEAK cause (missing confirm and required green_commands evidence) is resolved by this delta.

PR #436 exact HEAD 39b248f98d3b36e38c8e1df66c91638e1da97db5: receipt rv1-65eb4d9fb579862df1aa1ad84f58686d7fbe8dedc74040d3428b997cebe842cd, reviewerFamily claude, verdict PASS-WEAK, blocking 0, at 05:53:38Z.

The #436 reviewer named exactly two things it could not re-run itself. I measured both directly and both hold:
- output_digest sha256:40ead295773959b04ee240f555696fa028f33973009deaf172ee1b7b370e7a4a equals the actual sha256 of tests/test-design-naming.test.ts at anchor 801c727c. Computed with git cat-file blob, exact match.
- CI run 33040049262 has headSha 39b248f98d3b36e38c8e1df66c91638e1da97db5 with conclusion success, completed 04:51:12Z. It is the exact reviewed HEAD.
The receipt stays as issued; this is supplementary evidence, not a re-verdict. The remaining weak-qualifier reasons the reviewer listed are pre-existing mechanism limits, not defects of this delta: exit_code and tests_green_at are author-declared, and output_digest binds the test source file rather than the run output. Those belong with Issue #429.

Two operational findings worth acting on.

First, the #436 first attempt returned reviewer_execution_failed even though the reviewer had written a well-formed verdict file with the custody envelope at attempts/attempt-1. No receipt was produced. A second live-consume produced attempt-2 and the receipt. So a nonzero delegation exit code discards an already-valid verdict, and only a manual retry recovers it. That is Issue #386's class and it silently costs one full review each time it fires.

Second, every Claude-side review in this session self-downgraded to PASS-WEAK for the same reason: the reviewer subprocess spawned by live-consume cannot get approval to run node, vitest, plan lint or gh. Reviewers therefore cannot re-measure any mechanical lane and correctly refuse to assert PASS on commands they did not run. I have been closing that gap by hand afterwards on every PR (#435, #436 twice, and earlier #435/#436 at the prior HEADs). Until read-only gate execution is permitted inside the reviewer subprocess, exact-head PASS is structurally unreachable through this path.

Still waiting on you: PR #431 un-draft so the wrapper can land it, and the canonical receipt for your own request rv1-a46feb36 on PR #441. PR #438 and #440 requests target HEADs that have since moved (438 asked for 90412b98, now 2f1f2ab8; 440 asked for c8384c8b, now 261fc2f9) and neither has a purpose=review envelope, so there is nothing consumable for them yet.
