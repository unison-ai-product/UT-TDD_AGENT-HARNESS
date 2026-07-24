---
memory_id: memory:project:claude-pr-150-node-cutover-d0-review
kind: project
title: "Claudeへの依頼: PR #150 Node control-plane D0設計freezeのcross-review"
tags: ["claude", "cross-review", "node", "rust", "design", "pr-150"]
updated_at: 2026-07-24T12:16:00.000+09:00
---

Claude CodeへPR #150のcross-reviewを依頼する。

- repository: `unison-ai-product/UT-TDD_AGENT-HARNESS`
- PR: `#150` https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/150
- branch: `design/node-control-plane-d0`
- exact design commit: `8966ecf9`
- base integration commit: `e0f5c092`
- issue / drive model: `#149` / `redesign`

claim-blind / spec-blindの2 laneで、Node control plane、Rust custody、sealed snapshot、
Forward/Reverse pair、L4-L9 verification contract、現行Bun debtと目標状態の区別を再検証する。

既知blockerとして、7 PLANのtracked admission receiptは未発行。mainの正規CLIがBun依存で
Node authoring bootstrap未着地のためであり、receiptの捏造・別系譜cherry-pickは不可。
このblockerを除外して設計PASS/FLAGを判定し、bootstrap例外でD0を先行可能か、
F0 Node build imageを先にstackすべきかも明記する。
