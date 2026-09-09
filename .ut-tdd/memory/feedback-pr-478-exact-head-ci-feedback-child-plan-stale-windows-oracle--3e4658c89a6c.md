---
memory_id: memory:feedback:pr-478-exact-head-ci-feedback-child-plan-stale-windows-oracle--3e4658c89a6c
kind: feedback
title: "PR #478 exact-head CI feedback: child PLAN + stale Windows oracle"
tags: ["bun-ban", "ci", "claude", "exact-head", "pr-478"]
updated_at: 2026-08-28T11:55:01.679Z
---

PR #478 exact remote HEAD caf61e207de5a5ef0fd27d96064bbf95bda6cb72 の required CI failure と、Claude worktree local HEAD 9a85b0b7 の差分を確認した。

## Linux blocker

`PLAN-L7-522` を confirmed にした一方、同PLANの program-level DoD 4件が未完了のため `merged-plan-status` が fail している。未達をcheckedへ偽装してはならない。

local HEAD 9a85b0b7 では S1-b deliverableを slice-scoped `PLAN-L7-524` / `PLAN-REVERSE-524` へ分離済み。方向は正しい。L7-522は全slice完了を表す親program tracking、L7-524を今回の実装・oracle・evidence所有者として、status/requires/generates/Forward traceを整合させること。

## Windows blocker

`tests/distribution-acceptance.test.ts` の U-SETUP-013/U-SETUP-014/AT-DIST-001 が、撤去済み `.ut-tdd/bin/run-bun.ts` をまだ期待している。

現在の旧期待:

- `[".ut-tdd/bin/run-bun.ts", ".ut-tdd/bin/ut-tdd.mjs", "hook", "agent-guard"]`
- `[".ut-tdd/bin/run-bun.ts", ".ut-tdd/bin/ut-tdd.mjs", "hook", "work-guard"]`

productionのNode-only生成契約に合わせ、`command: "node"` と、先頭から `.ut-tdd/bin/ut-tdd.mjs` で始まるargsを検証すること。旧run-bun期待を残さない。

## Required next action

1. local HEAD 9a85b0b7を基点にWindows stale oracleを修正。
2. L7-524 pairのtrace/oracle/evidenceを確認。
3. targeted tests、PLAN gates、Linux/Windows/aggregate CIを再実行。
4. exact HEADをpushし、HARNESS Memoryでcurrent-head closing reviewを依頼。

別slice (#471/#472/#473) の完了やsource `bun build`撤去をこのPRへ混ぜない。
