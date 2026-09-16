---
memory_id: memory:project:incident-detached-stop-db-refresh-bun-runaway-locked-harness-db
kind: project
title: "Incident: detached Stop db-refresh Bun runaway locked HARNESS DB"
tags: ["bun", "incident", "issue-124", "issue-129", "performance", "stop-refresh"]
updated_at: 2026-07-23T19:20:00+09:00
---

2026-07-22、Stop hookがdetached起動した native bun.exe PID 16968 (session db-refresh) が20分超、CPU 859秒、Working Set約1.69GBで生存し、HARNESS DBをSQLITE_BUSYで排他保持した。snapshot runner 2本が各190秒timeoutし、Get-Process/CIM/typecheckまで遅延した。特定PIDのみ停止して回復。再試行嵐は禁止。windowsHideは画面表示を抑えるだけで、この収束/資源問題は解消しない。Issue #124/#98のresource bound・phase receipt・schedulerと、Stop refreshのdeadline/kill/recovery oracleで閉じること。

同日、正規cross-review経路 `ut-tdd claude --role blind-reviewer --execute`（session `claude-1784715268561`、orchestrator `3f188ee8-453e-4925-a941-eb18e0e4620e`）が600秒で外側timeoutした。`src/cli/delegation.ts` の同期provider起動に内部deadline・owner token・process-tree回収・`finally` terminal receiptがなく、Bunを含む子孫6 processが残留した。開始logだけでStop/終了receiptは欠落し、特定tree回収後の残留PIDは0。Stop refreshとは別の発火経路だが同じ子process所有権契約の欠落である。Windows Job Object / POSIX process group、外側より短い内部deadline、timeout/parent-loss時の子孫0・lock解放・terminal receiptをIssue #124の必須oracleへ含める。

2026-07-23再発。generation `c724...`のStop refresh child PID 6252はowner PID 2988消滅後も約27分生存し、CPU約792秒、Working Set約2.34GiB、private memory約4.17GiBを保持した。`.ut-tdd/harness.db`は3,971,608,576 bytes、rollback journalは1,938,552 bytesまで増加し、PowerShell/CIM/停止コマンドも一時timeoutした。PID 6252だけを停止後、Bun process 0・3秒後再spawn 0を確認したが、journal先頭はSQLite rollback-journal magic `D9 D5 05 F9 20 A1 63 D7`で、active/claimed/dirty/generation/ack leaseも死亡ownerを指したまま残った。journalは手削除せず、doctor/rebuild/VACUUMも再起動していない。Issue #124にはparent-loss kill、terminal receipt、stale lease cleanup、rollback recoveryを、Issue #118には3.699GiB DB/hot journalとlifecycle retentionを必須oracleとして残す。
