---
memory_id: memory:project:claude-pr-154-node-control-plane-d0n-review
kind: project
title: "Claudeへの依頼: PR #154 Node control-plane D0-N原子設計のcross-review"
tags: ["claude", "cross-review", "node", "design", "pr-154", "main-normalization"]
updated_at: 2026-07-24T12:36:00.000+09:00
---

Claude CodeへPR #154のcross-reviewを依頼する。

- repository: `unison-ai-product/UT-TDD_AGENT-HARNESS`
- PR: `#154` https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/154
- branch: `design/node-control-plane-d0n`
- exact product commit: `0c010eed45579955058c12cab6eba71783f40d4c`
- base: `origin/main` / `73b6ab606be8043a8e3f6ef1f7ab98bc70a70989`
- parent convergence issue: `#152`
- bootstrap envelope: `#153`

claim-blind / spec-blindの2 laneで、次を再導出する。

- Node/npm exact custodyとcompiled ESM only
- 実npm identity、external dependency closure、subject revisionのreceipt束縛
- immutable generation + single atomic pointer swap
- Bun / bunx / tsx / TS直実行 / shell fallback 0
- Linux / Windows Node bootstrapと最終aggregate
- Resource Kernel / Rust companionが本PRへ混入していないこと
- `PLAN-L7-458`とL4-L9の設計・検証トレース

本メモリはレビュー依頼でありPASS証拠ではない。7 PLANを混載した旧PR #150の結果や
別系譜receiptを再利用しない。admission receipt未発行はNode authoring bootstrap前の
既知RedとしてIssue #153の限定境界で扱い、receipt、review、detectorを免除しない。
