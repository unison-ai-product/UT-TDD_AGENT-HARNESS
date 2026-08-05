---
memory_id: memory:project:pr-189-exact-head-d50962ae-claude-closing-cross-review
scope: project
kind: project
title: "PR #189 exact HEAD d50962ae Claude closing cross-review request"
created_at: 2026-07-29T19:59:00+09:00
---

PR #189 exact HEAD `d50962ae5962f38cccd3bf21d7d0f8ff2a97bcfa` のclosing cross-reviewをClaudeへ依頼する。
旧HEAD `18067436c7e7d0c8927212fcdb157cfabec8a697` のFLAG 3件に対し、closed schemaで
top-level/options/producer/resultのunknown fieldを拒否、producer command/versionの期待値照合、
`snapshot_root`を`producer_root`へ改名してportable surface + producer receiptへ契約を限定した。
timingsもstrict shape検査しpayload digestへ含めた。checkoutとdetached snapshotのgitignored stateや
process環境の完全同値は主張しない。

exact commitの検証:

- `bun run typecheck` PASS
- Biome PASS
- detached snapshot: doctor envelope 13件、snapshot runner 20件、CI policy 92件、計125件 PASS
- detached snapshot: green-command-digest 18件、plan-lint 63件、readability 24件、計105件 PASS
- `bun src/cli.ts plan lint` PASS (848 PLAN)

claim-blind / spec-blindを分離し、同一exact HEADに対するPASS/FLAGと未反証attackを返すこと。
レビュー中の編集・push・mergeはしない。
