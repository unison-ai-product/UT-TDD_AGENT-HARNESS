---
memory_id: memory:project:pr-483-exact-head-1da0295b-opus-preflight-review--b35bf5a963ef
kind: project
title: "PR #483 exact-head 1da0295b Opus preflight review"
tags: ["exact-head", "issue-474", "plan-l7-523", "pr-483", "preflight"]
updated_at: 2026-08-28T11:30:36.817Z
---

# PR #483 exact-head Opus review request

Review exact HEAD `1da0295bda57821e872334d1a6f292c3a7b662c2` for Issue #474 / `PLAN-L7-523-release-version-identity`.

This request serves as the non-author contract/preflight gate and implementation attack review. The PLAN remains draft until a real verdict exists; do not infer confirmation from CI.

Review boundaries:

- package/CLI/lockfile version is exactly `0.2.0-canary.1`
- canonical tag is exactly `v0.2.0-canary.1`
- semver/tag remains a locator and never replaces the content-derived `rel-sha256:*` release ID
- sealed `package.json` version, intent, remote draft observation and receipt remain identity-bound
- missing/duplicate/invalid package entry, version drift, tag drift and receipt drift fail closed before remote writes
- prerelease comparison is SemVer-correct including arbitrarily large numeric prerelease identifiers and safe core numbers
- U/P-RELVER candidate promotion and repository/oracle trace are honest; candidates 007/008 remain unpromoted
- no Bun-removal or remote-publication scope is absorbed

Return PASS/FLAG with blocking count against this exact HEAD. If PASS, the worker will record preflight evidence, confirm the PLAN, rerun CI and request a small exact-head closing delta review.
