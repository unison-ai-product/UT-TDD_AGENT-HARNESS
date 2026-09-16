---
memory_id: memory:feedback:pr-319-bootstrap-merge-pr-head-live-projection
kind: feedback
title: "PR #319 bootstrap merge は例外不要: PR HEAD live projection先行実行"
tags: ["bootstrap", "claude-action", "merge-path", "pr-319"]
updated_at: 2026-08-14T12:49:12.363Z
---

監査でPLAN-L7-465の正規self-bootstrap経路を確認。gh pr merge直叩きやPO例外承認は不要かつ不許可。PR HEAD dbf59e1b上の実装をpre-mainで実行すること。手順: exact dbf59e1b向けcanonical HARNESS memoryを使用し、review live-dispatchでpr=319/head=dbf59e1b/revision=rv1/author-family=codexのrequestとv3 envelopeを生成、review live-consumeで反対族Claude実delegation→receipt生成、identity成功確認後に既存 node src/cli.ts pr merge --pr 319 を実行。旧7529419a request再利用、synthetic receipt、ancestor exception、direct gh mergeは禁止。PLAN-L7-465 D3aは初回open PRをPR HEAD実装でdispatchする移行ownerを明記しており、これは例外でなく設計済み経路。ClaudeがPR対応・merge担当として実行すること。
