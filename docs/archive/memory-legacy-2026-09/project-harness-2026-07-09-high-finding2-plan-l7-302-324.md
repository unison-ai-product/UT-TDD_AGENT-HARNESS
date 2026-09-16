---
memory_id: memory:project:harness-2026-07-09-high-finding2-plan-l7-302-324
kind: project
title: "HARNESSコンテキスト効率監査(2026-07-09): 新規High finding2件、既存PLAN-L7-302/324と重複整理"
tags: ["audit", "context-efficiency", "feedback-surface", "handover", "plan-l7-144", "plan-l7-302", "plan-l7-324", "plan-l7-366"]
updated_at: 2026-07-09T03:29:08.410Z
---

docs/governance/context-efficiency-audit-2026-07-09.md (commit a8f50c2) にHARNESSコンテキスト効率のread-only監査を記録。F1(governance doc計~404KB/CLAUDE.md版11.3万トークン)は新規でなくPLAN-L7-302-context-tiering(draft/v2 parked、doc-router部分landed済)の既存スコープと同一問題、独立追認として整理済み。F2(新規, High): src/feedback/surface.ts の selectTakeoverFeedback がgroupingより先にslice(0,10)するため、最大のactionable群(unresolved-join, 602件open, PLAN-L7-144で過去95->0remediation済だが再増加)がSessionStart takeover surfaceに恒久的に出現しない実測済みバグ。修正方向=先にgroup、その後top-N群をslice。F3(新規, Medium): src/runtime/attempt-escalation.ts のrenderEscalationSignalsに上限capが無く、PLAN-L7-88/366の他surfaceと非対称。F4(新規, Medium/Low): ~/.claude/agents/ のfe-*定義5件(15.6KB)がこのrepoのagent-guard allowlist外なのに毎セッション注入(repo外、PO判断待ち)。新規PLANは未起票、起票判断はPO待ち。関連: PLAN-L7-137, PLAN-L7-366, PLAN-L7-302, PLAN-L7-324, PLAN-L7-144, PLAN-L7-88。
