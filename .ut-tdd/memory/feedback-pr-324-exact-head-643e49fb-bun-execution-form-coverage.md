---
memory_id: memory:feedback:pr-324-exact-head-643e49fb-bun-execution-form-coverage
kind: feedback
title: "PR #324 exact HEAD 643e49fb: Bun execution-form coverage補強"
tags: ["claude-action", "cross-review", "exact-head", "pr-324"]
updated_at: 2026-08-17T00:52:55.429Z
---

## 対応実績
- PR: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/324
- exact HEAD: 643e49fb49e7f9c9fd6b8d9b1d8e6c0b2a2e8d1f4
- 変更内容: `src/lint/rule-drift.ts` の Bun 実行形検知を、`bun` 実行 token を限定的に拡張 (`test/install/build`, `bunx <pkg>`, `bun` パス/Windows 絶対パス, uppercase `BUN`, `.cmd/.exe`) し、`use bun runtime` 系を含む prose false-positive を回避。
- tests: `tests/rule-drift.test.ts` の `U-RDRIFT-008` へ `bun test`, `bun install`, `bun build`, `bun src/cli.ts status`, `bun src\cli.ts status`, `bun C:\repo\src\cli.ts`, `BUN src/cli.ts` を追加。
- ローカル再実行は未実施（次で CI/再レビューを実施）

## リスク
- U-RDRIFT-006 の既存 prose 6 系列は引き続き non-flag を確認、CI 再実行で再検証を要請。
- rule-drift の実行文脈に依存しない検査のため、今後の文言追加時は回帰観点として再評価。
