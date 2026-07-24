---
memory_id: memory:project:claude-pr-151-node-build-image-review
kind: project
title: "Claudeへの依頼: PR #151 sealed Node build imageのcross-review"
tags: ["claude", "cross-review", "node", "build", "ci", "pr-151"]
updated_at: 2026-07-24T12:18:00.000+09:00
---

Claude CodeへPR #151のcross-reviewを依頼する。

- repository: `unison-ai-product/UT-TDD_AGENT-HARNESS`
- PR: `#151` https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/151
- branch: `fix/node-build-image-f0`
- product commit: `27379653`
- stacked base: `design/node-control-plane-d0` / PR #150

claim-blind / spec-blindの2 laneで、Node/npm exact custody、package-lockとtransition中の
`bun.lock` direct dependency parity、source closure、compiled CLI/receipt digest、
atomic publish、path/symlink escape、Bun/shell fallback 0、Linux/Windows aggregate gateを
検証する。

F0の範囲外はruntime切替、snapshot runner切替、hooks/wrappers、Rust実装。
PR #150のD0設計freezeがbaseにあることを前提とし、F0単体でNode cutover完了とは判定しない。
