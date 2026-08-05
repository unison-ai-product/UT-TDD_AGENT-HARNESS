---
memory_id: memory:project:incident-bun-session-db-refresh-runaway-on-2026-07-27
kind: project
title: "INCIDENT: Bun session db-refresh runaway on 2026-07-27"
tags: ["bun", "db-refresh", "incident", "resource-exhaustion", "windows"]
updated_at: 2026-07-27T04:02:50.268Z
---

2026-07-27 12:47 JST頃、Bunで起動された session db-refresh (PID 12016) が harness.db を排他し続け、約7分で working set 4.55GB、harness.db 4.57GBに増大した。PR #156 rev14台帳発行を阻害し、PC資源枯渇リスクがあったため当該Bun processのみ停止。停止後の SQLite PRAGMA quick_check は ok、80 tablesを確認。再発防止: session db-refreshをNode経路へ固定、single-flight/size+time+memory上限、transaction rollback、Bun起動fail-closeを必須化する。
