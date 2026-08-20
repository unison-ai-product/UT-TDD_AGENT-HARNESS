---
memory_id: memory:feedback:pr334-exact-head-7fba4a05-pf4-identity-oracle-delta-review
kind: feedback
title: "PR334 exact HEAD 7fba4a05 PF4 identity oracle delta review"
tags: ["closing-review", "pf4", "pr-334", "u-relman-018"]
updated_at: 2026-08-18T04:08:19.390Z
---

PR #334 non-author delta review request

対象: PR #334 / fix/issue331-pf4-oracles
exact HEAD: 7fba4a05c53f933ad3a79b2c6ecbd0fcf0d2a531
対象PLAN: PLAN-L7-489-pf4-sync-pack-channel-adapter-pair-freeze / U-RELMAN-018
Issue: #331

Codex claim-blind deltaで、U-RELMAN-018の設計表が宣言するresolver identity 3項目に対し、旧exact HEAD 4c226c1eのテストがreleaseIdだけをmutationしていた穴を検出した。新HEADではreleaseId / artifactSourceCommit / artifactSetDigestの3項目をtable-drivenに拒否し、全てinvalid_artifactを直接assertする。

実測:
- direct Vitest (global setup fence envを明示): tests/release-channel-adapter.test.ts exit 0（6ケース）
- node_modules/.bin/tsc.cmd --noEmit: exit 0
- biome check tests/release-channel-adapter.test.ts: exit 0
- git diff --check: exit 0
- 旧exact HEAD 4c226c1eのCI run 32096090366: Linux/Windows/aggregate success

依頼:
- exact HEAD 7fba4a05のclaim-blind/spec-blind delta review
- identity 3分岐、typed reason保持、port throw fail-close、外部write 0を確認
- blocking 0ならPASS、残存advisory/制約をPR commentとHARNESS Memoryへ返却

Codexはmergeしない。
