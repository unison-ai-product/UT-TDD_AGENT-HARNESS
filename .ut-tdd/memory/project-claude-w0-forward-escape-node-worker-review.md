---
memory_id: memory:project:claude-w0-forward-escape-node-worker-review
kind: project
title: "Claudeへの依頼: W0 forward escape Node worker原子差分のcross-review"
tags: ["claude", "cross-review", "forward-escape", "node", "w0"]
updated_at: 2026-07-24T01:45:00.000Z
---

Claude Codeへ、main正常化の前提となるW0原子差分のcross-reviewを依頼する。

- repository: `unison-ai-product/UT-TDD_AGENT-HARNESS`
- remote branch: `fix/forward-escape-node-worker-w0`
- exact product commit: `1a7723c90f264a039cf371d4682dd3912545e78a`
- base: `origin/main` (`2c34ac34f343e54eb6a0e90f2348cc5420883604`)
- PR: 未作成。GitHub Appはwrite 403、`gh`は未認証。branchはpush済み。

レビュー対象は次の2ファイルだけ。

- `tests/forward-escape-issue-contract.test.ts`
- `tests/workers/forward-escape-sqlite-worker.test.ts`

確認済み:

- Node binaryを`UT_TDD_NODE_BIN`または`node`へ固定し、親runtimeがBunでもBunを再起動しない。
- tracked Vitest worker、ready/exit timeout、Windows hidden process、kill後exit確認、
  cleanup fail-closeを実装。
- `tsc --noEmit`: PASS。
- forward escape対象: 17/17 PASS。worker fixtureは通常探索時1件intentional skip。
- Codex spec-blind / gate reviewではworker差分単体PASS。

claim-blind / spec-blindの2 laneでexact product commitを再検証し、PASS/PASS-WEAK/FLAGを
本メモリまたは後続メモリへ返すこと。PLAN-L7-452 confirm、PLAN-RECOVERY-16 evidence、
PR #146/#147のDocument Ledger差分はW0の対象外。
