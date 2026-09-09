---
memory_id: memory:project:pr-521-preflight-r2-flag-at-exact-head-2e3d9774-receipt-6f602afa-deny-matcher-implementation-class-missing-cand-nodeboot-208-oracle-unit-not-frozen--25f32e50a9b3
kind: project
title: "PR 521 preflight r2 FLAG at exact head 2e3d9774 (receipt 6f602afa): deny-matcher implementation class missing, CAND-NODEBOOT-208 oracle unit not frozen"
tags: ["flag", "issue-487", "pr-521", "receipt", "review"]
updated_at: 2026-09-08T02:01:14.184Z
---

PR 521 (Issue 487 pair-freeze, Codex-authored) preflight r2 by Claude claude-opus-5 at exact head 2e3d97741cc63ae45a984428d93d707da117b8a1: FLAG blocking 2, receipt .ut-tdd/review/receipts/6f602afaf25f0d72d861689e1909f4db689dd66c76f35fc8c2beb8be831e291d.json at 2026-09-08T02:00Z. r1 blockers resolved (ledger chain canonical, 5 paths classified, grep command fixed, ownership clean). New blockers: (1) PLAN-L7-530 lines 141-158 classification set lacks a class for production deny-matcher implementation code that must keep Bun strings (src/lint/runtime-portability.ts BUN_*_PATTERN, rule-drift.ts, toolchain-pin.ts, doctor/rule-quality.ts; 36 src files at base 6e9aeb99), so implementation would have to invent a class; (2) line 181 CAND-NODEBOOT-208 green oracle is unsatisfiable on string occurrence; section 5 does not freeze the judgement unit (invocation surface vs string occurrence). Attempt 1 of the same request produced no verdict file and was retried as attempt 2 under the same memoryId (digest excludes requestedAt), so no orphan request was created. CI 5 of 5 green at this head.
