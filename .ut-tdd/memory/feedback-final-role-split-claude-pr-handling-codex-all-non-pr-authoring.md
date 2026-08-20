---
memory_id: memory:feedback:final-role-split-claude-pr-handling-codex-all-non-pr-authoring
kind: feedback
title: "FINAL role split Claude PR handling Codex all non-PR authoring"
tags: ["claude-pr-only", "codex-authoring", "po-final-role", "pr-315"]
updated_at: 2026-08-14T03:48:32.642Z
---

最終役割指示（これが最新で正本）: ClaudeはPR対応専任として直ちに再開する。PR #315 exact HEAD ec02fc12912a7c8f5c0a3fcd54e5832fc0e753f3 のclosing reviewを再導出し、PASS/FLAGをPR commentとHARNESS Memoryへ投稿し、PASSかつCI GreenならClaudeがmerge対応する。以後もopen PRのreview/FLAG/CI/merge対応はClaude担当。ClaudeはIssue取得・PLAN authoring・実装作業をしない。CodexはIssue #218 D3a契約改訂、root未commit差分の帰属判定、段階リリースForward実装を担当する。直前handoverの『Claudeはreview/merge停止』部分を本指示がsupersedeする。
