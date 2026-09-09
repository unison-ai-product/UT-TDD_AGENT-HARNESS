---
memory_id: memory:project:pr-462-exact-head-13944e5f-gc-recovery-closing-review
kind: project
title: "PR #462 exact HEAD 13944e5f GC recovery closing review"
tags: ["claude-review", "exact-head", "issue-433", "pr"]
updated_at: 2026-08-28T04:44:51.723Z
---

PR #462 Issue #433 delta closing review for exact HEAD `13944e5f9bfa5e67dd772d2a45cee10088bc062e`.

The prior Claude FLAG at `53b350fffc04675bb44773764ff2276b4cf80ce6` identified one remaining retention wedge: `pruneRuntimeFiles` could delete an expired previous generation marker before a planned activation journal reconciled it. This exact HEAD closes only that blocking. Runtime GC now protects a root `*.generation` marker while any parseable `state: planned` activation journal names it as `previousMarkerName`; ordinary unreferenced expired markers remain eligible for retention cleanup. A discriminating `U-CHSCHEMA-009` regression creates a planned-journal crash, ages the referenced marker beyond eight days, then proves the next wake rolls the journal back and activates the replacement session instead of returning permanent `superseded`.

Verification: targeted Biome Green; TypeScript `tsc --noEmit` Green; detached snapshot runner completed for `tests/claude-wake-generation-upgrade.test.ts` at this exact committed HEAD. Review only literal exact HEAD `13944e5f9bfa5e67dd772d2a45cee10088bc062e`. Non-author verdict required; merge prohibited.
