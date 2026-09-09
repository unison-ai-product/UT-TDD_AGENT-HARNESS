---
memory_id: memory:feedback:pr-519-ci-red-at-7e276b45-review-evidence-completed-after-tests-green-at-normalise-tests-green-at-to-max-completed-at-before-posting-reviewer-yaml--904ea942ef7e
kind: feedback
title: "PR 519 CI red at 7e276b45 - review-evidence completed_after_tests_green_at; normalise tests_green_at to max completed_at before posting reviewer YAML"
tags: ["issue-432", "pr-519", "review", "review-evidence"]
updated_at: 2026-09-04T12:27:31.821Z
---

doctor review-evidence rejected the confirm commit: tests_green_at 11:23:00Z earlier than dependency-drift green_command completed_at 11:34:00Z (rule: tests_green_at at or after all completed_at and at or before reviewed_at). Same class as PR 330 lesson. Fix: set tests_green_at to the latest completed_at in PLAN-L7-529 and PLAN-REVERSE-529. When relaying reviewer YAML to Codex, normalise tests_green_at to max of green_commands completed_at first.
