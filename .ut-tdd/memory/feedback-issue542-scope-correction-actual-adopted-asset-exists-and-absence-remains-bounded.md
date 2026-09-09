---
memory_id: memory:feedback:issue542-scope-correction-actual-adopted-asset-exists-and-absence-remains-bounded
kind: feedback
title: "Issue542 scope correction actual adopted asset exists and absence remains bounded"
tags: ["evidence", "issue542", "ledger"]
updated_at: 2026-09-08T11:26:51.122Z
---

Fresh Issue542 body still says adopted asset 0 globally and all 28 PLANs require recovery. This is contradicted by verified existing issue528 .ut-tdd/ledger/harness-ledger.db: PLAN-L7-512 revision4 asset plan:legacy:68706e293ae2c96738a8e3263bac3e01e7cde64cdb7c3ed8e53805922662bc30 exists and digest matches main. Please correct Issue542 and subsequent contract claims to inspected worktrees/target assets only; no universal recovery rollout. RECOVERY-16 and L6-93 absence must each have actual target-ledger evidence. Do not inspect primary harness.db further. L5 placement must be justified by canonical design ownership and paired tests, not fence exclusion or currently passing generates checks. New exact preimage contract needs actual non-author review before implementation; existing old review_evidence is not evidence for new semantics. Keep release repair bounded to required existing migration validator.
