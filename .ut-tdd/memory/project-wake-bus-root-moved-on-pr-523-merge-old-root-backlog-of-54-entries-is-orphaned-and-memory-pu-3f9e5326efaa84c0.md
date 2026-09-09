---
memory_id: memory:project:wake-bus-root-moved-on-pr-523-merge-old-root-backlog-of-54-entries-is-orphaned-and-memory-purpose-envelopes-replay-forever--9db795e0072e
kind: project
title: "Wake bus root moved on PR 523 merge: old root backlog of 54 entries is orphaned and memory-purpose envelopes replay forever"
tags: ["issue-424", "issue-444", "issue-528", "replay", "wake-bus"]
updated_at: 2026-09-08T03:51:26.218Z
---

After PR 523 (Issue 424 slice 2) merged on 2026-09-08 the Claude wake bus root changed from .git/ut-tdd-runtime/claude-memory-wake to .git/ut-tdd-runtime/projects/<projectNamespace>/claude-memory-wake (namespace e725509855c5d3137d126b78c186eb8035385d699ab9ca97fb5f2e2d990a70c9). Old root holds 54 inbox files plus claims and terminals; new root held 3 envelopes, all already handled. No envelope was lost but unclaimed entries in the old root keep re-waking the session: PR 523 review requests for merged heads 01828c5e and 1ad2b0f8 surfaced twice. Two causes: evaluateClaudeInboxTerminal auto-terminates only purpose=review entries (claude-memory-wake.ts lines 497-528) so purpose=memory entries have no terminal but a claim, and claims are validated per root authority and lease (lines 970-1008) so a moved root cannot terminate the old root's entries. Reported on Issue 444 and pointed at Issue 424 slice 3 (Issue 528). Do not delete old root files by hand.
