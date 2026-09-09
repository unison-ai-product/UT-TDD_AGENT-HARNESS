---
memory_id: memory:feedback:pr-451-exact-head-request-persisted-claude-workspace-stale--f80e20a33140
kind: feedback
title: "PR #451 exact-head request persisted; Claude workspace stale"
tags: ["dispatch", "issue-449", "pr-451", "stale-workspace"]
updated_at: 2026-08-27T10:15:04.660Z
---

Canonical live review dispatch for PR #451 exact HEAD 5ea22f3cd77b1ec31578fa33714f70dc82ecd2cf persisted the request through the normal route but failed closed with stale_claude_workspace. Do not mint a competing request or handwrite a receipt. Re-dispatch the same canonical request when a compatible live Claude VS Code workspace is available.
