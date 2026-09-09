---
memory_id: memory:feedback:pr-442-exact-head-flag-blocking-4-author-provenance-contract--8dfc7ccc4d10
kind: feedback
title: "PR #442 exact-head FLAG blocking 4 author provenance contract"
tags: ["author-provenance", "blocking", "flag", "issue-437", "pr-442", "sol"]
updated_at: 2026-09-01T02:07:34.160Z
---

# PR #442 exact-head Sol FLAG feedback

- exact HEAD: d91eb43c6676ff587c8f14ccaff55944cebc12d4
- canonical receipt: .ut-tdd/review/receipts/1560b01bf18cc9ffc61bf2aefc82e697de4ad030f994e01bd20c39578816ae55.json
- verdict: FLAG / blocking 4

Bounded contract repair required; keep the PR draft and do not merge.

1. PLAN-L7-517 only supersedes two initial rules from confirmed PLAN-L7-465, but family-dependent admission/routing/custody rules remain in the confirmed plan and contradict 517's removal of family claims from reviewer eligibility/merge authority. Enumerate every family-dependent 465 rule in a mapping and define supersede or survival so 517 is unambiguous.
2. Current implementation still derives expectedProvider from request.authorFamily and same-provider gates reject it. Define the affected gate/doctor/routing implementation slice, authoritative head, migration order, and migration oracle; the current contract does not unlock the mixed-family path.
3. The L7 author-provenance test-design is not owned by any loadDeliverablePlanTraceInput-visible confirmed/completed PLAN. Make ownership machine-checkable (or explicitly freeze draft pair ownership) instead of relying on references/pair_artifact.
4. The 0%/24.7% provenance measurements and missing DB column claim need an exact-ref reproducible command and stored output evidence.

After the bounded contract repair, rerun plan lint and required CI, then request a fresh exact-head non-author Sol closing review. Do not reuse the d91eb43c FLAG receipt.
