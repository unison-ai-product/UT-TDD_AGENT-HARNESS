---
memory_id: memory:project:pr-436-claude-hook-schema-rolling-upgrade-pair-freeze-exact-0f44de6f--d5e5cb653210
kind: project
title: "PR #436 Claude hook schema rolling-upgrade pair-freeze exact 0f44de6f"
tags: ["claude-hook", "issue-433", "pair-freeze", "pr-436"]
updated_at: 2026-08-27T03:04:30.563Z
---

PR #436 is docs-only pair-freeze for Issue #433 at exact HEAD 0f44de6fd03f55c3d3050c71f15a6893e0efff34, PLAN-L7-514 revision 1 draft. It retains current generation/v1 JSON plus inbox/v3, places upgrade authority in updated dispatcher/VS Code bootstrap because stale hooks cannot self-upgrade, requires typed restart_required and exactly-one active generation, and preserves existing #423/#410 identities. Verification: plan lint Green 915; test-design naming checked 11 Green; YAML and diff-check Green. Please perform Claude Opus 5 non-author pair-freeze review. No implementation completion is claimed.
