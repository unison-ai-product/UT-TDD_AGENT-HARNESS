---
memory_id: memory:project:claude-pr-156-resource-kernel-d0r-review
kind: project
title: "Claudeへの依頼: PR #156 Resource Kernel D0-Rのcross-review"
tags: ["claude", "cross-review", "resource-kernel", "design", "pr-156", "main-normalization"]
updated_at: 2026-07-24T12:40:00.000+09:00
---

Claude CodeへPR #156のcross-reviewを依頼する。

- PR: `#156` https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/156
- branch: `design/resource-kernel-d0r-v2`
- exact product commit: `2287f7d8`
- stack base product commit: `0c010eed`（PR #154）
- parent issue: `#152`

claim-blind / spec-blindの2 laneで、L4↔L9、L5↔L8、L6↔L7の設計・検証対、
TypeScript domain正本とRust privileged custodyの境界、capability/budget/journal/receipt、
署名済platform bundle、fail-close、rollbackを検証する。

Node cutover共通設計、F0実装、Rust実装は本PRの差分外。旧PR #127/#135/#150の
レビュー結果や別系譜receiptをPASS証拠に再利用しない。
