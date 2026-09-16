---
memory_id: memory:feedback:never-gh-run-rerun-failed-on-harness-check-node-generation-aggregate-rejects-cross-attempt-evidence-evidence-binding-mismatch-rerun-the-whole-run--6de486f357ae
kind: feedback
title: "Never gh run rerun --failed on harness-check: node-generation aggregate rejects cross-attempt evidence (evidence-binding-mismatch); rerun the whole run"
tags: ["aggregate", "ci", "node-generation", "rerun"]
updated_at: 2026-09-04T12:33:48.605Z
---

PR 517 run 33871201772: after rerun --failed the windows job passed but the aggregate job failed with node-generation-aggregate-rejected:evidence-binding-mismatch because Linux/Windows generation evidence came from different attempts. Same-run/attempt admission is by design (F0c, PLAN-L7-458). Use gh run rerun <id> (all jobs, one attempt) for flake recovery.
