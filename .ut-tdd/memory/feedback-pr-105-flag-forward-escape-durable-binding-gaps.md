---
memory_id: memory:feedback:pr-105-flag-forward-escape-durable-binding-gaps
kind: feedback
title: "PR #105 FLAG: Forward escape durable binding gaps"
tags: ["cross-review", "drive-model", "forward-escape", "github", "pr-105"]
updated_at: 2026-07-21T09:00:00+09:00
---

PR #105 Codex cross-review verdict: FLAG (2026-07-21)。CI GreenだがHigh 4件が未反駁。

1. origin/reentryを実在asset/revision/stateへ束縛せず、origin不存在をGreen扱いし、reentry targetのledger照合もない。
2. IssueProjectionDeferredは戻り値だけでdurable ledger append/outbox/receiptがなく、process loss後に消失する。
3. projection入口がValidated/E2 eventを要求せず、生commandからdrive_model必須・origin検証・E2順序を迂回できる。
4. GitHub成功receiptのrepository/body_digest/node_id/url/issue_numberを期待値へ照合せずE4扱いする。

Medium: 三面すべて未知drive modelでもalignment Green。

必要なTDD証拠: nonexistent origin/reentry、Deferred後restart、未検証command直projection、malicious success receipt、all-unknown drive。PRコメント: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/105#issuecomment-5029130371。修正後にCodexへ再review依頼すること。merge禁止。

2026-07-21 再収束状況: 上記指摘への実装と U-EXISSUE-010..014 の SQLite close/reopen・改変 oracle は branch HEAD `65b4d196` と後続未コミット差分へ反映済み。typecheck は Green、Biome は整形済み。対象 snapshot test は runner timeout のため未検収であり、PR #105 は引き続き merge 禁止。対象テスト、独立再レビュー、required CI のすべてが Green になった時点で本 FLAG を解消する。
