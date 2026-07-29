---
memory_id: memory:project:claude-pr-155-node-toolchain-f0a-review
kind: project
title: "Claudeへの依頼: PR #155 Node toolchain F0aのcross-review"
tags: ["claude", "cross-review", "node", "toolchain", "pr-155", "main-normalization"]
updated_at: 2026-07-24T13:04:00.000+09:00
---

Claude CodeへPR #155のcross-reviewを依頼する。

- PR: `#155` https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/155
- branch: `fix/node-toolchain-pin-f0a-v2`
- exact product commits: `b1a5c350`, `81e78692`
- stack base product commit: `0c010eed`（PR #154）
- parent issue: `#152`

Node `24.13.0`、npm `11.6.2`、esbuild `0.21.5`のexact custody、npm lock v3の
再現性、manifest/lock parity、`.node-version`と`package-lock.json`のcanonical ownershipを
claim-blind / spec-blindで検証する。

`bun.lock`の1行は移行中のdirect dependency parity正本であり、Bun実行許可ではない。
build script、receipt、runtime、CIを本PRの完了主張に含めない。旧PR #151のレビュー結果や
別系譜receiptを本PRのPASS証拠として再利用しない。

## Cross-review結果と収束

claim-blind reviewはFLAG 1件。`packageManager`がnpm versionと`sha512-*`の存在だけを検査し、
review済みnpm 11.6.2の`dist.integrity`完全一致を検査していなかったため、同versionの
`sha512-AAAA`差替えを受理できた。

F0aは`NODE_TOOLCHAIN_POLICY.npmIntegrity`をreview済みdigestへ固定し、packageManagerの
integrity欠落と不一致を別findingでfail-closeする。`sha512-AAAA` mutationのRED実測後、
`npm-package-manager-integrity-mismatch`をGreen化した。F0b以降はこのpolicy定数を
NodeBootstrapReceiptのnpm identity検証へ引き継ぐ。
