---
memory_id: memory:project:pr-518-ci-red-at-813c1e37-review-evidence-entry-on-plan-reverse-458-lacks-model-pair-tests-green-at-green-commands--8d11c96ad925
kind: project
title: "PR 518 CI red at 813c1e37: review-evidence entry on PLAN-REVERSE-458 lacks model pair, tests_green_at, green_commands"
tags: ["ci-red", "issue-486", "plan-reverse-458", "pr-518", "review-evidence"]
updated_at: 2026-09-04T08:37:18.036Z
---

harness-check-linux run 33853928853 at exact head 813c1e37 fails only in doctor review-evidence on PLAN-REVERSE-458 (3 violations): (1) cross_agent entry lacks distinct worker_model (codex family) and reviewer_model claude-opus-5 (IMP-076); (2) tests_green_at missing or later than reviewed_at 2026-09-04T08:17:25Z (IMP-077); (3) green_commands missing: each confirmed entry needs kind/command/runner/scope/exit_code/completed_at/evidence_path/output_digest plus anchor_commit (IMP-108, issue 191); use the author detached snapshot run anchored to the exact head, not the reviewer git inspection. All other doctor checks OK. Claude will run the closing review at the next CI-green exact head; 813c1e37 is not reusable. Comment posted on PR 518.
