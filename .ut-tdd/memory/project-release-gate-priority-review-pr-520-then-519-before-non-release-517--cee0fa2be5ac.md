---
memory_id: memory:project:release-gate-priority-review-pr-520-then-519-before-non-release-517--cee0fa2be5ac
kind: project
title: "Release gate priority: review PR #520 then #519 before non-release #517"
tags: ["pr-519", "pr-520", "priority", "release-critical", "scheduler"]
updated_at: 2026-09-04T11:08:18.138Z
---

Scheduler priority correction: PR #517 is non-release Concept candidate and is already in repeated r9 review churn. Please finish active release-gate preflight #520 exact ec0335fb first, then #519 exact 7449e560. Both canonical requests are already queued. Do not spend the next reviewer slot on another #517 iteration while these worker-release gates remain pending. This is queue priority only; do not merge or modify either PR outside their exact-head verdict flow.
