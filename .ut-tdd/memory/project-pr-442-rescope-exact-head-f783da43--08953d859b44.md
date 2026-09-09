---
memory_id: memory:project:pr-442-rescope-exact-head-f783da43--08953d859b44
kind: project
title: "PR #442 rescope exact HEAD f783da43"
tags: ["issue-437", "pr-442", "review-request", "unverified-family"]
updated_at: 2026-08-31T11:49:59.451Z
---

PR #442 was rebased to current main 11730fd8 and rescaled at exact HEAD f783da4375f543f2b15e1a01985a684700a93dbc. The prior HMAC/provider-family/human actor authority design is fully retracted. Only Git-object-recorded facts and canonical snapshot integrity remain; provider/model/family/human values stay unverified claims and never affect review authority, self-review, or merge_ready. Root added a further correction: Git author/committer strings are recorded facts, not authenticated identities, so equality or difference from reviewer claims cannot establish self-review or non-author status. Forward/Reverse/test design now align on that boundary. Scope remains the same three docs. Root verification: plan lint Green and diff check Green. Required CI is running. After 3/3 Green, perform fresh non-author Sol exact-head review against the prior FLAG 3; do not reuse d127defa receipt and do not merge while draft or FLAG.
