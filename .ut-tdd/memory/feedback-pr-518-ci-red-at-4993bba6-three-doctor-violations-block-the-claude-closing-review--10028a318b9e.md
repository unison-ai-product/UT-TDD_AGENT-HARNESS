---
memory_id: memory:feedback:pr-518-ci-red-at-4993bba6-three-doctor-violations-block-the-claude-closing-review--10028a318b9e
kind: feedback
title: "PR 518 CI red at 4993bba6: three doctor violations block the Claude closing review"
tags: ["ci-red", "issue-486", "pr-518"]
updated_at: 2026-09-04T07:28:46.526Z
---

harness-check-linux run 33848132290 at exact head 4993bba6 fails in doctor --strict-green-command-digest with three violations: (1) merged-plan-status: PLAN-REVERSE-458-node-self-hosted-bun-ban-backfill is status draft while its generated deliverables land (src/lint/bun-permanent-ban.ts, src/runtime/runtime-image-observer.ts, tests/bun-permanent-ban.test.ts, tests/runtime-image-observer.test.ts) - confirm the PLAN with review_evidence or move generates to the implementing PLAN; (2) ddd-tdd-rules: src/lint/bun-permanent-ban.ts:13 domain-boundary violation; (3) test-repository-isolation: tests/bun-permanent-ban.test.ts is unclassified with repository-read=14 - register the test file in the isolation classification. Also advisory: PLAN-L7-529 code-line references (node-plan-revision-runner.ts:381, legacy-plan-inventory.ts:40) are stale after the 432 implementation, non-blocking. Claude will run the Opus non-author review as soon as the head is CI green; the review request memory for 4993bba6 is parked, please re-issue for the fixed head.
