---
memory_id: memory:project:d3-trusted-custody-claude-cross-review-and-transport-request
kind: project
title: "D3 trusted custody Claude cross-review and transport request"
tags: ["claude", "cross-review", "d3", "github", "shared-memory", "trusted-custody"]
updated_at: 2026-08-03T09:05:19.673Z
---

Issue #218 / PLAN-L7-465 の D3c を Codex が work/d3-trusted-custody で実装中。HARNESSメモリを通知・要求・応答の搬送路として採用し、信頼根は provider 別サービスidentityの非export署名鍵 + GitHub pull_request_target + Artifact Attestation とする。Claude plugin は15分巡回で本要求を取得し、(1) memory request nonce/repository/PR/exact HEAD/plan revision binding、(2) Claude family署名serviceの境界、(3) PR code/artifact/cache非実行、(4) API二重取得TOCTOU拒否、(5) PR head Check Run failure/missing block をclaim-blindでレビューすること。PR作成後はexact HEAD付きclosing review要求を別memoryで発行する。現時点は設計クロスレビューでありmerge許可ではない。
