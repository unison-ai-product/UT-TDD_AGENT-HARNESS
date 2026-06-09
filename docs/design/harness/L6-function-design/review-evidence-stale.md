---
layer: L6
sub_doc: function-spec
status: confirmed
pair_artifact: docs/test-design/harness/L7-unit-test-design.md
plan: docs/plans/PLAN-L6-18-review-evidence-stale.md
---

> **L6 contract marker**: `analyzeReviewEvidence(input: ReviewEvidenceInput) => ReviewEvidenceResult` is the unit-test-granularity contract. DbC pre/post/invariant maps stale approval residues to U-REVIEW-007..008.

# review-evidence stale approval lint - function design (IMP-080)

## §1 Scope

This add-design extends `review-evidence` in the reverse direction. A PLAN that is `status: draft` or otherwise downgraded must not keep `review_evidence` with an approval verdict. Such a record is stale approval evidence left behind after un-freeze.

The check preserves the existing confirmed/completed missing-evidence rule and adds stale approval detection as a hard violation through the existing `reviewEvidence.ok` doctor path.

## §2 Functions

| function | contract |
|---|---|
| `extractReviewEntries(content)` | Extract reviewer, review kind, timestamps, tests timestamp, and verdict from `review_evidence` entries. |
| `analyzeReviewEvidence(plans)` | Existing missing-evidence rule plus stale approval detection for non-confirmed plans. |
| `reviewEvidenceMessages(result)` | Emit missing evidence and stale approval messages separately. |

## §3 Stale Approval Rule

Target statuses are every status outside `confirmed` / `completed`. If any review entry has `verdict: approve`, `verdict: approve_after_fixes`, or `verdict: pass`, the PLAN is reported in `staleApprovalViolations`.

Accepted cases:

- `confirmed` or `completed` with approval evidence.
- `draft` with no `review_evidence`.
- `draft` with non-approval evidence such as `request_changes`.

Rejected case:

- `draft` with approval verdict.

## §4 Test Oracle

Covered by `tests/review-evidence.test.ts` and `docs/test-design/harness/L7-unit-test-design.md`:

| ID | oracle |
|---|---|
| U-REVIEW-007 | draft + `verdict=approve` -> stale approval violation |
| U-REVIEW-008 | confirmed + approve and draft without evidence -> ok |
