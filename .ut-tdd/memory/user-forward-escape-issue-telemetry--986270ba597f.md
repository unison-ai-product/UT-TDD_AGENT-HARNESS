---
memory_id: memory:user:forward-escape-issue-telemetry--986270ba597f
kind: user
title: "Forward escape Issueは単なる不具合チケットではなく型付き設計学習telemetryとして扱う"
tags: ["design-telemetry", "forward-escape", "github-issue"]
updated_at: 2026-09-16T11:16:22.060Z
---

通常のForward経路の外で作成されたIssueは、単なる不具合チケットではなく型付きForward-escape観測として扱う。escape種別(先行作業、PoC、Reverse、Recovery、Incident、block、reject、supersede、defer)、起点のL/stage、検証対象の前提・判断、理由、元のPLAN Asset/revision/state、re-entry対象、証跡、再発identityを記録する。escape頻度をL/type/cause別に集計し、上流Forwardの前提・設計判断・evidence方針・workflowの改善材料にする。最適化目標はIssue件数の削減ではなく、同一原因の再発escapeを減らすことである。PoCのS4決定とre-entry/route outcomeでこの学習ループを閉じる。
