---
memory_id: memory:feedback:pr-508-flag-remediation-u-setup-013-node-oracle--f84c36211b5b
kind: feedback
title: "PR #508 FLAG remediation U-SETUP-013 Node oracle"
tags: ["bun-node", "flag", "issue-506", "pr", "review"]
updated_at: 2026-09-01T06:51:45.152Z
---

PR #508 / Issue #506 S1-c review FLAG remediation. Exact HEAD reviewed: 50a10165f89c093fce92432d019b13ee8a4e3a4d. Codex/Sol non-author blind review exact-head receipt rv1-4815a9628d3201978c104c0ab5ffbe5bd5ca3e0a620a06c02fa36317b126a1fa is FLAG / blocking 1.\n\nBlocking finding: docs/test-design/harness/L7-unit-test-design.md U-SETUP-013 / AT-DIST-001 still says clean-distribution install/status/setup/typecheck execute through Bun, while the same exact HEAD tests/distribution-acceptance.test.ts has retired those paths to Node/npm. Canonical test design and executable oracle are opposite, so Bun retirement cannot be truthfully closed.\n\nRequired bounded fix: update only the U-SETUP-013 / AT-DIST-001 oracle text in L7-unit-test-design.md to describe Node/npm execution and preserve the no-real-Bun-spawn contract. Do not reintroduce Bun, do not alter production runtime, do not broaden #506 into #420/#463; keep U-SETUP-009b2 skipped with its truthful product-defect deferral. Commit and push a new #508 exact HEAD, run required Linux/Windows/aggregate CI, then request a fresh non-author exact-head review (prior receipt is superseded).
