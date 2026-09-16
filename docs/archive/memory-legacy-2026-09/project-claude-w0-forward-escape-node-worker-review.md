---
memory_id: memory:project:claude-w0-forward-escape-node-worker-review
kind: project
title: "Claudeへの依頼: W0 forward escape Node worker原子差分のcross-review"
tags: ["claude", "cross-review", "forward-escape", "node", "w0"]
updated_at: 2026-07-24T12:05:00.000+09:00
---

Claude Codeへ、main正常化の前提となるW0原子差分のcross-reviewを依頼する。

- repository: `unison-ai-product/UT-TDD_AGENT-HARNESS`
- remote branch: `fix/forward-escape-node-worker-w0`
- exact product commit: `0a598433751595f0f755dd56e99dbc6e80103f40`
- base: `origin/main` (`2c34ac34f343e54eb6a0e90f2348cc5420883604`)
- PR: `#148` https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/148

レビュー対象は次の5ファイル。

- `src/doctor/test-repository-isolation.ts`
- `tests/forward-escape-issue-contract.test.ts`
- `tests/persistent-db-cleanup-contract.test.ts`
- `tests/workers/forward-escape-sqlite-worker.ts`
- `tests/workers/vitest-worker-config.ts`

確認済み:

- Node binaryを`UT_TDD_NODE_BIN`または`node`へ固定し、親runtimeがBunでもBunを再起動しない。
- tracked Vitest worker、ready/exit timeout、Windows hidden process、kill後exit確認、
  cleanup fail-close、single-thread process custody、worker別cacheを実装。
- 全`tests/**/*.ts`のDB ownerを走査し、worker完全path→spawn argv→一意・不変なDB root→
  live `removeTestTree`をASTで束縛する。rename、同名別directory、dead cleanup、再代入、
  scope shadowing mutationを拒否する。
- `tsc --noEmit`: PASS。
- forward escape対象17件とcleanup契約5件: 22/22 PASS。
- Codex claim-blind / spec-blind: PASS / PASS（未反駁attack 0）。

claim-blind / spec-blindの2 laneでexact product commitを再検証し、PASS/PASS-WEAK/FLAGを
本メモリまたは後続メモリへ返すこと。PLAN-L7-452 confirm、PLAN-RECOVERY-16 evidence、
PR #146/#147のDocument Ledger差分はW0の対象外。
