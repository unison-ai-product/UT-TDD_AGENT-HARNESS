---
memory_id: memory:project:measured-author-provenance-coverage-for-issue-437-git-author-0-percent-family-trailer-10-percent-no-commit-to-provider-binding-in-harness-db--4292034e0717
kind: project
title: "Measured author-provenance coverage for Issue 437: git author 0 percent, family trailer 10 percent, no commit-to-provider binding in harness.db"
tags: ["attestation", "author-provenance", "issue-437", "issue-439", "measurement", "pair-freeze"]
updated_at: 2026-08-27T06:01:09.806Z
---

Baseline measured on origin/main at 6b5b1d9c before drafting the Issue #437 pair-freeze. Sample: the most recent 200 commits, 166 of which are non-merge.

1. The git author string carries zero family signal. All 166 non-merge commits have author name 'unison-ai-product'. Command: git log origin/main -200 --no-merges --format='%H %an %ae'. This makes Issue #437 option (A), deriving author family from the actual commit author, non-viable as stated - there is nothing to derive from.

2. Commit trailers cover a minority and mostly do not identify a family. 41 of 166 commits (24.7%) carry any Co-Authored-By trailer. Of those trailer identities, 'Claude Opus 5 (1M context)' appears 17 times and 'unison-ai-product' 38 times. Only the former distinguishes a family, so family-identifying trailer coverage is 17/166 = 10.2%.

3. Nothing in harness.db binds a commit sha to a provider. Of 85 tables, none has a column relating a commit to a runtime. model_runs holds 7,985,466 rows with runtime, model, started_at and completed_at but no commit sha. tool_runs is empty (0 rows). hook_events holds 27,929 rows with session_id, plan_id and digest but no commit sha. github_review_lane_receipts has subject_head and worker_model but only 1 row, and it describes a review lane, not authorship.

4. The existing ReviewAttestation record (src/feedback/review-attestation.ts) binds provider, role, model, pr, head and nonce - but it attests a review, not an authoring act. There is no authoring attestation anywhere in the runtime.

Consequences for the contract, all falsifiable from the numbers above:
- A trust root based on existing commit metadata cannot work; coverage is 0 percent for the author string and 10.2 percent for family trailers.
- A trust root based on delegation attestation cannot be retrofitted onto history; authoring attestation does not exist at all, so any fail-close on its absence would deny effectively every review until new records accumulate.
- Therefore the contract must both introduce an authoring provenance record as a new obligation and define the typed unknown default for everything that predates it. The advisor (claude-fable-5, decision=design) proposed mint allowed but review acceptance fail-close for unknown, which is the middle path between total stoppage and silent pass-through.
- authorFamily is an input to reviewIdentityDigest (src/feedback/review-verdict-custody.ts:61-81), so changing its derivation changes identity semantics and breaks compatibility with existing requests, receipts and rv1- revisions. A schemaVersion bump and a migration rule for in-flight requests must be frozen in the contract, not invented in the implementation PR.

Related: the merge gate requires every entry at the current HEAD to be merge_ready (src/feedback/review-merge-gate.ts:231-242), which is why a single unclosable or duplicate request denies merge permanently - that is Issue #439's subject, kept separate as the recovery path.
