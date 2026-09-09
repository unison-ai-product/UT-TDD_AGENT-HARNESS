---
memory_id: memory:project:issue-437-and-439-pair-freeze-contracts-filed-as-pr-442-and-pr-443
kind: project
title: "Issue 437 and 439 pair-freeze contracts filed as PR 442 and PR 443"
tags: ["issue-437", "issue-439", "pair-freeze", "pr-442", "pr-443", "review-custody"]
updated_at: 2026-08-27T06:16:41.243Z
---

Both contracts are frozen and filed as separate docs-only PRs, keeping the 1 Issue 1 PR split you asked for: #437 prevention, #439 recovery.

PR #442, PLAN-L7-517, exact HEAD 10e62a113e31168365763d1901be4dc4a0d7ff70. Issue #437 prevention.
PR #443, PLAN-L7-518, exact HEAD 66ec79e84d9d8e7f0d947b3d607be0c63b3ce115. Issue #439 recovery.
Both: plan lint plan-schedule OK checked=924 and plan-governance OK checked=924; detached snapshot tests/plan-lint.test.ts + tests/test-design-naming.test.ts 84/84 Green. Author family is claude, so both need a Codex non-author closing review. I will dispatch the canonical requests once CI is 3/3 Green.

What changed relative to the Issue text, and why.

Issue #437 option (A) does not survive measurement. Deriving author family from the actual commit author has nothing to derive from: all 166 non-merge commits in the last 200 on main carry author name unison-ai-product, family-identifying Co-Authored-By trailers cover 10.2% (17/166), and no column in any of the 85 harness.db tables binds a commit sha to a provider - model_runs has 7,985,466 rows with runtime and model but no commit sha, tool_runs is empty, hook_events has session_id and plan_id only. The existing ReviewAttestation attests a review, not an authoring act, so there is no authoring attestation to retrofit either.

So PLAN-L7-517 reframes the axis. The vulnerability is not the derivation source but that the acceptance points trust a declared field without checking it. Verification moves to consumption time (beginReviewAttempt and merge gate), which removes option (B)'s weakness (a broken minter passes through) and option (C)'s weakness (post-hoc detection cannot stop the merge gate) at once. Trust root is a newly introduced authoring provenance record keyed by commit sha and held outside the request. Trailers are explicitly rejected as the root because a trailer is free text written by the same party that writes the declaration, so it adds no independence. Unknown provenance is typed: mint is allowed, acceptance fail-closes, and there is deliberately no fallback to the declared value - a fallback would put the trust root back on the declaration. Because authorFamily is an input to reviewIdentityDigest, the contract also freezes a REVIEW_REQUEST_SCHEMA_VERSION bump, non-retroactivity for old requests, and the in-flight rule, so the implementation PR does not invent them.

PLAN-L7-518 turns on the objection that a typed retraction with a free-text reason is the manual deletion you refuted, just in JSON. It only holds if all four conditions hold: a request with any verdict receipt cannot be retracted (this is what closes the escape from a FLAG), only the request's author family may retract, the reason must be a typed code, and class unclosable requires a machine-rederivable predicate rather than self-assertion. The two incidents need different shapes, so retraction has two classes: unclosable (PR #430, no provider can legitimately close it, no replacement required) and superseded (PR #441, a closable replacement identity exists and must be bound). Note that PR #441 did not actually need retraction - the replacement got its receipt and the merge landed without deletion, which is recorded as the expected recovery for that class. The merge gate excludes retracted entries but never reaches merge_ready on retracted alone, and re-evaluates retraction validity independently of the issuing side.

The unclosable predicate depends on the authoring provenance from #437. That coupling is deliberate: prevention and recovery share one trust root. It also means #439's implementation cannot land its unclosable path before #437's provenance record exists.

Competing mint prevention is left to an Issue #421 extension in both contracts, since reviewRevision derives from a digest over memoryId and a different memoryId always yields a different revision, so #421's current same-revision rule cannot catch the PR #441 shape. Neither PLAN claims it.
