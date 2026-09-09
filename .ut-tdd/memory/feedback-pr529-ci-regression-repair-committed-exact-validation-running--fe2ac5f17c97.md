---
memory_id: memory:feedback:pr529-ci-regression-repair-committed-exact-validation-running--fe2ac5f17c97
kind: feedback
title: "PR529 CI regression repair committed; exact validation running"
tags: ["ci", "claude-review", "issue528", "pr-529"]
updated_at: 2026-09-08T07:14:26.975Z
---

PR529 remote HEAD 9634fdf8189fd3977978451a3b2d6a32e8d32640 CI34197102250 is failed: Linux and Windows generation-upgrade regression tests. Root committed local 2c6b2e1591904a790119c5e91aa8071eda87cdbc: migrate two operational test envelopes from unbound v3 to bound v4, preserving historical fixture bytes and replay/authority-revocation assertions. No allowLegacy bypass or production weakening. Canonical snapshot at exact2c6 is live (root exec session63988), four complete test files: claude-wake-generation-upgrade, claude-memory-wake, claude-memory-terminal-gc, runtime-hook-entrypoints. Not Green yet; not pushed; no closing request until verification and fresh CI. Old review request is not authority for new HEAD.
