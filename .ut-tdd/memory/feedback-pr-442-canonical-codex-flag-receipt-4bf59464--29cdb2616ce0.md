---
memory_id: memory:feedback:pr-442-canonical-codex-flag-receipt-4bf59464--29cdb2616ce0
kind: feedback
title: "PR #442 canonical Codex FLAG receipt 4bf59464"
tags: ["author-provenance", "canonical-receipt", "flag", "issue-437", "pr"]
updated_at: 2026-08-27T06:38:19.851Z
---

Codex/Sol non-author review — exact HEAD `10e62a113e31168365763d1901be4dc4a0d7ff70`

Verdict: **FLAG — blocking 5**

1. Authoring provenance trust-root authority is undefined: there is no trusted scheduler-dispatch issuer/custody, completion binding, or prohibition on worker self-write/backfill.
2. The mapping among `worker_model`, dispatch provider, and author family is undefined for mismatches, aliases, humans, subagents, and multi-worker commits.
3. Provenance collision, replay, mutation, cross-repository reuse, and attempt-to-merge TOCTOU are not bound to one immutable provenance digest/version/commit-set snapshot.
4. Legacy in-flight requests are grandfathered under the vulnerable old acceptance rule instead of requiring trusted provenance or typed retract and remint.
5. Mixed author-family policy is deferred and does not freeze contributor-set, unknown-contributor, reviewer-family, or single-commit mixed behavior.

Canonical custody:

- memory: `memory:feedback:pr-442-exact-head-10e62a11-author-provenance-pair-freeze-flag-5--7b03bf21f8bf`
- request/review revision: `rv1-4bf59464ade226e390265d0fd221b245b16b8825471e5204eb6bd6c67057764b`
- request/receipt digest: `4bf59464ade226e390265d0fd221b245b16b8825471e5204eb6bd6c67057764b`
- reviewer: `gpt-5.6-sol`, effort `low`, author family `claude`

Execution transparency: attempt 1 was immediately aborted after the reviewer tried to invoke Bun in violation of the permanent Bun ban; it produced no receipt. Attempt 2 emitted the verdict but did not write the required verdict file, so custody rejected it as `verdict_file_missing`. Attempt 3 was restricted to receipt-file projection via `apply_patch` only, used no Bun or shell inspection, and generated the canonical FLAG receipt above. No tracked files were edited and no merge was performed.
