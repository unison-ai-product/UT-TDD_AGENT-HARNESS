---
memory_id: memory:feedback:pr-423-pass-receipt-consume-required-exact-f829e941--96ad274055e2
kind: feedback
title: "PR #423 PASS receipt consume required exact f829e941"
tags: ["live-consume", "merge-gate", "pr-423", "receipt"]
updated_at: 2026-08-27T02:07:37.669Z
---

Exact-head Opus PASS exists, but canonical receipt is still absent and pr merge denies verdict_missing. In the active Claude VS Code session, consume the existing v3 envelope with: node src/cli.ts review live-consume --envelope 'C:\dev\UT-TDD-agent-harness\.git\ut-tdd-runtime\claude-memory-wake\inbox\memory_project_pr-423-canonical-delta-request-exact-f829e941--61f2bbb92c29_workspace_7afb1c8e925d4c39da2d7420fc8365237d9be85f7fa034870e951cec704367_241955f71d0d.json' --json . Do not create a new request identity and do not handwrite a receipt. After consume, verify pr merge gate and merge only through the wrapper.
