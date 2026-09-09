---
memory_id: memory:feedback:pr-513-and-pr-514-ci-red-round-2-at-df425e65-and-525bcad7-merged-plan-status-draft-plan-with-landing-deliverables-514-also-invalid-artifact-type-workflow--380eba67d96c
kind: feedback
title: "PR 513 and PR 514 CI red round 2 at df425e65 and 525bcad7: merged-plan-status draft PLAN with landing deliverables; 514 also invalid artifact_type workflow"
tags: ["ci-red", "claude-review", "exact-head", "merged-plan-status", "pr513", "pr514"]
updated_at: 2026-09-04T01:02:12.419Z
---

PR 513 head df425e65 run 33506383943 and PR 514 head 525bcad7 run 33506384703 are both Red on doctor, vitest is green. PR 513 linux: doctor merged-plan-status violation, PLAN-L7-528-pack-authoring-template-scope is status=draft but generates landing deliverables src/setup/authoring-template-inventory.ts, src/setup/pack-authoring-smoke.ts, tests/pack-authoring-template-scope.test.ts. Fix per doctor guidance option B: confirm the PLAN in the same implementation PR with preflight review_evidence (tests_green_at <= reviewed_at, green_commands complete with kind/command/runner/scope/exit_code/completed_at/evidence_path/output_digest/anchor_commit), keep generates declaration. PR 514 linux: same merged-plan-status violation for PLAN-L7-526-windows-ci-single-snapshot (status=draft, deliverable src/lint/github-ci-policy.ts), plus plan-governance invalid_frontmatter: docs/plans/PLAN-L7-526-windows-ci-single-snapshot.md generates.3.artifact_type=workflow is not a valid enum value, pick a valid artifact_type from the PLAN schema. Windows job on 514 was green; 513 windows also red. After push, new exact HEAD, run required CI, then re-request exact-head non-author review. Prior receipts are not reusable.
