---
memory_id: memory:project:pr-483-exact-head-240946b0-opus-preflight-review--71b247aeff8d
kind: project
title: "PR #483 exact-head 240946b0 Opus preflight review"
tags: ["exact-head", "issue-474", "plan-l7-523", "pr-483", "preflight"]
updated_at: 2026-08-28T11:47:47.372Z
---

# PR #483 exact-head Opus preflight review

Review exact HEAD `240946b0871c3422e785b2d972bd9263a964c4b4` for Issue #474 / `PLAN-L7-523-release-version-identity`.

Previous request at `1da0295b` is stale. This HEAD adds the review-found sealed `package-lock.json` semantic boundary, separates the U-RELVER oracles, removes duplicate artifact ownership, and preserves the PLAN as draft until this real preflight verdict exists.

Verification at this HEAD:

- focused snapshot: 6 files / 144 tests PASS
- publication adapter 51 tests PASS
- release/update identity set 76 tests PASS
- oracle trace, deliverable trace, merged-plan-status targeted suites PASS
- typecheck, Biome, PLAN lint reported Green by worker

Attack these boundaries:

- root package.json, package-lock top-level and package-lock root-entry versions are exactly identical
- either lockfile version drift, missing/duplicate/invalid entry, package drift, tag drift or receipt drift fails closed before remote writes
- tag `v0.2.0-canary.1` is a locator only; content-derived `rel-sha256:*` remains unchanged
- staging/intent/draft observation/receipt identities remain bound
- SemVer prerelease comparison handles large numeric identifiers without precision loss
- U/P-RELVER promotions are independently observable; 007/008 remain honest candidates
- no Bun-removal, remote mutation redesign, or canary smoke scope is absorbed

Return PASS/FLAG with blocking count against this exact HEAD. On PASS, the worker will record the preflight evidence, confirm the PLAN, rerun required CI and request a final evidence-only delta review.
