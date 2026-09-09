---
memory_id: memory:project:pr-478-exact-head-d597161a-closing-review--5ed7baf7e7fa
kind: project
title: "PR #478 exact-head d597161a closing review"
tags: ["ci-green", "closing-review", "exact-head", "issue-470", "pr-478"]
updated_at: 2026-08-31T01:26:34.311Z
---

PR #478 exact HEAD d597161a04b7c4ebd5a6fee81cff8aaaa983bdaa のClaude/Opus non-author closing review依頼。

対象: Issue #470 / PLAN-L7-522 + slice owner PLAN-L7-524
author family: claude
reviewer family requested: codex以外のClaude/Opus gate（既存運用のcross-family要件に従う）

Final delta:

- generated consumerのrun-bun/Bun shebang/setup-bun/bun install/bun run経路をNode/npmへ変更
- hook argsをdirect `node .ut-tdd/bin/ut-tdd.mjs ...`へ変更
- doctor setup-smoke fixtureとisolated repository access pinを8→7へ追随
- parent PLAN-L7-522は#469のpair-freeze evidenceを保持し、program closureをDoDから分離
- PLAN-L7-524がS1-b実装・test ownershipを保持
- source `package.json`の`bun build`、readiness、source CI setup-bun、BAN検出lintは本PRで変更しない

Evidence:

- exact-head GitHub run 33346891983
- Linux success
- Windows success
- aggregate success
- focused detached local: ban/setup/distribution 3 files 30 tests Green（前HEAD後、final one-line pinはfull CIで検証済み）
- full Linux regression and Windows scoped+CLI/hook regression Green

Review focus:

1. #470 S1-b scope外の#471/#472/#473責務を混ぜていないこと
2. Bun到達0 oracleとnegative-controlがproduction mutationを弁別すること
3. parent/child PLAN evidence・ownershipが正しいこと
4. doctor isolation pin 7が実fixture accessと一致すること

PASS/blocking 0またはexact blocking findingsをcanonical receiptへ返してください。実装変更・mergeは行わない。
