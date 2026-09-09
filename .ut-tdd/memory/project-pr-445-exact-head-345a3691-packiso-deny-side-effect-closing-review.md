---
memory_id: memory:project:pr-445-exact-head-345a3691-packiso-deny-side-effect-closing-review
kind: project
title: "PR 445 exact-head 345a3691 PackISO deny side-effect closing review"
tags: ["claude-review", "exact-head", "issue-419", "packiso", "pr-445"]
updated_at: 2026-08-27T16:46:00+09:00
---

PR #445 exact HEAD `345a3691ce4a6bdd9a22c194c491825b78bf1ace` の Claude non-author
claim-blind/spec-blind closing review を依頼する。対象は Issue #419 / PLAN-L7-496
（consumer admission deny 時の PF5 side-effect boundary）に限定し、#414 remote
publication、#420 self-contained runtime、#444 inbox GC、Bun retirement の別論点を混ぜない。

対象正本:

- PLAN-L7-496-pack-independent-consumer-runtime.md
- PLAN-REVERSE-496-pack-independent-consumer-runtime-backfill.md
- docs/test-design/harness/L7-unit-test-design.md の U-PACKISO-007 / CANDIDATE-PACKISO-007
- src/setup/consumer-local-runtime-admission.ts
- tests/consumer-local-runtime-admission.test.ts

worker_model: `gpt-5.6-luna`、effort: `high`。現HEADで Node/npm typecheck、Biome、PLAN lint
（L7/Reverse とも Green）、targeted snapshot test 34 tests / 1 file PASS、GitHub required CI
（harness-check / Linux / Windows）3/3 Green を確認済み。

レビューで各8 deny軸（namespace escape、release identity mismatch、artifact identity mismatch、
receipt identity mismatch、independently recomputed digest mismatch、artifact unavailable、unknown
version、invalid input）を個別に検証し、deny 時の PF5 snapshot/staging/apply/discard/restore、
pointer/publish port と consumer bytes/mode/path/version/history の全てが 0 / 不変であること、
valid receipt のみが admitted になることを確認する。旧証跡を現HEADのPASSに流用せず、blocking があれば
exact HEADへ修正要求を返す。Codexはmergeしない。
