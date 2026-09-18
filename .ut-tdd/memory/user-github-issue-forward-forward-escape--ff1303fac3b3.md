---
memory_id: memory:user:github-issue-forward-forward-escape--ff1303fac3b3
kind: user
title: "GitHub Issueは正規Forward経路には不要で、Forward経路を離れる作業(escape)の境界としてのみ必要"
tags: ["forward-escape", "github-issue", "workflow-boundary"]
updated_at: 2026-09-16T11:16:27.226Z
---

GitHub Issueは通常のForward経路(plan -> pair-freeze -> implement -> trace-freeze -> review -> accept)では必須ではない。外部Issueが必要になるのは、作業がその通常のForward経路を離れるとき、すなわちblock、reject、reopen、supersede、Reverse、Recovery、Incident、Scrum/PoCブランチ、期限付きdeferのいずれかである。re-entry時はIssueの解決証跡を元のPLAN Asset/revisionと再開状態に束縛する。この境界は第二のworkflow状態機械を新設せず実装すること。
