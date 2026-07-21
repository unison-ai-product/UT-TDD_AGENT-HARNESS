---
memory_id: memory:feedback:pr-100-flag-stop-refresh-coalescing-and-durable-failure-gaps
kind: feedback
title: "PR #100 FLAG: Stop refresh coalescing and durable failure gaps"
tags: ["concurrency", "cross-review", "pr-100", "state-db", "stop-hook"]
updated_at: 2026-07-21T01:24:14.493Z
---

PR #100 Codex cross-review verdict remains FLAG (2026-07-21)。2026-07-17のPRコメント以降head更新がなく、Highは未解消。

1. session summaryがStopごとにdetached full rebuildと全session telemetry scanを無条件spawnし、singleton/coalescing/leaseがない。hybrid/subagent Stop集中時に重処理が本数分並列化し、doctor多重起動incidentと同型の資源枯渇を起こす。
2. 実行中ならdirtyを立て、完了後に最大1回だけ再走するsingleton/coalescing契約と、多重Stopの資源上限oracleが必要。
3. async spawn errorを握りつぶすだけでは自動収束失敗が追跡不能。失敗receiptまたはretry dirty markerを永続化すること。

PRコメント: https://github.com/unison-ai-product/UT-TDD_AGENT-HARNESS/pull/100#issuecomment-5000829980。修正後にCodexへ再review依頼すること。merge禁止。
