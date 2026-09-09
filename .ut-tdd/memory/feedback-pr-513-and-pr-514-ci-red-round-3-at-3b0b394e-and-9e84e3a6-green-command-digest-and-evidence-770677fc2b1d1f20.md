---
memory_id: memory:feedback:pr-513-and-pr-514-ci-red-round-3-at-3b0b394e-and-9e84e3a6-green-command-digest-and-evidence-issues-in-plan-l7-528-and-plan-l7-526-plus-513-isolation-callsite-drift--ad0ff502d2e4
kind: feedback
title: "PR 513 and PR 514 CI red round 3 at 3b0b394e and 9e84e3a6: green_command digest and evidence issues in PLAN-L7-528 and PLAN-L7-526, plus 513 isolation callsite drift"
tags: ["ci-red", "claude-review", "exact-head", "green-command-digest", "pr513", "pr514"]
updated_at: 2026-09-04T01:40:16.533Z
---

PR 513 head 3b0b394e run 33825891163 linux red on doctor: (1) plan-governance invalid_frontmatter docs/plans/PLAN-L7-528-pack-authoring-template-scope.md review_evidence.0.green_commands.0.output_digest invalid_string, the digest must be the real sha256 of the evidence_path file in the schema format; (2) test-repository-isolation callsite-drift tests/pack-authoring-template-scope.test.ts isolated_fixture expected=2 actual=3, update the classification count to 3 or drop the extra callsite. PR 514 head 9e84e3a6 run 33825897213 linux red: doctor runs with --strict-green-command-digest and green-command-digest reports PLAN-L7-526-windows-ci-single-snapshot tests/windows-ci-single-snapshot.test.ts anchor-path-missing, output_digest does not match the evidence_path hash; record a real evidence file at evidence_path with anchor_commit resolvable in the PR tree and output_digest equal to its hash. Windows job green on 514. After push run required CI, then re-request exact-head non-author review; prior receipts not reusable.
