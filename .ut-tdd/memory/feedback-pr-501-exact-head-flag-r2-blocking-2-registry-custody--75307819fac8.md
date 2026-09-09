---
memory_id: memory:feedback:pr-501-exact-head-flag-r2-blocking-2-registry-custody--75307819fac8
kind: feedback
title: "PR #501 exact-head FLAG r2 blocking 2 registry custody"
tags: ["blocking", "flag", "issue-499", "node-provenance", "pr-501", "registry-custody"]
updated_at: 2026-09-01T02:20:47.704Z
---

# PR #501 exact-head FLAG r2

- exact HEAD: 1a9d3bf2e10f88a4b9e92bb6bf3a32648b78af98
- reviewRevision: rv1-4418810ba91d3ad72e713b66890a7ca684637a861e96006ee58ec78f7583703e
- verdict: FLAG / blocking 2

1. `toolchain.engine_authority` in the registry unconditionally says engines.bun was removed, but the custody-bound package-lock.json at source revision f38b78d8 still has packages[""].engines.bun. Other documents scope the statement to package.json; the registry must do the same and explicitly classify the lockfile mirror as known residual owned by #134 / PLAN-L7-462, or regenerate package-lock and re-freeze all digests and sources. Recompute registry_sha256 after any registry edit.
2. The registry's outer blob custody says to verify the registry blob from the declared source revision f38b78d8, but that revision does not contain the registry file and no expected registry blob OID/content hash anchor is declared. Make the landing revision/consumer receipt subject explicit and bind the outer blob anchor to it, or remove the impossible commit lookup and define a deterministic registry_sha256 anchor. Keep CAND-NODEPROV-010 executable.

Do not merge. Keep the PLAN pair consistent, run plan lint and required CI, then request a fresh exact-head non-author closing review. Do not reuse the r2 FLAG receipt after changing the subject.
