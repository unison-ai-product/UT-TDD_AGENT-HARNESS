---
memory_id: memory:feedback:pr-435-436-non-author-verdicts-returned-pass-weak-plan-lint-gap-closed-by-orchestrator-doc-level-follow-ups-listed--f5a65711f18d
kind: feedback
title: "PR #435/#436 non-author verdicts returned PASS-WEAK; plan lint gap closed by orchestrator, doc-level follow-ups listed"
tags: ["cross-agent", "pair-freeze", "pass-weak", "plan-lint", "pr-435", "pr-436"]
updated_at: 2026-08-27T04:10:39.806Z
---

Both canonical envelopes were consumed through 'ut-tdd review live-consume'. Receipts:
- PR #435 exact HEAD 2eff2dcbe3e16e367e5dbebdca84d649fd9dee1e, revision rv1-a5b24b5e3a3470d551f12cb7eaffe7dd52172420d4dd1fa5f4b5b6d1e907c877, reviewerFamily claude, PASS-WEAK, blocking 0, at 04:02:47Z.
- PR #436 exact HEAD 801c727cf320762e815e3a9c8a098fb456456f91, revision rv1-547cb3addc4c9fdfc54e5f0556f012be93d6087a81f1460efc56337da4cb22a7, reviewerFamily claude, PASS-WEAK, blocking 0, at 04:09:25Z.

Both reviewers downgraded PASS to PASS-WEAK for the same non-substantive reason: in this non-interactive session the reviewer subprocess could not get approval to run 'node src/cli.ts plan lint', so it could not re-measure the mechanical gates itself. I have now run that gate directly from each worktree at the reviewed HEADs:
- ut-issue425-worktree-lifecycle-application: plan-schedule OK checked=915, plan-governance OK checked=915.
- ut-issue433-claude-schema-upgrade: plan-schedule OK checked=915, plan-governance OK checked=915.
That removes the stated cause of the weak qualifier. The receipts stay canonical as issued; this is supplementary evidence, not a re-verdict.

Doc-level follow-ups raised, none blocking, all resolvable before implementation starts:

PR #435 (PLAN-L7-513)
1. operation_id ownership layer is unfixed. The confirmed domain types (src/runtime/worktree-lifecycle/domain/types.ts:52-101) carry only 'attempt', and section 3 puts domain change and durable ledger out of scope, so 'append as a planned record under the same operation_id' only implements as an in-operation in-memory binding; read as a cross-lifecycle durable key it has no owner. CANDIDATE-U-WTAPP-001/004/005 expectations depend on which reading is intended. Fix with one sentence.
2. P-WTAPP-001 'N=100 valid attempts' has no scenario definition. The 6 ports include releasePath and the 3 events include terminal plus handoff, so 'exactly N on the happy path' holds only if an attempt means the full create-to-finish lifecycle. The 6N/3N/1N upper bounds are safe under either reading.
3. Cosmetic: the test-design frontmatter uses 'artifact: test-design' while sibling files use 'artifact_type: test_design'. No machine gate covers it.

PR #436 (PLAN-L7-514)
1. Section 4.1 pinned digests could not be checked at review time. The worktree's .ut-tdd/review/requests holds only this review's own request; 89b41293 and 6945ce76 are absent. That matches the PLAN's own 'gitignored host-local asset' statement, but when lane B fixtures are built the same disappearance can recur on the pr-410 side.
2. Section 3.3 requires atomic registration of marker, profile and authority record, but a closed v1 marker cannot point at a profile, so the discovery convention (path/naming) and the atomic root are not stated. Freeze one sentence rather than inventing it in the implementation PR.
3. Blast radius is understated. Profile absence is itself a deny reason under section 3.2, so not only legacy pid:timestamp markers but every current v1 JSON hook since #422 becomes restart_required. That reads intentional but is not written down as impact.

Separately, a capability note for the harness: the reviewer subprocess spawned by live-consume inherits a permission context that denies 'node src/cli.ts plan lint'. Every non-author review run this way will keep self-reporting an unverified mechanical lane and settling at PASS-WEAK. Worth a typed fix so reviewers can run read-only gates.
