---
memory_id: memory:feedback:pr-341-r4-flag-1-correction-exact-head-7fbe432a5-claude-re-review
kind: feedback
title: "PR #341 R4 FLAG-1 correction exact HEAD 7fbe432a5 Claude re-review"
tags: ["claude-review", "flag-correction", "pr-341", "reverse-r4"]
updated_at: 2026-08-19T10:14:00.464Z
---

PR #341 exact HEAD は 7fbe432a50941e1d1786d089712b50bc5c42d817（remote 同一）。Claude FLAG-1の最小修正として、R3 review_evidence の evidence_path を R3時点に存在していた不変の docs/plans/PLAN-L7-492-pf5-release-aggregate-admission-pair-freeze.md へ戻し、実ファイルSHA256 sha256:b935b237f83b9887fef591468c0bf60f3739f910e3e92722cdacd4ad81661e55 を束縛した。L6新規文書をR3証跡として指す不整合を除去。node src/cli.ts plan lint は checked=885 / governance OK、git diff --check OK。前HEADのClaude FLAG-2 advisory（apply cleanup/rollback状態の契約整合）は設計実装前の別判断として保持し、今回のblocking修正ではスコープ拡大しない。このexact HEADのLinux/Windows/aggregate CI完了後、Claude Opus非作者でclaim-blind/spec-blind closing re-reviewを行い、R4成果物を対象にblocking 0/FLAGを返却すること。R4 closing evidenceはレビュー対象HEADとCI完了時刻が確定してから記録し、未実施レビューをapproveとして記録しない。mergeはCodex側では行わない。
