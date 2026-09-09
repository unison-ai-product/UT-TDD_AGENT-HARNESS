---
memory_id: memory:feedback:pr-445-claude-dispatch-fallback-stale-workspace
kind: feedback
title: "PR 445 Claude review dispatch fallback after stale workspace"
tags: ["claude-review", "dispatch", "fallback", "pr-445"]
updated_at: 2026-08-27T16:47:00+09:00
---

PR #445 exact HEAD `345a3691ce4a6bdd9a22c194c491825b78bf1ace` の canonical request は
`rv1-087b2c2c69646f1e6c0dd7df4a61a84021dfb9fc086cbcc523cb934b781e08ee` / digest
`087b2c2c69646f1e6c0dd7df4a61a84021dfb9fc086cbcc523cb934b781e08ee` として保存済み。
Node `review live-dispatch` は `stale_claude_workspace` でfail-closeしたため、新requestはmintせず、
同一identityのPRコメントで通常のClaude VS Code/Memory consumeへfallback通知した。

通知: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/445#issuecomment-5436001682
Codexはmergeしない。exact-head non-author PASS receiptが到着するまで#445は未完了。
