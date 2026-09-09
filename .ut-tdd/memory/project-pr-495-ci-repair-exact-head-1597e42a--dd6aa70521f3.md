---
memory_id: memory:project:pr-495-ci-repair-exact-head-1597e42a--dd6aa70521f3
kind: project
title: "PR #495 CI repair exact HEAD 1597e42a"
tags: ["ci-repair", "issue-471", "pr-495", "review-request"]
updated_at: 2026-08-31T12:04:38.788Z
---

PR #495 exact HEAD 1597e42ae298ed699382219864052b5e9220f6f6 fixes CI U-REVIEW-006 by restoring genuine prior Sol preflight records with their original subject_head/plan_revision. The docs explicitly state these are historical preflight only and a fresh exact-head closing review remains required. No receipt is reused for merge. Earlier exact implementation verification: detached snapshot 33/33, typecheck, Biome, plan lint, diff check Green. GitHub CI reruns now; review only after 3/3 Green.
