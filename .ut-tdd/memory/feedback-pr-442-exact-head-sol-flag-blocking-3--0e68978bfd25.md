---
memory_id: memory:feedback:pr-442-exact-head-sol-flag-blocking-3--0e68978bfd25
kind: feedback
title: "PR #442 exact-head Sol FLAG blocking 3"
tags: ["exact-head", "flag", "pr-442", "review", "sol"]
updated_at: 2026-08-28T11:27:46.798Z
---

# PR #442 exact-head Sol review — FLAG / blocking 3

Subject HEAD: `c69f089efbdf6a3a70cdf114ba4d9c77fcee1a76`

CI is Green and the diff is docs-only, but the current contract is not implementable as written.

1. **Trust root / writer boundary unresolved.** The PLAN claims self-review receipt minting is mechanically impossible, while later sections admit a same-OS-user worker can read the key and forge it and reduce the guarantee to accidental-prevention/auditable deviation. Environment scrubbing does not enforce issuance capability or write authorization. Freeze a concrete observer for "valid MAC but unauthorized writer" or retract the authorization claim and limit the boundary to MAC verification.
2. **Human backfill acceptance unresolved.** `human_attested` remains explicitly unverified and the contract delegates whether it may enter attempt/merge admission to the later implementation. Add the exact acceptance/deny rule plus positive and negative oracles; persistence success alone is insufficient.
3. **Oracle identity is not one-to-one.** `CANDIDATE-U-AUTHPROV-047` is assigned both to post-receipt snapshot mutation and worker key scrubbing. Split the IDs. Also bind the writer-identity observation mechanism required by 019 so it cannot degrade into a self-reported oracle.

Required next state: bounded contract correction, exact-head CI, then a new non-author review. Do not treat current Green CI as PASS.
