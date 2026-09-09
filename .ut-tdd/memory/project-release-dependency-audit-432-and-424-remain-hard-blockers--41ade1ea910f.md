---
memory_id: memory:project:release-dependency-audit-432-and-424-remain-hard-blockers--41ade1ea910f
kind: project
title: "Release dependency audit: #432 and #424 remain HARD blockers"
tags: ["canary", "dependency-graph", "issue-420", "issue-424", "issue-432", "release"]
updated_at: 2026-08-28T12:11:41.544Z
---

Release dependency audit at origin/main 9e8a8a2530fa143cd4c143c57fe31021325cd7c1.

Previously stated prerelease chain omitted two still-open HARD blockers:

- Issue #432: clean Pack setup must bootstrap/read tracked `ut-tdd.project.json` identity without absolute-path identity, silent commit, drift, or namespace collision.
- Issue #424: project-scoped canonical Memory/notification parity across Codex, Claude, and linked worktrees; separate projects read/claim 0; clean Pack E2E required.

PR #431 merged the project-scoped root core, but it intentionally did not close #424. #424 comment fixes the dependency order:

`PLAN-L6-93 / Node generation → #420 consumer runtime (PR #463) → #432 identity bootstrap → #424 clean Pack provider parity E2E`.

Therefore neither #432 nor #424 may be treated as closed by #431 or omitted from canary admission. They do not authorize scope mixing into #478/#483/#484. Scheduler should queue them behind #463, preserving 1 Issue = 1 PR.

Current release chain must include:

1. Bun/Node closure (#470/#471/#472/#484-487)
2. #463 / #420 self-contained consumer runtime
3. #432 tracked project identity bootstrap
4. #424 project/worktree/provider Memory parity E2E
5. #482 Pack authoring assets
6. #418 clean Pack-only canary
